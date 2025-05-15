// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";

// IMPORTANT: Create the context before any exports
const UserContext = createContext(null);

// Create the provider component
const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [signupState, setSignupState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  
  // Use refs to track initialization state
  const initialAuthCheckDone = useRef(false);
  const initialDataLoadDone = useRef(false);
  
  // Function to refresh user progress from backend
  const refreshUserProgress = async (user) => {
    if (!user) return null;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        
        const newSignupState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || "New Member",
          signupStep: userData.signupStep || "account",
          signupProgress: userData.signupProgress || 0,
          signupCompleted: userData.signupCompleted || false,
          lastUpdated: userData.lastUpdated ? userData.lastUpdated.toDate() : new Date(),
          timestamp: Date.now()
        };
        
        // Update state atomically
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        return newSignupState;
      } else {
        // Default signup state if no document exists
        const defaultState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
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
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      try {
        // Mark that we're now handling auth state 
        setIsLoading(true);
        
        if (user) {
          // Set user first - this is important for preventing redirect loops
          setCurrentUser(user);
          
          // Check for just verified state
          const justVerified = localStorage.getItem('just_verified') === 'true';
          const verificationTimestamp = parseInt(localStorage.getItem('verification_timestamp') || '0', 10);
          const isRecentVerification = (Date.now() - verificationTimestamp) < 10000; // 10 seconds
          
          if (justVerified && isRecentVerification) {
            // Create temporary state for just verified users
            const tempState = {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || "New Member",
              signupStep: "success",
              signupProgress: 1,
              timestamp: Date.now()
            };
            
            setSignupState(tempState);
            saveSignupState(tempState);
            
            // No redirect needed here - let components handle it
          } else {
            // Check cache first before backend fetch to reduce loading time
            const cachedState = getSignupState();
            
            if (cachedState && cachedState.userId === user.uid && 
                Date.now() - cachedState.timestamp < 5 * 60 * 1000) {
              setSignupState(cachedState);
            } else {
              await refreshUserProgress(user);
            }
          }
        } else {
          // User is signed out - clear everything at once
          setCurrentUser(null);
          setSignupState(null);
          clearSignupState();
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setError(error.message);
      } finally {
        if (isMounted) {
          initialAuthCheckDone.current = true;
          setAuthResolved(true);
          setIsLoading(false);
        }
      }
    });
    
    // Cleanup subscription
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Central navigation manager - handles all redirects
  useEffect(() => {
    // Only make navigation decisions when auth is resolved and we're not already loading
    if (!authResolved || isLoading) {
      return;
    }
    
    // Set this to trigger a redirect from the navigation component
    setRedirectTo(null); // Reset first
    
    // Now make all navigation decisions in one place
    const path = window.location.pathname;
    const freshSignup = localStorage.getItem('fresh_signup') === 'true';
    
    if (currentUser) {
      // User is logged in
      if (path === '/login' || path === '/') {
        // Don't go to login page if already logged in
        if (signupState?.signupCompleted) {
          setRedirectTo('/member-portal');
        } else {
          setRedirectTo('/signup');
        }
      } else if (path.startsWith('/signup') && signupState?.signupCompleted) {
        // Completed signup users shouldn't be in signup flow
        setRedirectTo('/member-portal');
      }
    } else {
      // User is not logged in
      // FIXED: Allow access to signup if it's a fresh signup
      if ((path.startsWith('/signup') && !freshSignup) ||  
          path === '/member-portal' || 
          path === '/summary') {
        // Protected routes redirect to login
        // But DON'T redirect /signup if there's a fresh_signup flag
        setRedirectTo('/login');
      }
    }
    
    // Special cases for verification
    const justVerified = localStorage.getItem('just_verified') === 'true';
    if (justVerified && currentUser && !path.includes('success')) {
      setRedirectTo('/signup/success');
      // Clear this flag after using it to prevent loop
      localStorage.removeItem('just_verified');
    }
    
  }, [currentUser, signupState, authResolved, isLoading]);
  
  // Manual navigation function
  const navigateTo = (path) => {
    setRedirectTo(path);
  };

  // Context value
  const value = {
    currentUser,
    signupState,
    isLoading,
    error,
    redirectTo,
    authResolved,
    refreshUserProgress: () => refreshUserProgress(currentUser),
    navigateTo
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// IMPORTANT: Export hook and provider separately AFTER context is defined
export const useUser = () => useContext(UserContext);
export { UserProvider };

// Export navigation hook last
export const useAuthNavigation = () => {
  const { redirectTo } = useUser();
  return { redirectTo };
};