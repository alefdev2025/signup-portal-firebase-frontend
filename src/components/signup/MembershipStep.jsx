// File: pages/signup/MembershipStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { getStepFormData, saveFormData } from "../../services/storage";

// Import the MembershipPage component
import MembershipPage from "./MembershipPage";

const MembershipStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    iceCode: "",
    paymentFrequency: "quarterly", // Default to quarterly
    iceCodeValid: null,
    iceCodeInfo: null
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
        const savedData = getStepFormData("membership");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress in the database
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If user hasn't completed previous step, redirect back
          if (userData.signupProgress < 4) {
            navigate('/signup/funding', { replace: true });
            return;
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing membership step:", error);
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigate]);
  
  // Handle going back to previous step
  const handleBack = () => {
    navigate('/signup/funding', { replace: true });
  };
  
  // Handle form submission and proceeding to next step
  const handleNext = async (stepData) => {
    if (!currentUser) return false;
    
    try {
      console.log("MembershipStep: Saving data:", stepData);
      
      // Save form data locally
      saveFormData("membership", stepData);
      
      // Update progress in database
      const userDocRef = doc(db, "users", currentUser.uid);
      
      await setDoc(userDocRef, {
        membershipInfo: stepData, // Store the actual form data
        signupStep: "payment", // Next step
        signupProgress: 6, // Progress to step 6
        lastUpdated: new Date()
      }, { merge: true });
      
      console.log("MembershipStep: Data saved to Firestore");
      
      // Refresh user progress from backend
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to next step (payment)
      navigate('/signup/payment', { 
        replace: true,
        state: { 
          membershipData: stepData
        }
      });
      return true;
    } catch (error) {
      console.error("Error saving membership info:", error);
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
  
  // Use the MembershipPage component
  return (
    <MembershipPage
      initialData={formData}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
};

export default MembershipStep;