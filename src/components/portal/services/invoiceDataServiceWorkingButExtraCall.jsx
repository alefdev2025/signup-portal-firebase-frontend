// services/invoiceDataService.js
// Enhanced version with Alcor ID fetching

import { getMemberProfile } from './salesforce/memberInfo';

//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
import { API_BASE_URL } from '../../../config/api';

// Retry configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY: 2000, // 2 seconds
  MAX_DELAY: 60000, // 60 seconds
  JITTER_FACTOR: 0.3, // 30% jitter
  RETRY_ON_STATUSES: [429, 500, 502, 503, 504], // Status codes to retry
  NETWORK_ERROR_RETRY_DELAY: 1000 // 1 second for network errors
};

class InvoiceDataServiceWorkingButExtraCall {
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
   * Fetch Alcor ID from Salesforce using the same method as MembershipStatusTab
   * @private
   */
  async fetchAlcorId(salesforceContactId) {
    if (!salesforceContactId) {
      console.warn('No Salesforce contact ID provided for Alcor ID fetch');
      return null;
    }

    try {
      console.log('🔍 Fetching Alcor ID using getMemberProfile for contact:', salesforceContactId);
      
      // Use the EXACT same function as MembershipStatusTab
      const result = await getMemberProfile(salesforceContactId);
      
      console.log('📊 getMemberProfile result:', result);
      
      if (result.success && result.data) {
        const profileData = result.data.data || result.data;
        const alcorId = profileData?.personalInfo?.alcorId;
        
        console.log('✅ Extracted Alcor ID:', alcorId || 'Not found');
        console.log('📋 Full personalInfo:', profileData?.personalInfo);
        
        return alcorId || null;
      } else {
        console.error('getMemberProfile failed:', result.error);
        return null;
      }
      
    } catch (error) {
      console.error('Error fetching Alcor ID:', error);
      return null;
    }
  }

  /**
   * Get all invoice data - ALWAYS FRESH with enhanced retry logic
   * @param {string} customerId - NetSuite customer ID
   * @param {object} options - Additional options including salesforceContactId
   * @returns {Promise<object>} Fresh invoice data
   */
  async getInvoiceData(customerId, options = {}) {
    const { salesforceContactId } = options;
    
    // Validate customer ID
    if (!customerId || customerId === 'pending' || customerId === 'undefined') {
      console.warn('Invalid customer ID for invoice data:', customerId);
      return {
        invoices: [],
        payments: [],
        invoiceSummary: null,
        autopayStatus: null,
        customerInfo: null,
        emailNotificationSettings: null,
        salesOrderAnalysis: null,
        alcorId: null
      };
    }

    try {
      console.log(`🚀 Fetching fresh invoice data for customer ${customerId}`);
      const startTime = Date.now();
      
      // Fetch Alcor ID in parallel with invoice data
      const [invoiceDataPromise, alcorIdPromise] = await Promise.allSettled([
        // Invoice data fetch
        this.fetchWithRetry(
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
            }
          }
        ),
        // Alcor ID fetch
        salesforceContactId ? this.fetchAlcorId(salesforceContactId) : Promise.resolve(null)
      ]);

      const duration = Date.now() - startTime;
      
      // Extract Alcor ID result
      let alcorId = null;
      if (alcorIdPromise.status === 'fulfilled') {
        alcorId = alcorIdPromise.value;
      }

