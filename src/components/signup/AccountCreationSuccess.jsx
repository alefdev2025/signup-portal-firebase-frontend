// File: components/signup/AccountCreationSuccess.jsx - SIMPLIFIED VERSION
import React, { useState } from 'react';
import alcorFullLogo from '../../assets/images/navy-alcor-logo.png';
import PrimaryButton from './PrimaryButton';

const AccountCreationSuccess = ({ currentUser, onNext }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle continue button click
  const handleContinue = async () => {
    console.log("Continue button clicked in AccountCreationSuccess");
    setIsLoading(true);
    setError(null);
    
    try {
      // Just call the parent's onNext handler
      // The parent (AccountSuccessStep) handles all the logic
      await onNext();
    } catch (error) {
      console.error("Error in continue handler:", error);
      setError("There was an issue updating your progress. Please try again.");
      setIsLoading(false);
    }
    // Note: Don't set isLoading to false on success because we're navigating away
  };
  
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 py-4 sm:w-full sm:max-w-3xl sm:mx-auto sm:relative sm:left-auto sm:right-auto sm:ml-auto sm:mr-auto sm:px-0 sm:py-0">
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100">
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
        
        {/* Account info card */}
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
                <p className="font-semibold text-[#0C2340]">{currentUser?.email || "Your email"}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#453760]/10 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#453760]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="text-gray-500 text-sm font-medium">Account Status</span>
                <p className="font-semibold text-[#453760]">Verified</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info section */}
        <div className="flex justify-between items-center bg-[#0C2340]/5 rounded-xl p-5 mb-8">
          <p className="text-gray-600 text-sm pr-4">
            You can continue with your membership application below.
            Once you've completed your signup, you can enable multi-factor authentication.
          </p>
          <img src={alcorFullLogo} alt="Alcor Logo" className="h-12 hidden sm:block" />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg mb-6 text-sm">
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </p>
          </div>
        )}
      </div>
          
      {/* Continue button */}
      <div className="text-center">
        <PrimaryButton
          onClick={handleContinue}
          disabled={isLoading}
          isLoading={isLoading}
          loadingText="Processing..."
        >
          <span className="sm:hidden">Continue</span>
          <span className="hidden sm:inline">Continue to Contact Information</span>
        </PrimaryButton>
      </div>
    </div>
  );
};

export default AccountCreationSuccess;