import React from "react";

const CircularProgress = ({ steps, activeStep }) => {
  return (
    <div className="relative flex justify-center items-center py-12 px-4">
      <div className="flex justify-between w-full max-w-5xl z-10 relative">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isLast = index === steps.length - 1;
          
          // Circle color logic
          let circleClasses = "w-16 h-16 md:w-16 md:h-16 sm:w-12 sm:h-12 xs:w-10 xs:h-10 rounded-full flex items-center justify-center text-lg sm:text-base xs:text-sm font-bold border-4 sm:border-3 xs:border-2 z-20 relative ";
          
          if (isActive) {
            if (index === 0) {
              circleClasses += "bg-yellow-300 text-brand-purple border-yellow-300";
            } else if (index === 1) {
              circleClasses += "bg-orange-400 text-white border-orange-400";
            } else if (index === 2) {
              circleClasses += "bg-red-500 text-white border-red-500";
            } else {
              circleClasses += "bg-brand-purple text-white border-brand-purple";
            }
          } else if (isCompleted) {
            if (index === 0) {
              circleClasses += "bg-yellow-300 text-white border-yellow-300";
            } else if (index === 1) {
              circleClasses += "bg-orange-400 text-white border-orange-400";
            } else if (index === 2) {
              circleClasses += "bg-red-500 text-white border-red-500";
            } else {
              circleClasses += "bg-brand-purple text-white border-brand-purple";
            }
          } else {
            circleClasses += "bg-gray-300 text-gray-600 border-gray-300 opacity-60";
          }
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              {/* Connecting line to next step - positioned properly */}
              {!isLast && (
                <div className="absolute top-8 h-[2px] bg-gray-300 opacity-60" 
                    style={{ left: '60%', width: '80%' }} />
              )}
              
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
    </div>
  );
};

export default CircularProgress;