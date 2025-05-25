// Nuclear UserContext.jsx - ZERO RELOADS VERSION
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";

const LOG_TO_TERMINAL = (message) => {
  console.log(`[USER CONTEXT] ${message}`);
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[USER CONTEXT] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [signupState, setSignupState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  
  // BULLETPROOF: Track everything to prevent any processing loops
  const processedUsers = useRef(new Set());
  const lastProcessedState = useRef(null);
  const isProcessing = useRef(false);
  
  LOG_TO_TERMINAL("UserProvider initialized");
  
  const refreshUserProgress = async (user) => {
    if (!user) return null;
    
    // BULLETPROOF: Don't refresh if we're already processing or have recent data
    if (isProcessing.current) {
      LOG_TO_TERMINAL("Refresh blocked - already processing auth state");
      return signupState;
    }
    
    // BULLETPROOF: Don't refresh if we have very recent data (within 5 seconds)
    if (signupState && signupState.userId === user.uid && 
        Date.now() - signupState.timestamp < 5000) {
      LOG_TO_TERMINAL("Refresh blocked - very recent data exists");
      return signupState;
    }
    
    LOG_TO_TERMINAL(`Refreshing user progress for uid: ${user.uid}`);
    
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
        
        LOG_TO_TERMINAL(`Setting signup state: ${JSON.stringify({
          signupStep: newSignupState.signupStep,
          signupProgress: newSignupState.signupProgress,
          signupCompleted: newSignupState.signupCompleted,
        })}`);
        
        // BULLETPROOF: Only update state if it's actually different
        if (!signupState || 
            signupState.signupStep !== newSignupState.signupStep ||
            signupState.signupProgress !== newSignupState.signupProgress ||
            signupState.signupCompleted !== newSignupState.signupCompleted) {
          setSignupState(newSignupState);
          saveSignupState(newSignupState);
        } else {
          LOG_TO_TERMINAL("State unchanged, skipping update");
        }
        
        return newSignupState;
      } else {
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
      LOG_TO_TERMINAL(`Error refreshing user progress: ${error.message}`);
      return null;
    }
  };
  
  // BULLETPROOF auth state listener
  useEffect(() => {
    LOG_TO_TERMINAL("Setting up auth state change listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const userId = user?.uid || 'null';
      const stateKey = `${userId}-${user?.emailVerified || false}`;
      
      LOG_TO_TERMINAL(`Auth state changed, user: ${userId}`);
      
      // BULLETPROOF: Prevent concurrent processing
      if (isProcessing.current) {
        LOG_TO_TERMINAL("Already processing auth state, skipping");
        return;
      }
      
      // BULLETPROOF: Skip if we've processed this exact state
      if (lastProcessedState.current === stateKey) {
        LOG_TO_TERMINAL(`Already processed state ${stateKey}, skipping`);
        return;
      }
      
      // BULLETPROOF: Mark as processing
      isProcessing.current = true;
      lastProcessedState.current = stateKey;
      
      setIsLoading(true);
      
      try {
        if (user) {
          LOG_TO_TERMINAL(`Processing user: ${user.uid}`);
          
          setCurrentUser(user);
          
          // Handle just verified with immediate flag clearing
          const justVerified = localStorage.getItem('just_verified') === 'true';
          if (justVerified) {
            LOG_TO_TERMINAL("User was just verified, creating success state");
            localStorage.removeItem('just_verified');
            localStorage.removeItem('verification_timestamp');
            
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
            
            // CRITICAL: Don't fetch from backend when we have just_verified
            // This ensures SignupFlowContext sees the success state immediately
            LOG_TO_TERMINAL("Just verified state set - skipping backend fetch");
          } else {
            // Check cache then backend
            const cachedState = getSignupState();
            const cacheValid = cachedState && 
                              cachedState.userId === user.uid && 
                              Date.now() - cachedState.timestamp < 5 * 60 * 1000;
            
            if (cacheValid) {
              LOG_TO_TERMINAL("Using cached state");
              setSignupState(cachedState);
            } else {
              LOG_TO_TERMINAL("Fetching fresh data from backend");
              await refreshUserProgress(user);
            }
          }
        } else {
          LOG_TO_TERMINAL("User is signed out, clearing state");
          setCurrentUser(null);
          setSignupState(null);
          clearSignupState();
          processedUsers.current.clear();
          lastProcessedState.current = null;
        }
      } catch (error) {
        LOG_TO_TERMINAL(`Error in auth state change: ${error.message}`);
      } finally {
        setAuthResolved(true);
        setIsLoading(false);
        isProcessing.current = false;
        LOG_TO_TERMINAL("Auth processing complete");
      }
    });
    
    return () => {
      LOG_TO_TERMINAL("Cleaning up auth listener");
      unsubscribe();
    };
  }, []); // BULLETPROOF: No dependencies

  const value = {
    currentUser,
    signupState,
    isLoading,
    authResolved,
    refreshUserProgress: () => refreshUserProgress(currentUser)
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
export { UserProvider };