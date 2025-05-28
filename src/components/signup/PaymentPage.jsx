// File: pages/PaymentPage.jsx - Fixed Standalone Version
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// Import services
import { getContactInfo } from "../services/contact";
import membershipService from "../services/membership";
import { getMembershipCost } from "../services/pricing";

// Import the payment overlay component you already created
import PaymentPageComponent from "./signup/PaymentPage";

export default function StandalonePaymentPage() {
  console.log("🔵 StandalonePaymentPage mounting");
  
  const { currentUser, isLoading: userLoading } = useUser();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      console.log("🔄 Loading user data for standalone payment");
      console.log("User loading:", userLoading);
      console.log("Current user:", currentUser?.uid);
      
      if (userLoading) {
        console.log("⏳ Waiting for user authentication...");
        return;
      }

      if (!currentUser) {
        console.log("❌ No authenticated user - redirecting to signup");
        navigate('/signup', { replace: true });
        return;
      }

      try {
        console.log("✅ Loading user data for:", currentUser.uid);
        setIsLoading(true);
        
        const [contactResult, membershipResult, pricingResult] = await Promise.allSettled([
          getContactInfo(),
          membershipService.getMembershipInfo(),
          getMembershipCost()
        ]);

        console.log("📞 Contact result:", contactResult);
        console.log("🎫 Membership result:", membershipResult);
        console.log("💰 Pricing result:", pricingResult);

        let contactData = null;
        if (contactResult.status === 'fulfilled' && contactResult.value.success) {
          contactData = contactResult.value.contactInfo;
          console.log("✅ Contact data loaded:", contactData);
        } else {
          console.log("⚠️ Contact data failed:", contactResult);
        }

        let membershipData = null;
        if (membershipResult.status === 'fulfilled' && membershipResult.value.success) {
          membershipData = membershipResult.value.data.membershipInfo;
          console.log("✅ Membership data loaded:", membershipData);
        } else {
          console.log("⚠️ Membership data failed, using defaults");
        }

        let pricingData = null;
        if (pricingResult.status === 'fulfilled' && pricingResult.value?.success) {
          pricingData = {
            membershipCost: pricingResult.value.membershipCost || 540,
            age: pricingResult.value.age,
            annualDues: pricingResult.value.annualDues
          };
          console.log("✅ Pricing data loaded:", pricingData);
        } else {
          console.log("⚠️ Pricing data failed, using defaults");
        }

        // Require contact data (email) at minimum
        if (!contactData?.email) {
          throw new Error('Contact information is required for payment. Please complete your contact information first.');
        }

        // Set defaults for missing data
        const finalUserData = {
          contactData: contactData,
          membershipData: membershipData || {
            paymentFrequency: 'annually',
            iceCodeValid: false,
            iceCode: null,
            iceCodeInfo: null
          },
          pricingData: pricingData || {
            membershipCost: 540,
            age: null,
            annualDues: 540
          }
        };

        console.log("🎯 Final user data for payment:", finalUserData);
        setUserData(finalUserData);

      } catch (err) {
        console.error('❌ Error loading user data:', err);
        setError(err.message || 'Failed to load payment information');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, userLoading, navigate]);

  const handlePaymentComplete = (result) => {
    console.log("🎉 Payment completed in standalone page:", result);
    navigate('/signup/success', { 
      replace: true,
      state: { paymentResult: result }
    });
  };

  const handleBack = () => {
    console.log("👈 Back button clicked");
    navigate('/signup', { replace: true });
  };

  // Loading state
  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#673171] mb-4 mx-auto"></div>
          <p className="text-gray-600">
            {userLoading ? 'Authenticating...' : 'Loading payment information...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Payment</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-x-2">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Retry
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Back to Signup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Payment Data Not Available</h3>
            <p className="text-yellow-700 mb-4">
              Unable to load your payment information. Please complete the signup process first.
            </p>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Go to Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the payment page with loaded data
  console.log("🎯 Rendering payment page with data:", userData);
  
  return (
    <PaymentPageComponent
      userData={userData}
      onComplete={handlePaymentComplete}
      onBack={handleBack}
    />
  );
}