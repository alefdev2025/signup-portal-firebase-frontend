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
  const handleProceedToDocuSign = async (updatedData = {}) => {
    setIsSubmitting(true);
    
    try {
      console.log("MembershipPage: Proceeding to DocuSign step...");
      console.log("MembershipPage: Updated data from summary:", updatedData);
      
      // Use updated values from MembershipSummary if provided, otherwise use existing state
      // Note: We're accessing the component's state variables here
      const finalIceCode = updatedData.iceCode !== undefined ? updatedData.iceCode : iceCode;
      const finalPaymentFrequency = updatedData.paymentFrequency || paymentFrequency;
      const finalIceCodeValid = updatedData.iceCodeValid !== undefined ? updatedData.iceCodeValid : iceCodeValid;
      
      // Validate ICE code one final time before saving (only if changed and not empty)
      let finalIceCodeInfo = iceCodeInfo;
      if (finalIceCode && finalIceCode.trim() && finalIceCode !== iceCode) {
        console.log("ICE code changed, validating new code:", finalIceCode);
        const finalValidation = await membershipService.validateIceCode(finalIceCode.trim());
        
        if (!finalValidation.valid) {
          throw new Error("ICE code is no longer valid. Please check the code and try again.");
        }
        
        // Update the ICE code info with the latest validation
        finalIceCodeInfo = finalValidation;
        setIceCodeInfo(finalValidation);
        setIceCodeValid(true);
      }
      
      // Update local state with final values
      setIceCode(finalIceCode || '');
      setPaymentFrequency(finalPaymentFrequency);
      setIceCodeValid(finalIceCodeValid);
      
      // Create data object with all details
      const data = {
        iceCode: (finalIceCode || '').trim(),
        paymentFrequency: finalPaymentFrequency,
        iceCodeValid: finalIceCode && finalIceCode.trim() ? finalIceCodeValid : null,
        iceCodeInfo: finalIceCode && finalIceCode.trim() ? finalIceCodeInfo : null,
        interestedInLifetime: false,
        completionDate: new Date().toISOString()
      };
      
      console.log("MembershipPage: Submitting data to backend:", data);
      
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
    // Return DocuSign component using a portal to render it outside the normal layout
    return createPortal(
      <MembershipDocuSign
        membershipData={membershipData}
        packageData={packageData}
        contactData={contactData}
        onBack={handleBackFromDocuSign}
        onComplete={handleDocuSignComplete}
      />,
      document.body
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
      ...
    </div>
  );
  END OF COMMENTED OUT MEMBERSHIP FORM */
}