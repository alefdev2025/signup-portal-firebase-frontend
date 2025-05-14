// src/services/storage.js

// Local storage keys
const SIGNUP_STATE_KEY = "alcor_signup_state";
const VERIFICATION_STATE_KEY = "alcor_verification_state";
const FORM_DATA_KEY = "alcor_form_data";
const NAVIGATION_HISTORY_KEY = "navigation_history";
const ACCOUNT_CREATION_SUCCESS_KEY = "account_creation_success";
const FRESH_SIGNUP_KEY = "fresh_signup";
const FORCE_STEP_KEY = "force_active_step";
const FORCE_TIMESTAMP_KEY = "force_timestamp";

// ===== Signup State =====
export const saveSignupState = (state) => {
  try {
    localStorage.setItem(SIGNUP_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Error saving signup state:", error);
    return false;
  }
};

export const getSignupState = () => {
  try {
    const state = localStorage.getItem(SIGNUP_STATE_KEY);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error("Error getting signup state:", error);
    return null;
  }
};

export const clearSignupState = () => {
  try {
    localStorage.removeItem(SIGNUP_STATE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing signup state:", error);
    return false;
  }
};

// ===== Verification State =====
export const saveVerificationState = (data) => {
  try {
    // Extract password from the data object to avoid storing it
    const { password, ...safeData } = data;
    
    // Only store safe data without password
    localStorage.setItem(VERIFICATION_STATE_KEY, JSON.stringify({
      ...safeData,
      timestamp: Date.now() // Add timestamp for expiration checks
    }));
    return true;
  } catch (error) {
    console.error("Error saving verification state:", error);
    return false;
  }
};

export const getVerificationState = () => {
  try {
    const state = localStorage.getItem(VERIFICATION_STATE_KEY);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error("Error getting verification state:", error);
    return null;
  }
};

export const clearVerificationState = () => {
  try {
    localStorage.removeItem(VERIFICATION_STATE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing verification state:", error);
    return false;
  }
};

export const isVerificationValid = () => {
  try {
    const state = getVerificationState();
    if (!state) return false;
    
    const now = Date.now();
    const stateAge = now - (state.timestamp || 0);
    const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    return stateAge < maxAge;
  } catch (error) {
    console.error("Error checking verification validity:", error);
    return false;
  }
};

// ===== Form Data =====
export const saveFormData = (stepName, data) => {
  try {
    // Get existing form data
    const existingData = getFormData();
    
    // Update data for the specified step
    const updatedData = {
      ...existingData,
      [stepName]: {
        ...existingData[stepName],
        ...data,
        lastUpdated: Date.now()
      }
    };
    
    // Save to localStorage
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updatedData));
    
    return true;
  } catch (error) {
    console.error("Error saving form data:", error);
    return false;
  }
};

export const getFormData = () => {
  try {
    const data = localStorage.getItem(FORM_DATA_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error getting form data:", error);
    return {};
  }
};

export const getStepFormData = (stepName) => {
  try {
    const allData = getFormData();
    return allData[stepName] || {};
  } catch (error) {
    console.error("Error getting step form data:", error);
    return {};
  }
};

export const clearFormData = () => {
  try {
    localStorage.removeItem(FORM_DATA_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing form data:", error);
    return false;
  }
};

// ===== Account Creation Status =====
export const setAccountCreated = (value = true) => {
  try {
    localStorage.setItem(ACCOUNT_CREATION_SUCCESS_KEY, value ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error("Error setting account creation status:", error);
    return false;
  }
};

export const isAccountCreated = () => {
  try {
    return localStorage.getItem(ACCOUNT_CREATION_SUCCESS_KEY) === 'true';
  } catch (error) {
    console.error("Error checking account creation status:", error);
    return false;
  }
};

// ===== Navigation History =====
export const addToNavigationHistory = (path) => {
  try {
    const history = JSON.parse(localStorage.getItem(NAVIGATION_HISTORY_KEY) || '[]');
    // Don't add duplicate entries
    if (history.length === 0 || history[history.length - 1] !== path) {
      // Keep the last 20 entries
      const newHistory = [...history, path].slice(-20);
      localStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(newHistory));
    }
    return true;
  } catch (error) {
    console.error("Error adding to navigation history:", error);
    return false;
  }
};

export const getPreviousPath = () => {
  try {
    const history = JSON.parse(localStorage.getItem(NAVIGATION_HISTORY_KEY) || '[]');
    if (history.length <= 1) return "/";
    return history[history.length - 2];
  } catch (error) {
    console.error("Error getting previous path:", error);
    return "/";
  }
};

// ===== Fresh Signup =====
export const initializeFreshSignup = () => {
  try {
    // Check if we have a fresh signup flag
    const freshSignup = localStorage.getItem(FRESH_SIGNUP_KEY);
    
    if (freshSignup === 'true') {
      // Clear the flag
      localStorage.removeItem(FRESH_SIGNUP_KEY);
      
      // Make sure all signup-related state is cleared
      clearSignupState();
      clearVerificationState();
      clearFormData();
      setAccountCreated(false);
      
      console.log("Fresh signup initialized");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error initializing fresh signup:", error);
    return false;
  }
};

export const setFreshSignup = (value = true) => {
  try {
    localStorage.setItem(FRESH_SIGNUP_KEY, value ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error("Error setting fresh signup flag:", error);
    return false;
  }
};

// ===== Forced Step Navigation =====
// Used for bypassing progressive navigation checks

/**
 * Set forced navigation to a specific step
 * @param {number} stepIndex The step index to force navigation to
 * @returns {boolean} Success status
 */
export const setForceNavigation = (stepIndex) => {
  try {
    localStorage.setItem(FORCE_STEP_KEY, stepIndex.toString());
    localStorage.setItem(FORCE_TIMESTAMP_KEY, Date.now().toString());
    return true;
  } catch (error) {
    console.error("Error setting force navigation:", error);
    return false;
  }
};

/**
 * Clear forced navigation settings
 * @returns {boolean} Success status
 */
export const clearForceNavigation = () => {
  try {
    localStorage.removeItem(FORCE_STEP_KEY);
    localStorage.removeItem(FORCE_TIMESTAMP_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing force navigation:", error);
    return false;
  }
};

/**
 * Check if a forced navigation is currently active
 * @returns {Object|null} The force navigation info or null if not active
 */
export const getForceNavigation = () => {
  try {
    const step = localStorage.getItem(FORCE_STEP_KEY);
    const timestamp = localStorage.getItem(FORCE_TIMESTAMP_KEY);
    
    if (!step || !timestamp) return null;
    
    // Check if the timestamp is recent (within 5 seconds)
    const now = Date.now();
    const isRecent = (now - parseInt(timestamp, 10)) < 5000;
    
    if (!isRecent) {
      clearForceNavigation();
      return null;
    }
    
    return {
      step: parseInt(step, 10),
      timestamp: parseInt(timestamp, 10)
    };
  } catch (error) {
    console.error("Error getting force navigation:", error);
    return null;
  }
};

// ===== Utility Functions =====

/**
 * Map a step name to its index in the signup flow
 * @param {string} stepName The step name
 * @returns {number} The step index
 */
export const getStepIndexByName = (stepName) => {
  const stepMap = {
    "account": 0,
    "success": 1,
    "contact_info": 2,
    "package": 3,
    "funding": 4,
    "membership": 5
  };
  
  return stepMap[stepName] !== undefined ? stepMap[stepName] : 0;
};

/**
 * Map a step index to its path in the new route structure
 * @param {number} index The step index
 * @returns {string} The route path
 */
export const getStepPathByIndex = (index) => {
  const pathMap = [
    "", // account = /signup
    "/success", // success = /signup/success
    "/contact", // contact_info = /signup/contact
    "/package", // package = /signup/package
    "/funding", // funding = /signup/funding
    "/membership" // membership = /signup/membership
  ];
  
  return index >= 0 && index < pathMap.length ? pathMap[index] : "";
};

/**
 * Clear all signup-related data
 * Useful when logging out or starting fresh
 */
export const clearAllSignupData = () => {
  clearSignupState();
  clearVerificationState();
  clearFormData();
  clearForceNavigation();
  setAccountCreated(false);
  // Don't clear navigation history as it might be useful for other parts of the app
};