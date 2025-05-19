// src/components/modals/AccountLinkingModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AccountLinkingModal = ({ 
  isOpen, 
  onClose, 
  email, 
  onLinkAccounts, 
  isLoading 
}) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Add logging for modal lifecycle
  useEffect(() => {
    if (isOpen) {
      console.log("===== ACCOUNT LINKING MODAL OPENED =====");
      console.log("Email to link:", email);
      console.log("Is loading:", isLoading);
    } else {
      console.log("Account linking modal closed or not showing");
    }
  }, [isOpen, email, isLoading]);
  
  // Handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(''); // Clear error when typing
    // Not logging password values for security
    console.log("Password input changed, error cleared");
  };
  
  // Handle form submission for linking
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("===== ACCOUNT LINKING FORM SUBMITTED =====");
    
    if (!password) {
      console.log("ERROR: Password field is empty");
      setError('Password is required');
      return;
    }
    
    console.log("Password provided, attempting to link accounts...");
    console.log("Email being linked:", email);
    
    try {
      console.log("Calling onLinkAccounts with password");
      await onLinkAccounts(password);
      console.log("SUCCESS: Account linking completed without throwing errors");
      // Success is handled by the parent component
    } catch (err) {
      console.error("ERROR LINKING ACCOUNTS:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      
      // Enhanced error messaging based on error type
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to link accounts. Please try again.');
      }
    }
  };
  
  // Navigate to login page if user prefers that
  const handleGoToLogin = () => {
    console.log("===== REDIRECTING TO LOGIN PAGE =====");
    console.log("Target URL:", `/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
    
    navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
    console.log("Navigation triggered, closing modal");
    onClose();
  };
  
  // Use different account button handler
  const handleUseDifferentAccount = () => {
    console.log("===== USER CHOSE DIFFERENT ACCOUNT =====");
    // Close the modal and let the user continue with the form
    onClose();
    console.log("Modal closed, user returning to signup form");
  };
  
  if (!isOpen) return null;
  
  console.log("Rendering account linking modal for email:", email);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="mb-4 text-center">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Account Already Exists</h2>
          <p className="text-gray-600 mt-2">
            The email <span className="font-semibold">{email}</span> is already registered with a password.
          </p>
          <p className="text-gray-600 mt-2">
            Would you like to link your Google account to it?
          </p>
        </div>
        
        {/* Password form for linking */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">
              Enter your password to link accounts
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Your existing password"
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6f2d74] text-white py-2 px-4 rounded-md font-medium hover:bg-[#5c1a61] disabled:opacity-70 flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Linking...
                </>
              ) : (
                "Link Accounts"
              )}
            </button>
            
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded-md font-medium hover:bg-gray-50"
            >
              Go to Login Page
            </button>
            
            <button
              type="button"
              onClick={handleUseDifferentAccount}
              className="w-full bg-white text-gray-700 py-1 px-4 font-medium text-sm hover:underline"
            >
              Use Different Account
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm text-gray-500">
          <button
            type="button"
            className="text-blue-500 hover:underline"
            onClick={() => navigate('/reset-password')}
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountLinkingModal;