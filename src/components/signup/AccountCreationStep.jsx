// File: pages/signup/AccountCreationStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../contexts/UserContext";

// Import auth-related functions
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createNewUser,
  signInExistingUser,
  signInWithGoogle
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
  
  // Add debugging for the verification loop
  useEffect(() => {
    console.log("AccountCreationStep mounted/updated");
    console.log("Current user:", currentUser?.uid);
    console.log("Verification step:", verificationStep);
  }, [currentUser, verificationStep]);
  
  // If user is already logged in, redirect to success page
  useEffect(() => {
    if (currentUser) {
      console.log("User already logged in, redirecting to success page");
      
      // Set a force navigation flag to bypass route guards
      setForceNavigation(1); // 1 = success step
      
      // Use window.location for a clean redirect instead of navigate
      window.location.href = '/signup/success';
    }
  }, [currentUser]);
  
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

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
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
      console.log("Attempting Google sign-in");
      const result = await signInWithGoogle();
      
      console.log("Google sign-in result:", result);
      
      // More comprehensive check for account conflicts
      if (result && (
          result.error === 'auth/account-exists-with-different-credential' || 
          result.accountConflict === true || 
          (result.success === false && result.message && 
           (result.message.includes("already registered") || 
            result.message.includes("already exists") ||
            result.message.includes("account exists")))
      )) {
        // Get the email from any possible location in the result
        const email = result.email || result.existingEmail || '';
        
        console.log("Existing account detected, redirecting to account linking");
        // Navigate to login page with parameters to trigger account linking
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      if (result && result.success) {
        console.log("Google sign-in successful:", result);
        
        // Clear verification state since we're now authenticated
        clearVerificationState();
        
        // Only show success screen for new users
        if (result.isNewUser === true) {
          console.log("This is a new user, setting account created flag");
          
          // Set account created flag
          setAccountCreated(true);
          
          // Set just verified flag
          localStorage.setItem('just_verified', 'true');
          localStorage.setItem('verification_timestamp', Date.now().toString());
          
          // Set force navigation to bypass route guards
          setForceNavigation(1); // 1 = success step
          
          console.log("Redirecting to success page");
          // Use window.location for a clean redirect
          window.location.href = '/signup/success';
        } else {
          // For existing users, navigate based on their progress
          console.log("This is an existing user with progress:", result.signupProgress);
          const nextStep = result.signupProgress || 1;
          
          // Map progress to the appropriate path and set force navigation
          setForceNavigation(nextStep);
          
          // Use array indexing for path mapping
          const paths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
          
          console.log(`Redirecting to step ${nextStep}: /signup${paths[nextStep]}`);
          // Use window.location for a clean redirect
          window.location.href = `/signup${paths[nextStep]}`;
        }
      } else if (!result || (result && !result.success && !result.error)) {
        // Handle undefined or unexpected result format
        console.error("Unexpected result format from Google sign-in:", result);
        setErrors(prev => ({
          ...prev,
          general: "Sign-in failed. Please try again or use email/password."
        }));
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      
      // More comprehensive check for error structure in exceptions too
      if (error.code === 'auth/account-exists-with-different-credential' || 
          (error.message && (
            error.message.includes("already registered") || 
            error.message.includes("already exists") ||
            error.message.includes("account exists") ||
            error.message.includes("different credential")))
      ) {
        // Get the email from the error if available
        const email = error.customData?.email || error.email || '';
        
        console.log("Account conflict detected from exception, redirecting to account linking");
        // Navigate to login page with parameters for linking
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      // Handle other specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        setErrors(prev => ({
          ...prev,
          general: "Google sign-in was cancelled. Please try again."
        }));
      } else if (error.code === 'auth/network-request-failed' || 
                 (error.message && error.message.includes('network'))) {
        setErrors(prev => ({
          ...prev,
          general: "Network error. Please check your internet connection and try again."
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: "Error during Google sign-in. Please try again or use email/password."
        }));
      }
    } finally {
      setIsSubmitting(false);
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
    </div>
  );
};

export default AccountCreationStep;