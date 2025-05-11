// File: pages/WelcomePage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveBanner from "../components/ResponsiveBanner";
import darkLogo from "../assets/images/alcor-white-logo.png";
import navyAlcorLogo from "../assets/images/navy-alcor-logo.png";
import { logout } from "../services/auth";

// Define the same steps array that's used in SignupPage for consistency
const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

const WelcomePage = () => {
  const navigate = useNavigate();

  // Clear ALL state when the Welcome page loads
  useEffect(() => {
    const clearAllState = async () => {
      try {
        console.log("WelcomePage: Clearing all state");
        // Clear all localStorage items
        localStorage.removeItem('alcor_signup_state');
        localStorage.removeItem('alcor_verification_state');
        localStorage.removeItem('navigation_history');
        localStorage.removeItem('alcor_form_data');
        localStorage.removeItem('emailForSignIn');
        localStorage.removeItem('fresh_signup');
        
        // Sign out user if they're logged in
        try {
          console.log("WelcomePage: Attempting to log out user");
          await logout();
          console.log("User logged out on Welcome page");
        } catch (logoutError) {
          console.error("Logout error (non-critical):", logoutError);
          // Continue anyway - we've cleared the localStorage
        }
        
        console.log("All state cleared on Welcome page load");
      } catch (error) {
        console.error("Error clearing state:", error);
      }
    };
    
    clearAllState();
  }, []);

  // Handle direct navigation to signup or login
  const goToSignup = () => {
    console.log("Get Started button clicked");
    
    // Make sure localStorage is cleared before navigating
    try {
      console.log("Clearing state before signup navigation");
      // Clear all localStorage items related to signup process
      localStorage.removeItem('alcor_signup_state');
      localStorage.removeItem('alcor_verification_state');
      localStorage.removeItem('alcor_form_data');
      localStorage.removeItem('emailForSignIn');
      
      // Add a flag to indicate a fresh start
      localStorage.setItem('fresh_signup', 'true');
      console.log("Set fresh_signup flag to true");
      
      console.log("All state cleared before signup navigation");
    } catch (error) {
      console.error("Error clearing state:", error);
    }
    
    console.log("Navigating to /signup?step=0");
    // Direct navigation using window.location for reliability
    window.location.href = '/signup?step=0';
  };
  
  const goToLogin = (continueSignup = false) => {
    console.log(`Login button clicked, continueSignup=${continueSignup}`);
    if (continueSignup) {
      navigate('/login?continue=signup');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Use the integrated ResponsiveBanner with progress bar hidden */}
      <ResponsiveBanner 
        logo={darkLogo}
        heading="Your Membership Journey"
        subText="We are the world's leader in cryopreservation, research, and technology"
        showSteps={false}
        showStar={true}
        showProgressBar={false}  // Hide the actual progress circles but maintain spacing
        steps={steps}  // Pass the full steps array for consistent structure
        bgClass="bg-gradient-to-r from-[#0C2340] to-[#462a5a]" // Apply gradient directly
      />
      
      {/* Main Content - Cards */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-6xl">
          {/* Cards in horizontal layout on desktop */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {/* Option 1: New Signup */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-[#6f2d74]/30 flex flex-col h-full">
              <div className="p-8 flex-1">
                <div className="w-16 h-16 bg-[#6f2d74]/10 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#6f2d74]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0C2340] mb-4">New Membership</h3>
                <p className="text-gray-600 mb-6 text-lg">Begin your journey to become an Alcor member. Complete your application in about 5 minutes.</p>
              </div>
              <div className="px-8 pb-8">
                <button 
                  onClick={goToSignup}
                  className="w-full py-4 px-8 rounded-full font-semibold text-lg bg-[#6f2d74] text-white flex items-center justify-center hover:bg-[#5f2964] transition-colors shadow-sm mb-6"
                >
                  Get Started
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex justify-center">
                  <img src={navyAlcorLogo} alt="Alcor Logo" className="h-8 w-auto opacity-80" />
                </div>
              </div>
            </div>
            
            {/* Option 2: Continue Signup */}
            <div className="bg-[#eef2ff] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-blue-100 hover:border-blue-200 flex flex-col h-full">
              <div className="p-8 flex-1">
                <div className="w-16 h-16 bg-[#4a75da]/10 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#4a75da]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0C2340] mb-4">Continue Application</h3>
                <p className="text-gray-600 mb-6 text-lg">Already started the signup process? Sign in to continue where you left off.</p>
              </div>
              <div className="px-8 pb-8">
                <button 
                  onClick={() => goToLogin(true)}
                  className="w-full py-4 px-8 rounded-full font-semibold text-lg bg-[#4a75da] text-white flex items-center justify-center hover:bg-[#3e64c8] transition-colors shadow-sm mb-6"
                >
                  Continue Sign Up
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex justify-center">
                  <img src={navyAlcorLogo} alt="Alcor Logo" className="h-8 w-auto opacity-80" />
                </div>
              </div>
            </div>
            
            {/* Option 3: Member Login */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 hover:border-[#0C2340]/30 flex flex-col h-full">
              <div className="p-8 flex-1">
                <div className="w-16 h-16 bg-[#0C2340]/10 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#0C2340]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#0C2340] mb-4">Member Portal</h3>
                <p className="text-gray-600 mb-6 text-lg">Access your account, view benefits, manage your profile, and more as an existing member.</p>
              </div>
              <div className="px-8 pb-8">
                <button 
                  onClick={() => goToLogin(false)}
                  className="w-full py-4 px-8 rounded-full font-semibold text-lg bg-white border border-gray-300 text-[#0C2340] flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm mb-6"
                >
                  Sign In
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex justify-center">
                  <img src={navyAlcorLogo} alt="Alcor Logo" className="h-8 w-auto opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;