// File: pages/signup/FundingStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { getStepFormData, saveFormData } from "../../services/storage";

// Import the FundingPage component
import FundingPage from "./FundingPage";

const FundingStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fundingMethod: "insurance", // Default to insurance
  });
  
  // Check authentication and load saved form data
  useEffect(() => {
    const init = async () => {
      if (!currentUser) {
        // Redirect unauthenticated users back to account creation
        navigate('/signup', { replace: true });
        return;
      }
      
      try {
        // Load any saved form data for this step
        const savedData = getStepFormData("funding");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress in the database
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If user hasn't completed previous step, redirect back
          if (userData.signupProgress < 3) {
            navigate('/signup/package', { replace: true });
            return;
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing funding step:", error);
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigate]);
  
  // Handle going back to previous step
  const handleBack = () => {
    navigate('/signup/package', { replace: true });
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) return false;
    
    try {
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
      
      // Update progress in database
      const userDocRef = doc(db, "users", currentUser.uid);
      
      await setDoc(userDocRef, {
        fundingInfo: processedData, // Store the actual form data
        signupStep: "membership", // Next step
        signupProgress: 5, // Progress to step 5
        lastUpdated: new Date()
      }, { merge: true });
      
      // Refresh user progress from backend
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to next step
      navigate('/signup/membership', { replace: true });
      return true;
    } catch (error) {
      console.error("Error saving funding info:", error);
      return false;
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  // Use the FundingPage component
  return (
    <FundingPage
      initialData={formData}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
};

export default FundingStep;