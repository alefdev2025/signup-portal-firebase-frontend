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
import { CompletionWheelWithLegend } from './CompletionWheel';

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
  const [localAddresses, setLocalAddresses] = useState(addresses);
  const [isSaving, setIsSaving] = useState(false);

  // Add effect to track state changes
  useEffect(() => {
    console.log('Overlay state:', { editMode, isSaving });
  }, [editMode, isSaving]);

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in display mode
      // Reset local addresses to match the current addresses when opening
      setLocalAddresses(addresses);
      setIsSaving(false);
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
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    console.log('=== SAVE STARTED ===');
    console.log('Setting isSaving to true');
    setIsSaving(true);
    
    // Force a re-render
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      // Clean the addresses before saving
      const cleanedAddresses = cleanAddressData(localAddresses);
      console.log('Cleaned addresses:', cleanedAddresses);
      
      // Update parent state
      setAddresses(cleanedAddresses);
      
      // Save to backend
      console.log('Calling saveAddresses...');
      await saveAddresses();
      console.log('saveAddresses completed');
      
      // Close immediately after save completes
      console.log('Closing overlay');
      onClose();
    } catch (error) {
      console.error('Error saving addresses:', error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset local addresses to original values
    setLocalAddresses(addresses);
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'home':
        return {
          title: 'Home Address',
          description: 'Your primary residential address.',
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

  // Custom overlay styles with less rounded corners
  const customOverlayStyles = {
    ...overlayStyles,
    contentBox: "relative bg-white rounded-lg w-full max-w-3xl animate-fadeInUp shadow-xl", // Changed from rounded-2xl to rounded-lg
  };

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={onClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
        <div className={customOverlayStyles.contentBox}>
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
                      disabled={savingSection === 'addresses'}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City *"
                        type="text"
                        value={localAddresses?.homeCity || ''}
                        onChange={(e) => setLocalAddresses({...localAddresses, homeCity: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="State/Province *"
                        type="text"
                        value={localAddresses?.homeState || ''}
                        onChange={(e) => setLocalAddresses({...localAddresses, homeState: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Zip/Postal Code *"
                        type="text"
                        value={localAddresses?.homePostalCode || ''}
                        onChange={(e) => setLocalAddresses({...localAddresses, homePostalCode: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="Country"
                        type="text"
                        value={localAddresses?.homeCountry || 'US'}
                        onChange={(e) => setLocalAddresses({...localAddresses, homeCountry: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                    </div>
                  </>
                )}

                {section === 'mailing' && (
                  <>
                    <Checkbox
                      label="Mailing address is the same as home address"
                      checked={localAddresses?.sameAsHome || false}
                      onChange={(e) => setLocalAddresses({...localAddresses, sameAsHome: e.target.checked})}
                      disabled={savingSection === 'addresses'}
                    />
                    
                    {!localAddresses?.sameAsHome && (
                      <>
                        <Input
                          label="Street Address *"
                          type="text"
                          value={localAddresses?.mailingStreet || ''}
                          onChange={(e) => setLocalAddresses({...localAddresses, mailingStreet: e.target.value})}
                          disabled={savingSection === 'addresses'}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="City *"
                            type="text"
                            value={localAddresses?.mailingCity || ''}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingCity: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="State/Province *"
                            type="text"
                            value={localAddresses?.mailingState || ''}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingState: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Zip/Postal Code *"
                            type="text"
                            value={localAddresses?.mailingPostalCode || ''}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingPostalCode: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="Country"
                            type="text"
                            value={localAddresses?.mailingCountry || 'US'}
                            onChange={(e) => setLocalAddresses({...localAddresses, mailingCountry: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={overlayStyles.footer.wrapper}>
            {/* Debug info */}
            <div className="text-xs text-gray-500 mr-4">
              editMode: {String(editMode)}, isSaving: {String(isSaving)}
            </div>
            
            {!editMode && !isSaving ? (
              <PurpleButton
                text="Edit"
                onClick={handleEdit}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            ) : isSaving ? (
              <PurpleButton
                text="Saving..."
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
                disabled={true}
              />
            ) : (
              <>
                <WhiteButton
                  text="Cancel"
                  onClick={handleCancel}
                  className={buttonStyles.overlayButtons.cancel}
                  spinStar={buttonStyles.starConfig.enabled}
                />
                <PurpleButton
                  text="Save"
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'addresses'}
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

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      homeStreet: { field: 'homeStreet', source: 'addresses', label: 'Home Street' },
      homeCity: { field: 'homeCity', source: 'addresses', label: 'Home City' },
      homeState: { field: 'homeState', source: 'addresses', label: 'Home State' },
      homePostalCode: { field: 'homePostalCode', source: 'addresses', label: 'Home Postal Code' },
      mailingStreet: { field: 'mailingStreet', source: 'addresses', label: 'Mailing Street' },
      mailingCity: { field: 'mailingCity', source: 'addresses', label: 'Mailing City' },
      mailingState: { field: 'mailingState', source: 'addresses', label: 'Mailing State' },
      mailingPostalCode: { field: 'mailingPostalCode', source: 'addresses', label: 'Mailing Postal Code' }
    },
    recommended: {
      homeCountry: { field: 'homeCountry', source: 'addresses', label: 'Home Country' },
      mailingCountry: { field: 'mailingCountry', source: 'addresses', label: 'Mailing Country' }
    }
  };

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

  // Handle save with cleaning
  const handleSaveAddresses = async () => {
    console.log('Saving addresses...');
    console.log('Current addresses:', addresses);
    
    // Prevent double-clicks
    if (savingSection === 'addresses') {
      console.log('Already processing, ignoring click');
      return;
    }
    
    // Clean the addresses before saving
    const cleanedAddresses = cleanAddressData(addresses);
    console.log('Cleaned addresses:', cleanedAddresses);
    setAddresses(cleanedAddresses);

    // Save to backend
    await saveAddresses();
    console.log('Save complete!');
    
    // Close overlay after successful save
    if (overlayOpen) {
      setOverlayOpen(false);
    }
    
    return 'saved';
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
          subtitle="Your home and mailing addresses."
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
                    </>
                  )}
                </div>
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={handleSaveAddresses}
                onCancel={() => cancelEdit && cancelEdit('addresses')}
                saving={savingSection === 'addresses'}
                saveText={savingSection === 'saved' ? 'Saved' : savingSection === 'addresses' ? 'Saving...' : 'Save'}
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
              <div className="w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'addresses')} style={{ backgroundColor: '#022B4F' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h2 className={headerStyles.title(styleConfig2)}>Addresses</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'addresses')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 font-normal max-w-lg">
                            Your home and mailing addresses.
                          </p>
                          <p className="text-gray-400 text-sm mt-3">
                            Required: Home Street, City, State, Postal Code
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Optional: Mailing Address (if different from home)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Completion Section */}
                  <CompletionWheelWithLegend
                    data={{ addresses }}
                    fieldConfig={fieldConfig}
                    sectionColor="#022B4F"
                  />
                </div>
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
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="City *"
                        type="text"
                        value={addresses.homeCity || ''}
                        onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="State/Province *"
                        type="text"
                        value={addresses.homeState || ''}
                        onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="Zip/Postal Code *"
                        type="text"
                        value={addresses.homePostalCode || ''}
                        onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      <Input
                        label="Country"
                        type="text"
                        value={addresses.homeCountry || 'US'}
                        onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                    </div>
                  </div>

                  {/* Mailing Address */}
                  <div className="mb-6">
                    <Checkbox
                      label="Mailing address is the same as home address"
                      checked={addresses.sameAsHome || false}
                      onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
                      disabled={savingSection === 'addresses'}
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
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="City *"
                            type="text"
                            value={addresses.mailingCity || ''}
                            onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="State/Province *"
                            type="text"
                            value={addresses.mailingState || ''}
                            onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="Zip/Postal Code *"
                            type="text"
                            value={addresses.mailingPostalCode || ''}
                            onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
                          <Input
                            label="Country"
                            type="text"
                            value={addresses.mailingCountry || 'US'}
                            onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                            disabled={savingSection === 'addresses'}
                          />
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
                      onClick={handleSaveAddresses}
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