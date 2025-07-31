// File: pages/signup/MembershipDocuSign.jsx - UPDATED FOR TWO DOCUMENTS
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import { getFunctions, httpsCallable } from 'firebase/functions';
import whiteALogoNoText from "../../assets/images/alcor-white-logo-no-text.png";

// Import services
import membershipService from "../../services/membership";
import fundingService from "../../services/funding";
import { getContactInfo } from "../../services/contact";
import { getMembershipCost } from "../../services/pricing";

import DotLoader, { NewtonCradleLoader } from "../../components/DotLoader";

const DOCUMENT_NAMES = {
 membership_agreement: 'Membership Agreement',
 terms_and_conditions: 'Terms and Conditions'
};

export default function MembershipDocuSign({ 
 membershipData,
 packageData,
 contactData,
 documentType = 'membership_agreement', // Which document to sign
 onBack,
 onComplete 
}) {
 const { user } = useUser();
 const iframeRef = useRef(null);
 const messageListenerRef = useRef(null);
 const iframeTimeoutRef = useRef(null);
 const retryCountRef = useRef(0);
 
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState(null);
 const [userData, setUserData] = useState(null);
 const [docuSignStatus, setDocuSignStatus] = useState('initializing');
 const [docuSignError, setDocuSignError] = useState(null);
 const [signingUrl, setSigningUrl] = useState(null);
 const [showIframe, setShowIframe] = useState(false);
 const [iframeLoaded, setIframeLoaded] = useState(false);
 const [iframeError, setIframeError] = useState(false);
 const [currentDocument, setCurrentDocument] = useState(documentType);
 
 // Constants
 const MAX_RETRY_ATTEMPTS = 3;
 const IFRAME_TIMEOUT = 30000; // 30 seconds
 const DOCUSIGN_ORIGINS = [
   'https://demo.docusign.net',
   'https://www.docusign.net',
   'https://sign.docusign.net',
   'https://na1.docusign.net',
   'https://na2.docusign.net',
   'https://na3.docusign.net',
   'https://na4.docusign.net',
   'https://eu1.docusign.net',
   'https://eu2.docusign.net'
 ];
 
 // Apply Marcellus font
 const marcellusStyle = {
   fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
   fontSize: "1.05rem"
 };

 // Cleanup function
 const cleanup = useCallback(() => {
   if (messageListenerRef.current) {
     window.removeEventListener('message', messageListenerRef.current);
     messageListenerRef.current = null;
   }
   if (iframeTimeoutRef.current) {
     clearTimeout(iframeTimeoutRef.current);
     iframeTimeoutRef.current = null;
   }
 }, []);

 // Enhanced message listener for DocuSign iframe events
 const setupDocuSignMessageListener = useCallback(() => {
   // Clean up existing listener
   cleanup();
   
   const messageListener = async (event) => {
     console.log('Received message from:', event.origin, 'Data:', event.data);
     
     // Verify the origin is from DocuSign
     if (!DOCUSIGN_ORIGINS.includes(event.origin)) {
       console.warn('Message from unknown origin:', event.origin);
       return;
     }
     
     // Handle different types of messages
     if (event.data && typeof event.data === 'object') {
       const { type, message, eventType } = event.data;
       
       console.log('DocuSign event:', { type, message, eventType, fullData: event.data });
       
       // Handle various DocuSign event types
       switch (type || eventType) {
         case 'signing_complete':
         case 'signing-complete':
         case 'complete':
           console.log(`✅ DocuSign ${currentDocument} signing completed successfully`);
           setDocuSignStatus('completed');
           setShowIframe(false);
           setIframeLoaded(false);
           
           // Clear any timeouts
           if (iframeTimeoutRef.current) {
             clearTimeout(iframeTimeoutRef.current);
             iframeTimeoutRef.current = null;
           }
           
           // Update backend status for this document
           try {
             await membershipService.updateDocuSignStatus(
               currentDocument,
               'completed'
             );
             console.log(`✅ Updated backend status for ${currentDocument}`);
           } catch (err) {
             console.error('Error updating document status:', err);
           }
           
           // Call completion handler after a brief delay
           setTimeout(() => {
             if (onComplete) {
               onComplete({
                 documentType: currentDocument,
                 status: 'completed'
               });
             }
           }, 1500);
           break;
           
         case 'cancel':
         case 'signing-cancel':
         case 'user_cancel':
           console.log(`❌ DocuSign ${currentDocument} signing cancelled by user`);
           setDocuSignStatus('error');
           setDocuSignError('Document signing was cancelled by user');
           setShowIframe(false);
           setIframeLoaded(false);
           break;
           
         case 'exception':
         case 'error':
         case 'signing-error':
           console.error('❌ DocuSign exception/error:', event.data);
           setDocuSignStatus('error');
           setDocuSignError(message || 'An error occurred during the signing process');
           setShowIframe(false);
           setIframeLoaded(false);
           break;
           
         case 'session_timeout':
         case 'timeout':
           console.warn('⏱️ DocuSign session timeout');
           setDocuSignStatus('error');
           setDocuSignError('Session timed out. Please try again.');
           setShowIframe(false);
           setIframeLoaded(false);
           break;
           
         case 'ready':
         case 'loaded':
           console.log('📄 DocuSign iframe loaded and ready');
           setIframeLoaded(true);
           setIframeError(false);
           
           // Clear timeout since iframe loaded successfully
           if (iframeTimeoutRef.current) {
             clearTimeout(iframeTimeoutRef.current);
             iframeTimeoutRef.current = null;
           }
           break;
           
         case 'resize':
           // Handle iframe resize if needed
           if (event.data.height && iframeRef.current) {
             iframeRef.current.style.height = `${event.data.height}px`;
           }
           break;
           
         default:
           console.log('ℹ️ Unknown DocuSign event:', type || eventType, event.data);
       }
     } else if (typeof event.data === 'string') {
       // Sometimes DocuSign sends string messages
       console.log('DocuSign string message:', event.data);
       
       if (event.data.includes('complete') || event.data.includes('success')) {
         console.log(`✅ DocuSign ${currentDocument} completion detected from string message`);
         setDocuSignStatus('completed');
         setShowIframe(false);
         
         // Update backend status
         try {
           await membershipService.updateDocuSignStatus(
             currentDocument,
             'completed'
           );
         } catch (err) {
           console.error('Error updating document status:', err);
         }
         
         setTimeout(() => onComplete?.({
           documentType: currentDocument,
           status: 'completed'
         }), 1500);
       }
     }
   };
   
   messageListenerRef.current = messageListener;
   window.addEventListener('message', messageListener);
   
   console.log('📡 DocuSign message listener set up');
 }, [currentDocument, onComplete, cleanup]);

 // Handle iframe load events
 const handleIframeLoad = useCallback(() => {
   console.log('🔄 Iframe load event triggered');
   setIframeLoaded(true);
   setIframeError(false);
   
   // Clear timeout
   if (iframeTimeoutRef.current) {
     clearTimeout(iframeTimeoutRef.current);
     iframeTimeoutRef.current = null;
   }
   
   // EMERGENCY FIX: Force iframe to full viewport
   if (iframeRef.current) {
     const iframe = iframeRef.current;
     iframe.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 999999 !important;';
     
     // Also hide any parent containers that might be constraining it
     document.body.style.overflow = 'hidden';
     
     // Find and hide the signup layout if it exists
     const signupLayout = document.querySelector('.signup-layout');
     if (signupLayout) {
       signupLayout.style.display = 'none';
     }
   }
   
   // Try to communicate with the iframe
   try {
     if (iframeRef.current && iframeRef.current.contentWindow) {
       // Send a ready message to DocuSign iframe
       iframeRef.current.contentWindow.postMessage({ type: 'parent_ready' }, '*');
     }
   } catch (err) {
     console.warn('Could not communicate with iframe:', err);
   }
 }, []);

 // Handle iframe error events
 const handleIframeError = useCallback(() => {
   console.error('❌ Iframe failed to load');
   setIframeError(true);
   setIframeLoaded(false);
   setDocuSignStatus('error');
   setDocuSignError('Failed to load signing interface. Please check your internet connection and try again.');
   
   if (iframeTimeoutRef.current) {
     clearTimeout(iframeTimeoutRef.current);
     iframeTimeoutRef.current = null;
   }
 }, []);

 // Set up iframe timeout
 const setupIframeTimeout = useCallback(() => {
   if (iframeTimeoutRef.current) {
     clearTimeout(iframeTimeoutRef.current);
   }
   
   iframeTimeoutRef.current = setTimeout(() => {
     if (!iframeLoaded) {
       console.error('⏱️ Iframe loading timeout');
       setIframeError(true);
       setDocuSignStatus('error');
       setDocuSignError('Signing interface took too long to load. Please try again.');
     }
   }, IFRAME_TIMEOUT);
 }, [iframeLoaded]);

// Enhanced DocuSign process with detailed logging
// Enhanced DocuSign process with complete data mapping from readyForDocuSign
const startEmbeddedDocuSignProcess = async (userDataCollection, docType) => {
    try {
      setDocuSignStatus('creating');
      setDocuSignError(null);
      setIframeError(false);
      setIframeLoaded(false);
      
      console.log(`🚀 Starting DocuSign embedded process for: ${docType}`);
      console.log(`📄 Document: ${DOCUMENT_NAMES[docType]}`);
      console.log('📋 User data collection:', userDataCollection);
      
      // First, try to get readyForDocuSign data from backend
      let readyForDocuSignData = null;
      try {
        const membershipResult = await membershipService.getMembershipInfo();
        if (membershipResult.success && membershipResult.data) {
          // The readyForDocuSign data might be at the user level
          readyForDocuSignData = membershipResult.readyForDocuSign;
        }
      } catch (err) {
        console.log('Could not fetch readyForDocuSign data:', err);
      }
      
      console.log('📦 readyForDocuSign data from backend:', readyForDocuSignData);
      
      // Prepare DocuSign data with complete mapping from all available sources
      const docuSignData = {
        // Personal Information - prioritize readyForDocuSign data
        firstName: readyForDocuSignData?.personalInfo?.firstName || 
                  userDataCollection.contactData?.firstName || 
                  user?.firstName || '',
        
        lastName: readyForDocuSignData?.personalInfo?.lastName || 
                 userDataCollection.contactData?.lastName || 
                 user?.lastName || '',
        
        email: readyForDocuSignData?.personalInfo?.email || 
               userDataCollection.contactData?.email || 
               user?.email || '',
        
        dateOfBirth: readyForDocuSignData?.personalInfo?.dateOfBirth || 
                     userDataCollection.contactData?.dateOfBirth || '',
        
        // Phone Information - use the docusignPhoneNumber first, then fallback to other phones
        phone: readyForDocuSignData?.docusignPhoneNumber || 
               readyForDocuSignData?.phoneInfo?.primaryPhone ||
               readyForDocuSignData?.phoneInfo?.mobilePhone || 
               readyForDocuSignData?.phoneInfo?.workPhone ||
               readyForDocuSignData?.phoneInfo?.homePhone ||
               userDataCollection.contactData?.mobilePhone || 
               userDataCollection.contactData?.homePhone || 
               userDataCollection.contactData?.workPhone || '',
        
        // Address Information from readyForDocuSign
        address: readyForDocuSignData?.homeAddress?.street || 
                 userDataCollection.contactData?.streetAddress || '',
        
        streetAddress: readyForDocuSignData?.homeAddress?.street || 
                       userDataCollection.contactData?.streetAddress || '',
        
        city: readyForDocuSignData?.homeAddress?.city || 
              userDataCollection.contactData?.city || '',
        
        state: readyForDocuSignData?.homeAddress?.state || 
               userDataCollection.contactData?.region || '',
        
        region: readyForDocuSignData?.homeAddress?.state || 
                userDataCollection.contactData?.region || '',
        
        zipCode: readyForDocuSignData?.homeAddress?.postalCode || 
                 userDataCollection.contactData?.postalCode || '',
        
        postalCode: readyForDocuSignData?.homeAddress?.postalCode || 
                    userDataCollection.contactData?.postalCode || '',
        
        country: readyForDocuSignData?.homeAddress?.country || 
                 userDataCollection.contactData?.country || 'United States',
        
        // Membership Details
        paymentFrequency: readyForDocuSignData?.membershipDetails?.paymentFrequency || 
                         userDataCollection.membershipData?.paymentFrequency || 'annually',
        
        annualCost: readyForDocuSignData?.membershipDetails?.membershipCost || 
                    readyForDocuSignData?.paymentBreakdown?.baseCost ||
                    userDataCollection.pricingData?.membershipCost || 
                    userDataCollection.packageData?.annualCost || 540,
        
        membership: readyForDocuSignData?.membershipDetails?.membershipCost || 
                    readyForDocuSignData?.paymentBreakdown?.baseCost ||
                    userDataCollection.pricingData?.membershipCost || 540,
        
        membershipCost: readyForDocuSignData?.membershipDetails?.membershipCost || 
                        readyForDocuSignData?.paymentBreakdown?.baseCost ||
                        userDataCollection.pricingData?.membershipCost || 540,
        
        // Preservation Information
        preservationType: readyForDocuSignData?.membershipDetails?.preservationType || 
                         userDataCollection.packageData?.preservationType || 'Not specified',
        
        preservationEstimate: readyForDocuSignData?.membershipDetails?.preservationEstimate || 
                             userDataCollection.packageData?.preservationEstimate || 0,
        
        // ICE Code Information
        iceCode: readyForDocuSignData?.iceCodeDetails?.code || 
                 userDataCollection.membershipData?.iceCode || '',
        
        iceDiscount: readyForDocuSignData?.iceCodeDetails?.discountAmount || 
                     readyForDocuSignData?.paymentBreakdown?.iceDiscount || 0,
        
        iceCodeValid: readyForDocuSignData?.iceCodeDetails?.valid || 
                      userDataCollection.membershipData?.iceCodeValid || false,
        
        iceCodeInfo: userDataCollection.membershipData?.iceCodeValid && userDataCollection.membershipData?.iceCodeInfo 
          ? userDataCollection.membershipData.iceCodeInfo 
          : readyForDocuSignData?.iceCodeDetails || null,
        
        // Privacy Preferences from readyForDocuSign
        freelyReleaseName: readyForDocuSignData?.preferences?.freelyReleaseName || false,
        maintainConfidentiality: readyForDocuSignData?.preferences?.maintainConfidentiality || false,
        
        // CMS Waiver
        cmsWaiver: readyForDocuSignData?.preferences?.cmsWaiver || false,
        
        // Funding Method
        fundingMethod: readyForDocuSignData?.funding?.fundingChoice || 
                      userDataCollection.fundingData?.fundingMethod || 
                      userDataCollection.fundingData?.method || 'Not specified',
        
        // Other fields that might be needed
        interestedInLifetime: userDataCollection.membershipData?.interestedInLifetime || false,
        
        // Application metadata
        applicationDate: new Date().toLocaleDateString(),
        applicationTime: new Date().toLocaleTimeString()
      };
      
      console.log('📋 Prepared DocuSign data:', docuSignData);
      console.log('🔍 Key fields check:');
      console.log('  - Full Name:', `${docuSignData.firstName} ${docuSignData.lastName}`);
      console.log('  - Email:', docuSignData.email);
      console.log('  - Phone:', docuSignData.phone);
      console.log('  - Address:', `${docuSignData.address}, ${docuSignData.city}, ${docuSignData.state} ${docuSignData.zipCode}`);
      console.log('  - Membership Cost:', docuSignData.membershipCost);
      console.log('  - Privacy - Freely Release Name:', docuSignData.freelyReleaseName);
      console.log('  - Privacy - Maintain Confidentiality:', docuSignData.maintainConfidentiality);
      
      // Validate required fields
      if (!docuSignData.email || !docuSignData.firstName || !docuSignData.lastName) {
        throw new Error('Missing required user information (name or email)');
      }
      
      // Update backend status to in_progress
      try {
        await membershipService.updateDocuSignStatus(
          docType,
          'in_progress'
        );
      } catch (err) {
        console.error('Error updating document status to in_progress:', err);
      }
      
      // Use Firebase SDK to call the function
      const functions = getFunctions();
      const createEmbeddedEnvelope = httpsCallable(functions, 'createEmbeddedEnvelope');
      
      console.log('📞 Calling Firebase function createEmbeddedEnvelope...');
      
      // Create the request payload
      const requestPayload = {
        signerData: docuSignData,
        documentType: docType,
        clientUserId: `${docuSignData.email}_${docType}_${Date.now()}`,
        returnUrl: `${window.location.origin}/signup/membership`
      };
      
      console.log('📤 SENDING TO FIREBASE - Full payload:', JSON.stringify(requestPayload, null, 2));
      
      let result;
      try {
        result = await createEmbeddedEnvelope(requestPayload);
        console.log('📨 Firebase function raw result:', result);
        console.log('📨 Firebase function result.data:', result?.data);
      } catch (firebaseError) {
        console.error('❌ Firebase function call failed:', firebaseError);
        throw firebaseError;
      }
      
      // Check the result structure
      if (result.data && result.data.signingUrl) {
        console.log('✅ Got signing URL:', result.data.signingUrl);
        console.log('✅ Full successful response:', result.data);
        setSigningUrl(result.data.signingUrl);
        setDocuSignStatus('signing');
        setupDocuSignMessageListener();
        
        // Show iframe after a brief delay to ensure message listener is ready
        setTimeout(() => {
          setShowIframe(true);
          setupIframeTimeout();
        }, 500);
        
      } else if (result.data && result.data.success === false) {
        console.error('❌ Backend returned error:', result.data.error);
        throw new Error(result.data.error || 'Failed to create DocuSign envelope');
      } else {
        console.error('❌ Unexpected result structure:', result);
        throw new Error('Unexpected response from DocuSign service');
      }
      
    } catch (err) {
      console.error('❌ DocuSign error:', err);
      console.error('❌ Error type:', err.constructor.name);
      console.error('❌ Error stack:', err.stack);
      
      // Enhanced error handling with retry logic
      retryCountRef.current += 1;
      
      let errorMessage = 'Failed to start signing process';
      let canRetry = retryCountRef.current < MAX_RETRY_ATTEMPTS;
      
      if (err.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication required. Please sign in to continue.';
        canRetry = false;
      } else if (err.code === 'functions/permission-denied') {
        errorMessage = 'Permission denied. Please try signing in again.';
        canRetry = false;
      } else if (err.code === 'functions/unavailable') {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      } else if (err.code === 'functions/timeout') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log(`🔄 Retry attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}, Can retry: ${canRetry}`);
      
      if (canRetry) {
        errorMessage += ` (Attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`;
        
        // Auto-retry after a delay
        setTimeout(() => {
          console.log(`🔄 Auto-retrying DocuSign process (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`);
          startEmbeddedDocuSignProcess(userDataCollection, docType);
        }, 2000 * retryCountRef.current); // Exponential backoff
        
        return;
      }
      
      setDocuSignStatus('error');
      setDocuSignError(errorMessage);
    }
  };

 // Load user data and start DocuSign process on mount
 useEffect(() => {
   const initializeSigningProcess = async () => {
     try {
       setIsLoading(true);
       setError(null);
       setDocuSignStatus('initializing');
       retryCountRef.current = 0;
       
       console.log(`🔄 MembershipDocuSign: Initializing signing process for ${currentDocument}...`);
       
       // Gather all user data from various services
       const userDataCollection = {};
       
       // Get contact information
       try {
         const contactResult = await getContactInfo();
         if (contactResult.success && contactResult.contactInfo) {
           userDataCollection.contactData = contactResult.contactInfo;
         } else if (contactData) {
           userDataCollection.contactData = contactData;
         }
       } catch (err) {
         console.error('❌ Error loading contact info:', err);
         if (contactData) {
           userDataCollection.contactData = contactData;
         }
       }
       
       // Get membership information
       try {
         const membershipResult = await membershipService.getMembershipInfo();
         if (membershipResult.success && membershipResult.data) {
           userDataCollection.membershipData = membershipResult.data.membershipInfo;
         } else if (membershipData) {
           userDataCollection.membershipData = membershipData;
         }
       } catch (err) {
         console.error('❌ Error loading membership info:', err);
         if (membershipData) {
           userDataCollection.membershipData = membershipData;
         }
       }
       
       // Get package information
       try {
         const packageResult = await fundingService.getPackageInfoForFunding();
         if (packageResult.success) {
           userDataCollection.packageData = {
             packageType: packageResult.packageType,
             preservationType: packageResult.preservationType,
             preservationEstimate: packageResult.preservationEstimate,
             annualCost: packageResult.annualCost
           };
         } else if (packageData) {
           userDataCollection.packageData = packageData;
         }
       } catch (err) {
         console.error('❌ Error loading package info:', err);
         if (packageData) {
           userDataCollection.packageData = packageData;
         }
       }
       
       // Get funding information
       try {
         const fundingResult = await fundingService.getUserFundingInfo();
         if (fundingResult.success && fundingResult.data) {
           userDataCollection.fundingData = fundingResult.data;
         }
       } catch (err) {
         console.error('❌ Error loading funding info:', err);
       }
       
       // Get pricing information
       try {
         const pricingResult = await getMembershipCost();
         if (pricingResult?.success) {
           userDataCollection.pricingData = {
             age: pricingResult.age,
             annualDues: pricingResult.annualDues,
             membershipCost: pricingResult.membershipCost || 540
           };
         }
       } catch (err) {
         console.error('❌ Error loading pricing info:', err);
       }
       
       console.log('📋 User data collection complete:', userDataCollection);
       setUserData(userDataCollection);
       
       // Start EMBEDDED DocuSign process for the specified document
       await startEmbeddedDocuSignProcess(userDataCollection, currentDocument);
       
     } catch (err) {
       console.error('❌ Error initializing signing process:', err);
       setError('Failed to initialize signing process. Please refresh the page and try again.');
     } finally {
       setIsLoading(false);
     }
   };
   
   initializeSigningProcess();
   
   // Cleanup on unmount
   return cleanup;
 }, [currentDocument, membershipData, packageData, contactData, cleanup]);

 // Handle retry DocuSign
 const handleRetryDocuSign = async () => {
   if (userData) {
     console.log('🔄 Manual retry triggered');
     setShowIframe(false);
     setIframeLoaded(false);
     setIframeError(false);
     retryCountRef.current = 0;
     cleanup();
     await startEmbeddedDocuSignProcess(userData, currentDocument);
   }
 };

 // Handle refresh page
 const handleRefreshPage = () => {
   window.location.reload();
 };

 // Get status display
 const getStatusDisplay = () => {
   switch (docuSignStatus) {
     case 'initializing':
       return {
         icon: <DotLoader size="lg" color="primary" />,
         title: `Preparing Your ${DOCUMENT_NAMES[currentDocument]}`,
         message: 'Gathering your information and preparing your document...',
         color: 'text-[#775684]'
       };
     
     case 'creating':
       return {
         icon: <NewtonCradleLoader size="lg" color="primary" />,
         title: 'Creating DocuSign Envelope',
         message: `Setting up your ${DOCUMENT_NAMES[currentDocument]} for signing...`,
         color: 'text-[#775684]'
       };
     
     case 'signing':
       return {
         icon: !iframeLoaded ? (
           <DotLoader size="lg" color="primary" />
         ) : (
           <div className="bg-blue-500 rounded-full p-4">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
             </svg>
           </div>
         ),
         title: !iframeLoaded ? 'Loading Signing Interface...' : `Sign Your ${DOCUMENT_NAMES[currentDocument]}`,
         message: !iframeLoaded 
           ? 'Please wait while we load your document...' 
           : 'Please complete your signature in the document below.',
         color: 'text-blue-600'
       };
     
     case 'completed':
       return {
         icon: (
           <div className="bg-green-500 rounded-full p-4">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
             </svg>
           </div>
         ),
         title: `${DOCUMENT_NAMES[currentDocument]} Signed Successfully!`,
         message: `Your ${DOCUMENT_NAMES[currentDocument]} has been completed.`,
         color: 'text-green-600'
       };
     
     case 'error':
       return {
         icon: (
           <div className="bg-red-500 rounded-full p-4">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
         ),
         title: 'Signing Error',
         message: docuSignError || 'There was an error with the signing process.',
         color: 'text-red-600'
       };
     
     default:
       return {
         icon: <DotLoader size="lg" color="primary" />,
         title: 'Loading...',
         message: 'Please wait...',
         color: 'text-gray-600'
       };
   }
 };

 const statusDisplay = getStatusDisplay();

 if (error) {
   return (
     <div className="w-screen h-screen fixed inset-0 bg-white flex items-center justify-center" style={marcellusStyle}>
       <div className="bg-white rounded-xl shadow-lg p-8 text-center">
         <div className="bg-red-500 rounded-full p-4 w-fit mx-auto mb-6">
           <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
         </div>
         
         <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading</h2>
         <p className="text-gray-600 text-lg mb-6">{error}</p>
         
         <div className="flex justify-center space-x-4">
           <button
             onClick={onBack}
             className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
           >
             Go Back
           </button>
           <button
             onClick={handleRefreshPage}
             className="px-6 py-3 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573] transition-all duration-300"
           >
             Refresh Page
           </button>
         </div>
       </div>
     </div>
   );
 }

 // Use useEffect to break out of any parent constraints
 useEffect(() => {
   // Save original body styles
   const originalOverflow = document.body.style.overflow;
   const originalPosition = document.body.style.position;
   
   // Lock body scroll and ensure full viewport
   document.body.style.overflow = 'hidden';
   document.body.style.position = 'fixed';
   
   // Hide any parent containers
   const allParents = document.querySelectorAll('.signup-layout, .signup-container, [class*="layout"], [class*="container"]');
   const hiddenElements = [];
   allParents.forEach(el => {
     if (!el.contains(document.querySelector('.docusign-fullscreen-container'))) {
       if (el.style.display !== 'none') {
         hiddenElements.push({ element: el, originalDisplay: el.style.display });
         el.style.display = 'none';
       }
     }
   });
   
   // Cleanup on unmount
   return () => {
     document.body.style.overflow = originalOverflow;
     document.body.style.position = originalPosition;
     hiddenElements.forEach(({ element, originalDisplay }) => {
       element.style.display = originalDisplay;
     });
   };
 }, []);

 return (
   <div 
     className="docusign-fullscreen-container"
     style={{
       position: 'fixed',
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       width: '100vw',
       height: '100vh',
       backgroundColor: 'white',
       display: 'flex',
       flexDirection: 'column',
       overflow: 'hidden',
       zIndex: 999999,
       ...marcellusStyle
     }}
   >
     {/* Top Header Bar - Mobile */}
     <div className="md:hidden" style={{ flexShrink: 0 }}>
       <div className="py-8 px-4 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
         {/* Additional diagonal gradient overlay */}
         <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
         
         <div className="flex items-center justify-between pt-3 relative z-10">
           <div className="flex items-center">
             <img src={whiteALogoNoText} alt="Alcor Logo" className="h-12" />
           </div>
           
           <div className="flex items-center">
             <h1 className="flex items-center">
               <span className="text-xl font-bold text-white">{DOCUMENT_NAMES[currentDocument]}</span>
               <img src={alcorStar} alt="" className="h-5 ml-0.5" />
             </h1>
           </div>
         </div>
       </div>
     </div>

     {/* Top Header Bar - Desktop */}
     <div className="hidden md:block py-3 px-6 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative" style={{ flexShrink: 0 }}>
       {/* Additional diagonal gradient overlay */}
       <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
       
       <div className="w-full flex justify-between items-center relative z-10">
         <img src={whiteALogoNoText} alt="Alcor Logo" className="h-12" />
         <h1 className="flex items-center text-lg sm:text-xl font-semibold text-white">
           {DOCUMENT_NAMES[currentDocument]}
           <img src={alcorStar} alt="" className="h-5 ml-0.5" />
         </h1>
       </div>
     </div>
     
     {/* Main Content Area */}
     <div style={{ flex: '1 1 auto', position: 'relative', overflow: 'hidden' }}>
       {/* Status Section - Show when not signing or when iframe hasn't loaded */}
       {(!showIframe || !iframeLoaded) && (
         <div style={{ 
           position: 'absolute', 
           inset: 0, 
           display: 'flex', 
           flexDirection: 'column', 
           alignItems: 'center', 
           justifyContent: 'center',
           padding: '1rem'
         }}>
           {/* Document Type Indicator */}
           <div className="mb-6 text-center">
             <div className="inline-flex items-center px-4 py-2 bg-[#775684]/10 rounded-full">
               <span className="text-[#775684] font-medium">
                 {currentDocument === 'membership_agreement' ? 'Document 1 of 2' : 'Document 2 of 2'}
               </span>
             </div>
           </div>
           
           {/* Simplified loading display */}
           {(docuSignStatus === 'initializing' || docuSignStatus === 'creating' || 
             (docuSignStatus === 'signing' && !iframeLoaded)) && (
             <div className="text-center">
               <DotLoader 
                 size="lg" 
                 color="primary" 
                 className="mb-8"
               />
               <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                 {docuSignStatus === 'initializing' && `Preparing Your ${DOCUMENT_NAMES[currentDocument]}`}
                 {docuSignStatus === 'creating' && 'Creating DocuSign Envelope'}
                 {docuSignStatus === 'signing' && !iframeLoaded && 'Loading Document'}
               </h2>
               <p className="text-gray-600 max-w-md mx-auto">
                 {docuSignStatus === 'initializing' && 'We\'re gathering your information...'}
                 {docuSignStatus === 'creating' && 'Setting up your signing session...'}
                 {docuSignStatus === 'signing' && !iframeLoaded && 'Almost there...'}
               </p>
             </div>
           )}
           
           {/* Success state */}
           {docuSignStatus === 'completed' && (
             <div className="text-center">
               <div className="bg-green-500 rounded-full p-4 w-fit mx-auto mb-6">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                 </svg>
               </div>
               <h2 className="text-3xl font-bold text-green-600 mb-4">
                 {DOCUMENT_NAMES[currentDocument]} Signed!
               </h2>
               <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                 <div className="flex items-center justify-center text-green-800">
                   <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                   </svg>
                   <span className="font-semibold text-xl">
                     Document completed successfully
                   </span>
                 </div>
               </div>
             </div>
           )}
           
           {/* Error state */}
           {docuSignStatus === 'error' && (
             <div className="text-center">
               <div className="bg-red-500 rounded-full p-4 w-fit mx-auto mb-6">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <h2 className="text-2xl font-bold text-red-600 mb-4">Signing Error</h2>
               <p className="text-gray-600 mb-8">{docuSignError || 'There was an error with the signing process.'}</p>
               
               <div className="flex justify-center space-x-4">
                 <button
                   onClick={onBack}
                   className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
                 >
                   Go Back
                 </button>
                 <button
                   onClick={handleRetryDocuSign}
                   className="px-6 py-3 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573] transition-all duration-300"
                 >
                   Try Again
                 </button>
               </div>
             </div>
           )}
         </div>
       )}
       
       {/* DocuSign Embedded Iframe - FULL SCREEN */}
       {showIframe && signingUrl && (
         <div style={{ 
           position: 'absolute', 
           top: 0, 
           left: 0, 
           right: 0, 
           bottom: 0,
           width: '100%',
           height: '100%',
           zIndex: 999999
         }}>
           {/* Loading overlay - shows until iframe loads */}
           {!iframeLoaded && (
             <div style={{
               position: 'absolute',
               inset: 0,
               backgroundColor: 'white',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 10
             }}>
               <DotLoader 
                 size="lg" 
                 color="primary" 
                 message="Loading signing interface..."
                 className="mb-2"
               />
               <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
             </div>
           )}
           
           {/* Error overlay - shows if iframe fails to load */}
           {iframeError && (
             <div style={{
               position: 'absolute',
               inset: 0,
               backgroundColor: 'white',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 10
             }}>
               <div className="bg-red-500 rounded-full p-4 mb-4">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <p className="text-red-600 text-lg font-semibold mb-2">Failed to Load Signing Interface</p>
               <p className="text-gray-600 mb-4">Please check your internet connection and try again</p>
               <button
                 onClick={handleRetryDocuSign}
                 className="px-6 py-3 bg-[#775684] text-white rounded-full font-medium hover:bg-[#664573] transition-all duration-300"
               >
                 Retry Loading
               </button>
             </div>
           )}
           
           {/* Actual DocuSign iframe - MAXIMUM SIZE */}
           <iframe
             ref={iframeRef}
             src={signingUrl}
             title={`DocuSign - ${DOCUMENT_NAMES[currentDocument]}`}
             allow="camera; microphone; geolocation"
             sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
             frameBorder="0"
             style={{ 
               position: 'absolute',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               border: 'none',
               display: 'block',
               opacity: iframeLoaded ? 1 : 0,
               transition: 'opacity 0.3s ease-in-out',
               minHeight: '100vh',
               minWidth: '100vw'
             }}
             onLoad={handleIframeLoad}
             onError={handleIframeError}
           />
         </div>
       )}
     </div>
   </div>
 );
}