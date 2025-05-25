// Progressive Navigation Support - Account Creation is One-Way
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';

const SignupFlowContext = createContext(null);

const SIGNUP_STEPS = [
  { id: 'account', label: 'Account', component: 'AccountCreationStep' },
  { id: 'success', label: 'Success', component: 'AccountSuccessStep' },
  { id: 'contact', label: 'Contact Info', component: 'ContactInfoStep' },
  { id: 'package', label: 'Package', component: 'PackageStep' },
  { id: 'funding', label: 'Funding', component: 'FundingStep' },
  { id: 'membership', label: 'Membership', component: 'MembershipStep' }
];

export const SignupFlowProvider = ({ children }) => {
  const { currentUser, signupState, isLoading } = useUser();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track navigation state
  const stepHistory = useRef([0]); // Start with account creation
  const navigationEnabled = useRef(false); // Enable after account creation
  const verificationHandled = useRef(false);
  const lastProcessedUser = useRef(null);
  
  const log = (message) => {
    console.log(`[SIGNUP FLOW] ${message}`);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/log?t=${Date.now()}`, false);
      xhr.send(`[SIGNUP FLOW] ${message}`);
    } catch (e) {
      // Ignore errors
    }
  };

  // URL paths for deep linking (only after account creation)
  const stepPaths = ['', '/success', '/contact', '/package', '/funding', '/membership'];

  const getMaxAllowedStep = () => {
    if (!currentUser) return 0;
    if (signupState?.signupCompleted) return -1;
    
    const userProgress = signupState?.signupProgress || 0;
    const maxStep = Math.min(userProgress + 2, SIGNUP_STEPS.length - 1);
    
    return maxStep;
  };

  // Enable navigation after account creation is complete
  const enableNavigation = () => {
    if (!navigationEnabled.current) {
      navigationEnabled.current = true;
      log('Navigation enabled - user can now use back/forward buttons');
      
      // Set initial history state for the welcome page → signup transition
      window.history.replaceState(
        { type: 'signup_entry', fromWelcome: true },
        '',
        '/signup'
      );
    }
  };

  // Update browser history with URL for deep linking
  const updateBrowserHistory = (stepIndex) => {
    if (!navigationEnabled.current || stepIndex === 0) {
      // Don't update URLs for account creation step
      return;
    }
    
    const path = `/signup${stepPaths[stepIndex]}`;
    
    window.history.pushState(
      { 
        stepIndex, 
        type: 'signup_step',
        canGoBack: true
      }, 
      '', 
      path
    );
    
    log(`Updated URL to: ${path}`);
  };

  const navigateToStep = (stepIndex, options = {}) => {
    const { force = false, reason = 'user_action', trackHistory = true } = options;
    
    log(`Navigation request: step ${stepIndex}, force: ${force}, reason: ${reason}`);
    
    if (localStorage.getItem('block_navigation') === 'true' && !force) {
      log('Navigation blocked by block_navigation flag');
      return false;
    }
    
    if (stepIndex < 0 || stepIndex >= SIGNUP_STEPS.length) {
      log(`Invalid step index: ${stepIndex}`);
      return false;
    }
    
    const maxAllowed = getMaxAllowedStep();
    
    if (maxAllowed === -1) {
      log('Signup completed - should redirect to member portal');
      window.location.href = '/member-portal';
      return false;
    }
    
    if (!force && stepIndex > maxAllowed) {
      log(`Access denied to step ${stepIndex}, max allowed: ${maxAllowed}`);
      return false;
    }
    
    log(`CONTENT SWAP to step ${stepIndex}: ${SIGNUP_STEPS[stepIndex].id}`);
    
    // Update current step
    setCurrentStepIndex(stepIndex);
    
    // Enable navigation once they move past account creation
    if (stepIndex >= 1) {
      enableNavigation();
    }
    
    // Track in history and update URL (only if navigation is enabled)
    if (trackHistory && reason !== 'browser_back') {
      stepHistory.current.push(stepIndex);
      updateBrowserHistory(stepIndex);
    }
    
    return true;
  };

  // Handle browser back/forward button
  useEffect(() => {
    const handleBrowserNavigation = (event) => {
      log(`Browser navigation detected. Navigation enabled: ${navigationEnabled.current}`);
      
      // If navigation isn't enabled yet (still on account creation)
      if (!navigationEnabled.current) {
        log('Navigation not enabled - going back to welcome page');
        // Go back to welcome page
        window.location.href = '/';
        return;
      }
      
      // Check if this is our signup navigation or going back to welcome
      if (event.state) {
        if (event.state.type === 'signup_entry' && event.state.fromWelcome) {
          log('Back to welcome page from signup');
          window.location.href = '/';
          return;
        }
        
        if (event.state.type === 'signup_step') {
          log(`Browser navigation to step: ${event.state.stepIndex}`);
          
          // Navigate to the step without adding to history
          navigateToStep(event.state.stepIndex, { 
            reason: 'browser_back', 
            trackHistory: false,
            force: true 
          });
          return;
        }
      }
      
      // Fallback: parse from URL
      const path = window.location.pathname.replace('/signup', '');
      const targetStep = Math.max(1, stepPaths.indexOf(path)); // Never go to step 0 from URL
      
      if (targetStep > 0) {
        log(`Parsed step from URL: ${targetStep}`);
        navigateToStep(targetStep, { 
          reason: 'browser_navigation', 
          trackHistory: false,
          force: true 
        });
      }
    };
    
    window.addEventListener('popstate', handleBrowserNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleBrowserNavigation);
    };
  }, []);

  const transitionToStep = async (stepIndex, options = {}) => {
    if (localStorage.getItem('block_navigation') === 'true' && !options.force) {
      log('Transition blocked by block_navigation flag');
      return false;
    }
    
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const success = navigateToStep(stepIndex, options);
    setIsTransitioning(false);
    return success;
  };

  // Handle verification state change
  useEffect(() => {
    if (isLoading) return;
    
    if (lastProcessedUser.current !== currentUser?.uid) {
      verificationHandled.current = false;
      lastProcessedUser.current = currentUser?.uid;
      log(`User changed to ${currentUser?.uid || 'null'}, reset verification handling`);
    }
    
    log(`User state changed - User: ${currentUser?.uid || 'null'}, Progress: ${signupState?.signupProgress || 0}`);
    
    if (localStorage.getItem('block_navigation') === 'true') {
      log('Navigation blocked - skipping all automatic navigation');
      return;
    }
    
    if (!currentUser) {
      log('No user - staying on current step');
      return;
    }
    
    // Handle just verified users
    if (signupState?.signupStep === 'success' && 
        signupState?.signupProgress === 1 && 
        !verificationHandled.current) {
      
      log('Detected verified user with success state - CONTENT SWAP to success step');
      verificationHandled.current = true;
      
      // This will enable navigation and add to history
      navigateToStep(1, { reason: 'just_verified' });
      return;
    }
    
    if (signupState?.signupCompleted) {
      log('Signup completed - redirecting to member portal');
      window.location.href = '/member-portal';
      return;
    }
    
  }, [currentUser, signupState, isLoading]);

  const value = {
    currentStepIndex,
    currentStep: SIGNUP_STEPS[currentStepIndex],
    steps: SIGNUP_STEPS,
    isTransitioning,
    maxAllowedStep: getMaxAllowedStep(),
    
    navigateToStep: transitionToStep,
    setCurrentStepIndex: (stepIndex, updateUrl = false) => {
      log(`Direct step index set to ${stepIndex}`);
      setCurrentStepIndex(stepIndex);
    },
    goToNextStep: () => {
      const nextStep = currentStepIndex + 1;
      if (nextStep < SIGNUP_STEPS.length) {
        return transitionToStep(nextStep);
      }
      return false;
    },
    goToPrevStep: () => {
      const prevStep = currentStepIndex - 1;
      if (prevStep >= 0) {
        return transitionToStep(prevStep);
      }
      return false;
    },
    goToStep: (stepId) => {
      const index = SIGNUP_STEPS.findIndex(step => step.id === stepId);
      if (index !== -1) return transitionToStep(index);
      return false;
    },
    
    // Navigation state
    canGoBack: () => navigationEnabled.current && stepHistory.current.length > 1,
    isNavigationEnabled: () => navigationEnabled.current,
    
    canAccessStep: (stepIndex) => stepIndex <= getMaxAllowedStep(),
    isStepCompleted: (stepIndex) => stepIndex < (signupState?.signupProgress || 0),
    getStepProgress: () => ({
      current: currentStepIndex,
      completed: signupState?.signupProgress || 0,
      total: SIGNUP_STEPS.length
    })
  };

  return (
    <SignupFlowContext.Provider value={value}>
      {children}
    </SignupFlowContext.Provider>
  );
};

export const useSignupFlow = () => {
  const context = useContext(SignupFlowContext);
  return context;
};