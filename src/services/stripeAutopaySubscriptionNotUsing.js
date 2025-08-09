// File: services/stripeAutopay.js
import { auth } from './firebase';

// Base URL for API calls - using your existing config
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
const TIMEOUT_MS = 15000;

/**
 * Helper function to get auth headers
 */
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user found");
    throw new Error("User must be authenticated");
  }
  
  const token = await user.getIdToken();
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Create a Stripe autopay subscription
 * @param {object} params - Subscription parameters
 * @returns {Promise<object>} Subscription creation result
 */
export const createStripeAutopaySubscription = async (params) => {
  const {
    customerId,
    paymentMethodId,
    billingSchedule,
    amount,
    startDate
  } = params;

  try {
    console.log('Creating Stripe autopay subscription:', params);
    
    const headers = await getAuthHeaders();
    
    const requestBody = {
      customerId,
      paymentMethodId,
      billingSchedule,
      amount,
      startDate: startDate || new Date().toISOString(),
      metadata: {
        source: 'customer_portal',
        billingType: billingSchedule
      }
    };
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/autopay/create`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE AUTOPAY CREATE ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create subscription');
    }
    
    return {
      success: true,
      subscription: result.subscription,
      message: result.message || 'Autopay successfully enabled'
    };
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
};

/**
 * Get customer's Stripe autopay status
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Stripe autopay status
 */
export const getStripeAutopayStatus = async (customerId) => {
  try {
    console.log(`Fetching Stripe autopay status for customer ${customerId}`);
    
    const headers = await getAuthHeaders();
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/autopay/status/${customerId}`, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE AUTOPAY STATUS ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get Stripe status');
    }
    
    return {
      success: true,
      legacy: result.legacy,
      stripe: result.stripe,
      summary: result.summary
    };
  } catch (error) {
    console.error('Error fetching Stripe autopay status:', error);
    // Return default state on error
    return {
      success: false,
      legacy: { isOnAutopay: false },
      stripe: { hasActiveSubscription: false },
      summary: { type: 'NONE', status: 'INACTIVE' },
      error: error.message
    };
  }
};

/**
 * Cancel Stripe autopay subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} customerId - NetSuite customer ID
 * @returns {Promise<object>} Cancellation result
 */
export const cancelStripeAutopaySubscription = async (subscriptionId, customerId) => {
  try {
    console.log(`Cancelling Stripe subscription ${subscriptionId}`);
    
    const headers = await getAuthHeaders();
    
    const requestBody = {
      subscriptionId,
      customerId
    };
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/autopay/cancel`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE AUTOPAY CANCEL ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to cancel subscription');
    }
    
    return {
      success: true,
      message: result.message || 'Subscription cancelled successfully',
      effectiveDate: result.effectiveDate
    };
  } catch (error) {
    console.error('Error cancelling Stripe subscription:', error);
    throw error;
  }
};

/**
 * Update Stripe autopay payment method
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} paymentMethodId - New payment method ID
 * @returns {Promise<object>} Update result
 */
export const updateStripeAutopayPaymentMethod = async (subscriptionId, paymentMethodId) => {
  try {
    console.log(`Updating payment method for subscription ${subscriptionId}`);
    
    const headers = await getAuthHeaders();
    
    const requestBody = {
      subscriptionId,
      paymentMethodId
    };
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/autopay/update-payment-method`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE AUTOPAY UPDATE ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update payment method');
    }
    
    return {
      success: true,
      message: result.message || 'Payment method updated successfully'
    };
  } catch (error) {
    console.error('Error updating payment method:', error);
    throw error;
  }
};

/**
 * Get available billing schedules
 * @returns {Promise<object>} Available billing schedules
 */
export const getBillingSchedules = async () => {
  try {
    console.log('Fetching available billing schedules');
    
    const headers = await getAuthHeaders();
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/autopay/billing-schedules`, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 BILLING SCHEDULES ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get billing schedules');
    }
    
    return {
      success: true,
      schedules: result.schedules || []
    };
  } catch (error) {
    console.error('Error fetching billing schedules:', error);
    throw error;
  }
};

/**
 * Get or create Stripe customer
 * @param {string} netsuiteCustomerId - NetSuite customer ID
 * @param {object} customerData - Additional customer data (email, name, etc.)
 * @returns {Promise<object>} Stripe customer
 */
export const getOrCreateStripeCustomer = async (netsuiteCustomerId, customerData = {}) => {
  try {
    console.log(`Getting or creating Stripe customer for NetSuite ID ${netsuiteCustomerId}`);
    
    const headers = await getAuthHeaders();
    
    const requestBody = {
      customerId: netsuiteCustomerId,
      ...customerData  // Include email, name, etc.
    };
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/customer/get-or-create`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE CUSTOMER ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get/create Stripe customer');
    }
    
    return {
      success: true,
      stripeCustomerId: result.stripeCustomerId,
      isNew: result.isNew
    };
  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Get Stripe customer details
 * @param {string} stripeCustomerId - Stripe customer ID
 * @returns {Promise<object>} Stripe customer details
 */
export const getStripeCustomer = async (stripeCustomerId) => {
  try {
    console.log(`Getting Stripe customer details for ${stripeCustomerId}`);
    
    const headers = await getAuthHeaders();
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/customer/${stripeCustomerId}`, {
      method: 'GET',
      headers: headers,
      credentials: 'include'
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE CUSTOMER GET ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to get Stripe customer');
    }
    
    return {
      success: true,
      customer: result.customer
    };
  } catch (error) {
    console.error('Error getting Stripe customer:', error);
    throw error;
  }
};

/**
 * Update Stripe customer
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {object} updateData - Customer update data (email, name, metadata, etc.)
 * @returns {Promise<object>} Updated customer
 */
export const updateStripeCustomer = async (stripeCustomerId, updateData) => {
  try {
    console.log(`Updating Stripe customer ${stripeCustomerId}`, updateData);
    
    const headers = await getAuthHeaders();
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/customer/${stripeCustomerId}`, {
      method: 'PUT',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE CUSTOMER UPDATE ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update Stripe customer');
    }
    
    return {
      success: true,
      customer: result.customer,
      message: result.message || 'Customer updated successfully'
    };
  } catch (error) {
    console.error('Error updating Stripe customer:', error);
    throw error;
  }
};

/**
 * Link NetSuite customer to existing Stripe customer
 * @param {string} netsuiteCustomerId - NetSuite customer ID
 * @param {string} stripeCustomerId - Stripe customer ID
 * @returns {Promise<object>} Link result
 */
export const linkNetSuiteCustomer = async (netsuiteCustomerId, stripeCustomerId) => {
  try {
    console.log(`Linking NetSuite customer ${netsuiteCustomerId} to Stripe customer ${stripeCustomerId}`);
    
    const headers = await getAuthHeaders();
    
    const requestBody = {
      netsuiteCustomerId,
      stripeCustomerId
    };
    
    const fetchPromise = fetch(`${API_BASE_URL}/stripe/customer/link`, {
      method: 'POST',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('🔥 STRIPE CUSTOMER LINK ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to link customers');
    }
    
    return {
      success: true,
      message: result.message || 'Customers linked successfully'
    };
  } catch (error) {
    console.error('Error linking customers:', error);
    throw error;
  }
};

// Export all functions
export default {
  createStripeAutopaySubscription,
  getStripeAutopayStatus,
  cancelStripeAutopaySubscription,
  updateStripeAutopayPaymentMethod,
  getBillingSchedules,
  getOrCreateStripeCustomer,
  getStripeCustomer,
  updateStripeCustomer,
  linkNetSuiteCustomer
};