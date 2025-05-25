// File: pages/ContactInfoPage.jsx
import React, { useState, useEffect } from "react";

// Context
import { useUser } from "../../contexts/UserContext";

// Firebase services
import { saveContactInfo, getContactInfo } from "../../services/contact";

// Components
import AddressAutocomplete from "../AddressAutocomplete";
import AddressAutocompleteV2 from '../AddressAutocompleteV2';
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


// Feature flag for enabling country-specific form localization
const ENABLE_LOCALIZATION = import.meta.env.VITE_ENABLE_LOCALIZATION === 'true';

// Help content for contact info page
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

export default function ContactInfoPage({ onNext, onBack, initialData }) {
  const { currentUser } = useUser();
  const [isSafariBrowser, setIsSafariBrowser] = useState(false);
  
  // Help panel state
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState(createInitialFormData());
  const [errors, setErrors] = useState(createInitialErrors());

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

  // Toggle help panel
  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };

  // Detect Safari browser and apply styles on initial render
  useEffect(() => {
    setIsSafariBrowser(isSafari());
    
    console.log("API Key Available:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "Yes" : "No");
    console.log("API Key first 5 chars:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 5) + "...");
    console.log("Browser detected as Safari:", isSafariBrowser);
    
    const styleElement = applyContactFormStyles();
    
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [isSafariBrowser]);

  // Fix for Chrome autofill putting state in county field
  useEffect(() => {
    fixAutofillCountyIssue(formData, setFormData);
  }, [formData.region, formData.cnty_hm, formData.mailingRegion, formData.cnty_ml]);

// Replace the entire loadDataFromBackend useEffect with this:

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
            
            setFormData(prev => ({
              ...prev,
              ...response.contactInfo,
              email: currentUser.email || response.contactInfo.email || ""
            }));
            
            // Parse date of birth if it exists
            if (response.contactInfo.dateOfBirth) {
              const dateFields = parseDateOfBirth(response.contactInfo.dateOfBirth);
              setFormData(prev => ({
                ...prev,
                ...dateFields
              }));
            }
          } else {
            console.log("No contact info found in backend, using empty form");
            
            // FIXED: Only set email from currentUser, nothing else
            setFormData(prev => ({
              ...createInitialFormData(), // Fresh empty form
              email: currentUser.email || ""
            }));
          }
        } catch (error) {
          console.error("Error fetching contact info:", error);
          
          // FIXED: On error, use empty form too
          setFormData(prev => ({
            ...createInitialFormData(), // Fresh empty form
            email: currentUser.email || ""
          }));
        }
      } else {
        console.log("User not authenticated, using empty form");
        
        // FIXED: No user = completely empty form
        setFormData(createInitialFormData());
      }
    } catch (error) {
      console.error("Error in loadDataFromBackend:", error);
      
      // FIXED: Any error = empty form
      setFormData(createInitialFormData());
    } finally {
      setIsLoading(false);
    }
  };
  
  loadDataFromBackend();
}, [currentUser]); // FIXED: Remove initialData dependency completely

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
        updateCombinedDateOfBirth(value, formData.birthDay, formData.birthYear, setFormData);
      } else if (name === 'birthDay') {
        updateCombinedDateOfBirth(formData.birthMonth, value, formData.birthYear, setFormData);
      } else if (name === 'birthYear') {
        updateCombinedDateOfBirth(formData.birthMonth, formData.birthDay, value, setFormData);
      }
    }
  };
  
  // Handler for address selection from autocomplete
  const handleAddressSelect = (addressData) => {
    console.log("Address selected in parent component:", addressData);
    
    const processedData = processAddressData(addressData, false);
    setFormData(prev => ({
      ...prev,
      ...processedData
    }));
    
    // Manually force county field to be empty if it exists in DOM
    setTimeout(() => {
      const countyField = document.getElementById('cnty_hm');
      if (countyField) {
        countyField.value = '';
      }
    }, 100);
    
    // Clear any address-related errors
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
    setFormData(prev => ({
      ...prev,
      ...processedData
    }));
    
    // Manually force mailing county field to be empty if it exists in DOM
    setTimeout(() => {
      const mailingCountyField = document.getElementById('cnty_ml');
      if (mailingCountyField) {
        mailingCountyField.value = '';
      }
    }, 100);
    
    // Clear any mailing address-related errors
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
    
    // Force sync form data immediately from the DOM
    const updatedData = syncFormDataFromDOM(formData);
    
    // Validate with updated data
    const validationErrors = validateContactForm(updatedData, countryConfig, mailingCountryConfig);
    
    // Stop if any errors found
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      applyErrorStyling(validationErrors);
      console.error("Form validation failed with errors:", validationErrors);
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
      
      // Save form data
      const saveResult = await saveContactInfo(updatedData);
      
      if (!saveResult) {
        throw new Error("Server error while saving contact information.");
      }
      
      console.log("✅ Contact info saved successfully!");
      
      // Call the onNext callback provided by the parent component
      if (onNext) {
        const success = await onNext(updatedData);
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
                {/* Home address with Google Places Autocomplete */}
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