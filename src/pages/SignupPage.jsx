import React from "react";
// Import the logo from assets
import darkLogo from "../assets/images/alcor-placeholder-logo.png";
// Import components
import Banner from "../components/Banner";
import ProgressBar from "../components/ProgressBar";

const steps = ["Sign up", "Contact Info", "Method", "Funding", "Membership"];

export default function SignupPage() {
  // Set first step as active
  const activeStep = 0;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Banner Component */}
      <Banner 
        logo={darkLogo}
        stepText="Sign up"
        stepNumber="1"
        stepName="Get Started"
        heading="Become a member"
        subText="Sign up process takes on average 5 minutes."
      />

      {/* Progress Bar Component */}
      <ProgressBar steps={steps} activeStep={activeStep} />

      {/* Signup Form */}
      <div className="flex-1 flex justify-center px-4 pb-12">
        <div className="w-full max-w-3xl">
          {/* Name and Email fields on the same row with purple styling */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <label htmlFor="name" className="block text-gray-800 text-lg font-medium mb-2">Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="e.g. John Smith" 
                className="w-full px-4 py-3 bg-brand-purple/5 border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
              <input 
                type="email" 
                id="email" 
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-4 py-3 bg-brand-purple/5 border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50"
              />
            </div>
          </div>
          
          {/* Terms and conditions checkbox */}
          <div className="mb-8">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-2 h-5 w-5 appearance-none checked:bg-[#d39560] border border-brand-purple/30 bg-brand-purple/5 rounded focus:ring-1 focus:ring-[#d39560]"
                style={{ 
                  backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                  backgroundPosition: "center",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat"
                }}
              />
              <span className="text-gray-700">
                I agree to the <a href="#" className="text-brand-purple">Terms of Use</a> & <a href="#" className="text-brand-purple">Privacy policy</a>.
              </span>
            </label>
          </div>
          
          {/* Sign up button - using brand purple with rounded corners */}
          <button className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white py-4 px-6 rounded-full font-semibold text-lg mb-4 flex items-center justify-center">
            <span className="mr-2">Get Started</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* OR divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          {/* Google sign in button - properly styled */}
          <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-lg mb-8 flex items-center justify-center hover:bg-gray-50 shadow-sm">
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
            Continue with Google
          </button>
          
          {/* Already a member */}
          <div className="text-center">
            <p className="text-gray-700">
              Already an Alcor Member? <a href="#" className="text-brand-purple">Login here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}