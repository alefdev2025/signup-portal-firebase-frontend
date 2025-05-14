// File: pages/PackagePage.jsx
import React, { useState } from "react";
import { updateSignupProgress } from "../services/auth";

// Update help content for export
export const packageHelpContent = [
  {
    title: "Preservation Package",
    content: "Select your preferred preservation package. Each option provides different benefits and considerations."
  },
  {
    title: "Package Selection",
    content: "Your selection here will determine the type of contract and services provided."
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

// Rename component and simplify to content-only
export default function PackagePage({ onNext, onBack }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Direct approach for back button - matching ContactInfoPage implementation
  const handleBackClick = () => {
    console.log("PackagePage: Handle back button clicked");
    
    // Use the more reliable force navigation method
    localStorage.setItem('force_active_step', '1'); // Force to step 1 (Contact Info)
    localStorage.setItem('force_timestamp', Date.now().toString());
    
    // Use setTimeout to ensure this happens after current event loop
    setTimeout(() => {
      // Then force a page reload to clear any stale state
      window.location.href = `/signup?step=1&force=true&_=${Date.now()}`;
    }, 0);
  };
  
  // Handler for next button - uses props from parent
  const handleNext = async () => {
    setIsSubmitting(true);
    
    try {
      // Update progress in Firebase - note we update to "funding" for next step
      await updateSignupProgress("funding", 3, {});
      
      // Use onNext prop instead of direct navigation
      if (onNext) {
        return await onNext({});
      }
      
      return true;
    } catch (error) {
      console.error("Error in handleNext:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select Preservation Package</h2>
      <p className="text-gray-600 mb-8">
        This page will contain the package selection options. Currently a placeholder.
      </p>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handleBackClick}
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
  );
}