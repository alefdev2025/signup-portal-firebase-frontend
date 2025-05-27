// File: pages/signup/DocuSignStep.jsx
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { getStepFormData, saveFormData } from "../../services/storage";
import membershipService from "../../services/membership";

// Import the DocuSignPage component
import DocuSignPage from "./DocuSignPage";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[DOCUSIGN STEP] ${message}`);
    console.log(`[DOCUSIGN STEP] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const DocuSignStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  const { navigateToStep, goToNextStep, currentStepIndex, canAccessStep } = useSignupFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allUserData, setAllUserData] = useState(null);
  // Add initialization tracker to prevent double initialization
  const initializedRef = useRef(false);
  
  // Check authentication and load all user data for DocuSign
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
        LOG_TO_TERMINAL("Starting DocuSign step initialization");
        
        // Check user's progress via API
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          LOG_TO_TERMINAL(`User progress: step ${progressResult.step}`);
          
          // DocuSign is step 6, so check if user hasn't completed step 5 (membership)
          if (progressResult.step < 6) {
            LOG_TO_TERMINAL("User has not completed membership step, redirecting");
            navigateToStep(5, { force: true, reason: 'incomplete_previous_step' });
            return;
          }
          
          // If user has already completed this step and moved further, allow them to be here
          // but load their existing data
          if (progressResult.step > 6) {
            LOG_TO_TERMINAL("User has already completed DocuSign step, loading existing data");
          }
        } else {
          console.error("Error getting user progress:", progressResult.error);
          setError("Could not verify your progress. Please try again.");
        }

        // Gather all user data for DocuSign process
        LOG_TO_TERMINAL("Gathering all user data for DocuSign");
        
        const userData = {
          user: currentUser,
          contactData: null,
          membershipData: null,
          packageData: null,
          fundingData: null,
          pricingData: null
        };

        // Load all the data we need for DocuSign
        try {
          // Get contact information
          const { getContactInfo } = await import("../../services/contact");
          const contactResult = await getContactInfo();
          if (contactResult.success && contactResult.contactInfo) {
            userData.contactData = contactResult.contactInfo;
            LOG_TO_TERMINAL("Contact data loaded");
          }
        } catch (err) {
          LOG_TO_TERMINAL(`Error loading contact data: ${err.message}`);
        }

        try {
          // Get membership information
          const membershipResult = await membershipService.getMembershipInfo();
          if (membershipResult.success && membershipResult.data) {
            userData.membershipData = membershipResult.data.membershipInfo;
            LOG_TO_TERMINAL("Membership data loaded");
          }
        } catch (err) {
          LOG_TO_TERMINAL(`Error loading membership data: ${err.message}`);
        }

        try {
          // Get package information
          const fundingService = await import("../../services/funding");
          const packageResult = await fundingService.default.getPackageInfoForFunding();
          if (packageResult.success) {
            userData.packageData = {
              packageType: packageResult.packageType,
              preservationType: packageResult.preservationType,
              preservationEstimate: packageResult.preservationEstimate,
              annualCost: packageResult.annualCost
            };
            LOG_TO_TERMINAL("Package data loaded");
          }
        } catch (err) {
          LOG_TO_TERMINAL(`Error loading package data: ${err.message}`);
        }

        try {
          // Get funding information
          const fundingService = await import("../../services/funding");
          const fundingResult = await fundingService.default.getUserFundingInfo();
          if (fundingResult.success && fundingResult.data) {
            userData.fundingData = fundingResult.data;
            LOG_TO_TERMINAL("Funding data loaded");
          }
        } catch (err) {
          LOG_TO_TERMINAL(`Error loading funding data: ${err.message}`);
        }

        try {
          // Get pricing information
          const { getMembershipCost } = await import("../../services/pricing");
          const pricingResult = await getMembershipCost();
          if (pricingResult?.success) {
            userData.pricingData = {
              age: pricingResult.age,
              annualDues: pricingResult.annualDues,
              membershipCost: pricingResult.membershipCost || 540
            };
            LOG_TO_TERMINAL("Pricing data loaded");
          }
        } catch (err) {
          LOG_TO_TERMINAL(`Error loading pricing data: ${err.message}`);
        }

        setAllUserData(userData);
        LOG_TO_TERMINAL("All user data gathered successfully");
        
      } catch (error) {
        console.error("Error initializing DocuSign step:", error);
        setError("An error occurred while loading your information. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup function to prevent memory leaks
    return () => {
      LOG_TO_TERMINAL("Unmounting DocuSign step component");
    };
  }, [currentUser, navigateToStep]);
  
  // Handle going back to previous step (membership summary)
  const handleBack = () => {
    LOG_TO_TERMINAL("DocuSignStep: Back button clicked");
    
    // Use SignupFlow navigation system to go back to membership step
    navigateToStep(5, { reason: 'user_back_button' });
  };
  
  // Handle DocuSign completion and proceeding to next step
  const handleComplete = async () => {
    if (!currentUser) {
      LOG_TO_TERMINAL("No current user - cannot proceed");
      return false;
    }
    
    try {
      LOG_TO_TERMINAL("DocuSign completed, updating progress and proceeding");
      
      // Save completion data locally
      const completionData = {
        docuSignCompleted: true,
        completionDate: new Date().toISOString()
      };
      saveFormData("docusign", completionData);
      LOG_TO_TERMINAL("DocuSign completion data saved locally");
      
      // Update progress via API to mark DocuSign as complete
      LOG_TO_TERMINAL("Updating progress via API...");
      const progressResult = await updateSignupProgressAPI("completed", 7);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      LOG_TO_TERMINAL("Progress updated successfully, proceeding to completion");
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Use goToNextStep() to proceed (or redirect to member portal if this is the final step)
      const navigationSuccess = goToNextStep();
      
      if (navigationSuccess) {
        LOG_TO_TERMINAL("Navigation to next step successful");
        return true;
      } else {
        // If no next step, redirect to member portal
        LOG_TO_TERMINAL("No next step, redirecting to member portal");
        window.location.href = '/member-portal';
        return true;
      }
    } catch (error) {
      LOG_TO_TERMINAL(`Error in handleComplete: ${error.message}`);
      console.error("Error completing DocuSign process:", error);
      return false;
    }
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
        <p className="ml-4 text-xl text-gray-700">Loading signing interface...</p>
      </div>
    );
  }
  
  // Show error state if there was a problem
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
  
  LOG_TO_TERMINAL("Rendering DocuSignPage component");
  
  // Render the DocuSign page with proper handlers and pre-loaded data
  return (
    <DocuSignPage
      userData={allUserData}
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
};

export default DocuSignStep;