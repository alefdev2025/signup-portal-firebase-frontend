// File: components/MobileProgressCircles.jsx
import React from "react";
import yellowStar from "../assets/images/alcor-yellow-star.png";

/**
 * The MobileProgressCircles component displays the step indicators
 * with animated progress for the signup flow on mobile devices
 */
const MobileProgressCircles = ({ 
  steps = ["Account", "Contact Info", "Method", "Funding", "Membership"],
  activeStep = 0,
  maxCompletedStep = 0,
  onStepClick = () => {},
}) => {
  // Define exact colors for each step
  const stepExactColors = [
    "#5c3a6f", // Step 1: dark purple
    "#816283", // Step 2: lighter purple
    "#9d6980", // Step 3: mauve/pink
    "#b88069", // Step 4: salmon/light brown
    "#d09f53"  // Step 5: gold/yellow
  ];

  return (
    <div className="py-3 pb-3">
      <div className="flex justify-between w-full">
        {/* Create a centered container for circles and lines */}
        <div className="flex items-center w-full relative" style={{ height: '60px' }}>
          {/* Base connector lines - one between each pair of steps */}
          {Array.from({ length: steps.length - 1 }, (_, i) => (
            <div 
              key={`base-connector-${i}`}
              className="absolute bg-white/5" 
              style={{ 
                left: `${10 + (i * 80 / (steps.length - 1))}%`,
                width: `${80 / (steps.length - 1)}%`,
                height: '2px', 
                top: 'calc(50% - 10px)',
              }}
            ></div>
          ))}

          {/* Active connector lines - one for each completed segment */}
          {Array.from({ length: activeStep }, (_, i) => {
            const startColor = stepExactColors[i] || "#5c3a6f"; // Fallback color
            const endColor = stepExactColors[i + 1] || "#d09f53"; // Fallback color
            
            return (
              <div 
                key={`active-connector-${i}`}
                className="absolute transition-all duration-700"
                style={{ 
                  left: `${10 + (i * 80 / (steps.length - 1))}%`,
                  width: `${80 / (steps.length - 1)}%`,
                  height: '2px', 
                  top: 'calc(50% - 10px)',
                  background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`
                }}
              ></div>
            );
          })}

          {/* Step circles */}
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            // Step 0 is always clickable if we've completed any steps
            const isClickable = (index === 0 && maxCompletedStep > 0) || (index <= maxCompletedStep);

            let containerClasses = "w-7 h-7 rounded-full flex items-center justify-center relative";
            
            // Get the exact color for this step with fallback
            const baseColor = stepExactColors[index] || stepExactColors[stepExactColors.length - 1] || "#d09f53";
            
            // Extract the RGB values from the hex color
            const r = parseInt(baseColor.substring(1, 3), 16);
            const g = parseInt(baseColor.substring(3, 5), 16);
            const b = parseInt(baseColor.substring(5, 7), 16);
            
            // Define active, inactive, and glow colors
            const activeColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
            const inactiveColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
            
            // Make a lighter version for the glow (increase RGB values but cap at 255)
            const r2 = Math.min(255, r + 60);
            const g2 = Math.min(255, g + 60);
            const b2 = Math.min(255, b + 40);
            
            const activeGlowColor = `rgba(${r2}, ${g2}, ${b2}, 0.8)`;
            const inactiveGlowColor = `rgba(${r2}, ${g2}, ${b2}, 0.6)`;
            
            const bgColor = isActive || isCompleted ? activeColor : inactiveColor;
            const glowColor = isActive || isCompleted ? activeGlowColor : inactiveGlowColor;

            const opacity = isActive || isCompleted ? 1 : 0.5; // Lower opacity for inactive steps
            if (isActive) containerClasses += " mobile-circle-glow";
            if (isClickable) containerClasses += " cursor-pointer";

            return (
              <div 
                key={index} 
                className="flex flex-col items-center flex-1 relative"
                onClick={() => {
                  if (isClickable) {
                    onStepClick(index);
                  }
                }}
              >
                <div 
                  className={containerClasses}
                  style={{ 
                    backgroundColor: bgColor,
                    opacity: opacity,
                    // Store the glow color as a CSS variable
                    ['--glow-color']: glowColor
                  }}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <img 
                      src={yellowStar} 
                      alt={`Step ${index + 1}`}
                      className="w-5 h-5"
                    />
                  )}
                </div>
                {/* Text labels with WHITE color */}
                <div
                  className={`mt-2 text-sm text-center ${
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

      {/* CSS for mobile glow effect - matching the desktop timing and colors */}
      <style jsx>{`
        .mobile-circle-glow {
          animation: mobile-circle-pulse 8s infinite; /* Same 8s duration for longer pause */
        }

        @keyframes mobile-circle-pulse {
          0%, 3.75%, 6.25%, 8.75%, 11.25%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
          2.5% { /* Same timing pattern as desktop version */
            box-shadow: 0 0 16px 8px var(--glow-color); /* Increased glow size */
          }
          5% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
          7.5% {
            box-shadow: 0 0 16px 8px var(--glow-color); /* Increased glow size */
          }
          10% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileProgressCircles;