// File: pages/signup/PackageStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { getStepFormData, saveFormData } from "../../services/storage";

// Import your existing PackagePage component or create a simplified version
import PackagePage from "./PackagePage";

const PackageStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  
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
        const savedData = getStepFormData("package");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress in the database
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If user hasn't completed previous step, redirect back
          if (userData.signupProgress < 2) {
            navigate('/signup/contact', { replace: true });
            return;
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing package step:", error);
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigate]);
  
  // Handle going back to previous step
  const handleBack = () => {
    navigate('/signup/contact', { replace: true });
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) return false;
    
    try {
      // Save form data locally
      saveFormData("package", stepData);
      
      // Update progress in database
      const userDocRef = doc(db, "users", currentUser.uid);
      
      await setDoc(userDocRef, {
        packageInfo: stepData, // Store the actual form data
        signupStep: "funding", // Next step
        signupProgress: 4, // Progress to step 4
        lastUpdated: new Date()
      }, { merge: true });
      
      // Refresh user progress from backend
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to next step
      navigate('/signup/funding', { replace: true });
      return true;
    } catch (error) {
      console.error("Error saving package info:", error);
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
  
  // Either use your existing PackagePage or create a simplified version
  return (
    <PackagePage
      initialData={formData}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
};

export default PackageStep;