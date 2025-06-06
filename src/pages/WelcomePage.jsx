// File: pages/WelcomePage.jsx - Smaller text and boxes
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveBanner from "../components/ResponsiveBanner";
import darkLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
import whiteStar from "../assets/images/alcor-star.png";

// Import from auth service
import { logout } from "../services/auth";

// Define the same steps array that's used in SignupPage for consistency
const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

// Font family to match Package Pages
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const WelcomePage = () => {
 const navigate = useNavigate();

 // Clear ALL state when the Welcome page loads - ALWAYS log out
 useEffect(() => {
   const clearAllState = async () => {
     console.log("Clearing all state on WelcomePage mount - ALWAYS logging out");

     try {
       // Clear all localStorage items
       localStorage.removeItem('alcor_signup_state');
       localStorage.removeItem('alcor_verification_state');
       localStorage.removeItem('navigation_history');
       localStorage.removeItem('alcor_form_data');
       localStorage.removeItem('emailForSignIn');
       localStorage.removeItem('fresh_signup');
       
       // Clear account creation flags
       localStorage.removeItem('account_creation_success');
       localStorage.removeItem('force_active_step');
       localStorage.removeItem('force_timestamp');
       
       // Clear verification flags
       localStorage.removeItem('just_verified');
       localStorage.removeItem('verification_timestamp');
       
       // Clear any other stray flags
       localStorage.removeItem('has_navigated');
       localStorage.removeItem('block_navigation');
       
       // Clear session storage
       sessionStorage.clear();
       
       // ALWAYS sign out user - wait for completion
       try {
         await logout();
         console.log("User logged out successfully");
         
         // FORCE clear ALL Firebase and app state
         localStorage.clear();
         sessionStorage.clear();
         
         // Wait for Firebase to fully clear
         await new Promise(resolve => setTimeout(resolve, 300));
         
       } catch (logoutError) {
         console.error("Logout error (non-critical):", logoutError);
         // Still clear storage even if logout fails
         localStorage.clear();
         sessionStorage.clear();
       }
       
       console.log("Logout process complete");
       
     } catch (error) {
       console.error("Error clearing state:", error);
     }
   };
   
   clearAllState();
 }, []);

 // SIMPLIFIED: Use React Router navigation for clean signup start
 const goToSignup = async () => {
   console.log("Get Started button clicked, navigating to signup");
   
   // FORCE logout before going to signup
   try {
     await logout();
     console.log("Force logout before signup navigation");
     localStorage.clear();
     sessionStorage.clear();
     
     // Wait a bit to ensure logout completes
     await new Promise(resolve => setTimeout(resolve, 500));
   } catch (error) {
     console.log("Logout error before navigation:", error);
   }
   
   // Add a flag to indicate a fresh start
   localStorage.setItem('fresh_signup', 'true');
   
   // Navigate to signup
   navigate('/signup');
 };
 
 const goToLogin = async (continueSignup = false) => {
   console.log(`Login button clicked, continueSignup=${continueSignup}`);
   
   // FORCE logout before going to login page
   try {
     await logout();
     console.log("Force logout before login navigation");
     localStorage.clear();
     sessionStorage.clear();
     
     // Wait a bit to ensure logout completes
     await new Promise(resolve => setTimeout(resolve, 500));
   } catch (error) {
     console.log("Logout error before navigation:", error);
   }
   
   if (continueSignup) {
     navigate('/login?continue=signup');
   } else {
     navigate('/login');
   }
 };

 // Card data with smaller sizes
 const cardData = [
   {
     id: 'new-membership',
     title: 'New Membership',
     description: 'Begin your journey to become an Alcor member. Complete your application in about 5 minutes.',
     buttonText: 'Get Started',
     buttonAction: goToSignup,
     iconPath: (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
   <div className="min-h-screen bg-gray-100 flex flex-col" style={{ fontFamily: SYSTEM_FONT }}>
     {/* Use the integrated ResponsiveBanner with progress bar hidden */}
     <ResponsiveBanner 
       logo={darkLogo}
       heading="Your Membership"
       subText="We are the world's leader in cryopreservation, research, and technology since 1972"
       showSteps={false}
       showStar={true}
       showProgressBar={false}
       steps={steps}
       isWelcomePage={true}
     />
     
     {/* Main Content - Cards with smaller sizing */}
     <div className="flex-grow px-6 sm:px-8 py-12 md:py-16 flex justify-center">
       <div className="w-full max-w-5xl md:mx-auto">
         {/* Cards in horizontal layout on desktop with smaller spacing */}
         <div className="grid md:grid-cols-3 gap-6 md:gap-8">
           {cardData.map((card) => (
             <div 
               key={card.id}
               className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border ${card.cardClasses} flex flex-col h-full transform hover:-translate-y-1 w-11/12 sm:w-9/12 md:w-full mx-auto md:mx-0`}
             >
               <div className="h-3"></div>
               
               <div className="p-4 sm:p-6 flex-1">
                 <div className={`w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mb-4 bg-white shadow-sm border ${card.borderColor} mx-auto`}>
                   {card.iconPath}
                 </div>
                 <h3 className="text-lg sm:text-xl font-bold text-[#0C2340] mb-3 flex items-center justify-center">
                   {card.title}
                 </h3>
                 <p className="text-gray-500 mb-5 text-sm sm:text-base text-center leading-relaxed font-light">{card.description}</p>
               </div>
               
               <div className="px-4 sm:px-6 pb-6 mt-auto">
                 <button 
                   onClick={card.buttonAction}
                   className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-full font-semibold text-sm sm:text-base ${card.buttonClasses} flex items-center justify-center transition-all duration-300 shadow-sm mb-3`}
                 >
                   <img src={whiteStar} alt="" className="h-4 w-4 mr-2" />
                   {card.buttonText}
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                   </svg>
                 </button>
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