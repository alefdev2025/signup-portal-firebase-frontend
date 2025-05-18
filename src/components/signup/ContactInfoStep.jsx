// File: pages/signup/ContactInfoStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { getStepFormData, saveFormData } from "../../services/storage";

import ContactInfoPage from "./ContactInfoPage";

const ContactInfoStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  
  // Check authentication and load saved form data
  useEffect(() => {
    const init = async () => {
      if (!currentUser) {
        console.log("No user authenticated, redirecting to signup");
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
        console.log("Checking user progress via API");
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          console.log("User progress:", progressResult);
          
          // If user hasn't completed previous step, redirect back
          if (progressResult.step < 1) {
            console.log("User has not completed previous step, redirecting");
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
  
  // Handle going back to previous step
  const handleBack = () => {
    navigate('/signup/success', { replace: true });
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) return false;
    
    try {
      // Save form data locally
      saveFormData("contact_info", stepData);
      
      // Save contact info via API
      const saveResult = await saveContactInfo(stepData);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save contact information");
      }
      
      // Update progress via API
      const progressResult = await updateSignupProgressAPI("package", 3);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to next step
      navigate('/signup/package', { replace: true });
      return true;
    } catch (error) {
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