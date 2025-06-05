// File: components/signup/PaymentOptions.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-yellow-star.png";

export default function PaymentOptions({
  paymentFrequency,
  onPaymentFrequencyChange,
  costs,
  formatCurrency,
  getMonthlyCost,
  getQuarterlyCost,
  getAnnualCost,
  iceCodeValid,
  marcellusStyle
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Monthly Option */}
      <div 
        onClick={() => onPaymentFrequencyChange("monthly")}
        className={`relative cursor-pointer rounded-2xl transition-all duration-300 ${
          paymentFrequency === "monthly" 
            ? "ring-2 ring-[#775684] shadow-xl scale-[1.02]" 
            : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-lg"
        }`}
      >
        {/* Selected indicator */}
        {paymentFrequency === "monthly" && (
          <div className="absolute -top-3 -right-3 bg-[#775684] text-white rounded-full p-2 shadow-lg z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        <div className={`p-6 h-full rounded-2xl ${
          paymentFrequency === "monthly"
            ? "bg-gradient-to-br from-purple-50 to-pink-50"
            : "bg-white"
        }`}>
          <div className="text-center">
            <h4 className="text-2xl font-semibold text-gray-900 mb-1" style={marcellusStyle}>
              Monthly
            </h4>
            
            <div className="mb-6">
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-4xl font-light text-gray-900">
                  {costs ? formatCurrency(costs.finalMonthlyCost).replace('$', '') : formatCurrency(getMonthlyCost()).replace('$', '')}
                </span>
                <span className="text-xl text-gray-500 ml-2">USD</span>
              </div>
              <p className="text-gray-500">per month</p>
              
              {costs && costs.discountAmount > 0 && iceCodeValid && (
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save {formatCurrency(costs.discountAmount)}/year
                </div>
              )}
            </div>
            
            <button 
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                paymentFrequency === "monthly"
                  ? "bg-[#775684] text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {paymentFrequency === "monthly" ? "Selected" : "Choose Monthly"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Quarterly Option - Most Popular */}
      <div 
        onClick={() => onPaymentFrequencyChange("quarterly")}
        className={`relative cursor-pointer rounded-2xl transition-all duration-300 ${
          paymentFrequency === "quarterly" 
            ? "ring-2 ring-[#775684] shadow-xl scale-[1.02]" 
            : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-lg"
        }`}
      >
        {/* Most Popular Badge */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-[#775684] to-[#8a4099] text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
            MOST POPULAR
          </div>
        </div>
        
        {/* Selected indicator */}
        {paymentFrequency === "quarterly" && (
          <div className="absolute -top-3 -right-3 bg-[#775684] text-white rounded-full p-2 shadow-lg z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        <div className={`p-6 h-full rounded-2xl ${
          paymentFrequency === "quarterly"
            ? "bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff]"
            : "bg-white"
        }`}>
          <div className="text-center">
            <h4 className="text-2xl font-semibold text-gray-900 mb-1" style={marcellusStyle}>
              Quarterly
            </h4>
            
            <div className="mb-6">
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-4xl font-light text-gray-900">
                  {costs ? formatCurrency(costs.finalQuarterlyCost).replace('$', '') : formatCurrency(getQuarterlyCost()).replace('$', '')}
                </span>
                <span className="text-xl text-gray-500 ml-2">USD</span>
              </div>
              <p className="text-gray-500">every 3 months</p>
              
              {costs && costs.discountAmount > 0 && iceCodeValid && (
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save {formatCurrency(costs.discountAmount)}/year
                </div>
              )}
            </div>
            
            <button 
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                paymentFrequency === "quarterly"
                  ? "bg-[#775684] text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {paymentFrequency === "quarterly" ? "Selected" : "Choose Quarterly"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Annual Option */}
      <div 
        onClick={() => onPaymentFrequencyChange("annually")}
        className={`relative cursor-pointer rounded-2xl transition-all duration-300 ${
          paymentFrequency === "annually" 
            ? "ring-2 ring-[#775684] shadow-xl scale-[1.02]" 
            : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-lg"
        }`}
      >
        {/* Selected indicator */}
        {paymentFrequency === "annually" && (
          <div className="absolute -top-3 -right-3 bg-[#775684] text-white rounded-full p-2 shadow-lg z-10">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        <div className={`p-6 h-full rounded-2xl ${
          paymentFrequency === "annually"
            ? "bg-gradient-to-br from-green-50 to-emerald-50"
            : "bg-white"
        }`}>
          <div className="text-center">
            <h4 className="text-2xl font-semibold text-gray-900 mb-1" style={marcellusStyle}>
              Annual
            </h4>
            
            <div className="mb-6">
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-4xl font-light text-gray-900">
                  {costs ? formatCurrency(costs.finalAnnualCost).replace('$', '') : formatCurrency(getAnnualCost()).replace('$', '')}
                </span>
                <span className="text-xl text-gray-500 ml-2">USD</span>
              </div>
              <p className="text-gray-500">per year</p>
              
              {costs && costs.discountAmount > 0 && iceCodeValid && (
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save {formatCurrency(costs.discountAmount)}
                </div>
              )}
            </div>
            
            <button 
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                paymentFrequency === "annually"
                  ? "bg-[#775684] text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {paymentFrequency === "annually" ? "Selected" : "Choose Annual"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}