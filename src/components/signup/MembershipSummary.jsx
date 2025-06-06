import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../../contexts/UserContext";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import membershipService from "../../services/membership";
import { getContactInfo } from "../../services/contact";
import fundingService from "../../services/funding";
import { getMembershipCost } from "../../services/pricing";
import astronautLaunch from "../../assets/images/astronaut-launch.png";

export default function MembershipSummary({ 
  membershipData, 
  packageData, 
  contactData,
  fundingData, // Add fundingData as a prop
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
  
  // Local state for editable membership details
  const [localPaymentFrequency, setLocalPaymentFrequency] = useState('annually');
  const [localIceCode, setLocalIceCode] = useState('');
  const [localIceCodeValid, setLocalIceCodeValid] = useState(null);
  const [isValidatingIceCode, setIsValidatingIceCode] = useState(false);
  
  // Use system font like PackagePage
  const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
        // 4. Get funding information
        let fundingDataFromBackend = null;
        try {
          const fundingResult = await fundingService.getUserFundingInfo();
          console.log("Raw funding service response:", fundingResult);
          
          if (fundingResult.success) {
            // Check if data exists in the response
            if (fundingResult.data) {
              console.log("Funding data found:", fundingResult.data);
              fundingDataFromBackend = {
                // Just get the funding method
                fundingMethod: fundingResult.data.fundingMethod || fundingResult.data.method
              };
              console.log("✅ Funding info mapped:", fundingDataFromBackend);
            } else {
              console.log("⚠️ No funding data in response, using prop fallback");
              // Use the fundingData prop as fallback
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
          // Use the fundingData prop as fallback
          if (fundingData) {
            fundingDataFromBackend = {
              fundingMethod: fundingData.fundingMethod || fundingData.method
            };
            console.log("✅ Using funding data from props after error:", fundingDataFromBackend);
          }
        }
        
        // 5. Get pricing information (for annual cost)
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
        
        let paymentAmount = annualCost;
        let firstPaymentAmount = annualCost - discountAmount;
        
        if (membershipDataFromBackend?.paymentFrequency === 'monthly') {
          paymentAmount = Math.round(annualCost / 12);
          firstPaymentAmount = Math.round((annualCost - discountAmount) / 12);
        } else if (membershipDataFromBackend?.paymentFrequency === 'quarterly') {
          paymentAmount = Math.round(annualCost / 4);
          firstPaymentAmount = Math.round((annualCost - discountAmount) / 4);
        }
        
        // Set summary data combining all sources
        setSummaryData({
          contactData: contactDataFromBackend || contactData || {},
          packageData: packageDataFromBackend || packageData || {},
          membershipData: membershipDataFromBackend || membershipData || {},
          fundingData: fundingDataFromBackend || fundingData || {}, // Add fallback to props
          calculatedCosts: {
            baseCost: annualCost,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            paymentAmount: paymentAmount,
            firstPaymentAmount: firstPaymentAmount,
            hasIceDiscount: hasIceDiscount
          }
        });
        
      } catch (err) {
        console.error("Error loading summary:", err);
        setError("Failed to load membership summary. Please try again.");
        // Use props as fallback
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
      console.log('Backend payment frequency:', summaryData.membershipData.paymentFrequency);
      
      // Only set if there's actually a saved value AND it's a valid option
      if (summaryData.membershipData.paymentFrequency) {
        const savedFrequency = summaryData.membershipData.paymentFrequency;
        
        // Only set to valid options (annually or monthly)
        if (savedFrequency === 'annually' || savedFrequency === 'monthly') {
          setLocalPaymentFrequency(savedFrequency);
        } else {
          // Default to annually if saved value is not a current option
          setLocalPaymentFrequency('annually');
        }
      }
      
      // Keep the rest as is
      setLocalIceCode(summaryData.membershipData.iceCode || '');
      setLocalIceCodeValid(summaryData.membershipData.iceCodeValid || null);
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

  // Get payment frequency display text
  const getPaymentFrequencyText = (frequency) => {
    switch(frequency) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'annually': return 'Annual';
      case 'lifetime': return 'Lifetime (Custom Quote)';
      default: return 'Annual';
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
    const discountAmount = hasIceDiscount ? Math.round(annualCost * 0.25) : 0;
    
    let paymentAmount = annualCost;
    if (membershipData?.paymentFrequency === 'monthly') {
      paymentAmount = Math.round(annualCost / 12);
    } else if (membershipData?.paymentFrequency === 'quarterly') {
      paymentAmount = Math.round(annualCost / 4);
    }
    
    const firstPaymentAmount = hasIceDiscount ? paymentAmount - (membershipData?.paymentFrequency === 'monthly' ? Math.round(discountAmount / 12) : membershipData?.paymentFrequency === 'quarterly' ? Math.round(discountAmount / 4) : discountAmount) : paymentAmount;
    
    return {
      baseCost: annualCost,
      discountAmount,
      paymentAmount,
      firstPaymentAmount,
      hasIceDiscount
    };
  };

  // Calculate local costs based on current selections
  const calculateLocalCosts = () => {
    const annualCost = summaryData?.calculatedCosts?.baseCost || packageData?.annualCost || 540;
    const hasIceDiscount = localIceCodeValid === true;
    const discountAmount = hasIceDiscount ? Math.round(annualCost * 0.25) : 0;
    
    const monthlyAmount = Math.round(annualCost / 12);
    const quarterlyAmount = Math.round(annualCost / 4);
    const annualAmount = annualCost;
    
    let paymentAmount = annualCost;
    let firstPaymentAmount = annualCost;
    
    if (localPaymentFrequency === 'monthly') {
      paymentAmount = monthlyAmount;
      firstPaymentAmount = hasIceDiscount ? monthlyAmount - Math.round(discountAmount / 12) : monthlyAmount;
    } else if (localPaymentFrequency === 'quarterly') {
      paymentAmount = quarterlyAmount;
      firstPaymentAmount = hasIceDiscount ? quarterlyAmount - Math.round(discountAmount / 4) : quarterlyAmount;
    } else {
      firstPaymentAmount = hasIceDiscount ? annualCost - discountAmount : annualCost;
    }
    
    return {
      monthlyAmount,
      quarterlyAmount,
      annualAmount,
      paymentAmount,
      firstPaymentAmount,
      discountAmount,
      hasIceDiscount
    };
  };

  // Handle payment frequency change
  const handlePaymentFrequencyChange = (frequency) => {
    setLocalPaymentFrequency(frequency);
  };

  // Handle ICE code validation
  const handleIceCodeValidation = async () => {
    if (!localIceCode.trim()) {
      setLocalIceCodeValid(null);
      return;
    }
    
    setIsValidatingIceCode(true);
    try {
      console.log("Validating ICE code:", localIceCode);
      const result = await membershipService.validateIceCode(localIceCode);
      console.log("ICE code validation result:", result);
      
      setLocalIceCodeValid(result.valid);
      if (result.valid) {
        // Store the ICE code info if needed
        console.log("Valid ICE code info:", result);
      }
    } catch (error) {
      console.error("Error validating ICE code:", error);
      setLocalIceCodeValid(false);
    } finally {
      setIsValidatingIceCode(false);
    }
  };

  // Handle showing the confirmation overlay
  const handleShowConfirmation = () => {
    setShowDocuSignOverlay(true);
  };

  const handleProceedToDocuSign = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("MembershipSummary: Proceeding to DocuSign...");
      
      // Close the overlay first
      setShowDocuSignOverlay(false);
      
      // Pass the updated values back to parent
      if (onSignAgreement) {
        // Pass an object with updated values, not the event
        const updatedData = {
          paymentFrequency: localPaymentFrequency,
          iceCode: localIceCode,
          iceCodeValid: localIceCodeValid
        };
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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
        <p className="mt-4 text-xl text-gray-600">Loading your membership summary...</p>
      </div>
    );
  }

  const data = summaryData || {
    contactData: contactData || {},
    packageData: packageData || {},
    membershipData: membershipData || {},
    fundingData: {},
    calculatedCosts: calculateCosts()
  };

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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="mb-8 flex items-start pt-4">
                <div className="p-3 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                       style={{
                         backgroundSize: '400% 100%',
                         backgroundPosition: '0% 50%'
                       }}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4 pt-2">
                  <h2 className="text-xl font-normal text-[#323053]" style={{ fontSize: '20px' }}>Contact Information</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Name</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {data.contactData?.firstName} {data.contactData?.lastName}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Email</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {data.contactData?.email || user?.email}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Phone</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {data.contactData?.mobilePhone || data.contactData?.homePhone || data.contactData?.workPhone || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Date of Birth</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {data.contactData?.dateOfBirth || 'Not provided'}
                  </p>
                </div>
                
                {/* Phone Type Preference */}
                {data.contactData?.phoneType && (
                  <div>
                    <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Preferred Contact Method</p>
                    <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                      {data.contactData.phoneType} Phone
                    </p>
                  </div>
                )}
                
                {/* Same Mailing Address */}
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Same Mailing Address</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {data.contactData?.sameMailingAddress || 'Yes'}
                  </p>
                </div>
                
                {/* Home Address */}
                <div className="md:col-span-2">
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Home Address</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
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
                
                {/* Mailing Address (if different) */}
                {data.contactData?.sameMailingAddress === 'No' && data.contactData?.mailingStreetAddress && (
                  <div className="md:col-span-2">
                    <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Mailing Address</p>
                    <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="mb-8 flex items-start pt-4">
                <div className="p-3 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                      style={{
                        backgroundSize: '400% 100%',
                        backgroundPosition: '33% 50%'
                      }}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4 pt-2">
                  <h2 className="text-xl font-normal text-[#323053]" style={{ fontSize: '20px' }}>
                    {data.packageData?.preservationType === 'basic' ? 'Package' : 'Preservation Package'}
                  </h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>
                    {data.packageData?.preservationType === 'basic' ? 'Package Type' : 'Preservation Type'}
                  </p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {getPreservationTypeText(data.packageData?.preservationType)}
                  </p>
                </div>
                
                {data.packageData?.preservationType !== 'basic' && (
                  <div>
                    <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Preservation Cost (Estimate)</p>
                    <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                      {formatCurrency(data.packageData?.preservationEstimate)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Funding Details Section - Only show for non-basic packages */}
            {data.packageData?.preservationType !== 'basic' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                <div className="mb-8 flex items-start pt-4">
                  <div className="p-3 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                        style={{
                          backgroundSize: '400% 100%',
                          backgroundPosition: '50% 50%'
                        }}></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4 pt-2">
                    <h2 className="text-xl font-normal text-[#323053]" style={{ fontSize: '20px' }}>Cryopreservation Funding</h2>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>Selected Funding Method</p>
                  <p className="text-gray-600 font-normal mt-1" style={{ fontSize: '16px' }}>
                    {(() => {
                      // Try multiple possible field names
                      const method = data.fundingData?.fundingMethod || 
                                  data.fundingData?.method || 
                                  data.fundingData?.funding_method ||
                                  (data.fundingData && typeof data.fundingData === 'string' ? data.fundingData : null);
                      
                      console.log('Funding method:', method, 'Full funding data:', data.fundingData);
                      
                      if (!method || method === '') return 'Not Selected';
                      if (method === 'insurance') return 'Life Insurance';
                      if (method === 'prepay') return 'prepayment';
                      if (method === 'undecided') return 'Decide Later';
                      if (method === 'none') return 'Not Required (Basic Membership)';
                      return method; // Show raw value if not matching expected values
                    })()}
                  </p>
                  
                  {/* Disclaimer text and conditional messages */}
                  <div className="mt-6 inline-block p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    {/* Show the Note for all funding methods */}
                    <p className="text-gray-700" style={{ fontSize: '14px' }}>
                      <strong>Note:</strong> This documents your intent for funding your cryopreservation and is not a commitment.
                    </p>
                    
                    {/* Conditional messages based on funding method */}
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

            {/* Membership Details Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <div className="mb-8 flex items-start pt-4">
                <div className="p-3 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                       style={{
                         backgroundSize: '400% 100%',
                         backgroundPosition: '66% 50%'
                       }}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="ml-4 pt-2">
                  <h2 className="text-xl font-normal text-[#323053]" style={{ fontSize: '20px' }}>Membership Details</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Payment Options */}
                <div>
                  {/* Payment Frequency Selection */}
                  <div className="mb-6">
                    <p className="text-gray-900 font-medium mb-3" style={{ fontSize: '16px' }}>Payment Frequency</p>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handlePaymentFrequencyChange('annually')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all w-28 ${
                          localPaymentFrequency === 'annually' 
                            ? 'bg-white text-[#775684] border-2 border-[#775684]' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Annual
                      </button>
                      <button
                        onClick={() => handlePaymentFrequencyChange('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all w-28 ${
                          localPaymentFrequency === 'monthly' 
                            ? 'bg-white text-[#775684] border-2 border-[#775684]' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                  
                  {/* ICE Code Input */}
                  <div>
                    <p className="text-gray-900 font-medium mb-3" style={{ fontSize: '16px' }}>ICE Discount Code</p>
                    <div className="flex items-start space-x-2">
                      <input
                        type="text"
                        value={localIceCode}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setLocalIceCode(value);
                          
                          // Reset validation state immediately
                          if (!value.trim()) {
                            setLocalIceCodeValid(null);
                            return;
                          }
                          
                          // Debounce validation
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
                        ✓ Valid code - 25% discount applied
                      </p>
                    )}
                    {localIceCode && localIceCodeValid === false && (
                      <p className="text-red-600 mt-2 text-sm">
                        ✗ Invalid code
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Right Column - Pricing Summary */}
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 font-medium mb-3" style={{ fontSize: '18px' }}>Payment Summary</p>  {/* Changed from 16px to 18px */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600 text-sm">Base Membership</p>
                        <p className="text-gray-900 text-sm">
                          {formatCurrency(calculateLocalCosts().paymentAmount)}
                          {localPaymentFrequency === 'monthly' && '/mo'}
                          {localPaymentFrequency === 'annually' && '/yr'}
                        </p>
                      </div>
                      
                      {localIceCodeValid && (
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600 text-sm">ICE Discount</p>
                          <p className="text-[#775684] text-sm">
                            -{formatCurrency(calculateLocalCosts().discountAmount)}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <p className="text-gray-900 font-medium">First Payment</p>
                        <p className="text-[#775684] font-semibold text-lg">
                          {formatCurrency(calculateLocalCosts().firstPaymentAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Notice - Clean white background with border */}
            {data.packageData?.preservationType !== 'basic' && (
              <div className="bg-white border-2 border-gray-300 rounded-xl p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="p-3 rounded-lg flex-shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                          style={{
                            backgroundSize: '400% 100%',
                            backgroundPosition: '100% 50%'
                          }}></div>
                      <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5">
                      <p className="text-gray-800" style={{ fontSize: '18px' }}>
                        You'll only be charged for your membership today.
                      </p>
                      
                      {/* Funding-specific messages */}
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
            <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={onBack}
              className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.03]"
              style={{ fontFamily: SYSTEM_FONT }}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
              
            <button
              onClick={handleShowConfirmation}
              disabled={isSubmitting}
              className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] ${
                !isSubmitting ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } disabled:opacity-70`}
              style={{ fontFamily: SYSTEM_FONT }}
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
                  Sign Agreement
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>

{/* DocuSign Confirmation Overlay - Using createPortal to render directly to document.body */}
{showDocuSignOverlay && createPortal(
  <div 
    onClick={() => setShowDocuSignOverlay(false)} // Click outside to close
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999999,
      padding: '0.5rem', // Reduced padding for more width on mobile
      fontFamily: SYSTEM_FONT
    }}
  >
    <div 
      className="bg-white rounded-xl shadow-2xl p-7 sm:p-8 mx-2 sm:mx-4 max-w-2xl w-full"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
    >
      <div className="text-center">
        {/* DocuSign Icon */}
        <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-[#885c77] via-[#775684] to-[#3d3852] rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">Confirm Your Information</h3>
        
        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <h4 className="text-sm sm:text-base font-semibold text-blue-800 mb-1.5">Ready to Proceed?</h4>
              <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                Please confirm that all your information in the summary is correct. You'll be taken to sign your membership agreement electronically.
              </p>
            </div>
          </div>
        </div>
        
        {/* SMS Verification Notice */}
        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">SMS Verification Required</h4>
              <p className="text-gray-700 text-xs sm:text-sm mb-3 leading-relaxed">
                DocuSign will send an SMS verification code to validate your identity for electronic signature.
              </p>
              
              {/* Phone Number Display/Edit */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-600 font-medium text-xs sm:text-sm">SMS will be sent to:</label>
                  <button
                    onClick={() => setIsEditingPhone(!isEditingPhone)}
                    className="text-[#775684] hover:text-[#664573] font-medium text-xs sm:text-sm"
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
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                      placeholder="Enter phone number"
                    />
                    <button
                      onClick={() => setIsEditingPhone(false)}
                      className="bg-[#775684] text-white px-3 py-2 rounded-md hover:bg-[#664573] text-xs sm:text-sm"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-900 text-base sm:text-lg font-medium">
                    {smsPhoneNumber || 'No phone number provided'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Buttons - Single button on mobile, two on desktop */}
        <div className="flex justify-center">
          {/* Cancel button - hidden on mobile */}
          <button
            onClick={() => setShowDocuSignOverlay(false)}
            className="hidden sm:block px-6 py-4 border border-gray-300 rounded-full text-gray-700 font-medium text-base hover:bg-gray-50 transition-all duration-300 mr-4"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          {/* Proceed button - full width on mobile, taller */}
          <button
            onClick={handleProceedToDocuSign}
            disabled={isSubmitting || !smsPhoneNumber}
            className={`w-full sm:w-auto px-8 py-5 sm:py-4 rounded-full font-semibold text-sm sm:text-base flex items-center justify-center transition-all duration-300 ${
              !isSubmitting && smsPhoneNumber
                ? "bg-[#775684] text-white hover:bg-[#664573]" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } disabled:opacity-70`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    </>
  );
}