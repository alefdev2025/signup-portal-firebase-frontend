// File: components/signup/SelectedPackage.jsx
import React from "react";
import PropTypes from "prop-types";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

const SelectedPackage = ({ packageInfo }) => {
  if (!packageInfo) return null;

  // Check if basic membership
  const isBasic = packageInfo && packageInfo.preservationType === "basic";

  return (
    <div className="bg-white p-10 rounded-xl mb-6 shadow-md">
      <div className="flex items-center mb-8">
        <h2 className="text-3xl font-bold text-[#323053]">Your Selected Package</h2>
        <img src={alcorYellowStar} alt="Star" className="ml-3 w-10 h-10 animate-pulse" style={{animationDuration: '3s'}} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
        {/* Package Type - Display "Membership" for basic, "Cryopreservation" for standard */}
        <div className="bg-white p-6 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] border-2 border-[#323053]" 
             style={{ boxShadow: "0 0 15px rgba(50, 48, 83, 0.15)" }}>
          <div className="flex items-center">
            <div className="bg-[#323053] w-16 h-16 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 shadow-md transform transition-all duration-300 hover:rotate-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="text-2xl font-semibold text-[#323053] mr-2">Package</h3>
                <img src={alcorYellowStar} alt="Star" className="w-6 h-6" />
              </div>
              <p className="text-[#775684] text-2xl font-semibold mt-1">
                {isBasic ? "Membership" : 
                 packageInfo.packageType === "standard" ? "Cryopreservation" : 
                 packageInfo.packageType === "premium" ? "Premium" : "Basic"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Preservation Type - Only show if NOT basic membership */}
        {!isBasic && (
          <div className="bg-white p-6 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] border-2 border-[#433063]"
               style={{ boxShadow: "0 0 15px rgba(67, 48, 99, 0.15)" }}>
            <div className="flex items-center">
              <div className={`${getPreservationIconBgColor(packageInfo.preservationType)} w-16 h-16 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 shadow-md transform transition-all duration-300 hover:rotate-6`}>
                {getPreservationIcon(packageInfo.preservationType)}
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="text-2xl font-semibold text-[#323053] mr-2">Preservation Type</h3>
                  <img src={alcorYellowStar} alt="Star" className="w-6 h-6" />
                </div>
                <p className="text-[#775684] text-2xl font-semibold mt-1">
                  {getPreservationName(packageInfo.preservationType)}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Annual Membership Cost */}
        <div className="bg-white p-6 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] border-2 border-[#775684]"
             style={{ boxShadow: "0 0 15px rgba(119, 86, 132, 0.15)" }}>
          <div className="flex items-center">
            <div className="bg-[#775684] w-16 h-16 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 shadow-md transform transition-all duration-300 hover:rotate-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="text-2xl font-semibold text-[#323053] mr-2">Annual Membership Cost</h3>
                <img src={alcorYellowStar} alt="Star" className="w-6 h-6" />
              </div>
              <p className="text-[#775684] text-2xl font-semibold mt-1">
                ${packageInfo.annualCost}/year
              </p>
            </div>
          </div>
        </div>
        
        {/* Preservation Cost - only shown if it exists AND not basic */}
        {packageInfo.preservationEstimate && !isBasic && (
          <div className="bg-white p-6 rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] border-2 border-[#5c3e6a]"
               style={{ boxShadow: "0 0 15px rgba(92, 62, 106, 0.15)" }}>
            <div className="flex items-center">
              <div className="bg-[#5c3e6a] w-16 h-16 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 shadow-md transform transition-all duration-300 hover:rotate-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center">
                  <h3 className="text-2xl font-semibold text-[#323053] mr-2">Preservation Cost</h3>
                  <img src={alcorYellowStar} alt="Star" className="w-6 h-6" />
                </div>
                <p className="text-[#775684] text-2xl font-semibold mt-1">
                  ${packageInfo.preservationEstimate.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Basic Membership Warning */}
      {isBasic && (
        <div className="mt-6 p-5 bg-white border-l-4 border-[#775684] rounded-lg flex items-start shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#775684] mr-4 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="flex items-center">
              <h4 className="font-bold text-[#323053] text-xl">Basic Membership doesn't include cryopreservation</h4>
              <img src={alcorYellowStar} alt="Star" className="ml-2 w-5 h-5" />
            </div>
            <p className="text-gray-700 mt-2 text-lg">
              This covers membership dues only. If you want cryopreservation, <a href="/signup/package?force=true" className="underline font-semibold text-[#775684] hover:text-[#5c3e6a]">go back</a> and select Neuropreservation or Whole Body.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for getting preservation details
function getPreservationName(type) {
  switch(type) {
    case "neuro":
      return "Neuropreservation";
    case "wholebody":
      return "Whole Body";
    case "basic":
    default:
      return "Basic Membership";
  }
}

// Get the appropriate icon background color for the preservation type - USING BRAND COLORS
function getPreservationIconBgColor(type) {
  switch(type) {
    case "neuro":
      return "bg-[#323053]"; // Medium blue/purple
    case "wholebody":
      return "bg-[#1a2342]"; // Darker blue
    case "basic":
    default:
      return "bg-[#433063]"; // Medium-dark purple
  }
}

// Get the appropriate icon for the preservation type
function getPreservationIcon(type) {
  switch(type) {
    case "neuro":
      return (
        <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case "wholebody":
      return (
        <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "basic":
    default:
      return (
        <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
  }
}

SelectedPackage.propTypes = {
  packageInfo: PropTypes.shape({
    packageType: PropTypes.string,
    preservationType: PropTypes.string,
    preservationEstimate: PropTypes.number,
    annualCost: PropTypes.number
  })
};

export default SelectedPackage;