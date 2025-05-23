// src/components/IsolatedSignupFlow.jsx - NO UserContext dependencies during flow
import React, { useState, useEffect } from "react";
import { 
  requestEmailVerification, 
  verifyEmailCodeOnly,
  createNewUser,
  signInExistingUser,
} from "../services/auth";
import { 
  getVerificationState, 
  saveVerificationState,
  clearVerificationState,
  setAccountCreated,
} from "../services/storage";

// Import components
import AccountCreationForm from "./signup/AccountCreationForm";
import ResponsiveBanner from "./ResponsiveBanner";

const IsolatedSignupFlow = () => {
  // Internal state - persist through UserContext remounts using localStorage
  const [currentStep, setCurrentStep] = useState(() => {
    // Initialize from localStorage to survive UserContext remounts
    return localStorage.getItem('signup_current_step') || "account";
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordState, setPasswordState] = useState('');
  const [confirmPasswordState, setConfirmPasswordState] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  
  // Update localStorage whenever step changes (but avoid unnecessary updates)
  useEffect(() => {
    const currentStoredStep = localStorage.getItem('signup_current_step');
    if (currentStoredStep !== currentStep) {
      localStorage.setItem('signup_current_step', currentStep);
      console.log('🔄 Step changed to:', currentStep);
    }
  }, [currentStep]);
  
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

  // Check for existing verification state ONCE on mount
  useEffect(() => {
    const savedVerificationState = getVerificationState();
    
    if (savedVerificationState) {
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
        
        if (savedVerificationState.verificationId) {
          setCurrentStep("verification");
        }
      } else {
        clearVerificationState();
      }
    }
  }, []); // Empty dependency - only run once

  // Banner content based on current step
  const getBannerContent = () => {
    switch (currentStep) {
      case "account":
        return {
          activeStep: 0,
          heading: "Become a member",
          subText: "Sign up process takes on average 5 minutes."
        };
      case "verification":
        return {
          activeStep: 0,
          heading: "Verify your email",
          subText: "Enter the verification code sent to your email."
        };
      case "success":
        return {
          activeStep: 1,
          heading: "Account created!",
          subText: "Your account has been successfully created."
        };
      default:
        return {
          activeStep: 0,
          heading: "Become a member",
          subText: "Sign up process takes on average 5 minutes."
        };
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'password') {
      setPasswordState(value);
      if (errors.confirmPassword && confirmPasswordState === value) {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    } else if (name === 'confirmPassword') {
      setConfirmPasswordState(value);
      if (errors.confirmPassword && value === passwordState) {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
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
    
    if (isSubmitting) return;
    
    if (currentStep === "account") {
      // Email & Password Form Submission
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
      if (hasErrors) return;
      
      setIsSubmitting(true);
      
      try {
        console.log("🔵 Requesting email verification for:", formData.email);
        const result = await requestEmailVerification(formData.email, formData.name || "New Member");
        
        if (result.success) {
          if (result.isExistingUser) {
            setErrors(prev => ({
              ...prev,
              email: "An account with this email already exists. Please sign in instead."
            }));
            setIsSubmitting(false);
            return;
          }
          
          console.log("🟢 Moving to verification step");
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
          
          // ✅ INSTANT TRANSITION
          setCurrentStep("verification");
        } else {
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
      
    } else if (currentStep === "verification") {
      // Verify Code Submission
      if (!formData.verificationCode.trim()) {
        setErrors(prev => ({ ...prev, verificationCode: "Verification code is required" }));
        return;
      }
      
      if (formData.verificationCode.length !== 6 || !/^\d{6}$/.test(formData.verificationCode)) {
        setErrors(prev => ({ ...prev, verificationCode: "Please enter a valid 6-digit code" }));
        return;
      }
      
      if (!formData.verificationId) {
        setErrors(prev => ({ ...prev, verificationCode: "Verification session expired. Please request a new code." }));
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        console.log("🔵 Starting verification process");
        const verificationResult = await verifyEmailCodeOnly(
          formData.verificationId, 
          formData.verificationCode
        );
        
        if (verificationResult.success) {
          console.log("🟢 Verification successful");
          
          // ✅ IMMEDIATELY show success to prevent any flash
          setCurrentStep("success");
          
          let authResult;
          
          try {
            if (verificationResult.isExistingUser) {
              authResult = await signInExistingUser(
                verificationResult,
                formData.email,
                passwordState
              );
            } else {
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
            
            if (authResult.success) {
              console.log("🟢 Authentication successful");
              
              // Store our own user state
              setAuthenticatedUser(authResult.user);
              
              // Clear sensitive data
              setPasswordState('');
              setConfirmPasswordState('');
              
              // Clear verification state
              clearVerificationState();
              setAccountCreated(true);
              
              // Reset form
              setFormData(prev => ({
                ...prev,
                verificationCode: "",
                verificationId: ""
              }));
              
              // Set verification flags for other components
              localStorage.setItem('just_verified', 'true');
              localStorage.setItem('verification_timestamp', Date.now().toString());
              
              // SUCCESS STEP IS ALREADY SET ABOVE - no state change needed
              
            } else {
              console.error("❌ Authentication failed");
              // Revert to verification step on auth failure
              setCurrentStep("verification");
              setErrors(prev => ({
                ...prev,
                general: "Authentication failed. Please try again."
              }));
            }
          } catch (authError) {
            console.error("❌ Error during authentication:", authError);
            // Revert to verification step on auth error
            setCurrentStep("verification");
            setErrors(prev => ({
              ...prev,
              general: authError.message || "An error occurred during account setup."
            }));
          }
        } else {
          setErrors(prev => ({
            ...prev,
            verificationCode: "Invalid verification code. Please try again."
          }));
        }
      } catch (error) {
        console.error("❌ Error verifying code:", error);
        
        if (error.message && error.message.includes('expired')) {
          setErrors(prev => ({
            ...prev,
            verificationCode: "Verification code has expired. Please request a new one."
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

  const resendVerificationCode = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const result = await requestEmailVerification(formData.email, formData.name || "New Member");
      
      if (result.success) {
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
      setErrors(prev => ({
        ...prev,
        verificationCode: error.message || "Failed to resend code. Please try again."
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const changeEmail = () => {
    clearVerificationState();
    localStorage.removeItem('signup_current_step'); // Clear persisted step
    setCurrentStep("account");
    
    setFormData(prev => ({
      ...prev,
      verificationId: "",
      verificationCode: ""
    }));
    
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

  // Handle continuing to contact step
  const handleContinueToContact = () => {
    console.log("🟢 Continuing to contact step");
    // Clear the step state since we're leaving the signup flow
    localStorage.removeItem('signup_current_step');
    // Navigate to the actual contact page
    window.location.href = '/signup/contact';
  };

  // Render content based on current step (memoize to prevent unnecessary re-renders)
  const renderStepContent = () => {
    console.log('🎯 Rendering content for step:', currentStep);
    
    switch (currentStep) {
      case "success":
        return (
          <div key="success-content" className="w-full max-w-3xl px-2 sm:px-0">
            <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 max-w-[85%] sm:max-w-none mx-auto">
              {/* Success header */}
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-[#0C2340] to-[#26396A] rounded-full p-2 sm:p-2.5 shadow-sm mr-3 sm:mr-4 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#0C2340] leading-tight">Account Created!</h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Your Alcor account has been successfully created and verified.
                  </p>
                </div>
              </div>
              
              {/* Account info */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center border-b border-gray-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-[#0C2340]/10 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0C2340]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm font-medium">Email</span>
                      <p className="font-semibold text-[#0C2340]">{formData.email || "Your email"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm font-medium">Account Status</span>
                      <p className="font-semibold text-green-600">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Continue button */}
              <div className="text-center">
                <button 
                  onClick={handleContinueToContact}
                  className="bg-[#6f2d74] text-white py-4 px-10 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center hover:bg-[#7b3382]"
                >
                  Continue to Contact Information
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      
      case "account":
      case "verification":
      default:
        return (
          <AccountCreationForm
            formData={formData}
            passwordState={passwordState}
            confirmPasswordState={confirmPasswordState}
            errors={errors}
            isSubmitting={isSubmitting}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            verificationStep={currentStep === "verification" ? "verification" : "initial"}
            resendVerificationCode={resendVerificationCode}
            changeEmail={changeEmail}
            setErrors={setErrors}
          />
        );
    }
  };

  const bannerContent = getBannerContent();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* BANNER - Updates content only */}
      <ResponsiveBanner 
        activeStep={bannerContent.activeStep}
        heading={bannerContent.heading}
        subText={bannerContent.subText}
        steps={["Account", "Contact Info", "Package", "Funding", "Membership"]}
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
      
      {/* CONTENT AREA */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {errors.general}
            </div>
          )}
          
          {/* STEP CONTENT - No external dependencies */}
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default IsolatedSignupFlow;