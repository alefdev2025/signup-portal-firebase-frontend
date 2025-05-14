// File: pages/signup/AccountSuccessStep.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUser } from "../../contexts/UserContext";
import { isAccountCreated, setForceNavigation } from "../../services/storage";

// Import components
import AccountCreationSuccess from "../../components/signup/AccountCreationSuccess";

const AccountSuccessStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  
  // Add debugging
  useEffect(() => {
    console.log("AccountSuccessStep mounted");
    console.log("Current user:", currentUser?.uid);
    console.log("Just verified:", localStorage.getItem('just_verified'));
    console.log("Account created:", isAccountCreated());
  }, [currentUser]);
  
  // Check if user is authenticated and account creation success flag is set
  useEffect(() => {
    const checkAuth = async () => {
      if (!currentUser) {
        console.log("No user authenticated, redirecting to signup");
        // Redirect unauthenticated users back to account creation
        navigate('/signup', { replace: true });
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
          
          // Refresh user progress
          if (typeof refreshUserProgress === 'function') {
            await refreshUserProgress();
          }
        } else if (userDoc.exists()) {
          console.log("User document exists:", userDoc.data());
          
          // REMOVED: Auto-forwarding logic to allow back navigation
          // Users should be able to freely navigate to previous steps
        }
        
        // If we made it here, user should see the success page
        console.log("User should see the success page, setting loading=false");
        setLoading(false);
      } catch (error) {
        console.error("Error checking user progress:", error);
        setLoading(false);
      }
    };
    
    // Only run if we have a user
    if (currentUser) {
      checkAuth();
    }
  }, [currentUser, navigate, refreshUserProgress]);
  
  // Function to handle continuing to next step
  const handleContinue = async () => {
    if (!currentUser) return;
    
    try {
      console.log("Continue button clicked, updating database");
      // Update user document to indicate progression to next step
      const userDocRef = doc(db, "users", currentUser.uid);
      
      await setDoc(userDocRef, {
        signupStep: "contact_info",
        signupProgress: 2,
        lastUpdated: new Date()
      }, { merge: true });
      
      // Refresh user progress from backend
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      console.log("Database updated, setting force navigation and redirecting");
      // Set force navigation to bypass route guards
      setForceNavigation(2);
      
      // Navigate to contact info step
      navigate('/signup/contact', { replace: true });
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