// File: components/portal/PaymentMethodsTab.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentMethods } from '../../services/paymentMethods';
import { createStripeAutopaySubscription, getOrCreateStripeCustomer } from '../../services/stripeAutopaySubscriptionNotUsing';
import { useAutopay, usePaymentMethod } from './contexts/CustomerDataContext';
import { auth } from '../../services/firebase';

// Import card logos
import visaLogo from '../../assets/images/cards/visa.png';
import mastercardLogo from '../../assets/images/cards/mastercard.png';
import amexLogo from '../../assets/images/cards/american-express.png';
import discoverLogo from '../../assets/images/cards/discover.png';

// Payment Source Component (shows both Stripe and MerchantE cards)
const PaymentMethodCard = ({ paymentMethod, source }) => {
  const getCardLogo = (brand) => {
    const brandLogos = {
      visa: visaLogo,
      mastercard: mastercardLogo,
      amex: amexLogo,
      'american-express': amexLogo,
      discover: discoverLogo
    };
    
    const logoSrc = brandLogos[brand?.toLowerCase()];
    
    if (logoSrc) {
      return (
        <img 
          src={logoSrc} 
          alt={`${brand} logo`} 
          className="h-8 w-auto object-contain"
        />
      );
    }
    
    // Fallback to text if no logo found
    return (
      <div className="w-12 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {brand?.toUpperCase() || 'CARD'}
        </span>
      </div>
    );
  };

  // Handle both Stripe and MerchantE card formats
  const cardInfo = source === 'stripe' ? {
    brand: paymentMethod.card?.brand,
    last4: paymentMethod.card?.last4,
    expMonth: paymentMethod.card?.exp_month,
    expYear: paymentMethod.card?.exp_year
  } : {
    brand: paymentMethod.cardType || paymentMethod.type,
    last4: paymentMethod.last4,
    expMonth: paymentMethod.expiration?.split('/')[0],
    expYear: paymentMethod.expiration?.split('/')[1]
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {getCardLogo(cardInfo.brand)}
          <div>
            <p className="font-medium text-[#2a2346] text-base">
              •••• {cardInfo.last4}
            </p>
            {cardInfo.expMonth && cardInfo.expYear && (
              <p className="text-sm text-gray-600 mt-0.5">
                Expires {String(cardInfo.expMonth).padStart(2, '0')}/{cardInfo.expYear}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                source === 'stripe' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {source === 'stripe' ? 'Stripe' : 'MerchantE'}
              </span>
              {source === 'merchantE' && (
                <span className="text-xs text-gray-500">From latest order</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Autopay Status Section
const AutopaySection = ({ customerId }) => {
  const navigate = useNavigate();
  const autopayData = useAutopay();
  
  // Extract all the values with defaults and logging
  const {
    isOnAutopay = false,
    autopayStatus = 'UNKNOWN',
    confidence = 0,
    cardDetails = null,
    billingSchedule = 'UNKNOWN',
    canEnableAutopay: hookCanEnableAutopay = false,
    eligibilityReason = null,
    requiresStaffIntervention = false,
    isLoading = false,
    error = null,
    rawData = null
  } = autopayData || {};

  // Debug logging
  useEffect(() => {
    console.log('🔍 AutopaySection Debug:', {
      autopayData,
      isOnAutopay,
      autopayStatus,
      hookCanEnableAutopay,
      canEnableAutopay: hookCanEnableAutopay || autopayStatus === 'NO_PAYMENT_METHOD' || autopayStatus === 'NOT_ON_AUTOPAY',
      rawData
    });
  }, [autopayData, isOnAutopay, autopayStatus, hookCanEnableAutopay, rawData]);

  // Calculate canEnableAutopay with fallback logic
  const canEnableAutopay = hookCanEnableAutopay || 
                          autopayStatus === 'NO_PAYMENT_METHOD' || 
                          autopayStatus === 'NOT_ON_AUTOPAY';

  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableAutopay = async () => {
    setIsEnabling(true);
    try {
      // Get customer email from Firebase auth
      const customerEmail = auth.currentUser?.email;
      
      if (!customerEmail) {
        alert('Unable to find customer email. Please ensure you are logged in.');
        setIsEnabling(false);
        return;
      }
      
      // First, create/get Stripe customer with email
      const stripeCustomerResult = await getOrCreateStripeCustomer(customerId, {
        email: customerEmail
      });
      
      if (!stripeCustomerResult.success) {
        throw new Error('Failed to create Stripe customer');
      }
      
      // Store the billing schedule and customer info in session/state for payment setup
      sessionStorage.setItem('autopaySetup', JSON.stringify({
        customerId,
        stripeCustomerId: stripeCustomerResult.stripeCustomerId,
        billingSchedule,
        estimatedAmount: calculateEstimatedAmount(billingSchedule)
      }));
      
      // Navigate to payment setup page
      navigate('/payment-setup', { 
        state: { 
          billingSchedule,
          customerId,
          stripeCustomerId: stripeCustomerResult.stripeCustomerId,
          returnUrl: '/portal/payment-methods'
        }
      });
    } catch (error) {
      console.error('Error enabling autopay:', error);
      alert('Failed to start autopay setup. Please try again.');
    } finally {
      setIsEnabling(false);
    }
  };
  
  // Helper to calculate estimated amount based on billing schedule
  const calculateEstimatedAmount = (schedule) => {
    // This should be calculated based on actual membership pricing
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Log the decision path
  console.log('🔍 Autopay Decision Path:', {
    'isOnAutopay && autopayStatus === ON_AUTOPAY': isOnAutopay && autopayStatus === 'ON_AUTOPAY',
    'canEnableAutopay': canEnableAutopay,
    'fallback (not eligible)': !isOnAutopay && !canEnableAutopay
  });

  // Customer is on legacy autopay
  if (isOnAutopay && autopayStatus === 'ON_AUTOPAY') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Autopay Status</h2>
          <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium">
            Active - Legacy System
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-medium text-amber-900 mb-2">You're on our legacy autobilling system</h3>
              <p className="text-sm text-amber-800 mb-4">
                Your membership is set to automatically renew using:
              </p>
              {cardDetails && (
                <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="font-medium text-gray-900">
                    {cardDetails.type} ending in {cardDetails.last4}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Expires {cardDetails.expiration}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Billing Schedule: {billingSchedule}
                  </p>
                </div>
              )}
              <p className="text-sm text-amber-800 mb-3">
                To update your payment method or make changes to your autopay settings, please contact Alcor support.
              </p>
              <a 
                href="mailto:support@alcor.org?subject=Update Autopay Payment Method" 
                className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Confidence: </span>
            {confidence}% certain based on payment history analysis
          </p>
        </div>
      </div>
    );
  }

  // Customer can enable Stripe autopay
  if (canEnableAutopay) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Join Autopay</h2>
          <span className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium">
            Not Enrolled
          </span>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Enable autopay to automatically renew your membership and never miss a payment.
          </p>
          
          {billingSchedule && billingSchedule !== 'UNKNOWN' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Detected billing pattern:</span> {billingSchedule}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Based on your payment history, we'll set up {billingSchedule.toLowerCase()} automatic payments.
              </p>
            </div>
          )}

          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 border border-gray-300 rounded p-3 mb-4 text-xs">
              <p className="font-semibold mb-1">Debug Info:</p>
              <p>Status: {autopayStatus}</p>
              <p>Can Enable (hook): {String(hookCanEnableAutopay)}</p>
              <p>Can Enable (calculated): {String(canEnableAutopay)}</p>
              <p>Is On Autopay: {String(isOnAutopay)}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Never miss a payment</p>
                <p className="text-sm text-gray-600">Your membership renews automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Secure & convenient</p>
                <p className="text-sm text-gray-600">Powered by Stripe for maximum security</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Cancel anytime</p>
                <p className="text-sm text-gray-600">Manage your subscription from your account</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleEnableAutopay}
            disabled={isEnabling}
            className="w-full bg-[#6b5b7e] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#5a4a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnabling ? 'Setting up...' : 'Enable Autopay'}
          </button>
        </div>
      </div>
    );
  }

  // Customer not eligible for autopay
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Autopay Status</h2>
        <span className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium">
          Not Available
        </span>
      </div>

      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-900 mb-2">{eligibilityReason || 'Autopay is not available'}</p>
        {autopayStatus === 'UNKNOWN' && (
          <p className="text-sm text-gray-600">
            We need more payment history to determine your eligibility for autopay.
          </p>
        )}
        
        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 border border-gray-300 rounded p-3 mt-4 text-xs text-left max-w-md mx-auto">
            <p className="font-semibold mb-1">Debug Info (Not Eligible Path):</p>
            <p>Status: {autopayStatus}</p>
            <p>Can Enable (hook): {String(hookCanEnableAutopay)}</p>
            <p>Can Enable (calculated): {String(canEnableAutopay)}</p>
            <p>Is On Autopay: {String(isOnAutopay)}</p>
            <p>Eligibility Reason: {eligibilityReason || 'None provided'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Payment Methods Tab Component
const PaymentMethodsTab = () => {
  const [stripePaymentMethods, setStripePaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  
  const { data: paymentMethod, isLoading: isLoadingPaymentMethod } = usePaymentMethod();

  // Get customer ID from session or context
  useEffect(() => {
    const storedCustomerId = sessionStorage.getItem('customerId') || 
                           localStorage.getItem('customerId') ||
                           window.customerId || // if set globally
                           '4666'; // fallback for testing
    setCustomerId(storedCustomerId);
    console.log('🔍 Using customerId:', storedCustomerId);
  }, []);

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .payment-methods-page * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .payment-methods-page h1,
      .payment-methods-page h2,
      .payment-methods-page h3,
      .payment-methods-page h4 {
        font-weight: 400 !important;
      }
      .payment-methods-page .font-medium {
        font-weight: 500 !important;
      }
      .payment-methods-page .font-semibold {
        font-weight: 600 !important;
      }
      .payment-methods-page .font-bold {
        font-weight: 600 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch Stripe payment methods
  const fetchStripePaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getPaymentMethods();
      setStripePaymentMethods(data.paymentMethods || []);
    } catch (err) {
      setError('Failed to load payment information');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStripePaymentMethods();
  }, []);

  if (isLoading || isLoadingPaymentMethod) {
    return (
      <div className="payment-methods-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  // Combine Stripe methods and MerchantE method from sales orders
  const allPaymentMethods = [
    ...stripePaymentMethods.map(method => ({ ...method, source: 'stripe' })),
    ...(paymentMethod?.hasCardOnFile && paymentMethod?.paymentMethod?.cardDetails ? [{
      ...paymentMethod.paymentMethod,
      source: 'merchantE'
    }] : [])
  ];

  return (
    <div className="payment-methods-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen">
      <div className="h-8"></div>
      
      <div className="px-4 md:px-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Payment & Autopay</h1>

        {/* Payment Methods Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-10 mb-8 animate-fadeIn animation-delay-100" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Methods</h2>
            <p className="text-sm text-gray-500">
              Your saved payment methods and cards on file
            </p>
          </div>

          {allPaymentMethods.length === 0 ? (
            <div className="text-center py-16 animate-fadeIn">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-[#4a3d6b] text-lg">No payment methods found</p>
              <p className="text-sm text-gray-500 mt-2">
                Payment methods will appear here when you make a purchase
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPaymentMethods.map((method, index) => (
                <PaymentMethodCard
                  key={method.id || `method-${index}`}
                  paymentMethod={method}
                  source={method.source}
                />
              ))}
            </div>
          )}
        </div>

        {/* Autopay Section */}
        <AutopaySection customerId={customerId} />
      </div>
    </div>
  );
};

export default PaymentMethodsTab;