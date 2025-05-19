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

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false); // Synchronous request
    xhr.send(`[ROUTE GUARD] ${message}`);
    console.log(`[ROUTE GUARD] ${message}`); // Also log to console
  } catch (e) {
    // Ignore errors
  }
};

/**
 * SignupRouteGuard - Protects all signup routes and enforces proper navigation flow
 */
const SignupRouteGuard = ({ children }) => {
  const { currentUser, signupState, isLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add debugging information
  useEffect(() => {
    LOG_TO_TERMINAL("SignupRouteGuard initialization");
    LOG_TO_TERMINAL(`Current location: ${location.pathname}`);
    LOG_TO_TERMINAL(`Current user: ${currentUser?.uid || 'null'}`);
    LOG_TO_TERMINAL(`SignupState: ${JSON.stringify(signupState || {})}`);
    LOG_TO_TERMINAL(`Just verified: ${localStorage.getItem('just_verified') || 'null'}`);
    LOG_TO_TERMINAL(`Force navigation: ${localStorage.getItem('force_active_step') || 'null'}`);

    // Debug button to dump state
    const debugButton = document.createElement('button');
    debugButton.textContent = 'DEBUG ROUTE GUARD';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '110px';
    debugButton.style.left = '10px';
    debugButton.style.backgroundColor = 'blue';
    debugButton.style.color = 'white';
    debugButton.style.padding = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.onclick = () => {
      LOG_TO_TERMINAL(`ROUTE GUARD STATE: 
        isLoading: ${isLoading}
        currentUser: ${currentUser?.uid || 'null'}
        signupState: ${JSON.stringify(signupState || {})}
        location: ${location.pathname}
        justVerified: ${localStorage.getItem('just_verified') || 'null'}
        verificationTimestamp: ${localStorage.getItem('verification_timestamp') || 'null'}
        forceNavigation: ${getForceNavigation() || 'null'}
        linkingEmail: ${localStorage.getItem('linkingEmail') || 'null'}
      `);
    };
    document.body.appendChild(debugButton);
    
    return () => {
      document.body.removeChild(debugButton);
      LOG_TO_TERMINAL("SignupRouteGuard UNMOUNTED");
    };
  }, []);
  
  useEffect(() => {
    LOG_TO_TERMINAL("========== ROUTE GUARD NAVIGATION CHECK ==========");
    LOG_TO_TERMINAL(`Current path: ${location.pathname}`);
    LOG_TO_TERMINAL(`Current user: ${currentUser?.uid || 'null'}`);
    LOG_TO_TERMINAL(`Signup state: ${JSON.stringify(signupState || {})}`);
    LOG_TO_TERMINAL(`Force navigation: ${getForceNavigation() || 'null'}`);
    
    // Improved linking check
    const linkingEmail = localStorage.getItem('linkingEmail');
    const showLinkingModal = localStorage.getItem('showLinkingModal');
    const isLinking = linkingEmail !== null && showLinkingModal === 'true';
    
    LOG_TO_TERMINAL(`Linking in progress: ${linkingEmail || 'null'}, showModal: ${showLinkingModal || 'null'}, isLinking: ${isLinking}`);
    
    if (isLinking) {
      LOG_TO_TERMINAL(`Account linking in progress for ${linkingEmail}, bypassing navigation checks`);
      return; // Skip all other checks
    }
    
    // Skip navigation checks while still loading
    if (isLoading) {
      LOG_TO_TERMINAL("Still loading, skipping navigation checks");
      return;
    }
    
    // FIRST: Check for force navigation (high priority bypass)
    const forceNavigation = getForceNavigation();
    if (forceNavigation !== null && forceNavigation !== undefined) {
      LOG_TO_TERMINAL(`Force navigation detected: ${forceNavigation} (type: ${typeof forceNavigation}), allowing access`);
      // Clear the force navigation after detecting it - important to prevent loops
      clearForceNavigation();
      LOG_TO_TERMINAL("Force navigation flag cleared");
      return; // Skip all other checks
    }
    
    // SECOND: Check for just verified flag (high priority bypass)
    const justVerified = localStorage.getItem('just_verified') === 'true';
    const verificationTimestamp = parseInt(localStorage.getItem('verification_timestamp') || '0', 10);
    const isRecentVerification = (Date.now() - verificationTimestamp) < 10000; // 10 seconds
    
    LOG_TO_TERMINAL(`Just verified flag: ${justVerified}, Recent: ${isRecentVerification}, Time diff: ${Date.now() - verificationTimestamp}ms`);
    
    if (justVerified && isRecentVerification) {
      LOG_TO_TERMINAL("Just verified flag detected, allowing success page access");
      
      // If we're on the success page, clear the verification flags
      if (location.pathname === '/signup/success') {
        LOG_TO_TERMINAL("On success page, clearing verification flags");
        localStorage.removeItem('just_verified');
        localStorage.removeItem('verification_timestamp');
      }
      
      // Only bypass further checks if we're on the success page
      if (location.pathname === '/signup/success') {
        LOG_TO_TERMINAL("Allowing access to success page due to recent verification");
        return;
      }
    }
    
    // THIRD: If user completed signup, redirect to member portal
    if (currentUser && signupState?.signupCompleted) {
      LOG_TO_TERMINAL("Signup already completed, redirecting to member portal");
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
    
    LOG_TO_TERMINAL(`Current step index from path: ${currentStepIndex}`);
    
    // For authenticated users, check if they're trying to access an allowed step
    if (currentUser && signupState) {
      LOG_TO_TERMINAL("Authenticated user, checking progress");
      
      // Maximum step the user is allowed to access
      // Allow one step beyond their current progress
      const maxAllowedStep = Math.min(signupState.signupProgress + 1, 5);
      LOG_TO_TERMINAL(`Max allowed step: ${maxAllowedStep}`);
      
      // If trying to access a step beyond allowed progress
      if (currentStepIndex > maxAllowedStep) {
        LOG_TO_TERMINAL(`Trying to access unauthorized step ${currentStepIndex}, redirecting to allowed step ${maxAllowedStep}`);
        
        // Navigate to highest allowed step
        const allowedPath = `/signup${getStepPathByIndex(maxAllowedStep)}`;
        LOG_TO_TERMINAL(`Redirecting to: ${allowedPath}`);
        navigate(allowedPath, { replace: true });
        return;
      }
      
      // Special case: If user finished account creation (step 0) but tries to revisit it,
      // redirect them to the success page unless they're explicitly starting fresh
      if (currentStepIndex === 0 && signupState.signupProgress >= 1 && !location.search.includes('fresh=true')) {
        LOG_TO_TERMINAL("User finished account creation, redirecting to success page");
        navigate('/signup/success', { replace: true });
        return;
      }
      
      // Auto-forward to user's current step if they're viewing a completed previous step
      // Only do this if not forced to stay with the force=true parameter
      if (currentStepIndex < signupState.signupProgress && !location.search.includes('force=true')) {
        LOG_TO_TERMINAL(`User viewing completed step ${currentStepIndex} but has progressed to step ${signupState.signupProgress}, auto-forwarding`);
        
        // Get the path for the user's current active step
        const currentActivePath = getStepPathByIndex(signupState.signupProgress);
        
        // Navigate to the user's current step
        LOG_TO_TERMINAL(`Redirecting to current active step: /signup${currentActivePath}`);
        navigate(`/signup${currentActivePath}`, { replace: true });
        return;
      }
    } else if (!currentUser) {
      LOG_TO_TERMINAL("Unauthenticated user, checking access permissions");
      
      // For non-authenticated users, only allow access to the account creation step
      // unless they have a special verification flag set
      if (currentStepIndex !== 0 && !(justVerified && isRecentVerification && currentStepIndex === 1)) {
        LOG_TO_TERMINAL(`Unauthenticated user trying to access protected step ${currentStepIndex}, redirecting to signup`);
        navigate('/signup', { replace: true });
        return;
      }
    }
    
    LOG_TO_TERMINAL("Navigation checks passed, allowing access to current step");
    LOG_TO_TERMINAL("=================================================");
  }, [currentUser, signupState, isLoading, navigate, location]);
  
  // Show loading state while checking auth
  if (isLoading) {
    LOG_TO_TERMINAL("Rendering loading spinner");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  // Render children once checks have passed
  LOG_TO_TERMINAL("Rendering children components");
  return children;
};

export default SignupRouteGuard;