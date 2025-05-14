// File: components/signup/AccountCreationSuccess.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveSignupState } from '../../services/storage';
import alcorFullLogo from '../../assets/images/navy-alcor-logo.png';

const AccountCreationSuccess = ({ currentUser, onNext }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to directly set backend data and navigate
  const updateBackendAndNavigate = async () => {
    console.log("Updating backend data and navigating");
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentUser || !currentUser.uid) {
        console.error("No current user or user ID available");
        throw new Error("User authentication required");
      }
      
      // Get user document reference
      const userDocRef = doc(db, "users", currentUser.uid);
      
      console.log("Updating user document in Firestore...");
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
      
      // Only navigate once everything is complete
      console.log("Navigating to step 1");
      navigate('/signup?step=1&force=true', { replace: true });
      
    } catch (error) {
      console.error("Error updating backend:", error);
      setError("There was an issue updating your progress. Please try again.");
      setIsLoading(false);
      
      // Don't navigate automatically on error - let user retry
    }
  };
  
  const handleContinue = () => {
    console.log("Continue button clicked");
    // Don't call updateBackendAndNavigate() here
    // Instead, use the onNext prop
    if (onNext) {
      onNext();
    }
  };
  
  return (
    <div className="w-full max-w-3xl px-2 sm:px-0">
      <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 max-w-[85%] sm:max-w-none mx-auto">
        {/* More compact top section with success icon and text */}
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-[#0C2340] to-[#26396A] rounded-full p-2 sm:p-2.5 shadow-sm mr-3 sm:mr-4 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0C2340] leading-tight">Account Created!</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Your Alcor account has been successfully created and verified.
            </p>
          </div>
        </div>
        
        {/* Account info card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-[#0C2340]/10 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0C2340]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className="text-gray-500 text-sm font-medium">Email</span>
                <p className="font-semibold text-[#0C2340]">{currentUser?.email || "Your email"}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <span className="text-gray-500 text-sm font-medium">Account Status</span>
                <p className="font-semibold text-green-600">Verified</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info text with logo */}
        <div className="flex justify-between items-center bg-[#0C2340]/5 rounded-xl p-5 mb-8">
          <p className="text-gray-600 text-sm pr-4">
            You can continue with your membership application below.
            Once you've completed your signup, you can enable multi-factor authentication.
          </p>
          <img src={alcorFullLogo} alt="Alcor Logo" className="h-12 hidden sm:block" />
        </div>
        
        {/* Show error message if there is one */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg mb-6 text-sm">
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </p>
          </div>
        )}
      </div>
          
      {/* Continue button */}
      <div className="text-center">
        <button 
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-[#6f2d74] text-white py-4 px-10 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center disabled:opacity-70 hover:bg-[#7b3382]"
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