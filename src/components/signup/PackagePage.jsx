// File: pages/PackagePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateSignupProgress } from "../../services/auth";
import { getMembershipCost } from "../../services/pricing";
import alcorStar from "../../assets/images/alcor-yellow-star.png"; // Yellow star
import HelpPanel from "./HelpPanel";
// Import the new image files
import bodyImage from "../../assets/images/body.png";
import brainImage from "../../assets/images/braintop.png";
import memberImage from "../../assets/images/member.png";

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
  const [membershipCost, setMembershipCost] = useState(null);
  const [membershipAge, setMembershipAge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState("standard"); // Added missing state variable
  // Add state for help panel
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  // Add new state for dropdowns
  const [expandedFaqs, setExpandedFaqs] = useState({
    pricing: false,
    payment: false
  });
  
  // Toggle function for help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prevState => !prevState);
  };
  
  // Toggle function for FAQ dropdowns
  const toggleFaq = (faqId) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };
  // Plan options and descriptions
  const planOptions = {
    neuro: {
      title: "Membership + Neuropreservation",
      short: "Preservation of the brain and supporting structures",
      long: "Neuropreservation focuses on the brain and neural structures, preserving the critical elements that contain your memories, personality, and consciousness. This option requires less resources and offers a more affordable approach to cryopreservation.",
      baseEstimate: 80000,
      icon: (
        <img src={brainImage} alt="Brain" className="h-10 w-10" />
      )
    },
    wholebody: {
      title: "Membership + Whole Body Preservation",
      short: "Complete preservation of the entire human body",
      long: "Whole Body preservation involves cryopreserving your entire body, maintaining all organs and systems intact. This comprehensive approach preserves not only neural structures but all biological systems, offering the possibility of complete restoration in the future.",
      baseEstimate: 200000,
      icon: (
        <img src={bodyImage} alt="Body" className="h-10 w-10" />
      )
    },
    basic: {
      title: "Basic Membership Only",
      short: "Become a member now, decide on cryopreservation later",
      long: "Basic membership gives you priority access to our services and locks in today's rates for future preservation options. You can add a cryopreservation contract at any time in the future when you're ready.",
      baseEstimate: 0,
      icon: (
        <img src={memberImage} alt="Member" className="h-10 w-10" />
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
    if (!optionType || !membershipAge || optionType === "basic") return null;
    
    // Use fixed values instead of calculation
    if (optionType === "wholebody") return 220000;
    if (optionType === "neuro") return 90000;
    
    return null;
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
              <div onClick={() => selectOption("neuro")} className={`cursor-pointer h-full`}>
                <div className={`rounded-lg overflow-hidden h-full flex flex-col shadow-md ${selectedOption === "neuro" ? "border border-[#65417c]" : "border-2 border-transparent"}`}>
                  {/* SELECTED indicator that is always there but only visible when selected */}
                  <div className="h-12 w-full bg-white flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-sm font-bold text-sm tracking-widest ${selectedOption === "neuro" ? "bg-[#65417c] text-white" : "text-transparent"}`}>
                      SELECTED
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {/* Header with icon on left and title */}
                    <div className="bg-white p-6 flex items-center">
                      <div className="bg-[#2c3253] p-4 rounded-lg mr-4" style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={brainImage} alt="Brain" className="max-w-[80%] max-h-[80%] object-contain" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800">Neuropreservation</h3>
                    </div>
                    
                    {/* All content in white sections */}
                    <div className="bg-white p-6 border-t border-gray-200">
                      <p className="text-gray-700 text-lg mb-6">
                        Preserves brain and neural structures at a lower cost.
                      </p>
                      
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600 text-lg">Preservation:</span>
                          <span className="text-[#49355B] font-bold text-lg">${calculatePreservationEstimate("neuro")?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-lg">Membership:</span>
                          <span className="text-[#49355B] font-bold text-lg">${getPackagePrice("standard")}/year</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included Section - White with Star List - Reduced spacing */}
                    <div className="bg-white p-4 text-gray-800 flex-grow border-t border-gray-200">
                      <h4 className="font-semibold text-lg mb-3 text-gray-800">What's Included:</h4>
                      
                      <ul className="mb-4 space-y-2">
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
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WHOLE BODY OPTION */}
              <div onClick={() => selectOption("wholebody")} className={`cursor-pointer h-full`}>
                <div className={`rounded-lg overflow-hidden h-full flex flex-col shadow-md ${selectedOption === "wholebody" ? "border border-[#65417c]" : "border-2 border-transparent"}`}>
                  {/* SELECTED indicator that is always there but only visible when selected */}
                  <div className="h-12 w-full bg-white flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-sm font-bold text-sm tracking-widest ${selectedOption === "wholebody" ? "bg-[#65417c] text-white" : "text-transparent"}`}>
                      SELECTED
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {/* Header with icon on left and title */}
                    <div className="bg-white p-6 flex items-center">
                      <div className="bg-[#2c3253] p-4 rounded-lg mr-4" style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={bodyImage} alt="Body" className="max-w-[80%] max-h-[80%] object-contain" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800">Whole Body</h3>
                    </div>
                    
                    {/* All content in white sections */}
                    <div className="bg-white p-6 border-t border-gray-200">
                      <p className="text-gray-700 text-lg mb-6">
                        Preserves your entire body for complete restoration.
                      </p>
                      
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600 text-lg">Preservation:</span>
                          <span className="text-[#2D3050] font-bold text-lg">${calculatePreservationEstimate("wholebody")?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-lg">Membership:</span>
                          <span className="text-[#2D3050] font-bold text-lg">${getPackagePrice("standard")}/year</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included Section - White with Star List - Reduced spacing */}
                    <div className="bg-white p-4 text-gray-800 flex-grow border-t border-gray-200">
                      <h4 className="font-semibold text-lg mb-3 text-gray-800">What's Included:</h4>
                      
                      <ul className="mb-4 space-y-2">
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
                    </div>
                  </div>
                </div>
              </div>
              
              {/* BASIC OPTION */}
              <div onClick={() => selectOption("basic")} className={`cursor-pointer h-full`}>
                <div className={`rounded-lg overflow-hidden h-full flex flex-col shadow-md ${selectedOption === "basic" ? "border border-[#65417c]" : "border-2 border-transparent"}`}>
                  {/* SELECTED indicator that is always there but only visible when selected */}
                  <div className="h-12 w-full bg-white flex items-center justify-center">
                    <span className={`px-3 py-1 rounded-sm font-bold text-sm tracking-widest ${selectedOption === "basic" ? "bg-[#65417c] text-white" : "text-transparent"}`}>
                      SELECTED
                    </span>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    {/* Header with icon on left and title */}
                    <div className="bg-white p-6 flex items-center">
                      <div className="bg-[#2c3253] p-4 rounded-lg mr-4" style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={memberImage} alt="Member" className="max-w-[80%] max-h-[80%] object-contain" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-800">Basic Membership</h3>
                    </div>
                    
                    {/* All content in white sections */}
                    <div className="bg-white p-6 border-t border-gray-200">
                      <p className="text-gray-700 text-lg mb-6">
                        Join now, decide on preservation later.
                      </p>
                      
                      <div className="pt-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600 text-lg">Annual Cost:</span>
                          <span className="text-[#13233e] font-bold text-lg">${getPackagePrice("standard")}/year</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-lg">Preservation:</span>
                          <span className="text-[#13233e] font-bold text-lg">Not required</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* What's Included Section - White with Star List - Reduced spacing */}
                    <div className="bg-white p-4 text-gray-800 flex-grow border-t border-gray-200">
                      <h4 className="font-semibold text-lg mb-3 text-gray-800">What's Included:</h4>
                      
                      <ul className="mb-4 space-y-2">
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Member Events & Resources</span>
                        </li>
                        <li className="flex items-center">
                          <StarIcon />
                          <span className="text-gray-800 text-lg">Pet Suspension Available</span>
                        </li>
                        {/* Empty li elements to maintain consistent height */}
                        <li className="opacity-0 h-[28px]"></li>
                        <li className="opacity-0 h-[28px]"></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
              {/* FAQ Dropdown Sections */}
              <div className="bg-white rounded-lg shadow-md mt-8 overflow-hidden">
                {/* FAQ Section Title with Stars */}
                <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 mr-3" />
                    <h3 className="text-xl font-semibold text-[#323053]">Cost Information</h3>
                    <img src={alcorStar} alt="Alcor Star" className="w-6 h-6 ml-3" />
                  </div>
                  
                  <div 
                    className="bg-[#775684] rounded-full p-1 cursor-pointer hover:bg-[#664573] transition-colors" 
                    onClick={toggleHelpInfo}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                {/* Pricing FAQ Item */}
                <div className="border-b border-gray-200">
                  <button 
                    onClick={() => toggleFaq('pricing')} 
                    className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-[#775684] p-2 rounded-md mr-4 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800">How is membership price calculated?</h4>
                      <img src={alcorStar} alt="Alcor Star" className="w-5 h-5 ml-3" />
                    </div>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 text-gray-500 transition-transform ${expandedFaqs.pricing ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Pricing FAQ Content - Expandable */}
                  <div 
                    className={`px-5 py-4 bg-gray-50 transition-all duration-300 ${
                      expandedFaqs.pricing ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden py-0'
                    }`}
                  >
                    <div className="flex flex-col pl-12 relative">
                      <img src={alcorStar} alt="Alcor Star" className="absolute top-0 right-0 w-6 h-6 opacity-50" />
                      <span className="text-lg text-gray-700">Your membership pricing is personalized based on your current age:</span>
                      <span className="text-2xl font-bold text-[#65417c] mt-2">3 years</span>
                      <img src={alcorStar} alt="Alcor Star" className="absolute bottom-0 left-0 w-5 h-5 opacity-30 -ml-8" />
                    </div>
                  </div>
                </div>
                
                {/* Payment FAQ Item */}
                <div>
                  <button 
                    onClick={() => toggleFaq('payment')} 
                    className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-[#775684] p-2 rounded-md mr-4 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800">How do members pay for cryopreservation?</h4>
                      <img src={alcorStar} alt="Alcor Star" className="w-5 h-5 ml-3" />
                    </div>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 text-gray-500 transition-transform ${expandedFaqs.payment ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Payment FAQ Content - Expandable */}
                  <div 
                    className={`px-5 py-4 bg-gray-50 transition-all duration-300 ${
                      expandedFaqs.payment ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden py-0'
                    }`}
                  >
                    <div className="pl-12 space-y-3 relative">
                      <img src={alcorStar} alt="Alcor Star" className="absolute top-0 right-0 w-6 h-6 opacity-50" />
                      <p className="text-lg text-gray-800 font-bold">
                        Most members fund their cryopreservation through life insurance policies with manageable monthly premiums.
                      </p>
                      
                      <p className="text-lg text-[#65417c] font-bold">
                        We'll discuss insurance options on the next page.
                      </p>
                      <img src={alcorStar} alt="Alcor Star" className="absolute bottom-0 left-0 w-5 h-5 opacity-30 -ml-8" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Summary of Selection - with stars */}
              <div className="bg-[#212b47] text-white rounded-lg p-8 mt-6 shadow-md relative overflow-hidden">
                <img src={alcorStar} alt="Alcor Star" className="absolute top-4 right-4 w-8 h-8 opacity-30" />
                <img src={alcorStar} alt="Alcor Star" className="absolute bottom-4 left-4 w-8 h-8 opacity-30" />
                <img src={alcorStar} alt="Alcor Star" className="absolute top-1/2 left-1/3 w-6 h-6 opacity-20" />
                <img src={alcorStar} alt="Alcor Star" className="absolute bottom-1/3 right-1/4 w-5 h-5 opacity-20" />
                
                <div className="flex items-center mb-6">
                  <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 mr-3" />
                  <h3 className="text-2xl font-semibold text-white">Your Selection Summary</h3>
                  <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 ml-3" />
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 bg-white/10 p-6 rounded-lg relative">
                    <img src={alcorStar} alt="Alcor Star" className="absolute top-3 right-3 w-5 h-5 opacity-30" />
                    <h4 className="text-xl font-medium text-white mb-3">Selected Package</h4>
                    <p className="text-3xl font-bold text-white mb-2">
                      {selectedOption === "wholebody" ? "Whole Body Preservation" : 
                       selectedOption === "neuro" ? "Neuropreservation" : 
                       "Basic Membership"}
                    </p>
                    <p className="text-xl text-white/80">
                      {selectedOption === "wholebody" ? "Complete body preservation for potential full restoration" : 
                       selectedOption === "neuro" ? "Preservation of brain and neural structures" : 
                       "Basic membership with pet preservation options"}
                    </p>
                  </div>
                  
                  <div className="flex-1 bg-white/10 p-6 rounded-lg relative">
                    <img src={alcorStar} alt="Alcor Star" className="absolute top-3 right-3 w-5 h-5 opacity-30" />
                    <h4 className="text-xl font-medium text-white mb-3">Estimated Costs</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl text-white/80">Preservation:</span>
                        <span className="text-2xl font-bold text-white">
                          {selectedOption === "wholebody" ? "$220,000" : 
                           selectedOption === "neuro" ? "$90,000" : 
                           "Not included"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xl text-white/80">Annual Membership:</span>
                        <span className="text-2xl font-bold text-white">${getPackagePrice("standard")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            disabled={isSubmitting || isLoading || !selectedOption}
            className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg ${
              selectedOption ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Processing..." : "Continue"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Use the imported HelpPanel component */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={packageHelpContent} 
      />
    </div>
  );
}