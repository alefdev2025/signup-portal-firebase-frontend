// src/contexts/UserContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false); // Synchronous request
    xhr.send(`[USER CONTEXT] ${message}`);
    console.log(`[USER CONTEXT] ${message}`); // Also log to console
  } catch (e) {
    // Ignore errors
  }
};

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
  
  LOG_TO_TERMINAL("UserProvider initialized");
  
  // Function to refresh user progress from backend
  const refreshUserProgress = async (user) => {
    if (!user) {
      LOG_TO_TERMINAL("refreshUserProgress called with no user, returning null");
      return null;
    }
    
    LOG_TO_TERMINAL(`Refreshing user progress for uid: ${user.uid}`);
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      LOG_TO_TERMINAL(`Fetching user document from Firestore: users/${user.uid}`);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        LOG_TO_TERMINAL("User document exists in Firestore");
        const userData = userSnapshot.data();
        LOG_TO_TERMINAL(`User data from Firestore: ${JSON.stringify({
          signupStep: userData.signupStep || "account",
          signupProgress: userData.signupProgress || 0,
          signupCompleted: userData.signupCompleted || false,
        })}`);
        
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
        
        LOG_TO_TERMINAL(`Setting new signup state: ${JSON.stringify({
          userId: newSignupState.userId,
          email: newSignupState.email,
          signupStep: newSignupState.signupStep,
          signupProgress: newSignupState.signupProgress,
          signupCompleted: newSignupState.signupCompleted,
        })}`);
        
        // Update state atomically
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        return newSignupState;
      } else {
        LOG_TO_TERMINAL("User document does not exist in Firestore, using defaults");
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
        
        LOG_TO_TERMINAL(`Setting default signup state: ${JSON.stringify({
          userId: defaultState.userId,
          email: defaultState.email,
          signupStep: defaultState.signupStep,
          signupProgress: defaultState.signupProgress,
          signupCompleted: defaultState.signupCompleted,
        })}`);
        
        setSignupState(defaultState);
        saveSignupState(defaultState);
        return defaultState;
      }
    } catch (error) {
      LOG_TO_TERMINAL(`Error refreshing user progress: ${error.message}`);
      console.error("Error refreshing user progress:", error);
      setError(error.message);
      return null;
    }
  };
  
  // Listen for auth state changes
  useEffect(() => {
    LOG_TO_TERMINAL("Setting up auth state change listener");
    
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        LOG_TO_TERMINAL("Component unmounted, skipping auth state update");
        return;
      }
      
      LOG_TO_TERMINAL(`Auth state changed, user: ${user ? user.uid : 'null'}`);
      
      try {
        // Mark that we're now handling auth state 
        setIsLoading(true);
        LOG_TO_TERMINAL("Setting isLoading to true while processing auth state");
        
        if (user) {
          LOG_TO_TERMINAL(`User is signed in: ${user.uid}, email: ${user.email}`);
          // Set user first - this is important for preventing redirect loops
          setCurrentUser(user);
          
          // Check for just verified state
          const justVerified = localStorage.getItem('just_verified') === 'true';
          const verificationTimestamp = parseInt(localStorage.getItem('verification_timestamp') || '0', 10);
          const isRecentVerification = (Date.now() - verificationTimestamp) < 10000; // 10 seconds
          
          LOG_TO_TERMINAL(`Just verified: ${justVerified}, Recent verification: ${isRecentVerification}, Time diff: ${Date.now() - verificationTimestamp}ms`);
          
          if (justVerified && isRecentVerification) {
            LOG_TO_TERMINAL("User was just verified, creating temporary signup state");
            // Create temporary state for just verified users
            const tempState = {
              userId: user.uid,
              email: user.email,
              displayName: user.displayName || "New Member",
              signupStep: "success",
              signupProgress: 1,
              timestamp: Date.now()
            };
            
            LOG_TO_TERMINAL(`Setting temporary state: ${JSON.stringify({
              userId: tempState.userId,
              email: tempState.email,
              signupStep: tempState.signupStep,
              signupProgress: tempState.signupProgress,
            })}`);
            
            setSignupState(tempState);
            saveSignupState(tempState);
            
            // No redirect needed here - let components handle it
          } else {
            LOG_TO_TERMINAL("Checking for cached signup state");
            // Check cache first before backend fetch to reduce loading time
            const cachedState = getSignupState();
            
            const cacheValid = cachedState && 
                              cachedState.userId === user.uid && 
                              Date.now() - cachedState.timestamp < 5 * 60 * 1000;
            
            LOG_TO_TERMINAL(`Cache exists: ${Boolean(cachedState)}, Cache valid: ${cacheValid}`);
            
            if (cacheValid) {
              LOG_TO_TERMINAL(`Using cached state: ${JSON.stringify({
                userId: cachedState.userId,
                email: cachedState.email,
                signupStep: cachedState.signupStep,
                signupProgress: cachedState.signupProgress,
                signupCompleted: cachedState.signupCompleted,
                timestamp: cachedState.timestamp,
                age: Date.now() - cachedState.timestamp
              })}`);
              
              setSignupState(cachedState);
            } else {
              LOG_TO_TERMINAL("Cache invalid or expired, fetching fresh data from backend");
              await refreshUserProgress(user);
            }
          }
        } else {
          LOG_TO_TERMINAL("User is signed out, clearing state");
          // User is signed out - clear everything at once
          setCurrentUser(null);
          setSignupState(null);
          clearSignupState();
        }
      } catch (error) {
        LOG_TO_TERMINAL(`Error in auth state change: ${error.message}`);
        console.error("Error in auth state change:", error);
        setError(error.message);
      } finally {
        if (isMounted) {
          initialAuthCheckDone.current = true;
          LOG_TO_TERMINAL("Initial auth check completed");
          
          setAuthResolved(true);
          LOG_TO_TERMINAL("Auth resolved set to true");
          
          setIsLoading(false);
          LOG_TO_TERMINAL("Setting isLoading to false, auth processing complete");
        }
      }
    });
    
    // Debug info for refreshing user progress
    LOG_TO_TERMINAL("Auth state listener setup complete");
    
    // Cleanup subscription
    return () => {
      LOG_TO_TERMINAL("UserProvider component unmounting, cleaning up auth listener");
      isMounted = false;
      unsubscribe();
    };
  }, []);

