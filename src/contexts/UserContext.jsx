// src/contexts/UserContext.jsx - Update this file
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase'; // Changed to import from firebase.js
import { onAuthStateChanged } from 'firebase/auth';
import { 
  saveSignupState, getSignupState, clearSignupState,
  saveVerificationState, getVerificationState, clearVerificationState,
  saveFormData, getFormData, getStepFormData, clearFormData,
  isVerificationValid, initializeFreshSignup,
  addToNavigationHistory, getPreviousPath
} from '../services/storage'; // Import from storage.js instead

// Create context
const UserContext = createContext();

// Re-export all the localStorage functions for backward compatibility
export {
  saveSignupState, getSignupState, clearSignupState,
  saveVerificationState, getVerificationState, clearVerificationState,
  saveFormData, getFormData, getStepFormData, clearFormData,
  isVerificationValid, initializeFreshSignup,
  addToNavigationHistory, getPreviousPath
};

// Provider component - REMOVE the conditional rendering
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signupState, setSignupState] = useState(null);
  
  // Effect to listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed", user ? "User authenticated" : "No user");
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
        console.log("Found saved signup state");
        setSignupState(savedState);
      }
      
      return () => {
        console.log("Cleaning up auth state listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("Error in auth state setup:", error);
      // Ensure loading is set to false even on error
      setLoading(false);
    }
  }, []);
  
  // Value object
  const value = {
    currentUser,
    signupState,
    setSignupState,
    loading
  };
  
  console.log("UserProvider rendering, loading:", loading);
  
  // IMPORTANT: Return children unconditionally instead of conditional rendering
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook with error handling
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    console.error("useUser must be used within a UserProvider");
    // Return a dummy object to prevent crashes
    return { currentUser: null, loading: false, signupState: null };
  }
  return context;
}