// services/paymentMethodsDataService.js
//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
import { API_BASE_URL } from '../../../config/api';
const API_URL = `${API_BASE_URL}/api`;

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY: 2000, // 2 seconds
  MAX_DELAY: 60000, // 60 seconds
  JITTER_FACTOR: 0.3, // 30% jitter
  RETRY_ON_STATUSES: [429, 500, 502, 503, 504], // Status codes to retry
  NETWORK_ERROR_RETRY_DELAY: 1000 // 1 second for network errors
};

class PaymentMethodsDataService {
  constructor() {
    // Track retry statistics
    this.retryStats = {
      totalRequests: 0,
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      networkErrors: 0,
      rateLimitErrors: 0,
      serverErrors: 0
    };
  }

  /**
   * Calculate exponential backoff with jitter
   * @private
   */
  calculateBackoff(attemptNumber, baseDelay = RETRY_CONFIG.BASE_DELAY) {
    // Exponential backoff: delay = base * 2^attempt
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, attemptNumber),
      RETRY_CONFIG.MAX_DELAY
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * RETRY_CONFIG.JITTER_FACTOR * exponentialDelay;
    
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Determine if we should retry based on error type
   * @private
   */
  shouldRetry(response, error, attemptNumber) {
    // Don't retry if we've exceeded max attempts
    if (attemptNumber >= RETRY_CONFIG.MAX_RETRIES) {
      return false;
    }

    // Network errors - always retry
    if (error && !response) {
      console.log('Network error detected - will retry');
      this.retryStats.networkErrors++;
      return true;
    }

    // Check response status
    if (response) {
      // Always retry 429 (rate limit)
      if (response.status === 429) {
        console.log('Rate limit (429) detected - will retry');
        this.retryStats.rateLimitErrors++;
        return true;
      }

      // Retry configured status codes
      if (RETRY_CONFIG.RETRY_ON_STATUSES.includes(response.status)) {
        console.log(`Server error (${response.status}) detected - will retry`);
        this.retryStats.serverErrors++;
        return true;
      }

      // Don't retry client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500) {
        console.log(`Client error (${response.status}) - not retrying`);
        return false;
      }
    }

