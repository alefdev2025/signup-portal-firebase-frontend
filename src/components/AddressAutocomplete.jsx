// First, install the required package:
// npm install --save @react-google-maps/api

// File: components/AddressAutocomplete.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';

// Define libraries we need
const libraries = ['places'];

// Custom styles for the Google Places autocomplete dropdown
const autocompleteStyles = `
  .pac-container {
    border-radius: 8px;
    margin-top: 5px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    border: 1px solid rgba(229, 231, 235, 1) !important;
    background-color: white;
    font-family: inherit;
  }
  
  .pac-item {
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    border-top: 1px solid rgba(229, 231, 235, 0.7) !important;
  }
  
  .pac-item:hover {
    background-color: rgba(243, 244, 246, 1);
  }
  
  .pac-item-query {
    font-size: 14px;
    color: rgba(17, 24, 39, 1);
  }
  
  .pac-icon {
    display: none;
  }
  
  .pac-logo:after {
    margin-right: 8px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    height: 18px;
    background-size: 50px 14px;
    opacity: 0.6;
  }
  
  .pac-matched {
    font-weight: 600;
    color: rgba(79, 70, 229, 1);
  }
`;

const AddressAutocomplete = ({ 
  onAddressSelect, 
  defaultValue = '', 
  placeholder = 'Enter your address', 
  className,
  disabled = false,
  required = false,
  label = 'Address',
  id = 'street-address',
  name = 'streetAddress',
  errorMessage = ''
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  
  // Get API key - for Vite, use import.meta.env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Load the Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });
  
  console.log("Google Maps API loaded:", isLoaded);
  console.log("Google Maps API key exists:", apiKey ? "Yes" : "No");
  
  if (loadError) {
    console.error("Google Maps loading error:", loadError);
  }

  // Add custom styles to document head
  useEffect(() => {
    if (!isLoaded) return;
    
    // Add custom styles to head
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(autocompleteStyles));
    document.head.appendChild(styleElement);
    
    return () => {
      // Clean up on unmount
      document.head.removeChild(styleElement);
    };
  }, [isLoaded]);

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;
    
    // Initialize Google autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry'],
      componentRestrictions: { country: ['us', 'ca'] }, // Restrict to US and Canada - remove or modify as needed
    });
    
    // Add listener for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      console.log("Google Places selected address:", place);
      
      if (!place.geometry) {
        console.log("No location data for this place");
        return;
      }
      
      // Extract address components
      const addressComponents = {};
      
      place.address_components.forEach(component => {
        const type = component.types[0];
        
        // Map address components to our form fields
        switch (type) {
          case 'street_number':
            addressComponents.streetNumber = component.long_name;
            break;
          case 'route':
            addressComponents.street = component.long_name;
            break;
          case 'locality':
            addressComponents.city = component.long_name;
            break;
          case 'administrative_area_level_1':
            addressComponents.region = component.long_name;
            addressComponents.regionShort = component.short_name;
            break;
          case 'country':
            addressComponents.country = component.long_name;
            break;
          case 'postal_code':
            addressComponents.postalCode = component.long_name;
            break;
          default:
            break;
        }
      });
      
      // Create a formatted street address if both parts are available
      if (addressComponents.streetNumber && addressComponents.street) {
        addressComponents.streetAddress = `${addressComponents.streetNumber} ${addressComponents.street}`;
      }
      
      // Pass the selected address data to the parent component
      onAddressSelect({
        formattedAddress: place.formatted_address,
        ...addressComponents,
        coordinates: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
      });
      
      // Update input value
      setInputValue(place.formatted_address);
    });
    
    // Cleanup function to remove event listeners
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onAddressSelect]);
  
  // Handle manual input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };
  
  if (loadError) {
    return <div>Error loading Google Maps API: {loadError.message}</div>;
  }
  
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-gray-800 text-lg font-medium mb-2">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={!isLoaded || disabled}
          className={`w-full px-4 py-5 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg ${className}`}
          required={required}
        />
        {isLoaded && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
      {!isLoaded && <p className="text-sm text-gray-500 mt-1">Loading address suggestions...</p>}
    </div>
  );
};

export default AddressAutocomplete;
