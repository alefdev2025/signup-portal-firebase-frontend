// File: components/signup/PaymentCard.jsx
import React from 'react';

const PaymentCard = ({ 
  frequency,
  title,
  price,
  period,
  isSelected,
  discountAmount,
  hasDiscount,
  onClick,
  marcellusStyle,
  formatCurrency
}) => {
  return (
    <div 
      onClick={onClick}
      className="relative cursor-pointer transition-all duration-300"
    >
      <div className={`
        relative rounded-2xl p-6 h-full
        ${frequency === 'quarterly' && isSelected
          ? "bg-gradient-to-br from-[#f8f9ff] to-[#f0f4ff] ring-2 ring-[#775684] shadow-xl" 
          : isSelected
          ? "bg-white ring-2 ring-[#775684] shadow-xl"
          : "bg-white ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-lg"
        }
        transform transition-all duration-300 hover:-translate-y-1
      `}>
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute -top-3 -right-3 bg-[#775684] text-white rounded-full p-2 shadow-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        
        {/* Card content */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h4 className="text-2xl font-semibold text-gray-900" style={marcellusStyle}>
              {title}
            </h4>
          </div>
          
          {/* Price section */}
          <div className="flex-grow flex flex-col justify-center mb-6">
            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-light text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {formatCurrency(price).replace('$', '')}
                </span>
                <span className="text-xl text-gray-500 ml-2">USD</span>
              </div>
              <p className="text-gray-500 mt-2">{period}</p>
              
              {/* Discount badge */}
              {hasDiscount && isSelected && (
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Save {formatCurrency(discountAmount)}
                  {frequency === 'monthly' || frequency === 'quarterly' ? '/year' : ''}
                </div>
              )}
            </div>
          </div>
          
          {/* CTA Button */}
          <button className={`
            w-full py-3 px-4 rounded-xl font-medium transition-all duration-300
            ${isSelected
              ? "bg-[#775684] text-white shadow-md"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }
          `}>
            {isSelected ? "Selected" : `Choose ${title}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCard;