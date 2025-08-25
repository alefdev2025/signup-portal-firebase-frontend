// File: components/AddressAutocompleteV3.jsx
// NO BULLSHIT - Just a working Google Places autocomplete
import React, { useState, useEffect, useRef } from 'react';
import { LabelWithIcon } from './signup/ContactFormFields';

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
  isError = false
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps and initialize autocomplete
  useEffect(() => {
    console.log("🔄 Loading Google Maps...", { apiKey: !!apiKey });
    if (!apiKey) {
      console.error("❌ No API key found");
      return;
    }

    const loadGoogleMaps = () => {
      if (window.google?.maps?.places) {
        console.log("✅ Google Maps already loaded");
        initAutocomplete();
        return;
      }

      if (document.getElementById('google-maps-script')) {
        console.log("📜 Script already exists, waiting...");
        return;
      }

      console.log("📜 Creating Google Maps script...");
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.onload = () => {
        console.log("✅ Google Maps script loaded");
        initAutocomplete();
      };
      script.onerror = () => {
        console.error("❌ Failed to load Google Maps script");
      };
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      console.log("🔄 Initializing autocomplete...", { 
        inputRef: !!inputRef.current, 
        googleMaps: !!window.google?.maps?.places 
      });

      if (!inputRef.current || !window.google?.maps?.places) {
        console.error("❌ Missing requirements for autocomplete");
        return;
      }

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        });

        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
        console.log("✅ Simple autocomplete initialized successfully");
        
        // Test if it's working
        setTimeout(() => {
          console.log("🔍 Checking PAC containers:", document.querySelectorAll('.pac-container').length);
        }, 2000);
      } catch (error) {
        console.error("❌ Autocomplete init failed:", error);
      }
    };

    loadGoogleMaps();
  }, [apiKey]);

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (!place?.address_components) return;

    const addressData = parseAddress(place);
    setInputValue(addressData.formattedAddress);

    if (onAddressSelect) {
      onAddressSelect(addressData);
    }

    console.log("✅ Address selected:", addressData);
  };

  const parseAddress = (place) => {
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
      }
      if (types.includes('administrative_area_level_1')) {
        components.region = component.short_name;
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

    return {
      formattedAddress: place.formatted_address,
      streetAddress: streetAddress || place.formatted_address,
      city: components.city || '',
      region: components.region || '',
      postalCode: components.postalCode || '',
      country: components.country || 'United States',
      cnty_hm: ''
    };
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log("🔍 Input changed to:", value);
    setInputValue(value);
    
    // Check for PAC containers after typing and fix their positioning
    setTimeout(() => {
      const containers = document.querySelectorAll('.pac-container');
      console.log(`🔍 Found ${containers.length} PAC containers after typing "${value}"`);
      
      containers.forEach((container, i) => {
        console.log(`Container ${i}:`, {
          display: getComputedStyle(container).display,
          visibility: getComputedStyle(container).visibility,
          childCount: container.children.length
        });
        
        // FIX POSITIONING - This was missing!
        if (inputRef.current && container.children.length > 0) {
          const inputRect = inputRef.current.getBoundingClientRect();
          container.style.position = 'fixed';
          container.style.zIndex = '99999';
          container.style.top = (inputRect.bottom + 4) + 'px';
          container.style.left = inputRect.left + 'px';
          container.style.width = inputRect.width + 'px';
          console.log(`🔧 Fixed position for container ${i}: top=${inputRect.bottom + 4}px, left=${inputRect.left}px`);
        }
      });
    }, 500);
  };

  const handleInputBlur = () => {
    // If user typed manually without selecting from dropdown
    if (inputValue && onAddressSelect) {
      const manualData = {
        streetAddress: inputValue,
        formattedAddress: inputValue,
        city: '',
        region: '',
        postalCode: '',
        country: 'United States',
        cnty_hm: ''
      };
      onAddressSelect(manualData);
    }
  };

  // Update input when defaultValue changes
  useEffect(() => {
    setInputValue(defaultValue || "");
  }, [defaultValue]);

  return (
    <div className="w-full">
<LabelWithIcon label={label} required={required} />
      
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
          w-full h-12 md:h-16 pl-4 md:pl-8 pr-8 md:pr-12 py-2 md:py-3 text-base md:text-lg border rounded-md 
            focus:outline-none focus:ring-1 focus:ring-[#775684] 
            ${isError ? 'border-red-600 bg-red-50' : 'border-[#775684]/30'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          style={{
            backgroundColor: disabled ? '#f3f4f6' : '#FFFFFF',
            borderColor: isError ? '#dc2626' : 'rgba(119, 86, 132, 0.3)'
          }}
          autoComplete="street-address"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#775684]" style={{ pointerEvents: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
      
      {errorMessage && (
        <div className="mt-2">
          <span className="text-sm text-red-600">{errorMessage}</span>
        </div>
      )}

      <style jsx>{`
        .pac-container {
          z-index: 9999 !important;
          border-radius: 8px;
          border: 1px solid rgba(119, 86, 132, 0.3);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: system-ui, -apple-system, sans-serif;
        }
        .pac-item {
          padding: 12px 14px;
          font-size: 16px;
          cursor: pointer;
        }
        .pac-item:hover {
          background-color: #f3f4f6;
        }
        .pac-matched {
          font-weight: 600;
          color: #775684;
        }
      `}</style>
    </div>
  );
};

export default AddressAutocompleteV3;