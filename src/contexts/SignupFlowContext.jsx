// src/contexts/SignupFlowContext.jsx - SIMPLE WORKING VERSION
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
  
  // Simple tracking to prevent loops
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

  const getMaxAllowedStep = () => {
    if (!currentUser) return 0;
    if (signupState?.signupCompleted) return -1;
    
    const userProgress = signupState?.signupProgress || 0;
    const maxStep = Math.min(userProgress + 2, SIGNUP_STEPS.length - 1);
    
    return maxStep;
  };

  // Pure content navigation
  const navigateToStep = (stepIndex, options = {}) => {
    const { force = false, reason = 'user_action' } = options;
    
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
    
    log(`PURE CONTENT SWAP to step ${stepIndex}: ${SIGNUP_STEPS[stepIndex].id}`);
    setCurrentStepIndex(stepIndex);
    
    return true;
  };

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

  // Handle verification state change - SIMPLE VERSION THAT WORKS
  useEffect(() => {
    if (isLoading) return;
    
    // Reset verification handling if user changes
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
    
    // Handle just verified users ONCE with simple content swap
    if (signupState?.signupStep === 'success' && 
        signupState?.signupProgress === 1 && 
        !verificationHandled.current) {
      
      log('Detected verified user with success state - CONTENT SWAP to success step');
      verificationHandled.current = true;
      
      // Simple content swap
      setCurrentStepIndex(1);
      
      return;
    }
    
    // Handle completed signup
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
  // Don't throw error if context is not available - just return null
  // This allows components to use the hook conditionally
  return context;
};