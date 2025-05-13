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
  steps = ["Account", "Contact Info", "Method", "Funding", "Membership"],
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
  
  // Navigation logic - maintain state when navigating
  const handleStepClick = (index) => {
    if (!showProgressBar || isLoading) return;
    
    // Allow navigation to any previously completed step (including step 0)
    if (index <= maxCompletedStep) {
      console.log(`Navigating to step ${index}`);
      
      // Set flag to indicate returning to account page if going to step 0
      if (index === 0 && currentUser) {
        console.log("Setting account_creation_success flag in localStorage");
        localStorage.setItem('account_creation_success', 'true');
      }
      
      // Use query parameter to navigate between steps without losing state
      navigate(`/signup?step=${index}`);
    } else {
      console.log(`Cannot navigate to step ${index}, max completed step is ${maxCompletedStep}`);
    }
  };

  // Handler for back button
  const handleBackClick = () => {
    if (activeStep > 0) {
      // Navigate to previous step
      const prevStep = activeStep - 1;
      
      // Set flag to indicate returning to account page if going to step 0
      if (prevStep === 0 && currentUser) {
        sessionStorage.setItem('returning_to_account', 'true');
      }
      
      navigate(`/signup?step=${prevStep}`);
    } else {
      // At first step, navigate back to welcome page
      navigate('/');
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
      case 1: return "Building your membership application.";
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
  console.log("ResponsiveBanner render:");
  console.log("- currentUser:", currentUser ? "logged in" : "not logged in");
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
            {/* Back button for signup pages */}
            {isSignupPage && activeStep > 0 && (
              <button 
                onClick={handleBackClick}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-colors"
                aria-label="Go Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Logo at the left or centered based on page type and textAlignment */}
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="Alcor Logo" 
                className={isWelcomePage && !isLoginPage ? "h-10" : "h-12"}
              />
            </div>
            
            {/* Placeholder for spacing symmetry if no back button */}
            {isSignupPage && activeStep === 0 && (
              <div className="w-6"></div>
            )}
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
          
          {/* Mobile subtext */}
          {(isWelcomePage || textAlignment === "center" || (isSignupPage && !showProgressBar) || isLoginPage) && (
            <div className="mb-4">
              <p className={`text-base text-white/80 leading-tight ${isSignupPage || isLoginPage || textAlignment === "center" ? "text-center" : ""}`}>
                {displaySubText}
              </p>
            </div>
          )}
          
          {/* Mobile Progress Bar - using the separated component */}
          {showProgressBar && !isLoading && (
            <MobileProgressCircles 
              steps={steps}
              activeStep={activeStep}
              maxCompletedStep={maxCompletedStep}
              onStepClick={handleStepClick}
            />
          )}
          
          {/* Loading indicator for progress bar */}
          {showProgressBar && isLoading && (
            <div className="flex justify-center items-center py-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
          className={`text-white px-10 ${topPaddingClass} ${isWelcomePage ? 'pb-24' : showProgressBar ? 'pb-10' : 'pb-20'} relative`}
        >
          {/* Back Button - Only show on signup pages when not on first step */}
          {isSignupPage && activeStep > 0 && (
            <button 
              onClick={handleBackClick}
              className="absolute top-10 left-10 p-2 rounded-full text-white hover:bg-white/10 transition-colors flex items-center"
              aria-label="Go Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
          )}
          
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
        
        {/* Progress bar section - using the separated component */}
        {showProgressBar && !isLoading && (
          <ProgressCircles
            steps={steps}
            activeStep={activeStep}
            maxCompletedStep={maxCompletedStep}
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