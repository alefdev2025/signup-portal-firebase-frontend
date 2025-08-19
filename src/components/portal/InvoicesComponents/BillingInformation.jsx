import React from 'react';

const BillingInformation = ({ billingAddress, isLoading }) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header */}
      <div className="p-6 sm:p-8 2xl:p-10 border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 2xl:gap-4">
          <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#0a41cc] shadow-lg hover:shadow-xl">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg 2xl:text-xl font-semibold text-gray-900">Billing Information</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 2xl:p-8">
        {isLoading ? (
          <div className="space-y-2 sm:space-y-2.5 2xl:space-y-3">
            <div className="h-3 sm:h-3.5 2xl:h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 sm:h-3.5 2xl:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-3 sm:h-3.5 2xl:h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        ) : billingAddress ? (
          <div className="space-y-1.5 sm:space-y-2 2xl:space-y-2.5">
            <p className="text-gray-900 font-medium text-sm sm:text-base 2xl:text-lg mb-1 sm:mb-1.5 2xl:mb-2">
              {billingAddress.addressee}
            </p>
            <p className="text-gray-700 text-[11px] sm:text-xs 2xl:text-sm font-normal">{billingAddress.addr1}</p>
            {billingAddress.addr2 && (
              <p className="text-gray-700 text-[11px] sm:text-xs 2xl:text-sm font-normal">{billingAddress.addr2}</p>
            )}
            <p className="text-gray-700 text-[11px] sm:text-xs 2xl:text-sm font-normal">
              {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
            </p>
            <p className="text-gray-700 text-[11px] sm:text-xs 2xl:text-sm font-normal">{billingAddress.country || 'United States'}</p>
            <div className="pt-3 sm:pt-4 2xl:pt-5 mt-3 sm:mt-4 2xl:mt-5 border-t border-gray-200">
              <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-500 font-normal italic">
                From most recent invoice
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 2xl:py-10">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 2xl:h-14 2xl:w-14 text-gray-400 mb-3 sm:mb-4 2xl:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-700 text-sm sm:text-base 2xl:text-lg">No billing address available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingInformation;