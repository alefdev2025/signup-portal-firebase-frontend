// File: components/signup/PaymentStep.jsx - Navigate to standalone payment page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignupFlow } from '../../contexts/SignupFlowContext';
import { useUser } from '../../contexts/UserContext';

// Import services to verify user has required data
import { getContactInfo } from '../../services/contact';
import membershipService from '../../services/membership';

export default function PaymentStep() {
  console.log("💳 PaymentStep mounting - will navigate to standalone payment page");
  
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { goToPrevStep } = useSignupFlow();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkDataAndNavigate = async () => {
      console.log("🔍 Checking if user has required data for payment...");
      
      if (!currentUser) {
        console.log("❌ No authenticated user");
        setError('Please complete authentication first');
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has contact info (required for payment)
        const contactResult = await getContactInfo();
        console.log("📞 Contact check result:", contactResult);
        
        if (!contactResult.success || !contactResult.contactInfo?.email) {
          throw new Error('Please complete your contact information first');
        }

        // Check if user has membership selection (optional but helpful)
        const membershipResult = await membershipService.getMembershipInfo();
        console.log("🎫 Membership check result:", membershipResult);
        
        console.log("✅ User data verified, navigating to payment page...");
        
        // Navigate to the standalone payment page
        navigate('/payment', { replace: true });
        
      } catch (err) {
        console.error("❌ Error checking user data:", err);
        setError(err.message || 'Unable to proceed to payment. Please complete previous steps.');
        setIsLoading(false);
      }
    };

    // Small delay to prevent flash, then check and navigate
    const timer = setTimeout(checkDataAndNavigate, 500);
    
    return () => clearTimeout(timer);
  }, [currentUser, navigate]);

  const handleBack = () => {
    console.log("👈 Going back to previous step");
    goToPrevStep();
  };

  const handleRetry = () => {
    console.log("🔄 Retrying navigation to payment page");
    setIsLoading(true);
    setError(null);
    
    // Retry after a brief delay
    setTimeout(() => {
      navigate('/payment', { replace: true });
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#673171] mb-6 mx-auto"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Preparing Payment
              </h2>
              <p className="text-gray-600 mb-6">
                Verifying your information and preparing the secure payment form...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Unable to Proceed to Payment
                </h3>
                <p className="text-red-700 mb-4">
                  {error}
                </p>
                <div className="space-x-3">
                  <button 
                    onClick={handleRetry}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={handleBack}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">
                  <strong>Need help?</strong> Make sure you've completed:
                </p>
                <ul className="text-left inline-block">
                  <li>✅ Account creation and email verification</li>
                  <li>✅ Contact information</li>
                  <li>✅ Package selection</li>
                  <li>✅ Membership preferences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't render since we navigate away, but just in case
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-8 sm:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Redirecting to Payment...
            </h2>
            <p className="text-gray-600">
              If you're not redirected automatically, 
              <button 
                onClick={() => navigate('/payment')}
                className="text-[#673171] hover:underline ml-1"
              >
                click here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}