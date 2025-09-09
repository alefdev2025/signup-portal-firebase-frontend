// UserContext.jsx - FIXED VERSION with proper state management
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { saveSignupState, clearSignupState, getSignupState } from "../services/storage";
import { checkUserStep } from "../services/auth";
import { API_BASE_URL } from '../config/api';

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
  const [userDataError, setUserDataError] = useState(null);
  
  // Salesforce customer data
  const [salesforceCustomer, setSalesforceCustomer] = useState(null);
  const [netsuiteCustomerId, setNetsuiteCustomerId] = useState(null);
  
  // Track what we've already loaded to prevent re-fetching
  const loadedDataRef = useRef({
    userId: null,
    salesforceId: null,
    hasLoadedUserData: false
  });
  
  // Track if we're currently loading to prevent concurrent loads
  const isLoadingRef = useRef(false);
  
  // Fetch Salesforce customer data using the stored ID
  const fetchSalesforceCustomer = useCallback(async (salesforceCustomerId, user) => {
    // Check if we've already loaded this customer
    if (loadedDataRef.current.salesforceId === salesforceCustomerId && salesforceCustomer) {
      //LOG_TO_TERMINAL(`Salesforce customer ${salesforceCustomerId} already loaded, skipping`);
      return salesforceCustomer;
    }
    
    if (!salesforceCustomerId) {
      LOG_TO_TERMINAL("ERROR: No Salesforce Customer ID provided");
      setUserDataError("Missing Salesforce Customer ID. Please contact support.");
      return null;
    }

    LOG_TO_TERMINAL(`Fetching Salesforce customer by ID: ${salesforceCustomerId}`);
    
    try {
      //const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
      const token = await user.getIdToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/salesforce/customers/${salesforceCustomerId}`,
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
        
        LOG_TO_TERMINAL(`Successfully fetched Salesforce customer`);
        LOG_TO_TERMINAL(`NetSuite Customer ID: ${customer.netsuiteCustomerId || 'Not found'}`);
        
        // Mark as loaded
        loadedDataRef.current.salesforceId = salesforceCustomerId;
        
        setSalesforceCustomer(customer);
        setNetsuiteCustomerId(customer.netsuiteCustomerId);
        setUserDataError(null);
        
        //console.log('=== SALESFORCE FETCH RESULT ===');
        //console.log('Setting salesforceCustomer:', customer);
        //console.log('==============================');
        
        return {
          salesforceId: customer.id,
          netsuiteId: customer.netsuiteCustomerId,
          alcorId: customer.alcorId,
          customer: customer
        };
      } else if (response.status === 404) {
        //LOG_TO_TERMINAL(`ERROR: Salesforce customer not found for ID: ${salesforceCustomerId}`);
        setUserDataError("Customer record not found. Please contact support.");
      } else {
        //LOG_TO_TERMINAL(`ERROR: Failed to fetch customer: ${response.status} ${response.statusText}`);
        setUserDataError("Failed to load customer data. Please try again.");
      }
    } catch (error) {
      //LOG_TO_TERMINAL(`ERROR: Exception fetching customer: ${error.message}`);
      setUserDataError("Network error loading customer data. Please check your connection.");
    }
    
    return null;
  }, [salesforceCustomer]);
  
  const refreshUserProgress = useCallback(async (user) => {
    if (!user) return null;
    
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      LOG_TO_TERMINAL(`Already loading data for user ${user.uid}, skipping`);
      return null;
    }
    
    // Check if we've already loaded this user's data
    if (loadedDataRef.current.userId === user.uid && loadedDataRef.current.hasLoadedUserData && signupState && salesforceCustomer) {
      LOG_TO_TERMINAL(`User data already loaded for ${user.uid}, skipping refresh`);
      return signupState;
    }
    
    isLoadingRef.current = true;
    LOG_TO_TERMINAL(`Refreshing user progress for uid: ${user.uid}`);
    
    try {
      // First, get the user document to retrieve stored IDs
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
  
      //console.log('=== USER DOCUMENT DEBUG ===');
      //console.log('Document exists:', userDoc.exists());
      //console.log('User data:', userData);
      //console.log('salesforceContactId:', userData?.salesforceContactId);
      //console.log('=========================');
      
      if (!userData) {
        LOG_TO_TERMINAL("ERROR: No user document found");
        setUserDataError("User profile not found. Please contact support.");
        return null;
      }
      
      // Check for Salesforce ID but don't return early if missing
      if (!userData.salesforceContactId) {
        LOG_TO_TERMINAL("WARNING: User document missing salesforceContactId - will check backend for step info");
        // Don't return - continue to check backend state
      }
      
      // Set NetSuite ID if available
      if (userData.netsuiteCustomerId) {
        setNetsuiteCustomerId(userData.netsuiteCustomerId);
      }
      
      // Fetch user step and Salesforce data in parallel
      // Only fetch Salesforce data if we have an ID
      const [userStepResult, salesforceData] = await Promise.all([
        checkUserStep({ userId: user.uid }),
        userData.salesforceContactId 
          ? fetchSalesforceCustomer(userData.salesforceContactId, user)
          : Promise.resolve(null)
      ]);
      
      LOG_TO_TERMINAL(`checkUserStep API result: ${JSON.stringify(userStepResult)}`);
      
      if (userStepResult.success) {
        const newSignupState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || "Member",
          signupStep: userStepResult.stepName || "account",
          signupProgress: (typeof userStepResult.step === 'object' ? userStepResult.step.step : userStepResult.step) || 0,
          signupCompleted: userStepResult.isCompleted || false,
          lastUpdated: new Date(),
          timestamp: Date.now(),
          salesforceContactId: userData.salesforceContactId || null,
          netsuiteCustomerId: salesforceData?.netsuiteId || userData.netsuiteCustomerId || null
        };
        
        LOG_TO_TERMINAL(`Signup state updated: step=${newSignupState.signupStep}, progress=${newSignupState.signupProgress}, completed=${newSignupState.signupCompleted}`);
        
        // Mark as loaded
        loadedDataRef.current.userId = user.uid;
        loadedDataRef.current.hasLoadedUserData = true;
        
        setSignupState(newSignupState);
        saveSignupState(newSignupState);
        
        // Clear any previous errors since we got valid data from backend
        setUserDataError(null);
        
        return newSignupState;
        
      } else {
        LOG_TO_TERMINAL(`API returned error: ${userStepResult.error || 'Unknown error'}`);
        
        // Even if API fails, create a basic state to allow user to continue
        const defaultState = {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || userData.displayName || "Member",
          signupStep: "account", // Default to account step instead of error
          signupProgress: 0,
          signupCompleted: false,
          timestamp: Date.now(),
          salesforceContactId: userData.salesforceContactId || null,
          netsuiteCustomerId: salesforceData?.netsuiteId || userData.netsuiteCustomerId || null
        };
        
        // Mark as loaded
        loadedDataRef.current.userId = user.uid;
        loadedDataRef.current.hasLoadedUserData = true;
        
        setSignupState(defaultState);
        saveSignupState(defaultState);
        
        // Set a warning instead of error if just missing Salesforce ID
        if (!userData.salesforceContactId && userStepResult.error) {
          setUserDataError("Some account data is missing but you can continue your application.");
        }
        
        return defaultState;
      }
    } catch (error) {
      LOG_TO_TERMINAL(`ERROR in refreshUserProgress: ${error.message}`);
      
      // Even on error, create a state that allows continuation
      const errorState = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "Member",
        signupStep: "account", // Default to account instead of error
        signupProgress: 0,
        signupCompleted: false,
        timestamp: Date.now(),
        error: error.message
      };
      
      // Only set user data error for actual errors, not missing IDs
      if (error.message.includes('Network') || error.message.includes('Firebase')) {
        setUserDataError("Failed to load user data. Please check your connection and try again.");
      }
      
      setSignupState(errorState);
      saveSignupState(errorState);
      return errorState;
    } finally {
      isLoadingRef.current = false;
    }
  }, [fetchSalesforceCustomer, signupState, salesforceCustomer]);
  
  // Auth state listener - only set up once
  useEffect(() => {
    LOG_TO_TERMINAL("Setting up auth state change listener");
    
    let unsubscribe;
    let mounted = true;
    
    const setupAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!mounted) return;
        
        const userId = user?.uid || null;
        LOG_TO_TERMINAL(`Auth state changed, user: ${userId || 'null'}`);
        
        if (user) {
          // Only update loading state if this is a different user
          if (loadedDataRef.current.userId !== userId) {
            setIsLoading(true);
          }
          
          setCurrentUser(user);
          setUserDataError(null);
          
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
            setIsLoading(false);
            setAuthResolved(true);
          } else {
            // Only fetch if we haven't already loaded this user's data
            if (loadedDataRef.current.userId !== userId || !loadedDataRef.current.hasLoadedUserData) {
              LOG_TO_TERMINAL("Fetching user data from backend");
              await refreshUserProgress(user);
            } else {
              LOG_TO_TERMINAL("User data already loaded, skipping fetch");
            }
            setIsLoading(false);
            setAuthResolved(true);
          }
        } else {
          LOG_TO_TERMINAL("User is signed out, clearing state");
          
          // Clear all refs
          loadedDataRef.current = {
            userId: null,
            salesforceId: null,
            hasLoadedUserData: false
          };
          isLoadingRef.current = false;
          
          setCurrentUser(null);
          setSignupState(null);
          setSalesforceCustomer(null);
          setNetsuiteCustomerId(null);
          setUserDataError(null);
          clearSignupState();
          setIsLoading(false);
          setAuthResolved(true);
        }
      });
    };
    
    setupAuth();
    
    return () => {
      mounted = false;
      if (unsubscribe) {
        LOG_TO_TERMINAL("Cleaning up auth listener");
        unsubscribe();
      }
    };
  }, []); // Empty deps array - only run once

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    currentUser,
    signupState,
    isLoading,
    authResolved,
    userDataError,
    salesforceCustomer,
    netsuiteCustomerId,
    customerId: netsuiteCustomerId, // Alias for compatibility
    refreshUserProgress: () => {
      if (currentUser && loadedDataRef.current.userId !== currentUser.uid) {
        // Clear the loaded flag to force a refresh
        loadedDataRef.current.hasLoadedUserData = false;
        return refreshUserProgress(currentUser);
      }
      return Promise.resolve(signupState);
    }
  }), [currentUser, signupState, isLoading, authResolved, userDataError, salesforceCustomer, netsuiteCustomerId, refreshUserProgress]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export { UserProvider };