// File: pages/ContactInfoPage.jsx
import React, { useState, useEffect } from "react";

// Context
import { useUser } from "../../contexts/UserContext";

// Firebase services
import { saveContactInfo, getContactInfo } from "../../services/contact";

// Services
import { addressValidationService } from "../../services/addressValidation";

import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import { DelayedCenteredLoader } from '../../components/DotLoader';

import IconBox from "./IconBox";

// Components
import AddressAutocompleteV3 from "../AddressAutocompleteV3";
import HelpPanel from "./HelpPanel";
import { 
  LabelWithIcon, 
  InputField, 
  SelectField, 
  CountrySelect, 
  DateOfBirthFields 
} from './ContactFormFields';

// Utilities
import { 
  countries, 
  getCountryConfig, 
  isCountyRequiredForCountry, 
  defaultConfig 
} from '../utils/contactCountryConfig';
import { 
  validateContactForm, 
  applyErrorStyling, 
  syncFormDataFromDOM 
} from '../utils/contactFormValidation';
import { 
  createInitialFormData, 
  createInitialErrors, 
  updateCombinedDateOfBirth, 
  parseDateOfBirth, 
  handleSameMailingAddress, 
  processAddressData 
} from '../utils/contactFormData';
import { 
  isSafari, 
  applyContactFormStyles, 
  fixAutofillCountyIssue 
} from '../utils/contactBrowserUtils';

// Feature flags
const ENABLE_LOCALIZATION = import.meta.env.VITE_ENABLE_LOCALIZATION === 'true';
const ENABLE_ADDRESS_VALIDATION = import.meta.env.VITE_ENABLE_ADDRESS_VALIDATION === 'true';

// Help content for contact info page
const contactInfoHelpContent = [
  {
    title: "Personal Information",
    content: "Please provide accurate personal details. This information will be used for your member file and communications."
  },
  {
    title: "Address Information",
    content: "Your residential address is required. We validate addresses to ensure accurate shipping. If you receive mail at a different location, select 'No' for 'Same Mailing Address'."
  },
  {
    title: "Phone Numbers",
    content: "Please provide at least one phone number where we can reach you. Select your preferred contact method in the dropdown."
  },
  {
    title: "Need assistance?",
    content: (
      <>
        Contact our support team at <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a> or call 623-552-4338.
      </>
    )
  }
];

