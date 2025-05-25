// File: components/AddressAutocompleteV3.jsx
// Simplified version - focuses on working with React properly
import React, { useState, useEffect, useRef } from 'react';

// Custom styles for Google Places dropdown
const autocompleteStyles = `
  .pac-container {
    border-radius: 8px;
    margin-top: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(119, 86, 132, 0.3);
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 9999;
  }
  
  .pac-item {
    padding: 12px 14px;
    font-size: 16px !important;
    line-height: 1.5;
    cursor: pointer;
  }
  
  .pac-item:hover {
    background-color: rgba(243, 244, 246, 1);
  }
  
  .pac-item-selected {
    background-color: rgba(243, 244, 246, 1);
  }
  
  .pac-item-query {
    font-size: 18px !important;
    font-weight: 500;
    color: #333333;
  }
  
  .pac-matched {
    font-weight: 600;
    color: #775684 !important;
  }
  
  .pac-secondary-text {
    font-size: 16px !important;
    color: rgba(107, 114, 128, 1);
  }
`;

const AddressAutocompleteV3 = ({
  id,
  name,
  label,
  defaultValue = "",
  onAddressSelect,
  required = false,
  disabled = false,
  errorMessage = "",
  placeholder = "Start typing your address...",
  isError = false,
  className = ""
}) => {
  // State management
  const [inputValue, setInputValue] = useState(defaultValue);
  
  // Refs
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  
  // API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Add custom styles
  useEffect(() => {
    if (!document.getElementById('google-places-custom-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'google-places-custom-styles';
      styleElement.innerHTML = autocompleteStyles;
      document.head.appendChild(styleElement);
    }
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will not work.');
      return;
    }

    if (scriptLoadedRef.current || window.google?.maps?.places) {
      if (window.google?.maps?.places) {
        scriptLoadedRef.current = true;
        initializePlaces();
      }
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      // Script already exists, wait for it to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogleMaps);
          scriptLoadedRef.current = true;
          initializePlaces();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      initializePlaces();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
  }, [apiKey]);

  // Initialize Places Autocomplete
  const initializePlaces = () => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'place_id',
          'types'
        ]
      });

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      console.log("Google Places Autocomplete initialized successfully");
    } catch (error) {
      console.error("Error initializing Google Places:", error);
    }
  };

  // Re-initialize when input ref changes
  useEffect(() => {
    if (scriptLoadedRef.current && inputRef.current) {
      initializePlaces();
    }

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [inputRef.current]);

  // Update input value when defaultValue changes (fixes auto-population)
  useEffect(() => {
    console.log("AddressAutocomplete: defaultValue changed to:", defaultValue);
    setInputValue(defaultValue || "");
  }, [defaultValue]);

  // Handle place selection from Google Places
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    console.log("Place selected:", place);

    if (!place || !place.address_components) {
      console.warn("No place data available");
      return;
    }

    const addressData = parseGooglePlaceData(place);
    setInputValue(addressData.formattedAddress);

    console.log("✅ Parsed address data:", addressData);

    // Call parent callback with parsed address data
    if (onAddressSelect) {
      console.log("🚀 Calling onAddressSelect with:", addressData);
      onAddressSelect(addressData);
    }
  };

  // Parse Google Places data into our format
  const parseGooglePlaceData = (place) => {
    const components = {};
    
    place.address_components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        components.route = component.long_name;
      }
      if (types.includes('locality')) {
        components.city = component.long_name;
      } else if (types.includes('sublocality_level_1') && !components.city) {
        components.city = component.long_name;
      }
      if (types.includes('administrative_area_level_2')) {
        components.county = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        // FIXED: Use short_name for region to match your form expectations
        components.region = component.short_name;  // e.g., "WA"
        components.regionShort = component.short_name;  // e.g., "WA" 
        components.regionLong = component.long_name;   // e.g., "Washington"
      }
      if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      }
      if (types.includes('country')) {
        components.country = component.long_name;
      }
    });

    const streetAddress = [components.streetNumber, components.route]
      .filter(Boolean)
      .join(' ');

    const result = {
      formattedAddress: place.formatted_address,
      streetAddress: streetAddress || place.formatted_address,
      city: components.city || '',
      cnty_hm: '', // Always empty - we don't auto-fill county to avoid confusion
      region: components.region || '',
      regionLong: components.regionLong || '',
      postalCode: components.postalCode || '',
      country: components.country || 'United States',
      placeId: place.place_id,
      geometry: place.geometry
    };

    console.log("📍 Address components parsed:", {
      streetNumber: components.streetNumber,
      route: components.route,
      city: components.city,
      region: components.region, // This should be "WA" not "Washington"
      postalCode: components.postalCode,
      country: components.country,
      cnty_hm: components.county // Will be cleared
    });

    return result;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // If input is cleared, reset address data
    if (!value && onAddressSelect) {
      const emptyData = {
        streetAddress: '',
        formattedAddress: '',
        city: '',
        cnty_hm: '',
        region: '',
        postalCode: '',
        country: 'United States'
      };
      
      onAddressSelect(emptyData);
    }
  };

  // Handle manual input without autocomplete selection
  const handleInputBlur = () => {
    // If user typed an address but didn't select from autocomplete
    if (inputValue && inputValue !== defaultValue) {
      console.log("Manual address entered:", inputValue);
      
      // Try to parse basic address info from manual input
      const manualData = {
        streetAddress: inputValue,
        formattedAddress: inputValue,
        city: '',
        cnty_hm: '',
        region: '',
        postalCode: '',
        country: 'United States'
      };
      
      if (onAddressSelect) {
        onAddressSelect(manualData);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-1">
        <span className="block text-gray-800 text-lg md:text-xl font-medium mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </div>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full h-16 pl-8 pr-12 py-3 text-lg border rounded-md 
            focus:outline-none focus:ring-1 focus:ring-[#775684] 
            ${isError ? 'border-red-600 bg-red-50' : 'border-[#775684]/30'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          style={{
            backgroundColor: disabled ? '#f3f4f6' : '#FFFFFF',
            borderColor: isError ? '#dc2626' : 'rgba(119, 86, 132, 0.3)'
          }}
          autoComplete="street-address"
          aria-label={label}
        />
        
        {/* Address icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#775684]" style={{ pointerEvents: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      
      {/* Error message */}
      {errorMessage && (
        <div className="mt-2">
          <span className="text-sm text-red-600">{errorMessage}</span>
        </div>
      )}
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-1 text-xs text-gray-400">
          API Key: {apiKey ? 'Loaded' : 'Missing'} | 
          Script: {scriptLoadedRef.current ? 'Loaded' : 'Loading'} | 
          Autocomplete: {autocompleteRef.current ? 'Ready' : 'Not Ready'}
        </div>
      )}
    </div>
  );
};

export default AddressAutocompleteV3;