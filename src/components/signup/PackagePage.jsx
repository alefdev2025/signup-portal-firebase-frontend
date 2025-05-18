// File: pages/PackagePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateSignupProgress } from "../../services/auth";
import { getMembershipCost } from "../../services/pricing";
import alcorStar from "../../assets/images/alcor-star.png";
import HelpPanel from "./HelpPanel";

// Update help content for export
export const packageHelpContent = [
  {
    title: "Preservation Package",
    content: "Select your preferred preservation package and type. Each option provides different benefits and considerations."
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

export default function PackagePage({ onNext, onBack }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipCost, setMembershipCost] = useState(null);
  const [membershipAge, setMembershipAge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("standard");
  
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  
  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Plan options and descriptions
  const planOptions = {
    neuro: {
      title: "Membership + Neuropreservation",
      short: "Preservation of the brain and supporting structures",
      long: "Neuropreservation focuses on the brain and neural structures, preserving the critical elements that contain your memories, personality, and consciousness. This option requires less resources and offers a more affordable approach to cryopreservation.",
      baseEstimate: 80000,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#775684]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    wholebody: {
      title: "Membership + Whole Body Preservation",
      short: "Complete preservation of the entire human body",
      long: "Whole Body preservation involves cryopreserving your entire body, maintaining all organs and systems intact. This comprehensive approach preserves not only neural structures but all biological systems, offering the possibility of complete restoration in the future.",
      baseEstimate: 220000,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#775684]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    basic: {
      title: "Basic Membership Only",
      short: "Become a member now, decide on cryopreservation later",
      long: "Basic membership gives you priority access to our services and locks in today's rates for future preservation options. You can add a cryopreservation contract at any time in the future when you're ready.",
      baseEstimate: 0,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#775684]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      )
    }
  };

  useEffect(() => {
    if (!selectedOption && !isLoading) {
      setSelectedOption("neuro");
    }
  }, [isLoading, selectedOption]);
  
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
  
  const handleBackClick = () => {
    console.log("PackagePage: Handle back button clicked");
    
    // Use the more reliable force navigation method
    localStorage.setItem('force_active_step', '2'); // Force to step 2 (Contact Info)
    localStorage.setItem('force_timestamp', Date.now().toString());
    
    // Use direct path navigation to contact page
    navigate('/signup/contact', { replace: true });
  };
  
  const handleNext = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate the final membership price based on selected package
      let finalPrice = membershipCost;
      if (selectedPackage === "basic") {
        finalPrice = membershipCost * 0.8;
      } else if (selectedPackage === "premium") {
        finalPrice = membershipCost * 1.5;
      }
      
      // Calculate estimated preservation cost (if applicable)
      const preservationEstimate = selectedOption === "basic" ? null : calculatePreservationEstimate(selectedOption);
      
      // Update progress in Firebase with selection data
      await updateSignupProgress("funding", 4, {
        selectedPackage,
        packageCost: finalPrice,
        calculatedAt: new Date().toISOString(),
        basePrice: membershipCost,
        preservationType: selectedOption,
        estimatedPreservationCost: preservationEstimate
      });
      
      // Use onNext prop instead of direct navigation
      if (onNext) {
        return await onNext({
          packageType: selectedPackage,
          cost: finalPrice,
          preservationType: selectedOption,
          preservationEstimate: preservationEstimate
        });
      }
      
      // Fallback direct navigation if onNext not provided
      console.log("🚀 Navigating to funding step...");
      localStorage.setItem('force_active_step', '4'); // Force to Funding step (4)
      localStorage.setItem('force_timestamp', Date.now().toString());
      navigate('/signup/funding', { replace: true });
      
      return true;
    } catch (error) {
      console.error("Error in handleNext:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectOption = (option) => {
    setSelectedOption(option);
  };
  
  const selectPackage = (packageType) => {
    setSelectedPackage(packageType);
  };
  
  // Calculate estimated preservation cost based on age and type
  const calculatePreservationEstimate = (optionType) => {
    if (!optionType || optionType === "basic") return null;
    
    // Return fixed amount directly from baseEstimate without age factor
    return planOptions[optionType].baseEstimate;
  };
  
  // Get package price with selected options
  const getPackagePrice = (packageType) => {
    if (!membershipCost) return null;
    
    let price = membershipCost;
    if (packageType === "basic") {
      price = membershipCost * 0.8;
    } else if (packageType === "premium") {
      price = membershipCost * 1.5;
    }
    
    return price.toFixed(2);
  };
  
  // Star icon for the checklist
  const StarIcon = () => (
    <img src={alcorStar} alt="Alcor Star" className="w-5 h-5 mr-2 flex-shrink-0" />
  );
  
  return (
    <div className="w-full bg-gray-100" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative'
    }}>
      <div className="w-full mx-auto px-4 py-8" style={{ maxWidth: "1200px" }}>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
            <p className="mt-4 text-xl text-gray-600">Calculating pricing...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8">
            <p className="text-red-700 text-lg">{error}</p>
            <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
          </div>
        ) : (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* NEURO OPTION */}
              <div onClick={() => selectOption("neuro")} className={`cursor-pointer h-full`}>
                <div className={`rounded-lg overflow-hidden h-full flex flex-col border-2 ${selectedOption === "neuro" ? "border-[#65417c]" : "border-transparent"}`}>
                  {/* SELECTED indicator that is always there but only visible when selected */}
                  <div className="h-12 w-full bg-white flex items-center justify-center">
                    <span className={`font-bold text-sm tracking-widest ${selectedOption === "neuro" ? "text-[#65417c]" : "text-transparent"}`}>
                      SELECTED
                    </span>
                  </div>
                  
                  <div className="text-white flex-1 flex flex-col" style={{
                    background: 'radial-gradient(circle at bottom center, #c88c68 5%, #65417c 30%, #323053 70%)'
                  }}>
                    <div className="p-6 border-b border-white border-opacity-20 flex-1">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center">
                          <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 mr-3" />
                          <h3 className="text-2xl font-semibold">Neuropreservation</h3>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-white text-opacity-90 mb-8 h-16 text-lg">
                        Preserves brain and neural structures at a lower cost.
                      </p>
                      
                      <div className="border-t border-white border-opacity-20 pt-6 mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white text-opacity-70 text-lg">Preservation:</span>
                          <span className="text-white font-bold text-lg">${calculatePreservationEstimate("neuro")?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-70 text-lg">Membership:</span>
                          <span className="text-white font-bold text-lg">${getPackagePrice("standard")}/year</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included Section - Now White with Star List and Explanations */}
                    <div className="bg-white p-8 text-gray-800">
                      <h4 className="font-semibold text-lg mb-6 text-gray-800">What's Included:</h4>
                      
                      <ul className="mb-8 space-y-4">
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Standby Service</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Neural Cryopreservation</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Long-Term Storage</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Possible Revival</span>
                        </li>
                      </ul>
                      
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-gray-600">
                          Preserves the brain's neural connections that define your identity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WHOLE BODY OPTION */}
              <div onClick={() => selectOption("wholebody")} className={`cursor-pointer h-full`}>
                <div className={`rounded-lg overflow-hidden h-full flex flex-col border-2 ${selectedOption === "wholebody" ? "border-[#323053]" : "border-transparent"}`}>
                  {/* SELECTED indicator that is always there but only visible when selected */}
                  <div className="h-12 w-full bg-white flex items-center justify-center">
                    <span className={`font-bold text-sm tracking-widest ${selectedOption === "wholebody" ? "text-[#323053]" : "text-transparent"}`}>
                      SELECTED
                    </span>
                  </div>
                  
                  <div className="text-white flex-1 flex flex-col" style={{
                    background: 'radial-gradient(circle at bottom center, #82617f 5%, #323053 40%, #11243a 90%)'
                  }}>
                    <div className="p-6 border-b border-white border-opacity-20 flex-1">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center">
                          <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 mr-3" />
                          <h3 className="text-2xl font-semibold">Whole Body</h3>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-white text-opacity-90 mb-8 h-16 text-lg">
                        Preserves your entire body for complete restoration.
                      </p>
                      
                      <div className="border-t border-white border-opacity-20 pt-6 mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white text-opacity-70 text-lg">Preservation:</span>
                          <span className="text-white font-bold text-lg">${calculatePreservationEstimate("wholebody")?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-70 text-lg">Membership:</span>
                          <span className="text-white font-bold text-lg">${getPackagePrice("standard")}/year</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included Section - Now White with Star List and Explanations */}
                    <div className="bg-white p-8 text-gray-800">
                      <h4 className="font-semibold text-lg mb-6 text-gray-800">What's Included:</h4>
                      
                      <ul className="mb-8 space-y-4">
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Standby Service</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Full Body Cryopreservation</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Long-Term Storage</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Possible Revival</span>
                        </li>
                      </ul>
                      
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-gray-600">
                          Complete body preservation for potential full restoration.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* BASIC OPTION */}
              <div onClick={() => selectOption("basic")} className={`cursor-pointer h-full`}>
                <div className={`rounded-lg overflow-hidden h-full flex flex-col border-2 ${selectedOption === "basic" ? "border-[#11243a]" : "border-transparent"}`}>
                  {/* SELECTED indicator that is always there but only visible when selected */}
                  <div className="h-12 w-full bg-white flex items-center justify-center">
                    <span className={`font-bold text-sm tracking-widest ${selectedOption === "basic" ? "text-[#11243a]" : "text-transparent"}`}>
                      SELECTED
                    </span>
                  </div>
                  
                  <div className="text-white flex-1 flex flex-col" style={{
                    background: 'radial-gradient(circle at bottom center, #65417c 5%, #11243a 50%, #11243a 95%)'
                  }}>
                    <div className="p-6 border-b border-white border-opacity-20 flex-1">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center">
                          <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 mr-3" />
                          <h3 className="text-2xl font-semibold">Basic Membership</h3>
                        </div>
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        </div>
                      </div>
                      
                      <p className="text-white text-opacity-90 mb-8 h-16 text-lg">
                        Join now, decide on preservation later.
                      </p>
                      
                      <div className="border-t border-white border-opacity-20 pt-6 mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-white text-opacity-70 text-lg">Annual Cost:</span>
                          <span className="text-white font-bold text-lg">${getPackagePrice("standard")}/year</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white text-opacity-70 text-lg">Preservation:</span>
                          <span className="text-white font-bold text-lg">Not required</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included Section - Now White with Star List and Explanations */}
                    <div className="bg-white p-8 text-gray-800">
                      <h4 className="font-semibold text-lg mb-6 text-gray-800">What's Included:</h4>
                      
                      <ul className="mb-8 space-y-4">
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Member Events & Resources</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Pet Preservation Options</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Add on Cryopreservation Anytime</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Consultation Services</span>
                        </li>
                      </ul>
                      
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-gray-600">
                          Basic membership with flexibility to upgrade later.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
              <div className="bg-white rounded-lg p-8 mt-8 shadow-sm">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-[#323053] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-gray-700 font-medium">Important Information</p>
                </div>
                <p className="text-gray-600">
                  Your membership pricing is personalized based on your current age ({membershipAge} years). Most members fund their cryopreservation through life insurance policies with manageable monthly premiums. We'll discuss insurance options on the next page.
                </p>
              </div>
          </div>
        )}
        
        {/* Navigation buttons - Updated to match ContactInfoPage styling */}
        <div className="flex justify-between mt-8 mb-6">
          <button
            type="button"
            onClick={handleBackClick}
            className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <button 
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || isLoading || !selectedOption}
            className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg ${
              selectedOption ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } disabled:opacity-70`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                Continue
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Help Panel Component */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={packageHelpContent} 
      />
    </div>
  );
}