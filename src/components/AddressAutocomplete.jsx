// Updated component with fixed address mapping
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
    padding: 8px 0;
  }
  
  .pac-item {
    padding: 10px 12px;
    font-size: 16px;
    cursor: pointer;
    border-top: 1px solid rgba(229, 231, 235, 0.7) !important;
    line-height: 1.5;
  }
  
  .pac-item:hover {
    background-color: rgba(243, 244, 246, 1);
  }
  
  .pac-item-query {
    font-size: 16px;
    color: rgba(17, 24, 39, 1);
    font-weight: 500;
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
    color: #775684 !important; /* Updated to purple color */
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
      
      // Debug log to see all components
      console.log("All address components:", place.address_components);
      
      // Log each component with its types for debugging
      place.address_components.forEach(component => {
        console.log(`Component "${component.long_name}" has types:`, component.types);
      });
      
      // First get all the components we need
      let streetNumber = null;
      let route = null;
      let locality = null; 
      let sublocality = null;
      let neighborhood = null;
      let county = null;
      let state = null;
      let country = null;
      let postalCode = null;
      
      // Categorize each component
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          streetNumber = component;
          console.log("Found street number:", component.long_name);
        }
        
        if (types.includes('route')) {
          route = component;
          console.log("Found route:", component.long_name);
        }
        
        if (types.includes('locality')) {
          locality = component;
          console.log("Found locality:", component.long_name);
        }
        
        if (types.includes('sublocality')) {
          sublocality = component;
          console.log("Found sublocality:", component.long_name);
        }
        
        if (types.includes('neighborhood')) {
          neighborhood = component;
          console.log("Found neighborhood:", component.long_name);
        }
        
        if (types.includes('administrative_area_level_2')) {
          county = component;
          console.log("Found county (administrative_area_level_2):", component.long_name);
        }
        
        if (types.includes('administrative_area_level_1')) {
          state = component;
          console.log("Found state (administrative_area_level_1):", component.long_name);
        }
        
        if (types.includes('country')) {
          country = component;
          console.log("Found country:", component.long_name);
        }
        
        if (types.includes('postal_code')) {
          postalCode = component;
          console.log("Found postal code:", component.long_name);
        }
      });
      
      // Now build the addressComponents object
      if (streetNumber) {
        addressComponents.streetNumber = streetNumber.long_name;
      }
      
      if (route) {
        addressComponents.street = route.long_name;
      }
      
      // City - try locality first, then sublocality, then neighborhood
      if (locality) {
        addressComponents.city = locality.long_name;
      } else if (sublocality) {
        addressComponents.city = sublocality.long_name;
      } else if (neighborhood) {
        addressComponents.city = neighborhood.long_name;
      }
      
      // County - administrative_area_level_2
      if (county) {
        addressComponents.county = county.long_name;
      } else {
        // If no county was found, explicitly set it to empty
        addressComponents.county = '';
        console.log("No county component found");
      }
      
      // State/Province/Region - administrative_area_level_1
      if (state) {
        addressComponents.region = state.long_name;
        addressComponents.regionShort = state.short_name;
      }
      
      // Country
      if (country) {
        addressComponents.country = country.long_name;
      }
      
      // Postal code
      if (postalCode) {
        addressComponents.postalCode = postalCode.long_name;
      }
      
      // Create a formatted street address if both parts are available
      if (streetNumber && route) {
        addressComponents.streetAddress = `${streetNumber.long_name} ${route.long_name}`;
      } else if (place.formatted_address) {
        // Fallback to formatted_address if components aren't available
        addressComponents.streetAddress = place.formatted_address;
      }
      
      console.log("Final processed address components:", addressComponents);
      
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
      <div className="relative w-full">
        <input
          id={id}
          name={name}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={!isLoaded || disabled}
          className={`w-full px-4 py-5 pr-12 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg ${className}`}
          required={required}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#775684]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      {errorMessage && <p className="text-red-500 text-sm mt-1">{errorMessage}</p>}
      {!isLoaded && <p className="text-sm text-gray-500 mt-1">Loading address suggestions...</p>}
    </div>
  );
};

export default AddressAutocomplete;