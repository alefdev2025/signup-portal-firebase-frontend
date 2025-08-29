import React, { useState, useEffect } from 'react';
import PasswordField from './PasswordField';
import navyAlcorLogo from '../../assets/images/navy-a-logo.png';
import TermsPrivacyModal from '../modals/TermsPrivacyModal';
import HelpPanel from "./HelpPanel";

const AccountCreationForm = ({ 
  formData, 
  passwordState,
  confirmPasswordState,
  handleChange, 
  isSubmitting, 
  errors, 
  handleSubmit,
  handleGoogleSignIn,
  verificationStep,
  resendVerificationCode,
  changeEmail,
  highlightGoogleButton,
  setErrors
}) => {
  // State for modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'terms' or 'privacy'
  // Add state to track if resend code is in progress
  const [resendingCode, setResendingCode] = useState(false);
  // State for Google button error
  const [googleButtonError, setGoogleButtonError] = useState(false);
  // Track if Google sign-in is in progress
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  
  // Reset scroll position when verification step changes
  useEffect(() => {
    if (verificationStep === "verification") {
      // Try multiple scroll methods for better mobile compatibility
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      window.scrollTo(0, 0); // Fallback
    }
  }, [verificationStep]);
  
  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Define page-specific help content
  const accountCreationHelpContent = [
    {
      title: "Account Creation",
      content: "Create your Alcor account with a valid email address and secure password."
    },
    {
      title: "Email Verification",
      content: "After submitting your information, you'll receive a verification code to validate your email address."
    },
    {
      title: "Password Requirements",
      content: "Your password must be at least 8 characters long and include a mix of uppercase, lowercase, numbers, and symbols for security."
    },
    {
      title: "Need assistance?",
      content: (
        <>
          Contact our support team at <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a> or call 623-552-4338.
        </>
      )
    }
  ];
  
  console.log("AccountCreationForm rendered with verificationStep:", verificationStep);
  console.log("Form data:", formData);
  console.log("Errors:", errors);
  
  // Function to open the modal
  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };
  
  // Function to close the modal
  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };
  
  // Wrap the submit handler to add debugging and lowercase email
  const onSubmitForm = (e) => {
    console.log("Form submit event triggered");
    console.log("Form verificationStep:", verificationStep);
    
    // Auto-lowercase the email before submission
    if (formData.email) {
      formData.email = formData.email.toLowerCase();
    }
    
    console.log("Form data being submitted:", formData);
    console.log("Password state:", passwordState ? "Password exists" : "No password");
    console.log("Confirm Password state:", confirmPasswordState ? "Confirm Password exists" : "No confirm password");
    handleSubmit(e);
  };

  // Modified change handler to clear Google button error
  const handleFormChange = (e) => {
    // Auto-clear Google button error when terms are checked
    if (e.target.name === 'termsAccepted' && e.target.checked) {
      setGoogleButtonError(false);
    }

    // Pass the event up to parent component
    handleChange(e);
  };
  
  // Handle resend verification code with state update
  const handleResendCode = async () => {
    setResendingCode(true);
    await resendVerificationCode();
    setResendingCode(false);
  };

  // Wrap Google sign-in to check terms acceptance first - fixed to use local state
  const handleGoogleSignInWithTermsCheck = async () => {
    console.log("🚀 Google button clicked!");
    console.log("Terms accepted:", formData.termsAccepted);
    console.log("handleGoogleSignIn type:", typeof handleGoogleSignIn);
    
    // First check if terms are accepted
    if (!formData.termsAccepted) {
      console.log("❌ Terms not accepted");
      if (setErrors) {
        setErrors(prev => ({
          ...prev,
          termsAccepted: "You must accept the Terms of Use and Privacy Policy to continue"
        }));
      }
      setGoogleButtonError(true);
      return;
    }
  
    console.log("✅ Terms accepted, proceeding...");
    setGoogleButtonError(false);
    setIsGoogleSigningIn(true);
    
    try {
      console.log("📞 About to call handleGoogleSignIn...");
      
      // Call the parent handler and await it properly
      const result = await handleGoogleSignIn();
      
      console.log("✅ Google sign-in completed successfully:", result);
      
    } catch (error) {
      console.error("❌ Google sign-in error:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Show error to user
      if (setErrors) {
        setErrors(prev => ({
          ...prev,
          general: error.message || "Google sign-in failed. Please try again."
        }));
      }
    } finally {
      console.log("🔄 Resetting button state");
      setIsGoogleSigningIn(false);
    }
  };
  
  // Check if passwords match
  const passwordsMatch = passwordState && confirmPasswordState && passwordState === confirmPasswordState;
  
  // Display verification form if needed
  if (verificationStep === "verification") {
    return (
      <>
        {/* White container box for verification form */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 py-4 sm:w-full sm:max-w-2xl sm:mx-auto sm:relative sm:left-auto sm:right-auto sm:ml-auto sm:mr-auto sm:px-0 sm:py-0 bg-white rounded-xl shadow-md overflow-hidden">
          <form onSubmit={onSubmitForm} className="p-8 space-y-10 sm:space-y-6">
            <div className="mb-10 sm:mb-10">
              <label htmlFor="verificationCode" className="block text-gray-800 text-base font-medium mb-4 sm:mb-4">
                Verification Code
              </label>
              <input 
                type="text" 
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleFormChange}
                placeholder="Enter the 6-digit code" 
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-gray-800 text-base"
                disabled={isSubmitting || resendingCode}
                autoComplete="one-time-code"
                maxLength={6}
              />
              {errors.verificationCode && <p className="text-red-500 text-xs sm:text-sm mt-2 sm:mt-3">{errors.verificationCode}</p>}
            </div>
            
            <div className="text-sm sm:text-base text-gray-600 mb-12 sm:mb-8">
              <p>A verification code has been sent to <strong>{formData.email}</strong>.</p>
              <div className="mt-8 sm:mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-5 sm:space-y-0 sm:justify-between">
                <button 
                  type="button" 
                  onClick={handleResendCode}
                  className="flex items-center justify-center py-3 px-5 sm:px-6 bg-white border border-gray-300 hover:bg-gray-50 rounded-full text-gray-700 font-semibold text-base transition-colors shadow-sm hover:shadow-md sm:w-auto"
                  disabled={isSubmitting || resendingCode}
                >
                  {resendingCode ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 sm:h-5 w-4 sm:w-5 text-[#0C2340]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#0C2340]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resend code
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={changeEmail}
                  className="flex items-center justify-center py-3 px-5 sm:px-6 bg-white border border-gray-300 hover:bg-gray-50 rounded-full text-gray-700 font-semibold text-base transition-colors shadow-sm hover:shadow-md sm:w-auto"
                  disabled={isSubmitting || resendingCode}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#f39c12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Change email
                </button>
              </div>
            </div>
            
            <div className="mt-12 sm:mt-0">
              <button 
                type="submit"
                disabled={isSubmitting || resendingCode}
                style={{
                  backgroundColor: "#6f2d74",
                  color: "white"
                }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base mb-16 sm:mb-8 flex items-center justify-center hover:opacity-90 disabled:opacity-70 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span className="mr-2">Verify</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
              
              {/* Logo below the verify button - Only visible on mobile */}
              <div className="flex justify-center mt-6 mb-10 sm:hidden">
                <img 
                  src={navyAlcorLogo} 
                  alt="Alcor Logo" 
                  className="h-16" 
                />
              </div>
            </div>
          </form>
        </div>
        
        {/* Help Panel Component - positioned fixed to viewport */}
        <HelpPanel 
          showHelpInfo={showHelpInfo} 
          toggleHelpInfo={toggleHelpInfo} 
          helpItems={accountCreationHelpContent} 
        />
      </>
    );
  }
  
  // Initial account creation form
  return (
    <>
      {/* White container box for the entire form */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 py-4 sm:w-full sm:max-w-2xl sm:mx-auto sm:relative sm:left-auto sm:right-auto sm:ml-auto sm:mr-auto sm:px-0 sm:py-0 bg-white rounded-xl shadow-md overflow-hidden mt-0 sm:-mt-8">
        <form onSubmit={onSubmitForm} className="p-4 sm:p-8 space-y-4">
          {/* Header */}
          <div className="mb-6">
            {/* Mobile header - only visible on mobile */}
            <h2 className="text-lg font-bold text-gray-800 sm:hidden">
              Create An Account
            </h2>
            
            {/* Desktop header - hidden on mobile */}
            <h2 className="text-2xl font-bold text-gray-800 hidden sm:block">
              Create An Account
            </h2>
          </div>
          
          {/* Display general errors at the top if they exist */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {errors.general}
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-800 text-base font-medium mb-2">Email</label>
            <input 
              type="email" 
              id="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="e.g. john.smith@example.com" 
              className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-gray-800 text-base"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.email}</p>}
          </div>
          
          {/* Enhanced Password Field with visibility toggle and requirements - pass mobile-specific props */}
          <div className="mb-6">
            <PasswordField
              value={passwordState}
              onChange={handleFormChange}
              isSubmitting={isSubmitting}
              error={errors.password}
              className="mb-0" 
              inputClassName="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-gray-800 text-base"
              labelClassName="block text-gray-800 text-base font-medium mb-2"
              errorClassName="text-red-500 text-xs sm:text-sm mt-2"
            />
          </div>
          
          {/* Confirm Password Field with Match Indicator */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-800 text-base font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input 
                type="password" 
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPasswordState}
                onChange={handleFormChange}
                placeholder="Re-enter your password" 
                className={`w-full px-4 py-3 bg-white border ${errors.confirmPassword ? 'border-red-500' : confirmPasswordState && confirmPasswordState === passwordState ? 'border-green-500' : 'border-purple-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 text-gray-800 text-base`}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {confirmPasswordState && confirmPasswordState === passwordState && !errors.confirmPassword && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs sm:text-sm mt-2">{errors.confirmPassword}</p>}
            {confirmPasswordState && confirmPasswordState !== passwordState && !errors.confirmPassword && (
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Passwords do not match</p>
            )}
          </div>
          
          <div className="mb-8">
            <div className="mb-0">
              <label className={`flex items-start sm:items-center ${errors.termsAccepted ? 'text-red-500' : ''}`}>
                <input 
                  type="checkbox" 
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                  className={`mt-1 sm:mt-0 mr-3 h-4 w-4 appearance-none checked:bg-[#d39560] border ${errors.termsAccepted ? 'border-red-500' : 'border-purple-300'} bg-white rounded focus:ring-1 focus:ring-[#d39560] flex-shrink-0`}
                  style={{ 
                    backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                    backgroundPosition: "center",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat"
                  }}
                />
                <span className={`text-${errors.termsAccepted ? 'red-500' : 'gray-700'} text-sm leading-5`}>
                  I agree to the{' '}
                  <button 
                    type="button" 
                    onClick={() => openModal('terms')} 
                    className="text-purple-700 font-medium underline hover:text-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:ring-offset-1 rounded px-1"
                  >
                    Terms of Use
                  </button>
                  {' '}and{' '}
                  <button 
                    type="button" 
                    onClick={() => openModal('privacy')} 
                    className="text-purple-700 font-medium underline hover:text-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:ring-offset-1 rounded px-1"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>
              </label>
            </div>
            {errors.termsAccepted && <p className="text-red-500 text-xs sm:text-sm mt-2 ml-7">{errors.termsAccepted}</p>}
          </div>
          
          <div className="space-y-4">
            {/* Get Started Button */}
            <button 
              type="submit"
              disabled={isSubmitting || !passwordsMatch}
              style={{
                backgroundColor: "#31314f", 
                color: "white"
              }}
              className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70 shadow-sm"
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
            
            {/* OR Divider 
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            

            <button 
              type="button"
              onClick={handleGoogleSignInWithTermsCheck}
              disabled={isGoogleSigningIn || isSubmitting}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70"
            >
              {isGoogleSigningIn ? (
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 w-5 mr-3 opacity-50" />
              ) : (
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 w-5 mr-3" />
              )}
              Continue with Google
            </button>
            

            {googleButtonError && (
              <div className="text-red-500 text-sm mb-4 text-center">
                You must accept the Terms of Use and Privacy Policy to continue with Google sign-in
              </div>
            )}*/}
          </div>
          
          <div className="text-center mt-6">
            <p className="text-gray-700 text-sm">
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => window.location.href = '/login?continue=signup'} 
                className="text-purple-700 hover:underline bg-transparent border-none cursor-pointer"
              >
                Login
              </button>
            </p>
          </div>
        </form>
        
        {/* Terms and Privacy Modal - Pass content directly */}
        <TermsPrivacyModal 
          isOpen={modalOpen}
          onClose={closeModal}
          type={modalType}
          // Remove the directContent prop completely
        />
        
        {/* Help Panel Component - positioned fixed to viewport */}
        <HelpPanel 
          showHelpInfo={showHelpInfo} 
          toggleHelpInfo={toggleHelpInfo} 
          helpItems={accountCreationHelpContent} 
        />
      </div>
    </>
  );
};

export default AccountCreationForm;