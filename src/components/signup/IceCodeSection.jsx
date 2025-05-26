// File: components/signup/IceCodeSection.jsx
import React, { useState } from "react";
import iceLogo from "../../assets/images/ICE-logo-temp.png";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import IceInfoModal from "./IceInfoModal";

export default function IceCodeSection({
  iceCode,
  handleIceCodeChange,
  isValidatingCode,
  iceCodeValid,
  iceCodeInfo,
  costs,
  formatCurrency,
  marcellusStyle
}) {
  const [showIceInfo, setShowIceInfo] = useState(false);

  return (
    <>
      <div className="mb-8 mt-12">
        <div className="bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] border border-gray-200 rounded-xl p-10 shadow-sm">
          {/* Header with ICE Logo - Left Aligned */}
          <div className="flex items-center mb-10">
            <div className="bg-white w-20 h-20 rounded-lg flex items-center justify-center mr-6 shadow-lg border border-gray-200">
              <img 
                src={iceLogo} 
                alt="ICE Logo" 
                className="h-14 w-14 object-contain"
                onError={(e) => {
                  // Fallback to gradient icon if ICE logo fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="bg-gradient-to-br from-[#775684] to-[#5a4063] w-full h-full rounded-lg hidden items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-bold text-[#323053]">ICE Discount Code</h3>
                <button 
                  onClick={() => setShowIceInfo(!showIceInfo)}
                  className="bg-[#775684] text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[#664573] transition-colors text-lg font-bold ml-1"
                  title="What's an ICE Code?"
                >
                  ?
                </button>
              </div>
              <p className="text-gray-600 mt-2 text-lg">Save money with your Independent Cryonics Educator discount (first year only)</p>
            </div>
          </div>

          {/* Input Section - Left Aligned */}
          <div className="max-w-md">
            <div className="relative mb-6">
              <input
                type="text"
                value={iceCode}
                onChange={handleIceCodeChange}
                placeholder="Enter ICE discount code"
                className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-lg focus:ring-[#775684] focus:border-[#775684] pr-16 font-mono tracking-wider"
                style={{...marcellusStyle, fontFamily: 'monospace'}}
              />
              
              {/* Validation indicator */}
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                {isValidatingCode ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-[#775684]"></div>
                ) : iceCode.trim() && iceCodeValid === true ? (
                  <svg className="h-9 w-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : iceCode.trim() && iceCodeValid === false ? (
                  <svg className="h-9 w-9 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : null}
              </div>
            </div>
            
            {/* Demo codes hint */}
            {!iceCode.trim() && (
              <div className="text-base text-gray-500">
                <p>Demo: ICE2024DEMO, MEMBER2024, CRYOMEM2024</p>
              </div>
            )}
          </div>
          
          {/* Validation messages - Full width below input */}
          {iceCode.trim() && iceCodeValid === true && iceCodeInfo && (
            <div className="bg-[#f0f2ff] border border-[#e0e3ff] rounded-lg p-6 mb-4">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-black mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-black font-bold text-2xl">ICE Code Accepted</span>
              </div>
              <div className="text-black space-y-3 text-xl">
                <p>Your Discount: <span className="font-semibold text-2xl">25% ({formatCurrency(costs.discountAmount)}) - First Year Only</span></p>
                <p className="text-black text-lg mt-4">Complete a cryopreservation contract to increase your discount to 50%!</p>
              </div>
            </div>
          )}
          
          {iceCode.trim() && iceCodeValid === false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-4">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-red-800 font-bold text-xl">Invalid ICE code</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <IceInfoModal 
        showIceInfo={showIceInfo}
        setShowIceInfo={setShowIceInfo}
      />
    </>
  );
}