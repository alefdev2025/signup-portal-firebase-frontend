// File: components/ProgressCircles.jsx
import React from "react";
import yellowStar from "../assets/images/alcor-yellow-star.png";

/**
 * The ProgressCircles component displays the step indicators
 * with animated progress for the signup flow
 */
const ProgressCircles = ({ 
  steps = ["Account", "Contact Info", "Method", "Funding", "Membership"],
  activeStep = 0,
  maxCompletedStep = 0,
  onStepClick = () => {},
}) => {
  // Define color constants
  const startColor = "#715087"; // New purple start color
  const endColor = "#dac150";   // Yellow end color

  return (
    <div className="progress-section py-5 pb-8">
      <div className="flex justify-between w-full max-w-5xl relative mx-auto px-8">
        {/* Create a centered container for circles and lines */}
        <div className="flex items-center w-full relative" style={{ height: '44px' }}>
          {/* Base connector line - Straight through the center */}
          <div 
            className="absolute bg-white/5" 
            style={{ 
              left: '10%', 
              right: '10%',
              height: '2px',
              top: 'calc(50% - 7px)',
            }}
          ></div>

          {/* Active connector line - with new start color */}
          <div 
            className="absolute transition-all duration-700"
            style={{ 
              left: '10%',
              width: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 80}%`,
              height: '2px',
              top: 'calc(50% - 7px)',
              background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`
            }}
          ></div>

          {/* Step circles */}
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            // Step 0 is always clickable if we've completed any steps
            const isClickable = (index === 0 && maxCompletedStep > 0) || (index <= maxCompletedStep);

            let containerClasses = "w-6 h-6 md:w-8 md:h-8 sm:w-6 sm:h-6 xs:w-5 xs:h-5 rounded-full flex items-center justify-center";
            
            // Calculate gradient position based on index
            const gradientPosition = index / (steps.length - 1);
            
            // Generate colors based on gradient position
            let bgColor;
            let glowColor;
            
            if (isActive || isCompleted) {
              // For active/completed steps, blend from start to end color
              if (index === 0) {
                bgColor = "rgba(113, 80, 135, 0.7)"; // startColor at 70% opacity
                glowColor = "rgba(173, 140, 195, 0.8)"; // Much lighter version for glow (60 points higher, 80% opacity)
              } else if (index === steps.length - 1) {
                bgColor = "rgba(218, 193, 80, 0.7)"; // endColor at 70% opacity
                glowColor = "rgba(255, 233, 120, 0.8)"; // Much lighter version for glow (40 points higher, 80% opacity)
              } else {
                // Calculate intermediate colors for the gradient
                const step = index / (steps.length - 1);
                const r = Math.round(113 + (218 - 113) * step);
                const g = Math.round(80 + (193 - 80) * step);
                const b = Math.round(135 + (80 - 135) * step);
                bgColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
                
                // Much lighter version for glow (60 points higher, 80% opacity)
                const r2 = Math.min(255, r + 60);
                const g2 = Math.min(255, g + 60);
                const b2 = Math.min(255, b + 40); // Less brightening for blue to maintain color characteristics
                glowColor = `rgba(${r2}, ${g2}, ${b2}, 0.8)`;
              }
            } else {
              // For inactive steps, use the same color but with lower opacity
              if (index === 0) {
                bgColor = "rgba(113, 80, 135, 0.15)"; // startColor at 15% opacity
                glowColor = "rgba(173, 140, 195, 0.6)"; // Much lighter version for glow (60 points higher, 60% opacity)
              } else if (index === steps.length - 1) {
                bgColor = "rgba(218, 193, 80, 0.15)"; // endColor at 15% opacity
                glowColor = "rgba(255, 233, 120, 0.6)"; // Much lighter version for glow (40 points higher, 60% opacity)
              } else {
                // Calculate intermediate colors for the gradient
                const step = index / (steps.length - 1);
                const r = Math.round(113 + (218 - 113) * step);
                const g = Math.round(80 + (193 - 80) * step);
                const b = Math.round(135 + (80 - 135) * step);
                bgColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                
                // Much lighter version for glow (60 points higher, 60% opacity)
                const r2 = Math.min(255, r + 60);
                const g2 = Math.min(255, g + 60);
                const b2 = Math.min(255, b + 40); // Less brightening for blue to maintain color characteristics
                glowColor = `rgba(${r2}, ${g2}, ${b2}, 0.6)`;
              }
            }

            const opacity = isActive || isCompleted ? 1 : 0.5; // Lower opacity for inactive steps
            if (isActive) containerClasses += ` circle-glow circle-glow-${index}`;
            if (isClickable) containerClasses += " cursor-pointer";

            return (
              <div 
                key={index} 
                className="flex flex-col items-center flex-1"
                onClick={() => {
                  if (isClickable) {
                    onStepClick(index);
                  }
                }}
                data-testid={`progress-step-${index}`}
              >
                <div 
                  className={containerClasses}
                  style={{ 
                    backgroundColor: bgColor,
                    opacity: opacity,
                    position: 'relative',
                    zIndex: 20,
                    // Store the glow color as a CSS variable
                    ['--glow-color']: glowColor
                  }}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 sm:w-5 sm:h-5 xs:w-4.5 xs:h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <img 
                      src={yellowStar} 
                      alt={`Step ${index + 1}`}
                      className="w-5 h-5 md:w-6 md:h-6 sm:w-5 sm:h-5 xs:w-4.5 xs:h-4.5"
                    />
                  )}
                </div>
                {/* Text labels with WHITE color */}
                <div
                  className={`mt-1 text-xs text-center ${
                    isActive ? "text-white font-medium" : 
                    isCompleted ? "text-white" : 
                    "text-white/70"
                  }`}
                >
                  {`${index + 1}. ${step}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS for glow effect - longer pause between blink sequences while keeping blink speed the same */}
      <style jsx>{`
        .circle-glow {
          animation: double-circle-pulse 8s infinite; /* Increased total animation duration to 8s for longer pause */
        }

        @keyframes double-circle-pulse {
          0%, 3.75%, 6.25%, 8.75%, 11.25%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
          2.5% { /* Kept at same speed as before: 0.2s into 8s cycle = 2.5% */
            box-shadow: 0 0 16px 8px var(--glow-color);
          }
          5% { /* Kept at same speed as before: 0.4s into 8s cycle = 5% */
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
          7.5% { /* Kept at same speed as before: 0.6s into 8s cycle = 7.5% */
            box-shadow: 0 0 16px 8px var(--glow-color);
          }
          10% { /* Kept at same speed as before: 0.8s into 8s cycle = 10% */
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressCircles;