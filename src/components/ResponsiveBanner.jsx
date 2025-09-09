// File: components/ResponsiveBanner.jsx - ROUTER-FREE VERSION WITH IMAGE BACKGROUND
import React, { useState, useEffect } from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
import astronautImage from "../assets/images/astronaut1.jpg";
import { useUser } from "../contexts/UserContext";
import { useSignupFlow } from "../contexts/SignupFlowContext";
import ProgressCircles from "./ProgressCircles";
import MobileProgressCircles from "./MobileProgressCircles";
import { checkUserStep } from "../services/auth";

/**
 * Router-Free Responsive Banner Component with Image Background
 * Uses SignupFlowContext for internal navigation and native JS for external navigation
 */
const ResponsiveBanner = ({ 
  logo = alcorWhiteLogo,
  activeStep = 0,
  //steps = ["Account", "Contact Info", "Package", "Funding", "Membership"],
  steps = ["Account", "Contact Info", "Package", "Funding", "Membership"],
  heading = null,
  subText = null,
  showSteps = true,
  showStar = true,
  showProgressBar = true,
  isWelcomePage = false,
  useGradient = false,
  textAlignment = "default",
  backgroundImage = astronautImage, // New prop for custom background image
  useImageBackground = true, // New prop to toggle image background
}) => {
  // ROUTER-FREE: Use SignupFlowContext for internal navigation (optional)
  const signupFlowContext = useSignupFlow();
  const navigateToStep = signupFlowContext?.navigateToStep;
  const canAccessStep = signupFlowContext?.canAccessStep;
  const { currentUser, logout } = useUser() || {};
  
  // State to track the max step the user can access (from backend)
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState(null);
  
  // Step mapping for progress dots
  const progressToStepMap = {
    0: 0, // First progress dot -> Account (step 0) or Success (step 1)
    1: 2, // Second progress dot -> Contact (step 2)
    2: 3, // Third progress dot -> Package (step 3)
    3: 4, // Fourth progress dot -> Funding (step 4)
    4: 5  // Fifth progress dot -> Membership (step 5)
  };
  
  const stepToProgressMap = {
    0: 0, // Account creation step -> First progress dot
    1: 0, // Account success step -> First progress dot
    2: 1, // Contact step -> Second progress dot
    3: 2, // Package step -> Third progress dot
    4: 3, // Funding step -> Fourth progress dot
    5: 4  // Membership step -> Fifth progress dot
  };
  
  const getProgressIndexFromStep = (stepIndex) => {
    return stepToProgressMap[stepIndex] || 0;
  };
  
  const getStepPathFromProgressIndex = (progressIndex) => {
    return progressToStepMap[progressIndex] || 0;
  };
  
  // Check if this is a signup page
  const isSignupPage = showProgressBar;
  const isLoginPage = !isSignupPage && textAlignment === "center";
  const shouldUseGradient = useGradient || isWelcomePage;
  const shouldUseImage = useImageBackground && !shouldUseGradient;
  
  // Logo click handler - navigate to alcor.org and log out user
  const handleLogoClick = async (e) => {
    e.preventDefault();
    
    // Only attempt logout if user exists and logout function is available
    if (currentUser && onLogout && typeof onLogout === 'function') {
      try {
        console.log('Logging out user before navigation to alcor.org');
        await onLogout();
      } catch (error) {
        console.error('Error during logout:', error);
        // Continue with navigation even if logout fails
      }
    }
    
    // Safely clear session data
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
    
    try {
      if (typeof localStorage !== 'undefined') {
        // Optionally clear localStorage - be careful not to clear other app data
        const keysToRemove = ['authToken', 'userSession', 'currentUser'];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (err) {
            console.error(`Error removing ${key} from localStorage:`, err);
          }
        });
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Navigate to alcor.org - this should always happen
    try {
      window.location.href = 'https://alcor.org';
    } catch (error) {
      console.error('Error navigating to alcor.org:', error);
      // Fallback
      window.open('https://alcor.org', '_self');
    }
  };
  
  // Fetch user's step information from backend
  useEffect(() => {
    const fetchUserStep = async () => {
      if (!currentUser || !showProgressBar) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setBackendError(null);
        
        const result = await checkUserStep({ userId: currentUser.uid });
        //console.log("Backend user step check result:", result);
        
        if (result.success) {
          setMaxCompletedStep(result.step || 0);
          
          if (result.isSessionExpired) {
            //console.log("User session expired, redirecting to login");
            sessionStorage.setItem('session_expired', 'true');
            window.location.href = '/login';
            return;
          }
        } else {
          //console.error("Error fetching user step:", result.error);
          setBackendError(result.error);
          setMaxCompletedStep(0);
        }
      } catch (error) {
        //console.error("Failed to fetch user step:", error);
        setBackendError(error.message);
        setMaxCompletedStep(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserStep();
    const intervalId = setInterval(fetchUserStep, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentUser, showProgressBar]);

  // ROUTER-FREE: Step click handler using SignupFlowContext (if available)
  const handleStepClick = (progressIndex) => {
    if (!showProgressBar || isLoading) return;
    
    if (!navigateToStep) {
      console.log('No SignupFlowContext available, step click ignored');
      return;
    }
    
    const targetStepIndex = getStepPathFromProgressIndex(progressIndex);
    const finalTargetStep = progressIndex === 0 && maxCompletedStep >= 1 ? 1 : targetStepIndex;
    
    //console.log(`Banner step click: progressIndex ${progressIndex} -> step ${finalTargetStep}`);
    //console.log(`maxCompletedStep: ${maxCompletedStep}, canAccess: ${canAccessStep ? canAccessStep(finalTargetStep) : 'unknown'}`);
    
    if (finalTargetStep <= maxCompletedStep || (canAccessStep && canAccessStep(finalTargetStep))) {
      //console.log(`Navigating to step ${finalTargetStep} via SignupFlowContext`);
      navigateToStep(finalTargetStep, { 
        force: true, 
        reason: 'banner_navigation' 
      });
    } else {
      console.log(`Cannot navigate to step ${finalTargetStep}, max completed: ${maxCompletedStep}`);
    }
  };

  // Content calculations
  const stepNumber = activeStep <= 1 ? 1 : activeStep;
  const stepName = activeStep <= 1 ? steps[0] : steps[stepToProgressMap[activeStep]];
  
  const getHeading = () => {
    if (heading) return heading;
    
    switch(activeStep) {
      case 0: return "Become a member";
      case 1: return "Account created";
      case 2: return "Contact information";
      case 3: return "Plan selection";
      case 4: return "Funding Options";
      case 5: return "Launch Your Membership";
      default: return "Become a member";
    }
  };
  
  const getSubText = () => {
    if (subText) return subText;
    
    switch(activeStep) {
      case 0: return "Sign up process takes on average 5 minutes.";
      case 1: return "Your account has been successfully created.";
      case 2: return "Building your membership application.";
      case 3: return "Choose your cryopreservation plan.";
      case 4: return "Let us know your cryopreservation funding preference.";
      case 5: return "Review and confirm your membership details.";
      default: return "Sign up process takes on average 5 minutes.";
    }
  };
  
  const displayHeading = getHeading();
  const displaySubText = getSubText();

  // Text alignment logic
  const getTextAlignmentClasses = () => {
    if (isLoginPage || textAlignment === "center") {
      return {
        containerClass: "text-center",
        headingClass: "justify-center",
        subtextClass: "mx-auto",
      };
    }
    
    if (isSignupPage) {
      return {
        containerClass: "text-center",
        headingClass: "justify-center",
        subtextClass: "mx-auto",
      };
    }
    
    if (isWelcomePage && textAlignment === "default") {
      return {
        containerClass: "text-left",
        headingClass: "justify-start",
        subtextClass: "",
      };
    }
    
    if (textAlignment === "left") {
      return {
        containerClass: "text-left",
        headingClass: "justify-start",
        subtextClass: "",
      };
    }
    
    return {
      containerClass: "text-center",
      headingClass: "justify-center",
      subtextClass: "mx-auto",
    };
  };
  
  const alignmentClasses = getTextAlignmentClasses();

  // Styling
  const gradientStyle = {
    background: 'linear-gradient(90deg, #0a1629 0%, #1e2650 100%)'
  };

  const imageBackgroundStyle = {
    backgroundImage: shouldUseImage ? `url(${backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 38, 63, 0.85)', // Dark overlay to ensure text readability
    zIndex: 1,
  };

  const getLogoPositioningClass = () => {
    if (isSignupPage || isLoginPage) return "justify-start";
    if (isWelcomePage && textAlignment === "default") return "justify-start";
    if (textAlignment === "center") return "justify-center";
    if (textAlignment === "left") return "justify-start";
    return "justify-center";
  };

  const getLogoSizeClass = () => {
    if (isSignupPage || isLoginPage) return "h-16 md:h-16";
    if (isWelcomePage) return "h-12 md:h-16";
    return "h-16 md:h-16";
  };

  const getTopPaddingClass = () => {
    return "pt-8 md:pt-10";
  };
  
  const logoPositioningClass = getLogoPositioningClass();
  const logoSizeClass = getLogoSizeClass();
  const topPaddingClass = getTopPaddingClass();
  
  //console.log("- maxCompletedStep:", maxCompletedStep);
  //console.log("- activeStep:", activeStep);
  //console.log("- progressIndex:", getProgressIndexFromStep(activeStep));

  const maxCompletedProgressDot = stepToProgressMap[maxCompletedStep] || 0;
  const activeProgressDot = getProgressIndexFromStep(activeStep);

  // Changed from Marcellus to Helvetica
  const interStyle = {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  };

  return (
    <div className="banner-container" style={interStyle}>
    {/* Mobile Banner */}
    <div className="md:hidden">
      <div 
        className="text-white px-4 py-5 relative overflow-hidden flex items-center"
        style={{
          ...interStyle,
          ...(shouldUseGradient ? gradientStyle : (shouldUseImage ? imageBackgroundStyle : { backgroundColor: '#13263f' }))
        }}
      >
        {/* Dark overlay for image background */}
        {shouldUseImage && <div style={overlayStyle}></div>}
        
        {/* Logo on the left - now clickable */}
        <div className="mr-auto" style={{ position: 'relative', zIndex: 2 }}>
          <button
            onClick={handleLogoClick}
            className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md p-1 -m-1 transition-opacity hover:opacity-80"
            aria-label="Go to Alcor.org homepage"
          >
            <img 
              src={logo} 
              alt="Alcor Logo" 
              className={isWelcomePage && !isLoginPage ? "h-12" : "h-12"}
            />
          </button>
        </div>

        {/* Heading on the right with slight downward offset */}
        <h1 className="flex items-center mt-1" style={{ position: 'relative', zIndex: 2 }}>
          <span className="text-lg font-normal">
            {displayHeading}
          </span>
          {showStar && <img src={yellowStar} alt="" className="h-5 ml-0.5" />}
        </h1>
      </div>
    </div>
      
      {/* Desktop Banner - consistent height regardless of progress bar visibility */}
      <div 
        className="hidden md:block"
        style={{
          ...interStyle,
          ...(shouldUseGradient ? gradientStyle : (shouldUseImage ? imageBackgroundStyle : { backgroundColor: '#13263f' }))
        }}
      >
        {/* Dark overlay for image background */}
        {shouldUseImage && <div style={overlayStyle}></div>}
        
        {/* Main Banner Content - dynamic padding based on page type */}
        <div 
          className={`text-white px-10 ${topPaddingClass} pb-20 relative`}
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* Logo at the top with conditional positioning - now clickable */}
          <div className={`flex ${logoPositioningClass} ${isWelcomePage && !isLoginPage ? 'mb-8' : 'mb-4'}`}>
            <button
              onClick={handleLogoClick}
              className="focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-md p-2 -m-2 transition-opacity hover:opacity-80"
              aria-label="Go to Alcor.org homepage"
            >
              <img 
                src={logo} 
                alt="Alcor Logo" 
                className={logoSizeClass}
              />
            </button>
          </div>
          
          {/* Banner content - alignment based on textAlignment prop */}
          <div className={`${alignmentClasses.containerClass} max-w-4xl ${alignmentClasses.subtextClass}`}>
            <h1 className={`flex items-center ${alignmentClasses.headingClass}`}>
              {/* Changed from text-4xl/5xl to text-3xl/4xl and from font-bold to font-normal */}
              <span className={`${isWelcomePage ? "text-3xl md:text-[2rem] font-normal" : "text-3xl md:text-[2rem] font-normal"} min-w-max`}>
                {displayHeading}
              </span>
              {/* Adjusted star size from h-9 to h-7 to match smaller heading */}
              {showStar && <img src={yellowStar} alt="" className="h-7 ml-1" />}
            </h1>
            {/* Changed from text-xl/2xl to text-lg/xl with font-light */}
            <p className={`text-sm md:text-base mt-4 text-white/90 font-light ${alignmentClasses.subtextClass}`}>
              {displaySubText}
            </p>
          </div>
        </div>
        
        {/* Progress bar section */}
        {showProgressBar && activeStep >= 1 && !isLoading && (
          <div className="-mt-12" style={{ position: 'relative', zIndex: 2 }}>
            <ProgressCircles
              steps={steps}
              activeStep={activeProgressDot}
              maxCompletedStep={maxCompletedProgressDot}
              onStepClick={handleStepClick}
            />
          </div>
        )}
        
        {/* Loading indicator for progress bar */}
        {showProgressBar && activeStep >= 1 && isLoading && (
          <div className="py-4 px-10 bg-gray-100 flex justify-center items-center -mt-12" style={{ position: 'relative', zIndex: 2 }}>
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Spacer to maintain banner height when progress circles are hidden */}
        {showProgressBar && activeStep < 1 && (
          <div className="py-4 px-10 bg-gray-100" style={{ position: 'relative', zIndex: 2 }}>
            {/* Empty spacer div to maintain consistent banner height */}
          </div>
        )}
        
        {/* Error message if backend check fails */}
        {backendError && (
          <div className="py-2 px-10 bg-red-50 text-red-600 text-sm text-center" style={{ position: 'relative', zIndex: 2 }}>
            Error checking step status. Please refresh the page.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveBanner;