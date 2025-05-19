// File: pages/signup/PackageStep.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import { savePackageInfo } from "../../services/package";
import { getStepFormData, saveFormData } from "../../services/storage";
import { getMembershipCost } from "../../services/pricing"; // Import the pricing service
// Import your existing PackagePage component
import PackagePage from "./PackagePage";

const PackageStep = () => {
  const navigate = useNavigate();
  const { currentUser, refreshUserProgress } = useUser();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [membershipData, setMembershipData] = useState(null);
  const [error, setError] = useState(null);
  // Add initialization tracker to prevent double initialization
  const initializedRef = useRef(false);
  
  // Check authentication, load saved form data, and fetch membership cost
  useEffect(() => {
    // Prevent double initialization which causes flickering
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const init = async () => {
      // Clear any existing force navigation flags to prevent re-renders
      localStorage.removeItem('force_active_step');
      localStorage.removeItem('force_timestamp');
      
      if (!currentUser) {
        console.log("No user authenticated, redirecting to signup");
        // Redirect unauthenticated users back to account creation
        navigate('/signup', { replace: true });
        return;
      }
      
      try {
        console.log("PackageStep: Starting initialization");
        
        // Start all data fetching operations concurrently for better performance
        const progressPromise = getUserProgressAPI();
        const membershipPromise = getMembershipCost();
        
        // Load any saved form data for this step from local storage
        const savedData = getStepFormData("package");
        if (savedData) {
          setFormData(savedData);
        }
        
        // Check user's progress via API
        const progressResult = await progressPromise;
        
        if (progressResult.success) {
          console.log("User progress:", progressResult);
          
          // If user hasn't completed previous step, redirect back
          if (progressResult.step < 2) {
            console.log("User has not completed previous step, redirecting");
            navigate('/signup/contact', { replace: true });
            return;
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
            age: membershipResult.age || 36
          });
        } else {
          console.error("Error fetching membership cost:", membershipResult?.error);
          setError(membershipResult?.error || "Failed to calculate membership cost");
        }
        
        console.log("PackageStep: Initialization complete");
      } catch (error) {
        console.error("Error initializing package step:", error);
        setError("An error occurred while loading your information. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Make sure any pending async operations are handled properly
      console.log("PackageStep: Unmounting component");
    };
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
      
      // Save package info via API
      const saveResult = await savePackageInfo(stepData);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save package information");
      }
      
      // Update progress via API - use direct navigation instead of force flags
      const progressResult = await updateSignupProgressAPI("funding", 4);
      
      if (!progressResult.success) {
        throw new Error(progressResult.error || "Failed to update progress");
      }
      
      // Refresh user progress from context
      if (typeof refreshUserProgress === 'function') {
        await refreshUserProgress();
      }
      
      // Navigate to next step WITHOUT setting force flags
      console.log("PackageStep: Navigation to funding page");
      navigate('/signup/funding', { replace: true });
      return true;
    } catch (error) {
      console.error("Error saving package info:", error);
      return false;
    }
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 px-4 sm:px-6">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-sm px-6 py-4 flex items-center" style={{ maxWidth: '300px' }}>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#775684] border-opacity-50 border-t-[#775684] mr-3"></div>
            <p className="text-gray-600 text-sm">Loading membership information...</p>
          </div>
        </div>
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
  
  console.log("PackageStep: Rendering PackagePage component");
  
  // Render the package selection form with proper handlers and pre-loaded membership data
  return (
    <PackagePage
      initialData={formData}
      onBack={handleBack}
      onNext={handleNext}
      preloadedMembershipData={membershipData} // Pass the pre-loaded membership data
    />
  );
};

export default PackageStep;