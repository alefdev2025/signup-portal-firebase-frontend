// services/netsuite/autopay.js
import { NETSUITE_API_BASE, REQUEST_TIMEOUT } from './config';

/**
 * Get customer autopay status
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Autopay status data
 */
export const getCustomerAutopayStatus = async (customerId) => {
  try {
    console.log(`Fetching autopay status for customer ${customerId}`);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/autopay`;
    
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
    console.log('Autopay status API response:', result);
    
    // Handle the response structure
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle different possible response structures
    let autopayData = {};
    
    // Check if we have a successful response with data
    if (result.success && result.data) {
      autopayData = result.data;
    } else if (result.autopayEnabled !== undefined) {
      // Direct response structure
      autopayData = result;
    } else {
      console.warn('Unexpected autopay status structure:', result);
      autopayData = {
        autopayEnabled: false,
        lastChecked: new Date().toISOString()
      };
    }
    
    // Ensure we have the expected fields
    const enhancedAutopayData = {
      autopayEnabled: autopayData.autopayEnabled || false,
      lastChecked: autopayData.lastChecked || new Date().toISOString(),
      paymentMethodId: autopayData.paymentMethodId || null,
      paymentMethodType: autopayData.paymentMethodType || null,
      lastModified: autopayData.lastModified || null,
      modifiedBy: autopayData.modifiedBy || null
    };
    
    return {
      success: true,
      ...enhancedAutopayData,
      customerId: customerId,
      timestamp: result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching autopay status:', error);
    throw error;
  }
};

/**
 * Update customer autopay status
 * @param {string} customerId - NetSuite customer ID
 * @param {boolean} enabled - Whether to enable or disable autopay
 * @returns {Promise<object>} Update response
 */
export const updateCustomerAutopayStatus = async (customerId, enabled) => {
  try {
    console.log(`Updating autopay status for customer ${customerId} to ${enabled}`);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/autopay`;
    
    const fetchPromise = fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if you have a token
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      credentials: 'include', // Include cookies if needed
      body: JSON.stringify({
        enabled: enabled
      })
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
    console.log('Autopay update API response:', result);
    
    // Handle the response structure
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle different possible response structures
    let updateResult = {};
    
    if (result.success !== undefined) {
      updateResult = result;
    } else {
      // Assume success if we got here without error
      updateResult = {
        success: true,
        currentStatus: enabled,
        ...result
      };
    }
    
    return {
      success: updateResult.success || true,
      currentStatus: updateResult.currentStatus !== undefined ? updateResult.currentStatus : enabled,
      previousStatus: updateResult.previousStatus,
      message: updateResult.message || `Autopay ${enabled ? 'enabled' : 'disabled'} successfully`,
      customerId: customerId,
      timestamp: updateResult.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating autopay status:', error);
    throw error;
  }
};

/**
 * Get autopay history for a customer
 * @param {string} customerId - NetSuite customer ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Autopay history data
 */
export const getCustomerAutopayHistory = async (customerId, options = {}) => {
  try {
    console.log(`Fetching autopay history for customer ${customerId}`, options);
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      limit: options.limit || 50,
      offset: options.offset || 0
    });
    
    if (options.dateFrom) queryParams.append('dateFrom', options.dateFrom);
    if (options.dateTo) queryParams.append('dateTo', options.dateTo);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/autopay/history?${queryParams.toString()}`;
    
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
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Handle nested structure
    const history = result.data?.history || result.history || result.data || [];
    
    return {
      success: true,
      history: Array.isArray(history) ? history : [],
      count: result.count || history.length,
      totalCount: result.totalCount || history.length,
      customerId: customerId,
      timestamp: result.timestamp || new Date().toISOString(),
      pagination: result.pagination || {
        offset: options.offset || 0,
        limit: options.limit || 50,
        hasMore: false
      }
    };
  } catch (error) {
    console.error('Error fetching autopay history:', error);
    throw error;
  }
};

/**
 * Verify autopay can be enabled (check for valid payment method)
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Verification result
 */
export const verifyAutopayEligibility = async (customerId) => {
  try {
    console.log(`Verifying autopay eligibility for customer ${customerId}`);
    
    const url = `${NETSUITE_API_BASE}/customers/${customerId}/autopay/verify`;
    
    const fetchPromise = fetch(url, {
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
    
    return {
      success: true,
      eligible: result.eligible || false,
      reason: result.reason || null,
      hasValidPaymentMethod: result.hasValidPaymentMethod || false,
      paymentMethods: result.paymentMethods || [],
      customerId: customerId
    };
  } catch (error) {
    console.error('Error verifying autopay eligibility:', error);
    throw error;
  }
};