// File: components/signup/SummaryStep.jsx
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";

// Import the MembershipSummary component
import MembershipSummary from "./MembershipSummary";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[SUMMARY STEP] ${message}`);
    console.log(`[SUMMARY STEP] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const SummaryStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  const { navigateToStep, goToNextStep } = useSignupFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add initialization tracker to prevent double initialization
  const initializedRef = useRef(false);
  
  // Check authentication and user progress only
  useEffect(() => {
    // Prevent double initialization which causes flickering
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const init = async () => {
      if (!currentUser) {
        LOG_TO_TERMINAL("No user authenticated, redirecting to account creation");
        navigateToStep(0, { force: true, reason: 'not_authenticated' });
        return;
      }
      
      try {
        LOG_TO_TERMINAL("Starting initialization - checking user progress");
        
        // Check user's progress via API
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          // Extract the step number from the step object
          let currentStep;
          if (typeof progressResult.step === 'number') {
            currentStep = progressResult.step;
          } else if (progressResult.step && typeof progressResult.step.step === 'number') {
            currentStep = progressResult.step.step;
          } else {
            LOG_TO_TERMINAL("Could not determine current step, defaulting to allowing access");
            currentStep = 6; // Default to current step
          }
          
          LOG_TO_TERMINAL(`User progress: step ${currentStep}`);
          
          // Summary is step 6, so check if user hasn't completed step 5 (membership)
          if (currentStep < 5) {
            LOG_TO_TERMINAL("User has not completed previous steps, redirecting to appropriate step");
            navigateToStep(currentStep, { force: true, reason: 'incomplete_previous_step' });
            return;
          }
          
          // If user has completed step 5 or more, they can access summary
          LOG_TO_TERMINAL("User can access summary step");
        } else {
          LOG_TO_TERMINAL(`Progress check failed: ${progressResult.error || 'Unknown error'}`);
          // Don't block access if progress check fails - just log and continue
        }

        LOG_TO_TERMINAL("Progress check complete - user can access summary step");
        
      } catch (error) {
        LOG_TO_TERMINAL(`Error checking user progress: ${error.message}`);
        console.error("Error checking user progress:", error);
        // Don't block access on error - just log and continue
      }
      
      // Always set loading to false after checks
      setLoading(false);
    };
    
    init();
  }, []); // No dependencies - run only once
  
  // Handle going back to previous step (membership)
  const handleBack = () => {
    LOG_TO_TERMINAL("SummaryStep: Back button clicked");
    navigateToStep(5, { reason: 'user_back_button' });
  };
  
  // Handle proceeding to next step (DocuSign)
  const handleSignAgreement = async () => {
    if (!currentUser) {
      LOG_TO_TERMINAL("No current user - cannot proceed");
      return false;
    }
    
    try {
      LOG_TO_TERMINAL("Proceeding from summary to DocuSign step");
      
      // Update progress to DocuSign step (step 7)
      const progressResult = await updateSignupProgressAPI("docusign", 7);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      LOG_TO_TERMINAL("Progress updated successfully, proceeding to DocuSign step");
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Use goToNextStep() to navigate to DocuSign step
      const navigationSuccess = goToNextStep();
      
      if (navigationSuccess) {
        LOG_TO_TERMINAL("Navigation to DocuSign step successful");
        return true;
      } else {
        LOG_TO_TERMINAL("Navigation failed");
        throw new Error("Failed to navigate to DocuSign step");
      }
    } catch (error) {
      LOG_TO_TERMINAL(`Error in handleSignAgreement: ${error.message}`);
      console.error("Error proceeding to DocuSign:", error);
      setError("Failed to proceed to agreement signing. Please try again.");
      return false;
    }
  };
  
  // Show loading spinner while checking progress
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
        <p className="ml-4 text-xl text-gray-700">Verifying your progress...</p>
      </div>
    );
  }
  
  // Show error state if there was a problem with progress check
  if (error) {
    return (
      <div className="flex justify-center pt-8 bg-gray-100 min-h-screen">
        <div className="text-center py-3 px-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#775684] text-white py-1.5 px-5 rounded-full hover:bg-[#664573] transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Render the membership summary with proper handlers
  return (
    <MembershipSummary
      onBack={handleBack}
      onSignAgreement={handleSignAgreement}
    />
  );
};

export default SummaryStep;