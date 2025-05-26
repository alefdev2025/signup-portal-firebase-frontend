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
        className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
          paymentFrequency === "monthly" 
            ? "border-[#775684] bg-gray-50 shadow-md" 
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="text-center">
          <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
            Monthly
            <img src={alcorStar} alt="Alcor Star" className="w-7 h-7 ml-1" />
          </h4>
          
          <div className="mb-8">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {costs ? formatCurrency(costs.finalMonthlyCost) : formatCurrency(getMonthlyCost())}
            </div>
            <p className="text-gray-600 text-lg">
              <span className="font-semibold">USD</span> • First month
            </p>
            <p className="text-gray-500 text-base">
              Renews monthly
            </p>
            {costs && costs.discountAmount > 0 && iceCodeValid && paymentFrequency === "monthly" && (
              <p className="text-green-600 text-sm font-medium mt-1">
                Saving {formatCurrency(costs.discountAmount)}/year with ICE code!
              </p>
            )}
          </div>
          
          <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
            paymentFrequency === "monthly"
              ? "bg-[#775684] text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}>
            {paymentFrequency === "monthly" ? "Selected" : "Select Monthly"}
          </button>
        </div>
      </div>
      
      {/* Quarterly Option */}
      <div 
        onClick={() => onPaymentFrequencyChange("quarterly")}
        className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
          paymentFrequency === "quarterly" 
            ? "border-[#775684] bg-gray-50 shadow-md" 
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="text-center">
          <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
            Quarterly
            <img src={alcorStar} alt="Alcor Star" className="w-7 h-7 ml-1" />
          </h4>
          
          <div className="mb-8">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {costs ? formatCurrency(costs.finalQuarterlyCost) : formatCurrency(getQuarterlyCost())}
            </div>
            <p className="text-gray-600 text-lg">
              <span className="font-semibold">USD</span> • Every 3 months
            </p>
            <p className="text-gray-500 text-base">
              Renews quarterly
            </p>
            {costs && costs.discountAmount > 0 && iceCodeValid && paymentFrequency === "quarterly" && (
              <p className="text-green-600 text-sm font-medium mt-1">
                Saving {formatCurrency(costs.discountAmount)}/year with ICE code!
              </p>
            )}
          </div>
          
          <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
            paymentFrequency === "quarterly"
              ? "bg-[#775684] text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}>
            {paymentFrequency === "quarterly" ? "Selected" : "Select Quarterly"}
          </button>
        </div>
      </div>
      
      {/* Annual Option */}
      <div 
        onClick={() => onPaymentFrequencyChange("annually")}
        className={`relative cursor-pointer rounded-xl border p-8 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
          paymentFrequency === "annually" 
            ? "border-[#775684] bg-gray-50 shadow-md" 
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="text-center">
          <h4 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center" style={marcellusStyle}>
            Annual
            <img src={alcorStar} alt="Alcor Star" className="w-7 h-7 ml-1" />
          </h4>
          
          <div className="mb-8">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {costs ? formatCurrency(costs.finalAnnualCost) : formatCurrency(getAnnualCost())}
            </div>
            <p className="text-gray-600 text-lg">
              <span className="font-semibold">USD</span> • Per year
            </p>
            <p className="text-gray-500 text-base">
              Renews annually
            </p>
            {costs && costs.discountAmount > 0 && iceCodeValid && paymentFrequency === "annually" && (
              <p className="text-green-600 text-sm font-medium mt-1">
                Saving {formatCurrency(costs.discountAmount)}/year with ICE code!
              </p>
            )}
          </div>
          
          <button className={`w-full py-3 px-6 rounded-full font-semibold text-lg transition-all duration-300 ${
            paymentFrequency === "annually"
              ? "bg-[#775684] text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}>
            {paymentFrequency === "annually" ? "Selected" : "Select Annual"}
          </button>
        </div>
      </div>
    </div>
  );
}