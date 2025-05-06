import React from "react";

const CircularProgress = ({ steps, activeStep }) => {
  return (
    <div className="relative flex justify-center items-center py-12 px-4">
      <div className="flex justify-between w-full max-w-5xl z-10 relative">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          
          // Circle color logic
          let circleClasses = "w-14 h-14 md:w-14 md:h-14 sm:w-10 sm:h-10 xs:w-8 xs:h-8 rounded-full flex items-center justify-center text-lg sm:text-base xs:text-sm font-bold border-4 sm:border-3 xs:border-2 z-20 relative ";
          
          if (isActive) {
            if (index === 0) {
              circleClasses += "bg-yellow-300 text-brand-purple border-yellow-300 ";
            } else if (index === 1) {
              circleClasses += "bg-orange-400 text-white border-orange-400 ";
            } else if (index === 2) {
              circleClasses += "bg-red-500 text-white border-red-500 ";
            } else {
              circleClasses += "bg-brand-purple text-white border-brand-purple ";
            }
          } else if (isCompleted) {
            if (index === 0) {
              circleClasses += "bg-yellow-300 text-white border-yellow-300 ";
            } else if (index === 1) {
              circleClasses += "bg-orange-400 text-white border-orange-400 ";
            } else if (index === 2) {
              circleClasses += "bg-red-500 text-white border-red-500 ";
            } else {
              circleClasses += "bg-brand-purple text-white border-brand-purple ";
            }
          } else {
            circleClasses += "bg-gray-300 text-gray-600 border-gray-300 opacity-60 ";
          }
          
          // Add glow effect class for active step
          if (isActive) {
            circleClasses += "circle-glow ";
          }
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              {/* No separate glow element - glow is applied directly to the circle */}
              <div className={circleClasses}>
                {index + 1}
              </div>
              <div
                className={`mt-3 text-sm xs:text-xs text-center ${
                  isActive ? "text-black font-medium" : "text-gray-400"
                }`}
              >
                {step}
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
            box-shadow: 0 0 12px 5px rgba(250, 204, 21, 0.6);
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