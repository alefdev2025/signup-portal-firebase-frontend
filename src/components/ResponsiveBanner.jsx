import React from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import starImage from "../assets/images/alcor-star.png";

/**
 * Responsive Banner Component with solid background color
 * The component handles all text content based on the current step
 * 
 * @param {Object} props - Component props
 * @param {string} props.logo - Path to the logo image
 * @param {number} props.activeStep - Current active step (0-indexed)
 * @param {Array} props.steps - Array of step names
 * @returns {JSX.Element} Responsive banner component
 */
const ResponsiveBanner = ({ 
  activeStep = 0,
  steps = ["Account", "Contact Info", "Method", "Funding", "Membership"]
}) => {
  // Determine content based on activeStep
  const stepNumber = activeStep + 1;
  const stepName = steps[activeStep];
  
  // Get heading based on step
  const getHeading = () => {
    switch(activeStep) {
      case 0: return "Become a member";
      case 1: return "Contact information";
      case 2: return "Method selection";
      case 3: return "Funding details";
      case 4: return "Membership confirmation";
      default: return "Become a member";
    }
  };
  
  // Get subtext based on step
  const getSubText = () => {
    switch(activeStep) {
      case 0: return "Sign up process takes on average 5 minutes.";
      case 1: return "Help us personalize your experience.";
      case 2: return "Choose your preferred method of investment.";
      case 3: return "Set up your funding details.";
      case 4: return "Review and confirm your membership details.";
      default: return "Sign up process takes on average 5 minutes.";
    }
  };
  
  const heading = getHeading();
  const subText = getSubText();

  return (
    <>
      {/* Mobile Banner (compact version) */}
      <div 
        className="bg-[#12243b] text-white px-4 py-3 relative overflow-hidden flex items-center justify-between md:hidden"
      >
        {/* Logo at the left of the banner */}
        <div className="flex items-center">
          <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-16" />
        </div>
        
        {/* Header text positioned at the top right */}
        <div className="flex items-center">
          <h1 className="flex items-center">
            <span className="text-xl font-bold">{heading}</span>
            <img src={starImage} alt="" className="h-6 ml-0.5" />
          </h1>
        </div>
      </div>

      {/* Desktop Banner - hidden on mobile */}
      <div 
        className="bg-[#12243b] text-white px-8 pt-4 pb-14 md:pb-16 relative overflow-hidden hidden md:block"
      >
        {/* Logo at the top of the banner */}
        <div className="flex items-center pl-4 mt-0 mb-8">
          <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-20 md:h-24" />
        </div>
        
        {/* Banner content */}
        <div className="text-center">
          <p className="text-lg flex items-center justify-center flex-wrap text-white/70">
            <span>Sign up → Step {stepNumber}:</span> 
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

export default ResponsiveBanner;