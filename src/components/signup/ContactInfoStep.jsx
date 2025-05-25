// File: components/signup/ContactInfoStep.jsx - Updated for SignupFlow System
import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { getStepFormData, saveFormData } from "../../services/storage";

import ContactInfoPage from "./ContactInfoPage";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[CONTACT STEP] ${message}`);
    console.log(`[CONTACT STEP] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const ContactInfoStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  const { navigateToStep, goToNextStep, currentStepIndex, canAccessStep } = useSignupFlow();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  
  // Check authentication and load saved form data
  useEffect(() => {
    const init = async () => {
      if (!currentUser) {
        LOG_TO_TERMINAL("No user authenticated, redirecting to account creation");
        // Navigate back to account creation step
        navigateToStep(0, { force: true, reason: 'not_authenticated' });
        return;
      }
      
      try {
        // Load any saved form data for this step from local storage
        const savedData = getStepFormData("contact_info");
        if (savedData) {
          LOG_TO_TERMINAL("Loading saved form data");
          setFormData(savedData);
        }
        
        // Check user's progress via API
        LOG_TO_TERMINAL("Checking user progress via API");
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          LOG_TO_TERMINAL(`User progress: step ${progressResult.step}`);
          
          // Contact info is step 2, so check if user hasn't completed step 1 (success page)
          if (progressResult.step < 2) {
            LOG_TO_TERMINAL("User has not completed previous step, redirecting to success");
            navigateToStep(1, { force: true, reason: 'incomplete_previous_step' });
            return;
          }
          
          // If user has already completed this step and moved further, allow them to be here
          // but load their existing data
          if (progressResult.step > 2) {
            LOG_TO_TERMINAL("User has already completed this step, loading existing data");
          }
        } else {
          console.error("Error getting user progress:", progressResult.error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing contact info step:", error);
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigateToStep]);
  
  // Handle going back to previous step
  const handleBack = () => {
    LOG_TO_TERMINAL("ContactInfoStep: Back button clicked");
    
    // Use SignupFlow navigation system
    navigateToStep(1, { reason: 'user_back_button' }); // Go back to success step
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) {
      LOG_TO_TERMINAL("No current user - cannot proceed");
      return false;
    }
    
    try {
      LOG_TO_TERMINAL("Saving contact info and proceeding to next step");
      
      // Save form data locally
      saveFormData("contact_info", stepData);
      LOG_TO_TERMINAL("Form data saved locally");
      
      // Update progress via API
      LOG_TO_TERMINAL("Updating progress via API...");
      const progressResult = await updateSignupProgressAPI("package", 3);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      LOG_TO_TERMINAL("Progress updated successfully, proceeding to next step");
      
      // Use goToNextStep() like the account creation does
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
      console.error("Error saving contact info:", error);
      return false;
    }
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
        <p className="ml-4 text-xl text-gray-700">Loading your information...</p>
      </div>
    );
  }
  
  // Render the contact info form with proper handlers
  return (
    <ContactInfoPage
      initialData={formData}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
};

export default ContactInfoStep;