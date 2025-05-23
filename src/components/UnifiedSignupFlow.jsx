// src/components/UnifiedSignupFlow.jsx - CENTRAL CONTAINER (No flashing)
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
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

// Import form components
import AccountCreationForm from "./signup/AccountCreationForm";
import AccountCreationSuccess from "./signup/AccountCreationSuccess";
import ResponsiveBanner from "./ResponsiveBanner";

const UnifiedSignupFlow = () => {
  const { currentUser, isLoading, authResolved } = useUser();
  
  // Show loading until auth is resolved
  if (isLoading || !authResolved) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  // Single state that controls everything
  const [currentStep, setCurrentStep] = useState("account"); // "account", "verification", "success", "contact"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordState, setPasswordState] = useState('');
  const [confirmPasswordState, setConfirmPasswordState] = useState('');
  
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

  // If user is already logged in, show success immediately
  useEffect(() => {
    if (currentUser && currentStep !== "success") {
      console.log("User already logged in, showing success step");
      setCurrentStep("success");
    }
  }, [currentUser, currentStep]);

  // Check for existing verification state
  useEffect(() => {
    const savedVerificationState = getVerificationState();
    
    if (savedVerificationState) {
      const now = Date.now();
      const stateAge = now - (savedVerificationState.timestamp || 0);
      const maxAge = 15 * 60 * 1000; // 15 minutes
      
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
  }, []);

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
          activeStep: 0, // Still part of account creation
          heading: "Verify your email",
          subText: "Enter the verification code sent to your email."
        };
      case "success":
        return {
          activeStep: 1,
          heading: "Account created!",
          subText: "Your account has been successfully created."
        };
      case "contact":
        return {
          activeStep: 2,
          heading: "Contact information",
          subText: "Building your membership application."
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
        console.log("Requesting email verification for:", formData.email);
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
          
          console.log("Moving to verification step");
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
          
          // ✅ SMOOTH TRANSITION - Just change the step state
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
            
            // Clear sensitive data
            setPasswordState('');
            setConfirmPasswordState('');
            
            if (authResult.success) {
              console.log("🟢 Authentication successful");
              
              // ✅ IMMEDIATELY set success step to prevent flash
              setCurrentStep("success");
              
              // Clear verification state
              clearVerificationState();
              setAccountCreated(true);
              
              // Reset form
              setFormData(prev => ({
                ...prev,
                verificationCode: "",
                verificationId: ""
              }));
              
              // Set verification flags
              localStorage.setItem('just_verified', 'true');
              localStorage.setItem('verification_timestamp', Date.now().toString());
              
            } else {
              setErrors(prev => ({
                ...prev,
                general: "Authentication failed. Please try again."
              }));
            }
          } catch (authError) {
            console.error("Error during authentication:", authError);
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
        console.error("Error verifying code:", error);
        
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
    
    // ✅ SMOOTH TRANSITION - Just change the step state
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
    console.log("Moving to contact step");
    // ✅ SMOOTH TRANSITION - Just change the step state
    setCurrentStep("contact");
  };

  // Render content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "success":
        return (
          <AccountCreationSuccess 
            currentUser={currentUser}
            onNext={handleContinueToContact}
          />
        );
      
      case "contact":
        return (
          <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Information</h2>
            <p className="text-gray-600 mb-4">This is where the contact form would go.</p>
            <button
              onClick={() => setCurrentStep("account")}
              className="bg-[#6f2d74] text-white px-6 py-2 rounded-full font-medium hover:opacity-90"
            >
              Back to Start (Demo)
            </button>
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
      {/* BANNER - Only updates content, never remounts */}
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
      
      {/* CONTENT AREA - Only updates content, never remounts */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {errors.general}
            </div>
          )}
          
          {/* STEP CONTENT - Changes smoothly based on currentStep */}
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedSignupFlow;