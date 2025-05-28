// PRODUCTION-READY Stripe Integration - How the pros do it
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Import services
import { getContactInfo } from "../services/contact";
import membershipService from "../services/membership";
import { getMembershipCost } from "../services/pricing";
import { createPaymentIntent, confirmPayment } from "../services/payment";
import { useUser } from "../contexts/UserContext";

const stripePromise = loadStripe('pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' },
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    },
    invalid: { color: '#9e2146' },
  },
  hidePostalCode: false,
};

// SOLUTION: Use useRef to maintain element reference across re-renders
function CheckoutForm({ userData }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  // Critical: Use refs to persist across re-renders
  const paymentElementRef = useRef(null);
  const isProcessingRef = useRef(false);
  const componentMountedRef = useRef(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('ready');

  // Store element reference when ready
  const handleCardReady = useCallback(() => {
    if (elements) {
      paymentElementRef.current = elements.getElement(CardElement);
      console.log('✅ CardElement reference stored');
    }
  }, [elements]);

  const handleCardChange = useCallback((event) => {
    console.log('🔄 Card change:', event.complete, event.error?.message);
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  }, []);

  // Memoize user data to prevent unnecessary re-renders
  const contactData = useMemo(() => userData?.contactData || {}, [userData?.contactData]);
  const membershipData = useMemo(() => userData?.membershipData || {}, [userData?.membershipData]);
  const pricingData = useMemo(() => userData?.pricingData || { membershipCost: 540 }, [userData?.pricingData]);

  const paymentInfo = useMemo(() => {
    const baseCost = pricingData.membershipCost || 540;
    const paymentFrequency = membershipData.paymentFrequency || 'annually';
    const hasIceDiscount = membershipData.iceCodeValid && membershipData.iceCodeInfo;
    
    let amount = baseCost;
    let frequency = 'Annual';
    
    if (paymentFrequency === 'monthly') {
      amount = Math.round(baseCost / 12);
      frequency = 'Monthly';
    } else if (paymentFrequency === 'quarterly') {
      amount = Math.round(baseCost / 4);
      frequency = 'Quarterly';
    }

    let iceDiscount = 0;
    if (hasIceDiscount && membershipData.iceCodeInfo) {
      const discountPercent = membershipData.iceCodeInfo.discountPercent || 25;
      iceDiscount = Math.round(baseCost * (discountPercent / 100));
      
      if (paymentFrequency === 'monthly') {
        iceDiscount = Math.round(iceDiscount / 12);
      } else if (paymentFrequency === 'quarterly') {
        iceDiscount = Math.round(iceDiscount / 4);
      }
    }

    return {
      originalAmount: amount,
      discountedAmount: Math.max(0, amount - iceDiscount),
      discount: iceDiscount,
      frequency,
      hasDiscount: hasIceDiscount,
      iceCode: membershipData.iceCode
    };
  }, [membershipData, pricingData]);

  // PRODUCTION APPROACH: Process payment with proper error handling
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    console.log('🔄 Form submitted!');
    console.log('Stripe ready:', !!stripe);
    console.log('Elements ready:', !!elements);
    console.log('Card complete:', cardComplete);
    console.log('Is processing:', isProcessingRef.current);

    // Prevent double-processing
    if (isProcessingRef.current) {
      console.log('❌ Blocked: Already processing');
      return;
    }

    if (!stripe || !elements || !cardComplete) {
      console.log('❌ Blocked: Missing stripe, elements, or incomplete card');
      setError('Please complete your card information');
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get element using stored reference first, fallback to elements
      let cardElement = paymentElementRef.current;
      if (!cardElement) {
        cardElement = elements.getElement(CardElement);
      }

      if (!cardElement) {
        throw new Error('Payment form not ready');
      }

      // Step 1: Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim(),
          email: contactData?.email,
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Step 2: Create payment intent on your backend
      const paymentData = {
        amount: Math.round(paymentInfo.discountedAmount * 100),
        currency: 'usd',
        paymentFrequency: membershipData?.paymentFrequency || 'annually',
        iceCode: membershipData?.iceCode || null,
        paymentMethodId: paymentMethod.id,
        customerInfo: {
          email: contactData?.email,
          name: `${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim(),
        }
      };

      const intentResult = await createPaymentIntent(paymentData);
      
      if (!intentResult.success) {
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }

      // Step 3: Confirm payment if needed
      if (intentResult.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          intentResult.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Step 4: Confirm on backend
      const confirmResult = await confirmPayment({
        paymentIntentId: intentResult.paymentIntentId,
        membershipData: {
          paymentFrequency: membershipData?.paymentFrequency || 'annually',
          iceCode: membershipData?.iceCode || null,
          iceCodeInfo: membershipData?.iceCodeInfo || null
        }
      });
      
      if (!confirmResult.success) {
        throw new Error('Payment succeeded but membership creation failed');
      }

      setPaymentStatus('completed');
      
      setTimeout(() => {
        navigate('/signup/success', { 
          replace: true,
          state: { paymentResult: confirmResult }
        });
      }, 2000);

    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  }, [stripe, elements, cardComplete, paymentInfo, membershipData, contactData, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-green-500 rounded-full p-4 mb-8 mx-auto w-20 h-20 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            Your payment has been processed successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">Complete Your Payment</h1>
            <button
              onClick={() => navigate('/signup', { replace: true })}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Order Summary */}
            <div className="bg-gray-50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Order Summary</h2>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">
                      Membership - {paymentInfo.frequency}
                    </div>
                    <div className="text-sm text-gray-500">
                      {paymentInfo.frequency} Plan
                    </div>
                  </div>
                  <div className="font-medium text-gray-900">
                    {formatCurrency(paymentInfo.originalAmount)}
                  </div>
                </div>

                {paymentInfo.hasDiscount && (
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-[#673171]">
                        ICE Code Discount ({paymentInfo.iceCode})
                      </div>
                      <div className="text-sm text-[#673171]">First year only</div>
                    </div>
                    <div className="font-medium text-[#673171]">
                      -{formatCurrency(paymentInfo.discount)}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                  <div className="text-xl font-bold text-gray-900">Total</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(paymentInfo.discountedAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Payment Details</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactData?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Information
                  </label>
                  <div
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      padding: '1.25rem',
                      backgroundColor: 'white',
                      minHeight: '4rem',
                    }}
                  >
                    <CardElement 
                      options={CARD_ELEMENT_OPTIONS}
                      onReady={handleCardReady}
                      onChange={handleCardChange}
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 17h.01M12 3v6m6 6v6M6 9v6" />
                      </svg>
                      <div className="text-sm text-yellow-700">
                        <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future expiry date and CVC.
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !cardComplete}
                  className="w-full bg-[#673171] text-white py-3 px-4 rounded-md font-medium hover:bg-[#5a2a61] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  onClick={() => console.log('Button clicked! Disabled:', isLoading || !cardComplete)}
                >
                  {isLoading ? 'Processing...' : `Pay ${formatCurrency(paymentInfo.discountedAmount)}`}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  By completing your purchase, you agree to our terms of service and privacy policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Data loader component
function PaymentPageLoader() {
  const { currentUser } = useUser();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        navigate('/signup', { replace: true });
        return;
      }

      try {
        const [contactResult, membershipResult, pricingResult] = await Promise.allSettled([
          getContactInfo(),
          membershipService.getMembershipInfo(),
          getMembershipCost()
        ]);

        let contactData = null;
        if (contactResult.status === 'fulfilled' && contactResult.value.success) {
          contactData = contactResult.value.contactInfo;
        }

        let membershipData = null;
        if (membershipResult.status === 'fulfilled' && membershipResult.value.success) {
          membershipData = membershipResult.value.data.membershipInfo;
        }

        let pricingData = null;
        if (pricingResult.status === 'fulfilled' && pricingResult.value?.success) {
          pricingData = {
            membershipCost: pricingResult.value.membershipCost || 540,
            age: pricingResult.value.age,
            annualDues: pricingResult.value.annualDues
          };
        }

        // Set defaults if data is missing
        if (!contactData?.email) {
          throw new Error('Contact information is required for payment');
        }

        setUserData({
          contactData: contactData || {},
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
        });

      } catch (err) {
        setError(err.message || 'Failed to load payment information');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#673171] mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Payment</h3>
            <p className="text-red-700 mb-4">{error || 'Failed to load payment data'}</p>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Back to Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <CheckoutForm userData={userData} />;
}

// Main payment page with proper Elements wrapper
export default function StandalonePaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentPageLoader />
    </Elements>
  );
}