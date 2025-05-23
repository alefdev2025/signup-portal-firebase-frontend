import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import membershipService from "../../services/membership";
import { getContactInfo } from "../../services/contact";
import fundingService from "../../services/funding";
import { getMembershipCost } from "../../services/pricing";

export default function MembershipSummary({ 
  membershipData, 
  packageData, 
  contactData,
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
  
  // Apply Marcellus font
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
    fontSize: "1.05rem"
  };

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
          if (fundingResult.success && fundingResult.data) {
            fundingDataFromBackend = fundingResult.data;
            console.log("✅ Funding info loaded:", fundingDataFromBackend);
          }
        } catch (err) {
          console.error("Error loading funding info:", err);
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
          fundingData: fundingDataFromBackend || {},
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

  // Handle showing the confirmation overlay
  const handleShowConfirmation = () => {
    setShowDocuSignOverlay(true);
  };

  // Handle proceeding to DocuSign after confirmation
  const handleProceedToDocuSign = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("MembershipSummary: Proceeding to DocuSign...");
      
      // Close the overlay first
      setShowDocuSignOverlay(false);
      
      // Then proceed to DocuSign
      if (onSignAgreement) {
        await onSignAgreement();
      }
    } catch (err) {
      console.error("Error proceeding to DocuSign:", err);
      setError("Failed to proceed to agreement signing. Please try again.");
      setShowDocuSignOverlay(false); // Close overlay on error too
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
    <div className="w-full">
      {/* Main Content */}
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 mr-3" />
              <h1 className="text-4xl font-bold text-[#323053]">Review Your Membership</h1>
            </div>
            <p className="text-xl text-gray-600">Please review all details before proceeding to sign your agreement</p>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="mb-8 flex items-start pt-4">
              <div className="p-4 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                     style={{
                       backgroundSize: '400% 100%',
                       backgroundPosition: '0% 50%'
                     }}></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4 pt-3">
                <h2 className="text-3xl font-bold text-[#323053]">Contact Information</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 text-lg">Name</p>
                <p className="text-gray-900 text-2xl font-medium">
                  {data.contactData?.firstName} {data.contactData?.lastName}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 text-lg">Email</p>
                <p className="text-gray-900 text-2xl font-medium">
                  {data.contactData?.email || user?.email}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 text-lg">Phone</p>
                <p className="text-gray-900 text-2xl font-medium">
                  {data.contactData?.mobilePhone || data.contactData?.homePhone || data.contactData?.workPhone || 'Not provided'}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 text-lg">Date of Birth</p>
                <p className="text-gray-900 text-2xl font-medium">
                  {data.contactData?.dateOfBirth || 'Not provided'}
                </p>
              </div>
              
              {/* Phone Type Preference */}
              {data.contactData?.phoneType && (
                <div>
                  <p className="text-gray-600 text-lg">Preferred Contact Method</p>
                  <p className="text-gray-900 text-2xl font-medium">
                    {data.contactData.phoneType} Phone
                  </p>
                </div>
              )}
              
              {/* Same Mailing Address */}
              <div>
                <p className="text-gray-600 text-lg">Same Mailing Address</p>
                <p className="text-gray-900 text-2xl font-medium">
                  {data.contactData?.sameMailingAddress || 'Yes'}
                </p>
              </div>
              
              {/* Home Address */}
              <div className="md:col-span-2">
                <p className="text-gray-600 text-lg">Home Address</p>
                <p className="text-gray-900 text-2xl font-medium">
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
                  <p className="text-gray-600 text-lg">Mailing Address</p>
                  <p className="text-gray-900 text-2xl font-medium">
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
              <div className="p-4 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                     style={{
                       backgroundSize: '400% 100%',
                       backgroundPosition: '33% 50%'
                     }}></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4 pt-3">
                <h2 className="text-3xl font-bold text-[#323053]">Preservation Package</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 text-lg">Preservation Type</p>
                <p className="text-gray-900 text-2xl font-medium">
                  {getPreservationTypeText(data.packageData?.preservationType)}
                </p>
              </div>
              
              {data.packageData?.preservationType !== 'basic' && (
                <div>
                  <p className="text-gray-600 text-lg">Preservation Cost (Estimate)</p>
                  <p className="text-gray-900 text-2xl font-medium">
                    {formatCurrency(data.packageData?.preservationEstimate)}
                  </p>
                </div>
              )}
              
              {/* Intended Funding Method */}
              {(data.fundingData?.fundingMethod || data.fundingData?.method) && (
                <div>
                  <p className="text-gray-600 text-lg">Intended Funding Method</p>
                  <p className="text-gray-900 text-2xl font-medium">
                    {(data.fundingData.fundingMethod || data.fundingData.method) === 'insurance' ? 'Life Insurance' :
                     (data.fundingData.fundingMethod || data.fundingData.method) === 'prepay' ? 'Prepayment' :
                     (data.fundingData.fundingMethod || data.fundingData.method) === 'later' ? 'Decide Later' :
                     (data.fundingData.fundingMethod || data.fundingData.method)}
                  </p>
                </div>
              )}
              
              {/* Insurance Details (if applicable) */}
              {data.fundingData?.fundingMethod === 'insurance' && data.fundingData?.insuranceSubOption === 'existing' && (
                <div className="md:col-span-2">
                  <p className="text-gray-600 text-lg">Insurance Details</p>
                  <p className="text-gray-900 text-2xl font-medium">
                    {data.fundingData.insuranceCompany && (
                      <>Company: {data.fundingData.insuranceCompany}</>
                    )}
                    {data.fundingData.policyNumber && (
                      <><br />Policy #: {data.fundingData.policyNumber}</>
                    )}
                    {data.fundingData.coverageAmount && (
                      <><br />Coverage: {formatCurrency(data.fundingData.coverageAmount)}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Membership Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="mb-8 flex items-start pt-4">
              <div className="p-4 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                     style={{
                       backgroundSize: '400% 100%',
                       backgroundPosition: '66% 50%'
                     }}></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-4 pt-3">
                <h2 className="text-3xl font-bold text-[#323053]">Membership Details</h2>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                  <p className="text-gray-600 text-lg">Payment Frequency</p>
                  <p className="text-gray-900 text-2xl font-medium">{getPaymentFrequencyText(data.membershipData?.paymentFrequency)}</p>
                </div>
                <p className="text-gray-900 text-3xl font-bold">
                  {data.membershipData?.paymentFrequency === 'lifetime' ? 
                    'TBD' : 
                    formatCurrency(data.calculatedCosts?.paymentAmount)
                  }
                </p>
              </div>
              
              {data.calculatedCosts?.hasIceDiscount && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-gray-600 text-lg">ICE Discount (First Year)</p>
                    <p className="text-gray-900 text-2xl font-medium">
                      Code: {data.membershipData?.iceCode} - {data.membershipData?.iceCodeInfo?.educatorName}
                    </p>
                  </div>
                  <p className="text-green-600 text-3xl font-bold">
                    -{formatCurrency(data.calculatedCosts?.discountAmount)}
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <div>
                  <p className="text-gray-600 text-lg">
                    {data.membershipData?.paymentFrequency === 'lifetime' ? 'Lifetime Membership' : 'First Payment Due'}
                  </p>
                  {data.membershipData?.paymentFrequency === 'lifetime' && (
                    <p className="text-gray-900 text-2xl font-medium">
                      We'll contact you with a personalized quote
                    </p>
                  )}
                </div>
                <p className="text-[#775684] text-3xl font-bold">
                  {data.membershipData?.paymentFrequency === 'lifetime' ? 
                    'Custom Quote' : 
                    formatCurrency(data.calculatedCosts?.firstPaymentAmount)
                  }
                </p>
              </div>
              
              {data.membershipData?.interestedInLifetime && data.membershipData?.paymentFrequency !== 'lifetime' && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-lg">
                    <strong>Note:</strong> You've expressed interest in Lifetime Membership. We'll contact you with more information after you complete your application.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Notice - Clean white background with border */}
          {data.packageData?.preservationType !== 'basic' && (
            <div className="bg-white border-2 border-gray-300 rounded-xl p-6 md:p-8 mb-6">
              <div className="flex items-start">
                <div className="p-3 md:p-4 rounded-lg flex-shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                       style={{
                         backgroundSize: '400% 100%',
                         backgroundPosition: '100% 50%'
                       }}></div>
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5">
                  <p className="text-gray-800 text-2xl font-bold">
                    You'll only be charged for your membership today.
                  </p>
                  
                  {/* Funding-specific messages */}
                  {(data.fundingData?.fundingMethod === 'insurance' || data.fundingData?.method === 'insurance') && (
                    <p className="text-gray-700 mt-3 text-2xl font-medium">
                      No insurance fees will be applied at this stage.
                    </p>
                  )}
                  
                  {(data.fundingData?.fundingMethod === 'prepay' || data.fundingData?.method === 'prepay') && (
                    <p className="text-gray-700 mt-3 text-2xl font-medium">
                      We'll reach out to you on the next steps for prepayment.
                    </p>
                  )}
                  
                  {(data.fundingData?.fundingMethod === 'later' || data.fundingData?.method === 'later') && (
                    <p className="text-gray-700 mt-3 text-2xl font-medium">
                      We'll reach out to you to go over your options for funding your cryopreservation contract.
                    </p>
                  )}
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
              style={marcellusStyle}
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
              className={`py-5 px-10 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] ${
                !isSubmitting ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
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

      {/* DocuSign Confirmation Overlay */}
      {showDocuSignOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={marcellusStyle}>
          <div className="bg-white rounded-xl shadow-2xl p-12 mx-4 max-w-2xl w-full">
            <div className="text-center">
              {/* DocuSign Icon */}
              <div className="mx-auto mb-8 w-20 h-20 bg-gradient-to-r from-[#775684] via-[#5a4a6b] to-[#3d3852] rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Confirm Your Information</h3>
              
              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Ready to Proceed?</h4>
                    <p className="text-blue-700 text-lg">
                      Please confirm that all your information above is correct. You'll be taken to sign your membership agreement electronically.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* SMS Verification Notice */}
              <div className="text-left bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-gray-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">SMS Verification Required</h4>
                    <p className="text-gray-700 text-lg mb-4">
                      DocuSign will send an SMS verification code to validate your identity for electronic signature.
                    </p>
                    
                    {/* Phone Number Display/Edit */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-gray-600 font-medium">SMS will be sent to:</label>
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
                            className="flex-1 p-2 border border-gray-300 rounded-md text-lg"
                            placeholder="Enter phone number"
                          />
                          <button
                            onClick={() => setIsEditingPhone(false)}
                            className="bg-[#775684] text-white px-4 py-2 rounded-md hover:bg-[#664573] text-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-900 text-xl font-medium">
                          {smsPhoneNumber || 'No phone number provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-center space-x-6">
                <button
                  onClick={() => setShowDocuSignOverlay(false)}
                  className="px-8 py-4 border border-gray-300 rounded-full text-gray-700 font-medium text-lg hover:bg-gray-50 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToDocuSign}
                  disabled={isSubmitting || !smsPhoneNumber}
                  className={`px-10 py-4 rounded-full font-semibold text-lg flex items-center transition-all duration-300 ${
                    !isSubmitting && smsPhoneNumber
                      ? "bg-[#775684] text-white hover:bg-[#664573]" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
                    "Proceed to DocuSign"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}