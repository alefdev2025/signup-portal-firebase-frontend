import React from 'react';

const BillingInformation = ({ billingAddress, isLoading }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-fadeIn animation-delay-600" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg relative overflow-hidden" style={{ 
          background: 'linear-gradient(135deg, #4a5578 0%, #3e466d 50%, #485387 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)'
        }}>
          <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-10"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Billing Information</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
        </div>
      ) : billingAddress ? (
        <div className="space-y-3 text-base">
          <p className="text-gray-900 font-medium text-lg">
            {billingAddress.addressee}
          </p>
          <p className="text-gray-600 font-light">{billingAddress.addr1}</p>
          {billingAddress.addr2 && (
            <p className="text-gray-600 font-light">{billingAddress.addr2}</p>
          )}
          <p className="text-gray-600 font-light">
            {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
          </p>
          <p className="text-gray-600 font-light">{billingAddress.country || 'United States'}</p>
          <p className="text-xs text-[#6b7280] mt-3 italic">
            From most recent invoice
          </p>
        </div>
      ) : (
        <div className="text-[#6b7280] text-base">
          <p>No billing address available</p>
          <p className="text-sm mt-2"></p>
        </div>
      )}
    </div>
  );
};

export default BillingInformation;