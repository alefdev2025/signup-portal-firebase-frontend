import React from 'react';

const LegacyAutopayBanner = () => {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-6 mb-8 mx-4 md:mx-0 animate-fadeIn" style={{ boxShadow: '4px 6px 12px rgba(251, 191, 36, 0.1)' }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              You're using our legacy autopay system
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Upgrade to our new enhanced autopay system for better features and security:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">Powered by Stripe for enhanced security</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">Support for 3D Secure authentication</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">Instant payment confirmations</span>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">Easy payment method management</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              <strong>How to upgrade:</strong> Simply pay your next invoice with a credit card and enable autopay during checkout.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="bg-amber-100 border border-amber-200 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-amber-700 font-medium">Current Status</p>
            <p className="text-sm font-semibold text-amber-900">Legacy Autopay</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegacyAutopayBanner;