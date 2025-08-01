// File: services/membership.js - Complete Version
import { auth } from './firebase';

// Base URL for API calls - should be configured through environment variables
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
const TIMEOUT_MS = 15000;

/**
 * Save membership selection data
 * @param {object} membershipData The membership data to save
 * @returns {Promise<object>} Save result
 */
export const saveMembershipSelection = async (membershipData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to save membership information");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Saving membership selection to API:", membershipData);
    
    // Call the backend endpoint with a timeout
    const fetchPromise = fetch(`${API_BASE_URL}/membership/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(membershipData)
    });
    
    // Apply timeout
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
    
    // Check for success in the response
    if (!result.success) {
      throw new Error(result.error || 'Failed to save membership information');
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error saving membership info via API:", error);
    throw error;
  }
};

/**
 * Get user's membership information including package and costs
 * @returns {Promise<object>} Membership information
 */
export const getMembershipInfo = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to get membership information");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Fetching membership info for user");
    
    // Call the backend endpoint with a timeout
    const fetchPromise = fetch(`${API_BASE_URL}/membership/user-info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Apply timeout
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
    
    // Check for success in the response
    if (!result.success) {
      throw new Error(result.error || 'Failed to retrieve membership information');
    }
    
    return {
      success: true,
      data: result.data,
      readyForDocuSign: result.readyForDocuSign // Include this if returned
    };
  } catch (error) {
    console.error("Error getting membership info:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Validate ICE discount code
 * @param {string} iceCode The ICE code to validate
 * @returns {Promise<object>} Validation result
 */
export const validateIceCode = async (iceCode) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to validate ICE code");
    }
    
    const token = await user.getIdToken();
    
    console.log("Validating ICE code:", iceCode);
    
    const fetchPromise = fetch(`${API_BASE_URL}/salesforce/validate-ice-code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ iceCode })
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
    
    if (!result.success || !result.isValid) {
      return {
        valid: false,
        error: result.error || 'Invalid ICE code'
      };
    }
    
    // Return the validation result in the format the component expects
    return {
      valid: result.isValid || result.valid,
      educatorName: result.educatorName,
      discountPercent: result.discountLevel, // Backend now returns percentage directly
      discountAmount: null,
      educatorType: null,
      iceCompensationPercent: null,
      iceCompensationAmount: null,
      error: result.error
    };
  } catch (error) {
    console.error("Error validating ICE code:", error);
    return {
      valid: false,
      error: error.message || 'Failed to validate ICE code'
    };
  }
};

/**
 * Get membership costs and options
 * @returns {Promise<object>} Membership costs
 */
export const getMembershipCosts = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to get membership costs");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Fetching membership costs");
    
    // Call the backend endpoint with a timeout
    const fetchPromise = fetch(`${API_BASE_URL}/membership/costs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Apply timeout
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
    
    // Check for success in the response
    if (!result.success) {
      throw new Error(result.error || 'Failed to retrieve membership costs');
    }
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error("Error getting membership costs:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Validate membership data before submitting
 * @param {object} membershipData The membership data to validate
 * @returns {Promise<object>} Validation result
 */
export const validateMembershipData = async (membershipData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Validating membership data:", membershipData);
    
    // Call the backend endpoint with a timeout
    const fetchPromise = fetch(`${API_BASE_URL}/membership/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(membershipData)
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        errors: errorData.errors || [errorData.error || `Server error: ${response.status}`]
      };
    }
    
    const result = await response.json();
    
    return {
      success: result.success,
      errors: result.errors || []
    };
  } catch (error) {
    console.error("Error validating membership data:", error);
    return { 
      success: false, 
      errors: [error.message] 
    };
  }
};

/**
 * Check membership completion status
 * @returns {Promise<object>} Completion status
 */
export const checkMembershipCompletionStatus = async () => {
  try {
    console.log("Checking membership completion status...");
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/completion-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to check completion status');
    }
    
    console.log("Completion status response:", data);
    return data;
  } catch (error) {
    console.error("Error checking completion status:", error);
    throw error;
  }
};

/**
 * Get detailed DocuSign status
 * @returns {Promise<object>} DocuSign status
 */
export const getDocuSignStatus = async () => {
  try {
    console.log("Getting DocuSign status...");
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/docusign-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get DocuSign status');
    }
    
    console.log("DocuSign status response:", data);
    return data;
  } catch (error) {
    console.error("Error getting DocuSign status:", error);
    throw error;
  }
};

/**
 * Update DocuSign phone number
 * @param {object} phoneData The phone number data
 * @returns {Promise<object>} Update result
 */
export const updateDocuSignPhone = async (phoneData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/update-docusign-phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(phoneData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update phone number');
    }
    
    return result;
  } catch (error) {
    console.error("Error updating phone number:", error);
    throw error;
  }
};

/**
 * Update DocuSign document status
 * @param {string} documentType The document type (membership_agreement or confidentiality_agreement)
 * @param {string} status The status (not_started, in_progress, completed)
 * @param {string} envelopeId The DocuSign envelope ID (optional)
 * @returns {Promise<object>} Update result
 */
export const updateDocuSignStatus = async (documentType, status, envelopeId = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    console.log("Updating DocuSign status:", { documentType, status, envelopeId });
    
    const response = await fetch(`${API_BASE_URL}/membership/update-docusign-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentType,
        status,
        envelopeId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update DocuSign status');
    }
    
    return result;
  } catch (error) {
    console.error("Error updating DocuSign status:", error);
    throw error;
  }
};

/**
 * Update payment status
 * @param {string} status The payment status
 * @param {string} paymentId The payment transaction ID (optional)
 * @param {number} amount The payment amount (optional)
 * @returns {Promise<object>} Update result
 */
export const updatePaymentStatus = async (status, paymentId = null, amount = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    console.log("Updating payment status:", { status, paymentId, amount });
    
    const response = await fetch(`${API_BASE_URL}/membership/update-payment-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        paymentId,
        amount
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update payment status');
    }
    
    return result;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

/**
 * Initiate DocuSign process
 * @param {object} docusignData The data for DocuSign
 * @returns {Promise<object>} DocuSign initiation result
 */
export const initiateDocuSign = async (docusignData = {}) => {
  try {
    console.log("Initiating DocuSign process with data:", docusignData);
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/initiate-docusign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(docusignData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initiate DocuSign');
    }
    
    console.log("DocuSign initiation response:", data);
    return data;
  } catch (error) {
    console.error("Error initiating DocuSign:", error);
    throw error;
  }
};

/**
 * Initiate payment process
 * @param {object} paymentData The payment data
 * @returns {Promise<object>} Payment initiation result
 */
export const initiatePayment = async (paymentData) => {
  try {
    console.log("Initiating payment process with data:", paymentData);
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/initiate-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initiate payment');
    }
    
    console.log("Payment initiation response:", data);
    return data;
  } catch (error) {
    console.error("Error initiating payment:", error);
    throw error;
  }
};

/**
 * Create readyForPayment object when proceeding to payment
 * @returns {Promise<object>} Creation result with payment data
 */
 export const createReadyForPayment = async () => {
  try {
    console.log("Creating readyForPayment object...");
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/create-ready-for-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment data');
    }
    
    console.log("readyForPayment created:", data);
    return data;
  } catch (error) {
    console.error("Error creating readyForPayment:", error);
    throw error;
  }
};

/**
 * Get payment status from readyForPayment object
 * @returns {Promise<object>} Payment status
 */
export const getPaymentStatus = async () => {
  try {
    console.log("Getting payment status...");
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/payment-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get payment status');
    }
    
    console.log("Payment status:", data);
    return data;
  } catch (error) {
    console.error("Error getting payment status:", error);
    throw error;
  }
};

/**
 * Update payment progress
 * @param {string} status The payment status
 * @param {object} paymentData Additional payment data
 * @returns {Promise<object>} Update result
 */
export const updatePaymentProgress = async (status, paymentData = {}) => {
  try {
    console.log("Updating payment progress:", { status, ...paymentData });
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/update-payment-progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        ...paymentData
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update payment progress');
    }
    
    console.log("Payment progress updated:", data);
    return data;
  } catch (error) {
    console.error("Error updating payment progress:", error);
    throw error;
  }
};

/**
 * Create Salesforce contact after DocuSign completion
 * @returns {Promise<object>} Salesforce contact creation result
 */
 export const createSalesforceContact = async () => {
  try {
    console.log("Creating Salesforce contact...");
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/create-salesforce-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create Salesforce contact');
    }
    
    console.log("Salesforce contact creation response:", data);
    return data;
  } catch (error) {
    console.error("Error creating Salesforce contact:", error);
    throw error;
  }
};

/**
 * Get Salesforce contact status
 * @returns {Promise<object>} Salesforce status
 */
export const getSalesforceStatus = async () => {
  try {
    console.log("Getting Salesforce status...");
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/salesforce-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get Salesforce status');
    }
    
    console.log("Salesforce status:", data);
    return data;
  } catch (error) {
    console.error("Error getting Salesforce status:", error);
    throw error;
  }
};


export const getReadyForDocuSign = async () => {
  try {
    console.log("Getting readyForDocuSign data...");
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be authenticated");
    }
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/ready-for-docusign`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get readyForDocuSign data');
    }
    
    console.log("readyForDocuSign data retrieved successfully");
    return data;
  } catch (error) {
    console.error("Error getting readyForDocuSign:", error);
    return {
      success: false,
      error: error.message || 'Failed to get readyForDocuSign data'
    };
  }
};

// Default export with all functions
export default {
  saveMembershipSelection,
  getMembershipInfo,
  validateIceCode,
  getMembershipCosts,
  validateMembershipData,
  checkMembershipCompletionStatus,
  getDocuSignStatus,
  initiateDocuSign,
  initiatePayment,
  updateDocuSignPhone,
  updateDocuSignStatus,
  updatePaymentStatus,
  createReadyForPayment,
  getPaymentStatus,
  updatePaymentProgress,
  createSalesforceContact,
  getSalesforceStatus,
  getReadyForDocuSign
};