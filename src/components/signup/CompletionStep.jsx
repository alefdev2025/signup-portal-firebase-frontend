// File: pages/signup/CompletionStep.jsx
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { getUserProgressAPI, updateSignupProgressAPI } from "../../services/auth";
import SimpleBanner from "../../components/SimpleBanner";
import alcorStar from "../../assets/images/alcor-yellow-star.png";

// Global debug function that persists through navigation
const LOG_TO_TERMINAL = (message) => {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/log?t=${Date.now()}`, false);
    xhr.send(`[COMPLETION STEP] ${message}`);
    console.log(`[COMPLETION STEP] ${message}`);
  } catch (e) {
    // Ignore errors
  }
};

const CompletionStep = () => {
  const { currentUser, refreshUserProgress } = useUser();
  const { navigateToStep } = useSignupFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  // Add initialization tracker to prevent double initialization
  const initializedRef = useRef(false);
  
  // Apply Marcellus font
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
    fontSize: "1.05rem"
  };

  // Check authentication and finalize signup
  useEffect(() => {
    // Prevent double initialization which causes flickering
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const init = async () => {
      if (!currentUser) {
        LOG_TO_TERMINAL("No user authenticated, redirecting to account creation");
        // Navigate back to account creation step
        navigateToStep(0, { force: true, reason: 'not_authenticated' });
        return;
      }
      
      try {
        LOG_TO_TERMINAL("Starting completion initialization");
        
        // Check user's progress via API
        const progressResult = await getUserProgressAPI();
        
        if (progressResult.success) {
          LOG_TO_TERMINAL(`User progress: step ${progressResult.step}`);
          
          // Completion is step 9, so check if user hasn't completed step 8 (payment)
          if (progressResult.step < 9) {
            LOG_TO_TERMINAL("User has not completed previous step, redirecting to payment");
            navigateToStep(8, { force: true, reason: 'incomplete_previous_step' });
            return;
          }
          
          // If user is already at completion step, that's perfect
          if (progressResult.step >= 9) {
            LOG_TO_TERMINAL("User has reached completion step");
          }
        } else {
          console.error("Error getting user progress:", progressResult.error);
          setError("Could not verify your progress. Please try again.");
          return;
        }
        
        // Mark signup as fully completed
        LOG_TO_TERMINAL("Marking signup as completed...");
        const completeResult = await updateSignupProgressAPI("completed", 10);
        
        if (!completeResult.success) {
          console.error("Failed to mark signup as completed:", completeResult.error);
          // Don't fail the whole process if this doesn't work
        } else {
          LOG_TO_TERMINAL("Signup marked as completed successfully");
        }
        
        // Refresh user progress from context
        if (typeof refreshUserProgress === 'function') {
          await refreshUserProgress();
        }
        
        LOG_TO_TERMINAL("Completion initialization complete");
      } catch (error) {
        console.error("Error in completion step:", error);
        setError("An error occurred while finalizing your signup. Please contact support if this issue persists.");
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [currentUser, navigateToStep, refreshUserProgress]);
  
  // Handle redirect to member portal
  const handleGoToMemberPortal = () => {
    LOG_TO_TERMINAL("Redirecting to member portal");
    setIsRedirecting(true);
    
    // Redirect to member portal after a brief delay
    setTimeout(() => {
      window.location.href = '/member-portal';
    }, 1000);
  };
  
  // Handle starting over (for testing/edge cases)
  const handleStartOver = () => {
    LOG_TO_TERMINAL("Starting signup process over");
    navigateToStep(0, { force: true, reason: 'user_start_over' });
  };
  
  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
        <p className="ml-4 text-xl text-gray-700">Finalizing your membership...</p>
      </div>
    );
  }
  
  // Show error state if there was a problem
  if (error) {
    return (
      <div className="flex justify-center pt-8 bg-gray-100 min-h-screen">
        <div className="text-center py-3 px-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#775684] text-white py-1.5 px-5 rounded-full hover:bg-[#664573] transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  LOG_TO_TERMINAL("Rendering completion page");
  
  return (
    <div style={marcellusStyle}>
      {/* Simple Banner */}
      <SimpleBanner title="Welcome to Alcor!" />
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto mb-8 w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Welcome Message */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                Congratulations!
                <img src={alcorStar} alt="Alcor Star" className="w-10 h-10 ml-3" />
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Your membership has been successfully activated.
              </p>
            </div>
            
            {/* What's Next Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">What happens next?</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You'll receive a confirmation email with your membership details
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your membership card will be mailed to your address
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Our team will contact you about next steps for your cryopreservation arrangements
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  You now have access to the member portal with exclusive resources
                </li>
              </ul>
            </div>
            
            {/* Support Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Need help or have questions?</h3>
              <div className="space-y-2 text-gray-700">
                <p className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email: <a href="mailto:support@alcor.org" className="text-[#775684] hover:underline ml-1">support@alcor.org</a>
                </p>
                <p className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone: <span className="ml-1">(480) 905-1906</span>
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={handleGoToMemberPortal}
                disabled={isRedirecting}
                className={`py-4 px-8 rounded-full font-semibold text-lg flex items-center justify-center transition-all duration-300 ${
                  isRedirecting 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-[#775684] text-white hover:bg-[#664573] shadow-md hover:shadow-lg transform hover:scale-[1.03]"
                }`}
                style={marcellusStyle}
              >
                {isRedirecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Redirecting...
                  </>
                ) : (
                  <>
                    Go to Member Portal
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
              
              {/* Debug/Development Button */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={handleStartOver}
                  className="py-4 px-8 border border-gray-300 rounded-full text-gray-700 font-medium text-lg hover:bg-gray-50 transition-all duration-300"
                  style={marcellusStyle}
                >
                  Start Over (Dev)
                </button>
              )}
            </div>
            
            {/* Thank You Message */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-lg">
                Thank you for joining the Alcor Life Extension Foundation. We're honored to help you take this important step toward your future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionStep;