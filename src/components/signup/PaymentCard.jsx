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
      className="cursor-pointer h-full"
    >
      <div className={`
        rounded-xl bg-white border p-8 h-full flex flex-col
        ${isSelected ? "border-black ring-2 ring-black" : "border-gray-300"}
      `}>
        {/* Title */}
        <h4 className="text-2xl font-semibold text-center mb-4">
          {title}
        </h4>
        
        {/* Price */}
        <p className="text-5xl font-bold text-center mb-2">
          ${formatCurrency(price).replace(/[^0-9]/g, '')}
        </p>
        <p className="text-gray-600 text-center mb-6">{period}</p>
        
        {/* Button */}
        <button className={`
          w-full py-3 rounded-full font-medium transition-all
          ${isSelected 
            ? "bg-black text-white" 
            : "bg-white text-black border-2 border-black hover:bg-black hover:text-white"
          }
        `}>
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
};

export default PaymentCard;