// Central navigation manager - handles all redirects
useEffect(() => {
  LOG_TO_TERMINAL(`Navigation manager running, auth resolved: ${authResolved}, isLoading: ${isLoading}`);
  
  // Only make navigation decisions when auth is resolved and we're not already loading
  if (!authResolved || isLoading) {
    LOG_TO_TERMINAL("Skipping navigation checks - auth not resolved or still loading");
    return;
  }
  
  // NEW: Skip redirects during account linking - improved check
  const linkingEmail = localStorage.getItem('linkingEmail');
  const showLinkingModal = localStorage.getItem('showLinkingModal');
  const isLinking = linkingEmail !== null && showLinkingModal === 'true';
  
  LOG_TO_TERMINAL(`Account linking check - email: ${linkingEmail || 'null'}, showModal: ${showLinkingModal || 'null'}, isLinking: ${isLinking}`);
  
  if (isLinking) {
    LOG_TO_TERMINAL(`Account linking in progress for ${linkingEmail}, skipping redirects`);
    return;
  }
  
  // Set this to trigger a redirect from the navigation component
  setRedirectTo(null); // Reset first
  LOG_TO_TERMINAL("Reset redirectTo to null");
  
  // Now make all navigation decisions in one place
  const path = window.location.pathname;
  const freshSignup = localStorage.getItem('fresh_signup') === 'true';
  
  LOG_TO_TERMINAL(`Current path: ${path}, User: ${currentUser?.uid || 'null'}, Fresh signup: ${freshSignup}`);
  LOG_TO_TERMINAL(`Signup state: ${JSON.stringify(signupState || {})}`);
  
  if (currentUser) {
    // User is logged in
    LOG_TO_TERMINAL("User is logged in, checking navigation rules");
    if (path === '/login' || path === '/') {
      // Don't go to login page if already logged in
      if (signupState?.signupCompleted) {
        LOG_TO_TERMINAL("User completed signup and is on login page, redirecting to member portal");
        setRedirectTo('/member-portal');
      } else {
        LOG_TO_TERMINAL("User has not completed signup and is on login page, redirecting to signup");
        setRedirectTo('/signup');
      }
    } else if (path.startsWith('/signup') && signupState?.signupCompleted) {
      // Completed signup users shouldn't be in signup flow
      LOG_TO_TERMINAL("User completed signup but is in signup flow, redirecting to member portal");
      setRedirectTo('/member-portal');
    }
  } else {
    // User is not logged in
    LOG_TO_TERMINAL("User is not logged in, checking protected routes");
    // FIXED: Allow access to signup if it's a fresh signup
    if ((path.startsWith('/signup') && !freshSignup) ||  
        path === '/member-portal' || 
        path === '/summary') {
      // Protected routes redirect to login
      // But DON'T redirect /signup if there's a fresh_signup flag
      LOG_TO_TERMINAL(`Protected route access attempt: ${path}, redirecting to login`);
      setRedirectTo('/login');
    }
  }
  
  // Special cases for verification
  const justVerified = localStorage.getItem('just_verified') === 'true';
  if (justVerified && currentUser && !path.includes('success')) {
    LOG_TO_TERMINAL("Just verified flag detected, redirecting to success page");
    setRedirectTo('/signup/success');
    // Clear this flag after using it to prevent loop
    localStorage.removeItem('just_verified');
    LOG_TO_TERMINAL("Cleared just_verified flag");
  }
  
  LOG_TO_TERMINAL(`Navigation check complete, redirectTo: ${redirectTo || 'null'}`);
}, [currentUser, signupState, authResolved, isLoading]);
  
  // Add debug button to dump state when mounted
  useEffect(() => {
    LOG_TO_TERMINAL("Adding debug button for UserContext");
    
    // Debug button to dump state
    const debugButton = document.createElement('button');
    debugButton.textContent = 'DEBUG USER CTX';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '150px';
    debugButton.style.left = '10px';
    debugButton.style.backgroundColor = 'green';
    debugButton.style.color = 'white';
    debugButton.style.padding = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.onclick = () => {
      LOG_TO_TERMINAL(`USER CONTEXT STATE: 
        currentUser: ${currentUser ? currentUser.uid : 'null'}
        isLoading: ${isLoading}
        authResolved: ${authResolved}
        redirectTo: ${redirectTo || 'null'}
        signupState: ${JSON.stringify(signupState || {})}
        just_verified: ${localStorage.getItem('just_verified') || 'null'}
        fresh_signup: ${localStorage.getItem('fresh_signup') || 'null'}
        linkingEmail: ${localStorage.getItem('linkingEmail') || 'null'}
      `);
    };
    document.body.appendChild(debugButton);
    
    return () => {
      document.body.removeChild(debugButton);
      LOG_TO_TERMINAL("UserContext debug button removed");
    };
  }, [currentUser, signupState, isLoading, authResolved, redirectTo]);
  
  // Manual navigation function
  const navigateTo = (path) => {
    LOG_TO_TERMINAL(`Manual navigation requested to: ${path}`);
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
    refreshUserProgress: () => {
      LOG_TO_TERMINAL("Manual refresh of user progress requested");
      return refreshUserProgress(currentUser);
    },
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