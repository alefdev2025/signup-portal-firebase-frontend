// File: pages/SignupPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

// Updated imports
import ResponsiveBanner from "../components/ResponsiveBanner";
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createNewUser,
  signInExistingUser,
  signInWithGoogle,
  updateSignupProgress,
  clearVerificationState,
  auth
} from "../services/auth";
import { 
  useUser, 
  getVerificationState, 
  saveVerificationState,
  getStepFormData,
  saveFormData,
  initializeFreshSignup
} from "../contexts/UserContext";

// Import step components
import ContactInfoPage from "./ContactInfoPage.jsx";

// Import decomposed components
import AccountCreationForm from "../components/signup/AccountCreationForm";
import AccountCreationSuccess from "../components/signup/AccountCreationSuccess";
import HelpPanel from "../components/signup/HelpPanel";

const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

// Function to check if account is created
const isAccountCreated = () => {
  return localStorage.getItem('account_creation_success') === 'true';
}

// Function to set account created
const setAccountCreated = (value = true) => {
  localStorage.setItem('account_creation_success', value ? 'true' : 'false');
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, signupState } = useUser();
  const location = useLocation();
  
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState("initial"); // "initial", "verification"
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const hasNavigatedRef = useRef(false); // We'll keep this but use localStorage instead
  const [highlightGoogleButton, setHighlightGoogleButton] = useState(false);
  
  console.log("SignupPage rendered with activeStep:", activeStep);
  console.log("URL params:", Object.fromEntries([...searchParams]));
  console.log("hasNavigatedRef:", hasNavigatedRef.current);
  console.log("isAccountCreated:", isAccountCreated());
  
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
  });
  
  // Function to get previous path
  const getPreviousPath = () => {
    const history = JSON.parse(localStorage.getItem('navigation_history') || '[]');
    if (history.length <= 1) return "/";
    return history[history.length - 2];
  };

  // EMERGENCY FORCE STEP HANDLER - This must run before any other logic
