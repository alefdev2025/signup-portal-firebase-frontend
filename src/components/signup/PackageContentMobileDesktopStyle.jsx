// File: components/PackageContentMobileDesktopStyle.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

// Font family to match ContactInfoPage
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Mobile View with Desktop Styling - White header, colored bottom
export const PackageContentMobileDesktopStyle = ({ 
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
    <div className="md:hidden h-full flex flex-col">
      {/* ===== SELECTED INDICATOR ===== */}
      <div className="bg-white border-b border-gray-200" style={{ height: "60px" }}>
        {selectedOption === option && (
          <div className="text-center py-3.5">
            <span className="text-[#775684] px-6 py-1.5 text-base font-bold tracking-wide animate-fadeInDown">
              SELECTED
            </span>
          </div>
        )}
        {selectedOption !== option && <div className="h-[60px]"></div>}
      </div>
      
      {/* ===== WHITE HEADER SECTION (Desktop Style) ===== */}
      <div className="bg-white p-6 pl-5" style={{ fontFamily: SYSTEM_FONT }}>
        {/* Header with icon and title */}
        <div className="flex items-center">
          {/* Gradient icon container */}
          <div className="p-3 rounded-lg transform transition duration-300 mr-3" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
            {option === "neuro" && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
            {option === "wholebody" && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            {option === "basic" && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-medium text-gray-900">{planOption.title}</h3>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 mt-4 mb-6 text-base font-light">
          {planOption.short}
        </p>
        
        {/* Pricing info with gray background */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-base font-medium">Preservation:</span>
            <span className="font-medium text-gray-900 text-base">
              {option === "basic" ? "Not required" : `$${calculatePreservationEstimate(option)?.toLocaleString()}`}
            </span>
          </div>
          
          {/* Add subtext for all options */}
          {(option === "neuro" || option === "wholebody") && (
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400 font-light italic">Typically $25-$250/month with life insurance</span>
            </div>
          )}
          {option === "basic" && (
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400 font-light italic">Pet preservation available as a basic member for an additional cost</span>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4 mb-2">
            <span className="text-gray-600 text-base font-medium">Membership:</span>
            <span className="font-medium text-gray-900 text-base">
              ${Math.ceil(parseInt(getPackagePrice("standard").replace(/[$,]/g, '')) / 12)}/month
            </span>
          </div>
        </div>
      </div>
      
      {/* ===== COLORED "WHAT'S INCLUDED" SECTION ===== */}
      <div className="text-white p-6 pb-7 flex-grow" style={{ 
        fontFamily: SYSTEM_FONT, 
        ...(option === "neuro" ? { background: 'linear-gradient(135deg, #785683 0%, #162740 30%, #443660 100%)' } : 
            option === "basic" ? { background: 'linear-gradient(135deg, #443660 0%, #162740 30%, #443660 100%)' } : 
            planOption.gradientStyle)
      }}>
        <h4 className="text-white mb-5 text-lg font-medium">What's Included:</h4>
        
        <div className="space-y-4 pl-3 text-gray-200 text-base font-light">
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
                <span>Possible Revival</span>
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
                <span>Possible Revival</span>
              </div>
            </>
          )}
          {option === "basic" && (
            <>
              <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert" />
                <span>Member Events & Resources</span>
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
                <span>Consultation Services</span>
              </div>
            </>
          )}
        </div>
        
        {/* Bottom description */}
        <p className="mt-6 pt-4 border-t border-gray-600 text-gray-300 text-sm font-light">
          {planOption.long}
        </p>
      </div>
    </div>
  );
};