import React from 'react';

const BillingInformation = ({ billingAddress, isLoading }) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header */}
      <div className="p-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Billing Information</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        ) : billingAddress ? (
          <div className="space-y-2">
            <p className="text-gray-900 font-medium text-base mb-1">
              {billingAddress.addressee}
            </p>
            <p className="text-gray-700 text-sm font-normal">{billingAddress.addr1}</p>
            {billingAddress.addr2 && (
              <p className="text-gray-700 text-sm font-normal">{billingAddress.addr2}</p>
            )}
            <p className="text-gray-700 text-sm font-normal">
              {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
            </p>
            <p className="text-gray-700 text-sm font-normal">{billingAddress.country || 'United States'}</p>
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-normal italic">
                From most recent invoice
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-700 text-base">No billing address available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingInformation;