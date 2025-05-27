// File: pages/SinglePageSignup.jsx - STABLE VERSION
import React, { useMemo } from 'react';
import { useSignupFlow } from '../contexts/SignupFlowContext';
import { useUser } from "../contexts/UserContext";

// Import step components
import AccountCreationStep from "../components/signup/AccountCreationStep";
//import ResponsiveBanner from "../components/ResponsiveBanner";
import AccountSuccessStep from "../components/signup/AccountSuccessStep";
import ContactInfoStep from "../components/signup/ContactInfoStep";
import PackageStep from "../components/signup/PackageStep";
import FundingStep from "../components/signup/FundingStep";
import MembershipStep from "../components/signup/MembershipStep";
import DocuSignStep from "../components/signup/DocuSignStep";

// Import the beautiful banner
import ResponsiveBanner from "../components/ResponsiveBanner";

// STABLE component mapping
const STEP_COMPONENTS = {
  AccountCreationStep,
  AccountSuccessStep,
  ContactInfoStep,
  PackageStep,
  FundingStep,
  MembershipStep,
  DocuSignStep
};

export default function SinglePageSignup() {
  const { isLoading, authResolved } = useUser();
  const { 
    currentStep, 
    currentStepIndex, 
    steps, 
    isTransitioning,
    getStepProgress 
  } = useSignupFlow();

  // STABLE: Memoize step component
  const StepComponent = useMemo(() => {
    const Component = STEP_COMPONENTS[currentStep.component];
    
    if (!Component) {
      console.error(`Component not found: ${currentStep.component}`);
      return () => <div>Error: Step component not found</div>;
    }
    
    return Component;
  }, [currentStep.component]);

  // STABLE: Memoize progress and banner steps
  const progress = useMemo(() => getStepProgress(), [getStepProgress]);
  const bannerSteps = useMemo(() => 
    steps.filter((_, index) => index !== 1).map(step => step.label), 
    [steps]
  );

  console.log(`SinglePageSignup rendering - currentStepIndex: ${currentStepIndex}, currentStep: ${currentStep.id}`);

  // Show loading state
  if (isLoading || !authResolved) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Special handling for DocuSign step - render without banner and container
  if (currentStep.id === 'docusign') {
    return <StepComponent />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Beautiful banner with progress bar and navigation */}
      <ResponsiveBanner 
        activeStep={currentStepIndex}
        steps={bannerSteps}
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
      
      {/* Main content with pure content swapping */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
          {/* Content container with smooth transition */}
          <div 
            className={`transition-all duration-300 ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Render current step component with key for clean transitions */}
            <div key={`step-${currentStepIndex}`}>
              <StepComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}