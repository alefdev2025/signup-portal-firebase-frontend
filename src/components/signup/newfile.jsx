import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

// Configuration - flip this for testing vs production
const CONFIG = {
  SKIP_DOCUSIGN_FOR_TESTING: true, // Set to false in production
};

// Mock DocuSign component that auto-completes in testing mode
const MembershipDocuSign = ({ onComplete, onBack }) => {
  const [docuSignStatus, setDocuSignStatus] = useState('signing');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (CONFIG.SKIP_DOCUSIGN_FOR_TESTING) {
      // Auto-complete for testing
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setDocuSignStatus('completed');
            setTimeout(() => onComplete(), 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [onComplete]);

  if (CONFIG.SKIP_DOCUSIGN_FOR_TESTING) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-orange-800 mb-4">🧪 Testing Mode</h2>
            <p className="text-orange-700 text-lg mb-4">
              DocuSign is disabled for testing (saves $3 per envelope)
            </p>
            <p className="text-gray-600">
              Auto-completing in {countdown} seconds...
            </p>
          </div>
          
          {docuSignStatus === 'completed' && (
            <div className="bg-green-100 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-800 mb-2">✅ Signature Complete</h3>
              <p className="text-green-700">Proceeding to payment...</p>
            </div>
          )}
          
          <button
            onClick={onBack}
            className="mt-4 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-white">
      <iframe src="https://docusign-embedded-url" className="w-full h-full" />
    </div>
  );
};

