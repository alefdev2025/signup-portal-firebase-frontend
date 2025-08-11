// StripeAutopayBanner.js
import React from 'react';

const StripeAutopayBanner = ({ stripeAutopayStatus, setActiveTab }) => {
  
  const isAutopayEnabled = stripeAutopayStatus?.autopayEnabled;
  const hasPaymentMethod = stripeAutopayStatus?.hasPaymentMethod;
  
  // Don't show banner if autopay is already enabled
  if (isAutopayEnabled) {
    return null;
  }
  
  const handleSetupAutopay = () => {
    // Simply change the tab
    if (setActiveTab) {
      setActiveTab('payments-methods');
    }
  };
  
  return (
    <div className="mt-6 mb-6 px-4 md:px-0 animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-[1.25rem] overflow-hidden -mx-4 md:mx-0" 
           style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        <div className="p-10 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Enable Automatic Payments</h2>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed font-normal max-w-xl">
                Set up autopay to ensure your membership stays active without manual payments.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <button
                onClick={handleSetupAutopay}
                className="px-6 py-2.5 bg-white border border-[#12243c] text-[#12243c] rounded-lg hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white focus:border-[#12243c] focus:ring-2 focus:ring-[#12243c] focus:ring-opacity-20 transition-all text-sm"
              >
                {hasPaymentMethod ? 'Enable Autopay' : 'Set Up Autopay'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Benefits section */}
        <div className="p-8">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Never miss a payment</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Save time</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-700">Easy to manage</span>
            </div>
          </div>
          
          {hasPaymentMethod && !isAutopayEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                You have a payment method on file. Enable autopay to automatically pay future invoices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeAutopayBanner;