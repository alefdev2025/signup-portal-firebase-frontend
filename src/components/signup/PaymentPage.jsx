// File: pages/signup/PaymentPage.jsx - Responsive grid layout
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

// Test mode for payment processing
const TEST_MODE = true;

// Card Element styling to match Stripe's design
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
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

// Payment Form Component
function PaymentForm({ userData, onBack, onComplete, paymentInfo }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('ready');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saveInfo, setSaveInfo] = useState(false);

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
          name: `${userData?.contactData?.firstName || ''} ${userData?.contactData?.lastName || ''}`,
          email: userData?.contactData?.email || userData?.user?.email || '',
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
        
        {/* Back Button - Outside the main layout */}
        <div className="mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 bg-white p-3 rounded-lg shadow-sm border border-gray-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Responsive Grid Layout */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* MOBILE SECOND COLUMN: Order Summary - DESKTOP LEFT COLUMN */}
            <div className="order-2 lg:order-1 p-6 lg:p-8 bg-gray-50 lg:rounded-l-lg">
              {/* Desktop-only title section */}
              <div className="hidden lg:block space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Subscribe to Membership - {paymentInfo.frequency} - USD
                  </h2>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ${paymentInfo.discountedAmount}.00
                  </div>
                  <div className="text-gray-600">
                    per {paymentInfo.frequency.toLowerCase()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">
                        Membership - {paymentInfo.frequency} - USD
                      </div>
                      <div className="text-sm text-gray-500">
                        {paymentInfo.frequency} Membership Plan
                      </div>
                      <div className="text-sm text-gray-500">
                        Billed {paymentInfo.frequency.toLowerCase()}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">
                      ${paymentInfo.originalAmount}.00
                    </div>
                  </div>

                  {paymentInfo.hasDiscount && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-green-600">ICE Code Discount</span>
                      <span className="text-green-600 font-medium">-${paymentInfo.discount}.00</span>
                    </div>
                  )}

                  <div className="space-y-2 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">${paymentInfo.discountedAmount}.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-600">$0.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t border-gray-300">
                    <span className="text-xl font-bold text-gray-900">Total due today</span>
                    <span className="text-xl font-bold text-gray-900">${paymentInfo.discountedAmount}.00</span>
                  </div>
                </div>
              </div>

              {/* Mobile-only pricing breakdown */}
              <div className="lg:hidden mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start py-3 border-b border-gray-200">
                    <div>
                      <div className="font-medium text-gray-900">
                        Membership - {paymentInfo.frequency} - USD
                      </div>
                      <div className="text-sm text-gray-500">
                        {paymentInfo.frequency} Membership Plan
                      </div>
                      <div className="text-sm text-gray-500">
                        Billed {paymentInfo.frequency.toLowerCase()}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">
                      ${paymentInfo.originalAmount}.00
                    </div>
                  </div>

                  {paymentInfo.hasDiscount && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <span className="text-green-600">ICE Code Discount</span>
                      <span className="text-green-600 font-medium">-${paymentInfo.discount}.00</span>
                    </div>
                  )}

                  <div className="space-y-2 py-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">${paymentInfo.discountedAmount}.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-600">$0.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t border-gray-300">
                    <span className="text-xl font-bold text-gray-900">Total due today</span>
                    <span className="text-xl font-bold text-gray-900">${paymentInfo.discountedAmount}.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Payment Form - First on mobile, Right on desktop */}
            <div className="order-1 lg:order-2 p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={userData?.contactData?.email || userData?.user?.email || ''}
                      className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                      readOnly
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment method</h3>
                  
                  {/* Payment Method Tabs */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center px-4 py-3 rounded-md border text-sm font-medium transition-colors ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
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
                      className={`flex items-center justify-center px-4 py-3 rounded-md border text-sm font-medium transition-colors ${
                        paymentMethod === 'sepa'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      SEPA Direct Debit
                    </button>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card information</label>
                        <div className="border border-gray-300 rounded-md p-3 bg-white">
                          <CardElement options={cardElementOptions} />
                        </div>
                      </div>
                      
                      {TEST_MODE && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="text-sm text-yellow-700">
                              <div className="font-medium">Test mode</div>
                              <div>Use card number 4242 4242 4242 4242 with any future expiry and any 3-digit CVC.</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SEPA Payment Form */}
                  {paymentMethod === 'sepa' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={`${userData?.contactData?.firstName || ''} ${userData?.contactData?.lastName || ''}`}
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                        <input
                          type="text"
                          placeholder="DE89 3704 0044 0532 0130 00"
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={TEST_MODE}
                        />
                      </div>
                      
                      {TEST_MODE && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
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
                <div className="space-y-4">
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
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Enter your phone number to create a Link account and pay faster on Alcor and everywhere Link is accepted.
                      </p>
                      <div className="flex">
                        <select className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 text-sm">
                          <option>🇺🇸 +1</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="(201) 555-0123"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 p-2 border-t border-r border-b border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <span className="ml-2 text-sm text-gray-500 self-center">Optional</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading || (!stripe && !TEST_MODE)}
                    className="w-full bg-[#673171] text-white py-4 px-6 rounded-md font-semibold hover:bg-[#5a2a61] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Subscribe'}
                  </button>
                </div>

                {/* Terms */}
                <div className="text-xs text-gray-500 text-center leading-relaxed pt-4">
                  By confirming your subscription, you allow Alcor to charge you for future payments in accordance with their terms. You can always cancel your subscription.
                </div>
              </form>

              {/* Powered by Stripe */}
              <div className="text-center pt-6 border-t border-gray-200 mt-8">
                <div className="text-xs text-gray-400 mb-1">Powered by</div>
                <div className="text-sm font-semibold text-gray-600">stripe</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add some bottom padding to ensure all content is accessible */}
      <div style={{ height: '100px' }}></div>
    </div>
  );
}

// Main Payment Page Component
export default function PaymentPage({ userData, onBack, onComplete }) {
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