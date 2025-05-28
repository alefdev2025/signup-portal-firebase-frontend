// File: services/payment.js
import { auth } from './firebase';

// Base URL for API calls
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
const TIMEOUT_MS = 15000;

/**
 * Create a Stripe Payment Intent
 * @param {object} paymentData The payment data
 * @returns {Promise<object>} Payment intent result
 */
export const createPaymentIntent = async (paymentData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to create payment");
    }
    
    const token = await user.getIdToken();
    
    console.log("Creating payment intent:", paymentData);
    
    const fetchPromise = fetch(`${API_BASE_URL}/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: paymentData.amount, // Amount in cents
        currency: paymentData.currency || 'usd',
        paymentFrequency: paymentData.paymentFrequency || 'annually',
        iceCode: paymentData.iceCode || null,
        customerInfo: {
          email: paymentData.customerInfo.email,
          name: paymentData.customerInfo.name,
          phone: paymentData.customerInfo.phone
        }
      })
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create payment intent');
    }
    
    return {
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};

/**
 * Confirm payment and create membership
 * @param {object} confirmationData The payment confirmation data
 * @returns {Promise<object>} Confirmation result
 */
export const confirmPayment = async (confirmationData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to confirm payment");
    }
    
    const token = await user.getIdToken();
    
    console.log("Confirming payment:", confirmationData);
    
    const fetchPromise = fetch(`${API_BASE_URL}/payment/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(confirmationData)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to confirm payment');
    }
    
    return {
      success: true,
      membership: result.membership,
      paymentDetails: result.paymentDetails
    };
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw error;
  }
};

/**
 * Setup SEPA Direct Debit
 * @param {object} sepaData The SEPA setup data
 * @returns {Promise<object>} Setup result
 */
export const setupSepaDebit = async (sepaData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to setup SEPA");
    }
    
    const token = await user.getIdToken();
    
    console.log("Setting up SEPA debit:", sepaData);
    
    const fetchPromise = fetch(`${API_BASE_URL}/payment/setup-sepa`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sepaData)
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to setup SEPA debit');
    }
    
    return {
      success: true,
      setupIntent: result.setupIntent
    };
  } catch (error) {
    console.error("Error setting up SEPA debit:", error);
    throw error;
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
  setupSepaDebit
};