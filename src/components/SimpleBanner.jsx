import React from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import whiteALogoNoText from "../assets/images/alcor-white-logo-no-text.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
import alcorStar from "../assets/images/alcor-star.png";

/**
 * Simple Banner Component for DocuSign signing page
 * Both mobile and desktop use Inter font with normal weight
 */
const SimpleBanner = ({ 
  logo = whiteALogoNoText,
  title = "Membership Agreement",
  showStar = true,
}) => {
  
  // Inter font style (applied to both mobile and desktop)
  const interStyle = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  };

  return (
    <>
      {/* Mobile Banner - Updated with Inter font and adjusted height */}
      <div className="md:hidden">
        <div 
          className="text-white px-4 py-5 relative overflow-hidden flex items-center"
          style={{
            ...interStyle,
            background: 'linear-gradient(90deg, #0a1629 0%, #1e2650 100%)'
          }}
        >
          {/* Logo on the left */}
          <div className="mr-auto">
            <img 
              src={logo} 
              alt="Alcor Logo" 
              className="h-12"
            />
          </div>

          {/* Heading on the right with slight downward offset */}
          <h1 className="flex items-center mt-1">
            <span className="text-lg font-normal">
              {title}
            </span>
            {showStar && <img src={yellowStar} alt="" className="h-5 ml-0.5" />}
          </h1>
        </div>
      </div>
      
      {/* Desktop Banner - Keeping original Stripe-style layout with Inter font */}
      <div 
        className="hidden md:block py-3 px-6 bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative"
        style={interStyle}
      >
        {/* Additional diagonal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
        
        <div className="w-full flex justify-between items-center relative z-10">
          <img src={logo} alt="Alcor Logo" className="h-12" />
          <h1 className="flex items-center text-lg sm:text-xl font-normal text-white">
            {title}
            {showStar && <img src={alcorStar} alt="" className="h-5 ml-0.5" />}
          </h1>
        </div>
      </div>
    </>
  );
};

export default SimpleBanner;