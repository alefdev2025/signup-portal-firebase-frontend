// File: components/portal/PaymentMethodsTab.jsx
import React, { useState, useEffect } from 'react';
import { getPaymentMethods, setDefaultPaymentMethod, removePaymentMethod, updateAutoPaySettings } from '../../services/paymentMethods';

// Payment Method Card Component
const PaymentMethodCard = ({ paymentMethod, isDefault, onMakeDefault, onRemove }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getCardBrandStyle = (brand) => {
    const brandStyles = {
      visa: 'bg-gradient-to-r from-blue-600 to-blue-400',
      mastercard: 'bg-gradient-to-r from-red-600 to-yellow-500',
      amex: 'bg-gradient-to-r from-blue-500 to-blue-700',
      discover: 'bg-gradient-to-r from-orange-500 to-orange-600',
      default: 'bg-gradient-to-r from-gray-600 to-gray-400'
    };
    return brandStyles[brand] || brandStyles.default;
  };

  const getCardBrandName = (brand) => {
    const brandNames = {
      visa: 'VISA',
      mastercard: 'MC',
      amex: 'AMEX',
      discover: 'DISC',
      default: 'CARD'
    };
    return brandNames[brand] || brandNames.default;
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

  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      setIsUpdating(true);
      try {
        await removePaymentMethod(paymentMethod.id);
        onRemove(paymentMethod.id);
      } catch (error) {
        console.error('Error removing payment method:', error);
        alert(error.message);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className={`border ${isDefault ? 'border-green-200 bg-green-50/50' : 'border-gray-200'} rounded-lg p-5`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-10 ${getCardBrandStyle(paymentMethod.card.brand)} rounded flex items-center justify-center text-white text-sm font-bold shadow-md`}>
            {getCardBrandName(paymentMethod.card.brand)}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {paymentMethod.card.brand.charAt(0).toUpperCase() + paymentMethod.card.brand.slice(1)} ending in {paymentMethod.card.last4}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              Expires {String(paymentMethod.card.exp_month).padStart(2, '0')}/{paymentMethod.card.exp_year}
            </p>
            {isDefault && (
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Default</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isDefault && (
            <button
              onClick={handleMakeDefault}
              disabled={isUpdating}
              className="text-[#6b5b7e] hover:text-[#4a4266] font-medium text-sm transition-colors disabled:opacity-50"
            >
              Make Default
            </button>
          )}
          <button
            onClick={handleRemove}
            disabled={isUpdating || isDefault}
            className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors disabled:opacity-50"
            title={isDefault ? "Cannot remove default payment method" : "Remove payment method"}
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

  const handleRemove = (paymentMethodId) => {
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6b5b7e]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="mt-2 text-sm text-red-700 underline hover:no-underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <h1 className="text-3xl font-light text-gray-900 mb-8">Payment Methods</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-normal text-gray-900">Saved Payment Methods</h2>
          {paymentMethods.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              These cards were saved during checkout for your convenience
            </p>
          )}
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No payment methods saved</p>
            <p className="text-sm text-gray-500">
              You can save a payment method during your next checkout
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                paymentMethod={method}
                isDefault={method.id === defaultPaymentMethodId}
                onMakeDefault={handleMakeDefault}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-normal text-gray-900 mb-6">Auto-Pay Settings</h2>
        
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8 px-4">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-gray-600 font-medium mb-1">Auto-pay requires a saved payment method</p>
            <p className="text-sm text-gray-500">Save a card during checkout to enable auto-pay</p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="font-medium text-gray-900">Annual Membership Renewal</p>
                <p className="text-sm text-gray-600 mt-0.5">Automatically renew your membership each year</p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={autoPaySettings.membershipRenewal}
                  onChange={(e) => handleAutoPayToggle('membershipRenewal', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b5b7e]"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="font-medium text-gray-900">Service Agreements</p>
                <p className="text-sm text-gray-600 mt-0.5">Auto-renew standby and other service agreements</p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={autoPaySettings.serviceAgreements}
                  onChange={(e) => handleAutoPayToggle('serviceAgreements', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b5b7e]"></div>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsTab;