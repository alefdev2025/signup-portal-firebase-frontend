// File: components/signup/PaymentStep.jsx - Step wrapper component
import React, { useState, useEffect } from "react";
import { useSignupFlow } from "../../contexts/SignupFlowContext";
import { useUser } from "../../contexts/UserContext";
import PaymentPage from "../signup/PaymentPage";

// Import services to get user data
import { getContactInfo } from "../../services/contact";
import membershipService from "../../services/membership";
import { getMembershipCost } from "../../services/pricing";

export default function PaymentStep() {
  const { goToNextStep, goToPrevStep } = useSignupFlow();
  const { user } = useUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  console.log("🟢 PaymentStep component mounting");

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("PaymentStep: Loading user data...");
        
        // 1. Get contact information
        let contactData = null;
        try {
          const contactResult = await getContactInfo();
          if (contactResult.success && contactResult.contactInfo) {
            contactData = contactResult.contactInfo;
            console.log("PaymentStep: ✅ Contact data loaded:", contactData);
          }
        } catch (err) {
          console.error("PaymentStep: Error loading contact info:", err);
        }

        // 2. Get membership information (for payment frequency, ICE discount, etc.)
        let membershipData = null;
        try {
          const membershipResult = await membershipService.getMembershipInfo();
          if (membershipResult.success && membershipResult.data) {
            membershipData = membershipResult.data.membershipInfo;
            console.log("PaymentStep: ✅ Membership data loaded:", membershipData);
          }
        } catch (err) {
          console.error("PaymentStep: Error loading membership info:", err);
        }

        // 3. Get pricing information
        let pricingData = null;
        try {
          const pricingResult = await getMembershipCost();
          if (pricingResult?.success) {
            pricingData = {
              membershipCost: pricingResult.membershipCost || 540,
              age: pricingResult.age,
              annualDues: pricingResult.annualDues
            };
            console.log("PaymentStep: ✅ Pricing data loaded:", pricingData);
          }
        } catch (err) {
          console.error("PaymentStep: Error loading pricing info:", err);
        }

        // Combine all data
        const combinedUserData = {
          user: user,
          contactData: contactData,
          membershipData: membershipData,
          pricingData: pricingData
        };

        console.log("PaymentStep: Combined userData:", combinedUserData);
        setUserData(combinedUserData);
        
      } catch (err) {
        console.error("PaymentStep: Error loading data:", err);
        setError("Failed to load payment information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleBack = () => {
    console.log("PaymentStep: Going back to previous step");
    goToPrevStep();
  };

  const handleComplete = () => {
    console.log("PaymentStep: Payment completed, going to next step");
    // Payment is complete, go to next step (or completion)
    goToNextStep();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
        <p className="mt-4 text-xl text-gray-600">Loading payment information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8">
        <p className="text-red-700 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  console.log("PaymentStep: Rendering PaymentPage with userData:", userData);

  return (
    <PaymentPage
      userData={userData}
      onBack={handleBack}
      onComplete={handleComplete}
    />
  );
}