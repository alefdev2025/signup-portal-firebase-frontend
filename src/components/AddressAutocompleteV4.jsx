// File: components/AddressAutocompleteV4.jsx
// Updated to use the new Google Places PlaceAutocompleteElement
import React, { useState, useEffect, useRef } from 'react';

const AddressAutocompleteV4 = ({
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
  const containerRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  
  // API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script with new Places API
  useEffect(() => {
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete will not work.');
      return;
    }

    // Check if script already loaded
    if (scriptLoadedRef.current || window.google?.maps?.places?.PlaceAutocompleteElement) {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        scriptLoadedRef.current = true;
        initializePlaceAutocomplete();
      }
      return;
    }

    const scriptId = 'google-maps-script-v2';
    if (document.getElementById(scriptId)) {
      // Script already exists, wait for it to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places?.PlaceAutocompleteElement) {
          clearInterval(checkGoogleMaps);
          scriptLoadedRef.current = true;
          initializePlaceAutocomplete();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    // Use the new v=beta parameter for the latest Places API
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`;
    script.async = true;
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      scriptLoadedRef.current = true;
      initializePlaceAutocomplete();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
    console.log('Google Maps script added to head');
  }, [apiKey]);

  // Initialize the new PlaceAutocompleteElement
  const initializePlaceAutocomplete = () => {
    if (!containerRef.current || !window.google?.maps?.places?.PlaceAutocompleteElement) {
      console.error('Container or PlaceAutocompleteElement not available');
      return;
    }

    try {
      console.log('Creating PlaceAutocompleteElement...');
      
      // Create the new place autocomplete element with minimal options
      const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: 'us' },
        types: ['address']
        // Note: 'fields' property is not supported in PlaceAutocompleteElement
        // The new API returns all data by default
      });

      // Style the element
      autocompleteElement.style.width = '100%';
      autocompleteElement.style.height = '64px'; // 16 * 4 = 64px to match your h-16
      autocompleteElement.style.border = isError ? '1px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)';
      autocompleteElement.style.borderRadius = '6px';
      autocompleteElement.style.padding = '12px 32px 12px 32px';
      autocompleteElement.style.fontSize = '18px';
      autocompleteElement.style.backgroundColor = disabled ? '#f3f4f6' : '#FFFFFF';
      autocompleteElement.style.outline = 'none';
      autocompleteElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      // Set placeholder
      autocompleteElement.placeholder = placeholder;
      
      // Set disabled state
      if (disabled) {
        autocompleteElement.disabled = true;
      }
      
      // Set value if defaultValue exists
      if (defaultValue) {
        autocompleteElement.value = defaultValue;
        setInputValue(defaultValue);
      }

      // Add event listener for place selection
      autocompleteElement.addEventListener('gmp-placeselect', (event) => {
        console.log('Place selected event fired:', event);
        handlePlaceSelect(event.place);
      });

      // Also listen for input changes to update our state
      autocompleteElement.addEventListener('input', (event) => {
        setInputValue(event.target.value);
      });

      // Clear the container and add the new element
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(autocompleteElement);
      
      autocompleteElementRef.current = autocompleteElement;
      
      console.log("✅ New Google PlaceAutocompleteElement initialized successfully");
    } catch (error) {
      console.error("Error initializing Google PlaceAutocompleteElement:", error);
      
      // Fallback to creating a basic input if PlaceAutocompleteElement fails
      console.log("Falling back to basic input field");
      createFallbackInput();
    }
  };

  // Fallback to basic input if new API fails
  const createFallbackInput = () => {
    if (!containerRef.current) return;

    const fallbackInput = document.createElement('input');
    fallbackInput.type = 'text';
    fallbackInput.placeholder = placeholder;
    fallbackInput.value = defaultValue || '';
    fallbackInput.disabled = disabled;
    fallbackInput.style.width = '100%';
    fallbackInput.style.height = '64px';
    fallbackInput.style.border = isError ? '1px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)';
    fallbackInput.style.borderRadius = '6px';
    fallbackInput.style.padding = '12px 32px 12px 32px';
    fallbackInput.style.fontSize = '18px';
    fallbackInput.style.backgroundColor = disabled ? '#f3f4f6' : '#FFFFFF';
    fallbackInput.style.outline = 'none';
    fallbackInput.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    fallbackInput.addEventListener('input', (e) => {
      setInputValue(e.target.value);
    });

    fallbackInput.addEventListener('blur', () => {
      if (fallbackInput.value && onAddressSelect) {
        const manualData = {
          streetAddress: fallbackInput.value,
          formattedAddress: fallbackInput.value,
          city: '',
          cnty_hm: '',
          region: '',
          postalCode: '',
          country: 'United States'
        };
        onAddressSelect(manualData);
      }
    });

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(fallbackInput);
    
    console.log("✅ Fallback input created");
  };

  // Handle place selection from Google Places
  const handlePlaceSelect = (place) => {
    console.log("Place selected with new API:", place);

    if (!place) {
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

    // Dispatch custom event for any listeners
    try {
      document.dispatchEvent(new CustomEvent('addressAutocompleteUpdate', { 
        detail: addressData 
      }));
      console.log("🎯 Dispatched addressAutocompleteUpdate event");
    } catch (error) {
      console.error("Error dispatching custom event:", error);
    }
  };

  // Parse Google Places data into our format
  const parseGooglePlaceData = (place) => {
    console.log("Raw place data:", place);
    
    const components = {};
    
    // Check if address_components exists
    if (place.address_components) {
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
          components.region = component.short_name;  // e.g., "WA"
          components.regionShort = component.short_name;
          components.regionLong = component.long_name;
        }
        if (types.includes('postal_code')) {
          components.postalCode = component.long_name;
        }
        if (types.includes('country')) {
          components.country = component.long_name;
        }
      });
    }

    const streetAddress = [components.streetNumber, components.route]
      .filter(Boolean)
      .join(' ');

    const result = {
      formattedAddress: place.formatted_address || place.displayName || '',
      streetAddress: streetAddress || place.formatted_address || place.displayName || '',
      city: components.city || '',
      cnty_hm: '', // Always empty - we don't auto-fill county
      region: components.region || '',
      regionLong: components.regionLong || '',
      postalCode: components.postalCode || '',
      country: components.country || 'United States',
      placeId: place.place_id || place.id,
      geometry: place.geometry
    };

    console.log("Parsed components:", components);
    console.log("Final result:", result);

    return result;
  };

  // Update when defaultValue changes
  useEffect(() => {
    console.log("AddressAutocomplete: defaultValue changed to:", defaultValue);
    setInputValue(defaultValue || "");
    
    // Update the autocomplete element value if it exists
    if (autocompleteElementRef.current) {
      autocompleteElementRef.current.value = defaultValue || "";
    }
  }, [defaultValue]);

  // Re-initialize when the container ref changes
  useEffect(() => {
    if (scriptLoadedRef.current && containerRef.current) {
      initializePlaceAutocomplete();
    }
  }, [containerRef.current]);

  return (
    <div className="w-full">
      <div className="mb-1">
        <span className="block text-gray-800 text-lg md:text-xl font-medium mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </div>
      
      <div className="relative">
        {/* Container for the new Google Places element */}
        <div 
          ref={containerRef}
          className="relative"
          style={{ minHeight: '64px' }}
        />
        
        {/* Address icon overlay */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#775684] pointer-events-none z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        {/* Hidden input to maintain form compatibility */}
        <input
          type="hidden"
          id={id}
          name={name}
          value={inputValue}
          required={required}
        />
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
          Element: {autocompleteElementRef.current ? 'Ready' : 'Not Ready'}
        </div>
      )}
    </div>
  );
};

export default AddressAutocompleteV4;