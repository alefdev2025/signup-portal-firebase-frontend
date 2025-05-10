import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

/**
 * Protected Route component for controlling access to routes based on authentication state
 * @param {object} props Component props
 * @param {React.ReactNode} props.children The components/elements to render if conditions are met
 * @param {boolean} [props.requireAuth=true] Whether authentication is required to access this route
 * @param {boolean} [props.allowWhenVerified=false] Allow access if the user has a valid verification state
 * @param {number} [props.requiredStep] If set, user must have completed up to this step to access
 * @returns {React.ReactNode} The protected route content or a redirect
 */
export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  allowWhenVerified = false,
  requiredStep
}) {
  const { currentUser, signupState, loading } = useUser();
  const location = useLocation();
  const isAuthenticated = !!currentUser;
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Check verification state if allowWhenVerified is true
  let hasValidVerification = false;
  if (allowWhenVerified) {
    try {
      const verificationState = JSON.parse(localStorage.getItem('alcor_verification_state') || 'null');
      if (verificationState && verificationState.timestamp) {
        const now = Date.now();
        const stateAge = now - verificationState.timestamp;
        const maxAge = 15 * 60 * 1000; // 15 minutes
        hasValidVerification = stateAge < maxAge;
      }
    } catch (error) {
      console.error("Error checking verification state:", error);
    }
  }
  
  // Case 1: Route requires authentication but user is not logged in
  if (requireAuth && !isAuthenticated && !hasValidVerification) {
    // Redirect to login page, preserving the intended destination
    return <Navigate to="/signup" state={{ from: location }} replace />;
  }
  
  // Case 2: Route requires a specific signup step to be completed
  if (
    requireAuth && 
    isAuthenticated && 
    typeof requiredStep === 'number' && 
    signupState &&
    signupState.signupProgress < requiredStep
  ) {
    // Redirect to the appropriate step in the signup flow
    return <Navigate to={`/signup?step=${signupState.signupProgress}`} replace />;
  }
  
  // Case 3: Route should NOT be accessible when logged in (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // If user is logged in, redirect to dashboard or home
    return <Navigate to="/dashboard" replace />;
  }
  
  // If all conditions are met, render the protected content
  return children;
}