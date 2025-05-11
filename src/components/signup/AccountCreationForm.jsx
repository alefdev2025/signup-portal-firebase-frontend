// File: components/signup/AccountCreationForm.jsx
import React from 'react';
import PasswordField from './PasswordField';

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
  changeEmail
}) => {
  console.log("AccountCreationForm rendered with verificationStep:", verificationStep);
  console.log("Form data:", formData);
  console.log("Errors:", errors);
  
  // Wrap the submit handler to add debugging
  const onSubmitForm = (e) => {
    console.log("Form submit event triggered");
    console.log("Form verificationStep:", verificationStep);
    console.log("Form data being submitted:", formData);
    console.log("Password state:", passwordState ? "Password exists" : "No password");
    console.log("Confirm Password state:", confirmPasswordState ? "Confirm Password exists" : "No confirm password");
    handleSubmit(e);
  };
  
  // Display verification form if needed
  if (verificationStep === "verification") {
    return (
      <form onSubmit={onSubmitForm} className="mx-auto max-w-md md:max-w-none">
        <div className="mb-10 sm:mb-6 mx-auto max-w-md md:max-w-none">
          <label htmlFor="verificationCode" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">
            Verification Code
          </label>
          <input 
            type="text" 
            id="verificationCode"
            name="verificationCode"
            value={formData.verificationCode}
            onChange={handleChange}
            placeholder="Enter 6-digit code" 
            className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
            disabled={isSubmitting}
            autoComplete="one-time-code"
            maxLength={6}
          />
          {errors.verificationCode && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.verificationCode}</p>}
        </div>
        
        <div className="text-sm text-gray-600 mb-8 mx-auto max-w-md md:max-w-none">
          <p>A verification code has been sent to <strong>{formData.email}</strong>.</p>
          <div className="mt-2 flex space-x-4">
            <button 
              type="button" 
              onClick={resendVerificationCode}
              className="text-brand-purple hover:underline"
              disabled={isSubmitting}
            >
              Resend code
            </button>
            <button 
              type="button" 
              onClick={changeEmail}
              className="text-brand-purple hover:underline"
              disabled={isSubmitting}
            >
              Change email
            </button>
          </div>
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
                Verifying...
              </>
            ) : (
              <>
                <span className="mr-2">Verify</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    );
  }
  
  // Initial account creation form
  return (
    <form onSubmit={onSubmitForm} className="space-y-6">
      <div className="mb-10 sm:mb-6 mx-auto max-w-md md:max-w-none">
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
      
      {/* Enhanced Password Field with visibility toggle and requirements */}
      <PasswordField
        value={passwordState}
        onChange={handleChange}
        isSubmitting={isSubmitting}
        error={errors.password}
      />
      
      {/* Confirm Password Field with Match Indicator */}
      <div className="mb-10 sm:mb-6 mx-auto max-w-md md:max-w-none">
        <label htmlFor="confirmPassword" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">
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
            className={`w-full px-4 py-5 sm:py-4 bg-white border ${errors.confirmPassword ? 'border-red-500' : confirmPasswordState && confirmPasswordState === passwordState ? 'border-green-500' : 'border-brand-purple/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg`}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          {confirmPasswordState && confirmPasswordState === passwordState && !errors.confirmPassword && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.confirmPassword}</p>}
        {confirmPasswordState && confirmPasswordState !== passwordState && !errors.confirmPassword && (
          <p className="text-gray-500 text-sm mt-3 sm:mt-1">Passwords do not match</p>
        )}
      </div>
      
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
          Already an Alcor Member? <a href="/login" className="text-brand-purple">Login here</a>
        </p>
      </div>
    </form>
  );
};

export default AccountCreationForm;