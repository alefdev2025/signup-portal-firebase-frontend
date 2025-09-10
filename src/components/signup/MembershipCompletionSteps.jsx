import React, { useState, useEffect, useRef } from "react";
import membershipService from '../../services/membership';
import { createApplicantPortalAccount } from '../../services/auth';
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { auth } from '../../services/firebase';
import { DelayedCenteredLoader } from '../../components/DotLoader';
import ResponsiveBanner from "../ResponsiveBanner";

// Font family from MembershipSummary
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BLOCK_DOCUSIGN_SIGNING = true;
const SKIP_DOCUSIGN_TEMP = import.meta.env.VITE_SKIP_DOCUSIGN_TEMP === 'true';

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
  const [isCompletingMembership, setIsCompletingMembership] = useState(false);

  const [isReady, setIsReady] = useState(false);

  const navigate = useNavigate();
  const { user } = useUser();
  
  // CRITICAL: Add refs to prevent duplicate calls
  const isCheckingStatus = useRef(false);
  const isCreatingSalesforceRef = useRef(false);
  const hasInitialized = useRef(false);
  const lastCheckTime = useRef(0);
  

  // Parse phone number and set country code
  const parsePhoneNumber = (fullPhone) => {
    if (!fullPhone) return { countryCode: COUNTRY_CODES[0], number: '' };
    
    // Remove all non-digits
    const digitsOnly = fullPhone.replace(/\D/g, '');
    
    // Check for 10-digit US number first (prioritize domestic)
    if (digitsOnly.length === 10) {
      return { countryCode: COUNTRY_CODES[0], number: digitsOnly }; // US +1
    }
    
    // Check for 11-digit number starting with 1 (US with country code)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return { 
        countryCode: COUNTRY_CODES[0], // US +1
        number: digitsOnly.substring(1) 
      };
    }
    
    // Try to match other international country codes
    for (const country of COUNTRY_CODES) {
      const codeDigits = country.code.replace(/\D/g, '');
      if (digitsOnly.startsWith(codeDigits)) {
        return {
          countryCode: country,
          number: digitsOnly.substring(codeDigits.length)
        };
      }
    }
    
    // Default fallback
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
        
        // Parse phone number if exists - KEEP THIS HERE
        if (result.data.docusignPhoneNumber) {
          console.log("Parsing phone number:", result.data.docusignPhoneNumber);
          const parsed = parsePhoneNumber(result.data.docusignPhoneNumber);
          setSelectedCountryCode(parsed.countryCode);
          setPhoneNumber(parsed.number);
        }
        
        // Check if both DocuSign documents are completed OR we're skipping DocuSign
        const docs = result.data.docusignDocuments;
        const bothDocusignCompleted = SKIP_DOCUSIGN_TEMP ? true : (
          docs.membershipAgreement === STEP_STATUS.COMPLETED && 
          docs.confidentialityAgreement === STEP_STATUS.COMPLETED
        );
        
        // If both DocuSign documents are completed OR we're skipping DocuSign, check Salesforce status
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
        
        // Don't auto-complete, wait for user to click Continue
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
          agreementId: result.data.agreementId,
          createdAt: result.data.createdAt
        });
        
        // NEW: Retrieve and upload DocuSign documents to Salesforce (only if not skipping)
        if (!SKIP_DOCUSIGN_TEMP) {
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
        } else {
          console.log("📄 Skipping document upload - SKIP_DOCUSIGN_TEMP enabled");
        }
        
        // Refresh completion status to get updated data
        await checkCompletionStatus(true); // Force check to bypass rate limiting
        
        return true;
      } else {
        throw new Error(result.error || 'Failed to create Salesforce contact');
      }
    } catch (error) {
      console.error("❌ Error creating Salesforce contact:", error);
      setError("Please try again or contact support.");
      return false;
    } finally {
      setIsCreatingSalesforce(false);
      isCreatingSalesforceRef.current = false;
    }
  };

  // Handle completion and portal account creation
  const handleComplete = async () => {
    try {
      setIsCompletingMembership(true);
      setError(null);
      
      console.log('All steps completed, creating portal account...');
      
      // Create applicant portal account
      const portalResult = await createApplicantPortalAccount({
        completedSignup: true
      });
      
      if (portalResult.success) {
        console.log('✅ Portal account created successfully');
        
        // Update payment status in Salesforce
        if (salesforceStatus?.contactId) {
          try {
            console.log('💰 Updating payment status in Salesforce...');
            const paymentUpdateResult = await membershipService.updateMemberPaymentStatus(
              salesforceStatus.contactId,
              {
                amount: completionData?.totalDue || completionData?.readyForPayment?.paymentDetails?.totalDue,
                method: completionData?.payment?.method || 'credit_card',
                reference: completionData?.payment?.paymentId || completionData?.readyForPayment?.paymentStatus?.transactionId,
                paymentDate: completionData?.payment?.completedAt || new Date().toISOString()
              }
            );
            
            if (paymentUpdateResult.success) {
              console.log('✅ Payment status updated in Salesforce');
            } else {
              console.warn('⚠️ Failed to update payment status:', paymentUpdateResult.error);
            }
          } catch (error) {
            console.error('⚠️ Error updating payment status:', error);
            // Don't fail the whole process, just log the error
          }
        }
        
        // Call the onComplete prop if provided, otherwise redirect
        if (onComplete) {
          onComplete();
        } else {
          window.location.href = '/portal-home';
        }
        
      } else {
        throw new Error(portalResult.error || 'Failed to create portal account');
      }
      
    } catch (error) {
      console.error('Error completing membership:', error);
      setError(error.message || 'Failed to complete membership setup. Please try again.');
    } finally {
      setIsCompletingMembership(false);
    }
  };

  useEffect(() => {
    // Give parent components time to update their state/banner
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150); // 150ms delay
    
    return () => clearTimeout(timer);
  }, []);

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

  const handleStartDocuSign = async (documentType = null) => {
    setError(null);
    
    // Check if DocuSign is blocked or being skipped
    if (BLOCK_DOCUSIGN_SIGNING || SKIP_DOCUSIGN_TEMP) {
      return; // Do nothing, button will show blocked/skipped state
    }
    
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
      console.log('USER OBJECT:', user);
      console.log('USER UID:', user?.uid);
      console.log('Firebase current user:', auth.currentUser);
      console.log('Firebase current user UID:', auth.currentUser?.uid);
      
      // Navigate to DocuSign using the prop
      if (onNavigateToDocuSign) {
        console.log(`📝 Calling onNavigateToDocuSign with: ${docToSign}`);
        onNavigateToDocuSign(docToSign, auth.currentUser?.uid);
      } else {
        console.log(`📝 No onNavigateToDocuSign prop provided`);
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
      if (!SKIP_DOCUSIGN_TEMP && !completionData?.docusignCompleted) {
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
          console.log("No onNavigateToPayment prop provided");
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

  if (!isReady) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <DelayedCenteredLoader 
        message="Loading membership completion steps..." 
        size="md" 
        color="primary" 
        minHeight="200px"
        delay={500}
      />
    );
  }

  // Error state
  if (!completionData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4" style={{ fontFamily: SYSTEM_FONT }}>Failed to load membership data</p>
        <button
          onClick={handleManualRefresh}
          className="px-5 py-2 bg-transparent border border-[#775684] text-[#775684] rounded-full font-normal text-sm hover:bg-gray-50 transition-all duration-300"
          style={{ fontFamily: SYSTEM_FONT }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { docusignDocuments, payment, docusignCompleted, paymentCompleted, totalDue } = completionData;
  
  // Check if both DocuSign documents are completed OR we're skipping DocuSign
  const bothDocusignCompleted = SKIP_DOCUSIGN_TEMP ? true : (
    docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED && 
    docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED
  );
  
  // Determine if payment can be started - simplified for bypass mode
  const canStartPayment = SKIP_DOCUSIGN_TEMP ? 
    salesforceStatus?.exists : // Only need Salesforce when bypassing
    (bothDocusignCompleted && salesforceStatus?.exists); // Need both DocuSign and Salesforce normally

  return (
    <div className="w-full" style={{ fontFamily: SYSTEM_FONT }}>
      <div 
        className="w-full bg-gray-100" 
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          position: 'relative'
        }}
      >
        <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
          
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700" style={{ fontSize: '14px' }}>{error}</p>
              </div>
            </div>
          )}

          {/* Phone Number Section - Only show when NOT bypassing DocuSign */}
          {!SKIP_DOCUSIGN_TEMP && (
            <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8"
                 style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">SMS Verification Required</h2>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 font-light" style={{ fontSize: '15px' }}>
                Docusign will send an SMS verification code to this number:
              </p>
              
              {isEditingPhone ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
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
                      className="px-3 py-2 bg-[#775684] text-white rounded-md hover:bg-[#664573] text-sm font-medium transition-all"
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
                  <p className="text-gray-900 font-medium" style={{ fontSize: '16px' }}>
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
          )}

          {/* Payment Step - Single card when bypassing, two cards when normal flow */}
          <div className={`${SKIP_DOCUSIGN_TEMP ? 'mb-8' : 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'}`}>
            
            {/* Step 1: DocuSign Card - Only show when NOT bypassing */}
            {!SKIP_DOCUSIGN_TEMP && (
              <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col transform transition duration-300 hover:scale-[1.02]"
                   style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
                
                <div className="p-4 sm:p-6 md:p-8 2xl:p-10 flex-1">
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-5">
                    <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Step 1: Sign Agreements</h3>
                  </div>
                  
                  <p className="text-gray-600 font-light mb-6" style={{ fontSize: '16px' }}>
                    Sign your membership documents electronically
                  </p>
                  
                  {/* Document Status List */}
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED 
                          ? 'bg-green-50' 
                          : BLOCK_DOCUSIGN_SIGNING
                            ? 'bg-blue-900 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (BLOCK_DOCUSIGN_SIGNING) {
                          return; // Do nothing when blocked
                        }
                        if (docusignDocuments.membershipAgreement !== STEP_STATUS.COMPLETED && completionData.docusignPhoneNumber) {
                          handleStartDocuSign(DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT);
                        }
                      }}
                    >
                      <span className={`text-sm font-normal ${
                        BLOCK_DOCUSIGN_SIGNING ? 'text-white' : 'text-gray-700'
                      }`}>
                        Membership Agreement
                      </span>
                      {docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : BLOCK_DOCUSIGN_SIGNING ? (
                        <span className="text-xs text-white">Temporarily Unavailable</span>
                      ) : (
                        <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                      )}
                    </div>
                    <div 
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED 
                          ? 'bg-green-50' 
                          : BLOCK_DOCUSIGN_SIGNING
                            ? 'bg-blue-900 cursor-not-allowed'
                            : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (BLOCK_DOCUSIGN_SIGNING) {
                          return; // Do nothing when blocked
                        }
                        if (docusignDocuments.confidentialityAgreement !== STEP_STATUS.COMPLETED && completionData.docusignPhoneNumber) {
                          handleStartDocuSign(DOCUSIGN_DOCS.CONFIDENTIALITY_AGREEMENT);
                        }
                      }}
                    >
                      <span className={`text-sm font-normal ${
                        BLOCK_DOCUSIGN_SIGNING ? 'text-white' : 'text-gray-700'
                      }`}>
                        Terms & Conditions
                      </span>
                      {docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : BLOCK_DOCUSIGN_SIGNING ? (
                        <span className="text-xs text-white">Temporarily Unavailable</span>
                      ) : (
                        <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (BLOCK_DOCUSIGN_SIGNING) {
                        return; // Do nothing when blocked
                      }
                      handleStartDocuSign();
                    }}
                    disabled={!completionData.docusignPhoneNumber || docusignCompleted}
                    className={`w-full px-5 py-2 rounded-full font-normal text-sm transition-all duration-300 ${
                      !completionData.docusignPhoneNumber || docusignCompleted
                        ? 'bg-transparent border border-gray-300 text-gray-400 cursor-not-allowed'
                        : BLOCK_DOCUSIGN_SIGNING
                          ? 'bg-blue-900 border border-blue-900 text-white cursor-not-allowed'
                          : 'bg-transparent border border-[#775684] text-[#775684] hover:bg-gray-50'
                    }`}
                  >
                    {docusignCompleted ? 'Agreements Signed' : 
                     BLOCK_DOCUSIGN_SIGNING ? 'Temporarily Unavailable' : 
                     'Continue Signing'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Payment Card - Full width when bypassing, half width when normal */}
            <div className={`bg-white rounded-[1.25rem] shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col transform transition duration-300 hover:scale-[1.02] ${
              !canStartPayment ? 'opacity-60' : ''
            }`}
                 style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              
              <div className="p-4 sm:p-6 md:p-8 2xl:p-10 flex-1">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-5">
                  <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {SKIP_DOCUSIGN_TEMP ? 'Payment Step' : 'Step 2: Payment'}
                  </h3>
                </div>
                
                <p className="text-gray-600 font-light mb-6" style={{ fontSize: '16px' }}>
                  Complete your membership payment
                </p>
                
                <div className="border-t border-gray-200 pt-4">
                  {/* Payment breakdown based on membership type */}
                  {completionData?.membershipType === 'basic' ? (
                    // Basic membership: show annual dues
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500" style={{ fontSize: '14px' }}>Annual Membership:</span>
                        <span className="text-gray-700" style={{ fontSize: '14px' }}>
                          {formatCurrency(completionData?.paymentBreakdown?.baseCost || 540)}
                        </span>
                      </div>
                      {completionData?.paymentBreakdown?.iceDiscount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500" style={{ fontSize: '14px' }}>ICE Discount:</span>
                          <span className="text-green-600" style={{ fontSize: '14px' }}>
                            -{formatCurrency(completionData.paymentBreakdown.iceDiscount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-700 font-medium" style={{ fontSize: '16px' }}>Amount due:</span>
                        <span className="font-semibold text-gray-900" style={{ fontSize: '18px' }}>
                          {formatCurrency(totalDue)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Cryo membership: show application fee (and CMS if applicable)
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500" style={{ fontSize: '14px' }}>Application Fee:</span>
                        <span className="text-gray-700" style={{ fontSize: '14px' }}>
                          {formatCurrency(completionData?.paymentBreakdown?.applicationFee || 300)}
                        </span>
                      </div>
                      {completionData?.paymentBreakdown?.cmsAnnualFee > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500" style={{ fontSize: '14px' }}>CMS Annual Fee:</span>
                          <span className="text-gray-700" style={{ fontSize: '14px' }}>
                            {formatCurrency(completionData.paymentBreakdown.cmsAnnualFee)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-gray-700 font-medium" style={{ fontSize: '16px' }}>Amount due:</span>
                        <span className="font-semibold text-gray-900" style={{ fontSize: '18px' }}>
                          {formatCurrency(totalDue)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 italic pt-1">
                        Annual membership dues will begin after cryopreservation contracts are completed
                      </p>
                    </div>
                  )}
                  
                  {paymentCompleted && (
                    <div className="flex items-center mt-3 text-green-600">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Payment completed</span>
                    </div>
                  )}
                  
                  {!bothDocusignCompleted && !SKIP_DOCUSIGN_TEMP && (
                    <p className="text-sm text-gray-500 mt-3 italic">Complete all agreements first</p>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={handleStartPayment}
                  disabled={!canStartPayment || paymentCompleted}
                  className={`w-full px-5 py-2 rounded-full font-normal text-sm transition-all duration-300 ${
                    !canStartPayment || paymentCompleted
                      ? 'bg-transparent border border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-transparent border border-[#775684] text-[#775684] hover:bg-gray-50'
                  }`}
                >
                  {paymentCompleted ? 'Payment Completed' : 'Make Payment'}
                </button>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="bg-white rounded-[1.25rem] shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-6"
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <h4 className="text-gray-900 mb-3" style={{ fontSize: '16px', fontWeight: '500' }}>
              {SKIP_DOCUSIGN_TEMP ? 'Payment Status' : 'Progress Summary'}
            </h4>
            <div className="space-y-2">
              {!SKIP_DOCUSIGN_TEMP && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600" style={{ fontSize: '14px' }}>Documents Signed:</span>
                  <span className="font-medium text-gray-900">
                    {`${[docusignDocuments.membershipAgreement, docusignDocuments.confidentialityAgreement]
                      .filter(s => s === STEP_STATUS.COMPLETED).length} of 2`}
                  </span>
                </div>
              )}
              {(bothDocusignCompleted || SKIP_DOCUSIGN_TEMP) && (
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
          <div className="text-center mb-8">
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
          <div className="flex justify-between mt-8 pb-[150px] md:pb-0">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    setBackButtonError(true);
                  }
                }}
                className="px-5 py-2 bg-transparent border border-gray-400 text-gray-700 rounded-full font-normal text-sm hover:bg-gray-50 transition-all duration-300 flex items-center"
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
            
            {(completionData.allStepsCompleted || (docusignCompleted && paymentCompleted)) && (
              <button
                onClick={handleComplete}
                disabled={isCompletingMembership}
                className="px-5 py-2 bg-transparent border border-[#775684] text-[#775684] rounded-full font-normal text-sm hover:bg-gray-50 transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompletingMembership ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#775684] mr-2"></div>
                    Creating Portal Access...
                  </span>
                ) : (
                  <>
                    Complete & Access Portal
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}