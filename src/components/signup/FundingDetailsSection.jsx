// File: pages/FundingDetailsSection.jsx - Simplified Version
import React from "react";

const FundingDetailsSection = ({
  selectedOption,
  animationComplete
}) => {
  return (
    <div className={`mt-12 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-700 ease-in-out delay-600 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="p-8 md:p-10 space-y-6">
        {/* Payment info box - always shown */}
        <div className="flex items-start">
          <div className="bg-[#775684] p-3 md:p-4 rounded-lg flex-shrink-0">
            <svg className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4 md:ml-6 pt-1">
            <p className="text-base md:text-lg text-gray-900 font-semibold mb-2">
              Today's Payment
            </p>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              No matter which funding option you choose, today we'll only process payment for your membership. Funding for cryopreservation will be arranged later.
            </p>
          </div>
        </div>

        {/* Insurance-specific info - only shown when insurance is selected */}
        {selectedOption === "insurance" && (
          <div className="flex items-start pt-6 border-t border-gray-100">
            <div className="bg-[#775684] p-3 md:p-4 rounded-lg flex-shrink-0">
              <svg className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4 md:ml-6 pt-1">
              <p className="text-base md:text-lg text-gray-900 font-semibold mb-2">
                Life Insurance Details
              </p>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                You can add your life insurance details or explore funding options in the membership portal after you complete your signup.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingDetailsSection;