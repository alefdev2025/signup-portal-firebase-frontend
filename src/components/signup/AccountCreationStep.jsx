// File: pages/signup/AccountCreationStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../contexts/UserContext";
import { debugLogger, DebugPanel } from '../../components/debug/logs';
import { useSearchParams } from 'react-router-dom';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";

// Import auth-related functions
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createNewUser,
  signInExistingUser,
  signInWithGoogle,
  getPendingLinkingEmail,
  signInWithEmailAndPassword,
  linkGoogleToEmailAccount // Added new import
} from "../../services/auth";

import { 
  getVerificationState, 
  saveVerificationState,
  clearVerificationState,
  setAccountCreated,
  setForceNavigation
} from "../../services/storage";

// Import form component
import AccountCreationForm from "../../components/signup/AccountCreationForm";
// Import new Account Linking Modal
import AccountLinkingModal from "../../components/modals/AccountLinkingModal";

// Add this at the top of your AccountCreationStep.jsx file, right after the imports
// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/log?t=${Date.now()}`, false); // Synchronous request
      xhr.send(`[DEBUG] ${message}`);
      console.log(`[DEBUG] ${message}`); // Also log to console
    } catch (e) {
      // Ignore errors
    }
  };
  


const AccountCreationStep = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState("initial"); // "initial", "verification"
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [highlightGoogleButton, setHighlightGoogleButton] = useState(false);
  
  // Keep password in memory only - not in formData that might be persisted
  const [passwordState, setPasswordState] = useState('');
  const [confirmPasswordState, setConfirmPasswordState] = useState('');
  
  // New state for account linking modal
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    name: "New Member", // Using placeholder name
    email: "",
    termsAccepted: false,
    verificationCode: "",
    verificationId: "",
  });
  
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: "",
    verificationCode: "",
    general: ""
  });

  // Change this useEffect
useEffect(() => {
    if (currentUser) {
      // 👇 Add this check to prevent redirect during account linking
      const isLinking = localStorage.getItem('linkingEmail') !== null;
      
      if (!isLinking) {
        console.log("User already logged in, redirecting to success page");
        setForceNavigation(1); // 1 = success step
        window.location.href = '/signup/success';
      } else {
        console.log("Not redirecting - account linking in progress");
      }
    }
  }, [currentUser]);

