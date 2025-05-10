import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkForEmailSignInLink } from '../services/auth';
import { useUser } from '../contexts/UserContext';

export default function EmailVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useUser();

  useEffect(() => {
    // If user is already signed in, redirect to where they left off
    if (currentUser) {
      navigate('/signup');
      return;
    }

    // Check if the current URL contains an email sign-in link
    checkForEmailSignInLink()
      .then(result => {
        if (result.success) {
          // Successfully signed in with email link
          navigate('/signup');
        } else if (result.isSignInLink === false) {
          // Not a sign-in link, redirect to signup page
          navigate('/signup');
        } else {
          // Error signing in with email link
          setError(result.error || 'Failed to verify email. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error in email verification:', error);
        setError('An unexpected error occurred. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Email Verification
        </h1>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="bg-red-100 p-4 rounded-md mb-4">
              <p className="text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => navigate('/signup')}
              style={{
                backgroundColor: "#6f2d74",
                color: "white"
              }}
              className="py-3 px-6 rounded-full font-semibold text-lg mt-4 hover:opacity-90"
            >
              Return to Sign Up
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-green-100 p-4 rounded-md mb-4">
              <p className="text-green-700">Email verified successfully!</p>
            </div>
            <p className="text-gray-600 mb-6">Redirecting you to continue your sign up process...</p>
          </div>
        )}
      </div>
    </div>
  );
}