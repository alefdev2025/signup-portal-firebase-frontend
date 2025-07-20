import React from 'react';
import alcorStar from '../../assets/images/alcor-star.png';

// Rainbow gradient button (the one you're currently using)
export const RainbowButton = ({ text = "Stay Informed", onClick, className = "", spinStar = true }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative w-48 py-2.5 rounded-full overflow-hidden group transition-all duration-300 hover:shadow-2xl ${className}`}
    >
      {/* Gradient background - purple to orange/yellow */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, #1a2238 0%, #2a2545 10%, #3a2a4a 20%, #5a3d5c 35%, #6e4376 50%, #8b5a7c 65%, #b8768a 75%, #d4956a 85%, #f4c245 100%)'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative flex items-center">
        <span className="text-white text-lg font-semibold tracking-wide flex-1 text-center">{text}</span>
        
        {/* Alcor Star with spin animation */}
        <img 
          src={alcorStar} 
          alt="" 
          className={`w-8 h-8 brightness-0 invert transition-transform duration-500 ${spinStar ? 'group-hover:rotate-180' : ''} absolute -right-1`}
        />
      </div>
    </button>
  );
};

// White button (for Cancel/Edit) - OUTLINE STYLE
export const WhiteButton = ({ text = "Cancel", onClick, className = "", spinStar = false }) => {
    return (
      <button 
        onClick={onClick}
        className={`relative w-48 py-2.5 rounded-full overflow-hidden group transition-all duration-300 hover:shadow-lg bg-white border-2 border-gray-300 hover:bg-gray-50 ${className}`}
      >
        {/* Content */}
        <div className="relative flex items-center">
          <span className="text-gray-600 text-lg font-semibold tracking-wide flex-1 text-center">{text}</span>
          
          {/* Alcor Star - gray color */}
          <img 
            src={alcorStar} 
            alt="" 
            className={`w-8 h-8 transition-transform duration-500 ${spinStar ? 'group-hover:rotate-180' : ''} absolute right-1`}
            style={{
              filter: 'brightness(0) saturate(100%) invert(50%) sepia(8%) saturate(0%) hue-rotate(186deg) brightness(95%) contrast(91%)'
            }}
          />
        </div>
      </button>
    );
  };
  
  // Purple button (for Save) - OUTLINE STYLE
  export const PurpleButton = ({ text = "Save", onClick, className = "", spinStar = false }) => {
    return (
      <button 
        onClick={onClick}
        className={`relative w-48 py-2.5 rounded-full overflow-hidden group transition-all duration-300 hover:shadow-xl bg-white border-2 border-[#7c3aed] hover:bg-[#7c3aed]/5 ${className}`}
      >
        {/* Content */}
        <div className="relative flex items-center">
          <span className="text-[#7c3aed] text-lg font-semibold tracking-wide flex-1 text-center">{text}</span>
          
          {/* Alcor Star - purple color */}
          <img 
            src={alcorStar} 
            alt="" 
            className={`w-8 h-8 transition-transform duration-500 ${spinStar ? 'group-hover:rotate-180' : ''} absolute right-1`}
            style={{
              filter: 'brightness(0) saturate(100%) invert(35%) sepia(84%) saturate(1736%) hue-rotate(253deg) brightness(94%) contrast(92%)'
            }}
          />
        </div>
      </button>
    );
  };

// Default export for backward compatibility
const WebsiteButtonStyle = RainbowButton;
export default WebsiteButtonStyle;