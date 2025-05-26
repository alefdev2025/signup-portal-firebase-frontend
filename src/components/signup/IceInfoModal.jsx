// File: components/signup/IceInfoModal.jsx
import React from "react";
import iceLogo from "../../assets/images/ICE-logo-temp.png";
import alcorStar from "../../assets/images/alcor-yellow-star.png";

export default function IceInfoModal({ showIceInfo, setShowIceInfo }) {
  if (!showIceInfo) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Transparent backdrop */}
      <div className="fixed inset-0 bg-transparent transition-opacity" onClick={() => setShowIceInfo(false)}></div>
      
      {/* Modal container */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        {/* Modal content */}
        <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Header with purple gradient and ICE logo */}
          <div 
            className="flex items-center justify-between rounded-t-lg px-6 py-4"
            style={{
              background: 'linear-gradient(90deg, #6f2d74 0%, #8a4099 100%)'
            }}
          >
            <div className="flex items-center">
              <img 
                src={iceLogo} 
                alt="ICE Logo" 
                className="h-10 mr-4 filter brightness-0 invert"
                onError={(e) => {
                  // Fallback to star icon if ICE logo fails to load
                  e.target.src = alcorStar;
                  e.target.className = "h-10 mr-4 filter brightness-0 invert";
                }}
              />
              <h2 className="text-3xl font-bold text-white flex items-center">
                What's an ICE Code?
                <img src={alcorStar} alt="Alcor Star" className="w-8 h-8 ml-3 filter brightness-0 invert" />
              </h2>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setShowIceInfo(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content area with scrolling */}
          <div className="max-h-[70vh] overflow-y-auto p-8">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 space-y-6 text-lg">
                <p>
                  <strong>ICE (Independent Cryonics Educator)</strong> codes are special discount codes provided by certified educators who help spread awareness about cryonics and Alcor's services. ICE educators receive 50% of your first-year dues as compensation for successful referrals.
                </p>
                
                <div className="bg-white border border-gray-300 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 text-2xl">
                    Discount Levels
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-3 border-b border-gray-300">
                      <span className="text-gray-700 font-medium text-lg">Non-Alcor Member ICE:</span>
                      <span className="text-gray-900 font-bold text-lg">10% off first year</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-300">
                      <span className="text-gray-700 font-medium text-lg">Alcor Member ICE:</span>
                      <span className="text-gray-900 font-bold text-lg">25% off first year</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-700 font-medium text-lg">Alcor Cryopreservation Member ICE:</span>
                      <span className="text-gray-900 font-bold text-lg">50% off first year</span>
                    </div>
                  </div>
                </div>
                
                <p>
                  If you learned about Alcor from an ICE educator and received a discount code, enter it below to save on your membership dues! The discount applies to your first year of membership only.
                </p>
                
                <div className="bg-white border border-gray-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 text-xl">
                    How it works:
                  </h4>
                  <ol className="list-decimal list-inside text-gray-700 space-y-2 text-xl">
                    <li>Enter your ICE code during signup</li>
                    <li>Your discount is automatically applied</li>
                    <li>ICE educator receives 50% of your first-year dues as compensation</li>
                    <li>You save money on your first year!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer with close button */}
          <div className="border-t border-gray-200 p-6 flex justify-end">
            <button
              onClick={() => setShowIceInfo(false)}
              style={{ backgroundColor: "#0c2340" }}
              className="px-6 py-2 rounded-full text-white font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}