// File: services/payment.js
//import { auth } from './firebase';
import { auth, db } from './firebase';  // Add db import
import { doc, getDoc } from 'firebase/firestore';  // Add Firestore imports

// Base URL for API calls
//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
import { API_BASE_URL } from '../config/api';
const API_URL = `${API_BASE_URL}/api`;
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
    
    const fetchPromise = fetch(`${API_URL}/payment/create-intent`, {
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
    console.log('  - NetSuite Customer ID:', invoicePaymentData.netsuiteCustomerId);
    console.log('  - Payment Method ID:', invoicePaymentData.paymentMethodId);
    console.log('  - Save Payment Method:', invoicePaymentData.savePaymentMethod);
    console.log('  - Setup Future Usage:', invoicePaymentData.setupFutureUsage);
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
        customerId: invoicePaymentData.customerId,
        netsuiteCustomerId: invoicePaymentData.netsuiteCustomerId || ''
      }
    };
    
    // Add NetSuite customer ID if provided
    if (invoicePaymentData.netsuiteCustomerId) {
      requestBody.netsuiteCustomerId = invoicePaymentData.netsuiteCustomerId;
    }
    
    // Add save payment method flag if provided
    if (typeof invoicePaymentData.savePaymentMethod === 'boolean') {
      requestBody.savePaymentMethod = invoicePaymentData.savePaymentMethod;
    }
    
    // Add setup future usage if provided (for autopay enrollment)
    if (invoicePaymentData.setupFutureUsage) {
      requestBody.setupFutureUsage = invoicePaymentData.setupFutureUsage;
    }
    
    console.log('📦 DEBUG - Request body being sent:', JSON.stringify(requestBody, null, 2));
    
    const fetchPromise = fetch(`${API_URL}/invoice-payment/create-invoice-payment`, {
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
    
    console.log('✅ Payment intent created successfully:', {
      paymentIntentId: result.paymentIntentId,
      status: result.status,
      requiresAction: result.requiresAction,
      paymentMethodId: result.paymentMethodId
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create invoice payment intent');
    }
    
    return {
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      requiresAction: result.requiresAction,
      status: result.status,
      paymentMethodId: result.paymentMethodId || invoicePaymentData.paymentMethodId
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
    
    const fetchPromise = fetch(`${API_URL}/payment/confirm`, {
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
    
    const fetchPromise = fetch(`${API_URL}/invoice-payment/confirm-invoice-payment`, {
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
    
    const fetchPromise = fetch(`${API_URL}/payment/setup-sepa`, {
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


// TO SET THOSE FLAGS ON THE CUSTOMER IN NETSUITE INDICATING THEY ARE ON STRIPE AUTOPAY
/**
 * Update Stripe autopay settings for a customer with retry logic
 * @param {string} netsuiteCustomerId - NetSuite customer ID
 * @param {boolean} enabled - Enable/disable autopay
 * @param {object} options - Additional options
 * @returns {Promise<object>} Update result
 */
 export const updateStripeAutopay = async (netsuiteCustomerId, enabled, options = {}) => {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 2000;
  const MAX_DELAY = 30000;
  
  let lastError = null;
  let lastResponse = null;
  
  // Get the Stripe customer ID from Firebase BEFORE the retry loop
  let stripeCustomerId = options.stripeCustomerId;
  
  if (!stripeCustomerId) {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          stripeCustomerId = userData.stripeCustomerId;
          console.log('🎯 Found Stripe Customer ID from Firestore:', stripeCustomerId);
        } else {
          console.log('⚠️ No user document found in Firestore');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching Stripe customer ID from Firestore:', error);
    }
  }
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User must be authenticated to update autopay settings");
      }
      
      const token = await user.getIdToken();
      
      console.log(`🔄 Attempt ${attempt + 1} of ${MAX_RETRIES} for updateStripeAutopay`);
      console.log("Updating Stripe autopay:", { 
        netsuiteCustomerId, 
        enabled, 
        stripeCustomerId,
        options 
      });
      
      const requestBody = {
        enabled,
        syncLegacy: options.syncLegacy || false,  // Changed from updateLegacy
        stripeCustomerId: stripeCustomerId,  // Always include it
        paymentMethodId: options.paymentMethodId || null  // Include if provided
      };
      
      console.log("📤 Request body being sent:", requestBody);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        const response = await fetch(`${API_URL}/netsuite/customers/${netsuiteCustomerId}/stripe/autopay`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // If successful response, return
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Autopay update response:', result);
          
          return {
            success: result.success,
            stripeAutopay: result.stripeAutopay,
            legacyUpdated: result.legacyUpdated,
            message: result.message,
            error: result.error
          };
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
          const waitTime = Math.min(retryAfter * 1000, MAX_DELAY);
          console.log(`⏳ Rate limited. Waiting ${waitTime}ms before retry...`);
          lastResponse = response;
          
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        // Handle server errors that should be retried
        if (response.status >= 500) {
          console.log(`🚨 Server error (${response.status}) - will retry`);
          lastResponse = response;
          
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          lastError = new Error(errorData.error || `Failed to update autopay: ${response.status}`);
          
          if (attempt < MAX_RETRIES - 1) {
            const waitTime = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        // Client errors (4xx except 429) should not be retried
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Failed to update autopay: ${response.status}`);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle timeout specifically
        if (fetchError.name === 'AbortError') {
          console.error(`⏱️ Request timeout after ${TIMEOUT_MS}ms`);
          lastError = new Error('Request timeout - NetSuite may be slow');
          
          if (attempt < MAX_RETRIES - 1) {
            const waitTime = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        } else {
          // Network errors
          console.error(`🌐 Network error:`, fetchError.message);
          lastError = fetchError;
          
          if (attempt < MAX_RETRIES - 1) {
            const waitTime = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
      }
      
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1}:`, error);
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.message.includes("authenticated")) {
        return {
          success: false,
          error: error.message
        };
      }
      
      // For other errors, retry if we have attempts left
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }
  
  // All retries exhausted
  console.error('❌ All retry attempts failed for updateStripeAutopay');
  return {
    success: false,
    error: lastError?.message || 'Failed to update autopay after multiple attempts'
  };
};

  // In services/payment.js
  export const syncStripeCustomerToNetSuite = async (netsuiteCustomerId, stripeCustomerId, paymentMethodId = null) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User must be authenticated");
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/netsuite/customers/${netsuiteCustomerId}/stripe-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stripeCustomerId: stripeCustomerId,
          paymentMethodId: paymentMethodId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to sync: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Failed to sync Stripe customer to NetSuite:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

/**
 * Get Stripe integration status for a customer
 * @param {string} netsuiteCustomerId - NetSuite customer ID
 * @returns {Promise<object>} Stripe integration status
 */
 export const getStripeIntegrationStatus = async (netsuiteCustomerId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated to get Stripe status");
    }
    
    const token = await user.getIdToken();
    
    console.log("Fetching Stripe integration status for customer:", netsuiteCustomerId);
    
    const fetchPromise = fetch(`${API_URL}/netsuite/customers/${netsuiteCustomerId}/stripe`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(errorData.error || `Failed to get Stripe status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Stripe integration status:', result);
    
    return result;
  } catch (error) {
    console.error("Error fetching Stripe integration status:", error);
    throw error;
  }
};

export default {
  createPaymentIntent,
  createInvoicePaymentIntent,
  confirmPayment,
  confirmInvoicePayment,
  setupSepaDebit,
  updateStripeAutopay,
  syncStripeCustomerToNetSuite
};