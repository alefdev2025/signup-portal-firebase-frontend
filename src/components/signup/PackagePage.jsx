// File: pages/PackagePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { getMembershipCost } from "../../services/pricing";
import HelpPanel from "./HelpPanel";
import { savePackageInfo, getPackageInfo } from "../../services/package";
import { getContactInfo } from "../../services/contact";
import {
  planOptions,
  packageHelpContent,
  LoadingComponent,
  ErrorComponent,
  UpdatedVersionOptionCard,
  OriginalVersionOptionCard,
  MobileSelectionSummary,
  ImportantInformation,
  NavigationButtons,
  GlobalStyles
} from "./PackagePageContent";

// TOGGLE BETWEEN VERSIONS: set to true for the updated design, false for the original
const USE_UPDATED_VERSION = false;

const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export default function PackagePage({ onNext, onBack, initialData = {}, preloadedMembershipData = null }) {
  const initRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipCost, setMembershipCost] = useState(preloadedMembershipData?.membershipCost || 540);
  const [membershipAge, setMembershipAge] = useState(preloadedMembershipData?.age || 36);
  const [isLoading, setIsLoading] = useState(!preloadedMembershipData);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(initialData.preservationType || "neuro");
  const [selectedPackage, setSelectedPackage] = useState(initialData.packageType || "standard");
  const [isInternational, setIsInternational] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
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

  // Load saved package info on component mount
  useEffect(() => {
    // Add a flag to prevent multiple calls
    let isMounted = true;
    
    async function loadSavedPackageInfo() {
      try {
        console.log("🔍 PackagePage: Loading saved package info...");
        const result = await getPackageInfo();
        
        // Check if component is still mounted before updating state
        if (!isMounted) {
          console.log("⚠️ PackagePage: Component unmounted, skipping saved package info");
          return;
        }
        
        if (result?.success && result?.packageInfo) {
          console.log("✅ PackagePage: Found saved package info:", result.packageInfo);
          
          // Extract the preservation type from the actual data structure
          const savedPreservationType = result.packageInfo.details?.preservationType || 
                                      result.packageInfo.packageDetails?.preservationType || 
                                      result.packageInfo.preservationType;
          
          // Extract the package type from the actual data structure  
          const savedPackageType = result.packageInfo.type || 
                                 result.packageInfo.packageType || 
                                 result.packageInfo.packageDetails?.packageType;
          
          console.log("📋 PackagePage: Extracted data:");
          console.log("  - preservationType:", savedPreservationType);
          console.log("  - packageType:", savedPackageType);
          
          // Set the selected option if we have saved data
          if (savedPreservationType && isMounted) {
            console.log("🎯 PackagePage: Setting selected option to:", savedPreservationType);
            setSelectedOption(savedPreservationType);
          } else {
            console.log("ℹ️ PackagePage: No preservation type found in saved data");
          }
          
          // Set the selected package type if we have saved data
          if (savedPackageType && isMounted) {
            console.log("📦 PackagePage: Setting selected package to:", savedPackageType);
            setSelectedPackage(savedPackageType);
          } else {
            console.log("ℹ️ PackagePage: No package type found in saved data");
          }
        } else {
          console.log("ℹ️ PackagePage: No saved package info found or failed to load");
        }
      } catch (error) {
        console.error("❌ PackagePage: Error loading saved package info:", error);
        // Don't show error to user for this - it's not critical
        // User can still make selections normally
      }
    }
    
    // Always try to load saved info on mount, regardless of initial data
    console.log("🔍 PackagePage: Attempting to load saved package info on mount");
    loadSavedPackageInfo();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  // COMBINED: Load contact info for location AND membership pricing
  useEffect(() => {
    // Prevent double initialization for updated version
    if (USE_UPDATED_VERSION) {
      if (initRef.current) {
        console.log("⏭️ PackagePage: Skipping duplicate initialization (updated version)");
        return;
      }
      initRef.current = true;
      
      if (preloadedMembershipData) {
        console.log("📦 PackagePage: Using preloaded membership data:", preloadedMembershipData);
        setIsInternational(preloadedMembershipData.isInternational || false);
        setUserCountry(preloadedMembershipData.userCountry || null);
        return;
      }
    }
    
    async function loadContactInfoAndPricing() {
      try {
        console.log("🚀 PackagePage: Starting to load contact info and pricing...");
        setIsLoading(true);
        
        // Step 1: Get contact info to determine location
        let detectedCountry = null;
        let isInternationalUser = false;
        
        try {
          console.log("🌍 PackagePage: Fetching contact info for location detection...");
          const contactResult = await getContactInfo();
          
          if (contactResult?.success && contactResult?.contactInfo?.country) {
            detectedCountry = contactResult.contactInfo.country;
            const country = detectedCountry.toLowerCase();
            const domesticCountries = [
              'united states', 'usa', 'us', 'united states of america',
              'canada', 'ca', 'can'
            ];
            
            isInternationalUser = !domesticCountries.some(domestic => 
              country.includes(domestic)
            );
            
            console.log("🏴 PackagePage: Location detection results:");
            console.log("  - Country:", detectedCountry);
            console.log("  - Normalized:", country);
            console.log("  - Is International:", isInternationalUser);
            console.log("  - Domestic countries checked:", domesticCountries);
            
            setIsInternational(isInternationalUser);
            setUserCountry(detectedCountry);
          } else {
            console.log("⚠️ PackagePage: No country found in contact info, defaulting to domestic pricing");
            console.log("Contact result:", contactResult);
          }
        } catch (contactError) {
          console.warn("⚠️ PackagePage: Could not get contact info for pricing:", contactError);
          // Default to domestic pricing
          setIsInternational(false);
          setUserCountry("United States");
        }
        
        // Step 2: Get membership cost
        console.log("💰 PackagePage: Fetching membership cost...");
        const pricingResult = await getMembershipCost();
        
        if (pricingResult?.success) {
          console.log("✅ PackagePage: Membership pricing loaded:");
          console.log("  - Cost:", pricingResult.membershipCost);
          console.log("  - Age:", pricingResult.age);
          
          setMembershipCost(pricingResult.membershipCost || 540);
          setMembershipAge(pricingResult.age || 36);
        } else {
          console.error("❌ PackagePage: Failed to get membership cost:", pricingResult?.error);
          setError(pricingResult?.error || "Failed to calculate membership cost");
        }
        
        // Final summary
        console.log("📊 PackagePage: Final pricing configuration:");
        console.log("  - Membership Cost:", pricingResult?.membershipCost || 540);
        console.log("  - User Age:", pricingResult?.age || 36);
        console.log("  - User Country:", detectedCountry);
        console.log("  - Is International:", isInternationalUser);
        console.log("  - Neuro Price:", isInternationalUser ? planOptions.neuro.internationalEstimate : planOptions.neuro.baseEstimate);
        console.log("  - Whole Body Price:", isInternationalUser ? planOptions.wholebody.internationalEstimate : planOptions.wholebody.baseEstimate);
        
      } catch (error) {
        console.error("❌ PackagePage: Error loading pricing:", error);
        setError("Failed to load pricing information");
      } finally {
        setIsLoading(false);
        // Set content loaded state after data is fetched
        setTimeout(() => {
          setContentLoaded(true);
        }, 100);
      }
    }
    
    loadContactInfoAndPricing();
  }, [preloadedMembershipData]);

  useEffect(() => {
    if (!selectedOption && !isLoading) {
      console.log("🎯 PackagePage: No option selected and not loading, defaulting to 'neuro'");
      setSelectedOption("neuro");
    }
  }, [isLoading, selectedOption]);
  
  const handleBackClick = () => {
    console.log("⬅️ PackagePage: Handle back button clicked");
    
    // Call the onBack prop if provided
    if (typeof onBack === 'function') {
      console.log("✅ Calling parent onBack handler");
      onBack();
    } else {
      console.warn("⚠️ No onBack handler provided");
    }
  };
  
// In PackageStep.jsx
const handleNext = async () => {
  if (!selectedOption) {
    console.warn("⚠️ PackagePage: No option selected, cannot proceed");
    return;
  }
  
  setIsSubmitting(true);
  console.log("➡️ PackagePage: Handle next button clicked");
  console.log("📋 PackagePage: Current selections:");
  console.log("  - Selected Option:", selectedOption);
  console.log("  - Selected Package:", selectedPackage);
  console.log("  - Is International:", isInternational);
  console.log("  - User Country:", userCountry);
  
  try {
    // Calculate the final membership price based on selected package
    let finalPrice = membershipCost;
    if (selectedPackage === "basic") {
      finalPrice = membershipCost * 0.8;
    } else if (selectedPackage === "premium") {
      finalPrice = membershipCost * 1.5;
    }
    
    // Calculate preservation cost with international pricing
    const preservationEstimate = calculatePreservationEstimate(selectedOption);
    
    console.log("💰 PackagePage: Price calculations:");
    console.log("  - Base membership cost:", membershipCost);
    console.log("  - Final membership price:", finalPrice);
    console.log("  - Preservation estimate:", preservationEstimate);
    console.log("  - International surcharge applied:", isInternational && selectedOption !== "basic");
    
    // Prepare the data object to pass to the parent component
    const packageData = {
      packageType: selectedPackage,
      packageDetails: {
        cost: finalPrice,
        preservationType: selectedOption,
        preservationEstimate: preservationEstimate,
        basePrice: membershipCost,
        isInternational: isInternational,
        userCountry: userCountry,
        calculatedAt: new Date().toISOString()
      }
    };
    
    console.log("📦 PackagePage: Package data to save:", packageData);
    
    // Save package info to backend
    console.log("💾 PackagePage: Saving package info to backend...");
    const saveResult = await savePackageInfo(packageData);
    
    if (!saveResult || !saveResult.success) {
      throw new Error("Failed to save package information to backend");
    }
    
    console.log("✅ PackagePage: Package info saved successfully");
    
    // Use onNext prop to let parent handle navigation
    if (onNext) {
      console.log("➡️ Using parent onNext handler");
      const success = await onNext(packageData);
      if (!success) {
        throw new Error("Failed to proceed to next step");
      }
      console.log("✅ PackagePage: Successfully proceeded to next step");
    } else {
      console.warn("⚠️ No onNext handler provided");
    }
    
    // Reset submitting state after successful completion
    setIsSubmitting(false);
    return true;
    
  } catch (error) {
    console.error("❌ Error in handleNext:", error);
    alert(error.message || "Failed to save package information. Please try again.");
    setIsSubmitting(false);
    return false;
  }
};

  const selectOption = (option) => {
    console.log("🎯 PackagePage: Option selected:", option);
    console.log("💰 PackagePage: Price for", option + ":", calculatePreservationEstimate(option));
    setSelectedOption(option);
  };
  
  const selectPackage = (packageType) => {
    console.log("📦 PackagePage: Package selected:", packageType);
    setSelectedPackage(packageType);
  };
  
  // Calculate preservation estimate with international pricing
  const calculatePreservationEstimate = (optionType) => {
    if (!optionType || optionType === "basic") {
      console.log("💰 calculatePreservationEstimate: Basic membership, returning null");
      return null;
    }
    
    const planOption = planOptions[optionType];
    const price = isInternational ? planOption.internationalEstimate : planOption.baseEstimate;
    
    console.log("💰 calculatePreservationEstimate:");
    console.log("  - Option:", optionType);
    console.log("  - Is International:", isInternational);
    console.log("  - Base Price:", planOption.baseEstimate);
    console.log("  - International Price:", planOption.internationalEstimate);
    console.log("  - Selected Price:", price);
    
    return price;
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
  
  // Show loading indicator
  if (isLoading || userCountry === null) {
    console.log("⏳ PackagePage: Showing loading component");
    return <LoadingComponent USE_UPDATED_VERSION={USE_UPDATED_VERSION} />;
  }
  
  // Show error message
  if (error) {
    console.log("❌ PackagePage: Showing error component:", error);
    return <ErrorComponent error={error} USE_UPDATED_VERSION={USE_UPDATED_VERSION} />;
  }
  
  console.log("🎨 PackagePage: Rendering component with state:");
  console.log("  - Selected Option:", selectedOption);
  console.log("  - Selected Package:", selectedPackage);
  console.log("  - Is International:", isInternational);
  console.log("  - User Country:", userCountry);
  console.log("  - Membership Cost:", membershipCost);
  console.log("  - Membership Age:", membershipAge);
  
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
                <UpdatedVersionOptionCard 
                  option="neuro"
                  selectedOption={selectedOption}
                  selectOption={selectOption}
                  fadeInStyle={fadeInStyle}
                  getAnimationDelay={getAnimationDelay}
                  calculatePreservationEstimate={calculatePreservationEstimate}
                  getPackagePrice={getPackagePrice}
                  isInternational={isInternational}
                />
                
                {/* WHOLE BODY OPTION */}
                <UpdatedVersionOptionCard 
                  option="wholebody"
                  selectedOption={selectedOption}
                  selectOption={selectOption}
                  fadeInStyle={fadeInStyle}
                  getAnimationDelay={getAnimationDelay}
                  calculatePreservationEstimate={calculatePreservationEstimate}
                  getPackagePrice={getPackagePrice}
                  isInternational={isInternational}
                />
                
                {/* BASIC OPTION */}
                <UpdatedVersionOptionCard 
                  option="basic"
                  selectedOption={selectedOption}
                  selectOption={selectOption}
                  fadeInStyle={fadeInStyle}
                  getAnimationDelay={getAnimationDelay}
                  calculatePreservationEstimate={calculatePreservationEstimate}
                  getPackagePrice={getPackagePrice}
                  isInternational={isInternational}
                />
              </div>
              
              {/* Selection Summary Section - only visible on mobile */}
              <MobileSelectionSummary 
                selectedOption={selectedOption}
                getSelectedOptionName={getSelectedOptionName}
                getPackagePrice={getPackagePrice}
                getPreservationEstimateForSummary={getPreservationEstimateForSummary}
                scrollToOptions={scrollToOptions}
                fadeInStyle={fadeInStyle}
                getAnimationDelay={getAnimationDelay}
                USE_UPDATED_VERSION={USE_UPDATED_VERSION}
              />
              
              {/* Important Information Section */}
              <ImportantInformation 
                membershipAge={membershipAge}
                fadeInStyle={fadeInStyle}
                getAnimationDelay={getAnimationDelay}
                USE_UPDATED_VERSION={USE_UPDATED_VERSION}
              />
              
              {/* Navigation buttons - with improved navigation handling */}
              <NavigationButtons 
                handleBackClick={handleBackClick}
                handleNext={handleNext}
                isSubmitting={isSubmitting}
                isLoading={isLoading}
                selectedOption={selectedOption}
                fadeInStyle={fadeInStyle}
                getAnimationDelay={getAnimationDelay}
              />
            </div>
          ) : (
            // ORIGINAL VERSION Layout
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 sm:px-12 md:px-0">
              {/* NEURO OPTION */}
              <OriginalVersionOptionCard 
                option="neuro"
                selectedOption={selectedOption}
                selectOption={selectOption}
                fadeInStyle={fadeInStyle}
                getAnimationDelay={getAnimationDelay}
                calculatePreservationEstimate={calculatePreservationEstimate}
                getPackagePrice={getPackagePrice}
                isInternational={isInternational}
              />
              
              {/* WHOLE BODY OPTION */}
              <OriginalVersionOptionCard 
                option="wholebody"
                selectedOption={selectedOption}
                selectOption={selectOption}
                fadeInStyle={fadeInStyle}
                getAnimationDelay={getAnimationDelay}
                calculatePreservationEstimate={calculatePreservationEstimate}
                getPackagePrice={getPackagePrice}
                isInternational={isInternational}
              />
              
              {/* BASIC OPTION */}
              <OriginalVersionOptionCard 
                option="basic"
                selectedOption={selectedOption}
                selectOption={selectOption}
                fadeInStyle={fadeInStyle}
                getAnimationDelay={getAnimationDelay}
                calculatePreservationEstimate={calculatePreservationEstimate}
                getPackagePrice={getPackagePrice}
                isInternational={isInternational}
              />
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("🔝 Mobile: Change selection button clicked - scrolling to top");
                        // Scroll to top of page smoothly
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[#775684] font-medium hover:underline focus:outline-none flex items-center transition-transform duration-300 hover:translate-y-[-2px] cursor-pointer"
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
<ImportantInformation 
  membershipAge={membershipAge}
  fadeInStyle={fadeInStyle}
  getAnimationDelay={getAnimationDelay}
  USE_UPDATED_VERSION={USE_UPDATED_VERSION}
  showSurcharges={true}
/>
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
      
      {/* Global Styles */}
      <GlobalStyles />
    </div>
  );
}