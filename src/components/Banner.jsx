import React from "react";
import starImage from "../assets/images/alcor-star.png";

const Banner = ({ 
  logo, 
  stepText = "Sign up", 
  stepNumber = "1", 
  stepName = "Get Started",
  heading = "Become a member",
  subText = "Sign up process takes on average 5 minutes."
}) => {
  return (
    <>
      {/* Mobile Banner (compact version) */}
      <div className="bg-[#13263f] text-white px-4 py-2 relative overflow-hidden flex items-center justify-between md:hidden">
        {/* Logo at the left of the banner */}
        <div className="flex items-center">
          <img src={logo} alt="Alcor Logo" className="h-12" />
        </div>
        
        {/* Header text positioned at the top right */}
        <div className="flex items-center">
          <h1 className="flex items-center">
            <span className="text-xl font-bold">{heading}</span>
            <img src={starImage} alt="" className="h-6 ml-0.5" />
          </h1>
        </div>
      </div>

      {/* Desktop Banner (original version) - hidden on mobile */}
      <div className="bg-[#13263f] text-white px-6 pt-4 pb-16 md:pb-20 relative overflow-hidden hidden md:block">
        {/* Logo at the top of the banner */}
        <div className="flex items-center mb-8">
          <img src={logo} alt="Alcor Logo" className="h-20 md:h-24" />
        </div>
        
        {/* Banner content */}
        <div className="text-center">
          <p className="text-lg flex items-center justify-center flex-wrap text-white/70">
            <span>{stepText} → Step {stepNumber}:</span> 
            <span className="flex items-center ml-1">
              <img src={starImage} alt="" className="h-5 mr-1" />
              {stepName}
            </span>
          </p>
          <h1 className="flex items-center justify-center mt-4">
            <span className="text-4xl md:text-5xl font-bold min-w-max">{heading}</span>
            <img src={starImage} alt="" className="h-10 md:h-12 ml-0.5" />
          </h1>
          <p className="text-lg mt-4 text-white/80">
            {subText}
          </p>
        </div>
      </div>
    </>
  );
};

export default Banner;