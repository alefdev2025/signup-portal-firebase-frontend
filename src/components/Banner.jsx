import React from "react";
// Import the star image
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
    <div className="bg-[#13263f] text-white px-4 sm:px-6 pt-4 pb-12 sm:pb-16 md:pb-20 relative overflow-hidden">
      {/* Logo at the top of the banner */}
      <div className="flex items-center mb-6 sm:mb-8">
        <img src={logo} alt="Alcor Logo" className="h-16 sm:h-20 md:h-24" />
      </div>
      
      {/* Banner content */}
      <div className="text-center">
        <p className="text-base sm:text-lg flex items-center justify-center flex-wrap text-white/70">
          <span>{stepText} → Step {stepNumber}:</span> 
          <span className="flex items-center ml-1">
            <img src={starImage} alt="" className="h-4 sm:h-5 mr-1" />
            {stepName}
          </span>
        </p>
        <h1 className="flex items-center justify-center mt-3 sm:mt-4">
          <span className="text-4xl sm:text-4xl md:text-5xl font-bold min-w-max">{heading}</span>
          <img src={starImage} alt="" className="h-8 sm:h-10 md:h-12 ml-0.5" />
        </h1>
        <p className="text-base sm:text-lg mt-3 sm:mt-4 text-white/80">
          {subText}
        </p>
      </div>
    </div>
  );
};

export default Banner;