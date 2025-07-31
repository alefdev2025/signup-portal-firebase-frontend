// File: pages/signup/MembershipCompletionSteps.jsx - UPDATED FOR TWO DOCUMENTS
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
 TERMS_AND_CONDITIONS: 'terms_and_conditions'
};

export default function MembershipCompletionSteps({ 
 membershipData, 
 packageData, 
 contactData,
 fundingData,
 onBack,
 onComplete,
 onNavigateToDocuSign,
 onNavigateToPayment
}) {
 const { user } = useUser();
 const navigate = useNavigate();
 const location = useLocation();
 const [currentStep, setCurrentStep] = useState(1);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [docusignPhoneNumber, setDocusignPhoneNumber] = useState(null);
 const [isEditingPhone, setIsEditingPhone] = useState(false);
 const [tempPhoneNumber, setTempPhoneNumber] = useState('');
 
 // Track individual DocuSign documents
 const [docusignStatus, setDocusignStatus] = useState({
   membershipAgreement: STEP_STATUS.NOT_STARTED,
   termsAndConditions: STEP_STATUS.NOT_STARTED
 });
 
 // Overall step completion status
 const [stepStatus, setStepStatus] = useState({
   docusign: STEP_STATUS.NOT_STARTED,
   payment: STEP_STATUS.NOT_STARTED
 });

 // Calculated values for display
 const [totalDueToday, setTotalDueToday] = useState(0);
 
 // Use system font
 const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

 // Check if returning from payment
 useEffect(() => {
   if (location.state?.paymentCompleted) {
     console.log("Returned from payment - refreshing status");
     checkCompletionStatus();
     
     if (!location.state?.statusUpdateError) {
       console.log("Payment completed successfully!");
     }
   }
 }, [location.state]);

 // Check if returning from DocuSign
 useEffect(() => {
   if (location.state?.docusignCompleted) {
     console.log("Returned from DocuSign - refreshing status");
     checkCompletionStatus();
   }
 }, [location.state]);

 // Ensure we're at step 6 when this component mounts
 useEffect(() => {
   const ensureStep6 = async () => {
     try {
       console.log("MembershipCompletionSteps mounted, ensuring we're at step 6");
       await updateSignupProgressAPI("docusign", 6);
     } catch (error) {
       console.error("Error updating to step 6:", error);
     }
   };
   ensureStep6();
 }, []);

 // Check completion status from backend
 const checkCompletionStatus = async () => {
   try {
     const result = await membershipService.checkMembershipCompletionStatus();
     if (result.success) {
       console.log("Completion status:", result.data);
       
       // Get the phone number from backend
       if (result.data.docusignPhoneNumber) {
         setDocusignPhoneNumber(result.data.docusignPhoneNumber);
         setTempPhoneNumber(result.data.docusignPhoneNumber);
       }
       
       // Update individual DocuSign document status
       if (result.data.docusignDocuments) {
         setDocusignStatus({
           membershipAgreement: result.data.docusignDocuments.membershipAgreement || STEP_STATUS.NOT_STARTED,
           termsAndConditions: result.data.docusignDocuments.confidentialityAgreement || STEP_STATUS.NOT_STARTED
         });
       }
       
       // Check if all DocuSign documents are completed
       const allDocusignCompleted = result.data.docusignDocuments && 
         result.data.docusignDocuments.membershipAgreement === STEP_STATUS.COMPLETED &&
         result.data.docusignDocuments.confidentialityAgreement === STEP_STATUS.COMPLETED;
       
       // Update overall step status
       const newStatus = {
         docusign: allDocusignCompleted ? STEP_STATUS.COMPLETED : STEP_STATUS.NOT_STARTED,
         payment: result.data.paymentCompleted ? STEP_STATUS.COMPLETED : STEP_STATUS.NOT_STARTED
       };
       setStepStatus(newStatus);
       
       // Update progress if DocuSign is completed
       if (allDocusignCompleted && result.data.currentStep < 7) {
         console.log("All DocuSign documents completed, updating to step 7");
         await updateSignupProgressAPI("payment", 7);
       }
       
       // Update progress if payment is completed
       if (result.data.paymentCompleted && result.data.currentStep < 8) {
         console.log("Payment completed, updating to step 8");
         await updateSignupProgressAPI("completion", 8);
       }
       
       // If both completed, redirect to completion
       if (allDocusignCompleted && result.data.paymentCompleted) {
         if (onComplete) {
           onComplete();
         }
       }
     }
   } catch (error) {
     console.error("Error checking completion status:", error);
   }
 };

 // Load initial data and check status
 useEffect(() => {
   const init = async () => {
     setIsLoading(true);
     
     try {
       // Calculate total due
       const baseCost = membershipData?.membership || packageData?.annualCost || 540;
       const isBasicMembership = packageData?.preservationType === 'basic';
       let total = baseCost;
       
       // Add application fee for non-basic
       if (!isBasicMembership) {
         total += 300;
       }
       
       // Add CMS fee if selected
       if (membershipData?.cmsWaiver && !isBasicMembership) {
         total += 200;
       }
       
       // Apply ICE discount
       if (membershipData?.iceCodeValid && membershipData?.iceDiscountAmount) {
         total -= membershipData.iceDiscountAmount;
       }
       
       setTotalDueToday(total);
       
       // Check completion status
       await checkCompletionStatus();
       
     } catch (error) {
       console.error("Error initializing completion steps:", error);
       setError("Failed to load membership status. Please refresh and try again.");
     } finally {
       setIsLoading(false);
     }
   };
   
   init();
 }, []);

 // Handle saving phone number
 const handleSavePhone = async () => {
   try {
     console.log("Saving phone number:", tempPhoneNumber);
     
     // Validate phone number format
     const phoneRegex = /^\+?1?\d{10,}$/;
     if (!tempPhoneNumber.match(phoneRegex)) {
       setError("Please enter a valid phone number");
       return;
     }
     
     // Update the phone number in the backend
     const result = await membershipService.updateDocuSignPhone({
       docusignPhoneNumber: tempPhoneNumber
     });
     
     if (result.success) {
       setDocusignPhoneNumber(tempPhoneNumber);
       setIsEditingPhone(false);
       setError(null);
     } else {
       throw new Error("Failed to update phone number");
     }
   } catch (error) {
     console.error("Error saving phone number:", error);
     setError("Failed to update phone number. Please try again.");
   }
 };

 // Handle starting specific DocuSign document
 const handleStartDocuSign = async (documentType = null) => {
   setError(null);
   
   try {
     if (!docusignPhoneNumber) {
       setError("Phone number is required for DocuSign verification. Please add your phone number above.");
       return;
     }
     
     // Determine which document to sign
     let docToSign = documentType;
     if (!docToSign) {
       // If no specific document requested, sign the first incomplete one
       if (docusignStatus.membershipAgreement !== STEP_STATUS.COMPLETED) {
         docToSign = DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT;
       } else if (docusignStatus.termsAndConditions !== STEP_STATUS.COMPLETED) {
         docToSign = DOCUSIGN_DOCS.TERMS_AND_CONDITIONS;
       } else {
         setError("All documents have already been signed.");
         return;
       }
     }
     
     console.log(`Starting DocuSign for document: ${docToSign}`);
     
     // Update status to in progress
     setStepStatus(prev => ({
       ...prev,
       docusign: STEP_STATUS.IN_PROGRESS
     }));
     
     // Navigate to the MembershipDocuSign component with document type
     if (onNavigateToDocuSign) {
       onNavigateToDocuSign(docToSign);
     } else {
       setError("DocuSign navigation not configured. Please contact support.");
     }
     
   } catch (error) {
     console.error("Error starting DocuSign:", error);
     setError(error.message || "Failed to start DocuSign process. Please try again.");
     setStepStatus(prev => ({
       ...prev,
       docusign: STEP_STATUS.NOT_STARTED
     }));
   }
 };

 // Handle starting payment
 const handleStartPayment = async () => {
   setError(null);
   
   try {
     // Make sure all DocuSign documents are completed first
     if (!allDocusignCompleted) {
       setError("Please complete signing all agreements first.");
       return;
     }
     
     console.log("🎯 Starting payment process");
     
     // Navigate to payment using the callback or direct navigation
     if (onNavigateToPayment) {
       onNavigateToPayment();
     } else {
       // Fallback to direct navigation
       navigate('/signup/payment');
     }
     
   } catch (error) {
     console.error("Error starting payment:", error);
     setError("Failed to start payment process. Please try again.");
   }
 };

 // Handle going back
 const handleBack = () => {
   if (onBack) {
     onBack();
   }
 };

 // Refresh status (for when they come back from DocuSign)
 const handleRefreshStatus = async () => {
   setIsLoading(true);
   setError(null);
   await checkCompletionStatus();
   setIsLoading(false);
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

 // Check if all DocuSign documents are completed
 const allDocusignCompleted = docusignStatus.membershipAgreement === STEP_STATUS.COMPLETED &&
                              docusignStatus.termsAndConditions === STEP_STATUS.COMPLETED;

 // Get button text for DocuSign
 const getDocuSignButtonText = () => {
   if (docusignStatus.membershipAgreement === STEP_STATUS.NOT_STARTED && 
       docusignStatus.termsAndConditions === STEP_STATUS.NOT_STARTED) {
     return 'Start DocuSign';
   } else if (docusignStatus.membershipAgreement === STEP_STATUS.COMPLETED && 
              docusignStatus.termsAndConditions === STEP_STATUS.NOT_STARTED) {
     return 'Sign Terms & Conditions';
   } else if (docusignStatus.membershipAgreement === STEP_STATUS.NOT_STARTED && 
              docusignStatus.termsAndConditions === STEP_STATUS.COMPLETED) {
     return 'Sign Membership Agreement';
   } else {
     return 'Continue DocuSign';
   }
 };

 if (isLoading) {
   return (
     <div className="flex items-center justify-center py-12">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#775684]"></div>
       <p className="ml-4 text-xl text-gray-700">Loading membership completion steps...</p>
     </div>
   );
 }

 return (
   <div className="w-full" style={{
     width: '100vw',
     marginLeft: 'calc(-50vw + 50%)',
     marginRight: 'calc(-50vw + 50%)',
     position: 'relative',
     fontFamily: SYSTEM_FONT
   }}>
     <div className="w-full mx-auto px-4 sm:px-6 md:px-8 py-8 max-w-[95%] sm:max-w-[90%] md:max-w-[80%] lg:max-w-[70%]">
       
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
           <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
           </svg>
           <div className="flex-1">
             <h3 className="text-sm font-semibold text-blue-800 mb-1">SMS Verification Required</h3>
             <p className="text-blue-700 text-sm mb-2">
               DocuSign will send an SMS verification code to this number:
             </p>
             
             {/* Phone Number Display/Edit */}
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
                     setTempPhoneNumber(docusignPhoneNumber || '');
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
                   {docusignPhoneNumber || 'No phone number provided'}
                 </p>
                 <button
                   onClick={() => {
                     setIsEditingPhone(true);
                     setTempPhoneNumber(docusignPhoneNumber || '');
                   }}
                   className="text-[#775684] hover:text-[#664573] font-medium text-sm"
                 >
                   {docusignPhoneNumber ? 'Change' : 'Add Phone'}
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
           allDocusignCompleted 
             ? 'border-green-500' 
             : 'border-gray-200'
         }`}>
           <div className="text-center">
             <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
               allDocusignCompleted 
                 ? 'bg-green-100' 
                 : 'bg-gray-100'
             }`}>
               {allDocusignCompleted ? (
                 <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                 </svg>
               ) : (
                 <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
               )}
             </div>
             
             <h3 className="text-xl font-semibold mb-2">
               Step 1: Sign Agreements
             </h3>
             
             {/* Show individual document status */}
             <div className="text-left mb-4 space-y-2">
               <div 
                 className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                   docusignStatus.membershipAgreement === STEP_STATUS.COMPLETED 
                     ? 'bg-green-50' 
                     : 'bg-gray-50 hover:bg-gray-100'
                 }`}
                 onClick={() => {
                   if (docusignStatus.membershipAgreement !== STEP_STATUS.COMPLETED && docusignPhoneNumber) {
                     handleStartDocuSign(DOCUSIGN_DOCS.MEMBERSHIP_AGREEMENT);
                   }
                 }}
               >
                 <span className="text-sm">Membership Agreement</span>
                 {docusignStatus.membershipAgreement === STEP_STATUS.COMPLETED ? (
                   <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                   </svg>
                 ) : (
                   <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                 )}
               </div>
               <div 
                 className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                   docusignStatus.termsAndConditions === STEP_STATUS.COMPLETED 
                     ? 'bg-green-50' 
                     : 'bg-gray-50 hover:bg-gray-100'
                 }`}
                 onClick={() => {
                   if (docusignStatus.termsAndConditions !== STEP_STATUS.COMPLETED && docusignPhoneNumber) {
                     handleStartDocuSign(DOCUSIGN_DOCS.TERMS_AND_CONDITIONS);
                   }
                 }}
               >
                 <span className="text-sm">Terms & Conditions</span>
                 {docusignStatus.termsAndConditions === STEP_STATUS.COMPLETED ? (
                   <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                   </svg>
                 ) : (
                   <span className="text-xs text-[#775684] hover:underline">Sign →</span>
                 )}
               </div>
             </div>
             
             {allDocusignCompleted ? (
               <div className="text-green-600 font-medium">
                 ✓ All Agreements Signed
               </div>
             ) : (
               <button
                 onClick={() => handleStartDocuSign()}
                 disabled={!docusignPhoneNumber}
                 className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                   docusignPhoneNumber 
                     ? 'bg-[#775684] text-white hover:bg-[#664573]'
                     : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                 }`}
               >
                 {getDocuSignButtonText()}
               </button>
             )}
           </div>
         </div>
         
         {/* Step 2: Payment Card */}
         <div className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
           stepStatus.payment === STEP_STATUS.COMPLETED 
             ? 'border-green-500' 
             : !allDocusignCompleted
               ? 'border-gray-200 opacity-60'
               : 'border-gray-200'
         }`}>
           <div className="text-center">
             <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
               stepStatus.payment === STEP_STATUS.COMPLETED 
                 ? 'bg-green-100' 
                 : 'bg-gray-100'
             }`}>
               {stepStatus.payment === STEP_STATUS.COMPLETED ? (
                 <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                 </svg>
               ) : (
                 <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                 </svg>
               )}
             </div>
             
             <h3 className="text-xl font-semibold mb-2">
               Step 2: Payment
             </h3>
             
             <p className="text-gray-600 mb-4">
               {stepStatus.payment === STEP_STATUS.COMPLETED 
                 ? 'Your payment has been processed'
                 : `Amount due: ${formatCurrency(totalDueToday)}`
               }
             </p>
             
             {!allDocusignCompleted && (
               <p className="text-sm text-gray-500 mb-4">
                 Complete all agreements first
               </p>
             )}
             
             {stepStatus.payment === STEP_STATUS.COMPLETED ? (
               <div className="text-green-600 font-medium">
                 ✓ Payment Completed
               </div>
             ) : (
               <button
                 onClick={handleStartPayment}
                 disabled={!allDocusignCompleted}
                 className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                   !allDocusignCompleted
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
               {[docusignStatus.membershipAgreement, docusignStatus.termsAndConditions].filter(s => s === STEP_STATUS.COMPLETED).length} of 2
             </span>
           </div>
           <div className="flex items-center justify-between">
             <span className="text-sm text-gray-600">Payment Status:</span>
             <span className="text-sm font-medium">
               {stepStatus.payment === STEP_STATUS.COMPLETED ? 'Completed' : 'Pending'}
             </span>
           </div>
         </div>
       </div>

       {/* Refresh Status Button */}
       <div className="text-center mb-8">
         <button
           onClick={handleRefreshStatus}
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
           onClick={handleBack}
           className="py-3 px-6 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all"
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
           </svg>
           Back
         </button>
         
         {allDocusignCompleted && stepStatus.payment === STEP_STATUS.COMPLETED && (
           <button
             onClick={onComplete}
             className="py-3 px-6 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573] transition-colors flex items-center"
           >
             Continue
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
           </button>
         )}
       </div>
     </div>
   </div>
 );
}