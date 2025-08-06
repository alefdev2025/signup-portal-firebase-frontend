// File: components/ResponsiveBanner.jsx - COMPACT VERSION WITH CENTERED PROGRESS
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
 * Compact Responsive Banner Component with Centered Progress Steps
 * Layout: Logo (left) | Progress Steps (center) | Title (right)
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
  backgroundImage = astronautImage,
  useImageBackground = true,
}) => {
  // ROUTER-FREE: Use SignupFlowContext for internal navigation (optional)
  const signupFlowContext = useSignupFlow();
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
  const shouldUseImage = useImageBackground && !shouldUseGradient;
  
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
    
    if (!navigateToStep) {
      console.log('No SignupFlowContext available, step click ignored');
      return;
    }
    
    const targetStepIndex = getStepPathFromProgressIndex(progressIndex);
    const finalTargetStep = progressIndex === 0 && maxCompletedStep >= 1 ? 1 : targetStepIndex;
    
    //console.log(`Banner step click: progressIndex ${progressIndex} -> step ${finalTargetStep}`);
    //console.log(`maxCompletedStep: ${maxCompletedStep}, canAccess: ${canAccessStep ? canAccessStep(finalTargetStep) : 'unknown'}`);
    
    if (finalTargetStep <= maxCompletedStep || (canAccessStep && canAccessStep(finalTargetStep))) {
      console.log(`Navigating to step ${finalTargetStep} via SignupFlowContext`);
      navigateToStep(finalTargetStep, { 
        force: true, 
        reason: 'banner_navigation' 
      });
    } else {
      console.log(`Cannot navigate to step ${finalTargetStep}, max completed: ${maxCompletedStep}`);
    }
  };

  // Content calculations
  const getHeading = () => {
    if (heading) return heading;
    
    switch(activeStep) {
      case 0: return "Become a member";
      case 1: return "Account created!";
      case 2: return "Contact information";
      case 3: return "Package selection";
      case 4: return "Funding Options";
      case 5: return "Start Membership";
      default: return "Become a member";
    }
  };
  
  const getSubText = () => {
    if (subText) return subText;
    
    switch(activeStep) {
      case 0: return "5 minute sign up";
      case 1: return "Success!";
      case 2: return "Building application";
      case 3: return "Choose package";
      case 4: return "Set up funding";
      case 5: return "Review details";
      default: return "5 minute sign up";
    }
  };
  
  const displayHeading = getHeading();
  const displaySubText = getSubText();

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
    backgroundColor: 'rgba(19, 38, 63, 0.85)',
    zIndex: 1,
  };

  const maxCompletedProgressDot = stepToProgressMap[maxCompletedStep] || 0;
  const activeProgressDot = getProgressIndexFromStep(activeStep);

  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };



  return (
    <div className="banner-container" style={marcellusStyle}>
      {/* Mobile Banner - Keep existing mobile design */}
      <div className="md:hidden">
        <div 
          className={`text-white px-4 ${isWelcomePage ? 'py-10' : isLoginPage ? 'py-8' : 'py-8'} relative overflow-hidden`}
          style={{
            ...marcellusStyle,
            ...(shouldUseGradient ? gradientStyle : (shouldUseImage ? imageBackgroundStyle : { backgroundColor: '#13263f' }))
          }}
        >
          {shouldUseImage && <div style={overlayStyle}></div>}
          
          <div className="flex items-center justify-between mb-4 pt-3" style={{ position: 'relative', zIndex: 2 }}>
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
      
      {/* Desktop Banner - Compact single-row layout */}
      <div 
        className="hidden md:block w-full text-white shadow-lg flex-shrink-0"
        style={{
          ...marcellusStyle,
          ...(shouldUseGradient ? gradientStyle : (shouldUseImage ? imageBackgroundStyle : { backgroundColor: '#13263f' }))
        }}
      >
        {shouldUseImage && <div style={overlayStyle}></div>}
        
        {/* Single row with three sections */}
        <div 
          className="px-6 py-6 flex items-center justify-between"
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src={logo} 
              alt="Alcor Logo" 
              className="h-12 md:h-16 lg:h-20"
            />
          </div>
          
          {/* Center: Progress Steps (if applicable) */}
          <div className="flex-1 flex justify-center items-center">
            {showProgressBar && activeStep >= 1 && !isLoading ? (
              <div className="w-full max-w-2xl">
                <ProgressCircles
                  steps={steps}
                  activeStep={activeProgressDot}
                  maxCompletedStep={maxCompletedProgressDot}
                  onStepClick={handleStepClick}
                />
              </div>
            ) : (
              // Empty space to maintain layout when no progress bar
              <div className="w-full"></div>
            )}
          </div>
          
          {/* Right: Title and subtitle */}
          <div className="flex items-center flex-shrink-0">
            <div className="text-right">
              <h1 className="flex items-center justify-end">
                <span className="text-xl md:text-2xl lg:text-3xl font-bold">
                  {displayHeading}
                </span>
                {showStar && <img src={yellowStar} alt="" className="h-7 md:h-8 lg:h-10 ml-2" />}
              </h1>
              {displaySubText && (
                <p className="text-sm md:text-base text-white/80 mt-1">
                  {displaySubText}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Error message if backend check fails */}
        {backendError && (
          <div className="py-2 px-6 bg-red-50 text-red-600 text-sm text-center" style={{ position: 'relative', zIndex: 2 }}>
            Error checking step status. Please refresh the page.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveBanner;