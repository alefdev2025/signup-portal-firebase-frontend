// AddressesSection.jsx - Simplified approach with validation in overlay

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Checkbox, Select } from '../FormComponents';  // CHANGED: Added Select to imports
import { WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2 from '../styleConfig2';
import { cleanAddressData } from '../utils/dataFormatting';
import { MobileInfoCard, DisplayField, FormInput, ActionButtons } from './MobileInfoCard';
import AddressesMobile from './AddressesMobile';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import fieldStyles from './desktopCardStyles/fieldStyles';
import alcorStar from '../../../assets/images/alcor-star.png';
import { normalizeAddressCountries } from './CountryMapper';
import { countries } from './countries';  // CHANGED: Added countries import
import { 
  overlayStyles, 
  infoCardStyles, 
  sectionImageStyles, 
  headerStyles, 
  buttonStyles, 
  animationStyles 
} from './desktopCardStyles/index';
import { InfoField, InfoCard } from './SharedInfoComponents';
import { CompletionWheelWithLegend } from './CompletionWheel';
import { memberCategoryConfig } from '../memberCategoryConfig';

// Overlay Component - Validate BEFORE calling parent save
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  addresses,
  setAddresses,
  onSave,
  savingSection,
  toggleEditMode,
  cancelEdit,
  memberCategory
}) => {
  const [overlayEditMode, setOverlayEditMode] = useState(false);
  const [showOverlaySuccess, setShowOverlaySuccess] = useState(false);
  const [isOverlaySaving, setIsOverlaySaving] = useState(false);
  const [overlayFieldErrors, setOverlayFieldErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setOverlayEditMode(false);
      setShowOverlaySuccess(false);
      setIsOverlaySaving(false);
      setOverlayFieldErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayEdit = () => {
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
    setOverlayFieldErrors({});
  };

  const validateAddresses = (addressData) => {
    const errors = {};
    
    // Get required fields for this member category
    const requiredFields = memberCategoryConfig[memberCategory]?.sections?.addresses?.requiredFields || [];
    
    // Validate home address if required
    if (requiredFields.includes('homeStreet') && !addressData.homeStreet) {
      errors.homeStreet = 'Home street address is required';
    }
    if (requiredFields.includes('homeCity') && !addressData.homeCity) {
      errors.homeCity = 'Home city is required';
    }
    if (requiredFields.includes('homeState') && !addressData.homeState) {
      errors.homeState = 'Home state is required';
    }
    if (requiredFields.includes('homePostalCode') && !addressData.homePostalCode) {
      errors.homePostalCode = 'Home postal code is required';
    }
    
    // Validate mailing address if not same as home and if we're editing mailing section
    if (section === 'mailing' && !addressData.sameAsHome && memberCategory === 'CryoMember') {
      if (requiredFields.includes('mailingStreet') && !addressData.mailingStreet) {
        errors.mailingStreet = 'Mailing street address is required';
      }
      if (requiredFields.includes('mailingCity') && !addressData.mailingCity) {
        errors.mailingCity = 'Mailing city is required';
      }
      if (requiredFields.includes('mailingState') && !addressData.mailingState) {
        errors.mailingState = 'Mailing state is required';
      }
      if (requiredFields.includes('mailingPostalCode') && !addressData.mailingPostalCode) {
        errors.mailingPostalCode = 'Mailing postal code is required';
      }
    }
    
    return errors;
  };

  const handleOverlaySave = async () => {
    console.log('🔵 Overlay handleOverlaySave called');
    setIsOverlaySaving(true);
    setShowOverlaySuccess(false);
    setOverlayFieldErrors({});
    
    // Normalize country codes
    const normalizedAddresses = normalizeAddressCountries(addresses);
    console.log('🔵 Normalized addresses:', normalizedAddresses);
    
    // VALIDATE HERE before calling parent save
    const errors = validateAddresses(normalizedAddresses);
    console.log('🔵 Validation errors:', errors);
    
    if (Object.keys(errors).length > 0) {
      // Validation failed - show errors and stay open
      setOverlayFieldErrors(errors);
      setIsOverlaySaving(false);
      return; // Don't call parent save
    }
    
    // Update parent state with normalized data
    setAddresses(normalizedAddresses);
    
    // Temporarily enable edit mode for save to work
    const wasInEditMode = toggleEditMode.addresses;
    if (!wasInEditMode) {
      toggleEditMode('addresses');
    }
    
    // Wait for state update then save
    setTimeout(async () => {
      try {
        await onSave();
        
        // SUCCESS - show message and close
        setShowOverlaySuccess(true);
        setOverlayEditMode(false);
        setOverlayFieldErrors({});
        
        // Turn off edit mode if we turned it on
        if (!wasInEditMode && toggleEditMode.addresses) {
          toggleEditMode('addresses');
        }
        
        setTimeout(() => {
          onClose();
          setShowOverlaySuccess(false);
        }, 1500);
      } catch (error) {
        console.error('Save failed:', error);
        setOverlayFieldErrors({ general: 'Failed to save addresses' });
        
        // Turn off edit mode if we turned it on
        if (!wasInEditMode && toggleEditMode.addresses) {
          toggleEditMode('addresses');
        }
      } finally {
        setIsOverlaySaving(false);
      }
    }, 0);
  };

  const handleOverlayCancel = () => {
    cancelEdit('addresses');
    setOverlayEditMode(false);
    setIsOverlaySaving(false);
    setOverlayFieldErrors({});
  };

  const handleOverlayClose = () => {
    if (isOverlaySaving) return;
    
    if (overlayEditMode) {
      cancelEdit('addresses');
      setOverlayEditMode(false);
    }
    
    onClose();
    setShowOverlaySuccess(false);
    setOverlayFieldErrors({});
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'home':
        return {
          title: 'Home Address',
          description: 'Your primary residential address. This is where you live and receive important correspondence.',
        };
      case 'mailing':
        return {
          title: 'Mailing Address',
          description: 'The address where you receive mail. This can be the same as your home address or a different location.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const fieldInfo = getFieldDescriptions();
  const currentErrors = overlayFieldErrors;

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={handleOverlayClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
        <div className={overlayStyles.contentBox}>
          {/* Header */}
          <div className={overlayStyles.header.wrapper}>
            <button
              onClick={handleOverlayClose}
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
                  <span className={overlayStyles.header.title} style={{ display: 'block' }}>
                    {fieldInfo.title}
                  </span>
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
            {showOverlaySuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-800">Addresses updated successfully!</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {overlayEditMode && currentErrors && Object.keys(currentErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Please complete all required fields</p>
                  </div>
                </div>
              </div>
            )}

            {/* Fields */}
            {!overlayEditMode ? (
              /* Display Mode */
              <div className={overlayStyles.body.content}>
                {section === 'home' && (
                  <div className="space-y-6">
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
                        {addresses?.homeCountry || 'United States'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'mailing' && (
                  <div className="space-y-6">
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
                            {addresses?.mailingCountry || 'United States'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className={overlayStyles.body.content}>
                {section === 'home' && (
                  <div className="space-y-4">
                    <Input
                      label="Street Address *"
                      type="text"
                      value={addresses?.homeStreet || ''}
                      onChange={(e) => setAddresses({...addresses, homeStreet: e.target.value})}
                      disabled={isOverlaySaving}
                      error={currentErrors.homeStreet}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City *"
                        type="text"
                        value={addresses?.homeCity || ''}
                        onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                        disabled={isOverlaySaving}
                        error={currentErrors.homeCity}
                      />
                      <Input
                        label="State/Province *"
                        type="text"
                        value={addresses?.homeState || ''}
                        onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                        disabled={isOverlaySaving}
                        error={currentErrors.homeState}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Zip/Postal Code *"
                        type="text"
                        value={addresses?.homePostalCode || ''}
                        onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                        disabled={isOverlaySaving}
                        error={currentErrors.homePostalCode}
                      />
                      <Select
                        label="Country *"
                        value={addresses?.homeCountry || 'United States'}
                        onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                        disabled={isOverlaySaving}
                        error={currentErrors.homeCountry}
                      >
                        <option value="">Select a country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                )}

                {section === 'mailing' && (
                  <div className="space-y-4">
                    <Checkbox
                      label="Mailing address is the same as home address"
                      checked={addresses?.sameAsHome || false}
                      onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
                      disabled={isOverlaySaving}
                    />
                    
                    {!addresses?.sameAsHome && (
                      <>
                        <Input
                          label="Street Address *"
                          type="text"
                          value={addresses?.mailingStreet || ''}
                          onChange={(e) => setAddresses({...addresses, mailingStreet: e.target.value})}
                          disabled={isOverlaySaving}
                          error={currentErrors.mailingStreet}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="City *"
                            type="text"
                            value={addresses?.mailingCity || ''}
                            onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                            disabled={isOverlaySaving}
                            error={currentErrors.mailingCity}
                          />
                          <Input
                            label="State/Province *"
                            type="text"
                            value={addresses?.mailingState || ''}
                            onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                            disabled={isOverlaySaving}
                            error={currentErrors.mailingState}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Zip/Postal Code *"
                            type="text"
                            value={addresses?.mailingPostalCode || ''}
                            onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                            disabled={isOverlaySaving}
                            error={currentErrors.mailingPostalCode}
                          />
                          <Select
                            label="Country *"
                            value={addresses?.mailingCountry || 'United States'}
                            onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                            disabled={isOverlaySaving}
                            error={currentErrors.mailingCountry}
                          >
                            <option value="">Select a country</option>
                            {countries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={overlayStyles.footer.wrapper}>
            {!overlayEditMode ? (
              <PurpleButton
                text="Edit"
                onClick={handleOverlayEdit}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            ) : (
              <>
                <WhiteButton
                  text="Cancel"
                  onClick={handleOverlayCancel}
                  className={buttonStyles.overlayButtons.cancel}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={isOverlaySaving}
                />
                <PurpleButton
                  text={isOverlaySaving ? 'Saving...' : 'Save'}
                  onClick={handleOverlaySave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={isOverlaySaving}
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
  addresses = {}, 
  setAddresses, 
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveAddresses, 
  savingSection,
  setAddressValidationModal,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  const safeAddresses = addresses || {};
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);

  // Inject animation styles
  useEffect(() => {
    const style = animationStyles.injectStyles();
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          setTimeout(() => {
            setHasLoaded(true);
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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleSaveWithNormalization = () => {
    const normalizedAddresses = normalizeAddressCountries(safeAddresses);
    setAddresses(normalizedAddresses);
    setTimeout(() => {
      saveAddresses();
    }, 0);
  };

  // Field configuration
  const fieldConfig = {
    required: {
      homeStreet: { field: 'homeStreet', source: 'addresses', label: 'Home Street' },
      homeCity: { field: 'homeCity', source: 'addresses', label: 'Home City' },
      homeState: { field: 'homeState', source: 'addresses', label: 'Home State' },
      homePostalCode: { field: 'homePostalCode', source: 'addresses', label: 'Home Postal Code' },
      homeCountry: { field: 'homeCountry', source: 'addresses', label: 'Home Country' }
    },
    recommended: {
      mailingAddress: { 
        field: 'mailingAddress', 
        source: 'addresses', 
        label: 'Mailing Address',
        checkValue: (data) => {
          const addr = data.addresses;
          return addr?.sameAsHome || (
            !!(addr?.mailingStreet && addr?.mailingCity && addr?.mailingState && addr?.mailingPostalCode && addr?.mailingCountry)
          );
        }
      }
    }
  };

  const areAddressesSame = () => {
    if (safeAddresses.sameAsHome === true) return true;
    
    const mailingEmpty = !safeAddresses.mailingStreet && !safeAddresses.mailingCity && 
                        !safeAddresses.mailingState && !safeAddresses.mailingPostalCode;
    
    if (mailingEmpty) return true;
    
    const fieldsMatch = safeAddresses.homeStreet === safeAddresses.mailingStreet &&
                       safeAddresses.homeCity === safeAddresses.mailingCity &&
                       safeAddresses.homeState === safeAddresses.mailingState &&
                       safeAddresses.homePostalCode === safeAddresses.mailingPostalCode &&
                       (safeAddresses.homeCountry || 'United States') === (safeAddresses.mailingCountry || 'United States');
    
    return fieldsMatch;
  };

  return (
    <div ref={sectionRef} className={`addresses-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        addresses={safeAddresses}
        setAddresses={setAddresses}
        onSave={saveAddresses}
        savingSection={savingSection}
        toggleEditMode={toggleEditMode}
        cancelEdit={cancelEdit}
        memberCategory={memberCategory}
      />

      {isMobile ? (
        <AddressesMobile
          addresses={safeAddresses}
          setAddresses={setAddresses}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveAddresses={handleSaveWithNormalization}
          savingSection={savingSection}
          fieldConfig={fieldConfig}
          formatAddress={(street, city, state, postalCode, country) => {
            const parts = [street, city, state, postalCode, country].filter(Boolean);
            if (parts.length === 0) return '—';
            return parts.join(', ');
          }}
          areAddressesSame={areAddressesSame}
        />
      ) : (
        /* Desktop Version */
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Header Section */}
            <div className={headerStyles.container}>
              <div className="w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'addresses')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Addresses</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'addresses')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Your home and mailing addresses.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: Home Address (including Country)
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-1">
                            Recommended: Mailing Address
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ addresses: safeAddresses }}
                    fieldConfig={fieldConfig}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.addresses ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Home Address Card */}
                  <InfoCard 
                    title="Home Address" 
                    icon={
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                    <InfoField label="Street Address" value={safeAddresses?.homeStreet || '—'} isRequired />
                    <InfoField label="City, State" value={
                      safeAddresses?.homeCity && safeAddresses?.homeState 
                        ? `${safeAddresses.homeCity}, ${safeAddresses.homeState}` 
                        : '—'
                    } isRequired />
                    <InfoField label="Country" value={safeAddresses?.homeCountry || 'United States'} isRequired />
                  </InfoCard>

                  {/* Mailing Address Card */}
                  <InfoCard 
                    title="Mailing Address" 
                    icon={
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                        <InfoField label="Same as Home" value="Yes" isRecommended />
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                      </>
                    ) : (
                      <>
                        <InfoField label="Street Address" value={safeAddresses?.mailingStreet || '—'} isRecommended />
                        <InfoField label="City, State" value={
                          safeAddresses?.mailingCity && safeAddresses?.mailingState 
                            ? `${safeAddresses.mailingCity}, ${safeAddresses.mailingState}` 
                            : '—'
                        } isRecommended />
                        <InfoField label="Country" value={safeAddresses?.mailingCountry || 'United States'} isRecommended />
                      </>
                    )}
                  </InfoCard>

                  <div></div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  <div className="mb-6">
                    <h3 className="font-medium text-[#2a2346] mb-4">Home Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        containerClassName="col-span-2"
                        label="Street Address *"
                        type="text"
                        value={safeAddresses.homeStreet || ''}
                        onChange={(e) => setAddresses({...safeAddresses, homeStreet: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="City *"
                        type="text"
                        value={safeAddresses.homeCity || ''}
                        onChange={(e) => setAddresses({...safeAddresses, homeCity: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="State/Province *"
                        type="text"
                        value={safeAddresses.homeState || ''}
                        onChange={(e) => setAddresses({...safeAddresses, homeState: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="Zip/Postal Code *"
                        type="text"
                        value={safeAddresses.homePostalCode || ''}
                        onChange={(e) => setAddresses({...safeAddresses, homePostalCode: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Select
                        label="Country *"
                        value={safeAddresses.homeCountry || 'United States'}
                        onChange={(e) => setAddresses({...safeAddresses, homeCountry: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      >
                        <option value="">Select a country</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Checkbox
                      label="Mailing address is the same as home address"
                      checked={safeAddresses.sameAsHome || false}
                      onChange={(e) => setAddresses({...safeAddresses, sameAsHome: e.target.checked})}
                      disabled={savingSection === 'addresses'}
                    />
                    
                    {!safeAddresses.sameAsHome && (
                      <>
                        <h3 className="font-medium text-[#2a2346] mb-4 mt-4">Mailing Address</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            containerClassName="col-span-2"
                            label="Street Address *"
                            type="text"
                            value={safeAddresses.mailingStreet || ''}
                            onChange={(e) => setAddresses({...safeAddresses, mailingStreet: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="City *"
                            type="text"
                            value={safeAddresses.mailingCity || ''}
                            onChange={(e) => setAddresses({...safeAddresses, mailingCity: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="State/Province *"
                            type="text"
                            value={safeAddresses.mailingState || ''}
                            onChange={(e) => setAddresses({...safeAddresses, mailingState: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="Zip/Postal Code *"
                            type="text"
                            value={safeAddresses.mailingPostalCode || ''}
                            onChange={(e) => setAddresses({...safeAddresses, mailingPostalCode: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Select
                            label="Country *"
                            value={safeAddresses.mailingCountry || 'United States'}
                            onChange={(e) => setAddresses({...safeAddresses, mailingCountry: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          >
                            <option value="">Select a country</option>
                            {countries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </Select>
                        </div>
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
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={handleSaveWithNormalization}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'addresses'}
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