// File: src/components/portal/services/netsuite/payments.js
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Get all payments for a specific customer
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Payment data
 */
export const getCustomerPayments = async (customerId, options = {}) => {
  try {
    console.log(`Fetching payments for customer ${customerId}`, options);
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      limit: options.limit || 100,
      offset: options.offset || 0
    });
    
    // Add optional parameters
    if (options.invoiceId) queryParams.append('invoiceId', options.invoiceId);
    if (options.dateFrom) queryParams.append('dateFrom', options.dateFrom);
    if (options.dateTo) queryParams.append('dateTo', options.dateTo);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/payments?${queryParams.toString()}`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Debug log to see what we're getting
    console.log('Customer payments API response:', result);
    
    // Handle the response structure
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle different possible response structures
    let paymentsArray = [];
    
    // Check if we have a successful response with data
    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        paymentsArray = result.data;
      } else if (result.data.payments && Array.isArray(result.data.payments)) {
        paymentsArray = result.data.payments;
      } else if (result.data.data && Array.isArray(result.data.data)) {
        paymentsArray = result.data.data;
      } else {
        console.warn('Unexpected data structure in result.data:', result.data);
        paymentsArray = [];
      }
    } else if (result.payments && Array.isArray(result.payments)) {
      paymentsArray = result.payments;
    } else if (Array.isArray(result)) {
      paymentsArray = result;
    } else {
      console.warn('Could not find payments array in response:', result);
      paymentsArray = [];
    }
    
    // Process and enhance payment data
    const payments = paymentsArray.map(payment => ({
      ...payment,
      // Ensure all numeric fields are properly parsed
      amount: parseFloat(payment.amount) || 0,
      unapplied: parseFloat(payment.unapplied) || 0,
      // Add computed fields
      isFullyApplied: parseFloat(payment.unapplied) === 0,
      displayStatus: formatPaymentStatus(payment.status),
      // Ensure appliedTo is an array
      appliedTo: payment.appliedTo || []
    }));
    
    return {
      success: true,
      payments: payments,
      count: result.count || payments.length,
      totalCount: result.totalCount || payments.length,
      customerId: customerId,
      timestamp: result.timestamp || new Date().toISOString(),
      pagination: result.pagination || {
        offset: options.offset || 0,
        limit: options.limit || 100,
        hasMore: false
      }
    };
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific payment
 * @param {string} paymentId - NetSuite payment ID
 * @returns {Promise<object>} Complete payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    console.log(`Fetching payment details for ${paymentId}`);
    
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle nested structure
    const payment = result.data?.payment || result.payment || result.data || result;
    
    const enhancedPayment = {
      ...payment,
      // Ensure numeric values
      amount: parseFloat(payment.amount) || 0,
      unapplied: parseFloat(payment.unapplied) || 0,
      // Computed fields
      isFullyApplied: parseFloat(payment.unapplied) === 0,
      displayStatus: formatPaymentStatus(payment.status),
      // Process applied invoices
      appliedInvoices: (payment.appliedInvoices || []).map(inv => ({
        ...inv,
        originalAmount: parseFloat(inv.originalAmount) || 0,
        amountDue: parseFloat(inv.amountDue) || 0,
        amountApplied: parseFloat(inv.amountApplied) || 0
      })),
      // Ensure appliedTo exists
      appliedTo: payment.appliedTo || []
    };
    
    return {
      success: true,
      payment: enhancedPayment
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Get payment summary statistics for a customer
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Summary statistics
 */
export const getPaymentSummary = async (customerId) => {
  try {
    console.log(`Fetching payment summary for customer ${customerId}`);
    
    // Fetch the summary endpoint directly if available
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/customers/${customerId}/payments/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Return the summary data
    return {
      success: true,
      summary: result.summary || result.data || result
    };
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    
    // Fallback: calculate summary from all payments
    try {
      const paymentsResult = await getCustomerPayments(customerId, { limit: 1000 });
      const payments = paymentsResult.payments || [];
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      
      const summary = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, pay) => sum + pay.amount, 0),
        totalUnapplied: payments.reduce((sum, pay) => sum + pay.unapplied, 0),
        
        // Date ranges
        recentPayments: payments.filter(pay => new Date(pay.date) >= thirtyDaysAgo).length,
        yearPayments: payments.filter(pay => new Date(pay.date) >= oneYearAgo).length,
        
        // Analytics
        averagePaymentAmount: payments.length > 0 ? 
          payments.reduce((sum, pay) => sum + pay.amount, 0) / payments.length : 0,
        
        // Payment methods breakdown
        paymentMethods: getPaymentMethodBreakdown(payments),
        
        // Key dates
        lastPaymentDate: getLastPaymentDate(payments),
        firstPaymentDate: getFirstPaymentDate(payments)
      };
      
      return {
        success: true,
        summary: summary
      };
    } catch (fallbackError) {
      throw error; // Throw original error
    }
  }
};

/**
 * Get customer credits/credit memos
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Credit data
 */
export const getCustomerCredits = async (customerId, options = {}) => {
  try {
    console.log(`Fetching credits for customer ${customerId}`, options);
    
    const queryParams = new URLSearchParams({
      limit: options.limit || 100,
      offset: options.offset || 0
    });
    
    if (options.dateFrom) queryParams.append('dateFrom', options.dateFrom);
    if (options.dateTo) queryParams.append('dateTo', options.dateTo);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/credits?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      credits: result.data || result.credits || [],
      count: result.count || 0,
      customerId: customerId
    };
  } catch (error) {
    console.error('Error fetching customer credits:', error);
    throw error;
  }
};

/**
 * Get customer payment methods
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Payment methods
 */
export const getCustomerPaymentMethods = async (customerId) => {
  try {
    console.log(`Fetching payment methods for customer ${customerId}`);
    
    const response = await fetch(`${NETSUITE_API_BASE}/customers/${customerId}/payment-methods`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      paymentMethods: result.data || result.paymentMethods || [],
      count: result.count || 0,
      customerId: customerId
    };
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

/**
 * Get customer autopay status (legacy)
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Autopay status
 */
export const getCustomerAutopayStatus = async (customerId) => {
  try {
    console.log(`Fetching autopay status for customer ${customerId}`);
    
    const response = await fetch(`${NETSUITE_API_BASE}/customers/${customerId}/autopay`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      customerId: result.customerId,
      customerName: result.companyName || result.entityId,
      autopayEnabled: result.automaticPayment,
      autopayField: 'custentity_ale_autopayment',
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching autopay status:', error);
    throw error;
  }
};

/**
 * Update customer autopay status (legacy)
 * @param {string} customerId - NetSuite customer ID
 * @param {boolean} enabled - Enable/disable autopay
 * @returns {Promise<object>} Update result
 */
export const updateCustomerAutopayStatus = async (customerId, enabled) => {
  try {
    console.log(`Updating autopay status for customer ${customerId} to ${enabled}`);
    
    const response = await fetch(`${NETSUITE_API_BASE}/customers/${customerId}/autopay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ enabled })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error updating autopay status:', error);
    throw error;
  }
};

