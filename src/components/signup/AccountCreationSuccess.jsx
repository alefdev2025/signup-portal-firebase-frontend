// File: components/signup/AccountCreationSuccess.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, updateSignupProgress } from '../../services/auth';
import { saveSignupState } from '../../contexts/UserContext';

const AccountCreationSuccess = ({ currentUser, onNext }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Function to directly set backend data and navigate
  const updateBackendAndNavigate = async () => {
    console.log("Updating backend data and navigating");
    setIsLoading(true);
    
    try {
      if (!currentUser || !currentUser.uid) {
        console.error("No current user or user ID available");
        throw new Error("User authentication required");
      }
      
      // Get user document reference
      const userDocRef = doc(db, "users", currentUser.uid);
      
      // Directly update/create the document with progress 1
      await setDoc(userDocRef, {
        email: currentUser.email,
        displayName: currentUser.displayName || "New Member",
        signupStep: "contact_info",
        signupProgress: 1,
        lastUpdated: new Date(),
        ...(await getDoc(userDocRef)).data() // Preserve existing data
      }, { merge: true });
      
      console.log("Backend updated successfully with progress 1");
      
      // Update local storage
      const signupState = {
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || "New Member",
        signupStep: "contact_info",
        signupProgress: 1,
        timestamp: Date.now()
      };
      
      saveSignupState(signupState);
      console.log("Local state updated with progress 1");
      
      // Force the navigation to step 1
      console.log("Navigating to step 1");
      navigate('/signup?step=1&force=true', { replace: true });
      
    } catch (error) {
      console.error("Error updating backend:", error);
      
      // Final fallback: Direct navigation with force parameter
      console.log("Using direct forced navigation as fallback");
      navigate('/signup?step=1&force=true', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContinue = () => {
    console.log("Continue button clicked");
    updateBackendAndNavigate();
  };
  
  return (
    <div className="w-full max-w-3xl">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-green-50 rounded-full p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
        <p className="text-gray-600 mb-6">
          Your Alcor account has been successfully created and verified.
        </p>
        <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
          <div className="flex flex-col space-y-2">
            <div>
              <span className="text-gray-500 text-sm">Email:</span>
              <p className="font-medium">{currentUser?.email || "Your email"}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Account Status:</span>
              <p className="font-medium text-green-600">Verified</p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          You can continue with your membership application below.
          Password reset and account settings will be available after completing your signup.
        </p>
      </div>
          
      {/* Continue button with backend update */}
      <div className="text-center">
        <button 
          onClick={handleContinue}
          disabled={isLoading}
          style={{
            backgroundColor: "#6f2d74",
            color: "white",
            display: "inline-flex",
            alignItems: "center"
          }}
          className="py-4 px-8 rounded-full font-semibold text-lg mx-auto hover:opacity-90 disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              Continue to Contact Information
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountCreationSuccess;