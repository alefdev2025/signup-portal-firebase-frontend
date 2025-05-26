// File: pages/signup/FundingStep.jsx
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { getStepFormData, saveFormData } from "../../services/storage";

// Import your existing FundingPage component
import FundingPage from "./FundingPage";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[FUNDING STEP] ${message}`);
    console.log(`[FUNDING STEP] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const FundingStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  const { navigateToStep, goToNextStep, currentStepIndex, canAccessStep } = useSignupFlow();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fundingMethod: "insurance", // Default to insurance
  });
  // Add initialization tracker to prevent double initialization
  const initializedRef = useRef(false);
  
  // Check authentication, load saved form data
  useEffect(() => {
    // Prevent double initialization which causes flickering
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const init = async () => {
      if (!currentUser) {
        LOG_TO_TERMINAL("No user authenticated, redirecting to account creation");
        // Navigate back to account creation step
        navigateToStep(0, { force: true, reason: 'not_authenticated' });
        return;
      }
      
      try {
        LOG_TO_TERMINAL("Starting initialization");
        
        // Load any saved form data for this step from local storage
        const savedData = getStepFormData("funding");
        if (savedData) {
          LOG_TO_TERMINAL("Loading saved form data");
          setFormData(savedData);
        }
        
        // Check user's progress via API
        LOG_TO_TERMINAL("Checking user progress via API");
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          LOG_TO_TERMINAL(`User progress: step ${progressResult.step}`);
          
          // Funding is step 4, so check if user hasn't completed step 3 (package)
          if (progressResult.step < 4) {
            LOG_TO_TERMINAL("User has not completed previous step, redirecting to package");
            navigateToStep(3, { force: true, reason: 'incomplete_previous_step' });
            return;
          }
          
          // If user has already completed this step and moved further, allow them to be here
          // but load their existing data
          if (progressResult.step > 4) {
            LOG_TO_TERMINAL("User has already completed this step, loading existing data");
          }
        } else {
          console.error("Error getting user progress:", progressResult.error);
        }
        
        LOG_TO_TERMINAL("Initialization complete");
      } catch (error) {
        console.error("Error initializing funding step:", error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup function to prevent memory leaks
    return () => {
      LOG_TO_TERMINAL("Unmounting component");
    };
  }, [currentUser, navigateToStep]);
  
  // Handle going back to previous step
  const handleBack = () => {
    LOG_TO_TERMINAL("FundingStep: Back button clicked");
    
    // Use SignupFlow navigation system
    navigateToStep(3, { reason: 'user_back_button' }); // Go back to package step
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) {
      LOG_TO_TERMINAL("No current user - cannot proceed");
      return false;
    }
    
    try {
      LOG_TO_TERMINAL("Saving funding info and proceeding to next step");
      
      // Convert the option names to match the database format
      let fundingMethod;
      switch(stepData.fundingMethod) {
        case 'insurance':
          fundingMethod = 'insurance';
          break;
        case 'prepay':
          fundingMethod = 'self_funded';
          break;
        case 'later':
          fundingMethod = 'other';
          break;
        default:
          fundingMethod = stepData.fundingMethod;
      }
      
      const processedData = {
        ...stepData,
        fundingMethod: fundingMethod
      };
      
      // Save form data locally
      saveFormData("funding", processedData);
      LOG_TO_TERMINAL("Form data saved locally");
      
      // Update progress via API
      LOG_TO_TERMINAL("Updating progress via API...");
      const progressResult = await updateSignupProgressAPI("membership", 5);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      LOG_TO_TERMINAL("Progress updated successfully, proceeding to next step");
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Use goToNextStep() like the other steps do
      const navigationSuccess = goToNextStep();
      
      if (navigationSuccess) {
        LOG_TO_TERMINAL("Navigation to next step successful");
        return true;
      } else {
        LOG_TO_TERMINAL("Navigation failed");
        return false;
      }
    } catch (error) {
      LOG_TO_TERMINAL(`Error in handleNext: ${error.message}`);
      console.error("Error saving funding info:", error);
      return false;
    }
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
        <p className="ml-4 text-xl text-gray-700">Loading funding information...</p>
      </div>
    );
  }
  
  LOG_TO_TERMINAL("Rendering FundingPage component");
  
  // Use the FundingPage component with proper handlers
  return (
    <FundingPage
      initialData={formData}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
};

export default FundingStep;