import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';
import { 
  overlayStyles, 
  infoCardStyles, 
  sectionImageStyles, 
  headerStyles, 
  buttonStyles, 
  animationStyles 
} from './desktopCardStyles/index';
import { InfoField, InfoCard } from './SharedInfoComponents';

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

// Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, contactInfo, setContactInfo, personalInfo, setPersonalInfo, saveContactInfo }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in display mode
      setShowSuccess(false);
    }
  }, [isOpen]);

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
    // Call saveContactInfo
    saveContactInfo();
    setEditMode(false);
    setShowSuccess(true);
    
    // Auto close after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset to original values
    setContactInfo(data.contactInfo);
    setPersonalInfo(data.personalInfo);
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'personal':
        return {
          title: 'Personal Details',
          description: 'Your personal identification information is essential for maintaining accurate member records and ensuring we can properly identify you in our systems.',
          fields: {
            'First Name': 'Your legal first name as it appears on official documents.',
            'Middle Name': 'Your middle name or initial (optional but helps with identification).',
            'Last Name': 'Your legal last name or surname.',
            'Date of Birth': 'Your birth date for age verification and member benefits eligibility.'
          }
        };
      case 'email':
        return {
          title: 'Email Addresses',
          description: 'We use your email addresses for important member communications, newsletters, and account notifications. Having both personal and work emails ensures we can always reach you.',
          fields: {
            'Personal Email': 'Your primary personal email for member communications and account access.',
            'Work Email': 'Your professional email address (optional) for work-related member benefits.'
          }
        };
      case 'phone':
        return {
          title: 'Phone Numbers',
          description: 'Phone numbers allow us to contact you for urgent matters, verification, and provide phone-based member services. Select your preferred contact method.',
          fields: {
            'Preferred Phone': 'Select which phone number we should use as your primary contact.',
            'Mobile Phone': 'Your cell phone number for text alerts and mobile communications.',
            'Home Phone': 'Your residential phone number.',
            'Work Phone': 'Your office or business phone number.'
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
                <p className={overlayStyles.body.successMessage.text}>Information updated successfully!</p>
              </div>
            )}

            {/* Fields */}
            {!editMode ? (
              /* Display Mode */
              <div className="space-y-6">
                {section === 'personal' && (
                  <>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>First Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.firstName)}
                        >
                          {personalInfo?.firstName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Middle Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.middleName)}
                        >
                          {personalInfo?.middleName || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Last Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.lastName)}
                        >
                          {personalInfo?.lastName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Date of Birth</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.dateOfBirth)}
                        >
                          {formatDateForDisplay(personalInfo?.dateOfBirth)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {section === 'email' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Personal Email</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!contactInfo?.personalEmail)}
                        >
                        {contactInfo?.personalEmail || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Work Email</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!contactInfo?.workEmail)}
                        >
                        {contactInfo?.workEmail || '—'}
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
                        style={overlayStyles.displayMode.field.getFieldStyle(!contactInfo?.preferredPhone)}
                        >
                        {contactInfo?.preferredPhone ? `${contactInfo.preferredPhone} Phone` : '—'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Mobile Phone</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!contactInfo?.mobilePhone)}
                          >
                          {formatPhone(contactInfo?.mobilePhone)}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Home Phone</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!contactInfo?.homePhone)}
                          >
                          {formatPhone(contactInfo?.homePhone)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Work Phone</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!contactInfo?.workPhone)}
                        >
                        {formatPhone(contactInfo?.workPhone)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {section === 'personal' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="First Name *"
                        type="text"
                        value={personalInfo?.firstName || ''}
                        onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                        disabled={savingSection === 'contact'}
                        error={fieldErrors.firstName}
                      />
                      <Input
                        label="Middle Name"
                        type="text"
                        value={personalInfo?.middleName || ''}
                        onChange={(e) => setPersonalInfo({...personalInfo, middleName: e.target.value})}
                        disabled={savingSection === 'contact'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Last Name *"
                        type="text"
                        value={personalInfo?.lastName || ''}
                        onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                        disabled={savingSection === 'contact'}
                        error={fieldErrors.lastName}
                      />
                      <div>
                        <label className={styleConfig2.form.label}>Date of Birth</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600">
                          {formatDateForDisplay(personalInfo?.dateOfBirth)}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {section === 'email' && (
                  <>
                    <Input
                      label="Personal Email *"
                      type="email"
                      value={contactInfo?.personalEmail || ''}
                      onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.personalEmail}
                    />
                    <Input
                      label="Work Email"
                      type="email"
                      value={contactInfo?.workEmail || ''}
                      onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                    />
                  </>
                )}

                {section === 'phone' && (
                  <>
                    <StyledSelect
                      label="Preferred Phone *"
                      value={contactInfo?.preferredPhone || ''}
                      onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
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
                        value={contactInfo?.mobilePhone || ''}
                        onChange={(e) => setContactInfo({...contactInfo, mobilePhone: e.target.value})}
                        disabled={savingSection === 'contact'}
                        placeholder="(555) 123-4567"
                        error={fieldErrors.mobilePhone}
                      />
                      <Input
                        label="Home Phone"
                        type="tel"
                        value={contactInfo?.homePhone || ''}
                        onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
                        disabled={savingSection === 'contact'}
                        placeholder="(555) 123-4567"
                        error={fieldErrors.homePhone}
                      />
                    </div>
                    <Input
                      label="Work Phone"
                      type="tel"
                      value={contactInfo?.workPhone || ''}
                      onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.workPhone}
                    />
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
  const safePersonalInfo = personalInfo || {};
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

  const handleOverlaySave = () => {
    // This wrapper ensures the save happens with the current state
    saveContactInfo();
  };

  return (
    <div ref={sectionRef} className={`contact-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ contactInfo, personalInfo: safePersonalInfo }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        contactInfo={contactInfo}
        setContactInfo={setContactInfo}
        personalInfo={safePersonalInfo}
        setPersonalInfo={setPersonalInfo}
        saveContactInfo={saveContactInfo}
      />

      {isMobile ? (
        /* Mobile Version - Keeping your original mobile implementation */
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Contact Information"
          backgroundImage={formsHeaderImage}
          overlayText="Essential Info"
          subtitle="Keep your contact details current for important member communications."
          isEditMode={editMode.contact}
        >
          {/* Mobile content remains the same */}
          {!editMode.contact ? (
            <>
              <div className={`space-y-4 ${hasLoaded && isVisible ? 'contact-section-stagger-in' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="First Name" value={safePersonalInfo?.firstName} />
                  <DisplayField label="Middle Name" value={safePersonalInfo?.middleName} />
                  <DisplayField label="Last Name" value={safePersonalInfo?.lastName} />
                  <DisplayField label="Date of Birth" value={formatDateForDisplay(safePersonalInfo?.dateOfBirth)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Personal Email" value={contactInfo?.personalEmail} />
                  <DisplayField label="Work Email" value={contactInfo?.workEmail} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Preferred Phone" value={contactInfo?.preferredPhone ? `${contactInfo.preferredPhone} Phone` : '—'} />
                  <DisplayField label="Mobile Phone" value={formatPhone(contactInfo?.mobilePhone)} />
                  <DisplayField label="Home Phone" value={formatPhone(contactInfo?.homePhone)} />
                  <DisplayField label="Work Phone" value={formatPhone(contactInfo?.workPhone)} />
                </div>
              </div>
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('contact')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="First Name *"
                    value={safePersonalInfo?.firstName || ''}
                    onChange={(e) => setPersonalInfo({...safePersonalInfo, firstName: e.target.value})}
                    error={fieldErrors.firstName}
                    disabled={savingSection === 'contact'}
                  />
                  <FormInput
                    label="Middle Name"
                    value={safePersonalInfo?.middleName || ''}
                    onChange={(e) => setPersonalInfo({...safePersonalInfo, middleName: e.target.value})}
                    disabled={savingSection === 'contact'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Last Name *"
                    value={safePersonalInfo?.lastName || ''}
                    onChange={(e) => setPersonalInfo({...safePersonalInfo, lastName: e.target.value})}
                    error={fieldErrors.lastName}
                    disabled={savingSection === 'contact'}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Date of Birth</label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm">
                      {formatDateForDisplay(safePersonalInfo?.dateOfBirth)}
                    </div>
                  </div>
                </div>
                
                <FormInput
                  label="Personal Email *"
                  type="email"
                  value={contactInfo?.personalEmail || ''}
                  onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
                  error={fieldErrors.personalEmail}
                  disabled={savingSection === 'contact'}
                />
                
                <FormInput
                  label="Work Email"
                  type="email"
                  value={contactInfo?.workEmail || ''}
                  onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
                  disabled={savingSection === 'contact'}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="Preferred Phone *"
                    value={contactInfo?.preferredPhone || ''}
                    onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
                    error={fieldErrors.preferredPhone}
                    disabled={savingSection === 'contact'}
                  >
                    <option value="">Select...</option>
                    <option value="Mobile">Mobile Phone</option>
                    <option value="Home">Home Phone</option>
                    <option value="Work">Work Phone</option>
                  </FormSelect>
                  
                  <FormInput
                    label="Mobile Phone"
                    type="tel"
                    value={contactInfo?.mobilePhone || ''}
                    onChange={(e) => setContactInfo({...contactInfo, mobilePhone: e.target.value})}
                    placeholder="(555) 123-4567"
                    error={fieldErrors.mobilePhone}
                    disabled={savingSection === 'contact'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Home Phone"
                    type="tel"
                    value={contactInfo?.homePhone || ''}
                    onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
                    placeholder="(555) 123-4567"
                    error={fieldErrors.homePhone}
                    disabled={savingSection === 'contact'}
                  />
                  <FormInput
                    label="Work Phone"
                    type="tel"
                    value={contactInfo?.workPhone || ''}
                    onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
                    placeholder="(555) 123-4567"
                    error={fieldErrors.workPhone}
                    disabled={savingSection === 'contact'}
                  />
                </div>
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveContactInfo}
                onCancel={() => cancelEdit && cancelEdit('contact')}
                saving={savingSection === 'contact'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop Version - Matching styles */
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Header Section */}
            <div className={headerStyles.container}>
              <div className={headerStyles.contentWrapper}>
                <div className={headerStyles.leftContent}>
                  <div className={headerStyles.iconTextWrapper(styleConfig2)}>
                    <div className={headerStyles.getIconContainer(styleConfig2, 'contact')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Contact Information</h2>
                      <p className={headerStyles.subtitle}>
                        Keep your contact details current for important member communications.
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
                    <InfoField label="First Name" value={safePersonalInfo?.firstName || '—'} />
                    <InfoField label="Middle Name" value={safePersonalInfo?.middleName || '—'} />
                    <InfoField label="Last Name" value={safePersonalInfo?.lastName || '—'} />
                  </InfoCard>

                  {/* Phone Card - MOVED TO MIDDLE */}
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
                    <InfoField label="Mobile Phone" value={formatPhone(contactInfo?.mobilePhone)} />
                    <InfoField label="Home Phone" value={formatPhone(contactInfo?.homePhone)} />
                    <InfoField label="Work Phone" value={formatPhone(contactInfo?.workPhone)} />
                  </InfoCard>

                  {/* Email Card - MOVED TO END */}
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
                    <InfoField label="Personal Email" value={contactInfo?.personalEmail || '—'} />
                    <InfoField label="Work Email" value={contactInfo?.workEmail || '—'} />
                  </InfoCard>
                </div>
              ) : (
                /* Edit Mode - Using same style as PersonalInfoSection */
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
                      value={contactInfo?.personalEmail || ''}
                      onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.personalEmail}
                    />
                    
                    <Input
                      label="Work Email"
                      type="email"
                      value={contactInfo?.workEmail || ''}
                      onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
                      disabled={savingSection === 'contact'}
                      error={fieldErrors.workEmail}
                    />
                    
                    <StyledSelect
                      label="Preferred Phone *"
                      value={contactInfo?.preferredPhone || ''}
                      onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
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
                      value={contactInfo?.mobilePhone || ''}
                      onChange={(e) => setContactInfo({...contactInfo, mobilePhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.mobilePhone}
                    />
                    
                    <Input
                      label="Home Phone"
                      type="tel"
                      value={contactInfo?.homePhone || ''}
                      onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
                      disabled={savingSection === 'contact'}
                      placeholder="(555) 123-4567"
                      error={fieldErrors.homePhone}
                    />
                    
                    <Input
                      label="Work Phone"
                      type="tel"
                      value={contactInfo?.workPhone || ''}
                      onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
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