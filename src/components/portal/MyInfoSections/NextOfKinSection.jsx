import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import NextOfKinMobile from './NextOfKinMobile';
import styleConfig2, { isFieldVisibleInEditMode, getSectionCheckboxColor } from '../styleConfig2';
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

// Overlay Component with proper local state management
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  nokIndex,
  nextOfKinList,
  onSave,
  savingSection,
  fieldErrors = {},
  validateEmail,
  formatPhoneDisplay
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Local state for editing - completely separate from parent
  const [localNok, setLocalNok] = useState({});

  useEffect(() => {
    if (isOpen && nokIndex !== null && nextOfKinList[nokIndex]) {
      setEditMode(false);  // Start in display mode
      setShowSuccess(false);
      // Deep copy the NOK data to avoid reference issues
      setLocalNok({
        ...nextOfKinList[nokIndex],
        address: nextOfKinList[nokIndex]?.address ? {...nextOfKinList[nokIndex].address} : {}
      });
    }
  }, [isOpen, nokIndex, nextOfKinList]);

  if (!isOpen || nokIndex === null) return null;

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    // Pass the local data back to parent via callback
    onSave(nokIndex, localNok);
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset to original data - deep copy again
    if (nextOfKinList[nokIndex]) {
      setLocalNok({
        ...nextOfKinList[nokIndex],
        address: nextOfKinList[nokIndex]?.address ? {...nextOfKinList[nokIndex].address} : {}
      });
    }
    setEditMode(false);
  };

  const updateLocalNok = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setLocalNok(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setLocalNok(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const formatAddress = (address) => {
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
  };

  // Local validateEmail if not provided
  const validateEmailLocal = validateEmail || ((email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  });

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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className={overlayStyles.header.textWrapper}>
                  <h3 className={overlayStyles.header.title}>
                    Emergency Contact {nokIndex + 1}
                  </h3>
                  <p className={overlayStyles.header.description}>
                    Details for {localNok?.firstName && localNok?.lastName ? 
                      `${localNok.firstName} ${localNok.lastName}` : 
                      'this emergency contact'}
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
                <p className={overlayStyles.body.successMessage.text}>Emergency contact updated successfully!</p>
              </div>
            )}

            {/* Fields */}
            {!editMode ? (
              /* Display Mode - Use local state */
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>First Name</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.firstName)}
                    >
                      {localNok?.firstName || '—'}
                    </p>
                  </div>
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Middle Name</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.middleName)}
                    >
                      {localNok?.middleName || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Last Name</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.lastName)}
                    >
                      {localNok?.lastName || '—'}
                    </p>
                  </div>
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Relationship</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.relationship)}
                    >
                      {localNok?.relationship || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Email</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.email)}
                    >
                      {localNok?.email || '—'}
                    </p>
                  </div>
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Mobile Phone</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.mobilePhone)}
                    >
                      {formatPhoneDisplay(localNok?.mobilePhone) || '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className={overlayStyles.displayMode.field.label}>Address</label>
                  <p 
                    className={overlayStyles.displayMode.field.value}
                    style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.address || !localNok?.address?.street1)}
                  >
                    {formatAddress(localNok?.address)}
                  </p>
                </div>

                <div>
                  <label className={overlayStyles.displayMode.field.label}>Willing to Sign Affidavit?</label>
                  <p 
                    className={overlayStyles.displayMode.field.value}
                    style={overlayStyles.displayMode.field.getFieldStyle(!localNok?.willingToSignAffidavit)}
                  >
                    {localNok?.willingToSignAffidavit || '—'}
                  </p>
                </div>

                {localNok?.comments && (
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Comments</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(false)}
                    >
                      {localNok.comments}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode - Update local state only */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name *"
                    value={localNok?.firstName || ''}
                    onChange={(e) => updateLocalNok('firstName', e.target.value)}
                    error={fieldErrors[`nok_${nokIndex}_firstName`]}
                    disabled={savingSection === 'nextOfKin'}
                  />
                  <Input
                    label="Middle Name"
                    value={localNok?.middleName || ''}
                    onChange={(e) => updateLocalNok('middleName', e.target.value)}
                    disabled={savingSection === 'nextOfKin'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Last Name *"
                    value={localNok?.lastName || ''}
                    onChange={(e) => updateLocalNok('lastName', e.target.value)}
                    error={fieldErrors[`nok_${nokIndex}_lastName`]}
                    disabled={savingSection === 'nextOfKin'}
                  />
                  <Input
                    label="Relationship *"
                    value={localNok?.relationship || ''}
                    onChange={(e) => updateLocalNok('relationship', e.target.value)}
                    placeholder="e.g., Spouse, Child, Parent"
                    error={fieldErrors[`nok_${nokIndex}_relationship`]}
                    disabled={savingSection === 'nextOfKin'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={localNok?.dateOfBirth || ''}
                    onChange={(e) => updateLocalNok('dateOfBirth', e.target.value)}
                    disabled={savingSection === 'nextOfKin'}
                  />
                  <Input
                    label="Email *"
                    type="email"
                    value={localNok?.email || ''}
                    onChange={(e) => updateLocalNok('email', e.target.value)}
                    error={fieldErrors[`nok_${nokIndex}_email`] || 
                           (!validateEmailLocal(localNok?.email) && localNok?.email ? 'Invalid email format' : '')}
                    disabled={savingSection === 'nextOfKin'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Mobile Phone *"
                    type="tel"
                    value={localNok?.mobilePhone || ''}
                    onChange={(e) => updateLocalNok('mobilePhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    error={fieldErrors[`nok_${nokIndex}_mobilePhone`]}
                    disabled={savingSection === 'nextOfKin'}
                  />
                  <Input
                    label="Home Phone"
                    type="tel"
                    value={localNok?.homePhone || ''}
                    onChange={(e) => updateLocalNok('homePhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={savingSection === 'nextOfKin'}
                  />
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Address</h5>
                  <div className="space-y-3">
                    <Input
                      label=""
                      value={localNok?.address?.street1 || ''}
                      onChange={(e) => updateLocalNok('address.street1', e.target.value)}
                      placeholder="Street Address Line 1"
                      disabled={savingSection === 'nextOfKin'}
                    />
                    <Input
                      label=""
                      value={localNok?.address?.street2 || ''}
                      onChange={(e) => updateLocalNok('address.street2', e.target.value)}
                      placeholder="Street Address Line 2"
                      disabled={savingSection === 'nextOfKin'}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label=""
                        value={localNok?.address?.city || ''}
                        onChange={(e) => updateLocalNok('address.city', e.target.value)}
                        placeholder="City"
                        disabled={savingSection === 'nextOfKin'}
                      />
                      <Input
                        label=""
                        value={localNok?.address?.state || ''}
                        onChange={(e) => updateLocalNok('address.state', e.target.value)}
                        placeholder="State/Province"
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label=""
                        value={localNok?.address?.postalCode || ''}
                        onChange={(e) => updateLocalNok('address.postalCode', e.target.value)}
                        placeholder="Zip/Postal Code"
                        disabled={savingSection === 'nextOfKin'}
                      />
                      <Input
                        label=""
                        value={localNok?.address?.country || ''}
                        onChange={(e) => updateLocalNok('address.country', e.target.value)}
                        placeholder="Country"
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                  </div>
                </div>
                
                <Select
                  label="Willing to Sign Affidavit?"
                  value={localNok?.willingToSignAffidavit || ''}
                  onChange={(e) => updateLocalNok('willingToSignAffidavit', e.target.value)}
                  disabled={savingSection === 'nextOfKin'}
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
                    value={localNok?.comments || ''}
                    onChange={(e) => updateLocalNok('comments', e.target.value)}
                    disabled={savingSection === 'nextOfKin'}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                </div>
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
                  text={savingSection === 'nextOfKin' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'nextOfKin'}
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
  // State management
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayNokIndex, setOverlayNokIndex] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  // Add pendingSave flag for triggering save after state update
  const [pendingSave, setPendingSave] = useState(false);

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
    const newList = [...nextOfKinList];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!newList[index][parent]) {
        newList[index][parent] = {};
      }
      newList[index][parent][child] = value;
    } else {
      newList[index][field] = value;
    }
    setNextOfKinList(newList);
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
    setNextOfKinList([...nextOfKinList, newNok]);
  });

  // Define removeNextOfKin if not provided
  const removeNextOfKinLocal = removeNextOfKin || ((index) => {
    const newList = nextOfKinList.filter((_, i) => i !== index);
    setNextOfKinList(newList);
  });

  // Define saveNextOfKin if not provided
  const saveNextOfKinLocal = saveNextOfKin || (() => {
    console.log('Saving next of kin...', nextOfKinList);
    // Ensure all IDs are strings before saving
    const normalizedList = nextOfKinList.map(nok => ({
      ...nok,
      id: nok.id ? String(nok.id) : `nok_${Date.now()}_${Math.random()}`
    }));
    setNextOfKinList(normalizedList);
    
    // Add your actual save logic here
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
    const hasNumericIds = nextOfKinList.some(nok => typeof nok.id === 'number');
    if (hasNumericIds) {
      const normalizedList = nextOfKinList.map(nok => ({
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

  // Trigger save after state update from overlay
  useEffect(() => {
    if (pendingSave) {
      saveNextOfKinLocal();
      setPendingSave(false);
    }
  }, [pendingSave, nextOfKinList]);

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
  };

  const handleOverlaySave = (index, updatedNok) => {
    // Update the nextOfKinList with the updated NOK data
    const newList = [...nextOfKinList];
    newList[index] = updatedNok;
    setNextOfKinList(newList);
    // Set flag to trigger save after state updates
    setPendingSave(true);
  };

  return (
    <div ref={sectionRef} className={`next-of-kin-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => {
          setOverlayOpen(false);
          setOverlayNokIndex(null);
        }}
        nokIndex={overlayNokIndex}
        nextOfKinList={nextOfKinList}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        validateEmail={validateEmailLocal}
        formatPhoneDisplay={formatPhoneDisplayLocal}
      />

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