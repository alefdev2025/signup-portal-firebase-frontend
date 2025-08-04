// Updated UserContext.jsx with Salesforce integration
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";
import { checkUserStep } from "../services/auth";
import { searchCustomerByEmail } from "../components/portal/services/salesforce/salesforce";

const LOG_TO_TERMINAL = (message) => {
  //console.log(`[USER CONTEXT] ${message}`);
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
  
  //LOG_TO_TERMINAL*("UserProvider initialized");
  
  // Updated fetchSalesforceCustomer to use stored ID first
  const fetchSalesforceCustomer = async (email, user) => {
    //LOG_TO_TERMINAL(`Fetching Salesforce customer for email: ${email}`);
    
    try {
      // FIRST - Check the Firebase user document for the stored Salesforce ID
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        /*LOG_TO_TERMINAL(`User document data: ${JSON.stringify({
          hasSalesforceId: !!userData?.salesforceCustomerId,
          hasAlcorId: !!userData?.alcorId,
          hasNetsuiteId: !!userData?.netsuiteCustomerId
        })}`);*/
        
        if (userData?.salesforceCustomerId) {
          //LOG_TO_TERMINAL(`Found salesforceCustomerId on user object: ${userData.salesforceCustomerId}`);
          
          // Try to fetch the Salesforce customer by ID
          try {
            // Get the API base URL from the salesforce service
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
            
            const token = await user.getIdToken();
            const response = await fetch(
              `${API_BASE_URL}/api/salesforce/customers/${userData.salesforceCustomerId}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (response.ok) {
              const customerData = await response.json();
              const customer = customerData.data || customerData;
              
              //LOG_TO_TERMINAL(`Successfully fetched Salesforce customer by ID`);
              //LOG_TO_TERMINAL(`NetSuite Customer ID: ${customer.netsuiteCustomerId || 'Not found'}`);
              
              setSalesforceCustomer(customer);
              setNetsuiteCustomerId(customer.netsuiteCustomerId || userData?.netsuiteCustomerId);
              
              return {
                salesforceId: customer.id,
                netsuiteId: customer.netsuiteCustomerId || userData?.netsuiteCustomerId,
                alcorId: customer.alcorId || userData?.alcorId,
                customer: customer
              };
            } else if (response.status === 404) {
              //LOG_TO_TERMINAL(`Salesforce customer not found by ID, will try email search`);
            } else {
              //LOG_TO_TERMINAL(`Error fetching by ID: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            //LOG_TO_TERMINAL(`Error fetching customer by ID: ${fetchError.message}`);
          }
        }
        
        // Also check if we have netsuiteCustomerId directly on the user document
        if (userData?.netsuiteCustomerId && !netsuiteCustomerId) {
          //LOG_TO_TERMINAL(`Found netsuiteCustomerId on user object: ${userData.netsuiteCustomerId}`);
          setNetsuiteCustomerId(userData.netsuiteCustomerId);
        }
      }
      
      // Fall back to email search if we couldn't get the customer by ID
      //LOG_TO_TERMINAL("Falling back to email search");
      
      // Check localStorage for Alcor ID (set during portal login)
      const storedAlcorId = localStorage.getItem('portal_alcor_id');
      
      // Search for customer by email (and Alcor ID if available)
      const searchResult = await searchCustomerByEmail(email, storedAlcorId);
      //console.log('[UserContext] Salesforce search result:', searchResult);
      
      if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
        const customer = searchResult.data[0];
        //LOG_TO_TERMINAL(`Found Salesforce customer via email search: ${customer.id}`);
        //LOG_TO_TERMINAL(`NetSuite Customer ID: ${customer.netsuiteCustomerId || 'Not found'}`);
        //LOG_TO_TERMINAL(`Alcor ID: ${customer.alcorId || 'Not found'}`);
        
        setSalesforceCustomer(customer);
        setNetsuiteCustomerId(customer.netsuiteCustomerId);
        
        // Store Alcor ID for future use
        if (customer.alcorId) {
          localStorage.setItem('portal_alcor_id', customer.alcorId);
        }
        
        // Update the user document with the Salesforce ID for future use
        if (user?.uid && customer.id) {
          //LOG_TO_TERMINAL(`Storing salesforceCustomerId for future use`);
          // Note: You'll need to implement this update on your backend
          // This is just logging the intent
        }
        
        return {
          salesforceId: customer.id,
          netsuiteId: customer.netsuiteCustomerId,
          alcorId: customer.alcorId,
          customer: customer
        };
      } else {
        //LOG_TO_TERMINAL("No Salesforce customer found for this email");
      }
    } catch (error) {
      //LOG_TO_TERMINAL(`Error fetching Salesforce customer: ${error.message}`);
      //console.error('Salesforce customer fetch error:', error);
    }
    
    return null;
  };
  
  const refreshUserProgress = async (user) => {
    if (!user) return null;
    
    //LOG_TO_TERMINAL(`Refreshing user progress for uid: ${user.uid}`);
    //LOG_TO_TERMINAL(`Using checkUserStep API instead of direct Firestore`);
    
    try {
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
              //console.warn(`Permission error, retrying in ${delayMs}ms...`);
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
        fetchSalesforceCustomer(user.email, user), // Pass user object here
      ]);
      
      //LOG_TO_TERMINAL(`checkUserStep API result: ${JSON.stringify(userStepResult)}`);
      
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
          netsuiteCustomerId: salesforceData?.netsuiteId || netsuiteCustomerId || null
        };
        
        /*LOG_TO_TERMINAL(`Got signup state from API: ${JSON.stringify({
          signupStep: newSignupState.signupStep,
          signupProgress: newSignupState.signupProgress,
          signupCompleted: newSignupState.signupCompleted,
          netsuiteCustomerId: newSignupState.netsuiteCustomerId
        })}`);*/
        
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        return newSignupState;
        
      } else {
        //LOG_TO_TERMINAL(`API returned error: ${userStepResult.error || 'Unknown error'}`);
        //LOG_TO_TERMINAL("Creating default state");
        const defaultState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          signupStep: "account",
          signupProgress: 0,
          signupCompleted: false,
          timestamp: Date.now(),
          netsuiteCustomerId: salesforceData?.netsuiteId || netsuiteCustomerId || null
        };
        
        setSignupState(defaultState);
        saveSignupState(defaultState);
        return defaultState;
      }
    } catch (error) {
      //LOG_TO_TERMINAL(`API CALL ERROR: ${error.message}`);
      //LOG_TO_TERMINAL("Creating default state due to error");
      
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
    //LOG_TO_TERMINAL("Setting up auth state change listener");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const userId = user?.uid || 'null';
      const stateKey = `${userId}-${user?.emailVerified || false}`;
      
      //LOG_TO_TERMINAL(`Auth state changed, user: ${userId}`);
      
      // SIMPLIFIED: Only skip if we just processed this exact state
      if (lastProcessedState.current === stateKey) {
        //LOG_TO_TERMINAL(`Already processed state ${stateKey}, skipping`);
        return;
      }
      
      lastProcessedState.current = stateKey;
      setIsLoading(true);
      
      try {
        if (user) {
          //LOG_TO_TERMINAL(`Processing user: ${user.uid}`);
          setCurrentUser(user);
          
          // Handle just verified case
          const justVerified = localStorage.getItem('just_verified') === 'true';
          if (justVerified) {
            //LOG_TO_TERMINAL("User was just verified, creating success state");
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
            //LOG_TO_TERMINAL("Fetching user data from API");
            await refreshUserProgress(user);
          }
        } else {
          //LOG_TO_TERMINAL("User is signed out, clearing state");
          setCurrentUser(null);
          setSignupState(null);
          setSalesforceCustomer(null);
          setNetsuiteCustomerId(null);
          clearSignupState();
          lastProcessedState.current = null;
        }
      } catch (error) {
        //LOG_TO_TERMINAL(`Error in auth state change: ${error.message}`);
      } finally {
        setAuthResolved(true);
        setIsLoading(false);
        //LOG_TO_TERMINAL("Auth processing complete");
      }
    });
    
    return () => {
      //LOG_TO_TERMINAL("Cleaning up auth listener");
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