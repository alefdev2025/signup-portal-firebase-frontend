// File: pages/SignupPage.jsx - UPDATED FOR SINGLE PAGE SYSTEM WITH PAYMENT FIX
import React from 'react';
import { useSignupFlow } from '../contexts/SignupFlowContext';
import { useUser } from "../contexts/UserContext";

// Import step components
import AccountCreationStep from "./signup/AccountCreationStep";
import AccountSuccessStep from "./signup/AccountSuccessStep";
import ContactInfoStep from "./signup/ContactInfoStep";
import PackageStep from "./signup/PackageStep";
import FundingStep from "./signup/FundingStep";
import MembershipStep from "./signup/MembershipStep";
import DocuSignStep from "../components/signup/DocuSignStep";
import PaymentStep from "../components/signup/PaymentStep";

// Import shared components
import ResponsiveBanner from "./ResponsiveBanner";

// Component mapping
const STEP_COMPONENTS = {
  AccountCreationStep,
  AccountSuccessStep,
  ContactInfoStep,
  PackageStep,
  FundingStep,
  MembershipStep,
  DocuSignStep,
  PaymentStep
};

// Steps that need full width (no container constraints)
const FULL_WIDTH_STEPS = ['PaymentStep'];

export default function SignupPage() {
  const { isLoading } = useUser();
  const { 
    currentStep, 
    currentStepIndex, 
    steps, 
    isTransitioning,
    getStepProgress 
  } = useSignupFlow();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }

  // Get the component to render based on current step
  const StepComponent = STEP_COMPONENTS[currentStep.component];
  
  if (!StepComponent) {
    console.error(`Component not found: ${currentStep.component}`);
    return <div>Error: Step component not found</div>;
  }

  const progress = getStepProgress();
  const isFullWidthStep = FULL_WIDTH_STEPS.includes(currentStep.component);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Banner with progress bar */}
      <ResponsiveBanner 
        activeStep={currentStepIndex}
        steps={steps.filter((_, index) => index !== 1).map(step => step.label)}
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
      
      {/* Main content - Conditional container based on step type */}
      {isFullWidthStep ? (
        // Full width for steps like PaymentStep that handle their own layout
        <div className="flex-grow">
          <div 
            className={`transition-all duration-300 ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <StepComponent />
          </div>
        </div>
      ) : (
        // Constrained width for regular form steps
        <div className="flex-grow p-4 md:p-8 flex justify-center">
          <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
            <div 
              className={`transition-all duration-300 ${
                isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <StepComponent />
            </div>
          </div>
        </div>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded text-xs">
          Step {currentStepIndex} ({currentStep.id}) - Progress: {progress.completed}/{progress.total}
          {isFullWidthStep && <div>Full Width Mode</div>}
        </div>
      )}
    </div>
  );
}