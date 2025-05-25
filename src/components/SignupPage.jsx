// File: pages/SignupPage.jsx - UPDATED FOR SINGLE PAGE SYSTEM
import React from 'react';
import { useSignupFlow } from '../contexts/SignupFlowContext';
import { useUser } from "../contexts/UserContext";

// Import step components (same as before)
import AccountCreationStep from "./signup/AccountCreationStep";
import AccountSuccessStep from "./signup/AccountSuccessStep";
import ContactInfoStep from "./signup/ContactInfoStep";
import PackageStep from "./signup/PackageStep";
import FundingStep from "./signup/FundingStep";
import MembershipStep from "./signup/MembershipStep";

// Import shared components
import ResponsiveBanner from "./ResponsiveBanner";

// Component mapping - maps step component names to actual components
const STEP_COMPONENTS = {
  AccountCreationStep,
  AccountSuccessStep,
  ContactInfoStep,
  PackageStep,
  FundingStep,
  MembershipStep
};

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Banner with progress bar - SAME AS BEFORE */}
      <ResponsiveBanner 
        activeStep={currentStepIndex} // Now uses currentStepIndex directly
        steps={steps.filter((_, index) => index !== 1).map(step => step.label)} // Skip "success" in visual steps
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
      
      {/* Main content - NOW RENDERS SINGLE COMPONENT INSTEAD OF ROUTES */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
          {/* Content container with smooth transition animation */}
          <div 
            className={`transition-all duration-300 ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Render the current step component */}
            <StepComponent />
          </div>
          
          {/* Debug info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-200 rounded text-sm">
              <strong>Debug:</strong> Step {currentStepIndex} ({currentStep.id}) - 
              Progress: {progress.completed}/{progress.total}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}