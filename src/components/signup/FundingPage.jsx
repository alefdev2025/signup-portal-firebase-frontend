// File: pages/FundingPage.jsx - Fixed Version
import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import HelpPanel from "./HelpPanel";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import alcorStarSelected from "../../assets/images/alcor-star.png";

// Import separated data
import { 
  fundingOptions, 
  basicMembershipContent, 
  getAvailableFundingOptions, 
  formatCurrency, 
  getDynamicPricing 
} from "./FundingCardsData";

// Import funding service
import fundingService from "../../services/funding";

// Import reusable components
import FundingCard from "./FundingCard";
import BasicMembershipCards from "./BasicMembershipCards";
import FundingDetailsSection from "./FundingDetailsSection";

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
       Contact our support team at <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a> or call 623-432-7775.
     </>
   )
 }
];

export default function FundingPage({ initialData, onBack, onNext }) {
 const { user } = useUser();
 
 const [showHelpInfo, setShowHelpInfo] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [selectedOption, setSelectedOption] = useState(null); // Start with null
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [packageInfo, setPackageInfo] = useState(null);
 const [dropdownOpen, setDropdownOpen] = useState(false);
 const [animationComplete, setAnimationComplete] = useState(false);
 const [validationErrors, setValidationErrors] = useState({});
 
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
         
         // Set selected option based on initialData or defaults
         if (initialData.fundingMethod) {
           // Map backend values to internal option IDs
           let mappedOption = initialData.fundingMethod;
           if (mappedOption === 'life insurance') {
             mappedOption = 'insurance';
           } else if (mappedOption === 'prepayment') {
             mappedOption = 'prepay';
           } else if (mappedOption === 'undecided') {
             mappedOption = 'later';
           }
           setSelectedOption(mappedOption);
         } else if (initialData.preservationType === 'basic') {
           setSelectedOption('later'); // Default to "later" for basic membership
         } else {
           // For non-basic membership, default to 'insurance'
           setSelectedOption('insurance');
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
           
           // ALSO fetch existing funding info from backend
           try {
             const fundingInfoResult = await fundingService.getUserFundingInfo();
             
             if (fundingInfoResult.success && fundingInfoResult.data?.fundingInfo?.fundingMethod) {
               // Map backend values to internal option IDs
               let mappedOption = fundingInfoResult.data.fundingInfo.fundingMethod;
               
               // Map backend values to frontend option IDs
               if (mappedOption === 'life insurance') {
                 mappedOption = 'insurance';
               } else if (mappedOption === 'prepayment') {
                 mappedOption = 'prepay';
               } else if (mappedOption === 'undecided') {
                 mappedOption = 'later';
               } else if (mappedOption === 'other') {
                 // Handle legacy "other" value
                 mappedOption = 'later';
               }
               
               setSelectedOption(mappedOption);
               
               // Also set insurance sub-option if available
               if (fundingInfoResult.data.fundingInfo.insuranceSubOption) {
                 setInsuranceSubOption(fundingInfoResult.data.fundingInfo.insuranceSubOption);
               }
               
               // Set policy details if available
               if (fundingInfoResult.data.fundingInfo.policyDetails) {
                 setPolicyDetails(fundingInfoResult.data.fundingInfo.policyDetails);
               }
             } else {
               // No existing funding info, set defaults based on preservation type
               if (result.preservationType === 'basic') {
                 setSelectedOption('later'); // Default to "later" for basic membership
               } else {
                 // For non-basic membership, default to 'insurance'
                 setSelectedOption('insurance');
               }
             }
           } catch (fundingError) {
             console.error("Error fetching funding info:", fundingError);
             // Still set defaults if fetching funding info fails
             if (result.preservationType === 'basic') {
               setSelectedOption('later');
             } else {
               setSelectedOption('insurance');
             }
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
   // Clear validation errors when option changes
   setValidationErrors({});
 };
 
 // Handler for selecting insurance sub-option
 const selectInsuranceSubOption = (subOption) => {
   setInsuranceSubOption(subOption);
   setDropdownOpen(false);
   // Clear validation errors when sub-option changes
   setValidationErrors({});
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
   
   // Clear validation error for this field when user starts typing
   if (validationErrors[name]) {
     setValidationErrors(prev => {
       const newErrors = { ...prev };
       delete newErrors[name];
       return newErrors;
     });
   }
 };
 
 const handleBackClick = () => {
  console.log("FundingPage: Handle back button clicked");
  
  // Call the onBack prop if provided
  if (typeof onBack === 'function') {
    console.log("Calling parent onBack handler");
    onBack();
  } else {
    console.warn("No onBack handler provided");
  }
};

// Get available funding options and check if basic membership
const availableOptions = getAvailableFundingOptions(packageInfo);
const hasBasicMembership = packageInfo && packageInfo.preservationType === "basic";

// Check if we need insurance company field - DISABLED for now
const needsInsuranceCompany = false; // Disabled validation
const isInsuranceCompanyMissing = false; // Never require it

// Handler for next button
const handleNext = async () => {
  // Clear any existing errors
  setError(null);
  
  // If not basic membership and no option selected, return
  if (!hasBasicMembership && !selectedOption) {
    return;
  }
  
  // Check if insurance company is required but missing (only on desktop)
  if (isInsuranceCompanyMissing) {
    setValidationErrors({ insuranceCompany: true });
    // Scroll to the insurance company field to draw attention
    const insuranceField = document.getElementById('insuranceCompany');
    if (insuranceField) {
      insuranceField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      insuranceField.focus();
    }
    return;
  }
  
  setIsSubmitting(true);
  console.log("FundingPage: Handle next button clicked");
  
  try {
    // Map internal option IDs to backend values BEFORE sending
    let mappedFundingMethod = selectedOption;
    if (selectedOption === 'insurance') {
      mappedFundingMethod = 'life insurance';
    } else if (selectedOption === 'prepay') {
      mappedFundingMethod = 'prepayment';
    } else if (selectedOption === 'later') {
      mappedFundingMethod = 'undecided';
    }
    
    // Create data object with all details
    const data = {
      fundingMethod: hasBasicMembership ? 'none' : (mappedFundingMethod || 'undecided'),
      selectionDate: new Date().toISOString()
    };
    
    // Add insurance-specific details if applicable (only for non-basic membership)
    if (!hasBasicMembership && selectedOption === "insurance") {
      data.insuranceSubOption = insuranceSubOption;
      
      if (insuranceSubOption === "existing") {
        // Always send a value to avoid backend validation errors
        data.insuranceCompany = policyDetails.insuranceCompany.trim() || "To be provided";
      }
    }
    
    console.log("Sending funding data:", data);
    
    // Validate data with backend - but ignore insurance company errors
    const validationResult = await fundingService.validateFundingData(data);
    if (!validationResult.success) {
      // Filter out insurance company related errors
      const filteredErrors = validationResult.errors.filter(error => 
        !error.toLowerCase().includes('insurance company')
      );
      
      if (filteredErrors.length > 0) {
        setError(filteredErrors.join(', '));
        setIsSubmitting(false);
        return false;
      }
      // If only insurance company errors, continue anyway
    }
    
    // Save data to backend
    const saveResult = await fundingService.saveFundingSelection(data);
    
    if (!saveResult.success) {
      throw new Error("Failed to save your funding selection");
    }
    
    console.log("FundingPage: Funding info saved successfully");
    
    // Pass the ORIGINAL selectedOption to parent (not mapped)
    // The parent will handle its own mapping if needed
    const parentData = {
      fundingMethod: selectedOption, // Keep internal ID for parent
      selectionDate: data.selectionDate,
      ...(data.insuranceSubOption && { insuranceSubOption: data.insuranceSubOption }),
      ...(data.insuranceCompany && { insuranceCompany: data.insuranceCompany })
    };
    
    // Use onNext prop to let parent handle navigation
    if (onNext) {
      console.log("Using parent onNext handler");
      const success = await onNext(parentData);
      if (!success) {
        throw new Error("Failed to proceed to next step");
      }
    } else {
      console.warn("No onNext handler provided");
    }
    
    return true;
    
  } catch (error) {
    console.error("Error in handleNext:", error);
    setError(error.message || "Failed to save funding information. Please try again.");
    setIsSubmitting(false);
    return false;
  }
};
 
 // Apply Marcellus font to the entire component
 const marcellusStyle = {
   fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
   fontSize: "1.05rem"
 };
 
 // Add validation logic for button state - but keep button always enabled like ContactInfoPage
 const hasValidationErrors = Object.keys(validationErrors).length > 0;
 const isFormValid = hasBasicMembership || selectedOption;
 
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
           {hasBasicMembership ? (
             <BasicMembershipCards 
               packageInfo={packageInfo}
               animationComplete={animationComplete}
               content={basicMembershipContent}
             />
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
               {availableOptions.map((optionId, index) => (
                 <FundingCard
                   key={optionId}
                   option={fundingOptions[optionId]}
                   isSelected={selectedOption === optionId}
                   onSelect={() => selectOption(optionId)}
                   packageInfo={packageInfo}
                   animationComplete={animationComplete}
                   animationDelay={150 + (index * 150)}
                   getDynamicPricing={getDynamicPricing}
                 />
               ))}
             </div>
           )}
           
           {!hasBasicMembership && (
             <FundingDetailsSection
               selectedOption={selectedOption}
               fundingOptions={fundingOptions}
               insuranceSubOption={insuranceSubOption}
               policyDetails={policyDetails}
               dropdownOpen={dropdownOpen}
               policyResourcesExpanded={policyResourcesExpanded}
               animationComplete={animationComplete}
               validationErrors={validationErrors}
               onSelectInsuranceSubOption={selectInsuranceSubOption}
               onToggleDropdown={toggleDropdown}
               onTogglePolicyResources={togglePolicyResources}
               onPolicyDetailChange={handlePolicyDetailChange}
               marcellusStyle={marcellusStyle}
             />
           )}
           

         </div>
       )}
       
       <div className={`flex justify-between mt-8 transition-all duration-700 ease-in-out delay-700 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
         <button
           type="button"
           onClick={handleBackClick}
           className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.03]"
           style={marcellusStyle}
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
           disabled={isSubmitting || isLoading}
           className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] ${
             (isSubmitting || isLoading) ? "bg-gray-400 text-white cursor-not-allowed" : "bg-[#775684] text-white hover:bg-[#664573]"
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