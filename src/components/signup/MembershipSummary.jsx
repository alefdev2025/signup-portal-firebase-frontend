import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../../contexts/UserContext";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import membershipService from "../../services/membership";
import { getContactInfo } from "../../services/contact";
import fundingService from "../../services/funding";
import { getMembershipCost } from "../../services/pricing";
import astronautLaunch from "../../assets/images/astronaut-launch.png";
import { PageLoader, InlineLoader } from "../DotLoader";
import PrimaryButton from '../signup/PrimaryButton';
import SecondaryButton from '../signup/SecondaryButton';
import { DelayedCenteredLoader } from '../../components/DotLoader';

export default function MembershipSummary({ 
  membershipData, 
  packageData, 
  contactData,
  fundingData,
  onBack,
  onSignAgreement 
}) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocuSignOverlay, setShowDocuSignOverlay] = useState(false);
  const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showSummaryIntroOverlay, setShowSummaryIntroOverlay] = useState(true);
  
  // Local state for editable membership details
  const [localIceCode, setLocalIceCode] = useState('');
  const [localIceCodeValid, setLocalIceCodeValid] = useState(null);
  const [localIceDiscountPercent, setLocalIceDiscountPercent] = useState(null);
  const [localIceDiscountAmount, setLocalIceDiscountAmount] = useState(null);
  const [isValidatingIceCode, setIsValidatingIceCode] = useState(false);
  
  // CMS Waiver and Privacy states
  const [cmsWaiver, setCmsWaiver] = useState(false);
  const [freelyReleaseName, setFreelyReleaseName] = useState(false);
  const [maintainConfidentiality, setMaintainConfidentiality] = useState(false);
  
  // Use system font like PackagePage
  const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const SKIP_DOCUSIGN_TEMP = import.meta.env.VITE_SKIP_DOCUSIGN_TEMP === 'true';

  // Load summary data from backend
  useEffect(() => {
    const loadSummaryData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Loading membership summary from existing services...");
        
        // 1. Get contact information
        let contactDataFromBackend = null;
        try {
          const contactResult = await getContactInfo();
          if (contactResult.success && contactResult.contactInfo) {
            contactDataFromBackend = contactResult.contactInfo;
            console.log("✅ Contact info loaded:", contactDataFromBackend);
          }
        } catch (err) {
          console.error("Error loading contact info:", err);
        }
        
        // 2. Get package information
        let packageDataFromBackend = null;
        try {
          const packageResult = await fundingService.getPackageInfoForFunding();
          if (packageResult.success) {
            packageDataFromBackend = {
              packageType: packageResult.packageType,
              preservationType: packageResult.preservationType,
              preservationEstimate: packageResult.preservationEstimate,
              annualCost: packageResult.annualCost
            };
            console.log("✅ Package info loaded:", packageDataFromBackend);
          }
        } catch (err) {
          console.error("Error loading package info:", err);
        }
        
        // 3. Get membership information
        let membershipDataFromBackend = null;
        try {
          const membershipResult = await membershipService.getMembershipInfo();
          if (membershipResult.success && membershipResult.data) {
            membershipDataFromBackend = membershipResult.data.membershipInfo;
            console.log("✅ Membership info loaded:", membershipDataFromBackend);
          }
        } catch (err) {
          console.error("Error loading membership info:", err);
        }
        
        // 4. Get funding information
        let fundingDataFromBackend = null;
        try {
          const fundingResult = await fundingService.getUserFundingInfo();
          console.log("Raw funding service response:", fundingResult);
          
          if (fundingResult.success) {
            if (fundingResult.data) {
              console.log("Funding data found:", fundingResult.data);
              fundingDataFromBackend = {
                fundingMethod: fundingResult.data.fundingMethod || fundingResult.data.method
              };
              console.log("✅ Funding info mapped:", fundingDataFromBackend);
            } else {
              console.log("⚠️ No funding data in response, using prop fallback");
              if (fundingData) {
                fundingDataFromBackend = {
                  fundingMethod: fundingData.fundingMethod || fundingData.method
                };
                console.log("✅ Using funding data from props:", fundingDataFromBackend);
              }
            }
          }
        } catch (err) {
          console.error("Error loading funding info:", err);
          if (fundingData) {
            fundingDataFromBackend = {
              fundingMethod: fundingData.fundingMethod || fundingData.method
            };
            console.log("✅ Using funding data from props after error:", fundingDataFromBackend);
          }
        }
        
        // 5. Get pricing information
        let pricingData = null;
        try {
          const pricingResult = await getMembershipCost();
          if (pricingResult?.success) {
            pricingData = {
              age: pricingResult.age,
              annualDues: pricingResult.annualDues,
              membershipCost: pricingResult.membershipCost || 540
            };
            console.log("✅ Pricing info loaded:", pricingData);
          }
        } catch (err) {
          console.error("Error loading pricing info:", err);
        }
        
        // Calculate costs
        const annualCost = pricingData?.membershipCost || packageDataFromBackend?.annualCost || 540;
        const hasIceDiscount = membershipDataFromBackend?.iceCodeValid && membershipDataFromBackend?.iceCodeInfo;
        const discountPercent = hasIceDiscount ? (membershipDataFromBackend.iceCodeInfo.discountPercent || 0) : 0;
        const discountAmount = hasIceDiscount ? Math.round(annualCost * (discountPercent / 100)) : 0;
        
        // Add application fee for non-basic memberships
        const isBasicMembership = packageDataFromBackend?.preservationType === 'basic';
        const applicationFee = isBasicMembership ? 0 : 300;
        
        let paymentAmount = annualCost;
        let firstPaymentAmount = annualCost - discountAmount + applicationFee;
        
        // Set summary data combining all sources
        setSummaryData({
          contactData: contactDataFromBackend || contactData || {},
          packageData: packageDataFromBackend || packageData || {},
          membershipData: membershipDataFromBackend || membershipData || {},
          fundingData: fundingDataFromBackend || fundingData || {},
          calculatedCosts: {
            baseCost: annualCost,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            paymentAmount: paymentAmount,
            firstPaymentAmount: firstPaymentAmount,
            hasIceDiscount: hasIceDiscount,
            applicationFee: applicationFee
          }
        });
        
      } catch (err) {
        console.error("Error loading summary:", err);
        setError("Failed to load membership summary. Please try again.");
        setSummaryData({
          contactData: contactData || {},
          packageData: packageData || {},
          membershipData: membershipData || {},
          fundingData: {},
          calculatedCosts: calculateCosts()
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSummaryData();
  }, []);

  // Set initial SMS phone number when data loads
  useEffect(() => {
    if (summaryData?.contactData) {
      const phoneNumber = summaryData.contactData.mobilePhone || 
                         summaryData.contactData.homePhone || 
                         summaryData.contactData.workPhone || '';
      setSmsPhoneNumber(phoneNumber);
    }
  }, [summaryData]);

  useEffect(() => {
    if (summaryData?.membershipData) {
      setLocalIceCode(summaryData.membershipData.iceCode || '');
      setLocalIceCodeValid(summaryData.membershipData.iceCodeValid || null);
      setLocalIceDiscountPercent(summaryData.membershipData.iceCodeInfo?.discountPercent || null);
    }
  }, [summaryData]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Add this new function after handleProceedToDocuSign
const handleCompleteDirectly = async () => {
  setIsSubmitting(true);
  setError(null);
  
  try {
    console.log("MembershipSummary: Completing membership directly (bypass mode)...");
    
    let finalIceCode = '';
    let finalIceDiscountAmount = 0;
    
    if (localIceCode && localIceCode.trim()) {
      console.log("Validating ICE code before submission...");
      const validationResult = await membershipService.validateIceCode(localIceCode.trim());
      
      if (validationResult.valid) {
        finalIceCode = localIceCode.trim();
        const discountPercent = validationResult.discountPercent || 25;
        finalIceDiscountAmount = Math.round((summaryData?.calculatedCosts?.baseCost || 540) * (discountPercent / 100));
        console.log("ICE code validated:", finalIceCode, "Discount amount:", finalIceDiscountAmount);
      } else {
        console.log("ICE code validation failed, proceeding without discount");
      }
    }
    
    const membershipCost = summaryData?.calculatedCosts?.baseCost || packageData?.annualCost;
    if (!membershipCost) {
      console.error("Missing membership cost - cannot proceed");
      setError("Membership cost not found. Please refresh and try again.");
      return;
    }

    // Use the phone number from contact data as fallback
    const phoneForRecord = smsPhoneNumber || 
                          data.contactData?.mobilePhone || 
                          data.contactData?.homePhone || 
                          data.contactData?.workPhone || '';

    const fundingMethod = summaryData?.fundingData?.fundingMethod || summaryData?.fundingData?.method || '';
    let fundingChoice = 'other';
    if (fundingMethod === 'insurance') fundingChoice = 'insurance';
    else if (fundingMethod === 'prepay') fundingChoice = 'prepay';
    
    const data = summaryData || {
      contactData: contactData || {},
      packageData: packageData || {},
      membershipData: membershipData || {},
      fundingData: {},
      calculatedCosts: calculateCosts()
    };
    
    const userFinalSelections = {
      firstName: data.contactData?.firstName || null,
      lastName: data.contactData?.lastName || null,
      fullName: `${data.contactData?.firstName || ''} ${data.contactData?.lastName || ''}`.trim(),
      email: data.contactData?.email || user?.email || '',
      sex: data.contactData?.sex || null,
      dateOfBirth: data.contactData?.dateOfBirth || null,
      
      phoneType: data.contactData?.phoneType || null,
      mobilePhone: data.contactData?.mobilePhone || null,
      workPhone: data.contactData?.workPhone || null,
      homePhone: data.contactData?.homePhone || null,
      primaryPhone: data.contactData?.mobilePhone || data.contactData?.homePhone || data.contactData?.workPhone || null,
      
      streetAddress: data.contactData?.streetAddress || null,
      city: data.contactData?.city || null,
      region: data.contactData?.region || null,
      postalCode: data.contactData?.postalCode || null,
      country: data.contactData?.country || null,
      cnty_hm: data.contactData?.cnty_hm || null,
      fullHomeAddress: data.contactData?.streetAddress ? 
        `${data.contactData.streetAddress}, ${data.contactData.city}, ${data.contactData.region} ${data.contactData.postalCode}, ${data.contactData.country}` : null,
      
      sameMailingAddress: data.contactData?.sameMailingAddress || 'Yes',
      mailingStreetAddress: data.contactData?.mailingStreetAddress || null,
      mailingCity: data.contactData?.mailingCity || null,
      mailingRegion: data.contactData?.mailingRegion || null,
      mailingPostalCode: data.contactData?.mailingPostalCode || null,
      mailingCountry: data.contactData?.mailingCountry || null,
      cnty_ml: data.contactData?.cnty_ml || null,
      fullMailingAddress: data.contactData?.mailingStreetAddress ? 
        `${data.contactData.mailingStreetAddress}, ${data.contactData.mailingCity}, ${data.contactData.mailingRegion} ${data.contactData.mailingPostalCode}, ${data.contactData.mailingCountry}` : null,
      
      iceCode: finalIceCode,
      iceCodeDiscountAmount: finalIceDiscountAmount,
      membership: membershipCost,
      submissionDate: new Date().toISOString(),
      
      cmsWaiver: cmsWaiver,
      freelyReleaseName: freelyReleaseName,
      maintainConfidentiality: maintainConfidentiality,
      
      fundingChoice: fundingChoice,
      preservationType: data.packageData?.preservationType || 'Not specified',
      preservationEstimate: data.packageData?.preservationEstimate || 0
    };
    
    console.log("User final selections:", userFinalSelections);
    
    if (onSignAgreement) {
      const updatedData = {
        paymentFrequency: 'annually',
        iceCode: localIceCode,
        iceCodeValid: localIceCodeValid,
        iceDiscountPercent: localIceDiscountPercent,
        userFinalSelections: userFinalSelections,
        docusignPhoneNumber: phoneForRecord
      };
      
      console.log("Passing to parent with docusignPhoneNumber:", updatedData.docusignPhoneNumber);
      await onSignAgreement(updatedData);
    }
  } catch (err) {
    console.error("Error completing membership:", err);
    setError("Failed to complete membership. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

// Handle showing the confirmation overlay OR completing directly
  const handleProceed = () => {
    if (SKIP_DOCUSIGN_TEMP) {
      handleCompleteDirectly();
    } else {
      handleShowConfirmation();
    }
  };

  // Get preservation type display text
  const getPreservationTypeText = (type) => {
    switch(type) {
      case 'neuro': return 'Neuropreservation';
      case 'wholebody': return 'Whole Body';
      case 'basic': return 'Basic Membership';
      default: return 'Not Selected';
    }
  };

  // Calculate costs (fallback for when API is not available)
  const calculateCosts = () => {
    const annualCost = packageData?.annualCost || 540;
    const hasIceDiscount = membershipData?.iceCodeValid && membershipData?.iceCodeInfo;
    const discountPercent = hasIceDiscount ? (membershipData?.iceCodeInfo?.discountPercent || 25) : 0;
    const discountAmount = hasIceDiscount ? Math.round(annualCost * (discountPercent / 100)) : 0;
    const isBasicMembership = packageData?.preservationType === 'basic';
    const applicationFee = isBasicMembership ? 0 : 300;
    
    let paymentAmount = annualCost;
    let firstPaymentAmount = annualCost - discountAmount + applicationFee;
    
    return {
      baseCost: annualCost,
      discountAmount,
      discountPercent,
      paymentAmount,
      firstPaymentAmount,
      hasIceDiscount,
      applicationFee
    };
  };

  // Calculate local costs based on current selections
  const calculateLocalCosts = () => {
    const annualCost = summaryData?.calculatedCosts?.baseCost || packageData?.annualCost || 540;
    const hasIceDiscount = localIceCodeValid === true;
    
    const discountPercent = localIceDiscountPercent || 
                           summaryData?.membershipData?.iceCodeInfo?.discountPercent || 
                           (hasIceDiscount ? 25 : 0);
    
    const discountAmount = hasIceDiscount ? Math.round(annualCost * (discountPercent / 100)) : 0;
    
    const isBasicMembership = summaryData?.packageData?.preservationType === 'basic' || packageData?.preservationType === 'basic';
    const applicationFee = isBasicMembership ? 0 : 300;
    // Remove CMS from today's payment
    const cmsAnnualFee = 0; // Never charged today
    
    let paymentAmount = annualCost;
    
    // Basic members: pay annual membership (with possible ICE discount)
    // Non-basic members: pay only application fee
    let firstPaymentAmount;
    if (isBasicMembership) {
        firstPaymentAmount = annualCost - discountAmount;
    } else {
        firstPaymentAmount = applicationFee; // Only application fee today
    }
    
    return {
      paymentAmount,
      firstPaymentAmount,
      discountAmount,
      discountPercent,
      hasIceDiscount,
      applicationFee,
      cmsAnnualFee
    };
  };

  // Handle ICE code validation
  const handleIceCodeValidation = async () => {
    if (!localIceCode.trim()) {
      setLocalIceCodeValid(null);
      setLocalIceDiscountPercent(null);
      return;
    }
    
    setIsValidatingIceCode(true);
    try {
      console.log("🔍 === ICE CODE VALIDATION DEBUG START ===");
      console.log("Validating ICE code:", localIceCode);
      
      const result = await membershipService.validateIceCode(localIceCode);
      
      console.log("📦 Raw validation result:", result);
      
      if (result.valid) {
        setLocalIceCodeValid(true);
        
        const discountPercent = result.discountPercent || 25;
        
        console.log("💰 Discount calculation:");
        console.log("   - Raw discountPercent from result:", result.discountPercent);
        console.log("   - Final discountPercent to use:", discountPercent);
        
        const numericDiscount = Number(discountPercent);
        console.log("   - Numeric discount:", numericDiscount);
        
        if (isNaN(numericDiscount) || numericDiscount < 0 || numericDiscount > 100) {
          console.error("❌ Invalid discount percentage:", numericDiscount);
          setLocalIceDiscountPercent(25);
          setLocalIceDiscountAmount(Math.round((summaryData?.calculatedCosts?.baseCost || 540) * 0.25));
        } else {
          setLocalIceDiscountPercent(numericDiscount);
          const discountAmount = Math.round((summaryData?.calculatedCosts?.baseCost || 540) * (numericDiscount / 100));
          setLocalIceDiscountAmount(discountAmount);
        }
        
        console.log("✅ Valid ICE code!");
        console.log("   Educator:", result.educatorName);
        console.log("   Final Discount:", numericDiscount + "%");
      } else {
        setLocalIceCodeValid(false);
        setLocalIceDiscountPercent(null);
        setLocalIceDiscountAmount(null);
        
        console.log("❌ Invalid ICE code:", result.error || "Unknown error");
      }
      console.log("🔍 === ICE CODE VALIDATION DEBUG END ===");
    } catch (error) {
      console.error("Error validating ICE code:", error);
      setLocalIceCodeValid(false);
      setLocalIceDiscountPercent(null);
      setLocalIceDiscountAmount(null);
    } finally {
      setIsValidatingIceCode(false);
    }
  };

  // Handle showing the confirmation overlay
  const handleShowConfirmation = () => {
    setError(null);
    setShowDocuSignOverlay(true);
  };

  const handleProceedToDocuSign = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("MembershipSummary: Proceeding to DocuSign...");
      console.log("SMS Phone Number from overlay:", smsPhoneNumber);
      
      setShowDocuSignOverlay(false);
      
      let finalIceCode = '';
      let finalIceDiscountAmount = 0;
      
      if (localIceCode && localIceCode.trim()) {
        console.log("Validating ICE code before submission...");
        const validationResult = await membershipService.validateIceCode(localIceCode.trim());
        
        if (validationResult.valid) {
          finalIceCode = localIceCode.trim();
          const discountPercent = validationResult.discountPercent || 25;
          finalIceDiscountAmount = Math.round((summaryData?.calculatedCosts?.baseCost || 540) * (discountPercent / 100));
          console.log("ICE code validated:", finalIceCode, "Discount amount:", finalIceDiscountAmount);
        } else {
          console.log("ICE code validation failed, proceeding without discount");
        }
      }
      
      const membershipCost = summaryData?.calculatedCosts?.baseCost || packageData?.annualCost;
      if (!membershipCost) {
        console.error("Missing membership cost - cannot proceed");
        setError("Membership cost not found. Please refresh and try again.");
        return;
      }

      const fundingMethod = summaryData?.fundingData?.fundingMethod || summaryData?.fundingData?.method || '';
      let fundingChoice = 'other';
      if (fundingMethod === 'insurance') fundingChoice = 'insurance';
      else if (fundingMethod === 'prepay') fundingChoice = 'prepay';
      
      const data = summaryData || {
        contactData: contactData || {},
        packageData: packageData || {},
        membershipData: membershipData || {},
        fundingData: {},
        calculatedCosts: calculateCosts()
      };
      
      const userFinalSelections = {
        firstName: data.contactData?.firstName || null,
        lastName: data.contactData?.lastName || null,
        fullName: `${data.contactData?.firstName || ''} ${data.contactData?.lastName || ''}`.trim(),
        email: data.contactData?.email || user?.email || '',
        sex: data.contactData?.sex || null,
        dateOfBirth: data.contactData?.dateOfBirth || null,
        
        phoneType: data.contactData?.phoneType || null,
        mobilePhone: data.contactData?.mobilePhone || null,
        workPhone: data.contactData?.workPhone || null,
        homePhone: data.contactData?.homePhone || null,
        primaryPhone: data.contactData?.mobilePhone || data.contactData?.homePhone || data.contactData?.workPhone || null,
        
        streetAddress: data.contactData?.streetAddress || null,
        city: data.contactData?.city || null,
        region: data.contactData?.region || null,
        postalCode: data.contactData?.postalCode || null,
        country: data.contactData?.country || null,
        cnty_hm: data.contactData?.cnty_hm || null,
        fullHomeAddress: data.contactData?.streetAddress ? 
          `${data.contactData.streetAddress}, ${data.contactData.city}, ${data.contactData.region} ${data.contactData.postalCode}, ${data.contactData.country}` : null,
        
        sameMailingAddress: data.contactData?.sameMailingAddress || 'Yes',
        mailingStreetAddress: data.contactData?.mailingStreetAddress || null,
        mailingCity: data.contactData?.mailingCity || null,
        mailingRegion: data.contactData?.mailingRegion || null,
        mailingPostalCode: data.contactData?.mailingPostalCode || null,
        mailingCountry: data.contactData?.mailingCountry || null,
        cnty_ml: data.contactData?.cnty_ml || null,
        fullMailingAddress: data.contactData?.mailingStreetAddress ? 
          `${data.contactData.mailingStreetAddress}, ${data.contactData.mailingCity}, ${data.contactData.mailingRegion} ${data.contactData.mailingPostalCode}, ${data.contactData.mailingCountry}` : null,
        
        iceCode: finalIceCode,
        iceCodeDiscountAmount: finalIceDiscountAmount,
        membership: membershipCost,
        submissionDate: new Date().toISOString(),
        
        cmsWaiver: cmsWaiver,
        freelyReleaseName: freelyReleaseName,
        maintainConfidentiality: maintainConfidentiality,
        
        fundingChoice: fundingChoice,
        preservationType: data.packageData?.preservationType || 'Not specified',
        preservationEstimate: data.packageData?.preservationEstimate || 0
      };
      
      console.log("User final selections:", userFinalSelections);
      
      if (onSignAgreement) {
        const updatedData = {
          paymentFrequency: 'annually',
          iceCode: localIceCode,
          iceCodeValid: localIceCodeValid,
          iceDiscountPercent: localIceDiscountPercent,
          userFinalSelections: userFinalSelections,
          docusignPhoneNumber: smsPhoneNumber
        };
        
        console.log("Passing to parent with docusignPhoneNumber:", updatedData.docusignPhoneNumber);
        await onSignAgreement(updatedData);
      }
    } catch (err) {
      console.error("Error proceeding to DocuSign:", err);
      setError("Failed to proceed to agreement signing. Please try again.");
      setShowDocuSignOverlay(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DelayedCenteredLoader 
        message="Loading your membership summary..." 
        size="md" 
        color="primary" 
        minHeight="200px"
        delay={500}
      />
    );
  }

  const data = summaryData || {
    contactData: contactData || {},
    packageData: packageData || {},
    membershipData: membershipData || {},
    fundingData: {},
    calculatedCosts: calculateCosts()
  };

  const isBasicMembership = data.packageData?.preservationType === 'basic';

  return (
    <>
      <div className="w-full">
        {/* Main Content */}
        <div 
          className="w-full bg-gray-100" 
          style={{
            width: '100vw',
            marginLeft: 'calc(-50vw + 50%)',
            marginRight: 'calc(-50vw + 50%)',
            position: 'relative',
            fontFamily: SYSTEM_FONT
          }}
        >
          <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Contact Information Section */}
            <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100"
                 style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Contact Information</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Name</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {data.contactData?.firstName} {data.contactData?.lastName}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Email</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {data.contactData?.email || user?.email}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Phone</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {data.contactData?.mobilePhone || data.contactData?.homePhone || data.contactData?.workPhone || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Date of Birth</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {data.contactData?.dateOfBirth || 'Not provided'}
                  </p>
                </div>
                
                {data.contactData?.phoneType && (
                  <div>
                    <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Preferred Contact Method</p>
                    <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                      {data.contactData.phoneType} Phone
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Same Mailing Address</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {data.contactData?.sameMailingAddress || 'Yes'}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Home Address</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {data.contactData?.streetAddress && (
                      <>
                        {data.contactData.streetAddress}<br />
                        {data.contactData.city}, {data.contactData.region} {data.contactData.postalCode}<br />
                        {data.contactData.country}
                        {data.contactData.cnty_hm && (
                          <><br />County: {data.contactData.cnty_hm}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
                
                {data.contactData?.sameMailingAddress === 'No' && data.contactData?.mailingStreetAddress && (
                  <div className="md:col-span-2">
                    <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Mailing Address</p>
                    <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                      {data.contactData.mailingStreetAddress}<br />
                      {data.contactData.mailingCity}, {data.contactData.mailingRegion} {data.contactData.mailingPostalCode}<br />
                      {data.contactData.mailingCountry}
                      {data.contactData.cnty_ml && (
                        <><br />County: {data.contactData.cnty_ml}</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Package Selection Section */}
            <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100"
                 style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">
                    {data.packageData?.preservationType === 'basic' ? 'Package' : 'Preservation Package'}
                  </h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>
                    {data.packageData?.preservationType === 'basic' ? 'Package Type' : 'Preservation Type'}
                  </p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {getPreservationTypeText(data.packageData?.preservationType)}
                  </p>
                </div>
                
                {data.packageData?.preservationType !== 'basic' && (
                  <div>
                    <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Preservation Cost (Estimate)</p>
                    <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                      {formatCurrency(data.packageData?.preservationEstimate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Details Section - Only show for non-basic packages */}
            {data.packageData?.preservationType !== 'basic' && (
              <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100"
                   style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Cryopreservation Funding</h2>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Selected Funding Method</p>
                  <p className="text-gray-600 font-light mt-1" style={{ fontSize: '15px' }}>
                    {(() => {
                      const method = data.fundingData?.fundingMethod || 
                                  data.fundingData?.method || 
                                  data.fundingData?.funding_method ||
                                  (data.fundingData && typeof data.fundingData === 'string' ? data.fundingData : null);
                      
                      console.log('Funding method:', method, 'Full funding data:', data.fundingData);
                      
                      if (!method || method === '') return 'Not Selected';
                      if (method === 'insurance') return 'Life Insurance';
                      if (method === 'prepay') return 'Prepayment';
                      if (method === 'undecided') return 'Decide Later';
                      if (method === 'none') return 'Not Required (Basic Membership)';
                      return method;
                    })()}
                  </p>
                  
                  <div className="mt-6 inline-block p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700" style={{ fontSize: '14px' }}>
                      <strong>Note:</strong> This documents your intent for funding your cryopreservation and is not a commitment.
                    </p>
                    
                    {(data.fundingData?.fundingMethod === 'insurance' || data.fundingData?.method === 'insurance') && (
                      <p className="text-gray-700 mt-3" style={{ fontSize: '14px' }}>
                        No insurance fees will be applied at this stage.
                      </p>
                    )}
                    
                    {(data.fundingData?.fundingMethod === 'prepay' || data.fundingData?.method === 'prepay') && (
                      <p className="text-gray-700 mt-3" style={{ fontSize: '14px' }}>
                        We'll reach out to you on the next steps for prepayment.
                      </p>
                    )}
                    
                    {(data.fundingData?.fundingMethod === 'later' || 
                      data.fundingData?.method === 'later' || 
                      data.fundingData?.fundingMethod === 'undecided' || 
                      data.fundingData?.method === 'undecided') && (
                      <p className="text-gray-700 mt-3" style={{ fontSize: '14px' }}>
                        Our team will assist you in determining the best option for you.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CMS Waiver Section - Only show for cryopreservation members */}
            {data.packageData?.preservationType !== 'basic' && (
              <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100"
                   style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Comprehensive Member Standby (CMS)</h2>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <p className="text-gray-700 text-sm mb-4">
                      <strong>CMS Program:</strong> Current CMS charges are <strong>$200</strong> U.S. annually. All Cryopreservation Members are subject to a waiting period of 180 days from the date the cryopreservation agreement is signed before joining the CMS program unless opting into the CMS waiver.
                    </p>
                    <p className="text-gray-700 text-sm">
                      <strong>CMS Waiver:</strong> In exchange for a waiver of the annual CMS fee, you agree to a permanent increase of $20,000 to your Cryopreservation Fund Minimum above the then-current minimum. When fund minimums are increased in the future, yours will always be $20,000 higher.
                    </p>
                  </div>
                  
                  <label className="flex items-start cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={cmsWaiver}
                      onChange={(e) => setCmsWaiver(e.target.checked)}
                      className="mt-0.5 w-5 h-5 text-[#775684] border-gray-300 rounded focus:ring-[#775684] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="ml-3">
                      <span className="text-gray-900 font-medium">Waive $200 annual CMS fee by increasing funding minimum by $20,000</span>
                      <p className="text-gray-600 text-xs mt-1">
                        Check this to avoid the annual CMS fee. Your preservation funding minimum will be permanently $20,000 higher.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Membership Details Section */}
            <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100"
                 style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Membership Details</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div>
                    <p className="text-gray-900 font-medium mb-3" style={{ fontSize: '16px' }}>ICE Discount Code</p>
                    <div className="flex items-start space-x-2">
                      <input
                        type="text"
                        value={localIceCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setLocalIceCode(value);
                          
                          if (!value.trim()) {
                            setLocalIceCodeValid(null);
                            setLocalIceDiscountPercent(null);
                            return;
                          }
                          
                          clearTimeout(window.iceCodeTimeout);
                          window.iceCodeTimeout = setTimeout(() => {
                            handleIceCodeValidation();
                          }, 500);
                        }}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-[#775684] focus:border-[#775684] text-sm"
                        style={{ maxWidth: '200px' }}
                      />
                      <button
                        onClick={handleIceCodeValidation}
                        disabled={!localIceCode || isValidatingIceCode}
                        className="px-3 py-2 bg-[#775684] text-white rounded-md hover:bg-[#664573] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all text-sm"
                      >
                        Apply
                      </button>
                    </div>
                    {localIceCode && localIceCodeValid === true && (
                      <p className="text-[#775684] mt-2 text-sm">
                        ✓ Valid code - {calculateLocalCosts().discountPercent}% discount applied
                      </p>
                    )}
                    {localIceCode && localIceCodeValid === false && (
                      <p className="text-red-600 mt-2 text-sm">
                        ✗ Invalid code
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                <div className="bg-gray-50 rounded-lg p-4">
  <p className="text-gray-900 font-medium mb-3" style={{ fontSize: '18px' }}>Payment Summary</p>
  <div className="space-y-2">
    
    {/* Application Fee - only for cryo members */}
    {!isBasicMembership && (
      <div className="flex justify-between items-center">
        <p className="text-gray-600 text-sm font-light">Application Fee (one-time)</p>
        <p className="text-gray-900 text-sm font-light">{formatCurrency(300)}</p>
      </div>
    )}
    
    {/* CMS Annual Fee - show but not charged today */}
    {!cmsWaiver && !isBasicMembership && (
      <>
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm font-light">
            CMS Annual Fee <span className="text-xs">(not due today)</span>
          </p>
          <p className="text-gray-400 text-sm font-light">
            {formatCurrency(200)}/yr
          </p>
        </div>
      </>
    )}
    
    {/* CMS Waiver Note */}
    {cmsWaiver && !isBasicMembership && (
      <div className="text-xs text-green-600 italic">
        ✓ CMS fee waived (funding minimum +$20,000)
      </div>
    )}
    
    {/* Annual Membership - Show for ALL members */}
    <div className="flex justify-between items-center">
      <p className={`text-sm font-light ${!isBasicMembership ? 'text-gray-400' : 'text-gray-600'}`}>
        Annual Membership {!isBasicMembership && <span className="text-xs">(not due today)</span>}
      </p>
      <p className={`text-sm font-light ${!isBasicMembership ? 'text-gray-400' : 'text-gray-900'}`}>
        {formatCurrency(summaryData?.calculatedCosts?.baseCost || 540)}/yr
      </p>
    </div>
    
    {/* ICE Discount - only for basic members */}
    {localIceCodeValid && isBasicMembership && (
      <div className="flex justify-between items-center">
        <p className="text-gray-600 text-sm font-light">ICE Discount ({calculateLocalCosts().discountPercent}%)</p>
        <p className="text-[#775684] text-sm font-light">
          -{formatCurrency(calculateLocalCosts().discountAmount)}
        </p>
      </div>
    )}
    
    {/* Total Due Today */}
    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
      <p className="text-gray-900 font-medium">Total Due Today</p>
      <p className="text-[#775684] font-semibold text-lg">
        {formatCurrency(calculateLocalCosts().firstPaymentAmount)}
      </p>
    </div>
    
    {/* Note about when fees start */}
    {!isBasicMembership && (
      <div className="text-xs text-gray-500 italic pt-1">
        *Annual dues and fees begin upon completion of cryopreservation contracts
      </div>
    )}
  </div>
</div>
                </div>
              </div>
            </div>
            
            {/* Privacy Preferences Section */}
            <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100"
                 style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Privacy Preferences</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 text-sm mb-4">Please select one of the following options regarding your membership information:</p>
                
                <label className="flex items-start cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={freelyReleaseName}
                    onChange={(e) => setFreelyReleaseName(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-[#775684] border-gray-300 rounded focus:ring-[#775684] focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="ml-3">
                    <span className="text-gray-900 font-medium text-sm md:text-base">I give Alcor permission to freely release my name and related Alcor membership status at its discretion</span>
                  </div>
                </label>

                <label className="flex items-start cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={maintainConfidentiality}
                    onChange={(e) => setMaintainConfidentiality(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-[#775684] border-gray-300 rounded focus:ring-[#775684] focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="ml-3">
                    <span className="text-gray-900 font-medium text-sm md:text-base">Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor's General Terms and Conditions</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Notice - Clean white background with border */}
            {/* Payment Notice - Clean white background with border */}
            {(
              <div className="bg-white border-2 border-gray-300 rounded-[1.25rem] p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg flex-shrink-0 transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-800" style={{ fontSize: '18px' }}>
                        You'll only be charged {isBasicMembership ? 'your annual membership' : 'your application fee'} today.
                      </p>
                      
                      {!isBasicMembership && (
                        <p className="text-gray-700 mt-3 font-light" style={{ fontSize: '16px' }}>
                          Annual membership dues will begin when you complete your cryopreservation contracts.
                        </p>
                      )}
                      
                      {(data.fundingData?.fundingMethod === 'insurance' || data.fundingData?.method === 'insurance') && (
                        <p className="text-gray-700 mt-3 font-light" style={{ fontSize: '16px' }}>
                          No insurance fees will be applied at this stage.
                        </p>
                      )}
                      
                      {(data.fundingData?.fundingMethod === 'prepay' || data.fundingData?.method === 'prepay') && (
                        <p className="text-gray-700 mt-3 font-light" style={{ fontSize: '16px' }}>
                          We'll reach out to you on the next steps for prepayment.
                        </p>
                      )}
                      
                      {(data.fundingData?.fundingMethod === 'later' || data.fundingData?.method === 'later') && (
                        <p className="text-gray-700 mt-3 font-light" style={{ fontSize: '16px' }}>
                          We'll reach out to you to go over your options for funding your cryopreservation contract.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pb-[150px] md:pb-0">
              <SecondaryButton
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                showArrow={true}
                arrowDirection="left"
              >
                Back
              </SecondaryButton>
              
              <PrimaryButton
                onClick={handleProceed}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Processing..."
                showArrow={false}
              >
                {SKIP_DOCUSIGN_TEMP ? 'Complete Membership' : 'Sign Agreement'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  {SKIP_DOCUSIGN_TEMP ? (
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  ) : (
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  )}
                </svg>
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* DocuSign Confirmation Overlay */}
      {/* DocuSign/Payment Confirmation Overlay - Only show when not bypassing */}
        {!SKIP_DOCUSIGN_TEMP && showDocuSignOverlay && createPortal(
          <div 
            onClick={() => setShowDocuSignOverlay(false)}
            className="fixed inset-0 z-[100] overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50"></div>
            <div className="flex min-h-full items-center justify-center p-4">
              <div 
                className="relative bg-white rounded-2xl w-full max-w-3xl animate-fadeInUp shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
            <div className="px-10 py-6 border-b border-gray-100 relative">
              <button 
                onClick={() => setShowDocuSignOverlay(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300" 
                    style={{
                      background: 'linear-gradient(135deg, #512BD9 0%, #032CA6 100%)',
                      border: '1px solid rgba(81, 43, 217, 0.2)',
                      boxShadow: '0 4px 12px rgba(81, 43, 217, 0.15)'
                    }}>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">Confirm Your Information</h3>
                </div>
              </div>
            </div>
                
            <div className="px-10 py-8 bg-white">
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-base font-semibold text-blue-800 mb-1">Ready to Proceed?</h4>
                      <p className="text-blue-700 text-sm leading-relaxed">
                        Please confirm that all your information in the summary is correct. You'll be taken to sign your membership agreement electronically.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 mb-2">SMS Verification Required</h4>
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        Docusign will send an SMS verification code to validate your identity for electronic signature.
                      </p>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-gray-600 font-medium text-sm">SMS will be sent to:</label>
                          <button
                            onClick={() => setIsEditingPhone(!isEditingPhone)}
                            className="text-[#775684] hover:text-[#664573] font-medium text-sm"
                          >
                            {isEditingPhone ? 'Cancel' : 'Change'}
                          </button>
                        </div>
                        
                        {isEditingPhone ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="tel"
                              value={smsPhoneNumber}
                              onChange={(e) => setSmsPhoneNumber(e.target.value)}
                              className="flex-1 p-2 border border-gray-300 rounded-md text-base"
                              placeholder="Enter phone number"
                            />
                            <button
                              onClick={() => setIsEditingPhone(false)}
                              className="bg-[#775684] text-white px-3 py-2 rounded-md hover:bg-[#664573] text-sm"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-900 text-lg font-medium">
                            {smsPhoneNumber || 'No phone number provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                
                <div className="px-10 py-5 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => setShowDocuSignOverlay(false)}
                    className="px-5 py-2 bg-transparent border border-gray-400 text-gray-700 rounded-full font-normal text-sm hover:bg-gray-50 transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleProceedToDocuSign}
                    disabled={isSubmitting || !smsPhoneNumber}
                    className={`px-5 py-2 rounded-full font-normal text-sm transition-all duration-300 ${
                      !isSubmitting && smsPhoneNumber
                        ? "bg-transparent border border-[#775684] text-[#775684] hover:bg-gray-50" 
                        : "bg-transparent border border-gray-300 text-gray-400 cursor-not-allowed"
                    } disabled:opacity-50`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin inline -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Proceed to DocuSign"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
 
      {/* Summary Introduction Overlay */}
      {showSummaryIntroOverlay && createPortal(
        <div 
          onClick={() => setShowSummaryIntroOverlay(false)}
          className="fixed inset-0 z-[100] overflow-y-auto"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50"></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="relative bg-white rounded-2xl w-full max-w-3xl animate-fadeInUp shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-10 py-6 border-b border-gray-100 relative">
                <button 
                  onClick={() => setShowSummaryIntroOverlay(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">Review Your Membership Summary</h2>
                  </div>
                </div>
              </div>
              
              <div className="px-10 py-8 bg-white">
                <div className="space-y-6">
                  <p className="text-gray-700 text-base leading-relaxed">
                    You're almost done! This page shows a complete summary of your membership selections.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Please verify the following:</h3>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-gray-700 text-sm">Your contact information is correct</p>
                      </div>
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-gray-700 text-sm">Your selected package type matches your preference</p>
                      </div>
                      {data.packageData?.preservationType !== 'basic' && (
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-gray-700 text-sm">Your funding method selection is accurate</p>
                        </div>
                      )}
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-[#775684] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-gray-700 text-sm">The payment amount is what you expect</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Have an ICE discount code?</strong> You can enter it in the Membership Details section below to reduce your first-year dues.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-10 py-5 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowSummaryIntroOverlay(false)}
                className="px-5 py-2 bg-transparent border border-[#775684] text-[#775684] rounded-full font-normal text-sm hover:bg-gray-50 transition-all duration-300"
              >
                Review My Summary
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}