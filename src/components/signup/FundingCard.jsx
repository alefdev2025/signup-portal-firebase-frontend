// File: components/FundingCard.jsx
import React from 'react';
import alcorStar from "../assets/images/alcor-star.png";
import alcorYellowStar from "../assets/images/alcor-yellow-star.png";

const FundingCard = ({ 
  option, 
  title, 
  description, 
  tag, 
  icon, 
  bgColor, 
  iconBgColor,
  selected, 
  onSelect,
  pricing,
  benefits
}) => {
  return (
    <div onClick={() => onSelect(option)} className="cursor-pointer">
      <div className={`rounded-2xl md:rounded-3xl overflow-hidden shadow-md ${selected ? 'ring-2 ring-[#775684]' : 'ring-1 ring-gray-400'}`}>
        {/* SELECTED indicator */}
        <div className="bg-white border-b border-gray-200">
          {selected && (
            <div className="text-center py-3.5">
              <span className="text-white px-5 py-1.5 text-base font-black tracking-wider uppercase bg-[#775684] rounded-md">
                Selected
              </span>
            </div>
          )}
          {!selected && <div className="h-14"></div>}
        </div>
        
        {/* Card header - INVERTED: top is white, bottom is colored */}
        <div className="p-0">
          {/* White section for title and description */}
          <div className="bg-white p-4 pt-2 pl-2 sm:p-6 sm:pt-3 sm:pl-3 md:p-8 md:pt-4 md:pl-4 text-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-start w-full">
                <img src={alcorYellowStar} alt="Alcor Star" className="w-12 h-12 mr-1 -mt-1 ml-0" />
                <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
              </div>
              <div className={`${iconBgColor} p-3 rounded-md ml-3 flex-shrink-0`}>
                <img src={icon} alt={title} className="w-8 h-8" />
              </div>
            </div>
            
            {tag && (
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                  tag === 'MOST POPULAR' 
                    ? 'bg-yellow-400 text-gray-800' 
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}>
                  {tag}
                </span>
              </div>
            )}
            
            <p className="text-gray-600 mt-6">
              {description}
            </p>
          </div>
          
          {/* White section for pricing info */}
          <div className="bg-white p-4 sm:p-6 md:p-8 border-t border-gray-200">
            {pricing.map((item, index) => (
              <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                <span className="text-gray-700 text-lg">{item.label}:</span>
                <span className="font-bold text-gray-900 text-xl">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* What's Included - with colored background */}
        <div className={`${bgColor} p-4 sm:p-6 md:p-8 border-t border-gray-600`}>
          <h4 className="text-white text-xl font-semibold mb-5">Benefits:</h4>
          
          <div className="space-y-4 pl-4 text-gray-200 text-lg">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 filter brightness-0 invert" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundingCard;