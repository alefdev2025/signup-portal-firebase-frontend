// File: pages/PackagePage.jsx
import React, { useState, useEffect } from "react";
import { updateSignupProgress } from "../services/auth";
import { getMembershipCost } from "../services/pricing";

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
  const [membershipCost, setMembershipCost] = useState(null);
  const [membershipAge, setMembershipAge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("standard");
  
  // Fetch membership cost when component mounts
  useEffect(() => {
    async function fetchMembershipCost() {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await getMembershipCost();
        
        if (result.success) {
          setMembershipCost(result.membershipCost);
          setMembershipAge(result.age);
        } else {
          setError(result.error || "Failed to calculate membership cost");
        }
      } catch (err) {
        console.error("Error fetching membership cost:", err);
        setError("An error occurred while calculating your membership cost. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMembershipCost();
  }, []);
  
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
      // Calculate the final price based on selected package
      let finalPrice = membershipCost;
      if (selectedPackage === "basic") {
        finalPrice = membershipCost * 0.8;
      } else if (selectedPackage === "premium") {
        finalPrice = membershipCost * 1.5;
      }
      
      // Update progress in Firebase with package selection data
      await updateSignupProgress("funding", 3, {
        selectedPackage,
        packageCost: finalPrice,
        calculatedAt: new Date().toISOString(),
        basePrice: membershipCost
      });
      
      // Use onNext prop instead of direct navigation
      if (onNext) {
        return await onNext({
          packageType: selectedPackage,
          cost: finalPrice
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error in handleNext:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectPackage = (packageType) => {
    setSelectedPackage(packageType);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select Preservation Package</h2>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#775684]"></div>
          <p className="mt-3 text-gray-600">Calculating your personalized pricing...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <p className="text-sm text-red-600 mt-1">Please try refreshing the page or contact support if this issue persists.</p>
        </div>
      ) : (
        <div className="mb-8">
          {membershipAge && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-100 rounded-md">
              <p className="text-gray-700">Based on your age ({membershipAge}), we've calculated your personalized membership pricing:</p>
            </div>
          )}
          
          <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Package */}
            <div className={`border ${selectedPackage === "basic" ? "border-2 border-[#775684]" : "border-gray-200"} 
                            rounded-lg p-6 ${selectedPackage === "basic" ? "shadow-md" : "hover:shadow-md"} transition-all`}>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Basic Package</h3>
              <p className="text-3xl font-bold text-[#775684] mb-2">
                ${membershipCost ? (membershipCost * 0.8).toFixed(2) : "---"}<span className="text-sm text-gray-500 font-normal">/year</span>
              </p>
              <p className="text-gray-600 mb-4">Essential preservation services with standard care.</p>
              <ul className="text-sm text-gray-600 mb-4 space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Standard preservation protocol
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Basic monitoring
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Annual status updates
                </li>
              </ul>
              <button 
                onClick={() => selectPackage("basic")} 
                className={`w-full py-2 rounded-md transition-colors ${
                  selectedPackage === "basic" 
                    ? "bg-[#775684] text-white" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {selectedPackage === "basic" ? "Selected" : "Select Basic"}
              </button>
            </div>
            
            {/* Standard Package */}
            <div className={`border ${selectedPackage === "standard" ? "border-2 border-[#775684]" : "border-gray-200"} 
                            rounded-lg p-6 ${selectedPackage === "standard" ? "shadow-md" : "hover:shadow-md"} transition-all relative`}>
              <div className="absolute top-0 right-0 bg-[#775684] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                RECOMMENDED
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Standard Package</h3>
              <p className="text-3xl font-bold text-[#775684] mb-2">
                ${membershipCost ? membershipCost.toFixed(2) : "---"}<span className="text-sm text-gray-500 font-normal">/year</span>
              </p>
              <p className="text-gray-600 mb-4">Enhanced preservation with premium care and monitoring.</p>
              <ul className="text-sm text-gray-600 mb-4 space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Advanced preservation protocol
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  24/7 monitoring
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Quarterly status updates
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Priority support
                </li>
              </ul>
              <button 
                onClick={() => selectPackage("standard")} 
                className={`w-full py-2 rounded-md transition-colors ${
                  selectedPackage === "standard" 
                    ? "bg-[#775684] text-white" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {selectedPackage === "standard" ? "Selected" : "Select Standard"}
              </button>
            </div>
            
            {/* Premium Package */}
            <div className={`border ${selectedPackage === "premium" ? "border-2 border-[#775684]" : "border-gray-200"} 
                            rounded-lg p-6 ${selectedPackage === "premium" ? "shadow-md" : "hover:shadow-md"} transition-all`}>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Premium Package</h3>
              <p className="text-3xl font-bold text-[#775684] mb-2">
                ${membershipCost ? (membershipCost * 1.5).toFixed(2) : "---"}<span className="text-sm text-gray-500 font-normal">/year</span>
              </p>
              <p className="text-gray-600 mb-4">Elite preservation with personalized care and exclusive benefits.</p>
              <ul className="text-sm text-gray-600 mb-4 space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Elite preservation protocol
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Advanced 24/7 monitoring
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Monthly detailed reports
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Dedicated account manager
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  VIP support access
                </li>
              </ul>
              <button 
                onClick={() => selectPackage("premium")} 
                className={`w-full py-2 rounded-md transition-colors ${
                  selectedPackage === "premium" 
                    ? "bg-[#775684] text-white" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {selectedPackage === "premium" ? "Selected" : "Select Premium"}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 italic">
            * Pricing is personalized based on your age and may be subject to change. All packages include our standard preservation guarantee.
          </p>
        </div>
      )}
      
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
          disabled={isSubmitting || isLoading}
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