      // Process invoice data response
      if (invoiceDataPromise.status === 'fulfilled' && invoiceDataPromise.value.ok) {
        const result = await invoiceDataPromise.value.json();
        
        if (result.success) {
          console.log(`✨ Got fresh data from consolidated endpoint in ${duration}ms:`, {
            invoiceCount: result.invoices?.length || 0,
            paymentCount: result.payments?.length || 0,
            hasAutopayStatus: !!result.autopayStatus,
            hasSalesOrderAnalysis: !!result.salesOrderAnalysis,
            alcorId: alcorId,
            retryStats: this.getRetryStats()
          });
          
          // Log sales order analysis details if present
          if (result.salesOrderAnalysis) {
            console.log('📊 Sales Order Analysis:', {
              hasOrders: result.salesOrderAnalysis.hasOrders,
              autopayStatus: result.salesOrderAnalysis.analysis?.autopayStatus,
              canEnableAutopay: result.salesOrderAnalysis.canEnableAutopay,
              billingPattern: result.salesOrderAnalysis.billingPattern?.type
            });
          }
          
          // Fetch the ACCURATE legacy autopay status from the correct endpoint
          let legacyAutopayData = null;
          try {
            console.log('📊 Fetching accurate legacy autopay status...');
            const autopayResponse = await this.fetchWithRetry(
              `${API_BASE_URL}/netsuite/customers/${customerId}/autopay`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              },
              { maxRetries: 3, baseDelay: 1000 }
            );

            if (autopayResponse.ok) {
              const autopayResult = await autopayResponse.json();
              if (autopayResult.success !== false) {
                legacyAutopayData = {
                  autopayEnabled: autopayResult.automaticPayment || false,
                  customerName: autopayResult.companyName || autopayResult.entityId,
                  autopayField: autopayResult.autopayField || 'custentity_ale_autopayment',
                  lastChecked: autopayResult.lastChecked || new Date().toISOString()
                };
                console.log('✅ Got accurate legacy autopay status:', legacyAutopayData.autopayEnabled);
              }
            }
          } catch (autopayError) {
            console.warn('Failed to fetch legacy autopay status:', autopayError);
            // Non-critical error - continue without autopay data
          }
          
          // Merge autopay status with the correct legacy data
          const autopayStatus = {
            legacy: legacyAutopayData || {
              autopayEnabled: false,
              lastChecked: new Date().toISOString()
            },
            stripe: result.autopayStatus?.stripe || {
              autopayEnabled: false,
              hasPaymentMethod: false,
              defaultPaymentMethodId: null
            }
          };
          
          return {
            invoices: result.invoices || [],
            payments: result.payments || [],
            invoiceSummary: result.invoiceSummary || null,
            autopayStatus: autopayStatus,
            customerInfo: {
              ...(result.customerInfo || {}),
              alcorId: alcorId // Add Alcor ID to customer info
            },
            emailNotificationSettings: result.emailNotificationSettings || null,
            salesOrderAnalysis: result.salesOrderAnalysis || null,
            alcorId: alcorId // Also return at top level for convenience
          };
        }
      }

      // If consolidated endpoint fails completely, log why
      if (invoiceDataPromise.status === 'fulfilled') {
        const errorDetails = await this.parseErrorResponse(invoiceDataPromise.value.clone());
        console.error('Consolidated endpoint failed after all retries:', errorDetails);
      } else {
        console.error('Invoice data promise rejected:', invoiceDataPromise.reason);
      }
      console.error('Retry statistics:', this.getRetryStats());

      // Fallback to individual endpoints WITH ENHANCED RETRY
      console.warn('Falling back to individual endpoints...');
      
      const [invoicesRes, paymentsRes, stripeRes, legacyAutopayRes] = await Promise.allSettled([
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
        ),
        
        // ACCURATE legacy autopay endpoint
        this.fetchWithRetry(
          `${API_BASE_URL}/netsuite/customers/${customerId}/autopay`,
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
        console.error('Stripe endpoint failed:', stripeRes.reason);
      }
      if (legacyAutopayRes.status === 'rejected') {
        console.error('Legacy autopay endpoint failed:', legacyAutopayRes.reason);
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
        customerInfo: {
          alcorId: alcorId // Include Alcor ID even in fallback
        },
        emailNotificationSettings: null,
        salesOrderAnalysis: null,
        alcorId: alcorId // Top-level for convenience
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

      // Build autopay status from individual endpoints
      let legacyAutopayData = null;
      let stripeAutopayData = null;

      // Process legacy autopay response
      if (legacyAutopayRes.status === 'fulfilled' && legacyAutopayRes.value.ok) {
        try {
          const autopayResult = await legacyAutopayRes.value.json();
          if (autopayResult.success !== false) {
            legacyAutopayData = {
              autopayEnabled: autopayResult.automaticPayment || false,
              customerName: autopayResult.companyName || autopayResult.entityId,
              autopayField: autopayResult.autopayField || 'custentity_ale_autopayment',
              lastChecked: autopayResult.lastChecked || new Date().toISOString()
            };
            console.log('Got legacy autopay status from fallback:', legacyAutopayData.autopayEnabled);
          }
        } catch (e) {
          console.warn('Failed to parse legacy autopay response:', e);
        }
      }

      // Process Stripe autopay response
      if (stripeRes.status === 'fulfilled' && stripeRes.value.ok) {
        try {
          const stripeData = await stripeRes.value.json();
          if (stripeData.success) {
            stripeAutopayData = stripeData.stripe || {
              autopayEnabled: false,
              hasPaymentMethod: false,
              defaultPaymentMethodId: null
            };
            console.log('Got Stripe autopay status from fallback');
          }
        } catch (e) {
          console.warn('Failed to parse Stripe response:', e);
        }
      }

      // Combine autopay status
      data.autopayStatus = {
        legacy: legacyAutopayData || {
          autopayEnabled: false,
          lastChecked: new Date().toISOString()
        },
        stripe: stripeAutopayData || {
          autopayEnabled: false,
          hasPaymentMethod: false,
          defaultPaymentMethodId: null
        }
      };

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
   * Check if invoice data has invoice details
   * @param {object} invoice - Invoice object
   * @returns {boolean} Whether invoice has details
   */
  hasInvoiceDetails(invoice) {
    return !!(invoice?.items?.length || invoice?.lineItems?.length || invoice?.itemList?.length);
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
export const invoiceDataService = new InvoiceDataServiceWorkingButExtraCall();

// Also export the class for testing
export { InvoiceDataServiceWorkingButExtraCall };