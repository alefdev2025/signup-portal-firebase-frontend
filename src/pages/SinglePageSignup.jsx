// File: pages/SinglePageSignup.jsx - Updated with MembershipCompletionStep
import React, { useMemo, useState } from 'react';
import { useSignupFlow } from '../contexts/SignupFlowContext';
import { useUser } from "../contexts/UserContext";

// Import step components
import AccountCreationStep from "../components/signup/AccountCreationStep";
import AccountSuccessStep from "../components/signup/AccountSuccessStep";
import ContactInfoStep from "../components/signup/ContactInfoStep";
import PackageStep from "../components/signup/PackageStep";
import FundingStep from "../components/signup/FundingStep";
import MembershipStep from "../components/signup/MembershipStep";
import MembershipCompletionSteps from "../components/signup/MembershipCompletionSteps"; // ADD THIS
import MembershipDocuSign from "../components/signup/MembershipDocuSign"; // ADD THIS
import DocuSignStep from "../components/signup/DocuSignStep";
import PaymentStep from "../components/signup/PaymentStep";
import CompletionStep from "../components/signup/CompletionStep"; // Add if you have a final welcome step

// Import banners
import ResponsiveBanner from "../components/ResponsiveBanner";
import SimpleBanner from "../components/SimpleBanner";

// Updated component mapping to include completion step
const STEP_COMPONENTS = {
  AccountCreationStep,
  AccountSuccessStep,
  ContactInfoStep,
  PackageStep,
  FundingStep,
  MembershipStep,
  MembershipCompletionStep: MembershipCompletionSteps, // ADD THIS MAPPING
  DocuSignStep,
  PaymentStep,
  CompletionStep // Add if you have this
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
  
  // State for DocuSign overlay
  const [showDocuSign, setShowDocuSign] = useState(false);

  // Memoize step component with better error handling
  const StepComponent = useMemo(() => {
    if (!currentStep || !currentStep.component) {
      console.error(`Invalid step configuration:`, currentStep);
      return () => (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-600">Step configuration is missing or invalid.</p>
          <p className="text-sm text-gray-500 mt-2">Current step index: {currentStepIndex}</p>
        </div>
      );
    }

    const Component = STEP_COMPONENTS[currentStep.component];
    
    if (!Component) {
      console.error(`Component not found: ${currentStep.component}`);
      return () => (
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">Component Not Found</h2>
          <p className="text-gray-600">The component "{currentStep.component}" could not be loaded.</p>
          <p className="text-sm text-gray-500 mt-2">Step: {currentStep.id} (index {currentStepIndex})</p>
        </div>
      );
    }
    
    return Component;
  }, [currentStep, currentStepIndex]);

  // Memoize banner steps - updated to include all steps
  const bannerSteps = useMemo(() => {
    // Show appropriate steps based on current position
    const allSteps = ["Account", "Contact Info", "Package", "Funding", "Membership", "Complete Membership", "Payment", "Welcome"];
    // Filter out steps after a certain point if needed
    return allSteps.slice(0, 7); // Show first 7 steps in banner
  }, []);

  console.log(`SinglePageSignup rendering - currentStepIndex: ${currentStepIndex}, currentStep: ${currentStep?.id || 'undefined'}`);

  // Get banner title for special steps
  const getSimpleBannerTitle = () => {
    if (currentStep?.id === 'docusign') {
      return "Membership Agreement";
    }
    if (currentStep?.id === 'payment') {
      return "Complete Your Payment";
    }
    if (currentStep?.id === 'completion') {
      return "Complete Your Membership";
    }
    return "Alcor Signup";
  };

  // Handle DocuSign overlay
  if (showDocuSign) {
    return (
      <MembershipDocuSign
        membershipData={{}} // Pass actual data from your state/context
        packageData={{}}
        contactData={{}}
        onBack={() => setShowDocuSign(false)}
        onComplete={() => {
          setShowDocuSign(false);
          // Reload to refresh completion status
          window.location.reload();
        }}
      />
    );
  }

  // Props to pass to MembershipCompletionStep
  const getStepProps = () => {
    if (currentStep?.component === 'MembershipCompletionStep') {
      return {
        onNavigateToDocuSign: () => setShowDocuSign(true)
      };
    }
    return {};
  };

  // Full-screen steps with SimpleBanner
  if (currentStep?.id === 'docusign' || currentStep?.id === 'payment' || currentStep?.id === 'completion') {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        {/* SimpleBanner - ALWAYS SHOWS IMMEDIATELY */}
        <SimpleBanner title={getSimpleBannerTitle()} />
        
        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {/* Show loading spinner if not ready */}
          {(isLoading || !authResolved) ? (
            <div className="min-h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            /* Render step component */
            <div 
              className={`w-full transition-all duration-300 ${
                isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <div key={`step-${currentStepIndex}`}>
                <StepComponent {...getStepProps()} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For all other steps, show responsive banner and normal layout
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Beautiful banner - ALWAYS SHOWS IMMEDIATELY */}
      <ResponsiveBanner 
        activeStep={currentStepIndex}
        steps={bannerSteps}
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
            
      {/* Main content area */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
          
          {/* Show loading spinner if not ready */}
          {(isLoading || !authResolved) ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            /* Content container with smooth transition */
            <div 
              className={`transition-all duration-300 ${
                isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              {/* Render current step component with key for clean transitions */}
              <div key={`step-${currentStepIndex}`}>
                <StepComponent {...getStepProps()} />
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}