// File: components/WhiteSimpleBanner.jsx
import React from "react";
import navyAlcorLogo from "../assets/images/navy-alcor-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

/**
 * White Simple Banner Component
 * Clean white background with navy logo and customizable title
 */
const WhiteSimpleBanner = ({ 
  logo = navyAlcorLogo,
  title = "Complete Your Payment",
  showStar = true,
  backgroundColor = "#ffffff"
}) => {
  
  // Custom font style
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

  return (
    <div 
      className="w-full bg-white text-gray-900 px-6 py-6 flex items-center justify-between shadow-lg border-b border-gray-200 flex-shrink-0"
      style={{
        ...marcellusStyle,
        backgroundColor: backgroundColor,
        zIndex: 1000
      }}
    >
      {/* Logo on the left - Much bigger */}
      <div className="flex items-center">
        <img 
          src={logo} 
          alt="Alcor Logo" 
          className="h-12 md:h-16 lg:h-20"
        />
      </div>
      
      {/* Title on the right - Bigger text */}
      <div className="flex items-center">
        <h1 className="flex items-center">
          <span className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {title}
          </span>
          {showStar && <img src={yellowStar} alt="" className="h-7 md:h-8 lg:h-10 ml-2" />}
        </h1>
      </div>
    </div>
  );
};

export default WhiteSimpleBanner;