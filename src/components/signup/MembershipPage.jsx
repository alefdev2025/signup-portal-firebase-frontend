// File: pages/signup/MembershipPage.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../../contexts/UserContext";
import HelpPanel from "./HelpPanel";
import MembershipSummary from "./MembershipSummary";
import MembershipDocuSign from "./MembershipDocuSign";
import PaymentOptions from "./PaymentOptions";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import iceLogo from "../../assets/images/ICE-logo-temp.png";
import navyALogo from "../../assets/images/navy-a-logo.png";

// Import membership service
import membershipService from "../../services/membership";
import fundingService from "../../services/funding";
import { getMembershipCost } from "../../services/pricing";

// Define help content
const membershipHelpContent = [
  {
    title: "ICE Discount Code",
    content: "If you learned about Alcor from an Independent Cryonics Educator (ICE) and received a discount code, enter it here to apply the discount to your membership dues."
  },
  {
    title: "Payment Frequency",
    content: "Choose how often you'd like to pay your membership dues."
  },
  {
    title: "Independent Cryonics Educators",
    content: "ICE educators help spread awareness about cryonics and earn compensation for successful referrals. Discounts range from 10% to 50% based on educator membership level."
  },
  {
    title: "Final Review",
    content: "Confirm all your information is correct before proceeding to payment."
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

export default function MembershipPage({ initialData, onBack, onNext, preloadedMembershipData = null, preloadedPackageData = null }) {
  const { user } = useUser();
  
  // Page state management
  // TEMPORARY: Start directly on summary page
  const [currentPage, setCurrentPage] = useState('summary'); // Changed from 'membership' to 'summary'
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [showIceInfo, setShowIceInfo] = useState(false); // ICE popup state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state with default values for summary page
  const [iceCode, setIceCode] = useState(initialData?.iceCode || "");
  const [paymentFrequency, setPaymentFrequency] = useState(initialData?.paymentFrequency || "quarterly");
  const [iceCodeValid, setIceCodeValid] = useState(initialData?.iceCodeValid || null);
  const [iceCodeInfo, setIceCodeInfo] = useState(initialData?.iceCodeInfo || null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  
  // Package info state
  const [packageInfo, setPackageInfo] = useState(null);
  const [membershipCosts, setMembershipCosts] = useState(null);
  const [membershipAge, setMembershipAge] = useState(null);
  const [membershipCost, setMembershipCost] = useState(540); // Default to $540
  
  // Apply Marcellus font
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
    fontSize: "1.05rem"
  };
  
  // Load package info when component mounts
  useEffect(() => {
    const loadPackageInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use preloaded membership data if available
        if (preloadedMembershipData) {
          console.log("MembershipPage: Using preloaded membership data:", preloadedMembershipData);
          setMembershipAge(preloadedMembershipData.age || 36);
          setMembershipCost(preloadedMembershipData.membershipCost || 540);
          
          // Store the membership costs from the preloaded data
          setMembershipCosts({
            annualDues: preloadedMembershipData.annualDues,
            monthlyDues: preloadedMembershipData.monthlyDues,
            duesMultiplier: preloadedMembershipData.duesMultiplier,
            membershipCost: preloadedMembershipData.membershipCost
          });
        } else {
          // Fetch user's age and membership cost from pricing service (like PackagePage does)
          const pricingResult = await getMembershipCost();
          console.log("MembershipPage: getMembershipCost() result:", pricingResult);
          if (pricingResult?.success) {
            console.log("MembershipPage: User's age from backend:", pricingResult.age);
            console.log("MembershipPage: Annual dues from backend:", pricingResult.annualDues);
            console.log("MembershipPage: Membership cost from backend:", pricingResult.membershipCost);
            
            setMembershipAge(pricingResult.age || 36);
            setMembershipCost(pricingResult.membershipCost || 540);
            
            // Store the membership costs from the pricing service
            setMembershipCosts({
              annualDues: pricingResult.annualDues,
              monthlyDues: pricingResult.monthlyDues,
              duesMultiplier: pricingResult.duesMultiplier,
              membershipCost: pricingResult.membershipCost
            });
          } else {
            console.log("MembershipPage: Failed to get data from backend, using defaults");
            console.error("MembershipPage: Error from pricing service:", pricingResult.error);
          }
        }
        
        // Use preloaded package data if available
        if (preloadedPackageData) {
          console.log("MembershipPage: Using preloaded package data:", preloadedPackageData);
          setPackageInfo({
            packageType: preloadedPackageData.packageType,
            preservationType: preloadedPackageData.preservationType,
            preservationEstimate: preloadedPackageData.preservationEstimate,
            annualCost: preloadedPackageData.annualCost
          });
        } else if (initialData && initialData.packageType && initialData.preservationType) {
          // If initialData contains package info, use it
          setPackageInfo({
            packageType: initialData.packageType,
            preservationType: initialData.preservationType,
            preservationEstimate: initialData.preservationEstimate,
            annualCost: initialData.annualCost
          });
        } else {
          // Try to get package info from funding service (fallback)
          const result = await fundingService.getPackageInfoForFunding();
          
          if (result.success) {
            setPackageInfo({
              packageType: result.packageType,
              preservationType: result.preservationType,
              preservationEstimate: result.preservationEstimate,
              annualCost: result.annualCost
            });
          } else {
            // Try membership service as another fallback
            const membershipResult = await membershipService.getMembershipInfo();
            if (membershipResult.success && membershipResult.data.packageInfo) {
              setPackageInfo(membershipResult.data.packageInfo);
            } else {
              setError("Failed to load package information. Please go back and try again.");
            }
          }
        }
        
        // Load membership costs only if we don't have preloaded data
        if (!preloadedMembershipData) {
          const costsResult = await membershipService.getMembershipCosts();
          if (costsResult.success) {
            // Only update if we didn't get costs from pricing service
            if (!membershipCosts) {
              setMembershipCosts(costsResult.data);
            }
          }
        }
        
      } catch (err) {
        console.error("Error loading package info:", err);
        setError("An error occurred while loading your package information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPackageInfo();
  }, [initialData, preloadedMembershipData, preloadedPackageData]);
  
  // Validate ICE code when it changes
  const validateIceCode = async (code) => {
    if (!code.trim()) {
      setIceCodeValid(null);
      setIceCodeInfo(null);
      return;
    }
    
    setIsValidatingCode(true);
    try {
      console.log("Validating ICE code:", code);
      const result = await membershipService.validateIceCode(code);
      console.log("ICE code validation result:", result);
      
      setIceCodeValid(result.valid);
      if (result.valid) {
        setIceCodeInfo({
          educatorName: result.educatorName,
          educatorType: result.educatorType,
          discountPercent: result.discountPercent,
          discountAmount: result.discountAmount,
          iceCompensationPercent: result.iceCompensationPercent,
          iceCompensationAmount: result.iceCompensationAmount
        });
      } else {
        setIceCodeInfo(null);
      }
    } catch (error) {
      console.error("Error validating ICE code:", error);
      setIceCodeValid(false);
      setIceCodeInfo(null);
    } finally {
      setIsValidatingCode(false);
    }
  };
  
  // Handle ICE code input change
  const handleIceCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setIceCode(value);
    
    // Reset validation state immediately
    if (!value.trim()) {
      setIceCodeValid(null);
      setIceCodeInfo(null);
      return;
    }
    
    // Debounce validation
    clearTimeout(window.iceCodeTimeout);
    window.iceCodeTimeout = setTimeout(() => {
      validateIceCode(value);
    }, 500);
  };
  
  // Handle payment frequency change
  const handlePaymentFrequencyChange = (frequency) => {
    setPaymentFrequency(frequency);
  };
  
  // Form validation helper
  const isFormValid = () => {
    // Payment frequency must be selected
    const hasValidSelection = !!paymentFrequency;
    
    // ICE code validation (if entered, must be valid)
    const iceCodeValidation = !iceCode.trim() || iceCodeValid === true;
    
    return hasValidSelection && iceCodeValidation;
  };
  
  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Test function
  console.log('MembershipPage render - showIceInfo:', showIceInfo);
  
  // Toggle ICE info modal with DOM manipulation
  const toggleIceInfo = () => {
    if (showIceInfo) {
      // Close modal
      setShowIceInfo(false);
      // Remove any existing overlay
      const existingOverlay = document.getElementById('ice-modal-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
        console.log('Overlay removed');
      }
    } else {
      // Open modal
      setShowIceInfo(true);
      
      // Create overlay element directly in DOM
      setTimeout(() => {
        // Remove any existing overlay first
        const existingOverlay = document.getElementById('ice-modal-overlay');
        if (existingOverlay) {
          existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'ice-modal-overlay';
        overlay.style.cssText = `
          position: fixed !important;
          top: 0px !important;
          left: 0px !important;
          right: 0px !important;
          bottom: 0px !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(0, 0, 0, 0.6) !important;
          opacity: 1 !important;
          z-index: 9999990 !important;
          display: block !important;
          pointer-events: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          outline: none !important;
        `;
        
        overlay.addEventListener('click', (e) => {
          console.log('Overlay clicked');
          setShowIceInfo(false);
          overlay.remove();
        });
        
        document.body.appendChild(overlay);
        console.log('Dark overlay added to DOM:', overlay);
        console.log('Overlay computed style:', window.getComputedStyle(overlay));
        
        // Force a repaint
        overlay.offsetHeight;
      }, 50);
    }
  };
  
  // Close ICE modal
  const closeIceModal = () => {
    setShowIceInfo(false);
    const existingOverlay = document.getElementById('ice-modal-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
  };
  
  // Handler for back button from main form
  const handleBackClick = () => {
    console.log("********** MembershipPage: Handle back button clicked **********");
    
    if (onBack) {
      return onBack();
    }
  };
  
  // Handler for next button - go to summary
  const handleNext = async () => {
    if (!isFormValid()) return;
    
    // Show summary page
    setCurrentPage('summary');
  };
  
  // Handler for going back from summary to main form
  const handleBackFromSummary = () => {
    // TEMPORARY: Go back to previous page instead of membership form
    if (onBack) {
      onBack();
    }
    // Uncomment this line to go back to membership form when ready:
    // setCurrentPage('membership');
  };
  
  // In MembershipPage.jsx, update handleProceedToDocuSign:
  const handleProceedToDocuSign = async () => {
    setIsSubmitting(true);
    
    try {
      console.log("MembershipPage: Proceeding to DocuSign step...");
      
      // Validate ICE code one final time before saving
      if (iceCode.trim()) {
        console.log("Final validation of ICE code before save:", iceCode);
        const finalValidation = await membershipService.validateIceCode(iceCode.trim());
        
        if (!finalValidation.valid) {
          throw new Error("ICE code is no longer valid. Please check the code and try again.");
        }
        
        // Update the ICE code info with the latest validation
        setIceCodeInfo(finalValidation);
        setIceCodeValid(true);
      }
      
      // Create data object with all details
      const data = {
        iceCode: iceCode.trim(),
        paymentFrequency: paymentFrequency,
        iceCodeValid: iceCode.trim() ? iceCodeValid : null,
        iceCodeInfo: iceCode.trim() ? iceCodeInfo : null,
        interestedInLifetime: false,
        completionDate: new Date().toISOString()
      };
      
      console.log("MembershipPage: Submitting data:", data);
      
      // Save membership data to backend
      try {
        const saveResult = await membershipService.saveMembershipSelection(data);
        console.log("MembershipPage: Save result:", saveResult);
        
        if (!saveResult || !saveResult.success) {
          throw new Error("Failed to save membership selection to backend");
        }
      } catch (error) {
        console.error("Error saving membership selection:", error);
        setError("Failed to save your membership selection. Please try again.");
        return false;
      }
      
      // Navigate to DocuSign step instead of showing DocuSign directly
      if (onNext) {
        onNext(data);
      }
      
      return true;
    } catch (error) {
      console.error("Error in handleProceedToDocuSign:", error);
      setError(error.message || "An error occurred while saving your selection");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for DocuSign completion
  const handleDocuSignComplete = () => {
    console.log("DocuSign process completed successfully");
    
    // If onNext prop is provided, use it (for step integration)
    if (onNext) {
      const finalData = {
        iceCode: iceCode.trim(),
        paymentFrequency: paymentFrequency,
        iceCodeValid: iceCode.trim() ? iceCodeValid : null,
        iceCodeInfo: iceCode.trim() ? iceCodeInfo : null,
        interestedInLifetime: false,
        docuSignCompleted: true,
        completionDate: new Date().toISOString()
      };
      
      onNext(finalData);
    }
  };
  
  // Handler for going back from DocuSign to summary
  const handleBackFromDocuSign = () => {
    setCurrentPage('summary');
  };
  
  // Calculate pricing based on package info
  const getAnnualCost = () => {
    // Use membershipCost from backend (same as PackagePage uses)
    console.log("getAnnualCost: Using membershipCost:", membershipCost);
    return membershipCost;
  };
  
  const getMonthlyCost = () => {
    return Math.round(getAnnualCost() / 12);
  };
  
  const getQuarterlyCost = () => {
    return Math.round(getAnnualCost() / 4);
  };
  
  // Calculate costs with ICE discount
  const calculateCosts = () => {
    const baseCost = getAnnualCost();
    let discountAmount = 0;
    
    if (iceCodeValid && iceCodeInfo) {
      // Use 25% discount (0.25 of base cost)
      discountAmount = Math.round(baseCost * 0.25);
    }
    
    const finalAnnualCost = Math.max(0, baseCost - discountAmount);
    
    return {
      baseCost,
      discountAmount,
      finalAnnualCost,
      finalMonthlyCost: Math.round(finalAnnualCost / 12),
      finalQuarterlyCost: Math.round(finalAnnualCost / 4)
    };
  };
  
  const costs = calculateCosts();
  
  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return "";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Prepare membership data for child components
  const membershipData = {
    iceCode: iceCode.trim(),
    paymentFrequency: paymentFrequency,
    iceCodeValid: iceCodeValid,
    iceCodeInfo: iceCodeInfo,
    interestedInLifetime: false
  };
  
  const packageData = {
    preservationType: packageInfo?.preservationType,
    preservationEstimate: packageInfo?.preservationEstimate,
    annualCost: membershipCost
  };
  
  const contactData = initialData?.contactData || user;
  
  // Handle loading states
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
        <p className="mt-4 text-xl text-gray-600">Loading membership options...</p>
      </div>
    );
  }
  
  // Handle error states
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8">
        <p className="text-red-700 text-lg">{error}</p>
        <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
      </div>
    );
  }
  
  if (currentPage === 'docusign') {
    // Return DocuSign component with NO wrapper, NO layout, NO progress
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
        <MembershipDocuSign
          membershipData={membershipData}
          packageData={packageData}
          contactData={contactData}
          onBack={handleBackFromDocuSign}
          onComplete={handleDocuSignComplete}
        />
      </div>
    );
  }
  
  // Render summary page
  if (currentPage === 'summary') {
    return (
      <MembershipSummary
        membershipData={membershipData}
        packageData={packageData}
        contactData={contactData}
        onBack={handleBackFromSummary}
        onSignAgreement={handleProceedToDocuSign}
      />
    );
  }
  
  /* COMMENTED OUT MEMBERSHIP FORM - Uncomment when ready to use pricing page again
  // Render main membership form
  return (
    <div>
      <div 
        className="w-full bg-gray-50" 
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          position: 'relative',
          ...marcellusStyle
        }}
      >
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
          <div className="mb-8">
            <div className="mb-8">
              {costs && costs.discountAmount > 0 && (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800 font-semibold">ICE Discount Applied: Save {formatCurrency(costs.discountAmount)} on your first year</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-12">
              <PaymentOptions
                paymentFrequency={paymentFrequency}
                onPaymentFrequencyChange={handlePaymentFrequencyChange}
                costs={costs}
                formatCurrency={formatCurrency}
                getMonthlyCost={getMonthlyCost}
                getQuarterlyCost={getQuarterlyCost}
                getAnnualCost={getAnnualCost}
                iceCodeValid={iceCodeValid}
                marcellusStyle={marcellusStyle}
              />
            </div>

            <div className="mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] w-16 h-16 rounded-lg flex items-center justify-center mr-4 shadow-sm border border-gray-200">
                    <img 
                      src={iceLogo} 
                      alt="ICE Logo" 
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="bg-gradient-to-br from-[#775684] to-[#5a4063] w-full h-full rounded-lg hidden items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-[#323053]">Have an ICE Code?</h3>
                      <button 
                        onClick={() => toggleIceInfo()}
                        className="bg-gray-100 text-gray-600 rounded-full w-7 h-7 flex items-center justify-center hover:bg-gray-200 transition-colors text-sm font-bold"
                        title="What's an ICE Code?"
                      >
                        ?
                      </button>
                    </div>
                    <p className="text-gray-600 mt-1">Save 25% on your first year with a referral code</p>
                  </div>
                </div>

                <div className="max-w-md">
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={iceCode}
                      onChange={handleIceCodeChange}
                      placeholder="Enter discount code"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684] pr-12 font-mono tracking-wide"
                      style={{...marcellusStyle, fontFamily: 'monospace'}}
                    />
                    
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      {isValidatingCode ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#775684]"></div>
                      ) : iceCode.trim() && iceCodeValid === true ? (
                        <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : iceCode.trim() && iceCodeValid === false ? (
                        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : null}
                    </div>
                  </div>
                  
                  {!iceCode.trim() && (
                    <div className="text-sm text-gray-500">
                      <p>Demo codes: ICE2024DEMO, MEMBER2024, CRYOMEM2024</p>
                    </div>
                  )}
                  
                  {iceCode.trim() && iceCodeValid === true && iceCodeInfo && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-800 font-semibold">Code accepted! You'll save 25% on your first year.</span>
                      </div>
                    </div>
                  )}
                  
                  {iceCode.trim() && iceCodeValid === false && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="text-red-800 font-semibold">Invalid code. Please check and try again.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-12">
            <button
              type="button"
              onClick={handleBackClick}
              className="py-3 px-6 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md"
              style={marcellusStyle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={isSubmitting || !isFormValid()}
              className={`py-3 px-6 rounded-full font-semibold flex items-center transition-all duration-300 shadow-md hover:shadow-lg ${
                isFormValid() ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                  Continue to Review
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
          helpItems={membershipHelpContent} 
        />
      </div>

      {showIceInfo && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999999,
            width: '100%',
            maxWidth: '48rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{
              background: 'linear-gradient(90deg, #775684 0%, #8a4099 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src={iceLogo} 
                alt="ICE Logo" 
                style={{ height: '2.5rem', marginRight: '1rem', filter: 'brightness(0) invert(1)' }}
                onError={(e) => {
                  e.target.src = alcorStar;
                }}
              />
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', margin: 0, display: 'flex', alignItems: 'center' }}>
                What's an ICE Code?
                <img src={alcorStar} alt="Alcor Star" style={{ width: '2rem', height: '2rem', marginLeft: '0.75rem', filter: 'brightness(0) invert(1)' }} />
              </h2>
            </div>
            
            <button
              onClick={closeIceModal}
              style={{
                color: 'white',
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: '0.5rem',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ color: '#374151', fontSize: '1.125rem', lineHeight: '1.75' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                <strong>ICE (Independent Cryonics Educator)</strong> codes are special discount codes provided by certified educators who help spread awareness about cryonics and Alcor's services. ICE educators receive 50% of your first-year dues as compensation for successful referrals.
              </p>
              
              <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '1rem', fontSize: '1.25rem' }}>
                  Discount Levels
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #d1d5db', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#374151', fontWeight: '500' }}>Non-Alcor Member ICE:</span>
                  <span style={{ color: '#111827', fontWeight: 'bold' }}>10% off first year</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #d1d5db', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#374151', fontWeight: '500' }}>Alcor Member ICE:</span>
                  <span style={{ color: '#111827', fontWeight: 'bold' }}>25% off first year</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151', fontWeight: '500' }}>Alcor Cryopreservation Member ICE:</span>
                  <span style={{ color: '#111827', fontWeight: 'bold' }}>50% off first year</span>
                </div>
              </div>
              
              <p style={{ marginBottom: '1.5rem' }}>
                If you learned about Alcor from an ICE educator and received a discount code, enter it to save on your membership dues! The discount applies to your first year of membership only.
              </p>
              
              <div style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '1rem' }}>
                <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem', fontSize: '1.125rem' }}>
                  How it works:
                </h4>
                <ol style={{ listStyleType: 'decimal', listStylePosition: 'inside', color: '#374151', margin: 0, padding: 0, fontSize: '1.125rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Enter your ICE code during signup</li>
                  <li style={{ marginBottom: '0.5rem' }}>Your discount is automatically applied</li>
                  <li style={{ marginBottom: '0.5rem' }}>ICE educator receives 50% of your first-year dues as compensation</li>
                  <li>You save money on your first year!</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={closeIceModal}
              style={{
                backgroundColor: '#775684',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.75rem 2rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
  END OF COMMENTED OUT MEMBERSHIP FORM */
}