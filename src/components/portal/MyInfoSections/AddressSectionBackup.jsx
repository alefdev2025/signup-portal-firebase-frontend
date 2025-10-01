import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { cleanAddressData, cleanAddressObject } from '../utils/dataFormatting';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';

// Melissa API configuration
const MELISSA_API_KEY = 'AVUaS6bp3WJyyFKHjjwqgj**nSAcwXpxhQ0PC2lXxuDAZ-**';
const MELISSA_API_URL = 'https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig2.display.item.label}>{label}</dt>
    <dd 
      className="text-gray-900" 
      style={{ 
        WebkitTextStroke: '0.6px #1f2937',
        fontWeight: 400,
        letterSpacing: '0.01em',
        fontSize: '15px'
      }}
    >
      {value || styleConfig2.display.item.empty}
    </dd>
  </div>
);

const AddressesSection = ({ 
  addresses, 
  setAddresses, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveAddresses, 
  savingSection,
  setAddressValidationModal,
  sectionImage,  // Add this prop
  sectionLabel   // Add this prop
}) => {
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    home: '',
    mailing: ''
  });
  const [skipValidationFlag, setSkipValidationFlag] = useState(false);
  
  // Add state for mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add loading animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .addresses-section-fade-in {
        animation: addressesFadeIn 0.8s ease-out forwards;
      }
      .addresses-section-slide-in {
        animation: addressesSlideIn 0.8s ease-out forwards;
      }
      .addresses-section-stagger-in > * {
        opacity: 0;
        animation: addressesSlideIn 0.5s ease-out forwards;
      }
      .addresses-section-stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .addresses-section-stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .addresses-section-stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .addresses-section-stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      .addresses-section-stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
      .addresses-section-stagger-in > *:nth-child(6) { animation-delay: 0.3s; }
      .addresses-section-stagger-in > *:nth-child(7) { animation-delay: 0.35s; }
      .addresses-section-stagger-in > *:nth-child(8) { animation-delay: 0.4s; }
      .addresses-section-stagger-in > *:nth-child(9) { animation-delay: 0.45s; }
      .addresses-section-stagger-in > *:nth-child(10) { animation-delay: 0.5s; }
      .addresses-section-stagger-in > *:nth-child(11) { animation-delay: 0.55s; }
      .addresses-section-stagger-in > *:nth-child(12) { animation-delay: 0.6s; }
      @keyframes addressesFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes addressesSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          setTimeout(() => setHasLoaded(true), 100);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isVisible]);

  // Format address for display
  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return styleConfig2.display.item.empty;
    return parts.join(', ');
  };
  
  // Helper function to check if addresses are effectively the same
  const areAddressesSame = () => {
    // Check explicit flag first
    if (addresses.sameAsHome === true) return true;
    
    // Check if mailing address fields are empty or same as home
    const mailingEmpty = !addresses.mailingStreet && !addresses.mailingCity && 
                        !addresses.mailingState && !addresses.mailingPostalCode;
    
    if (mailingEmpty) return true;
    
    // Check if all fields match
    const fieldsMatch = addresses.homeStreet === addresses.mailingStreet &&
                       addresses.homeCity === addresses.mailingCity &&
                       addresses.homeState === addresses.mailingState &&
                       addresses.homePostalCode === addresses.mailingPostalCode &&
                       (addresses.homeCountry || 'US') === (addresses.mailingCountry || 'US');
    
    return fieldsMatch;
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (addresses?.homeStreet) {
      const cityState = [addresses.homeCity, addresses.homeState].filter(Boolean).join(', ');
      previewParts.push(`Home: ${cityState || 'Address'}`);
    }
    
    if (addresses?.sameAsHome) {
      previewParts.push('Mailing: Same as home');
    } else if (addresses?.mailingStreet) {
      const cityState = [addresses.mailingCity, addresses.mailingState].filter(Boolean).join(', ');
      previewParts.push(`Mailing: ${cityState || 'Address'}`);
    }
    
    return previewParts.slice(0, 2).join(' • ');
  };

  // Validate address with Melissa API
  const validateAddressWithMelissa = async (address, addressType) => {
    console.log('🔵 === START validateAddressWithMelissa ===');
    console.log('📋 Address to validate:', addressType, address);
    console.log('🔑 Using API Key:', MELISSA_API_KEY.substring(0, 10) + '...');
    
    try {
      const params = new URLSearchParams({
        id: MELISSA_API_KEY,
        a1: address.street || '',
        a2: '',
        loc: address.city || '',
        admarea: address.state || '',
        postal: address.postalCode || '',
        ctry: address.country || 'US',
        format: 'json'
      });

      const fullUrl = `${MELISSA_API_URL}?${params}`;
      console.log('🌐 API URL:', fullUrl.replace(MELISSA_API_KEY, 'API_KEY_HIDDEN'));

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('📨 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Melissa API Response:', JSON.stringify(data, null, 2));

      // Check for transmission errors first
      if (data.TransmissionResults) {
        const errorCode = data.TransmissionResults;
        console.log('🚨 Transmission Results:', errorCode);
        
        // Common error codes
        const errorMessages = {
          'GE08': 'Invalid API key or insufficient credits. Please check your Melissa account.',
          'GE09': 'API key is disabled or expired.',
          'GE10': 'No credits remaining on this API key.',
          'GE02': 'Empty request - no address provided.',
          'GE03': 'Invalid country code.'
        };
        
        if (errorCode !== '' && errorCode !== 'GE00') {
          const errorMessage = errorMessages[errorCode] || `API Error: ${errorCode}`;
          console.log('❌ API Error detected:', errorMessage);
          return {
            success: false,
            error: errorMessage
          };
        }
      }

      if (data.Version && data.Records && data.Records.length > 0) {
        const record = data.Records[0];
        console.log('📄 First record:', record);
        
        if (record) {
          // Check if address is valid
          const addressVerificationCode = record.Results || '';
          console.log('✅ Verification code:', addressVerificationCode);
          
          // AV codes that indicate a valid AND deliverable address
          const deliverableCodes = ['AV25', 'AV24', 'AV23', 'AV22', 'AV21'];
          
          // AV14, AV13, AV12, AV11 indicate partial matches or undeliverable
          const partialMatchCodes = ['AV14', 'AV13', 'AV12', 'AV11'];
          
          // Check for delivery point validation
          const isDeliverable = deliverableCodes.some(code => addressVerificationCode.includes(code));
          const isPartialMatch = partialMatchCodes.some(code => addressVerificationCode.includes(code));
          
          console.log('✅ Verification code:', addressVerificationCode);
          console.log('📬 Is deliverable?', isDeliverable);
          console.log('⚠️ Is partial match?', isPartialMatch);
          
          // Also check for specific error codes that indicate non-deliverable addresses
          const hasDeliveryErrors = addressVerificationCode.includes('AE') || // Address Error
                                   addressVerificationCode.includes('AC09') || // Undeliverable address
                                   addressVerificationCode.includes('AC10') || // PO Box address when not allowed
                                   addressVerificationCode.includes('AC11'); // Military address
          
          console.log('❌ Has delivery errors?', hasDeliveryErrors);
          
          if (hasDeliveryErrors) {
            // Address has specific delivery errors
            console.log('❌ Address has delivery errors');
            console.log('🔵 === END validateAddressWithMelissa (DELIVERY ERROR) ===\n');
            return {
              success: true,
              isValid: false,
              error: 'This address could not be verified. Please double-check it\'s correct, or continue anyway if you\'re sure.'
            };
          } else if (isDeliverable) {
            // Address is valid and deliverable
            const validatedAddress = {
              street: record.AddressLine1 || '',
              city: record.Locality || '',
              state: record.AdministrativeArea || '',
              postalCode: record.PostalCode || '',
              country: record.CountryISO3166_1_Alpha2 || 'US'
            };
            console.log('✨ Validated deliverable address:', validatedAddress);

            // Check if the validated address is different from input
            const isDifferent = 
              validatedAddress.street.toLowerCase() !== (address.street || '').toLowerCase() ||
              validatedAddress.city.toLowerCase() !== (address.city || '').toLowerCase() ||
              validatedAddress.state.toLowerCase() !== (address.state || '').toLowerCase() ||
              validatedAddress.postalCode !== (address.postalCode || '');

            console.log('🔄 Address is different?', isDifferent);
            console.log('🔵 === END validateAddressWithMelissa (SUCCESS) ===\n');

            return {
              success: true,
              isValid: true,
              isDeliverable: true,
              isDifferent,
              suggestedAddress: validatedAddress,
              originalAddress: address
            };
          } else if (isPartialMatch) {
            // Address is partially valid but may not be deliverable
            console.log('⚠️ Address is partially valid');
            
            // Check if we have enough info to suggest a correction
            if (record.AddressLine1 && record.Locality && record.AdministrativeArea && record.PostalCode) {
              const suggestedAddress = {
                street: record.AddressLine1 || '',
                city: record.Locality || '',
                state: record.AdministrativeArea || '',
                postalCode: record.PostalCode || '',
                country: record.CountryISO3166_1_Alpha2 || 'US'
              };
              
              console.log('💡 Suggesting corrected address:', suggestedAddress);
              console.log('🔵 === END validateAddressWithMelissa (PARTIAL) ===\n');
              
              return {
                success: true,
                isValid: false,
                isDeliverable: false,
                isDifferent: true,
                suggestedAddress: suggestedAddress,
                originalAddress: address,
                error: 'This address could not be verified. Please double-check it\'s correct, or continue anyway if you\'re sure.'
              };
            } else {
              return {
                success: true,
                isValid: false,
                error: 'This address could not be verified. Please double-check it\'s correct, or continue anyway if you\'re sure.'
              };
            }
          } else {
            // Address is not valid at all
            console.log('❌ Address validation failed - undeliverable address');
            console.log('🔵 === END validateAddressWithMelissa (INVALID) ===\n');
            return {
              success: true,
              isValid: false,
              error: 'This address could not be verified. Please double-check it\'s correct, or continue anyway if you\'re sure.'
            };
          }
        }
      }
      
      console.log('❌ No valid response from Melissa API');
      console.log('🔵 === END validateAddressWithMelissa (NO RESPONSE) ===\n');
      return {
        success: false,
        error: 'Unable to validate address. Please try again.'
      };
    } catch (error) {
      console.error('❌ Melissa API error:', error);
      console.log('🔵 === END validateAddressWithMelissa (ERROR) ===\n');
      return {
        success: false,
        error: 'Address validation service is temporarily unavailable.'
      };
    }
  };

  // Handle accepting suggested address (called from parent modal)
  const handleAcceptSuggestion = (addressType, suggestedAddress) => {
    const prefix = addressType.toLowerCase();
    
    setAddresses({
      ...addresses,
      [`${prefix}Street`]: suggestedAddress.street,
      [`${prefix}City`]: suggestedAddress.city,
      [`${prefix}State`]: suggestedAddress.state,
      [`${prefix}PostalCode`]: suggestedAddress.postalCode,
      [`${prefix}Country`]: suggestedAddress.country
    });
    
    setValidationErrors(prev => ({ ...prev, [prefix]: '' }));
  };

  // Clear errors when edit mode changes
  useEffect(() => {
    if (!editMode.addresses) {
      setValidationErrors({ home: '', mailing: '' });
      setSkipValidationFlag(false);
    }
  }, [editMode.addresses]);

  // Continue with save after validation
  const continueWithSave = async () => {
    // All addresses are now validated, proceed with save
    await saveAddresses();
  };

  // Handle save anyway click
  const handleSaveAnyway = () => {
    console.log('🟡 Save Anyway clicked');
    setSkipValidationFlag(true);
    setValidationErrors({ home: '', mailing: '' });
    setValidatingAddress(true);
    
    // Clean the addresses before saving
    const cleanedAddresses = cleanAddressData(addresses);
    setAddresses(cleanedAddresses);
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      saveAddresses().finally(() => {
        setValidatingAddress(false);
        setSkipValidationFlag(false);
      });
    }, 0);
  };

  // Handle save with validation
  const handleSaveAddresses = async () => {
    console.log('🟢 === START handleSaveAddresses ===');
    console.log('📋 Current addresses:', addresses);
    
    // Prevent double-clicks
    if (validatingAddress || savingSection === 'addresses') {
      console.log('⚠️ Already processing, ignoring click');
      return;
    }
    
    // Clean the addresses before validation
    const cleanedAddresses = cleanAddressData(addresses);
    setAddresses(cleanedAddresses);
    
    setValidatingAddress(true);
    setValidationErrors({ home: '', mailing: '' });

    try {
      let hasErrors = false;
      let pendingValidation = null;

      // Validate home address
      if (cleanedAddresses.homeStreet && cleanedAddresses.homeCity && cleanedAddresses.homeState && cleanedAddresses.homePostalCode) {
        console.log('🏠 Validating home address...');
        const homeValidation = await validateAddressWithMelissa({
          street: cleanedAddresses.homeStreet,
          city: cleanedAddresses.homeCity,
          state: cleanedAddresses.homeState,
          postalCode: cleanedAddresses.homePostalCode,
          country: cleanedAddresses.homeCountry || 'US'
        }, 'home');

        console.log('🏠 Home validation result:', homeValidation);

        if (!homeValidation.success || !homeValidation.isValid) {
          setValidationErrors(prev => ({ 
            ...prev, 
            home: homeValidation.error || 'This address could not be verified. Please double-check it\'s correct, or continue anyway if you\'re sure.'
          }));
          hasErrors = true;
        } else if (homeValidation.isDifferent || (!homeValidation.isDeliverable && homeValidation.suggestedAddress)) {
          // Show modal for home address correction if different OR if we have a suggested deliverable address
          pendingValidation = {
            addressType: 'Home',
            originalAddress: homeValidation.originalAddress,
            suggestedAddress: cleanAddressObject(homeValidation.suggestedAddress)
          };
        }
      } else if (cleanedAddresses.homeStreet || cleanedAddresses.homeCity || cleanedAddresses.homeState || cleanedAddresses.homePostalCode) {
        // Partial address entered
        console.log('⚠️ Partial home address detected');
        setValidationErrors(prev => ({ 
          ...prev, 
          home: 'Please complete all home address fields.'
        }));
        hasErrors = true;
      }

      // Only validate mailing if not same as home
      if (!cleanedAddresses.sameAsHome && !pendingValidation) {
        if (cleanedAddresses.mailingStreet && cleanedAddresses.mailingCity && cleanedAddresses.mailingState && cleanedAddresses.mailingPostalCode) {
          console.log('📬 Validating mailing address...');
          const mailingValidation = await validateAddressWithMelissa({
            street: cleanedAddresses.mailingStreet,
            city: cleanedAddresses.mailingCity,
            state: cleanedAddresses.mailingState,
            postalCode: cleanedAddresses.mailingPostalCode,
            country: cleanedAddresses.mailingCountry || 'US'
          }, 'mailing');

          console.log('📬 Mailing validation result:', mailingValidation);

          if (!mailingValidation.success || !mailingValidation.isValid) {
            setValidationErrors(prev => ({ 
              ...prev, 
              mailing: mailingValidation.error || 'This address could not be verified. Please double-check it\'s correct, or continue anyway if you\'re sure.'
            }));
            hasErrors = true;
          } else if (mailingValidation.isDifferent || (!mailingValidation.isDeliverable && mailingValidation.suggestedAddress)) {
            // Show modal for mailing address correction if different OR if we have a suggested deliverable address
            pendingValidation = {
              addressType: 'Mailing',
              originalAddress: mailingValidation.originalAddress,
              suggestedAddress: cleanAddressObject(mailingValidation.suggestedAddress)
            };
          }
        } else if (cleanedAddresses.mailingStreet || cleanedAddresses.mailingCity || cleanedAddresses.mailingState || cleanedAddresses.mailingPostalCode) {
          // Partial address entered
          console.log('⚠️ Partial mailing address detected');
          setValidationErrors(prev => ({ 
            ...prev, 
            mailing: 'Please complete all mailing address fields.'
          }));
          hasErrors = true;
        }
      }

      // Handle results
      if (hasErrors) {
        console.log('❌ Validation errors found, not saving');
        setValidatingAddress(false);
        console.log('🟢 === END handleSaveAddresses (ERRORS) ===\n');
        return;
      }

      if (pendingValidation) {
        console.log('🔄 Showing address correction modal');
        // Use the parent's modal state setter
        setAddressValidationModal({
          isOpen: true,
          ...pendingValidation,
          onAccept: () => {
            handleAcceptSuggestion(pendingValidation.addressType, pendingValidation.suggestedAddress);
            continueWithSave();
          }
        });
        setValidatingAddress(false);
        console.log('🟢 === END handleSaveAddresses (MODAL) ===\n');
      } else {
        console.log('✅ All addresses valid, proceeding with save');
        setValidatingAddress(false);
        await saveAddresses();
        console.log('🟢 === END handleSaveAddresses (SAVED) ===\n');
      }
    } catch (error) {
      console.error('❌ Error during address validation:', error);
      setValidationErrors({ 
        home: 'An error occurred during validation. Please try again.',
        mailing: ''
      });
      setValidatingAddress(false);
      console.log('🟢 === END handleSaveAddresses (ERROR) ===\n');
    }
  };

  return (
    <div ref={sectionRef} className={`${isMobile ? "" : styleConfig2.section.wrapperEnhanced} ${hasLoaded && isVisible ? 'addresses-section-fade-in' : 'opacity-0'}`}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Addresses"
          backgroundImage={formsHeaderImage}
          overlayText="Location Details"
          subtitle="Your home and mailing addresses. All addresses are validated for accuracy."
          isEditMode={editMode.addresses}
        >
          {/* Display Mode */}
          {!editMode.addresses ? (
            <>
              <div className={`space-y-4 ${hasLoaded && isVisible ? 'addresses-section-stagger-in' : ''}`}>
                {areAddressesSame() ? (
                  <DisplayField 
                    label="Home & Mailing Address" 
                    value={formatAddress(
                      addresses.homeStreet,
                      addresses.homeCity,
                      addresses.homeState,
                      addresses.homePostalCode,
                      addresses.homeCountry
                    )} 
                  />
                ) : (
                  <>
                    <DisplayField 
                      label="Home Address" 
                      value={formatAddress(
                        addresses.homeStreet,
                        addresses.homeCity,
                        addresses.homeState,
                        addresses.homePostalCode,
                        addresses.homeCountry
                      )} 
                    />
                    <DisplayField 
                      label="Mailing Address" 
                      value={formatAddress(
                        addresses.mailingStreet,
                        addresses.mailingCity,
                        addresses.mailingState,
                        addresses.mailingPostalCode,
                        addresses.mailingCountry
                      )} 
                    />
                  </>
                )}
              </div>
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('addresses')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-6">
                {/* Home Address */}
                <div>
                  <h4 className="text-white/90 text-sm font-medium mb-3">Home Address</h4>
                  <div className="space-y-3">
                    <FormInput
                      label="Street Address *"
                      value={addresses.homeStreet || ''}
                      onChange={(e) => setAddresses({...addresses, homeStreet: e.target.value})}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="City *"
                        value={addresses.homeCity || ''}
                        onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                      />
                      <FormInput
                        label="State/Province *"
                        value={addresses.homeState || ''}
                        onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="Zip/Postal Code *"
                        value={addresses.homePostalCode || ''}
                        onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                      />
                      <FormInput
                        label="Country"
                        value={addresses.homeCountry || 'US'}
                        onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                      />
                    </div>
                  </div>
                  {validationErrors.home && (
                    <p className="mt-2 text-sm text-red-300">{validationErrors.home}</p>
                  )}
                </div>

                {/* Mailing Address */}
                <div>
                  <label className="flex items-center text-gray-700 mb-4">
                    <input
                      type="checkbox"
                      checked={addresses.sameAsHome || false}
                      onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
                      className="w-4 h-4 rounded mr-2 bg-gray-50 border border-gray-300 checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <span className="text-sm">Mailing address is the same as home address</span>
                  </label>
                  
                  {!addresses.sameAsHome && (
                    <>
                      <h4 className="text-white/90 text-sm font-medium mb-3">Mailing Address</h4>
                      <div className="space-y-3">
                        <FormInput
                          label="Street Address *"
                          value={addresses.mailingStreet || ''}
                          onChange={(e) => setAddresses({...addresses, mailingStreet: e.target.value})}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput
                            label="City *"
                            value={addresses.mailingCity || ''}
                            onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                          />
                          <FormInput
                            label="State/Province *"
                            value={addresses.mailingState || ''}
                            onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput
                            label="Zip/Postal Code *"
                            value={addresses.mailingPostalCode || ''}
                            onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                          />
                          <FormInput
                            label="Country"
                            value={addresses.mailingCountry || 'US'}
                            onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                          />
                        </div>
                      </div>
                      {validationErrors.mailing && (
                        <p className="mt-2 text-sm text-red-300">{validationErrors.mailing}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={handleSaveAddresses}
                onCancel={() => cancelEdit && cancelEdit('addresses')}
                saving={savingSection === 'addresses' || validatingAddress}
                saveText={validatingAddress ? 'Validating...' : savingSection === 'saved' ? 'Saved' : savingSection === 'addresses' ? 'Saving...' : 'Save'}
                showSaveAnyway={(validationErrors.home || validationErrors.mailing) ? true : false}
                onSaveAnyway={handleSaveAnyway}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig2.section.innerPadding}>
          {/* Desktop Header Section */}
          <div className={`relative pb-6 mb-6 border-b border-gray-200 ${hasLoaded && isVisible ? 'addresses-section-slide-in' : ''}`}>
            {/* Header content */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className={styleConfig2.header.wrapper}>
                  <div className={styleConfig2.sectionIcons.addresses}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig2.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className={styleConfig2.header.textContainer}>
                    <h2 className={styleConfig2.header.title}>Addresses</h2>
                    <p className="text-gray-600 text-base mt-1">
                      Your home and mailing addresses. All addresses are validated for accuracy.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Image on right side */}
              {sectionImage && (
                <div className="flex-shrink-0 ml-8">
                  <div className="relative w-64 h-24 rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={sectionImage} 
                      alt="" 
                      className="w-full h-full object-cover grayscale"
                    />
                    {sectionLabel && (
                      <div className="absolute bottom-0 right-0">
                        <div className="px-2.5 py-0.5 bg-gradient-to-r from-[#162740] to-[#6e4376]">
                          <p className="text-white text-xs font-medium tracking-wider flex items-center gap-1">
                            {sectionLabel}
                            <img src={alcorStar} alt="" className="w-3 h-3" />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Content - Fields Section */}
          <div className="bg-white">
            {/* Display Mode */}
            {!editMode.addresses ? (
              <div className={`max-w-2xl ${hasLoaded && isVisible ? 'addresses-section-stagger-in' : ''}`}>
                {areAddressesSame() ? (
                  /* Single Address Display when mailing is same as home */
                  <div>
                    <h3 className="font-medium text-[#2a2346] mb-4">Home & Mailing Address</h3>
                    <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
                      <InfoDisplay 
                        label="Street Address" 
                        value={addresses.homeStreet} 
                        className="col-span-3"
                      />
                      <InfoDisplay 
                        label="City" 
                        value={addresses.homeCity} 
                      />
                      <InfoDisplay 
                        label="State/Province" 
                        value={addresses.homeState} 
                      />
                      <InfoDisplay 
                        label="Zip/Postal Code" 
                        value={addresses.homePostalCode} 
                      />
                      <InfoDisplay 
                        label="Country" 
                        value={addresses.homeCountry || 'US'} 
                        className="col-span-2"
                      />
                    </dl>
                  </div>
                ) : (
                  /* Separate Address Display */
                  <>
                    {/* Home Address Section */}
                    <div className="mb-8">
                      <h3 className="font-medium text-[#2a2346] mb-4">Home Address</h3>
                      <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
                        <InfoDisplay 
                          label="Street Address" 
                          value={addresses.homeStreet} 
                          className="col-span-3"
                        />
                        <InfoDisplay 
                          label="City" 
                          value={addresses.homeCity} 
                        />
                        <InfoDisplay 
                          label="State/Province" 
                          value={addresses.homeState} 
                        />
                        <InfoDisplay 
                          label="Zip/Postal Code" 
                          value={addresses.homePostalCode} 
                        />
                        <InfoDisplay 
                          label="Country" 
                          value={addresses.homeCountry || 'US'} 
                          className="col-span-2"
                        />
                      </dl>
                    </div>

                    {/* Mailing Address Section */}
                    <div>
                      <h3 className="font-medium text-[#2a2346] mb-4">Mailing Address</h3>
                      <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
                        <InfoDisplay 
                          label="Street Address" 
                          value={addresses.mailingStreet} 
                          className="col-span-3"
                        />
                        <InfoDisplay 
                          label="City" 
                          value={addresses.mailingCity} 
                        />
                        <InfoDisplay 
                          label="State/Province" 
                          value={addresses.mailingState} 
                        />
                        <InfoDisplay 
                          label="Zip/Postal Code" 
                          value={addresses.mailingPostalCode} 
                        />
                        <InfoDisplay 
                          label="Country" 
                          value={addresses.mailingCountry || 'US'} 
                          className="col-span-2"
                        />
                      </dl>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Edit Mode - Form */
              <div className="max-w-2xl">
                {/* Home Address */}
                <div className="mb-6">
                  <h3 className="font-medium text-[#2a2346] mb-4">Home Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      containerClassName="col-span-2"
                      label="Street Address *"
                      type="text"
                      value={addresses.homeStreet || ''}
                      onChange={(e) => setAddresses({...addresses, homeStreet: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="City *"
                      type="text"
                      value={addresses.homeCity || ''}
                      onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="State/Province *"
                      type="text"
                      value={addresses.homeState || ''}
                      onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="Zip/Postal Code *"
                      type="text"
                      value={addresses.homePostalCode || ''}
                      onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="Country"
                      type="text"
                      value={addresses.homeCountry || 'US'}
                      onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                  </div>
                  {validationErrors.home && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.home}</p>
                  )}
                </div>

                {/* Mailing Address */}
                <div className="mb-6">
                  <Checkbox
                    label="Mailing address is the same as home address"
                    checked={addresses.sameAsHome || false}
                    onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
                    disabled={!editMode.addresses}
                  />
                  
                  {!addresses.sameAsHome && (
                    <>
                      <h3 className="font-medium text-[#2a2346] mb-4 mt-4">Mailing Address</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          containerClassName="col-span-2"
                          label="Street Address *"
                          type="text"
                          value={addresses.mailingStreet || ''}
                          onChange={(e) => setAddresses({...addresses, mailingStreet: e.target.value})}
                          disabled={!editMode.addresses}
                        />
                        <Input
                          label="City *"
                          type="text"
                          value={addresses.mailingCity || ''}
                          onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                          disabled={!editMode.addresses}
                        />
                        <Input
                          label="State/Province *"
                          type="text"
                          value={addresses.mailingState || ''}
                          onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                          disabled={!editMode.addresses}
                        />
                        <Input
                          label="Zip/Postal Code *"
                          type="text"
                          value={addresses.mailingPostalCode || ''}
                          onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                          disabled={!editMode.addresses}
                        />
                        <Input
                          label="Country"
                          type="text"
                          value={addresses.mailingCountry || 'US'}
                          onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                          disabled={!editMode.addresses}
                        />
                      </div>
                      {validationErrors.mailing && (
                        <p className="mt-2 text-sm text-red-600">{validationErrors.mailing}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 -mr-8">
              {editMode?.addresses ? (
                <div className="flex">
                  <WhiteButton
                    text="Cancel"
                    onClick={() => cancelEdit && cancelEdit('addresses')}
                    className="scale-75 -mr-8"
                    spinStar={false}
                  />
                  {(validationErrors.home || validationErrors.mailing) && (
                    <WhiteButton
                      text="Save Anyway"
                      onClick={handleSaveAnyway}
                      className="scale-75 -mr-8"
                      spinStar={false}
                    />
                  )}
                  <PurpleButton
                    text={validatingAddress ? 'Validating...' : savingSection === 'saved' ? 'Saved' : savingSection === 'addresses' ? 'Saving...' : 'Save'}
                    onClick={handleSaveAddresses}
                    className="scale-75"
                    spinStar={false}
                  />
                </div>
              ) : (
                <RainbowButton
                  text="Edit"
                  onClick={() => toggleEditMode && toggleEditMode('addresses')}
                  className="scale-75"
                  spinStar={true}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesSection;