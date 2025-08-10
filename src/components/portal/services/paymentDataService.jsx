// services/paymentDataService.js
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';

class PaymentDataService {
  /**
   * Fetch with retry logic
   * @private
   */
  async fetchWithRetry(url, options, maxRetries = 5) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
          const waitTime = Math.min(retryAfter * 1000, 30000);
          console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const waitTime = Math.min(1000 * Math.pow(2, i), 10000);
          console.log(`🔄 Network error. Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Get all payment data using the consolidated endpoint
   * @param {string} customerId - Customer ID
   * @param {boolean} includeLineItems - Whether to include invoice line items (slower)
   * @returns {Promise<object>} Fresh payment data
   */
  async getPaymentData(customerId, includeLineItems = false) {
    // Validate customer ID
    if (!customerId || customerId === 'pending' || customerId === 'undefined') {
      console.warn('Invalid customer ID for payment data:', customerId);
      return {
        payments: [],
        paymentSummary: null,
        autopayStatus: null,
        signupPayments: [],
        invoiceDetailsMap: null
      };
    }
    
    console.log(`💰 Fetching payment data from consolidated endpoint for customer ${customerId}`);
    console.log(`   Include line items: ${includeLineItems}`);
    
    try {
      // Build URL with query parameters
      const params = new URLSearchParams({
        includeInvoiceDetailsInPayments: 'true',
        includeLineItems: includeLineItems.toString()
      });
      
      const response = await this.fetchWithRetry(
        `${API_BASE_URL}/netsuite/customers/${customerId}/invoice-data?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load payment data: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load payment data');
      }

      // Debug log the structure
      console.log('✅ Consolidated data structure:', {
        hasPayments: !!result.payments,
        paymentsType: typeof result.payments,
        paymentsKeys: result.payments ? Object.keys(result.payments) : [],
        hasRecords: !!(result.payments?.records),
        recordsLength: result.payments?.records?.length || 0,
        samplePayment: result.payments?.records?.[0]
      });

      // Extract the actual payments array from the nested structure
      let paymentsArray = [];
      
      // Handle different possible response structures
      if (result.payments) {
        if (Array.isArray(result.payments)) {
          // Direct array
          paymentsArray = result.payments;
        } else if (result.payments.records && Array.isArray(result.payments.records)) {
          // Nested in records property (most likely)
          paymentsArray = result.payments.records;
        } else if (result.payments.data && Array.isArray(result.payments.data)) {
          // Nested in data property
          paymentsArray = result.payments.data;
        }
      }

      console.log(`✅ Extracted ${paymentsArray.length} payments from response`);

      // Process payments to ensure consistent structure
      const payments = this.processPayments(paymentsArray);
      
      // Calculate payment summary from the data
      const paymentSummary = this.calculatePaymentSummary(payments);
      
      // Extract autopay status - handle different structures
      let autopayStatus = null;
      if (result.stripeIntegration) {
        autopayStatus = result.stripeIntegration;
      } else if (result.autopayStatus) {
        autopayStatus = result.autopayStatus;
      }
      
      // Get invoice details map if it was included
      const invoiceDetailsMap = result.invoiceDetailsMap || null;

      return {
        payments: payments,
        paymentSummary: paymentSummary,
        autopayStatus: autopayStatus,
        signupPayments: [], // Not included in consolidated endpoint
        invoiceDetailsMap: invoiceDetailsMap
      };
      
    } catch (error) {
      console.error('Error fetching payment data:', error);
      throw error;
    }
  }

  /**
   * Process payments to ensure consistent structure
   * @private
   */
  processPayments(payments) {
    if (!Array.isArray(payments)) {
      console.warn('Payments is not an array:', payments);
      return [];
    }

    return payments.map(payment => {
      // Ensure all expected fields exist
      const processed = {
        ...payment,
        id: payment.id || payment.internalId,
        documentNumber: payment.documentNumber || `PYMT-${payment.id}`,
        date: payment.date,
        amount: parseFloat(payment.amount) || 0,
        unapplied: parseFloat(payment.unapplied) || 0,
        status: payment.status || 'Unknown',
        paymentMethod: payment.paymentMethod || 'Unknown',
        memo: payment.memo || '',
        currency: payment.currency || 'USD',
        appliedTo: payment.appliedTo || []
      };

      // Process applied invoices to ensure they have invoice details
      processed.appliedTo = processed.appliedTo.map(applied => ({
        ...applied,
        transactionId: applied.transactionId,
        transactionName: applied.transactionName || 'Unknown',
        amount: parseFloat(applied.amount) || 0,
        // Invoice details should already be attached by the RESTlet
        invoiceDetails: applied.invoiceDetails || null
      }));

      return processed;
    });
  }

  /**
   * Calculate payment summary from payments array
   * @private
   */
  calculatePaymentSummary(payments) {
    if (!payments || payments.length === 0) {
      return null;
    }

    const summary = {
      totalPayments: payments.length,
      totalAmount: 0,
      totalUnapplied: 0,
      recentPayments: 0,
      paymentMethods: {},
      lastPaymentDate: null,
      averagePaymentAmount: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let mostRecentDate = null;

    payments.forEach(payment => {
      const amount = parseFloat(payment.amount) || 0;
      const unapplied = parseFloat(payment.unapplied) || 0;
      
      summary.totalAmount += amount;
      summary.totalUnapplied += unapplied;
      
      // Track most recent payment date
      if (payment.date) {
        const paymentDate = new Date(payment.date);
        if (!mostRecentDate || paymentDate > mostRecentDate) {
          mostRecentDate = paymentDate;
          summary.lastPaymentDate = payment.date;
        }
        
        // Count recent payments
        if (paymentDate >= thirtyDaysAgo) {
          summary.recentPayments++;
        }
      }
      
      // Group by payment method
      const method = payment.paymentMethod || 'Unknown';
      if (!summary.paymentMethods[method]) {
        summary.paymentMethods[method] = {
          count: 0,
          total: 0
        };
      }
      summary.paymentMethods[method].count++;
      summary.paymentMethods[method].total += amount;
    });

    // Calculate average
    summary.averagePaymentAmount = summary.totalAmount / payments.length;

    return summary;
  }

  /**
   * Get payments only - for backward compatibility
   */
  async getPayments(customerId) {
    const data = await this.getPaymentData(customerId);
    return {
      payments: data.payments,
      isLoading: false,
      fromCache: false
    };
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    // Since we don't have a specific endpoint for single payment,
    // this would need to be implemented based on your needs
    throw new Error('getPaymentById not implemented - use getPaymentData instead');
  }

  /**
   * Clear any cached data (for future caching implementation)
   */
  clearCache() {
    console.log('🧹 Clearing payment data cache');
    // Implement when caching is added
  }

  /**
   * Check if invoice details are available for a payment
   */
  hasInvoiceDetails(payment) {
    return payment.appliedTo?.some(applied => 
      applied.invoiceDetails && applied.invoiceDetails.detailLevel
    ) || false;
  }

  /**
   * Get invoice details level for a payment
   */
  getInvoiceDetailsLevel(payment) {
    const levels = new Set();
    payment.appliedTo?.forEach(applied => {
      if (applied.invoiceDetails?.detailLevel) {
        levels.add(applied.invoiceDetails.detailLevel);
      }
    });
    return Array.from(levels);
  }
}

export const paymentDataService = new PaymentDataService();