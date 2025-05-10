import React, { useState, useEffect } from "react";
import darkLogo from "../assets/images/alcor-placeholder-logo.png";
import Banner from "../components/Banner";
import ProgressBar from "../components/CircularProgress";
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createOrSignInUser,
  signInWithGoogle,
  updateSignupProgress,
  clearVerificationState
} from "../services/auth";
import { useUser, getVerificationState, saveVerificationState } from "../contexts/UserContext";

// Import just the component we've built
import ContactInfoPage from "./signup/ContactInfoPage.jsx";

const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

// Password strength checker function - moved up before it's used
const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, isStrong: false, isMedium: false, isWeak: true, meetsMinimumRequirements: false };
  
  // Minimal client-side check
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Calculate a simple strength score (0-100)
  let score = 0;
  
  // Length contributes up to 25 points
  score += Math.min(25, Math.floor(password.length * 2.5));
  
  // Character variety
  score += hasUppercase ? 12.5 : 0;
  score += hasLowercase ? 12.5 : 0;
  score += hasNumbers ? 12.5 : 0;
  score += hasSpecialChar ? 12.5 : 0;
  
  return {
    score,
    isStrong: score >= 70,
    isMedium: score >= 40 && score < 70,
    isWeak: score < 40,
    meetsMinimumRequirements: password.length >= minLength && hasUppercase && hasLowercase && hasNumbers
  };
};

