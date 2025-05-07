// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/auth';
import { onAuthStateChanged } from 'firebase/auth';

// Create context
const UserContext = createContext();

// Local storage keys
const SIGNUP_STATE_KEY = "alcor_signup_state";
const VERIFICATION_STATE_KEY = "alcor_verification_state";

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
  localStorage.removeItem(VERIFICATION_STATE_KEY);
};

export const saveVerificationState = (data) => {
  localStorage.setItem(VERIFICATION_STATE_KEY, JSON.stringify(data));
};

export const getVerificationState = () => {
  const state = localStorage.getItem(VERIFICATION_STATE_KEY);
  return state ? JSON.parse(state) : null;
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
      {children}
    </UserContext.Provider>
  );
}

// Custom hook
export function useUser() {
  return useContext(UserContext);
}