/**
 * Get Stripe integration status
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Stripe integration status
 */
export const getStripeIntegrationStatus = async (customerId) => {
  try {
    console.log(`Fetching Stripe integration status for customer ${customerId}`);
    
    const response = await fetch(`${NETSUITE_API_BASE}/customers/${customerId}/stripe`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('Error fetching Stripe status:', error);
    throw error;
  }
};

/**
 * Export payments to CSV
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Export options
 * @returns {Promise<void>}
 */
export const exportPaymentsToCSV = async (customerId, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      format: 'csv',
      ...options
    });
    
    const response = await fetch(
      `${NETSUITE_API_BASE}/customers/${customerId}/payments/export?${queryParams.toString()}`, 
      {
        method: 'GET',
        headers: {
          'Accept': 'text/csv'
        },
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to export payments: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${customerId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting payments:', error);
    throw error;
  }
};

// Helper functions

/**
 * Format payment status for display
 */
function formatPaymentStatus(status) {
  const statusMap = {
    'deposited': 'Deposited',
    'Deposited': 'Deposited',
    'notDeposited': 'Not Deposited',
    'unapplied': 'Unapplied',
    'partiallyApplied': 'Partially Applied',
    'fullyApplied': 'Fully Applied'
  };
  
  return statusMap[status] || status || 'Unknown';
}

/**
 * Get payment method breakdown
 */
function getPaymentMethodBreakdown(payments) {
  const breakdown = {};
  
  payments.forEach(payment => {
    const method = payment.paymentMethod || 'Unknown';
    if (!breakdown[method]) {
      breakdown[method] = {
        count: 0,
        totalAmount: 0
      };
    }
    breakdown[method].count++;
    breakdown[method].totalAmount += payment.amount;
  });
  
  return breakdown;
}

/**
 * Get the last payment date
 */
function getLastPaymentDate(payments) {
  if (payments.length === 0) return null;
  
  return payments.reduce((latest, pay) => {
    const payDate = new Date(pay.date);
    return payDate > new Date(latest) ? pay.date : latest;
  }, payments[0].date);
}

/**
 * Get the first payment date
 */
function getFirstPaymentDate(payments) {
  if (payments.length === 0) return null;
  
  return payments.reduce((earliest, pay) => {
    const payDate = new Date(pay.date);
    return payDate < new Date(earliest) ? pay.date : earliest;
  }, payments[0].date);
}