// File: utils/browserUtils.js

// Detect if browser is Safari
export const isSafari = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1;
  };
  
  // Apply custom styles for form compatibility
  export const applyFormStyles = () => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = `
      /* Override styles for form inputs - Simplified for better autofill compatibility */
      input, select, textarea {
        background-color: #FFFFFF !important;
        font-size: 1.125rem !important;
        height: 4rem !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        padding-left: 2rem !important;
        padding-right: 2rem !important;
        border-radius: 0.375rem !important;
        border-color: rgba(119, 86, 132, 0.3) !important;
        box-sizing: border-box !important;
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      
      @media (min-width: 768px) {
        input, select, textarea {
          max-width: 100% !important;
        }
      }
      
      /* Make address autocomplete field have same width as other fields */
      .address-autocomplete-field {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      @media (min-width: 768px) {
        .address-autocomplete-field {
          max-width: 100% !important;
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
        height: 4rem;
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
    
    return styleElement;
  };
  
  // Fix for Chrome autofill putting state in county field
  export const fixAutofillCountyIssue = (formData, setFormData) => {
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
  };