// File: components/signup/LoginOptionBanner.jsx
import React from 'react';

const LoginOptionBanner = ({ getVerificationState, setFormData, handleGoogleSignIn }) => {
  return (
    <div className="mb-8 bg-blue-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-2">Already Started the Sign Up Process?</h3>
      <p className="text-gray-600 mb-4">We noticed you've previously started signing up with us. Continue where you left off.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={() => {
            // Pre-fill the email field with the stored email
            const savedState = getVerificationState();
            console.log("DEBUG: Continuing with saved state:", savedState);
            if (savedState && savedState.email) {
              setFormData(prev => ({
                ...prev,
                email: savedState.email
              }));
            }
          }}
          style={{
            backgroundColor: "#6f2d74",
            color: "white"
          }}
          className="py-3 px-6 rounded-full font-medium text-base flex-1 flex items-center justify-center hover:opacity-90"
        >
          Continue Sign Up
        </button>
        <button 
          type="button"
          onClick={handleGoogleSignIn}
          className="bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base flex-1 flex items-center justify-center hover:bg-gray-50"
        >
          <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 w-5 mr-2" />
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default LoginOptionBanner;