// Add this near the top of your component
useEffect(() => {
    // Check if there's a pending linking email from a previous Google sign-in
    try {
      const pendingEmail = getPendingLinkingEmail();
      if (pendingEmail) {
        LOG_TO_TERMINAL(`Found pending linking email: ${pendingEmail}`);
        setLinkingEmail(pendingEmail);
        setShowLinkingModal(true);
      }
    } catch (e) {
      LOG_TO_TERMINAL(`Error checking pending email: ${e.message}`);
    }
  }, []);

  // Add this useEffect after your imports and before your component code
  useEffect(() => {
    LOG_TO_TERMINAL("Checking localStorage for linking state");
    
    // Check if localStorage has linking state
    const storedEmail = localStorage.getItem('linkingEmail');
    const showModal = localStorage.getItem('showLinkingModal');
    
    LOG_TO_TERMINAL(`Linking state check - email: ${storedEmail || 'null'}, showModal: ${showModal || 'null'}`);
    
    if (storedEmail && showModal === 'true') {
      LOG_TO_TERMINAL(`Found linking state in localStorage: ${storedEmail}`);
      
      // Set state from localStorage
      setLinkingEmail(storedEmail);
      setShowLinkingModal(true);
      
      LOG_TO_TERMINAL("Set component state for linking modal");
      
      // Force stay on this page to ensure modal shows
      setForceNavigation(0);
      LOG_TO_TERMINAL("Set force navigation to 0 to stay on page during linking");
    }
  }, []); // Empty dependency array means this only runs once on mount

  useEffect(() => {
    LOG_TO_TERMINAL("Checking for URL params");
    
    // Check if URL contains account linking parameters
    const linkingEmail = searchParams.get('linkEmail');
    const showModal = searchParams.get('showLinkingModal');
    
    LOG_TO_TERMINAL(`URL params check - linkEmail: ${linkingEmail || 'null'}, showModal: ${showModal || 'null'}`);
    
    if (linkingEmail && showModal === 'true') {
      LOG_TO_TERMINAL(`Found linking params in URL: ${linkingEmail}`);
      
      // Store in localStorage as well for persistence
      localStorage.setItem('linkingEmail', linkingEmail);
      localStorage.setItem('showLinkingModal', 'true');
      
      // Set component state
      setLinkingEmail(linkingEmail);
      setShowLinkingModal(true);
      
      LOG_TO_TERMINAL("Set component state for linking modal from URL params");
      
      // Force stay on this page
      setForceNavigation(0);
      LOG_TO_TERMINAL("Set force navigation to 0 to stay on page during linking from URL params");
      
      // Remove params from URL to avoid loops
      searchParams.delete('linkEmail');
      searchParams.delete('showLinkingModal');
      setSearchParams(searchParams);
      
      LOG_TO_TERMINAL("Removed linking params from URL");
    }
  }, [searchParams, setSearchParams]);

   // Initialize debugging when component loads
   useEffect(() => {
    LOG_TO_TERMINAL("AccountCreationStep MOUNTED");
    LOG_TO_TERMINAL(`Current User: ${currentUser ? currentUser.uid : 'null'}`);
    LOG_TO_TERMINAL(`Initial VerificationStep: ${verificationStep}`);
    
    // Debug button to dump state
    const debugButton = document.createElement('button');
    debugButton.textContent = 'DEBUG STATE';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '70px';
    debugButton.style.left = '10px';
    debugButton.style.backgroundColor = 'red';
    debugButton.style.color = 'white';
    debugButton.style.padding = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.onclick = () => {
      LOG_TO_TERMINAL(`CURRENT STATE: 
        isSubmitting: ${isSubmitting}
        verificationStep: ${verificationStep}
        showLinkingModal: ${showLinkingModal}
        linkingEmail: ${linkingEmail}
        isLinking: ${isLinking}
        formData.email: ${formData.email}
      `);
    };
    document.body.appendChild(debugButton);
    
    return () => {
      document.body.removeChild(debugButton);
      LOG_TO_TERMINAL("AccountCreationStep UNMOUNTED");
    };
  }, []);
  
  // Add debugging for the verification loop
  useEffect(() => {
    console.log("AccountCreationStep mounted/updated");
    console.log("Current user:", currentUser?.uid);
    console.log("Verification step:", verificationStep);
  }, [currentUser, verificationStep]);
  
  // If user is already logged in, redirect to success page
  /*useEffect(() => {
    if (currentUser) {
      console.log("User already logged in, redirecting to success page");
      
      // Set a force navigation flag to bypass route guards
      setForceNavigation(1); // 1 = success step
      
      // Use window.location for a clean redirect instead of navigate
      window.location.href = '/signup/success';
    }
  }, [currentUser]);*/
  
  // Check for existing verification state on component mount
  useEffect(() => {
    // Clear any form errors on mount
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: "",
      verificationCode: "",
      general: ""
    });
    
    // Check if there's a saved verification state
    const savedVerificationState = getVerificationState();
    
    if (savedVerificationState) {
      console.log("Found saved verification state:", savedVerificationState);
      
      // Check if verification state is stale (older than 15 minutes)
      const now = Date.now();
      const stateAge = now - (savedVerificationState.timestamp || 0);
      const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      if (stateAge < maxAge) {
        setFormData(prevData => ({
          ...prevData,
          email: savedVerificationState.email || "",
          name: savedVerificationState.name || "New Member", // Using placeholder if none
          verificationId: savedVerificationState.verificationId || ""
        }));
        
        setIsExistingUser(savedVerificationState.isExistingUser || false);
        
        // If verification is in progress, show verification form
        if (savedVerificationState.verificationId) {
          setVerificationStep("verification");
        }
      } else {
        console.log("Verification state is stale, clearing it");
        clearVerificationState();
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for password - store in memory state, not in formData
    if (name === 'password') {
      // We now allow spaces in passwords - don't strip them
      setPasswordState(value);
      
      // Clear confirm password error if password changes
      if (errors.confirmPassword && confirmPasswordState === value) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ""
        }));
      }
    } else if (name === 'confirmPassword') {
      setConfirmPasswordState(value);
      
      // Clear confirm password error if it now matches
      if (errors.confirmPassword && value === passwordState) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ""
        }));
      }
    } else {
      // For all other fields, store in formData
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
    
    // Clear the specific error when user makes changes
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  
  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  
  const isValidPassword = (password) => {
    // Allow spaces but enforce other security requirements:
    // Either: 8+ chars with mix of upper, lower, and numbers
    // Or: 12+ chars with some complexity (more flexible for longer passwords)
    if (password.length >= 12) {
      // For longer passwords, be more flexible but still require some complexity
      return ((/[A-Z]/.test(password) || /[a-z]/.test(password)) && // Some letters
              (/[0-9]/.test(password) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))); // Some numbers/symbols
    } else {
      // For shorter passwords, require more complexity
      return password.length >= 8 && 
             /[A-Z]/.test(password) && 
             /[a-z]/.test(password) && 
             /[0-9]/.test(password);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log("Preventing double submission");
      return;
    }
    
    if (verificationStep === "initial") {
      // Email, Name & Password Form Submission
      const newErrors = {
        email: !formData.email.trim() 
          ? "Email is required" 
          : !isValidEmail(formData.email) 
            ? "Please enter a valid email address" 
            : "",
        password: !passwordState 
          ? "Password is required" 
          : !isValidPassword(passwordState)
            ? passwordState.length >= 12 
              ? "For longer passwords, please include some letters and at least one number or symbol" 
              : "Password must be at least 8 characters with uppercase letters, lowercase letters, and numbers. Alternatively, use 12+ characters with mixed character types."
            : "",
        confirmPassword: !confirmPasswordState
          ? "Please confirm your password"
          : confirmPasswordState !== passwordState
            ? "Passwords do not match"
            : "",
        termsAccepted: !formData.termsAccepted 
          ? "You must accept the Terms of Use and Privacy Policy" 
          : ""
      };
      
      setErrors(newErrors);
      
      // Check if there are any errors
      const hasErrors = Object.values(newErrors).some(error => error);
      
      if (hasErrors) {
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        console.log("Requesting email verification for:", formData.email);
        // Call Firebase function to create email verification
        const result = await requestEmailVerification(formData.email, formData.name || "New Member");
        
        if (result.success) {
          console.log("Verification request successful:", result);
          
          // Check if this is an existing user - based on the backend response
          if (result.isExistingUser) {
            console.log("This is an existing user");
            
            // Check if this is a Google-only user (has Google auth but no password)
            if ((result.authProviders && result.authProviders.includes('google.com') && !result.hasPasswordAuth) || 
                (result.authProvider === 'google' && !result.hasPasswordAuth)) {
              
              console.log("This is a Google-only user, redirecting to add password flow");
              // Navigate to login page with parameters for adding password to Google account
              navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup&provider=google&addPassword=true`);
              setIsSubmitting(false);
              return;
            }
            
            // Check if this is an email/password-only user (trying to use Google)
            if ((result.authProviders && result.authProviders.includes('password') && !result.hasGoogleAuth) || 
                (result.authProvider === 'password' && !result.hasGoogleAuth) ||
                (result.hasPasswordAuth && !result.hasGoogleAuth)) {
              
              console.log("This is a password-only user, redirecting to link Google flow");
              // Navigate to login page with parameters for linking Google to password account
              navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup&provider=password&linkAccounts=true`);
              setIsSubmitting(false);
              return;
            }
            
            console.log("This is a standard existing user, redirecting to login");
            // For users with both auth methods or any other case, redirect to standard login
            navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup`);
            setIsSubmitting(false);
            return;
          }
          
          console.log("This is a new user, proceeding to verification step");
          // Store verification ID for the next step
          setFormData(prev => ({
            ...prev,
            verificationId: result.verificationId,
            verificationCode: "" // Clear any previous code
          }));
          
          // Store verification state WITHOUT password
          saveVerificationState({
            email: formData.email,
            name: formData.name || "New Member",
            verificationId: result.verificationId,
            isExistingUser: false, // Not an existing user since we're proceeding
            timestamp: Date.now()
          });
          
          // Move to verification step
          setVerificationStep("verification");
        } else {
          // This should never happen due to error handling in the service
          console.error("Verification request returned success:false");
          setErrors(prev => ({
            ...prev,
            email: "Failed to send verification code"
          }));
        }
      } catch (error) {
        console.error('Error requesting verification:', error);
        
        // Check for Firebase auth errors that might indicate an existing user
        if (error.code === 'auth/email-already-in-use' || 
            (error.message && error.message.toLowerCase().includes('already exists') || 
             error.message && error.message.toLowerCase().includes('already in use'))) {
          
          // Navigate directly to login page with the email
          navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup`);
          return;
        } else {
          setErrors(prev => ({
            ...prev,
            email: error.message || "Failed to send verification code. Please try again."
          }));
        }
      } finally {
        setIsSubmitting(false);
      }
    } else if (verificationStep === "verification") {
      // Verify Code Submission
      
      // Validate verification code format
      if (!formData.verificationCode.trim()) {
        setErrors(prev => ({
          ...prev,
          verificationCode: "Verification code is required"
        }));
        return;
      }
      
      if (formData.verificationCode.length !== 6 || !/^\d{6}$/.test(formData.verificationCode)) {
        setErrors(prev => ({
          ...prev,
          verificationCode: "Please enter a valid 6-digit code"
        }));
        return;
      }
      
      // Ensure we have a verification ID
      if (!formData.verificationId) {
        setErrors(prev => ({
          ...prev,
          verificationCode: "Verification session expired. Please request a new code."
        }));
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        console.log("Verifying code:", formData.verificationCode);
        // First, verify the code only (no authentication attempt yet)
        const verificationResult = await verifyEmailCodeOnly(
          formData.verificationId, 
          formData.verificationCode
        );
        
        if (verificationResult.success) {
          console.log("Verification successful:", verificationResult);
          
          // Whether existing or new user, we'll handle the same way
          let authResult;
          
          // Check if this is an existing user from the verification result
          if (verificationResult.isExistingUser) {
            console.log("This is an existing user, signing in");
            // Use signInExistingUser for existing users
            authResult = await signInExistingUser(
              verificationResult,
              formData.email,
              passwordState
            );
          } else {
            console.log("This is a new user, creating account");
            // Use createNewUser for new users
            authResult = await createNewUser(
              {
                ...verificationResult,
                verificationId: formData.verificationId  // Add the ID from formData
              },
              formData.email,
              formData.name || "New Member",
              passwordState
            );
          }
          
          // Clear sensitive data from memory immediately
          setPasswordState('');
          setConfirmPasswordState('');
          
          if (authResult.success) {
            console.log("Authentication successful, setting up redirection");
            
            // 1. Clear verification state first
            clearVerificationState();
            
            // 2. Set account created flag in localStorage
            setAccountCreated(true);
            
            // 3. Reset UI state
            setVerificationStep("initial");
            setFormData(prev => ({
              ...prev,
              verificationCode: "",
              verificationId: ""
            }));
            
            // 4. Set a just verified flag in localStorage
            localStorage.setItem('just_verified', 'true');
            localStorage.setItem('verification_timestamp', Date.now().toString());
            
            // 5. Set force navigation to bypass route guards
            setForceNavigation(1); // 1 = success step
            
            // FIXED: Remove direct navigation and let auth state change handle it
            console.log("All flags set, waiting for auth state change to handle navigation");
            
            // Show success message while auth system processes the change
            setErrors(prev => ({
              ...prev,
              general: "Account verified successfully! Redirecting..." 
            }));
            
            // No return statement here, let the component finish rendering
          } else {
            console.error("Authentication result indicated failure:", authResult);
            setErrors(prev => ({
              ...prev,
              general: "Authentication failed. Please try again."
            }));
          }
        } else {
          console.error("Verification was not successful:", verificationResult);
          setErrors(prev => ({
            ...prev,
            verificationCode: "Invalid verification code. Please try again."
          }));
        }
      } catch (error) {
        console.error("Error verifying code:", error);
        
        // Handle specific error cases
        if (error.message && error.message.includes('expired')) {
          setErrors(prev => ({
            ...prev,
            verificationCode: "Verification code has expired. Please request a new one."
          }));
        } else if (error.message && error.message.includes('password')) {
          setErrors(prev => ({
            ...prev,
            verificationCode: error.message
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            verificationCode: error.message || "Failed to verify code. Please try again."
          }));
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleLinkAccounts = async (password) => {
    // Create a logging function for consistent debugging
    const log = (message) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/log?t=${Date.now()}`, false); // Synchronous request
        xhr.send(message);
        console.log(message); // Also log to console
      } catch (e) {
        // Ignore errors
      }
    };
    
    log(`ACCOUNT LINKING START: email=${linkingEmail}`);
    setIsLinking(true);
    
    try {
      // First check if functions are available
      log(`CHECKING FUNCTIONS: signInWithEmailAndPassword=${Boolean(signInWithEmailAndPassword)}, linkGoogleToEmailAccount=${Boolean(linkGoogleToEmailAccount)}`);
      
      if (typeof signInWithEmailAndPassword !== 'function') {
        log("ERROR: signInWithEmailAndPassword is missing - make sure it's imported!");
        throw new Error("Missing sign in function");
      }
      
      // Try sign in
      log(`SIGN IN ATTEMPT: ${linkingEmail}`);
      let signInResult;
      try {
        // Use the directly imported signInWithEmailAndPassword
        signInResult = await signInWithEmailAndPassword(linkingEmail, password);
        log(`SIGN IN RESULT: ${JSON.stringify(signInResult)}`);
      } catch (e) {
        log(`SIGN IN ERROR: ${e.message}`);
        throw e;
      }
      
      if (!signInResult || !signInResult.success) {
        log("SIGN IN FAILED - bad result");
        throw new Error("Failed to sign in");
      }
      
      // Try linking
      log("LINKING GOOGLE ATTEMPT");
      let linkResult;
      try {
        linkResult = await linkGoogleToEmailAccount();
        log(`LINK RESULT: ${JSON.stringify(linkResult)}`);
      } catch (e) {
        log(`LINK ERROR: ${e.message}`);
        throw e;
      }
      
      // Handle credential-already-in-use error specifically
      if (!linkResult.success && linkResult.error === "auth/credential-already-in-use") {
        log("DETECTED: Credential already in use error - this is expected when the same email has separate accounts");
        
        // Call the backend function to finalize the linking, even though the actual Firebase Auth linking failed
        try {
          log("Calling finalizeGoogleLinking Cloud Function to update Firestore");
          
          // Get the Firebase functions instance
          const finalizeGoogleLinkingFn = httpsCallable(functions, 'finalizeGoogleLinking');
          
          // Call the function with the user's ID and email
          const finalizeResult = await finalizeGoogleLinkingFn({ 
            userId: signInResult.user.uid,
            email: linkingEmail
          });
          
          log(`FINALIZE RESULT: ${JSON.stringify(finalizeResult.data)}`);
          
          // Check if backend operation succeeded
          if (!finalizeResult.data || !finalizeResult.data.success) {
            log(`WARNING: Backend finalization returned error: ${finalizeResult.data?.error || 'Unknown error'}`);
            // Continue anyway since we still want to proceed with the password account
          } else {
            log("SUCCESS: Backend finalization completed");
          }
        } catch (finalizeError) {
          log(`ERROR: Failed to call finalizeGoogleLinking: ${finalizeError.message}`);
          // Continue anyway - we'll still proceed with the password account
        }
        
        // Clear localStorage linking flags
        localStorage.removeItem('linkingEmail');
        localStorage.removeItem('showLinkingModal');
        log("Cleared localStorage linking flags");
        
        // Proceed with the current password account
        const nextStep = signInResult.user ? 1 : 0; // Default to success page
        const paths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
        
        log(`PROCEEDING WITH PASSWORD ACCOUNT: path=/signup${paths[nextStep]}`);
        
        // Directly set force navigation in localStorage to avoid potential issues
        localStorage.setItem('force_active_step', String(nextStep));
        log(`Directly set force_active_step in localStorage to: ${nextStep}`);
        
        // Send final log before navigation
        log("ABOUT TO NAVIGATE");
        
        // Use setTimeout to ensure log completes
        setTimeout(() => {
          log("REDIRECTING NOW");
          window.location.href = `/signup${paths[nextStep]}`;
        }, 200);
        
        return true;
      }
      
      if (!linkResult || !linkResult.success) {
        log("LINK FAILED - bad result");
        throw new Error(linkResult.message || "Failed to link accounts");
      }
      
      // Success path
      log("SUCCESS - ACCOUNTS LINKED!");
      
      // Clear localStorage linking flags
      localStorage.removeItem('linkingEmail');
      localStorage.removeItem('showLinkingModal');
      log("Cleared localStorage linking flags");
      
      clearVerificationState();
      
      const nextStep = linkResult.signupProgress || 1;
      const paths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
      
      log(`NAVIGATION: step=${nextStep}, path=/signup${paths[nextStep]}`);
      
      // Directly set force navigation in localStorage to avoid potential issues
      localStorage.setItem('force_active_step', String(nextStep));
      log(`Directly set force_active_step in localStorage to: ${nextStep}`);
      
      // Send final log before navigation
      log("ABOUT TO NAVIGATE");
      
      // Use setTimeout to ensure log completes
      setTimeout(() => {
        log("REDIRECTING NOW");
        window.location.href = `/signup${paths[nextStep]}`;
      }, 200);
      
      return true;
    } catch (error) {
      log(`FATAL ERROR: ${error.message}`);
      throw error;
    } finally {
      setIsLinking(false);
      log("FUNCTION COMPLETE");
    }
  };

  const handleGoogleSignIn = async () => {
    LOG_TO_TERMINAL("GOOGLE SIGN IN: Starting");
    
    if (isSubmitting) {
      LOG_TO_TERMINAL("GOOGLE SIGN IN: Prevented - already submitting");
      return;
    }
    
    setIsSubmitting(true);
    LOG_TO_TERMINAL("GOOGLE SIGN IN: Set isSubmitting to true");
    
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: "",
      verificationCode: "",
      general: ""
    });
    
    try {
      LOG_TO_TERMINAL("GOOGLE SIGN IN: Calling signInWithGoogle");
      // Pass maintainSession:true to keep the Google user signed in for potential linking
      const result = await signInWithGoogle({ maintainSession: true });
      
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Result received: ${JSON.stringify(result)}`);
      
      // More comprehensive check for account conflicts with logging
      const hasConflict = result && (
        result.error === 'auth/account-exists-with-different-credential' || 
        result.accountConflict === true || 
        (result.success === false && result.message && 
          (result.message.includes("already registered") || 
           result.message.includes("already exists") ||
           result.message.includes("account exists")))
      );
      
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Conflict detected: ${hasConflict}`);
        
      if (hasConflict) {
        const email = result.email || result.existingEmail || '';
        LOG_TO_TERMINAL(`GOOGLE SIGN IN: Account conflict with email: ${email}`);
        
        if (!email || !email.includes('@')) {
          LOG_TO_TERMINAL(`GOOGLE SIGN IN: Invalid email for linking: ${email}`);
          setErrors(prev => ({
            ...prev,
            general: "Account linking failed - please try again or use password sign in."
          }));
          setIsSubmitting(false);
          return;
        }
        
        // Don't try to call clearForceNavigation - just set the localStorage directly
        
        // Store in localStorage for persistence across remounts
        localStorage.setItem('linkingEmail', email);
        localStorage.setItem('showLinkingModal', 'true');
        
        LOG_TO_TERMINAL(`GOOGLE SIGN IN: Set localStorage for linking - email: ${email}`);
        
        // Set state to trigger modal
        setLinkingEmail(email);
        setShowLinkingModal(true);
        
        LOG_TO_TERMINAL("GOOGLE SIGN IN: Set linking state in component");
        
        setIsSubmitting(false);
        LOG_TO_TERMINAL("GOOGLE SIGN IN: Set isSubmitting to false");
        return;
      }
      
      // Rest of your existing success case code here
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Success: ${result && result.success}`);
      
      // Existing success handling...
      
    } catch (error) {
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Error occurred: ${error.message}`);
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Error code: ${error.code}`);
      
      // Check for account conflict in error
      const errorHasConflict = error.code === 'auth/account-exists-with-different-credential' || 
        (error.message && (
          error.message.includes("already registered") || 
          error.message.includes("already exists") ||
          error.message.includes("account exists") ||
          error.message.includes("different credential")));
          
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Error contains conflict: ${errorHasConflict}`);
      
      if (errorHasConflict) {
        const email = error.customData?.email || error.email || '';
        LOG_TO_TERMINAL(`GOOGLE SIGN IN: Conflict from error with email: ${email}`);
        
        if (!email || !email.includes('@')) {
          LOG_TO_TERMINAL(`GOOGLE SIGN IN: Invalid email from error: ${email}`);
          setErrors(prev => ({
            ...prev,
            general: "Account linking failed - please try again or use password sign in."
          }));
          setIsSubmitting(false);
          return;
        }
        
        // Store in localStorage for persistence
        localStorage.setItem('linkingEmail', email);
        localStorage.setItem('showLinkingModal', 'true');
        
        LOG_TO_TERMINAL(`GOOGLE SIGN IN: Set localStorage for linking from error - email: ${email}`);
        
        // Set state
        setLinkingEmail(email);
        setShowLinkingModal(true);
        
        LOG_TO_TERMINAL("GOOGLE SIGN IN: Set linking state in component from error");
        
        setIsSubmitting(false);
        LOG_TO_TERMINAL("GOOGLE SIGN IN: Set isSubmitting to false");
        return;
      }
      
      // Existing error handling...
      LOG_TO_TERMINAL(`GOOGLE SIGN IN: Setting general error: ${error.message}`);
      setErrors(prev => ({
        ...prev,
        general: error.message || "Failed to sign in with Google. Please try again."
      }));
      
    } finally {
      setIsSubmitting(false);
      LOG_TO_TERMINAL("GOOGLE SIGN IN: Completed (finally block)");
    }
  };

  const resendVerificationCode = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      console.log("Resending verification code to:", formData.email);
      // Call Firebase function to resend verification code
      const result = await requestEmailVerification(formData.email, formData.name || "New Member");
      
      if (result.success) {
        console.log("Verification code resent successfully");
        // Update verification ID
        setFormData(prev => ({
          ...prev,
          verificationId: result.verificationId,
          verificationCode: "" // Clear any previous code
        }));
        
        // Store verification state WITHOUT password
        saveVerificationState({
          email: formData.email,
          name: formData.name || "New Member",
          verificationId: result.verificationId,
          isExistingUser: result.isExistingUser || false,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
      setErrors(prev => ({
        ...prev,
        verificationCode: error.message || "Failed to resend code. Please try again."
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const changeEmail = () => {
    console.log("Changing email, resetting verification state");
    // Clear verification state in localStorage
    clearVerificationState();
    
    // Reset the verification step
    setVerificationStep("initial");
    
    // Clear verification data but keep name
    setFormData(prev => ({
      ...prev,
      verificationId: "",
      verificationCode: ""
    }));
    
    // Reset the existing user flag
    setIsExistingUser(false);
    
    // Clear any errors
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: "",
      verificationCode: "",
      general: ""
    });
  };

  return (
    <div className="w-full">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {errors.general}
        </div>
      )}
      
      <AccountCreationForm
        formData={formData}
        passwordState={passwordState}
        confirmPasswordState={confirmPasswordState}
        errors={errors}
        isSubmitting={isSubmitting}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleGoogleSignIn={handleGoogleSignIn}
        verificationStep={verificationStep}
        resendVerificationCode={resendVerificationCode}
        changeEmail={changeEmail}
        highlightGoogleButton={highlightGoogleButton}
        setErrors={setErrors}
      />
      
      {/* Account Linking Modal */}
      <AccountLinkingModal
        isOpen={showLinkingModal}
        onClose={() => setShowLinkingModal(false)}
        email={linkingEmail}
        onLinkAccounts={handleLinkAccounts}
        isLoading={isLinking}
      />
      
      {/* Add the debug panel */}
      {process.env.NODE_ENV !== 'production' && <DebugPanel />}
    </div>
  );
};

export default AccountCreationStep;