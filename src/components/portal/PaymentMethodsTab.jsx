// File: components/portal/PaymentMethodsTab.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentMethods, savePaymentMethod, removePaymentMethod as removePaymentMethodService } from '../../services/paymentMethods';
import { updateStripeAutopay } from '../../services/payment';
import { auth } from '../../services/firebase';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getCountries } from './utils/countries';

// Import the new data service
import { paymentMethodsDataService } from './services/paymentMethodsDataService';

// Import card logos
import visaLogo from '../../assets/images/cards/visa.png';
import mastercardLogo from '../../assets/images/cards/mastercard.png';
import amexLogo from '../../assets/images/cards/american-express.png';
import discoverLogo from '../../assets/images/cards/discover.png';

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
        color: '#dc3545',
        iconColor: '#dc3545'
      },
      complete: {
        iconColor: '#28a745'
      }
    },
    hidePostalCode: true, // Since you're collecting it separately
  };

// Payment Setup Form Component with international support
const PaymentSetupForm = ({ onSuccess, onCancel, autopayOnly = false }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { salesforceCustomer, currentUser } = useMemberPortal();
    const [cardError, setCardError] = useState(null);
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [cardComplete, setCardComplete] = useState(false);
    
    // Form fields - MUST BE DEFINED BEFORE USING IN selectedCountry
    const [cardholderName, setCardholderName] = useState(salesforceCustomer?.name || '');
    const [email, setEmail] = useState(currentUser?.email || salesforceCustomer?.email || '');
    const [phone, setPhone] = useState(salesforceCustomer?.phone || '');
    const [billingAddress, setBillingAddress] = useState({
      line1: salesforceCustomer?.mailingAddress?.street || '',
      line2: '',
      city: salesforceCustomer?.mailingAddress?.city || '',
      state: salesforceCustomer?.mailingAddress?.state || '',
      postal_code: salesforceCustomer?.mailingAddress?.postalCode || '',
      country: salesforceCustomer?.mailingAddress?.country || 'US'
    });
  
    // Get countries list and selected country
    const countries = useMemo(() => getCountries(), []);
    const selectedCountry = countries.find(c => c.code === billingAddress.country) || countries[0];
  
    const handleCardChange = (event) => {
        setCardComplete(event.complete);
        
        if (event.error) {
          setCardError(event.error.message);
          // Don't set the main error here - only on submit
        } else {
          setCardError(null);
        }
        
        // Clear any submit errors when user starts typing again
        if (error && event.error?.message !== error) {
          setError(null);
        }
      };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!stripe || !elements) {
        return;
      }
    
      // Validate required fields
      if (!cardholderName.trim()) {
        setError('Please enter the cardholder name');
        return;
      }
      
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return;
      }
    
      if (!cardComplete) {
        setError('Please complete your card information');
        return;
      }
      
      // Validate address fields
      if (!billingAddress.line1.trim() || !billingAddress.city.trim() || !billingAddress.postal_code.trim()) {
        setError('Please complete all required billing address fields');
        return;
      }
      
      // Only require state for countries that have states
      if (selectedCountry.hasStates && !billingAddress.state.trim()) {
        setError(`Please enter your ${selectedCountry.stateLabel.toLowerCase()}`);
        return;
      }
    
      setIsProcessing(true);
      setError(null);
    
      try {
        // Build billing details object
        const billingDetails = {
          name: cardholderName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          address: {
            line1: billingAddress.line1.trim(),
            city: billingAddress.city.trim(),
            postal_code: billingAddress.postal_code.trim(),
            country: billingAddress.country
          }
        };
        
        // Add optional fields
        if (billingAddress.line2.trim()) {
          billingDetails.address.line2 = billingAddress.line2.trim();
        }
        
        // Only add state if it exists (not all countries have states)
        if (billingAddress.state.trim()) {
          billingDetails.address.state = billingAddress.state.trim();
        }
        
        // Create payment method
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardElement),
          billing_details: billingDetails
        });
    
        if (pmError) {
          throw new Error(pmError.message);
        }
    
        console.log('Payment method created:', paymentMethod.id);
        
        // Save the payment method
        const saveResult = await savePaymentMethod({ 
          paymentMethodId: paymentMethod.id,
          customerInfo: {
            email: email.trim(),
            phone: phone.trim() || null,
            name: cardholderName.trim()
          }
        });
        
        if (!saveResult.success) {
          throw new Error(saveResult.error || 'Failed to save payment method');
        }
        
        console.log('Payment method saved, Stripe customer ID:', saveResult.customerId);
        
        toast.success('Payment method saved successfully!');
        
        // Call success callback
        onSuccess({
          success: true,
          autopayEnabled: false
        });
        
      } catch (error) {
        console.error('Error setting up payment method:', error);
        setError(error.message || 'Failed to set up payment method. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cardholder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
          />
        </div>
  
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
          <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
        </div>
  
        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
  
        {/* Billing Address Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Billing Address</h4>
          
          {/* Country */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
              value={billingAddress.country}
              onChange={(e) => {
                setBillingAddress({...billingAddress, country: e.target.value, state: ''});
              }}
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Street Address */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
              value={billingAddress.line1}
              onChange={(e) => setBillingAddress({...billingAddress, line1: e.target.value})}
              placeholder="123 Main Street"
            />
          </div>
  
          {/* Address Line 2 (Optional) */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apartment, suite, etc.
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
              value={billingAddress.line2}
              onChange={(e) => setBillingAddress({...billingAddress, line2: e.target.value})}
              placeholder="Apt 4B"
            />
          </div>
  
          {/* City and State/Province */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
                value={billingAddress.city}
                onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                placeholder={selectedCountry.code === 'GB' ? 'London' : 'New York'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedCountry.stateLabel} {selectedCountry.hasStates && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                required={selectedCountry.hasStates}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
                value={billingAddress.state}
                onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                placeholder={selectedCountry.code === 'GB' ? 'Greater London' : selectedCountry.code === 'CA' ? 'ON' : 'NY'}
                maxLength={selectedCountry.code === 'US' || selectedCountry.code === 'CA' ? '2' : '50'}
              />
            </div>
          </div>
  
          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {selectedCountry.zipLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b5b7e] focus:border-transparent"
              value={billingAddress.postal_code}
              onChange={(e) => setBillingAddress({...billingAddress, postal_code: e.target.value})}
              placeholder={selectedCountry.zipPlaceholder || '10001'}
            />
          </div>
        </div>
  
        {/* Card Details */}
        <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Details <span className="text-red-500">*</span>
        </label>
        <div className={`px-3 py-2 border rounded-lg transition-colors ${
            cardError ? 'border-red-300 bg-red-50' : 'border-gray-300'
        } focus-within:ring-2 focus-within:ring-[#6b5b7e] focus-within:border-transparent`}>
            <CardElement 
            options={CARD_ELEMENT_OPTIONS} 
            onChange={handleCardChange}
            />
        </div>
        {cardError && (
            <p className="text-xs text-red-600 mt-1">{cardError}</p>
        )}
        </div>
  
        {autopayOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              This card will be used for automatic invoice payments
            </p>
          </div>
        )}
  
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
  
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing || !cardComplete || !cardholderName || !email}
            className="flex-1 bg-[#6b5b7e] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#5a4a6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : (autopayOnly ? 'Save & Enable Autopay' : 'Save Card')}
          </button>
        </div>
      </form>
    );
  };

// Payment Source Component
const PaymentMethodCard = ({ paymentMethod, source, isAutopayCard, onSetAsAutopay, onRemove, updatingPaymentMethodId }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  
  const handleRemove = async () => {
    if (isAutopayCard) {
      toast.error('Cannot remove card while autopay is enabled. Please disable autopay first.');
      return;
    }
    
    if (!confirmRemove) {
      setConfirmRemove(true);
      // Reset confirmation state after 3 seconds
      setTimeout(() => setConfirmRemove(false), 3000);
      return;
    }
    
    setIsRemoving(true);
    try {
      await onRemove(paymentMethod.id);
    } catch (error) {
      console.error('Error removing payment method:', error);
    } finally {
      setIsRemoving(false);
      setConfirmRemove(false);
    }
  };
  
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
    
    return (
      <div className="w-12 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600">
          {brand?.toUpperCase() || 'CARD'}
        </span>
      </div>
    );
  };

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
    <div className={`border rounded-lg p-6 hover:shadow-md transition-all h-[120px] ${
      isAutopayCard ? 'border-gray-300 shadow-sm' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {getCardLogo(cardInfo.brand)}
          <div>
            <p className="font-medium text-gray-900 text-base">
              •••• {cardInfo.last4}
            </p>
            {cardInfo.expMonth && cardInfo.expYear && (
              <p className="text-sm text-gray-600 mt-0.5 font-normal">
                Expires {String(cardInfo.expMonth).padStart(2, '0')}/{cardInfo.expYear}
              </p>
            )}
            {isAutopayCard && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Autopay Active
                </span>
              </div>
            )}
          </div>
        </div>
        
        {source === 'stripe' && (
          <div className="flex items-center gap-2">
            {!isAutopayCard && onSetAsAutopay && (
              <button
                onClick={() => onSetAsAutopay(paymentMethod.id)}
                disabled={updatingPaymentMethodId !== null}
                className="text-sm text-[#6b5b7e] hover:text-[#5a4a6d] font-medium disabled:opacity-50 transition-colors"
              >
                {updatingPaymentMethodId === paymentMethod.id ? 'Enabling...' : 'Use for Autopay'}
              </button>
            )}
            {!isAutopayCard ? (
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className={`text-sm font-medium disabled:opacity-50 ml-4 transition-colors ${
                  confirmRemove 
                    ? 'text-orange-600 hover:text-orange-800' 
                    : 'text-red-600 hover:text-red-800'
                }`}
              >
                {isRemoving ? 'Removing...' : confirmRemove ? 'Verify Removal' : 'Remove'}
              </button>
            ) : (
              <button
                disabled
                className="text-sm text-gray-400 font-medium ml-4 cursor-not-allowed"
                title="Disable autopay to remove this card"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Autopay Status Section
const AutopaySection = ({ 
  customerId, 
  stripePaymentMethods, 
  autopayData,
  onRefresh, 
  onAddPaymentMethod
}) => {
  const navigate = useNavigate();
  const [updatingPaymentMethodId, setUpdatingPaymentMethodId] = useState(null);
  const [showChangePaymentMethodForm, setShowChangePaymentMethodForm] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  // Extract data from the consolidated response
  const isOnLegacyAutopay = autopayData?.legacyAutopay || false;
  const isOnStripeAutopay = autopayData?.stripeAutopay || false;
  const stripePaymentMethodId = autopayData?.stripeIntegration?.stripe?.defaultPaymentMethodId || 
                                autopayData?.autopayStatus?.stripe?.defaultPaymentMethodId;
  const salesOrderAnalysis = autopayData?.salesOrderAnalysis;
  const cardDetails = salesOrderAnalysis?.analysis?.cardOnFile;

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.autopay-options-dropdown')) {
        setShowOptionsDropdown(false);
        setConfirmDisable(false);
      }
    };

    if (showOptionsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showOptionsDropdown]);

  const handleEnableAutopay = async (paymentMethodId) => {
    setUpdatingPaymentMethodId(paymentMethodId);
    try {
      const result = await updateStripeAutopay(customerId, true, {
        paymentMethodId: paymentMethodId
      });
      
      if (result.success) {
        toast.success('Autopay enabled successfully!');
        
        // Refresh data
        await onRefresh();
      } else {
        toast.error(result.error || 'Failed to enable autopay');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to enable autopay');
    } finally {
      setUpdatingPaymentMethodId(null);
    }
  };

  const handleChangePaymentMethod = async (newPaymentMethodId) => {
    setUpdatingPaymentMethodId(newPaymentMethodId);
    try {
      // First disable autopay on current card
      const disableResult = await updateStripeAutopay(customerId, false);
      
      if (!disableResult.success) {
        throw new Error(disableResult.error || 'Failed to disable autopay');
      }
      
      // Then enable autopay on new card
      const enableResult = await updateStripeAutopay(customerId, true, {
        paymentMethodId: newPaymentMethodId
      });
      
      if (enableResult.success) {
        toast.success('Payment method updated successfully!');
        setShowChangePaymentMethodForm(false);
        
        // Refresh data
        setTimeout(async () => {
          await onRefresh();
        }, 1000);
      } else {
        throw new Error(enableResult.error || 'Failed to update payment method');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update payment method');
    } finally {
      setUpdatingPaymentMethodId(null);
    }
  };

  const handleDisableAutopay = async () => {
    setUpdatingPaymentMethodId('disabling');
    try {
      const result = await updateStripeAutopay(customerId, false);
      
      if (result.success) {
        toast.success('Autopay disabled');
        await onRefresh();
      } else {
        throw new Error(result.error || 'Failed to disable autopay');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to disable autopay');
    } finally {
      setUpdatingPaymentMethodId(null);
    }
  };

  // Show change payment method form if active
  if (showChangePaymentMethodForm) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn" 
           style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
            <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Change Autopay Payment Method</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-6 font-normal">
            Select a different payment method for automatic payments:
          </p>

          {stripePaymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No other payment methods available.</p>
              <p className="text-sm text-gray-500">
                Add payment methods in the Payment Methods section above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stripePaymentMethods.map((method) => {
                const isCurrentAutopayCard = method.id === stripePaymentMethodId;
                const brandLogos = {
                  visa: visaLogo,
                  mastercard: mastercardLogo,
                  amex: amexLogo,
                  'american-express': amexLogo,
                  discover: discoverLogo
                };
                return (
                  <div 
                    key={method.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors h-[72px] ${
                      isCurrentAutopayCard 
                        ? 'border-gray-400' 
                        : 'border-gray-200 hover:border-[#6b5b7e]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {method.card?.brand && brandLogos[method.card.brand.toLowerCase()] && (
                        <img 
                          src={brandLogos[method.card.brand.toLowerCase()]} 
                          alt={method.card.brand}
                          className="h-6 w-auto"
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        •••• {method.card?.last4}
                      </span>
                      <span className="text-sm text-gray-600 font-normal">
                        Expires {String(method.card?.exp_month).padStart(2, '0')}/{method.card?.exp_year}
                      </span>
                      {isCurrentAutopayCard && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    {!isCurrentAutopayCard && (
                    <button
                        onClick={() => handleChangePaymentMethod(method.id)}
                        disabled={updatingPaymentMethodId === method.id} // Only disable the clicked button
                        className={`text-sm px-4 py-2 text-[#6b5b7e] bg-white border border-[#6b5b7e] rounded-lg font-medium transition-colors ${
                            updatingPaymentMethodId === method.id ? 'opacity-50' : ''
                        }`}
                        >
                        {updatingPaymentMethodId === method.id ? 'Updating...' : 'Use This Card'}
                    </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowChangePaymentMethodForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const autopayState = (() => {
    if (isOnStripeAutopay) return 'STRIPE_ACTIVE';
    if (isOnLegacyAutopay) return 'LEGACY_ACTIVE';
    return 'NOT_ENROLLED';
  })();

  const brandLogos = {
    visa: visaLogo,
    mastercard: mastercardLogo,
    amex: amexLogo,
    'american-express': amexLogo,
    discover: discoverLogo
  };

  switch (autopayState) {
    case 'STRIPE_ACTIVE':
      // Try to find the autopay card by ID, or fall back to first payment method if no ID
      let autopayCard = stripePaymentMethodId 
        ? stripePaymentMethods.find(pm => pm.id === stripePaymentMethodId)
        : null;
      
      // If no specific payment method ID but autopay is enabled, use the first available card
      if (!autopayCard && stripePaymentMethods.length > 0) {
        autopayCard = stripePaymentMethods[0];
      }
      
      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#1a3552] via-[#13283f] to-[#0a1825] border-2 border-[#3B82F6] shadow-lg hover:shadow-xl">
                <svg className="w-7 h-7 text-white stroke-[0.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Automatic Payments</h3>
                <p className="text-sm text-green-600 font-medium">
                  Enabled - Your card will be charged automatically
                </p>
              </div>
            </div>
            
            <div className="relative autopay-options-dropdown">
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                className="px-4 py-2 rounded-lg font-medium transition-all text-sm text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center gap-2"
              >
                Options
                <svg className={`w-5 h-5 transition-transform ${showOptionsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showOptionsDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      if (!confirmDisable) {
                        setConfirmDisable(true);
                        setTimeout(() => setConfirmDisable(false), 3000);
                      } else {
                        setShowOptionsDropdown(false);
                        setConfirmDisable(false);
                        handleDisableAutopay();
                      }
                    }}
                    disabled={updatingPaymentMethodId === 'disabling'}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                      confirmDisable ? 'text-orange-700 font-medium' : 'text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {updatingPaymentMethodId === 'disabling' 
                      ? 'Disabling...' 
                      : confirmDisable 
                        ? 'Verify Disable Autopay' 
                        : 'Disable Autopay'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      setConfirmDisable(false);
                      setShowChangePaymentMethodForm(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Change Payment Method
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {autopayCard && (
            <div className="mt-4 ml-0 sm:ml-12 p-4 bg-gray-50 rounded-lg border border-gray-200 inline-flex items-center gap-3 min-w-[320px]">
              {autopayCard.card?.brand && brandLogos[autopayCard.card.brand.toLowerCase()] && (
                <img 
                  src={brandLogos[autopayCard.card.brand.toLowerCase()]} 
                  alt={autopayCard.card.brand}
                  className="h-7 w-auto"
                />
              )}
              <div className="flex-1">
                <p className="text-base font-medium text-gray-900">
                  •••• {autopayCard.card?.last4}
                </p>
                <p className="text-sm text-gray-600 font-normal">
                  Expires {String(autopayCard.card?.exp_month).padStart(2, '0')}/{autopayCard.card?.exp_year}
                </p>
              </div>
            </div>
          )}
        </div>
      );

    case 'LEGACY_ACTIVE':
      return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
              <svg className="w-7 h-7 text-white stroke-[0.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Legacy Autopay System</h3>
              <span className="text-sm text-gray-600 font-normal">Currently enrolled in legacy system</span>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-700 font-normal">
                You're currently enrolled in our legacy autopay system. To upgrade to our new enhanced autopay system with more features, please contact our support team.
              </p>
              
              {cardDetails && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2 font-normal">Current payment method on file:</p>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cardType = (cardDetails.type || '').toLowerCase().replace(/\s+/g, '');
                      const cardBrand = cardType === 'mastercard' ? 'mastercard' : 
                                       cardType === 'visa' ? 'visa' : 
                                       cardType === 'americanexpress' || cardType === 'amex' ? 'amex' : 
                                       cardType === 'discover' ? 'discover' : null;
                      
                      if (cardBrand && brandLogos[cardBrand]) {
                        return (
                          <img 
                            src={brandLogos[cardBrand]} 
                            alt={cardDetails.type}
                            className="h-10 w-auto"
                          />
                        );
                      } else {
                        return (
                          <div className="w-16 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {cardDetails.type?.substring(0, 4).toUpperCase() || 'CARD'}
                            </span>
                          </div>
                        );
                      }
                    })()}
                    <div>
                      <p className="font-medium text-gray-900">
                        •••• {cardDetails.last4}
                      </p>
                      <p className="text-sm text-gray-600 font-normal">
                        Expires {cardDetails.expiration}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits of upgrading:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="font-normal">• Manage payment methods online</li>
                  <li className="font-normal">• Instant payment confirmations</li>
                  <li className="font-normal">• View payment history and receipts</li>
                </ul>
              </div>

              <div className="flex justify-center pt-2">
                <a 
                  href={`mailto:support@alcor.org?subject=Autopay%20Migration%20Request&body=Hello,%0A%0AI%20would%20like%20to%20upgrade%20from%20the%20legacy%20autopay%20system%20to%20the%20new%20Stripe%20autopay%20system.%0A%0ACustomer%20ID:%20${customerId}%0A%0AThank%20you!`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border-2 border-[#6b5b7e] rounded-lg transition-all text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email support@alcor.org
                </a>
              </div>
            </div>
          </div>
        </div>
      );

    case 'NOT_ENROLLED':
      return (
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
              <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Enable Autopay</h3>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-6 font-normal">
              Enable autopay to automatically pay your invoices when they become due.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Never miss a payment</p>
                  <p className="text-sm text-gray-600 font-normal">Invoices are paid automatically on their due date</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Secure & convenient</p>
                  <p className="text-sm text-gray-600 font-normal">Powered by Stripe for maximum security</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Full control</p>
                  <p className="text-sm text-gray-600 font-normal">Change or disable anytime from this page</p>
                </div>
              </div>
            </div>

            {stripePaymentMethods.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 font-normal">
                  You need to add a payment method before enabling autopay.
                </p>
                <button
                  disabled={true}
                  className="w-full px-4 py-3 text-gray-400 bg-gray-100 border-2 border-gray-200 rounded-lg font-medium cursor-not-allowed"
                >
                  Add Payment Method First
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3 font-normal">
                  Select a payment method to use for autopay:
                </p>
                {stripePaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#6b5b7e] transition-colors h-[72px]">
                    <div className="flex items-center gap-3">
                      {method.card?.brand && (
                        <img 
                          src={brandLogos[method.card.brand.toLowerCase()]} 
                          alt={method.card.brand}
                          className="h-6 w-auto"
                        />
                      )}
                      <span className="font-medium text-gray-900">
                        •••• {method.card?.last4}
                      </span>
                      <span className="text-sm text-gray-600 font-normal">
                        Expires {String(method.card?.exp_month).padStart(2, '0')}/{method.card?.exp_year}
                      </span>
                    </div>
                        <button
                            onClick={() => handleEnableAutopay(method.id)}
                            disabled={updatingPaymentMethodId === method.id} // Only disable the clicked button
                            className={`text-sm px-4 py-2 text-[#6b5b7e] bg-white border border-[#6b5b7e] rounded-lg font-medium transition-colors ${
                                updatingPaymentMethodId === method.id 
                                ? 'opacity-50' 
                                : 'hover:bg-[#6b5b7e] hover:text-white'
                            }`}
                            >
                            {updatingPaymentMethodId === method.id ? 'Enabling...' : 'Use for Autopay'}
                        </button>
                    </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};

const PaymentMethodsTab = () => {
  const { customerId: contextCustomerId } = useMemberPortal();
  
  // State management
  const [data, setData] = useState(null);
  const [stripePaymentMethods, setStripePaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  
  // Validate customer ID
  const customerId = contextCustomerId && 
                    contextCustomerId !== 'pending' && 
                    contextCustomerId !== 'undefined' &&
                    contextCustomerId !== 'null' &&
                    !isNaN(contextCustomerId) ? contextCustomerId : null;

  const navigate = useNavigate();

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .payment-page * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .payment-page h1,
      .payment-page h2,
      .payment-page h3,
      .payment-page h4 {
        font-weight: 400 !important;
      }
      .payment-page .font-medium {
        font-weight: 400 !important;
      }
      .payment-page .font-semibold {
        font-weight: 500 !important;
      }
      .payment-page .font-bold {
        font-weight: 500 !important;
      }
      .payment-page p,
      .payment-page span,
      .payment-page div {
        font-weight: 300 !important;
      }
      .payment-page .text-xs {
        font-weight: 400 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    if (!customerId) {
      console.log('No valid customer ID, skipping data fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch autopay status from consolidated endpoint
      console.log('Fetching payment method data for customer:', customerId);
      const autopayData = await paymentMethodsDataService.getPaymentMethodData(customerId);
      
      console.log('Autopay data received:', {
        legacyAutopay: autopayData.legacyAutopay,
        stripeAutopay: autopayData.stripeAutopay,
        hasStripeIntegration: !!autopayData.stripeIntegration,
        hasSalesOrderAnalysis: !!autopayData.salesOrderAnalysis
      });
      
      setData(autopayData);

      // Fetch actual Stripe payment methods using the service function
      const stripeData = await getPaymentMethods();
      console.log('Stripe payment methods received:', stripeData.paymentMethods?.length || 0);
      
      setStripePaymentMethods(stripeData.paymentMethods || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load payment information');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [customerId]);

  const handleRefresh = () => {
    console.log('Refreshing payment method data...');
    fetchAllData();
  };

  const handleRemovePaymentMethod = async (paymentMethodId) => {
    try {
      const result = await removePaymentMethodService(paymentMethodId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove payment method');
      }
      
      toast.success('Payment method removed');
      handleRefresh();
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentForm(true);
  };

  const handlePaymentFormSuccess = async () => {
    try {
      // Fetch the new data first while still showing the form
      await fetchAllData();
      
      // Only hide the form after data is successfully loaded
      setShowAddPaymentForm(false);
    } catch (error) {
      // If refresh fails, still hide the form but the error will be shown
      console.error('Error refreshing after adding payment method:', error);
      setShowAddPaymentForm(false);
    }
  };

  const handlePaymentFormCancel = () => {
    setShowAddPaymentForm(false);
  };

  if (isLoading) {
    return (
      <div className="payment-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  // All payment methods including legacy if exists
  const allPaymentMethods = stripePaymentMethods.map(method => ({ 
    ...method, 
    source: 'stripe' 
  }));

  // If showing add payment form, render that instead
  if (showAddPaymentForm) {
    return (
      <div className="payment-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="h-8"></div>
        
        <div className="px-4 md:px-0">
          <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn" 
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#665a85] via-[#52476b] to-[#3e3551] border-2 border-[#E879F9] shadow-lg hover:shadow-xl">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add Payment Method</h2>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Add a new card to your account
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              <Elements stripe={stripePromise}>
                <PaymentSetupForm 
                  onSuccess={handlePaymentFormSuccess}
                  onCancel={handlePaymentFormCancel}
                  autopayOnly={false}
                />
              </Elements>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secure
                  </span>
                  <span>Powered by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main payment methods view
  return (
    <div className="payment-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="h-8"></div>
      
      <div className="px-4 md:px-0">
        {/* Payment Methods Section - moved to top */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 md:mb-12">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#665a85] via-[#52476b] to-[#3e3551] border-2 border-[#E879F9] shadow-lg hover:shadow-xl">
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
                <p className="text-sm text-gray-500 font-normal mt-1">
                  Your saved payment methods and cards on file
                </p>
              </div>
            </div>
            {/* Hide on mobile if no payment methods */}
            <div className={`${allPaymentMethods.length === 0 ? 'hidden lg:flex' : 'hidden lg:flex'} justify-end lg:justify-start`}>
              <button
                onClick={handleAddPaymentMethod}
                className="px-4 py-2 text-[#6b5b7e] bg-white border-2 border-[#6b5b7e] rounded-lg text-sm font-medium"
              >
                Add Payment Method
              </button>
            </div>
          </div>

          {allPaymentMethods.length === 0 ? (
            <div className="text-center py-16 animate-fadeIn">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-gray-700 text-lg font-normal">No payment methods found</p>
              <p className="text-sm text-gray-500 mt-2 font-normal">
                Add a payment method to enable features like autopay
              </p>
              <button
                onClick={handleAddPaymentMethod}
                className="mt-4 px-6 py-2 text-[#6b5b7e] bg-white border-2 border-[#6b5b7e] rounded-lg font-medium"
              >
                Add Your First Card
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {allPaymentMethods.map((method, index) => (
                  <PaymentMethodCard
                    key={method.id || `method-${index}`}
                    paymentMethod={method}
                    source={method.source}
                    isAutopayCard={
                      method.source === 'stripe' && 
                      method.id === (data?.stripeIntegration?.stripe?.defaultPaymentMethodId || 
                                    data?.autopayStatus?.stripe?.defaultPaymentMethodId)
                    }
                    onRemove={handleRemovePaymentMethod}
                  />
                ))}
              </div>
              {/* Show Add Payment Method button below the list on mobile */}
              <div className="mt-6 flex lg:hidden justify-center">
                <button
                  onClick={handleAddPaymentMethod}
                  className="px-4 py-2 text-[#6b5b7e] bg-white border-2 border-[#6b5b7e] rounded-lg text-sm font-medium"
                >
                  Add Payment Method
                </button>
              </div>
            </>
          )}
        </div>

        {/* Autopay Section - moved to bottom */}
        {customerId && (
          <AutopaySection 
            customerId={customerId} 
            stripePaymentMethods={stripePaymentMethods}
            autopayData={data}
            onRefresh={handleRefresh}
            onAddPaymentMethod={handleAddPaymentMethod}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsTab;