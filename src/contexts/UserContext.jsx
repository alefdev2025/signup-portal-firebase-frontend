// Fixed UserContext.jsx - Remove blocking that prevents backend fetch
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
  
  // SIMPLIFIED: Only track the last processed state to prevent loops
  const lastProcessedState = useRef(null);
  
  LOG_TO_TERMINAL("UserProvider initialized");
  
  const refreshUserProgress = async (user) => {
    if (!user) return null;
    
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
        
        LOG_TO_TERMINAL(`Got signup state from backend: ${JSON.stringify({
          signupStep: newSignupState.signupStep,
          signupProgress: newSignupState.signupProgress,
          signupCompleted: newSignupState.signupCompleted,
        })}`);
        
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        return newSignupState;
        
      } else {
        LOG_TO_TERMINAL("No user document found, creating default state");
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
            // ALWAYS fetch from backend for login cases
            LOG_TO_TERMINAL("Fetching user data from backend");
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