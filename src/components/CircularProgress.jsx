import React from "react";
import starImage from "../assets/images/alcor-star.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const CircularProgress = ({ steps = [], activeStep = 0 }) => {
  const navigate = useNavigate();
  const { signupState } = useUser() || {};
  const maxCompletedStep = (signupState && signupState.signupProgress) || 0;
  
  const handleStepClick = (index) => {
    // Only navigate to steps that are completed or the current step
    if (index <= maxCompletedStep) {
      navigate(`/signup?step=${index}`);
    }
  };

  // Safety check - ensure steps is an array
  if (!Array.isArray(steps) || steps.length === 0) {
    console.warn("CircularProgress: steps prop is not an array or is empty");
    return null; // Return null if no steps to render
  }

  return (
    <div className="relative flex justify-center items-center py-12 px-4">
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
          const isClickable = index <= maxCompletedStep;

          let containerClasses = "w-8 h-8 md:w-9 md:h-9 sm:w-7 sm:h-7 xs:w-6 xs:h-6 rounded-full flex items-center justify-center z-20 relative ";
          
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
          
          // Add cursor style for clickable steps
          if (isClickable) containerClasses += "cursor-pointer ";

          return (
            <div 
              key={index} 
              className="flex flex-col items-center flex-1 relative"
              onClick={() => isClickable && handleStepClick(index)}
            >
              <div 
                className={containerClasses}
                style={{ 
                  backgroundColor: bgColor,
                  opacity: opacity
                }}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 md:w-5 md:h-5 sm:w-4 sm:h-4 xs:w-3 xs:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <img 
                    src={starImage} 
                    alt={`Step ${index + 1}`}
                    className="w-4 h-4 md:w-5 md:h-5 sm:w-4 sm:h-4 xs:w-3 xs:h-3"
                  />
                )}
              </div>
              <div
                className={`mt-2 text-xs text-center ${
                  isActive ? "text-black font-medium" : 
                  isCompleted ? "text-black" : 
                  "text-gray-400"
                }`}
              >
                {`${index + 1}. ${step}`}
                {isCompleted && (
                  <span className="block text-xs text-blue-600 mt-1">
                    Click to edit
                  </span>
                )}
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

export default CircularProgress;