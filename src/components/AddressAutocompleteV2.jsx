// AddressAutocompleteV2.jsx
import React, { useState, useEffect, useRef } from 'react';

const AddressAutocompleteV2 = ({ 
  onAddressSelect, 
  defaultValue = '', 
  placeholder = 'Enter your address', 
  className = '',
  disabled = false,
  required = false,
  label = 'Address',
  id = 'street-address',
  name = 'streetAddress',
  errorMessage = '',
  isError = false
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  
  // Get API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Load the Google Maps script
  useEffect(() => {
    if (!apiKey || scriptLoadedRef.current) return;
    
    const loadGoogleMapsScript = () => {
      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) {
        scriptLoadedRef.current = true;
        initializePlacesIfReady();
        return;
      }
      
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializePlacesIfReady();
      };
      document.head.appendChild(script);
    };
    
    loadGoogleMapsScript();
  }, [apiKey]);
  
  // Initialize autocomplete when input is ready and script is loaded
  const initializePlacesIfReady = () => {
    if (!scriptLoadedRef.current || !inputRef.current) return;
    
    try {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id']
      });
      
      // Add listener for place selection
      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      
      console.log("Google Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error);
    }
  };
  
  // Initialize once the input ref is available
  useEffect(() => {
    initializePlacesIfReady();
    
    // Cleanup on unmount
    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [inputRef.current]);
  
  // Update the input value when defaultValue changes
  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
    }
  }, [defaultValue]);
  
  // Handle place selection
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;
    
    const place = autocompleteRef.current.getPlace();
    
    // If no place data available, use the input value
    if (!place || !place.address_components) {
      onAddressSelect({
        streetAddress: inputValue,
        formattedAddress: inputValue,
        cnty_hm: '',
        city: '',
        region: '',
        postalCode: '',
        country: 'United States'
      });
      return;
    }
    
    console.log("Place selected:", place);
    
    // Extract address components
    const addressComponents = {
      streetNumber: '',
      street: '',
      city: '',
      cnty_hm: '',
      region: '',
      regionShort: '',
      country: 'United States',
      postalCode: ''
    };
    
    // Process address components
    place.address_components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      }
      
      if (types.includes('route')) {
        addressComponents.street = component.long_name;
      }
      
      if (types.includes('locality')) {
        addressComponents.city = component.long_name;
      } else if (types.includes('sublocality_level_1') && !addressComponents.city) {
        addressComponents.city = component.long_name;
      } else if (types.includes('neighborhood') && !addressComponents.city) {
        addressComponents.city = component.long_name;
      }
      
      if (types.includes('administrative_area_level_2')) {
        addressComponents.cnty_hm = component.long_name;
      }
      
      if (types.includes('administrative_area_level_1')) {
        addressComponents.region = component.long_name;
        addressComponents.regionShort = component.short_name;
      }
      
      if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
      
      if (types.includes('postal_code')) {
        addressComponents.postalCode = component.long_name;
      }
    });
    
    // Create street address
    if (addressComponents.streetNumber && addressComponents.street) {
      addressComponents.streetAddress = `${addressComponents.streetNumber} ${addressComponents.street}`;
    } else {
      addressComponents.streetAddress = place.formatted_address || inputValue;
    }
    
    // Make sure county is not the same as region
    if (addressComponents.cnty_hm === addressComponents.region) {
      addressComponents.cnty_hm = '';
    }
    
    // Update input value
    setInputValue(place.formatted_address || inputValue);
    
    // Pass the data to the parent component
    onAddressSelect({
      formattedAddress: place.formatted_address || inputValue,
      ...addressComponents,
      coordinates: place.geometry ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      } : null
    });
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // If input is cleared, reset address data
    if (!e.target.value) {
      onAddressSelect({
        streetAddress: '',
        formattedAddress: '',
        cnty_hm: '',
        city: '',
        region: '',
        postalCode: '',
        country: 'United States'
      });
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-1">
        <span className="block text-gray-800 text-lg md:text-xl font-medium mb-3">
          {label} {required && '*'}
        </span>
      </div>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`w-full h-16 pl-8 pr-10 py-3 bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg ${isError ? 'border-red-600' : 'border-[#775684]/30'} ${className}`}
          style={{
            backgroundColor: '#FFFFFF',
            height: '4rem',
            borderColor: isError ? '#dc2626' : 'rgba(119, 86, 132, 0.3)'
          }}
          disabled={disabled}
          required={required}
          autoComplete="address-line1"
          aria-label={label}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#775684]" style={{ pointerEvents: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default AddressAutocompleteV2;