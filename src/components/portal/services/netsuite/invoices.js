// services/netsuite/invoices.js
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Get all invoices for a specific customer with complete field data
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Invoice data with all fields
 */
export const getCustomerInvoices = async (customerId, options = {}) => {
  try {
    console.log(`Fetching invoices for customer ${customerId}`, options);
    
    // Build query parameters (without customerId since it's in the path)
    const queryParams = new URLSearchParams({
      limit: options.limit || 100,
      offset: options.offset || 0
    });
    
    // Add optional parameters
    if (options.status) queryParams.append('status', options.status);
    if (options.includeDetails) queryParams.append('includeDetails', options.includeDetails);
    if (options.dateFrom) queryParams.append('dateFrom', options.dateFrom);
    if (options.dateTo) queryParams.append('dateTo', options.dateTo);
    
    // FIXED: Use the correct endpoint path with customerId in the URL
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/invoices?${queryParams.toString()}`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if you have a token
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      credentials: 'include' // Include cookies if needed
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
    console.log('Customer invoices API response:', result);
    
    // Handle the response structure from the enhanced RESTlet
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle different possible response structures
    let invoicesArray = [];
    
    // Check if we have a successful response with data
    if (result.success && result.data) {
      if (Array.isArray(result.data)) {
        // data is directly an array of invoices
        invoicesArray = result.data;
      } else if (result.data.invoices && Array.isArray(result.data.invoices)) {
        // data is an object containing an invoices array
        invoicesArray = result.data.invoices;
      } else if (result.data.data && Array.isArray(result.data.data)) {
        // data might be nested as data.data
        invoicesArray = result.data.data;
      } else {
        console.warn('Unexpected data structure in result.data:', result.data);
        invoicesArray = [];
      }
    } else if (result.invoices && Array.isArray(result.invoices)) {
      // Direct invoices array at root level
      invoicesArray = result.invoices;
    } else if (Array.isArray(result)) {
      // The entire result is an array
      invoicesArray = result;
    } else {
      console.warn('Could not find invoices array in response:', result);
      invoicesArray = [];
    }
    
    // Process and enhance invoice data
    const invoices = invoicesArray.map(invoice => ({
      ...invoice,
      // Ensure all numeric fields are properly parsed
      total: parseFloat(invoice.total) || 0,
      subtotal: parseFloat(invoice.subtotal) || parseFloat(invoice.total) || 0,
      taxTotal: parseFloat(invoice.taxTotal) || 0,
      discountTotal: parseFloat(invoice.discountTotal) || 0,
      amountRemaining: parseFloat(invoice.amountRemaining) || 0,
      amountPaid: (parseFloat(invoice.total) || 0) - (parseFloat(invoice.amountRemaining) || 0),
      // Add computed fields
      isPaid: parseFloat(invoice.amountRemaining) === 0,
      isOverdue: isInvoiceOverdue(invoice.dueDate, parseFloat(invoice.amountRemaining)),
      displayStatus: formatInvoiceStatus(invoice.status, parseFloat(invoice.amountRemaining))
    }));
    
    return {
      success: true,
      invoices: invoices,
      count: result.count || invoices.length,
      customerId: customerId,
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific invoice including line items
 * @param {string} invoiceId - NetSuite invoice ID
 * @returns {Promise<object>} Complete invoice details
 */
 export const getInvoiceDetails = async (invoiceId) => {
    try {
      console.log(`Fetching invoice details for ${invoiceId}`);
      
      const fetchPromise = fetch(`${NETSUITE_API_BASE}/invoices/${invoiceId}`, {
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
      
      // FIX: Handle your backend's nested structure
      // Your backend returns: { success: true, data: { success: true, invoice: {...} } }
      const invoice = result.data?.invoice || result.invoice || result.data || result;
      
      const enhancedInvoice = {
        ...invoice,
        // Ensure numeric values
        total: parseFloat(invoice.total) || 0,
        subtotal: parseFloat(invoice.subtotal) || 0,
        taxTotal: parseFloat(invoice.taxTotal) || 0,
        discountTotal: parseFloat(invoice.discountTotal) || 0,
        amountRemaining: parseFloat(invoice.amountRemaining) || 0,
        amountPaid: (parseFloat(invoice.total) || 0) - (parseFloat(invoice.amountRemaining) || 0),
        // Computed fields
        isPaid: parseFloat(invoice.amountRemaining) === 0,
        isOverdue: isInvoiceOverdue(invoice.dueDate, parseFloat(invoice.amountRemaining)),
        displayStatus: formatInvoiceStatus(invoice.status, parseFloat(invoice.amountRemaining)),
        // Process line items
        items: (invoice.items || []).map(item => ({
          ...item,
          rate: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0,
          quantity: parseFloat(item.quantity) || 1,
          taxAmount: parseFloat(item.tax1Amt) || 0,
          grossAmount: parseFloat(item.grossAmt) || parseFloat(item.amount) || 0
        })),
        // Payment summary
        paymentSummary: generatePaymentSummary(invoice),
        // IMPORTANT: Include billingAddress - it's already in the response!
        billingAddress: invoice.billingAddress || null
      };
      
      return {
        success: true,
        invoice: enhancedInvoice
      };
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  };
  
/**
 * Get customer information including billing address
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Customer details
 */
export const getCustomerInfo = async (customerId) => {
  try {
    console.log(`Fetching customer info for ${customerId}`);
    
    // FIXED: Use the correct endpoint
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/customers/${customerId}`, {
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
    
    return {
      success: true,
      customer: result.customer || result.data || result
    };
  } catch (error) {
    console.error('Error fetching customer info:', error);
    throw error;
  }
};

/**
 * Get invoice summary statistics for a customer
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Summary statistics
 */
export const getInvoiceSummary = async (customerId) => {
  try {
    console.log(`Fetching invoice summary for customer ${customerId}`);
    
    // Get all invoices to calculate summary
    const invoicesResult = await getCustomerInvoices(customerId, { limit: 1000 });
    const invoices = invoicesResult.invoices || [];
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    const summary = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.isPaid).length,
      unpaidInvoices: invoices.filter(inv => !inv.isPaid).length,
      overdueInvoices: invoices.filter(inv => inv.isOverdue).length,
      
      // Amounts
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
      totalPaid: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
      totalDue: invoices.reduce((sum, inv) => sum + inv.amountRemaining, 0),
      totalOverdue: invoices.filter(inv => inv.isOverdue)
                           .reduce((sum, inv) => sum + inv.amountRemaining, 0),
      
      // Date ranges
      recentInvoices: invoices.filter(inv => new Date(inv.date) >= thirtyDaysAgo).length,
      yearInvoices: invoices.filter(inv => new Date(inv.date) >= oneYearAgo).length,
      
      // Analytics
      averageInvoiceAmount: invoices.length > 0 ? 
        invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0,
      
      // Key dates
      oldestUnpaidDate: getOldestUnpaidDate(invoices),
      newestInvoiceDate: getNewestInvoiceDate(invoices)
    };
    
    return {
      success: true,
      summary: summary
    };
  } catch (error) {
    console.error('Error fetching invoice summary:', error);
    throw error;
  }
};

