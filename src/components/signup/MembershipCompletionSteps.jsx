// File: pages/signup/MembershipCompletionSteps.jsx - Fixed Version
import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import membershipService from "../../services/membership";
import { updateSignupProgressAPI } from "../../services/auth";

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
  const [tempPhoneNumber, setTempPhoneNumber] = useState('');

  // Check completion status from backend
  const checkCompletionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get completion status (includes readyForDocuSign data)
      const result = await membershipService.checkMembershipCompletionStatus();
      
      if (result.success) {
        console.log("✅ Completion status loaded:", result.data);
        setCompletionData(result.data);
        setTempPhoneNumber(result.data.docusignPhoneNumber || '');
        
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
    }
  };
  

  // Always refresh status when component mounts or becomes visible
  useEffect(() => {
    console.log("📊 MembershipCompletionSteps mounted/visible - refreshing status");
    checkCompletionStatus();
  }, []);

  // Refresh when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      console.log("📊 Page focused - refreshing completion status");
      checkCompletionStatus();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also check on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("📊 Page became visible - refreshing completion status");
        checkCompletionStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
          checkCompletionStatus();
        })
        .catch(err => {
          console.error("Error updating DocuSign status:", err);
          checkCompletionStatus();
        });
    } else if (location.state?.docusignCompleted || location.state?.paymentCompleted) {
      console.log("📍 Returned from step, refreshing status");
      checkCompletionStatus();
    }
  }, [location]);

  // Handle saving phone number
  const handleSavePhone = async () => {
    try {
      const phoneRegex = /^\+?1?\d{10,}$/;
      if (!tempPhoneNumber.match(phoneRegex)) {
        setError("Please enter a valid phone number (10+ digits)");
        return;
      }
      
      const result = await membershipService.updateDocuSignPhone({
        docusignPhoneNumber: tempPhoneNumber
      });
      
      if (result.success) {
        setCompletionData(prev => ({
          ...prev,
          docusignPhoneNumber: tempPhoneNumber
        }));
        setIsEditingPhone(false);
        setError(null);
        console.log("✅ Phone number saved successfully");
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
      console.log(`📝 Document constants check - MEMBERSHIP_AGREEMENT: ${DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT}, CONFIDENTIALITY_AGREEMENT: ${DOCUSIGN_DOCS.CONFIDENTIALITY_AGREEMENT}`);
      
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#775684]"></div>
        <p className="ml-4 text-xl text-gray-700">Loading membership completion steps...</p>
      </div>
    );
  }

  // Error state
  if (!completionData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load membership data</p>
        <button
          onClick={checkCompletionStatus}
          className="px-4 py-2 bg-[#775684] text-white rounded-lg hover:bg-[#664573]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { docusignDocuments, payment, docusignCompleted, paymentCompleted, totalDue } = completionData;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Membership</h1>
        <p className="text-gray-600">Please complete all steps below to finalize your membership</p>
      </div>

      {/* Phone Number Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800 mb-1">SMS Verification Required</h3>
            <p className="text-blue-700 text-sm mb-2">
              DocuSign will send an SMS verification code to this number:
            </p>
            
            {isEditingPhone ? (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="tel"
                  value={tempPhoneNumber}
                  onChange={(e) => setTempPhoneNumber(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter phone number"
                />
                <button
                  onClick={handleSavePhone}
                  className="bg-[#775684] text-white px-3 py-2 rounded-md hover:bg-[#664573] text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingPhone(false);
                    setTempPhoneNumber(completionData.docusignPhoneNumber || '');
                    setError(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2">
                <p className="text-gray-900 font-medium">
                  {completionData.docusignPhoneNumber || 'No phone number provided'}
                </p>
                <button
                  onClick={() => {
                    setIsEditingPhone(true);
                    setTempPhoneNumber(completionData.docusignPhoneNumber || '');
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

      {/* Two Cards Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Step 1: DocuSign Card */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
          docusignCompleted ? 'border-green-500' : 'border-gray-200'
        }`}>
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              docusignCompleted ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {docusignCompleted ? (
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Step 1: Sign Agreements</h3>
            
            {/* Document Status List */}
            <div className="text-left mb-4 space-y-2">
              <div 
                className={`flex items-center justify-between p-2 rounded transition-colors ${
                  docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED 
                    ? 'bg-green-50' 
                    : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                }`}
                onClick={() => {
                  console.log("🔍 Membership Agreement clicked");
                  console.log("  - Status:", docusignDocuments.membershipAgreement);
                  console.log("  - Has phone:", !!completionData.docusignPhoneNumber);
                  if (docusignDocuments.membershipAgreement !== STEP_STATUS.COMPLETED && completionData.docusignPhoneNumber) {
                    console.log("  - Starting DocuSign for:", DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT);
                    handleStartDocuSign(DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT);
                  }
                }}
              >
                <span className="text-sm">Membership Agreement</span>
                {docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                )}
              </div>
              
              <div 
                className={`flex items-center justify-between p-2 rounded transition-colors ${
                  docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED 
                    ? 'bg-green-50' 
                    : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                }`}
                onClick={() => {
                  console.log("🔍 Terms & Conditions clicked");
                  console.log("  - Status:", docusignDocuments.confidentialityAgreement);
                  console.log("  - Has phone:", !!completionData.docusignPhoneNumber);
                  if (docusignDocuments.confidentialityAgreement !== STEP_STATUS.COMPLETED && completionData.docusignPhoneNumber) {
                    console.log("  - Starting DocuSign for:", DOCUSIGN_DOCS.CONFIDENTIALITY_AGREEMENT);
                    handleStartDocuSign(DOCUSIGN_DOCS.CONFIDENTIALITY_AGREEMENT);
                  }
                }}
              >
                <span className="text-sm">Terms & Conditions</span>
                {docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                )}
              </div>
            </div>
            
            {docusignCompleted ? (
              <div className="text-green-600 font-medium">✓ All Agreements Signed</div>
            ) : (
              <button
                onClick={() => handleStartDocuSign()}
                disabled={!completionData.docusignPhoneNumber}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  completionData.docusignPhoneNumber 
                    ? 'bg-[#775684] text-white hover:bg-[#664573]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue Signing
              </button>
            )}
          </div>
        </div>
        
        {/* Step 2: Payment Card */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
          paymentCompleted 
            ? 'border-green-500' 
            : !docusignCompleted
              ? 'border-gray-200 opacity-60'
              : 'border-gray-200'
        }`}>
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              paymentCompleted ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {paymentCompleted ? (
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Step 2: Payment</h3>
            
            <p className="text-gray-600 mb-4">
              {paymentCompleted 
                ? 'Your payment has been processed'
                : `Amount due: ${formatCurrency(totalDue)}`
              }
            </p>
            
            {!docusignCompleted && (
              <p className="text-sm text-gray-500 mb-4">Complete all agreements first</p>
            )}
            
            {paymentCompleted ? (
              <div className="text-green-600 font-medium">✓ Payment Completed</div>
            ) : (
              <button
                onClick={handleStartPayment}
                disabled={!docusignCompleted}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  !docusignCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#775684] text-white hover:bg-[#664573]'
                }`}
              >
                Make Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Progress Summary</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Documents Signed:</span>
            <span className="text-sm font-medium">
              {[docusignDocuments.membershipAgreement, docusignDocuments.confidentialityAgreement]
                .filter(s => s === STEP_STATUS.COMPLETED).length} of 2
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Payment Status:</span>
            <span className="text-sm font-medium">
              {paymentCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center mb-8">
        <button
          onClick={checkCompletionStatus}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Click to check if you've completed any steps outside this page
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="py-3 px-6 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50"
        >
          Back
        </button>
        
        {completionData.allStepsCompleted && (
          <button
            onClick={onComplete}
            className="py-3 px-6 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573]"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}