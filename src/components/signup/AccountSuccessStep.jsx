// File: pages/signup/AccountSuccessStep.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { useSignupFlow } from '../../contexts/SignupFlowContext';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { isAccountCreated } from "../../services/storage";
import { updateSignupProgressAPI } from "../../services/auth";
import AccountCreationSuccess from "../../components/signup/AccountCreationSuccess";

const AccountSuccessStep = () => {
  const { goToNextStep, navigateToStep } = useSignupFlow();
  const { currentUser } = useUser();  // Removed refreshUserProgress
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  // Add debugging
  useEffect(() => {
    console.log("AccountSuccessStep mounted");
    console.log("Current user:", currentUser?.uid);
    console.log("Just verified:", localStorage.getItem('just_verified'));
    console.log("Account created:", isAccountCreated());
  }, [currentUser]);
  
  // Check auth and update database if needed
  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser) {
        console.log("No user authenticated, navigating back to account creation");
        navigateToStep(0);
        return;
      }
      
      // Check if this is a newly verified user
      const justVerified = localStorage.getItem('just_verified') === 'true';
      
      try {
        console.log("Checking user document in Firestore");
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        // If this is a newly verified user or the user hasn't completed step 1 yet
        if (justVerified || !userDoc.exists() || (userDoc.exists() && userDoc.data().signupProgress === 0)) {
          console.log("Newly verified user or first time at step 1, updating database");
          
          // Clear verification flags
          localStorage.removeItem('just_verified');
          localStorage.removeItem('verification_timestamp');
          
          // Update database with step 1 completion
          await setDoc(userDocRef, {
            signupStep: "success",
            signupProgress: 1,
            accountCreationCompleted: true,
            lastUpdated: new Date()
          }, { merge: true });
          
          console.log("Database updated with success step completion");
        } else if (userDoc.exists()) {
          console.log("User document exists:", userDoc.data());
        }
        
        // Mark as ready for navigation
        setIsReady(true);
        console.log("Component is ready for navigation");
        setLoading(false);
      } catch (error) {
        console.error("Error checking user progress:", error);
        // Still allow continuation even if there's an error
        setIsReady(true);
        setLoading(false);
      }
    };
    
    // Only run if we have a user
    if (currentUser) {
      checkAuth();
    }
  }, [currentUser, navigateToStep]);  // Removed refreshUserProgress from dependencies
  
  // Handle continue button click - FIXED VERSION
  const handleContinue = async () => {
    if (!currentUser || !isReady) {
      console.log("Cannot continue - currentUser:", !!currentUser, "isReady:", isReady);
      return;
    }
    
    try {
      console.log("Continue button clicked, updating to contact_info step");
      
      // Call the API function to update progress to step 2
      const result = await updateSignupProgressAPI("contact_info", 2);
      
      if (!result.success) {
        console.error("Failed to update progress:", result.error);
        return;
      }
      
      console.log("API update successful, navigating to contact step");
      
      // REMOVED: await refreshUserProgress();
      // Navigate immediately like ContactInfoStep does
      goToNextStep();
      
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  return <AccountCreationSuccess currentUser={currentUser} onNext={handleContinue} />;
};

export default AccountSuccessStep;