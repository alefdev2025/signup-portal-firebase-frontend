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

// White button (for Cancel) - with light purple background
export const WhiteButton = ({ text = "Cancel", onClick, className = "", spinStar = false }) => {
    return (
      <button 
        onClick={onClick}
        className={`relative w-48 py-2.5 rounded-full overflow-hidden group transition-all duration-300 hover:shadow-lg border-1 ${className}`}
        style={{
          backgroundColor: '#ebe3ed',
          borderColor: '#794384'
        }}
      >
        {/* Content */}
        <div className="relative flex items-center">
          <span className="text-[#794384] text-lg font-semibold tracking-wide flex-1 text-center">{text}</span>
          
          {/* Alcor Star - smaller */}
          <img 
            src={alcorStar} 
            alt="" 
            className={`w-8 h-8 transition-transform duration-500 ${spinStar ? 'group-hover:rotate-180' : ''} absolute right-1`}
            style={{
              filter: 'brightness(0) saturate(100%) invert(27%) sepia(15%) saturate(1736%) hue-rotate(249deg) brightness(89%) contrast(88%)'
            }}
          />
        </div>
      </button>
    );
  };
  
  // Purple button (for Save)
  export const PurpleButton = ({ text = "Save", onClick, className = "", spinStar = false }) => {
    return (
      <button 
        onClick={onClick}
        className={`relative w-48 py-2.5 rounded-full overflow-hidden group transition-all duration-300 hover:shadow-2xl bg-[#6e4376] hover:bg-[#5a3d5c] ${className}`}
      >
        {/* Content */}
        <div className="relative flex items-center">
          <span className="text-white text-lg font-semibold tracking-wide flex-1 text-center">{text}</span>
          
          {/* Alcor Star - smaller */}
          <img 
            src={alcorStar} 
            alt="" 
            className={`w-8 h-8 brightness-0 invert transition-transform duration-500 ${spinStar ? 'group-hover:rotate-180' : ''} absolute right-1`}
          />
        </div>
      </button>
    );
  };

// Default export for backward compatibility
const WebsiteButtonStyle = RainbowButton;
export default WebsiteButtonStyle;