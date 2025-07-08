// File: services/payment.js
import { auth } from './firebase';

// Base URL for API calls
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
const TIMEOUT_MS = 15000;


const getCurrencyCode = (invoiceCurrency) => {
  const currencyMap = {
    'USA': 'usd',
    'USD': 'usd',
    'US': 'usd',
    'EUR': 'eur',
    'GBP': 'gbp',
    'CAD': 'cad',
    'AUD': 'aud'
  };
  return currencyMap[invoiceCurrency] || 'usd';
};

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
    
    // Build request body conditionally
    const requestBody = {
      amount: paymentData.amount, // Amount in cents
      currency: paymentData.currency || 'usd',
      paymentFrequency: paymentData.paymentFrequency || 'annually',
      paymentMethodId: paymentData.paymentMethodId,
      customerInfo: {
        email: paymentData.customerInfo.email,
        name: paymentData.customerInfo.name,
        phone: paymentData.customerInfo.phone || null
      }
    };

    // Add metadata if provided (for invoice payments)
    if (paymentData.metadata) {
      requestBody.metadata = paymentData.metadata;
    }

    // Only include iceCode if it has a value
    if (paymentData.iceCode && paymentData.iceCode.trim() !== '') {
      requestBody.iceCode = paymentData.iceCode;
    }
    
    const fetchPromise = fetch(`${API_BASE_URL}/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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
      console.log('🔥 BACKEND ERROR RESPONSE:', errorData);
      console.log('🔥 STATUS:', response.status);
      console.log('🔥 ERROR DETAILS:', errorData.details);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create payment intent');
    }
    
    return {
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      requiresAction: result.requiresAction,
      status: result.status
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
};

// Fixed createInvoicePaymentIntent function
export const createInvoicePaymentIntent = async (invoicePaymentData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to create payment");
    }
    
    const token = await user.getIdToken();
    
    console.log("Creating invoice payment intent:", invoicePaymentData);
    
    // Add detailed logging
    console.log('🔍 DEBUG - Invoice Payment Data Details:');
    console.log('  - Amount:', invoicePaymentData.amount, '(cents)');
    console.log('  - Currency:', invoicePaymentData.currency);
    console.log('  - Invoice ID:', invoicePaymentData.invoiceId);
    console.log('  - Invoice Number:', invoicePaymentData.invoiceNumber);
    console.log('  - Customer ID:', invoicePaymentData.customerId);
    console.log('  - Payment Method ID:', invoicePaymentData.paymentMethodId);
    console.log('  - Customer Info:');
    console.log('    - Email:', invoicePaymentData.customerInfo?.email);
    console.log('    - Name:', invoicePaymentData.customerInfo?.name);
    
    const requestBody = {
      amount: invoicePaymentData.amount, // Amount in cents
      currency: getCurrencyCode(invoicePaymentData.currency), // FIXED: Changed from 'invoice.currency' to 'invoicePaymentData.currency'
      paymentMethodId: invoicePaymentData.paymentMethodId,
      invoiceId: invoicePaymentData.invoiceId,
      invoiceNumber: invoicePaymentData.invoiceNumber,
      customerId: invoicePaymentData.customerId, // ADDED: Include customerId in main body
      customerInfo: {
        email: invoicePaymentData.customerInfo.email,
        name: invoicePaymentData.customerInfo.name
      },
      metadata: {
        type: 'invoice_payment',
        invoiceId: invoicePaymentData.invoiceId,
        invoiceNumber: invoicePaymentData.invoiceNumber,
        customerId: invoicePaymentData.customerId
      }
    };
    
    console.log('📦 DEBUG - Request body being sent:', JSON.stringify(requestBody, null, 2));
    
    const fetchPromise = fetch(`${API_BASE_URL}/invoice-payment/create-invoice-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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
      
      console.log('❌ BACKEND ERROR RESPONSE:', errorData);
      console.log('❌ STATUS:', response.status);
      console.log('❌ ERROR DETAILS:', errorData.details);
      
      // Log specific validation errors
      if (errorData.details && Array.isArray(errorData.details)) {
        console.log('❌ VALIDATION ERRORS:');
        errorData.details.forEach((err, index) => {
          console.log(`  ${index + 1}. Field: ${err.param || err.path}`);
          console.log(`     Message: ${err.msg || err.message}`);
          console.log(`     Value: ${err.value}`);
        });
      }
      
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invoice payment intent');
    }
    
    return {
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      requiresAction: result.requiresAction
    };
  } catch (error) {
    console.error("Error creating invoice payment intent:", error);
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
 * Confirm invoice payment and update NetSuite
 * @param {object} confirmationData The invoice payment confirmation data
 * @returns {Promise<object>} Confirmation result
 */
export const confirmInvoicePayment = async (confirmationData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to confirm payment");
    }
    
    const token = await user.getIdToken();
    
    console.log("Confirming invoice payment:", confirmationData);
    
    const fetchPromise = fetch(`${API_BASE_URL}/invoice-payment/confirm-invoice-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentIntentId: confirmationData.paymentIntentId,
        invoiceId: confirmationData.invoiceId,
        amount: confirmationData.amount,
        paymentDate: confirmationData.paymentDate || new Date().toISOString()
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
      throw new Error(result.error || 'Failed to confirm invoice payment');
    }
    
    return {
      success: true,
      paymentRecord: result.paymentRecord,
      invoiceStatus: result.invoiceStatus
    };
  } catch (error) {
    console.error("Error confirming invoice payment:", error);
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
  createInvoicePaymentIntent,
  confirmPayment,
  confirmInvoicePayment,
  setupSepaDebit
};