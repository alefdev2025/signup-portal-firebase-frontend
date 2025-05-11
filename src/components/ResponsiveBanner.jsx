// File: components/ResponsiveBanner.jsx
import React from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import starImage from "../assets/images/alcor-star.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

/**
 * Responsive Banner Component that handles proper navigation and state management
 */
const ResponsiveBanner = ({ 
  logo = alcorWhiteLogo,
  activeStep = 0,
  steps = ["Account", "Contact Info", "Method", "Funding", "Membership"],
  heading = null,
  subText = null,
  showSteps = true,
  showStar = true,
  showProgressBar = true, 
}) => {
  const navigate = useNavigate();
  const { currentUser, signupState } = useUser() || {};
  const maxCompletedStep = signupState ? (signupState.signupProgress || 0) : 0;
  
  // Navigation logic for progress steps - maintain state when navigating
  const handleStepClick = (index) => {
    if (!showProgressBar) return;
    
    // Allow navigation to any previously completed step (including step 0)
    if (index <= maxCompletedStep) {
      console.log(`Navigating to step ${index}`);
      
      // Set flag to indicate returning to account page if going to step 0
      if (index === 0 && currentUser) {
        console.log("Setting returning_to_account flag in sessionStorage");
        sessionStorage.setItem('returning_to_account', 'true');
      }
      
      // Use query parameter to navigate between steps without losing state
      navigate(`/signup?step=${index}`);
    } else {
      console.log(`Cannot navigate to step ${index}, max completed step is ${maxCompletedStep}`);
    }
  };
  
  // Content calculations
  const stepNumber = activeStep + 1;
  const stepName = steps[activeStep];
  
  const getHeading = () => {
    if (heading) return heading;
    
    switch(activeStep) {
      case 0: return "Become a member";
      case 1: return "Contact information";
      case 2: return "Method selection";
      case 3: return "Funding details";
      case 4: return "Membership confirmation";
      default: return "Become a member";
    }
  };
  
  const getSubText = () => {
    if (subText) return subText;
    
    switch(activeStep) {
      case 0: return "Sign up process takes on average 5 minutes.";
      case 1: return "Help us personalize your experience.";
      case 2: return "Choose your preferred method of investment.";
      case 3: return "Set up your funding details.";
      case 4: return "Review and confirm your membership details.";
      default: return "Sign up process takes on average 5 minutes.";
    }
  };
  
  const displayHeading = getHeading();
  const displaySubText = getSubText();

  // Subtle gradient style matching the reference images with new colors
  const gradientStyle = {
    background: 'linear-gradient(90deg, #13233e 0%, #2D3050 40%, #49355B 80%, #654a54 100%)'
  };

  // Debug output to help identify issues
  console.log("ResponsiveBanner render:");
  console.log("- currentUser:", currentUser ? "logged in" : "not logged in");
  console.log("- signupState:", signupState);
  console.log("- activeStep:", activeStep);
  console.log("- maxCompletedStep:", maxCompletedStep);

  return (
    <div className="banner-container">
      {/* Mobile Banner (compact version) */}
      <div 
        className="text-white px-4 py-2 relative overflow-hidden flex items-center justify-between md:hidden"
        style={gradientStyle}
      >
        {/* Logo at the left of the banner */}
        <div className="flex items-center">
          <img src={logo} alt="Alcor Logo" className="h-12" />
        </div>
        
        {/* Header text positioned at the top right */}
        <div className="flex items-center">
          <h1 className="flex items-center">
            <span className="text-xl font-bold">{displayHeading}</span>
            {showStar && <img src={starImage} alt="" className="h-6 ml-0.5" />}
          </h1>
        </div>
      </div>
      
      {/* Desktop Banner - consistent height regardless of progress bar visibility */}
      <div 
        className="hidden md:block" 
        style={gradientStyle}
      >
        {/* Main Banner Content - taller if progress bar is not visible */}
        <div 
          className={`text-white px-10 ${showProgressBar ? 'pt-10 pb-10' : 'pt-16 pb-20'}`}
        >
          {/* Logo at the top left */}
          <div className="flex items-start mb-6">
            <img src={logo} alt="Alcor Logo" className="h-16 md:h-20" />
          </div>
          
          {/* Banner content - centered */}
          <div className="text-center max-w-4xl mx-auto">
            {showSteps && (
              <p className="text-lg flex items-center justify-center text-white/80 mb-2">
                <span>Sign up → Step {stepNumber}:</span> 
                <span className="flex items-center ml-1">
                  <img src={starImage} alt="" className="h-5 mr-1" />
                  {stepName}
                </span>
              </p>
            )}
            <h1 className="flex items-center justify-center">
              <span className="text-3xl font-bold min-w-max">{displayHeading}</span>
              {showStar && <img src={starImage} alt="" className="h-8 ml-1" />}
            </h1>
            <p className="text-lg mt-2 text-white/80 max-w-3xl mx-auto">
              {displaySubText}
            </p>
          </div>
        </div>
        
        {/* Progress bar section - only shown when required */}
        {showProgressBar && (
          <div className="progress-section py-5">
            <div className="flex justify-between w-full max-w-5xl relative mx-auto px-8">
              {/* Create a centered container for circles and lines */}
              <div className="flex items-center w-full relative">
                {/* Base connector line - Exactly centered with circles */}
                <div 
                  className="absolute h-0.5 bg-white/10" 
                  style={{ 
                    left: '12%', 
                    right: '12%',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                ></div>

                {/* Active connector line - with animation - Exactly centered with circles */}
                <div 
                  className="absolute h-0.5 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 transition-all duration-700"
                  style={{ 
                    left: '12%',
                    width: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 76}%`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                ></div>

                {/* Step circles */}
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isCompleted = index < activeStep;
                  // Step 0 is always clickable if we've completed any steps
                  const isClickable = (index === 0 && maxCompletedStep > 0) || (index <= maxCompletedStep);

                  let containerClasses = "w-7 h-7 md:w-8 md:h-8 sm:w-6 sm:h-6 xs:w-5 xs:h-5 rounded-full flex items-center justify-center z-20 relative ";
                  
                  let bgColor;
                  if (isActive || isCompleted) {
                    if (index === 0) bgColor = "#facc15"; // yellow-300
                    else if (index === 1) bgColor = "#fb923c"; // orange-400
                    else if (index === 2) bgColor = "#ef4444"; // red-500
                    else bgColor = "#6f2d74"; // purple
                  } else {
                    // For incomplete steps, use the same color but with lower opacity
                    if (index === 0) bgColor = "rgba(250, 204, 21, 0.2)"; // yellow-300 at 20% opacity
                    else if (index === 1) bgColor = "rgba(251, 146, 60, 0.2)"; // orange-400 at 20% opacity
                    else if (index === 2) bgColor = "rgba(239, 68, 68, 0.2)"; // red-500 at 20% opacity
                    else bgColor = "rgba(111, 45, 116, 0.2)"; // purple at 20% opacity
                  }

                  const opacity = isActive || isCompleted ? 1 : 0.5; // Lower opacity for inactive steps
                  if (isActive) containerClasses += "circle-glow ";
                  if (isClickable) containerClasses += "cursor-pointer ";

                  return (
                    <div 
                      key={index} 
                      className="flex flex-col items-center flex-1 relative"
                      onClick={() => {
                        console.log(`Circle ${index} clicked, isClickable:`, isClickable);
                        if (isClickable) {
                          handleStepClick(index);
                        }
                      }}
                      data-testid={`progress-step-${index}`}
                    >
                      <div 
                        className={containerClasses}
                        style={{ 
                          backgroundColor: bgColor,
                          opacity: opacity
                        }}
                      >
                        {isCompleted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 md:w-4 md:h-4 sm:w-3 sm:h-3 xs:w-2 xs:h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <img 
                            src={starImage} 
                            alt={`Step ${index + 1}`}
                            className="w-3 h-3 md:w-4 md:h-4 sm:w-3 sm:h-3 xs:w-2 xs:h-2"
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
          </div>
        )}
      </div>

      {/* CSS for glow effect */}
      <style jsx>{`
        .circle-glow {
          animation: double-circle-pulse 5s infinite;
        }

        @keyframes double-circle-pulse {
          0%, 55%, 100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          5%, 25% {
            box-shadow: 0 0 6px 2px rgba(250, 204, 21, 0.5);
          }
          15%, 35% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveBanner;