// Toggle help panel
const toggleHelpInfo = () => {
  setShowHelpInfo(prev => !prev);
};// File: pages/signup/PaymentPage.jsx - Order summary first on mobile with ICE discount
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { loadStripe } from '@stripe/stripe-js';
import {
Elements,
CardElement,
useStripe,
useElements
} from '@stripe/react-stripe-js';

// Import services
import { getContactInfo } from "../../services/contact";
import membershipService from "../../services/membership";
import { getMembershipCost } from "../../services/pricing";

// Import HelpPanel component  
import HelpPanel from "./HelpPanel";

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

// Test mode for payment processing
const TEST_MODE = true;

// Card Element styling to match Stripe's design
const cardElementOptions = {
style: {
  base: {
    fontSize: '18px',
    color: '#424770',
    lineHeight: '40px',
    '::placeholder': {
      color: '#aab7c4',
    },
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
  },
  invalid: {
    color: '#9e2146',
  },
},
hidePostalCode: false,
};

// Define help content for payment page
const paymentHelpContent = [
{
  title: "Payment Security",
  content: "All payments are processed securely through Stripe. Your information is encrypted and protected."
},
{
  title: "ICE Discount",
  content: "If you have an ICE code, your discount is applied to the first year only. Future renewals will be at the regular rate."
},
{
  title: "Payment Methods",
  content: "We accept Visa, Mastercard, American Express, Discover, and SEPA Direct Debit for European customers."
},
{
  title: "Need Help?",
  content: (
    <>
      Contact support at <a href="mailto:support@alcor.com" className="text-[#775684] hover:underline">support@alcor.com</a> or call (800) 555-1234.
    </>
  )
}
];

// Payment Form Component
function PaymentForm({ userData, onBack, onComplete, paymentInfo }) {
console.log("🟢 PaymentForm component mounting");
console.log("🟢 PaymentForm props:", { userData, onBack, onComplete, paymentInfo });

const stripe = useStripe();
const elements = useElements();
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [paymentStatus, setPaymentStatus] = useState('ready');
const [paymentMethod, setPaymentMethod] = useState('card');
const [phoneNumber, setPhoneNumber] = useState('');
const [saveInfo, setSaveInfo] = useState(false);
const [contactData, setContactData] = useState(null);
const [membershipData, setMembershipData] = useState(null);
const [pricingData, setPricingData] = useState(null);
const [isLoadingData, setIsLoadingData] = useState(true);
const [showHelpInfo, setShowHelpInfo] = useState(false);

// Load contact data and membership data on mount
useEffect(() => {
  console.log("PaymentForm: useEffect triggered, loading data...");
  console.log("PaymentForm: Initial userData:", userData);
  
  const loadData = async () => {
    try {
      setIsLoadingData(true);
      console.log("PaymentForm: Starting to load data from APIs...");
      
      // 1. Load contact data
      try {
        const contactResult = await getContactInfo();
        console.log("PaymentForm: getContactInfo result:", contactResult);
        
        if (contactResult.success && contactResult.contactInfo) {
          setContactData(contactResult.contactInfo);
          console.log("PaymentForm: ✅ Contact data loaded successfully:", contactResult.contactInfo);
          console.log("PaymentForm: Email from API:", contactResult.contactInfo.email);
        } else {
          console.log("PaymentForm: ⚠️ Contact API failed, using fallback");
          const fallbackData = userData?.contactData || userData || {};
          setContactData(fallbackData);
        }
      } catch (err) {
        console.error("PaymentForm: ❌ Error loading contact data:", err);
        const fallbackData = userData?.contactData || userData || {};
        setContactData(fallbackData);
      }

      // 2. Load membership data (includes ICE code info)
      try {
        const membershipResult = await membershipService.getMembershipInfo();
        console.log("PaymentForm: getMembershipInfo result:", membershipResult);
        
        if (membershipResult.success && membershipResult.data) {
          setMembershipData(membershipResult.data.membershipInfo);
          console.log("PaymentForm: ✅ Membership data loaded:", membershipResult.data.membershipInfo);
        } else {
          console.log("PaymentForm: ⚠️ Membership API failed, using fallback");
          setMembershipData(userData?.membershipData || {});
        }
      } catch (err) {
        console.error("PaymentForm: ❌ Error loading membership data:", err);
        setMembershipData(userData?.membershipData || {});
      }

      // 3. Load pricing data
      try {
        const pricingResult = await getMembershipCost();
        console.log("PaymentForm: getMembershipCost result:", pricingResult);
        
        if (pricingResult?.success) {
          setPricingData({
            membershipCost: pricingResult.membershipCost || 540,
            age: pricingResult.age,
            annualDues: pricingResult.annualDues
          });
          console.log("PaymentForm: ✅ Pricing data loaded:", pricingResult);
        } else {
          console.log("PaymentForm: ⚠️ Pricing API failed, using fallback");
          setPricingData(userData?.pricingData || { membershipCost: 540 });
        }
      } catch (err) {
        console.error("PaymentForm: ❌ Error loading pricing data:", err);
        setPricingData(userData?.pricingData || { membershipCost: 540 });
      }
      
    } catch (err) {
      console.error("PaymentForm: ❌ General error loading data:", err);
    } finally {
      setIsLoadingData(false);
      console.log("PaymentForm: Data loading complete");
    }
  };
  
  loadData();
}, [userData]);

// Debug logging
console.log("PaymentForm render - contactData:", contactData);
console.log("PaymentForm render - membershipData:", membershipData);
console.log("PaymentForm render - pricingData:", pricingData);
console.log("PaymentForm render - isLoadingData:", isLoadingData);
console.log("PaymentForm render - email value:", contactData?.email);
console.log("PaymentForm render - showHelpInfo:", showHelpInfo);

// Force scroll on mount and status changes
useEffect(() => {
  window.scrollTo(0, 0);
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
  
  return () => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  };
}, [paymentStatus]);

// Calculate payment info based on loaded data
const calculatePaymentInfo = () => {
  if (!membershipData || !pricingData) {
    return paymentInfo; // Fallback to props
  }

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

  // Calculate ICE discount
  let iceDiscount = 0;
  if (hasIceDiscount && membershipData.iceCodeInfo) {
    // Use the discount percent from the ICE code info, default to 25%
    const discountPercent = membershipData.iceCodeInfo.discountPercent || 25;
    iceDiscount = Math.round(baseCost * (discountPercent / 100));
    
    // Apply discount proportionally based on payment frequency
    if (paymentFrequency === 'monthly') {
      iceDiscount = Math.round(iceDiscount / 12);
    } else if (paymentFrequency === 'quarterly') {
      iceDiscount = Math.round(iceDiscount / 4);
    }
  }

  const discountedAmount = Math.max(0, amount - iceDiscount);
  
  return {
    originalAmount: amount,
    discountedAmount,
    discount: iceDiscount,
    frequency,
    hasDiscount: hasIceDiscount,
    iceCodeInfo: membershipData.iceCodeInfo,
    iceCode: membershipData.iceCode
  };
};

const currentPaymentInfo = calculatePaymentInfo();

// Toggle help panel
const toggleHelpInfo = () => {
  setShowHelpInfo(prev => !prev);
};

// Handle test payment
const handleTestPayment = async () => {
  console.log('🧪 TEST MODE: Simulating payment processing');
  setPaymentStatus('processing');
  setIsLoading(true);
  
  setTimeout(() => {
    setPaymentStatus('completed');
    setIsLoading(false);
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);
  }, 2000);
};

