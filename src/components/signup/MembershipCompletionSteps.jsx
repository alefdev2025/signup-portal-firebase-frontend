// File: pages/signup/MembershipCompletionSteps.jsx - Professional Design with Country Code Phone Input
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import membershipService from "../../services/membership";
import { updateSignupProgressAPI } from "../../services/auth";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

// Font family from PackagePage
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Step Status Constants
const STEP_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// DocuSign Document Types
const DOCUSIGN_DOCS = {
  MEMBERSHIP_AGREEMENT: 'membership_agreement',
  CONFIDENTIALITY_AGREEMENT: 'confidentiality_agreement'
};

// Document Display Names
const DOCUMENT_DISPLAY_NAMES = {
  membership_agreement: 'Membership Agreement',
  confidentiality_agreement: 'Terms and Conditions'
};

// Country codes for phone input
const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' }
];

export default function MembershipCompletionSteps({ 
  onBack,
  onComplete,
  onNavigateToDocuSign,
  onNavigateToPayment
}) {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [salesforceStatus, setSalesforceStatus] = useState(null);
  const [isCreatingSalesforce, setIsCreatingSalesforce] = useState(false);
  const [backButtonError, setBackButtonError] = useState(false);
  
  // CRITICAL: Add refs to prevent duplicate calls
  const isCheckingStatus = useRef(false);
  const isCreatingSalesforceRef = useRef(false);
  const hasInitialized = useRef(false);
  const lastCheckTime = useRef(0);

  // Animation styles from PackagePage
  const fadeInStyle = {
    opacity: 0,
    animation: 'fadeIn 0.5s ease-in-out forwards'
  };

  const getAnimationDelay = (index) => ({
    animationDelay: `${index * 0.1}s`
  });

  // Parse phone number and set country code
  const parsePhoneNumber = (fullPhone) => {
    if (!fullPhone) return { countryCode: COUNTRY_CODES[0], number: '' };
    
    // Remove all non-digits
    const digitsOnly = fullPhone.replace(/\D/g, '');
    
    // Try to match country code
    for (const country of COUNTRY_CODES) {
      const codeDigits = country.code.replace(/\D/g, '');
      if (digitsOnly.startsWith(codeDigits)) {
        return {
          countryCode: country,
          number: digitsOnly.substring(codeDigits.length)
        };
      }
    }
    
    // Default to US if no match
    if (digitsOnly.length === 10) {
      return { countryCode: COUNTRY_CODES[0], number: digitsOnly };
    }
    
    return { countryCode: COUNTRY_CODES[0], number: digitsOnly };
  };

  // Check completion status from backend
  const checkCompletionStatus = async (forceCheck = false) => {
    // Prevent duplicate calls
    const now = Date.now();
    if (!forceCheck && (isCheckingStatus.current || now - lastCheckTime.current < 1000)) {
      console.log("⚠️ Skipping duplicate status check");
      return;
    }
    
    isCheckingStatus.current = true;
    lastCheckTime.current = now;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get completion status (includes readyForDocuSign data)
      const result = await membershipService.checkMembershipCompletionStatus();
      
      if (result.success) {
        console.log("✅ Completion status loaded:", result.data);
        setCompletionData(result.data);
        
        // Parse phone number if exists
        if (result.data.docusignPhoneNumber) {
          const parsed = parsePhoneNumber(result.data.docusignPhoneNumber);
          setSelectedCountryCode(parsed.countryCode);
          setPhoneNumber(parsed.number);
        }
        
        // Check if both DocuSign documents are completed
        const docs = result.data.docusignDocuments;
        const bothDocusignCompleted = 
          docs.membershipAgreement === STEP_STATUS.COMPLETED && 
          docs.confidentialityAgreement === STEP_STATUS.COMPLETED;
        
        // If both DocuSign documents are completed, check Salesforce status
        if (bothDocusignCompleted) {
          const sfStatus = await checkSalesforceStatus();
          
          // CRITICAL: Only auto-create if not already creating and doesn't exist
          if (!sfStatus?.exists && !isCreatingSalesforceRef.current) {
            await createSalesforceContact();
          }
        }
        
        // Also get payment status from readyForPayment
        try {
          const paymentStatus = await membershipService.getPaymentStatus();
          if (paymentStatus.success && paymentStatus.data.exists) {
            console.log("💳 Payment status from readyForPayment:", paymentStatus.data);
            
            // Merge payment status into completion data
            setCompletionData(prev => ({
              ...prev,
              readyForPayment: paymentStatus.data,
              payment: {
                ...prev.payment,
                status: paymentStatus.data.paymentStatus?.status || prev.payment?.status || 'not_started',
                completedAt: paymentStatus.data.paymentStatus?.completedAt || prev.payment?.completedAt,
                paymentId: paymentStatus.data.paymentStatus?.transactionId || prev.payment?.paymentId,
                method: paymentStatus.data.paymentStatus?.paymentMethod || prev.payment?.method
              },
              paymentCompleted: paymentStatus.data.paymentStatus?.status === 'completed' || prev.paymentCompleted,
              totalDue: paymentStatus.data.paymentDetails?.totalDue || prev.totalDue
            }));
          }
        } catch (paymentError) {
          console.warn("Could not fetch readyForPayment data:", paymentError);
          // Continue with existing data
        }
        
        // Check if everything is completed
        if (result.data.allStepsCompleted && onComplete) {
          console.log("🎉 All steps completed, triggering completion");
          onComplete();
        }
      } else {
        throw new Error(result.error || 'Failed to load completion status');
      }
    } catch (error) {
      console.error("❌ Error checking completion status:", error);
      setError(error.message || "Failed to load membership status. Please refresh and try again.");
    } finally {
      setIsLoading(false);
      isCheckingStatus.current = false;
    }
  };
  
  // Check Salesforce status
  const checkSalesforceStatus = async () => {
    try {
      console.log("🔍 Checking Salesforce status...");
      const sfResult = await membershipService.getSalesforceStatus();
      
      if (sfResult.success) {
        console.log("📊 Salesforce status:", sfResult.data);
        setSalesforceStatus(sfResult.data);
        return sfResult.data;
      }
    } catch (error) {
      console.error("❌ Error checking Salesforce status:", error);
      // Don't fail the whole process if Salesforce check fails
      setSalesforceStatus({ exists: false, error: error.message });
    }
    return null;
  };
  
  // Create Salesforce contact AND gets their new documents and uploads them to salesforce
  const createSalesforceContact = async () => {
    // CRITICAL: Prevent duplicate creation calls
    if (isCreatingSalesforceRef.current) {
      console.log("⚠️ Already creating Salesforce contact, skipping duplicate call");
      return false;
    }
    
    isCreatingSalesforceRef.current = true;
    
    try {
      setIsCreatingSalesforce(true);
      setError(null);
      
      console.log("🚀 Creating Salesforce contact...");
      const result = await membershipService.createSalesforceContact();
      
      if (result.success) {
        console.log("✅ Salesforce contact created:", result.data);
        setSalesforceStatus({
          exists: true,
          contactId: result.data.contactId,
          agreementId: result.data.agreementId, // Make sure to save the agreement ID too
          createdAt: result.data.createdAt
        });
        
        // NEW: Retrieve and upload DocuSign documents to Salesforce
        try {
          console.log("📄 Retrieving and uploading DocuSign documents...");
          const docResult = await membershipService.retrieveAndUploadDocuments(
            result.data.contactId,
            result.data.agreementId
          );
          
          if (docResult.success) {
            console.log("✅ Documents retrieved and uploaded:", docResult.data);
            // Optionally update the UI to show documents were uploaded
            setSalesforceStatus(prev => ({
              ...prev,
              documentsUploaded: true,
              documentUploadResults: docResult.data
            }));
          } else {
            console.warn("⚠️ Document upload failed but continuing:", docResult.error);
          }
        } catch (docError) {
          console.error("❌ Failed to retrieve/upload documents:", docError);
          // Don't fail the whole process if document upload fails
          // Maybe show a warning to the user but let them continue
        }
        
        // Refresh completion status to get updated data
        await checkCompletionStatus(true); // Force check to bypass rate limiting
        
        return true;
      } else {
        throw new Error(result.error || 'Failed to create Salesforce contact');
      }
    } catch (error) {
      console.error("❌ Error creating Salesforce contact:", error);
      setError("Failed to create Salesforce contact. Please try again or contact support.");
      return false;
    } finally {
      setIsCreatingSalesforce(false);
      isCreatingSalesforceRef.current = false;
    }
  };

  // Initial load - only once
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log("📊 MembershipCompletionSteps initial load");
      checkCompletionStatus();
    }
  }, []);

  // Handle returning from DocuSign or Payment
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docusignEvent = params.get('docusign_event');
    const documentType = params.get('document_type');
    const envelopeId = params.get('envelope_id');
    
    if (docusignEvent === 'signing_complete' && documentType && envelopeId) {
      console.log("📝 Returned from DocuSign signing:", { documentType, envelopeId });
      // Update the status to completed for this document
      membershipService.updateDocuSignStatus(documentType, 'completed', envelopeId)
        .then(() => {
          console.log("✅ DocuSign status updated");
          checkCompletionStatus(true); // Force check
        })
        .catch(err => {
          console.error("Error updating DocuSign status:", err);
          checkCompletionStatus(true); // Force check
        });
    } else if (location.state?.docusignCompleted || location.state?.paymentCompleted) {
      console.log("📍 Returned from step, refreshing status");
      checkCompletionStatus(true); // Force check
    }
  }, [location]);

  // Handle saving phone number
  const handleSavePhone = async () => {
    try {
      // Validate phone number
      const phoneDigitsOnly = phoneNumber.replace(/\D/g, '');
      if (phoneDigitsOnly.length < 7) {
        setError("Please enter a valid phone number");
        return;
      }
      
      // Combine country code and phone number
      const fullPhoneNumber = `${selectedCountryCode.code}${phoneDigitsOnly}`;
      
      const result = await membershipService.updateDocuSignPhone({
        docusignPhoneNumber: fullPhoneNumber
      });
      
      if (result.success) {
        setCompletionData(prev => ({
          ...prev,
          docusignPhoneNumber: fullPhoneNumber
        }));
        setIsEditingPhone(false);
        setError(null);
        console.log("✅ Phone number saved successfully:", fullPhoneNumber);
      } else {
        throw new Error(result.error || "Failed to update phone number");
      }
    } catch (error) {
      console.error("Error saving phone number:", error);
      setError("Failed to update phone number. Please try again.");
    }
  };

  // Handle starting DocuSign for a specific document
  const handleStartDocuSign = async (documentType = null) => {
    setError(null);
    
    try {
      if (!completionData?.docusignPhoneNumber) {
        setError("Phone number is required for DocuSign verification. Please add your phone number above.");
        return;
      }
      
      // Determine which document to sign
      let docToSign = documentType;
      if (!docToSign) {
        // Sign the first incomplete document
        const docs = completionData.docusignDocuments;
        if (docs.membershipAgreement !== STEP_STATUS.COMPLETED) {
          docToSign = DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT;
        } else if (docs.confidentialityAgreement !== STEP_STATUS.COMPLETED) {
          docToSign = DOCUSIGN_DOCS.CONFIDENTIALITY_AGREEMENT;
        } else {
          setError("All documents have already been signed.");
          return;
        }
      }
      
      console.log(`📝 Starting DocuSign for document type: ${docToSign}`);
      
      // Navigate to DocuSign
      if (onNavigateToDocuSign) {
        console.log(`📝 Calling onNavigateToDocuSign with: ${docToSign}`);
        onNavigateToDocuSign(docToSign);
      } else {
        console.log(`📝 Navigating to /signup/docusign with documentType: ${docToSign}`);
        navigate('/signup/docusign', { state: { documentType: docToSign } });
      }
      
    } catch (error) {
      console.error("Error starting DocuSign:", error);
      setError(error.message || "Failed to start DocuSign process. Please try again.");
    }
  };

  // Handle starting payment
  const handleStartPayment = async () => {
    setError(null);
    
    try {
      if (!completionData?.docusignCompleted) {
        setError("Please complete signing all agreements first.");
        return;
      }
      
      // Check if Salesforce contact exists
      if (!salesforceStatus?.exists) {
        setError("Please wait for processing to complete. Click the refresh button if this takes too long.");
        return;
      }
      
      console.log("💳 Starting payment process");
      
      // Create or update readyForPayment object
      try {
        const createResult = await membershipService.createReadyForPayment();
        console.log("✅ readyForPayment created:", createResult);
        
        // Update payment status to in_progress
        await membershipService.updatePaymentProgress('in_progress', {
          paymentMethod: 'pending_selection'
        });
        
        // Pass the readyForPayment data to payment component
        const paymentData = {
          ...completionData,
          readyForPayment: createResult.data
        };
        
        if (onNavigateToPayment) {
          onNavigateToPayment(paymentData);
        } else {
          navigate('/signup/payment', { 
            state: { 
              totalDue: createResult.data.paymentDetails.totalDue,
              paymentBreakdown: createResult.data.paymentDetails,
              membershipDetails: createResult.data.membershipInfo,
              readyForPayment: createResult.data,
              readyForDocuSign: completionData
            } 
          });
        }
      } catch (createError) {
        console.error("Error creating readyForPayment:", createError);
        throw new Error("Failed to initialize payment. Please try again.");
      }
      
    } catch (error) {
      console.error("Error starting payment:", error);
      setError(error.message || "Failed to start payment process. Please try again.");
    }
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    checkCompletionStatus(true); // Force check
  };

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

  // Format phone number for display
  const formatPhoneDisplay = (fullPhone) => {
    if (!fullPhone) return 'No phone number provided';
    
    const parsed = parsePhoneNumber(fullPhone);
    const formatted = parsed.number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    return `${parsed.countryCode.code} ${formatted}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
        <p className="ml-4 text-lg text-gray-600" style={{ fontFamily: SYSTEM_FONT }}>Loading membership completion steps...</p>
      </div>
    );
  }

  // Error state
  if (!completionData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4" style={{ fontFamily: SYSTEM_FONT }}>Failed to load membership data</p>
        <button
          onClick={handleManualRefresh}
          className="py-3 px-6 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573] transition-all duration-300"
          style={{ fontFamily: SYSTEM_FONT }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { docusignDocuments, payment, docusignCompleted, paymentCompleted, totalDue } = completionData;
  
  // Check if both DocuSign documents are completed
  const bothDocusignCompleted = 
    docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED && 
    docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED;
  
  // Determine if payment can be started
  const canStartPayment = bothDocusignCompleted && salesforceStatus?.exists;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8" style={{ fontFamily: SYSTEM_FONT }}>
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" style={fadeInStyle}>
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700" style={{ fontSize: '14px' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Header - Smaller and more professional */}
      <div className="text-center mb-6" style={{...fadeInStyle, ...getAnimationDelay(0)}}>
        <h1 className="text-2xl font-semibold text-gray-900">Complete Your Membership</h1>
        <p className="text-gray-600 mt-2" style={{ fontSize: '15px' }}>Please complete all steps below to finalize your membership</p>
      </div>

      {/* Phone Number Section - Professional design */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 mb-6" style={{...fadeInStyle, ...getAnimationDelay(1)}}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <div className="bg-white p-2.5 rounded-lg border border-gray-200">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: '500' }}>SMS Verification Required</h3>
            <p className="text-gray-600 mb-3" style={{ fontSize: '14px' }}>
              DocuSign will send an SMS verification code to this number:
            </p>
            
            {isEditingPhone ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {/* Country Code Dropdown */}
                  <div className="relative">
                    <select
                      value={COUNTRY_CODES.indexOf(selectedCountryCode)}
                      onChange={(e) => setSelectedCountryCode(COUNTRY_CODES[parseInt(e.target.value)])}
                      className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#775684] focus:border-transparent"
                      style={{ minWidth: '120px' }}
                    >
                      {COUNTRY_CODES.map((country, index) => (
                        <option key={country.code + country.country} value={index}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#775684] focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSavePhone}
                    className="bg-[#775684] text-white px-4 py-2 rounded-md hover:bg-[#664573] text-sm font-medium transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPhone(false);
                      if (completionData.docusignPhoneNumber) {
                        const parsed = parsePhoneNumber(completionData.docusignPhoneNumber);
                        setSelectedCountryCode(parsed.countryCode);
                        setPhoneNumber(parsed.number);
                      } else {
                        setPhoneNumber('');
                        setSelectedCountryCode(COUNTRY_CODES[0]);
                      }
                      setError(null);
                    }}
                    className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900 font-medium">
                  {completionData.docusignPhoneNumber ? formatPhoneDisplay(completionData.docusignPhoneNumber) : 'No phone number provided'}
                </p>
                <button
                  onClick={() => {
                    setIsEditingPhone(true);
                    if (completionData.docusignPhoneNumber) {
                      const parsed = parsePhoneNumber(completionData.docusignPhoneNumber);
                      setSelectedCountryCode(parsed.countryCode);
                      setPhoneNumber(parsed.number);
                    }
                  }}
                  className="text-[#775684] hover:text-[#664573] font-medium text-sm"
                >
                  {completionData.docusignPhoneNumber ? 'Change' : 'Add Phone'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Two Cards Side by Side - Styled like Package Page cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Step 1: DocuSign Card */}
        <div 
          className={`cursor-pointer transform transition duration-300 hover:scale-[1.02]`}
          style={{...fadeInStyle, ...getAnimationDelay(3)}}
        >
          <div className={`rounded-lg md:rounded-[2rem] overflow-hidden shadow-md ring-1 ring-gray-300 transition-all duration-300 hover:shadow-lg h-full flex flex-col`}>
            
            {/* Card Header - White Section */}
            <div className="bg-white p-7 md:px-8 md:pt-8 md:pb-6 flex-1 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3.5 rounded-lg mr-3.5" style={{ 
                  background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' 
                }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-normal text-gray-900" style={{ fontSize: '20px' }}>Step 1: Sign Agreements</h3>
              </div>
              
              <p className="text-gray-600 font-light" style={{ fontSize: '16px' }}>
                Sign your membership documents electronically
              </p>
              
              {/* Document Status List */}
              <div className="mt-6 space-y-3 flex-1">
                <div 
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED 
                      ? 'bg-green-50' 
                      : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (docusignDocuments.membershipAgreement !== STEP_STATUS.COMPLETED && completionData.docusignPhoneNumber) {
                      handleStartDocuSign(DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT);
                    }
                  }}
                >
                  <span className="text-sm font-normal text-gray-700">Membership Agreement</span>
                  {docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                  )}
                </div>
                
                <div 
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED 
                      ? 'bg-green-50' 
                      : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (docusignDocuments.confidentialityAgreement !== STEP_STATUS.COMPLETED && completionData.docusignPhoneNumber) {
                      handleStartDocuSign(DOCUSIGN_DOCS.CONFIDENTIALITY_AGREEMENT);
                    }
                  }}
                >
                  <span className="text-sm font-normal text-gray-700">Terms & Conditions</span>
                  {docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Card Footer - White Section with Navy Button */}
            <div className="bg-white p-6 border-t border-gray-100">
              <button
                onClick={() => handleStartDocuSign()}
                disabled={!completionData.docusignPhoneNumber || docusignCompleted}
                className={`w-full py-3 px-6 rounded-full font-medium transition-all ${
                  !completionData.docusignPhoneNumber || docusignCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#1e293b] text-white hover:bg-[#0f172a]'
                }`}
              >
                {docusignCompleted ? 'Agreements Signed' : 'Continue Signing'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Step 2: Payment Card */}
        <div 
          className={`cursor-pointer transform transition duration-300 hover:scale-[1.02] ${
            !canStartPayment ? 'opacity-60' : ''
          }`}
          style={{...fadeInStyle, ...getAnimationDelay(4)}}
        >
          <div className={`rounded-lg md:rounded-[2rem] overflow-hidden shadow-md ${
            paymentCompleted 
              ? 'ring-2 ring-green-500' 
              : canStartPayment
                ? 'ring-1 ring-gray-300'
                : 'ring-1 ring-gray-200'
          } transition-all duration-300 hover:shadow-lg h-full flex flex-col`}>
            
            {/* Card Header - White Section */}
            <div className="bg-white p-7 md:px-8 md:pt-8 md:pb-6 flex-1 flex flex-col">
              <div className="flex items-center mb-4">
                <div className="p-3.5 rounded-lg mr-3.5" style={{ 
                  background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' 
                }}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="font-normal text-gray-900" style={{ fontSize: '20px' }}>Step 2: Payment</h3>
              </div>
              
              <p className="text-gray-600 font-light mb-6" style={{ fontSize: '16px' }}>
                Complete your membership payment
              </p>
              
              {/* Payment Info */}
              <div className="border-t border-gray-200 pt-4 flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500" style={{ fontSize: '16px', fontWeight: '500' }}>Amount due:</span>
                  <span className="font-normal text-gray-900" style={{ fontSize: '18px' }}>
                    {paymentCompleted ? 'Paid' : formatCurrency(totalDue)}
                  </span>
                </div>
                
                {!bothDocusignCompleted && (
                  <p className="text-sm text-gray-500 mt-3 italic">Complete all agreements first</p>
                )}
                

              </div>
            </div>
            
            {/* Card Footer - White Section with Navy Button */}
            <div className="bg-white p-6 border-t border-gray-100">
              {paymentCompleted ? (
                <div className="text-center">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <p className="font-medium text-green-700">Payment Completed</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartPayment}
                  disabled={!canStartPayment}
                  className={`w-full py-3 px-6 rounded-full font-medium transition-all ${
                    !canStartPayment
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1e293b] text-white hover:bg-[#0f172a]'
                  }`}
                >
                  Make Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary - Clean design */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6" style={{...fadeInStyle, ...getAnimationDelay(5)}}>
        <h4 className="text-gray-900 mb-3" style={{ fontSize: '15px', fontWeight: '500' }}>Progress Summary</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600" style={{ fontSize: '14px' }}>Documents Signed:</span>
            <span className="font-medium text-gray-900">
              {[docusignDocuments.membershipAgreement, docusignDocuments.confidentialityAgreement]
                .filter(s => s === STEP_STATUS.COMPLETED).length} of 2
            </span>
          </div>
          {bothDocusignCompleted && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600" style={{ fontSize: '14px' }}>Ready for Payment:</span>
              <span className="font-medium">
                {salesforceStatus?.exists ? (
                  <span className="text-green-600">Yes</span>
                ) : isCreatingSalesforce ? (
                  <span className="text-yellow-600">Creating...</span>
                ) : (
                  <span className="text-yellow-600">Processing</span>
                )}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-600" style={{ fontSize: '14px' }}>Payment Status:</span>
            <span className="font-medium text-gray-900">
              {paymentCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center mb-8" style={{...fadeInStyle, ...getAnimationDelay(6)}}>
        <button
          onClick={handleManualRefresh}
          disabled={isCheckingStatus.current || isCreatingSalesforce}
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-all duration-300 inline-flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isCheckingStatus.current ? 'Refreshing...' : 'Refresh Status'}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8" style={{...fadeInStyle, ...getAnimationDelay(7)}}>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setBackButtonError(true)}
            className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md hover:translate-x-[-2px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          {backButtonError && (
            <p className="ml-4 text-red-600 text-sm">Contact support for application modifications</p>
          )}
        </div>
        
        {completionData.allStepsCompleted && (
          <button
            onClick={onComplete}
            className="py-5 px-8 bg-[#775684] text-white rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg hover:translate-x-[2px] hover:bg-[#664573]"
          >
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Add global styles
if (typeof document !== 'undefined') {
  const globalStyles = document.createElement('style');
  globalStyles.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-in-out forwards;
    }
  `;
  
  if (!document.head.querySelector('style[data-completion-steps-styles]')) {
    globalStyles.setAttribute('data-completion-steps-styles', 'true');
    document.head.appendChild(globalStyles);
  }
}