// Age validation utility
const calculateAge = (birthMonth, birthDay, birthYear) => {
  if (!birthMonth || !birthDay || !birthYear) return null;
  
  const today = new Date();
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default function ContactInfoPage({ onNext, onBack, initialData }) {
  const { currentUser } = useUser();
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  
  // Age validation state
  const [showAgeOverlay, setShowAgeOverlay] = useState(false);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(createInitialFormData());
  const [errors, setErrors] = useState(createInitialErrors());

  // Address validation state
  const [isValidatingAddresses, setIsValidatingAddresses] = useState(false);
  const [validationResults, setValidationResults] = useState(null);

  // Country configuration
  const [countryConfig, setCountryConfig] = useState(
    getCountryConfig("United States", ENABLE_LOCALIZATION)
  );
  
  // Mailing country configuration
  const [mailingCountryConfig, setMailingCountryConfig] = useState(
    getCountryConfig("United States", ENABLE_LOCALIZATION)
  );

  // Show/hide mailing address section based on "Same Mailing Address" selection
  const showMailingAddress = formData.sameMailingAddress === "No";
  
  // Determine if county is required based on the selected country
  const isCountyRequired = isCountyRequiredForCountry(formData.country, countryConfig);
  const isMailingCountyRequired = isCountyRequiredForCountry(formData.mailingCountry, mailingCountryConfig);

  const [animationComplete, setAnimationComplete] = useState(false);

  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };


  // Age validation effect
  useEffect(() => {
    const age = calculateAge(formData.birthMonth, formData.birthDay, formData.birthYear);
    if (age !== null && age < 18) {
      setShowAgeOverlay(true);
    } else {
      setShowAgeOverlay(false);
    }
  }, [formData.birthMonth, formData.birthDay, formData.birthYear]);

  /*useEffect(() => {
    const handleCustomAddressUpdate = (event) => {
      console.log("🎯 Received custom address update event:", event.detail);
      handleAddressSelect(event.detail);
    };
  
    // Listen for the custom event
    document.addEventListener('addressAutocompleteUpdate', handleCustomAddressUpdate);
    
    return () => {
      document.removeEventListener('addressAutocompleteUpdate', handleCustomAddressUpdate);
    };
  }, []);*/

  useEffect(() => {
    const handleCustomAddressUpdate = (event) => {
      console.log("🎯 Received custom address update event:", event.detail);
      console.log("🎯 Event detail structure:", JSON.stringify(event.detail, null, 2));
      handleAddressSelect(event.detail);
    };
  
    // Listen for the custom event
    document.addEventListener('addressAutocompleteUpdate', handleCustomAddressUpdate);
    
    return () => {
      document.removeEventListener('addressAutocompleteUpdate', handleCustomAddressUpdate);
    };
  }, []);

  useEffect(() => {
    setIsSafariBrowser(isSafari());
    
    console.log("Browser detected as Safari:", isSafariBrowser);
    
    const styleElement = applyContactFormStyles();
    
    // Add custom styles for smaller fields AND Helvetica font
    const customStyles = document.createElement('style');
    customStyles.innerHTML = `
      /* Helvetica font styling for entire form */
      .contact-info-form * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .contact-info-form .font-bold {
        font-weight: 700 !important;
      }
      .contact-info-form .font-semibold {
        font-weight: 600 !important;
      }
      .contact-info-form .font-medium {
        font-weight: 500 !important;
      }
      .contact-info-form h1 {
        font-weight: 300 !important;
      }
      .contact-info-form h2,
      .contact-info-form h3,
      .contact-info-form h4 {
        font-weight: 500 !important;
      }
      
      /* Reduce input field padding and height */
      .contact-info-form input[type="text"],
      .contact-info-form input[type="email"],
      .contact-info-form input[type="tel"],
      .contact-info-form select {
        padding: 0.875rem 1.125rem !important;
        height: 3.25rem !important;
        font-size: 1rem !important;
      }
      
      /* Reduce label spacing */
      .contact-info-form label {
        margin-bottom: 0.5rem !important;
        font-size: 1rem !important;
      }
      
      /* Adjust autocomplete field height */
      .contact-info-form .address-autocomplete-field input {
        padding: 0.875rem 1.125rem !important;
        height: 3.25rem !important;
      }
    `;
    document.head.appendChild(customStyles);
    
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      if (customStyles.parentNode) {
        customStyles.parentNode.removeChild(customStyles);
      }
    };
  }, [isSafariBrowser]);

  // Fix for Chrome autofill putting state in county field
  useEffect(() => {
    fixAutofillCountyIssue(formData, setFormData);
  }, [formData.region, formData.cnty_hm, formData.mailingRegion, formData.cnty_ml]);

  // Enhanced data loading with better auto-population
  useEffect(() => {
    const loadDataFromBackend = async () => {
      setIsLoading(true);
      
      try {
        if (currentUser) {
          console.log("User authenticated, fetching contact info from backend");
          
          try {
            const response = await getContactInfo();
            
            if (response.success && response.contactInfo) {
              console.log("Successfully retrieved contact info from backend");
              
              // Auto-populate form data with backend data
              const backendData = {
                ...response.contactInfo,
                email: currentUser.email || response.contactInfo.email || ""
              };
              
              setFormData(prev => ({
                ...createInitialFormData(), // Start with clean form
                ...backendData // Overlay with backend data
              }));
              
              // Parse date of birth if it exists
              if (response.contactInfo.dateOfBirth) {
                const dateFields = parseDateOfBirth(response.contactInfo.dateOfBirth);
                setFormData(prev => ({
                  ...prev,
                  ...dateFields
                }));
              }
              
              console.log("Form auto-populated with:", Object.keys(backendData));
            } else {
              console.log("No contact info found in backend, checking initialData");
              
              // Check for initialData passed from parent
              if (initialData && Object.keys(initialData).length > 0) {
                console.log("Using initialData for auto-population");
                setFormData(prev => ({
                  ...createInitialFormData(),
                  ...initialData,
                  email: currentUser.email || initialData.email || ""
                }));
              } else {
                // Only set email from currentUser
                setFormData(prev => ({
                  ...createInitialFormData(),
                  email: currentUser.email || ""
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching contact info:", error);
            
            // Fallback to initialData or empty form
            if (initialData && Object.keys(initialData).length > 0) {
              setFormData(prev => ({
                ...createInitialFormData(),
                ...initialData,
                email: currentUser.email || initialData.email || ""
              }));
            } else {
              setFormData(prev => ({
                ...createInitialFormData(),
                email: currentUser.email || ""
              }));
            }
          }
        } else {
          console.log("User not authenticated, using initialData or empty form");
          
          if (initialData && Object.keys(initialData).length > 0) {
            setFormData(prev => ({
              ...createInitialFormData(),
              ...initialData
            }));
          } else {
            setFormData(createInitialFormData());
          }
        }
      } catch (error) {
        console.error("Error in loadDataFromBackend:", error);
        setFormData(createInitialFormData());
      } finally {
        setIsLoading(false);
        // Trigger animations after loading
        setTimeout(() => {
          setAnimationComplete(true);
        }, 100);
      }      
    };
    
    loadDataFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Parse existing dateOfBirth into separate fields when loading the component
  useEffect(() => {
    if (formData.dateOfBirth && !formData.birthMonth) {
      const dateFields = parseDateOfBirth(formData.dateOfBirth);
      setFormData(prev => ({
        ...prev,
        ...dateFields
      }));
    }
  }, [formData.dateOfBirth]);

  // Update country configuration when country changes
  useEffect(() => {
    setCountryConfig(getCountryConfig(formData.country, ENABLE_LOCALIZATION));
  }, [formData.country]);

  // Update mailing country configuration when mailing country changes
  useEffect(() => {
    setMailingCountryConfig(getCountryConfig(formData.mailingCountry, ENABLE_LOCALIZATION));
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
    
    // Clear validation results when address fields change
    if (name.includes('Address') || name.includes('City') || name.includes('Region') || name.includes('PostalCode')) {
      setValidationResults(null);
    }
    
    // Special handling for same mailing address
    if (name === 'sameMailingAddress' && value === "Yes") {
      const mailingData = handleSameMailingAddress(value, formData);
      setFormData(prev => ({
        ...prev,
        ...mailingData
      }));
    }
    
    // Special handling for date of birth fields
    if (name === 'birthMonth' || name === 'birthDay' || name === 'birthYear') {
      if (name === 'birthMonth') {
        updateCombinedDateOfBirth(value, formData.birthDay, formData.birthYear, setFormData);
      } else if (name === 'birthDay') {
        updateCombinedDateOfBirth(formData.birthMonth, value, formData.birthYear, setFormData);
      } else if (name === 'birthYear') {
        updateCombinedDateOfBirth(formData.birthMonth, formData.birthDay, value, setFormData);
      }
    }
  };

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
        updateCombinedDateOfBirth(value, formData.birthDay, formData.birthYear, setFormData);
      } else if (name === 'birthDay') {
        updateCombinedDateOfBirth(formData.birthMonth, value, formData.birthYear, setFormData);
      } else if (name === 'birthYear') {
        updateCombinedDateOfBirth(formData.birthMonth, formData.birthDay, value, setFormData);
      }
    }
  };

  const debugAddressPopulation = () => {
    console.log("🔍 CURRENT FORM STATE:");
    console.log("formData.streetAddress:", formData.streetAddress);
    console.log("formData.city:", formData.city);
    console.log("formData.region:", formData.region);
    console.log("formData.postalCode:", formData.postalCode);
    console.log("formData.country:", formData.country);
    
    console.log("🔍 DOM VALUES:");
    console.log("DOM streetAddress:", document.getElementById('streetAddress')?.value);
    console.log("DOM city:", document.getElementById('city')?.value);
    console.log("DOM region:", document.getElementById('region')?.value);
    console.log("DOM postalCode:", document.getElementById('postalCode')?.value);
    console.log("DOM country:", document.getElementById('country')?.value);
  };
  
  const handleAddressSelect = (addressData) => {
    console.log("🏠 === ADDRESS SELECT DEBUG START ===");
    console.log("🏠 Raw addressData received:", addressData);
    
    // BEFORE processing
    console.log("🏠 BEFORE - formData state:", {
      firstName: formData.firstName,
      lastName: formData.lastName, 
      city: formData.city,
      region: formData.region, 
      postalCode: formData.postalCode
    });
    
    // Only update the address-related fields, preserve everything else
    setFormData(prev => ({
      ...prev,  // Keep ALL existing form data
      streetAddress: addressData.streetAddress || addressData.formattedAddress || "",
      city: addressData.city || "",
      region: addressData.region || "",
      postalCode: addressData.postalCode || "",
      country: addressData.country || "United States",
      cnty_hm: ""  // Clear county field
    }));
    
    console.log("🏠 State update called with address data only");
    
    // Debug after state update
    setTimeout(() => {
      console.log("🏠 AFTER setState (500ms later):");
      debugAddressPopulation();
      console.log("🏠 === ADDRESS SELECT DEBUG END ===");
    }, 500);
    
    // Clear validation results and errors for address fields only
    setValidationResults(null);
    setErrors(prev => ({
      ...prev,
      streetAddress: "",
      city: "",
      cnty_hm: "",
      region: "",
      postalCode: "",
      country: ""
    }));
  };
  
  // Handler for mailing address selection from autocomplete
  const handleMailingAddressSelect = (addressData) => {
    console.log("Mailing address selected in parent component:", addressData);
    
    const processedData = processAddressData(addressData, true);
    
    // Only update mailing address fields, preserve everything else
    setFormData(prev => ({
      ...prev,  // Keep ALL existing form data
      ...processedData  // Apply only the mailing address updates
    }));
    
    // Clear validation results since address changed
    setValidationResults(null);
    
    // Manually force mailing county field to be empty if it exists in DOM
    setTimeout(() => {
      const mailingCountyField = document.getElementById('cnty_ml');
      if (mailingCountyField) {
        mailingCountyField.value = '';
      }
    }, 100);
    
    // Clear any mailing address-related errors only
    setErrors(prev => ({
      ...prev,
      mailingStreetAddress: "",
      mailingCity: "",
      cnty_ml: "",
      mailingRegion: "",
      mailingPostalCode: "",
      mailingCountry: ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check age validation first
    const age = calculateAge(formData.birthMonth, formData.birthDay, formData.birthYear);
    if (age !== null && age < 18) {
      setShowAgeOverlay(true);
      return;
    }
    
    // Force sync form data immediately from the DOM
    const updatedData = syncFormDataFromDOM(formData);
    
    // Basic form validation first
    const validationErrors = validateContactForm(updatedData, countryConfig, mailingCountryConfig);
    
    // Stop if basic validation fails
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      applyErrorStyling(validationErrors);
      console.error("Form validation failed with errors:", validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("💾 Contact info submission started");
      
      // Check authentication
      if (!currentUser || !currentUser.uid) {
        throw new Error("You must be logged in to save contact information. Please refresh and try again.");
      }
      
      let finalFormData = updatedData;
      
      // Step 1: Validate addresses with PostGrid if enabled
      if (ENABLE_ADDRESS_VALIDATION) {
        console.log("📮 Validating addresses with PostGrid...");
        setIsValidatingAddresses(true);
        
        try {
          const addressValidation = await addressValidationService.validateFormAddresses(updatedData);
          
          // DON'T set validation results to state - this was causing the UI flash
          // setValidationResults(addressValidation); // REMOVED THIS LINE
          
          if (addressValidation.hasErrors) {
            // Show error popup for validation issues
            const userWantsToContinue = window.confirm(
              `Address validation found issues:\n${addressValidation.errors.join('\n')}\n\nDo you want to continue anyway?`
            );
            
            if (!userWantsToContinue) {
              setIsSubmitting(false);
              setIsValidatingAddresses(false);
              return;
            }
          }
          
          // Apply any corrected addresses silently
          finalFormData = addressValidationService.applyCorrectedAddresses(updatedData, addressValidation);
          
          // Show user what was corrected if any corrections were made (optional popup)
          if (addressValidation.homeAddress?.correctedAddress || addressValidation.mailingAddress?.correctedAddress) {
            const corrections = [];
            if (addressValidation.homeAddress?.correctedAddress) {
              corrections.push('Home address was corrected for better delivery');
            }
            if (addressValidation.mailingAddress?.correctedAddress) {
              corrections.push('Mailing address was corrected for better delivery');
            }
            
            // Optional: You can remove this alert too if you want it completely silent
            alert(`Address validation complete:\n${corrections.join('\n')}`);
          }
          
          console.log("✅ Address validation completed successfully");
          
        } catch (validationError) {
          console.warn("Address validation failed, continuing with original addresses:", validationError);
          // Continue with original addresses if validation fails
        } finally {
          setIsValidatingAddresses(false);
        }
      }
      
      // Step 2: Save form data
      console.log("💾 Saving contact info to backend...");
      const saveResult = await saveContactInfo(finalFormData);
      
      if (!saveResult) {
        throw new Error("Server error while saving contact information.");
      }
      
      console.log("✅ Contact info saved successfully!");
      
      // Step 3: Proceed to next step
      if (onNext) {
        const success = await onNext(finalFormData);
        if (!success) {
          throw new Error("Failed to proceed to next step");
        }
      } else {
        console.warn("No onNext handler provided");
      }
      
    } catch (error) {
      console.error('❌ Error saving contact info:', error);
      alert(error.message || "Failed to save contact information. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    console.log("ContactInfoPage: Handle back button clicked");
    
    // Call the onBack prop if provided
    if (typeof onBack === 'function') {
      console.log("Calling parent onBack handler");
      onBack();
    } else {
      console.warn("No onBack handler provided");
    }
  };

  const handleAgeOverlayClose = () => {
    setShowAgeOverlay(false);
    // Reset the date fields
    setFormData(prev => ({
      ...prev,
      birthMonth: "",
      birthDay: "",
      birthYear: "",
      dateOfBirth: ""
    }));
  };

  if (isLoading) {
    return (
      <DelayedCenteredLoader 
          message="Loading your information..." 
          size="md" 
          color="primary" 
          minHeight="200px"
          delay={5000}  // 5 seconds
        />
    );
  }

  return (
    <div className="w-full" style={{
      width: '100vw',
      marginLeft: 'calc(-50vw + 50%)',
      marginRight: 'calc(-50vw + 50%)',
      position: 'relative'
    }}>
      {/* Simple Age Overlay */}
      {showAgeOverlay && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg mx-4 border">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Age Requirement</h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-base">
                You must be at least 18 years old to register. If you're interested otherwise, please contact our support team at{" "}
                <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline font-medium">
                  info@alcor.org
                </a>{" "}
                or call{" "}
                <a href="tel:8005551234" className="text-[#775684] hover:underline font-medium">
                623-552-4338
                </a>.
              </p>
              <button
                onClick={handleAgeOverlayClose}
                className="bg-[#775684] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#664573] transition-colors text-base"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
{/* Container that uses 80% of viewport width on desktop, full width on mobile */}
<div className="w-full mx-auto px-5 sm:px-6 lg:px-8 lg:max-w-[80%]">
  <form onSubmit={handleSubmit} className="w-full contact-info-form" autoComplete="on">

      {/* Personal Information */}
      <div 
        className={`bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-full ${
          animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{
          transition: 'all 0.5s ease-in-out',
          transitionDelay: '0ms',
          transform: animationComplete ? 'translateY(0)' : 'translateY(2rem)',
          opacity: animationComplete ? 1 : 0
        }}
      >
        <div className="p-6 md:p-9">
          <div className="mb-8 md:mb-9 flex items-start">
            <IconBox>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </IconBox>
            <div className="ml-4 pt-0.5">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Personal Information</h2>
              <p className="text-xs md:text-sm text-gray-500 italic font-light mt-0.5">
                Please provide your personal details for your member file.
              </p>
            </div>
          </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pb-6">
                <div>
                  <LabelWithIcon label="First Name" required={true} />
                  <InputField
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.firstName}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Last Name" required={true} />
                  <InputField
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.lastName}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Sex" required={true} />
                  <SelectField
                    id="sex"
                    name="sex"
                    autoComplete="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.sex}
                  >
                    <option value="" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>--Select--</option>
                    <option value="Male" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Male</option>
                    <option value="Female" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Female</option>
                    <option value="Other" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Other</option>
                  </SelectField>
                </div>
                
                <div>
                  <LabelWithIcon label="Email" required={true} />
                  <InputField
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting || (currentUser && currentUser.email)}
                    required={true}
                    error={errors.email}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Preferred Phone Number" required={true} />
                  <SelectField
                    id="phoneType"
                    name="phoneType"
                    autoComplete="tel-type"
                    value={formData.phoneType}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.phoneType}
                  >
                    <option value="" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>--Select--</option>
                    <option value="Home" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Home</option>
                    <option value="Work" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Work</option>
                    <option value="Mobile" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Mobile</option>
                  </SelectField>
                </div>
                
                <div>
                  <LabelWithIcon label="Mobile Phone" required={formData.phoneType === "Mobile"} />
                  <InputField
                    id="mobilePhone"
                    name="mobilePhone"
                    type="tel"
                    autoComplete="tel-mobile"
                    value={formData.mobilePhone}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={formData.phoneType === "Mobile"}
                    error={errors.mobilePhone}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Work Phone" required={formData.phoneType === "Work"} />
                  <InputField
                    id="workPhone"
                    name="workPhone"
                    type="tel"
                    autoComplete="tel-work"
                    value={formData.workPhone}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={formData.phoneType === "Work"}
                    error={errors.workPhone}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Home Phone" required={formData.phoneType === "Home"} />
                  <InputField
                    id="homePhone"
                    name="homePhone"
                    type="tel"
                    autoComplete="tel-home"
                    value={formData.homePhone}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={formData.phoneType === "Home"}
                    error={errors.homePhone}
                  />
                </div>
                
                <DateOfBirthFields
                  birthMonth={formData.birthMonth}
                  birthDay={formData.birthDay}
                  birthYear={formData.birthYear}
                  onChange={handleChange}
                  onInput={handleInput}
                  disabled={isSubmitting}
                  errors={errors}
                />
                
                {/* Hidden field to store the combined date */}
                <input 
                  type="hidden" 
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ""}
                />
              </div>
            </div>
          </div>
          
{/* Address Information */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 w-full">
  <div className="p-6 md:p-9">
    <div className="mb-8 md:mb-9 flex items-start">
    <IconBox>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
</IconBox>
      <div className="ml-4 pt-0.5">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">Address Information</h2>
        <p className="text-xs md:text-sm text-gray-500 italic font-light mt-0.5">
          Start typing to search with Google Places. Addresses will be validated when you continue.
        </p>
      </div>
    </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pb-6">
                {/* Home address with Google Places Autocomplete */}
                <div className="md:col-span-2">
                  <div className="address-autocomplete-field">
                    <AddressAutocompleteV3
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
                  <InputField
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.city}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label={countryConfig.regionLabel} required={true} />
                  <InputField
                    id="region"
                    name="region"
                    autoComplete="address-level1"
                    value={formData.region}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.region}
                  />
                </div>

                <div>
                  <LabelWithIcon label={countryConfig.countyLabel} required={isCountyRequired} />
                  <InputField
                    id="cnty_hm"
                    name="cnty_hm"
                    autoComplete="off"
                    value={formData.cnty_hm || ""}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={isCountyRequired}
                    error={errors.cnty_hm}
                    onFocus={() => {
                      if (formData.cnty_hm === formData.region) {
                        document.getElementById('cnty_hm').value = '';
                        setFormData(prev => ({...prev, cnty_hm: ""}));
                      }
                    }}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label={countryConfig.postalCodeLabel} required={true} />
                  <InputField
                    id="postalCode"
                    name="postalCode"
                    autoComplete="postal-code"
                    value={formData.postalCode}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.postalCode}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Country" required={true} />
                  <CountrySelect
                    id="country"
                    name="country"
                    autoComplete="country"
                    value={formData.country}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.country}
                  />
                </div>
                
                <div>
                  <LabelWithIcon label="Same Mailing Address" required={true} />
                  <SelectField
                    id="sameMailingAddress"
                    name="sameMailingAddress"
                    value={formData.sameMailingAddress}
                    onChange={handleChange}
                    onInput={handleInput}
                    disabled={isSubmitting}
                    required={true}
                    error={errors.sameMailingAddress}
                  >
                    <option value="" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>--Select--</option>
                    <option value="Yes" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>Yes</option>
                    <option value="No" style={{backgroundColor: "#FFFFFF", color: "#333333"}}>No</option>
                  </SelectField>
                </div>
              </div>
              
              {/* Mailing address fields - conditionally shown */}
              {showMailingAddress && (
                <div className="mt-9 pt-8 border-t border-gray-200">
                  <div className="mb-8 flex items-start">
                  <IconBox>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
</IconBox>
                    <div className="ml-4 pt-0.5">
                      <h3 className="text-base md:text-lg font-semibold text-gray-800">Mailing Address</h3>
                      <p className="text-xs md:text-sm text-gray-500 italic font-light mt-0.5">
                        Please provide the address where you would like to receive mail.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pb-6">
                    <div className="md:col-span-2">
                      <div className="address-autocomplete-field">
                        <AddressAutocompleteV3
                          id="mailingStreetAddress"
                          name="mailingStreetAddress"
                          label="Mailing Address"
                          defaultValue={formData.mailingStreetAddress}
                          onAddressSelect={handleMailingAddressSelect}
                          required={true}
                          disabled={isSubmitting}
                          errorMessage={errors.mailingStreetAddress}
                          placeholder="Start typing your mailing address..."
                          isError={!!errors.mailingStreetAddress}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <LabelWithIcon label="City" required={true} />
                      <InputField
                        id="mailingCity"
                        name="mailingCity"
                        autoComplete="shipping address-level2"
                        value={formData.mailingCity}
                        onChange={handleChange}
                        onInput={handleInput}
                        disabled={isSubmitting}
                        required={showMailingAddress}
                        error={errors.mailingCity}
                      />
                    </div>

                    <div>
                      <LabelWithIcon label={mailingCountryConfig.regionLabel} required={true} />
                      <InputField
                        id="mailingRegion"
                        name="mailingRegion"
                        autoComplete="shipping address-level1"
                        value={formData.mailingRegion}
                        onChange={handleChange}
                        onInput={handleInput}
                        disabled={isSubmitting}
                        required={showMailingAddress}
                        error={errors.mailingRegion}
                      />
                    </div>

                    <div>
                      <LabelWithIcon label={mailingCountryConfig.countyLabel} required={isMailingCountyRequired} />
                      <InputField
                        id="cnty_ml"
                        name="cnty_ml"
                        autoComplete="off"
                        value={formData.cnty_ml || ""}
                        onChange={handleChange}
                        onInput={handleInput}
                        disabled={isSubmitting}
                        required={showMailingAddress && isMailingCountyRequired}
                        error={errors.cnty_ml}
                        onFocus={() => {
                          if (formData.cnty_ml === formData.mailingRegion) {
                            document.getElementById('cnty_ml').value = '';
                            setFormData(prev => ({...prev, cnty_ml: ""}));
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <LabelWithIcon label={mailingCountryConfig.postalCodeLabel} required={true} />
                      <InputField
                        id="mailingPostalCode"
                        name="mailingPostalCode"
                        autoComplete="shipping postal-code"
                        value={formData.mailingPostalCode}
                        onChange={handleChange}
                        onInput={handleInput}
                        disabled={isSubmitting}
                        required={showMailingAddress}
                        error={errors.mailingPostalCode}
                      />
                    </div>
                    
                    <div>
                      <LabelWithIcon label="Country" required={true} />
                      <CountrySelect
                        id="mailingCountry"
                        name="mailingCountry"
                        autoComplete="shipping country"
                        value={formData.mailingCountry}
                        onChange={handleChange}
                        onInput={handleInput}
                        disabled={isSubmitting}
                        required={showMailingAddress}
                        error={errors.mailingCountry}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 mb-6 md:mb-6 pb-[150px] md:pb-0 w-full">
            <SecondaryButton
              onClick={handleBack}
              disabled={isSubmitting}
              showArrow={true}
              arrowDirection="left"
            >
              Back
            </SecondaryButton>
            
            <PrimaryButton
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText={isValidatingAddresses ? 'Validating Addresses...' : 'Processing...'}
            >
              Continue
            </PrimaryButton>
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