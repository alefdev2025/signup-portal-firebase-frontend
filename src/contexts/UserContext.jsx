// Fixed UserContext.jsx - Use the same API as ResponsiveBanner
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";
import { checkUserStep } from "../services/auth";

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
  
  // SIMPLIFIED: Only track the last processed state to prevent loops
  const lastProcessedState = useRef(null);
  
  LOG_TO_TERMINAL("UserProvider initialized");
  
  const refreshUserProgress = async (user) => {
    if (!user) return null;
    
    LOG_TO_TERMINAL(`Refreshing user progress for uid: ${user.uid}`);
    LOG_TO_TERMINAL(`Using checkUserStep API instead of direct Firestore`);
    
    try {
      const result = await checkUserStep({ userId: user.uid });
      LOG_TO_TERMINAL(`checkUserStep API result: ${JSON.stringify(result)}`);
      
      if (result.success) {
        const newSignupState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          signupStep: result.stepName || "account",
          //signupProgress: result.step || 0,
          signupProgress: (typeof result.step === 'object' ? result.step.step : result.step) || 0,
          signupCompleted: result.isCompleted || false,
          lastUpdated: new Date(),
          timestamp: Date.now()
        };
        
        LOG_TO_TERMINAL(`Got signup state from API: ${JSON.stringify({
          signupStep: newSignupState.signupStep,
          signupProgress: newSignupState.signupProgress,
          signupCompleted: newSignupState.signupCompleted,
        })}`);
        
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        return newSignupState;
        
      } else {
        LOG_TO_TERMINAL(`API returned error: ${result.error || 'Unknown error'}`);
        LOG_TO_TERMINAL("Creating default state");
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
      LOG_TO_TERMINAL(`API CALL ERROR: ${error.message}`);
      LOG_TO_TERMINAL("Creating default state due to error");
      
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
  };
  
  // SIMPLIFIED auth state listener without complex blocking
  useEffect(() => {
    LOG_TO_TERMINAL("Setting up auth state change listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const userId = user?.uid || 'null';
      const stateKey = `${userId}-${user?.emailVerified || false}`;
      
      LOG_TO_TERMINAL(`Auth state changed, user: ${userId}`);
      
      // SIMPLIFIED: Only skip if we just processed this exact state
      if (lastProcessedState.current === stateKey) {
        LOG_TO_TERMINAL(`Already processed state ${stateKey}, skipping`);
        return;
      }
      
      lastProcessedState.current = stateKey;
      setIsLoading(true);
      
      try {
        if (user) {
          LOG_TO_TERMINAL(`Processing user: ${user.uid}`);
          setCurrentUser(user);
          
          // Handle just verified case
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
          } else {
            // ALWAYS fetch from backend using API
            LOG_TO_TERMINAL("Fetching user data from API");
            await refreshUserProgress(user);
          }
        } else {
          LOG_TO_TERMINAL("User is signed out, clearing state");
          setCurrentUser(null);
          setSignupState(null);
          clearSignupState();
          lastProcessedState.current = null;
        }
      } catch (error) {
        LOG_TO_TERMINAL(`Error in auth state change: ${error.message}`);
      } finally {
        setAuthResolved(true);
        setIsLoading(false);
        LOG_TO_TERMINAL("Auth processing complete");
      }
    });
    
    return () => {
      LOG_TO_TERMINAL("Cleaning up auth listener");
      unsubscribe();
    };
  }, []); // No dependencies

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