import React, { useState } from "react";
import darkLogo from "../assets/images/alcor-placeholder-logo.png";
import starImage from "../assets/images/alcor-star.png";
import Banner from "../components/Banner";
import ProgressBar from "../components/CircularProgress";

const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

export default function SignupPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState("initial"); // "initial", "verifying", "verification"
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    termsAccepted: false,
    verificationCode: "",
  });
  
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    termsAccepted: "",
    verificationCode: "",
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };
  
  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (verificationStep === "initial") {
      const newErrors = {
        name: !formData.name.trim() ? "Name is required" : "",
        email: !formData.email.trim() 
          ? "Email is required" 
          : !isValidEmail(formData.email) 
            ? "Please enter a valid email address" 
            : "",
        termsAccepted: !formData.termsAccepted 
          ? "You must accept the Terms of Use and Privacy Policy" 
          : ""
      };
      
      setErrors(newErrors);
      
      if (Object.values(newErrors).some(error => error)) {
        return;
      }
      
      // Show loading state
      setIsSubmitting(true);
      
      // Simulate backend call
      setTimeout(() => {
        setIsSubmitting(false);
        setVerificationStep("verification");
        console.log("Form submitted:", formData);
      }, 1500);
    } else if (verificationStep === "verification") {
      // Validate verification code
      if (!formData.verificationCode.trim()) {
        setErrors({
          ...errors,
          verificationCode: "Verification code is required"
        });
        return;
      }
      
      if (formData.verificationCode.length !== 6) {
        setErrors({
          ...errors,
          verificationCode: "Please enter a valid 6-digit code"
        });
        return;
      }
      
      // Show loading state
      setIsSubmitting(true);
      
      // Simulate verification API call
      setTimeout(() => {
        setIsSubmitting(false);
        // Move to next step
        setActiveStep(1);
        // Reset verification step for future use
        setVerificationStep("initial");
        console.log("Verification successful:", formData.verificationCode);
        // Here you would navigate to next step
      }, 1500);
    }
  };
  
  const resendVerificationCode = () => {
    setIsSubmitting(true);
    
    // Simulate API call to resend code
    setTimeout(() => {
      setIsSubmitting(false);
      console.log("Verification code resent to:", formData.email);
    }, 1500);
  };
  
  const changeEmail = () => {
    setVerificationStep("initial");
  };

  const toggleHelpInfo = () => {
    setShowHelpInfo(!showHelpInfo);
  };

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      <Banner 
        logo={darkLogo}
        stepText="Step"
        stepNumber={activeStep + 1}
        stepName={steps[activeStep]}
        heading="Become a member"
        subText="Sign up process takes on average 5 minutes."
      />

      <ProgressBar steps={steps} activeStep={activeStep} />

      {/* Enhanced mobile spacing with more padding */}
      <div className="flex-1 flex justify-center px-8 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-8 sm:pt-4">
        <form onSubmit={handleSubmit} className="w-full max-w-3xl">
          {verificationStep === "initial" ? (
            <>
              <div className="flex flex-col md:flex-row gap-10 sm:gap-6 mb-10 sm:mb-6 mx-auto max-w-md md:max-w-none">
                <div className="flex-1">
                  <label htmlFor="name" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">Full Name</label>
                  <input 
                    type="text" 
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Smith" 
                    className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.name}</p>}
                </div>
                <div className="flex-1">
                  <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john.smith@example.com" 
                    className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.email}</p>}
                </div>
              </div>
              
              <div className="mb-12 sm:mb-8 mx-auto max-w-md md:max-w-none">
                <label className={`flex items-start ${errors.termsAccepted ? 'text-red-500' : ''}`}>
                  <input 
                    type="checkbox" 
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`mr-4 sm:mr-2 mt-1 h-6 w-6 sm:h-5 sm:w-5 appearance-none checked:bg-[#d39560] border ${errors.termsAccepted ? 'border-red-500' : 'border-brand-purple/30'} bg-brand-purple/5 rounded focus:ring-1 focus:ring-[#d39560]`}
                    style={{ 
                      backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                      backgroundPosition: "center",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat"
                    }}
                  />
                  <span className={`text-${errors.termsAccepted ? 'red-500' : 'gray-700'} text-base sm:text-sm`}>
                    I agree to the <a href="#" className="text-brand-purple">Terms of Use</a> & <a href="#" className="text-brand-purple">Privacy policy</a>.
                  </span>
                </label>
                {errors.termsAccepted && <p className="text-red-500 text-sm mt-3 sm:mt-1 ml-10 sm:ml-7">{errors.termsAccepted}</p>}
              </div>
              
              <div className="mx-auto max-w-md md:max-w-none">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="w-full py-5 sm:py-4 px-6 rounded-full font-semibold text-lg mb-10 sm:mb-4 flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Get Started</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
                
                <div className="flex items-center my-10 sm:my-6">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <div className="px-8 sm:px-4 text-gray-500 uppercase text-sm">OR</div>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <button 
                  type="button"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-5 sm:py-3 px-6 rounded-full font-medium text-lg mb-12 sm:mb-8 flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70"
                >
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
                  Continue with Google
                </button>
              </div>
              
              <div className="text-center mx-auto max-w-md md:max-w-none">
                <p className="text-gray-700">
                  Already an Alcor Member? <a href="#" className="text-brand-purple">Login here</a>
                </p>
              </div>
            </>
          ) : (
            // Verification Code Screen
            <div className="mx-auto max-w-md">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-yellow-50 rounded-full p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify your email</h2>
                <p className="text-gray-600 mb-2">We've sent a verification code to</p>
                <p className="text-gray-800 font-medium mb-4">{formData.email}</p>
                <p className="text-gray-600 text-sm">Please enter the 6-digit code below.</p>
              </div>
              
              <div className="mb-8">
                <label htmlFor="verificationCode" className="block text-gray-800 text-lg font-medium mb-4 sm:mb-2">Verification Code</label>
                <input 
                  type="text" 
                  id="verificationCode"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  placeholder="123456" 
                  maxLength={6}
                  className="w-full px-4 py-5 sm:py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg tracking-wider text-center"
                  disabled={isSubmitting}
                />
                {errors.verificationCode && <p className="text-red-500 text-sm mt-3 sm:mt-1">{errors.verificationCode}</p>}
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: "#6f2d74",
                  color: "white"
                }}
                className="w-full py-5 sm:py-4 px-6 rounded-full font-semibold text-lg mb-6 flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  <>Verify</>
                )}
              </button>
              
              <div className="flex flex-col md:flex-row justify-between items-center text-sm mt-6">
                <button 
                  type="button" 
                  onClick={resendVerificationCode}
                  disabled={isSubmitting}
                  className="text-brand-purple mb-4 md:mb-0 hover:underline disabled:opacity-70"
                >
                  Resend verification code
                </button>
                <button 
                  type="button" 
                  onClick={changeEmail}
                  disabled={isSubmitting}
                  className="text-gray-600 hover:underline disabled:opacity-70"
                >
                  Change email address
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Help icon in the bottom right corner */}
      <div className="fixed bottom-8 md:bottom-10 right-8 md:right-10 z-40">
        <button 
          onClick={toggleHelpInfo}
          className="flex items-center justify-center rounded-full shadow-lg bg-[#9f5fa6] hover:bg-[#8a4191] text-white focus:outline-none transition-all duration-200"
          aria-label="Help"
          style={{ width: '3.75rem', height: '3.75rem', '@media (min-width: 768px)': { width: '5rem', height: '5rem' } }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Help information box */}
      {showHelpInfo && (
        <div className="fixed bottom-24 md:bottom-28 right-8 md:right-10 z-40 w-64 sm:w-80 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-[#9f5fa6] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-medium">Help & Information</h3>
            <button 
              onClick={toggleHelpInfo}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-1">Account Creation</h4>
              <p className="text-gray-600 text-sm">Creating an account allows you to become a member as well as manage membership and contracts.</p>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-1">Email Verification</h4>
              <p className="text-gray-600 text-sm">We'll send a 6-digit code to your email to verify your identity and secure your account.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Need assistance?</h4>
              <p className="text-gray-600 text-sm">Contact our support team at <a href="mailto:support@alcor.com" className="text-brand-purple">support@alcor.com</a> or call (800) 555-1234.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}