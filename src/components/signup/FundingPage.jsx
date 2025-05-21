// File: pages/FundingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../contexts/UserContext";
import HelpPanel from "./HelpPanel";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import alcorStarSelected from "../../assets/images/alcor-star.png";

// Import the icons for funding options
import insuranceImage from "../../assets/images/policy-purple.png";
import prepayImage from "../../assets/images/bank-purple.png";
import laterImage from "../../assets/images/decision-tree-purple.png";

// Import funding service
import fundingService from "../../services/funding";

// Define help content
const fundingHelpContent = [
 {
   title: "Funding Options",
   content: "Select how you'd like to fund your membership. We offer various options to meet your preferences."
 },
 {
   title: "Life Insurance",
   content: "Most members fund their preservation through life insurance policies. This provides affordable monthly payments and ensures full coverage."
 },
 {
   title: "Prepayment",
   content: "Direct prepayment is available for those who prefer to pay the full amount upfront."
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

const setForceNavigation = (stepIndex) => {
  console.log(`Setting force navigation to step ${stepIndex}`);
  localStorage.setItem('force_active_step', stepIndex.toString());
  localStorage.setItem('force_timestamp', Date.now().toString());
  
  // Add debug output
  console.log("Force navigation set:", {
    step: localStorage.getItem('force_active_step'),
    timestamp: localStorage.getItem('force_timestamp')
  });
};

export default function FundingPage({ initialData, onBack, onNext }) {
 const navigate = useNavigate();
 const { user } = useUser();
 
 const [showHelpInfo, setShowHelpInfo] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [selectedOption, setSelectedOption] = useState(initialData?.fundingMethod || "insurance");
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [packageInfo, setPackageInfo] = useState(null);
 const [dropdownOpen, setDropdownOpen] = useState(false);
 const [animationComplete, setAnimationComplete] = useState(false);
 
 // Add state for insurance sub-option
 const [insuranceSubOption, setInsuranceSubOption] = useState(initialData?.insuranceSubOption || "existing");
 
 // Add state for policy details
 const [policyDetails, setPolicyDetails] = useState({
   policyNumber: initialData?.policyNumber || "",
   insuranceCompany: initialData?.insuranceCompany || "",
   coverageAmount: initialData?.coverageAmount || ""
 });
 
 // Add state for expandable FAQs and resources
 const [expandedFaqs, setExpandedFaqs] = useState({
   insurance: false,
   prepay: false
 });
 
 // Add state for policy resources dropdown
 const [policyResourcesExpanded, setPolicyResourcesExpanded] = useState(false);
 
 // Load package info when component mounts
 useEffect(() => {
   const loadPackageInfo = async () => {
     try {
       setIsLoading(true);
       setError(null);
       
       // If initialData is provided, use it instead of fetching
       if (initialData && initialData.packageType && initialData.preservationType) {
         setPackageInfo({
           packageType: initialData.packageType,
           preservationType: initialData.preservationType,
           preservationEstimate: initialData.preservationEstimate,
           annualCost: initialData.annualCost
         });
         
         // Set default funding method based on preservation type
         if (initialData.preservationType === 'basic' && selectedOption === 'insurance') {
           setSelectedOption('later'); // Default to "later" for basic membership
         }
       } else {
         // Fetch package info from backend
         const result = await fundingService.getPackageInfoForFunding();
         
         if (result.success) {
           setPackageInfo({
             packageType: result.packageType,
             preservationType: result.preservationType,
             preservationEstimate: result.preservationEstimate,
             annualCost: result.annualCost
           });
           
           // Set default funding method based on preservation type
           if (result.preservationType === 'basic' && selectedOption === 'insurance') {
             setSelectedOption('later'); // Default to "later" for basic membership
           }
         } else {
           setError("Failed to load package information. Please go back and try again.");
         }
       }
     } catch (err) {
       console.error("Error loading package info:", err);
       setError("An error occurred while loading your package information. Please try again.");
     } finally {
       setIsLoading(false);
       // Set animation to start once loading is complete
       setTimeout(() => {
         setAnimationComplete(true);
       }, 100);
     }
   };
   
   loadPackageInfo();
 }, [initialData]);
 
 // Toggle function for FAQ dropdowns
 const toggleFaq = (faqId) => {
   setExpandedFaqs(prev => ({
     ...prev,
     [faqId]: !prev[faqId]
   }));
 };
 
 // Toggle policy resources dropdown
 const togglePolicyResources = () => {
   setPolicyResourcesExpanded(prev => !prev);
 };
 
 // Toggle help panel
 const toggleHelpInfo = () => {
   setShowHelpInfo(prev => !prev);
 };
 
 // Handler for selecting an option
 const selectOption = (option) => {
   setSelectedOption(option);
 };
 
 // Handler for selecting insurance sub-option
 const selectInsuranceSubOption = (subOption) => {
   setInsuranceSubOption(subOption);
   setDropdownOpen(false);
 };
 
 // Toggle the dropdown
 const toggleDropdown = () => {
   setDropdownOpen(prev => !prev);
 };
 
 // Handler for policy detail changes
 const handlePolicyDetailChange = (e) => {
   const { name, value } = e.target;
   setPolicyDetails(prev => ({
     ...prev,
     [name]: value
   }));
 };
 
 const handleBackClick = () => {
  console.log("********** FundingPage: Handle back button clicked **********");
  
  try {
    // Set force navigation
    localStorage.setItem('force_active_step', '3');
    localStorage.setItem('force_timestamp', Date.now().toString());
    
    console.log("Force navigation set:", {
      step: localStorage.getItem('force_active_step'),
      timestamp: localStorage.getItem('force_timestamp')
    });
    
    // Use the force=true URL parameter to bypass the route guard
    const packageUrlWithForce = "/signup/package?force=true";
    console.log(`Navigating to ${packageUrlWithForce}`);
    
    // Use direct window location change for most reliable navigation
    window.location.href = packageUrlWithForce;
    
    // The code below will not execute due to page reload
    return false;
  } catch (error) {
    console.error("Error during back navigation:", error);
    
    // Last resort fallback
    window.location.href = '/signup/package?force=true';
    return false;
  }
};

 // Handler for next button
 const handleNext = async () => {
   if (!selectedOption) return;
   
   setIsSubmitting(true);
   
   try {
     // Create data object with all details
     const data = {
       fundingMethod: selectedOption,
       selectionDate: new Date().toISOString()
     };
     
     // Add insurance-specific details if applicable
     if (selectedOption === "insurance") {
       data.insuranceSubOption = insuranceSubOption;
       
       if (insuranceSubOption === "existing") {
         data.policyNumber = policyDetails.policyNumber;
         data.insuranceCompany = policyDetails.insuranceCompany;
         data.coverageAmount = policyDetails.coverageAmount;
       }
     }
     
     // Validate data with backend (optional but recommended)
     const validationResult = await fundingService.validateFundingData(data);
     if (!validationResult.success) {
       setError(validationResult.errors.join(', '));
       setIsSubmitting(false);
       return false;
     }
     
     // Save data to backend
     const saveResult = await fundingService.saveFundingSelection(data);
     
     if (!saveResult.success) {
       throw new Error("Failed to save your funding selection");
     }
     
     // If onNext prop is provided, use it (for multi-step form integration)
     if (onNext) {
       return await onNext(data);
     } else {
       // Direct navigation to the next step if no onNext handler
       navigate('/signup/review');
     }
     
     return true;
   } catch (error) {
     console.error("Error in handleNext:", error);
     setError(error.message || "An error occurred while saving your selection");
     return false;
   } finally {
     setIsSubmitting(false);
   }
 };
 
 // Define funding options
 const fundingOptions = {
   insurance: {
     title: "Life Insurance",
     description: "Most affordable option with manageable monthly premiums",
     icon: insuranceImage,
     benefits: [
       "Low monthly payments",
       "Term or Whole Life Options"
     ]
   },
   prepay: {
     title: "Prepayment",
     description: "Pay upfront for guaranteed coverage and simplicity",
     icon: prepayImage,
     benefits: [
       "Single payment covers all costs",
       "No ongoing insurance payments"
     ]
   },
   later: {
     title: "Decide Later",
     description: "Start your cryopreservation contract now and decide on funding method later",
     icon: laterImage,
     benefits: [
       "Start your cryopreservation contract",
       "Get personalized funding guidance from our team"
     ]
   }
 };
 
 // Apply Marcellus font to the entire component
 const marcellusStyle = {
   fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
   fontSize: "1.05rem"
 };
 
 // Determine available options based on package type
 const getAvailableFundingOptions = () => {
   if (!packageInfo) return ["insurance", "prepay", "later"];
   
   // For basic membership, remove insurance option
   if (packageInfo.preservationType === "basic") {
     return ["later"];
   }
   
   return ["insurance", "prepay", "later"];
 };
 
 const availableOptions = getAvailableFundingOptions();
 
 // Check if the user has basic membership
 const hasBasicMembership = packageInfo && packageInfo.preservationType === "basic";
 
 // Format price for display
 const formatCurrency = (amount) => {
   if (!amount) return "";
   return new Intl.NumberFormat('en-US', {
     style: 'currency',
     currency: 'USD',
     minimumFractionDigits: 0,
     maximumFractionDigits: 0
   }).format(amount);
 };
 
 return (
   <div 
     className="w-full bg-gray-100" 
     style={{
       width: '100vw',
       marginLeft: 'calc(-50vw + 50%)',
       marginRight: 'calc(-50vw + 50%)',
       position: 'relative',
       ...marcellusStyle
     }}
   >
     <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
       {isLoading ? (
         <div className="text-center py-12">
           <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
           <p className="mt-4 text-xl text-gray-600">Loading options...</p>
         </div>
       ) : error ? (
         <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8">
           <p className="text-red-700 text-lg">{error}</p>
           <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
         </div>
       ) : (
         <div className="mb-8">
           {/* No package header information here - we'll only show it within the cards */}
           
           {hasBasicMembership ? (
             <div className="mb-8">
               <h2 className="text-3xl font-bold text-[#323053] mb-6 flex items-center">
                 Basic Membership: <span className="text-[#775684] ml-3">{packageInfo && packageInfo.annualCost ? formatCurrency(packageInfo.annualCost) : "$540"}/year</span>
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* What Happens Next Card (NOW ON LEFT) */}
                 <div className={`rounded-lg overflow-hidden shadow-md h-full transition-all duration-700 ease-in-out delay-150 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                   <div className="bg-gradient-to-l from-[#323053] to-[#454575] text-white p-10 h-full">
                     <div className="flex items-center mb-8">
                       <div className="bg-[#575790] p-3 rounded-lg shadow-md mr-4" style={{ minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                         </svg>
                       </div>
                       <h4 className="text-2xl font-semibold text-white flex items-center">
                         What happens next?<img src={alcorStar} alt="Star" className="ml-2 w-10 h-10 filter brightness-0 invert" />
                       </h4>
                     </div>
                     
                     <div className="mt-8 pl-14">
                       <p className="text-gray-200 text-xl leading-relaxed mb-8">
                         After completing your Basic Membership, you'll receive information about upgrading to cryopreservation. Your Alcor advisor will guide you through options when you're ready.
                       </p>
                       
                       <div className="mt-8 text-gray-200">
                         <h5 className="text-xl font-semibold mb-4">Future Funding Options:</h5>
                         <div className="flex flex-col space-y-6">
                           <div className="flex items-center">
                             <div className="bg-[#454575] p-3 rounded-lg mr-4 flex-shrink-0">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                               </svg>
                             </div>
                             <span className="text-lg">Life Insurance (monthly premiums)</span>
                           </div>
                           
                           <div className="flex items-center">
                             <div className="bg-[#454575] p-3 rounded-lg mr-4 flex-shrink-0">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                               </svg>
                             </div>
                             <span className="text-lg">Prepayment (one-time payment)</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Funding Notice Card (NOW ON RIGHT) */}
                 <div className={`rounded-lg overflow-hidden shadow-md h-full transition-all duration-700 ease-in-out delay-300 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                   <div className="bg-gradient-to-l from-[#11243a] to-[#1c324c] text-white p-10 h-full">
                     <div className="flex items-center mb-8">
                       <div className="bg-[#293253] p-3 rounded-lg shadow-md mr-4" style={{ minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                       <h3 className="text-2xl font-semibold text-white flex items-center">
                         Funding Notice<img src={alcorStar} alt="Star" className="ml-2 w-10 h-10 filter brightness-0 invert" />
                       </h3>
                     </div>
                     
                     <div className="mt-8 pl-14">
                       <p className="text-gray-200 text-xl leading-relaxed mb-8">
                         With a Basic Membership, you don't need to set up life insurance or prepayment for cryopreservation at this time. Your membership begins with annual dues only.
                       </p>
                       
                       <div className="mt-8">
                         <h5 className="text-xl font-semibold text-white mb-5">What's Included:</h5>
                         <div className="space-y-4 pl-2">
                           <div className="flex items-center">
                             <img src={alcorStar} alt="Star" className="w-6 h-6 mr-3 filter brightness-0 invert" />
                             <span className="text-gray-200 text-lg">Member Events & Resources</span>
                           </div>
                           <div className="flex items-center">
                             <img src={alcorStar} alt="Star" className="w-6 h-6 mr-3 filter brightness-0 invert" />
                             <span className="text-gray-200 text-lg">Pet Preservation Options</span>
                           </div>
                           <div className="flex items-center">
                             <img src={alcorStar} alt="Star" className="w-6 h-6 mr-3 filter brightness-0 invert" />
                             <span className="text-gray-200 text-lg">Add On Cryopreservation Anytime</span>
                           </div>
                           <div className="flex items-center">
                             <img src={alcorStar} alt="Star" className="w-6 h-6 mr-3 filter brightness-0 invert" />
                             <span className="text-gray-200 text-lg">Consultation Services</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* What's Included Section - REMOVED as it has been added to the boxes */}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
               {availableOptions.includes("insurance") && (
                 <div 
                   onClick={() => selectOption("insurance")} 
                   className={`cursor-pointer h-full transform transition-all duration-500 ease-in-out hover:scale-[1.02] delay-150 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${selectedOption === "insurance" ? "" : "hover:shadow-lg"}`}
                 >
                   <div className={`rounded-3xl overflow-hidden h-full flex flex-col shadow-md ${selectedOption === "insurance" ? "border border-[#65417c]" : "border-2 border-transparent"} relative`}>
                     <div className="h-12 w-full bg-white flex items-center justify-center">
                       <div className={`flex items-center ${selectedOption === "insurance" ? "bg-[#15263f] text-white px-3 py-1 rounded-sm" : "text-transparent"}`}>
                         {selectedOption === "insurance" && (
                           <img src={alcorStarSelected} alt="Selected" className="w-5 h-5 mr-2" />
                         )}
                         <span className="font-bold text-sm tracking-widest">
                           SELECTED
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex-1 flex flex-col">
                       <div className="bg-white px-8 py-6">
                         <div className="flex items-start mb-2">
                           <div className="mr-4 bg-white border border-[#775684] rounded-lg p-2" style={{ width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <img src={insuranceImage} alt="Insurance" className="max-w-[75%] max-h-[75%] object-contain" />
                           </div>
                           <div className="flex flex-col">
                             <h3 className="text-2xl font-semibold text-gray-800">Life Insurance</h3>
                             <div className="bg-[#f0cd5d] text-[#2c3253] font-bold py-1 px-4 mt-2 text-center text-sm tracking-wider rounded-full inline-block">
                               MOST POPULAR
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-white px-8 py-6 border-t border-gray-200">
                         <p className="text-gray-700 text-xl mb-6">
                           Most affordable option with manageable monthly premiums.
                         </p>
                         
                         <div className="pt-2">
                           <div className="flex justify-between items-center mb-3">
                             <span className="text-gray-600 text-xl">Typical Cost:</span>
                             <span className="text-[#49355B] font-bold text-xl">$50-250/month</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-gray-600 text-xl">Complexity:</span>
                             <span className="text-[#49355B] font-bold text-xl">Simple</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-white px-8 py-4 text-gray-800 flex-grow border-t border-gray-200">
                         <h4 className="font-semibold text-lg mb-3 text-gray-800">Benefits:</h4>
                         
                         <ul className="mb-4 space-y-2">
                           {fundingOptions.insurance.benefits.map((benefit, index) => (
                             <li key={index} className="flex items-center">
                               <span className="text-gray-800 text-xl">{benefit}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
               
               {availableOptions.includes("prepay") && (
                 <div 
                   onClick={() => selectOption("prepay")} 
                   className={`cursor-pointer h-full transform transition-all duration-500 ease-in-out hover:scale-[1.02] delay-300 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${selectedOption === "prepay" ? "" : "hover:shadow-lg"}`}
                 >
                   <div className={`rounded-3xl overflow-hidden h-full flex flex-col shadow-md ${selectedOption === "prepay" ? "border border-[#65417c]" : "border-2 border-transparent"}`}>
                     <div className="h-12 w-full bg-white flex items-center justify-center">
                       <div className={`flex items-center ${selectedOption === "prepay" ? "bg-[#15263f] text-white px-3 py-1 rounded-sm" : "text-transparent"}`}>
                         {selectedOption === "prepay" && (
                           <img src={alcorStarSelected} alt="Selected" className="w-5 h-5 mr-2" />
                         )}
                         <span className="font-bold text-sm tracking-widest">
                           SELECTED
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex-1 flex flex-col">
                       <div className="bg-white px-8 py-6">
                         <div className="flex items-start">
                           <div className="mr-4 bg-white border border-[#775684] rounded-lg p-2" style={{ width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <img src={prepayImage} alt="Prepayment" className="max-w-[75%] max-h-[75%] object-contain" />
                           </div>
                           <div className="flex flex-col">
                             <h3 className="text-2xl font-semibold text-gray-800">Prepayment</h3>
                             <div className="bg-white border border-gray-300 text-gray-700 font-bold py-1 px-4 mt-2 text-center text-sm tracking-wider rounded-full inline-block">
                               EASIEST
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-white px-8 py-6 border-t border-gray-200">
                         <p className="text-gray-700 text-xl mb-6">
                           Pay upfront for the full cryopreservation amount.
                         </p>
                         
                         <div className="pt-2">
                           <div className="flex justify-between items-center mb-3">
                             <span className="text-gray-600 text-xl">Payment:</span>
                             <span className="text-[#2D3050] font-bold text-xl">
                               {packageInfo && packageInfo.preservationType !== "basic" 
                                 ? formatCurrency(packageInfo.preservationEstimate) 
                                 : "One-time"}
                             </span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-gray-600 text-xl">Complexity:</span>
                             <span className="text-[#2D3050] font-bold text-xl">Very Simple</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-white px-8 py-4 text-gray-800 flex-grow border-t border-gray-200">
                         <h4 className="font-semibold text-lg mb-3 text-gray-800">Benefits:</h4>
                         
                         <ul className="mb-4 space-y-2">
                           {fundingOptions.prepay.benefits.map((benefit, index) => (
                             <li key={index} className="flex items-center">
                               <span className="text-gray-800 text-xl">{benefit}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
               
               {availableOptions.includes("later") && (
                 <div 
                   onClick={() => selectOption("later")} 
                   className={`cursor-pointer h-full transform transition-all duration-500 ease-in-out hover:scale-[1.02] delay-450 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${selectedOption === "later" ? "" : "hover:shadow-lg"}`}
                 >
                   <div className={`rounded-3xl overflow-hidden h-full flex flex-col shadow-md ${selectedOption === "later" ? "border border-[#65417c]" : "border-2 border-transparent"}`}>
                     <div className="h-12 w-full bg-white flex items-center justify-center">
                       <div className={`flex items-center ${selectedOption === "later" ? "bg-[#15263f] text-white px-3 py-1 rounded-sm" : "text-transparent"}`}>
                         {selectedOption === "later" && (
                           <img src={alcorStarSelected} alt="Selected" className="w-5 h-5 mr-2" />
                         )}
                         <span className="font-bold text-sm tracking-widest">
                           SELECTED
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex-1 flex flex-col">
                       <div className="bg-white px-8 py-6">
                         <div className="flex items-start">
                           <div className="mr-4 bg-white border border-[#775684] rounded-lg p-2" style={{ width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <img src={laterImage} alt="Decide Later" className="max-w-[75%] max-h-[75%] object-contain" />
                           </div>
                           <div className="flex flex-col">
                             <h3 className="text-2xl font-semibold text-gray-800">Decide Later</h3>
                             <div className="bg-white border border-gray-300 text-gray-700 font-bold py-1 px-4 mt-2 text-center text-sm tracking-wider rounded-full inline-block">
                               MOST FLEXIBLE
                             </div>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-white px-8 py-6 border-t border-gray-200">
                       <p className="text-gray-700 text-xl mb-6">
                         Start your membership today, decide on funding method later.
                       </p>
                       
                       <div className="pt-2">
                         <div className="flex justify-between items-center mb-3">
                           <span className="text-gray-600 text-xl">Intent:</span>
                           <span className="text-[#13233e] font-bold text-xl">Cryopreservation</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-gray-600 text-xl">Funding Decision:</span>
                           <span className="text-[#13233e] font-bold text-xl">At Your Own Pace</span>
                         </div>
                       </div>
                     </div>
                       
                       <div className="bg-white px-8 py-4 text-gray-800 flex-grow border-t border-gray-200">
                         <h4 className="font-semibold text-lg mb-3 text-gray-800">Benefits:</h4>
                         
                         <ul className="mb-4 space-y-2">
                           {fundingOptions.later.benefits.map((benefit, index) => (
                             <li key={index} className="flex items-center">
                               <span className="text-gray-800 text-xl">{benefit}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
           
           {!hasBasicMembership && (
             <div className={`mt-8 bg-white p-8 rounded-lg transition-all duration-700 ease-in-out delay-600 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
               <div className="border-b border-gray-200 pb-6 mb-4">
                 <h3 className="text-2xl font-bold text-[#323053]">
                   {selectedOption === "insurance" ? "Life Insurance Details" : 
                    selectedOption === "prepay" ? "Prepayment Information" : 
                    "Resources for Future Decision"}
                 </h3>
               </div>
               
               <div className="py-2">
                 {selectedOption === "insurance" && (
                   <div>
                     <p className="text-gray-700 text-xl mb-2">
                       Select your preferred insurance option:
                     </p>
                     
                     <div className="mb-10 relative">
                       <div 
                         onClick={toggleDropdown}
                         className="p-6 rounded-xl cursor-pointer border-2 border-[#775684] flex justify-between items-center"
                       >
                         <div className="flex items-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#775684] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path 
                               strokeLinecap="round" 
                               strokeLinejoin="round" 
                               strokeWidth="2" 
                               d={insuranceSubOption === "new" 
                                 ? "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                                 : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} 
                             />
                           </svg>
                           <h4 className="text-xl font-semibold text-gray-800">
                             {insuranceSubOption === "new" ? "New Policy" : "Existing Policy"}
                           </h4>
                         </div>
                         <svg
                           xmlns="http://www.w3.org/2000/svg"
                           className={`h-6 w-6 text-[#775684] transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
                           fill="none"
                           viewBox="0 0 24 24"
                           stroke="currentColor"
                         >
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                         </svg>
                       </div>
                       
                       {dropdownOpen && (
                         <div className="absolute left-0 right-0 mt-2 z-10">
                           <div 
                             onClick={() => selectInsuranceSubOption("new")}
                             className={`p-6 rounded-t-xl cursor-pointer transition-all duration-200 bg-white shadow-lg border-t-2 border-l-2 border-r-2 border-[#775684] ${
                               insuranceSubOption === "new" ? "bg-gray-100" : ""
                             }`}
                           >
                             <div className="flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#775684] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                               </svg>
                               <h4 className="text-xl font-semibold text-gray-800">New Policy</h4>
                             </div>
                           </div>
                           
                           <div 
                             onClick={() => selectInsuranceSubOption("existing")}
                             className={`p-6 rounded-b-xl cursor-pointer transition-all duration-200 bg-white shadow-lg border-b-2 border-l-2 border-r-2 border-[#775684] ${
                               insuranceSubOption === "existing" ? "bg-gray-100" : ""
                             }`}
                           >
                             <div className="flex items-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#775684] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                               <h4 className="text-xl font-semibold text-gray-800">Existing Policy</h4>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                     
                     <div className="pl-4">
                       {insuranceSubOption === "new" ? (
                         <div className="mt-8">
                           <h4 className="text-2xl font-bold text-[#323053] mb-8 flex items-center">
                             <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                             </div>
                             Insurance Options
                           </h4>
                           <p className="text-gray-800 text-xl mb-8">
                             We'll connect you with specialized insurance providers for your cryonics arrangement.
                           </p>
                           <div className="space-y-10">
                             <div>
                               <h5 className="font-bold text-[#775684] text-2xl mb-6 flex items-center">
                                 <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                   </svg>
                                 </div>
                                 <span>Find a policy now</span>
                                 <div className="bg-[#d8b453] text-black font-bold py-1 px-3 ml-3 text-sm rounded-full border border-[#775684]">
                                   GET STARTED
                                 </div>
                                 <button 
                                   onClick={togglePolicyResources}
                                   className="focus:outline-none ml-3"
                                   aria-expanded={policyResourcesExpanded}
                                 >
                                   <svg 
                                     xmlns="http://www.w3.org/2000/svg" 
                                     className={`h-6 w-6 text-[#775684] transition-transform ${policyResourcesExpanded ? 'transform rotate-180' : ''}`}
                                     fill="none" 
                                     viewBox="0 0 24 24" 
                                     stroke="currentColor"
                                   >
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                   </svg>
                                 </button>
                               </h5>
                               
                               <div 
                                 className={`transition-all duration-300 overflow-hidden ${
                                   policyResourcesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                 }`}
                               >
                                 <ul className="space-y-4 text-gray-800 text-lg pl-16 mb-4">
                                   <li className="flex items-start">
                                     <span>Insurance Guide (PDF)</span>
                                   </li>
                                   <li className="flex items-start">
                                     <span>Provider Directory</span>
                                   </li>
                                 </ul>
                               </div>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <div className="mt-8">
                           <h4 className="text-2xl font-bold text-[#775684] mb-8 flex items-center">
                             <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                             </div>
                             Policy Information
                           </h4>
                           <p className="text-gray-800 text-xl mb-8">
                             Please provide details about your existing policy to add Alcor as a beneficiary.
                           </p>
                           <div className="space-y-8 mt-8">
                             <div>
                               <label htmlFor="insuranceCompany" className="block text-gray-800 font-bold text-xl mb-4">
                                 Insurance Company *
                               </label>
                               <input
                                 type="text"
                                 id="insuranceCompany"
                                 name="insuranceCompany"
                                 value={policyDetails.insuranceCompany}
                                 onChange={handlePolicyDetailChange}
                                 className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684]"
                                 placeholder="e.g. Prudential, New York Life"
                                 style={marcellusStyle}
                               />
                             </div>
                             
                             <div>
                               <label htmlFor="policyNumber" className="block text-gray-800 font-bold text-xl mb-4">
                                 Policy Number
                               </label>
                               <input
                                 type="text"
                                 id="policyNumber"
                                 name="policyNumber"
                                 value={policyDetails.policyNumber}
                                 onChange={handlePolicyDetailChange}
                                 className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684]"
                                 placeholder="Optional - Your policy number"
                                 style={marcellusStyle}
                               />
                             </div>
                             
                             <div>
                               <label htmlFor="coverageAmount" className="block text-gray-800 font-bold text-xl mb-4">
                                 Coverage Amount
                               </label>
                               <div className="relative">
                                 <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 text-2xl">$</span>
                                 <input
                                   type="text"
                                   id="coverageAmount"
                                   name="coverageAmount"
                                   value={policyDetails.coverageAmount}
                                   onChange={handlePolicyDetailChange}
                                   className="w-full pl-12 px-6 py-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684]"
                                   placeholder="Optional - Total coverage amount"
                                   style={marcellusStyle}
                                 />
                               </div>
                             </div>
                             
                             <div className="flex items-center mt-10">
                               <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                               </div>
                               <p className="text-gray-800 text-xl">
                                 Our team will help you add Alcor as a beneficiary to your policy.
                               </p>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
                 
                 {selectedOption === "prepay" && (
                   <div className="mt-8">
                     <h4 className="text-2xl font-bold text-[#323053] mb-8 flex items-center">
                       <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                       Prepayment Process
                     </h4>
                     <p className="text-gray-800 text-xl mb-8">
                       Here's what to expect with the prepayment option:
                     </p>
                     
                     <div className="space-y-10 mt-8">
                       <div>
                         <h5 className="font-bold text-[#775684] text-xl mb-6 flex items-center">
                           <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                             </svg>
                           </div>
                           Next Steps
                         </h5>
                         <ol className="space-y-4 ml-16 list-decimal text-gray-800 text-xl">
                           <li className="pl-3">Complete your membership signup</li>
                           <li className="pl-3">Our team will contact you within 2 days</li>
                           <li className="pl-3">You'll receive payment instructions</li>
                           <li className="pl-3">We'll confirm your funded status</li>
                         </ol>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 {selectedOption === "later" && (
                   <div className="mt-8">
                     <h4 className="text-2xl font-bold text-[#323053] mb-8 flex items-center">
                       <div className="bg-[#775684] w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                         </svg>
                       </div>
                       Basic Membership & Future Funding
                     </h4>
                     <p className="text-gray-800 text-xl mb-8">
                       By selecting this option, you'll start the process of a cryopreservation contract, taking time to decide on your preferred funding method. We'll connect you with our team that can help you consider your funding options.
                     </p> 
                   </div>
                 )}
               </div>
             </div>
           )}
         </div>
       )}
       
       <div className={`flex justify-between mt-8 transition-all duration-700 ease-in-out delay-700 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
         <button
           type="button"
           onClick={handleBackClick}
           className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.03]"
           style={marcellusStyle}
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
           className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] ${
             selectedOption ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
           } disabled:opacity-70`}
           style={marcellusStyle}
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
     
     <HelpPanel 
       showHelpInfo={showHelpInfo} 
       toggleHelpInfo={toggleHelpInfo} 
       helpItems={fundingHelpContent} 
     />

     {/* Global animation styles */}
     <style jsx global>{`
       .transition-all {
         transition-property: all;
       }
       .duration-200 {
         transition-duration: 200ms;
       }
       .duration-300 {
         transition-duration: 300ms;
       }
       .duration-500 {
         transition-duration: 500ms;
       }
       .duration-700 {
         transition-duration: 700ms;
       }
       .ease-in-out {
         transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
       }
       .delay-150 {
         transition-delay: 150ms;
       }
       .delay-300 {
         transition-delay: 300ms;
       }
       .delay-450 {
         transition-delay: 450ms;
       }
       .delay-600 {
         transition-delay: 600ms;
       }
       .delay-700 {
         transition-delay: 700ms;
       }
       .opacity-0 {
         opacity: 0;
       }
       .opacity-100 {
         opacity: 1;
       }
       .translate-y-0 {
         transform: translateY(0);
       }
       .translate-y-4 {
         transform: translateY(1rem);
       }
       .translate-y-8 {
         transform: translateY(2rem);
       }
       .transform {
         transform-origin: center;
       }
       .scale-100 {
         transform: scale(1);
       }
       .hover\\:scale-\\[1\\.02\\]:hover {
         transform: scale(1.02);
       }
       .hover\\:scale-\\[1\\.03\\]:hover {
         transform: scale(1.03);
       }
       .max-h-0 {
         max-height: 0;
       }
       .max-h-96 {
         max-height: 24rem;
       }
     `}</style>
   </div>
 );
}