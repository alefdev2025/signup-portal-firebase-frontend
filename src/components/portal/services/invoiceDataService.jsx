// services/invoiceDataService.js
// Enhanced version with robust retry logic and detailed monitoring

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY: 2000, // 2 seconds
  MAX_DELAY: 60000, // 60 seconds
  JITTER_FACTOR: 0.3, // 30% jitter
  RETRY_ON_STATUSES: [429, 500, 502, 503, 504], // Status codes to retry
  NETWORK_ERROR_RETRY_DELAY: 1000 // 1 second for network errors
};

class InvoiceDataService {
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
   * Clear cache - kept for compatibility but does nothing
   */
  clearCache() {
    // No cache to clear in this implementation
    console.log('Cache clear requested (no-op in this implementation)');
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
   * Get all invoice data - ALWAYS FRESH with enhanced retry logic
   * @param {string} customerId - NetSuite customer ID
   * @returns {Promise<object>} Fresh invoice data
   */
  async getInvoiceData(customerId) {
    // Validate customer ID
    if (!customerId || customerId === 'pending' || customerId === 'undefined') {
      console.warn('Invalid customer ID for invoice data:', customerId);
      return {
        invoices: [],
        payments: [],
        invoiceSummary: null,
        autopayStatus: null,
        customerInfo: null,
        emailNotificationSettings: null
      };
    }

    try {
      console.log(`🚀 Fetching fresh invoice data for customer ${customerId}`);
      const startTime = Date.now();
      
      // Try the consolidated endpoint first WITH ENHANCED RETRY
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/netsuite/customers/${customerId}/invoice-data`,
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
            // You could dispatch a Redux action or update UI here
          }
        }
      );

      const duration = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log(`✨ Got fresh data from consolidated endpoint in ${duration}ms:`, {
            invoiceCount: result.invoices?.length || 0,
            paymentCount: result.payments?.length || 0,
            hasAutopayStatus: !!result.autopayStatus,
            retryStats: this.getRetryStats()
          });
          
          return {
            invoices: result.invoices || [],
            payments: result.payments || [],
            invoiceSummary: result.invoiceSummary || null,
            autopayStatus: result.autopayStatus || null,
            customerInfo: result.customerInfo || null,
            emailNotificationSettings: result.emailNotificationSettings || null
          };
        }
      }

      // If consolidated endpoint fails completely, log why
      const errorDetails = await this.parseErrorResponse(response.clone());
      console.error('Consolidated endpoint failed after all retries:', errorDetails);
      console.error('Retry statistics:', this.getRetryStats());

      // Fallback to individual endpoints WITH ENHANCED RETRY
      console.warn('Falling back to individual endpoints...');
      
      const [invoicesRes, paymentsRes, stripeRes] = await Promise.allSettled([
        this.fetchWithRetry(
          `${API_BASE_URL}/netsuite/customers/${customerId}/invoices?limit=100&offset=0`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          },
          { maxRetries: 3 } // Fewer retries for fallback
        ),
        
        this.fetchWithRetry(
          `${API_BASE_URL}/netsuite/customers/${customerId}/payments?limit=100&offset=0`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          },
          { maxRetries: 3 }
        ),
        
        this.fetchWithRetry(
          `${API_BASE_URL}/netsuite/customers/${customerId}/stripe`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          },
          { maxRetries: 3 }
        )
      ]);

      // Log which endpoints failed
      if (invoicesRes.status === 'rejected') {
        console.error('Invoices endpoint failed:', invoicesRes.reason);
      }
      if (paymentsRes.status === 'rejected') {
        console.error('Payments endpoint failed:', paymentsRes.reason);
      }
      if (stripeRes.status === 'rejected') {
        console.error('Stripe/autopay endpoint failed:', stripeRes.reason);
      }

      // Check if critical endpoints failed
      const invoicesFailed = invoicesRes.status === 'rejected' || 
                            (invoicesRes.status === 'fulfilled' && !invoicesRes.value.ok);
      const paymentsFailed = paymentsRes.status === 'rejected' || 
                            (paymentsRes.status === 'fulfilled' && !paymentsRes.value.ok);

      // If both critical endpoints failed, throw error
      if (invoicesFailed && paymentsFailed) {
        console.error('Both invoices and payments endpoints failed');
        console.error('Final retry statistics:', this.getRetryStats());
        throw new Error('Unable to load billing data. Please try again later.');
      }

      const data = {
        invoices: [],
        payments: [],
        invoiceSummary: null,
        autopayStatus: null,
        customerInfo: null,
        emailNotificationSettings: null
      };

      // Process successful responses
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.ok) {
        try {
          const invoiceData = await invoicesRes.value.json();
          if (invoiceData.success) {
            data.invoices = invoiceData.data || invoiceData.invoices || [];
            console.log(`Got ${data.invoices.length} invoices from fallback`);
          }
        } catch (e) {
          console.error('Failed to parse invoice response:', e);
        }
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        try {
          const paymentData = await paymentsRes.value.json();
          if (paymentData.success) {
            data.payments = paymentData.data || paymentData.payments || [];
            console.log(`Got ${data.payments.length} payments from fallback`);
          }
        } catch (e) {
          console.error('Failed to parse payment response:', e);
        }
      }

      if (stripeRes.status === 'fulfilled' && stripeRes.value.ok) {
        try {
          const stripeData = await stripeRes.value.json();
          if (stripeData.success) {
            data.autopayStatus = stripeData;
            console.log('Got autopay status from fallback');
          }
        } catch (e) {
          console.warn('Failed to parse autopay status:', e);
        }
      } else {
        console.warn('Autopay status not available (non-critical)');
      }

      console.log('Fallback data retrieval completed. Retry stats:', this.getRetryStats());
      return data;
      
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      console.error('Final retry statistics:', this.getRetryStats());
      
      // Log to monitoring service if available
      if (window.Datadog?.logger) {
        window.Datadog.logger.error('Invoice data fetch failed', {
          error: error.message,
          customerId,
          retryStats: this.getRetryStats()
        });
      }
      
      throw error;
    }
  }

  /**
   * Get invoice details with retry logic
   * @param {string} invoiceId - NetSuite invoice ID
   * @returns {Promise<object>} Invoice details
   */
  async getInvoiceDetails(invoiceId) {
    try {
      console.log(`📄 Fetching invoice details for ${invoiceId}`);
      
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/netsuite/invoices/${invoiceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        },
        {
          maxRetries: 3, // Fewer retries for single invoice
          baseDelay: 1000
        }
      );

      if (!response.ok) {
        const errorText = await this.parseErrorResponse(response);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invoice details');
      }

      console.log(`✅ Invoice details retrieved. Retry stats:`, this.getRetryStats());
      return result;
      
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      console.error('Retry statistics:', this.getRetryStats());
      throw error;
    }
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
export const invoiceDataService = new InvoiceDataService();

// Also export the class for testing
export { InvoiceDataService };