import React, { useState, useRef, useEffect } from "react";
import starImage from "../assets/images/alcor-star.png";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/auth";

const Banner = ({ 
  logo, 
  stepText = "Sign up", 
  stepNumber = "1", 
  stepName = "Get Started",
  heading = "Become a member",
  subText = "Sign up process takes on average 5 minutes.",
  currentUser
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle sign out - Updated to properly redirect after sign out
  const handleSignOut = async () => {
    try {
      console.log("Sign out initiated");
      
      // Clear all localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Firebase
      await auth.signOut();
      console.log("Firebase sign out successful");
      
      // Force redirect to welcome page using window.location
      // This ensures complete page refresh and state clearing
      window.location.href = '/';
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Even if there's an error, still try to redirect
      window.location.href = '/';
    }
  };

  // Navigate to summary
  const goToSummary = () => {
    setIsUserMenuOpen(false);
    navigate('/summary');
  };
  
  return (
    <>
      {/* Mobile Banner (compact version) */}
      <div className="bg-[#13263f] text-white px-4 py-2 relative overflow-hidden flex items-center justify-between md:hidden">
        {/* Logo at the left of the banner */}
        <div className="flex items-center">
          <img src={logo} alt="Alcor Logo" className="h-12" />
        </div>
        
        {/* Header text positioned at the top right */}
        <div className="flex items-center gap-4">
          <h1 className="flex items-center">
            <span className="text-xl font-bold">{heading}</span>
            <img src={starImage} alt="" className="h-6 ml-0.5" />
          </h1>
          
          {/* User icon on mobile */}
          {currentUser && (
            <div ref={userMenuRef} className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white w-8 h-8 focus:outline-none transition-all duration-200"
                aria-label="User menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {/* Mobile dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={goToSummary}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Signup Progress
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Banner (original version) - hidden on mobile */}
      <div className="bg-[#13263f] text-white px-6 pt-4 pb-16 md:pb-20 relative overflow-hidden hidden md:block">
        {/* Logo and user icon in the top bar */}
        <div className="flex items-center justify-between mb-8">
          <img src={logo} alt="Alcor Logo" className="h-20 md:h-24" />
          
          {/* User icon on desktop */}
          {currentUser && (
            <div ref={userMenuRef} className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white w-10 h-10 focus:outline-none transition-all duration-200"
                aria-label="User menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              
              {/* Desktop dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <button
                    onClick={goToSummary}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Signup Progress
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Banner content */}
        <div className="text-center">
          <p className="text-lg flex items-center justify-center flex-wrap text-white/70">
            <span>{stepText} → Step {stepNumber}:</span> 
            <span className="flex items-center ml-1">
              <img src={starImage} alt="" className="h-5 mr-1" />
              {stepName}
            </span>
          </p>
          <h1 className="flex items-center justify-center mt-4">
            <span className="text-4xl md:text-5xl font-bold min-w-max">{heading}</span>
            <img src={starImage} alt="" className="h-10 md:h-12 ml-0.5" />
          </h1>
          <p className="text-lg mt-4 text-white/80">
            {subText}
          </p>
        </div>
      </div>
    </>
  );
};

export default Banner;