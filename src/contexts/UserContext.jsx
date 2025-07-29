// Updated UserContext.jsx with Salesforce integration
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";
import { checkUserStep } from "../services/auth";
import { searchCustomerByEmail } from "../components/portal/services/salesforce/salesforce";

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
  
  // NEW: Salesforce customer data
  const [salesforceCustomer, setSalesforceCustomer] = useState(null);
  const [netsuiteCustomerId, setNetsuiteCustomerId] = useState(null);
  
  // SIMPLIFIED: Only track the last processed state to prevent loops
  const lastProcessedState = useRef(null);
  
  LOG_TO_TERMINAL("UserProvider initialized");
  
  // In UserContext.jsx, update the fetchSalesforceCustomer function:

  const fetchSalesforceCustomer = async (email) => {
    LOG_TO_TERMINAL(`Fetching Salesforce customer for email: ${email}`);
    
    try {
      // First check localStorage for Alcor ID (set during portal login)
      const storedAlcorId = localStorage.getItem('portal_alcor_id');
      
      // Search for customer by email (and Alcor ID if available)
      const searchResult = await searchCustomerByEmail(email, storedAlcorId);
      console.log('[UserContext] Salesforce search result:', searchResult);
      
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        const customer = searchResult.data[0];
        LOG_TO_TERMINAL(`Found Salesforce customer: ${customer.id}`);
        LOG_TO_TERMINAL(`NetSuite Customer ID: ${customer.netsuiteCustomerId || 'Not found'}`);
        LOG_TO_TERMINAL(`Alcor ID: ${customer.alcorId || 'Not found'}`);
        
        setSalesforceCustomer(customer);
        setNetsuiteCustomerId(customer.netsuiteCustomerId);
        
        // Store Alcor ID for future use
        if (customer.alcorId) {
          localStorage.setItem('portal_alcor_id', customer.alcorId);
        }
        
        return {
          salesforceId: customer.id,
          netsuiteId: customer.netsuiteCustomerId,
          alcorId: customer.alcorId,
          customer: customer
        };
      } else {
        LOG_TO_TERMINAL("No Salesforce customer found for this email");
      }
    } catch (error) {
      LOG_TO_TERMINAL(`Error fetching Salesforce customer: ${error.message}`);
      console.error('Salesforce customer fetch error:', error);
    }
    
    return null;
  };


  // NEW: Fetch Salesforce customer data
  /*const fetchSalesforceCustomer = async (email) => {
    LOG_TO_TERMINAL(`Fetching Salesforce customer for email: ${email}`);
    
    try {
      // Search for customer by email
      const searchResult = await searchCustomerByEmail(email);
      console.log('[UserContext] Salesforce search result:', searchResult);
      
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        const customer = searchResult.data[0]; // Take the first match
        LOG_TO_TERMINAL(`Found Salesforce customer: ${customer.id}`);
        LOG_TO_TERMINAL(`NetSuite Customer ID: ${customer.netsuiteCustomerId || 'Not found'}`);
        
        setSalesforceCustomer(customer);
        setNetsuiteCustomerId(customer.netsuiteCustomerId);
        
        return {
          salesforceId: customer.id,
          netsuiteId: customer.netsuiteCustomerId,
          customer: customer
        };
      } else {
        LOG_TO_TERMINAL("No Salesforce customer found for this email");
      }
    } catch (error) {
      LOG_TO_TERMINAL(`Error fetching Salesforce customer: ${error.message}`);
      console.error('Salesforce customer fetch error:', error);
    }
    
    return null;
  };*/
  
  const refreshUserProgress = async (user) => {
    if (!user) return null;
    
    LOG_TO_TERMINAL(`Refreshing user progress for uid: ${user.uid}`);
    LOG_TO_TERMINAL(`Using checkUserStep API instead of direct Firestore`);
    
    try {

      const safeCheckUserStep = async (retries = 3, delayMs = 500) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await checkUserStep({ userId: user.uid });
          } catch (err) {
            if (err.code === 'permission-denied' || err.message?.includes('permission')) {
              LOG_TO_TERMINAL(`Permission denied – retrying in ${delayMs}ms...`);
              await new Promise(res => setTimeout(res, delayMs));
            } else {
              throw err; // rethrow non-permission errors
            }
          }
        }
        throw new Error("Too many permission-denied errors during checkUserStep");
      };

      const retry = async (fn, retries = 3, delayMs = 500) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (e) {
            if (
              e.code === "permission-denied" ||
              e.message?.includes("permission") ||
              e.message?.includes("insufficient")
            ) {
              console.warn(`Permission error, retrying in ${delayMs}ms...`);
              await new Promise((res) => setTimeout(res, delayMs));
            } else {
              throw e;
            }
          }
        }
        throw new Error("Too many retries on permission error");
      };
      
      const [userStepResult, salesforceData] = await Promise.all([
        retry(() => checkUserStep({ userId: user.uid })),
        fetchSalesforceCustomer(user.email),
      ]);
      
      
      /*const [userStepResult, salesforceData] = await Promise.all([
        safeCheckUserStep(),
        fetchSalesforceCustomer(user.email)
      ]);*/      


      // Fetch both user progress and Salesforce data in parallel
      /*const [userStepResult, salesforceData] = await Promise.all([
        checkUserStep({ userId: user.uid }),
        fetchSalesforceCustomer(user.email)
      ]);*/
      
      LOG_TO_TERMINAL(`checkUserStep API result: ${JSON.stringify(userStepResult)}`);
      
      if (userStepResult.success) {
        const newSignupState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          signupStep: userStepResult.stepName || "account",
          signupProgress: (typeof userStepResult.step === 'object' ? userStepResult.step.step : userStepResult.step) || 0,
          signupCompleted: userStepResult.isCompleted || false,
          lastUpdated: new Date(),
          timestamp: Date.now(),
          // Add NetSuite ID to signup state
          netsuiteCustomerId: salesforceData?.netsuiteId || null
        };
        
        LOG_TO_TERMINAL(`Got signup state from API: ${JSON.stringify({
          signupStep: newSignupState.signupStep,
          signupProgress: newSignupState.signupProgress,
          signupCompleted: newSignupState.signupCompleted,
          netsuiteCustomerId: newSignupState.netsuiteCustomerId
        })}`);
        
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        return newSignupState;
        
      } else {
        LOG_TO_TERMINAL(`API returned error: ${userStepResult.error || 'Unknown error'}`);
        LOG_TO_TERMINAL("Creating default state");
        const defaultState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          signupStep: "account",
          signupProgress: 0,
          signupCompleted: false,
          timestamp: Date.now(),
          netsuiteCustomerId: salesforceData?.netsuiteId || null
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

  // When auth state changes to null, clear everything
  /*useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Clear all state
        setCurrentUser(null);
        setNetsuiteCustomerId(null);
        setSalesforceCustomer(null);
        // Clear any cached data
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to login
        window.location.href = '/login'; // or wherever your login page is
      }
    });
  }, []);*/ // TEMP
    
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
          setSalesforceCustomer(null);
          setNetsuiteCustomerId(null);
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
    // NEW: Expose Salesforce/NetSuite data
    salesforceCustomer,
    netsuiteCustomerId,
    customerId: netsuiteCustomerId, // Alias for compatibility
    refreshUserProgress: () => refreshUserProgress(currentUser)
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
export { UserProvider };