// LegacyAutopayBanner.js
import React from 'react';

const LegacyAutopayBanner = ({ salesOrderAnalysis, setActiveTab }) => {
  
  const handleUpgradeAutopay = () => {
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">You're on our legacy autopay system</h2>
              </div>
              <p className="text-gray-700 text-base leading-relaxed font-normal max-w-xl">
                It's recommended to upgrade in order to change your payment method and manage your payment settings in the portal.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <button
                onClick={handleUpgradeAutopay}
                className="px-6 py-2.5 bg-white border border-[#12243c] text-[#12243c] rounded-lg hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white focus:border-[#12243c] focus:ring-2 focus:ring-[#12243c] focus:ring-opacity-20 transition-all text-sm"
              >
                Manage Autopay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegacyAutopayBanner;