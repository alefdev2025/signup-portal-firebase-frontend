// File: services/paymentMethods.js
// Add this as a new file or add these functions to your existing payment.js service

import { auth } from './firebase';

// Base URL for API calls
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
const TIMEOUT_MS = 15000;

/**
 * Get all payment methods for the current user
 */
export const getPaymentMethods = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch payment methods');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
};

/**
 * Create a setup intent for adding a new payment method
 */
export const createPaymentMethodSetupIntent = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/setup-intent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create setup intent');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating setup intent:", error);
    throw error;
  }
};

/**
 * Attach a payment method after successful setup
 */
export const attachPaymentMethod = async (paymentMethodId, setAsDefault = false) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethodId,
        setAsDefault
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to attach payment method');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error attaching payment method:", error);
    throw error;
  }
};

/**
 * Set a payment method as default
 */
export const setDefaultPaymentMethod = async (paymentMethodId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/set-default/${paymentMethodId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set default payment method');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error setting default payment method:", error);
    throw error;
  }
};

/**
 * Remove a payment method
 */
export const removePaymentMethod = async (paymentMethodId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/${paymentMethodId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove payment method');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error removing payment method:", error);
    throw error;
  }
};

/**
 * Update auto-pay settings
 */
export const updateAutoPaySettings = async (settings) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/autopay-settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update auto-pay settings');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error updating auto-pay settings:", error);
    throw error;
  }
};

export const savePaymentMethod = async (paymentMethodData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/paymentMethods/save-payment-method`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethodId: paymentMethodData.paymentMethodId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save payment method');
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error("Error saving payment method:", error);
    return { success: false, error: error.message };
  }
};