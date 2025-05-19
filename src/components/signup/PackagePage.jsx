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
    title: "Pricing Information",
    content: "Membership pricing is personalized based on your age. Members typically fund preservation services through life insurance policies."
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
  const [membershipCost, setMembershipCost] = useState(540);
  const [membershipAge, setMembershipAge] = useState(36);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState("neuro");
  const [selectedPackage, setSelectedPackage] = useState("standard");
  // Add state for help panel
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  // Add new state for dropdowns
  const [expandedFaqs, setExpandedFaqs] = useState({
    pricing: false,
    payment: false
  });

  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Toggle FAQ sections
  const toggleFaq = (section) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
// Plan options and descriptions
const planOptions = {
  neuro: {
    title: "Neuropreservation",
    short: "Preserves brain and neural structures at a lower cost.",
    long: "Preserves the brain's neural connections that define your identity.",
    baseEstimate: 80000,
    icon: (
      <img src={alcorStar} alt="Neuro Icon" className="h-5 w-5" />
    )
  },
  wholebody: {
    title: "Whole Body",
    short: "Preserves your entire body for complete restoration.",
    long: "Complete body preservation for potential full restoration.",
    baseEstimate: 220000,
    icon: (
      <img src={alcorStar} alt="Whole Body Icon" className="h-5 w-5" />
    )
  },
  basic: {
    title: "Basic Membership",
    short: "Join now, decide on your cryopreservation type later.",
    long: "Basic membership with flexibility to upgrade later.",
    baseEstimate: 0,
    icon: (
      <img src={alcorStar} alt="Basic Membership Icon" className="h-5 w-5" />
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
        
        if (result?.success) {
          setMembershipCost(result.membershipCost || 540);
          setMembershipAge(result.age || 36);
        } else {
          setError(result?.error || "Failed to calculate membership cost");
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
      const preservationEstimate = selectedOption === "basic" ? null : planOptions[selectedOption].baseEstimate;
      
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
  
  // Star icon for the checklist - all stars are big
  const StarIcon = () => (
    <img 
      src={alcorStar} 
      alt="Alcor Star" 
      className="w-8 h-8 mr-2 flex-shrink-0" 
    />
  );
  
  return (
    <div className="w-full bg-gray-100" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative'
    }}>
      <div className="w-full mx-auto px-4 sm:px-8 py-8" style={{ maxWidth: "1200px" }}>
        
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-6 md:px-0">
              {/* NEURO OPTION */}
              <div onClick={() => selectOption("neuro")} className="cursor-pointer">
                <div className={`rounded-lg overflow-hidden shadow-md ${selectedOption === "neuro" ? "ring-2 ring-[#775684]" : ""}`}>
                  {/* SELECTED indicator */}
                  <div className="bg-white border-b border-gray-200">
                    {selectedOption === "neuro" && (
                      <div className="text-center py-2">
                        <span className="text-[#775684] px-4 py-1 text-sm font-bold">
                          SELECTED
                        </span>
                      </div>
                    )}
                    {selectedOption !== "neuro" && <div className="h-10"></div>}
                  </div>
                  
                  {/* Card header */}
                  <div className="bg-[#323053] text-white p-6">
                    <div className="flex items-center">
                      <img src={alcorStar} alt="Alcor Star" className="w-5 h-5 mr-3" />
                      <h3 className="text-xl font-semibold">{planOptions.neuro.title}</h3>
                      <div className="ml-auto bg-[#454575] p-2 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mt-6">
                      {planOptions.neuro.short}
                    </p>
                    
                    <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-700">
                      <span className="text-gray-400">Preservation:</span>
                      <span className="font-bold">${calculatePreservationEstimate("neuro")?.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Membership:</span>
                      <span className="font-bold">${getPackagePrice("standard")}/year</span>
                    </div>
                  </div>
                  
                  {/* What's Included */}
                  <div className="bg-white p-6">
                    <h4 className="text-gray-800 mb-4">What's Included:</h4>
                    
                    <div className="space-y-3 pl-4">
                      <div>Standby Service</div>
                      <div>Neural Cryopreservation</div>
                      <div>Long-Term Storage</div>
                      <div>Possible Revival</div>
                    </div>
                    
                    <p className="mt-8 pt-4 border-t border-gray-200 text-gray-600">
                      {planOptions.neuro.long}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* WHOLE BODY OPTION */}
              <div onClick={() => selectOption("wholebody")} className="cursor-pointer">
                <div className={`rounded-lg overflow-hidden shadow-md ${selectedOption === "wholebody" ? "ring-2 ring-[#775684]" : ""}`}>
                  {/* SELECTED indicator */}
                  <div className="bg-white border-b border-gray-200">
                    {selectedOption === "wholebody" && (
                      <div className="text-center py-2">
                        <span className="text-[#775684] px-4 py-1 text-sm font-bold">
                          SELECTED
                        </span>
                      </div>
                    )}
                    {selectedOption !== "wholebody" && <div className="h-10"></div>}
                  </div>
                  
                  {/* Card header */}
                  <div className="bg-[#1a2342] text-white p-6">
                    <div className="flex items-center">
                      <img src={alcorStar} alt="Alcor Star" className="w-5 h-5 mr-3" />
                      <h3 className="text-xl font-semibold">{planOptions.wholebody.title}</h3>
                      <div className="ml-auto bg-[#293253] p-2 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mt-6">
                      {planOptions.wholebody.short}
                    </p>
                    
                    <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-700">
                      <span className="text-gray-400">Preservation:</span>
                      <span className="font-bold">${calculatePreservationEstimate("wholebody")?.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Membership:</span>
                      <span className="font-bold">${getPackagePrice("standard")}/year</span>
                    </div>
                  </div>
                  
                  {/* What's Included */}
                  <div className="bg-white p-6">
                    <h4 className="text-gray-800 mb-4">What's Included:</h4>
                    
                    <div className="space-y-3 pl-4">
                      <div>Standby Service</div>
                      <div>Full Body Cryopreservation</div>
                      <div>Long-Term Storage</div>
                      <div>Possible Revival</div>
                    </div>
                    
                    <p className="mt-8 pt-4 border-t border-gray-200 text-gray-600">
                      {planOptions.wholebody.long}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* BASIC OPTION */}
              <div onClick={() => selectOption("basic")} className="cursor-pointer">
                <div className={`rounded-lg overflow-hidden shadow-md ${selectedOption === "basic" ? "ring-2 ring-[#775684]" : ""}`}>
                  {/* SELECTED indicator */}
                  <div className="bg-white border-b border-gray-200">
                    {selectedOption === "basic" && (
                      <div className="text-center py-2">
                        <span className="text-[#775684] px-4 py-1 text-sm font-bold">
                          SELECTED
                        </span>
                      </div>
                    )}
                    {selectedOption !== "basic" && <div className="h-10"></div>}
                  </div>
                  
                  {/* Card header */}
                  <div className="bg-[#11243a] text-white p-6">
                    <div className="flex items-center">
                      <img src={alcorStar} alt="Alcor Star" className="w-5 h-5 mr-3" />
                      <h3 className="text-xl font-semibold">{planOptions.basic.title}</h3>
                      <div className="ml-auto bg-[#1c324c] p-2 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mt-6">
                      {planOptions.basic.short}
                    </p>
                    
                    <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-700">
                      <span className="text-gray-400">Annual Cost:</span>
                      <span className="font-bold">${getPackagePrice("standard")}/year</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Preservation:</span>
                      <span className="font-bold">Not required</span>
                    </div>
                  </div>
                  
                  {/* What's Included */}
                  <div className="bg-white p-6">
                    <h4 className="text-gray-800 mb-4">What's Included:</h4>
                    
                    <div className="space-y-3 pl-4">
                      <div>Member Events & Resources</div>
                      <div>Pet Preservation Options</div>
                      <div>Add on Cryopreservation Anytime</div>
                      <div>Consultation Services</div>
                    </div>
                    
                    <p className="mt-8 pt-4 border-t border-gray-200 text-gray-600">
                      {planOptions.basic.long}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Important Information Section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-gray-700 font-medium mb-1">Important Information</h4>
                  <p className="text-gray-600">
                    Your membership pricing is personalized based on your current age ({membershipAge} years). Most members fund their cryopreservation through life insurance policies with manageable monthly premiums. We'll discuss insurance options on the next page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 mb-6">
          <button
            type="button"
            onClick={handleBackClick}
            className="py-3 px-6 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm"
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
            className={`py-3 px-6 rounded-full font-medium flex items-center transition-all duration-300 shadow-md hover:shadow-lg ${
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