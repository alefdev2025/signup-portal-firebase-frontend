// File: services/membership.js
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
      data: result.data
    };
  } catch (error) {
    console.error("Error getting membership info:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

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
      // These fields aren't returned by backend anymore, set defaults:
      educatorType: null,
      discountAmount: null,
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

// In services/membership.js, update all the new methods to remove the extra /api:

const checkMembershipCompletionStatus = async () => {
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

const initiateDocuSign = async (docusignData) => {
  try {
    console.log("Initiating DocuSign process with data:", docusignData);
    const token = await auth.currentUser?.getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/membership/initiate-docusign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(docusignData)  // Pass the phone number and other data
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

const checkDocuSignStatus = async () => {
  try {
    console.log("Checking DocuSign status...");
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
      throw new Error(data.error || 'Failed to check DocuSign status');
    }
    
    console.log("DocuSign status response:", data);
    return data;
  } catch (error) {
    console.error("Error checking DocuSign status:", error);
    throw error;
  }
};

const initiatePayment = async (paymentData) => {
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

export default {
  saveMembershipSelection,
  getMembershipInfo,
  validateIceCode,
  getMembershipCosts,
  validateMembershipData,
  checkMembershipCompletionStatus,
  initiateDocuSign,
  checkDocuSignStatus,
  initiatePayment
};