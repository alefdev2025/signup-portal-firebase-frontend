import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkForEmailSignInLink } from '../services/auth';
import { useUser } from '../contexts/UserContext';
import { parseStepFromURL, addToNavigationHistory } from '../utils/navigationUtils';

export default function EmailVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signupState } = useUser();
  
  // Track navigation for back button functionality
  useEffect(() => {
    addToNavigationHistory(location.pathname + location.search);
  }, [location]);

  useEffect(() => {
    // If user is already signed in, redirect to appropriate step
    if (currentUser) {
      if (signupState) {
        const stepIndex = signupState.signupProgress || 0;
        navigate(`/signup?step=${stepIndex}`, { replace: true });
      } else {
        // Default to step 0 if no signup state
        navigate('/signup', { replace: true });
      }
      return;
    }

    // Check if the current URL contains an email sign-in link
    checkForEmailSignInLink()
      .then(result => {
        if (result.success) {
          // Successfully signed in with email link
          const stepIndex = result.signupProgress || 0;
          navigate(`/signup?step=${stepIndex}`, { replace: true });
        } else if (result.isSignInLink === false) {
          // Not a sign-in link, check for any return path parameters
          const returnPath = new URLSearchParams(location.search).get('returnTo');
          if (returnPath) {
            navigate(returnPath, { replace: true });
          } else {
            // Default to signup page
            navigate('/signup', { replace: true });
          }
        } else {
          // Error signing in with email link
          setError(result.error || 'Failed to verify email. Please try again.');
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Error in email verification:', error);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      });
  }, [currentUser, navigate, location.search, signupState]);

  // Handle retry action
  const handleRetry = () => {
    // Clear any previous errors and redirect to signup
    navigate('/signup', { replace: true });
  };

  // If still loading or immediately redirecting, show loader
  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Email Verification
          </h1>
          
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error, show error message with retry option
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Email Verification
        </h1>
        
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-md mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            onClick={handleRetry}
            style={{
              backgroundColor: "#6f2d74",
              color: "white"
            }}
            className="py-3 px-6 rounded-full font-semibold text-lg mt-4 hover:opacity-90"
          >
            Return to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}