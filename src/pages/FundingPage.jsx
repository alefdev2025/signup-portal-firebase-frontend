// File: pages/FundingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import ResponsiveBanner from "../components/ResponsiveBanner";
import { useUser } from "../contexts/UserContext";
import { updateSignupProgress } from "../services/auth";
import HelpPanel from "../components/signup/HelpPanel";

// Define the steps array for the banner
const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

// Define help content
const fundingHelpContent = [
  {
    title: "Funding Options",
    content: "Select how you'd like to fund your membership. We offer various options to meet your preferences."
  },
  {
    title: "Payment Security",
    content: "All payment information is securely processed and stored according to industry standards."
  },
  {
    title: "Need assistance?",
    content: (
      <>
        Contact our support team at <a href="mailto:support@alcor.com" className="text-[#775684] hover:underline">support@alcor.com</a> or call (800) 555-1234.
      </>
    )
  }
];

export default function FundingPage() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Handler for back button - navigate to previous step
  const handleBack = () => {
    navigate('/signup/method');
  };
  
  // Handler for next button - navigate to next step
  const handleNext = async () => {
    setIsSubmitting(true);
    
    try {
      // Update progress in Firebase
      await updateSignupProgress("membership", 4, {});
      
      // Navigate to next step
      navigate('/signup/membership');
      return true;
    } catch (error) {
      console.error("Error in handleNext:", error);
      navigate('/signup/membership');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Banner with step indicator */}
      <ResponsiveBanner 
        activeStep={3}  // This is step 3 (Funding)
        steps={steps}
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
      
      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Placeholder for Funding page content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Choose Funding Option</h2>
            <p className="text-gray-600 mb-8">
              This page will contain the funding options. Currently a placeholder.
            </p>
            
            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              
              <button 
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg bg-[#775684] text-white hover:bg-[#664573] disabled:opacity-70"
              >
                {isSubmitting ? "Processing..." : "Continue"}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Panel */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={fundingHelpContent} 
      />
    </div>
  );
}