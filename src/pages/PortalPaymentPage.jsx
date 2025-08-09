import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { createInvoicePaymentIntent, confirmInvoicePayment, updateStripeAutopay } from '../services/payment';
import { getStripeIntegrationStatus } from '../components/portal/services/netsuite/payments';
import { getPaymentMethods } from '../services/paymentMethods';
import { useMemberPortal } from '../contexts/MemberPortalProvider';

// Import logos
import alcorStar from '../assets/images/alcor-star.png';
import whiteALogoNoText from '../assets/images/alcor-white-logo-no-text.png';

// Feature flags
const ENABLE_STRIPE_MIGRATION = true; // Toggle to enable/disable migration prompts
const ENABLE_AUTOPAY_ENROLLMENT = true; // Toggle to enable/disable autopay enrollment during payment
const ENABLE_PROCESSING_FEE = true; // Toggle to enable/disable Stripe processing fee

const stripePromise = loadStripe('pk_test_51Nj3BLHe6bV7aBLAJc7oOoNpLXdwDq3KDy2hpgxw0bn0OOSh7dkJTIU8slJoIZIKbvQuISclV8Al84X48iWHLzRK00WnymRlqp');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': { 
        color: '#9ca3af' 
      },
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

function InvoicePaymentForm({ invoice, onBack }) {
  const stripe = useStripe();
  const elements = useElements();
  const { salesforceCustomer, netsuiteCustomerId } = useMemberPortal();
  
  // Refs
  const paymentElementRef = useRef(null);
  const isProcessingRef = useRef(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('ready');
  
  // Saved payment methods states
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [useNewCard, setUseNewCard] = useState(true);
  const [loadingSavedCards, setLoadingSavedCards] = useState(true);
  
  // Additional form fields
  const [cardholderName, setCardholderName] = useState(
    salesforceCustomer?.name || invoice.billingAddress?.addressee || ''
  );
  const [billingZip, setBillingZip] = useState(
    invoice.billingAddress?.zip || ''
  );
  const [saveCard, setSaveCard] = useState(false);
  
  // Autopay enrollment
  const [enrollInAutopay, setEnrollInAutopay] = useState(false);
  const [showAutopayOption, setShowAutopayOption] = useState(false);
  
  // Customer autopay status
  const [customerAutopayStatus, setCustomerAutopayStatus] = useState(null);
  const [loadingAutopayStatus, setLoadingAutopayStatus] = useState(true);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  
  // Calculate processing fee if enabled
  const processingFeeRate = 0.029; // 2.9%
  const processingFeeFixed = 0.30; // $0.30
  const processingFee = ENABLE_PROCESSING_FEE 
    ? (invoice.amountRemaining * processingFeeRate) + processingFeeFixed
    : 0;
  const totalAmount = invoice.amountRemaining + processingFee;
  
  // Fetch saved payment methods
  useEffect(() => {
    const fetchSavedPaymentMethods = async () => {
      console.log('Starting to fetch saved payment methods...');
      try {
        const data = await getPaymentMethods();
        console.log('Payment methods response:', data);
        
        if (data.paymentMethods && data.paymentMethods.length > 0) {
          console.log('Found saved payment methods:', data.paymentMethods);
          setSavedPaymentMethods(data.paymentMethods);
          
          // Default to using the default payment method if available
          const defaultMethod = data.paymentMethods.find(m => m.id === data.defaultPaymentMethodId);
          if (defaultMethod) {
            setSelectedPaymentMethod(defaultMethod.id);
            setUseNewCard(false);
            setCardComplete(true); // Consider card complete if using saved card
          }
        } else {
          console.log('No saved payment methods found');
        }
      } catch (error) {
        console.error('Error fetching saved payment methods:', error);
      } finally {
        setLoadingSavedCards(false);
        console.log('Loading saved cards complete');
      }
    };
    
    fetchSavedPaymentMethods();
  }, []);
  
  // Check customer's current autopay status
  useEffect(() => {
    const checkAutopayStatus = async () => {
      if (!netsuiteCustomerId || !ENABLE_STRIPE_MIGRATION) {
        setLoadingAutopayStatus(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/netsuite/customers/${netsuiteCustomerId}/stripe`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCustomerAutopayStatus(data);
          
          // Check if customer is on legacy autopay but not on Stripe autopay
          if (data.legacy?.autopayEnabled && !data.stripe?.autopayEnabled) {
            setShowMigrationPrompt(true);
            setSaveCard(true); // Pre-check save card option
            setEnrollInAutopay(true); // Pre-check autopay enrollment
          }
          
          // Show autopay option if not already enrolled in Stripe autopay
          setShowAutopayOption(ENABLE_AUTOPAY_ENROLLMENT && !data.stripe?.autopayEnabled);
        }
      } catch (error) {
        console.error('Error checking autopay status:', error);
      } finally {
        setLoadingAutopayStatus(false);
      }
    };
    
    checkAutopayStatus();
  }, [netsuiteCustomerId]);
  
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

  // Handle payment method selection change
  const handlePaymentMethodChange = (value) => {
    if (value === 'new') {
      setUseNewCard(true);
      setSelectedPaymentMethod('');
      setCardComplete(false);
    } else {
      setUseNewCard(false);
      setSelectedPaymentMethod(value);
      setCardComplete(true); // Card is complete when using saved method
    }
  };

  // Clear error when user types
  useEffect(() => {
    if (error && cardholderName && (useNewCard ? billingZip : true)) {
      setError(null);
    }
  }, [cardholderName, billingZip, error, useNewCard]);

  // Process payment
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    // Prevent double-processing
    if (isProcessingRef.current) {
      console.log('Payment already processing, blocking duplicate submission');
      return;
    }

    // Validation
    if (!stripe || !elements) {
      setError('Payment system not ready');
      return;
    }

    if (!cardholderName) {
      setError('Please enter the cardholder name');
      return;
    }

    // If using new card, validate card completion and billing zip
    if (useNewCard) {
      if (!cardComplete) {
        setError('Please complete your card information');
        return;
      }
      if (!billingZip) {
        setError('Please enter the billing zip code');
        return;
      }
    } else if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    isProcessingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      let paymentMethodId;
      
      // If using saved payment method
      if (!useNewCard && selectedPaymentMethod) {
        paymentMethodId = selectedPaymentMethod;
        console.log('Using saved payment method:', paymentMethodId);
      } else {
        // Create new payment method
        const cardElement = paymentElementRef.current || elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Payment form not ready');
        }

        console.log('Creating payment method...');
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

        paymentMethodId = pm.id;
        console.log('Payment method created:', paymentMethodId);
      }

      // Create invoice payment intent
      const paymentData = {
        amount: Math.round(totalAmount * 100),
        currency: invoice.currency || 'usd',
        paymentMethodId: paymentMethodId,
        invoiceId: invoice.internalId,
        invoiceNumber: invoice.id,
        customerId: salesforceCustomer?.id || '',
        customerInfo: {
          email: salesforceCustomer?.email || '',
          name: salesforceCustomer?.name || invoice.billingAddress?.addressee || '',
        },
        savePaymentMethod: useNewCard ? (saveCard || enrollInAutopay) : false, // Only save if it's a new card
        netsuiteCustomerId: netsuiteCustomerId,
        setupFutureUsage: enrollInAutopay ? 'off_session' : null
      };
      
      console.log('Creating invoice payment intent with data:', paymentData);
      const intentResult = await createInvoicePaymentIntent(paymentData);
      
      if (!intentResult.success) {
        throw new Error(intentResult.error || 'Failed to create payment intent');
      }

      console.log('Payment intent created:', {
        paymentIntentId: intentResult.paymentIntentId,
        status: intentResult.status,
        requiresAction: intentResult.requiresAction
      });

      // Handle 3D Secure or immediate confirmation
      let finalPaymentIntentId;
      let savedPaymentMethodId = null;
      
      if (intentResult.requiresAction && intentResult.clientSecret) {
        console.log('3D Secure authentication required...');
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          intentResult.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        finalPaymentIntentId = confirmedIntent.id;
        savedPaymentMethodId = confirmedIntent.payment_method;
        console.log('3D Secure authentication completed:', finalPaymentIntentId);
        
      } else if (intentResult.status === 'succeeded') {
        // Payment succeeded immediately
        finalPaymentIntentId = intentResult.paymentIntentId;
        savedPaymentMethodId = intentResult.paymentMethodId || paymentMethodId;
        console.log('Payment succeeded immediately:', finalPaymentIntentId);
        
      } else if (intentResult.clientSecret) {
        // Need to confirm the payment
        console.log('Confirming payment with client secret...');
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
          intentResult.clientSecret,
          { payment_method: paymentMethodId }
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        finalPaymentIntentId = confirmedIntent.id;
        savedPaymentMethodId = confirmedIntent.payment_method;
        console.log('Payment confirmed:', finalPaymentIntentId);
      } else {
        // Fallback - use the payment intent ID from the response
        finalPaymentIntentId = intentResult.paymentIntentId;
        savedPaymentMethodId = intentResult.paymentMethodId || paymentMethodId;
        console.log('Using payment intent ID from response:', finalPaymentIntentId);
      }

      // Make sure we have a payment intent ID
      if (!finalPaymentIntentId) {
        throw new Error('No payment intent ID available');
      }

      // Confirm invoice payment on backend
      console.log('Confirming invoice payment on backend...');
      try {
        const confirmResult = await confirmInvoicePayment({
          paymentIntentId: finalPaymentIntentId,
          invoiceId: invoice.internalId,
          amount: invoice.amountRemaining,
          paymentDate: new Date().toISOString()
        });

        if (!confirmResult.success) {
          console.error('Warning: Payment succeeded but NetSuite record failed');
          // Don't throw error here - payment was successful even if NetSuite update failed
        }
      } catch (confirmError) {
        console.error('Warning: Payment succeeded but NetSuite confirmation failed:', confirmError);
        // Don't throw error here - payment was successful even if NetSuite update failed
      }

      // Handle autopay enrollment if selected
      if (enrollInAutopay && savedPaymentMethodId && netsuiteCustomerId) {
        console.log('Enrolling in autopay...');
        try {
          const autopayResult = await updateStripeAutopay(netsuiteCustomerId, true, {
            paymentMethodId: savedPaymentMethodId,
            syncLegacy: showMigrationPrompt // Sync to legacy if migrating
          });
          
          if (autopayResult.success) {
            console.log('Successfully enrolled in autopay');
          } else {
            console.error('Failed to enroll in autopay:', autopayResult.error);
            // Don't fail the payment for this
          }
        } catch (autopayError) {
          console.error('Error enrolling in autopay:', autopayError);
          // Don't fail the payment for this
        }
      }

      console.log('Payment process completed successfully');
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
  }, [stripe, elements, cardComplete, invoice, salesforceCustomer, onBack, cardholderName, billingZip, saveCard, enrollInAutopay, netsuiteCustomerId, showMigrationPrompt, useNewCard, selectedPaymentMethod, totalAmount]);

  const formatCurrency = (amount) => {
    // Handle 'USA' currency code by converting to 'USD'
    const currencyCode = invoice.currency === 'USA' ? 'USD' : (invoice.currency || 'USD');
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  if (paymentStatus === 'completed') {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-purple-200 rounded-xl p-8 text-center max-w-md mx-auto w-full">
          <div className="border-2 border-blue-200 rounded-full p-3 mb-6 mx-auto w-16 h-16 flex items-center justify-center bg-blue-50">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful</h2>
          <p className="text-sm text-gray-600 mb-1">
            {formatCurrency(totalAmount)} has been charged
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Invoice #{invoice.id}
          </p>
          {enrollInAutopay && (
            <div className="border border-purple-200 bg-purple-50 rounded-lg px-4 py-2 mb-4">
              <p className="text-xs text-purple-700 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Autopay enabled for future invoices
              </p>
            </div>
          )}
          <div className="text-xs text-gray-400 mt-6">
            Redirecting to invoices...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex items-start justify-center px-4 sm:px-4">
        <div className="w-full max-w-5xl px-0 sm:px-6 lg:px-0">
          {/* Migration Banner - reduced margin top */}
          {showMigrationPrompt && ENABLE_STRIPE_MIGRATION && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300 rounded-xl p-4 mb-6 shadow-sm mt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-purple-900 mb-1">
                    Upgrade to Enhanced Autopay
                  </h3>
                  <p className="text-xs text-purple-700 mb-2">
                    You're currently using our legacy autopay system. Complete this payment to automatically upgrade to our new, more secure autopay with additional features:
                  </p>
                  <ul className="text-xs text-purple-700 space-y-1 ml-4">
                    <li>• Better payment security with Stripe</li>
                    <li>• Instant payment confirmations</li>
                    <li>• Easy payment method management</li>
                    <li>• Support for 3D Secure authentication</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Main payment card - reduced margin top */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden lg:h-[650px] w-full mx-auto mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 lg:h-full">
          
              {/* LEFT SIDE - Invoice Summary */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0a1629] to-[#1e2650] p-6 text-white flex flex-col relative overflow-hidden">
                {/* Additional diagonal gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="mt-3 mb-6">
                    <h2 className="text-xl font-medium text-white mb-4 flex items-center">
                      Invoice Payment
                      <img src={alcorStar} alt="Alcor Star" className="h-5 ml-1" />
                    </h2>
                  </div>
                  
                  <div className="space-y-4 flex-grow">
                    {/* Invoice Details */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-sm font-normal text-white mb-1">Invoice Number</h3>
                          <p className="text-white font-semibold text-base">{invoice.id}</p>
                        </div>
                      </div>

                      <hr className="border-white/20 my-3" />
                      
                      <div>
                        <h3 className="text-sm font-normal text-white mb-2">Description</h3>
                        <p className="text-white/70 text-xs leading-relaxed">{invoice.description}</p>
                      </div>

                      <hr className="border-white/20 my-3" />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-normal text-white mb-1">Invoice Date</h3>
                          <p className="text-white/90 text-sm">
                            {new Date(invoice.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-normal text-white mb-1">Due Date</h3>
                          <p className="text-white/90 text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 space-y-2">
                      {!ENABLE_PROCESSING_FEE && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/80">Original Amount</span>
                            <span className="text-xs text-white/90">{formatCurrency(invoice.amount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/80">Amount Paid</span>
                            <span className="text-xs text-white/90">
                              {formatCurrency(invoice.amount - invoice.amountRemaining)}
                            </span>
                          </div>
                          <hr className="border-white/20" />
                        </>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-white">Invoice Balance</span>
                        <span className="text-sm font-bold text-white">
                          {formatCurrency(invoice.amountRemaining)}
                        </span>
                      </div>
                      {ENABLE_PROCESSING_FEE && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/80">Processing Fee</span>
                            <span className="text-xs text-white/90">
                              {formatCurrency(processingFee)}
                            </span>
                          </div>
                          <hr className="border-white/20" />
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-white">Total Amount</span>
                            <span className="text-base font-bold text-white">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Current Autopay Status */}
                    {!loadingAutopayStatus && customerAutopayStatus && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <h4 className="text-xs font-semibold text-white mb-2">Current Status</h4>
                        <div className="space-y-1">
                          {customerAutopayStatus.legacy?.autopayEnabled && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              <span className="text-xs text-white/80">Legacy Autopay Active</span>
                            </div>
                          )}
                          {customerAutopayStatus.stripe?.autopayEnabled && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-xs text-white/80">Enhanced Autopay Active</span>
                            </div>
                          )}
                          {!customerAutopayStatus.legacy?.autopayEnabled && !customerAutopayStatus.stripe?.autopayEnabled && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-xs text-white/80">No Autopay Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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

                    <div onSubmit={handleSubmit} className="space-y-6 pb-8 lg:pb-12">
                      {/* Billing Address Display */}
                      {invoice.billingAddress && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Billing Address
                          </h4>
                          <div className="text-gray-600 space-y-1">
                            <p className="font-semibold text-gray-900">{invoice.billingAddress.addressee}</p>
                            <p className="text-sm">{invoice.billingAddress.addr1}</p>
                            {invoice.billingAddress.addr2 && <p className="text-sm">{invoice.billingAddress.addr2}</p>}
                            <p className="text-sm">
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
                          onChange={(e) => setCardholderName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13273f] focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Card Information with Dropdown */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Card Information
                        </label>
                        
                        {/* Saved Cards Dropdown */}
                        {!loadingSavedCards && savedPaymentMethods.length > 0 && (
                          <select
                            value={useNewCard ? 'new' : selectedPaymentMethod}
                            onChange={(e) => handlePaymentMethodChange(e.target.value)}
                            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:border-gray-200 mb-3"
                          >
                            <option value="">Select a payment method</option>
                            {savedPaymentMethods.map(method => (
                              <option key={method.id} value={method.id}>
                                •••• {method.card.last4} - {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)} (Expires {String(method.card.exp_month).padStart(2, '0')}/{method.card.exp_year})
                              </option>
                            ))}
                            <option value="new">───── Add new card ─────</option>
                          </select>
                        )}
                        
                        {/* New Card Input - Only show if using new card or no saved cards */}
                        {(useNewCard || savedPaymentMethods.length === 0) && (
                          <>
                            <div className="border border-gray-200 rounded-lg p-4 bg-white focus-within:border-gray-200 focus-within:ring-0 transition-all duration-200">
                              <CardElement 
                                options={CARD_ELEMENT_OPTIONS}
                                onReady={handleCardReady}
                                onChange={handleCardChange}
                              />
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
                          </>
                        )}
                      </div>

                      {/* Save Card Option - Only show for new cards */}
                      {useNewCard && (
                        <div className={`border rounded-lg p-4 ${showMigrationPrompt ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveCard}
                              onChange={(e) => {
                                setSaveCard(e.target.checked);
                                // If unchecking save card, also uncheck autopay
                                if (!e.target.checked) {
                                  setEnrollInAutopay(false);
                                }
                              }}
                              className="w-4 h-4 text-[#13273f] border-gray-300 rounded focus:ring-[#13273f]"
                            />
                            <span className="ml-3 text-gray-700 font-medium text-sm">
                              Save this card for future payments
                            </span>
                          </label>
                          {showMigrationPrompt && (
                            <p className="mt-2 text-xs text-purple-700 ml-7">
                              Required to upgrade from legacy autopay
                            </p>
                          )}
                        </div>
                      )}

                      {/* Autopay Enrollment Option */}
                      {showAutopayOption && (saveCard || !useNewCard) && (
                        <div className={`border rounded-lg p-4 ${enrollInAutopay ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'} transition-colors`}>
                          <label className="flex items-start cursor-pointer">
                            <input
                              type="checkbox"
                              checked={enrollInAutopay}
                              onChange={(e) => setEnrollInAutopay(e.target.checked)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                            />
                            <div className="ml-3">
                              <span className="text-gray-700 font-medium text-sm block">
                                Enable automatic payments
                              </span>
                              <p className="text-xs text-gray-600 mt-1">
                                {showMigrationPrompt 
                                  ? "Upgrade to our enhanced autopay system with better security and features"
                                  : "Future invoices will be automatically charged to this card"}
                              </p>
                              {enrollInAutopay && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center gap-2 text-xs text-green-700">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Never miss a payment deadline
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-green-700">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Manage payment methods anytime
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-green-700">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Cancel anytime from your account
                                  </div>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      )}

                      {/* Error Message */}
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

                      {/* Submit Button */}
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !cardComplete || !cardholderName}
                        className="w-full bg-[#13273f] hover:bg-[#1d3351] disabled:bg-gray-400 disabled:hover:bg-gray-400 text-white py-4 px-5 rounded-full font-semibold text-sm disabled:cursor-not-allowed transition-all duration-300 shadow-sm disabled:shadow-none flex items-center justify-center"
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
                            {enrollInAutopay 
                              ? `Pay ${formatCurrency(totalAmount)} & Enable Autopay`
                              : `Complete Payment • ${formatCurrency(totalAmount)}`
                            }
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </button>

                      {/* Trust badges */}
                      <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          SSL Secured
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          PCI Compliant
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                          Stripe Verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Back button - at bottom */}
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors mt-6 mb-8 text-sm group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component wrapper with Stripe Elements
export default function PortalPaymentPage({ invoice, onBack }) {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No invoice selected for payment</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <InvoicePaymentForm invoice={invoice} onBack={onBack} />
    </Elements>
  );
}