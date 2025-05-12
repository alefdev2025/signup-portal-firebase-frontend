// File: components/signup/AccountCreationForm.jsx
import React, { useState } from 'react';
import PasswordField from './PasswordField';
import navyAlcorLogo from '../../assets/images/navy-a-logo.png';
import TermsPrivacyModal from '../modals/TermsPrivacyModal';

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
  highlightGoogleButton
}) => {
  // State for modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'terms' or 'privacy'
  // Add state to track if resend code is in progress
  const [resendingCode, setResendingCode] = useState(false);
  
  console.log("AccountCreationForm rendered with verificationStep:", verificationStep);
  console.log("Form data:", formData);
  console.log("Errors:", errors);
  
  // Terms of Use content
  const termsContent = `
    <h1>Terms of Use</h1>
    <p><em>Last Updated: May 1, 2025</em></p>

    <h2>1. Introduction</h2>
    <p>Welcome to Alcor Cryonics ("we," "our," or "us"). This document outlines the terms and conditions for using our services and website.</p>
    
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p>
    
    <h2>2. Definitions</h2>
    <p>In these Terms, "Service" refers to our cryonics services, website, and related offerings. "User" or "you" refers to individuals accessing or using our Service.</p>
    
    <p>Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui.</p>
    
    <h2>3. Acceptance of Terms</h2>
    <p>By accessing or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.</p>
    
    <p>Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim. Curabitur sit amet mauris.</p>
    
    <h2>4. User Accounts</h2>
    <p>When you create an account with us, you guarantee that the information you provide is accurate, complete, and current. Inaccurate, incomplete, or obsolete information may result in the termination of your account.</p>
    
    <p>Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. Proin sodales libero eget ante.</p>
    
    <h2>5. Service Usage</h2>
    <p>You agree not to use our Service for any illegal or unauthorized purpose. You must not transmit worms, viruses, or any code of a destructive nature.</p>
    
    <p>Aenean laoreet. Vestibulum nisi lectus, commodo ac, facilisis ac, ultricies eu, pede. Ut orci risus, accumsan porttitor, cursus quis, aliquet eget, justo. Sed pretium blandit orci. Ut eu diam at pede suscipit sodales. Aenean lectus elit, fermentum non, convallis id, sagittis at, neque.</p>
    
    <h2>6. Changes to Terms</h2>
    <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes as appropriate. Your continued use of our Service constitutes acceptance of any updates to these Terms.</p>
  `;

  // Privacy Policy content
  const privacyContent = `
    <h1>Privacy Policy</h1>
    <p><em>Last Updated: May 1, 2025</em></p>

    <h2>1. Introduction</h2>
    <p>At Alcor Cryonics ("we," "our," or "us"), we respect your privacy and are committed to protecting it through our compliance with this policy.</p>
    
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p>
    
    <h2>2. Information We Collect</h2>
    <p>We collect several types of information from and about users of our website, including:</p>
    
    <ul>
        <li>Personal information such as name, postal address, email address, telephone number, and any other identifier by which you may be contacted online or offline.</li>
        <li>Information about your internet connection, the equipment you use to access our website, and usage details.</li>
    </ul>
    
    <p>Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui.</p>
    
    <h2>3. How We Collect Information</h2>
    <p>We collect information directly from you when you provide it to us and automatically as you navigate through the site.</p>
    
    <p>Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim. Curabitur sit amet mauris.</p>
    
    <h2>4. How We Use Your Information</h2>
    <p>We use information that we collect about you or that you provide to us:</p>
    
    <ul>
        <li>To present our website and its contents to you.</li>
        <li>To provide you with information, products, or services that you request from us.</li>
        <li>To fulfill any other purpose for which you provide it.</li>
        <li>To notify you about changes to our website or any products or services we offer.</li>
    </ul>
  `;
  
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
  
  // Handle resend verification code with state update
  const handleResendCode = async () => {
    setResendingCode(true);
    await resendVerificationCode();
    setResendingCode(false);
  };
  
  // Display verification form if needed
  if (verificationStep === "verification") {
    return (
      <form onSubmit={onSubmitForm} className="mx-auto max-w-md md:max-w-none pt-16 sm:pt-0 space-y-10 sm:space-y-6">
        <div className="mb-10 sm:mb-10 mx-auto max-w-md md:max-w-none">
          <label htmlFor="verificationCode" className="block text-gray-800 text-base sm:text-lg font-medium mb-4 sm:mb-4">
            Verification Code
          </label>
          <input 
            type="text" 
            id="verificationCode"
            name="verificationCode"
            value={formData.verificationCode}
            onChange={handleChange}
            placeholder="Enter the 6-digit code" 
            className="w-full px-3 sm:px-4 py-3 sm:py-5 bg-white border border-gray-300 sm:border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-base sm:text-lg"
            disabled={isSubmitting || resendingCode}
            autoComplete="one-time-code"
            maxLength={6}
          />
          {errors.verificationCode && <p className="text-red-500 text-xs sm:text-sm mt-2 sm:mt-3">{errors.verificationCode}</p>}
        </div>
        
        <div className="text-sm sm:text-base text-gray-600 mb-12 sm:mb-8 mx-auto max-w-md md:max-w-none">
          <p>A verification code has been sent to <strong>{formData.email}</strong>.</p>
          <div className="mt-8 sm:mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-5 sm:space-y-0 sm:justify-between">
            <button 
              type="button" 
              onClick={handleResendCode}
              className="flex items-center justify-center py-3 px-5 sm:px-6 bg-white border border-gray-300 hover:bg-gray-50 rounded-full text-gray-700 font-semibold text-base sm:text-base transition-colors shadow-sm hover:shadow-md sm:w-[calc(50%-0.5rem)]"
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
              className="flex items-center justify-center py-3 px-5 sm:px-6 bg-white border border-gray-300 hover:bg-gray-50 rounded-full text-gray-700 font-semibold text-base sm:text-base transition-colors shadow-sm hover:shadow-md sm:w-[calc(50%-0.5rem)]"
              disabled={isSubmitting || resendingCode}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#f39c12]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Change email
            </button>
          </div>
        </div>
        
        <div className="mx-auto max-w-md md:max-w-none mt-12 sm:mt-0">
          <button 
            type="submit"
            disabled={isSubmitting || resendingCode}
            style={{
              backgroundColor: "#6f2d74",
              color: "white"
            }}
            className="w-full py-3 sm:py-5 px-6 rounded-full font-semibold text-base sm:text-lg mb-16 sm:mb-8 flex items-center justify-center hover:opacity-90 disabled:opacity-70 shadow-sm"
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
    );
  }
  
  // Initial account creation form
  return (
    <>
      {/* Add mobile-specific styling with responsive classes - mobile first, desktop remains unchanged */}
      <form onSubmit={onSubmitForm} className="space-y-6 mt-12 sm:mt-0">
        <div className="mb-6 sm:mb-10 mx-auto max-w-md md:max-w-none">
          <label htmlFor="email" className="block text-gray-800 text-base sm:text-lg font-medium mb-2 sm:mb-4">Email</label>
          <input 
            type="email" 
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. john.smith@example.com" 
            className="w-full px-3 sm:px-4 py-3 sm:py-5 bg-white border border-gray-300 sm:border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-base sm:text-lg"
            disabled={isSubmitting}
          />
          {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-3">{errors.email}</p>}
        </div>
        
        {/* Enhanced Password Field with visibility toggle and requirements - pass mobile-specific props */}
        <PasswordField
          value={passwordState}
          onChange={handleChange}
          isSubmitting={isSubmitting}
          error={errors.password}
          className="mb-6 sm:mb-10" 
          inputClassName="w-full px-3 sm:px-4 py-3 sm:py-5 bg-white border border-gray-300 sm:border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-base sm:text-lg"
          labelClassName="block text-gray-800 text-base sm:text-lg font-medium mb-2 sm:mb-4"
          errorClassName="text-red-500 text-xs sm:text-sm mt-1 sm:mt-3"
        />
        
        {/* Confirm Password Field with Match Indicator */}
        <div className="mb-6 sm:mb-10 mx-auto max-w-md md:max-w-none">
          <label htmlFor="confirmPassword" className="block text-gray-800 text-base sm:text-lg font-medium mb-2 sm:mb-4">
            Confirm Password
          </label>
          <div className="relative">
            <input 
              type="password" 
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPasswordState}
              onChange={handleChange}
              placeholder="Re-enter your password" 
              className={`w-full px-3 sm:px-4 py-3 sm:py-5 bg-white border ${errors.confirmPassword ? 'border-red-500' : confirmPasswordState && confirmPasswordState === passwordState ? 'border-green-500' : 'border-gray-300 sm:border-brand-purple/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-base sm:text-lg`}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {confirmPasswordState && confirmPasswordState === passwordState && !errors.confirmPassword && (
              <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-3">{errors.confirmPassword}</p>}
          {confirmPasswordState && confirmPasswordState !== passwordState && !errors.confirmPassword && (
            <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-3">Passwords do not match</p>
          )}
        </div>
        
        <div className="mb-6 sm:mb-12 mx-auto max-w-md md:max-w-none">
          <label className={`flex items-start sm:items-center ${errors.termsAccepted ? 'text-red-500' : ''}`}>
            <input 
              type="checkbox" 
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`mt-0.5 sm:mt-0 mr-2 sm:mr-4 h-4 sm:h-5 w-4 sm:w-5 appearance-none checked:bg-[#d39560] border ${errors.termsAccepted ? 'border-red-500' : 'border-gray-300 sm:border-brand-purple/30'} bg-brand-purple/5 rounded focus:ring-1 focus:ring-[#d39560]`}
              style={{ 
                backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                backgroundPosition: "center",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat"
              }}
            />
            <span className={`text-${errors.termsAccepted ? 'red-500' : 'gray-700'} text-sm sm:text-base`}>I agree to the<button 
                type="button" 
                onClick={() => openModal('terms')} 
                className="text-brand-purple font-medium underline hover:text-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1 rounded px-1"
              >Terms of Use</button>and<button 
                type="button" 
                onClick={() => openModal('privacy')} 
                className="text-brand-purple font-medium underline hover:text-purple-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-offset-1 rounded px-1"
              >Privacy Policy</button>.</span>
          </label>
          {errors.termsAccepted && <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-3 ml-7 sm:ml-10">{errors.termsAccepted}</p>}
        </div>
        
        <div className="mx-auto max-w-md md:max-w-none">
          {/* Get Started Button */}
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: "#31314f", /**4c3a57 */
              color: "white"
            }}
            className="w-full py-3 sm:py-5 px-6 rounded-full font-semibold text-base sm:text-lg mb-2 sm:mb-10 flex items-center justify-center hover:opacity-90 disabled:opacity-70 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 sm:h-5 w-4 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <span className="mr-2">Get Started</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
          
          {/* OR Divider - More compact on mobile */}
          <div className="flex items-center my-3 sm:my-10">
            <div className="flex-grow border-t border-gray-300"></div>
            <div className="px-4 sm:px-8 text-gray-500 uppercase text-xs sm:text-sm">OR</div>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          {/* Google Sign In Button - Shorter spacing on mobile */}
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 sm:py-5 px-6 rounded-full font-medium text-base sm:text-lg mb-6 sm:mb-12 flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70"
          >
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 sm:h-6 w-5 sm:w-6 mr-2 sm:mr-3" />
            Continue with Google
          </button>
        </div>
        
        <div className="text-center mx-auto max-w-md md:max-w-none">
          <p className="text-gray-700 text-sm sm:text-base">
            Already an Alcor Member? <a href="/login" className="text-brand-purple">Login here</a>
          </p>
        </div>
      </form>
      
      {/* Terms and Privacy Modal - Pass content directly */}
      <TermsPrivacyModal 
        isOpen={modalOpen}
        onClose={closeModal}
        type={modalType}
        directContent={modalType === 'terms' ? termsContent : privacyContent}
      />
    </>
  );
};

export default AccountCreationForm;