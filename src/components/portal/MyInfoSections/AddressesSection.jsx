import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { cleanAddressData, cleanAddressObject } from '../utils/dataFormatting';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import fieldStyles from './desktopCardStyles/fieldStyles';
import alcorStar from '../../../assets/images/alcor-star.png';
import { 
  overlayStyles, 
  infoCardStyles, 
  sectionImageStyles, 
  headerStyles, 
  buttonStyles, 
  animationStyles 
} from './desktopCardStyles/index';
import { InfoField, InfoCard } from './SharedInfoComponents';

// Melissa API configuration
const MELISSA_API_KEY = 'AVUaS6bp3WJyyFKHjjwqgj**nSAcwXpxhQ0PC2lXxuDAZ-**';
const MELISSA_API_URL = 'https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress';

// Overlay Component
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  data, 
  addresses, 
  setAddresses, 
  saveAddresses,
  savingSection
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localAddresses, setLocalAddresses] = useState(addresses);

  const [localValidatingAddress, setLocalValidatingAddress] = useState(false);
  const [localValidationErrors, setLocalValidationErrors] = useState({
    home: '',
    mailing: '',
    homeFields: {
      street: false,
      city: false,
      state: false,
      postalCode: false
    },
    mailingFields: {
      street: false,
      city: false,
      state: false,
      postalCode: false
    }
  });

  // Debug validation errors
  useEffect(() => {
    console.log('📊 Current validation errors:', localValidationErrors);
  }, [localValidationErrors]);

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in display mode
      setShowSuccess(false);
      // Reset local addresses to match the current addresses when opening
      setLocalAddresses(addresses);
      // Clear any validation errors when opening
      setLocalValidationErrors({
        home: '',
        mailing: '',
        homeFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        },
        mailingFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      });
    }
  }, [isOpen, addresses]);

  if (!isOpen) return null;

  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return '—';
    return parts.join(', ');
  };

  const handleEdit = () => {
    setEditMode(true);
    // Clear any existing validation errors when entering edit mode
    setLocalValidationErrors({
      home: '',
      mailing: '',
      homeFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      },
      mailingFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    });
  };

  const handleSave = async () => {
    console.log('🔴 SAVE CLICKED - Starting validation');
    console.log('Current addresses:', localAddresses);
    
    // Clear any existing validation errors first
    setLocalValidationErrors({
      home: '',
      mailing: '',
      homeFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      },
      mailingFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    });
    
    // Set validating state
    setLocalValidatingAddress(true);
    
    try {
      let hasErrors = false;
      
      // ALWAYS validate home address
      console.log('🏠 Validating home address...');
      const homeValidation = await validateAddressWithMelissa({
        street: localAddresses.homeStreet || '',
        city: localAddresses.homeCity || '',
        state: localAddresses.homeState || '',
        postalCode: localAddresses.homePostalCode || '',
        country: localAddresses.homeCountry || 'US'
      }, 'home');

      console.log('Home validation result:', homeValidation);

      if (!homeValidation.isValid) {
        console.log('❌ Home address INVALID');
        setLocalValidationErrors(prev => { 
          const newErrors = {
            ...prev, 
            home: 'This address could not be verified. Please double-check it\'s correct.',
            homeFields: homeValidation.invalidFields
          };
          console.log('Setting home errors:', newErrors);
          return newErrors;
        });
        hasErrors = true;
      }

      // Validate mailing if not same as home
      if (!localAddresses.sameAsHome) {
        console.log('📬 Validating mailing address...');
        const mailingValidation = await validateAddressWithMelissa({
          street: localAddresses.mailingStreet || '',
          city: localAddresses.mailingCity || '',
          state: localAddresses.mailingState || '',
          postalCode: localAddresses.mailingPostalCode || '',
          country: localAddresses.mailingCountry || 'US'
        }, 'mailing');

        console.log('Mailing validation result:', mailingValidation);

        if (!mailingValidation.isValid) {
          console.log('❌ Mailing address INVALID');
          setLocalValidationErrors(prev => {
            const newErrors = {
              ...prev, 
              mailing: 'This address could not be verified. Please double-check it\'s correct.',
              mailingFields: mailingValidation.invalidFields
            };
            console.log('Setting mailing errors:', newErrors);
            return newErrors;
          });
          hasErrors = true;
        }
      }

      setLocalValidatingAddress(false);

      if (hasErrors) {
        console.log('🛑 VALIDATION FAILED - NOT SAVING - SHOWING ERRORS');
        // Force a re-render by updating state
        setEditMode(true);
        // DO NOT SAVE - just show errors
        return;
      }

      // Only reach here if validation passed
      console.log('✅ Validation passed - saving to backend');
      
      // Update parent state
      setAddresses(localAddresses);
      
      // Save to backend
      await saveAddresses();
      
      setEditMode(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error during validation:', error);
      setLocalValidationErrors({ 
        home: 'An error occurred during validation. Please try again.',
        mailing: '',
        homeFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        },
        mailingFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      });
      setLocalValidatingAddress(false);
    }
  };

  const handleCancel = () => {
    // Reset local addresses to original values
    setLocalAddresses(addresses);
    setEditMode(false);
  };

  const handleSaveAnyway = async () => {
    console.log('🟡 SAVE ANYWAY CLICKED - Bypassing validation');
    
    // Clear all validation errors
    setLocalValidationErrors({ 
      home: '', 
      mailing: '',
      homeFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      },
      mailingFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    });
    
    // Update parent addresses with local changes
    console.log('Updating parent with addresses:', localAddresses);
    setAddresses(localAddresses);
    
    // SAVE TO BACKEND
    console.log('Calling saveAddresses to save to backend...');
    await saveAddresses();
    console.log('Save complete!');
    
    // Show success and close
    setEditMode(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  // Validate address with Melissa API
  const validateAddressWithMelissa = async (address, addressType) => {
    console.log('🔵 === START validateAddressWithMelissa ===');
    console.log('📋 Address to validate:', addressType, address);
    
    // First check if any required fields are empty
    const emptyFields = {
      street: !address.street || address.street.trim() === '',
      city: !address.city || address.city.trim() === '',
      state: !address.state || address.state.trim() === '',
      postalCode: !address.postalCode || address.postalCode.trim() === ''
    };
    
    // If any required fields are empty, mark only those as invalid
    if (Object.values(emptyFields).some(v => v)) {
      console.log('❌ Empty fields detected:', emptyFields);
      return {
        isValid: false,
        invalidFields: emptyFields
      };
    }
    
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
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = await response.json();
      console.log('📦 Melissa API Response:', JSON.stringify(data, null, 2));

      // Check for transmission errors
      if (data.TransmissionResults && data.TransmissionResults !== '' && data.TransmissionResults !== 'GE00') {
        console.log('❌ API Error detected');
        // For API errors, we can't determine which field is wrong, so don't mark any
        return { 
          isValid: false,
          invalidFields: {
            street: false,
            city: false,
            state: false,
            postalCode: false
          }
        };
      }

      if (data.Version && data.Records && data.Records.length > 0) {
        const record = data.Records[0];
        
        if (record) {
          const addressVerificationCode = record.Results || '';
          console.log('✅ Verification code:', addressVerificationCode);
          
          // ONLY accept AV25, AV24, AV23 - these are fully verified addresses
          const fullyVerifiedCodes = ['AV25', 'AV24', 'AV23'];
          const isFullyVerified = fullyVerifiedCodes.some(code => addressVerificationCode.includes(code));
          
          // Also check for ANY error codes
          const hasErrors = addressVerificationCode.includes('AE') || // Address Error
                           addressVerificationCode.includes('AC') || // Address Change/Correction needed
                           !addressVerificationCode.includes('AV');   // No address verification at all
          
          console.log('📬 Is fully verified?', isFullyVerified);
          console.log('❌ Has errors?', hasErrors);
          
          // Must be fully verified AND have no errors
          const isValid = isFullyVerified && !hasErrors;
          
          // Try to determine which specific field is wrong based on error codes
          let invalidFields = {
            street: false,
            city: false,
            state: false,
            postalCode: false
          };
          
          // Check specific error codes
          if (!isValid) {
            // Check if street is invalid
            if (addressVerificationCode.includes('AE01') || addressVerificationCode.includes('AE02') || 
                addressVerificationCode.includes('AS01') || addressVerificationCode.includes('AS02')) {
              invalidFields.street = true;
            }
            // Check if city is invalid
            else if (addressVerificationCode.includes('AE03') || addressVerificationCode.includes('AE04') ||
                     addressVerificationCode.includes('AS03')) {
              invalidFields.city = true;
            }
            // Check if state is invalid
            else if (addressVerificationCode.includes('AE05') || addressVerificationCode.includes('AE06')) {
              invalidFields.state = true;
            }
            // Check if zip is invalid
            else if (addressVerificationCode.includes('AE07') || addressVerificationCode.includes('AE08') ||
                     addressVerificationCode.includes('AE09') || addressVerificationCode.includes('AE10') ||
                     addressVerificationCode.includes('AE11')) {
              invalidFields.postalCode = true;
            }
            // If we can't determine specific field, don't mark any as red
            else {
              invalidFields = {
                street: false,
                city: false,
                state: false,
                postalCode: false
              };
            }
          }
          
          return { isValid, invalidFields };
        }
      }
      
      console.log('❌ No valid response - address not verified');
      // Can't determine specific field, so don't mark any
      return { 
        isValid: false,
        invalidFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      };
    } catch (error) {
      console.error('❌ Melissa API error:', error);
      // Can't determine specific field, so don't mark any
      return { 
        isValid: false,
        invalidFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      };
    }
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'home':
        return {
          title: 'Home Address',
          description: 'Your primary residential address. This address will be validated for accuracy.',
          fields: {
            'Street Address': 'Your street address including apartment or unit number.',
            'City': 'The city where you reside.',
            'State/Province': 'Your state or province.',
            'Zip/Postal Code': 'Your ZIP or postal code.',
            'Country': 'Country (defaults to US if not specified).'
          }
        };
      case 'mailing':
        return {
          title: 'Mailing Address',
          description: 'The address where you receive mail. Can be the same as your home address.',
          fields: {
            'Street Address': 'Street address for mail delivery.',
            'City': 'City for mail delivery.',
            'State/Province': 'State or province for mail delivery.',
            'Zip/Postal Code': 'ZIP or postal code for mail delivery.',
            'Country': 'Country for mail delivery.'
          }
        };
      default:
        return { title: '', description: '', fields: {} };
    }
  };

  const fieldInfo = getFieldDescriptions();

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={onClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
        <div className={overlayStyles.contentBox}>
          {/* Header */}
          <div className={overlayStyles.header.wrapper}>
            <button
              onClick={onClose}
              className={overlayStyles.header.closeButton}
            >
              <svg className={overlayStyles.header.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className={overlayStyles.header.content}>
              <div className={overlayStyles.header.iconSection}>
                <div className={overlayStyles.header.iconBox} style={overlayStyles.header.iconBoxBg}>
                  <svg className={overlayStyles.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={overlayStyles.header.iconColor}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className={overlayStyles.header.textWrapper}>
                  <h3 className={overlayStyles.header.title}>
                    {fieldInfo.title}
                  </h3>
                  <p className={overlayStyles.header.description}>
                    {fieldInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={overlayStyles.body.wrapper}>
            {/* Success Message */}
            {showSuccess && (
              <div className={overlayStyles.body.successMessage.container}>
                <svg className={overlayStyles.body.successMessage.icon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={overlayStyles.body.successMessage.text}>Address updated successfully!</p>
              </div>
            )}

            {/* Fields */}
            {!editMode ? (
              /* Display Mode */
              <div className="space-y-6">
                {section === 'home' && (
                  <>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Street Address</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.homeStreet)}
                        >
                          {addresses?.homeStreet || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>City</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.homeCity)}
                        >
                          {addresses?.homeCity || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>State/Province</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.homeState)}
                        >
                          {addresses?.homeState || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Zip/Postal Code</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.homePostalCode)}
                        >
                          {addresses?.homePostalCode || '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Country</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.homeCountry)}
                      >
                        {addresses?.homeCountry || 'US'}
                      </p>
                    </div>
                  </>
                )}

                {section === 'mailing' && (
                  <>
                    {addresses?.sameAsHome ? (
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Mailing Address</label>
                        <p className={overlayStyles.displayMode.field.value}>
                          Same as home address
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Street Address</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.mailingStreet)}
                            >
                              {addresses?.mailingStreet || '—'}
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>City</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.mailingCity)}
                            >
                              {addresses?.mailingCity || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>State/Province</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.mailingState)}
                            >
                              {addresses?.mailingState || '—'}
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Zip/Postal Code</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.mailingPostalCode)}
                            >
                              {addresses?.mailingPostalCode || '—'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Country</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!addresses?.mailingCountry)}
                          >
                            {addresses?.mailingCountry || 'US'}
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {section === 'home' && (
                  <>
                    <Input
                      label="Street Address *"
                      type="text"
                      value={localAddresses?.homeStreet || ''}
                      onChange={(e) => setLocalAddresses({...localAddresses, homeStreet: e.target.value})}
                      disabled={savingSection === 'addresses' || localValidatingAddress}
                      error={localValidationErrors.homeFields?.street}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City *"
                        type="text"
                        value={localAddresses?.homeCity || ''}
                        onChange={(e) => setLocalAddresses({...localAddresses, homeCity: e.target.value})}
                        disabled={savingSection === 'addresses' || localValidatingAddress}
                        error={localValidationErrors.homeFields?.city}
                      />
                      <Input
                        label="State/Province *"
                        type="text"
                        value={localAddresses?.homeState || ''}
                        onChange={(e) => setLocalAddresses({...localAddresses, homeState: e.target.value})}
                        disabled={savingSection === 'addresses' || localValidatingAddress}
                        error={localValidationErrors.homeFields?.state}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Zip/Postal Code *"
                        type="text"
                        value={localAddresses?.homePostalCode || ''}
                        onChange={(e) => setLocalAddresses({...localAddresses, homePostalCode: e.target.value})}
                        disabled={savingSection === 'addresses' || localValidatingAddress}
                        error={localValidationErrors.homeFields?.postalCode}
                      />
                      <Input
                        label="Country"
                        type="text"
                        value={localAddresses?.homeCountry || 'US'}
                        onChange={(e) => setLocalAddresses({...localAddresses, homeCountry: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                    </div>
                    {localValidationErrors.home && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {localValidationErrors.home}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {section === 'mailing' && (
                  <>
                    <Checkbox
                      label="Mailing address is the same as home address"
                      checked={localAddresses?.sameAsHome || false}
                      onChange={(e) => setLocalAddresses({...localAddresses, sameAsHome: e.target.checked})}
                      disabled={savingSection === 'addresses' || localValidatingAddress}
                    />
                    
                    {!localAddresses?.sameAsHome && (
                      <>
                        <Input
                          label="Street Address *"
                          type="text"
                          value={localAddresses?.mailingStreet || ''}
                          onChange={(e) => setLocalAddresses({...localAddresses, mailingStreet: e.target.value})}
                          disabled={savingSection === 'addresses' || localValidatingAddress}
                          error={localValidationErrors.mailingFields?.street}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="City *"
                            type="text"
                            value={localAddresses?.mailingCity || ''}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingCity: e.target.value})}
                            disabled={savingSection === 'addresses' || localValidatingAddress}
                            error={localValidationErrors.mailingFields?.city}
                          />
                          <Input
                            label="State/Province *"
                            type="text"
                            value={localAddresses?.mailingState || ''}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingState: e.target.value})}
                            disabled={savingSection === 'addresses' || localValidatingAddress}
                            error={localValidationErrors.mailingFields?.state}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Zip/Postal Code *"
                            type="text"
                            value={localAddresses?.mailingPostalCode || ''}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingPostalCode: e.target.value})}
                            disabled={savingSection === 'addresses' || localValidatingAddress}
                            error={localValidationErrors.mailingFields?.postalCode}
                          />
                          <Input
                            label="Country"
                            type="text"
                            value={localAddresses?.mailingCountry || 'US'}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingCountry: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                        </div>
                        {localValidationErrors.mailing && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600 flex items-center">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              {localValidationErrors.mailing}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={overlayStyles.footer.wrapper}>
            {!editMode ? (
              <PurpleButton
                text="Edit"
                onClick={handleEdit}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            ) : (
              <>
                <WhiteButton
                  text="Cancel"
                  onClick={handleCancel}
                  className={buttonStyles.overlayButtons.cancel}
                  spinStar={buttonStyles.starConfig.enabled}
                />
                {(localValidationErrors.home || localValidationErrors.mailing) && (
                  <WhiteButton
                    text="Save Anyway"
                    onClick={handleSaveAnyway}
                    className={buttonStyles.overlayButtons.cancel}
                    spinStar={buttonStyles.starConfig.enabled}
                  />
                )}
                <PurpleButton
                  text={localValidatingAddress ? 'Validating...' : savingSection === 'addresses' ? 'Saving...' : 'Save'}
                  onClick={() => {
                    // Update parent addresses with local changes before saving
                    setAddresses(localAddresses);
                    handleSave();
                  }}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'addresses' || localValidatingAddress}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const AddressesSection = ({ 
  addresses, 
  setAddresses, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveAddresses, 
  savingSection,
  setAddressValidationModal,
  sectionImage,
  sectionLabel
}) => {
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    home: '',
    mailing: '',
    homeFields: {
      street: false,
      city: false,
      state: false,
      postalCode: false
    },
    mailingFields: {
      street: false,
      city: false,
      state: false,
      postalCode: false
    }
  });
  const [skipValidation, setSkipValidation] = useState(false);
  
  // Add state for mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inject animation styles
  useEffect(() => {
    const style = animationStyles.injectStyles();
    
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
          // Delay to create smooth entrance
          setTimeout(() => {
            setHasLoaded(true);
            // Stagger card animations after section fades in
            setTimeout(() => setCardsVisible(true), 200);
          }, 100);
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

  // Validate address with Melissa API
  const validateAddressWithMelissa = async (address, addressType) => {
    console.log('🔵 === START validateAddressWithMelissa ===');
    console.log('📋 Address to validate:', addressType, address);
    
    // First check if any required fields are empty
    const emptyFields = {
      street: !address.street || address.street.trim() === '',
      city: !address.city || address.city.trim() === '',
      state: !address.state || address.state.trim() === '',
      postalCode: !address.postalCode || address.postalCode.trim() === ''
    };
    
    // If any required fields are empty, mark only those as invalid
    if (Object.values(emptyFields).some(v => v)) {
      console.log('❌ Empty fields detected:', emptyFields);
      return {
        isValid: false,
        invalidFields: emptyFields
      };
    }
    
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
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = await response.json();
      console.log('📦 Melissa API Response:', JSON.stringify(data, null, 2));

      // Check for transmission errors
      if (data.TransmissionResults && data.TransmissionResults !== '' && data.TransmissionResults !== 'GE00') {
        console.log('❌ API Error detected');
        // For API errors, we can't determine which field is wrong, so don't mark any
        return { 
          isValid: false,
          invalidFields: {
            street: false,
            city: false,
            state: false,
            postalCode: false
          }
        };
      }

      if (data.Version && data.Records && data.Records.length > 0) {
        const record = data.Records[0];
        
        if (record) {
          const addressVerificationCode = record.Results || '';
          console.log('✅ Verification code:', addressVerificationCode);
          
          // ONLY accept AV25, AV24, AV23 - these are fully verified addresses
          const fullyVerifiedCodes = ['AV25', 'AV24', 'AV23'];
          const isFullyVerified = fullyVerifiedCodes.some(code => addressVerificationCode.includes(code));
          
          // Also check for ANY error codes
          const hasErrors = addressVerificationCode.includes('AE') || // Address Error
                           addressVerificationCode.includes('AC') || // Address Change/Correction needed
                           !addressVerificationCode.includes('AV');   // No address verification at all
          
          console.log('📬 Is fully verified?', isFullyVerified);
          console.log('❌ Has errors?', hasErrors);
          
          // Must be fully verified AND have no errors
          const isValid = isFullyVerified && !hasErrors;
          
          // Try to determine which specific field is wrong based on error codes
          let invalidFields = {
            street: false,
            city: false,
            state: false,
            postalCode: false
          };
          
          // Check specific error codes
          if (!isValid) {
            // Check if street is invalid
            if (addressVerificationCode.includes('AE01') || addressVerificationCode.includes('AE02') || 
                addressVerificationCode.includes('AS01') || addressVerificationCode.includes('AS02')) {
              invalidFields.street = true;
            }
            // Check if city is invalid
            else if (addressVerificationCode.includes('AE03') || addressVerificationCode.includes('AE04') ||
                     addressVerificationCode.includes('AS03')) {
              invalidFields.city = true;
            }
            // Check if state is invalid
            else if (addressVerificationCode.includes('AE05') || addressVerificationCode.includes('AE06')) {
              invalidFields.state = true;
            }
            // Check if zip is invalid
            else if (addressVerificationCode.includes('AE07') || addressVerificationCode.includes('AE08') ||
                     addressVerificationCode.includes('AE09') || addressVerificationCode.includes('AE10') ||
                     addressVerificationCode.includes('AE11')) {
              invalidFields.postalCode = true;
            }
            // If we can't determine specific field, don't mark any as red
            else {
              invalidFields = {
                street: false,
                city: false,
                state: false,
                postalCode: false
              };
            }
          }
          
          return { isValid, invalidFields };
        }
      }
      
      console.log('❌ No valid response - address not verified');
      // Can't determine specific field, so don't mark any
      return { 
        isValid: false,
        invalidFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      };
    } catch (error) {
      console.error('❌ Melissa API error:', error);
      // Can't determine specific field, so don't mark any
      return { 
        isValid: false,
        invalidFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
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
      setValidationErrors({ 
        home: '', 
        mailing: '',
        homeFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        },
        mailingFields: {
          street: false,
          city: false,
          state: false,
          postalCode: false
        }
      });
      setSkipValidation(false);
    }
  }, [editMode.addresses]);

  // Continue with save after validation
  const continueWithSave = async () => {
    // All addresses are now validated, proceed with save
    await saveAddresses();
  };

  // Handle save anyway
  const handleSaveAnyway = async () => {
    console.log('🟡 Save Anyway clicked from overlay');
    
    // Clear validation errors
    setValidationErrors({ 
      home: '', 
      mailing: '',
      homeFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      },
      mailingFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    });
    
    // Update parent addresses with local changes
    setAddresses(addresses);
    
    // Clean the addresses before saving
    const cleanedAddresses = cleanAddressData(addresses);
    setAddresses(cleanedAddresses);
    
    await saveAddresses();
    
    // Show success and close
    setEditMode(false);
    setShowSuccess(false);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
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
    setValidationErrors({ 
      home: '', 
      mailing: '',
      homeFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      },
      mailingFields: {
        street: false,
        city: false,
        state: false,
        postalCode: false
      }
    });

    try {
      let hasErrors = false;

      // Validate home address if all fields are filled
      if (cleanedAddresses.homeStreet && cleanedAddresses.homeCity && cleanedAddresses.homeState && cleanedAddresses.homePostalCode) {
        console.log('🏠 Validating home address...');
        const homeValidation = await validateAddressWithMelissa({
          street: cleanedAddresses.homeStreet,
          city: cleanedAddresses.homeCity,
          state: cleanedAddresses.homeState,
          postalCode: cleanedAddresses.homePostalCode,
          country: cleanedAddresses.homeCountry || 'US'
        }, 'home');

        if (!homeValidation.isValid) {
          setValidationErrors(prev => ({ 
            ...prev, 
            home: 'This address could not be verified. Please double-check it\'s correct.',
            homeFields: homeValidation.invalidFields || {
              street: true,
              city: true,
              state: true,
              postalCode: true
            }
          }));
          hasErrors = true;
        }
      }

      // Only validate mailing if not same as home and all fields are filled
      if (!cleanedAddresses.sameAsHome) {
        if (cleanedAddresses.mailingStreet && cleanedAddresses.mailingCity && cleanedAddresses.mailingState && cleanedAddresses.mailingPostalCode) {
          console.log('📬 Validating mailing address...');
          const mailingValidation = await validateAddressWithMelissa({
            street: cleanedAddresses.mailingStreet,
            city: cleanedAddresses.mailingCity,
            state: cleanedAddresses.mailingState,
            postalCode: cleanedAddresses.mailingPostalCode,
            country: cleanedAddresses.mailingCountry || 'US'
          }, 'mailing');

          if (!mailingValidation.isValid) {
            setValidationErrors(prev => ({ 
              ...prev, 
              mailing: 'This address could not be verified. Please double-check it\'s correct.',
              mailingFields: mailingValidation.invalidFields || {
                street: true,
                city: true,
                state: true,
                postalCode: true
              }
            }));
            hasErrors = true;
          }
        }
      }

      setValidatingAddress(false);

      // If validation errors, don't save automatically
      if (hasErrors) {
        console.log('❌ Validation errors found, showing Save Anyway option');
        console.log('🟢 === END handleSaveAddresses (ERRORS) ===\n');
        return;
      }

      // All addresses are valid, proceed with save
      console.log('✅ All addresses valid, proceeding with save');
      await saveAddresses();
      console.log('🟢 === END handleSaveAddresses (SAVED) ===\n');
      
      // Close overlay after successful save
      if (overlayOpen) {
        setOverlayOpen(false);
      }
      
      return 'saved';
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

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = async () => {
    const result = await handleSaveAddresses();
    // Close overlay on successful save
    if (result === 'saved') {
      setOverlayOpen(false);
    }
  };

  return (
    <div ref={sectionRef} className={`addresses-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ addresses }}
        addresses={addresses}
        setAddresses={setAddresses}
        saveAddresses={saveAddresses}
        savingSection={savingSection}
      />

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
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Desktop Header Section */}
            <div className={headerStyles.container}>
              <div className={headerStyles.contentWrapper}>
                <div className={headerStyles.leftContent}>
                  <div className={headerStyles.iconTextWrapper(styleConfig2)}>
                    <div className={headerStyles.getIconContainer(styleConfig2, 'addresses')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Addresses</h2>
                      <p className={headerStyles.subtitle}>
                        Your home and mailing addresses. All addresses are validated for accuracy.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Image on right side */}
                {sectionImage && (
                  <div className={sectionImageStyles.wrapper}>
                    <div className={sectionImageStyles.imageBox}>
                      <img 
                        src={sectionImage} 
                        alt="" 
                        className={sectionImageStyles.image}
                      />
                      {/* Dark purple/blue overlay base */}
                      <div 
                        className={sectionImageStyles.overlays.darkBase.className} 
                        style={sectionImageStyles.overlays.darkBase.style}
                      ></div>
                      {/* Radial yellow glow from bottom */}
                      <div 
                        className={sectionImageStyles.overlays.yellowGlow.className} 
                        style={sectionImageStyles.overlays.yellowGlow.style}
                      ></div>
                      {/* Purple/pink glow overlay */}
                      <div 
                        className={sectionImageStyles.overlays.purpleGlow.className} 
                        style={sectionImageStyles.overlays.purpleGlow.style}
                      ></div>
                      {/* Large star positioned lower */}
                      <div className={sectionImageStyles.star.wrapper}>
                        <img 
                          src={alcorStar} 
                          alt="" 
                          className={sectionImageStyles.star.image}
                          style={sectionImageStyles.star.imageStyle}
                        />
                      </div>
                      {sectionLabel && (
                        <div className={sectionImageStyles.label.wrapper}>
                          <div className={sectionImageStyles.label.container}>
                            <p className={sectionImageStyles.label.text}>
                              {sectionLabel}
                              <img src={alcorStar} alt="" className={sectionImageStyles.label.starIcon} />
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Home Address Card */}
                  <InfoCard 
                    title="Home Address" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    }
                    sectionKey="home"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('home')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('home')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Street Address" value={addresses?.homeStreet || '—'} />
                    <InfoField label="City" value={addresses?.homeCity || '—'} />
                    <InfoField label="State/Province" value={addresses?.homeState || '—'} />
                  </InfoCard>

                  {/* Mailing Address Card */}
                  <InfoCard 
                    title="Mailing Address" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                    sectionKey="mailing"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('mailing')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('mailing')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    {areAddressesSame() ? (
                      <>
                        <InfoField label="Same as Home" value="Yes" />
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                      </>
                    ) : (
                      <>
                        <InfoField label="Street Address" value={addresses?.mailingStreet || '—'} />
                        <InfoField label="City" value={addresses?.mailingCity || '—'} />
                        <InfoField label="State/Province" value={addresses?.mailingState || '—'} />
                      </>
                    )}
                  </InfoCard>

                  {/* Empty third column for consistent layout */}
                  <div></div>
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
              <div className={buttonStyles.actionContainer}>
                {editMode?.addresses ? (
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('addresses')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    {(validationErrors.home || validationErrors.mailing) && (
                      <WhiteButton
                        text="Save Anyway"
                        onClick={handleSaveAnyway}
                        className={buttonStyles.whiteButton.withMargin}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    )}
                    <PurpleButton
                      text={validatingAddress ? 'Validating...' : buttonStyles.getSaveButtonText(savingSection)}
                      onClick={handleSaveAddresses}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                  </div>
                ) : (
                  <WhiteButton
                    text="Edit"
                    onClick={() => toggleEditMode && toggleEditMode('addresses')}
                    className={buttonStyles.whiteButton.base}
                    spinStar={buttonStyles.starConfig.enabled}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesSection;