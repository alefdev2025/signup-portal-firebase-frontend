// File: components/ResponsiveBanner.jsx - With adjusted logo positioning
import React from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
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
  isWelcomePage = false, // Prop to identify welcome page
  useGradient = false, // NEW: explicit control over gradient background
  textAlignment = "default", // New prop: 'default', 'left', 'center'
}) => {
  const navigate = useNavigate();
  const { currentUser, signupState } = useUser() || {};
  const maxCompletedStep = signupState ? (signupState.signupProgress || 0) : 0;
  
  // Check if this is a signup page (has progress bar)
  const isSignupPage = showProgressBar;
  // Check if this is a login page (not a signup page, and text is centered)
  const isLoginPage = !isSignupPage && textAlignment === "center";
  
  // Should use gradient background
  const shouldUseGradient = useGradient || isWelcomePage;
  
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

  // Determine text alignment classes based on the textAlignment prop and page type
  const getTextAlignmentClasses = () => {
    // For login page or center alignment
    if (isLoginPage || textAlignment === "center") {
      return {
        containerClass: "text-center",
        headingClass: "justify-center",
        subtextClass: "mx-auto",
      };
    }
    
    // For signup page, always center the text
    if (isSignupPage) {
      return {
        containerClass: "text-center",
        headingClass: "justify-center",
        subtextClass: "mx-auto",
      };
    }
    
    // For welcome page, default to left aligned
    if (isWelcomePage && textAlignment === "default") {
      return {
        containerClass: "text-left",
        headingClass: "justify-start",
        subtextClass: "",
      };
    }
    
    // For explicit left alignment
    if (textAlignment === "left") {
      return {
        containerClass: "text-left",
        headingClass: "justify-start",
        subtextClass: "",
      };
    }
    
    // Fallback to default (center)
    return {
      containerClass: "text-center",
      headingClass: "justify-center",
      subtextClass: "mx-auto",
    };
  };
  
  const alignmentClasses = getTextAlignmentClasses();

  // Gradient style for banners that need it
  const gradientStyle = {
    background: 'linear-gradient(90deg, #13233e 0%, #2D3050 40%, #49355B 80%, #654a54 100%)'
  };

  // Get logo positioning class based on page type
  const getLogoPositioningClass = () => {
    // For signup page, always left-align logo
    if (isSignupPage) {
      return "justify-start";
    }
    
    // For login page, always left-align logo
    if (isLoginPage) {
      return "justify-start";
    }
    
    // For welcome page with default alignment, left-align
    if (isWelcomePage && textAlignment === "default") {
      return "justify-start";
    }
    
    // For explicit alignments
    if (textAlignment === "center") {
      return "justify-center";
    } else if (textAlignment === "left") {
      return "justify-start";
    } 
    
    // Default to center
    return "justify-center";
  };

  const logoPositioningClass = getLogoPositioningClass();

  // Get logo size based on page type
  const getLogoSizeClass = () => {
    // Signup and login pages have the same logo size
    if (isSignupPage || isLoginPage) {
      return "h-16 md:h-20";
    }
    
    // Welcome page has a slightly smaller logo
    if (isWelcomePage) {
      return "h-12 md:h-16";
    }
    
    // Default size
    return "h-16 md:h-20";
  };

  const logoSizeClass = getLogoSizeClass();
  
  // Get top padding class for login/portal pages
  const getTopPaddingClass = () => {
    // For login page, use more top padding to position logo higher
    if (isLoginPage && !isWelcomePage) {
      return "pt-8 md:pt-14";
    }
    
    // For welcome page
    if (isWelcomePage) {
      return "pt-16";
    }
    
    // For signup page with progress bar
    if (isSignupPage) {
      return "pt-10";
    }
    
    // Default padding
    return "pt-16";
  };
  
  const topPaddingClass = getTopPaddingClass();
  
  // Debug output to help identify issues
  console.log("ResponsiveBanner render:");
  console.log("- currentUser:", currentUser ? "logged in" : "not logged in");
  console.log("- signupState:", signupState);
  console.log("- activeStep:", activeStep);
  console.log("- maxCompletedStep:", maxCompletedStep);
  console.log("- isWelcomePage:", isWelcomePage);
  console.log("- isSignupPage:", isSignupPage);
  console.log("- isLoginPage:", isLoginPage);
  console.log("- shouldUseGradient:", shouldUseGradient);
  console.log("- textAlignment:", textAlignment);
  console.log("- displayHeading:", displayHeading);
  console.log("- logoPositioningClass:", logoPositioningClass);
  console.log("- logoSizeClass:", logoSizeClass);
  console.log("- topPaddingClass:", topPaddingClass);

  return (
    <div className="banner-container">
      {/* Mobile Banner (compact version) */}
      <div className="md:hidden">
        <div 
          className={`${shouldUseGradient ? '' : 'bg-[#13263f]'} text-white px-4 ${isWelcomePage ? 'py-8' : isLoginPage ? 'py-6' : 'py-4'} relative overflow-hidden`}
          style={shouldUseGradient ? gradientStyle : {}}
        >
          {/* Top section with logo and heading */}
          <div className={`flex items-center ${isSignupPage || isLoginPage ? "justify-between" : textAlignment === "center" ? "justify-center flex-col" : "justify-between"} mb-4`}>
            {/* Logo at the left or centered based on page type and textAlignment */}
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="Alcor Logo" 
                className={isWelcomePage && !isLoginPage ? "h-10" : "h-12"}
              />
            </div>
            
            {/* Header text */}
            <div className={`flex items-center ${textAlignment === "center" && !(isSignupPage || isLoginPage) ? "mt-4" : ""}`}>
              <h1 className={`flex items-center ${isSignupPage || isLoginPage || textAlignment === "center" ? "justify-center" : ""}`}>
                <span className={`${isWelcomePage ? "text-2xl" : "text-2xl"} font-bold`}>
                  {displayHeading}
                </span>
                {showStar && <img src={yellowStar} alt="" className="h-6 ml-0.5" />}
              </h1>
            </div>
          </div>
          
          {/* Mobile subtext */}
          {(isWelcomePage || textAlignment === "center" || (isSignupPage && !showProgressBar) || isLoginPage) && (
            <div className="mb-4">
              <p className={`text-base text-white/80 leading-tight ${isSignupPage || isLoginPage || textAlignment === "center" ? "text-center" : ""}`}>
                {displaySubText}
              </p>
            </div>
          )}
          
          {/* Mobile Progress Bar - inside colored banner */}
          {showProgressBar && (
            <div className="py-3 pb-6">
              <div className="flex justify-between w-full">
                {/* Create a centered container for circles and lines */}
                <div className="flex items-center w-full relative">
                  {/* Base connector line - Exactly centered with circles */}
                  <div 
                    className="absolute h-0.5 bg-white/5" 
                    style={{ 
                      left: '10%', 
                      right: '10%',
                      top: 'calc(50% - 7px)',
                    }}
                  ></div>

                  {/* Active connector line - with animation */}
                  <div 
                    className="absolute h-0.5 bg-gradient-to-r from-yellow-300/90 via-orange-400/90 to-red-500/90 transition-all duration-700"
                    style={{ 
                      left: '10%',
                      width: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 80}%`,
                      top: 'calc(50% - 7px)',
                    }}
                  ></div>

                  {/* Step circles */}
                  {steps.map((step, index) => {
                    const isActive = index === activeStep;
                    const isCompleted = index < activeStep;
                    // Step 0 is always clickable if we've completed any steps
                    const isClickable = (index === 0 && maxCompletedStep > 0) || (index <= maxCompletedStep);

                    let containerClasses = "w-5 h-5 rounded-full flex items-center justify-center relative";
                    
                    let bgColor;
                    if (isActive || isCompleted) {
                      if (index === 0) bgColor = "rgba(250, 204, 21, 0.7)"; // yellow-300 at 70% opacity
                      else if (index === 1) bgColor = "rgba(251, 146, 60, 0.7)"; // orange-400 at 70% opacity
                      else if (index === 2) bgColor = "rgba(239, 68, 68, 0.7)"; // red-500 at 70% opacity
                      else bgColor = "rgba(111, 45, 116, 0.7)"; // purple at 70% opacity
                    } else {
                      // For incomplete steps, use the same color but with lower opacity
                      if (index === 0) bgColor = "rgba(250, 204, 21, 0.15)"; // yellow-300 at 15% opacity
                      else if (index === 1) bgColor = "rgba(251, 146, 60, 0.15)"; // orange-400 at 15% opacity
                      else if (index === 2) bgColor = "rgba(239, 68, 68, 0.15)"; // red-500 at 15% opacity
                      else bgColor = "rgba(111, 45, 116, 0.15)"; // purple at 15% opacity
                    }

                    const opacity = isActive || isCompleted ? 1 : 0.5; // Lower opacity for inactive steps
                    if (isActive) containerClasses += " mobile-circle-glow";
                    if (isClickable) containerClasses += " cursor-pointer";

                    return (
                      <div 
                        key={index} 
                        className="flex flex-col items-center flex-1 relative"
                        onClick={() => {
                          if (isClickable) {
                            handleStepClick(index);
                          }
                        }}
                      >
                        <div 
                          className={containerClasses}
                          style={{ 
                            backgroundColor: bgColor,
                            opacity: opacity,
                          }}
                        >
                          {isCompleted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <img 
                              src={yellowStar} 
                              alt={`Step ${index + 1}`}
                              className="w-4.5 h-4.5"
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
        
        {/* Transparent section with Sign up text - NEW SECTION */}
        {showSteps && !isWelcomePage && (
          <div className="bg-transparent text-black px-4 pt-8 pb-5 flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-3">
              <span className="text-2xl font-semibold">Sign up → Step {stepNumber}:</span>
              <span className="flex items-center ml-2">
                <img src={yellowStar} alt="" className="h-8 mr-1" />
                <span className="font-semibold text-2xl">{stepName}</span>
              </span>
            </div>
            <p className="text-base text-gray-600 max-w-xs mx-auto">{displaySubText}</p>
          </div>
        )}
      </div>
      
      {/* Desktop Banner - consistent height regardless of progress bar visibility */}
      <div 
        className={`hidden md:block ${shouldUseGradient ? '' : 'bg-[#13263f]'}`}
        style={shouldUseGradient ? gradientStyle : {}}
      >
        {/* Main Banner Content - dynamic padding based on page type */}
        <div 
          className={`text-white px-10 ${topPaddingClass} ${isWelcomePage ? 'pb-24' : showProgressBar ? 'pb-10' : 'pb-20'}`}
        >
          {/* Logo at the top with conditional positioning - now using logoSizeClass */}
          <div className={`flex ${logoPositioningClass} ${isWelcomePage && !isLoginPage ? 'mb-8' : 'mb-4'}`}>
            <img 
              src={logo} 
              alt="Alcor Logo" 
              className={logoSizeClass}
            />
          </div>
          
          {/* Banner content - alignment based on textAlignment prop */}
          <div className={`${alignmentClasses.containerClass} max-w-4xl ${alignmentClasses.subtextClass}`}>
            {showSteps && !isWelcomePage && (
              <p className="text-lg flex items-center justify-center text-white/80 mb-2">
                <span>Sign up → Step {stepNumber}:</span> 
                <span className="flex items-center ml-1">
                  <img src={yellowStar} alt="" className="h-5 mr-1" />
                  {stepName}
                </span>
              </p>
            )}
            <h1 className={`flex items-center ${alignmentClasses.headingClass}`}>
              <span className={`${isWelcomePage ? "text-4xl md:text-5xl" : "text-4xl md:text-5xl"} font-bold min-w-max`}>
                {displayHeading}
              </span>
              {showStar && <img src={yellowStar} alt="" className="h-9 ml-1" />}
            </h1>
            <p className={`${showProgressBar ? "text-xl md:text-2xl mt-3" : "text-xl md:text-2xl mt-4"} text-white/80 ${alignmentClasses.subtextClass}`}>
              {displaySubText}
            </p>
          </div>
        </div>
        
        {/* Progress bar section - only shown when required */}
        {showProgressBar && (
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

                {/* Active connector line - with animation */}
                <div 
                  className="absolute bg-gradient-to-r from-yellow-300/90 via-orange-400/90 to-red-500/90 transition-all duration-700"
                  style={{ 
                    left: '10%',
                    width: `${activeStep === 0 ? 0 : (activeStep / (steps.length - 1)) * 80}%`,
                    height: '2px',
                    top: 'calc(50% - 7px)',
                  }}
                ></div>

                {/* Step circles */}
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isCompleted = index < activeStep;
                  // Step 0 is always clickable if we've completed any steps
                  const isClickable = (index === 0 && maxCompletedStep > 0) || (index <= maxCompletedStep);

                  let containerClasses = "w-6 h-6 md:w-8 md:h-8 sm:w-6 sm:h-6 xs:w-5 xs:h-5 rounded-full flex items-center justify-center";
                  
                  let bgColor;
                  if (isActive || isCompleted) {
                    if (index === 0) bgColor = "rgba(250, 204, 21, 0.7)"; // yellow-300 at 70% opacity
                    else if (index === 1) bgColor = "rgba(251, 146, 60, 0.7)"; // orange-400 at 70% opacity
                    else if (index === 2) bgColor = "rgba(239, 68, 68, 0.7)"; // red-500 at 70% opacity
                    else bgColor = "rgba(111, 45, 116, 0.7)"; // purple at 70% opacity
                  } else {
                    // For incomplete steps, use the same color but with lower opacity
                    if (index === 0) bgColor = "rgba(250, 204, 21, 0.15)"; // yellow-300 at 15% opacity
                    else if (index === 1) bgColor = "rgba(251, 146, 60, 0.15)"; // orange-400 at 15% opacity
                    else if (index === 2) bgColor = "rgba(239, 68, 68, 0.15)"; // red-500 at 15% opacity
                    else bgColor = "rgba(111, 45, 116, 0.15)"; // purple at 15% opacity
                  }

                  const opacity = isActive || isCompleted ? 1 : 0.5; // Lower opacity for inactive steps
                  if (isActive) containerClasses += " circle-glow";
                  if (isClickable) containerClasses += " cursor-pointer";

                  return (
                    <div 
                      key={index} 
                      className="flex flex-col items-center flex-1"
                      onClick={() => {
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
                          opacity: opacity,
                          position: 'relative',
                          zIndex: 20
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
          </div>
        )}
      </div>

      {/* CSS for glow effect */}
      <style jsx>{`
        .circle-glow {
          animation: double-circle-pulse 4s infinite;
        }

        .mobile-circle-glow {
          animation: mobile-circle-pulse 4s infinite;
        }

        @keyframes double-circle-pulse {
          0%, 55%, 100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          5% {
            box-shadow: 0 0 12px 5px rgba(250, 204, 21, 0.6);
          }
          9% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          13% {
            box-shadow: 0 0 12px 5px rgba(250, 204, 21, 0.7);
          }
          17% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
        }

        @keyframes mobile-circle-pulse {
          0%, 55%, 100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          5% {
            box-shadow: 0 0 10px 4px rgba(250, 204, 21, 0.6);
          }
          9% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
          13% {
            box-shadow: 0 0 10px 4px rgba(250, 204, 21, 0.7);
          }
          17% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveBanner;