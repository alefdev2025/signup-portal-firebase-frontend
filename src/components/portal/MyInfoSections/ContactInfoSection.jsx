import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';
import ContactInfoMobile from './ContactInfoMobile';
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

// Custom Select component that uses styleConfig2
const StyledSelect = ({ label, value, onChange, disabled, children, error }) => {
  return (
    <div>
      <label className={styleConfig2.form.label}>{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styleConfig2.select.default} ${error ? styleConfig2.input.error : ''}`}
      >
        {children}
      </select>
    </div>
  );
};

// Overlay Component - Fixed with local state
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  data,
  onSave,
  savingSection,
  fieldErrors
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Local state for editing - completely separate from parent
  const [localContactInfo, setLocalContactInfo] = useState({});
  const [localPersonalInfo, setLocalPersonalInfo] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in view mode
      setShowSuccess(false);
      // Reset local state to current data when opening - create copies not references
      setLocalContactInfo({...data.contactInfo} || {});
      setLocalPersonalInfo({...data.personalInfo} || {});
    }
  }, [isOpen, data.contactInfo, data.personalInfo]);

  if (!isOpen) return null;

  const formatDateForDisplay = (dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const date = new Date(dateOfBirth);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    if (phone.includes('(')) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    // Pass the local data back to parent via callback
    onSave(localContactInfo, localPersonalInfo);
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset to original data - create new copies
    setLocalContactInfo({...data.contactInfo} || {});
    setLocalPersonalInfo({...data.personalInfo} || {});
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'personal':
        return {
          title: 'Personal Details',
          description: 'Your personal identification information is essential for maintaining accurate member records and ensuring we can properly identify you in our systems.',
        };
      case 'email':
        return {
          title: 'Email Addresses',
          description: 'We use your email addresses for important member communications, newsletters, and account notifications.',
        };
      case 'phone':
        return {
          title: 'Phone Numbers',
          description: 'Phone numbers allow us to contact you for urgent matters, verification, and provide phone-based member services.',
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
                    {section === 'personal' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                    {section === 'email' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    )}
                    {section === 'phone' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    )}
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
              <p className="text-sm text-gray-500 mb-6">Information updated successfully</p>
            )}

            {/* Fields */}
            {!editMode ? (
              /* Display Mode - Use local state */
              <div className={overlayStyles.body.content}>
                {section === 'personal' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>First Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localPersonalInfo?.firstName)}
                        >
                          {localPersonalInfo?.firstName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Middle Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localPersonalInfo?.middleName)}
                        >
                          {localPersonalInfo?.middleName || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Last Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localPersonalInfo?.lastName)}
                        >
                          {localPersonalInfo?.lastName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Date of Birth</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localPersonalInfo?.dateOfBirth)}
                        >
                          {formatDateForDisplay(localPersonalInfo?.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {section === 'email' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Personal Email</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localContactInfo?.personalEmail)}
                      >
                        {localContactInfo?.personalEmail || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Work Email</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localContactInfo?.workEmail)}
                      >
                        {localContactInfo?.workEmail || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'phone' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Preferred Phone</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localContactInfo?.preferredPhone)}
                      >
                        {localContactInfo?.preferredPhone ? `${localContactInfo.preferredPhone} Phone` : '—'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Mobile Phone</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localContactInfo?.mobilePhone)}
                        >
                          {formatPhone(localContactInfo?.mobilePhone)}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Home Phone</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localContactInfo?.homePhone)}
                        >
                          {formatPhone(localContactInfo?.homePhone)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Work Phone</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localContactInfo?.workPhone)}
                      >
                        {formatPhone(localContactInfo?.workPhone)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode - Update local state only */
              <div className={overlayStyles.body.content}>
                {section === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name *"
                        type="text"
                        value={localPersonalInfo?.firstName || ''}
                        onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, firstName: e.target.value})}
                        disabled={savingSection === 'contact'}
                        error={fieldErrors.firstName}
                      />
                      <Input
                        label="Middle Name"
                        type="text"
                        value={localPersonalInfo?.middleName || ''}
                        onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, middleName: e.target.value})}
                        disabled={savingSection === 'contact'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Last Name *"
                        type="text"
                        value={localPersonalInfo?.lastName || ''}
                        onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, lastName: e.target.value})}
                        disabled={savingSection === 'contact'}
                        error={fieldErrors.lastName}
                      />
                      <div>
                        <label className={styleConfig2.form.label}>Date of Birth</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600">
                          {formatDateForDisplay(localPersonalInfo?.dateOfBirth)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section === 'email' && (
                  <div className="space-y-4">
                    <Input
                      label="Personal Email *"
                      type="email"
                      value={localContactInfo?.personalEmail || ''}
                      onChange={(e) => setLocalContactInfo({...localContactInfo, personalEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.personalEmail}
                    />
                    <Input
                      label="Work Email"
                      type="email"
                      value={localContactInfo?.workEmail || ''}
                      onChange={(e) => setLocalContactInfo({...localContactInfo, workEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                    />
                  </div>
                )}

                {section === 'phone' && (
                  <div className="space-y-4">
                    <StyledSelect
                      label="Preferred Phone *"
                      value={localContactInfo?.preferredPhone || ''}
                      onChange={(e) => setLocalContactInfo({...localContactInfo, preferredPhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.preferredPhone}
                    >
                      <option value="">Select...</option>
                      <option value="Mobile">Mobile Phone</option>
                      <option value="Home">Home Phone</option>
                      <option value="Work">Work Phone</option>
                    </StyledSelect>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Mobile Phone"
                        type="tel"
                        value={localContactInfo?.mobilePhone || ''}
                        onChange={(e) => setLocalContactInfo({...localContactInfo, mobilePhone: e.target.value})}
                        disabled={savingSection === 'contact'}
                        placeholder="(555) 123-4567"
                        error={fieldErrors.mobilePhone}
                      />
                      <Input
                        label="Home Phone"
                        type="tel"
                        value={localContactInfo?.homePhone || ''}
                        onChange={(e) => setLocalContactInfo({...localContactInfo, homePhone: e.target.value})}
                        disabled={savingSection === 'contact'}
                        placeholder="(555) 123-4567"
                        error={fieldErrors.homePhone}
                      />
                    </div>
                    <Input
                      label="Work Phone"
                      type="tel"
                      value={localContactInfo?.workPhone || ''}
                      onChange={(e) => setLocalContactInfo({...localContactInfo, workPhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.workPhone}
                    />
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
                  text={savingSection === 'contact' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'contact'}
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

const ContactInfoSection = ({ 
  contactInfo = {}, 
  setContactInfo,
  personalInfo = {},
  setPersonalInfo,
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveContactInfo, 
  savingSection,
  fieldErrors = {},
  sectionImage,
  sectionLabel
}) => {
  // Ensure contactInfo and personalInfo are always objects
  const safeContactInfo = contactInfo || {};
  const safePersonalInfo = personalInfo || {};
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  // Add pendingSave flag for triggering save after state update
  const [pendingSave, setPendingSave] = useState(false);

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

  // Trigger save after state update from overlay
  useEffect(() => {
    if (pendingSave) {
      saveContactInfo();
      setPendingSave(false);
    }
  }, [pendingSave, contactInfo, personalInfo]);

  // Field configuration
  const fieldConfig = {
    required: {
      firstName: { field: 'firstName', source: 'personalInfo', label: 'First Name' },
      lastName: { field: 'lastName', source: 'personalInfo', label: 'Last Name' },
      dateOfBirth: { field: 'dateOfBirth', source: 'personalInfo', label: 'Date of Birth' },
      personalEmail: { field: 'personalEmail', source: 'contactInfo', label: 'Personal Email' },
      preferredPhone: { field: 'preferredPhone', source: 'contactInfo', label: 'Preferred Phone' },
      anyPhone: { 
        field: 'anyPhone', 
        source: 'contactInfo', 
        label: 'Phone Number',
        checkValue: (data) => {
          return !!(
            (data.contactInfo?.mobilePhone && data.contactInfo.mobilePhone.trim() !== '') ||
            (data.contactInfo?.homePhone && data.contactInfo.homePhone.trim() !== '') ||
            (data.contactInfo?.workPhone && data.contactInfo.workPhone.trim() !== '')
          );
        }
      }
    },
    recommended: {
      middleName: { field: 'middleName', source: 'personalInfo', label: 'Middle Name' },
      workEmail: { field: 'workEmail', source: 'contactInfo', label: 'Work Email' }
    }
  };

  const formatDateForDisplay = (dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const date = new Date(dateOfBirth);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    if (phone.includes('(')) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = (updatedContactInfo, updatedPersonalInfo) => {
    // Use React 18's automatic batching or wrap in unstable_batchedUpdates for React 17
    // React 18 automatically batches these, but we can be explicit
    ReactDOM.flushSync(() => {
      setContactInfo(updatedContactInfo);
      setPersonalInfo(updatedPersonalInfo);
    });
    // Set flag to trigger save after state updates
    setPendingSave(true);
  };

  return (
    <div ref={sectionRef} className={`contact-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ contactInfo: safeContactInfo, personalInfo: safePersonalInfo }}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
      />

      {isMobile ? (
        <ContactInfoMobile
          contactInfo={safeContactInfo}
          personalInfo={safePersonalInfo}
          setContactInfo={setContactInfo}
          setPersonalInfo={setPersonalInfo}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveContactInfo={saveContactInfo}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          fieldConfig={fieldConfig}
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'contact')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Contact Information</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'contact')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Keep your contact details current for important member communications.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: First Name, Last Name, Date of Birth, Personal Email, Preferred Phone
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-1">
                            Recommended: Middle Name
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ contactInfo: safeContactInfo, personalInfo: safePersonalInfo }}
                    fieldConfig={fieldConfig}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.contact ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Information Card */}
                  <InfoCard 
                    title="Name" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    sectionKey="personal"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('personal')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('personal')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="First Name" value={safePersonalInfo?.firstName || '—'} isRequired />
                    <InfoField label="Middle Name" value={safePersonalInfo?.middleName || '—'} isRecommended />
                    <InfoField label="Last Name" value={safePersonalInfo?.lastName || '—'} isRequired />
                  </InfoCard>

                  {/* Phone Card */}
                  <InfoCard 
                    title="Phone Numbers" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    }
                    sectionKey="phone"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('phone')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('phone')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Mobile Phone" value={formatPhone(safeContactInfo?.mobilePhone)} isRecommended />
                    <InfoField label="Home Phone" value={formatPhone(safeContactInfo?.homePhone)} isRecommended />
                    <InfoField label="Work Phone" value={formatPhone(safeContactInfo?.workPhone)} isRecommended />
                  </InfoCard>

                  {/* Email Card */}
                  <InfoCard 
                    title="Email Addresses" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                    sectionKey="email"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('email')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('email')}
                    cardIndex={2}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Personal Email" value={safeContactInfo?.personalEmail || '—'} isRequired />
                    <InfoField label="Work Email" value={safeContactInfo?.workEmail || '—'} isRecommended />
                  </InfoCard>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name *"
                      type="text"
                      value={safePersonalInfo?.firstName || ''}
                      onChange={(e) => setPersonalInfo({...safePersonalInfo, firstName: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.firstName}
                    />
                    
                    <Input
                      label="Middle Name"
                      type="text"
                      value={safePersonalInfo?.middleName || ''}
                      onChange={(e) => setPersonalInfo({...safePersonalInfo, middleName: e.target.value})}
                      disabled={savingSection === 'contact'}
                    />
                    
                    <Input
                      label="Last Name *"
                      type="text"
                      value={safePersonalInfo?.lastName || ''}
                      onChange={(e) => setPersonalInfo({...safePersonalInfo, lastName: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.lastName}
                    />
                    
                    <div>
                      <label className={styleConfig2.form.label}>Date of Birth</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600">
                        {formatDateForDisplay(safePersonalInfo?.dateOfBirth)}
                      </div>
                    </div>
                    
                    <Input
                      label="Personal Email *"
                      type="email"
                      value={safeContactInfo?.personalEmail || ''}
                      onChange={(e) => setContactInfo({...safeContactInfo, personalEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.personalEmail}
                    />
                    
                    <Input
                      label="Work Email"
                      type="email"
                      value={safeContactInfo?.workEmail || ''}
                      onChange={(e) => setContactInfo({...safeContactInfo, workEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.workEmail}
                    />
                    
                    <StyledSelect
                      label="Preferred Phone *"
                      value={safeContactInfo?.preferredPhone || ''}
                      onChange={(e) => setContactInfo({...safeContactInfo, preferredPhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.preferredPhone}
                    >
                      <option value="">Select...</option>
                      <option value="Mobile">Mobile Phone</option>
                      <option value="Home">Home Phone</option>
                      <option value="Work">Work Phone</option>
                    </StyledSelect>
                    
                    <Input
                      label="Mobile Phone"
                      type="tel"
                      value={safeContactInfo?.mobilePhone || ''}
                      onChange={(e) => setContactInfo({...safeContactInfo, mobilePhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.mobilePhone}
                    />
                    
                    <Input
                      label="Home Phone"
                      type="tel"
                      value={safeContactInfo?.homePhone || ''}
                      onChange={(e) => setContactInfo({...safeContactInfo, homePhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.homePhone}
                    />
                    
                    <Input
                      label="Work Phone"
                      type="tel"
                      value={safeContactInfo?.workPhone || ''}
                      onChange={(e) => setContactInfo({...safeContactInfo, workPhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.workPhone}
                    />
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className={buttonStyles.actionContainer}>
                {editMode?.contact ? (
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('contact')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={saveContactInfo}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                  </div>
                ) : (
                  <WhiteButton
                    text="Edit"
                    onClick={() => toggleEditMode && toggleEditMode('contact')}
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

export default ContactInfoSection;