/**
 * Search invoices with specific criteria
 * @param {object} criteria - Search criteria
 * @returns {Promise<object>> Search results
 */
export const searchInvoices = async (criteria) => {
  try {
    console.log('Searching invoices with criteria:', criteria);
    
    const queryParams = new URLSearchParams(criteria);
    
    // FIXED: Use the correct endpoint
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/invoices/search?${queryParams.toString()}`, {
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
    
    return {
      success: true,
      invoices: result.invoices || result.data || [],
      count: result.count || 0
    };
  } catch (error) {
    console.error('Error searching invoices:', error);
    throw error;
  }
};

/**
 * Download invoice as PDF
 * @param {string} invoiceId - NetSuite invoice ID
 * @returns {Promise<void>}
 */
export const downloadInvoicePDF = async (invoiceId) => {
  try {
    const response = await fetch(`${NETSUITE_API_BASE}/invoices/${invoiceId}/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading invoice PDF:', error);
    throw error;
  }
};

/**
 * Send invoice by email
 * @param {string} invoiceId - NetSuite invoice ID
 * @param {object} emailOptions - Email options
 * @returns {Promise<object>}
 */
export const sendInvoiceEmail = async (invoiceId, emailOptions = {}) => {
  try {
    const response = await fetch(`${NETSUITE_API_BASE}/invoices/${invoiceId}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(emailOptions)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to send email: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
};

/**
 * Export invoices to CSV
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Export options
 * @returns {Promise<void>}
 */
export const exportInvoicesToCSV = async (customerId, options = {}) => {
  try {
    const queryParams = new URLSearchParams({
      format: 'csv',
      ...options
    });
    
    const response = await fetch(
      `${NETSUITE_API_BASE}/customers/${customerId}/invoices/export?${queryParams.toString()}`, 
      {
        method: 'GET',
        headers: {
          'Accept': 'text/csv'
        },
        credentials: 'include'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to export invoices: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${customerId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting invoices:', error);
    throw error;
  }
};

// Helper functions

/**
 * Check if invoice is overdue
 */
function isInvoiceOverdue(dueDate, amountRemaining) {
  if (!dueDate || amountRemaining === 0) {
    return false;
  }
  
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return due < today;
}

/**
 * Format invoice status for display
 */
function formatInvoiceStatus(status, amountRemaining) {
  if (amountRemaining === 0) {
    return 'Paid';
  }
  
  switch (status) {
    case 'paidInFull':
      return 'Paid';
    case 'open':
      return 'Unpaid';
    case 'partiallyPaid':
      return 'Partially Paid';
    case 'pending':
      return 'Pending';
    case 'voided':
      return 'Voided';
    default:
      return status || 'Unpaid';
  }
}

/**
 * Generate payment summary
 */
function generatePaymentSummary(invoice) {
  const total = parseFloat(invoice.total) || 0;
  const remaining = parseFloat(invoice.amountRemaining) || 0;
  const paid = total - remaining;
  
  return {
    total,
    paid,
    remaining,
    isPaid: remaining === 0,
    percentPaid: total > 0 ? Math.round((paid / total) * 100) : 0,
    payments: invoice.payments || [],
    appliedCredits: invoice.appliedCredits || []
  };
}

/**
 * Find the oldest unpaid invoice date
 */
function getOldestUnpaidDate(invoices) {
  const unpaidInvoices = invoices.filter(inv => !inv.isPaid);
  if (unpaidInvoices.length === 0) return null;
  
  return unpaidInvoices.reduce((oldest, inv) => {
    const invDate = new Date(inv.date);
    return invDate < oldest ? invDate : oldest;
  }, new Date());
}

/**
 * Find the newest invoice date
 */
function getNewestInvoiceDate(invoices) {
  if (invoices.length === 0) return null;
  
  return invoices.reduce((newest, inv) => {
    const invDate = new Date(inv.date);
    return invDate > newest ? invDate : newest;
  }, new Date(0));
}