// Simple SignupFlowContext - Set initial step based on backend progress
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';

const SignupFlowContext = createContext(null);

const SIGNUP_STEPS = [
  { id: 'account', label: 'Account', component: 'AccountCreationStep' },
  { id: 'success', label: 'Success', component: 'AccountSuccessStep' },
  { id: 'contact', label: 'Contact Info', component: 'ContactInfoStep' },
  { id: 'package', label: 'Package', component: 'PackageStep' },
  { id: 'funding', label: 'Funding', component: 'FundingStep' },
  { id: 'membership', label: 'Membership', component: 'MembershipStep' },
  { id: 'completion', label: 'Complete Membership', component: 'MembershipCompletionStep' }, // NEW STEP
  { id: 'payment', label: 'Payment', component: 'PaymentStep' },
  { id: 'welcome', label: 'Complete', component: 'CompletionStep' }
];

/*const SIGNUP_STEPS = [
   { id: 'account', label: 'Account', component: 'AccountCreationStep' },
   { id: 'success', label: 'Success', component: 'AccountSuccessStep' },
   { id: 'contact', label: 'Contact Info', component: 'ContactInfoStep' },
   { id: 'package', label: 'Package', component: 'PackageStep' },
   { id: 'funding', label: 'Funding', component: 'FundingStep' },
   { id: 'membership', label: 'Membership', component: 'MembershipStep' },
   { id: 'docusign', label: 'DocuSign', component: 'DocuSignStep' },
   { id: 'payment', label: 'Payment', component: 'PaymentStep' },        // FIXED: consistent format
   { id: 'completion', label: 'Complete', component: 'CompletionStep' }   // FIXED: consistent format
 ];*/

export const SignupFlowProvider = ({ children }) => {
 const { currentUser, signupState, isLoading } = useUser();
 const [currentStepIndex, setCurrentStepIndex] = useState(0);
 const [isTransitioning, setIsTransitioning] = useState(false);
 const [initialStepSet, setInitialStepSet] = useState(false);
 
 // Track navigation state
 const stepHistory = useRef([0]);
 const navigationEnabled = useRef(false);
 const verificationHandled = useRef(false);
 const lastProcessedUser = useRef(null);
 
 const log = (message) => {
   console.log(`[SIGNUP FLOW] ${message}`);
 };

 // Set initial step based on backend progress
 useEffect(() => {
   if (initialStepSet || isLoading || !currentUser || !signupState) return;
   
   const progress = signupState.signupProgress || 0;
   const step = signupState.signupStep || 'account';
   
   log(`Setting initial step based on backend - Progress: ${progress}, Step: ${step}`);
   
   let targetStep = 0;
   
   // Determine target step based on backend data
   if (step === 'success' && progress === 1) {
     targetStep = 1; // Success step
     log('User needs to see success/verification step');
   } else if (progress >= 2) {
     // User has completed verification, go to their progress step
     targetStep = Math.min(progress, SIGNUP_STEPS.length - 1);
     enableNavigation(); // Enable navigation for verified users
     log(`User verified, going to step ${targetStep}`);
   } else if (progress === 0) {
     targetStep = 0; // Account creation
     log('User at account creation step');
   }
   
   setCurrentStepIndex(targetStep);
   stepHistory.current = [targetStep];
   setInitialStepSet(true);
   
   log(`Initial step set to: ${targetStep} (${SIGNUP_STEPS[targetStep].id})`);
 }, [currentUser, signupState, isLoading, initialStepSet]);

 const getMaxAllowedStep = () => {
   if (!currentUser) return 0;
   if (signupState?.signupCompleted) return -1;
   
   const userProgress = signupState?.signupProgress || 0;
   return Math.min(userProgress + 2, SIGNUP_STEPS.length - 1);
 };

 const enableNavigation = () => {
   if (!navigationEnabled.current) {
     navigationEnabled.current = true;
     log('Navigation enabled');
     
     window.history.replaceState(
       { type: 'signup_entry', fromWelcome: true },
       '',
       '/signup'
     );
   }
 };

 const navigateToStep = (stepIndex, options = {}) => {
   const { force = false, reason = 'user_action', trackHistory = true } = options;
   
   log(`Navigation request: step ${stepIndex}, reason: ${reason}`);
   
   if (stepIndex < 0 || stepIndex >= SIGNUP_STEPS.length) {
     log(`Invalid step index: ${stepIndex}`);
     return false;
   }
   
   const maxAllowed = getMaxAllowedStep();
   
   if (maxAllowed === -1) {
     log('Signup completed - redirecting to login page');
     window.location.href = '/login';
     return false;
   }
   
   if (!force && stepIndex > maxAllowed) {
     log(`Access denied to step ${stepIndex}, max allowed: ${maxAllowed}`);
     return false;
   }
   
   log(`Setting step to ${stepIndex}: ${SIGNUP_STEPS[stepIndex].id}`);
   setCurrentStepIndex(stepIndex);
   
   // Enable navigation once they move past account creation
   if (stepIndex >= 1) {
     enableNavigation();
   }
   
   // Track in history
   if (trackHistory && reason !== 'browser_back') {
     stepHistory.current.push(stepIndex);
     
     if (navigationEnabled.current) {
       window.history.pushState(
         { stepIndex, type: 'signup_step', canGoBack: true }, 
         '', 
         '/signup'
       );
     }
   }
   
   return true;
 };

 // Handle browser back/forward
 useEffect(() => {
   const handleBrowserNavigation = (event) => {
     if (!navigationEnabled.current) {
       log('Navigation not enabled - going back to welcome');
       window.location.href = '/';
       return;
     }
     
     if (event.state?.type === 'signup_entry' && event.state.fromWelcome) {
       log('Back to welcome page');
       window.location.href = '/';
       return;
     }
     
     if (event.state?.type === 'signup_step') {
       log(`Browser navigation to step: ${event.state.stepIndex}`);
       navigateToStep(event.state.stepIndex, { 
         reason: 'browser_back', 
         trackHistory: false,
         force: true 
       });
       return;
     }
     
     log('No state found - going back to welcome');
     window.location.href = '/';
   };
   
   window.addEventListener('popstate', handleBrowserNavigation);
   return () => window.removeEventListener('popstate', handleBrowserNavigation);
 }, []);

 const transitionToStep = async (stepIndex, options = {}) => {
   setIsTransitioning(true);
   await new Promise(resolve => setTimeout(resolve, 150));
   
   const success = navigateToStep(stepIndex, options);
   setIsTransitioning(false);
   return success;
 };

 // Handle completed signup
 useEffect(() => {
   if (isLoading || !currentUser || !signupState) return;
   
   if (signupState.signupCompleted) {
     log('Signup completed - redirecting to login page');
     window.location.href = '/login';
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
   setCurrentStepIndex,
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