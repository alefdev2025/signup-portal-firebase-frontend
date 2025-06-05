import React from "react";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

export const planOptions = {
  neuro: {
    title: "MMMMMMMMMMMNeuropreservation",
    short: "Preserves brain and neural structures at a lower cost.",
    long: "Preserves the brain's neural connections that define your identity.",
    baseEstimate: 80000,
    internationalEstimate: 90000,
    titleBgColor: "bg-[#323053]",
    iconBgColor: "bg-[#454575]",
    icon: (
      <img src={alcorStar} alt="Neuro Icon" className="h-5 w-5" />
    )
  },
  wholebody: {
    title: "Whole Body",
    short: "Preserves your entire body for complete restoration.",
    long: "Complete body preservation for potential full restoration.",
    baseEstimate: 220000,
    internationalEstimate: 230000,
    titleBgColor: "bg-[#1a2342]",
    iconBgColor: "bg-[#293253]",
    icon: (
      <img src={alcorStar} alt="Whole Body Icon" className="h-5 w-5" />
    )
  },
  basic: {
    title: "Basic Membership",
    short: "Join now, decide on your cryopreservation type later.",
    long: "Basic membership with flexibility to upgrade later.",
    baseEstimate: 0,
    internationalEstimate: 0, // No surcharge for basic membership
    titleBgColor: "bg-[#11243a]",
    iconBgColor: "bg-[#1c324c]",
    icon: (
      <img src={alcorStar} alt="Basic Membership Icon" className="h-5 w-5" />
    )
  }
};

export const DesktopInvertedOptionCard = ({ 
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
    <div onClick={() => selectOption(option)} className="cursor-pointer transform transition duration-300 hover:scale-[1.02]" style={{...fadeInStyle, ...getAnimationDelay(option === "neuro" ? 0 : option === "wholebody" ? 1 : 2)}}>
      <div className={`rounded-2xl md:rounded-t-[2rem] md:rounded-b-3xl overflow-hidden shadow-md ${selectedOption === option ? "ring-2 ring-[#775684]" : "ring-1 ring-gray-400"} transition-all duration-300`}>
        {/* SELECTED indicator */}
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
        
        {/* White section for title and description */}
        <div className="bg-white p-4 pt-2 pl-2 sm:p-6 sm:pt-3 sm:pl-3 md:p-6 md:pt-3 md:pl-3 text-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start w-full">
              <img src={alcorYellowStar} alt="Alcor Star" className="w-12 h-12 md:w-10 md:h-10 mr-1 md:mr-2 -mt-1 ml-0 animate-pulse" style={{animationDuration: '3s'}} />
              <h3 className="text-2xl md:text-lg font-semibold text-gray-900">{planOption.title}</h3>
            </div>
            <div className={`${planOption.iconBgColor} p-3 md:p-4 rounded-md md:rounded-lg ml-3 flex-shrink-0 transform transition duration-300 hover:rotate-12`}>
              {option === "neuro" && (
                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              {option === "wholebody" && (
                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              {option === "basic" && (
                <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 mt-6 md:mt-4 md:text-sm">
            {planOption.short}
          </p>
        </div>
        
        {/* Colored section for pricing info */}
        <div className={`${planOption.titleBgColor} p-4 sm:p-6 md:p-6 border-t border-gray-600`}>
          <div className="flex justify-between items-center pt-4 md:pt-2">
            <span className="text-gray-300 text-lg md:text-base">{option === "basic" ? "Annual Cost:" : "Preservation:"}</span>
            <span className="font-bold text-white text-xl md:text-lg">
              {option === "basic" ? `$${getPackagePrice("standard")}/year` : `$${calculatePreservationEstimate(option)?.toLocaleString()}`}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-2 md:mb-0">
            <span className="text-gray-300 text-lg md:text-base">{option === "basic" ? "Preservation:" : "Membership:"}</span>
            <span className="font-bold text-white text-xl md:text-lg">
              {option === "basic" ? "Not required" : `$${getPackagePrice("standard")}/year`}
            </span>
          </div>
        </div>
        
        {/* What's Included - with colored background */}
        <div className={`${planOption.titleBgColor} p-4 sm:p-6 md:p-6 border-t border-gray-600`}>
          <h4 className="text-white text-xl md:text-lg font-semibold mb-5 md:mb-3">What's Included:</h4>
          
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
                  <span>Possible Revival</span>
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
                  <span>Possible Revival</span>
                </div>
              </>
            )}
            {option === "basic" && (
              <>
                <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                  <span>Member Events & Resources</span>
                </div>
                <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                  <span>Pet Preservation Options</span>
                </div>
                <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                  <span>Add on Cryopreservation Anytime</span>
                </div>
                <div className="flex items-center transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-5 h-5 md:w-4 md:h-4 mr-2 filter brightness-0 invert" />
                  <span>Consultation Services</span>
                </div>
              </>
            )}
          </div>
          
          <p className="mt-8 md:mt-4 pt-4 md:pt-3 border-t border-gray-600 text-gray-300 text-lg md:text-sm">
            {planOption.long}
          </p>
        </div>
      </div>
    </div>
  );
};