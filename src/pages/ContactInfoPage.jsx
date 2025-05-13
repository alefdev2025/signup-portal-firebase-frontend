// File: pages/ContactInfoPage.jsx
import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { updateSignupProgress } from "../services/auth";
import { saveContactInfo } from "../services/auth";
import { getStepFormData, saveFormData } from "../contexts/UserContext";
import { useNavigate } from 'react-router-dom';
import AddressAutocomplete from "../components/AddressAutocomplete";
import HelpPanel from "../components/signup/HelpPanel";

// Custom styles for input labels
const LabelWithIcon = ({ label, required = false }) => (
  <div className="mb-1">
    <span className="block text-gray-800 text-lg font-medium mb-2">{label} {required && '*'}</span>
  </div>
);

// Feature flag for enabling country-specific form localization
const ENABLE_LOCALIZATION = import.meta.env.VITE_ENABLE_LOCALIZATION === 'true';

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

// Country-specific form configurations
const countryConfigs = {
  "United States": {
    postalCodeLabel: "Zip Code",
    regionLabel: "State",
  },
  "Canada": {
    postalCodeLabel: "Postal Code",
    regionLabel: "Province",
  },
  "United Kingdom": {
    postalCodeLabel: "Postcode",
    regionLabel: "County",
  },
  // Add more as needed...
};

// Default configuration
const defaultConfig = {
  postalCodeLabel: "Postal/Zip Code",
  regionLabel: "State/Province",
};

