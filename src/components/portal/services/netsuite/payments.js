// services/netsuite/payments.js
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Post a payment to NetSuite
 * @param {object} paymentData - Payment information
 * @returns {Promise<object>} Payment result
 */
export const postPayment = async (paymentData) => {
  try {
    console.log('Posting payment to NetSuite:', paymentData);
    
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
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
      throw new Error(result.error || 'Failed to post payment');
    }
    
    return {
      success: true,
      payment: result.data
    };
  } catch (error) {
    console.error('Error posting payment:', error);
    throw error;
  }
};

/**
 * Get payment status from NetSuite
 * @param {string} paymentId - Payment ID
 * @returns {Promise<object>} Payment status
 */
export const getPaymentStatus = async (paymentId) => {
  try {
    console.log(`Fetching payment status for ${paymentId}`);
    
    const fetchPromise = fetch(`${NETSUITE_API_BASE}/payments/${paymentId}/status`, {
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
    
    return {
      success: true,
      status: result.data
    };
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};