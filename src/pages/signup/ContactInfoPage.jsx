import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { updateSignupProgress } from "../../services/auth";
import { saveContactInfo } from "../../services/auth";
import { getStepFormData, saveFormData } from "../../contexts/UserContext";

// Environment flag - true for development, false for production
const isDevelopment = import.meta.env.MODE === 'development';

// Feature flag for enabling country-specific form localization
const ENABLE_LOCALIZATION = import.meta.env.VITE_ENABLE_LOCALIZATION === 'true';

// Country-specific form configurations (only used if ENABLE_LOCALIZATION is true)
const countryConfigs = {
  "United States": {
    postalCodeLabel: "ZIP Code",
    postalCodePlaceholder: "10001",
    postalCodePattern: "^\\d{5}(-\\d{4})?$",
    postalCodeError: "Please enter a valid ZIP code (e.g. 12345 or 12345-6789)",
    regionLabel: "State",
    regionType: "input"
  },
  "Canada": {
    postalCodeLabel: "Postal Code",
    postalCodePlaceholder: "A1A 1A1",
    postalCodePattern: "^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$",
    postalCodeError: "Please enter a valid postal code (e.g. A1A 1A1)",
    regionLabel: "Province",
    regionType: "input"
  },
  "United Kingdom": {
    postalCodeLabel: "Postcode",
    postalCodePlaceholder: "SW1A 1AA",
    postalCodePattern: "^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$",
    postalCodeError: "Please enter a valid UK postcode",
    regionLabel: "County",
    regionType: "input"
  },
  "Germany": {
    postalCodeLabel: "PLZ",
    postalCodePlaceholder: "10115",
    postalCodePattern: "^\\d{5}$",
    postalCodeError: "Please enter a valid PLZ (e.g. 10115)",
    regionLabel: "Bundesland",
    regionType: "input"
  },
  "France": {
    postalCodeLabel: "Code Postal",
    postalCodePlaceholder: "75001",
    postalCodePattern: "^\\d{5}$",
    postalCodeError: "Please enter a valid code postal (e.g. 75001)",
    regionLabel: "Région",
    regionType: "input"
  },
  "Australia": {
    postalCodeLabel: "Postcode",
    postalCodePlaceholder: "2000",
    postalCodePattern: "^\\d{4}$",
    postalCodeError: "Please enter a valid postcode (4 digits)",
    regionLabel: "State",
    regionType: "input"
  }
};

// Default configuration used when localization is disabled or for countries not specifically defined
const defaultConfig = {
  postalCodeLabel: "Zip/Postal Code",
  postalCodePlaceholder: "Enter postal code",
  postalCodePattern: "^.+$", // Accept any non-empty value
  postalCodeError: "Postal code is required",
  regionLabel: "State/Province",
  regionType: "input"
};

// Country list
const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Switzerland",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico"
].sort();

