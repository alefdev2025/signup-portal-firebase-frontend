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
    <div className="bg-[#13263f] text-white px-6 pt-4 pb-20 relative overflow-hidden">
      {/* Logo at the top of the banner */}
      <div className="flex items-center mb-10">
        <img src={logo} alt="Alcor Logo" className="h-16" />
      </div>
      
      {/* Banner content */}
      <div className="text-center">
        <p className="text-lg flex items-center justify-center">
          {stepText} → Step {stepNumber}: 
          <span className="flex items-center ml-1">
            <img src={starImage} alt="" className="h-5 mr-1" />
            {stepName}
          </span>
        </p>
        <h1 className="text-5xl font-bold mt-3">{heading}</h1>
        <p className="text-lg mt-2 text-white/80">
          {subText}
        </p>
      </div>
    </div>
  );
};

export default Banner;