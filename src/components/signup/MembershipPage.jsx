// File: pages/signup/MembershipPage.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import HelpPanel from "./HelpPanel";
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
    content: "Choose how often you'd like to pay your membership dues. Annual payment often includes discounts."
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

export default function MembershipPage({ initialData, onBack, onNext }) {
  const { user } = useUser();
  
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [iceCode, setIceCode] = useState(initialData?.iceCode || "");
  const [paymentFrequency, setPaymentFrequency] = useState(initialData?.paymentFrequency || "annually");
  const [iceCodeValid, setIceCodeValid] = useState(initialData?.iceCodeValid || null);
  const [iceCodeInfo, setIceCodeInfo] = useState(initialData?.iceCodeInfo || null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [showIceInfo, setShowIceInfo] = useState(false);
  const [interestedInLifetime, setInterestedInLifetime] = useState(initialData?.interestedInLifetime || false);
  
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
        
        // If initialData contains package info, use it
        if (initialData && initialData.packageType && initialData.preservationType) {
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
        
        // Load membership costs - this might be redundant now
        const costsResult = await membershipService.getMembershipCosts();
        if (costsResult.success) {
          // Only update if we didn't get costs from pricing service
          if (!membershipCosts) {
            setMembershipCosts(costsResult.data);
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
  }, [initialData]);
  
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
  
  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Handler for back button
  const handleBackClick = () => {
    console.log("********** MembershipPage: Handle back button clicked **********");
    
    if (onBack) {
      return onBack();
    }
  };
  
  // Handler for next button
  const handleNext = async () => {
    if (!paymentFrequency) return;
    
    setIsSubmitting(true);
    
    try {
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
        paymentFrequency,
        iceCodeValid: iceCode.trim() ? iceCodeValid : null,
        iceCodeInfo: iceCode.trim() ? iceCodeInfo : null,
        interestedInLifetime: paymentFrequency === "lifetime",
        completionDate: new Date().toISOString()
      };
      
      console.log("MembershipPage: Submitting data:", data);
      
      // If onNext prop is provided, use it (for step integration)
      if (onNext) {
        return await onNext(data);
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
  
  // Calculate lifetime membership cost based on age
  const getLifetimeCost = () => {
    // Get user's age - prioritize membershipAge from pricing service, then other sources
    const userAge = membershipAge || user?.age || initialData?.age || 40; // Default to 40 if no age available
    
    console.log("MembershipPage: getLifetimeCost calculation:", {
      membershipAge: membershipAge,
      userAge_from_context: user?.age,
      userAge_from_initialData: initialData?.age,
      final_userAge: userAge
    });
    
    // Calculate years remaining (assuming life expectancy of 80)
    const yearsRemaining = Math.max(80 - userAge, 10); // Minimum 10 years
    
    // Get the annual membership cost (should be around $540)
    const annualCost = getAnnualCost();
    
    // Debug logging
    console.log("Lifetime calculation debug:", {
      userAge,
      yearsRemaining,
      annualCost,
      calculation: yearsRemaining * annualCost
    });
    
    // Lifetime cost calculation: Years Remaining × Annual Membership Cost
    let lifetimeCost = yearsRemaining * annualCost;
    
    // Apply ICE discount to first year only if valid
    if (iceCodeValid && iceCodeInfo) {
      // Calculate the discount amount for one year (25% of annual cost)
      const firstYearDiscount = annualCost * 0.25;
      lifetimeCost = lifetimeCost - firstYearDiscount;
    }
    
    return Math.round(lifetimeCost);
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
            <p className="mt-4 text-xl text-gray-600">Loading membership options...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8">
            <p className="text-red-700 text-lg">{error}</p>
            <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
          </div>
        ) : (
          <div className="mb-8">
            {/* Header */}
            <div className="mb-8">
              {costs && costs.discountAmount > 0 && (
                <div className="text-center mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                    <div className="flex items-center text-green-800">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">ICE Discount Applied: Save {formatCurrency(costs.discountAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Options */}
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#323053] mb-6 flex flex-col sm:flex-row sm:items-center">
                <div className="flex items-center mb-2 sm:mb-0">
                  <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 md:w-10 md:h-10 mr-2" />
                  Select your payment frequency:
                </div>
                <span className="text-2xl md:text-3xl text-[#775684] sm:ml-4">
                  {costs && costs.discountAmount > 0 ? (
                    <>
                      <span className="line-through text-gray-400 text-xl mr-2">{formatCurrency(costs.baseCost)}</span>
                      {formatCurrency(costs.finalAnnualCost)}
                    </>
                  ) : (
                    formatCurrency(costs?.baseCost || getAnnualCost())
                  )} USD/year
                </span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Monthly Option */}
                <div 
                  onClick={() => handlePaymentFrequencyChange("monthly")}
                  className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                    paymentFrequency === "monthly" 
                      ? "border-[#775684] bg-gray-50 shadow-md" 
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
                      Monthly
                      <img src={alcorStar} alt="Alcor Star" className="w-7 h-7 ml-1" />
                    </h4>
                    
                    <div className="mb-8">
                      <div className="text-6xl font-bold text-gray-900 mb-2">
                        {costs ? formatCurrency(costs.finalMonthlyCost) : formatCurrency(getMonthlyCost())}
                      </div>
                      <p className="text-gray-600 text-lg">
                        <span className="font-semibold">USD</span> • First month
                      </p>
                      <p className="text-gray-500 text-base">
                        Renews monthly
                      </p>
                      {costs && costs.discountAmount > 0 && iceCodeValid && paymentFrequency === "monthly" && (
                        <p className="text-green-600 text-sm font-medium mt-1">
                          Saving {formatCurrency(costs.discountAmount)}/year with ICE code!
                        </p>
                      )}
                    </div>
                    
                    <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
                      paymentFrequency === "monthly"
                        ? "bg-[#775684] text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}>
                      {paymentFrequency === "monthly" ? "Selected" : "Select Monthly"}
                    </button>
                  </div>
                </div>
                
                {/* Annual Option */}
                <div 
                  onClick={() => handlePaymentFrequencyChange("annually")}
                  className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                    paymentFrequency === "annually" 
                      ? "border-[#775684] bg-gray-50 shadow-md" 
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
                      Annual
                      <img src={alcorStar} alt="Alcor Star" className="w-7 h-7 ml-1" />
                    </h4>
                    
                    <div className="mb-8">
                      <div className="text-6xl font-bold text-gray-900 mb-2">
                        {costs ? formatCurrency(costs.finalAnnualCost) : formatCurrency(getAnnualCost())}
                      </div>
                      <p className="text-gray-600 text-lg">
                        <span className="font-semibold">USD</span> • Per year
                      </p>
                      <p className="text-gray-500 text-base">
                        Renews annually
                      </p>
                      {costs && costs.discountAmount > 0 && iceCodeValid && paymentFrequency === "annually" && (
                        <p className="text-green-600 text-sm font-medium mt-1">
                          Saving {formatCurrency(costs.discountAmount)}/year with ICE code!
                        </p>
                      )}
                    </div>
                    
                    <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
                      paymentFrequency === "annually"
                        ? "bg-[#775684] text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}>
                      {paymentFrequency === "annually" ? "Selected" : "Select Annual"}
                    </button>
                  </div>
                </div>
                
                {/* Lifetime Option */}
                <div 
                  onClick={() => handlePaymentFrequencyChange("lifetime")}
                  className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                    paymentFrequency === "lifetime" 
                      ? "border-[#775684] bg-gray-50 shadow-md" 
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
                      Lifetime
                      <img src={alcorStar} alt="Alcor Star" className="w-7 h-7 ml-1" />
                    </h4>
                    
                    <div className="mb-8">
                      <div className="text-6xl font-bold text-gray-900 mb-2">
                        {formatCurrency(getLifetimeCost())}
                      </div>
                      <p className="text-gray-600 text-lg">
                        <span className="font-semibold">One-time payment</span>
                      </p>
                      <p className="text-gray-500 text-base">
                        Never pay dues again
                      </p>
                      {iceCodeValid && iceCodeInfo && paymentFrequency === "lifetime" && (
                        <p className="text-green-600 text-sm font-medium mt-1">
                          {formatCurrency(135)} ICE discount applied to first year!
                        </p>
                      )}
                    </div>
                    
                    <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
                      paymentFrequency === "lifetime"
                        ? "bg-[#775684] text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}>
                      {paymentFrequency === "lifetime" ? "Selected" : "Select Lifetime"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ICE Code Section - Updated with ICE logo */}
            <div className="mb-8 mt-12">
              <div className="bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] border border-gray-200 rounded-xl p-10 shadow-sm">
                {/* Header with ICE Logo - Left Aligned */}
                <div className="flex items-center mb-10">
                  <div className="bg-white w-20 h-20 rounded-lg flex items-center justify-center mr-6 shadow-lg border border-gray-200">
                    <img 
                      src={iceLogo} 
                      alt="ICE Logo" 
                      className="h-14 w-14 object-contain"
                      onError={(e) => {
                        // Fallback to gradient icon if ICE logo fails to load
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="bg-gradient-to-br from-[#775684] to-[#5a4063] w-full h-full rounded-lg hidden items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-bold text-[#323053]">ICE Discount Code<img src={alcorStar} alt="Alcor Star" className="w-6 h-6 ml-1 inline" /></h3>
                      <button 
                        onClick={() => setShowIceInfo(!showIceInfo)}
                        className="bg-[#775684] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#664573] transition-colors text-lg font-bold ml-2"
                        title="What's an ICE Code?"
                      >
                        ?
                      </button>
                    </div>
                    <p className="text-gray-600 mt-2 text-lg">Save money with your Independent Cryonics Educator discount (first year only)</p>
                  </div>
                </div>

                {/* Input Section - Left Aligned */}
                <div className="max-w-md">
                  <div className="relative mb-6">
                    <input
                      type="text"
                      value={iceCode}
                      onChange={handleIceCodeChange}
                      placeholder="Enter ICE discount code"
                      className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684] pr-16 font-mono tracking-wider"
                      style={{...marcellusStyle, fontFamily: 'monospace'}}
                    />
                    
                    {/* Validation indicator */}
                    <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                      {isValidatingCode ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-[#775684]"></div>
                      ) : iceCode.trim() && iceCodeValid === true ? (
                        <svg className="h-9 w-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : iceCode.trim() && iceCodeValid === false ? (
                        <svg className="h-9 w-9 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Demo codes hint */}
                  {!iceCode.trim() && (
                    <div className="text-base text-gray-500">
                      <p>Demo: ICE2024DEMO, MEMBER2024, CRYOMEM2024</p>
                    </div>
                  )}
                </div>
                
                {/* Validation messages - Full width below input */}
                {iceCode.trim() && iceCodeValid === true && iceCodeInfo && (
                  <div className="bg-[#f0f2ff] border border-[#e0e3ff] rounded-lg p-6 mb-4">
                    <div className="flex items-center mb-4">
                      <svg className="h-6 w-6 text-black mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-black font-bold text-2xl">Valid ICE Code!</span>
                    </div>
                    <div className="text-black space-y-3 text-xl">
                      <p>Educator: <span className="font-semibold">{iceCodeInfo.educatorName}</span></p>
                      <p>Your Discount: <span className="font-semibold text-2xl">25% ({formatCurrency(costs.discountAmount)}) - First Year Only</span></p>
                      <p className="text-black text-lg mt-4">💡 Complete a cryopreservation contract to increase your discount to 50%!</p>
                    </div>
                  </div>
                )}
                
                {iceCode.trim() && iceCodeValid === false && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-4">
                    <div className="flex items-center">
                      <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-800 font-bold text-xl">Invalid ICE code</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
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
            onClick={handleNext}
            disabled={isSubmitting || !paymentFrequency || (iceCode.trim() && iceCodeValid === false)}
            className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] ${
              paymentFrequency && !(iceCode.trim() && iceCodeValid === false) ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
      
      {/* ICE Info Modal - Updated with ICE logo */}
      {showIceInfo && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Semi-transparent backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" onClick={() => setShowIceInfo(false)}></div>
          
          {/* Modal container */}
          <div className="relative flex min-h-screen items-center justify-center p-4">
            {/* Modal content */}
            <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              {/* Header with purple gradient and ICE logo */}
              <div 
                className="flex items-center justify-between rounded-t-lg px-6 py-4"
                style={{
                  background: 'linear-gradient(90deg, #6f2d74 0%, #8a4099 100%)'
                }}
              >
                <div className="flex items-center">
                  <img 
                    src={iceLogo} 
                    alt="ICE Logo" 
                    className="h-10 mr-4 filter brightness-0 invert"
                    onError={(e) => {
                      // Fallback to star icon if ICE logo fails to load
                      e.target.src = alcorStar;
                      e.target.className = "h-10 mr-4 filter brightness-0 invert";
                    }}
                  />
                  <h2 className="text-3xl font-bold text-white">
                    What's an ICE Code<img src={alcorStar} alt="Alcor Star" className="w-6 h-6 ml-1 inline filter brightness-0 invert" />?
                  </h2>
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => setShowIceInfo(false)}
                  className="text-white hover:text-gray-200 focus:outline-none"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content area with scrolling */}
              <div className="max-h-[70vh] overflow-y-auto p-8">
                <div className="prose prose-lg max-w-none">
                  <div className="text-gray-700 space-y-6 text-lg">
                    <p>
                      <strong>ICE (Independent Cryonics Educator)</strong> codes are special discount codes provided by certified educators who help spread awareness about cryonics and Alcor's services. ICE educators receive 50% of your first-year dues as compensation for successful referrals.
                    </p>
                    
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-800 mb-4 text-2xl">
                        Discount Levels
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-3 border-b border-gray-300">
                          <span className="text-gray-700 font-medium text-lg">Non-Alcor Member ICE:</span>
                          <span className="text-gray-900 font-bold text-lg">10% off first year</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-300">
                          <span className="text-gray-700 font-medium text-lg">Alcor Member ICE:</span>
                          <span className="text-gray-900 font-bold text-lg">25% off first year</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-700 font-medium text-lg">Alcor Cryopreservation Member ICE:</span>
                          <span className="text-gray-900 font-bold text-lg">50% off first year</span>
                        </div>
                      </div>
                    </div>
                    
                    <p>
                      If you learned about Alcor from an ICE educator and received a discount code, enter it below to save on your membership dues! The discount applies to your first year of membership only.
                    </p>
                    
                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3 text-xl">
                        How it works:
                      </h4>
                      <ol className="list-decimal list-inside text-gray-700 space-y-2 text-xl">
                        <li>Enter your ICE code during signup</li>
                        <li>Your discount is automatically applied</li>
                        <li>ICE educator receives 50% of your first-year dues as compensation</li>
                        <li>You save money on your first year!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer with close button */}
              <div className="border-t border-gray-200 p-6 flex justify-end">
                <button
                  onClick={() => setShowIceInfo(false)}
                  style={{ backgroundColor: "#0c2340" }}
                  className="px-6 py-2 rounded-full text-white font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={membershipHelpContent} 
      />
    </div>
  );
}