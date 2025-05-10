// File: components/signup/VerificationForm.jsx
import React from 'react';

const VerificationForm = ({
  formData,
  handleChange,
  isSubmitting,
  errors,
  isExistingUser,
  resendVerificationCode,
  changeEmail
}) => {
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

  return (
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
  );
};

export default VerificationForm;