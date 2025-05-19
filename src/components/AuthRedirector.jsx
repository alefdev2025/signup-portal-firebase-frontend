// src/components/AuthRedirector.jsx - ONLY MODIFY THIS FILE
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const AuthRedirector = () => {
  const { currentUser, signupState, isLoading, authResolved } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigatedRef = useRef(false);
  
  useEffect(() => {
    // Only make decisions when auth is resolved and not loading
    if (!authResolved || isLoading) {
      console.log("Auth still loading, not redirecting yet");
      return;
    }
    
    // For login page only - wait until we have full user data before navigation
    if (location.pathname === '/login' && currentUser && signupState && !hasNavigatedRef.current) {
      console.log("Login page with auth data - handling navigation to prevent flash");
      
      // Set flag to prevent repeated navigation
      hasNavigatedRef.current = true;
      
      // Get the correct step paths array
      const stepPaths = [
        '/signup',
        '/signup/success', 
        '/signup/contact', 
        '/signup/package', 
        '/signup/funding', 
        '/signup/membership'
      ];
      
      // If user is on login page
      console.log("User is authenticated on login page");
      
      // Determine where they should be based on progress
      if (signupState.signupCompleted) {
        console.log("User has completed signup, redirecting to member portal");
        navigate('/member-portal', { replace: true });
      } else {
        const correctStep = signupState.signupProgress;
        console.log(`User progress is step ${correctStep}, redirecting to appropriate page`);
        navigate(stepPaths[correctStep], { replace: true });
      }
      
      return;
    }
    
    // Original logic for other pages
    const path = location.pathname;
    
    if (currentUser && signupState) {
      console.log("AuthRedirector: User authenticated, checking paths");
      
      // Get the step paths array
      const stepPaths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
      
      // If user is on login page or base signup page
      if ((path === '/login' || path === '/signup') && !hasNavigatedRef.current) {
        // Already handled login page above, this is for '/signup' only
        if (path === '/signup') {
          hasNavigatedRef.current = true;
          
          // Determine where they should be based on progress
          if (signupState.signupCompleted) {
            console.log("User has completed signup, redirecting to member portal");
            navigate('/member-portal', { replace: true });
          } else {
            const correctStep = signupState.signupProgress;
            console.log(`User progress is step ${correctStep}, redirecting to appropriate page`);
            navigate(`/signup${stepPaths[correctStep]}`, { replace: true });
          }
        }
      }
      
      // Special handling for success page
      if (path === '/signup/success' && signupState.signupProgress > 1) {
        console.log("User on success page but has progressed further, redirecting");
        navigate(`/signup${stepPaths[signupState.signupProgress]}`, { replace: true });
      }
    } else if (!currentUser) {
      // User is not logged in
      // If trying to access a protected page, redirect to login
      if (path.startsWith('/signup/') || path === '/member-portal') {
        console.log("Unauthenticated user trying to access protected page, redirecting to login");
        navigate('/login', { state: { from: location }, replace: true });
      }
    }
  }, [currentUser, signupState, isLoading, authResolved, navigate, location]);

  // Reset navigation flag when location changes
  useEffect(() => {
    hasNavigatedRef.current = false;
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default AuthRedirector;