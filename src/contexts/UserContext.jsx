// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/auth';
import { onAuthStateChanged } from 'firebase/auth';

// Create context
const UserContext = createContext();

// Local storage keys
const SIGNUP_STATE_KEY = "alcor_signup_state";
const VERIFICATION_STATE_KEY = "alcor_verification_state";
const FORM_DATA_KEY = "alcor_form_data";

// Helper functions for localStorage
export const saveSignupState = (state) => {
  localStorage.setItem(SIGNUP_STATE_KEY, JSON.stringify(state));
};

export const getSignupState = () => {
  const state = localStorage.getItem(SIGNUP_STATE_KEY);
  return state ? JSON.parse(state) : null;
};

export const clearSignupState = () => {
  localStorage.removeItem(SIGNUP_STATE_KEY);
};

// Modified to NOT store password in localStorage
export const saveVerificationState = (data) => {
  // Extract password from the data object to avoid storing it
  const { password, ...safeData } = data;
  
  // Only store safe data without password
  localStorage.setItem(VERIFICATION_STATE_KEY, JSON.stringify({
    ...safeData,
    timestamp: Date.now() // Add timestamp for expiration checks
  }));
};

export const getVerificationState = () => {
  const state = localStorage.getItem(VERIFICATION_STATE_KEY);
  return state ? JSON.parse(state) : null;
};

export const clearVerificationState = () => {
  localStorage.removeItem(VERIFICATION_STATE_KEY);
};

// Form data functions
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

// Function to check if verification is still valid
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

// Add this function to ensure fresh signup state
export const initializeFreshSignup = () => {
  try {
    // Check if we have a fresh signup flag
    const freshSignup = localStorage.getItem('fresh_signup');
    
    if (freshSignup === 'true') {
      // Clear the flag
      localStorage.removeItem('fresh_signup');
      
      // Make sure all signup-related state is cleared
      localStorage.removeItem(SIGNUP_STATE_KEY);
      localStorage.removeItem(VERIFICATION_STATE_KEY);
      localStorage.removeItem(FORM_DATA_KEY);
      localStorage.removeItem('account_creation_success'); // Add this line
      
      console.log("Fresh signup initialized");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error initializing fresh signup:", error);
    return false;
  }
};

// Simple navigation history tracking
export const addToNavigationHistory = (path) => {
  try {
    const history = JSON.parse(localStorage.getItem('navigation_history') || '[]');
    // Don't add duplicate entries
    if (history.length === 0 || history[history.length - 1] !== path) {
      // Keep the last 20 entries
      const newHistory = [...history, path].slice(-20);
      localStorage.setItem('navigation_history', JSON.stringify(newHistory));
    }
  } catch (error) {
    console.error("Error adding to navigation history:", error);
  }
};

export const getPreviousPath = () => {
  try {
    const history = JSON.parse(localStorage.getItem('navigation_history') || '[]');
    if (history.length <= 1) return "/";
    return history[history.length - 2];
  } catch (error) {
    console.error("Error getting previous path:", error);
    return "/";
  }
};

// Provider component
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupState, setSignupState] = useState(null);
  
  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // If user signed out, clear signup state
      if (!user) {
        setSignupState(null);
      }
    });
    
    // Load saved signup state if available
    const savedState = getSignupState();
    if (savedState) {
      setSignupState(savedState);
    }
    
    return () => unsubscribe();
  }, []);
  
  // Value object
  const value = {
    currentUser,
    signupState,
    setSignupState,
    loading
  };
  
  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
}

// Custom hook
export function useUser() {
  return useContext(UserContext);
}