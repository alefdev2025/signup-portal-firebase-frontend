// File: pages/components/FundingCard.jsx
import React from "react";
import alcorStarSelected from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

const FundingCard = ({ 
  option, 
  isSelected, 
  onSelect, 
  packageInfo, 
  animationComplete, 
  animationDelay,
  getDynamicPricing 
}) => {
  const delayStyle = {
    transitionDelay: `${animationDelay}ms`
  };

  const dynamicCost = getDynamicPricing(option.id, packageInfo);

  return (
    <div 
      onClick={onSelect} 
      className={`cursor-pointer h-full transform transition-all duration-500 ease-in-out hover:scale-[1.02] ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${isSelected ? "" : "hover:shadow-lg"}`}
      style={delayStyle}
    >
      <div className={`rounded-3xl overflow-hidden h-full flex flex-col shadow-md ${isSelected ? "border border-[#65417c]" : "border-2 border-transparent"} relative bg-white`}>
        {/* Header Section */}
        <div className="bg-white px-8 py-8 pt-10">
          <div className="flex items-start mb-2">
            <div className="mr-4 bg-white border border-[#775684] rounded-lg p-2" style={{ width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={option.icon} alt={option.title} className="max-w-[75%] max-h-[75%] object-contain" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-semibold text-gray-800">{option.title}</h3>
              <div className={`${option.badge.bgColor} ${option.badge.textColor} font-bold py-1 px-4 mt-2 text-center text-sm tracking-wider rounded-full inline-block`}>
                {option.badge.text}
              </div>
            </div>
          </div>
        </div>
        
        {/* Description & Pricing Section */}
        <div className="bg-white px-8 py-6 border-t border-gray-200">
          <p className="text-gray-700 text-xl mb-6">
            {option.description}
          </p>
          
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 text-xl">
                {option.pricing.costLabel || "Typical Cost:"}
              </span>
              <span className={`${option.pricing.costColor} font-bold text-xl`}>
                {dynamicCost}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-xl">
                {option.pricing.complexityLabel || "Complexity:"}
              </span>
              <span className={`${option.pricing.costColor} font-bold text-xl`}>
                {option.pricing.complexity}
              </span>
            </div>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="bg-white px-8 py-4 text-gray-800 border-t border-gray-200 pb-16 flex-grow">
          <h4 className="font-bold text-2xl mb-4 text-gray-800">Benefits:</h4>
          
          <ul className="mb-6 space-y-3">
            {option.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center">
                <img src={alcorYellowStar} alt="Benefit" className="w-6 h-6 mr-2 flex-shrink-0" />
                <span className="text-gray-800 text-xl">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Selected indicator - only show when selected */}
        {isSelected && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <div className="bg-[#15263f] text-white px-4 py-2 rounded-sm flex items-center">
              <img src={alcorStarSelected} alt="Selected" className="w-5 h-5 mr-2" />
              <span className="font-bold text-base tracking-widest">SELECTED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundingCard;