import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Checkbox } from '../FormComponents';
import { WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2 from '../styleConfig2';
import { cleanAddressData } from '../utils/dataFormatting';
import { MobileInfoCard, DisplayField, FormInput, ActionButtons } from './MobileInfoCard';
import AddressesMobile from './AddressesMobile';
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

// Overlay Component - Updated to use local state like Contact and Personal
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  data, 
  onSave,
  savingSection,
  fieldErrors = {}
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Local state for editing - completely separate from parent
  const [localAddresses, setLocalAddresses] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in view mode
      setShowSuccess(false);
      // Reset local state to current data when opening - create copy not reference
      setLocalAddresses({...data.addresses} || {});
    }
  }, [isOpen, data.addresses]);

  if (!isOpen) return null;

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    // Pass the local data back to parent via callback
    onSave(localAddresses);
    setEditMode(false);
    // Don't show success here - let the parent handle it after actual save
    onClose();
  };

  const handleCancel = () => {
    // Reset to original data - create new copy
    setLocalAddresses({...data.addresses} || {});
    setEditMode(false);
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
              /* Display Mode - Use local state */
              <div className={overlayStyles.body.content}>
                {section === 'home' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Street Address</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.homeStreet)}
                        >
                          {localAddresses?.homeStreet || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>City</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.homeCity)}
                        >
                          {localAddresses?.homeCity || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>State/Province</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.homeState)}
                        >
                          {localAddresses?.homeState || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Zip/Postal Code</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.homePostalCode)}
                        >
                          {localAddresses?.homePostalCode || '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Country</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.homeCountry)}
                      >
                        {localAddresses?.homeCountry || 'US'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'mailing' && (
                  <div className="space-y-6">
                    {localAddresses?.sameAsHome ? (
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
                              style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.mailingStreet)}
                            >
                              {localAddresses?.mailingStreet || '—'}
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>City</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.mailingCity)}
                            >
                              {localAddresses?.mailingCity || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>State/Province</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.mailingState)}
                            >
                              {localAddresses?.mailingState || '—'}
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Zip/Postal Code</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.mailingPostalCode)}
                            >
                              {localAddresses?.mailingPostalCode || '—'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Country</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!localAddresses?.mailingCountry)}
                          >
                            {localAddresses?.mailingCountry || 'US'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode - Update local state only */
              <div className={overlayStyles.body.content}>
                {section === 'home' && (
                  <div className="space-y-4">
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
                  </div>
                )}

                {section === 'mailing' && (
                  <div className="space-y-4">
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
                  </div>
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
                <PurpleButton
                  text={savingSection === 'addresses' ? 'Saving...' : 'Save'}
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
  sectionLabel
}) => {
  // Ensure addresses is always an object
  const safeAddresses = addresses || {};
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  // Add pendingSave flag for triggering save after state update
  const [pendingSave, setPendingSave] = useState(false);

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

  // Trigger save after state update from overlay
  useEffect(() => {
    if (pendingSave) {
      saveAddresses();
      setPendingSave(false);
    }
  }, [pendingSave, addresses]);

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = (updatedAddresses) => {
    // Update parent state with the new data
    setAddresses(updatedAddresses);
    // Set flag to trigger save after state updates
    setPendingSave(true);
  };

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      homeStreet: { field: 'homeStreet', source: 'addresses', label: 'Home Street' },
      homeCity: { field: 'homeCity', source: 'addresses', label: 'Home City' },
      homeState: { field: 'homeState', source: 'addresses', label: 'Home State' },
      homePostalCode: { field: 'homePostalCode', source: 'addresses', label: 'Home Postal Code' }
    },
    recommended: {
      mailingAddress: { 
        field: 'mailingAddress', 
        source: 'addresses', 
        label: 'Mailing Address',
        checkValue: (data) => {
          const addr = data.addresses;
          return addr?.sameAsHome || (
            !!(addr?.mailingStreet && addr?.mailingCity && addr?.mailingState && addr?.mailingPostalCode)
          );
        }
      }
    }
  };

  // Format address for display
  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return '—';
    return parts.join(', ');
  };

  // Helper function to check if addresses are effectively the same
  const areAddressesSame = () => {
    if (safeAddresses.sameAsHome === true) return true;
    
    const mailingEmpty = !safeAddresses.mailingStreet && !safeAddresses.mailingCity && 
                        !safeAddresses.mailingState && !safeAddresses.mailingPostalCode;
    
    if (mailingEmpty) return true;
    
    const fieldsMatch = safeAddresses.homeStreet === safeAddresses.mailingStreet &&
                       safeAddresses.homeCity === safeAddresses.mailingCity &&
                       safeAddresses.homeState === safeAddresses.mailingState &&
                       safeAddresses.homePostalCode === safeAddresses.mailingPostalCode &&
                       (safeAddresses.homeCountry || 'US') === (safeAddresses.mailingCountry || 'US');
    
    return fieldsMatch;
  };

  return (
    <div ref={sectionRef} className={`addresses-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ addresses: safeAddresses }}
        onSave={handleOverlaySave}
        savingSection={savingSection}
      />

      {isMobile ? (
        <AddressesMobile
          addresses={safeAddresses}
          setAddresses={setAddresses}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveAddresses={saveAddresses}
          savingSection={savingSection}
          fieldConfig={fieldConfig}
          formatAddress={formatAddress}
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
                            Required: Home Address
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
                    <InfoField label="Street Address" value={safeAddresses?.homeStreet || '—'} isRequired />
                    <InfoField label="City" value={safeAddresses?.homeCity || '—'} isRequired />
                    <InfoField label="State/Province" value={safeAddresses?.homeState || '—'} isRequired />
                    <InfoField label="Zip/Postal Code" value={safeAddresses?.homePostalCode || '—'} isRequired />
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
                        <InfoField label="City" value={safeAddresses?.mailingCity || '—'} isRecommended />
                        <InfoField label="State/Province" value={safeAddresses?.mailingState || '—'} isRecommended />
                        <InfoField label="Zip/Postal Code" value={safeAddresses?.mailingPostalCode || '—'} isRecommended />
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
                      <Input
                        label="Country"
                        type="text"
                        value={safeAddresses.homeCountry || 'US'}
                        onChange={(e) => setAddresses({...safeAddresses, homeCountry: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
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
                          <Input
                            label="Country"
                            type="text"
                            value={safeAddresses.mailingCountry || 'US'}
                            onChange={(e) => setAddresses({...safeAddresses, mailingCountry: e.target.value})}
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
                      onClick={saveAddresses}
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