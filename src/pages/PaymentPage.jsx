// PRODUCTION-READY Stripe Integration with Improved Design - Fixed
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

// Import logo
import navyAlcorLogo from "../assets/images/navy-alcor-logo.png";
import alcorStar from "../assets/images/alcor-star.png";
import whiteALogo from "../assets/images/white-a-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

// Import Terms and Privacy Modal
import TermsPrivacyModal from "../components/modals/TermsPrivacyModal";
import HelpPanel from "../components/HelpPanel";

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
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'ach'
  
  // Modal state for terms and privacy
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'terms' or 'privacy'
  
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);

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
    let perText = 'per year';
    
    if (paymentFrequency === 'monthly') {
      amount = Math.round(baseCost / 12);
      frequency = 'Monthly';
      perText = 'per month';
    } else if (paymentFrequency === 'quarterly') {
      amount = Math.round(baseCost / 4);
      frequency = 'Quarterly';
      perText = 'per quarter';
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
      perText,
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

    if (!stripe || !elements || (paymentMethod === 'card' && !cardComplete)) {
      console.log('❌ Blocked: Missing stripe, elements, or incomplete card');
      setError('Please complete your payment information');
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'card') {
        // Get element using stored reference first, fallback to elements
        let cardElement = paymentElementRef.current;
        if (!cardElement) {
          cardElement = elements.getElement(CardElement);
        }

        if (!cardElement) {
          throw new Error('Payment form not ready');
        }

        // Step 1: Create payment method
        const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
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

        console.log('✅ Payment method created:', pm.id);

        // Step 2: Create payment intent on your backend WITH payment method ID
        const paymentData = {
          amount: Math.round(paymentInfo.discountedAmount * 100),
          currency: 'usd',
          paymentFrequency: membershipData?.paymentFrequency || 'annually',
          iceCode: membershipData?.iceCode || null,
          paymentMethodId: pm.id,
          customerInfo: {
            email: contactData?.email,
            name: `${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim(),
          }
        };

        console.log('🔄 Creating payment intent with payment method:', pm.id);
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
              payment_method: pm.id
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

      } else {
        // Handle ACH payment
        console.log('🔄 Processing ACH payment...');
        // ACH payment logic would go here
        throw new Error('ACH payment not yet implemented');
      }

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
  }, [stripe, elements, cardComplete, paymentMethod, paymentInfo, membershipData, contactData, navigate]);

  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Define page-specific help content
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
        <>
          Contact our support team at <a href="mailto:support@alcor.com" className="text-[#775684] hover:underline">support@alcor.com</a> or call (800) 555-1234.
        </>
      )
    }
  ];

  // Terms and Privacy modal functions
  const openModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
    setModalType(null);
  };

  // Terms of Use content
  const termsContent = `
    <h1>Terms of Use</h1>
    <p><em>Last Updated: May 1, 2025</em></p>

    <h2>1. Introduction</h2>
    <p>Welcome to Alcor Cryonics ("we," "our," or "us"). This document outlines the terms and conditions for using our services and website.</p>
    
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p>
    
    <h2>2. Definitions</h2>
    <p>In these Terms, "Service" refers to our cryonics services, website, and related offerings. "User" or "you" refers to individuals accessing or using our Service.</p>
    
    <p>Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui.</p>
    
    <h2>3. Acceptance of Terms</h2>
    <p>By accessing or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.</p>
    
    <p>Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim. Curabitur sit amet mauris.</p>
    
    <h2>4. User Accounts</h2>
    <p>When you create an account with us, you guarantee that the information you provide is accurate, complete, and current. Inaccurate, incomplete, or obsolete information may result in the termination of your account.</p>
    
    <p>Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor. Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. Proin sodales libero eget ante.</p>
    
    <h2>5. Service Usage</h2>
    <p>You agree not to use our Service for any illegal or unauthorized purpose. You must not transmit worms, viruses, or any code of a destructive nature.</p>
    
    <p>Aenean laoreet. Vestibulum nisi lectus, commodo ac, facilisis ac, ultricies eu, pede. Ut orci risus, accumsan porttitor, cursus quis, aliquet eget, justo. Sed pretium blandit orci. Ut eu diam at pede suscipit sodales. Aenean lectus elit, fermentum non, convallis id, sagittis at, neque.</p>
    
    <h2>6. Changes to Terms</h2>
    <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes as appropriate. Your continued use of our Service constitutes acceptance of any updates to these Terms.</p>
  `;

  // Privacy Policy content
  const privacyContent = `
    <h1>Privacy Policy</h1>
    <p><em>Last Updated: May 1, 2025</em></p>

    <h2>1. Introduction</h2>
    <p>At Alcor Cryonics ("we," "our," or "us"), we respect your privacy and are committed to protecting it through our compliance with this policy.</p>
    
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.</p>
    
    <h2>2. Information We Collect</h2>
    <p>We collect several types of information from and about users of our website, including:</p>
    
    <ul>
        <li>Personal information such as name, postal address, email address, telephone number, and any other identifier by which you may be contacted online or offline.</li>
        <li>Information about your internet connection, the equipment you use to access our website, and usage details.</li>
    </ul>
    
    <p>Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui.</p>
    
    <h2>3. How We Collect Information</h2>
    <p>We collect information directly from you when you provide it to us and automatically as you navigate through the site.</p>
    
    <p>Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum. Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim. Curabitur sit amet mauris.</p>
    
    <h2>4. How We Use Your Information</h2>
    <p>We use information that we collect about you or that you provide to us:</p>
    
    <ul>
        <li>To present our website and its contents to you.</li>
        <li>To provide you with information, products, or services that you request from us.</li>
        <li>To fulfill any other purpose for which you provide it.</li>
        <li>To notify you about changes to our website or any products or services we offer.</li>
    </ul>
  `;

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
      <div className="min-h-screen bg-gradient-to-br from-[#12243c] to-[#4b3965] flex items-center justify-center p-4">
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Main Content */}
        <div className="min-h-screen flex items-center justify-center py-8 px-6">
          <div className="w-full max-w-7xl">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[700px]">
              <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[700px]">
            
              {/* LEFT SIDE - Order Summary - ONLY ONE */}
              <div className="lg:col-span-2 bg-gray-50 p-12 text-gray-900 flex flex-col border-r border-gray-100">
                <div className="mb-8">
                  <img src={navyAlcorLogo} alt="Alcor Logo" className="h-16" />
                </div>
                
                <div className="space-y-8 flex-grow">
                  <div>
                    <h3 className="text-lg text-gray-500 mb-2 flex items-center">
                      Start Membership
                      <img src={yellowStar} alt="" className="h-5 ml-2" />
                    </h3>
                    <div className="text-4xl font-bold mb-2 text-gray-900">
                      {formatCurrency(paymentInfo.originalAmount)}
                    </div>
                    <p className="text-gray-500">
                      {paymentInfo.perText}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          Membership - {paymentInfo.frequency} - USD
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {paymentInfo.frequency} Membership Plan
                        </div>
                        <div className="text-sm text-gray-500">
                          Billed {paymentInfo.frequency.toLowerCase()}ly
                        </div>
                      </div>
                      <div className="text-lg font-medium text-gray-900">
                        {formatCurrency(paymentInfo.originalAmount)}
                      </div>
                    </div>

                    {paymentInfo.hasDiscount && (
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-purple-600">
                            ICE Code Discount ({paymentInfo.iceCode})
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            First year only • Member (Alcor Member ICE)
                          </div>
                        </div>
                        <div className="text-lg font-medium text-purple-600">
                          -{formatCurrency(paymentInfo.discount)}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-6">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-900">{formatCurrency(paymentInfo.discountedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span className="text-gray-900">$0.00</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold text-gray-900">Total due today</div>
                        <div className="text-4xl font-bold text-gray-900">
                          {formatCurrency(paymentInfo.discountedAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Star Decorations - At actual bottom */}
                <div className="flex justify-center mt-auto pt-8">
                  <div className="flex justify-center items-center space-x-2">
                    <img src={yellowStar} alt="Yellow Star" className="h-7 opacity-70" />
                    <img src={yellowStar} alt="Yellow Star" className="h-12 opacity-90" />
                    <img src={yellowStar} alt="Yellow Star" className="h-7 opacity-70" />
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE - Payment Form - ONLY ONE */}
              <div className="lg:col-span-3 p-12 flex flex-col justify-center">
                <div className="max-w-lg mx-auto w-full">
                  <h2 className="text-2xl font-bold text-gray-900 mb-10">Payment Information</h2>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={contactData?.email || ''}
                          className="w-full px-5 py-5 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                          readOnly
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Payment method
                      </label>
                      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
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
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                              </svg>
                              <span className="font-medium">Card</span>
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <img src="https://js.stripe.com/v3/fingerprinted/img/visa-365725566f9578a9589553aa9296d178.svg" alt="Visa" className="h-6" />
                            <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
                            <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="American Express" className="h-6" />
                            <img src="https://js.stripe.com/v3/fingerprinted/img/discover-ac52cd46f89fa40a29a0bfb954e33173.svg" alt="Discover" className="h-6" />
                          </div>
                        </div>
                        
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
                              <div className="bg-[#0052cc] text-white px-2 py-1 rounded text-xs font-bold mr-2">
                                SEPA
                              </div>
                              <span className="font-medium">Direct Debit</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {paymentMethod === 'card' ? (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                          Card Information
                        </label>
                        <div className="border-2 border-gray-200 rounded-xl p-5 bg-white focus-within:border-[#13273f] focus-within:ring-2 focus-within:ring-[#13273f] focus-within:ring-opacity-20 transition-all duration-200">
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
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-4">
                            Bank Account Information
                          </label>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Routing Number
                              </label>
                              <input
                                type="text"
                                placeholder="9 digits"
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Account Number
                              </label>
                              <input
                                type="text"
                                placeholder="Account number"
                                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Account Type
                              </label>
                              <select className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent">
                                <option value="checking">Checking</option>
                                <option value="savings">Savings</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.78 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="text-sm text-amber-700">
                              <strong>ACH Payment Note:</strong> Bank transfers typically take 3-5 business days to process. Your membership will be activated once payment is confirmed.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

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
                      disabled={isLoading}
                      className="w-full bg-[#13273f] hover:bg-[#1d3351] disabled:bg-gray-400 disabled:hover:bg-gray-400 text-white py-4 px-8 rounded-full font-semibold text-lg disabled:cursor-not-allowed transition-all duration-300 shadow-sm disabled:shadow-none flex items-center justify-center"
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
                        <>
                          <img src={alcorStar} alt="" className="h-5 mr-3" />
                          {`Complete ${paymentMethod === 'card' ? 'Payment' : 'Bank Transfer'} • ${formatCurrency(paymentInfo.discountedAmount)}`}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      By completing your purchase, you agree to our{' '}
                      <button 
                        type="button" 
                        onClick={() => openModal('terms')} 
                        className="text-[#13273f] hover:underline focus:outline-none focus:ring-1 focus:ring-[#13273f] focus:ring-offset-1 rounded px-1"
                      >
                        terms of service
                      </button>{' '}
                      and{' '}
                      <button 
                        type="button" 
                        onClick={() => openModal('privacy')} 
                        className="text-[#13273f] hover:underline focus:outline-none focus:ring-1 focus:ring-[#13273f] focus:ring-offset-1 rounded px-1"
                      >
                        privacy policy
                      </button>.
                      Your membership will be activated immediately upon successful payment.
                    </p>
                  </form>
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
        directContent={modalType === 'terms' ? termsContent : privacyContent}
      />
      
      {/* Help Panel Component */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={paymentHelpContent} 
      />
      
      {/* Help Button - Simple and explicit */}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 10000,
          width: '56px',
          height: '56px',
          backgroundColor: '#13273f',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: 'none'
        }}
        onClick={toggleHelpInfo}
      >
        <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>?</div>
      </div>
    </>
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#12243c] border-t-transparent mb-6 mx-auto"></div>
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
            className="bg-gradient-to-r from-[#12243c] to-[#4b3965] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#0f1e33] hover:to-[#402f56] transition-all duration-200 transform hover:scale-105 shadow-lg"
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