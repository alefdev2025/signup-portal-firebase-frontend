// File: pages/SinglePageSignup.jsx - Updated with MembershipCompletionStep and Payment Overlay
import React, { useMemo, useState, useEffect } from 'react';
import { useSignupFlow } from '../contexts/SignupFlowContext';
import { useUser } from "../contexts/UserContext";
import { DelayedCenteredLoader } from '../components/DotLoader';

// Import step components
import AccountCreationStep from "../components/signup/AccountCreationStep";
import AccountSuccessStep from "../components/signup/AccountSuccessStep";
import ContactInfoStep from "../components/signup/ContactInfoStep";
import PackageStep from "../components/signup/PackageStep";
import FundingStep from "../components/signup/FundingStep";
import MembershipStep from "../components/signup/MembershipStep";
import MembershipCompletionSteps from "../components/signup/MembershipCompletionSteps";
import MembershipDocuSign from "../components/signup/MembershipDocuSign";
import MembershipPayment from "../components/signup/MembershipPayment";
import DocuSignStep from "../components/signup/DocuSignStep";
import PaymentStep from "../components/signup/PaymentStep";
import CompletionStep from "../components/signup/CompletionStep";

// Import banners
import ResponsiveBanner from "../components/ResponsiveBanner";
import SimpleBanner from "../components/SimpleBanner";

// Component mapping
const STEP_COMPONENTS = {
  AccountCreationStep,
  AccountSuccessStep,
  ContactInfoStep,
  PackageStep,
  FundingStep,
  MembershipStep,
  MembershipCompletionStep: MembershipCompletionSteps,
  DocuSignStep,
  PaymentStep,
  CompletionStep
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
  const [docuSignState, setDocuSignState] = useState({ show: false, documentType: null });
  
  // State for Payment overlay
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

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

  // Memoize banner steps
  const bannerSteps = useMemo(() => {
    const allSteps = ["Account", "Contact Info", "Package", "Funding", "Membership", "Complete Membership"];
    return allSteps.slice(0, 5); // Show first 7 steps in banner
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
  if (docuSignState.show) {
    return (
      <MembershipDocuSign
        membershipData={{}}
        packageData={{}}
        contactData={{ uid: docuSignState.userId }}  // THIS needs the userId
        documentType={docuSignState.documentType}
        onBack={() => setDocuSignState({ show: false, documentType: null })}
        onComplete={() => {
          setDocuSignState({ show: false, documentType: null });
          window.location.reload();
        }}
      />
    );
  }

  // Handle Payment overlay
  if (showPayment) {
    return (
      <MembershipPayment
        membershipData={{}}
        packageData={{}}
        contactData={{}}
        completionData={paymentData}
        onBack={() => {
          setShowPayment(false);
          // Reload to refresh completion status
          window.location.reload();
        }}
        onComplete={() => {
          setShowPayment(false);
          // Reload to refresh completion status
          window.location.reload();
        }}
      />
    );
  }

  // Props to pass to MembershipCompletionStep
// Props to pass to MembershipCompletionStep
const getStepProps = () => {
  if (currentStep?.component === 'MembershipCompletionStep') {
    return {
      onComplete: () => {
        console.log('All membership steps completed - redirecting to welcome page');
        window.location.href = '/portal-home';
      },
      onNavigateToDocuSign: (documentType, userId) => {
        console.log('SinglePageSignup received userId:', userId);
        setDocuSignState({ 
          show: true, 
          documentType: documentType,
          userId: userId
        });
      },
      onNavigateToPayment: (completionData) => {
        console.log('SinglePageSignup: Opening Payment with data:', completionData);
        // Show payment overlay without changing step
        setShowPayment(true);
        setPaymentData(completionData);
      }
    };
  }
  return {};
};

const isCompletionStep = currentStepIndex === 6;

  // Full-screen steps with SimpleBanner
  if (isCompletionStep ||  // <-- ADD THIS FIRST
      currentStep?.id === 'docusign' || 
      currentStep?.id === 'payment' || 
      currentStep?.id === 'completion' ||
      currentStep?.component === 'MembershipCompletionStep') {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        {/* SimpleBanner - ALWAYS SHOWS IMMEDIATELY */}
        <SimpleBanner title={getSimpleBannerTitle()} />
        
        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {/* Show loading spinner if not ready */}
          {(isLoading || !authResolved) ? (
              <DelayedCenteredLoader 
                message="Loading..." 
                size="md" 
                color="primary" 
                minHeight="384px"
                delay={5000}
              />
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
              <DelayedCenteredLoader 
                message="Loading..." 
                size="md" 
                color="primary" 
                minHeight="384px"
                delay={5000}
              />
            ) : (
            /* Content container with smooth transition */
              <div 
                className={`transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-50' : 'opacity-100'
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