// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";

// Create the context
const UserContext = createContext(null);

// Hook for easy access to the context
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [signupState, setSignupState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add debugging
  useEffect(() => {
    console.log("UserContext state updated");
    console.log("Current user:", currentUser?.uid);
    console.log("Signup state:", signupState);
    console.log("Just verified:", localStorage.getItem('just_verified'));
  }, [currentUser, signupState]);
  
  // Function to refresh user progress from backend
  const refreshUserProgress = async () => {
    if (!currentUser) return;
    
    try {
      console.log("Refreshing user progress from backend");
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        console.log("User data from Firestore:", userData);
        
        // Create a signup state object from the user data
        const newSignupState = {
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || userData.displayName || "New Member",
          signupStep: userData.signupStep || "account",
          signupProgress: userData.signupProgress || 0,
          signupCompleted: userData.signupCompleted || false,
          lastUpdated: userData.lastUpdated ? userData.lastUpdated.toDate() : new Date(),
          timestamp: Date.now()
        };
        
        console.log("Created new signup state:", newSignupState);
        
        // Update local state
        setSignupState(newSignupState);
        
        // Save to localStorage
        saveSignupState(newSignupState);
        
        return newSignupState;
      } else {
        console.log("No user document exists yet, creating default state");
        // If no user document exists yet, create a default signup state
        const defaultState = {
          userId: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "New Member",
          signupStep: "account",
          signupProgress: 0,
          signupCompleted: false,
          timestamp: Date.now()
        };
        
        setSignupState(defaultState);
        saveSignupState(defaultState);
        
        return defaultState;
      }
    } catch (error) {
      console.error("Error refreshing user progress:", error);
      setError(error.message);
      return null;
    }
  };
  
  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state change listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log("Auth state changed:", user?.uid);
        setIsLoading(true);
        
        if (user) {
          // User is signed in
          setCurrentUser(user);
          
          // Check if this is right after a verification
          const justVerified = localStorage.getItem('just_verified') === 'true';
          const verificationTimestamp = parseInt(localStorage.getItem('verification_timestamp') || '0', 10);
          const isRecentVerification = (Date.now() - verificationTimestamp) < 10000; // 10 seconds
          
          if (justVerified && isRecentVerification) {
            console.log("Just verified user detected in auth state change");
            
            // For just verified users, set a minimal state to avoid race conditions
            // The AccountSuccessStep will handle the proper database update
            const tempState = {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || "New Member",
              signupStep: "success", // Assume success step for verified users
              signupProgress: 1,     // Step index 1 corresponds to success
              timestamp: Date.now()
            };
            
            console.log("Setting temporary state for just verified user:", tempState);
            setSignupState(tempState);
            saveSignupState(tempState);
            
            // No need to refresh progress right now - AccountSuccessStep will handle it
          } else {
            // Normal flow - check cache first then backend
            console.log("Regular auth state change, checking cache");
            
            // First check for cached signup state
            const cachedState = getSignupState();
            
            if (cachedState && cachedState.userId === user.uid && 
                Date.now() - cachedState.timestamp < 5 * 60 * 1000) { // 5 minutes cache validity
              // Use cached state if recent
              console.log("Using cached state:", cachedState);
              setSignupState(cachedState);
            } else {
              // Otherwise fetch from backend
              console.log("Cache missing or stale, fetching from backend");
              await refreshUserProgress();
            }
          }
        } else {
          // User is signed out
          console.log("User signed out");
          setCurrentUser(null);
          setSignupState(null);
          clearSignupState();
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    });
    
    // Cleanup subscription
    return () => {
      console.log("Cleaning up auth state change listener");
      unsubscribe();
    };
  }, []);

  // Context value
  const value = {
    currentUser,
    signupState,
    isLoading,
    error,
    refreshUserProgress,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};