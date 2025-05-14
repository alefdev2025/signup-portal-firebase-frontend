// File: pages/WelcomePage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveBanner from "../components/ResponsiveBanner";
import darkLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

// Import from auth service
import { logout } from "../services/auth";

// Define the same steps array that's used in SignupPage for consistency
const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

const WelcomePage = () => {
  const navigate = useNavigate();

  // Clear ALL state when the Welcome page loads
  useEffect(() => {
    const clearAllState = async () => {
      console.log("Clearing all state on WelcomePage mount");
      try {
        // Clear all localStorage items
        localStorage.removeItem('alcor_signup_state');
        localStorage.removeItem('alcor_verification_state');
        localStorage.removeItem('navigation_history');
        localStorage.removeItem('alcor_form_data');
        localStorage.removeItem('emailForSignIn');
        localStorage.removeItem('fresh_signup');
        
        // EXPLICITLY clear account_creation_success flag
        localStorage.removeItem('account_creation_success');
        localStorage.removeItem('force_active_step');
        localStorage.removeItem('force_timestamp');
        
        // Clear verification flags
        localStorage.removeItem('just_verified');
        localStorage.removeItem('verification_timestamp');
        
        // Clear any other stray flags
        localStorage.removeItem('has_navigated');
        
        // Sign out user if they're logged in
        try {
          await logout();
        } catch (logoutError) {
          console.error("Logout error (non-critical):", logoutError);
          // Continue anyway - we've cleared the localStorage
        }
      } catch (error) {
        console.error("Error clearing state:", error);
      }
    };
    
    clearAllState();
  }, []);

  const goToSignup = async () => {  // Make this async
    try {
      console.log("Get Started button clicked, clearing state and redirecting");
      // Clear all localStorage items
      localStorage.removeItem('alcor_signup_state');
      localStorage.removeItem('alcor_verification_state');
      localStorage.removeItem('alcor_form_data');
      localStorage.removeItem('emailForSignIn');
      localStorage.removeItem('account_creation_success');
      localStorage.removeItem('force_active_step');
      localStorage.removeItem('force_timestamp');
      localStorage.removeItem('just_verified');
      localStorage.removeItem('verification_timestamp');
      
      // Set hasNavigatedRef to false explicitly via localStorage
      localStorage.setItem('has_navigated', 'false');
      
      // First, ensure the user is fully logged out and wait for completion
      await logout();
      
      // Add a flag to indicate a fresh start
      localStorage.setItem('fresh_signup', 'true');
      
      // Force a hard reload to ensure all React state is cleared
      // This is important to reset the auth state completely
      window.location.href = '/signup?fresh=true';
    } catch (error) {
      console.error("Error in goToSignup:", error);
      // Still try to navigate even if there's an error
      window.location.href = '/signup?fresh=true';
    }
  };
  
  const goToLogin = (continueSignup = false) => {
    console.log(`Login button clicked, continueSignup=${continueSignup}`);
    if (continueSignup) {
      navigate('/login?continue=signup');
    } else {
      navigate('/login');
    }
  };

  // Define the card data with content and specific styling for each card
  const iconGradientId = "icon-gradient";
  
  // Define the card data with content and specific styling for each card
  const cardData = [
    {
      id: 'new-membership',
      title: 'New Membership',
      description: 'Begin your journey to become an Alcor member. Complete your application in about 5 minutes.',
      buttonText: 'Get Started',
      buttonAction: goToSignup,
      iconPath: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="newMemberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d59560" />
              <stop offset="100%" stopColor="#513a6d" />
            </linearGradient>
          </defs>
          <path stroke="url(#newMemberGradient)" fill="none" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      buttonClasses: 'bg-[#13273f] hover:bg-[#1d3351] text-white',
      cardClasses: 'bg-white border-[#0C2340]/10 hover:border-[#0C2340]/30',
      starClasses: 'text-[#FFCB05]',
      borderColor: 'border-[#13273f]/30'
    },
    {
      id: 'continue-application',
      title: 'Continue Application',
      description: 'Already started the signup process? Sign in to continue where you left off.',
      buttonText: 'Continue Sign Up',
      buttonAction: () => goToLogin(true),
      iconPath: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="continueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d59560" />
              <stop offset="100%" stopColor="#513a6d" />
            </linearGradient>
          </defs>
          <path stroke="url(#continueGradient)" fill="none" d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      buttonClasses: 'bg-[#825f7c] hover:bg-[#936e8c] text-white border border-[#825f7c]',
      cardClasses: 'bg-[#f8f9fa] border-[#FFCB05]/10 hover:border-[#FFCB05]/50',
      starClasses: 'text-[#FFCB05]',
      borderColor: 'border-[#825f7c]/30'
    },
    {
      id: 'member-portal',
      title: 'Member Portal',
      description: 'Access your account, view benefits, manage your profile, and more as an existing member.',
      buttonText: 'Sign In',
      buttonAction: () => goToLogin(false),
      iconPath: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="portalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d59560" />
              <stop offset="100%" stopColor="#513a6d" />
            </linearGradient>
          </defs>
          <path stroke="url(#portalGradient)" fill="none" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      buttonClasses: 'bg-[#404060] hover:bg-[#4e4e73] text-white font-semibold',
      cardClasses: 'bg-white border-[#9194A1]/10 hover:border-[#9194A1]/30',
      starClasses: 'text-[#9194A1]',
      borderColor: 'border-[#404060]/30'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Use the integrated ResponsiveBanner with progress bar hidden */}
      <ResponsiveBanner 
        logo={darkLogo}
        heading="Your Membership"
        subText="We are the world's leader in cryopreservation, research, and technology since 1972"
        showSteps={false}
        showStar={true}
        showProgressBar={false}
        steps={steps}
        isWelcomePage={true} // Use the new prop to enable welcome page styling
      />
      
      {/* Main Content - Cards */}
      <div className="flex-grow px-8 sm:px-12 py-6 md:p-10 flex justify-center">
        <div className="w-full max-w-6xl md:mx-auto">
          {/* Section Title - Mobile Only */}
          <h2 className="text-2xl font-bold text-[#13273f] my-8 text-center md:hidden">
            Select from the following options
          </h2>
          
          {/* Cards in horizontal layout on desktop */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {/* Map through the card data to create each card */}
            {cardData.map((card) => (
              <div 
                key={card.id}
                className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border ${card.cardClasses} flex flex-col h-full transform hover:-translate-y-1 w-11/12 sm:w-9/12 md:w-full mx-auto md:mx-0`}
              >
                {/* Card Header - No gradient bar, just spacing */}
                <div className="h-4"></div>
                
                {/* Card Content */}
                <div className="p-5 sm:p-8 flex-1">
                  <div className={`w-14 sm:w-20 h-14 sm:h-20 rounded-full flex items-center justify-center mb-5 bg-white shadow-sm border ${card.borderColor} mx-auto`}>
                    {card.iconPath}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0C2340] mb-4 flex items-center justify-center">
                    {card.title}
                    <img src={yellowStar} alt="" className="h-7 sm:h-9 ml-2" />
                  </h3>
                  <p className="text-gray-600 mb-6 text-base sm:text-lg text-center">{card.description}</p>
                </div>
                
                {/* Card Footer */}
                <div className="px-4 sm:px-8 pb-8 mt-auto">
                  <button 
                    onClick={card.buttonAction}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-8 rounded-full font-semibold text-base sm:text-lg ${card.buttonClasses} flex items-center justify-center transition-all duration-300 shadow-sm mb-4`}
                  >
                    {card.buttonText}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Star accent at the bottom instead of logo */}
                  <div className="flex justify-center">
                    <div className={`text-center ${card.starClasses}`}>
                      <div className="flex justify-center items-center space-x-2">
                        <img src={yellowStar} alt="Alcor Star" className="h-6 opacity-70" />
                        <img src={yellowStar} alt="Alcor Star" className="h-10 opacity-90" />
                        <img src={yellowStar} alt="Alcor Star" className="h-6 opacity-70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;