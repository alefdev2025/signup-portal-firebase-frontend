// File: pages/signup/MembershipStep.jsx
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { getStepFormData, saveFormData } from "../../services/storage";
import { getMembershipCost } from "../../services/pricing";
import membershipService from "../../services/membership";

// Import the MembershipPage component
import MembershipPage from "./MembershipPage";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[MEMBERSHIP STEP] ${message}`);
    console.log(`[MEMBERSHIP STEP] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const MembershipStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  const { navigateToStep, goToNextStep, currentStepIndex, canAccessStep } = useSignupFlow();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    iceCode: "",
    paymentFrequency: "annually", // Default to annually like original
    iceCodeValid: null,
    iceCodeInfo: null,
    interestedInLifetime: false
  });
  const [membershipData, setMembershipData] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [error, setError] = useState(null);
  // Add initialization tracker to prevent double initialization
  const initializedRef = useRef(false);
  
  // Check authentication, load saved form data, and fetch membership cost
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
        const savedData = getStepFormData("membership");
        if (savedData) {
          LOG_TO_TERMINAL("Loading saved form data");
          setFormData(savedData);
        }
        
        // Start all data fetching operations concurrently for better performance
        const progressPromise = getUserProgressAPI();
        const membershipPromise = getMembershipCost();
        
        // Check user's progress via API
        const progressResult = await progressPromise;
        
        if (progressResult.success) {
          LOG_TO_TERMINAL(`User progress: step ${progressResult.step}`);
          
          // Membership is step 5, so check if user hasn't completed step 4 (funding)
          if (progressResult.step < 5) {
            LOG_TO_TERMINAL("User has not completed previous step, redirecting to funding");
            navigateToStep(4, { force: true, reason: 'incomplete_previous_step' });
            return;
          }
          
          // If user has already completed this step and moved further, allow them to be here
          // but load their existing data
          if (progressResult.step > 5) {
            LOG_TO_TERMINAL("User has already completed this step, loading existing data");
          }
        } else {
          console.error("Error getting user progress:", progressResult.error);
          setError("Could not verify your progress. Please try again.");
        }

        // Get membership cost data 
        const membershipResult = await membershipPromise;
        
        if (membershipResult?.success) {
          setMembershipData({
            membershipCost: membershipResult.membershipCost || 540,
            age: membershipResult.age || 36,
            annualDues: membershipResult.annualDues,
            monthlyDues: membershipResult.monthlyDues,
            duesMultiplier: membershipResult.duesMultiplier
          });
          LOG_TO_TERMINAL("Membership data loaded successfully");
        } else {
          console.error("Error fetching membership cost:", membershipResult?.error);
          setError(membershipResult?.error || "Failed to calculate membership cost");
        }
        
        // Try to get package info that was selected in previous step
        try {
          // First try to get from funding service
          const fundingService = await import("../../services/funding");
          const packageResult = await fundingService.default.getPackageInfoForFunding();
          
          if (packageResult.success) {
            setPackageData({
              packageType: packageResult.packageType,
              preservationType: packageResult.preservationType,
              preservationEstimate: packageResult.preservationEstimate,
              annualCost: packageResult.annualCost
            });
            LOG_TO_TERMINAL("Package data loaded from funding service");
          } else {
            // Try membership service as fallback
            const membershipResult = await membershipService.getMembershipInfo();
            if (membershipResult.success && membershipResult.data.packageInfo) {
              setPackageData(membershipResult.data.packageInfo);
              LOG_TO_TERMINAL("Package data loaded from membership service");
            } else {
              LOG_TO_TERMINAL("No package data found, continuing without it");
            }
          }
        } catch (error) {
          LOG_TO_TERMINAL(`Error loading package data: ${error.message}`);
          // Don't set error - package data is not critical for membership step
        }
        
        LOG_TO_TERMINAL("Initialization complete");
      } catch (error) {
        console.error("Error initializing membership step:", error);
        setError("An error occurred while loading your information. Please try again.");
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
    LOG_TO_TERMINAL("MembershipStep: Back button clicked");
    
    // Use SignupFlow navigation system
    navigateToStep(4, { reason: 'user_back_button' }); // Go back to funding step
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) {
      LOG_TO_TERMINAL("No current user - cannot proceed");
      return false;
    }
    
    try {
      LOG_TO_TERMINAL("Saving membership info and proceeding to next step");
      
      // Save form data locally
      saveFormData("membership", stepData);
      LOG_TO_TERMINAL("Form data saved locally");
      
      // Save membership data via API
      const saveResult = await membershipService.saveMembershipSelection(stepData);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save membership information");
      }
      
      LOG_TO_TERMINAL("Membership info saved to backend");
      
      // Update progress via API
      LOG_TO_TERMINAL("Updating progress via API...");
      const progressResult = await updateSignupProgressAPI("payment", 6);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      LOG_TO_TERMINAL("Progress updated successfully, proceeding to next step");
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Use goToNextStep() like the package step does
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
      console.error("Error saving membership info:", error);
      return false;
    }
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
        <p className="ml-4 text-xl text-gray-700">Loading membership information...</p>
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
  
  LOG_TO_TERMINAL("Rendering MembershipPage component");
  
  // Prepare initial data for the MembershipPage
  const initialData = {
    ...formData,
    // Include package info if available
    ...(packageData && {
      packageType: packageData.packageType,
      preservationType: packageData.preservationType,
      preservationEstimate: packageData.preservationEstimate,
      annualCost: packageData.annualCost
    }),
    // Include membership cost data
    ...(membershipData && {
      membershipCost: membershipData.membershipCost,
      age: membershipData.age
    })
  };
  
  // Render the membership selection form with proper handlers and pre-loaded data
  return (
    <MembershipPage
      initialData={initialData}
      onBack={handleBack}
      onNext={handleNext}
      preloadedMembershipData={membershipData} // Pass the pre-loaded membership data
      preloadedPackageData={packageData} // Pass the pre-loaded package data
    />
  );
};

export default MembershipStep;