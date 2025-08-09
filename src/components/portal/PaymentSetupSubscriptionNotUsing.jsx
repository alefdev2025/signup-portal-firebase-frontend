// components/portal/PaymentSetup.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createStripeAutopaySubscription } from '../../services/stripeAutopaySubscriptionNotUsing';
import { updateStripeAutopay } from '../../services/payment';
import { useCustomerData } from './contexts/CustomerDataContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentSetupForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshAllData } = useCustomerData();
  const { salesforceCustomer, netsuiteCustomerId } = useMemberPortal();
  
  const { billingSchedule, customerId, stripeCustomerId, returnUrl, estimatedAmount } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('payment'); // 'payment' or 'confirmation'
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [paymentMethodDetails, setPaymentMethodDetails] = useState(null);
  const [billingDetails, setBillingDetails] = useState({
    name: salesforceCustomer?.name || '',
    email: salesforceCustomer?.email || '',
    phone: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  useEffect(() => {
    // Retrieve setup data from session storage if needed
    const setupData = sessionStorage.getItem('autopaySetup');
    if (setupData && (!customerId || !billingSchedule)) {
      const parsed = JSON.parse(setupData);
      // Navigate with the parsed data
      navigate(location.pathname, {
        state: {
          ...parsed,
          returnUrl: returnUrl || '/portal/payment-methods'
        }
      });
    }
  }, [customerId, billingSchedule, navigate, location.pathname, returnUrl]);

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
  
    // Validate form
    if (!billingDetails.name || !billingDetails.email) {
      setError('Please fill in all required fields');
      return;
    }
  
    if (!cardComplete) {
      setError('Please complete your card information');
      return;
    }
  
    setIsProcessing(true);
    setError(null);
  
    try {
      // Step 1: Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone || undefined,
          address: billingDetails.address.line1 ? {
            line1: billingDetails.address.line1,
            city: billingDetails.address.city,
            state: billingDetails.address.state,
            postal_code: billingDetails.address.postal_code,
            country: billingDetails.address.country
          } : undefined
        }
      });
  
      if (pmError) {
        throw new Error(pmError.message);
      }
  
      console.log('Payment method created:', paymentMethod.id);
      
      // Store the payment method ID and details
      setPaymentMethodId(paymentMethod.id);
      setPaymentMethodDetails(paymentMethod);
  
      // Show confirmation step AND stop the loading state
      setStep('confirmation');
      setIsProcessing(false);
  
    } catch (error) {
      console.error('Error setting up payment method:', error);
      setError(error.message || 'Failed to set up payment method. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleConfirmAutopay = async () => {
    setIsProcessing(true);
    setError(null);
  
    try {
      if (!paymentMethodId) {
        throw new Error('Payment method not found. Please go back and try again.');
      }
  
      // Set a start date 1 year in the future to avoid any timezone BS
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
  
      const subscriptionResult = await createStripeAutopaySubscription({
        customerId: netsuiteCustomerId || customerId,
        paymentMethodId: paymentMethodId,
        billingSchedule: 'ANNUAL',
        amount: estimatedAmount || calculateAmount('ANNUAL'),
        startDate: futureDate.toISOString() // 1 year from now - definitely future!
      });
  
      if (!subscriptionResult.success) {
        throw new Error(subscriptionResult.error || 'Failed to create subscription');
      }
  
      console.log('Subscription created:', subscriptionResult.subscription);
  
      // Update NetSuite customer with Stripe fields
      const netsuiteUpdateResult = await updateStripeAutopay(
        netsuiteCustomerId || customerId,
        true, // Enable autopay
        {
          syncLegacy: false, // Don't sync with legacy autopay
          paymentMethodId: paymentMethodId
        }
      );
  
      if (!netsuiteUpdateResult.success) {
        console.error('Failed to update NetSuite:', netsuiteUpdateResult.error);
        // Don't fail the whole process if NetSuite update fails
      }
  
      // Refresh customer data
      await refreshAllData();
  
      // Clear session storage
      sessionStorage.removeItem('autopaySetup');
  
      // Navigate back with success message
      navigate(returnUrl || '/portal/payment-methods', {
        state: { 
          success: true, 
          message: 'Autopay successfully enabled!',
          subscriptionId: subscriptionResult.subscription.id
        }
      });
      
    } catch (error) {
      console.error('Error enabling autopay:', error);
      setError(error.message || 'Failed to enable autopay. Please try again.');
      setIsProcessing(false);
      setStep('payment'); // Go back to payment step
    }
  };

  const calculateAmount = (schedule) => {
    // This should match your actual pricing logic
    const baseAmount = 150000; // $1,500 in cents
    
    switch (schedule) {
      case 'MONTHLY':
        return Math.round(baseAmount / 12);
      case 'QUARTERLY':
        return Math.round(baseAmount / 4);
      case 'ANNUAL':
        return baseAmount;
      default:
        return baseAmount;
    }
  };

  const formatAmount = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getScheduleLabel = (schedule) => {
    const labels = {
      'MONTHLY': 'Monthly',
      'QUARTERLY': 'Quarterly',
      'ANNUAL': 'Annual'
    };
    return labels[schedule] || schedule;
  };

  if (step === 'confirmation') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Autopay Enrollment</h3>
          <p className="text-gray-600">You're about to enable automatic payments for your membership.</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Payment Method:</span>
            <span className="font-medium">•••• {paymentMethodDetails?.card?.last4 || 'Card'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Billing Schedule:</span>
            <span className="font-medium">{getScheduleLabel(billingSchedule)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">{formatAmount(estimatedAmount || calculateAmount(billingSchedule))} per {billingSchedule?.toLowerCase() || 'period'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Next Payment:</span>
            <span className="font-medium">Today</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your first payment will be processed immediately</li>
            <li>• Future payments will be automatic on your billing schedule</li>
            <li>• You'll receive email receipts for each payment</li>
            <li>• You can cancel or update your payment method anytime</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep('payment')}
            className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            disabled={isProcessing}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirmAutopay}
            disabled={isProcessing}
            className="flex-1 bg-[#6b5b7e] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a4a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enabling Autopay...
              </>
            ) : (
              'Confirm & Enable Autopay'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name on Card <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
              value={billingDetails.name}
              onChange={(e) => setBillingDetails({...billingDetails, name: e.target.value})}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
              value={billingDetails.email}
              onChange={(e) => setBillingDetails({...billingDetails, email: e.target.value})}
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone (Optional)
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
            value={billingDetails.phone}
            onChange={(e) => setBillingDetails({...billingDetails, phone: e.target.value})}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details <span className="text-red-500">*</span>
          </label>
          <div className="px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#6b5b7e] focus-within:border-transparent">
            <CardElement 
              options={CARD_ELEMENT_OPTIONS} 
              onChange={handleCardChange}
            />
          </div>
          {process.env.NODE_ENV === 'development' && (
            <p className="mt-2 text-xs text-gray-500">
              Test card: 4242 4242 4242 4242, any future expiry, any CVC
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Autopay Details</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p><span className="font-medium">Billing Schedule:</span> {getScheduleLabel(billingSchedule)}</p>
          <p><span className="font-medium">Amount:</span> {formatAmount(estimatedAmount || calculateAmount(billingSchedule))} per {billingSchedule?.toLowerCase() || 'period'}</p>
          <p className="mt-2">Your first payment will be processed immediately upon enrollment.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => navigate(returnUrl || '/portal/payment-methods')}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing || !cardComplete || !billingDetails.name || !billingDetails.email}
          className="flex-1 bg-[#6b5b7e] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a4a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

const PaymentSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { billingSchedule } = location.state || {};

  // Validate that we have the required data
  useEffect(() => {
    if (!billingSchedule) {
      // Check session storage
      const setupData = sessionStorage.getItem('autopaySetup');
      if (!setupData) {
        // Redirect back if no data
        navigate('/portal/payment-methods', {
          state: { error: 'Missing billing information. Please try again.' }
        });
      }
    }
  }, [billingSchedule, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#6b5b7e] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Set Up Autopay</h1>
            <p className="text-gray-600">
              Enter your payment details to enable automatic billing
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentSetupForm />
          </Elements>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure & Encrypted
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                PCI Compliant
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;