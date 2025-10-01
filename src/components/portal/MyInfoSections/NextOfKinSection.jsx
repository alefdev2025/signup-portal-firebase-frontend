import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import NextOfKinMobile from './NextOfKinMobile';
import styleConfig2, { isFieldVisibleInEditMode, getSectionCheckboxColor } from '../styleConfig2';
import formsHeaderImage from '../../../assets/images/forms-image.png';
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

// Simplified Overlay Component - Just a visual wrapper, NO state management
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  nokIndex,
  children,  // The actual edit form will be passed as children
  fieldInfo  // Title and description for the header
}) => {
  if (!isOpen || nokIndex === null) return null;

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={onClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className={overlayStyles.header.textWrapper}>
                  <h3 className={overlayStyles.header.title}>
                    {fieldInfo?.title || ''}
                  </h3>
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

const NextOfKinSection = ({ 
  nextOfKinList,
  setNextOfKinList,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveNextOfKin,
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors,
  fieldConfig,
  updateNextOfKin,
  addNextOfKin,
  removeNextOfKin,
  formatDateForDisplay,
  formatAddress,
  formatPhoneDisplay,
  validateEmail,
  getFieldError // This might not be passed, so we'll handle it
}) => {
  // Ensure nextOfKinList is always an array
  const safeNextOfKinList = Array.isArray(nextOfKinList) ? nextOfKinList : [];
  
  // If nextOfKinList is not an array, fix it immediately
  useEffect(() => {
    if (!Array.isArray(nextOfKinList)) {
      console.warn('nextOfKinList is not an array, fixing it:', nextOfKinList);
      setNextOfKinList([]);
    }
  }, [nextOfKinList, setNextOfKinList]);
  
  // State management
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayNokIndex, setOverlayNokIndex] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  
  // Track whether we're in overlay edit mode
  const [overlayEditMode, setOverlayEditMode] = useState(false);
  
  // Track if save was successful to show success message
  const [showOverlaySuccess, setShowOverlaySuccess] = useState(false);
  
  // Track if we're currently saving
  const [isOverlaySaving, setIsOverlaySaving] = useState(false);
  
  // Track overlay-specific field errors
  const [overlayFieldErrors, setOverlayFieldErrors] = useState({});
  
  // Track if we're waiting for save to complete
  const [overlayWaitingForSave, setOverlayWaitingForSave] = useState(false);

  // Watch for save completion when we're waiting for it
  useEffect(() => {
    if (overlayWaitingForSave && savingSection !== 'nextOfKin') {
      // Save completed (either success or error)
      setOverlayWaitingForSave(false);
      setIsOverlaySaving(false);
      
      // Check if there are any field errors
      const hasErrors = fieldErrors && Object.keys(fieldErrors).length > 0;
      
      if (!hasErrors) {
        // Success! Show success message and close
        setShowOverlaySuccess(true);
        setOverlayEditMode(false);
        setOverlayFieldErrors({});
        
        // Close overlay after showing success
        setTimeout(() => {
          setOverlayOpen(false);
          setShowOverlaySuccess(false);
          setOverlayNokIndex(null);
        }, 1500);
      } else {
        // There were errors, keep overlay open in edit mode
        setOverlayFieldErrors(fieldErrors);
      }
    }
  }, [savingSection, overlayWaitingForSave, fieldErrors]);

  // Define default implementations if not provided
  const validateEmailLocal = validateEmail || ((email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  });

  const formatPhoneDisplayLocal = formatPhoneDisplay || ((phone) => {
    if (!phone) return '';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX if it's 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return original if not 10 digits
    return phone;
  });

  const formatAddressLocal = formatAddress || ((address) => {
    if (!address || typeof address !== 'object') return '—';
    const parts = [
      address.street1,
      address.street2,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '—';
  });

  // Define getFieldError if not provided
  const getFieldErrorLocal = getFieldError || ((index, field) => {
    if (!fieldErrors) return null;
    return fieldErrors[`nok_${index}_${field}`] || null;
  });

  // Define updateNextOfKin if not provided
  const updateNextOfKinLocal = updateNextOfKin || ((index, field, value) => {
    const currentList = Array.isArray(nextOfKinList) ? [...nextOfKinList] : [];
    if (!currentList[index]) {
      console.error('No NOK at index:', index);
      return;
    }
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!currentList[index][parent]) {
        currentList[index][parent] = {};
      }
      currentList[index][parent][child] = value;
    } else {
      currentList[index][field] = value;
    }
    setNextOfKinList(currentList);
  });

  // Define addNextOfKin if not provided
  const addNextOfKinLocal = addNextOfKin || (() => {
    const newNok = {
      id: `nok_${Date.now()}`, // Make ID a string with prefix
      firstName: '',
      middleName: '',
      lastName: '',
      relationship: '',
      dateOfBirth: '',
      email: '',
      mobilePhone: '',
      homePhone: '',
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      willingToSignAffidavit: '',
      comments: ''
    };
    // Ensure we're always working with an array
    const currentList = Array.isArray(nextOfKinList) ? nextOfKinList : [];
    setNextOfKinList([...currentList, newNok]);
  });

  // Define removeNextOfKin if not provided
  const removeNextOfKinLocal = removeNextOfKin || ((index) => {
    // Ensure we're always working with an array
    const currentList = Array.isArray(nextOfKinList) ? nextOfKinList : [];
    const newList = currentList.filter((_, i) => i !== index);
    setNextOfKinList(newList);
  });

  // Use the provided saveNextOfKin or create a simple fallback
  const saveNextOfKinLocal = saveNextOfKin || (() => {
    console.log('Saving next of kin...', nextOfKinList);
    // Just toggle edit mode off - don't modify the list here
    if (toggleEditMode) {
      toggleEditMode('nextOfKin');
    }
  });

  // Define cancelEdit if not provided
  const cancelEditLocal = cancelEdit || ((section) => {
    if (toggleEditMode) {
      toggleEditMode(section);
    }
  });
  
  // Normalize IDs to ensure they're all strings
  useEffect(() => {
    const hasNumericIds = safeNextOfKinList.some(nok => typeof nok.id === 'number');
    if (hasNumericIds) {
      const normalizedList = safeNextOfKinList.map(nok => ({
        ...nok,
        id: nok.id ? String(nok.id) : `nok_${Date.now()}_${Math.random()}`
      }));
      setNextOfKinList(normalizedList);
    }
  }, []); // Run once on mount

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
  const fieldConfigLocal = fieldConfig || {
    required: {
      hasAtLeastOne: {
        field: 'hasAtLeastOne',
        source: 'nextOfKinList',
        label: 'At least one emergency contact',
        checkValue: (data) => data.nextOfKinList && data.nextOfKinList.length > 0
      },
      firstName: {
        field: 'firstName',
        source: 'nextOfKinList',
        label: 'First Name',
        checkValue: (data) => {
          if (!data.nextOfKinList || data.nextOfKinList.length === 0) return false;
          return data.nextOfKinList.every(nok => nok.firstName && nok.firstName.trim() !== '');
        }
      },
      lastName: {
        field: 'lastName',
        source: 'nextOfKinList',
        label: 'Last Name',
        checkValue: (data) => {
          if (!data.nextOfKinList || data.nextOfKinList.length === 0) return false;
          return data.nextOfKinList.every(nok => nok.lastName && nok.lastName.trim() !== '');
        }
      },
      relationship: {
        field: 'relationship',
        source: 'nextOfKinList',
        label: 'Relationship',
        checkValue: (data) => {
          if (!data.nextOfKinList || data.nextOfKinList.length === 0) return false;
          return data.nextOfKinList.every(nok => nok.relationship && nok.relationship.trim() !== '');
        }
      },
      email: {
        field: 'email',
        source: 'nextOfKinList',
        label: 'Email',
        checkValue: (data) => {
          if (!data.nextOfKinList || data.nextOfKinList.length === 0) return false;
          return data.nextOfKinList.every(nok => nok.email && nok.email.trim() !== '');
        }
      },
      phone: {
        field: 'phone',
        source: 'nextOfKinList',
        label: 'Phone Number',
        checkValue: (data) => {
          if (!data.nextOfKinList || data.nextOfKinList.length === 0) return false;
          return data.nextOfKinList.every(nok => 
            (nok.mobilePhone && nok.mobilePhone.trim() !== '') ||
            (nok.homePhone && nok.homePhone.trim() !== '')
          );
        }
      }
    },
    recommended: {}
  };

  const handleCardClick = (index) => {
    setOverlayNokIndex(index);
    setOverlayOpen(true);
    setOverlayEditMode(false); // Start in view mode
    setShowOverlaySuccess(false); // Reset success message
    setOverlayFieldErrors({}); // Clear any previous errors
  };

  const handleOverlayEdit = () => {
    // Set the main edit mode to true if not already
    if (!editMode.nextOfKin) {
      toggleEditMode('nextOfKin');
    }
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
  };

  const handleOverlaySave = () => {
    // Do local validation first
    const errors = {};
    const nok = nextOfKinList[overlayNokIndex];
    
    // Check if we have a valid NOK at this index
    if (!nok) {
      console.error('No NOK found at index:', overlayNokIndex);
      setOverlayOpen(false);
      setOverlayNokIndex(null);
      return;
    }
    
    if (!nok?.firstName || !nok.firstName.trim()) {
      errors[`nok_${overlayNokIndex}_firstName`] = "First name is required";
    }
    if (!nok?.lastName || !nok.lastName.trim()) {
      errors[`nok_${overlayNokIndex}_lastName`] = "Last name is required";
    }
    if (!nok?.relationship || !nok.relationship.trim()) {
      errors[`nok_${overlayNokIndex}_relationship`] = "Relationship is required";
    }
    if (!nok?.email || !nok.email.trim()) {
      errors[`nok_${overlayNokIndex}_email`] = "Email is required";
    } else if (!validateEmailLocal(nok.email)) {
      errors[`nok_${overlayNokIndex}_email`] = "Invalid email format";
    }
    if (!nok?.mobilePhone || !nok.mobilePhone.trim()) {
      errors[`nok_${overlayNokIndex}_mobilePhone`] = "Mobile phone is required";
    }
    
    if (Object.keys(errors).length > 0) {
      // Validation failed - show errors and stay open
      setOverlayFieldErrors(errors);
      return;
    }
    
    // Clear errors and set waiting state
    setOverlayFieldErrors({});
    setIsOverlaySaving(true);
    setOverlayWaitingForSave(true);
    setShowOverlaySuccess(false);
    
    // Call the parent's save function
    saveNextOfKinLocal();
    // The useEffect will handle the result when savingSection changes
  };

  const handleOverlayCancel = () => {
    // Call the parent's cancel function
    cancelEditLocal('nextOfKin');
    setOverlayEditMode(false);
    setIsOverlaySaving(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const handleOverlayClose = () => {
    // If we're saving, don't allow close
    if (isOverlaySaving || overlayWaitingForSave || savingSection === 'nextOfKin') {
      return;
    }
    
    // If we're in edit mode, cancel first
    if (overlayEditMode) {
      cancelEditLocal('nextOfKin');
      setOverlayEditMode(false);
    }
    setOverlayOpen(false);
    setOverlayNokIndex(null);
    setShowOverlaySuccess(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const getFieldDescriptions = () => {
    const nok = nextOfKinList[overlayNokIndex];
    return {
      title: `Emergency Contact ${overlayNokIndex + 1}`,
      description: `Details for ${nok?.firstName && nok?.lastName ? 
        `${nok.firstName} ${nok.lastName}` : 
        'this emergency contact'}`
    };
  };

  // Create the edit form component that will be reused
  const renderEditForm = (isInOverlay = false, nokIndex = null) => {
    const containerClass = isInOverlay ? "space-y-4" : "";
    // Use overlay-specific errors when in overlay, otherwise use parent fieldErrors
    const currentErrors = isInOverlay ? overlayFieldErrors : fieldErrors;
    const nok = isInOverlay ? nextOfKinList[nokIndex] : null;
    
    if (isInOverlay && nokIndex !== null && nok) {
      return (
        <div className={containerClass}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              value={nok?.firstName || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'firstName', e.target.value)}
              error={currentErrors[`nok_${nokIndex}_firstName`]}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
            <Input
              label="Middle Name"
              value={nok?.middleName || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'middleName', e.target.value)}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Last Name *"
              value={nok?.lastName || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'lastName', e.target.value)}
              error={currentErrors[`nok_${nokIndex}_lastName`]}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
            <Input
              label="Relationship *"
              value={nok?.relationship || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'relationship', e.target.value)}
              placeholder="e.g., Spouse, Child, Parent"
              error={currentErrors[`nok_${nokIndex}_relationship`]}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={nok?.dateOfBirth || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'dateOfBirth', e.target.value)}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
            <Input
              label="Email *"
              type="email"
              value={nok?.email || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'email', e.target.value)}
              error={currentErrors[`nok_${nokIndex}_email`] || 
                     (!validateEmailLocal(nok?.email) && nok?.email ? 'Invalid email format' : '')}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mobile Phone *"
              type="tel"
              value={nok?.mobilePhone || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'mobilePhone', e.target.value)}
              placeholder="(555) 123-4567"
              error={currentErrors[`nok_${nokIndex}_mobilePhone`]}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
            <Input
              label="Home Phone"
              type="tel"
              value={nok?.homePhone || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'homePhone', e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
            />
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Address</h5>
            <div className="space-y-3">
              <Input
                label=""
                value={nok?.address?.street1 || ''}
                onChange={(e) => updateNextOfKinLocal(nokIndex, 'address.street1', e.target.value)}
                placeholder="Street Address Line 1"
                disabled={isOverlaySaving || savingSection === 'nextOfKin'}
              />
              <Input
                label=""
                value={nok?.address?.street2 || ''}
                onChange={(e) => updateNextOfKinLocal(nokIndex, 'address.street2', e.target.value)}
                placeholder="Street Address Line 2"
                disabled={isOverlaySaving || savingSection === 'nextOfKin'}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label=""
                  value={nok?.address?.city || ''}
                  onChange={(e) => updateNextOfKinLocal(nokIndex, 'address.city', e.target.value)}
                  placeholder="City"
                  disabled={isOverlaySaving || savingSection === 'nextOfKin'}
                />
                <Input
                  label=""
                  value={nok?.address?.state || ''}
                  onChange={(e) => updateNextOfKinLocal(nokIndex, 'address.state', e.target.value)}
                  placeholder="State/Province"
                  disabled={isOverlaySaving || savingSection === 'nextOfKin'}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label=""
                  value={nok?.address?.postalCode || ''}
                  onChange={(e) => updateNextOfKinLocal(nokIndex, 'address.postalCode', e.target.value)}
                  placeholder="Zip/Postal Code"
                  disabled={isOverlaySaving || savingSection === 'nextOfKin'}
                />
                <Input
                  label=""
                  value={nok?.address?.country || ''}
                  onChange={(e) => updateNextOfKinLocal(nokIndex, 'address.country', e.target.value)}
                  placeholder="Country"
                  disabled={isOverlaySaving || savingSection === 'nextOfKin'}
                />
              </div>
            </div>
          </div>
          
          <Select
            label="Willing to Sign Affidavit?"
            value={nok?.willingToSignAffidavit || ''}
            onChange={(e) => updateNextOfKinLocal(nokIndex, 'willingToSignAffidavit', e.target.value)}
            disabled={isOverlaySaving || savingSection === 'nextOfKin'}
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Unknown">Unknown</option>
          </Select>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments about attitude toward cryonics
            </label>
            <textarea
              value={nok?.comments || ''}
              onChange={(e) => updateNextOfKinLocal(nokIndex, 'comments', e.target.value)}
              disabled={isOverlaySaving || savingSection === 'nextOfKin'}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      );
    }
    
    // Return null if not in overlay (main edit form is handled separately)
    return null;
  };

  // Create the view content for overlay
  const renderOverlayViewContent = () => {
    const nok = nextOfKinList[overlayNokIndex];
    if (!nok) return null;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={overlayStyles.displayMode.field.label}>First Name</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(!nok?.firstName)}
            >
              {nok?.firstName || '—'}
            </p>
          </div>
          <div>
            <label className={overlayStyles.displayMode.field.label}>Middle Name</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(!nok?.middleName)}
            >
              {nok?.middleName || '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={overlayStyles.displayMode.field.label}>Last Name</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(!nok?.lastName)}
            >
              {nok?.lastName || '—'}
            </p>
          </div>
          <div>
            <label className={overlayStyles.displayMode.field.label}>Relationship</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(!nok?.relationship)}
            >
              {nok?.relationship || '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={overlayStyles.displayMode.field.label}>Email</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(!nok?.email)}
            >
              {nok?.email || '—'}
            </p>
          </div>
          <div>
            <label className={overlayStyles.displayMode.field.label}>Mobile Phone</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(!nok?.mobilePhone)}
            >
              {formatPhoneDisplayLocal(nok?.mobilePhone) || '—'}
            </p>
          </div>
        </div>

        <div>
          <label className={overlayStyles.displayMode.field.label}>Address</label>
          <p 
            className={overlayStyles.displayMode.field.value}
            style={overlayStyles.displayMode.field.getFieldStyle(!nok?.address || !nok?.address?.street1)}
          >
            {formatAddressLocal(nok?.address)}
          </p>
        </div>

        <div>
          <label className={overlayStyles.displayMode.field.label}>Willing to Sign Affidavit?</label>
          <p 
            className={overlayStyles.displayMode.field.value}
            style={overlayStyles.displayMode.field.getFieldStyle(!nok?.willingToSignAffidavit)}
          >
            {nok?.willingToSignAffidavit || '—'}
          </p>
        </div>

        {nok?.comments && (
          <div>
            <label className={overlayStyles.displayMode.field.label}>Comments</label>
            <p 
              className={overlayStyles.displayMode.field.value}
              style={overlayStyles.displayMode.field.getFieldStyle(false)}
            >
              {nok.comments}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} className={`next-of-kin-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={handleOverlayClose}
        nokIndex={overlayNokIndex}
        fieldInfo={getFieldDescriptions()}
      >
        {/* Success Message */}
        {showOverlaySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-800">Emergency contact updated successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message for validation errors */}
        {overlayEditMode && (overlayFieldErrors && Object.keys(overlayFieldErrors).length > 0) && (
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
            {renderEditForm(true, overlayNokIndex)}
            
            {/* Footer with Cancel/Save buttons */}
            <div className={overlayStyles.footer.wrapper}>
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
            </div>
          </>
        )}
      </CardOverlay>

      {isMobile ? (
        <NextOfKinMobile
          nextOfKinList={nextOfKinList}
          setNextOfKinList={setNextOfKinList}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEditLocal}
          saveNextOfKin={saveNextOfKinLocal}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          fieldConfig={fieldConfigLocal}
          updateNextOfKin={updateNextOfKinLocal}
          addNextOfKin={addNextOfKinLocal}
          removeNextOfKin={removeNextOfKinLocal}
          formatDateForDisplay={formatDateForDisplay}
          formatAddress={formatAddressLocal}
          formatPhoneDisplay={formatPhoneDisplayLocal}
          validateEmail={validateEmailLocal}
          getFieldError={getFieldErrorLocal}
        />
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'nextOfKin')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Emergency Contacts</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'nextOfKin')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            People who should be contacted in case of emergency.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: At least one emergency contact with name, relationship, email, and phone
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ nextOfKinList }}
                    fieldConfig={fieldConfigLocal}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Content - NOK Cards */}
            <div className="bg-white">
              {/* Display Mode */}
              {!editMode.nextOfKin ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {nextOfKinList.length > 0 ? (
                      nextOfKinList.slice(0, 3).map((nok, index) => (
                        <InfoCard 
                          key={nok.id || index}
                          title={`${nok.firstName} ${nok.lastName}`.trim() || `Emergency Contact ${index + 1}`}
                          icon={
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          }
                          sectionKey={`nok_${index}`}
                          hoveredSection={hoveredSection}
                          onMouseEnter={() => setHoveredSection(`nok_${index}`)}
                          onMouseLeave={() => setHoveredSection(null)}
                          onClick={() => handleCardClick(index)}
                          cardIndex={index}
                          isVisible={cardsVisible}
                        >
                          <InfoField label="Relationship" value={nok.relationship || '—'} isRequired />
                          <InfoField label="Email" value={nok.email || '—'} isRequired />
                          <InfoField label="Phone" value={formatPhoneDisplayLocal(nok.mobilePhone) || formatPhoneDisplayLocal(nok.homePhone) || '—'} isRequired />
                        </InfoCard>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8 text-gray-500">
                        No emergency contacts added yet.
                      </div>
                    )}
                  </div>

                  {nextOfKinList.length > 3 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      +{nextOfKinList.length - 3} more emergency contact{nextOfKinList.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}

                  <div className={buttonStyles.actionContainer}>
                    <WhiteButton
                      text="Edit"
                      onClick={() => toggleEditMode && toggleEditMode('nextOfKin')}
                      className={buttonStyles.whiteButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                  </div>
                </>
              ) : (
                /* Edit Mode - Form */
                <div className="space-y-6">
                  {nextOfKinList.map((nok, index) => (
                    <div key={nok.id || index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Emergency Contact {index + 1}</h4>
                        {nextOfKinList.length > 0 && (
                          <button
                            onClick={() => removeNextOfKinLocal(index)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                            disabled={savingSection === 'nextOfKin'}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="First Name *"
                          value={nok.firstName || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'firstName', e.target.value)}
                          error={getFieldErrorLocal(index, 'firstName')}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Middle Name"
                          value={nok.middleName || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'middleName', e.target.value)}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Last Name *"
                          value={nok.lastName || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'lastName', e.target.value)}
                          error={getFieldErrorLocal(index, 'lastName')}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Relationship *"
                          value={nok.relationship || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'relationship', e.target.value)}
                          placeholder="e.g., Spouse, Child, Parent"
                          error={getFieldErrorLocal(index, 'relationship')}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={nok.dateOfBirth || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'dateOfBirth', e.target.value)}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Email *"
                          type="email"
                          value={nok.email || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'email', e.target.value)}
                          error={getFieldErrorLocal(index, 'email') || 
                                 (!validateEmailLocal(nok.email) && nok.email ? 'Invalid email format' : '')}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Mobile Phone *"
                          type="tel"
                          value={nok.mobilePhone || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'mobilePhone', e.target.value)}
                          placeholder="(555) 123-4567"
                          error={getFieldErrorLocal(index, 'mobilePhone')}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <Input
                          label="Home Phone"
                          type="tel"
                          value={nok.homePhone || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'homePhone', e.target.value)}
                          placeholder="(555) 123-4567"
                          disabled={savingSection === 'nextOfKin'}
                        />
                      </div>

                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Address</h5>
                        <div className="space-y-3">
                          <Input
                            label=""
                            value={nok.address?.street1 || ''}
                            onChange={(e) => updateNextOfKinLocal(index, 'address.street1', e.target.value)}
                            placeholder="Street Address Line 1"
                            disabled={savingSection === 'nextOfKin'}
                          />
                          <Input
                            label=""
                            value={nok.address?.street2 || ''}
                            onChange={(e) => updateNextOfKinLocal(index, 'address.street2', e.target.value)}
                            placeholder="Street Address Line 2"
                            disabled={savingSection === 'nextOfKin'}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label=""
                              value={nok.address?.city || ''}
                              onChange={(e) => updateNextOfKinLocal(index, 'address.city', e.target.value)}
                              placeholder="City"
                              disabled={savingSection === 'nextOfKin'}
                            />
                            <Input
                              label=""
                              value={nok.address?.state || ''}
                              onChange={(e) => updateNextOfKinLocal(index, 'address.state', e.target.value)}
                              placeholder="State/Province"
                              disabled={savingSection === 'nextOfKin'}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label=""
                              value={nok.address?.postalCode || ''}
                              onChange={(e) => updateNextOfKinLocal(index, 'address.postalCode', e.target.value)}
                              placeholder="Zip/Postal Code"
                              disabled={savingSection === 'nextOfKin'}
                            />
                            <Input
                              label=""
                              value={nok.address?.country || ''}
                              onChange={(e) => updateNextOfKinLocal(index, 'address.country', e.target.value)}
                              placeholder="Country"
                              disabled={savingSection === 'nextOfKin'}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <Select
                          label="Willing to Sign Affidavit?"
                          value={nok.willingToSignAffidavit || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'willingToSignAffidavit', e.target.value)}
                          disabled={savingSection === 'nextOfKin'}
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Unknown">Unknown</option>
                        </Select>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comments about attitude toward cryonics
                        </label>
                        <textarea
                          value={nok.comments || ''}
                          onChange={(e) => updateNextOfKinLocal(index, 'comments', e.target.value)}
                          disabled={savingSection === 'nextOfKin'}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={addNextOfKinLocal}
                    className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors"
                    disabled={savingSection === 'nextOfKin'}
                  >
                    {nextOfKinList.length > 0 ? 'Add Another Emergency Contact' : 'Add Emergency Contact'}
                  </button>

                  {/* Action buttons */}
                  <div className={buttonStyles.actionContainer}>
                    <div className={buttonStyles.buttonGroup}>
                      <WhiteButton
                        text="Cancel"
                        onClick={() => cancelEditLocal('nextOfKin')}
                        className={buttonStyles.whiteButton.withMargin}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                      <PurpleButton
                        text={buttonStyles.getSaveButtonText(savingSection)}
                        onClick={saveNextOfKinLocal}
                        className={buttonStyles.purpleButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextOfKinSection;