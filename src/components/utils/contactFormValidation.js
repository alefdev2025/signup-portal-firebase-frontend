import { isCountyRequiredForCountry } from './contactCountryConfig';

// Validation function
export const validateContactForm = (formData, countryConfig, mailingCountryConfig) => {
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
  const isCountyRequired = isCountyRequiredForCountry(formData.country, countryConfig);
  if (isCountyRequired && !formData.cnty_hm) {
    newErrors.cnty_hm = 'Required field';
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
    const isMailingCountyRequired = isCountyRequiredForCountry(formData.mailingCountry, mailingCountryConfig);
    if (isMailingCountyRequired && !formData.cnty_ml) {
      newErrors.cnty_ml = 'Required field';
    }
  }
  
  // Email validation
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Please enter a valid email address';
  }
  
  return newErrors;
};

// Apply visual styling to error fields
export const applyErrorStyling = (errors) => {
  setTimeout(() => {
    Object.keys(errors).forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.style.border = "2px solid #dc2626";
        element.style.backgroundColor = "#fef2f2";
      }
    });
    
    // Scroll to first error if any
    if (Object.keys(errors).length > 0) {
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 100);
};

// Sync form data from DOM
export const syncFormDataFromDOM = (formData) => {
  const form = document.querySelector('form');
  const updatedData = {...formData};
  
  // Get all form inputs
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    if (input.name && input.value) {
      updatedData[input.name] = input.value;
    }
  });
  
  return updatedData;
};
