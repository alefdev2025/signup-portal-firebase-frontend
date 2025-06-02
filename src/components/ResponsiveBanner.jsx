// File: components/ResponsiveBanner.jsx - ROUTER-FREE VERSION
import React, { useState, useEffect } from "react";
import alcorWhiteLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
// REMOVED: import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useSignupFlow } from "../contexts/SignupFlowContext";
import ProgressCircles from "./ProgressCircles";
import MobileProgressCircles from "./MobileProgressCircles";
import { checkUserStep } from "../services/auth";

/**
 * Router-Free Responsive Banner Component
 * Uses SignupFlowContext for internal navigation and native JS for external navigation
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
  isWelcomePage = false,
  useGradient = false,
  textAlignment = "default",
}) => {
  // ROUTER-FREE: Use SignupFlowContext for internal navigation (optional)
  const signupFlowContext = useSignupFlow(); // Don't destructure immediately
  const navigateToStep = signupFlowContext?.navigateToStep;
  const canAccessStep = signupFlowContext?.canAccessStep;
  const { currentUser } = useUser() || {};
  
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
        console.log("Backend user step check result:", result);
        
        if (result.success) {
          setMaxCompletedStep(result.step || 0);
          
          if (result.isSessionExpired) {
            console.log("User session expired, redirecting to login");
            sessionStorage.setItem('session_expired', 'true');
            // ROUTER-FREE: Use native navigation for external redirect
            window.location.href = '/login';
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
    const intervalId = setInterval(fetchUserStep, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentUser, showProgressBar]);

  // ROUTER-FREE: Step click handler using SignupFlowContext (if available)
  const handleStepClick = (progressIndex) => {
    if (!showProgressBar || isLoading) return;
    
    // If no SignupFlowContext available (like on WelcomePage), do nothing
    if (!navigateToStep) {
      console.log('No SignupFlowContext available, step click ignored');
      return;
    }
    
    const targetStepIndex = getStepPathFromProgressIndex(progressIndex);
    
    // Special case: First progress dot goes to success page if account is created
    const finalTargetStep = progressIndex === 0 && maxCompletedStep >= 1 ? 1 : targetStepIndex;
    
    console.log(`Banner step click: progressIndex ${progressIndex} -> step ${finalTargetStep}`);
    console.log(`maxCompletedStep: ${maxCompletedStep}, canAccess: ${canAccessStep ? canAccessStep(finalTargetStep) : 'unknown'}`);
    
    // Check if user can access this step
    if (finalTargetStep <= maxCompletedStep || (canAccessStep && canAccessStep(finalTargetStep))) {
      console.log(`Navigating to step ${finalTargetStep} via SignupFlowContext`);
      
      // ROUTER-FREE: Use SignupFlowContext for smooth content swapping
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
      case 1: return "Account created!";
      case 2: return "Contact information";
      case 3: return "Package selection";
      case 4: return "Funding Options";
      case 5: return "Start Your Membership";
      default: return "Become a member";
    }
  };
  
  const getSubText = () => {
    if (subText) return subText;
    
    switch(activeStep) {
      case 0: return "Sign up process takes on average 5 minutes.";
      case 1: return "Your account has been successfully created.";
      case 2: return "Building your membership application.";
      case 3: return "Choose your cryopreservation package.";
      case 4: return "Set up your funding details.";
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

  const getLogoPositioningClass = () => {
    if (isSignupPage || isLoginPage) return "justify-start";
    if (isWelcomePage && textAlignment === "default") return "justify-start";
    if (textAlignment === "center") return "justify-center";
    if (textAlignment === "left") return "justify-start";
    return "justify-center";
  };

  const getLogoSizeClass = () => {
    if (isSignupPage || isLoginPage) return "h-16 md:h-20";
    if (isWelcomePage) return "h-12 md:h-16";
    return "h-16 md:h-20";
  };

  const getTopPaddingClass = () => {
    return "pt-8 md:pt-14";
  };
  
  const logoPositioningClass = getLogoPositioningClass();
  const logoSizeClass = getLogoSizeClass();
  const topPaddingClass = getTopPaddingClass();
  
  console.log("- maxCompletedStep:", maxCompletedStep);
  console.log("- activeStep:", activeStep);
  console.log("- progressIndex:", getProgressIndexFromStep(activeStep));

  const maxCompletedProgressDot = stepToProgressMap[maxCompletedStep] || 0;
  const activeProgressDot = getProgressIndexFromStep(activeStep);

  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

  return (
    <div className="banner-container" style={marcellusStyle}>
      {/* Mobile Banner */}
      <div className="md:hidden">
        <div 
          className={`${shouldUseGradient ? '' : 'bg-[#13263f]'} text-white px-4 ${isWelcomePage ? 'py-10' : isLoginPage ? 'py-8' : 'py-8'} relative overflow-hidden`}
          style={{
            ...marcellusStyle,
            ...(shouldUseGradient ? gradientStyle : {})
          }}
        >
          {/* Top section with logo and heading */}
          <div className="flex items-center justify-between mb-4 pt-3">
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="Alcor Logo" 
                className={isWelcomePage && !isLoginPage ? "h-10" : "h-12"}
              />
            </div>
            
            <div className="flex items-center">
              <h1 className="flex items-center">
                <span className="text-xl font-bold">
                  {displayHeading}
                </span>
                {showStar && <img src={yellowStar} alt="" className="h-5 ml-0.5" />}
              </h1>
            </div>
          </div>
        </div>
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
          className={`text-white px-10 ${topPaddingClass} pb-20 relative`}
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
            <h1 className={`flex items-center ${alignmentClasses.headingClass}`}>
              <span className={`${isWelcomePage ? "text-4xl md:text-5xl font-bold" : "text-4xl md:text-5xl font-bold"} min-w-max`}>
                {displayHeading}
              </span>
              {showStar && <img src={yellowStar} alt="" className="h-9 ml-1" />}
            </h1>
            <p className={`text-xl md:text-2xl mt-4 text-white/80 ${alignmentClasses.subtextClass}`}>
              {displaySubText}
            </p>
          </div>
        </div>
        
        {/* Progress bar section - using the separated component with corrected step mapping */}
        {/* Progress bar section - only show on desktop and for Account Created onwards */}
        {showProgressBar && activeStep >= 1 && !isLoading && (
          <div className="-mt-12">
            <ProgressCircles
              steps={steps}
              activeStep={activeProgressDot}
              maxCompletedStep={maxCompletedProgressDot}
              onStepClick={handleStepClick}
            />
          </div>
        )}
        
        {/* Loading indicator for progress bar - only on desktop */}
        {showProgressBar && activeStep >= 1 && isLoading && (
          <div className="py-4 px-10 bg-gray-100 flex justify-center items-center -mt-12">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Spacer to maintain banner height when progress circles are hidden - only on desktop */}
        {showProgressBar && activeStep < 1 && (
          <div className="py-4 px-10 bg-gray-100">
            {/* Empty spacer div to maintain consistent banner height */}
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