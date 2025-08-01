// File: pages/signup/MembershipPayment.jsx - STRICT PAYMENT VALIDATION
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import membershipService from "../../services/membership";

export default function MembershipPayment({ 
  membershipData,
  packageData,
  contactData,
  completionData,
  onBack,
  onComplete 
}) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        console.log('💰 MembershipPayment received completionData:', completionData);
        
        // STRICT VALIDATION - No fallbacks
        if (!completionData?.readyForPayment) {
          throw new Error('Payment data not found. Please go back and try again.');
        }
        
        const { paymentDetails } = completionData.readyForPayment;
        
        if (!paymentDetails) {
          throw new Error('Payment details missing. Cannot proceed with payment.');
        }
        
        // Validate all required payment fields
        const requiredFields = ['baseCost', 'applicationFee', 'totalDue'];
        const missingFields = requiredFields.filter(field => 
          paymentDetails[field] === undefined || paymentDetails[field] === null
        );
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required payment information: ${missingFields.join(', ')}`);
        }
        
        // Validate amounts are positive numbers
        if (paymentDetails.totalDue <= 0) {
          throw new Error('Invalid payment amount. Please contact support.');
        }
        
        // Validate total calculation
        const calculatedTotal = paymentDetails.baseCost + 
                               paymentDetails.applicationFee + 
                               (paymentDetails.cmsAnnualFee || 0) - 
                               (paymentDetails.iceDiscount || 0);
                               
        if (Math.abs(calculatedTotal - paymentDetails.totalDue) > 0.01) {
          throw new Error('Payment calculation error. Please contact support.');
        }
        
        // Update payment status
        await membershipService.updatePaymentStatus(
          'in_progress',
          null,
          paymentDetails.totalDue
        );
        
        // Prepare payment data for Stripe page
        const paymentData = {
          readyForPayment: completionData.readyForPayment,
          paymentDetails: paymentDetails,
          membershipData: membershipData,
          packageData: packageData,
          contactData: contactData,
          // Include validated line items
          lineItems: {
            baseCost: paymentDetails.baseCost,
            applicationFee: paymentDetails.applicationFee,
            iceDiscount: paymentDetails.iceDiscount || 0,
            cmsAnnualFee: paymentDetails.cmsAnnualFee || 0,
            totalDue: paymentDetails.totalDue
          }
        };
        
        // Store in sessionStorage for StandalonePaymentPage
        sessionStorage.setItem('pendingPaymentData', JSON.stringify(paymentData));
        
        console.log('💾 Stored validated payment data:', paymentData);
        
        // Redirect to Stripe payment page
        navigate('/payment', { 
          replace: true,
          state: paymentData
        });
        
      } catch (err) {
        console.error('❌ Payment initialization error:', err);
        setError(err.message);
        setIsInitializing(false);
      }
    };
    
    initializePayment();
  }, [navigate, completionData, membershipData, packageData, contactData]);

  // Listen for successful payment completion
  useEffect(() => {
    const checkForSuccess = () => {
      const path = window.location.pathname;
      if (path === '/welcome-member' || path.includes('success')) {
        if (onComplete) {
          onComplete({
            paymentCompleted: true,
            completionDate: new Date().toISOString()
          });
        }
      }
    };

    checkForSuccess();
    window.addEventListener('popstate', checkForSuccess);
    
    return () => {
      window.removeEventListener('popstate', checkForSuccess);
      sessionStorage.removeItem('pendingPaymentData');
    };
  }, [onComplete]);

  // Error state - DO NOT proceed with payment
  if (error) {
    return (
      <div className="w-screen h-screen fixed inset-0 bg-white flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-500 rounded-full p-4 w-fit mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h2>
          <p className="text-gray-600 text-lg mb-6">{error}</p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-all duration-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="w-screen h-screen fixed inset-0 bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#775684] mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Preparing secure payment...</p>
        <p className="text-sm text-gray-500 mt-2">Validating payment details...</p>
      </div>
    </div>
  );
}