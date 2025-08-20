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

// Simplified Overlay Component - Just a visual wrapper, NO state management
// Simplified Overlay Component - Just a visual wrapper, NO state management
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  children,  // The actual edit form will be passed as children
  fieldInfo  // Title and description for the header
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={onClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
        {/* Add overflow-hidden to ensure children respect rounded corners */}
        <div className={`${overlayStyles.contentBox} overflow-hidden`}>
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
                    {fieldInfo?.title || ''}
                  </span>
                  <p className={overlayStyles.header.description}>
                    {fieldInfo?.description || ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body - Just render the children (the edit form) */}
          <div className={overlayStyles.body.wrapper}>
            <div className={overlayStyles.body.content}>
              {children}
            </div>
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
  
  // Track whether we're in overlay edit mode
  const [overlayEditMode, setOverlayEditMode] = useState(false);
  
  // Track if save was successful to show success message
  const [showOverlaySuccess, setShowOverlaySuccess] = useState(false);
  
  // Track if we're waiting for save to complete
  const [overlayWaitingForSave, setOverlayWaitingForSave] = useState(false);

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
    
    // Add slide-up animation CSS
    const slideUpStyle = document.createElement('style');
    slideUpStyle.innerHTML = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .animate-slideUp {
        animation: slideUp 0.6s ease-out forwards;
        opacity: 0;
      }
    `;
    document.head.appendChild(slideUpStyle);
    
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(slideUpStyle);
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

  // Watch for save completion when we're waiting for it
  useEffect(() => {
    if (overlayWaitingForSave && savingSection !== 'contact') {
      // Save completed (either success or error)
      setOverlayWaitingForSave(false);
      
      // Check if there are any field errors
      const hasErrors = fieldErrors && Object.keys(fieldErrors).length > 0;
      
      if (!hasErrors) {
        // Success! Show success message and close
        setShowOverlaySuccess(true);
        setOverlayEditMode(false);
        
        // Close overlay after showing success
        setTimeout(() => {
          setOverlayOpen(false);
          setShowOverlaySuccess(false);
        }, 1500);
      } else {
        // There were errors, keep overlay open in edit mode
        // The errors will be shown in the form fields
      }
    }
  }, [savingSection, overlayWaitingForSave, fieldErrors]);

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
    //console.log('🎂 === formatDateForDisplay DEBUG ===');
    //console.log('1. Raw input:', dateOfBirth);
    //console.log('2. Type of input:', typeof dateOfBirth);
    //console.log('3. Is null/undefined?:', dateOfBirth == null);
    
    if (!dateOfBirth) {
      //console.log('4. Returning — because falsy');
      return '—';
    }
    
    // Check what format we received
    //console.log('4. Contains "/" ?:', dateOfBirth.includes ? dateOfBirth.includes('/') : 'no includes method');
    //console.log('5. Contains "-" ?:', dateOfBirth.includes ? dateOfBirth.includes('-') : 'no includes method');
    
    // Check if it's already a Date object
    //console.log('6. Is Date object?:', dateOfBirth instanceof Date);
    if (dateOfBirth instanceof Date) {
      //console.log('   - Date.toString():', dateOfBirth.toString());
      //console.log('   - Date.toISOString():', dateOfBirth.toISOString());
      //console.log('   - Date.toLocaleDateString():', dateOfBirth.toLocaleDateString());
      //console.log('   - Date.getDate():', dateOfBirth.getDate());
      //console.log('   - Date.getMonth():', dateOfBirth.getMonth());
      //console.log('   - Date.getFullYear():', dateOfBirth.getFullYear());
    }
    
    // Try converting to string and see what we get
    const asString = dateOfBirth.toString();
    //console.log('7. toString() result:', asString);
    //console.log('8. toString() type:', typeof asString);
    
    // Log browser timezone info
    //console.log('9. Browser timezone offset:', new Date().getTimezoneOffset(), 'minutes');
    //console.log('10. Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // If it looks like an ISO date string, show what happens when we parse it
    if (typeof dateOfBirth === 'string' && dateOfBirth.includes('-')) {
      //console.log('11. Parsing ISO string:', dateOfBirth);
      const parsed = new Date(dateOfBirth);
      //console.log('    - Parsed to Date:', parsed);
      //console.log('    - Parsed toString():', parsed.toString());
      //console.log('    - Parsed toISOString():', parsed.toISOString());
      //console.log('    - Parsed toLocaleDateString():', parsed.toLocaleDateString());
    }
    
    //console.log('12. Final return value:', asString);
    //console.log('🎂 === END formatDateForDisplay DEBUG ===\n');
    
    return asString;
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

  const getFieldDescriptions = () => {
    switch (overlaySection) {
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

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
    setOverlayEditMode(false); // Start in view mode
    setShowOverlaySuccess(false); // Reset success message
    setOverlayWaitingForSave(false); // Reset waiting state
  };

  const handleOverlayEdit = () => {
    // Set the main edit mode to true if not already
    if (!editMode.contact) {
      toggleEditMode('contact');
    }
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
  };

  const handleOverlaySave = () => {
    // Set waiting state
    setOverlayWaitingForSave(true);
    // Call the parent's save function
    saveContactInfo();
    // Don't close the overlay - let useEffect handle it after save completes
  };

  const handleOverlayCancel = () => {
    // Call the parent's cancel function
    cancelEdit('contact');
    setOverlayEditMode(false);
    setOverlayWaitingForSave(false);
  };

  const handleOverlayClose = () => {
    // If we're saving, don't allow close
    if (savingSection === 'contact' || overlayWaitingForSave) {
      return;
    }
    
    // If we're in edit mode, cancel first
    if (overlayEditMode) {
      cancelEdit('contact');
      setOverlayEditMode(false);
    }
    setOverlayOpen(false);
    setShowOverlaySuccess(false);
    setOverlayWaitingForSave(false);
  };

  // Create the edit form component that will be reused
  const renderEditForm = (isInOverlay = false) => {
    const containerClass = isInOverlay ? "space-y-4" : "grid grid-cols-2 gap-4";
    
    return (
      <div className={containerClass}>
        {isInOverlay && overlaySection === 'personal' && (
          <>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </>
        )}

        {isInOverlay && overlaySection === 'email' && (
          <>
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
            />
          </>
        )}

        {isInOverlay && overlaySection === 'phone' && (
          <>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <Input
              label="Work Phone"
              type="tel"
              value={safeContactInfo?.workPhone || ''}
              onChange={(e) => setContactInfo({...safeContactInfo, workPhone: e.target.value})}
              disabled={savingSection === 'contact'}
              placeholder="(555) 123-4567"
              error={fieldErrors.workPhone}
            />
          </>
        )}

        {!isInOverlay && (
          <>
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
          </>
        )}
      </div>
    );
  };

  // Create the view content for overlay
  const renderOverlayViewContent = () => {
    return (
      <div className="space-y-6">
        {overlaySection === 'personal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>First Name</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.firstName)}
                >
                  {safePersonalInfo?.firstName || '—'}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Middle Name</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.middleName)}
                >
                  {safePersonalInfo?.middleName || '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Last Name</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.lastName)}
                >
                  {safePersonalInfo?.lastName || '—'}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Date of Birth</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.dateOfBirth)}
                >
                  {formatDateForDisplay(safePersonalInfo?.dateOfBirth)}
                </p>
              </div>
            </div>
          </div>
        )}

        {overlaySection === 'email' && (
          <div className="space-y-6">
            <div>
              <label className={overlayStyles.displayMode.field.label}>Personal Email</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeContactInfo?.personalEmail)}
              >
                {safeContactInfo?.personalEmail || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Work Email</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeContactInfo?.workEmail)}
              >
                {safeContactInfo?.workEmail || '—'}
              </p>
            </div>
          </div>
        )}

        {overlaySection === 'phone' && (
          <div className="space-y-6">
            <div>
              <label className={overlayStyles.displayMode.field.label}>Preferred Phone</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeContactInfo?.preferredPhone)}
              >
                {safeContactInfo?.preferredPhone ? `${safeContactInfo.preferredPhone} Phone` : '—'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Mobile Phone</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeContactInfo?.mobilePhone)}
                >
                  {formatPhone(safeContactInfo?.mobilePhone)}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Home Phone</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeContactInfo?.homePhone)}
                >
                  {formatPhone(safeContactInfo?.homePhone)}
                </p>
              </div>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Work Phone</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeContactInfo?.workPhone)}
              >
                {formatPhone(safeContactInfo?.workPhone)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} className={`contact-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={handleOverlayClose}
        section={overlaySection}
        fieldInfo={getFieldDescriptions()}
      >
        {/* Success Message */}
        {showOverlaySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800">Information updated successfully!</p>
            </div>
          </div>
        )}

        {/* Content based on edit mode */}
        {!overlayEditMode ? (
          <>
            {/* View Mode */}
            {renderOverlayViewContent()}
            
            {/* Footer with Edit button */}
            <div className={overlayStyles.footer.wrapper}>
              <PurpleButton
                text="Edit"
                onClick={handleOverlayEdit}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            </div>
          </>
        ) : (
          <>
            {/* Edit Mode - Reuse the same form */}
            {renderEditForm(true)}
            
            {/* Footer with Cancel/Save buttons */}
            <div className={overlayStyles.footer.wrapper}>
              <WhiteButton
                text="Cancel"
                onClick={handleOverlayCancel}
                className={buttonStyles.overlayButtons.cancel}
                spinStar={buttonStyles.starConfig.enabled}
                disabled={savingSection === 'contact'}
              />
              <PurpleButton
                text={savingSection === 'contact' ? 'Saving...' : 'Save'}
                onClick={handleOverlaySave}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
                disabled={savingSection === 'contact'}
              />
            </div>
          </>
        )}
      </CardOverlay>

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
              <div className={`w-full ${hasLoaded && isVisible ? 'animate-slideUp' : 'opacity-0'}`}>
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
                /* Edit Mode - Full Form */
                <div className="max-w-2xl">
                  {renderEditForm(false)}
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