export default function ContactInfoPage({ onNext, onBack, initialData }) {
  const { currentUser, signupState } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    sex: "",
    dateOfBirth: "",
    verifyDateOfBirth: "",
    streetAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "United States",
    sameMailingAddress: "",
    email: "",
    phoneType: "",
    mobilePhone: "",
    workPhone: "",
    homePhone: ""
  });
  
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    sex: "",
    dateOfBirth: "",
    verifyDateOfBirth: "",
    streetAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    sameMailingAddress: "",
    email: "",
    phoneType: "",
    mobilePhone: "",
    workPhone: "",
    homePhone: ""
  });

  // Current country configuration - use default config if localization is disabled
  const [countryConfig, setCountryConfig] = useState(
    ENABLE_LOCALIZATION ? (countryConfigs["United States"] || defaultConfig) : defaultConfig
  );

  // Auto-save form data when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save form data to localStorage before leaving the page
      saveFormData('contact_info', formData);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Also save when component unmounts
      saveFormData('contact_info', formData);
    };
  }, [formData]);
  
  // Update country config when country changes (only if localization is enabled)
  useEffect(() => {
    if (ENABLE_LOCALIZATION) {
      setCountryConfig(countryConfigs[formData.country] || defaultConfig);
    }
  }, [formData.country]);
  
  // Load existing data if available - prioritize in this order:
  // 1. Passed initialData prop
  // 2. Data from localStorage
  // 3. Data from signupState
  useEffect(() => {
    // First, check for passed initialData prop
    if (initialData && Object.keys(initialData).length > 0) {
      if (isDevelopment) {
        console.log("Loading data from initialData prop:", initialData);
      }
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    } 
    // Then check localStorage
    else {
      const savedData = getStepFormData('contact_info');
      if (savedData && Object.keys(savedData).length > 0) {
        if (isDevelopment) {
          console.log("Loading data from localStorage:", savedData);
        }
        setFormData(prev => ({
          ...prev,
          ...savedData
        }));
      }
      // Finally check signupState
      else if (signupState && signupState.contactInfo) {
        if (isDevelopment) {
          console.log("Loading data from signupState:", signupState.contactInfo);
        }
        setFormData(prev => ({
          ...prev,
          ...signupState.contactInfo
        }));
      }
    }
    
    // If user is already logged in, ensure email is filled
    if (currentUser && currentUser.email) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email
      }));
    }
  }, [currentUser, signupState, initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear the specific error when user makes changes
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    // Special handling for date of birth verification
    if (name === 'dateOfBirth') {
      // Clear verifyDateOfBirth error if it exists and the dates now match
      if (formData.verifyDateOfBirth && formData.verifyDateOfBirth === value) {
        setErrors(prev => ({
          ...prev,
          verifyDateOfBirth: ""
        }));
      }
    }
    
    if (name === 'verifyDateOfBirth') {
      // Clear verifyDateOfBirth error if the dates now match
      if (formData.dateOfBirth && formData.dateOfBirth === value) {
        setErrors(prev => ({
          ...prev,
          verifyDateOfBirth: ""
        }));
      }
    }
    
    // Auto-save form data as user types (optional, could be throttled for performance)
    // saveFormData('contact_info', {...formData, [name]: value});
  };
  
  const validatePhoneNumber = (phone) => {
    // Basic international phone number validation
    return !phone || (phone.length >= 7 && /^[+\d\s()-]+$/.test(phone));
  };
  
  const validateEmail = (email) => {
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  
  const validatePostalCode = (postalCode) => {
    // Use country-specific pattern for validation
    const pattern = new RegExp(countryConfig.postalCodePattern);
    return pattern.test(postalCode);
  };
  
  const validateDateOfBirth = (dob) => {
    // Basic date validation and age check (must be at least 18 years old)
    if (!dob) return false;
    
    const dobDate = new Date(dob);
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    
    return dobDate instanceof Date && !isNaN(dobDate) && dobDate <= eighteenYearsAgo;
  };
  
  const validateDatesMatch = (date1, date2) => {
    // Verify that the two dates match
    return date1 === date2;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Form validation
    const newErrors = {
      firstName: !formData.firstName.trim() ? "First name is required" : "",
      lastName: !formData.lastName.trim() ? "Last name is required" : "",
      sex: !formData.sex ? "Sex is required" : "",
      dateOfBirth: !formData.dateOfBirth 
        ? "Date of birth is required" 
        : !validateDateOfBirth(formData.dateOfBirth)
          ? "You must be at least 18 years old"
          : "",
      verifyDateOfBirth: !formData.verifyDateOfBirth 
        ? "Please verify your date of birth"
        : !validateDatesMatch(formData.dateOfBirth, formData.verifyDateOfBirth)
          ? "Dates do not match"
          : "",
      streetAddress: !formData.streetAddress.trim() ? "Street address is required" : "",
      city: !formData.city.trim() ? "City is required" : "",
      region: !formData.region.trim() ? `${countryConfig.regionLabel} is required` : "",
      postalCode: !formData.postalCode.trim() 
        ? `${countryConfig.postalCodeLabel} is required` 
        : !validatePostalCode(formData.postalCode)
          ? countryConfig.postalCodeError
          : "",
      country: !formData.country ? "Country is required" : "",
      sameMailingAddress: !formData.sameMailingAddress ? "Please select Yes or No" : "",
      email: !formData.email.trim() 
        ? "Email is required" 
        : !validateEmail(formData.email)
          ? "Please enter a valid email address"
          : "",
      phoneType: !formData.phoneType ? "Please select a phone type" : "",
      mobilePhone: formData.phoneType === "Mobile" && !formData.mobilePhone.trim()
        ? "Mobile phone is required"
        : formData.mobilePhone.trim() && !validatePhoneNumber(formData.mobilePhone)
          ? "Please enter a valid mobile phone number"
          : "",
      workPhone: formData.phoneType === "Work" && !formData.workPhone.trim()
        ? "Work phone is required" 
        : formData.workPhone.trim() && !validatePhoneNumber(formData.workPhone)
          ? "Please enter a valid work phone number"
          : "",
      homePhone: formData.phoneType === "Home" && !formData.homePhone.trim()
        ? "Home phone is required"
        : formData.homePhone.trim() && !validatePhoneNumber(formData.homePhone)
          ? "Please enter a valid home phone number"
          : ""
    };
    
    setErrors(newErrors);
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      // Scroll to the first error
      const firstErrorField = Object.keys(newErrors).find(key => newErrors[key] !== "");
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isDevelopment) {
        console.log("About to send contact data:", JSON.stringify(formData));
      }
      
      // Save to localStorage regardless of API call success
      saveFormData('contact_info', formData);
      
      // Try to update via Firebase function
      try {
        // Save the contact information directly to Firestore
        const success = await saveContactInfo(formData);
        
        if (success) {
          if (isDevelopment) {
            console.log("Contact information saved successfully");
          }
          
          // Move to next step
          if (onNext) {
            onNext(formData);
          }
        } else {
          // Show error message
          alert("Failed to save contact information. Please try again.");
          setIsSubmitting(false);
        }
      } catch (error) {
        if (isDevelopment) {
          console.error('Error saving contact info:', error);
        }
        alert("Failed to save contact information. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('Error updating contact info:', error);
      }
      alert("Failed to save contact information. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Handler for back button that saves data before going back
  const handleBack = () => {
    // Save current form data before going back
    saveFormData('contact_info', formData);
    
    // Then navigate back
    if (onBack) {
      onBack();
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Membership Application</h2>
      <p className="text-gray-600 mb-8">
        <strong>INSTRUCTIONS:</strong> The following information is necessary for your Alcor Member File. Please answer all questions completely and accurately.
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Name</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">First Name *</label>
              <input 
                type="text" 
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">Last Name *</label>
              <input 
                type="text" 
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="sex" className="block text-gray-700 font-medium mb-2">Sex *</label>
            <select
              id="sex"
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            >
              <option value="">--None--</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
          </div>
        </div>
        
        {/* Date of Birth Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Date of Birth</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="dateOfBirth" className="block text-gray-700 font-medium mb-2">Date of Birth *</label>
              <input 
                type="date" 
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              <span className="text-gray-500 text-sm">Format: Dec 31, 2024</span>
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>
            
            <div>
              <label htmlFor="verifyDateOfBirth" className="block text-gray-700 font-medium mb-2">Verify Date of Birth *</label>
              <input 
                type="date" 
                id="verifyDateOfBirth"
                name="verifyDateOfBirth"
                value={formData.verifyDateOfBirth}
                onChange={handleChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              <span className="text-gray-500 text-sm">Format: Dec 31, 2024</span>
              {errors.verifyDateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.verifyDateOfBirth}</p>}
            </div>
          </div>
        </div>
        
        {/* Home Address Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Home Address</h3>
          
          <div className="mb-6">
            <label htmlFor="streetAddress" className="block text-gray-700 font-medium mb-2">Home Address - Street *</label>
            <input 
              type="text" 
              id="streetAddress"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            />
            {errors.streetAddress && <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="city" className="block text-gray-700 font-medium mb-2">Home Address - City *</label>
              <input 
                type="text" 
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            
            <div>
              <label htmlFor="region" className="block text-gray-700 font-medium mb-2">Home Address - {countryConfig.regionLabel} *</label>
              <input 
                type="text" 
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange} 
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="postalCode" className="block text-gray-700 font-medium mb-2">Home Address - {countryConfig.postalCodeLabel} *</label>
              <input 
                type="text" 
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder={countryConfig.postalCodePlaceholder} 
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              />
              {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
            </div>
            
            <div>
              <label htmlFor="country" className="block text-gray-700 font-medium mb-2">Home Address - Country *</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
                disabled={isSubmitting}
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="sameMailingAddress" className="block text-gray-700 font-medium mb-2">Same Mailing Address *</label>
            <select
              id="sameMailingAddress"
              name="sameMailingAddress"
              value={formData.sameMailingAddress}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            >
              <option value="">--None--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.sameMailingAddress && <p className="text-red-500 text-sm mt-1">{errors.sameMailingAddress}</p>}
          </div>
        </div>
        
        {/* Contact Information Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
          
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email *</label>
            <input 
              type="email" 
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting || (currentUser && currentUser.email)}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="phoneType" className="block text-gray-700 font-medium mb-2">Preferred Phone Number *</label>
            <select
              id="phoneType"
              name="phoneType"
              value={formData.phoneType}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            >
              <option value="">--None--</option>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Mobile">Mobile</option>
            </select>
            {errors.phoneType && <p className="text-red-500 text-sm mt-1">{errors.phoneType}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="mobilePhone" className="block text-gray-700 font-medium mb-2">Mobile Phone {formData.phoneType === "Mobile" && "*"}</label>
            <input 
              type="tel" 
              id="mobilePhone"
              name="mobilePhone"
              value={formData.mobilePhone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            />
            {errors.mobilePhone && <p className="text-red-500 text-sm mt-1">{errors.mobilePhone}</p>}
          </div>
          
          <div className="mb-6">
            <label htmlFor="workPhone" className="block text-gray-700 font-medium mb-2">Work Phone {formData.phoneType === "Work" && "*"}</label>
            <input 
              type="tel" 
              id="workPhone"
              name="workPhone"
              value={formData.workPhone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            />
            {errors.workPhone && <p className="text-red-500 text-sm mt-1">{errors.workPhone}</p>}
          </div>
          
          <div>
            <label htmlFor="homePhone" className="block text-gray-700 font-medium mb-2">Home Phone {formData.phoneType === "Home" && "*"}</label>
            <input 
              type="tel" 
              id="homePhone"
              name="homePhone"
              value={formData.homePhone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-brand-purple/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-700"
              disabled={isSubmitting}
            />
            {errors.homePhone && <p className="text-red-500 text-sm mt-1">{errors.homePhone}</p>}
          </div>
        </div>
        
        <div className="flex justify-between mt-10">
          <button
            type="button"
            onClick={handleBack} // Use custom handler to save data
            className="py-4 px-8 border border-gray-300 rounded-full text-gray-600 font-medium flex items-center hover:bg-gray-50"
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <button 
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: "#6f2d74",
              color: "white"
            }}
            className="py-4 px-8 rounded-full font-semibold text-lg flex items-center hover:opacity-90 disabled:opacity-70"
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
                Continue
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}