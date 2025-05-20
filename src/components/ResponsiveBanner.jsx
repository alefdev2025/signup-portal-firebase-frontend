// File: components/ResponsiveBanner.jsx
import React, { useState, useEffect } from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import ProgressCircles from "./ProgressCircles";
import MobileProgressCircles from "./MobileProgressCircles";
import { checkUserStep } from "../services/auth"; // Import the enhanced function

/**
 * Responsive Banner Component that handles proper navigation and state management
 * Always consults the backend to determine the user's current step and permissions
 */
const ResponsiveBanner = ({ 
  logo = alcorWhiteLogo,
  activeStep = 0,
  steps = ["Account", "Contact Info", "Package", "Funding", "Membership"],
  heading = null,
  subText = null,
  showSteps = true,
  showStar = true,
  showProgressBar = true,
  isWelcomePage = false, // Prop to identify welcome page
  useGradient = false, // Explicit control over gradient background
  textAlignment = "default", // 'default', 'left', 'center'
}) => {
  const navigate = useNavigate();
  const { currentUser } = useUser() || {};
  
  // State to track the max step the user can access (from backend)
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  
  // Step paths for route-based navigation (6 paths for 5 progress steps)
  const stepPaths = ["", "/success", "/contact", "/package", "/funding", "/membership"];
  
  // Map between progress UI index and actual step index
  // This is needed because step 0 and 1 are both part of the first progress dot ("Account")
  const progressToStepMap = {
    0: 0, // First progress dot -> Account (step path 0 or 1)
    1: 2, // Second progress dot -> Contact (step path 2)
    2: 3, // Third progress dot -> Package (step path 3)
    3: 4, // Fourth progress dot -> Funding (step path 4)
    4: 5  // Fifth progress dot -> Membership (step path 5)
  };
  
  // Reverse mapping - from step path index to progress index
  const stepToProgressMap = {
    0: 0, // Account creation step -> First progress dot
    1: 0, // Account success step -> First progress dot (both go under "Account")
    2: 1, // Contact step -> Second progress dot
    3: 2, // Package step -> Third progress dot
    4: 3, // Funding step -> Fourth progress dot
    5: 4  // Membership step -> Fifth progress dot
  };
  
  // Function to determine which progress dot should be active based on current step
  const getProgressIndexFromStep = (stepIndex) => {
    return stepToProgressMap[stepIndex] || 0;
  };
  
  // Function to get step path index from progress dot index
  const getStepPathFromProgressIndex = (progressIndex) => {
    return progressToStepMap[progressIndex] || 0;
  };
  
  // Check if this is a signup page (has progress bar)
  const isSignupPage = showProgressBar;
  // Check if this is a login page (not a signup page, and text is centered)
  const isLoginPage = !isSignupPage && textAlignment === "center";
  
  // Should use gradient background
  const shouldUseGradient = useGradient || isWelcomePage;
  
  // Fetch the user's step information from backend
  useEffect(() => {
    const fetchUserStep = async () => {
      if (!currentUser || !showProgressBar) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setBackendError(null);
        
        // Call the backend API to check user step
        const result = await checkUserStep({ userId: currentUser.uid });
        
        console.log("Backend user step check result:", result);
        
        if (result.success) {
          setMaxCompletedStep(result.step || 0);
          
          // If the user has been logged out due to inactivity, redirect to login
          if (result.isSessionExpired) {
            console.log("User session expired, redirecting to login");
            sessionStorage.setItem('session_expired', 'true');
            navigate('/login');
            return;
          }
        } else {
          console.error("Error fetching user step:", result.error);
          setBackendError(result.error);
          setMaxCompletedStep(0);
        }
      } catch (error) {
        console.error("Failed to fetch user step:", error);
        setBackendError(error.message);
        setMaxCompletedStep(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserStep();
    
    // Set up polling interval to check regularly (every 5 minutes)
    const intervalId = setInterval(fetchUserStep, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser, showProgressBar, navigate]);

// IMPROVED: handleStepClick with better debugging and package step handling
const handleStepClick = (progressIndex) => {
  if (!showProgressBar || isLoading) return;
  
  // Map from progress dot index to actual path index
  const pathIndex = getStepPathFromProgressIndex(progressIndex);
  
  // Special case: If clicking first progress dot (Account), always go to success page
  // unless the user hasn't completed account creation yet
  const targetPathIndex = progressIndex === 0 && maxCompletedStep >= 1 ? 1 : pathIndex;
  
  // Debug the values to see what's happening
  console.log(`DEBUG handleStepClick:
    progressIndex: ${progressIndex}
    pathIndex: ${pathIndex}
    targetPathIndex: ${targetPathIndex}
    maxCompletedStep: ${maxCompletedStep}
    stepPaths[targetPathIndex]: ${stepPaths[targetPathIndex]}
  `);
  
  // Always allow navigation to any previously completed step
  if (targetPathIndex <= maxCompletedStep) {
    console.log(`Navigating from progress index ${progressIndex} to path ${stepPaths[targetPathIndex]}`);
    
    // Set force navigation flag in localStorage for reliability with more specific flags
    localStorage.setItem('force_active_step', String(targetPathIndex));
    localStorage.setItem('force_timestamp', Date.now().toString());
    localStorage.setItem('force_navigation_source', 'banner_step_click');
    
    // Special case for package step which seems problematic
    let forceParam = progressIndex === 2 ? "force=true&banner=true" : "force=true";
    
    // Use direct URL navigation with force=true parameter to bypass route guard
    const targetPath = `/signup${stepPaths[targetPathIndex]}?${forceParam}`;
    console.log(`Using direct navigation with force parameter: ${targetPath}`);
    
    // Add a tiny delay to ensure localStorage is set before navigation
    setTimeout(() => {
      // Use direct browser navigation for maximum reliability
      window.location.href = targetPath;
    }, 10);
  } else {
    console.log(`Cannot navigate to step ${targetPathIndex}, max completed step is ${maxCompletedStep}`);
  }
};

  // Content calculations
  // Adjust stepNxqxaumber calculation to account for special mapping
  // If we're on account creation (0) or success page (1), show as Step 1
  const stepNumber = activeStep <= 1 ? 1 : activeStep;
  
  // Get appropriate step name based on activeStep
  const stepName = activeStep <= 1 ? steps[0] : steps[stepToProgressMap[activeStep]];
  
  // UPDATED: getHeading to account for new step mapping
  const getHeading = () => {
    if (heading) return heading;
    
    switch(activeStep) {
      case 0: return "Become a member"; // Account creation
      case 1: return "Account created!"; // Success page
      case 2: return "Contact information"; // Contact info
      case 3: return "Package selection"; // Package
      case 4: return "Funding Options"; // Funding
      case 5: return "Membership confirmation"; // Membership
      default: return "Become a member";
    }
  };
  
  // UPDATED: getSubText to account for new step mapping
  const getSubText = () => {
    if (subText) return subText;
    
    switch(activeStep) {
      case 0: return "Sign up process takes on average 5 minutes."; // Account creation
      case 1: return "Your account has been successfully created."; // Success page
      case 2: return "Building your membership application."; // Contact info
      case 3: return "Choose your cryopreservation package."; // Package
      case 4: return "Set up your funding details."; // Funding
      case 5: return "Review and confirm your membership details."; // Membership
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

  // Original gradient style for the background
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
  console.log("- maxCompletedStep:", maxCompletedStep);
  console.log("- activeStep:", activeStep);
  console.log("- progressIndex:", getProgressIndexFromStep(activeStep));

  // Convert backend max step to progress dots max step
  const maxCompletedProgressDot = stepToProgressMap[maxCompletedStep] || 0;
  // Calculate which progress dot should be active
  const activeProgressDot = getProgressIndexFromStep(activeStep);

  // Custom font style to apply Marcellus font to this component
  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

  return (
    <div className="banner-container" style={marcellusStyle}>
      {/* Mobile Banner (compact version) */}
      <div className="md:hidden">
        <div 
          className={`${shouldUseGradient ? '' : 'bg-[#13263f]'} text-white px-4 ${isWelcomePage ? 'py-10' : isLoginPage ? 'py-8' : 'py-8'} relative overflow-hidden`}
          style={{
            ...marcellusStyle,
            ...(shouldUseGradient ? gradientStyle : {})
          }}
        >
          {/* Top section with logo and heading - FIXED LAYOUT */}
          <div className="flex items-center justify-between mb-6 pt-4">
            {/* Logo at the left */}
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="Alcor Logo" 
                className={isWelcomePage && !isLoginPage ? "h-12" : "h-14"}
              />
            </div>
            
            {/* Heading in the top right */}
            <div className="flex items-center">
              <h1 className="flex items-center">
                <span className="text-2xl font-bold">
                  {displayHeading}
                </span>
                {showStar && <img src={yellowStar} alt="" className="h-6 ml-0.5" />}
              </h1>
            </div>
          </div>
          
          {/* Subtext below the header layout */}
          {(isWelcomePage || (isSignupPage && !showProgressBar) || isLoginPage) && (
            <div className="mb-6">
              <p className="text-base text-white/80 leading-tight text-center">
                {displaySubText}
              </p>
            </div>
          )}
          
          {/* Mobile Progress Bar - using the separated component with corrected step mapping */}
          {showProgressBar && !isLoading && (
            <MobileProgressCircles 
              steps={steps}
              activeStep={activeProgressDot}
              maxCompletedStep={maxCompletedProgressDot}
              onStepClick={handleStepClick}
            />
          )}
          
          {/* Loading indicator for progress bar */}
          {showProgressBar && isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        {/* Transparent section with Sign up text - NEW SECTION */}
        {showSteps && !isWelcomePage && (
          <div className="bg-transparent text-black px-4 pt-10 pb-6 flex flex-col items-center text-center" style={marcellusStyle}>
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
        style={{
          ...marcellusStyle,
          ...(shouldUseGradient ? gradientStyle : {})
        }}
      >
        {/* Main Banner Content - dynamic padding based on page type */}
        <div 
          className={`text-white px-10 ${topPaddingClass} ${isWelcomePage ? 'pb-24' : showProgressBar ? 'pb-10' : 'pb-20'} relative`}
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
        
        {/* Progress bar section - using the separated component with corrected step mapping */}
        {showProgressBar && !isLoading && (
          <ProgressCircles
            steps={steps}
            activeStep={activeProgressDot}
            maxCompletedStep={maxCompletedProgressDot}
            onStepClick={handleStepClick}
          />
        )}
        
        {/* Loading indicator for progress bar */}
        {showProgressBar && isLoading && (
          <div className="py-4 px-10 bg-gray-100 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Error message if backend check fails */}
        {backendError && (
          <div className="py-2 px-10 bg-red-50 text-red-600 text-sm text-center">
            Error checking step status. Please refresh the page.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveBanner;