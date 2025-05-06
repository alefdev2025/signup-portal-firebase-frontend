import React from "react";
import starImage from "../assets/images/alcor-star.png";

const VerticalCircularProgress = ({ steps, activeStep }) => {
  return (
    <div className="hidden md:flex flex-col items-center fixed left-8 top-32 h-auto z-20">
      {/* Vertical connector line */}
      <div className="absolute w-0.5 bg-gray-200 h-full left-4 z-0"></div>

      {/* Active connector line */}
      <div 
        className="absolute w-0.5 bg-gradient-to-b from-yellow-300 via-orange-400 to-red-500 transition-all duration-300 left-4 z-0"
        style={{ 
          height: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 100}%`
        }}
      ></div>

      {steps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;

        let containerClasses = "w-9 h-9 rounded-full flex items-center justify-center z-20 relative mb-16 ";
        
        let bgColor;
        if (isActive || isCompleted) {
          if (index === 0) bgColor = "#facc15"; // yellow-300
          else if (index === 1) bgColor = "#fb923c"; // orange-400
          else if (index === 2) bgColor = "#ef4444"; // red-500
          else bgColor = "#6f2d74"; // purple
        } else {
          bgColor = "rgba(251, 146, 60, 0.2)";
        }

        const opacity = (isActive || isCompleted) ? 1 : 0.7;
        if (isActive) containerClasses += "circle-glow ";

        return (
          <div key={index} className="flex items-center mb-10 last:mb-0">
            <div 
              className={containerClasses}
              style={{ 
                backgroundColor: bgColor,
                opacity: opacity
              }}
            >
              <img 
                src={starImage} 
                alt={`Step ${index + 1}`}
                className="w-5 h-5"
              />
            </div>
            <div
              className={`ml-3 text-sm ${
                isActive ? "text-black font-medium" : "text-gray-400"
              }`}
            >
              {`${index + 1}. ${step}`}
            </div>
          </div>
        );
      })}

      {/* CSS for the circle glow effect */}
      <style jsx>{`
        .circle-glow {
          animation: double-circle-pulse 5s infinite;
        }

        @keyframes double-circle-pulse {
          0%, 55%, 100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          5%, 25% {
            box-shadow: 0 0 8px 3px rgba(250, 204, 21, 0.5);
          }
          15%, 35% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
        }
      `}</style>
    </div>
  );
};

// Original horizontal progress for mobile
const HorizontalCircularProgress = ({ steps, activeStep }) => {
  return (
    <div className="relative flex justify-center items-center py-12 px-4 md:hidden">
      <div className="flex justify-between w-full max-w-5xl z-10 relative">
        {/* Base connector line */}
        <div className="absolute top-5 h-0.5 bg-gray-200" style={{ left: '12%', right: '12%' }}></div>

        {/* Active connector line */}
        <div 
          className="absolute top-5 h-0.5 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 transition-all duration-300"
          style={{ 
            left: '12%',
            width: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 76}%`
          }}
        ></div>

        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          let containerClasses = "w-8 h-8 sm:w-7 sm:h-7 xs:w-6 xs:h-6 rounded-full flex items-center justify-center z-20 relative ";
          
          let bgColor;
          if (isActive || isCompleted) {
            if (index === 0) bgColor = "#facc15"; // yellow-300
            else if (index === 1) bgColor = "#fb923c"; // orange-400
            else if (index === 2) bgColor = "#ef4444"; // red-500
            else bgColor = "#6f2d74"; // purple
          } else {
            bgColor = "rgba(251, 146, 60, 0.2)";
          }

          const opacity = (isActive || isCompleted) ? 1 : 0.7;
          if (isActive) containerClasses += "circle-glow ";

          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              <div 
                className={containerClasses}
                style={{ 
                  backgroundColor: bgColor,
                  opacity: opacity
                }}
              >
                <img 
                  src={starImage} 
                  alt={`Step ${index + 1}`}
                  className="w-4 h-4 sm:w-4 sm:h-4 xs:w-3 xs:h-3"
                />
              </div>
              <div
                className={`mt-2 text-xs text-center ${
                  isActive ? "text-black font-medium" : "text-gray-400"
                }`}
              >
                {`${index + 1}. ${step}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS for the circle glow effect */}
      <style jsx>{`
        .circle-glow {
          animation: double-circle-pulse 5s infinite;
        }

        @keyframes double-circle-pulse {
          0%, 55%, 100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          5%, 25% {
            box-shadow: 0 0 8px 3px rgba(250, 204, 21, 0.5);
          }
          15%, 35% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
        }
      `}</style>
    </div>
  );
};

// Responsive Combined Progress Component
const CircularProgress = ({ steps, activeStep }) => {
  return (
    <>
      <HorizontalCircularProgress steps={steps} activeStep={activeStep} />
      <VerticalCircularProgress steps={steps} activeStep={activeStep} />
    </>
  );
};

// Responsive Banner Component
const ResponsiveBanner = ({ 
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

export default ResponsiveBanner;