// PRODUCTION-READY Stripe Integration with Improved Design
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
      fontSize: '18px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': { 
        color: '#9ca3af' 
      },
      lineHeight: '24px',
    },
    invalid: { 
      color: '#ef4444',
      iconColor: '#ef4444'
    },
    complete: {
      color: '#059669',
      iconColor: '#059669'
    },
  },
  hidePostalCode: false,
};

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

  // Process payment with proper payment method attachment
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    console.log('🔄 Form submitted!');

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

      console.log('✅ Payment method created:', paymentMethod.id);

      // Step 2: Create payment intent on your backend WITH payment method ID
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

      console.log('🔄 Creating payment intent with payment method:', paymentMethod.id);
      const intentResult = await createPaymentIntent(paymentData);
      
      if (!intentResult.success) {
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }

      console.log('✅ Payment intent created:', intentResult.paymentIntentId);

      // Step 3: Handle different payment intent responses
      if (intentResult.requiresAction && intentResult.clientSecret) {
        console.log('🔐 Handling 3D Secure authentication...');
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          intentResult.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        console.log('✅ 3D Secure authentication completed:', paymentIntent.id);
        
      } else if (intentResult.status === 'succeeded') {
        console.log('✅ Payment completed immediately');
        
      } else if (intentResult.clientSecret) {
        console.log('🔄 Confirming payment with payment method...');
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          intentResult.clientSecret,
          {
            payment_method: paymentMethod.id
          }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        console.log('✅ Payment confirmed:', paymentIntent.id);
      }

      // Step 4: Confirm on backend and create membership
      console.log('🔄 Confirming payment on backend...');
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

      console.log('✅ Membership created successfully');
      setPaymentStatus('completed');
      
      setTimeout(() => {
        navigate('/signup/success', { 
          replace: true,
          state: { paymentResult: confirmResult }
        });
      }, 2000);

    } catch (err) {
      console.error('❌ Payment error:', err);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Payment processing failed';
      
      if (err.message.includes('card_declined')) {
        errorMessage = 'Your card was declined. Please try a different payment method.';
      } else if (err.message.includes('insufficient_funds')) {
        errorMessage = 'Insufficient funds. Please try a different payment method.';
      } else if (err.message.includes('expired_card')) {
        errorMessage = 'Your card has expired. Please use a different payment method.';
      } else if (err.message.includes('incorrect_cvc')) {
        errorMessage = 'Your card\'s security code is incorrect.';
      } else if (err.message.includes('processing_error')) {
        errorMessage = 'An error occurred while processing your card. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-[#673171] to-[#8b4a9e] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md mx-auto">
          <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-6 mb-8 mx-auto w-24 h-24 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Complete!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Welcome to Alcor! Your membership is now active.
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting you to your dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
              <p className="text-gray-600 mt-1">Secure checkout powered by Stripe</p>
            </div>
            <button
              onClick={() => navigate('/signup', { replace: true })}
              disabled={isLoading}
              className="flex items-center text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Signup
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            
            {/* Order Summary */}
            <div className="lg:col-span-2 bg-gradient-to-br from-[#673171] to-[#8b4a9e] p-10 text-white">
              <h2 className="text-2xl font-bold mb-8">Order Summary</h2>
              
              <div className="space-y-6">
                <div className="bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-lg font-semibold">
                        Alcor Membership
                      </div>
                      <div className="text-sm opacity-80">
                        {paymentInfo.frequency} Plan
                      </div>
                    </div>
                    <div className="text-xl font-bold">
                      {formatCurrency(paymentInfo.originalAmount)}
                    </div>
                  </div>

                  {paymentInfo.hasDiscount && (
                    <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                      <div>
                        <div className="font-medium text-green-200">
                          ICE Code Discount
                        </div>
                        <div className="text-xs opacity-80">
                          Code: {paymentInfo.iceCode}
                        </div>
                      </div>
                      <div className="font-semibold text-green-200">
                        -{formatCurrency(paymentInfo.discount)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white bg-opacity-20 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <div className="text-xl font-bold">Total Due Today</div>
                    <div className="text-3xl font-bold">
                      {formatCurrency(paymentInfo.discountedAmount)}
                    </div>
                  </div>
                </div>

                <div className="text-xs opacity-70 bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0h-2m8-6V9a4 4 0 00-4-4H8a4 4 0 00-4 4v6m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2V9" />
                    </svg>
                    <div>
                      Your payment is secured with 256-bit SSL encryption. 
                      All transactions are processed by Stripe, a certified PCI Level 1 service provider.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-3 p-10">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Payment Information</h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={contactData?.email || ''}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#673171] focus:border-transparent"
                        readOnly
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Card Information
                    </label>
                    <div className="border-2 border-gray-200 rounded-xl p-4 bg-white focus-within:border-[#673171] focus-within:ring-2 focus-within:ring-[#673171] focus-within:ring-opacity-20 transition-all duration-200">
                      <CardElement 
                        options={CARD_ELEMENT_OPTIONS}
                        onReady={handleCardReady}
                        onChange={handleCardChange}
                      />
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-700">
                          <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and CVC.
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-700 font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !cardComplete}
                    className="w-full bg-gradient-to-r from-[#673171] to-[#8b4a9e] text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-[#5a2a61] hover:to-[#7a3f89] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:shadow-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                      </div>
                    ) : (
                      `Complete Payment • ${formatCurrency(paymentInfo.discountedAmount)}`
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    By completing your purchase, you agree to our{' '}
                    <a href="#" className="text-[#673171] hover:underline">terms of service</a>{' '}
                    and{' '}
                    <a href="#" className="text-[#673171] hover:underline">privacy policy</a>.
                    Your membership will be activated immediately upon successful payment.
                  </p>
                </form>
              </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#673171] border-t-transparent mb-6 mx-auto"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Payment</h3>
          <p className="text-gray-600">Preparing your secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-4 mb-6 mx-auto w-16 h-16 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Unable to Load Payment</h3>
          <p className="text-gray-600 mb-8">{error || 'Failed to load payment data'}</p>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-gradient-to-r from-[#673171] to-[#8b4a9e] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#5a2a61] hover:to-[#7a3f89] transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Back to Signup
          </button>
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