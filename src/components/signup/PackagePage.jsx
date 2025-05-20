// File: pages/PackagePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateSignupProgress } from "../../services/auth";
import { getMembershipCost } from "../../services/pricing";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";
import HelpPanel from "./HelpPanel";
import { updateSignupProgressAPI } from "../../services/auth";
import { savePackageInfo } from "../../services/package";

// TOGGLE BETWEEN VERSIONS: set to true for the updated design, false for the original
const USE_UPDATED_VERSION = false;

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

export default function PackagePage({ onNext, onBack, initialData = {}, preloadedMembershipData = null }) {
  const navigate = useNavigate();
  const initRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipCost, setMembershipCost] = useState(preloadedMembershipData?.membershipCost || 540);
  const [membershipAge, setMembershipAge] = useState(preloadedMembershipData?.age || 36);
  const [isLoading, setIsLoading] = useState(!preloadedMembershipData);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(initialData.preservationType || "neuro");
  const [selectedPackage, setSelectedPackage] = useState(initialData.packageType || "standard");
  // Add state for help panel
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  // Add new state for dropdowns
  const [expandedFaqs, setExpandedFaqs] = useState({
    pricing: false,
    payment: false
  });
  // Add animation states
  const [contentLoaded, setContentLoaded] = useState(false);

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
      titleBgColor: "bg-[#323053]",
      iconBgColor: "bg-[#454575]",
      icon: (
        <img src={alcorStar} alt="Neuro Icon" className="h-5 w-5" />
      )
    },
    wholebody: {
      title: "Whole Body",
      short: "Preserves your entire body for complete restoration.",
      long: "Complete body preservation for potential full restoration.",
      baseEstimate: 220000,
      titleBgColor: "bg-[#1a2342]",
      iconBgColor: "bg-[#293253]",
      icon: (
        <img src={alcorStar} alt="Whole Body Icon" className="h-5 w-5" />
      )
    },
    basic: {
      title: "Basic Membership",
      short: "Join now, decide on your cryopreservation type later.",
      long: "Basic membership with flexibility to upgrade later.",
      baseEstimate: 0,
      titleBgColor: "bg-[#11243a]",
      iconBgColor: "bg-[#1c324c]",
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
  
  // Fetch membership cost when component mounts or only if not preloaded
  useEffect(() => {
    // Prevent double initialization which causes flickering (for updated version)
    if (USE_UPDATED_VERSION) {
      if (initRef.current) return;
      initRef.current = true;
      
      // Skip fetching if we already have preloaded data
      if (preloadedMembershipData) {
        return;
      }
    }
    
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
        // Set content loaded state after data is fetched
        setTimeout(() => {
          setContentLoaded(true);
        }, 100);
      }
    }
    
    fetchMembershipCost();
  }, [preloadedMembershipData]);
  
  const handleBackClick = () => {
    console.log("PackagePage: Handle back button clicked");
    
    // Set force navigation flags for reliability
    localStorage.setItem('force_active_step', '2'); // 2 = contact step
    localStorage.setItem('force_timestamp', Date.now().toString());
    
    console.log("Setting force navigation to step 2 (contact)");
    
    // Use the onBack prop if provided
    if (onBack) {
      console.log("Using parent onBack handler");
      onBack();
      return;
    }
    
    // Fallback behavior if onBack not provided - with error handling
    console.log("No onBack handler provided, using direct navigation");
    try {
      navigate('/signup/contact', { replace: true });
    } catch (error) {
      console.error("Navigation error:", error);
      // Last resort fallback
      window.location.href = '/signup/contact';
    }
  };
  
  const handleNext = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    console.log("PackagePage: Handle next button clicked");
    
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
      
      // Prepare the data object to pass to the parent component
      const packageData = {
        packageType: selectedPackage,
        packageDetails: {
          cost: finalPrice,
          preservationType: selectedOption,
          preservationEstimate: preservationEstimate,
          basePrice: membershipCost,
          calculatedAt: new Date().toISOString()
        }
      };
      
      // Save package info to backend
      const saveResult = await savePackageInfo(packageData);
      
      if (!saveResult || !saveResult.success) {
        throw new Error("Failed to save package information to backend");
      }
      
      // Update step progress directly via API
      const progressResult = await updateSignupProgressAPI("funding", 4, {
        selectedPackage,
        packageCost: finalPrice,
        calculatedAt: new Date().toISOString(),
        basePrice: membershipCost,
        preservationType: selectedOption,
        estimatedPreservationCost: preservationEstimate
      });
      
      if (!progressResult || !progressResult.success) {
        console.warn("Warning: Failed to update signup progress, but continuing with navigation");
      }
      
      // Set force navigation flags for reliability
      localStorage.setItem('force_active_step', '4'); // 4 = funding step
      localStorage.setItem('force_timestamp', Date.now().toString());
      
      console.log("Setting force navigation to step 4 (funding)");
      
      // Use onNext prop instead of direct navigation
      if (onNext) {
        console.log("Using parent onNext handler");
        return await onNext(packageData);
      }
      
      // Fallback direct navigation if onNext not provided
      console.log("🚀 No onNext handler provided, using direct navigation to funding step");
      
      // Navigation with fallback
      try {
        navigate('/signup/funding', { replace: true });
      } catch (error) {
        console.error("Navigation error:", error);
        // Last resort fallback
        window.location.href = '/signup/funding';
      }
      
      return true;
    } catch (error) {
      console.error("Error in handleNext:", error);
      setIsSubmitting(false);
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
  
  // Get the user-friendly display name of the selected option
  const getSelectedOptionName = () => {
    return selectedOption ? planOptions[selectedOption].title : "None";
  };
  
  // Get the preservation estimate for the summary
  const getPreservationEstimateForSummary = () => {
    const estimate = calculatePreservationEstimate(selectedOption);
    if (estimate) {
      return `$${estimate.toLocaleString()}`;
    }
    return "Not required";
  };
  
  // Function to scroll to options (for updated version)
  const scrollToOptions = () => {
    const optionsContainer = document.getElementById("options-container");
    if (optionsContainer) {
      optionsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  
  // Star icon for the checklist - all stars are big
  const StarIcon = () => (
    <img 
      src={alcorStar} 
      alt="Alcor Star" 
      className="w-8 h-8 mr-2 flex-shrink-0" 
    />
  );
  
  // Show loading indicator
  if (isLoading) {
    return USE_UPDATED_VERSION ? (
      <div className="mt-4">
        <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-[#775684] mr-3"></div>
          <p className="text-gray-600">Calculating membership pricing...</p>
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
        <p className="mt-4 text-xl text-gray-600">Calculating pricing...</p>
      </div>
    );
  }
  
  // Show error message
  if (error) {
    return USE_UPDATED_VERSION ? (
      <div className="mt-4 opacity-0 animate-fadeIn" style={{ animation: "fadeIn 0.5s forwards" }}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
        </div>
      </div>
    ) : (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8 opacity-0 animate-fadeIn" style={{ animation: "fadeIn 0.5s forwards" }}>
        <p className="text-red-700 text-lg">{error}</p>
        <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
      </div>
    );
  }
  
  // Define animation styles for the component
  const fadeInStyle = {
    opacity: contentLoaded ? 1 : 0,
    transform: contentLoaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
  };
  
  // Calculate staggered animation delay
  const getAnimationDelay = (index) => {
    return {
      transitionDelay: `${0.1 + (index * 0.15)}s`
    };
  };
  
  return (
    <div className="w-full bg-gray-100" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative',
      fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
      opacity: 0,
      animation: "fadeIn 0.5s forwards 0.1s"
    }}>
      {/* Main container with appropriate padding based on version */}
      <div className={`w-full mx-auto ${USE_UPDATED_VERSION ? 'px-6 sm:px-8 md:px-12' : 'px-4 sm:px-8'} py-8`} 
           style={{ maxWidth: USE_UPDATED_VERSION ? "1400px" : "1200px" }}>
        <div className="mb-8">
          {USE_UPDATED_VERSION ? (
            // UPDATED VERSION Layout
            <div className="max-w-[80%] sm:max-w-[85%] md:max-w-full mx-auto md:mx-0">
              {/* Cards container - wider cards with increased spacing */}
              <div id="options-container" className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
                {/* NEURO OPTION */}
                <div onClick={() => selectOption("neuro")} className="cursor-pointer transform transition duration-300 hover:scale-[1.02]" style={{...fadeInStyle, ...getAnimationDelay(0)}}>
                  <div className={`rounded-2xl md:rounded-3xl overflow-hidden shadow-md ${selectedOption === "neuro" ? "ring-2 ring-[#775684]" : "ring-1 ring-gray-400"} transition-all duration-300`}>
                    {/* SELECTED indicator */}
                    <div className="bg-white border-b border-gray-200">
                      {selectedOption === "neuro" && (
                        <div className="text-center py-3.5">
                          <span className="text-white px-5 py-1.5 text-base font-black tracking-wider uppercase bg-[#775684] rounded-md animate-fadeInDown">
                            Selected
                          </span>
                        </div>
                      )}
                      {selectedOption !== "neuro" && <div className="h-14"></div>}
                    </div>
                    
                    {/* Card header - INVERTED: top is white, bottom is colored */}
                    <div className="p-0">
                      {/* White section for title and description */}
                      <div className="bg-white p-4 pt-2 pl-2 sm:p-6 sm:pt-3 sm:pl-3 md:p-8 md:pt-4 md:pl-4 text-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-start w-full">
                            <img src={alcorYellowStar} alt="Alcor Star" className="w-12 h-12 mr-1 -mt-1 ml-0 animate-pulse" style={{animationDuration: '3s'}} />
                            <h3 className="text-2xl font-semibold text-gray-900">{planOptions.neuro.title}</h3>
                          </div>
                          <div className={`${planOptions.neuro.iconBgColor} p-3 rounded-md ml-3 flex-shrink-0 transform transition duration-300 hover:rotate-12`}>
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-6">
                          {planOptions.neuro.short}
                        </p>
                      </div>
                      
                      {/* White section for pricing info */}
                      <div className="bg-white p-4 sm:p-6 md:p-8 border-t border-gray-200">
                        <div className="flex justify-between items-center pt-4">
                          <span className="text-gray-700 text-lg">Preservation:</span>
                          <span className="font-bold text-gray-900 text-xl">${calculatePreservationEstimate("neuro")?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-700 text-lg">Membership:</span>
                          <span className="font-bold text-gray-900 text-xl">${getPackagePrice("standard")}/year</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included - with colored background */}
                    <div className={`${planOptions.neuro.titleBgColor} p-4 sm:p-6 md:p-8 border-t border-gray-600`}>
                      <h4 className="text-white text-xl font-semibold mb-5">What's Included:</h4>
                      
                      <div className="space-y-4 pl-4 text-gray-200 text-lg">
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Standby Service</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Neural Cryopreservation</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Long-Term Storage</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Possible Revival</span>
                        </div>
                      </div>
                      
                      <p className="mt-8 pt-4 border-t border-gray-600 text-gray-300 text-lg">
                        {planOptions.neuro.long}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* WHOLE BODY OPTION */}
                <div onClick={() => selectOption("wholebody")} className="cursor-pointer transform transition duration-300 hover:scale-[1.02]" style={{...fadeInStyle, ...getAnimationDelay(1)}}>
                  <div className={`rounded-2xl md:rounded-3xl overflow-hidden shadow-md ${selectedOption === "wholebody" ? "ring-2 ring-[#775684]" : "ring-1 ring-gray-400"} transition-all duration-300`}>
                    {/* SELECTED indicator */}
                    <div className="bg-white border-b border-gray-200">
                      {selectedOption === "wholebody" && (
                        <div className="text-center py-3.5">
                          <span className="text-white px-5 py-1.5 text-base font-black tracking-wider uppercase bg-[#775684] rounded-md animate-fadeInDown">
                            Selected
                          </span>
                        </div>
                      )}
                      {selectedOption !== "wholebody" && <div className="h-14"></div>}
                    </div>
                    
                    {/* Card header - INVERTED: top is white, bottom is colored */}
                    <div className="p-0">
                      {/* White section for title and description */}
                      <div className="bg-white p-4 pt-2 pl-2 sm:p-6 sm:pt-3 sm:pl-3 md:p-8 md:pt-4 md:pl-4 text-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-start w-full">
                            <img src={alcorYellowStar} alt="Alcor Star" className="w-12 h-12 mr-1 -mt-1 ml-0 animate-pulse" style={{animationDuration: '3s'}} />
                            <h3 className="text-2xl font-semibold text-gray-900">{planOptions.wholebody.title}</h3>
                          </div>
                          <div className={`${planOptions.wholebody.iconBgColor} p-3 rounded-md ml-3 flex-shrink-0 transform transition duration-300 hover:rotate-12`}>
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-6">
                          {planOptions.wholebody.short}
                        </p>
                      </div>
                      
                      {/* White section for pricing info */}
                      <div className="bg-white p-4 sm:p-6 md:p-8 border-t border-gray-200">
                        <div className="flex justify-between items-center pt-4">
                          <span className="text-gray-700 text-lg">Preservation:</span>
                          <span className="font-bold text-gray-900 text-xl">${calculatePreservationEstimate("wholebody")?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-700 text-lg">Membership:</span>
                          <span className="font-bold text-gray-900 text-xl">${getPackagePrice("standard")}/year</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included - with colored background */}
                    <div className={`${planOptions.wholebody.titleBgColor} p-4 sm:p-6 md:p-8 border-t border-gray-600`}>
                      <h4 className="text-white text-xl font-semibold mb-5">What's Included:</h4>
                      
                      <div className="space-y-4 pl-4 text-gray-200 text-lg">
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Standby Service</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Full Body Cryopreservation</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Long-Term Storage</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Possible Revival</span>
                        </div>
                      </div>
                      
                      <p className="mt-8 pt-4 border-t border-gray-600 text-gray-300 text-lg">
                        {planOptions.wholebody.long}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* BASIC OPTION */}
                <div onClick={() => selectOption("basic")} className="cursor-pointer transform transition duration-300 hover:scale-[1.02]" style={{...fadeInStyle, ...getAnimationDelay(2)}}>
                  <div className={`rounded-2xl md:rounded-3xl overflow-hidden shadow-md ${selectedOption === "basic" ? "ring-2 ring-[#775684]" : "ring-1 ring-gray-400"} transition-all duration-300`}>
                    {/* SELECTED indicator */}
                    <div className="bg-white border-b border-gray-200">
                      {selectedOption === "basic" && (
                        <div className="text-center py-3.5">
                          <span className="text-white px-5 py-1.5 text-base font-black tracking-wider uppercase bg-[#775684] rounded-md animate-fadeInDown">
                            Selected
                          </span>
                        </div>
                      )}
                      {selectedOption !== "basic" && <div className="h-14"></div>}
                    </div>
                    
                    {/* Card header - INVERTED: top is white, bottom is colored */}
                    <div className="p-0">
                      {/* White section for title and description */}
                      <div className="bg-white p-4 pt-2 pl-2 sm:p-6 sm:pt-3 sm:pl-3 md:p-8 md:pt-4 md:pl-4 text-gray-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-start w-full">
                            <img src={alcorYellowStar} alt="Alcor Star" className="w-12 h-12 mr-1 -mt-1 ml-0 animate-pulse" style={{animationDuration: '3s'}} />
                            <h3 className="text-2xl font-semibold text-gray-900">{planOptions.basic.title}</h3>
                          </div>
                          <div className={`${planOptions.basic.iconBgColor} p-3 rounded-md ml-3 flex-shrink-0 transform transition duration-300 hover:rotate-12`}>
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-6">
                          {planOptions.basic.short}
                        </p>
                      </div>
                      
                      {/* White section for pricing info */}
                      <div className="bg-white p-4 sm:p-6 md:p-8 border-t border-gray-200">
                        <div className="flex justify-between items-center pt-4">
                          <span className="text-gray-700 text-lg">Annual Cost:</span>
                          <span className="font-bold text-gray-900 text-xl">${getPackagePrice("standard")}/year</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-700 text-lg">Preservation:</span>
                          <span className="font-bold text-gray-900 text-xl">Not required</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included - with colored background */}
                    <div className={`${planOptions.basic.titleBgColor} p-4 sm:p-6 md:p-8 border-t border-gray-600`}>
                      <h4 className="text-white text-xl font-semibold mb-5">What's Included:</h4>
                      
                      <div className="space-y-4 pl-4 text-gray-200 text-lg">
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Member Events & Resources</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Pet Preservation Options</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Add on Cryopreservation Anytime</span>
                        </div>
                        <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                          <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                          <span>Consultation Services</span>
                        </div>
                      </div>
                      
                      <p className="mt-8 pt-4 border-t border-gray-600 text-gray-300 text-lg">
                        {planOptions.basic.long}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Selection Summary Section - only visible on mobile */}
              <div className="mt-5 p-4 sm:p-6 bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm md:hidden transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(3)}}>
                <div className="flex flex-col">
                  <h4 className="text-gray-800 font-bold text-lg mb-3">Your Selection</h4>
                  
                  <div className="flex items-center">
                    {/* Dynamic icon matching the selected card */}
                    <div className={`p-2 rounded-full mr-3 ${
                      selectedOption === "neuro" ? planOptions.neuro.iconBgColor : 
                      selectedOption === "wholebody" ? planOptions.wholebody.iconBgColor : 
                      planOptions.basic.iconBgColor
                    }`}>
                      {/* Display the icon based on the selected card */}
                      {selectedOption === "neuro" && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                      {selectedOption === "wholebody" && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {selectedOption === "basic" && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium text-lg">{getSelectedOptionName()}</span>
                  </div>
                  
                  {/* Price Summary */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <h5 className="text-gray-700 font-medium mb-2">Price Summary</h5>
                    <div className="space-y-2">
                      {/* Annual Membership Fee */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Annual Membership:</span>
                        <span className="font-medium">${getPackagePrice("standard")}/year</span>
                      </div>
                      
                      {/* Preservation Cost (if applicable) */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Preservation Cost:</span>
                        <span className="font-medium">{getPreservationEstimateForSummary()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Change selection button */}
                  <div className="mt-4 pt-2">
                    <button 
                      onClick={scrollToOptions}
                      className="text-[#775684] font-medium text-sm hover:underline focus:outline-none flex items-center transition-transform duration-300 hover:translate-y-[-2px]"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      Change my selection
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Important Information Section */}
              <div className="mt-5 p-4 sm:p-6 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-200 transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(4)}}>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mr-2 flex-shrink-0 mt-0.5 animate-bounce" style={{animationDuration: '2s'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-gray-700 font-medium mb-1">Important Information</h4>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Your membership pricing is personalized based on your current age ({membershipAge} years). Most members fund their cryopreservation through life insurance policies with manageable monthly premiums. We'll discuss insurance options on the next page.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons - with improved navigation handling */}
              <div className="flex justify-between mt-8 mb-6 transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(5)}}>
                <button
                  type="button"
                  onClick={handleBackClick}
                  className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md hover:translate-x-[-2px]"
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
                  className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg hover:translate-x-[2px] ${
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
          ) : (
            // ORIGINAL VERSION Layout
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 sm:px-12 md:px-0">
              {/* NEURO OPTION */}
              <div onClick={() => selectOption("neuro")} className="cursor-pointer" style={{...fadeInStyle, ...getAnimationDelay(0)}}>
                <div className={`rounded-lg overflow-hidden shadow-md ${selectedOption === "neuro" ? "ring-2 ring-[#775684]" : ""} transition-all duration-300 hover:shadow-lg transform hover:scale-[1.01]`} style={{ height: "830px" }}>
                  {/* SELECTED indicator */}
                  <div className="bg-white border-b border-gray-200" style={{ height: "60px" }}>
                    {selectedOption === "neuro" && (
                      <div className="text-center py-3.5">
                        <span className="text-[#775684] px-6 py-1.5 text-base font-bold tracking-wide animate-fadeInDown">
                          SELECTED
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card header with colored background that extends only to "What's Included" */}
                  <div className="bg-[#323053] text-white p-7 pl-5" style={{ height: "380px" }}>
                    {/* Header content */}
                    <div className="flex items-center">
                      <img src={alcorYellowStar} alt="Alcor Star" className="w-8 h-8 mr-2 animate-pulse" style={{animationDuration: '3s'}} />
                      <h3 className="text-2xl font-bold">{planOptions.neuro.title}</h3>
                      <div className="ml-auto bg-[#454575] p-3 rounded-full transform transition duration-300 hover:rotate-12">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mt-8 text-xl mb-10">
                      {planOptions.neuro.short}
                    </p>
                    
                    <div className="flex justify-between items-center mt-10 pt-5 border-t border-gray-700">
                      <span className="text-gray-400 text-xl">Preservation:</span>
                      <span className="font-bold text-2xl">${calculatePreservationEstimate("neuro")?.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 mb-8">
                      <span className="text-gray-400 text-xl">Membership:</span>
                      <span className="font-bold text-2xl">${getPackagePrice("standard")}/year</span>
                    </div>
                  </div>
                  
                  {/* What's Included section with white background */}
                  <div className="bg-white p-7" style={{ height: "390px" }}>
                    <h4 className="text-gray-800 mb-6 text-xl font-semibold">What's Included:</h4>
                    
                    <div className="space-y-6 pl-5 text-lg text-gray-700" style={{ minHeight: "240px" }}>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Standby Service</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Neural Cryopreservation</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Long-Term Storage</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Possible Revival</span>
                      </div>
                      
                      <p className="text-gray-600 text-lg pt-4 mt-2 border-t border-gray-200">
                        {planOptions.neuro.long}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WHOLE BODY OPTION */}
              <div onClick={() => selectOption("wholebody")} className="cursor-pointer" style={{...fadeInStyle, ...getAnimationDelay(1)}}>
                <div className={`rounded-lg overflow-hidden shadow-md ${selectedOption === "wholebody" ? "ring-2 ring-[#775684]" : ""} transition-all duration-300 hover:shadow-lg transform hover:scale-[1.01]`} style={{ height: "830px" }}>
                  {/* SELECTED indicator */}
                  <div className="bg-white border-b border-gray-200" style={{ height: "60px" }}>
                    {selectedOption === "wholebody" && (
                      <div className="text-center py-3.5">
                        <span className="text-[#775684] px-6 py-1.5 text-base font-bold tracking-wide animate-fadeInDown">
                          SELECTED
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card header with colored background that extends only to "What's Included" */}
                  <div className="bg-[#1a2342] text-white p-7 pl-5" style={{ height: "380px" }}>
                    {/* Header content */}
                    <div className="flex items-center">
                      <img src={alcorYellowStar} alt="Alcor Star" className="w-8 h-8 mr-2 animate-pulse" style={{animationDuration: '3s'}} />
                      <h3 className="text-2xl font-bold">{planOptions.wholebody.title}</h3>
                      <div className="ml-auto bg-[#293253] p-3 rounded-full transform transition duration-300 hover:rotate-12">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mt-8 text-xl mb-10">
                      {planOptions.wholebody.short}
                    </p>
                    
                    <div className="flex justify-between items-center mt-10 pt-5 border-t border-gray-700">
                      <span className="text-gray-400 text-xl">Preservation:</span>
                      <span className="font-bold text-2xl">${calculatePreservationEstimate("wholebody")?.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 mb-8">
                      <span className="text-gray-400 text-xl">Membership:</span>
                      <span className="font-bold text-2xl">${getPackagePrice("standard")}/year</span>
                    </div>
                  </div>
                  
                  {/* What's Included section with white background */}
                  <div className="bg-white p-7" style={{ height: "390px" }}>
                    <h4 className="text-gray-800 mb-6 text-xl font-semibold">What's Included:</h4>
                    
                    <div className="space-y-6 pl-5 text-lg text-gray-700" style={{ minHeight: "240px" }}>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Standby Service</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Full Body Cryopreservation</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Long-Term Storage</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Possible Revival</span>
                      </div>
                      
                      <p className="text-gray-600 text-lg pt-4 mt-2 border-t border-gray-200">
                        {planOptions.wholebody.long}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* BASIC OPTION */}
              <div onClick={() => selectOption("basic")} className="cursor-pointer" style={{...fadeInStyle, ...getAnimationDelay(2)}}>
                <div className={`rounded-lg overflow-hidden shadow-md ${selectedOption === "basic" ? "ring-2 ring-[#775684]" : ""} transition-all duration-300 hover:shadow-lg transform hover:scale-[1.01]`} style={{ height: "830px" }}>
                  {/* SELECTED indicator */}
                  <div className="bg-white border-b border-gray-200" style={{ height: "60px" }}>
                    {selectedOption === "basic" && (
                      <div className="text-center py-3.5">
                        <span className="text-[#775684] px-6 py-1.5 text-base font-bold tracking-wide animate-fadeInDown">
                          SELECTED
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card header with colored background that extends only to "What's Included" */}
                  <div className="bg-[#11243a] text-white p-7 pl-5" style={{ height: "380px" }}>
                    {/* Header content */}
                    <div className="flex items-center">
                      <img src={alcorYellowStar} alt="Alcor Star" className="w-8 h-8 mr-2 animate-pulse" style={{animationDuration: '3s'}} />
                      <h3 className="text-2xl font-bold">{planOptions.basic.title}</h3>
                      <div className="ml-auto bg-[#1c324c] p-3 rounded-full transform transition duration-300 hover:rotate-12">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mt-8 text-xl mb-10">
                      {planOptions.basic.short}
                    </p>
                    
                    <div className="flex justify-between items-center mt-10 pt-5 border-t border-gray-700">
                      <span className="text-gray-400 text-xl">Annual Cost:</span>
                      <span className="font-bold text-2xl">${getPackagePrice("standard")}/year</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 mb-8">
                      <span className="text-gray-400 text-xl">Preservation:</span>
                      <span className="font-bold text-2xl">Not required</span>
                    </div>
                  </div>
                  
                  {/* What's Included section with white background */}
                  <div className="bg-white p-7" style={{ height: "390px" }}>
                    <h4 className="text-gray-800 mb-6 text-xl font-semibold">What's Included:</h4>
                    
                    <div className="space-y-6 pl-5 text-lg text-gray-700" style={{ minHeight: "240px" }}>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Member Events & Resources</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Pet Preservation Options</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Add on Cryopreservation Anytime</span>
                      </div>
                      <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                        <img src={alcorYellowStar} alt="Star" className="w-4 h-4 mr-2 mt-1.5" />
                        <span>Consultation Services</span>
                      </div>
                      
                      <p className="text-gray-600 text-lg pt-4 mt-2 border-t border-gray-200">
                        {planOptions.basic.long}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Important Information Section - Only shown in original version */}
          {!USE_UPDATED_VERSION && (
            <>
              {/* Mobile Selection Summary Section - only visible on mobile */}
              <div className="mt-8 p-5 bg-white rounded-lg border border-gray-200 shadow-sm md:hidden mx-8 sm:mx-12 md:mx-0 transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(3)}}>
                <div className="flex flex-col">
                  <h4 className="text-gray-800 font-bold text-xl mb-3">Your Selection</h4>
                  
                  <div className="flex items-center">
                    {/* Dynamic icon matching the selected card */}
                    <div className={`p-3 rounded-full mr-3 ${
                      selectedOption === "neuro" ? planOptions.neuro.iconBgColor : 
                      selectedOption === "wholebody" ? planOptions.wholebody.iconBgColor : 
                      planOptions.basic.iconBgColor
                    }`}>
                      {/* Display the icon based on the selected card */}
                      {selectedOption === "neuro" && (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                      {selectedOption === "wholebody" && (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {selectedOption === "basic" && (
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-700 font-semibold text-xl">{getSelectedOptionName()}</span>
                  </div>
                  
                  {/* Price Summary */}
                  <div className="mt-5 border-t border-gray-200 pt-4">
                    <h5 className="text-gray-700 font-medium mb-3 text-lg">Price Summary</h5>
                    <div className="space-y-3">
                      {/* Annual Membership Fee */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-lg">Annual Membership:</span>
                        <span className="font-medium text-lg">${getPackagePrice("standard")}/year</span>
                      </div>
                      
                      {/* Preservation Cost (if applicable) */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-lg">Preservation Cost:</span>
                        <span className="font-medium text-lg">{getPreservationEstimateForSummary()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Change selection button */}
                  <div className="mt-5 pt-2">
                    <button 
                      onClick={() => {
                        // Scroll to top of page smoothly
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[#775684] font-medium hover:underline focus:outline-none flex items-center transition-transform duration-300 hover:translate-y-[-2px]"
                    >
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      Change my selection
                    </button>
                  </div>
                </div>
              </div>
            
              {/* Important Information Section */}
              <div className="mt-8 p-5 bg-gray-50 rounded-lg border border-gray-200 mx-8 sm:mx-12 md:mx-0 transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(4)}}>
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600 mr-3 flex-shrink-0 mt-0.5 animate-bounce" style={{animationDuration: '2s'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-gray-700 font-medium mb-2 text-xl">Important Information</h4>
                    <p className="text-gray-600 text-lg">
                      Your membership pricing is personalized based on your current age ({membershipAge} years). Most members fund their cryopreservation through life insurance policies with manageable monthly premiums. We'll discuss insurance options on the next page.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Navigation buttons - Only shown in original version */}
        {!USE_UPDATED_VERSION && (
          <div className="flex justify-between mt-8 mb-6 transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(5)}}>
            <button
              type="button"
              onClick={handleBackClick}
              className="py-4 px-8 border border-gray-300 rounded-full text-gray-700 font-medium text-lg flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md hover:translate-x-[-2px]"
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            
            <button 
              type="button"
              onClick={handleNext}
              disabled={isSubmitting || isLoading || !selectedOption}
              className={`py-4 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg hover:translate-x-[2px] ${
                selectedOption ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } disabled:opacity-70`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
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

// Add global CSS animations
const globalStyles = document.createElement('style');
globalStyles.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out forwards;
  }
  
  .animate-fadeInDown {
    animation: fadeInDown 0.3s ease-in-out forwards;
  }
`;
document.head.appendChild(globalStyles);