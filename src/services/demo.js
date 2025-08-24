// File: services/demo.js
// Base URL for API calls
//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api';
import { API_BASE_URL } from '../config/api';
const API_URL = `${API_BASE_URL}/api`;
const TIMEOUT_MS = 15000;

/**
 * Validate demo password
 * @param {string} password The demo password to validate
 * @returns {Promise<object>} Validation result
 */
export const validateDemoPassword = async (password) => {
  try {
    console.log("Validating demo password");
    
    const requestBody = {
      password: password
    };
    
    const fetchPromise = fetch(`${API_URL}/demo/validate-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important: include cookies for session
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
      console.log('🔥 DEMO AUTH ERROR RESPONSE:', errorData);
      console.log('🔥 STATUS:', response.status);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to validate demo password');
    }
    
    return {
      success: true,
      authenticated: result.authenticated,
      message: result.message
    };
  } catch (error) {
    console.error("Error validating demo password:", error);
    throw error;
  }
};

/**
 * Check if user is authenticated for demo access
 * @returns {Promise<object>} Authentication status
 */
export const checkDemoAuth = async () => {
  try {
    console.log("Checking demo authentication status");
    
    const fetchPromise = fetch(`${API_URL}/demo/check-auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Important: include cookies for session
    });
    
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS)
      )
    ]);
    
    if (!response.ok) {
      // For auth check, 401 is expected when not authenticated
      if (response.status === 401) {
        return {
          success: false,
          authenticated: false,
          message: 'Not authenticated'
        };
      }
      
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.log('🔥 DEMO AUTH CHECK ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      authenticated: result.authenticated,
      message: result.message
    };
  } catch (error) {
    console.error("Error checking demo authentication:", error);
    throw error;
  }
};

/**
 * Logout from demo session
 * @returns {Promise<object>} Logout result
 */
export const logoutDemo = async () => {
  try {
    console.log("Logging out of demo session");
    
    const fetchPromise = fetch(`${API_URL}/demo/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Important: include cookies for session
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
      console.log('🔥 DEMO LOGOUT ERROR:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: result.message || 'Logged out successfully'
    };
  } catch (error) {
    console.error("Error logging out of demo:", error);
    throw error;
  }
};

export default {
  validateDemoPassword,
  checkDemoAuth,
  logoutDemo
};