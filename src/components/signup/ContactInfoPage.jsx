// File: pages/ContactInfoPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

// Context
import { useUser } from "../../contexts/UserContext";

// Firebase services
import { auth } from "../../services/firebase";
import { updateSignupProgress } from "../../services/auth";
import { saveContactInfo, getContactInfo } from "../../services/contact";

// Components
import AddressAutocomplete from "../AddressAutocomplete";
import AddressAutocompleteV2 from '../AddressAutocompleteV2';
import HelpPanel from "./HelpPanel";

// Custom styles for input labels
const LabelWithIcon = ({ label, required = false }) => (
  <div className="mb-1">
    <span className="block text-gray-800 text-lg md:text-xl font-medium mb-3">{label} {required && '*'}</span>
  </div>
);

// Feature flag for enabling country-specific form localization
const ENABLE_LOCALIZATION = import.meta.env.VITE_ENABLE_LOCALIZATION === 'true';

// Country list - UPDATED: Complete list of all countries
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon",
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

// Countries where county is required
const countiesRequiredCountries = [
  "United States",
  "United Kingdom",
  "Ireland"
  // Add other countries where county is required
];

// Country-specific form configurations
const countryConfigs = {
  "United States": {
    postalCodeLabel: "Zip Code",
    regionLabel: "State",
    countyLabel: "County",
    countyRequired: true
  },
  "Canada": {
    postalCodeLabel: "Postal Code",
    regionLabel: "Province",
    countyLabel: "County",
    countyRequired: false
  },
  "United Kingdom": {
    postalCodeLabel: "Postcode",
    regionLabel: "County",
    countyLabel: "County",
    countyRequired: true
  },
  "Ireland": {
    postalCodeLabel: "Eircode",
    regionLabel: "Province",
    countyLabel: "County",
    countyRequired: true
  },
  // Add more as needed...
};

// Default configuration
const defaultConfig = {
  postalCodeLabel: "Postal/Zip Code",
  regionLabel: "State/Province",
  countyLabel: "County",
  countyRequired: false
};

// Detect if browser is Safari
const isSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1;
};

