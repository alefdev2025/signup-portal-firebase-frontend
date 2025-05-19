// src/components/SignupRouteGuard.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { 
  getStepIndexByName, 
  getStepPathByIndex,
  getForceNavigation,
  clearForceNavigation
} from '../services/storage';

/**
 * SignupRouteGuard - Protects all signup routes and enforces proper navigation flow
 */
const SignupRouteGuard = ({ children }) => {
  const { currentUser, signupState, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add debugging information
  useEffect(() => {
    console.log("SignupRouteGuard running checks");
    console.log("Current location:", location.pathname);
    console.log("Current user:", currentUser?.uid);
    console.log("SignupState:", signupState);
    console.log("Just verified:", localStorage.getItem('just_verified'));
    console.log("Force navigation:", localStorage.getItem('force_active_step'));
  }, [location.pathname, currentUser, signupState]);
  
  useEffect(() => {
    // Skip navigation checks while still loading
    if (isLoading) {
      console.log("Still loading, skipping navigation checks");
      return;
    }
    
    // FIRST: Check for force navigation (high priority bypass)
    const forceNavigation = getForceNavigation();
    if (forceNavigation) {
      console.log("Force navigation detected, allowing access:", forceNavigation);
      // Clear the force navigation after detecting it - important to prevent loops
      clearForceNavigation();
      return; // Skip all other checks
    }
    
    // SECOND: Check for just verified flag (high priority bypass)
    const justVerified = localStorage.getItem('just_verified') === 'true';
    const verificationTimestamp = parseInt(localStorage.getItem('verification_timestamp') || '0', 10);
    const isRecentVerification = (Date.now() - verificationTimestamp) < 10000; // 10 seconds
    
    if (justVerified && isRecentVerification) {
      console.log("Just verified flag detected, allowing success page access");
      
      // If we're on the success page, clear the verification flags
      if (location.pathname === '/signup/success') {
        localStorage.removeItem('just_verified');
        localStorage.removeItem('verification_timestamp');
      }
      
      // Only bypass further checks if we're on the success page
      if (location.pathname === '/signup/success') {
        return;
      }
    }
    
    // THIRD: If user completed signup, redirect to member portal
    if (currentUser && signupState?.signupCompleted) {
      console.log("Signup already completed, redirecting to member portal");
      navigate('/member-portal', { replace: true });
      return;
    }
    
    // FOURTH: Parse the current path to determine which step the user is trying to access
    let currentStepIndex = 0;
    const path = location.pathname;
    
    if (path.includes('/signup/success')) currentStepIndex = 1;
    else if (path.includes('/signup/contact')) currentStepIndex = 2;
    else if (path.includes('/signup/package')) currentStepIndex = 3;
    else if (path.includes('/signup/funding')) currentStepIndex = 4;
    else if (path.includes('/signup/membership')) currentStepIndex = 5;
    else if (path === '/signup') currentStepIndex = 0;
    
    console.log("Current step index from path:", currentStepIndex);
    
    // For authenticated users, check if they're trying to access an allowed step
    if (currentUser && signupState) {
      console.log("Authenticated user, checking progress");
      
      // Maximum step the user is allowed to access
      // Allow one step beyond their current progress
      const maxAllowedStep = Math.min(signupState.signupProgress + 1, 5);
      console.log("Max allowed step:", maxAllowedStep);
      
      // If trying to access a step beyond allowed progress
      if (currentStepIndex > maxAllowedStep) {
        console.log("Trying to access unauthorized step, redirecting to allowed step");
        
        // Navigate to highest allowed step
        const allowedPath = `/signup${getStepPathByIndex(maxAllowedStep)}`;
        navigate(allowedPath, { replace: true });
        return;
      }
      
      // Special case: If user finished account creation (step 0) but tries to revisit it,
      // redirect them to the success page unless they're explicitly starting fresh
      if (currentStepIndex === 0 && signupState.signupProgress >= 1 && !location.search.includes('fresh=true')) {
        console.log("User finished account creation, redirecting to success page");
        navigate('/signup/success', { replace: true });
        return;
      }
      
      // NEW CODE: Auto-forward to user's current step if they're viewing a completed previous step
      // Only do this if not forced to stay with the force=true parameter
      if (currentStepIndex < signupState.signupProgress && !location.search.includes('force=true')) {
        console.log(`User viewing completed step ${currentStepIndex} but has progressed to step ${signupState.signupProgress}, auto-forwarding`);
        
        // Get the path for the user's current active step
        const currentActivePath = getStepPathByIndex(signupState.signupProgress);
        
        // Navigate to the user's current step
        navigate(`/signup${currentActivePath}`, { replace: true });
        return;
      }
    } else if (!currentUser) {
      console.log("Unauthenticated user, checking access permissions");
      
      // For non-authenticated users, only allow access to the account creation step
      // unless they have a special verification flag set
      if (currentStepIndex !== 0 && !(justVerified && isRecentVerification && currentStepIndex === 1)) {
        console.log("Unauthenticated user trying to access protected step, redirecting to signup");
        navigate('/signup', { replace: true });
        return;
      }
    }
    
    console.log("Navigation checks passed, allowing access to current step");
  }, [currentUser, signupState, isLoading, navigate, location]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  // Render children once checks have passed
  return children;
};

export default SignupRouteGuard;