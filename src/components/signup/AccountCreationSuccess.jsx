// File: components/signup/AccountCreationSuccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountCreationSuccess = ({ currentUser, onNext }) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    // Call the onNext function from the parent component to update state
    if (onNext) {
      // Pass any data needed for the next step
      onNext({});
    } else {
      // Fallback direct navigation if onNext isn't provided
      navigate('/signup?step=1', { replace: true });
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-50 rounded-full p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
        <p className="text-gray-600 mb-6">
          Your Alcor account has been successfully created and verified.
        </p>
        <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
          <div className="flex flex-col space-y-2">
            <div>
              <span className="text-gray-500 text-sm">Email:</span>
              <p className="font-medium">{currentUser?.email || "Your email"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Account Status:</span>
              <p className="font-medium text-green-600">Verified</p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          You can continue with your membership application below.
          Password reset and account settings will be available after completing your signup.
        </p>
      </div>
      
      {/* Continue button that uses the handleNext function */}
      <div className="text-center">
        <button 
          onClick={handleContinue}
          style={{
            backgroundColor: "#6f2d74",
            color: "white",
            display: "inline-flex",
            alignItems: "center"
          }}
          className="py-4 px-8 rounded-full font-semibold text-lg mx-auto hover:opacity-90"
        >
          Continue to Contact Information
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AccountCreationSuccess;