useEffect(() => {
    // Check for force_active_step in localStorage
    const forceStep = localStorage.getItem('force_active_step');
    const forceTimestamp = localStorage.getItem('force_timestamp');
    
    // Only apply if it's recent (within last 5 seconds)
    if (forceStep && forceTimestamp) {
      const stepNumber = parseInt(forceStep, 10);
      const timestamp = parseInt(forceTimestamp, 10);
      const now = Date.now();
      const isRecent = (now - timestamp) < 5000; // 5 seconds
      
      if (!isNaN(stepNumber) && isRecent) {
        console.log(`🚨 EMERGENCY OVERRIDE: Force setting step to ${stepNumber}`);
        
        // Force update the step
        setActiveStep(stepNumber);
        
        // Clean up
        localStorage.removeItem('force_active_step');
        localStorage.removeItem('force_timestamp');
      }
    }
  }, []); // Empty deps - runs once on mount
  
  // Check for fresh signup flag on component mount
  useEffect(() => {
    console.log("Checking for fresh signup flag");
    // Check for fresh signup flag
    const isFreshSignup = initializeFreshSignup();
    console.log("Fresh signup?", isFreshSignup);
    
    if (isFreshSignup) {
      // Reset verification step
      setVerificationStep("initial");
      hasNavigatedRef.current = false;
      setAccountCreated(false); // Reset account creation state
      
      // Reset form data
      setFormData({
        name: "New Member",
        email: "",
        termsAccepted: false,
        verificationCode: "",
        verificationId: "",
      });
      
      // Reset errors
      setErrors({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        termsAccepted: "",
        verificationCode: "",
      });
      
      console.log("SignupPage reset for fresh signup");
    }
  }, []);
  
  // Track navigation for back button functionality
  useEffect(() => {
    // Add current path to navigation history
    const currentPath = location.pathname + location.search;
    console.log("Adding path to navigation history:", currentPath);
    
    // Store in localStorage (a simplified version)
    const history = JSON.parse(localStorage.getItem('navigation_history') || '[]');
    if (history.length === 0 || history[history.length - 1] !== currentPath) {
      const newHistory = [...history, currentPath].slice(-20); // Keep last 20 entries
      localStorage.setItem('navigation_history', JSON.stringify(newHistory));
      console.log("Updated navigation history:", newHistory);
    }
  }, [location]);
  
  
  // URL-based routing and step management
  useEffect(() => {
    console.log("--- Navigation Debug ---");
    console.log("URL Params:", new URLSearchParams(location.search).get('step'));
    console.log("Current User:", currentUser);
    console.log("Signup State:", signupState);
    console.log("hasNavigatedRef:", hasNavigatedRef.current);
    console.log("isAccountCreated:", isAccountCreated());
    
    // Parse URL for parameters
    const urlParams = new URLSearchParams(location.search);
    const stepParam = parseInt(urlParams.get('step'));
    const forceParam = urlParams.get('force') === 'true';
    const showSuccessParam = urlParams.get('showSuccess') === 'true';
    
    // Check for showSuccess parameter
    if (showSuccessParam && currentUser) {
      console.log("showSuccess parameter detected, setting hasNavigatedRef to true");
      hasNavigatedRef.current = true;
      setAccountCreated(true); // Set account creation state
      
      // Clean up the URL by removing the showSuccess parameter
      const newUrl = `/signup?step=0`;
      navigate(newUrl, { replace: true });
      return;
    }
    
    console.log("URL Step Param:", stepParam);
    console.log("Force Navigation:", forceParam);
    
    // If force=true parameter is present, override verification checks
    /*if (forceParam && !isNaN(stepParam) && stepParam >= 0 && stepParam < steps.length) {
      console.log("Force parameter detected, setting activeStep to:", stepParam);
      setActiveStep(stepParam);
      
      // Clean up the URL by removing the force parameter
      const newUrl = `/signup?step=${stepParam}`;
      navigate(newUrl, { replace: true });
      return;
    }*/

    // If force=true parameter is present, override verification checks
if (forceParam && !isNaN(stepParam) && stepParam >= 0 && stepParam < steps.length) {
    console.log("🚨 FORCE PARAM: Emergency setting activeStep to:", stepParam);
    
    // Force update with timeout to ensure it happens after everything else
    setTimeout(() => {
      setActiveStep(stepParam);
      
      // DO NOT clean up the URL right away - wait a moment
      setTimeout(() => {
        const newUrl = `/signup?step=${stepParam}`;
        navigate(newUrl, { replace: true });
      }, 500);
    }, 0);
    
    // Early exit to prevent other logic from interfering
    return;
  }
    
    // First handle the case where we have a user
    if (currentUser) {
      console.log("User is logged in - checking step param");
      
      // User is authenticated - we should allow progression
      // Get the progress from signupState if available
      let storedProgress = 0;
      if (signupState) {
        storedProgress = Math.min(signupState.signupProgress || 0, steps.length - 1);
        console.log("Using progress from signupState:", storedProgress);
      } else {
        // No signupState available, but user is authenticated
        // We'll let them proceed but will set activeStep to 0 if no valid step param
        console.log("No signupState available, but user is authenticated");
      }
      
      // If valid step in URL and not greater than stored progress + 1, allow it
      // (we allow current progress + 1 to let users move forward one step)
      if (!isNaN(stepParam) && stepParam >= 0 && stepParam <= Math.max(1, storedProgress + 1)) {
        console.log("Setting activeStep to URL param:", stepParam);
        setActiveStep(stepParam);
      } else if (!isNaN(stepParam) && stepParam > storedProgress + 1) {
        // If trying to access a step too far ahead, redirect to highest allowed
        const allowedStep = Math.max(storedProgress, 1); // Allow at least step 1 for authenticated users
        console.log(`Step ${stepParam} is too far ahead. Redirecting to allowed step:`, allowedStep);
        setActiveStep(allowedStep);
        navigate(`/signup?step=${allowedStep}`, { replace: true });
      } else {
        // If no valid param, set to stored progress or 0
        const defaultStep = Math.max(storedProgress, 0);
        console.log("No valid step param, setting activeStep to:", defaultStep);
        setActiveStep(defaultStep);
        
        // Update URL if needed
        navigate(`/signup?step=${defaultStep}`, { replace: true });
      }
    } else {
      // For non-authenticated users
      console.log("No user, URL Step Param:", stepParam);
      
      // If valid step in URL, set active step with some validation
      if (!isNaN(stepParam) && stepParam >= 0 && stepParam < steps.length) {
        // Check if trying to access later steps without verification
        if (stepParam > 0) {
          // Check if verification is valid
          const verificationState = getVerificationState();
          const isValid = verificationState && (Date.now() - verificationState.timestamp < 15 * 60 * 1000);
          console.log("Verification state:", verificationState);
          console.log("Verification valid:", isValid);
          
          if (!isValid) {
            // If not valid, redirect to step 0
            console.log("Invalid verification, redirecting to step 0");
            navigate('/signup?step=0', { replace: true });
            setActiveStep(0);
          } else {
            console.log("Setting activeStep to:", stepParam);
            setActiveStep(stepParam);
          }
        } else {
          // For step 0, always allow access
          console.log("Setting activeStep to:", stepParam);
          setActiveStep(stepParam);
        }
      } else {
        // Handle the case where step param is invalid or missing
        // This is the key fix - ensure we default to step 0
        console.log("Invalid or missing step param, defaulting to 0");
        setActiveStep(0);
        
        // Only update URL if it's not already set to step=0
        if (isNaN(stepParam)) {
          navigate('/signup?step=0', { replace: true });
        }
      }
    }
  }, [location, currentUser, signupState, navigate, steps.length]);
  
  // Check for one-time email links
  useEffect(() => {
    console.log("Checking for email verification links");
    // Check if this is an email verification link
    if (auth.isSignInWithEmailLink && auth.isSignInWithEmailLink(window.location.href)) {
      console.log("This is an email verification link");
      const email = localStorage.getItem('emailForSignIn');
      
      if (email) {
        console.log("Found email in localStorage:", email);
        // Sign in the user with the email link
        auth.signInWithEmailLink(email, window.location.href)
          .then((result) => {
            // Clear email from localStorage
            localStorage.removeItem('emailForSignIn');
            console.log("Email sign-in successful");
            
            // Redirect to appropriate step
            if (result.user) {
              const stepIndex = signupState?.signupProgress || 1;
              navigate(`/signup?step=${stepIndex}`, { replace: true });
            }
          })
          .catch((error) => {
            console.error("Error verifying email link:", error);
          });
      } else {
        // If email isn't found, prompt user to enter it
        alert("Please enter your email for verification.");
      }
    }
  }, [navigate, signupState]);
  
  // Check for existing verification and user state on component mount
  useEffect(() => {
    console.log("--- Verification State Debug ---");
    
    // Clear any form errors on mount
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: "",
      verificationCode: "",
    });
    
    // Check if there's a saved verification state
    const savedVerificationState = getVerificationState();
    console.log("Saved verification state:", savedVerificationState);
    
    if (savedVerificationState) {
      // Check if verification state is stale (older than 15 minutes)
      const now = Date.now();
      const stateAge = now - (savedVerificationState.timestamp || 0);
      const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
      console.log("Verification age (ms):", stateAge);
      console.log("Max age (ms):", maxAge);
      console.log("Is verification stale:", stateAge >= maxAge);
      
      if (stateAge < maxAge) {
        console.log("Using saved verification state");
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
        // Verification state is stale, clear it
        console.log("Verification state is stale, clearing it");
        clearVerificationState();
      }
    }
    
    // If user is already logged in and has signup state, set active step
    if (currentUser && signupState) {
      // Check if we should set hasNavigated based on progress
      const storedProgress = signupState.signupProgress || 0;
      if (storedProgress >= 1 && activeStep === 0) {
        console.log("Setting hasNavigatedRef to true based on user progress");
        hasNavigatedRef.current = true;
        setAccountCreated(true); // Set account creation state
      }
      
      // Set active step based on signup progress
      const stepIndex = Math.min(signupState.signupProgress || 0, steps.length - 1);
      setActiveStep(stepIndex);
      console.log("User is logged in, setting activeStep to:", stepIndex);
    }
    
    // User state debug
    console.log("Current user:", currentUser);
    console.log("Signup state:", signupState);
  }, [currentUser, signupState, steps.length, activeStep]);

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
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form submission event object type:", e.type);
    console.log("verificationStep:", verificationStep);
    console.log("Form data being submitted:", formData);
    console.log("Password state exists:", !!passwordState);
    console.log("Terms accepted:", formData.termsAccepted);
    
    // Prevent double submission
    if (isSubmitting) {
      console.log("Form already submitting, preventing double submission");
      return;
    }
    
    if (verificationStep === "initial") {
      console.log("Handling initial email/password form submission");
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
      console.log("Form validation errors:", newErrors);
      
      // Check if there are any errors
      const hasErrors = Object.values(newErrors).some(error => error);
      console.log("Form has validation errors:", hasErrors);
      
      if (hasErrors) {
        console.log("Stopping submission due to validation errors");
        return;
      }
      
      setIsSubmitting(true);
      console.log("Setting isSubmitting to true");
      
      try {
        // Call Firebase function to create email verification
        console.log("Requesting email verification for:", formData.email);
        const result = await requestEmailVerification(formData.email, formData.name || "New Member");
        
        console.log("Verification request result:", result);
        
        if (result.success) {
          // Check if this is an existing user - based on the backend response
          if (result.isExistingUser) {
            console.log("Existing user detected:", formData.email);
            
            // Check if this is a Google-only user (has Google auth but no password)
            if ((result.authProviders && result.authProviders.includes('google.com') && !result.hasPasswordAuth) || 
                (result.authProvider === 'google' && !result.hasPasswordAuth)) {
              console.log("Google-only account detected");
              
              // Navigate to login page with parameters for adding password to Google account
              navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup&provider=google&addPassword=true`);
              setIsSubmitting(false);
              return;
            }
            
            // Check if this is an email/password-only user (trying to use Google)
            if ((result.authProviders && result.authProviders.includes('password') && !result.hasGoogleAuth) || 
                (result.authProvider === 'password' && !result.hasGoogleAuth) ||
                (result.hasPasswordAuth && !result.hasGoogleAuth)) {
              console.log("Password-only account detected - need to link Google");
              
              // Navigate to login page with parameters for linking Google to password account
              navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup&provider=password&linkAccounts=true`);
              setIsSubmitting(false);
              return;
            }
            
            // For users with both auth methods or any other case, redirect to standard login
            console.log("Redirecting existing user to standard login");
            navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup`);
            setIsSubmitting(false);
            return;
          }
          
          // Store verification ID for the next step
          setFormData(prev => ({
            ...prev,
            verificationId: result.verificationId,
            verificationCode: "" // Clear any previous code
          }));
          console.log("Updated formData with verificationId:", result.verificationId);
          
          // Store verification state WITHOUT password
          saveVerificationState({
            email: formData.email,
            name: formData.name || "New Member",
            verificationId: result.verificationId,
            isExistingUser: false, // Not an existing user since we're proceeding
            timestamp: Date.now()
          });
          console.log("Saved verification state to localStorage");
          
          // Move to verification step
          setVerificationStep("verification");
          console.log("Set verificationStep to 'verification'");
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
        console.error('Error details - name:', error.name);
        console.error('Error details - message:', error.message);
        console.error('Error details - code:', error.code);
        console.error('Error details - stack:', error.stack);
        
        // Check for Firebase auth errors that might indicate an existing user
        if (error.code === 'auth/email-already-in-use' || 
            (error.message && error.message.toLowerCase().includes('already exists') || 
             error.message && error.message.toLowerCase().includes('already in use'))) {
          
          // Navigate directly to login page with the email
          console.log("Email already in use, redirecting to login");
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
        console.log("Setting isSubmitting back to false");
        console.log("=== FORM SUBMISSION COMPLETED ===");
      }
    } else if (verificationStep === "verification") {
      console.log("Handling verification code submission");
      // Verify Code Submission
      
      // Validate verification code format
      if (!formData.verificationCode.trim()) {
        console.log("Verification code is empty");
        setErrors(prev => ({
          ...prev,
          verificationCode: "Verification code is required"
        }));
        return;
      }
      
      if (formData.verificationCode.length !== 6 || !/^\d{6}$/.test(formData.verificationCode)) {
        console.log("Invalid verification code format");
        setErrors(prev => ({
          ...prev,
          verificationCode: "Please enter a valid 6-digit code"
        }));
        return;
      }
      
      // Ensure we have a verification ID
      if (!formData.verificationId) {
        console.log("Missing verificationId");
        setErrors(prev => ({
          ...prev,
          verificationCode: "Verification session expired. Please request a new code."
        }));
        return;
      }
      
      setIsSubmitting(true);
      console.log("Setting isSubmitting to true");
      
      try {
        // First, verify the code only (no authentication attempt yet)
        console.log("Verifying code:", formData.verificationCode);
        const verificationResult = await verifyEmailCodeOnly(
          formData.verificationId, 
          formData.verificationCode
        );
        
        if (verificationResult.success) {
          console.log("Code verification successful");
          
          // Check if this is an existing user from the verification result
          if (verificationResult.isExistingUser) {
            console.log("Verification indicates an existing user");
            
            // Use signInExistingUser for existing users
            console.log("Signing in existing user");
            const authResult = await signInExistingUser(
              verificationResult,
              formData.email,
              passwordState
            );
            
            // Clear password from memory immediately
            setPasswordState('');
            setConfirmPasswordState('');
            console.log("Cleared password from memory");
            
            if (authResult.success) {
              console.log("Existing user sign in successful");
              // Clear verification state
              clearVerificationState();
              console.log("Cleared verification state from localStorage");
              
              // Set hasNavigatedRef to true to show success screen
              hasNavigatedRef.current = true;
              setAccountCreated(true); // Set account creation state
              console.log("Set hasNavigatedRef to true and account creation state to true");
              
              // Reset verification step
              setVerificationStep("initial");
              console.log("Reset verificationStep to 'initial'");
              
              // Clear verification code
              setFormData(prev => ({
                ...prev,
                verificationCode: "",
                verificationId: ""
              }));
              console.log("Cleared verification code and ID from formData");
              
              // Navigate to signup with showSuccess parameter
              navigate('/signup?step=0&showSuccess=true', { replace: true });
            }
          } else {
            // Use createNewUser for new users
            console.log("Creating new user account");
            const authResult = await createNewUser(
              {
                ...verificationResult,
                verificationId: formData.verificationId  // Add the ID from formData
              },
              formData.email,
              formData.name || "New Member",
              passwordState
            );
            
            // Clear password from memory immediately
            setPasswordState('');
            setConfirmPasswordState('');
            console.log("Cleared password from memory");
            
            if (authResult.success) {
              console.log("New user creation successful");
              // Clear verification state
              clearVerificationState();
              console.log("Cleared verification state from localStorage");
              
              // Set hasNavigatedRef to true to show success screen
              hasNavigatedRef.current = true;
              setAccountCreated(true); // Set account creation state
              console.log("Set hasNavigatedRef to true and account creation state to true");
              
              // Update progress in Firebase
              try {
                await updateSignupProgress("contact_info", 1, {});
                console.log("Firebase progress updated to step 1");
              } catch (progressError) {
                console.error("Error updating progress:", progressError);
                // Continue anyway
              }
              
              // Reset verification step
              setVerificationStep("initial");
              console.log("Reset verificationStep to 'initial'");
              
              // Clear verification code
              setFormData(prev => ({
                ...prev,
                verificationCode: "",
                verificationId: ""
              }));
              console.log("Cleared verification code and ID from formData");
              
              // Navigate to signup with showSuccess parameter
              navigate('/signup?step=0&showSuccess=true', { replace: true });
            }
          }
        }
      } catch (error) {
        console.error("Error verifying code:", error);
        console.error("Error details - name:", error.name);
        console.error("Error details - message:", error.message);
        console.error("Error details - code:", error.code);
        console.error("Error details - stack:", error.stack);
        
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
        console.log("Setting isSubmitting back to false");
        console.log("=== FORM SUBMISSION COMPLETED ===");
      }
    }
  };

// Updated handleGoogleSignIn function that properly resets UI state

const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    console.log("Starting Google sign-in process");
    
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
    
    // Setup a timeout to automatically reset the UI state in case of hanging
    const resetTimeout = setTimeout(() => {
      console.log("Safety timeout triggered - resetting UI");
      setIsSubmitting(false);
    }, 30000); // 30 second safety timeout
    
    try {
      console.log("Calling signInWithGoogle()");
      const result = await signInWithGoogle();
      
      // Clear the safety timeout since we got a response
      clearTimeout(resetTimeout);
      
      console.log("Google sign-in result:", result);
      
      // Check specifically for account-exists-with-different-credential error
      if (result && result.error === 'auth/account-exists-with-different-credential') {
        console.log("Account conflict detected");
        
        // Get the email from the result
        const email = result.email || '';
        console.log(`Redirecting to login for account linking with email: ${email}`);
        
        // Navigate to login page with parameters to trigger account linking
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      if (result && result.success) {
        // Clear verification state since we're now authenticated
        clearVerificationState();
        console.log("Cleared verification state");
        
        // Only show success screen for new users
        if (result.isNewUser === true) {
          // Set hasNavigatedRef to true to show success screen for new users
          hasNavigatedRef.current = true;
          setAccountCreated(true); // Set account creation state
          console.log("Set hasNavigatedRef to true and account creation state to true");
          
          // After sign-in, wait a moment for auth state to update
          setTimeout(() => {
            // Navigate to signup with showSuccess parameter
            console.log("Navigating to signup with showSuccess parameter");
            navigate('/signup?step=0&showSuccess=true', { replace: true });
          }, 500);
        } else {
          // For existing users, get their current step
          console.log("Existing user detected, getting current step");
          
          // Give Firebase a moment to update auth state
          setTimeout(() => {
            // Navigate directly to the next step (default to step 1 if not available)
            const nextStep = result.signupProgress || 1;
            console.log(`Navigating to step ${nextStep} for existing user`);
            navigate(`/signup?step=${nextStep}`, { replace: true });
          }, 500);
        }
      } else {
        console.error("Google sign-in did not return success=true");
        
        // IMMEDIATELY reset the UI to normal state
        setIsSubmitting(false);
      }
    } catch (error) {
      // Clear the safety timeout since we got a response
      clearTimeout(resetTimeout);
      
      console.error("Error during Google sign-in:", error);
      
      // Check for different credential error directly from the caught error
      if (error.code === 'auth/account-exists-with-different-credential') {
        console.log("Caught auth/account-exists-with-different-credential error");
        
        // Get the email from the error if available
        const email = error.customData?.email || '';
        
        // Navigate to login page with parameters for linking
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      // IMMEDIATELY reset the UI to normal state for any error
      setIsSubmitting(false);
    }
  };

  const resendVerificationCode = async () => {
    if (isSubmitting) return;
    console.log("Resending verification code");
    setIsSubmitting(true);
    
    try {
      // Call Firebase function to resend verification code
      // Note: Password is kept in memory and not sent to the backend
      console.log("Requesting new verification code for:", formData.email);
      const result = await requestEmailVerification(formData.email, formData.name || "New Member");
      
      if (result.success) {
        console.log("Verification code sent successfully");
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
    console.log("Changing email");
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
    });
    
    console.log("Email change complete");
  };

  const toggleHelpInfo = () => {
    setShowHelpInfo(!showHelpInfo);
    console.log("Toggled help info:", !showHelpInfo);
  };
  
  const handleBack = () => {
    console.log("Handling back button");
    if (activeStep > 0) {
      const prevStep = activeStep - 1;
      console.log("Going back to step:", prevStep);
      
      // Set hasNavigatedRef to true if going back to step 0
      if (prevStep === 0) {
        hasNavigatedRef.current = true;
        setAccountCreated(true); // Set account creation state
        console.log("Setting hasNavigatedRef to true and account creation state to true because going back to step 0");
      }
      
      setActiveStep(prevStep);
      
      // Update URL to reflect current step without reload
      navigate(`/signup?step=${prevStep}`, { replace: true });
    } else {
      // If at first step and user wants to go back, use navigation history
      const prevPath = getPreviousPath();
      console.log("Going back to previous path:", prevPath);
      navigate(prevPath);
    }
  };
  
  // Enhanced handleNext function with form data persistence
  const handleNext = async (stepData = {}) => {
    console.log("handleNext called with step data:", stepData);
    
    const nextStep = activeStep + 1;
    console.log(`Current step: ${activeStep}, Next step: ${nextStep}`);
    
    if (nextStep < steps.length) {
      try {
        // Store form data for the current step
        const stepName = steps[activeStep].toLowerCase().replace(' ', '_');
        console.log(`Saving form data for step: ${stepName}`);
        saveFormData(stepName, stepData);
        
        // Update progress in Firebase
        console.log(`Updating progress in Firebase: Step ${nextStep} (${steps[nextStep].toLowerCase().replace(' ', '_')})`);
        try {
          await updateSignupProgress(
            steps[nextStep].toLowerCase().replace(' ', '_'), 
            nextStep, 
            stepData
          );
          console.log("Firebase update successful");
        } catch (firebaseError) {
          console.error("Error updating progress in Firebase:", firebaseError);
          // Continue anyway - we'll just use the local state
        }
        
        // Update active step
        console.log(`Setting active step to ${nextStep}`);
        setActiveStep(nextStep);
        
        // Update URL to reflect current step without reload
        const newUrl = `/signup?step=${nextStep}`;
        console.log(`Navigating to: ${newUrl}`);
        navigate(newUrl, { replace: true });
        
        return true; // Indicate success
      } catch (error) {
        console.error("Error in handleNext:", error);
        
        // Still move forward even if there are errors
        console.log(`Setting active step to ${nextStep} despite errors`);
        setActiveStep(nextStep);
        
        const newUrl = `/signup?step=${nextStep}`;
        console.log(`Navigating to: ${newUrl}`);
        navigate(newUrl, { replace: true });
        
        return false; // Indicate there was an error
      }
    } else {
      console.log("Cannot proceed: already at last step");
      return false; // Cannot proceed further
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Integrated ResponsiveBanner with progress bar */}
      <ResponsiveBanner 
        activeStep={activeStep}
        steps={steps}
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true} // NEW: Use the gradient background for signup page
        textAlignment="center" // Center the text while keeping logo left-aligned
        />

        {/* Main Content */}
        <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
            {/* Step Content with direct component check */}
            <div className="flex-grow flex justify-center">
            {activeStep === 0 && (
                <div className="w-full">
                {currentUser && (signupState?.signupProgress >= 1 || isAccountCreated()) ? (
                    <AccountCreationSuccess 
                    currentUser={currentUser} 
                    onNext={handleNext} 
                    />
                ) : (
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

                    />
                )}
                </div>
            )}
            
            {activeStep === 1 && (
                <ContactInfoPage
                onNext={handleNext}
                onBack={handleBack}
                />
            )}
            </div>
        </div>
        </div>
      
      {/* Help Panel */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
      />
    </div>
  );
}