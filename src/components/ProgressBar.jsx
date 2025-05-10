import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const ProgressBar = ({ steps, activeStep }) => {
  const navigate = useNavigate();
  const { signupState } = useUser();
  const maxCompletedStep = signupState?.signupProgress || 0;
  
  const handleStepClick = (index) => {
    // Only navigate to steps that are completed or the current step
    if (index <= maxCompletedStep) {
      navigate(`/signup?step=${index}`);
    }
  };

  return (
    <div className="flex justify-center py-12 px-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-full h-16 bg-gray-200 flex">
        {steps.map((step, index) => {
          // Each step has a specific color when active or completed
          let bgColor = "";
          let textColor = "text-white";
          
          if (index < activeStep) {
            // Completed steps
            bgColor = "bg-yellow-300"; // First step
            if (index === 1) bgColor = "bg-orange-400"; // Second step
            if (index === 2) bgColor = "bg-red-500"; // Third step
            if (index === 3) bgColor = "bg-brand-purple"; // Fourth step
          } else if (index === activeStep) {
            // Current active step
            if (index === 0) {
              bgColor = "bg-yellow-300";
              textColor = "text-brand-purple";
            } else if (index === 1) {
              bgColor = "bg-orange-400";
            } else if (index === 2) {
              bgColor = "bg-red-500";
            } else if (index === 3) {
              bgColor = "bg-brand-purple";
            }
          } else {
            // Future steps
            bgColor = "bg-gray-200";
            textColor = "text-gray-600";
          }
          
          // Add cursor styles and onClick handler only for completed steps
          const isClickable = index <= maxCompletedStep;
          const cursorStyle = isClickable ? 'cursor-pointer' : 'cursor-not-allowed';
          
          return (
            <div
              key={index}
              className={`flex-1 flex flex-col items-center justify-center font-semibold ${bgColor} ${textColor} ${cursorStyle}`}
              onClick={() => isClickable && handleStepClick(index)}
              role={isClickable ? "button" : "presentation"}
              aria-label={isClickable ? `Go to ${step}` : `${step} (not available yet)`}
            >
              {/* Apply rapid double-bounce animation */}
              <div className={index === activeStep ? 'step-content rapid-double-bounce' : ''}>
                <div className="text-xs uppercase tracking-wider">STEP {index + 1}</div>
                <div className="text-sm mt-1">{step}</div>
                
                {/* Add a visual indicator for clickable steps */}
                {index < activeStep && (
                  <div className="mt-1 text-xs opacity-70">
                    {/* Small edit icon or text */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    <span className="ml-1">Edit</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        .rapid-double-bounce {
          animation: rapid-double-bounce 5s cubic-bezier(0.1, 0.9, 0.2, 1) infinite;
        }
        
        @keyframes rapid-double-bounce {
          0%, 20%, 100% {
            transform: scale(1);
          }
          4% {
            transform: scale(1.07);
          }
          8% {
            transform: scale(1);
          }
          12% {
            transform: scale(1.07);
          }
          16% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;