// File: pages/signup/MembershipDocuSign.jsx - OPTIMIZED EMBEDDED SIGNING
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../../contexts/UserContext";
import SimpleBanner from "../../components/SimpleBanner"; // Import the simple banner
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import { getFunctions, httpsCallable } from 'firebase/functions';

// Import services
import membershipService from "../../services/membership";
import fundingService from "../../services/funding";
import { getContactInfo } from "../../services/contact";
import { getMembershipCost } from "../../services/pricing";

export default function MembershipDocuSign({ 
  membershipData,
  packageData,
  contactData,
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
    
    const messageListener = (event) => {
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
            console.log('✅ DocuSign signing completed successfully');
            setDocuSignStatus('completed');
            setShowIframe(false);
            setIframeLoaded(false);
            
            // Clear any timeouts
            if (iframeTimeoutRef.current) {
              clearTimeout(iframeTimeoutRef.current);
              iframeTimeoutRef.current = null;
            }
            
            // Call completion handler after a brief delay
            setTimeout(() => {
              if (onComplete) {
                onComplete();
              }
            }, 1500);
            break;
            
          case 'cancel':
          case 'signing-cancel':
          case 'user_cancel':
            console.log('❌ DocuSign signing cancelled by user');
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
          console.log('✅ DocuSign completion detected from string message');
          setDocuSignStatus('completed');
          setShowIframe(false);
          setTimeout(() => onComplete?.(), 1500);
        }
      }
    };
    
    messageListenerRef.current = messageListener;
    window.addEventListener('message', messageListener);
    
    console.log('📡 DocuSign message listener set up');
  }, [onComplete, cleanup]);

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

  // Enhanced DocuSign process with better error handling
  const startEmbeddedDocuSignProcess = async (userDataCollection) => {
    try {
      setDocuSignStatus('creating');
      setDocuSignError(null);
      setIframeError(false);
      setIframeLoaded(false);
      
      console.log('🚀 Starting DocuSign embedded process...');
      
      // Prepare DocuSign data
      const docuSignData = {
        firstName: userDataCollection.contactData?.firstName || user?.firstName || '',
        lastName: userDataCollection.contactData?.lastName || user?.lastName || '',
        email: userDataCollection.contactData?.email || user?.email || '',
        phone: userDataCollection.contactData?.mobilePhone || 
               userDataCollection.contactData?.homePhone || 
               userDataCollection.contactData?.workPhone || '',
        dateOfBirth: userDataCollection.contactData?.dateOfBirth || '',
        address: userDataCollection.contactData?.streetAddress || '',
        city: userDataCollection.contactData?.city || '',
        state: userDataCollection.contactData?.region || '',
        zipCode: userDataCollection.contactData?.postalCode || '',
        country: userDataCollection.contactData?.country || '',
        paymentFrequency: userDataCollection.membershipData?.paymentFrequency || 'annually',
        iceCode: userDataCollection.membershipData?.iceCode || '',
        iceDiscount: userDataCollection.membershipData?.iceCodeValid && userDataCollection.membershipData?.iceCodeInfo 
          ? userDataCollection.membershipData.iceCodeInfo.discountAmount || 0 
          : 0,
        interestedInLifetime: userDataCollection.membershipData?.interestedInLifetime || false,
        preservationType: userDataCollection.packageData?.preservationType || 'Not specified',
        preservationEstimate: userDataCollection.packageData?.preservationEstimate || 0,
        fundingMethod: userDataCollection.fundingData?.fundingMethod || 
                      userDataCollection.fundingData?.method || 'Not specified',
        annualCost: userDataCollection.pricingData?.membershipCost || 
                   userDataCollection.packageData?.annualCost || 540,
        applicationDate: new Date().toLocaleDateString(),
        applicationTime: new Date().toLocaleTimeString()
      };
      
      console.log('📋 Prepared DocuSign data:', docuSignData);
      
      // Validate required fields
      if (!docuSignData.email || !docuSignData.firstName || !docuSignData.lastName) {
        throw new Error('Missing required user information (name or email)');
      }
      
      // Use Firebase SDK to call the function
      const functions = getFunctions();
      const createEmbeddedEnvelope = httpsCallable(functions, 'createEmbeddedEnvelope');
      
      console.log('📞 Calling Firebase function...');
      
      const result = await createEmbeddedEnvelope({
        signerData: docuSignData,
        templateId: "04610984-8920-4094-ac13-5c2d0914108c",
        clientUserId: `${docuSignData.email}_${Date.now()}`,
        returnUrl: `${window.location.origin}/signup/membership`
      });
      
      console.log('📨 Firebase function result:', result);
      
      // Check the result structure
      if (result.data && result.data.signingUrl) {
        console.log('✅ Got signing URL:', result.data.signingUrl);
        setSigningUrl(result.data.signingUrl);
        setDocuSignStatus('signing');
        setupDocuSignMessageListener();
        
        // Show iframe after a brief delay to ensure message listener is ready
        setTimeout(() => {
          setShowIframe(true);
          setupIframeTimeout();
        }, 500);
        
      } else if (result.data && result.data.success === false) {
        throw new Error(result.data.error || 'Failed to create DocuSign envelope');
      } else {
        console.error('❌ Unexpected result structure:', result);
        throw new Error('Unexpected response from DocuSign service');
      }
      
    } catch (err) {
      console.error('❌ DocuSign error:', err);
      
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
      
      if (canRetry) {
        errorMessage += ` (Attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`;
        
        // Auto-retry after a delay
        setTimeout(() => {
          console.log(`🔄 Auto-retrying DocuSign process (${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`);
          startEmbeddedDocuSignProcess(userDataCollection);
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
        
        console.log('🔄 MembershipDocuSign: Initializing signing process...');
        
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
        
        // Start EMBEDDED DocuSign process
        await startEmbeddedDocuSignProcess(userDataCollection);
        
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
  }, [membershipData, packageData, contactData, cleanup]);

  // Handle retry DocuSign
  const handleRetryDocuSign = async () => {
    if (userData) {
      console.log('🔄 Manual retry triggered');
      setShowIframe(false);
      setIframeLoaded(false);
      setIframeError(false);
      retryCountRef.current = 0;
      cleanup();
      await startEmbeddedDocuSignProcess(userData);
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
          icon: (
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684]"></div>
          ),
          title: 'Preparing Your Agreement',
          message: 'Gathering your information and preparing your membership agreement...',
          color: 'text-[#775684]'
        };
      
      case 'creating':
        return {
          icon: (
            <div className="bg-gradient-to-r from-[#775684] via-[#5a4a6b] to-[#3d3852] rounded-full p-4">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          ),
          title: 'Creating DocuSign Envelope',
          message: 'Setting up your embedded signing experience...',
          color: 'text-[#775684]'
        };
      
      case 'signing':
        return {
          icon: (
            <div className="bg-blue-500 rounded-full p-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          ),
          title: !iframeLoaded ? 'Loading Signing Interface...' : 'Ready to Sign!',
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
          title: 'Agreement Signed Successfully!',
          message: 'Congratulations! Your membership agreement has been completed.',
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
          icon: <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684]"></div>,
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

  return (
    <div className="w-screen h-screen fixed inset-0 bg-white" style={marcellusStyle}>
      <div className="w-full h-full flex flex-col">
        {/* Simple Banner - Always show */}
        <SimpleBanner title="Sign Your Membership Agreement" />
        
        {/* Status Section - Show when not signing or when iframe hasn't loaded */}
        {(!showIframe || !iframeLoaded) && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
            {/* Status Icon */}
            <div className="flex justify-center mb-8">
              {statusDisplay.icon}
            </div>
            
            {/* Status Title */}
            <h2 className={`text-3xl font-bold mb-6 ${statusDisplay.color}`}>
              {statusDisplay.title}
            </h2>
            
            {/* Status Message */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              {statusDisplay.message}
            </p>
            
            {/* Debug Information (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-sm">
                <h4 className="font-semibold mb-2">Debug Info:</h4>
                <p>Status: {docuSignStatus}</p>
                <p>Iframe Loaded: {iframeLoaded ? 'Yes' : 'No'}</p>
                <p>Iframe Error: {iframeError ? 'Yes' : 'No'}</p>
                <p>Show Iframe: {showIframe ? 'Yes' : 'No'}</p>
                <p>Retry Count: {retryCountRef.current}</p>
                {signingUrl && <p>Signing URL: {signingUrl.substring(0, 50)}...</p>}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-6">
              {docuSignStatus === 'error' && (
                <>
                  <button
                    onClick={onBack}
                    className="px-8 py-4 border border-gray-300 rounded-full text-gray-700 font-medium text-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleRetryDocuSign}
                    className="px-8 py-4 bg-[#775684] text-white rounded-full font-medium text-lg hover:bg-[#664573] transition-all duration-300"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleRefreshPage}
                    className="px-8 py-4 border border-[#775684] text-[#775684] rounded-full font-medium text-lg hover:bg-[#775684] hover:text-white transition-all duration-300"
                  >
                    Refresh Page
                  </button>
                </>
              )}
              
              {docuSignStatus === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center text-green-800">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-xl">
                      Welcome to Alcor! Your membership is now active.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* DocuSign Embedded Iframe - FULL SCREEN */}
        {showIframe && signingUrl && (
          <div className="flex-1 relative w-full">
            {/* Loading overlay - shows until iframe loads */}
            {!iframeLoaded && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684] mb-4"></div>
                <p className="text-gray-600 text-lg">Loading signing interface...</p>
                <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
              </div>
            )}
            
            {/* Error overlay - shows if iframe fails to load */}
            {iframeError && (
              <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
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
              className="w-full h-full border-0 block"
              title="DocuSign Embedded Signing"
              allow="camera; microphone; geolocation"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              style={{ 
                width: '100%',
                height: '100%',
                minHeight: '100%',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
                border: 'none',
                outline: 'none'
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