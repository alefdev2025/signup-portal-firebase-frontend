// File: pages/signup/AccountCreationStep.jsx - ROUTER-FREE VERSION
import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { debugLogger, DebugPanel } from '../../components/debug/logs';
// REMOVED: import { useSearchParams } from 'react-router-dom';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../services/firebase";
import { useSignupFlow } from "../../contexts/SignupFlowContext";

// Import auth-related functions
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createNewUser,
  signInExistingUser,
  signInWithGoogle,
  getPendingLinkingEmail,
  signInWithEmailAndPassword,
  linkGoogleToEmailAccount
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

// ROUTER REPLACEMENT: Native URL parameter utilities
const getUrlParam = (key) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
};

const removeUrlParams = (keys) => {
  const url = new URL(window.location);
  keys.forEach(key => url.searchParams.delete(key));
  window.history.replaceState(null, '', url.toString());
};

// Global debug function
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[DEBUG] ${message}`);
    console.log(`[DEBUG] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const AccountCreationStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState("initial");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [highlightGoogleButton, setHighlightGoogleButton] = useState(false);
  const [isNavigatingPostVerification, setIsNavigatingPostVerification] = useState(false);
  
  // Keep password in memory only
  const [passwordState, setPasswordState] = useState('');
  const [confirmPasswordState, setConfirmPasswordState] = useState('');
  
  // Account linking modal state
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingEmail, setLinkingEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  // REMOVED: const [searchParams, setSearchParams] = useSearchParams();
  const [isLinkingInProgress, setIsLinkingInProgress] = useState(false);

  const { navigateToStep } = useSignupFlow();
  
  const [formData, setFormData] = useState({
    name: "New Member",
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
  
  // ALL HOOKS FIRST

  // Check if user is already logged in - COMPLETELY DISABLED
  useEffect(() => {
    if (currentUser) {
      const isLinking = localStorage.getItem('linkingEmail') !== null;
      
      if (!isLinking) {
        console.log("User already logged in - but staying on current page to prevent reloads");
        // COMPLETELY REMOVED: All automatic navigation
      } else {
        console.log("Not redirecting - account linking in progress");
      }
    }
  }, [currentUser]);

  // Check for pending linking email
  useEffect(() => {
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

  // Check localStorage for linking state
  useEffect(() => {
    LOG_TO_TERMINAL("Checking localStorage for linking state");
    
    const storedEmail = localStorage.getItem('linkingEmail');
    const showModal = localStorage.getItem('showLinkingModal');
    
    LOG_TO_TERMINAL(`Linking state check - email: ${storedEmail || 'null'}, showModal: ${showModal || 'null'}`);
    
    if (storedEmail && showModal === 'true') {
      LOG_TO_TERMINAL(`Found linking state in localStorage: ${storedEmail}`);
      
      setLinkingEmail(storedEmail);
      setShowLinkingModal(true);
      
      LOG_TO_TERMINAL("Set component state for linking modal");
    }
  }, []);

  // ROUTER-FREE: Check URL params using native JavaScript
  useEffect(() => {
    LOG_TO_TERMINAL("Checking for URL params");
    
    const linkingEmail = getUrlParam('linkEmail');
    const showModal = getUrlParam('showLinkingModal');
    
    LOG_TO_TERMINAL(`URL params check - linkEmail: ${linkingEmail || 'null'}, showModal: ${showModal || 'null'}`);
    
    if (linkingEmail && showModal === 'true') {
      LOG_TO_TERMINAL(`Found linking params in URL: ${linkingEmail}`);
      
      localStorage.setItem('linkingEmail', linkingEmail);
      localStorage.setItem('showLinkingModal', 'true');
      
      setLinkingEmail(linkingEmail);
      setShowLinkingModal(true);
      
      LOG_TO_TERMINAL("Set component state for linking modal from URL params");
      
      // ROUTER-FREE: Remove URL params using native JavaScript
      removeUrlParams(['linkEmail', 'showLinkingModal']);
      
      LOG_TO_TERMINAL("Removed linking params from URL");
    }
  }, []); // ROUTER-FREE: No dependencies on searchParams

  // Debug initialization
  useEffect(() => {
    LOG_TO_TERMINAL("AccountCreationStep MOUNTED");
    LOG_TO_TERMINAL(`Current User: ${currentUser ? currentUser.uid : 'null'}`);
    LOG_TO_TERMINAL(`Initial VerificationStep: ${verificationStep}`);
    
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
      if (document.body.contains(debugButton)) {
        document.body.removeChild(debugButton);
      }
      LOG_TO_TERMINAL("AccountCreationStep UNMOUNTED");
    };
  }, []);
  
  // Check for existing verification state
  useEffect(() => {
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: "",
      verificationCode: "",
      general: ""
    });
    
    const savedVerificationState = getVerificationState();
    
    if (savedVerificationState) {
      console.log("Found saved verification state:", savedVerificationState);
      
      const now = Date.now();
      const stateAge = now - (savedVerificationState.timestamp || 0);
      const maxAge = 15 * 60 * 1000;
      
      if (stateAge < maxAge) {
        setFormData(prevData => ({
          ...prevData,
          email: savedVerificationState.email || "",
          name: savedVerificationState.name || "New Member",
          verificationId: savedVerificationState.verificationId || ""
        }));
        
        setIsExistingUser(savedVerificationState.isExistingUser || false);
        
        if (savedVerificationState.verificationId) {
          setVerificationStep("verification");
        }
      } else {
        console.log("Verification state is stale, clearing it");
        clearVerificationState();
      }
    }
  }, []);

  // VERIFICATION SUCCESS OVERLAY COMPONENT - MOVED AFTER ALL HOOKS
  const VerificationSuccessOverlay = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#6f2d74] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Account Created Successfully!</h2>
        <p className="text-lg text-gray-600">Taking you to the next step...</p>
      </div>
    </div>
  );

  // SIMPLIFIED SUCCESS SETUP
  const redirectToSuccessPage = async () => {
    console.log("=== CLEANING UP AFTER SUCCESSFUL AUTH ===");
    
    try {
      // 1. Clear verification state
      console.log("Step 1: Clearing verification state");
      clearVerificationState();
      setAccountCreated(true);
      
      // 2. Reset form state
      console.log("Step 2: Resetting form state");
      setVerificationStep("initial");
      setFormData(prev => ({
        ...prev,
        verificationCode: "",
        verificationId: ""
      }));
      
      console.log("Step 3: Cleanup complete - UserContext should have already detected flags and transitioned");
      
    } catch (error) {
      console.error("Error during cleanup:", error);
      setIsNavigatingPostVerification(false);
    }
  };

  // HANDLER FUNCTIONS (rest remain the same)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'password') {
      setPasswordState(value);
      
      if (errors.confirmPassword && confirmPasswordState === value) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ""
        }));
      }
    } else if (name === 'confirmPassword') {
      setConfirmPasswordState(value);
      
      if (errors.confirmPassword && value === passwordState) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ""
        }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
    
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
    if (password.length >= 12) {
      return ((/[A-Z]/.test(password) || /[a-z]/.test(password)) && 
              (/[0-9]/.test(password) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)));
    } else {
      return password.length >= 8 && 
             /[A-Z]/.test(password) && 
             /[a-z]/.test(password) && 
             /[0-9]/.test(password);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log("Preventing double submission");
      return;
    }
    
    if (verificationStep === "initial") {
      // Validation logic (same as before)
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
      
      const hasErrors = Object.values(newErrors).some(error => error);
      
      if (hasErrors) {
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        console.log("Requesting email verification for:", formData.email);
        const result = await requestEmailVerification(formData.email, formData.name || "New Member");
        
        if (result.success) {
          console.log("Verification request successful:", result);
          
          if (result.isExistingUser) {
            console.log("This is an existing user - redirecting to login");
            
            if ((result.authProviders && result.authProviders.includes('google.com') && !result.hasPasswordAuth) || 
                (result.authProvider === 'google' && !result.hasPasswordAuth)) {
              
              window.location.href = `/login?email=${encodeURIComponent(formData.email)}&continue=signup&provider=google&addPassword=true`;
              setIsSubmitting(false);
              return;
            }
            
            if ((result.authProviders && result.authProviders.includes('password') && !result.hasGoogleAuth) || 
                (result.authProvider === 'password' && !result.hasGoogleAuth) ||
                (result.hasPasswordAuth && !result.hasGoogleAuth)) {
              
              window.location.href = `/login?email=${encodeURIComponent(formData.email)}&continue=signup&provider=password&linkAccounts=true`;
              setIsSubmitting(false);
              return;
            }
            
            window.location.href = `/login?email=${encodeURIComponent(formData.email)}&continue=signup`;
            setIsSubmitting(false);
            return;
          }
          
          console.log("This is a new user, showing verification form");
          setFormData(prev => ({
            ...prev,
            verificationId: result.verificationId,
            verificationCode: ""
          }));
          
          saveVerificationState({
            email: formData.email,
            name: formData.name || "New Member",
            verificationId: result.verificationId,
            isExistingUser: false,
            timestamp: Date.now()
          });
          
          // CONTENT SWAP: Switch to verification form
          setVerificationStep("verification");
        } else {
          console.error("Verification request returned success:false");
          setErrors(prev => ({
            ...prev,
            email: "Failed to send verification code"
          }));
        }
      } catch (error) {
        console.error('Error requesting verification:', error);
        
        if (error.code === 'auth/email-already-in-use' || 
            (error.message && error.message.toLowerCase().includes('already exists') || 
             error.message && error.message.toLowerCase().includes('already in use'))) {
          
          window.location.href = `/login?email=${encodeURIComponent(formData.email)}&continue=signup`;
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
      // Verification code validation (same as before)
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
        const verificationResult = await verifyEmailCodeOnly(
          formData.verificationId, 
          formData.verificationCode
        );
        
        if (verificationResult.success) {
          console.log("Verification successful:", verificationResult);
          
          // CRITICAL: Set verification flags BEFORE authentication to ensure UserContext sees them
          console.log("Setting verification flags BEFORE authentication");
          localStorage.setItem('just_verified', 'true');
          localStorage.setItem('verification_timestamp', Date.now().toString());
          
          // DON'T show navigation overlay yet - let the form stay visible during auth
          // setIsNavigatingPostVerification(true);
          
          let authResult;
          
          try {
            if (verificationResult.isExistingUser) {
              console.log("This is an existing user, signing in");
              authResult = await signInExistingUser(
                verificationResult,
                formData.email,
                passwordState
              );
            } else {
              console.log("This is a new user, creating account");
              authResult = await createNewUser(
                {
                  ...verificationResult,
                  verificationId: formData.verificationId
                },
                formData.email,
                formData.name || "New Member",
                passwordState
              );
            }
            
            setPasswordState('');
            setConfirmPasswordState('');
            
            if (authResult.success) {
              console.log("Authentication successful, setup complete");
              
              // NOW show the navigation overlay after auth completes
              setIsNavigatingPostVerification(true);
              
              // SIMPLIFIED: Just wait for UserContext to detect the flags and handle transition
              await redirectToSuccessPage();
              
            } else {
              console.error("Authentication result indicated failure:", authResult);
              setErrors(prev => ({
                ...prev,
                general: "Authentication failed. Please try again."
              }));
            }
          } catch (authError) {
            console.error("Error during authentication process:", authError);
            setErrors(prev => ({
              ...prev,
              general: authError.message || "An error occurred during account setup."
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

  // Other handler functions remain the same
  const resendVerificationCode = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      console.log("Resending verification code to:", formData.email);
      const result = await requestEmailVerification(formData.email, formData.name || "New Member");
      
      if (result.success) {
        console.log("Verification code resent successfully");
        setFormData(prev => ({
          ...prev,
          verificationId: result.verificationId,
          verificationCode: ""
        }));
        
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
    clearVerificationState();
    
    setVerificationStep("initial");
    
    setFormData(prev => ({
      ...prev,
      verificationId: "",
      verificationCode: ""
    }));
    
    setIsExistingUser(false);
    
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

  // Placeholder for other handlers
  const handleLinkAccounts = async (password) => {
    console.log("Account linking - simple operations only");
  };

  const handleGoogleSignIn = async () => {
    console.log("Starting Google sign-in process...");
    
    // Check terms acceptance first
    if (!formData.termsAccepted) {
      setErrors(prev => ({
        ...prev,
        termsAccepted: "You must accept the Terms of Use and Privacy Policy to continue"
      }));
      return;
    }
    
    if (isSubmitting) {
      console.log("Prevented - already submitting");
      return;
    }
    
    setIsSubmitting(true);
    console.log("Set isSubmitting to true");
    
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
      console.log("Calling signInWithGoogle");
      // This line opens the popup!
      const result = await signInWithGoogle({ maintainSession: true });
      
      console.log("Google sign-in result:", result);
      
      if (result.success) {
        console.log("Google sign-in successful!");
        
        localStorage.setItem('just_verified', 'true');
        localStorage.setItem('verification_timestamp', Date.now().toString());
        
        // Navigate to success step (step 1) using your SignupFlow routing
        navigateToStep(1, { reason: 'google_signin_success', force: true });
        
        console.log("✅ Google sign-in completed - navigating to success step");
      } else if (result.accountConflict) {
        // Handle account conflicts like in your original
        const email = result.email || result.existingEmail || '';
        console.log("Account conflict detected for:", email);
        
        localStorage.setItem('linkingEmail', email);
        localStorage.setItem('showLinkingModal', 'true');
        
        setLinkingEmail(email);
        setShowLinkingModal(true);
      }
      
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrors(prev => ({
        ...prev,
        general: error.message || "Failed to sign in with Google. Please try again."
      }));
    } finally {
      setIsSubmitting(false);
      console.log("Google sign-in process completed");
    }
  };

  // RENDER
  if (isNavigatingPostVerification) {
    return <VerificationSuccessOverlay />;
  }

  return (
    <div className="w-full">
      {isLinkingInProgress && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Linking your accounts...</p>
          </div>
        </div>
      )}
      
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
      
      <AccountLinkingModal
        isOpen={showLinkingModal}
        onClose={() => setShowLinkingModal(false)}
        email={linkingEmail}
        onLinkAccounts={handleLinkAccounts}
        isLoading={isLinking}
      />
      
      {process.env.NODE_ENV !== 'production' && <DebugPanel />}
    </div>
  );
};

export default AccountCreationStep;