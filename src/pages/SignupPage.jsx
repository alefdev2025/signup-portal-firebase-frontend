// File: pages/SignupPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import darkLogo from "../assets/images/alcor-placeholder-logo.png";
import Banner from "../components/Banner";
import ProgressBar from "../components/CircularProgress";
import CircularProgress from "../components/CircularProgress";
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createNewUser, // CHANGED: Use createNewUser directly
  signInExistingUser, // CHANGED: Use signInExistingUser directly
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
import ContactInfoPage from "./signup/ContactInfoPage.jsx";

// Import decomposed components
import AccountCreationForm from "../components/signup/AccountCreationForm";
import VerificationForm from "../components/signup/VerificationForm";
import AccountCreationSuccess from "../components/signup/AccountCreationSuccess";
import HelpPanel from "../components/signup/HelpPanel";
import DebugInfo from "../components/signup/DebugInfo";

const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

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
  
  console.log("SignupPage rendered with activeStep:", activeStep);
  console.log("URL params:", Object.fromEntries([...searchParams]));
  
  // Keep password in memory only - not in formData that might be persisted
  const [passwordState, setPasswordState] = useState('');
  
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
    termsAccepted: "",
    verificationCode: "",
  });
  
  // Check for fresh signup flag on component mount
  useEffect(() => {
    console.log("Checking for fresh signup flag");
    // Check for fresh signup flag
    const isFreshSignup = initializeFreshSignup();
    console.log("Fresh signup?", isFreshSignup);
    
    if (isFreshSignup) {
      // Reset verification step
      setVerificationStep("initial");
      
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
  
  // Function to get previous path
  const getPreviousPath = () => {
    const history = JSON.parse(localStorage.getItem('navigation_history') || '[]');
    if (history.length <= 1) return "/";
    return history[history.length - 2];
  };
  
  // URL-based routing and step management
  useEffect(() => {
    console.log("--- Navigation Debug ---");
    console.log("URL Params:", new URLSearchParams(location.search).get('step'));
    console.log("Current User:", currentUser);
    console.log("Signup State:", signupState);
    
    // Parse URL for step parameter first
    const urlParams = new URLSearchParams(location.search);
    const stepParam = parseInt(urlParams.get('step'));
    console.log("URL Step Param:", stepParam);
    
    // First handle the case where we have a user
    if (currentUser && signupState) {
      // Set active step based on signup progress
      const stepIndex = Math.min(signupState?.signupProgress || 0, steps.length - 1);
      console.log("User logged in - stepIndex:", stepIndex);
      
      // If valid step in URL that is not greater than user's progress, set active step
      if (!isNaN(stepParam) && stepParam >= 0 && stepParam <= stepIndex) {
        console.log("Setting activeStep to URL param:", stepParam);
        setActiveStep(stepParam);
      } else {
        // Otherwise use the highest step the user has completed
        console.log("Setting activeStep to highest completed:", stepIndex);
        setActiveStep(stepIndex);
        
        // Update URL to reflect current step without reload
        navigate(`/signup?step=${stepIndex}`, { replace: true });
      }
    } else {
      // For non-authenticated users or without signup state
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
  }, [location, currentUser, signupState, navigate]);
  
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
      // Set active step based on signup progress
      const stepIndex = Math.min(signupState.signupProgress || 0, steps.length - 1);
      setActiveStep(stepIndex);
      console.log("User is logged in, setting activeStep to:", stepIndex);
    }
    
    // User state debug
    console.log("Current user:", currentUser);
    console.log("Signup state:", signupState);
  }, [currentUser, signupState]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for password - store in memory state, not in formData
    if (name === 'password') {
      // We now allow spaces in passwords - don't strip them
      setPasswordState(value);
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
            // Redirect to login page instead of showing alert
            navigate(`/login?email=${encodeURIComponent(formData.email)}&continue=signup`);
            setIsSubmitting(false);
            return; // Stop here, don't proceed to verification
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
            console.log("Cleared password from memory");
            
            if (authResult.success) {
              console.log("Existing user sign in successful");
              // Clear verification state
              clearVerificationState();
              console.log("Cleared verification state from localStorage");
              
              // Navigate to where they left off
              const nextStepIndex = authResult.signupProgress || 1;
              console.log("Existing user, navigating to step:", nextStepIndex);
              setActiveStep(nextStepIndex);
              
              // Update URL
              navigate(`/signup?step=${nextStepIndex}`, { replace: true });
              
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
            console.log("Cleared password from memory");
            
            if (authResult.success) {
              console.log("New user creation successful");
              // Clear verification state
              clearVerificationState();
              console.log("Cleared verification state from localStorage");
              
              // For new users, move to step 1
              console.log("New user, navigating to step 1");
              setActiveStep(1);
              
              // Update URL
              navigate(`/signup?step=1`, { replace: true });
              
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

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    console.log("Starting Google sign-in process");
    
    setIsSubmitting(true);
    setErrors({
      name: "",
      email: "",
      password: "",
      termsAccepted: "",
      verificationCode: ""
    });
    
    try {
      console.log("Calling signInWithGoogle()");
      const result = await signInWithGoogle();
      
      console.log("Google sign-in result:", result);
      
      if (result && result.success) {
        // Clear verification state since we're now authenticated
        clearVerificationState();
        console.log("Cleared verification state");
        
        // For existing users, navigate to where they left off
        if (result.isExistingUser) {
          const nextStepIndex = result.signupProgress || 1;
          console.log(`Existing user, moving to step ${nextStepIndex}`);
          setActiveStep(nextStepIndex);
          
          // Update URL to reflect current step without reload
          navigate(`/signup?step=${nextStepIndex}`, { replace: true });
        } else {
          // For new users, move to step 1 (Contact Info)
          console.log("New user, moving to step 1");
          setActiveStep(1);
          
          // Update URL to reflect current step without reload
          navigate(`/signup?step=1`, { replace: true });
        }
      } else {
        console.error("Google sign-in did not return success=true");
        // Show a generic error message
        alert("Failed to sign in with Google. Please try again or use email verification.");
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      
      // Handle user-friendly error messages
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.message === 'Sign-in was cancelled') {
        errorMessage = "Google sign-in was cancelled. Please try again.";
      } else if (error.message && error.message.includes('pop-up')) {
        errorMessage = "Pop-up was blocked. Please enable pop-ups for this site.";
      } else if (error.message && error.message.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      // Show error message to user
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log("Setting isSubmitting back to false");
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
        
        // Show success message
        alert("Verification code sent successfully!");
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
  
  // Determine if we should show AccountCreationSuccess
  const showAccountSuccess = currentUser && activeStep === 0;
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Banner */}
      <Banner />
      
      {/* Add CircularProgress component below Banner */}
      <CircularProgress steps={steps} activeStep={activeStep} />
      
      {/* Main Content - Now without the sidebar */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {steps[activeStep]}
            </h1>
            <p className="text-gray-600">
              {activeStep === 0 && (showAccountSuccess 
                ? "Your account has been created successfully!" 
                : "Create your account to begin the membership process.")}
              {activeStep === 1 && "Please provide your contact information."}
              {/* Add descriptions for other steps */}
            </p>
          </div>
          
          {/* Step Content */}
          {activeStep === 0 && (
            <>
              {showAccountSuccess ? (
                <AccountCreationSuccess 
                  currentUser={currentUser} 
                  onNext={handleNext} 
                />
              ) : (
                <AccountCreationForm
                  formData={formData}
                  passwordState={passwordState}
                  errors={errors}
                  isSubmitting={isSubmitting}
                  handleChange={handleChange}
                  handleSubmit={handleSubmit}
                  handleGoogleSignIn={handleGoogleSignIn}
                  verificationStep={verificationStep}
                  resendVerificationCode={resendVerificationCode}
                  changeEmail={changeEmail}
                />
              )}
            </>
          )}
          
          {activeStep === 1 && (
            <ContactInfoPage
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {/* Debug Info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <DebugInfo 
              activeStep={activeStep}
              verificationStep={verificationStep}
              currentUser={currentUser}
              formData={formData}
              signupState={signupState}
            />
          )}
        </div>
      </div>
      
      {/* Mobile Help Panel */}
      {showHelpInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Help Information</h3>
              <button 
                onClick={toggleHelpInfo}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <HelpPanel activeStep={activeStep} />
            <button
              onClick={toggleHelpInfo}
              className="w-full mt-6 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}