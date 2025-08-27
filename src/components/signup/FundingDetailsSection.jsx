// File: pages/FundingDetailsSection.jsx - Updated with IconBox
import React from "react";
import IconBox from "./IconBox"; // Add this import

// Define system font stack
const SYSTEM_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const FundingDetailsSection = ({
  selectedOption,
  animationComplete
}) => {
  return (
    <div 
      className={`mt-12 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-700 ease-in-out delay-600 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ fontFamily: SYSTEM_FONT }}
    >
      <div className="p-8 md:p-10 space-y-6">
        {/* Payment info box - always shown */}
        <div className="flex items-start">
          <IconBox>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </IconBox>
          <div className="ml-4 md:ml-5 pt-1">
            <p className="text-sm md:text-base text-gray-900 font-medium mb-2" style={{ fontFamily: SYSTEM_FONT }}>
              Today's Payment
            </p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-normal" style={{ fontFamily: SYSTEM_FONT }}>
              No matter which funding option you choose, you'll only be charged an application fee or your first year membership as a basic member today.
            </p>
          </div>
        </div>

        {/* Insurance-specific info - only shown when insurance is selected */}
        {selectedOption === "insurance" && (
          <div className="flex items-start pt-6 border-t border-gray-100">
            <IconBox>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </IconBox>
            <div className="ml-4 md:ml-5 pt-1">
              <p className="text-sm md:text-base text-gray-900 font-medium mb-2" style={{ fontFamily: SYSTEM_FONT }}>
                Life Insurance Details
              </p>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-normal" style={{ fontFamily: SYSTEM_FONT }}>
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