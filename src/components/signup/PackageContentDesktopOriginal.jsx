// File: components/PackageContentDesktopOriginal.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

// Font family to match ContactInfoPage
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Desktop Original View Component - Used when USE_UPDATED_VERSION = false
export const PackageContentDesktopOriginal = ({ 
  option, 
  selectedOption, 
  selectOption, 
  fadeInStyle, 
  getAnimationDelay, 
  calculatePreservationEstimate, 
  getPackagePrice,
  planOption 
}) => {
  return (
    <div className="block h-full">
      <div className="flex flex-col h-full">
        {/* ===== DESKTOP LAYOUT (WHITE HEADER) ===== */}
        <div className="bg-white p-7 md:px-10 md:pt-10 md:pb-8 pl-5 md:pl-10" style={{ fontFamily: SYSTEM_FONT }}>
          {/* Desktop header content */}
          <div className="flex items-center">
            {/* Desktop icon container - adjusted size */}
            <div className="p-3 md:p-3 rounded-lg transform transition duration-300 mr-3" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
              {option === "neuro" && (
                <svg className="w-6 h-6 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              {option === "wholebody" && (
                <svg className="w-6 h-6 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {option === "basic" && (
                <svg className="w-6 h-6 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              )}
            </div>
            <h3 style={{ fontSize: '18px' }} className="font-normal text-gray-900">{planOption.title}</h3>
          </div>
          
          {/* More vertical spacing */}
          <p style={{ fontSize: '14px' }} className="text-gray-600 mt-2 md:mt-5 mb-8 md:mb-7 font-light">
            {planOption.short}
          </p>
          
          {/* Desktop pricing info - with subtext for first two cards */}
          <div className="mt-8 md:mt-8 pt-4 md:pt-4 border-t border-gray-300">
            <div className="flex justify-between items-center">
              <span style={{ fontSize: '16px', fontWeight: '500' }} className="text-gray-500">Preservation:</span>
              <span style={{ fontSize: '16px' }} className="font-normal text-gray-900">
                {option === "basic" ? "Not required" : `$${calculatePreservationEstimate(option)?.toLocaleString()}`}
              </span>
            </div>
            
            {/* Add subtext for all options */}
            {(option === "neuro" || option === "wholebody") && (
              <div className="flex justify-end mt-1">
                <span style={{ fontSize: '13px' }} className="text-gray-400 font-light italic">As low as $25-$75/month with life insurance</span>
              </div>
            )}
            {option === "basic" && (
              <div className="flex justify-end mt-1">
                <span style={{ fontSize: '13px' }} className="text-gray-400 font-light italic">Pet preservation availble as a basic member for an additional cost</span>
              </div>
            )}
          </div>
          
          {/* Increased bottom margin for more space */}
          <div className="flex justify-between items-center mt-6 md:mt-5 mb-2">
            <span style={{ fontSize: '16px', fontWeight: '500' }} className="text-gray-500">Membership:</span>
            <span style={{ fontSize: '16px' }} className="font-normal text-gray-900">
              {getPackagePrice("standard") ? `$${parseFloat(getPackagePrice("standard")).toLocaleString()}/year` : "—"}
            </span>
          </div>
        </div>
        
        {/* ===== DESKTOP: WHAT'S INCLUDED (COLORED BACKGROUND) ===== */}
        <div className="text-white pt-8 px-10 pb-8 flex-grow flex flex-col" style={{ 
          fontFamily: SYSTEM_FONT,
          ...(option === "neuro" ? { background: 'linear-gradient(135deg, #785683 0%, #162740 30%, #443660 100%)' } : 
              option === "basic" ? { background: 'linear-gradient(135deg, #443660 0%, #162740 30%, #443660 100%)' } : 
              planOption.gradientStyle)
        }}>
          <h4 className="text-white mb-6 text-sm font-normal">What's Included:</h4>
          
          <div className="space-y-3 pl-5 text-gray-200 text-sm font-light flex-grow">
            {option === "neuro" && (
              <>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Standby Service</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Neuro Cryopreservation</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Long-Term Storage</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Potential Restoration</span>
                </div>
              </>
            )}
            {option === "wholebody" && (
              <>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Standby Service</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Full Body Cryopreservation</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Long-Term Storage</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Potential Restoration</span>
                </div>
              </>
            )}
            {option === "basic" && (
              <>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Lock in age-based dues</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Pet Preservation Options</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Add Cryopreservation Anytime</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Member Events</span>
                </div>
              </>
            )}
          </div>
          {/* Removed the paragraph with planOption.long text that was below the list */}
        </div>
      </div>
    </div>
  );
};