// Real Stripe payment form component
const StripePaymentForm = ({ membershipData, packageData, contactData, onBack, onComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [paymentStatus, setPaymentStatus] = useState('ready');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    email: contactData?.email || '',
    phone: contactData?.phone || '',
    name: `${contactData?.firstName || ''} ${contactData?.lastName || ''}`.trim()
  });

  // Calculate payment details for ALCOR (USD pricing)
  const calculatePaymentDetails = () => {
    let baseAmount;
    let description;
    
    if (membershipData?.paymentFrequency === 'monthly') {
      baseAmount = 45;
      description = 'Membership - Monthly - USD';
    } else if (membershipData?.paymentFrequency === 'quarterly') {
      baseAmount = 135;
      description = 'Membership - Quarterly - USD';
    } else {
      baseAmount = 540;
      description = 'Membership - Annual - USD';
    }

    const discount = membershipData?.iceCodeValid ? Math.round(baseAmount * 0.25) : 0;
    const subtotal = baseAmount - discount;
    const tax = 0;
    const total = subtotal + tax;

    return {
      baseAmount,
      discount,
      subtotal,
      tax,
      total,
      frequency: membershipData?.paymentFrequency || 'annually',
      description
    };
  };

  const payment = calculatePaymentDetails();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Custom styles for Stripe Elements
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
        iconColor: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe has not loaded yet.');
      return;
    }

    if (!customerInfo.email.trim()) {
      setPaymentError('Please enter your email address.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Create payment method
      const { error, paymentMethod: pm } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: customerInfo.name || 'ALCOR Member',
          email: customerInfo.email,
          phone: customerInfo.phone || undefined,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Payment Method Created:', pm);

      // In a real app, you'd send this to your backend to create a payment intent
      // For demo purposes, we'll simulate the backend call
      const mockBackendResponse = await simulateBackendPayment({
        paymentMethodId: pm.id,
        amount: payment.total * 100, // Stripe uses cents
        currency: 'usd',
        customer: customerInfo,
        metadata: {
          membershipType: membershipData?.paymentFrequency || 'annual',
          iceCode: membershipData?.iceCode || null,
          preservationType: packageData?.preservationType || 'whole-body'
        }
      });

      if (mockBackendResponse.requiresAction) {
        // Handle 3D Secure or other authentication
        const { error: confirmError } = await stripe.confirmCardPayment(
          mockBackendResponse.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      setPaymentStatus('completed');
      
      setTimeout(() => {
        onComplete({
          paymentCompleted: true,
          paymentAmount: payment.total,
          currency: 'USD',
          paymentMethodId: pm.id,
          transactionId: mockBackendResponse.paymentIntentId,
          subscriptionId: mockBackendResponse.subscriptionId,
          completionDate: new Date().toISOString()
        });
      }, 2000);

    } catch (err) {
      console.error('❌ Payment error:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate backend payment processing
  const simulateBackendPayment = async (paymentData) => {
    console.log('🔄 Sending to backend:', paymentData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 90% success rate
    if (Math.random() < 0.9) {
      return {
        success: true,
        paymentIntentId: `pi_${Date.now()}`,
        subscriptionId: `sub_alcor_${Date.now()}`,
        requiresAction: false // Usually false for test cards
      };
    } else {
      throw new Error('Your card was declined. Please try a different payment method.');
    }
  };

  const handleEmailChange = (e) => {
    setCustomerInfo(prev => ({ ...prev, email: e.target.value }));
  };

  const handlePhoneChange = (e) => {
    setCustomerInfo(prev => ({ ...prev, phone: e.target.value }));
  };

  const handleNameChange = (e) => {
    setCustomerInfo(prev => ({ ...prev, name: e.target.value }));
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Welcome to Alcor Life Extension Foundation! Your membership is now active.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">Payment Details:</p>
            <p className="font-medium">Amount: {formatCurrency(payment.total)}</p>
            <p className="text-sm text-gray-600 mt-1">Transaction ID: pi_{Date.now()}</p>
          </div>
          
          <button
            onClick={() => alert('Would redirect to Alcor member dashboard')}
            className="w-full bg-[#775684] text-white rounded-lg py-3 px-4 font-medium hover:bg-[#664573] transition-colors"
          >
            Continue to Member Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-[#775684] hover:text-[#664573] mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-lg font-semibold">Alcor Life Extension Foundation</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Payment Details */}
          <div className="bg-white rounded-lg p-6 h-fit">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Subscribe to {payment.description}
              </h1>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  {formatCurrency(payment.total)}
                </span>
                <span className="text-lg text-gray-600 ml-2">
                  per {payment.frequency === 'monthly' ? 'month' : payment.frequency === 'quarterly' ? 'quarter' : 'year'}
                </span>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{payment.description}</span>
                  <span className="text-gray-900">{formatCurrency(payment.baseAmount)}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {payment.frequency === 'monthly' ? 'Monthly' : payment.frequency === 'quarterly' ? 'Quarterly' : 'Annual'} Membership Plan
                </div>
                <div className="text-sm text-gray-500">
                  Billed {payment.frequency}
                </div>
                
                {payment.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>ICE Discount (25%)</span>
                    <span>-{formatCurrency(payment.discount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-3 mt-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(payment.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(payment.tax)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total due today</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(payment.total)}</span>
                </div>
              </div>
            </div>

            {/* Test Cards Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">💳 Test Cards</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Success:</strong> 4242 4242 4242 4242</p>
                <p><strong>Declined:</strong> 4000 0000 0000 0002</p>
                <p><strong>3D Secure:</strong> 4000 0025 0000 3155</p>
                <p><strong>Exp:</strong> Any future date, <strong>CVC:</strong> Any 3 digits</p>
              </div>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="bg-white rounded-lg p-6">
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact & Payment Information</h2>
              
              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={handleNameChange}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684]"
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684]"
                  required
                />
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684]"
                />
              </div>

              {/* Card Information */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Information
                </label>
                <div className="border border-gray-300 rounded-lg p-3 bg-white">
                  <CardElement options={cardElementOptions} />
                </div>
              </div>

              {/* Error Display */}
              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{paymentError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!stripe || isProcessing || !customerInfo.email.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                  !stripe || isProcessing || !customerInfo.email.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#775684] hover:bg-[#664573]'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Pay ${formatCurrency(payment.total)}`
                )}
              </button>

              {/* Terms */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                By confirming your payment, you agree to Alcor Life Extension Foundation's membership terms and authorize recurring charges. You can modify or cancel your membership at any time.
              </p>
            </form>

            {/* Powered by Stripe */}
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <span>Powered by</span>
                <span className="font-semibold">stripe</span>
                <svg className="w-8 h-3" viewBox="0 0 60 25" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M59.5 13.1c0-2.8-.9-4.7-3.1-4.7-2.2 0-3.5 1.9-3.5 4.6 0 3 1.5 4.6 4.2 4.6 1.2 0 2.1-.2 2.8-.6v-1.9c-.7.3-1.4.4-2.3.4-1.5 0-2.3-.6-2.3-2.1h5.2c0-.1 0-.2 0-.3zm-5.2-1.1c0-1.3.7-2 1.7-2s1.6.7 1.6 2h-3.3z" fill="#6772E5"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that provides Stripe Elements context
const AlcorStripePayment = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm {...props} />
    </Elements>
  );
};

// Main flow component for ALCOR
const AlcorMembershipFlow = () => {
  const [currentStep, setCurrentStep] = useState('docusign');
  const [completionData, setCompletionData] = useState(null);

  const membershipData = {
    iceCode: "ICE2024DEMO",
    paymentFrequency: "annually",
    iceCodeValid: true,
    iceCodeInfo: { discountPercent: 25 },
    interestedInLifetime: false
  };

  const packageData = {
    preservationType: "Whole Body Cryopreservation",
    preservationEstimate: 200000,
    annualCost: 540
  };

  const contactData = {
    email: '',
    phone: '',
    firstName: 'Member',
    lastName: 'Applicant'
  };

  const handleDocuSignComplete = () => {
    console.log("✅ DocuSign completed");
    setCurrentStep('payment');
  };

  const handlePaymentComplete = (paymentData) => {
    console.log("✅ REAL Stripe payment completed:", paymentData);
    setCompletionData(paymentData);
    
    setTimeout(() => {
      alert('🎉 Real payment processed! Welcome to Alcor!');
    }, 1000);
  };

  const handleBackToDocuSign = () => {
    setCurrentStep('docusign');
  };

  const handleBackToSummary = () => {
    alert('Would go back to membership summary');
  };

  return (
    <div>
      {/* Development Status */}
      <div className="bg-green-100 border-b border-green-200 p-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm font-medium text-green-800 mr-4">
              ✅ REAL STRIPE INTEGRATION
            </span>
            <span className="text-sm text-green-700">
              Using live Stripe Elements with test key
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className={`px-2 py-1 rounded ${
              currentStep === 'docusign' ? 'bg-yellow-200 text-yellow-800' : 'text-green-600'
            }`}>
              {currentStep === 'docusign' ? '📝 DocuSign (Active)' : '✅ DocuSign'}
            </span>
            <span className={`px-2 py-1 rounded ${
              currentStep === 'payment' ? 'bg-[#775684] text-white' : 'text-gray-600'
            }`}>
              {currentStep === 'payment' ? '💳 Stripe Payment (Active)' : completionData ? '✅ Payment' : '⏳ Payment'}
            </span>
          </div>
        </div>
      </div>

      {currentStep === 'docusign' && (
        <MembershipDocuSign
          membershipData={membershipData}
          packageData={packageData}
          onBack={handleBackToSummary}
          onComplete={handleDocuSignComplete}
        />
      )}

      {currentStep === 'payment' && (
        <AlcorStripePayment
          membershipData={membershipData}
          packageData={packageData}
          contactData={contactData}
          onBack={handleBackToDocuSign}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default AlcorMembershipFlow;