// services/netsuite/salesOrders.js
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Get sales orders for a customer
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Sales orders
 */
export const getSalesOrders = async (customerId, options = {}) => {
  try {
    console.log(`Fetching sales orders for customer ${customerId}`, options);
    
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.offset) queryParams.append('offset', options.offset);
    if (options.status) queryParams.append('status', options.status);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/salesorders${
      queryParams.toString() ? '?' + queryParams.toString() : ''
    }`;
    
    const fetchPromise = fetch(url, {
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
      throw new Error(result.error || 'Failed to retrieve sales orders');
    }
    
    return {
      success: true,
      salesOrders: result.data || [],
      count: result.count || 0
    };
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    throw error;
  }
};

/**
 * Get sales order details
 * @param {string} salesOrderId - Sales order ID
 * @returns {Promise<object>} Sales order details
 */
export const getSalesOrderDetails = async (salesOrderId) => {
  try {
    console.log(`Fetching sales order details for ${salesOrderId}`);
    
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/salesorders/${salesOrderId}`, {
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
      throw new Error(result.error || 'Failed to retrieve sales order details');
    }
    
    return {
      success: true,
      salesOrder: result.data
    };
  } catch (error) {
    console.error('Error fetching sales order details:', error);
    throw error;
  }
};