// Handle real Stripe payment
const handleStripePayment = async () => {
  if (!stripe || !elements) {
    return;
  }

  setIsLoading(true);
  setError(null);
  setPaymentStatus('processing');

  const cardElement = elements.getElement(CardElement);

  try {
    const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: `${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim(),
        email: contactData?.email || '',
        phone: phoneNumber,
      },
    });

    if (paymentMethodError) {
      throw new Error(paymentMethodError.message);
    }

    console.log('Payment method created:', paymentMethod);
    
    setPaymentStatus('completed');
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);

  } catch (err) {
    console.error('Payment error:', err);
    setError(err.message || 'Payment processing failed');
    setPaymentStatus('error');
  } finally {
    setIsLoading(false);
  }
};

const handleSubmit = async (event) => {
  event.preventDefault();
  
  if (TEST_MODE) {
    handleTestPayment();
  } else {
    handleStripePayment();
  }
};

// Processing state
if (paymentStatus === 'processing') {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'auto'
      }}
    >
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#673171] mb-8"></div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Processing Your Payment
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed text-center px-4">
        {TEST_MODE 
          ? 'Simulating payment processing...' 
          : 'Please wait while we process your payment securely...'
        }
      </p>
    </div>
  );
}

// Completed state
if (paymentStatus === 'completed') {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'auto'
      }}
    >
      <div className="bg-green-500 rounded-full p-4 mb-8">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">
        Payment Successful!
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed text-center px-4">
        Your payment has been processed successfully.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-4">
        <div className="flex items-center text-green-800">
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-xl">
            Welcome to Alcor! Your membership is now active.
          </span>
        </div>
      </div>
    </div>
  );
}

// Format currency for display
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "$0";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

return (
  <div 
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      overflow: 'auto',
      zIndex: 1
    }}
  >
    <div style={{ padding: '1rem', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Simple header - no back button */}
      <div className="mb-6">
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#775684]"></div>
          <p className="mt-4 text-xl text-gray-600">Loading payment information...</p>
        </div>
      )}

      {/* Main Content - Only show when data is loaded */}
      {!isLoadingData && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* MOBILE FIRST COLUMN: Order Summary - DESKTOP LEFT COLUMN */}
            <div className="order-1 lg:order-1 p-6 lg:p-8 bg-gray-50 lg:rounded-l-lg relative">
              {/* A Logo - Top Left Corner with proper padding */}
              <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
                <img 
                  src="/src/assets/images/navy-a-logo.png" 
                  alt="Alcor Logo" 
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Desktop-only title section */}
              <div className="hidden lg:block space-y-12 pt-20">
                <div>
                  <h2 className="text-lg mb-6" style={{ color: '#9ca3af' }}>
                    Subscribe to Membership - {currentPaymentInfo.frequency} - USD
                  </h2>
                  <div className="text-5xl font-bold text-gray-900 mb-4">
                    {formatCurrency(currentPaymentInfo.discountedAmount)}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
                    per {currentPaymentInfo.frequency.toLowerCase()}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-start py-6 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900 text-lg">
                        Membership - {currentPaymentInfo.frequency} - USD
                      </div>
                      <div className="text-base text-gray-500 mt-2">
                        {currentPaymentInfo.frequency} Membership Plan
                      </div>
                      <div className="text-base text-gray-500">
                        Billed {currentPaymentInfo.frequency.toLowerCase()}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900 text-lg">
                      {formatCurrency(currentPaymentInfo.originalAmount)}
                    </div>
                  </div>

                  {/* ICE Code Discount Row - Always show */}
                  <div className="flex justify-between items-center py-6 border-b border-gray-200">
                    <div className="flex-1">
                      {currentPaymentInfo.hasDiscount ? (
                        <>
                          <span className="text-[#673171] font-medium text-lg">
                            ICE Code Discount ({currentPaymentInfo.iceCode})
                          </span>
                          <div className="text-sm text-[#673171] mt-2">
                            First year only
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500 text-lg">ICE Code Discount</span>
                      )}
                    </div>
                    <span className={`font-medium text-lg ${currentPaymentInfo.hasDiscount ? 'text-[#673171]' : 'text-gray-400'}`}>
                      {currentPaymentInfo.hasDiscount ? `-${formatCurrency(currentPaymentInfo.discount)}` : '$0'}
                    </span>
                  </div>

                  <div className="space-y-4 py-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">Subtotal</span>
                      <span className="text-gray-900 text-lg">{formatCurrency(currentPaymentInfo.discountedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">Tax</span>
                      <span className="text-gray-600 text-lg">$0.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-8 border-t border-gray-300">
                    <span className="text-2xl font-bold text-gray-900">Total due today</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentPaymentInfo.discountedAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Mobile-only pricing breakdown */}
              <div className="lg:hidden pt-20">
                <h3 className="text-xl font-bold text-gray-900 mb-8">Order Summary</h3>
                <div className="space-y-8">
                  <div className="flex justify-between items-start py-6 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900 text-lg">
                        Membership - {currentPaymentInfo.frequency} - USD
                      </div>
                      <div className="text-base text-gray-500 mt-2">
                        {currentPaymentInfo.frequency} Membership Plan
                      </div>
                      <div className="text-base text-gray-500">
                        Billed {currentPaymentInfo.frequency.toLowerCase()}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900 text-lg">
                      {formatCurrency(currentPaymentInfo.originalAmount)}
                    </div>
                  </div>

                  {/* ICE Code Discount Row - Always show on mobile */}
                  <div className="flex justify-between items-center py-6 border-b border-gray-200">
                    <div className="flex-1">
                      {currentPaymentInfo.hasDiscount ? (
                        <>
                          <span className="text-[#673171] font-medium text-lg">
                            ICE Code Discount ({currentPaymentInfo.iceCode})
                          </span>
                          <div className="text-sm text-[#673171] mt-2">
                            First year only
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500 text-lg">ICE Code Discount</span>
                      )}
                    </div>
                    <span className={`font-medium text-lg ${currentPaymentInfo.hasDiscount ? 'text-[#673171]' : 'text-gray-400'}`}>
                      {currentPaymentInfo.hasDiscount ? `-${formatCurrency(currentPaymentInfo.discount)}` : '$0'}
                    </span>
                  </div>

                  <div className="space-y-4 py-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">Subtotal</span>
                      <span className="text-gray-900 text-lg">{formatCurrency(currentPaymentInfo.discountedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-lg">Tax</span>
                      <span className="text-gray-600 text-lg">$0.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-8 border-t border-gray-300">
                    <span className="text-2xl font-bold text-gray-900">Total due today</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(currentPaymentInfo.discountedAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Payment Form - Second on mobile, Right on desktop - WITH SPACING FIX */}
            <div className="order-2 lg:order-2" style={{
              padding: '1.5rem',
              paddingTop: '7rem',
              paddingBottom: '2rem'
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Contact Information */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '1rem'
                  }}>
                    Contact information
                  </h3>
                  <div className="flex border border-gray-300 rounded-md bg-white overflow-hidden">
                    <div style={{
                      backgroundColor: '#f3f4f6',
                      padding: '1rem 1.25rem',
                      borderRight: '1px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span className="text-sm font-medium text-gray-700">Email</span>
                    </div>
                    <input
                      type="email"
                      value={contactData?.email || ''}
                      style={{
                        flex: 1,
                        padding: '1rem 1.25rem',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        color: '#111827',
                        border: 'none',
                        outline: 'none'
                      }}
                      readOnly
                      placeholder={isLoadingData ? "Loading..." : "Email address"}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ margin: '1rem 0' }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '600', 
                    color: '#111827',
                    marginBottom: '1rem'
                  }}>
                    Payment method
                  </h3>
                  
                  {/* Payment Method Tabs */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                    gap: '0.75rem', 
                    marginBottom: '1.5rem' 
                  }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.375rem',
                        border: `1px solid ${paymentMethod === 'card' ? '#3b82f6' : '#d1d5db'}`,
                        backgroundColor: paymentMethod === 'card' ? '#eff6ff' : 'white',
                        color: paymentMethod === 'card' ? '#1d4ed8' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '3.5rem'
                      }}
                      onMouseOver={(e) => {
                        if (paymentMethod !== 'card') {
                          e.target.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (paymentMethod !== 'card') {
                          e.target.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Card
                      <div className="ml-2 flex space-x-1">
                        <div className="w-5 h-3 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                        <div className="w-5 h-3 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                        <div className="w-5 h-3 bg-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                        <div className="w-5 h-3 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">D</div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('sepa')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.375rem',
                        border: `1px solid ${paymentMethod === 'sepa' ? '#3b82f6' : '#d1d5db'}`,
                        backgroundColor: paymentMethod === 'sepa' ? '#eff6ff' : 'white',
                        color: paymentMethod === 'sepa' ? '#1d4ed8' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '3.5rem'
                      }}
                      onMouseOver={(e) => {
                        if (paymentMethod !== 'sepa') {
                          e.target.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (paymentMethod !== 'sepa') {
                          e.target.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      SEPA Direct Debit
                    </button>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === 'card' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.75rem'
                        }}>
                          Card information
                        </label>
                        <div style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          padding: '1.25rem',
                          backgroundColor: 'white',
                          minHeight: '4rem'
                        }}>
                          <CardElement options={cardElementOptions} />
                        </div>
                      </div>
                      
                      {TEST_MODE && (
                        <div style={{
                          backgroundColor: '#fefce8',
                          border: '1px solid #fde047',
                          borderRadius: '0.375rem',
                          padding: '1rem',
                          marginTop: '1rem'
                        }}>
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="text-sm text-yellow-700">
                              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Test mode</div>
                              <div>Use card number 4242 4242 4242 4242 with any future expiry and any 3-digit CVC.</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SEPA Payment Form */}
                  {paymentMethod === 'sepa' && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.75rem'
                        }}>
                          Name
                        </label>
                        <input
                          type="text"
                          value={`${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim()}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            backgroundColor: 'white',
                            color: '#111827'
                          }}
                          readOnly
                          placeholder={isLoadingData ? "Loading..." : "Full name"}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.75rem'
                        }}>
                          IBAN
                        </label>
                        <input
                          type="text"
                          placeholder="DE89 3704 0044 0532 0130 00"
                          style={{
                            width: '100%',
                            padding: '1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                          disabled={TEST_MODE}
                        />
                      </div>
                      
                      {TEST_MODE && (
                        <div style={{
                          backgroundColor: '#fefce8',
                          border: '1px solid #fde047',
                          borderRadius: '0.375rem',
                          padding: '1rem',
                          marginTop: '1rem'
                        }}>
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm text-yellow-700">Test mode - no real payment will be processed</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Save Information */}
                <div>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="save-info"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="save-info" className="ml-3 text-sm text-gray-700">
                      Securely save my information for 1-click checkout
                    </label>
                  </div>
                  
                  {saveInfo && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <p style={{ 
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '1rem'
                      }}>
                        Enter your phone number to create a Link account and pay faster on Alcor and everywhere Link is accepted.
                      </p>
                      <div className="flex">
                        <select style={{
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem 0 0 0.375rem',
                          backgroundColor: '#f9fafb',
                          color: '#6b7280',
                          fontSize: '0.875rem'
                        }}>
                          <option>🇺🇸 +1</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="(201) 555-0123"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderTop: '1px solid #d1d5db',
                            borderRight: '1px solid #d1d5db',
                            borderBottom: '1px solid #d1d5db',
                            borderRadius: '0 0.375rem 0.375rem 0',
                            fontSize: '0.875rem'
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-500 self-center">Optional</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.375rem',
                    padding: '1rem',
                    margin: '1rem 0'
                  }}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    type="submit"
                    disabled={isLoading || (!stripe && !TEST_MODE)}
                    style={{
                      width: '100%',
                      backgroundColor: isLoading || (!stripe && !TEST_MODE) ? '#9ca3af' : '#673171',
                      color: 'white',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '9999px',
                      fontWeight: '600',
                      cursor: isLoading || (!stripe && !TEST_MODE) ? 'not-allowed' : 'pointer',
                      border: 'none',
                      transition: 'background-color 0.2s',
                      minHeight: '3.5rem',
                      fontSize: '1rem'
                    }}
                    onMouseOver={(e) => {
                      if (!isLoading && (stripe || TEST_MODE)) {
                        e.target.style.backgroundColor = '#5a2a61';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isLoading && (stripe || TEST_MODE)) {
                        e.target.style.backgroundColor = '#673171';
                      }
                    }}
                  >
                    {isLoading ? 'Processing...' : 'Subscribe'}
                  </button>
                </div>

                {/* Terms */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  textAlign: 'center',
                  lineHeight: '1.6',
                  paddingTop: '0.75rem'
                }}>
                  By confirming your subscription, you allow Alcor to charge you for future payments in accordance with their terms. You can always cancel your subscription.
                </div>
              </form>

              {/* Powered by Stripe */}
              <div style={{
                textAlign: 'center',
                paddingTop: '1rem',
                marginTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Powered by</div>
                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#4b5563' }}>stripe</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
    {/* Add some bottom padding to ensure all content is accessible */}
    <div style={{ height: '100px' }}></div>

    {/* Help Panel - Using reusable component */}
    {console.log("About to render HelpPanel, showHelpInfo:", showHelpInfo)}
    <HelpPanel 
      showHelpInfo={showHelpInfo} 
      toggleHelpInfo={toggleHelpInfo} 
      helpItems={paymentHelpContent} 
    />
  </div>
);
}

// Main Payment Page Component
export default function PaymentPage({ userData, onBack, onComplete }) {
console.log("🔵 PaymentPage component mounting");
console.log("🔵 PaymentPage userData:", userData);

// Calculate payment amounts
const getPaymentInfo = () => {
  const membershipCost = userData?.pricingData?.membershipCost || 540;
  const paymentFrequency = userData?.membershipData?.paymentFrequency || 'annually';
  const iceDiscount = userData?.membershipData?.iceDiscount || 0;
  
  let amount = membershipCost;
  let frequency = 'Annual';
  
  if (paymentFrequency === 'monthly') {
    amount = Math.round(membershipCost / 12);
    frequency = 'Monthly';
  } else if (paymentFrequency === 'quarterly') {
    amount = Math.round(membershipCost / 4);
    frequency = 'Quarterly';
  }
  
  const discountedAmount = Math.max(0, amount - iceDiscount);
  
  return {
    originalAmount: amount,
    discountedAmount,
    discount: iceDiscount,
    frequency,
    hasDiscount: iceDiscount > 0
  };
};

const paymentInfo = getPaymentInfo();
console.log("🔵 PaymentPage paymentInfo:", paymentInfo);

console.log("🔵 PaymentPage rendering Elements wrapper");
return (
  <Elements stripe={stripePromise}>
    <PaymentForm 
      userData={userData}
      onBack={onBack}
      onComplete={onComplete}
      paymentInfo={paymentInfo}
    />
  </Elements>
);
}