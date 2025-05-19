// Fixed ContactInfoStep.jsx with Robust Navigation

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { getStepFormData, saveFormData, setForceNavigation } from "../../services/storage";

import ContactInfoPage from "./ContactInfoPage";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false); // Synchronous request
    xhr.send(`[CONTACT STEP] ${message}`);
    console.log(`[CONTACT STEP] ${message}`); // Also log to console
  } catch (e) {
    // Ignore errors
  }
};

const ContactInfoStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  
  // Check authentication and load saved form data
  useEffect(() => {
    const init = async () => {
      if (!currentUser) {
        LOG_TO_TERMINAL("No user authenticated, redirecting to signup");
        // Redirect unauthenticated users back to account creation
        navigate('/signup', { replace: true });
        return;
      }
      
      try {
        // Load any saved form data for this step from local storage
        const savedData = getStepFormData("contact_info");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress via API
        LOG_TO_TERMINAL("Checking user progress via API");
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          LOG_TO_TERMINAL("User progress:", progressResult);
          
          // If user hasn't completed previous step, redirect back
          if (progressResult.step < 1) {
            LOG_TO_TERMINAL("User has not completed previous step, redirecting");
            navigate('/signup/success', { replace: true });
            return;
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
  }, [currentUser, navigate]);
  
  // Handle going back to previous step - ROBUST IMPLEMENTATION
  const handleBack = () => {
    LOG_TO_TERMINAL("ContactInfoStep: Back button clicked");
    
    // Use multiple navigation methods to ensure reliable navigation
    try {
      // 1. Set force navigation flag in localStorage (highest priority)
      setForceNavigation(1); // 1 = success step
      LOG_TO_TERMINAL("Set force navigation flag to step 1 (success)");
      
      // 2. Direct URL based navigation - most reliable fallback
      const directPath = '/signup/success';
      LOG_TO_TERMINAL(`Using direct navigation to ${directPath}`);
      
      // 3. Try React Router navigation first
      try {
        LOG_TO_TERMINAL("Attempting React Router navigation");
        navigate(directPath, { replace: true });
      } catch (routerError) {
        LOG_TO_TERMINAL(`React Router navigation failed: ${routerError.message}`);
        
        // 4. Fallback to direct location change
        LOG_TO_TERMINAL("Falling back to direct window.location change");
        window.location.href = directPath;
      }
    } catch (error) {
      LOG_TO_TERMINAL(`ERROR during back navigation: ${error.message}`);
      
      // Last resort emergency fallback
      window.location.href = '/signup/success';
    }
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) return false;
    
    try {
      LOG_TO_TERMINAL("Saving contact info and proceeding to next step");
      
      // Save form data locally
      saveFormData("contact_info", stepData);
      
      // Update progress via API
      const progressResult = await updateSignupProgressAPI("package", 3);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Set force navigation to ensure reliable navigation
      setForceNavigation(3); // 3 = package step
      LOG_TO_TERMINAL("Set force navigation flag to step 3 (package)");
      
      // Navigate to next step
      LOG_TO_TERMINAL("Navigating to package page");
      navigate('/signup/package', { replace: true });
      return true;
    } catch (error) {
      LOG_TO_TERMINAL(`Error saving contact info: ${error.message}`);
      console.error("Error saving contact info:", error);
      return false;
    }
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
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