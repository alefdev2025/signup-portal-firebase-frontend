// File: components/SimpleBanner.jsx
import React from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

/**
 * Simple Banner Component for DocuSign signing page
 * Just logo on left, title on right - minimal and clean
 */
const SimpleBanner = ({ 
  logo = alcorWhiteLogo,
  title = "Sign Your Membership Agreement",
  showStar = true,
  backgroundColor = "#13263f"
}) => {
  
  // Custom font style
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

  return (
    <div 
      className="w-full bg-[#13263f] text-white px-6 py-6 flex items-center justify-between shadow-lg flex-shrink-0"
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
          <span className="text-xl md:text-2xl lg:text-3xl font-bold">
            {title}
          </span>
          {showStar && <img src={yellowStar} alt="" className="h-7 md:h-8 lg:h-10 ml-2" />}
        </h1>
      </div>
    </div>
  );
};

export default SimpleBanner;