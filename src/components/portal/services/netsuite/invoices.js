// services/netsuite/invoices.js
//import { auth } from '../firebase';
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Get all invoices for a specific customer
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options (limit, offset, includeDetails)
 * @returns {Promise<object>} Invoice data
 */
export const getCustomerInvoices = async (customerId, options = {}) => {
  try {
    // Since you removed auth, we don't need the token
    // const user = auth.currentUser;
    // const token = await user.getIdToken();
    
    console.log(`Fetching invoices for customer ${customerId}`, options);
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.offset) queryParams.append('offset', options.offset);
    if (options.includeDetails) queryParams.append('includeDetails', options.includeDetails);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/invoices${
      queryParams.toString() ? '?' + queryParams.toString() : ''
    }`;
    
    const fetchPromise = fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // No auth header needed since you removed authentication
      }
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to retrieve invoices');
    }
    
    return {
      success: true,
      invoices: result.data || [],
      count: result.count || 0,
      customerId: result.customerId
    };
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific invoice
 * @param {string} invoiceId - NetSuite invoice ID
 * @returns {Promise<object>} Invoice details
 */
export const getInvoiceDetails = async (invoiceId) => {
  try {
    console.log(`Fetching invoice details for ${invoiceId}`);
    
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to retrieve invoice details');
    }
    
    return {
      success: true,
      invoice: result.data
    };
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    throw error;
  }
};

/**
 * Search invoices with specific criteria
 * @param {object} criteria - Search criteria (status, dateFrom, dateTo, etc.)
 * @returns {Promise<object>} Search results
 */
export const searchInvoices = async (criteria) => {
  try {
    console.log('Searching invoices with criteria:', criteria);
    
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/invoices/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(criteria)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NetSuite request timed out')), REQUEST_TIMEOUT)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to search invoices');
    }
    
    return {
      success: true,
      invoices: result.data || [],
      count: result.count || 0
    };
  } catch (error) {
    console.error('Error searching invoices:', error);
    throw error;
  }
};