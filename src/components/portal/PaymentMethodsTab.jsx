// File: components/portal/PaymentMethodsTab.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { getPaymentMethods, setDefaultPaymentMethod, removePaymentMethod, updateAutoPaySettings } from '../../services/paymentMethods';

// Import card logos
import visaLogo from '../../assets/images/cards/visa.png';
import mastercardLogo from '../../assets/images/cards/mastercard.png';
import amexLogo from '../../assets/images/cards/american-express.png';
import discoverLogo from '../../assets/images/cards/discover.png';

// Payment Method Card Component
const PaymentMethodCard = ({ paymentMethod, isDefault, onMakeDefault, onRemove, totalCards }) => {
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleMakeDefault = async () => {
    setIsUpdating(true);
    try {
      await setDefaultPaymentMethod(paymentMethod.id);
      onMakeDefault(paymentMethod.id);
    } catch (error) {
      console.error('Error setting default:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = () => {
    console.log('PaymentMethodCard handleRemove called');
    console.log('Payment method:', paymentMethod);
    console.log('Is default?', isDefault);
    onRemove(paymentMethod);
  };

  return (
    <div className={`border ${isDefault ? 'border-[#785683] bg-[#f8f6f9]' : 'border-gray-200'} rounded-lg p-6 hover:shadow-md transition-all`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {getCardLogo(paymentMethod.card.brand)}
          <div>
            <p className="font-medium text-[#2a2346] text-base">
              •••• {paymentMethod.card.last4}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              Expires {String(paymentMethod.card.exp_month).padStart(2, '0')}/{paymentMethod.card.exp_year}
            </p>
            {isDefault && (
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-[#e5d4f1] text-[#6b5b7e] px-3 py-1 rounded-lg text-xs font-medium">Default</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isDefault && (
            <button
              onClick={handleMakeDefault}
              disabled={isUpdating}
              className="text-[#6b5b7e] hover:text-[#4a4266] text-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              Make Default
            </button>
          )}
          <button
            onClick={() => {
              console.log('Remove button clicked directly');
              handleRemove();
            }}
            disabled={isUpdating || (isDefault && totalCards > 1)}
            className={`text-sm transition-colors disabled:opacity-50 ${
              isDefault && totalCards > 1
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-red-600 hover:text-red-700 cursor-pointer'
            }`}
            title={isDefault && totalCards > 1 ? "Set another card as default first" : "Remove payment method"}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Payment Methods Tab Component
const PaymentMethodsTab = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [autoPaySettings, setAutoPaySettings] = useState({
    membershipRenewal: false,
    serviceAgreements: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

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
      .payment-methods-page p,
      .payment-methods-page span,
      .payment-methods-page div {
        font-weight: 300 !important;
      }
      .payment-methods-page .text-xs {
        font-weight: 400 !important;
      }
      .payment-methods-page .text-sm {
        font-weight: 400 !important;
      }
      .payment-methods-page .font-light {
        font-weight: 400 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch payment methods and settings
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getPaymentMethods();
      setPaymentMethods(data.paymentMethods || []);
      setDefaultPaymentMethodId(data.defaultPaymentMethodId);
      setAutoPaySettings(data.autoPaySettings || {
        membershipRenewal: false,
        serviceAgreements: false
      });
    } catch (err) {
      setError('Failed to load payment information');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAutoPayToggle = async (setting, value) => {
    try {
      const newSettings = { ...autoPaySettings, [setting]: value };
      await updateAutoPaySettings(newSettings);
      setAutoPaySettings(newSettings);
    } catch (error) {
      console.error('Error updating auto-pay settings:', error);
      // Revert the toggle
      setAutoPaySettings(prev => ({ ...prev, [setting]: !value }));
    }
  };

  const handleMakeDefault = (paymentMethodId) => {
    setDefaultPaymentMethodId(paymentMethodId);
    fetchData();
  };

  const handleRemove = async (paymentMethod) => {
    console.log('Parent handleRemove called with:', paymentMethod);
    
    setIsRemoving(true);
    try {
      await removePaymentMethod(paymentMethod.id);
      await fetchData();
    } catch (error) {
      console.error('Error removing payment method:', error);
      alert(error.message || 'Failed to remove payment method');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="payment-methods-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-methods-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="h-8"></div>
        <div className="px-4 md:px-0">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            <p className="font-bold">Error loading payment methods</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-methods-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Small top padding */}
      <div className="h-8"></div>
      
      <div className="px-4 md:px-0">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Payment Methods</h1>

        <div className="bg-white rounded-2xl border border-gray-200 p-10 mb-8 animate-fadeIn animation-delay-100" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Saved Payment Methods</h2>
            {paymentMethods.length > 0 && (
              <p className="text-sm text-gray-500">
                These cards were saved during checkout for your convenience
              </p>
            )}
          </div>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-16 animate-fadeIn">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-[#4a3d6b] text-lg">No payment methods saved</p>
              <p className="text-sm text-gray-500 mt-2">
                You can save a payment method during your next checkout
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  paymentMethod={method}
                  isDefault={method.id === defaultPaymentMethodId}
                  onMakeDefault={handleMakeDefault}
                  onRemove={handleRemove}
                  totalCards={paymentMethods.length}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-10 animate-fadeIn animation-delay-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Auto-Pay Settings</h2>
            <span className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium border border-amber-200">
              Coming Soon
            </span>
          </div>
          
          <div className="text-center py-12 animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#4a3d6b] text-base mb-2">Auto-pay functionality is coming soon</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              We're working on bringing you the ability to onboard and manage your membership autopay settings. 
              Check back soon for this convenient feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsTab;