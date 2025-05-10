// File: pages/WelcomePage.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import darkLogo from "../assets/images/alcor-placeholder-logo.png";
import { logout } from "../services/auth";

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
    
    // Old approach using React Router
    // navigate('/signup?step=0');
    // console.log("Navigation triggered");
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
    <div className="min-h-screen flex flex-col bg-[#f2f3fe]">
      {/* Header */}
      <header className="bg-[#1a2d50] text-white py-6 px-6 md:px-12">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src={darkLogo} alt="Alcor Logo" className="h-10 w-auto" />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Welcome Header */}
          <div className="bg-[#6f2d74] text-white p-8 md:p-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to Alcor</h1>
            <p className="text-lg md:text-xl opacity-90">Your journey to membership begins here</p>
          </div>
          
          {/* Options */}
          <div className="p-8 md:p-10 space-y-8">
            {/* Option 1: New Signup */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-[#6f2d74]/40 transition-colors">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Sign up for membership</h2>
              <p className="text-gray-600 mb-5">Start your application process to become an Alcor member. The process takes about 5 minutes to complete.</p>
              <button 
                onClick={goToSignup}
                style={{
                  backgroundColor: "#6f2d74",
                  color: "white"
                }}
                className="w-full md:w-auto py-4 px-8 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90"
                id="get-started-button"
              >
                Get Started
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Option 2: Sign in to continue signup (always visible) */}
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-6 hover:border-blue-300 transition-colors">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Continue with membership sign up</h2>
              <p className="text-gray-600 mb-5">Already started the signup process? Sign in to continue where you left off.</p>
              <button 
                onClick={() => goToLogin(true)}
                style={{
                  backgroundColor: "#4a75da",
                  color: "white"
                }}
                className="w-full md:w-auto py-4 px-8 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90"
              >
                Continue Sign Up
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Option 3: Member Login */}
            <div className="border border-gray-200 rounded-xl p-6 hover:border-[#6f2d74]/40 transition-colors">
              <h2 className="text-xl font-bold text-gray-800 mb-3">Already a member, sign in to the Member Portal</h2>
              <p className="text-gray-600 mb-5">Access your Alcor membership account, view your benefits, manage your profile, and more.</p>
              <button 
                onClick={() => goToLogin(false)}
                className="w-full md:w-auto bg-white border border-gray-300 text-gray-700 py-4 px-8 rounded-full font-semibold text-lg flex items-center justify-center hover:bg-gray-50"
              >
                Sign In to Member Portal
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-6 text-center text-gray-600 border-t border-gray-200">
        <div className="container mx-auto">
          <p>© 2025 Alcor. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="text-[#6f2d74] hover:underline">Terms of Use</a>
            <a href="#" className="text-[#6f2d74] hover:underline">Privacy Policy</a>
            <a href="#" className="text-[#6f2d74] hover:underline">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;