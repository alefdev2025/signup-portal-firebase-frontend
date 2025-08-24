// File: services/funding.js
import { auth } from './firebase';

// Base URL for API calls - should be configured through environment variables
//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
import { API_BASE_URL } from '../config/api';
const API_URL = `${API_BASE_URL}/api`;
const TIMEOUT_MS = 15000;

export const saveFundingSelection = async (fundingData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("User must be authenticated to save funding information");
      }
      
      // Get the Firebase ID token for authentication
      const token = await user.getIdToken();
      
      console.log("Saving funding selection to API:", fundingData);
      
      // Call the CORRECT backend endpoint
      const fetchPromise = fetch(`${API_URL}/funding/save`, { // Changed from update-funding to save
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fundingData)
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
        throw new Error(result.error || 'Failed to save funding information');
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error saving funding info via API:", error);
      throw error;
    }
  };

export const getPackageInfoForFunding = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("User must be authenticated to get package information");
      }
      
      // Get the Firebase ID token for authentication
      const token = await user.getIdToken();
      
      console.log("Fetching package info for funding options");
      
      // Call the CORRECT backend endpoint
      const fetchPromise = fetch(`${API_URL}/funding/user-package`, { // This is correct
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
        throw new Error(result.error || 'Failed to retrieve package information');
      }
      
      return {
        success: true,
        packageType: result.packageType,
        preservationType: result.preservationType,
        preservationEstimate: result.preservationEstimate,
        annualCost: result.cost  // Note: The backend returns 'cost', not 'annualCost'
      };
    } catch (error) {
      console.error("Error getting package info for funding:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

/**
 * Validate funding data before submitting
 * @param {object} fundingData The funding data to validate
 * @returns {Promise<object>} Validation result
 */
export const validateFundingData = async (fundingData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Validating funding data:", fundingData);
    
    // Call the backend endpoint with a timeout
    const fetchPromise = fetch(`${API_URL}/funding/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fundingData)
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
    console.error("Error validating funding data:", error);
    return { 
      success: false, 
      errors: [error.message] 
    };
  }
};

// Add this function to services/funding.js

/**
 * Get user's funding information including selection and package data
 * @returns {Promise<object>} Funding information
 */
 export const getUserFundingInfo = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to get funding information");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Fetching user's funding info");
    
    // Call the backend endpoint
    const fetchPromise = fetch(`${API_URL}/funding/user-info`, {
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
      throw new Error(result.error || 'Failed to retrieve funding information');
    }
    
    // The backend returns data.fundingInfo
    return {
      success: true,
      data: result.data?.fundingInfo || null,
      packageInfo: result.data?.packageInfo || null
    };
  } catch (error) {
    console.error("Error getting user funding info:", error);
    return { 
      success: false, 
      error: error.message,
      data: null
    };
  }
};

// Update the export default at the bottom:
export default {
  saveFundingSelection,
  getPackageInfoForFunding,
  validateFundingData,
  getUserFundingInfo  // Add this line
};
