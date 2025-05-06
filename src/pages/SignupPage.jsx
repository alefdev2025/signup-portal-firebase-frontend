import React, { useState } from "react";
import darkLogo from "../assets/images/alcor-placeholder-logo.png";
import Banner from "../components/Banner";
import ProgressBar from "../components/CircularProgress";

const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];

export default function SignupPage() {
  const activeStep = 0;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    termsAccepted: false
  });
  
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    termsAccepted: ""
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
    
    console.log("Form submitted:", formData);
  };

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col">
      <Banner 
        logo={darkLogo}
        stepText="Step"
        stepNumber="1"
        stepName="Account"
        heading="Become a member"
        subText="Sign up process takes on average 5 minutes."
      />

      <ProgressBar steps={steps} activeStep={activeStep} />

      <div className="flex-1 flex justify-center px-8 sm:px-10 md:px-12 pb-12">
        <form onSubmit={handleSubmit} className="w-full max-w-3xl">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <label htmlFor="name" className="block text-gray-800 text-lg font-medium mb-2">Full Name</label>
              <input 
                type="text" 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Smith" 
                className="w-full px-4 py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div className="flex-1">
              <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-4 py-4 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-lg"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>
          
          <div className="mb-8">
            <label className={`flex items-start ${errors.termsAccepted ? 'text-red-500' : ''}`}>
              <input 
                type="checkbox" 
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className={`mr-2 mt-1 h-5 w-5 appearance-none checked:bg-[#d39560] border ${errors.termsAccepted ? 'border-red-500' : 'border-brand-purple/30'} bg-brand-purple/5 rounded focus:ring-1 focus:ring-[#d39560]`}
                style={{ 
                  backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                  backgroundPosition: "center",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat"
                }}
              />
              <span className={`text-${errors.termsAccepted ? 'red-500' : 'gray-700'}`}>
                I agree to the <a href="#" className="text-brand-purple">Terms of Use</a> & <a href="#" className="text-brand-purple">Privacy policy</a>.
              </span>
            </label>
            {errors.termsAccepted && <p className="text-red-500 text-sm mt-1 ml-7">{errors.termsAccepted}</p>}
          </div>
          
          <button 
            type="submit"
            style={{
              backgroundColor: "#6f2d74",
              color: "white"
            }}
            className="w-full py-4 px-6 rounded-full font-semibold text-lg mb-4 flex items-center justify-center hover:opacity-90"
          >
            <span className="mr-2">Get Started</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          
          <button 
            type="button"
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-lg mb-8 flex items-center justify-center hover:bg-gray-50 shadow-sm"
          >
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
            Continue with Google
          </button>
          
          <div className="text-center">
            <p className="text-gray-700">
              Already an Alcor Member? <a href="#" className="text-brand-purple">Login here</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}