// Enhanced Password Input Component with Requirements Display and Toggle Visibility
const PasswordField = ({ 
  value, 
  onChange, 
  isSubmitting, 
  error,
  id = "password",
  name = "password",
  label = "Password",
  placeholder = "Create a secure password" 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = checkPasswordStrength(value || '');
  const showRequirements = value && value.length > 0;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="mb-10 sm:mb-6">
      <label htmlFor={id} className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">
        {label}
      </label>
      
      {/* Password field with visibility toggle */}
      <div className="relative">
        <input 
          type={showPassword ? "text" : "password"} 
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder} 
          className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg pr-12"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          tabIndex="-1" // Skip in tab order
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            // Eye-off icon (when password is visible)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            // Eye icon (when password is hidden)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Only show strength indicator and requirements when user has started typing */}
      {showRequirements && (
        <>
          {/* Password strength indicator */}
          <div className="mt-3 mb-1">
            <div className="flex items-center mb-1">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    strength.isStrong ? 'bg-green-500' : 
                    strength.isMedium ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${strength.score}%` }}
                  role="progressbar"
                  aria-valuenow={strength.score}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <span className={`ml-2 text-sm ${
                strength.isStrong ? 'text-green-600' : 
                strength.isMedium ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {strength.isStrong ? 'Strong' : 
                 strength.isMedium ? 'Medium' : 
                 'Weak'}
              </span>
            </div>
          </div>
          
          {/* Password requirements */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-2 text-sm">
            <p className="font-medium text-gray-700 mb-2">Password must have:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              <li className={`flex items-center ${value && value.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && value.length >= 8 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                At least 8 characters
              </li>
              <li className={`flex items-center ${value && /[A-Z]/.test(value) ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && /[A-Z]/.test(value) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                Uppercase letter (A-Z)
              </li>
              <li className={`flex items-center ${value && /[a-z]/.test(value) ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && /[a-z]/.test(value) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                Lowercase letter (a-z)
              </li>
              <li className={`flex items-center ${value && /[0-9]/.test(value) ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && /[0-9]/.test(value) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                Number (0-9)
              </li>
            </ul>
          </div>
        </>
      )}
      
      {/* Error message if exists */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default function SignupPage() {
  const { currentUser, signupState } = useUser();
  
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState("initial"); // "initial", "verification"
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  // Keep password in memory only - not in formData that might be persisted
  const [passwordState, setPasswordState] = useState('');
  
  const [formData, setFormData] = useState({
    name: "",
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
  
  // Check for existing verification and user state on component mount
  useEffect(() => {
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
    if (savedVerificationState) {
      // Check if verification state is stale (older than 15 minutes)
      const now = Date.now();
      const stateAge = now - (savedVerificationState.timestamp || 0);
      const maxAge = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      if (stateAge < maxAge) {
        setFormData(prevData => ({
          ...prevData,
          email: savedVerificationState.email || "",
          name: savedVerificationState.name || "",
          verificationId: savedVerificationState.verificationId || ""
        }));
        
        setIsExistingUser(savedVerificationState.isExistingUser || false);
        
        // If verification is in progress, show verification form
        if (savedVerificationState.verificationId) {
          setVerificationStep("verification");
        }
      } else {
        // Verification state is stale, clear it
        clearVerificationState();
      }
    }
    
    // If user is already logged in and has signup state, set active step
    if (currentUser && signupState) {
      // Set active step based on signup progress
      const stepIndex = Math.min(signupState.signupProgress || 0, steps.length - 1);
      setActiveStep(stepIndex);
    }
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
  
  // Removed duplicate checkPasswordStrength function (now defined at the top)
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    if (verificationStep === "initial") {
      // Email, Name & Password Form Submission
      const newErrors = {
        name: !formData.name.trim() ? "Name is required" : "",
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
      
      // Check if there are any errors
      if (Object.values(newErrors).some(error => error)) {
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Call Firebase function to create email verification
        // Note: We don't pass the password here - it stays in memory only
        const result = await requestEmailVerification(formData.email, formData.name);
        
        if (result.success) {
          // Store verification ID for the next step
          setFormData(prev => ({
            ...prev,
            verificationId: result.verificationId,
            verificationCode: "" // Clear any previous code
          }));
          
          // Store verification state WITHOUT password
          saveVerificationState({
            email: formData.email,
            name: formData.name,
            verificationId: result.verificationId,
            isExistingUser: result.isExistingUser || false,
            timestamp: Date.now()
          });
          
          // Check if this is an existing user
          if (result.isExistingUser) {
            setIsExistingUser(true);
          }
          
          // Move to verification step
          setVerificationStep("verification");
        } else {
          // This should never happen due to error handling in the service
          setErrors(prev => ({
            ...prev,
            email: "Failed to send verification code"
          }));
        }
      } catch (error) {
        console.error('Error requesting verification:', error);
        setErrors(prev => ({
          ...prev,
          email: error.message || "Failed to send verification code. Please try again."
        }));
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
        // First, verify the code only (no authentication attempt yet)
        const verificationResult = await verifyEmailCodeOnly(
          formData.verificationId, 
          formData.verificationCode
        );
        
        if (verificationResult.success) {
          // Now that code is verified, handle user creation/authentication
          // using password from memory state
          const authResult = await createOrSignInUser(
            verificationResult,
            formData.email,
            formData.name,
            passwordState // Using password from memory, not localStorage
          );
          
          // Clear password from memory immediately
          setPasswordState('');
          
          if (authResult.success) {
            // For existing users, navigate to where they left off
            if (authResult.isExistingUser) {
              const nextStepIndex = authResult.signupProgress || 1;
              setActiveStep(nextStepIndex);
            } else {
              // For new users, move to the next step
              setActiveStep(1);
            }
            
            // Reset verification step
            setVerificationStep("initial");
            
            // Clear verification code
            setFormData(prev => ({
              ...prev,
              verificationCode: "",
              verificationId: ""
            }));
          }
        }
      } catch (error) {
        console.error("Error verifying code:", error);
        
        // Handle specific error cases
        if (error.message.includes('expired')) {
          setErrors(prev => ({
            ...prev,
            verificationCode: "Verification code has expired. Please request a new one."
          }));
        } else if (error.message.includes('password')) {
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
      termsAccepted: "",
      verificationCode: ""
    });
    
    try {
      console.log("Starting Google sign-in process");
      const result = await signInWithGoogle();
      
      console.log("Google sign-in result:", result);
      
      if (result && result.success) {
        // For existing users, navigate to where they left off
        if (result.isExistingUser) {
          const nextStepIndex = result.signupProgress || 1;
          console.log(`Existing user, moving to step ${nextStepIndex}`);
          setActiveStep(nextStepIndex);
        } else {
          // For new users, move to step 1 (Contact Info)
          console.log("New user, moving to step 1");
          setActiveStep(1);
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
      } else if (error.message.includes('pop-up')) {
        errorMessage = "Pop-up was blocked. Please enable pop-ups for this site.";
      } else if (error.message.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      // Show error message to user
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resendVerificationCode = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Call Firebase function to resend verification code
      // Note: Password is kept in memory and not sent to the backend
      const result = await requestEmailVerification(formData.email, formData.name);
      
      if (result.success) {
        // Update verification ID
        setFormData(prev => ({
          ...prev,
          verificationId: result.verificationId,
          verificationCode: "" // Clear any previous code
        }));
        
        // Store verification state WITHOUT password
        saveVerificationState({
          email: formData.email,
          name: formData.name,
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
  };

  const toggleHelpInfo = () => {
    setShowHelpInfo(!showHelpInfo);
  };
  
  // Get appropriate verification message based on user status
  const getVerificationMessage = () => {
    if (isExistingUser) {
      return (
        <>
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <p className="text-blue-700 font-medium">Welcome back!</p>
            <p className="text-blue-600 text-sm">We've sent a verification code to confirm it's you.</p>
          </div>
          <p className="text-gray-800 font-medium mb-4">{formData.email}</p>
          <p className="text-gray-600 text-sm">Please enter the 6-digit code below.</p>
        </>
      );
    }
    
    return (
      <>
        <p className="text-gray-600 mb-2">We've sent a verification code to</p>
        <p className="text-gray-800 font-medium mb-4">{formData.email}</p>
        <p className="text-gray-600 text-sm">Please enter the 6-digit code below.</p>
      </>
    );
  };
  
  // Handle navigation between steps
  const handleNext = async (stepData) => {
    const nextStep = activeStep + 1;
    if (nextStep < steps.length) {
      try {
        // Update progress in Firebase
        await updateSignupProgress(steps[nextStep].toLowerCase().replace(' ', '_'), nextStep);
        setActiveStep(nextStep);
      } catch (error) {
        console.error("Error updating progress:", error);
        // Still move forward even if Firebase update fails
        setActiveStep(nextStep);
      }
    }
  };
  
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  // Render content based on active step
  const renderStepContent = () => {
    // First step is the account creation/verification
    if (activeStep === 0) {
      return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl">
          {verificationStep === "initial" ? (
            <>
              <div className="flex flex-col md:flex-row gap-10 sm:gap-6 mb-10 sm:mb-6 mx-auto max-w-md md:max-w-none">
                <div className="flex-1">
                  <label htmlFor="name" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Smith" 
                    className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.name}</p>}
                </div>
                <div className="flex-1">
                  <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john.smith@example.com" 
                    className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.email}</p>}
                </div>
              </div>
              
              {/* Enhanced Password Field with visibility toggle and requirements */}
              <PasswordField
                value={passwordState}
                onChange={handleChange}
                isSubmitting={isSubmitting}
                error={errors.password}
              />
              
              <div className="mb-12 sm:mb-8 mx-auto max-w-md md:max-w-none">
                <label className={`flex items-start ${errors.termsAccepted ? 'text-red-500' : ''}`}>
                  <input 
                    type="checkbox" 
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`mr-4 sm:mr-2 mt-1 h-6 w-6 sm:h-5 sm:w-5 appearance-none checked:bg-[#d39560] border ${errors.termsAccepted ? 'border-red-500' : 'border-brand-purple/30'} bg-brand-purple/5 rounded focus:ring-1 focus:ring-[#d39560]`}
                    style={{ 
                      backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                      backgroundPosition: "center",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat"
                    }}
                  />
                  <span className={`text-${errors.termsAccepted ? 'red-500' : 'gray-700'} text-base sm:text-sm`}>
                    I agree to the <a href="#" className="text-brand-purple">Terms of Use</a> & <a href="#" className="text-brand-purple">Privacy policy</a>.
                  </span>
                </label>
                {errors.termsAccepted && <p className="text-red-500 text-sm mt-3 sm:mt-1 ml-10 sm:ml-7">{errors.termsAccepted}</p>}
              </div>
              
              <div className="mx-auto max-w-md md:max-w-none">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="w-full py-5 sm:py-4 px-6 rounded-full font-semibold text-lg mb-10 sm:mb-4 flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Get Started</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
                
                <div className="flex items-center my-10 sm:my-6">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <div className="px-8 sm:px-4 text-gray-500 uppercase text-sm">OR</div>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-5 sm:py-3 px-6 rounded-full font-medium text-lg mb-12 sm:mb-8 flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70"
                >
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
                  Continue with Google
                </button>
              </div>
              
              <div className="text-center mx-auto max-w-md md:max-w-none">
                <p className="text-gray-700">
                  Already an Alcor Member? <a href="#" className="text-brand-purple">Login here</a>
                </p>
              </div>
            </>
          ) : (
            // Verification Code Screen
            <div className="mx-auto max-w-md">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-yellow-50 rounded-full p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify your email</h2>
                {getVerificationMessage()}
              </div>
              
              <div className="mb-8">
                <label htmlFor="verificationCode" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">Verification Code</label>
                <input 
                  type="text" 
                  id="verificationCode"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  placeholder="123456" 
                  maxLength={6}
                  className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg tracking-wider text-center"
                  disabled={isSubmitting}
                />
                {errors.verificationCode && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.verificationCode}</p>}
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#6f2d74",
                  color: "white"
                }}
                className="w-full py-5 sm:py-4 px-6 rounded-full font-semibold text-lg mb-6 flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>Verify</>
                )}
              </button>
              
              <div className="flex flex-col md:flex-row justify-between items-center text-sm mt-6">
                <button 
                  type="button" 
                  onClick={resendVerificationCode}
                  disabled={isSubmitting}
                  className="text-brand-purple mb-4 md:mb-0 hover:underline disabled:opacity-70"
                >
                  Resend verification code
                </button>
                <button 
                  type="button" 
                  onClick={changeEmail}
                  disabled={isSubmitting}
                  className="text-gray-600 hover:underline disabled:opacity-70"
                >
                  Change email address
                </button>
              </div>
            </div>
          )}
        </form>
      );
    }
    
    // Contact Info step
    if (activeStep === 1) {
      return <ContactInfoPage onNext={handleNext} onBack={handleBack} />;
    }
    
    // Placeholder for other steps
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Step {activeStep + 1}: {steps[activeStep]}</h2>
        <p className="mb-8">This step is under construction.</p>
        
        <div className="flex justify-between mt-10">
          <button
            onClick={handleBack}
            className="py-4 px-8 border border-gray-300 rounded-full text-gray-600 font-medium flex items-center hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <button 
            onClick={() => handleNext({})}
            style={{
              backgroundColor: "#6f2d74",
              color: "white"
            }}
            className="py-4 px-8 rounded-full font-semibold text-lg flex items-center hover:opacity-90"
          >
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      <Banner 
        logo={darkLogo}
        stepText="Step"
        stepNumber={activeStep + 1}
        stepName={steps[activeStep]}
        heading="Become a member"
        subText="Sign up process takes on average 5 minutes."
      />

      <ProgressBar steps={steps} activeStep={activeStep} />

      <div className="flex-1 flex justify-center px-8 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-8 sm:pt-4">
        <div className="w-full max-w-3xl">
          {renderStepContent()}
        </div>
      </div>

      {/* Help icon in the bottom right corner */}
      <div className="fixed bottom-8 md:bottom-10 right-8 md:right-10 z-40">
        <button 
          onClick={toggleHelpInfo}
          className="flex items-center justify-center rounded-full shadow-lg bg-[#9f5fa6] hover:bg-[#8a4191] text-white focus:outline-none transition-all duration-200 h-14 w-14 md:h-16 md:w-16"
          aria-label="Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Help information box */}
      {showHelpInfo && (
        <div className="fixed bottom-24 md:bottom-28 right-8 md:right-10 z-40 w-64 sm:w-80 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-[#9f5fa6] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-medium">Help & Information</h3>
            <button 
              onClick={toggleHelpInfo}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-1">Account Creation</h4>
              <p className="text-gray-600 text-sm">Creating an account allows you to become a member as well as manage membership and contracts.</p>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-1">Email Verification</h4>
              <p className="text-gray-600 text-sm">We'll send a 6-digit code to your email to verify your identity and secure your account.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Need assistance?</h4>
              <p className="text-gray-600 text-sm">Contact our support team at <a href="mailto:support@alcor.com" className="text-brand-purple">support@alcor.com</a> or call (800) 555-1234.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}