// File: components/PackagePageContent.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";
import braintop from "../../assets/images/braintop.png";


// ============================================
// SECTION 1: PLAN OPTIONS DATA CONFIGURATION
// ============================================
// Font family to match ContactInfoPage
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// This object defines all the package options available to users
export const planOptions = {
  neuro: {
    title: "Neuropreservation",
    short: "Neuro preservation with Alcor’s advanced vitrification.",
    long: "Preserves the brain's neural connections that define your identity.",
    baseEstimate: 80000,
    internationalEstimate: 90000,
    titleBgColor: "bg-[#323053]",    // Purple background for headers
    iconBgColor: "bg-[#454575]",     // Lighter purple for icon containers
    gradientStyle: {
      background: 'linear-gradient(135deg, #443660 0%, #785683 25%, #996a68 50%, #ba8267 75%, #d29f4f 100%)'
    },
    icon: (
      <img src={alcorStar} alt="Neuro Icon" className="h-5 w-5" />
    )
  },
  wholebody: {
    title: "Whole Body",
    short: "Whole-Body preservation with Alcor’s advanced vitrification.",
    long: "Complete body preservation for potential full restoration.",
    baseEstimate: 220000,
    internationalEstimate: 230000,
    titleBgColor: "bg-[#1a2342]",    // Dark blue background
    iconBgColor: "bg-[#293253]",     // Lighter blue for icon containers
    gradientStyle: {
      background: 'linear-gradient(135deg, #162740 0%, #443660 70%, #785683 100%)'
    },
    icon: (
      <img src={alcorStar} alt="Whole Body Icon" className="h-5 w-5" />
    )
  },
  basic: {
    title: "Basic Membership",
    short: "Join now, decide on your cryopreservation type later.",
    long: "Basic membership with flexibility to upgrade later.",
    baseEstimate: 0,
    internationalEstimate: 0,        // No surcharge for basic membership
    titleBgColor: "bg-[#11243a]",    // Darkest blue background
    iconBgColor: "bg-[#1c324c]",     // Medium blue for icon containers
    gradientStyle: {
      //background: 'linear-gradient(135deg, #162740 0%, #443660 30%, #785683 60%, #996a68 80%, #ba8267 100%)'
      background: 'linear-gradient(135deg, #443660 0%, #785683 25%, #996a68 50%, #ba8267 75%, #d29f4f 100%)'
    },
    icon: (
      <img src={alcorStar} alt="Basic Membership Icon" className="h-5 w-5" />
    )
  }
};

// International pricing surcharge constant
export const INTERNATIONAL_SURCHARGE = 10000;

// ============================================
// SECTION 2: HELP CONTENT CONFIGURATION
// ============================================
// Content for the help panel that can be toggled
export const packageHelpContent = [
  {
    title: "Preservation Package",
    content: "Select your preferred preservation package and type. Each option provides different benefits and considerations."
  },
  {
    title: "Package Selection",
    content: "Your selection here will determine the type of contract and services provided."
  },
  {
    title: "Pricing Information",
    content: "Membership pricing is personalized based on your age. Members typically fund preservation services through life insurance policies."
  },
  {
    title: "Need assistance?",
    content: (
      <>
        Contact our support team at <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a> or call 623-552-4338.
      </>
    )
  }
];

// ============================================
// SECTION 3: LOADING COMPONENT
// ============================================
// Shows while pricing data is being calculated
export const LoadingComponent = ({ USE_UPDATED_VERSION }) => {
  return USE_UPDATED_VERSION ? (
    // Updated version loading style
    <div className="mt-4">
      <div className="bg-white shadow-sm rounded-lg p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-[#775684] mr-3"></div>
        <p className="text-gray-600">Calculating membership pricing...</p>
      </div>
    </div>
  ) : (
    // Original version loading style
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600"></div>
      <p className="mt-4 text-xl text-gray-600">Calculating pricing...</p>
    </div>
  );
};

// ============================================
// SECTION 4: ERROR COMPONENT
// ============================================
// Displays error messages when something goes wrong
export const ErrorComponent = ({ error, USE_UPDATED_VERSION }) => {
  return USE_UPDATED_VERSION ? (
    // Updated version error style
    <div className="mt-4 opacity-0 animate-fadeIn" style={{ animation: "fadeIn 0.5s forwards" }}>
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
        <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
      </div>
    </div>
  ) : (
    // Original version error style
    <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-8 opacity-0 animate-fadeIn" style={{ animation: "fadeIn 0.5s forwards" }}>
      <p className="text-red-700 text-lg">{error}</p>
      <p className="text-red-600 mt-2">Please try refreshing the page or contact support if this issue persists.</p>
    </div>
  );
};

