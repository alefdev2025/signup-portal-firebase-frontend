// PRODUCTION-READY Stripe Integration - STRICT VALIDATION
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadStripe } from '@stripe/stripe-js';
import { PageLoadingSpinner } from '../components/LoadingSpinner';
import { ButtonLoader } from '../components/DotLoader';
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

// Import logo
import navyAlcorLogo from "../assets/images/navy-alcor-logo.png";
import alcorStar from "../assets/images/alcor-star.png";
import whiteALogoNoText from "../assets/images/alcor-white-logo-no-text.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

// Import Terms and Privacy Modal
import TermsPrivacyModal from "../components/modals/TermsPrivacyModal";
import HelpPanel from "../components/signup/HelpPanel";

// FEATURE FLAGS
const ENABLE_ACH_PAYMENTS = false; // Set to true to enable ACH payments

// Debug: Check if env variable is loaded
console.log('Stripe Key from env:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Initialize Stripe - fallback to hardcoded key if env var not available
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp';
const stripePromise = loadStripe(stripeKey);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': { 
        color: '#9ca3af' 
      },
      lineHeight: '20px',
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

function CheckoutForm({ userData, paymentLineItems }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
  // Refs to persist across re-renders
  const paymentElementRef = useRef(null);
  const isProcessingRef = useRef(false);
  const componentMountedRef = useRef(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('ready');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);

  // CRITICAL: Use state for payment info to ensure re-render
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Store element reference when ready
  const handleCardReady = useCallback(() => {
    if (elements) {
      paymentElementRef.current = elements.getElement(CardElement);
      console.log('CardElement reference stored');
    }
  }, [elements]);

  const handleCardChange = useCallback((event) => {
    console.log('Card change:', event.complete, event.error?.message);
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  }, []);

  // Get contact data - handle gracefully if missing
  const contactData = useMemo(() => {
    if (!userData?.contactData?.email) {
      return null;
    }
    return userData.contactData;
  }, [userData?.contactData]);

  // Get membership data
  const membershipData = useMemo(() => userData?.membershipData || {}, [userData?.membershipData]);

  // Calculate payment info when line items are available
  useEffect(() => {
    if (!paymentLineItems) return;
    
    console.log('Setting payment info with line items:', paymentLineItems);
    
    // Validate all required fields exist
    const requiredFields = ['baseCost', 'totalDue'];
    for (const field of requiredFields) {
      if (paymentLineItems[field] === undefined || paymentLineItems[field] === null) {
        console.error(`Missing required payment field: ${field}`);
        return;
      }
    }
    
    // Validate amounts are positive
    if (paymentLineItems.totalDue <= 0) {
      console.error('Invalid payment amount');
      return;
    }
    
    // Set the payment info
    const info = {
      baseCost: paymentLineItems.baseCost,
      applicationFee: paymentLineItems.applicationFee || 0,
      iceDiscount: paymentLineItems.iceDiscount || 0,
      cmsAnnualFee: paymentLineItems.cmsAnnualFee || 0,
      totalDue: paymentLineItems.totalDue,
      originalAmount: paymentLineItems.baseCost,
      discountedAmount: paymentLineItems.totalDue,
      frequency: 'Annual',
      perText: 'per year',
      hasDiscount: (paymentLineItems.iceDiscount || 0) > 0,
      iceCode: membershipData?.iceCode || null
    };
    
    console.log('Payment info set:', info);
    setPaymentInfo(info);
  }, [paymentLineItems, membershipData]);

  // Process payment
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    console.log('Form submitted!');

    // Prevent double-processing
    if (isProcessingRef.current) {
      console.log('Blocked: Already processing');
      return;
    }

    if (!stripe || !elements || (paymentMethod === 'card' && !cardComplete)) {
      console.log('Blocked: Missing stripe, elements, or incomplete card');
      setError('Please complete your payment information');
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'card') {
        // Get card element
        let cardElement = paymentElementRef.current;
        if (!cardElement) {
          cardElement = elements.getElement(CardElement);
        }

        if (!cardElement) {
          throw new Error('Payment form not ready');
        }

        // Create payment method
        const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim(),
            email: contactData.email,
          },
        });

        if (pmError) {
          throw new Error(pmError.message);
        }

        console.log('Payment method created:', pm.id);

        // Create payment intent with EXACT amount from backend
        const paymentData = {
          amount: Math.round(paymentInfo.totalDue * 100), // Convert to cents - use totalDue from backend
          currency: 'usd',
          paymentFrequency: membershipData?.paymentFrequency || 'annually',
          iceCode: membershipData?.iceCode || null,
          paymentMethodId: pm.id,
          customerInfo: {
            email: contactData.email,
            name: `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim(),
          },
          // Include line items for backend validation
          lineItems: {
            baseCost: paymentInfo.baseCost,
            applicationFee: paymentInfo.applicationFee,
            iceDiscount: paymentInfo.iceDiscount,
            cmsAnnualFee: paymentInfo.cmsAnnualFee,
            totalDue: paymentInfo.totalDue
          }
        };

        console.log('Creating payment intent with backend amount:', paymentData.amount / 100);
        console.log('Payment line items:', paymentData.lineItems);
        const intentResult = await createPaymentIntent(paymentData);
        
        if (!intentResult.success) {
          throw new Error(intentResult.error || 'Failed to create payment intent');
        }

        console.log('Payment intent created:', intentResult.paymentIntentId);

        // Handle payment intent response
        if (intentResult.requiresAction && intentResult.clientSecret) {
          console.log('Handling 3D Secure authentication...');
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            intentResult.clientSecret
          );

          if (confirmError) {
            throw new Error(confirmError.message);
          }

          console.log('3D Secure authentication completed:', paymentIntent.id);
          
        } else if (intentResult.status === 'succeeded') {
          console.log('Payment completed immediately');
          
        } else if (intentResult.clientSecret) {
          console.log('Confirming payment with payment method...');
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            intentResult.clientSecret,
            {
              payment_method: pm.id
            }
          );

          if (confirmError) {
            throw new Error(confirmError.message);
          }

          console.log('Payment confirmed:', paymentIntent.id);
        }

        // Confirm on backend
        console.log('Confirming payment on backend...');
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

        console.log('Membership created successfully');

        navigate('/signup/completion', { 
          replace: true,
          state: { 
            paymentCompleted: true,
            paymentResult: confirmResult 
          }
        });
        
        // Navigate immediately to welcome member page
        /*navigate('/welcome-member', { 
          replace: true,
          state: { paymentResult: confirmResult }
        });*/

      } else {
        // Handle ACH payment
        console.log('Processing ACH payment...');
        throw new Error('ACH payment not yet implemented');
      }

    } catch (err) {
      console.error('Payment error:', err);
      
      // Enhanced error handling
      let errorMessage = 'Payment processing failed';
      
      if (err.message.includes('card_declined')) {
        errorMessage = 'Your card was declined. Please try a different payment method.';
      } else if (err.message.includes('insufficient_funds')) {
        errorMessage = 'Insufficient funds. Please try a different payment method.';
      } else if (err.message.includes('expired_card')) {
        errorMessage = 'Your card has expired. Please use a different payment method.';
      } else if (err.message.includes('incorrect_cvc')) {
        errorMessage = 'Your card security code is incorrect.';
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
  }, [stripe, elements, cardComplete, paymentMethod, paymentInfo, membershipData, contactData, navigate]);

  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Help content
  const paymentHelpContent = [
    {
      title: "Payment Processing",
      content: "Complete your Alcor membership payment securely using your credit card or bank transfer (ACH)."
    },
    {
      title: "Payment Methods",
      content: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and ACH bank transfers for your convenience."
    },
    {
      title: "Security & Privacy",
      content: "All payments are processed securely through Stripe with 256-bit SSL encryption. Your financial information is never stored on our servers."
    },
    {
      title: "Membership Activation",
      content: "Your Alcor membership will be activated immediately upon successful payment confirmation."
    },
    {
      title: "Need assistance?",
      content: (
        <span>
          Contact our support team at <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a> or call 623-432-7775.
        </span>
      )
    }
  ];

  // Modal functions
  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

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

  // VALIDATION - After all hooks are declared
  if (!paymentLineItems || !paymentLineItems.totalDue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h2>
          <p className="text-gray-600">Payment information is missing. Please go back and try again.</p>
        </div>
      </div>
    );
  }

  if (!contactData || !contactData.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Error</h2>
          <p className="text-gray-600">Contact information is required for payment.</p>
        </div>
      </div>
    );
  }

  // Show loading while payment info is being set
  if (!paymentInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#775684]"></div>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#12243c] to-[#4b3965] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md mx-auto">
          <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-4 mb-6 mx-auto w-20 h-20 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Complete!</h2>
          <p className="text-base text-gray-600 mb-4">
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
    <div>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Header Bar - Mobile */}
        <div className="md:hidden">
          <div className="py-8 px-4 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
            
            <div className="flex items-center justify-between pt-3 relative z-10">
              <div className="flex items-center">
                <img src={whiteALogoNoText} alt="Alcor Logo" className="h-12" />
              </div>
              
              <div className="flex items-center">
                <h1 className="flex items-center">
                  <span className="text-xl font-bold text-white">Activate Membership</span>
                  <img src={yellowStar} alt="" className="h-5 ml-0.5" />
                </h1>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Header Bar - Desktop */}
        <div className="hidden md:block py-3 px-6 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
          
          <div className="w-full flex justify-between items-center relative z-10">
            <img src={whiteALogoNoText} alt="Alcor Logo" className="h-12" />
            <h1 className="flex items-center text-lg sm:text-xl font-semibold text-white">
              Activate Membership
              <img src={alcorStar} alt="" className="h-5 ml-0.5" />
            </h1>
          </div>
        </div>
        
        <div className="flex items-start justify-center pt-4 lg:pt-6 px-4">
          <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-0">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden lg:h-[650px] max-w-sm sm:max-w-none mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 lg:h-full">
            
                {/* LEFT SIDE - Order Summary with Custom Gradient */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#0a1629] to-[#1e2650] p-6 text-white flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
                  
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="mt-3 mb-6">
                      <h2 className="text-xl font-medium text-white mb-4 flex items-center">
                        Activate Membership
                        <img src={alcorStar} alt="Alcor Star" className="h-5 ml-1" />
                      </h2>
                    </div>
                    
                    <div className="space-y-4 flex-grow">
                      {/* Grouped Summary Items */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 space-y-4">
                        {/* Base Membership Cost */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-sm font-normal text-white mb-1 flex items-center">
                              Alcor Membership
                              <img src={alcorStar} alt="Alcor Star" className="h-4 ml-1" />
                            </h3>
                            <p className="text-white/70 text-xs mb-1">Annual Plan</p>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-medium text-white">
                              ${paymentLineItems?.baseCost || 0}
                            </div>
                          </div>
                        </div>

                        {/* Application Fee - DIRECTLY FROM paymentLineItems */}
                        {paymentLineItems?.applicationFee > 0 && (
                          <>
                            <hr className="border-white/20 my-3" />
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-sm font-normal text-white mb-1">One-time Application Fee</h3>
                                <p className="text-white/70 text-xs mb-1">First-time members only</p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-medium text-white">
                                  ${paymentLineItems.applicationFee}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* CMS Annual Fee - DIRECTLY FROM paymentLineItems */}
                        {paymentLineItems?.cmsAnnualFee > 0 && (
                          <>
                            <hr className="border-white/20 my-3" />
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-sm font-normal text-white mb-1">CMS Annual Fee</h3>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-medium text-white">
                                  ${paymentLineItems.cmsAnnualFee}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* ICE Code Discount - DIRECTLY FROM paymentLineItems */}
                        {paymentLineItems?.iceDiscount > 0 && (
                          <>
                            <hr className="border-white/20 my-3" />
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-sm font-normal text-white mb-1">ICE Code Discount</h3>
                                <p className="text-white/70 text-xs mb-1">Applied</p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-medium text-blue-300">
                                  -${paymentLineItems.iceDiscount}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Tax Section */}
                        <hr className="border-white/20 my-3" />
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-sm font-normal text-white mb-1">Tax</h3>
                            <p className="text-white/70 text-xs mb-1">No tax applicable</p>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-medium text-white">
                              $0.00
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total Section - DIRECTLY FROM paymentLineItems */}
                      <div className="mt-6 pt-4">
                        <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-normal text-white">Total Due Today</div>
                            <div className="text-base font-medium text-white">
                              ${paymentLineItems?.totalDue || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Info at Bottom */}
                    <div className="mt-auto pt-8">
                      <div className="mb-4 flex justify-center">
                        <img src={whiteALogoNoText} alt="Alcor Logo" className="h-10 opacity-90" />
                      </div>
                      <div className="flex items-start text-white/60 text-xs leading-relaxed">
                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <div>
                          Your payment is secured with 256-bit SSL encryption. All transactions are processed by Stripe, a certified PCI Level 1 service provider.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE - Payment Form */}
                <div className="lg:col-span-3 lg:h-full lg:overflow-hidden">
                  <div className="lg:h-full lg:overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-md mx-auto w-full">
                      <h2 className="text-lg font-bold text-gray-900 mb-5">Payment Information</h2>

                      <form onSubmit={handleSubmit} className="space-y-8 pb-8 lg:pb-12">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={contactData.email}
                              className="w-full px-4 py-4 lg:py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                              readOnly
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Payment Method Selection */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Payment method
                          </label>
                          <div className="border border-gray-200 rounded-lg p-4 lg:p-3 space-y-3 lg:space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  id="card"
                                  name="paymentMethod"
                                  value="card"
                                  checked={paymentMethod === 'card'}
                                  onChange={() => setPaymentMethod('card')}
                                  className="mr-3 w-4 h-4 text-[#13273f] focus:ring-[#13273f]"
                                />
                                <label htmlFor="card" className="flex items-center cursor-pointer">
                                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                                  </svg>
                                  <span className="font-medium text-sm">Card</span>
                                </label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <img src="https://js.stripe.com/v3/fingerprinted/img/visa-365725566f9578a9589553aa9296d178.svg" alt="Visa" className="h-5" />
                                <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-5" />
                                <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="American Express" className="h-5" />
                                <img src="https://js.stripe.com/v3/fingerprinted/img/discover-ac52cd46f89fa40a29a0bfb954e33173.svg" alt="Discover" className="h-5" />
                              </div>
                            </div>
                            
                            {ENABLE_ACH_PAYMENTS && (
                              <>
                                <hr className="border-gray-200" />
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      type="radio"
                                      id="ach"
                                      name="paymentMethod"
                                      value="ach"
                                      checked={paymentMethod === 'ach'}
                                      onChange={() => setPaymentMethod('ach')}
                                      className="mr-3 w-4 h-4 text-[#13273f] focus:ring-[#13273f]"
                                    />
                                    <label htmlFor="ach" className="flex items-center cursor-pointer">
                                      <div className="bg-[#0052cc] text-white px-2 py-0.5 rounded text-xs font-bold mr-2">
                                        ACH
                                      </div>
                                      <span className="font-medium text-sm">Bank Transfer</span>
                                    </label>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {paymentMethod === 'card' ? (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Card Information
                            </label>
                            <div className="border border-gray-200 rounded-lg p-4 bg-white focus-within:border-[#13273f] focus-within:ring-2 focus-within:ring-[#13273f] focus-within:ring-opacity-20 transition-all duration-200">
                              <CardElement 
                                options={CARD_ELEMENT_OPTIONS}
                                onReady={handleCardReady}
                                onChange={handleCardChange}
                              />
                            </div>
                            
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start">
                                <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="text-xs text-blue-700">
                                  <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and CVC.
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Bank Account Information
                              </label>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Routing Number
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="9 digits"
                                    className="w-full px-4 py-4 lg:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Account number"
                                    className="w-full px-4 py-4 lg:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Account Type
                                  </label>
                                  <select className="w-full px-4 py-4 lg:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent">
                                    <option value="checking">Checking</option>
                                    <option value="savings">Savings</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Account Holder Name
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Full name on account"
                                    className="w-full px-4 py-4 lg:py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start">
                                <svg className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.99-.833-2.78 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div className="text-xs text-amber-700">
                                  <strong>ACH Payment Note:</strong> Bank transfers typically take 1-3 business days to process. Your membership will be activated once payment is confirmed.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start">
                              <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs text-red-700 font-medium">{error}</span>
                            </div>
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#13273f] hover:bg-[#1d3351] disabled:bg-gray-400 disabled:hover:bg-gray-400 text-white py-4 px-5 rounded-full font-semibold text-sm disabled:cursor-not-allowed transition-all duration-300 shadow-sm disabled:shadow-none flex items-center justify-center"
                          >
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {paymentMethod === 'card' ? 'Processing Payment...' : 'Processing Transfer...'}
                              </div>
                            ) : (
                              <span className="flex items-center">
                                <img src={alcorStar} alt="" className="h-4 mr-1" />
                                {`Complete ${paymentMethod === 'card' ? 'Payment' : 'Bank Transfer'} • ${formatCurrency(paymentInfo.totalDue)}`}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </button>

                          <p className="text-xs text-gray-500 text-center leading-relaxed mt-4">
                            By completing your purchase, you agree to our{' '}
                            <span 
                              onClick={() => openModal('terms')} 
                              className="text-[#13273f] hover:underline cursor-pointer"
                            >
                              terms of service
                            </span>{' '}
                            and{' '}
                            <span 
                              onClick={() => openModal('privacy')} 
                              className="text-[#13273f] hover:underline cursor-pointer"
                            >
                              privacy policy
                            </span>.
                            Your membership will be activated immediately upon successful payment.
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms and Privacy Modal */}
      <TermsPrivacyModal 
        isOpen={modalOpen}
        onClose={closeModal}
        type={modalType}
        bannerColor="#13273f"
      />
      
      {/* Help Panel Component */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={paymentHelpContent} 
      />
    </div>
  );
}

// Data loader component with STRICT validation and debugging
function PaymentPageLoader() {
  const { currentUser } = useUser();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [paymentLineItems, setPaymentLineItems] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      console.log('🔍 PaymentPageLoader starting...');
      console.log('Current user:', currentUser);
      console.log('Location state:', location.state);
      
      if (!currentUser) {
        console.log('❌ No current user, redirecting to signup');
        navigate('/signup', { replace: true });
        return;
      }

      try {
        // FIRST: Try to get payment data from location state (direct navigation)
        let lineItems = null;
        
        if (location.state?.paymentDetails) {
          console.log('📍 Found payment data in location state');
          lineItems = location.state.paymentDetails;
        } else {
          // Check sessionStorage as fallback
          const storedPaymentData = sessionStorage.getItem('pendingPaymentData');
          console.log('📦 Checking sessionStorage:', storedPaymentData ? 'Found data' : 'No data');
          
          if (storedPaymentData) {
            try {
              const parsedData = JSON.parse(storedPaymentData);
              console.log('📦 Parsed payment data:', parsedData);
              
              // CRITICAL: Validate line items exist
              if (!parsedData.lineItems || !parsedData.lineItems.totalDue) {
                console.error('❌ Invalid payment data - missing line items');
                throw new Error('Invalid payment data - missing line items');
              }
              
              lineItems = parsedData.lineItems;
              console.log('✅ Line items extracted:', lineItems);
              
            } catch (e) {
              console.error('❌ Error parsing stored payment data:', e);
              throw new Error('Corrupted payment data. Please go back and try again.');
            }
          }
        }
        
        // Set payment line items immediately if found
        if (lineItems) {
          console.log('💰 Setting payment line items:', lineItems);
          setPaymentLineItems(lineItems);
        }
        
        // Load user data for display
        console.log('👤 Loading user data...');
        const [contactResult, membershipResult] = await Promise.allSettled([
          getContactInfo(),
          membershipService.getMembershipInfo()
        ]);

        let contactData = null;
        if (contactResult.status === 'fulfilled' && contactResult.value.success) {
          contactData = contactResult.value.contactInfo;
          console.log('✅ Contact data loaded:', contactData);
        } else {
          console.log('⚠️ Failed to load contact data');
        }

        let membershipData = null;
        if (membershipResult.status === 'fulfilled' && membershipResult.value.success) {
          membershipData = membershipResult.value.data.membershipInfo;
          console.log('✅ Membership data loaded:', membershipData);
        } else {
          console.log('⚠️ Failed to load membership data');
        }

        // CRITICAL: Validate required data
        if (!contactData?.email) {
          console.error('❌ No contact email found');
          throw new Error('Contact information is required for payment');
        }
        
        if (!lineItems || !lineItems.totalDue) {
          console.error('❌ No valid line items found');
          throw new Error('Payment information not found. Please go back to the previous step.');
        }

        // Set user data
        const finalUserData = {
          contactData: contactData,
          membershipData: membershipData || {},
          pricingData: {} // Not using fallback pricing
        };
        
        console.log('✅ Setting final user data:', finalUserData);
        setUserData(finalUserData);
        setError(null);

      } catch (err) {
        console.error('❌ Error in loadUserData:', err);
        setError(err.message || 'Failed to load payment information');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, navigate, location.state]);

  if (isLoading) {
    return <ButtonLoader message="Loading payment information..." />;
  }

  if (error || !userData || !paymentLineItems) {
    console.log('🚨 Rendering error state:', { error, hasUserData: !!userData, hasLineItems: !!paymentLineItems });
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full p-3 mb-4 mx-auto w-14 h-14 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Unable to Load Payment</h3>
          <p className="text-gray-600 mb-6">{error || 'Payment information not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-gradient-to-r from-[#12243c] to-[#4b3965] text-white px-6 py-2.5 rounded-lg font-semibold hover:from-[#0f1e33] hover:to-[#402f56] transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering CheckoutForm with data');
  return <CheckoutForm userData={userData} paymentLineItems={paymentLineItems} />;
}

// Main payment page with proper Elements wrapper
export default function StandalonePaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentPageLoader />
    </Elements>
  );
}