    return false;
  }

  /**
   * Parse error response safely
   * @private
   */
  async parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return errorData.error || errorData.message || JSON.stringify(errorData);
      } else {
        return await response.text();
      }
    } catch (e) {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  /**
   * Enhanced retry wrapper for fetch requests
   * @private
   */
  async fetchWithRetry(url, options, config = {}) {
    const {
      maxRetries = RETRY_CONFIG.MAX_RETRIES,
      baseDelay = RETRY_CONFIG.BASE_DELAY,
      onRetry = null
    } = config;

    let lastError = null;
    let lastResponse = null;
    
    this.retryStats.totalRequests++;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        console.log(`🔄 Attempt ${attempt + 1} of ${maxRetries} for ${url.split('/api/')[1]}`);
        
        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;
          
          // If successful, return
          if (response.ok) {
            console.log(`✅ Success on attempt ${attempt + 1} (${duration}ms)`);
            if (attempt > 0) {
              this.retryStats.successfulRetries++;
            }
            return response;
          }
          
          // Parse error for logging
          const errorDetails = await this.parseErrorResponse(response.clone());
          console.error(`❌ Request failed with status ${response.status}: ${errorDetails}`);
          
          lastResponse = response;
          lastError = new Error(`HTTP ${response.status}: ${errorDetails}`);
          
          // Check if we should retry
          if (!this.shouldRetry(response, null, attempt)) {
            console.log('Not retrying based on response status');
            return response;
          }
          
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Handle timeout specifically
          if (fetchError.name === 'AbortError') {
            console.error('⏱️ Request timeout after 30 seconds');
            lastError = new Error('Request timeout');
            lastError.code = 'TIMEOUT';
          } else {
            console.error(`🌐 Network error:`, fetchError.message);
            lastError = fetchError;
          }
          
          // Check if we should retry network errors
          if (!this.shouldRetry(null, fetchError, attempt)) {
            throw fetchError;
          }
        }
        
        // If we're retrying, calculate backoff
        if (attempt < maxRetries - 1) {
          this.retryStats.totalRetries++;
          
          const waitTime = lastError?.code === 'TIMEOUT' 
            ? this.calculateBackoff(attempt, 5000) // Longer backoff for timeouts
            : this.calculateBackoff(attempt, baseDelay);
            
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          
          // Call onRetry callback if provided
          if (onRetry) {
            onRetry(attempt + 1, waitTime, lastError);
          }
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Last attempt failed
          this.retryStats.failedRetries++;
          console.error('❌ All retry attempts exhausted');
        }
        
      } catch (error) {
        console.error(`🚨 Unexpected error on attempt ${attempt + 1}:`, error);
        lastError = error;
        
        // For unexpected errors, still apply backoff if retrying
        if (attempt < maxRetries - 1) {
          const waitTime = RETRY_CONFIG.NETWORK_ERROR_RETRY_DELAY;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // All retries failed
    console.error('💥 All retry attempts failed. Stats:', this.getRetryStats());
    
    // Return the last response if we have one, otherwise throw the error
    if (lastResponse) {
      return lastResponse;
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    const stats = {
      ...this.retryStats,
      retryRate: this.retryStats.totalRequests > 0 
        ? (this.retryStats.totalRetries / this.retryStats.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      retrySuccessRate: this.retryStats.totalRetries > 0
        ? (this.retryStats.successfulRetries / this.retryStats.totalRetries * 100).toFixed(2) + '%'
        : '0%'
    };
    
    return stats;
  }

  /**
   * Get all payment method data using the consolidated endpoint
   * @param {string} customerId - NetSuite customer ID
   * @returns {Promise<object>} Payment method data from consolidated endpoint
   */
  async getPaymentMethodData(customerId) {
    // Validate customer ID
    if (!customerId || customerId === 'pending' || customerId === 'undefined') {
      console.warn('Invalid customer ID for payment method data:', customerId);
      return {
        paymentMethods: [],
        autopayStatus: null,
        stripeIntegration: null,
        salesOrderAnalysis: null,
        legacyAutopay: false,
        stripeAutopay: false
      };
    }

    try {
      console.log(`💳 Fetching payment method data for customer ${customerId}`);
      const startTime = Date.now();
      
      // Use the consolidated endpoint
      const response = await this.fetchWithRetry(
        `${API_URL}/netsuite/customers/${customerId}/invoice-data`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        },
        {
          maxRetries: RETRY_CONFIG.MAX_RETRIES,
          baseDelay: RETRY_CONFIG.BASE_DELAY,
          onRetry: (attempt, delay, error) => {
            console.log(`🔔 Retry notification: Attempt ${attempt}, waiting ${delay}ms. Error: ${error?.message || 'Unknown'}`);
          }
        }
      );

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await this.parseErrorResponse(response);
        throw new Error(`Failed to load payment method data: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load payment method data');
      }

      console.log(`✨ Got consolidated data in ${duration}ms`);
      console.log('💳 Payment method data:', {
        hasAutopayStatus: !!result.autopayStatus,
        hasStripeIntegration: !!result.stripeIntegration,
        hasSalesOrderAnalysis: !!result.salesOrderAnalysis,
        retryStats: this.getRetryStats()
      });

      // Determine autopay flags based on the data
      const legacyAutopay = result.salesOrderAnalysis?.analysis?.autopayStatus === 'ON_AUTOPAY' || false;
      const stripeAutopay = result.autopayStatus?.stripe?.autopayEnabled || 
                           result.stripeIntegration?.stripe?.autopayEnabled || false;

      return {
        // Empty array for payment methods - we'll need to call Stripe API separately for actual card management
        paymentMethods: [],
        
        // Autopay status from consolidated data
        autopayStatus: result.autopayStatus || null,
        stripeIntegration: result.stripeIntegration || result.autopayStatus || null,
        salesOrderAnalysis: result.salesOrderAnalysis || null,
        
        // Simplified flags
        legacyAutopay: legacyAutopay,
        stripeAutopay: stripeAutopay,
        
        // Additional data that might be useful
        customerInfo: result.customerInfo || null,
        metadata: {
          customerId: customerId,
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          source: 'consolidated_endpoint'
        }
      };
      
    } catch (error) {
      console.error('Error fetching payment method data:', error);
      console.error('Final retry statistics:', this.getRetryStats());
      throw error;
    }
  }

  /**
   * Get Stripe payment methods (separate call to payment method endpoint)
   * This is for actual card management functionality
   */
  async getStripePaymentMethods() {
    try {
      console.log('💳 Fetching Stripe payment methods');
      
      const response = await this.fetchWithRetry(
        `${API_URL}/payment-methods`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        },
        {
          maxRetries: 3, // Fewer retries for this endpoint
          baseDelay: 1000
        }
      );

      if (!response.ok) {
        const errorText = await this.parseErrorResponse(response);
        throw new Error(`Failed to load Stripe payment methods: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      console.log(`✅ Got ${result.paymentMethods?.length || 0} Stripe payment methods`);
      
      return {
        paymentMethods: result.paymentMethods || [],
        success: true
      };
      
    } catch (error) {
      console.error('Error fetching Stripe payment methods:', error);
      // Return empty array on error so UI can still function
      return {
        paymentMethods: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache (for consistency with other services)
   */
  clearCache() {
    console.log('🧹 Clearing payment method data cache (no-op)');
    // No cache implemented yet
  }

  /**
   * Reset retry statistics
   */
  resetStats() {
    this.retryStats = {
      totalRequests: 0,
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      networkErrors: 0,
      rateLimitErrors: 0,
      serverErrors: 0
    };
    console.log('Retry statistics reset');
  }
}

// Export singleton instance
export const paymentMethodsDataService = new PaymentMethodsDataService();

// Also export the class for testing
export { PaymentMethodsDataService };