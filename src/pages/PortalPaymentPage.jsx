import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createInvoicePaymentIntent, confirmInvoicePayment } from '../services/payment';
import { useMemberPortal } from '../contexts/MemberPortalProvider';

// Import logos
import alcorStar from '../assets/images/alcor-star.png';
import whiteALogoNoText from '../assets/images/alcor-white-logo-no-text.png';

const stripePromise = loadStripe('pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': { 
        color: '#aab7c4',
        fontSize: '16px',
      },
      padding: '12px',
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
  hidePostalCode: true, // We'll add a separate postal code field
};

function InvoicePaymentForm({ invoice, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { salesforceCustomer } = useMemberPortal();
  
  // Refs
  const paymentElementRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('ready');
  
  // Additional form fields - Initialize with default values
  const [cardholderName, setCardholderName] = useState(
    salesforceCustomer?.name || invoice.billingAddress?.addressee || ''
  );
  const [billingZip, setBillingZip] = useState(
    invoice.billingAddress?.zip || ''
  );
  const [saveCard, setSaveCard] = useState(false);
  
  // Store element reference when ready
  const handleCardReady = useCallback(() => {
    if (elements) {
      paymentElementRef.current = elements.getElement(CardElement);
    }
  }, [elements]);

  const handleCardChange = useCallback((event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  }, []);

  // Clear error when user types
  useEffect(() => {
    if (error && cardholderName && billingZip) {
      setError(null);
    }
  }, [cardholderName, billingZip, error]);

  // Process payment
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    // Prevent double-processing
    if (isProcessingRef.current) {
      return;
    }

    if (!stripe || !elements || !cardComplete || !cardholderName || !billingZip) {
      if (!cardholderName) setError('Please enter the cardholder name');
      else if (!billingZip) setError('Please enter the billing zip code');
      else setError('Please complete your payment information');
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get card element
      const cardElement = paymentElementRef.current || elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Payment form not ready');
      }

      // Create payment method
      const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
          email: salesforceCustomer?.email || '',
          address: {
            postal_code: billingZip,
            ...(invoice.billingAddress ? {
              line1: invoice.billingAddress.addr1,
              line2: invoice.billingAddress.addr2,
              city: invoice.billingAddress.city,
              state: invoice.billingAddress.state,
              country: 'US',
            } : {})
          }
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Create invoice payment intent
      const paymentData = {
        amount: Math.round(invoice.amountRemaining * 100), // Convert to cents
        currency: invoice.currency || 'usd',
        paymentMethodId: pm.id,
        invoiceId: invoice.internalId,
        invoiceNumber: invoice.id,
        customerId: salesforceCustomer?.id || '',
        customerInfo: {
          email: salesforceCustomer?.email || '',
          name: salesforceCustomer?.name || invoice.billingAddress?.addressee || '',
        }
      };

      const intentResult = await createInvoicePaymentIntent(paymentData);
      
      if (!intentResult.success) {
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }

      // Handle 3D Secure or immediate confirmation
      let paymentIntent;
      if (intentResult.requiresAction && intentResult.clientSecret) {
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          intentResult.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        paymentIntent = confirmedIntent;
      } else if (intentResult.clientSecret) {
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          intentResult.clientSecret,
          { payment_method: pm.id }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        paymentIntent = confirmedIntent;
      }

      // Confirm invoice payment on backend
      const confirmResult = await confirmInvoicePayment({
        paymentIntentId: paymentIntent?.id || intentResult.paymentIntentId,
        invoiceId: invoice.internalId,
        amount: invoice.amountRemaining,
        paymentDate: new Date().toISOString()
      });

      if (!confirmResult.success) {
        console.error('Warning: Payment succeeded but NetSuite record failed');
      }

      setPaymentStatus('completed');
      
      // Navigate back to invoices tab after successful payment
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  }, [stripe, elements, cardComplete, invoice, salesforceCustomer, onBack]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
          <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-4 mb-6 mx-auto w-20 h-20 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
          <p className="text-base text-gray-600 mb-4">
            Your payment of {formatCurrency(invoice.amountRemaining)} for invoice {invoice.id} has been processed.
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Returning to invoices...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors mb-8 text-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Invoice
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* LEFT SIDE - Invoice Summary */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0a1629] to-[#1e2650] p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
            
            <div className="relative z-10 h-full flex flex-col">
              <h2 className="text-xl font-medium text-white mb-6 flex items-center">
                Invoice Payment
                <img src={alcorStar} alt="Alcor Star" className="h-5 ml-1" />
              </h2>
              
              <div className="space-y-4 flex-grow">
                {/* Invoice Details */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-normal text-white mb-1">Invoice Number</h3>
                      <p className="text-white/90 font-medium">{invoice.id}</p>
                    </div>
                  </div>
                  
                  <hr className="border-white/20" />
                  
                  <div>
                    <h3 className="text-sm font-normal text-white mb-1">Description</h3>
                    <p className="text-white/70 text-sm">{invoice.description}</p>
                  </div>
                  
                  <hr className="border-white/20" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h3 className="text-sm font-normal text-white mb-1">Invoice Date</h3>
                      <p className="text-white/70 text-sm">
                        {new Date(invoice.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-normal text-white mb-1">Due Date</h3>
                      <p className="text-white/70 text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="mt-6">
                  <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/80">Original Amount</span>
                        <span className="text-sm text-white/80">{formatCurrency(invoice.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/80">Amount Paid</span>
                        <span className="text-sm text-white/80">
                          {formatCurrency(invoice.amount - invoice.amountRemaining)}
                        </span>
                      </div>
                      <hr className="border-white/20" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-medium text-white">Amount Due</span>
                        <span className="text-lg font-semibold text-white">
                          {formatCurrency(invoice.amountRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-auto pt-6">
                <div className="flex items-start text-white/60 text-xs leading-relaxed">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    Your payment is secured with 256-bit SSL encryption.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Payment Form */}
          <div className="lg:col-span-3 p-6 lg:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Payment Information</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Billing Information */}
              {invoice.billingAddress && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Billing Address
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{invoice.billingAddress.addressee}</p>
                    <p>{invoice.billingAddress.addr1}</p>
                    {invoice.billingAddress.addr2 && <p>{invoice.billingAddress.addr2}</p>}
                    <p>
                      {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.zip}
                    </p>
                  </div>
                </div>
              )}

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => {
                    setCardholderName(e.target.value);
                    // Clear error if user starts typing
                    if (error && error.includes('cardholder name')) {
                      setError(null);
                    }
                  }}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 border ${error && !cardholderName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent`}
                  required
                />
              </div>

              {/* Card Information */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Information
                </label>
                <div className="space-y-3">
                  <div className="border border-gray-300 rounded-lg p-4 bg-white focus-within:border-[#6b5b7e] focus-within:ring-2 focus-within:ring-[#6b5b7e] focus-within:ring-opacity-20 transition-all duration-200">
                    <CardElement 
                      options={CARD_ELEMENT_OPTIONS}
                      onReady={handleCardReady}
                      onChange={handleCardChange}
                    />
                  </div>
                  
                  {/* Billing Zip */}
                  <div>
                    <input
                      type="text"
                      value={billingZip}
                      onChange={(e) => {
                        setBillingZip(e.target.value);
                        // Clear error if user starts typing
                        if (error && error.includes('zip code')) {
                          setError(null);
                        }
                      }}
                      placeholder="Billing ZIP"
                      className={`w-full px-4 py-3 border ${error && !billingZip ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent`}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
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

              {/* Save Card Option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="h-4 w-4 text-[#6b5b7e] focus:ring-[#6b5b7e] border-gray-300 rounded"
                />
                <label htmlFor="saveCard" className="ml-2 text-sm text-gray-700">
                  Save this card for future payments
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !cardComplete || !cardholderName || !billingZip}
                className="w-full bg-[#6b5b7e] hover:bg-[#5a4a6d] disabled:bg-gray-400 text-white py-4 px-5 rounded-full font-semibold text-sm disabled:cursor-not-allowed transition-all duration-300 shadow-sm disabled:shadow-none flex items-center justify-center"
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
                  <span className="flex items-center">
                    <img src={alcorStar} alt="" className="h-4 mr-1" />
                    Pay {formatCurrency(invoice.amountRemaining)}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Main component wrapper with Stripe Elements
export default function PortalPaymentPage({ invoice, onBack }) {
  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">No invoice selected for payment</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <InvoicePaymentForm invoice={invoice} onBack={onBack} />
    </Elements>
  );
}