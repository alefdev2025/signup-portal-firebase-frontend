import React from "react";

const ProgressBar = ({ steps, activeStep }) => {
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
          
          return (
            <div
              key={index}
              className={`flex-1 flex flex-col items-center justify-center font-semibold ${bgColor} ${textColor}`}
            >
              {/* Apply rapid double-bounce animation */}
              <div className={index === activeStep ? 'step-content rapid-double-bounce' : ''}>
                <div className="text-xs uppercase tracking-wider">STEP {index + 1}</div>
                <div className="text-sm mt-1">{step}</div>
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