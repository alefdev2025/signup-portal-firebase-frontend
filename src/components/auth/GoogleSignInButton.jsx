// src/components/auth/GoogleSignInButton.jsx
import React, { useState } from 'react';
import { signInWithGoogle, getPendingLinkingEmail } from '../../services/auth';
import PropTypes from 'prop-types';
//import { auth } from '../../services/firebase';

/**
 * Google Sign-In Button component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSuccess - Callback for successful sign-in
 * @param {Function} props.onError - Callback for sign-in errors
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.highlight - Whether to highlight the button
 * @param {string} props.label - Custom label text for the button
 * @param {Function} props.onAccountConflict - Callback for account conflicts
 * @param {Function} props.setIsSubmitting - Callback to update parent submission state
 * @param {Function} props.setPendingGoogleLinking - Callback to update Google linking state
 */
const GoogleSignInButton = ({
  onSuccess,
  onError,
  disabled = false,
  highlight = false,
  label = "Continue with Google",
  onAccountConflict,
  setIsSubmitting,
  setPendingGoogleLinking
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || isLoading) return;

    console.log("HELLO");

    //console.log("Auth domain:", auth.config.authDomain);
    
    setIsLoading(true);
    if (setIsSubmitting) setIsSubmitting(true);
    
    try {
      console.log("DEBUG: Attempting Google sign-in");
      
      // Check if we have a pending linking email
      const pendingEmail = getPendingLinkingEmail();
      if (pendingEmail) {
        console.log(`DEBUG: Detected pending linking email: ${pendingEmail}`);
      }
      
      // Call the signInWithGoogle function from your auth service
      const result = await signInWithGoogle();
      console.log("DEBUG: Google sign-in result:", result);
      
      // Check for account conflict
      if (result && (result.accountConflict === true || result.error === 'auth/account-exists-with-different-credential')) {
        console.log("DEBUG: Account conflict detected", result);
        if (onAccountConflict) {
          onAccountConflict(result);
        }
        return;
      }
      
      // Check if this is a linking flow
      if (setPendingGoogleLinking && pendingEmail) {
        console.log("DEBUG: Setting pending Google linking state");
        setPendingGoogleLinking(true);
      }
      
      // Handle success
      if (result && result.success) {
        console.log("DEBUG: Google sign-in successful");
        if (onSuccess) {
          onSuccess(result);
        }
      } else if (result && result.isNewUser) {
        // Handle new user case
        console.log("DEBUG: New user detected from Google sign-in");
        if (onSuccess) {
          onSuccess(result, true); // Pass isNewUser flag
        }
      } else {
        // Generic failure
        throw new Error(result?.message || "Failed to sign in with Google");
      }
    } catch (error) {
      console.error("DEBUG: Google sign-in error:", error);
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user' || error.message === 'Sign-in was cancelled') {
        errorMessage = "Google sign-in was cancelled. Please try again.";
      } else if (error.message && error.message.includes('popup')) {
        errorMessage = "Pop-up was blocked. Please enable pop-ups for this site and try again.";
      } else if (error.message && error.message.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      if (onError) {
        onError(errorMessage, error);
      }
    } finally {
      setIsLoading(false);
      if (setIsSubmitting) setIsSubmitting(false);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      className={`w-full bg-white border ${highlight ? 'border-blue-500 ring-2 ring-blue-200 animate-pulse' : 'border-gray-300'} text-gray-700 py-3 px-6 rounded-full font-medium text-base flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </>
      ) : (
        <>
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google logo" 
            className="h-6 w-6 mr-3" 
          />
          {label}
        </>
      )}
    </button>
  );
};

GoogleSignInButton.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
  highlight: PropTypes.bool,
  label: PropTypes.string,
  onAccountConflict: PropTypes.func,
  setIsSubmitting: PropTypes.func,
  setPendingGoogleLinking: PropTypes.func
};

export default GoogleSignInButton;