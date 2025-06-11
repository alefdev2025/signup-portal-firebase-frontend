// File: pages/signup/DocuSignPage.jsx - FULL SCREEN EMBEDDED SIGNING WITH TEST MODE
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useUser } from "../../contexts/UserContext";
import SimpleBanner from "../../components/SimpleBanner";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import whiteALogoNoText from "../../assets/images/alcor-white-logo-no-text.png";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { PageLoader } from "../../components/DotLoader";

// Global test mode configuration
const TEST_MODE = true; // Set to true to bypass DocuSign and show test button instead

export default function DocuSignPage({ 
  userData,
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
  const [docuSignStatus, setDocuSignStatus] = useState('initializing');
  const [docuSignError, setDocuSignError] = useState(null);
  const [signingUrl, setSigningUrl] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [portalContainer, setPortalContainer] = useState(null);
  
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
  
  // Use system font to match other pages
  const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Create portal container when we need to show the iframe
  useEffect(() => {
    if (showIframe && signingUrl && !portalContainer) {
      // Create a portal container at the body level
      const container = document.createElement('div');
      container.id = 'docusign-portal-container';
      container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        background-color: white !important;
      `;
      document.body.appendChild(container);
      setPortalContainer(container);

      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      console.log('Portal container created for DocuSign iframe');
    }

    // Cleanup on unmount or when iframe is hidden
    return () => {
      if (portalContainer && portalContainer.parentNode) {
        portalContainer.parentNode.removeChild(portalContainer);
        setPortalContainer(null);
        
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }
    };
  }, [showIframe, signingUrl, portalContainer]);

  // TEST MODE: Handle test completion
  const handleTestComplete = async () => {
    console.log('🧪 TEST MODE: Simulating DocuSign completion');
    setDocuSignStatus('completed');
    
    // Simulate a brief delay like real DocuSign
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);
  };

  // Cleanup function
// In your cleanup function:
const cleanup = useCallback(() => {
  if (messageListenerRef.current) {
    window.removeEventListener('message', messageListenerRef.current);
    messageListenerRef.current = null;
  }
  if (iframeTimeoutRef.current) {
    clearTimeout(iframeTimeoutRef.current);
    iframeTimeoutRef.current = null;
  }
  // ADD THIS:
  if (window.docusignCheckInterval) {
    clearInterval(window.docusignCheckInterval);
    window.docusignCheckInterval = null;
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

  const handleIframeLoad = useCallback(() => {
    console.log('🔄 Iframe load event triggered');
    setIframeLoaded(true);
    setIframeError(false);
    
    // Clear timeout
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = null;
    }
    
    // Monitor iframe for navigation attempts
    if (iframeRef.current) {
      // Check the iframe URL periodically
      // In handleIframeLoad, update this part:
      const checkInterval = setInterval(() => {
        try {
          const iframeUrl = iframeRef.current?.contentWindow?.location?.href;
          // Only trigger completion if we see specific completion indicators
          if (iframeUrl && (
            iframeUrl.includes('event/completed') || 
            iframeUrl.includes('signing/completed') ||
            iframeUrl.includes('logout/session/end')
          )) {
            console.log('DocuSign completion detected via URL check');
            clearInterval(checkInterval);
            
            // Manually trigger completion
            setDocuSignStatus('completed');
            setShowIframe(false);
            if (onComplete) {
              onComplete();
            }
          }
        } catch (e) {
          // Cross-origin error is expected and normal
        }
      }, 1000);
      
      // Store interval ref for cleanup
      window.docusignCheckInterval = checkInterval;
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
   }, [onComplete]);

  // Handle iframe load events
  /*const handleIframeLoad = useCallback(() => {
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
  }, []);*/

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
      
      // Prepare DocuSign data from collected user data
      const docuSignData = {
        firstName: userDataCollection.contactData?.firstName || userDataCollection.user?.firstName || '',
        lastName: userDataCollection.contactData?.lastName || userDataCollection.user?.lastName || '',
        email: userDataCollection.contactData?.email || userDataCollection.user?.email || '',
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
      
      /*const result = await createEmbeddedEnvelope({
        signerData: docuSignData,
        templateId: "04610984-8920-4094-ac13-5c2d0914108c",
        clientUserId: `${docuSignData.email}_${Date.now()}`,
        returnUrl: `${window.location.origin}/signup`
      });*/

      const result = await createEmbeddedEnvelope({
        signerData: docuSignData,
        templateId: "04610984-8920-4094-ac13-5c2d0914108c",
        clientUserId: `${docuSignData.email}_${Date.now()}`
        // Don't pass returnUrl - let the backend handle it
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
        
        console.log('🔄 DocuSignPage: Initializing signing process...');
        
        if (!userData) {
          throw new Error('No user data provided');
        }
        
        console.log('📋 User data collection complete:', userData);
        
        // TEST MODE: Skip DocuSign and show test interface
        if (TEST_MODE) {
          console.log('🧪 TEST MODE ENABLED - Skipping real DocuSign process');
          setDocuSignStatus('test_ready');
          setIsLoading(false);
          return;
        }
        
        // Start EMBEDDED DocuSign process
        await startEmbeddedDocuSignProcess(userData);
        
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
  }, [userData, cleanup]);

  // Handle retry DocuSign
  const handleRetryDocuSign = async () => {
    if (userData) {
      console.log('🔄 Manual retry triggered');
      setShowIframe(false);
      setIframeLoaded(false);
      setIframeError(false);
      retryCountRef.current = 0;
      cleanup();
      
      if (TEST_MODE) {
        setDocuSignStatus('test_ready');
      } else {
        await startEmbeddedDocuSignProcess(userData);
      }
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
          message: TEST_MODE 
            ? 'Test mode - ready to sign'
            : 'Gathering your information and preparing your membership agreement...',
          color: 'text-[#323053]'
        };
      
      case 'test_ready':
        return {
          icon: null,
          title: '',
          message: '',
          color: ''
        };
      
      case 'creating':
        return {
          icon: (
            <div className="p-4 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]"></div>
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          ),
          title: 'Creating DocuSign Envelope',
          message: 'Setting up your embedded signing experience...',
          color: 'text-[#323053]'
        };
      
      case 'signing':
        return {
          icon: (
            <div className="p-4 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]"></div>
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          ),
          title: !iframeLoaded ? 'Loading Signing Interface...' : 'Ready to Sign!',
          message: !iframeLoaded 
            ? 'Please wait while we load your document...' 
            : 'Please complete your signature in the document below.',
          color: 'text-[#323053]'
        };
      
      case 'completed':
        return {
          icon: (
            <div className="bg-green-500 rounded-lg p-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          title: 'Agreement Signed!',
          message: 'Your membership agreement has been completed.',
          color: 'text-green-600'
        };
      
      case 'error':
        return {
          icon: (
            <div className="bg-red-500 rounded-lg p-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div className="flex items-center justify-center h-full">
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

  // Regular content (non-iframe states)
  const regularContent = (
    <div className="w-full h-full flex flex-col">
      {/* Status Section - Show when not signing or when iframe hasn't loaded */}
      {(!showIframe || !iframeLoaded) && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          {/* Show DotLoader for all loading states */}
          {(docuSignStatus === 'initializing' || docuSignStatus === 'creating' || 
            (docuSignStatus === 'signing' && !iframeLoaded)) && (
            <PageLoader 
              size="lg" 
              color="primary" 
              message={
                docuSignStatus === 'initializing' ? 'Preparing your agreement...' :
                docuSignStatus === 'creating' ? 'Creating DocuSign envelope...' :
                'Loading signing interface...'
              }
            />
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-6">
            {/* TEST MODE: Show test completion button */}
            {TEST_MODE && docuSignStatus === 'test_ready' && (
              <div className="w-full max-w-4xl mx-auto">
                {/* Test mode information card - matching MembershipSummary card style */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-6" style={{ fontFamily: SYSTEM_FONT }}>
                  <div className="mb-6 flex items-start">
                    <div className="p-3 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#885c77] via-[#775684] via-[#5a4a6b] via-[#3d3852] to-[#1a1f3a]" 
                           style={{
                             backgroundSize: '400% 100%',
                             backgroundPosition: '50% 50%'
                           }}></div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4 pt-2">
                      <h2 className="text-xl font-normal text-[#323053]" style={{ fontSize: '20px' }}>Development Mode</h2>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed mb-4" style={{ fontSize: '16px' }}>
                    You're in test mode. The actual DocuSign process is bypassed to speed up development. 
                    In production, users will see the real DocuSign embedded signing interface here.
                  </p>
                  
                  <div className="mt-4 flex items-center space-x-6 text-gray-500" style={{ fontSize: '14px' }}>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      No API calls
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Instant completion
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Same flow as production
                    </div>
                  </div>
                </div>

                {/* Mock DocuSign document preview - matching package card style */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
                  <div className="bg-white p-7 px-10 pt-10 pb-8 border-b border-gray-300">
                    <div className="flex items-center">
                      <div className="p-3.5 rounded-lg mr-3.5" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '20px' }} className="font-normal text-gray-900">Membership Agreement</h3>
                    </div>
                    
                    <p style={{ fontSize: '16px' }} className="text-gray-600 mt-5 mb-7 font-light">
                      This is a preview of the DocuSign signing interface. In production, this will display the actual membership agreement document.
                    </p>
                  </div>
                  
                  <div className="p-8">
                    {/* Fake document lines */}
                    <div className="space-y-3 mb-8">
                      <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                      <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                    </div>
                    
                    {/* Fake signature area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span className="text-gray-500 font-light" style={{ fontSize: '16px' }}>Signature area - Click "Complete Test Signing" below</span>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Test Document ID: DEMO-{Date.now()}</span>
                        <span>DocuSign Demo Environment</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons - matching MembershipSummary button style */}
                <div className="flex justify-between">
                  <button
                    onClick={onBack}
                    className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.03]"
                    style={{ fontSize: '16px', fontFamily: SYSTEM_FONT }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                  </button>
                  
                  <button
                    onClick={handleTestComplete}
                    className="py-5 px-8 bg-[#775684] text-white rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.03] hover:bg-[#664573]"
                    style={{ fontFamily: SYSTEM_FONT }}
                  >
                    Complete Test Signing
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
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
                    Test Signing Complete
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Iframe content to render in portal
  const iframeContent = showIframe && signingUrl && portalContainer && (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'white',
      zIndex: 999999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Alcor Header Banner */}
      <div className="bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative" style={{ flexShrink: 0 }}>
        {/* Additional diagonal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
        
        <div className="relative z-10 px-6 py-3">
          <div className="flex justify-between items-center">
            <img 
              src={whiteALogoNoText} 
              alt="Alcor Logo" 
              className="h-12"
              onError={(e) => {
                e.target.style.display = 'none';
                console.error('Failed to load Alcor logo');
              }}
            />
            <h1 className="flex items-center text-lg sm:text-xl font-semibold text-white">
              Membership Agreement
              <img 
                src={alcorStar} 
                alt="" 
                className="h-5 ml-0.5"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </h1>
          </div>
        </div>
      </div>

      {/* Iframe container */}
      <div style={{ flex: '1 1 auto', position: 'relative', overflow: 'hidden' }}>
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
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684] mb-4"></div>
            <p className="text-gray-600 text-lg">Loading signing interface...</p>
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
        
        {/* Actual DocuSign iframe */}
        <iframe
          ref={iframeRef}
          src={signingUrl}
          title="DocuSign Embedded Signing"
          allow="camera; microphone; geolocation"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            opacity: iframeLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Regular content always renders */}
      {regularContent}
      
      {/* Portal renders iframe outside of normal DOM hierarchy */}
      {iframeContent && createPortal(iframeContent, portalContainer)}
    </>
  );
}