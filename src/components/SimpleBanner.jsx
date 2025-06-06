// File: components/SimpleBanner.jsx
import React from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import whiteALogoNoText from "../assets/images/alcor-white-logo-no-text.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
import alcorStar from "../assets/images/alcor-star.png";

/**
 * Simple Banner Component for DocuSign signing page
 * Matches the Stripe page styling exactly
 */
const SimpleBanner = ({ 
  logo = whiteALogoNoText,
  title = "Membership Agreement",
  showStar = true,
}) => {
  
  // Custom font style
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

  return (
    <>
      {/* Mobile Banner */}
      <div className="md:hidden">
        <div className="py-8 px-4 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
          {/* Additional diagonal gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
          
          <div className="flex items-center justify-between pt-3 relative z-10">
            <div className="flex items-center">
              <img src={logo} alt="Alcor Logo" className="h-12" />
            </div>
            
            <div className="flex items-center">
              <h1 className="flex items-center">
                <span className="text-xl font-bold text-white">{title}</span>
                {showStar && <img src={yellowStar} alt="" className="h-5 ml-0.5" />}
              </h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Banner */}
      <div className="hidden md:block py-3 px-6 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
        {/* Additional diagonal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
        
        <div className="w-full flex justify-between items-center relative z-10">
          <img src={logo} alt="Alcor Logo" className="h-12" />
          <h1 className="flex items-center text-lg sm:text-xl font-semibold text-white">
            {title}
            {showStar && <img src={alcorStar} alt="" className="h-5 ml-0.5" />}
          </h1>
        </div>
      </div>
    </>
  );
};

export default SimpleBanner;