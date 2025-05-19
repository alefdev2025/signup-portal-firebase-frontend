// src/components/ProtectedStepRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const ProtectedStepRoute = ({ 
  children, 
  requiredStep = 0, 
  redirectPath = '/login'
}) => {
  const { currentUser, signupState, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!isLoading && currentUser && signupState) {
      console.log(`ProtectedStepRoute - Required step: ${requiredStep}, User progress: ${signupState.signupProgress}`);
      
      // If trying to access a step beyond what's allowed
      if (requiredStep > signupState.signupProgress + 1) {
        console.log("User attempting to access step beyond allowed progress");
        
        // Navigate to the max allowed step
        const stepPaths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
        const maxAllowedStep = Math.min(signupState.signupProgress + 1, 5);
        const correctPath = `/signup${stepPaths[maxAllowedStep]}`;
        
        console.log(`Redirecting to allowed step: ${correctPath}`);
        navigate(correctPath, { replace: true });
      }
    }
  }, [currentUser, signupState, isLoading, requiredStep, navigate]);
  
  // Show loading indicator while auth is being checked
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  // If user is not logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  // If user completed signup, redirect to member portal
  if (signupState?.signupCompleted) {
    return <Navigate to="/member-portal" replace />;
  }
  
  // If step is too high and beyond allowed progress, don't render yet
  // (the useEffect will handle redirection)
  if (requiredStep > signupState?.signupProgress + 1) {
    return null;
  }
  
  // All conditions met, render the children
  return <>{children}</>;
};

export default ProtectedStepRoute;