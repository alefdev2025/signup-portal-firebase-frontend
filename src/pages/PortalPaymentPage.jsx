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
import dewarsImage from '../assets/images/dewars-high-res1.png'; // Add this import

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
  hidePostalCode: true,
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
  }, [stripe, elements, cardComplete, invoice, salesforceCustomer, onBack, cardholderName, billingZip]);

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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-6 text-center max-w-md mx-auto backdrop-blur-sm border border-gray-100">
          <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-full p-3 mb-4 mx-auto w-16 h-16 flex items-center justify-center shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-sm text-gray-600 mb-3">
            Your payment of {formatCurrency(invoice.amountRemaining)} for invoice {invoice.id} has been processed.
          </p>
          <div className="animate-pulse text-xs text-gray-500">
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
        className="flex items-center gap-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors mb-4 text-sm group"
      >
        <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Invoice
      </button>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* LEFT SIDE - Invoice Summary with enhanced gradient */}
          <div className="lg:col-span-2 relative overflow-hidden">
            {/* Background Image */}
            <img 
              src={dewarsImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'grayscale(0.3) brightness(0.7)' }}
            />
            
            {/* Dark purple/blue overlay base */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'rgba(26, 18, 47, 0.85)'
              }}
            />
            
            {/* Radial gradient overlays */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 120% 80% at 50% 120%, rgba(255, 215, 0, 0.3) 0%, rgba(255, 184, 0, 0.2) 20%, transparent 60%)'
              }}
            />
            
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(147, 51, 234, 0.2) 0%, rgba(109, 40, 217, 0.3) 30%, transparent 60%)',
                mixBlendMode: 'screen'
              }}
            />
            
            {/* Star decoration */}
            <div className="absolute top-3 right-3">
              <img 
                src={alcorStar} 
                alt="" 
                className="w-8 h-8 opacity-60"
                style={{
                  filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))'
                }}
              />
            </div>
            
            <div className="relative z-10 p-6 h-full flex flex-col">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center drop-shadow-lg">
                Invoice Payment
                <img src={alcorStar} alt="Alcor Star" className="h-4 ml-2" />
              </h2>
              
              <div className="space-y-3 flex-grow">
                {/* Invoice Details with glass morphism */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-3 shadow-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-normal text-white/80 mb-1">Invoice Number</h3>
                      <p className="text-white font-semibold text-sm">{invoice.id}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/20 pt-3">
                    <h3 className="text-xs font-normal text-white/80 mb-1">Description</h3>
                    <p className="text-white/90 text-xs leading-relaxed">{invoice.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <h3 className="text-xs font-normal text-white/70 mb-1">Invoice Date</h3>
                      <p className="text-white/90 text-xs font-medium">
                        {new Date(invoice.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-normal text-white/70 mb-1">Due Date</h3>
                      <p className="text-white/90 text-xs font-medium">
                        {new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary with enhanced styling */}
                <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-xl">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/80">Original Amount</span>
                      <span className="text-xs text-white/90 font-medium">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/80">Amount Paid</span>
                      <span className="text-xs text-white/90 font-medium">
                        {formatCurrency(invoice.amount - invoice.amountRemaining)}
                      </span>
                    </div>
                    <div className="border-t border-white/30 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">Amount Due</span>
                        <span className="text-lg font-bold text-white drop-shadow-lg">
                          {formatCurrency(invoice.amountRemaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-auto pt-4">
                <div className="flex items-start text-white/70 text-xs leading-relaxed">
                  <svg className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs">
                    Your payment is secured with 256-bit SSL encryption.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Payment Form with enhanced styling */}
          <div className="lg:col-span-3 p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              Payment Information
              <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure Payment
              </div>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Billing Information with card styling */}
              {invoice.billingAddress && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center">
                    <svg className="w-3 h-3 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Billing Address
                  </label>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p className="font-semibold text-gray-900 text-sm">{invoice.billingAddress.addressee}</p>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center">
                  <svg className="w-3 h-3 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => {
                    setCardholderName(e.target.value);
                    if (error && error.includes('cardholder name')) {
                      setError(null);
                    }
                  }}
                  placeholder="John Doe"
                  className={`w-full px-3 py-2 text-sm border ${error && !cardholderName ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent transition-all shadow-sm`}
                  required
                />
              </div>

              {/* Card Information */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center">
                  <svg className="w-3 h-3 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Card Information
                </label>
                <div className="space-y-2">
                  <div className="border border-gray-300 rounded-xl p-3 bg-white focus-within:border-[#6b5b7e] focus-within:ring-2 focus-within:ring-[#6b5b7e] focus-within:ring-opacity-20 transition-all duration-200 shadow-sm">
                    <CardElement 
                      options={{
                        ...CARD_ELEMENT_OPTIONS,
                        style: {
                          ...CARD_ELEMENT_OPTIONS.style,
                          base: {
                            ...CARD_ELEMENT_OPTIONS.style.base,
                            fontSize: '14px',
                            '::placeholder': { 
                              color: '#aab7c4',
                              fontSize: '14px',
                            },
                          }
                        }
                      }}
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
                        if (error && error.includes('zip code')) {
                          setError(null);
                        }
                      }}
                      placeholder="Billing ZIP Code"
                      className={`w-full px-3 py-2 text-sm border ${error && !billingZip ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent transition-all shadow-sm`}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-3 h-3 text-blue-600 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-blue-700">
                      <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future expiry and CVC.
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Card Option */}
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="saveCard"
                  checked={saveCard}
                  onChange={(e) => setSaveCard(e.target.checked)}
                  className="h-3 w-3 text-[#6b5b7e] focus:ring-[#6b5b7e] border-gray-300 rounded"
                />
                <label htmlFor="saveCard" className="ml-2 text-xs text-gray-700 font-medium">
                  Save this card for future payments
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-shake">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-red-700 font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !cardComplete || !cardholderName || !billingZip}
                className="w-full bg-gradient-to-r from-[#6b5b7e] to-[#5a4a6d] hover:from-[#5a4a6d] hover:to-[#4a3a5d] disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-5 rounded-xl font-semibold text-sm disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center transform hover:scale-[1.02] disabled:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </div>
                ) : (
                  <span className="flex items-center">
                    <img src={alcorStar} alt="" className="h-4 mr-1.5" />
                    Pay {formatCurrency(invoice.amountRemaining)}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>

              {/* Trust badges */}
              <div className="pt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  SSL Encrypted
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  PCI Compliant
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Secure
                </div>
              </div>
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

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Main component wrapper with Stripe Elements
export default function PortalPaymentPage({ invoice, onBack }) {
    // Scroll to top when component mounts
    useEffect(() => {
      // Force scroll to top with a slight delay to ensure DOM is ready
      const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      
      // Immediate scroll
      scrollToTop();
      
      // Delayed scroll as fallback
      const timer = setTimeout(scrollToTop, 0);
      
      return () => clearTimeout(timer);
    }, []);
  
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