export default function ContactInfoPage({ onNext, onBack, initialData }) {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  
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

  // Detect Safari browser on initial render
  useEffect(() => {
    setIsSafariBrowser(isSafari());
  }, []);
  
  // Debug: Check if API key is available
  useEffect(() => {
    console.log("API Key Available:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Yes" : "No");
    console.log("API Key first 5 chars:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 5) + "...");
    console.log("Browser detected as Safari:", isSafariBrowser);
    
    // Add custom styles to ensure consistent input backgrounds
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = `
      /* Override styles for form inputs - Simplified for better autofill compatibility */
      input, select, textarea {
        background-color: #FFFFFF !important;
        font-size: 1.125rem !important;
        height: 4rem !important; /* Much taller input fields */
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 2rem !important; /* More horizontal padding */
        padding-right: 2rem !important; /* More horizontal padding */
        border-radius: 0.375rem !important;
        border-color: rgba(119, 86, 132, 0.3) !important;
        box-sizing: border-box !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important; /* Full width on mobile */
      }
      
      @media (min-width: 768px) {
        input, select, textarea {
          max-width: 100% !important; /* Full width fields on desktop */
        }
      }
      
      /* Make address autocomplete field have same width as other fields */
      .address-autocomplete-field {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      @media (min-width: 768px) {
        .address-autocomplete-field {
          max-width: 100% !important; /* Full width address fields */
        }
      }
      
      /* Make birthday dropdowns full width */
      .date-select {
        flex: 1;
        min-width: 0;
      }
      
      .date-container {
        width: 100%;
        max-width: 100%;
      }
      
      /* Custom select styling - simplified for better Safari compatibility */
      select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background-color: #FFFFFF;
        background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
        background-position: right 0.75rem center;
        background-repeat: no-repeat;
        background-size: 1.5em 1.5em;
        color: #333333;
      }
      
      /* Force white background for Safari dropdowns - simplified */
      select option {
        background-color: #FFFFFF;
        color: #333333;
      }
      
      input:focus, select:focus, textarea:focus {
        outline: 2px solid rgba(119, 86, 132, 0.5);
        border-color: rgba(119, 86, 132, 0.5);
      }
      
      /* Prevent blue backgrounds on autofill - simplified */
      input:-webkit-autofill {
        -webkit-box-shadow: 0 0 0px 1000px white inset;
        transition: background-color 5000s ease-in-out 0s;
      }
      
      /* Force consistent height for date inputs */
      input[type="date"] {
        height: 4rem; /* Match other inputs */
        line-height: 4rem;
        appearance: none;
      }
      
      /* Style label text */
      label, .form-label {
        color: #1a202c; 
        font-size: 1.125rem;
        font-weight: 500;
        margin-bottom: 1rem;
      }
      
      /* Spacing classes */
      .p-12 { padding: 3rem; }
      .px-14 { padding-left: 3.5rem; padding-right: 3.5rem; }
      .gap-y-10 { row-gap: 2.5rem; }
      .gap-x-12 { column-gap: 3rem; }
      .mb-14 { margin-bottom: 3.5rem; }
      .pb-8 { padding-bottom: 2.5rem; }
      .pt-4 { padding-top: 1.25rem; }
      .mt-14 { margin-top: 3.5rem; }
      .pt-10 { padding-top: 2.5rem; }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, [isSafariBrowser]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    sex: "",
    dateOfBirth: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    streetAddress: "",
    city: "",
    cnty_hm: "", // Changed from county
    region: "",
    postalCode: "",
    country: "United States",
    sameMailingAddress: "",
    mailingStreetAddress: "",
    mailingCity: "",
    cnty_ml: "", // Changed from mailingCounty
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
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    streetAddress: "",
    city: "",
    cnty_hm: "", // Changed from county
    region: "",
    postalCode: "",
    country: "",
    sameMailingAddress: "",
    mailingStreetAddress: "",
    mailingCity: "",
    cnty_ml: "", // Changed from mailingCounty
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
  
  // Determine if county is required based on the selected country
  const isCountyRequired = countryConfig.countyRequired || countiesRequiredCountries.includes(formData.country);
  const isMailingCountyRequired = mailingCountryConfig.countyRequired || countiesRequiredCountries.includes(formData.mailingCountry);

  // Function to update the combined date field
  const updateCombinedDateOfBirth = (month, day, year) => {
    // Only combine if all parts are present
    if (month && day && year) {
      const formattedDate = `${month}/${day}/${year}`;
      setFormData(prev => ({
        ...prev,
        dateOfBirth: formattedDate
      }));
    }
  };

  // Fix for Chrome autofill putting state in county field
  useEffect(() => {
    // If region and county contain the same data, clear the county
    if (formData.region && formData.cnty_hm === formData.region) {
      setFormData(prev => ({
        ...prev,
        cnty_hm: ""
      }));
      
      // Also force update the DOM element if it exists
      const countyField = document.getElementById('cnty_hm');
      if (countyField) {
        countyField.value = '';
      }
    }
    
    // Same check for mailing address
    if (formData.mailingRegion && formData.cnty_ml === formData.mailingRegion) {
      setFormData(prev => ({
        ...prev,
        cnty_ml: ""
      }));
      
      const mailingCountyField = document.getElementById('cnty_ml');
      if (mailingCountyField) {
        mailingCountyField.value = '';
      }
    }
  }, [formData.region, formData.cnty_hm, formData.mailingRegion, formData.cnty_ml]);

  // Load data from backend only
  useEffect(() => {
    const loadDataFromBackend = async () => {
      setIsLoading(true);
      
      try {
        // Only attempt to fetch from backend if user is authenticated
        if (currentUser) {
          console.log("User authenticated, fetching contact info from backend");
          
          try {
            const response = await getContactInfo();
            
            if (response.success && response.contactInfo) {
              console.log("Successfully retrieved contact info from backend");
              
              // Set the form data from backend
              setFormData(prev => ({
                ...prev,
                ...response.contactInfo,
                // Ensure email from current user is always used
                email: currentUser.email || response.contactInfo.email || ""
              }));
              
              // Parse date of birth if it exists
              if (response.contactInfo.dateOfBirth) {
                const parts = response.contactInfo.dateOfBirth.split('/');
                if (parts.length === 3) {
                  setFormData(prev => ({
                    ...prev,
                    birthMonth: parts[0],
                    birthDay: parts[1],
                    birthYear: parts[2]
                  }));
                }
              }
            } else {
              console.log("No contact info found in backend, using default values");
              
              // If no data from backend, use initialData if provided
              if (initialData && Object.keys(initialData).length > 0) {
                setFormData(prev => ({
                  ...prev,
                  ...initialData,
                  email: currentUser.email || initialData.email || ""
                }));
              } else {
                // Otherwise just set email from current user
                setFormData(prev => ({
                  ...prev,
                  email: currentUser.email || ""
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching contact info:", error);
            
            // Fall back to initialData if provided
            if (initialData && Object.keys(initialData).length > 0) {
              setFormData(prev => ({
                ...prev,
                ...initialData,
                email: currentUser.email || initialData.email || ""
              }));
            } else {
              // Otherwise just set email from current user
              setFormData(prev => ({
                ...prev,
                email: currentUser.email || ""
              }));
            }
          }
        } else {
          console.log("User not authenticated, using initialData if available");
          
          // Not authenticated, use initialData if provided
          if (initialData && Object.keys(initialData).length > 0) {
            setFormData(prev => ({
              ...prev,
              ...initialData
            }));
          }
        }
      } catch (error) {
        console.error("Error in loadDataFromBackend:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDataFromBackend();
  }, [currentUser, initialData]);

  // Parse existing dateOfBirth into separate fields when loading the component
  useEffect(() => {
    if (formData.dateOfBirth && !formData.birthMonth) {
      const parts = formData.dateOfBirth.split('/');
      if (parts.length === 3) {
        setFormData(prev => ({
          ...prev,
          birthMonth: parts[0],
          birthDay: parts[1],
          birthYear: parts[2]
        }));
      }
    }
  }, [formData.dateOfBirth]);

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
        cnty_ml: prev.cnty_hm, // Changed from mailingCounty/county
        mailingRegion: prev.region,
        mailingPostalCode: prev.postalCode,
        mailingCountry: prev.country
      }));
    }
    
    // Special handling for date of birth fields
    if (name === 'birthMonth' || name === 'birthDay' || name === 'birthYear') {
      if (name === 'birthMonth') {
        updateCombinedDateOfBirth(value, formData.birthDay, formData.birthYear);
      } else if (name === 'birthDay') {
        updateCombinedDateOfBirth(formData.birthMonth, value, formData.birthYear);
      } else if (name === 'birthYear') {
        updateCombinedDateOfBirth(formData.birthMonth, formData.birthDay, value);
      }
    }
  };

  // Fix for autofill - Add this handler
  const handleInput = (e) => {
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
    
    // Special handling for date of birth fields
    if (name === 'birthMonth' || name === 'birthDay' || name === 'birthYear') {
      if (name === 'birthMonth') {
        updateCombinedDateOfBirth(value, formData.birthDay, formData.birthYear);
      } else if (name === 'birthDay') {
        updateCombinedDateOfBirth(formData.birthMonth, value, formData.birthYear);
      } else if (name === 'birthYear') {
        updateCombinedDateOfBirth(formData.birthMonth, formData.birthDay, value);
      }
    }
  };
  
  // Handler for address selection from autocomplete
  const handleAddressSelect = (addressData) => {
    console.log("Address selected in parent component:", addressData);
    
    // First, delete any existing county data
    const updatedFormData = {
      ...formData
    };
    
    // Force remove county field
    delete updatedFormData.cnty_hm; // Changed from county
    
    // Now set all the other fields
    updatedFormData.streetAddress = addressData.streetAddress || addressData.formattedAddress;
    updatedFormData.city = addressData.city || "";
    updatedFormData.region = addressData.region || addressData.regionShort || "";
    updatedFormData.postalCode = addressData.postalCode || "";
    updatedFormData.country = addressData.country || "United States";
    
    // Always set county to empty string to prevent autocomplete from filling it
    updatedFormData.cnty_hm = ""; // Force empty string
    
    // Update the state with the modified data
    setFormData(updatedFormData);
    
    // Manually force county field to be empty if it exists in DOM
    setTimeout(() => {
      const countyField = document.getElementById('cnty_hm'); // Changed from county
      if (countyField) {
        countyField.value = '';
      }
    }, 100);
    
    // Clear any address-related errors
    setErrors(prev => ({
      ...prev,
      streetAddress: "",
      city: "",
      cnty_hm: "", // Changed from county
      region: "",
      postalCode: "",
      country: ""
    }));
  };
  
  // Handler for mailing address selection from autocomplete
  const handleMailingAddressSelect = (addressData) => {
    console.log("Mailing address selected in parent component:", addressData);
    
    // First, delete any existing county data
    const updatedFormData = {
      ...formData
    };
    
    // Force remove mailing county field
    delete updatedFormData.cnty_ml; // Changed from mailingCounty
    
    // Now set all the other fields
    updatedFormData.mailingStreetAddress = addressData.streetAddress || addressData.formattedAddress;
    updatedFormData.mailingCity = addressData.city || "";
    updatedFormData.mailingRegion = addressData.region || addressData.regionShort || "";
    updatedFormData.mailingPostalCode = addressData.postalCode || "";
    updatedFormData.mailingCountry = addressData.country || "United States";
    
    // Always set mailing county to empty string to prevent autocomplete from filling it
    updatedFormData.cnty_ml = ""; // Force empty string
    
    // Update the state with the modified data
    setFormData(updatedFormData);
    
    // Manually force mailing county field to be empty if it exists in DOM
    setTimeout(() => {
      const mailingCountyField = document.getElementById('cnty_ml'); // Changed from mailingCounty
      if (mailingCountyField) {
        mailingCountyField.value = '';
      }
    }, 100);
    
    // Clear any mailing address-related errors
    setErrors(prev => ({
      ...prev,
      mailingStreetAddress: "",
      mailingCity: "",
      cnty_ml: "", // Changed from mailingCounty
      mailingRegion: "",
      mailingPostalCode: "",
      mailingCountry: ""
    }));
  };
  
  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    console.log("Validating form data");
    
    // Required fields validation
    const requiredFields = [
      'firstName', 'lastName', 'sex', 
      'birthMonth', 'birthDay', 'birthYear',
      'streetAddress', 'city', 'region', 'postalCode', 'country',
      'sameMailingAddress', 'email', 'phoneType'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `Required field`;
      }
    });
    
    // County validation - only required for specific countries
    if (isCountyRequired && !formData.cnty_hm) { // Changed from county
      newErrors.cnty_hm = 'Required field'; // Changed from county
    }
    
    // Phone number validation based on phone type
    if (formData.phoneType === 'Mobile' && !formData.mobilePhone) {
      newErrors.mobilePhone = 'Required field';
    } else if (formData.phoneType === 'Work' && !formData.workPhone) {
      newErrors.workPhone = 'Required field';
    } else if (formData.phoneType === 'Home' && !formData.homePhone) {
      newErrors.homePhone = 'Required field';
    }
    
    // Mailing address validation if not same as home address
    if (formData.sameMailingAddress === 'No') {
      const mailingFields = [
        'mailingStreetAddress', 'mailingCity', 'mailingRegion', 
        'mailingPostalCode', 'mailingCountry'
      ];
      
      mailingFields.forEach(field => {
        if (!formData[field]) {
          newErrors[field] = `Required field`;
        }
      });
      
      // Mailing county validation - only required for specific countries
      if (isMailingCountyRequired && !formData.cnty_ml) { // Changed from mailingCounty
        newErrors.cnty_ml = 'Required field'; // Changed from mailingCounty
      }
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Set errors state
    setErrors(newErrors);
    
    // Apply visual styling to error fields
    setTimeout(() => {
      Object.keys(newErrors).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
          element.style.border = "2px solid #dc2626";
          element.style.backgroundColor = "#fef2f2";
        }
      });
      
      // Scroll to first error if any
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = document.getElementById(Object.keys(newErrors)[0]);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
    
    return Object.keys(newErrors).length === 0;
  };

  const syncFormDataBeforeSubmit = () => {
    // Force read all form fields' values from the DOM
    const form = document.querySelector('form');
    const formElements = form.elements;
    const updatedData = {...formData};
    
    // Update formData with actual DOM values
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if (element.name && element.value) {
        updatedData[element.name] = element.value;
      }
    }
    
    // Update the React state with DOM values
    setFormData(updatedData);
    return updatedData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Force sync form data immediately from the DOM
    const form = document.querySelector('form');
    const updatedData = {...formData};
    
    // Get all form inputs
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.name && input.value) {
        updatedData[input.name] = input.value;
      }
    });
    
    // Direct validation with updated data
    const errors = {};
    
    // Required fields validation
    const requiredFields = [
      'firstName', 'lastName', 'sex', 
      'birthMonth', 'birthDay', 'birthYear',
      'streetAddress', 'city', 'region', 'postalCode', 'country',
      'sameMailingAddress', 'email', 'phoneType'
    ];
    
    requiredFields.forEach(field => {
      if (!updatedData[field]) {
        errors[field] = `Required field`;
      }
    });
    
    // County validation - only check if necessary
    const isCountyRequired = (countryConfigs[updatedData.country]?.countyRequired || 
      countiesRequiredCountries.includes(updatedData.country));
      
    if (isCountyRequired && !updatedData.cnty_hm) {
      errors.cnty_hm = 'Required field';
    }
    
    // Phone validation based on type
    if (updatedData.phoneType === 'Mobile' && !updatedData.mobilePhone) {
      errors.mobilePhone = 'Required field';
    } else if (updatedData.phoneType === 'Work' && !updatedData.workPhone) {
      errors.workPhone = 'Required field';
    } else if (updatedData.phoneType === 'Home' && !updatedData.homePhone) {
      errors.homePhone = 'Required field';
    }
    
    // Stop if any errors found
    if (Object.keys(errors).length > 0) {
      // Update error state
      setErrors(errors);
      
      // Highlight first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.style.border = "2px solid #dc2626";
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      console.error("Form validation failed with errors:", errors);
      return;
    }
    
    // If validation passes, continue with submission
    setIsSubmitting(true);
    
    try {
      console.log("💾 Contact info submission started with fields:", Object.keys(updatedData).join(", "));
      
      // Check authentication
      if (!currentUser || !currentUser.uid) {
        throw new Error("You must be logged in to save contact information. Please refresh and try again.");
      }
      
      // Save form data (use updated data directly)
      const saveResult = await saveContactInfo(updatedData);
      
      if (!saveResult) {
        throw new Error("Server error while saving contact information.");
      }
      
      console.log("✅ Contact info saved successfully!");
      
      // Update progress
      const progressResult = await updateSignupProgress("package", 3, {});
      
      // Force navigation
      localStorage.setItem('force_active_step', '3');
      localStorage.setItem('force_timestamp', Date.now().toString());
      
      navigate('/signup/package', { replace: true });
      
    } catch (error) {
      console.error('❌ Error saving contact info:', error);
      alert(error.message || "Failed to save contact information. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    console.log("ContactInfoPage: Handle back button clicked");
    
    // Simply navigate to the previous step
    navigate('/signup/success', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#775684]"></div>
        <p className="ml-4 text-xl text-gray-700">Loading your information...</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative'
    }}>
      <div className="w-full mx-auto px-2 sm:px-6 lg:px-8" style={{ maxWidth: "85%" }}>
        <form onSubmit={handleSubmit} className="w-full" autoComplete="on">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-full mx-auto">
            <div className="p-4 md:p-12 px-6 md:px-14">
              <div className="mb-6 md:mb-14 flex items-start pt-2 md:pt-4">
                <div className="bg-[#775684] p-4 md:p-4 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4 pt-2 md:pt-3">
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Personal Information</h2>
                  <p className="text-sm text-gray-500 italic font-light mt-1 md:text-sm text-xs">
                    Please provide your personal details for your member file.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pb-8">
                <div>
                  <LabelWithIcon label="First Name" required={true} />
                      <input 
                        type="text" 
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={handleChange}
                        onInput={handleInput}
                        className={`w-full h-16 pl-2 pr-3 py-3 bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg ${errors.firstName ? 'error-field' : ''}`}
                        style={errors.firstName ? {border: '2px solid #dc2626'} : {borderColor: 'rgba(119, 86, 132, 0.3)'}}
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
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={handleChange}
                        onInput={handleInput}
                        className="w-full h-16 pl-2 pr-3 py-3 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                
                {/* Sex field */}
                    <div>
                      <LabelWithIcon label="Sex" required={true} />
                      <select
                        id="sex"
                        name="sex"
                        autoComplete="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        onInput={handleInput}
                        className="w-full h-16 pl-2 pr-3 py-3 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#775684] text-gray-700"
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>--Select--</option>
                        <option value="Male" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Male</option>
                        <option value="Female" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Female</option>
                        <option value="Other" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Other</option>
                      </select>
                    </div>
                
                {/* Email field */}
                    <div>
                      <LabelWithIcon label="Email" required={true} />
                      <input 
                        type="email" 
                        id="email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        onInput={handleInput}
                        className="w-full h-16 pl-2 pr-3 py-3 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        disabled={isSubmitting || (currentUser && currentUser.email)}
                        required
                      />
                    </div>
                
                {/* Phone fields */}
                <div>
                  <LabelWithIcon label="Preferred Phone Number" required={true} />
                  <select
                    id="phoneType"
                    name="phoneType"
                    autoComplete="tel-type"
                    value={formData.phoneType}
                    onChange={handleChange}
                    onInput={handleInput}
                    className={`w-full h-16 pl-2 pr-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 ${errors.phoneType ? 'error-field' : ''}`}
                    disabled={isSubmitting}
                    required
                    style={{backgroundColor: "#FFFFFF", color: "#333333"}}
                  >
                    <option value="" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>--Select--</option>
                    <option value="Home" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Home</option>
                    <option value="Work" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Work</option>
                    <option value="Mobile" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Mobile</option>
                  </select>
                  {errors.phoneType && <p className="text-red-500 text-sm mt-1">{errors.phoneType}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label="Mobile Phone" required={formData.phoneType === "Mobile"} />
                  <input 
                    type="tel" 
                    id="mobilePhone"
                    name="mobilePhone"
                    autoComplete="tel-mobile"
                    value={formData.mobilePhone}
                    onChange={handleChange}
                    onInput={handleInput}
                    className={`w-full h-16 pl-2 pr-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 ${errors.mobilePhone ? 'error-field' : ''}`}
                    disabled={isSubmitting}
                    required={formData.phoneType === "Mobile"}
                  />
                  {errors.mobilePhone && <p className="text-red-500 text-sm mt-1">{errors.mobilePhone}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label="Work Phone" required={formData.phoneType === "Work"} />
                  <input 
                    type="tel" 
                    id="workPhone"
                    name="workPhone"
                    autoComplete="tel-work"
                    value={formData.workPhone}
                    onChange={handleChange}
                    onInput={handleInput}
                    className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 ${errors.workPhone ? 'error-field' : ''}`}
                    disabled={isSubmitting}
                    required={formData.phoneType === "Work"}
                  />
                  {errors.workPhone && <p className="text-red-500 text-sm mt-1">{errors.workPhone}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label="Home Phone" required={formData.phoneType === "Home"} />
                  <input 
                    type="tel" 
                    id="homePhone"
                    name="homePhone"
                    autoComplete="tel-home"
                    value={formData.homePhone}
                    onChange={handleChange}
                    onInput={handleInput}
                    className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 ${errors.homePhone ? 'error-field' : ''}`}
                    disabled={isSubmitting}
                    required={formData.phoneType === "Home"}
                  />
                  {errors.homePhone && <p className="text-red-500 text-sm mt-1">{errors.homePhone}</p>}
                </div>
                
                {/* Date of Birth - Three side-by-side dropdowns with narrower width */}
                <div>
                  <LabelWithIcon label="Date of Birth" required={true} />
                  <div className="grid grid-cols-3 gap-2 date-container">
                    {/* Month dropdown */}
                    <div className="date-select">
                      <select
                        id="birthMonth"
                        name="birthMonth"
                        autoComplete="bday-month"
                        value={formData.birthMonth || ""}
                        onChange={handleChange}
                        onInput={handleInput}
                        style={{
                          height: '4rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '0.375rem',
                          fontSize: '1.125rem',
                          width: '100%',
                          border: errors.birthMonth ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                        }}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" disabled>Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                      {errors.birthMonth && <p className="text-red-500 text-sm mt-1">{errors.birthMonth}</p>}
                    </div>
                    
                    {/* Day dropdown */}
                    <div className="date-select">
                      <select
                        id="birthDay"
                        name="birthDay"
                        autoComplete="bday-day"
                        value={formData.birthDay || ""}
                        onChange={handleChange}
                        onInput={handleInput}
                        style={{
                          height: '4rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '0.375rem',
                          fontSize: '1.125rem',
                          width: '100%',
                          border: errors.birthDay ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                        }}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" disabled>Day</option>
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = (i + 1).toString().padStart(2, '0');
                          return <option key={day} value={day}>{day}</option>;
                        })}
                      </select>
                      {errors.birthDay && <p className="text-red-500 text-sm mt-1">{errors.birthDay}</p>}
                    </div>
                    
                    {/* Year dropdown */}
                    <div className="date-select">
                      <select
                        id="birthYear"
                        name="birthYear"
                        autoComplete="bday-year"
                        value={formData.birthYear || ""}
                        onChange={handleChange}
                        onInput={handleInput}
                        style={{
                          height: '4rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: '#FFFFFF',
                          borderRadius: '0.375rem',
                          fontSize: '1.125rem',
                          width: '100%',
                          border: errors.birthYear ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                        }}
                        disabled={isSubmitting}
                        required
                      >
                        <option value="" disabled>Year</option>
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = (new Date().getFullYear() - i);
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                      {errors.birthYear && <p className="text-red-500 text-sm mt-1">{errors.birthYear}</p>}
                    </div>
                  </div>
                  
                  {/* Hidden field to store the combined date in MM/DD/YYYY format for form submission */}
                  <input 
                    type="hidden" 
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                  />
                  
                  {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-full mx-auto">
            <div className="p-4 md:p-12 px-6 md:px-14">
              <div className="mb-6 md:mb-14 flex items-start pt-2 md:pt-4">
                <div className="bg-[#775684] p-4 md:p-4 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-4 pt-2 md:pt-3">
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">Address Information</h2>
                  <p className="text-sm text-gray-500 italic font-light mt-1 md:text-sm text-xs">
                    Your residential address and optional mailing address.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pb-8">
                {/* Home address with Google Places Autocomplete - full width for this field */}
                <div className="md:col-span-2">
                  <div className="address-autocomplete-field">
                  <AddressAutocompleteV2
                    id="streetAddress"
                    name="streetAddress"
                    label="Home Address"
                    defaultValue={formData.streetAddress}
                    onAddressSelect={handleAddressSelect}
                    required={true}
                    disabled={isSubmitting}
                    errorMessage={errors.streetAddress ? "Required field" : ""}
                    placeholder="Start typing your address..."
                    isError={!!errors.streetAddress}
                  />
                  </div>
                </div>
                
                <div>
                  <LabelWithIcon label="City" required={true} />
                  <input 
                    type="text" 
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={{
                      height: '4rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.375rem',
                      fontSize: '1.125rem',
                      width: '100%',
                      border: errors.city ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                    }}
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
                    autoComplete="address-level1"
                    value={formData.region}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={{
                      height: '4rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.375rem',
                      fontSize: '1.125rem',
                      width: '100%',
                      border: errors.region ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                    }}
                    disabled={isSubmitting}
                    required
                  />
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>

                <div>
                  <LabelWithIcon label={countryConfig.countyLabel} required={isCountyRequired} />
                  <input 
                    type="text" 
                    id="cnty_hm"
                    name="cnty_hm"
                    autoComplete="off"
                    value={formData.cnty_hm || ""}
                    onChange={handleChange}
                    onInput={handleInput}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    disabled={isSubmitting}
                    required={isCountyRequired}
                    onFocus={() => {
                      // Check on focus if county equals state and clear if needed
                      if (formData.cnty_hm === formData.region) {
                        document.getElementById('cnty_hm').value = '';
                        setFormData(prev => ({...prev, cnty_hm: ""}));
                      }
                    }}
                  />
                  {errors.cnty_hm && <p className="text-red-500 text-sm mt-1">{errors.cnty_hm}</p>}
                </div>
                
                <div>
                  <LabelWithIcon label={countryConfig.postalCodeLabel} required={true} />
                  <input 
                    type="text" 
                    id="postalCode"
                    name="postalCode"
                    autoComplete="postal-code"
                    value={formData.postalCode}
                    onChange={handleChange}
                    onInput={handleInput}
                    style={{
                      height: '4rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.375rem',
                      fontSize: '1.125rem',
                      width: '100%',
                      border: errors.postalCode ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                    }}
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
  autoComplete="country"
  value={formData.country}
  onChange={handleChange}
  onInput={handleInput}
  style={{
    height: '4rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#FFFFFF',
    borderRadius: '0.375rem',
    fontSize: '1.125rem',
    width: '100%',
    WebkitBoxShadow: '0 0 0px 1000px white inset', // Add this line
    border: errors.country ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
  }}
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
                    onInput={handleInput}
                    style={{
                      height: '4rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.375rem',
                      fontSize: '1.125rem',
                      width: '100%',
                      border: errors.sameMailingAddress ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
                    }}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>--Select--</option>
                    <option value="Yes" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Yes</option>
                    <option value="No" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>No</option>
                  </select>
                  {errors.sameMailingAddress && <p className="text-red-500 text-sm mt-1">{errors.sameMailingAddress}</p>}
                </div>
              </div>
              
{/* Mailing address fields - conditionally shown */}
{showMailingAddress && (
  <div className="mt-14 pt-10 border-t border-gray-200">
    <div className="mb-12 flex items-start pt-4">
      <div className="bg-[#775684] p-3 md:p-4 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="ml-4 pt-2 md:pt-3">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Mailing Address</h3>
        <p className="text-sm text-gray-500 italic font-light mt-1 md:text-sm text-xs">
          Please provide the address where you would like to receive mail.
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pb-8">
      <div className="md:col-span-2">
        <div className="address-autocomplete-field">
          <AddressAutocomplete
            id="mailingStreetAddress"
            name="mailingStreetAddress"
            label="Mailing Address"
            defaultValue={formData.mailingStreetAddress}
            onAddressSelect={handleMailingAddressSelect}
            required={true}
            disabled={isSubmitting}
            errorMessage={errors.mailingStreetAddress ? "Required field" : ""}
            placeholder="Start typing your mailing address..."
            isError={!!errors.mailingStreetAddress}
          />
        </div>
      </div>
      
      <div>
        <LabelWithIcon label="City" required={true} />
        <input 
          type="text" 
          id="mailingCity"
          name="mailingCity"
          autoComplete="shipping address-level2"
          value={formData.mailingCity}
          onChange={handleChange}
          onInput={handleInput}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          disabled={isSubmitting}
          required={showMailingAddress}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.mailingCity ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
        />
        {errors.mailingCity && <p className="text-red-500 text-sm mt-1">{errors.mailingCity}</p>}
      </div>

      <div>
        <LabelWithIcon label={mailingCountryConfig.countyLabel} required={isMailingCountyRequired} />
        <input 
          type="text" 
          id="cnty_ml"
          name="cnty_ml"
          autoComplete="off"
          value={formData.cnty_ml || ""}
          onChange={handleChange}
          onInput={handleInput}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          disabled={isSubmitting}
          required={showMailingAddress && isMailingCountyRequired}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.cnty_ml ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
          onFocus={() => {
            // Check on focus if county equals state and clear if needed
            if (formData.cnty_ml === formData.mailingRegion) {
              document.getElementById('cnty_ml').value = '';
              setFormData(prev => ({...prev, cnty_ml: ""}));
            }
          }}
        />
        {errors.cnty_ml && <p className="text-red-500 text-sm mt-1">{errors.cnty_ml}</p>}
      </div>
      
      <div>
        <LabelWithIcon label={mailingCountryConfig.regionLabel} required={true} />
        <input 
          type="text" 
          id="mailingRegion"
          name="mailingRegion"
          autoComplete="shipping address-level1"
          value={formData.mailingRegion}
          onChange={handleChange}
          onInput={handleInput}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          disabled={isSubmitting}
          required={showMailingAddress}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.mailingRegion ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
        />
        {errors.mailingRegion && <p className="text-red-500 text-sm mt-1">{errors.mailingRegion}</p>}
      </div>
      
      <div>
        <LabelWithIcon label={mailingCountryConfig.postalCodeLabel} required={true} />
        <input 
          type="text" 
          id="mailingPostalCode"
          name="mailingPostalCode"
          autoComplete="shipping postal-code"
          value={formData.mailingPostalCode}
          onChange={handleChange}
          onInput={handleInput}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          disabled={isSubmitting}
          required={showMailingAddress}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.mailingPostalCode ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
        />
        {errors.mailingPostalCode && <p className="text-red-500 text-sm mt-1">{errors.mailingPostalCode}</p>}
      </div>
      
      <div>
        <LabelWithIcon label="Country" required={true} />
        <select
          id="mailingCountry"
          name="mailingCountry"
          autoComplete="shipping country"
          value={formData.mailingCountry}
          onChange={handleChange}
          onInput={handleInput}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          disabled={isSubmitting}
          required={showMailingAddress}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.mailingCountry ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
        >
          {countries.map(country => (
            <option key={country} value={country} style={{backgroundColor: "#FFFFFF", color: "#333333"}}>{country}</option>
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