export default function ContactInfoPage({ onNext, onBack, initialData }) {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  
  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };
  
  // Define page-specific help content
  const contactInfoHelpContent = [
    {
      title: "Personal Information",
      content: "Please provide accurate personal details. This information will be used for your member file and communications."
    },
    {
      title: "Address Information",
      content: "Your residential address is required. If you receive mail at a different location, select 'No' for 'Same Mailing Address' and provide your mailing address."
    },
    {
      title: "Phone Numbers",
      content: "Please provide at least one phone number where we can reach you. Select your preferred contact method in the dropdown."
    },
    {
      title: "Need assistance?",
      content: (
        <>
          Contact our support team at <a href="mailto:support@alcor.com" className="text-[#775684] hover:underline">support@alcor.com</a> or call (800) 555-1234.
        </>
      )
    }
  ];
  
  // Debug: Check if API key is available
  useEffect(() => {
    console.log("API Key Available:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Yes" : "No");
    console.log("API Key first 5 chars:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 5) + "...");
    
    // Add custom styles to ensure consistent input backgrounds
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = `
      /* Override styles for form inputs */
      input, select, textarea {
        background-color: #FFFFFF !important;
        font-size: 1.125rem !important;
        height: 3.5rem !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        border-radius: 0.375rem !important;
        border-color: rgba(119, 86, 132, 0.3) !important;
        box-sizing: border-box !important;
        display: block !important;
        width: 100% !important;
      }
      
      input:focus, select:focus, textarea:focus {
        background-color: #FFFFFF !important;
        --tw-ring-color: rgba(119, 86, 132, 0.5) !important;
        --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color) !important;
        --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color) !important;
        box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000) !important;
        outline: 2px solid transparent !important;
        outline-offset: 2px !important;
        border-color: rgba(119, 86, 132, 0.5) !important;
      }
      
      /* Prevent blue backgrounds on autofill */
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus,
      select:-webkit-autofill,
      select:-webkit-autofill:hover,
      select:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0px 1000px white inset !important;
        transition: background-color 5000s ease-in-out 0s;
      }
      
      /* Force consistent height for date inputs */
      input[type="date"] {
        height: 3.5rem !important;
        line-height: 3.5rem !important;
      }
      
      /* Style label text */
      label, .form-label {
        color: #1a202c !important; 
        font-size: 1.125rem !important;
        font-weight: 500 !important;
        margin-bottom: 0.5rem !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    sex: "",
    dateOfBirth: "",
    streetAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "United States",
    sameMailingAddress: "",
    mailingStreetAddress: "",
    mailingCity: "",
    mailingRegion: "",
    mailingPostalCode: "",
    mailingCountry: "United States",
    email: "",
    phoneType: "",
    mobilePhone: "",
    workPhone: "",
    homePhone: "",
    memberDisclosure: "",
    applyCryopreservation: ""
  });
  
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    sex: "",
    dateOfBirth: "",
    streetAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    sameMailingAddress: "",
    mailingStreetAddress: "",
    mailingCity: "",
    mailingRegion: "",
    mailingPostalCode: "",
    mailingCountry: "",
    email: "",
    phoneType: "",
    mobilePhone: "",
    workPhone: "",
    homePhone: "",
    memberDisclosure: "",
    applyCryopreservation: ""
  });

  // Country configuration
  const [countryConfig, setCountryConfig] = useState(
    ENABLE_LOCALIZATION ? (countryConfigs["United States"] || defaultConfig) : defaultConfig
  );
  
  // Mailing country configuration
  const [mailingCountryConfig, setMailingCountryConfig] = useState(
    ENABLE_LOCALIZATION ? (countryConfigs["United States"] || defaultConfig) : defaultConfig
  );

  // Show/hide mailing address section based on "Same Mailing Address" selection
  const showMailingAddress = formData.sameMailingAddress === "No";

  // Load saved form data if available
  useEffect(() => {
    const savedData = getStepFormData('contact_info');
    if (savedData) {
      setFormData(prev => ({
        ...prev,
        ...savedData
      }));
    } else if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }

    // If user is authenticated, pull email from their account
    if (currentUser && currentUser.email) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email
      }));
    }
  }, [currentUser, initialData]);

  // Update country configuration when country changes
  useEffect(() => {
    if (ENABLE_LOCALIZATION) {
      setCountryConfig(countryConfigs[formData.country] || defaultConfig);
    }
  }, [formData.country]);

  // Update mailing country configuration when mailing country changes
  useEffect(() => {
    if (ENABLE_LOCALIZATION) {
      setMailingCountryConfig(countryConfigs[formData.mailingCountry] || defaultConfig);
    }
  }, [formData.mailingCountry]);

  // Auto-save form data when leaving the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveFormData('contact_info', formData);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveFormData('contact_info', formData);
    };
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear the specific error when user makes changes
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    // Special handling for same mailing address
    if (name === 'sameMailingAddress' && value === "Yes") {
      setFormData(prev => ({
        ...prev,
        mailingStreetAddress: prev.streetAddress,
        mailingCity: prev.city,
        mailingRegion: prev.region,
        mailingPostalCode: prev.postalCode,
        mailingCountry: prev.country
      }));
    }
  };
  
  // Handler for address selection from autocomplete
  const handleAddressSelect = (addressData) => {
    setFormData(prev => ({
      ...prev,
      streetAddress: addressData.streetAddress || addressData.formattedAddress,
      city: addressData.city || "",
      region: addressData.region || "",
      postalCode: addressData.postalCode || "",
      country: addressData.country || "United States"
    }));
    
    // Clear any address-related errors
    setErrors(prev => ({
      ...prev,
      streetAddress: "",
      city: "",
      region: "",
      postalCode: "",
      country: ""
    }));
  };
  
  // Handler for mailing address selection from autocomplete
  const handleMailingAddressSelect = (addressData) => {
    setFormData(prev => ({
      ...prev,
      mailingStreetAddress: addressData.streetAddress || addressData.formattedAddress,
      mailingCity: addressData.city || "",
      mailingRegion: addressData.region || "",
      mailingPostalCode: addressData.postalCode || "",
      mailingCountry: addressData.country || "United States"
    }));
    
    // Clear any mailing address-related errors
    setErrors(prev => ({
      ...prev,
      mailingStreetAddress: "",
      mailingCity: "",
      mailingRegion: "",
      mailingPostalCode: "",
      mailingCountry: ""
    }));
  };
  
  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    const requiredFields = [
      'firstName', 'lastName', 'sex', 'dateOfBirth', 
      'streetAddress', 'city', 'region', 'postalCode', 'country',
      'sameMailingAddress', 'email', 'phoneType'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `This field is required`;
      }
    });
    
    // Phone number validation based on phone type
    if (formData.phoneType === 'Mobile' && !formData.mobilePhone) {
      newErrors.mobilePhone = 'Mobile phone is required';
    } else if (formData.phoneType === 'Work' && !formData.workPhone) {
      newErrors.workPhone = 'Work phone is required';
    } else if (formData.phoneType === 'Home' && !formData.homePhone) {
      newErrors.homePhone = 'Home phone is required';
    }
    
    // Mailing address validation if not same as home address
    if (formData.sameMailingAddress === 'No') {
      const mailingFields = [
        'mailingStreetAddress', 'mailingCity', 'mailingRegion', 
        'mailingPostalCode', 'mailingCountry'
      ];
      
      mailingFields.forEach(field => {
        if (!formData[field]) {
          newErrors[field] = `This field is required`;
        }
      });
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // API call to save data
      const success = await saveContactInfo(formData);
      
      if (success) {
        // Move to next step
        if (onNext) {
          onNext(formData);
        }
      } else {
        alert("Failed to save contact information. Please try again.");
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert("Failed to save contact information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for back button
  const handleBack = () => {
    // Save form data first
    saveFormData('contact_info', formData);
    
    console.log("ContactInfoPage: Handle back button clicked");
    
    // Use the more reliable force navigation method
    localStorage.setItem('force_active_step', '0'); // Force to step 0
    localStorage.setItem('force_timestamp', Date.now().toString());
    
    // Use setTimeout to ensure this happens after current event loop
    setTimeout(() => {
      // Then force a page reload to clear any stale state
      window.location.href = `/signup?step=0&force=true&_=${Date.now()}`;
    }, 0);
  };
  // Helper function to render the DatePicker with icon
  const renderDateField = (id, name, label, value, required = false) => (
    <div className="relative">
      <LabelWithIcon label={label} required={required} />
      <div className="relative">
        <input 
          type="date" 
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-5 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg appearance-none"
          disabled={isSubmitting}
          required={required}
          style={{ colorScheme: 'light' }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
    </div>
  );
  
  return (
    <div className="w-full bg-gray-50 py-8" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative'
    }}>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "85%" }}>
        <form onSubmit={handleSubmit} className="w-full">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-full mx-auto">
            <div className="p-6">
              <div className="mb-8 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#775684] mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Personal Information</h2>
                  <p className="text-sm text-gray-500 italic font-light mt-1">
                    Please provide your personal details for your member file.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <LabelWithIcon label="First Name" required={true} />
                  <input 
                    type="text" 
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-5 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label="Last Name" required={true} />
                  <input 
                    type="text" 
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-5 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
                
                {/* Sex field */}
                <div>
                  <LabelWithIcon label="Sex" required={true} />
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#775684] text-gray-700"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">--Select--</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
                </div>
                
                {/* Email field */}
                <div>
                  <LabelWithIcon label="Email" required={true} />
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting || (currentUser && currentUser.email)}
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                {/* Date of Birth field with modern styling */}
                {renderDateField("dateOfBirth", "dateOfBirth", "Date of Birth", formData.dateOfBirth, true)}
                
                {/* Phone fields */}
                <div>
                  <LabelWithIcon label="Preferred Phone Number" required={true} />
                  <select
                    id="phoneType"
                    name="phoneType"
                    value={formData.phoneType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">--Select--</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                  {errors.phoneType && <p className="text-red-500 text-sm mt-1">{errors.phoneType}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label={`Mobile Phone${formData.phoneType === "Mobile" ? " *" : ""}`} required={formData.phoneType === "Mobile"} />
                  <input 
                    type="tel" 
                    id="mobilePhone"
                    name="mobilePhone"
                    value={formData.mobilePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required={formData.phoneType === "Mobile"}
                  />
                  {errors.mobilePhone && <p className="text-red-500 text-sm mt-1">{errors.mobilePhone}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label={`Work Phone${formData.phoneType === "Work" ? " *" : ""}`} required={formData.phoneType === "Work"} />
                  <input 
                    type="tel" 
                    id="workPhone"
                    name="workPhone"
                    value={formData.workPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required={formData.phoneType === "Work"}
                  />
                  {errors.workPhone && <p className="text-red-500 text-sm mt-1">{errors.workPhone}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label={`Home Phone${formData.phoneType === "Home" ? " *" : ""}`} required={formData.phoneType === "Home"} />
                  <input 
                    type="tel" 
                    id="homePhone"
                    name="homePhone"
                    value={formData.homePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required={formData.phoneType === "Home"}
                  />
                  {errors.homePhone && <p className="text-red-500 text-sm mt-1">{errors.homePhone}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-full mx-auto">
            <div className="p-6">
              <div className="mb-8 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#775684] mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">Address Information</h2>
                  <p className="text-sm text-gray-500 italic font-light mt-1">
                    Your residential address and optional mailing address.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {/* Home address with Google Places Autocomplete */}
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    id="streetAddress"
                    name="streetAddress"
                    label="Home Address"
                    defaultValue={formData.streetAddress}
                    onAddressSelect={handleAddressSelect}
                    required={true}
                    disabled={isSubmitting}
                    errorMessage={errors.streetAddress}
                    placeholder="Start typing your address..."
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="City" required={true} />
                  <input 
                    type="text" 
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label={countryConfig.regionLabel} required={true} />
                  <input 
                    type="text" 
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label={countryConfig.postalCodeLabel} required={true} />
                  <input 
                    type="text" 
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label="Country" required={true} />
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label="Same Mailing Address" required={true} />
                  <select
                    id="sameMailingAddress"
                    name="sameMailingAddress"
                    value={formData.sameMailingAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">--Select--</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  {errors.sameMailingAddress && <p className="text-red-500 text-sm mt-1">{errors.sameMailingAddress}</p>}
                </div>
              </div>
              
              {/* Mailing address fields - conditionally shown */}
              {showMailingAddress && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Mailing Address</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="md:col-span-2">
                      <AddressAutocomplete
                        id="mailingStreetAddress"
                        name="mailingStreetAddress"
                        label="Mailing Address"
                        defaultValue={formData.mailingStreetAddress}
                        onAddressSelect={handleMailingAddressSelect}
                        required={true}
                        disabled={isSubmitting}
                        errorMessage={errors.mailingStreetAddress}
                        placeholder="Start typing your mailing address..."
                      />
                    </div>
                    
                    <div>
                      <LabelWithIcon label="City" required={true} />
                      <input 
                        type="text" 
                        id="mailingCity"
                        name="mailingCity"
                        value={formData.mailingCity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        disabled={isSubmitting}
                        required={showMailingAddress}
                      />
                      {errors.mailingCity && <p className="text-red-500 text-sm mt-1">{errors.mailingCity}</p>}
                    </div>
                    
                    <div>
                      <LabelWithIcon label={mailingCountryConfig.regionLabel} required={true} />
                      <input 
                        type="text" 
                        id="mailingRegion"
                        name="mailingRegion"
                        value={formData.mailingRegion}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        disabled={isSubmitting}
                        required={showMailingAddress}
                      />
                      {errors.mailingRegion && <p className="text-red-500 text-sm mt-1">{errors.mailingRegion}</p>}
                    </div>
                    
                    <div>
                      <LabelWithIcon label={mailingCountryConfig.postalCodeLabel} required={true} />
                      <input 
                        type="text" 
                        id="mailingPostalCode"
                        name="mailingPostalCode"
                        value={formData.mailingPostalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        disabled={isSubmitting}
                        required={showMailingAddress}
                      />
                      {errors.mailingPostalCode && <p className="text-red-500 text-sm mt-1">{errors.mailingPostalCode}</p>}
                    </div>
                    
                    <div>
                      <LabelWithIcon label="Country" required={true} />
                      <select
                        id="mailingCountry"
                        name="mailingCountry"
                        value={formData.mailingCountry}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        disabled={isSubmitting}
                        required={showMailingAddress}
                      >
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      {errors.mailingCountry && <p className="text-red-500 text-sm mt-1">{errors.mailingCountry}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 mb-6 w-full mx-auto">
            <button
              type="button"
              onClick={handleBack}
              className="py-5 px-8 border border-gray-300 rounded-full text-gray-700 font-medium flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm"
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
              className="py-5 px-8 rounded-full font-semibold text-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg bg-[#775684] text-white hover:bg-[#664573] disabled:opacity-70"
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
      
      {/* Help Panel Component */}
      <HelpPanel 
        showHelpInfo={showHelpInfo} 
        toggleHelpInfo={toggleHelpInfo} 
        helpItems={contactInfoHelpContent} 
      />
    </div>
  );
}