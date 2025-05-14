// Updated components/AddressAutocomplete.jsx
import React, { useState, useEffect, useRef } from 'react';

// Custom styles for the Google Places autocomplete dropdown
const autocompleteStyles = `
  .gmpx-place-autocomplete-item {
    padding: 10px 12px;
    font-size: 16px;
    cursor: pointer;
    line-height: 1.5;
  }
  
  .gmpx-place-autocomplete-item:hover {
    background-color: rgba(243, 244, 246, 1);
  }
  
  .gmpx-place-autocomplete-item--selected {
    background-color: rgba(243, 244, 246, 1);
  }
  
  .gmpx-place-autocomplete-item-secondary-text {
    color: rgba(107, 114, 128, 1);
    font-size: 14px;
  }
  
  .gmpx-place-autocomplete-input {
    width: 100%;
    height: 4rem !important;
    padding-left: 2rem !important;
    padding-right: 2rem !important;
    background-color: #FFFFFF !important;
    border-radius: 0.375rem !important;
    font-size: 1.125rem !important;
    color: #333333 !important;
  }
  
  .gmpx-place-autocomplete-matched-text {
    font-weight: 600;
    color: #775684 !important;
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
  errorMessage = '',
  isError = false
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const containerRef = useRef(null);
  const placeElementRef = useRef(null);
  
  // Get API key - for Vite, use import.meta.env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  console.log("Google Maps API key exists:", apiKey ? "Yes" : "No");

  useEffect(() => {
    // Only initialize when the container is mounted and visible
    if (!containerRef.current) return;
    
    // Load Google Maps script if not already loaded
    const loadGoogleMapsScript = () => {
      if (!apiKey) {
        console.error('Google Maps API key is missing');
        return;
      }

      const scriptId = 'google-maps-script';
      if (!document.getElementById(scriptId) && (!window.google || !window.google.maps || !window.google.maps.places)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPlaceAutocomplete`;
        script.async = true;
        script.defer = true;
        
        window.initPlaceAutocomplete = () => {
          initPlaceElement();
        };
        
        document.head.appendChild(script);
      } else if (window.google && window.google.maps && window.google.maps.places) {
        initPlaceElement();
      }
    };

    const initPlaceElement = () => {
      if (!containerRef.current) return;
      
      // Add custom styles to head if not already added
      if (!document.getElementById('autocomplete-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'autocomplete-styles';
        styleElement.type = 'text/css';
        styleElement.appendChild(document.createTextNode(autocompleteStyles));
        document.head.appendChild(styleElement);
      }
      
      // Clear the container first
      containerRef.current.innerHTML = '';
      
      try {
        console.log(`Initializing PlaceAutocompleteElement for ${id}`);
        
        // Create a basic input field first
        containerRef.current.innerHTML = `
          <input 
            type="text" 
            id="${id}" 
            name="${name}" 
            value="${defaultValue}"
            placeholder="${placeholder}"
            class="w-full h-16 pl-8 pr-3 py-3 bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg"
            style="background-color: #FFFFFF; height: 4rem; border-color: ${isError ? '#dc2626' : 'rgba(119, 86, 132, 0.3)'}"
            ${disabled ? 'disabled' : ''}
          />
        `;
        
        // Now create the PlaceAutocompleteElement
        try {
          placeElementRef.current = new window.google.maps.places.PlaceAutocompleteElement({
            types: ['address'],
            container: containerRef.current
          });
          
          // Style the input element
          const inputElement = containerRef.current.querySelector('input');
          if (inputElement) {
            inputElement.className = 'w-full h-16 pl-8 pr-3 py-3 bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg';
            inputElement.style.backgroundColor = '#FFFFFF';
            inputElement.style.height = '4rem';
            inputElement.style.borderColor = isError ? '#dc2626' : 'rgba(119, 86, 132, 0.3)';
            inputElement.placeholder = placeholder;
            inputElement.disabled = disabled;
            
            // Set the defaultValue if provided
            if (defaultValue) {
              inputElement.value = defaultValue;
            }
          }
          
          // Add event listener for place selection
          placeElementRef.current.addListener('place_changed', () => {
            const place = placeElementRef.current.getPlace();
            
            console.log(`Place selected in ${id}:`, place);
            
            if (!place) {
              console.warn('No place details available');
              return;
            }
            
            // For debugging only
            setInputValue(place.description || '');
            
            // Get detailed place information using Place Details service
            const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
            placesService.getDetails(
              {
                placeId: place.place_id,
                fields: ['address_component', 'formatted_address', 'geometry']
              },
              (detailedPlace, status) => {
                if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
                  console.error("Error fetching place details:", status);
                  // Fallback to basic data
                  onAddressSelect({
                    streetAddress: place.description || '',
                    formattedAddress: place.description || '',
                    cnty_hm: '', // Using obscure name
                    city: '',
                    region: '',
                    postalCode: '',
                    country: 'United States'
                  });
                  return;
                }
                
                console.log(`Detailed place for ${id}:`, detailedPlace);
                
                // Extract address components
                const addressComponents = {};
                let streetNumber = null;
                let route = null;
                let locality = null; 
                let sublocality = null;
                let neighborhood = null;
                let county = null;
                let state = null;
                let country = null;
                let postalCode = null;
                
                // Check if we have address components
                if (detailedPlace.address_components) {
                  // Categorize each component
                  detailedPlace.address_components.forEach(component => {
                    const types = component.types;
                    
                    if (types.includes('street_number')) {
                      streetNumber = component;
                    }
                    
                    if (types.includes('route')) {
                      route = component;
                    }
                    
                    if (types.includes('locality')) {
                      locality = component;
                    }
                    
                    if (types.includes('sublocality')) {
                      sublocality = component;
                    }
                    
                    if (types.includes('neighborhood')) {
                      neighborhood = component;
                    }
                    
                    if (types.includes('administrative_area_level_2')) {
                      county = component;
                    }
                    
                    if (types.includes('administrative_area_level_1')) {
                      state = component;
                    }
                    
                    if (types.includes('country')) {
                      country = component;
                    }
                    
                    if (types.includes('postal_code')) {
                      postalCode = component;
                    }
                  });
                  
                  // Build the addressComponents object
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
                    addressComponents.cnty_hm = county.long_name; // Using obscure name
                  } else {
                    // If no county was found, explicitly set it to empty
                    addressComponents.cnty_hm = '';
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
                  } else if (detailedPlace.formatted_address) {
                    // Fallback to formatted_address if components aren't available
                    addressComponents.streetAddress = detailedPlace.formatted_address;
                  }
                } else {
                  // If no address components, just use the formatted address
                  addressComponents.streetAddress = detailedPlace.formatted_address || place.description || '';
                  addressComponents.cnty_hm = ''; // Using obscure name
                }
                
                console.log(`Final processed address components for ${id}:`, addressComponents);
                
                // Update input value
                const inputElement = containerRef.current.querySelector('input');
                if (inputElement) {
                  inputElement.value = detailedPlace.formatted_address || place.description || '';
                }
                setInputValue(detailedPlace.formatted_address || place.description || '');
                
                // Pass the selected address data to the parent component
                onAddressSelect({
                  formattedAddress: detailedPlace.formatted_address || place.description || '',
                  ...addressComponents,
                  coordinates: detailedPlace.geometry ? {
                    lat: detailedPlace.geometry.location.lat(),
                    lng: detailedPlace.geometry.location.lng()
                  } : null
                });
              }
            );
          });
        } catch (error) {
          console.error(`Error initializing PlaceAutocompleteElement for ${id}:`, error);
          
          // Continue with the basic input we already created
          const fallbackInput = containerRef.current.querySelector('input');
          if (fallbackInput) {
            fallbackInput.addEventListener('change', (e) => {
              setInputValue(e.target.value);
              if (onAddressSelect) {
                onAddressSelect({
                  streetAddress: e.target.value,
                  formattedAddress: e.target.value,
                  cnty_hm: '', // Using obscure name
                  city: '',
                  region: '',
                  postalCode: '',
                  country: 'United States'
                });
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error in address autocomplete for ${id}:`, error);
        
        // Create a fallback input
        containerRef.current.innerHTML = `
          <input 
            type="text" 
            id="${id}" 
            name="${name}" 
            value="${inputValue}"
            placeholder="${placeholder}"
            class="w-full h-16 pl-8 pr-3 py-3 bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg"
            style="background-color: #FFFFFF; height: 4rem; border-color: ${isError ? '#dc2626' : 'rgba(119, 86, 132, 0.3)'}"
            ${disabled ? 'disabled' : ''}
          />
        `;
        
        const fallbackInput = containerRef.current.querySelector('input');
        if (fallbackInput) {
          fallbackInput.addEventListener('change', (e) => {
            setInputValue(e.target.value);
            if (onAddressSelect) {
              onAddressSelect({
                streetAddress: e.target.value,
                formattedAddress: e.target.value,
                cnty_hm: '', // Using obscure name
                city: '',
                region: '',
                postalCode: '',
                country: 'United States'
              });
            }
          });
        }
      }
    };
    
    loadGoogleMapsScript();
    
    // Cleanup function
    return () => {
      if (placeElementRef.current) {
        // Clean up event listeners
        try {
          window.google.maps.event.clearInstanceListeners(placeElementRef.current);
        } catch (e) {
          console.error('Error cleaning up PlaceAutocompleteElement:', e);
        }
      }
    };
  }, [apiKey, id, name, placeholder, disabled, isError, onAddressSelect]);

  // Update the defaultValue when it changes
  useEffect(() => {
    setInputValue(defaultValue);
    
    // Update the input element if it exists
    if (containerRef.current) {
      const inputElement = containerRef.current.querySelector('input');
      if (inputElement && defaultValue) {
        inputElement.value = defaultValue;
      }
    }
  }, [defaultValue]);

  return (
    <div className="w-full">
      <div className="mb-1">
        <span className="block text-gray-800 text-lg md:text-xl font-medium mb-3">
          {label} {required && '*'}
        </span>
      </div>
      
      <div className="relative">
        <div 
          ref={containerRef}
          className="address-autocomplete-field w-full"
          style={{ minHeight: '4rem' }}
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

export default AddressAutocomplete;