// ============================================
// SECTION 5: UPDATED VERSION OPTION CARD
// ============================================
// This component is used when USE_UPDATED_VERSION = true
// Features: Inverted color scheme on desktop (white on top, color on bottom)
export const UpdatedVersionOptionCard = ({ 
  option, 
  selectedOption, 
  selectOption, 
  fadeInStyle, 
  getAnimationDelay, 
  calculatePreservationEstimate, 
  getPackagePrice 
}) => {
  const planOption = planOptions[option];
  
  return (
    <div 
      onClick={() => selectOption(option)} 
      className="cursor-pointer transform transition duration-300 hover:scale-[1.02]" 
      style={{...fadeInStyle, ...getAnimationDelay(option === "neuro" ? 0 : option === "wholebody" ? 1 : 2)}}
    >
      <div className={`rounded-2xl md:rounded-t-[2rem] md:rounded-b-3xl overflow-hidden shadow-md ${selectedOption === option ? "ring-2 ring-[#775684]" : "ring-1 ring-gray-400"} transition-all duration-300`}>
        
        {/* ===== SELECTED INDICATOR ===== */}
        <div className="bg-white border-b border-gray-200">
          {selectedOption === option && (
            <div className="text-center py-3.5">
              <span className="text-white px-5 py-1.5 text-base font-black tracking-wider uppercase bg-[#775684] rounded-md animate-fadeInDown">
                Selected
              </span>
            </div>
          )}
          {selectedOption !== option && <div className="h-14"></div>}
        </div>
        
        {/* ===== MOBILE LAYOUT (WHITE HEADER - MATCHING DESKTOP) ===== */}
        <div className="md:hidden flex flex-col h-full">
          {/* White header section - matching desktop style */}
          <div className="bg-white p-6" style={{ fontFamily: SYSTEM_FONT }}>
            <div className="flex items-center mb-4">
              {/* Icon container with gradient - same as desktop */}
              <div className="p-3 rounded-lg mr-3" style={{ 
                background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' 
              }}>
                {option === "neuro" && (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {option === "wholebody" && (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                {option === "basic" && (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-normal text-gray-900">{planOption.title}</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-6 font-light">
              {planOption.short}
            </p>
            
            {/* Pricing section in white area - matching desktop */}
            <div className="pt-4 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-base font-medium">Preservation:</span>
                <span className="font-normal text-gray-900 text-base">
                  {option === "basic" ? "Not required" : `$${calculatePreservationEstimate(option)?.toLocaleString()}`}
                </span>
              </div>
              
              {/* Subtext for preservation */}
              {(option === "neuro" || option === "wholebody") && (
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400 font-light italic">
                    As low as $25-$45/month with life insurance
                  </span>
                </div>
              )}
              {option === "basic" && (
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400 font-light italic">
                    Pet preservation available for additional cost
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-500 text-base font-medium">Membership:</span>
                <span className="font-normal text-gray-900 text-base">
                  ${Math.round(parseFloat(getPackagePrice("standard")))}/year
                </span>
              </div>
            </div>
          </div>
          
          {/* Colored "What's Included" section - matching desktop style */}
          <div className="flex-grow text-white pt-6 px-6 pb-6" style={{ 
            fontFamily: SYSTEM_FONT,
            ...(option === "neuro" ? { background: 'linear-gradient(135deg, #785683 0%, #162740 30%, #443660 100%)' } : 
                option === "basic" ? { background: 'linear-gradient(135deg, #443660 0%, #162740 30%, #443660 100%)' } : 
                planOption.gradientStyle)
          }}>
            <h4 className="text-white mb-4 text-base font-normal">What's Included:</h4>
            
            <div className="space-y-3 pl-3 text-gray-200 text-sm font-light">
              {option === "neuro" && (
                <>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Standby Service</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Neuro Cryopreservation</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Long-Term Storage</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Potential Restoration</span>
                  </div>
                </>
              )}
              {option === "wholebody" && (
                <>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Standby Service</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Full Body Cryopreservation</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Long-Term Storage</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Potential Restoration</span>
                  </div>
                </>
              )}
              {option === "basic" && (
                <>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Member Events & Resources</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Pet Preservation Options</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Add Cryopreservation Anytime</span>
                  </div>
                  <div className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 mt-0.5 filter brightness-0 invert" />
                    <span>Lock in age-based dues</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Bottom description text */}
            <p className="text-gray-300 mt-5 pt-3 border-t border-gray-600 text-xs font-light">
              {planOption.long}
            </p>
          </div>
        </div>
        
        {/* ===== DESKTOP LAYOUT (INVERTED - WHITE ON TOP) ===== */}
        <div className="hidden md:block">
          {/* Desktop: White section for title and description */}
          <div className="bg-white p-4 pt-2 pl-2 sm:p-6 sm:pt-3 sm:pl-3 md:p-6 md:pt-3 md:pl-3 text-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-start w-full">
                <img src={alcorYellowStar} alt="Alcor Star" className="w-12 h-12 md:w-10 md:h-10 mr-1 md:mr-2 -mt-1 ml-0 animate-pulse" style={{animationDuration: '3s'}} />
                <h3 className="text-2xl md:text-xs font-semibold text-gray-900">{planOption.title}</h3>
              </div>
              {/* Desktop icon container and icon */}
              <div className="p-4 md:p-6 rounded-md md:rounded-lg ml-3 flex-shrink-0 transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 35%, #785683 30%, #996a68 50%, #d4a574 100%)' }}>
                {option === "neuro" && (
                  <svg className="w-10 h-10 md:w-20 md:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
                {option === "wholebody" && (
                  <svg className="w-10 h-10 md:w-20 md:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                {option === "basic" && (
                  <svg className="w-10 h-10 md:w-20 md:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 mt-6 md:mt-4 md:text-xs">
              {planOption.short}
            </p>
          </div>
          
          {/* Desktop: Colored section for pricing info */}
          <div className="p-4 sm:p-6 md:p-6 border-t border-gray-600" style={{ ...planOption.gradientStyle }}>
            <div className="flex justify-between items-center pt-4 md:pt-2">
              <span className="text-gray-300 text-lg md:text-xs">Preservation:</span>
              <span className="font-bold text-white text-xl md:text-sm">
                {option === "basic" ? "Not required" : `$${calculatePreservationEstimate(option)?.toLocaleString()}`}
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-2 md:mb-0">
              <span className="text-gray-300 text-lg md:text-xs">Membership:</span>
              <span className="font-bold text-white text-xl md:text-sm">
                `${Math.ceil(parseInt(getPackagePrice("standard").replace(/[$,]/g, '')) / 12)}/month`
              </span>
            </div>
          </div>
          
          {/* Desktop: What's Included - with colored background */}
          <div className="p-4 sm:p-6 md:p-6 border-t border-gray-600" style={{ ...planOption.gradientStyle }}>
            <h4 className="text-white text-xl md:text-md font-semibold mb-5 md:mb-3">What's Included:</h4>
            
            <div className="space-y-4 md:space-y-2 pl-4 text-gray-200 text-lg md:text-sm">
              {option === "neuro" && (
                <>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Standby Service</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Neuro Cryopreservation</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Long-Term Storage</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Potential Restoration</span>
                  </div>
                </>
              )}
              {option === "wholebody" && (
                <>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Standby Service</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Full Body Cryopreservation</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Long-Term Storage</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Potenial Restoration</span>
                  </div>
                </>
              )}
              {option === "basic" && (
                <>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Member Events</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Pet Preservation Options</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Add Cryopreservation Anytime</span>
                  </div>
                  <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                    <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                    <span>Lock in age-based dues</span>
                  </div>
                </>
              )}
            </div>
            
            <p className="mt-4 md:mt-3 pt-3 md:pt-2 border-t border-gray-600 text-gray-300 text-lg md:text-sm font-light">
              {planOption.long}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 6: ORIGINAL VERSION OPTION CARD
// ============================================
// This component is used when USE_UPDATED_VERSION = false (CURRENTLY ACTIVE)
// Features: Unified layout for mobile and desktop (white on top, colored on bottom)
export const OriginalVersionOptionCard = ({ 
  option, 
  selectedOption, 
  selectOption, 
  fadeInStyle, 
  getAnimationDelay, 
  calculatePreservationEstimate, 
  getPackagePrice 
}) => {
  const planOption = planOptions[option];
  
  return (
    <div 
      onClick={() => selectOption(option)} 
      className="cursor-pointer h-full" 
      style={{...fadeInStyle, ...getAnimationDelay(option === "neuro" ? 0 : option === "wholebody" ? 1 : 2)}}
    >
      <div className={`rounded-lg md:rounded-[2rem] overflow-hidden shadow-md ${selectedOption === option ? "ring-2 ring-[#775684]" : ""} transition-all duration-300 hover:shadow-lg transform hover:scale-[1.01] flex flex-col h-full`}>
        
        {/* ===== SELECTED INDICATOR - MOBILE ONLY ===== */}
        <div className="md:hidden bg-white border-b border-gray-200" style={{ height: "60px" }}>
          {selectedOption === option && (
            <div className="text-center py-3.5">
              <span className="text-[#775684] px-6 py-1.5 text-base font-bold tracking-wide animate-fadeInDown">
                SELECTED
              </span>
            </div>
          )}
          {selectedOption !== option && <div className="h-[60px]"></div>}
        </div>
        
        {/* ===== UNIFIED WHITE HEADER FOR ALL SCREEN SIZES ===== */}
        <div className="bg-white p-6 sm:p-7 md:px-10 md:pt-10 md:pb-8 md:pl-10" style={{ fontFamily: SYSTEM_FONT }}>
          <div className="flex items-center">
            <div className="p-3 md:p-3.5 rounded-lg transform transition duration-300 mr-3 md:mr-3.5" style={{ 
              background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' 
            }}>
              {option === "neuro" && (
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              {option === "wholebody" && (
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {option === "basic" && (
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-normal text-gray-900">{planOption.title}</h3>
          </div>
          
          <p className="text-sm md:text-sm text-gray-600 mt-3 md:mt-5 mb-6 md:mb-7 font-light">
            {planOption.short}
          </p>
          
          {/* Pricing info with subtext */}
          <div className="mt-6 md:mt-8 pt-3 md:pt-4 border-t border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base font-medium text-gray-500">Preservation:</span>
              <span className="text-sm md:text-base font-normal text-gray-900">
                {option === "basic" ? "Not required" : `$${calculatePreservationEstimate(option)?.toLocaleString()}`}
              </span>
            </div>
            
            {/* Subtext for all options */}
            {(option === "neuro" || option === "wholebody") && (
              <div className="flex justify-end mt-1">
                <span className="text-xs md:text-xs text-gray-400 font-light italic">
                  As low as $25-$45/month with life insurance
                </span>
              </div>
            )}
            {option === "basic" && (
              <div className="flex justify-end mt-1">
                <span className="text-xs md:text-xs text-gray-400 font-light italic">
                  Pet preservation available as a basic member for an additional cost
                </span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-4 md:mt-5 mb-2 md:mb-6">
            <span className="text-sm md:text-base font-medium text-gray-500">Membership:</span>
            <span className="text-sm md:text-base font-normal text-gray-900">
              ${Math.round(parseFloat(getPackagePrice("standard")))}/year
            </span>
          </div>
        </div>
        
        {/* ===== UNIFIED COLORED "WHAT'S INCLUDED" SECTION FOR ALL SIZES ===== */}
        <div className="text-white pt-6 px-6 pb-6 md:pt-8 md:px-10 md:pb-8 flex-grow" style={{ 
          fontFamily: SYSTEM_FONT, 
          minHeight: "200px", 
          ...(option === "neuro" ? { background: 'linear-gradient(135deg, #785683 0%, #162740 30%, #443660 100%)' } : 
              option === "basic" ? { background: 'linear-gradient(135deg, #443660 0%, #162740 30%, #443660 100%)' } : 
              planOption.gradientStyle)
        }}>
          <h4 className="text-white mb-4 md:mb-6 text-sm font-normal">What's Included:</h4>
          
          <div className="space-y-3 md:space-y-5 pl-3 md:pl-5 text-gray-200 text-sm font-light">
            {option === "neuro" && (
              <>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Standby Service</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Neuro Cryopreservation</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Long-Term Storage</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Future Repair & Restorationl</span>
                </div>
              </>
            )}
            {option === "wholebody" && (
              <>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Standby Service</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Full Body Cryopreservation</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Long-Term Storage</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Future Repair & Restorationl</span>
                </div>
              </>
            )}
            {option === "basic" && (
              <>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Member Events & Resources</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Pet Preservation Options</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Add Cryopreservation Anytime</span>
                </div>
                <div className="flex items-start transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-2 md:mr-3 mt-0.5 filter brightness-0 invert" />
                  <span>Lock in age-based dues</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 7: MOBILE SELECTION SUMMARY
// ============================================
// Shows selected option summary on mobile devices only
export const MobileSelectionSummary = ({ 
  selectedOption, 
  getSelectedOptionName, 
  getPackagePrice, 
  getPreservationEstimateForSummary, 
  scrollToOptions, 
  fadeInStyle, 
  getAnimationDelay, 
  USE_UPDATED_VERSION 
}) => {
  const planOption = planOptions[selectedOption];
  
  return (
    <div className={`mt-5 p-4 sm:p-6 bg-white rounded-xl ${USE_UPDATED_VERSION ? 'md:rounded-2xl' : 'rounded-lg'} border border-gray-200 shadow-sm md:hidden transform transition-all duration-500`} style={{...fadeInStyle, ...getAnimationDelay(3), fontFamily: SYSTEM_FONT}}>
      <div className="flex flex-col">
        <h4 className="text-gray-800 font-bold text-lg mb-3">Your Selection</h4>
        
        <div className="flex items-center">
          {/* Dynamic icon matching the selected card */}
          <div className={`p-2 rounded-full mr-3 ${planOption?.iconBgColor || 'bg-gray-400'}`}>
            {/* Display the icon based on the selected card */}
            {selectedOption === "neuro" && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
            {selectedOption === "wholebody" && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            {selectedOption === "basic" && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            )}
          </div>
          <span className="text-gray-700 font-medium text-lg">{getSelectedOptionName()}</span>
        </div>
        
        {/* Price Summary */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h5 className="text-gray-700 font-medium mb-2">Price Summary</h5>
          <div className="space-y-2">
            {/* Annual Membership Fee */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annual Membership:</span>
              <span className="font-medium">${getPackagePrice("standard")}/year</span>
            </div>
            
            {/* Preservation Cost (if applicable) */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Preservation Cost:</span>
              <span className="font-medium">{getPreservationEstimateForSummary()}</span>
            </div>
          </div>
        </div>
        
        {/* Change selection button */}
        <div className="mt-4 pt-2">
          <button 
            onClick={scrollToOptions}
            className="text-[#775684] font-medium text-sm hover:underline focus:outline-none flex items-center transition-transform duration-300 hover:translate-y-[-2px]"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            Change my selection
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 8: IMPORTANT INFORMATION
// ============================================
export const ImportantInformation = ({ membershipAge, fadeInStyle, getAnimationDelay, USE_UPDATED_VERSION, showSurcharges = false }) => {
  return (
    <div className={`mt-5 md:mt-8 p-4 sm:p-5 bg-gray-50 ${USE_UPDATED_VERSION ? 'rounded-xl md:rounded-2xl' : 'rounded-lg'} border border-gray-200 transform transition-all duration-500`} style={{...fadeInStyle, ...getAnimationDelay(4), fontFamily: SYSTEM_FONT}}>
      <div className="flex items-start">
        <div className="bg-gray-200 p-3 rounded-lg mr-4 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '500' }} className="text-gray-700 mb-3">Important Information</h4>
          <p style={{ fontSize: '14px' }} className="text-gray-600 font-light">
            Most members fund their cryopreservation through <span className="font-semibold">life insurance</span> policies with <span className="font-semibold">manageable monthly premiums</span>. We'll discuss insurance options on the next page.
          </p>
          <p style={{ fontSize: '14px' }} className="text-gray-600 font-light mt-2">
            Your membership pricing is personalized based on your current age ({membershipAge} years).
          </p>
          {showSurcharges && (
            <p style={{ fontSize: '14px' }} className="text-gray-600 font-light mt-2.5">
              Additional surcharges may apply for early services ($20,000 within 180 days), third-party arrangements ($25,000), or non-member services ($50,000).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 9: NAVIGATION BUTTONS
// ============================================
// Back and Continue buttons at the bottom of the page
export const NavigationButtons = ({ 
  handleBackClick, 
  handleNext, 
  isSubmitting, 
  isLoading, 
  selectedOption, 
  fadeInStyle, 
  getAnimationDelay 
}) => {
  return (
    <div className="flex justify-between mt-8 mb-6 transform transition-all duration-500" style={{...fadeInStyle, ...getAnimationDelay(5)}}>
      {/* Back Button */}
      <button
        type="button"
        onClick={handleBackClick}
        className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md hover:translate-x-[-2px]"
        disabled={isSubmitting}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back
      </button>
      
      {/* Continue Button */}
      <button 
        type="button"
        onClick={handleNext}
        disabled={isSubmitting || isLoading || !selectedOption}
        className={`py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg hover:translate-x-[2px] ${
          selectedOption ? "bg-[#775684] text-white hover:bg-[#664573]" : "bg-gray-300 text-gray-500 cursor-not-allowed"
        } disabled:opacity-70`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

// ============================================
// SECTION 10: GLOBAL STYLES
// ============================================
// Injects necessary CSS animations into the document
export const GlobalStyles = () => {
  // Add global CSS animations
  const globalStyles = document.createElement('style');
  globalStyles.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-in-out forwards;
    }
    
    .animate-fadeInDown {
      animation: fadeInDown 0.3s ease-in-out forwards;
    }
  `;
  
  // Only append if not already added
  if (!document.head.querySelector('style[data-package-page-styles]')) {
    globalStyles.setAttribute('data-package-page-styles', 'true');
    document.head.appendChild(globalStyles);
  }
  
  return null;
};