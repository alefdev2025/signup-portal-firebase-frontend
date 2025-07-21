import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import FamilyInfoMobile from './FamilyInfoMobile';
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
import { CompletionWheelWithLegend } from './CompletionWheel';
import { HelpCircle } from 'lucide-react';

// Overlay Component - Updated to use local state like other sections
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
  const [showTooltip, setShowTooltip] = useState(false);
  // Local state for editing - completely separate from parent
  const [localFamilyInfo, setLocalFamilyInfo] = useState({});
  // Local validation errors
  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in view mode
      setShowSuccess(false);
      // Reset local state to current data when opening - create copy not reference
      setLocalFamilyInfo({...data.familyInfo} || {});
      setLocalErrors({});
    }
  }, [isOpen, data.familyInfo]);

  if (!isOpen) return null;

  // Validation function for birthplace
  const validateBirthplace = (value) => {
    if (!value || !value.trim()) return null;
    
    const trimmedValue = value.trim().toLowerCase();
    
    // Check if it's "unknown"
    if (trimmedValue === 'unknown') return null;
    
    // Check if it has at least 2 commas (city, state, country format)
    const commaCount = (value.match(/,/g) || []).length;
    if (commaCount >= 2) return null;
    
    // Return error message
    return 'Please include city, state/province, and country (or enter "Unknown")';
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    const errors = {};
    
    // Validate father's birthplace if editing father section
    if (section === 'father' && localFamilyInfo?.fathersBirthplace) {
      const error = validateBirthplace(localFamilyInfo.fathersBirthplace);
      if (error) {
        errors.fathersBirthplace = error;
        setLocalErrors(errors);
        return;
      }
    }
    
    // Validate mother's birthplace if editing mother section
    if (section === 'mother' && localFamilyInfo?.mothersBirthplace) {
      const error = validateBirthplace(localFamilyInfo.mothersBirthplace);
      if (error) {
        errors.mothersBirthplace = error;
        setLocalErrors(errors);
        return;
      }
    }
    
    // Clear errors and proceed with save
    setLocalErrors({});
    // Pass the local data back to parent via callback
    onSave(localFamilyInfo);
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset to original data - create new copy
    setLocalFamilyInfo({...data.familyInfo} || {});
    setEditMode(false);
    setLocalErrors({});
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'father':
        return {
          title: 'Father Information',
          description: 'Information about your father including his full name and birthplace. This information is required for legal documentation.',
        };
      case 'mother':
        return {
          title: 'Mother Information',
          description: 'Information about your mother including her full maiden name and birthplace. This information is required for legal documentation.',
        };
      case 'spouse':
        return {
          title: 'Spouse Information',
          description: 'Information about your spouse. This section is required if your marital status is "Married".',
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
                    {section === 'father' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                    {section === 'mother' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                    {section === 'spouse' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
              <div className={overlayStyles.body.successMessage.container}>
                <svg className={overlayStyles.body.successMessage.icon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={overlayStyles.body.successMessage.text}>Information updated successfully!</p>
              </div>
            )}

            {/* Fields */}
            {!editMode ? (
              /* Display Mode - Use local state */
              <div className={overlayStyles.body.content}>
                {section === 'father' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Father's Full Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localFamilyInfo?.fathersName)}
                        >
                          {localFamilyInfo?.fathersName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Father's Birthplace</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localFamilyInfo?.fathersBirthplace)}
                        >
                          {localFamilyInfo?.fathersBirthplace || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {section === 'mother' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Mother's Full Maiden Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localFamilyInfo?.mothersMaidenName)}
                        >
                          {localFamilyInfo?.mothersMaidenName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Mother's Birthplace</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!localFamilyInfo?.mothersBirthplace)}
                        >
                          {localFamilyInfo?.mothersBirthplace || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {section === 'spouse' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>
                        {data.personalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
                      </label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localFamilyInfo?.spousesName)}
                      >
                        {localFamilyInfo?.spousesName || '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode - Update local state only */
              <div className={overlayStyles.body.content}>
                {section === 'father' && (
                  <div className="space-y-4">
                    <Input
                      label="Father's Full Name *"
                      type="text"
                      value={localFamilyInfo?.fathersName || ''}
                      onChange={(e) => setLocalFamilyInfo({...localFamilyInfo, fathersName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.fathersName}
                    />
                    <Input
                      label="Father's Birthplace *"
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={localFamilyInfo?.fathersBirthplace || ''}
                      onChange={(e) => {
                        setLocalFamilyInfo({...localFamilyInfo, fathersBirthplace: e.target.value});
                        // Clear error on change
                        setLocalErrors({});
                      }}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.fathersBirthplace || localErrors.fathersBirthplace}
                    />
                    <p className="text-xs text-gray-500 -mt-2">
                      Enter "Unknown" if not known
                    </p>
                  </div>
                )}

                {section === 'mother' && (
                  <div className="space-y-4">
                    <Input
                      label="Mother's Full Maiden Name *"
                      type="text"
                      value={localFamilyInfo?.mothersMaidenName || ''}
                      onChange={(e) => setLocalFamilyInfo({...localFamilyInfo, mothersMaidenName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.mothersMaidenName}
                    />
                    <Input
                      label="Mother's Birthplace *"
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={localFamilyInfo?.mothersBirthplace || ''}
                      onChange={(e) => {
                        setLocalFamilyInfo({...localFamilyInfo, mothersBirthplace: e.target.value});
                        // Clear error on change
                        setLocalErrors({});
                      }}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.mothersBirthplace || localErrors.mothersBirthplace}
                    />
                    <p className="text-xs text-gray-500 -mt-2">
                      Enter "Unknown" if not known
                    </p>
                  </div>
                )}

                {section === 'spouse' && (
                  <div className="space-y-4">
                    <Input
                      label={`${data.personalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                      type="text"
                      value={localFamilyInfo?.spousesName || ''}
                      onChange={(e) => setLocalFamilyInfo({...localFamilyInfo, spousesName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.spousesName}
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
                  text={savingSection === 'family' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'family'}
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

const FamilyInfoSection = ({ 
  familyInfo = {}, 
  setFamilyInfo,
  personalInfo = {},
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveFamilyInfo, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  // Ensure familyInfo is always an object
  const safeFamilyInfo = familyInfo || {};
  const safePersonalInfo = personalInfo || {};
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  // Add pendingSave flag for triggering save after state update
  const [pendingSave, setPendingSave] = useState(false);
  // Local validation errors for main form
  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    // Inject animation styles
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
      saveFamilyInfo();
      setPendingSave(false);
    }
  }, [pendingSave, familyInfo]);

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      fathersName: { field: 'fathersName', source: 'familyInfo', label: "Father's Name" },
      fathersBirthplace: { field: 'fathersBirthplace', source: 'familyInfo', label: "Father's Birthplace" },
      mothersMaidenName: { field: 'mothersMaidenName', source: 'familyInfo', label: "Mother's Maiden Name" },
      mothersBirthplace: { field: 'mothersBirthplace', source: 'familyInfo', label: "Mother's Birthplace" }
    },
    recommended: {}
  };

  // Add spouse fields if married
  if (safePersonalInfo.maritalStatus === 'Married') {
    fieldConfig.required.spousesName = { field: 'spousesName', source: 'familyInfo', label: "Spouse's Name" };
  }

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = (updatedFamilyInfo) => {
    // Update parent state with the new data
    setFamilyInfo(updatedFamilyInfo);
    // Set flag to trigger save after state updates
    setPendingSave(true);
  };

  // Validation helpers
  const validateBirthplaceFormat = (birthplace) => {
    if (!birthplace) return false;
    const trimmed = birthplace.trim().toLowerCase();
    
    if (trimmed === 'unknown') return true;
    
    const commaCount = (birthplace.match(/,/g) || []).length;
    const parts = birthplace.split(/[,\s]+/).filter(part => part.length > 0);
    
    return commaCount >= 2 || parts.length >= 3;
  };

  const validateBirthplace = (value) => {
    if (!value || !value.trim()) return null;
    
    const trimmedValue = value.trim().toLowerCase();
    
    // Check if it's "unknown"
    if (trimmedValue === 'unknown') return null;
    
    // Check if it has at least 2 commas (city, state, country format)
    const commaCount = (value.match(/,/g) || []).length;
    if (commaCount >= 2) return null;
    
    // Return error message
    return 'Please include city, state/province, and country (or enter "Unknown")';
  };

  const needsBirthplaceUpdate = () => {
    const fatherBirthplace = safeFamilyInfo.fathersBirthplace || '';
    const motherBirthplace = safeFamilyInfo.mothersBirthplace || '';
    
    const fatherIncomplete = !fatherBirthplace || 
                           (!fatherBirthplace.includes(',') && fatherBirthplace.length < 10 && fatherBirthplace.toLowerCase() !== 'unknown');
    const motherIncomplete = !motherBirthplace || 
                           (!motherBirthplace.includes(',') && motherBirthplace.length < 10 && motherBirthplace.toLowerCase() !== 'unknown');
    
    return fatherIncomplete || motherIncomplete;
  };

  // Handle save with validation for main form
  const handleSaveWithValidation = () => {
    const errors = {};
    
    // Validate father's birthplace
    if (safeFamilyInfo?.fathersBirthplace) {
      const fatherError = validateBirthplace(safeFamilyInfo.fathersBirthplace);
      if (fatherError) {
        errors.fathersBirthplace = fatherError;
      }
    }
    
    // Validate mother's birthplace
    if (safeFamilyInfo?.mothersBirthplace) {
      const motherError = validateBirthplace(safeFamilyInfo.mothersBirthplace);
      if (motherError) {
        errors.mothersBirthplace = motherError;
      }
    }
    
    // If there are validation errors, set them and don't save
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    
    // Clear errors and proceed with save
    setLocalErrors({});
    saveFamilyInfo();
  };

  // Profile improvement notice component
  const ProfileImprovementNotice = () => (
    <div className={isMobile ? "mt-4 mb-4" : "flex items-center gap-4"}>
      <svg className={isMobile ? "w-8 h-8 text-red-600 flex-shrink-0 mb-2" : "w-10 h-10 text-red-600 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={isMobile ? "text-sm font-semibold text-white/90" : "text-sm font-semibold text-gray-900"}>
            Add Required Information
          </p>
          <div className="relative">
            <HelpCircle 
              className={isMobile ? "w-4 h-4 text-white/60 hover:text-white/80 cursor-help" : "w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"} 
              strokeWidth={2}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            />
            {showTooltip && (
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 ${isMobile ? 'w-64' : 'w-72'}`}>
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Why Does Alcor Need This?
                    </h3>
                    <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                    </svg>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-700">
                    Alcor needs complete family birthplace location to better obtain a death certificate
                  </p>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className={isMobile ? "text-sm text-white/70 font-light" : "text-sm text-gray-600 font-light"}>
          Add city, state, country to birthplaces ("Unknown" if unknown)
        </p>
      </div>
    </div>
  );

  return (
    <div ref={sectionRef} className={`family-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ familyInfo: safeFamilyInfo, personalInfo: safePersonalInfo }}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
      />

      {isMobile ? (
        <FamilyInfoMobile
          familyInfo={safeFamilyInfo}
          setFamilyInfo={setFamilyInfo}
          personalInfo={safePersonalInfo}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveFamilyInfo={saveFamilyInfo}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          fieldConfig={fieldConfig}
          needsBirthplaceUpdate={needsBirthplaceUpdate}
          ProfileImprovementNotice={ProfileImprovementNotice}
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'family')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Family Information</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'family')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Information about your immediate family members.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: Father's Name & Birthplace, Mother's Name & Birthplace
                          </p>
                          {safePersonalInfo.maritalStatus === 'Married' && (
                            <p className="text-gray-400 text-sm leading-5 mt-1">
                              Required: Spouse's Name
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ familyInfo: safeFamilyInfo }}
                    fieldConfig={fieldConfig}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.family ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Father Card */}
                  <InfoCard 
                    title="Father Information" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    sectionKey="father"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('father')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('father')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Full Name" value={safeFamilyInfo?.fathersName || '—'} isRequired />
                    <InfoField label="Birthplace" value={safeFamilyInfo?.fathersBirthplace || '—'} isRequired />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCard>

                  {/* Mother Card */}
                  <InfoCard 
                    title="Mother Information" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    sectionKey="mother"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('mother')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('mother')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Full Maiden Name" value={safeFamilyInfo?.mothersMaidenName || '—'} isRequired />
                    <InfoField label="Birthplace" value={safeFamilyInfo?.mothersBirthplace || '—'} isRequired />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCard>

                  {/* Spouse Card - Only show if married */}
                  {safePersonalInfo.maritalStatus === 'Married' ? (
                    <InfoCard 
                      title="Spouse Information" 
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      }
                      sectionKey="spouse"
                      hoveredSection={hoveredSection}
                      onMouseEnter={() => setHoveredSection('spouse')}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => handleCardClick('spouse')}
                      cardIndex={2}
                      isVisible={cardsVisible}
                    >
                      <InfoField 
                        label={safePersonalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} 
                        value={safeFamilyInfo?.spousesName || '—'} 
                        isRequired
                      />
                      <div className="opacity-0 pointer-events-none">
                        <InfoField label="" value="" />
                      </div>
                      <div className="opacity-0 pointer-events-none">
                        <InfoField label="" value="" />
                      </div>
                    </InfoCard>
                  ) : (
                    <div></div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Father's Full Name *"
                      type="text"
                      value={safeFamilyInfo.fathersName || ''}
                      onChange={(e) => setFamilyInfo({...safeFamilyInfo, fathersName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.fathersName}
                    />
                    <Input
                      label="Father's Birthplace *"
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={safeFamilyInfo.fathersBirthplace || ''}
                      onChange={(e) => {
                        setFamilyInfo({...safeFamilyInfo, fathersBirthplace: e.target.value});
                        // Clear error on change
                        setLocalErrors(prev => ({ ...prev, fathersBirthplace: null }));
                      }}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.fathersBirthplace || localErrors.fathersBirthplace}
                    />
                    <Input
                      label="Mother's Full Maiden Name *"
                      type="text"
                      value={safeFamilyInfo.mothersMaidenName || ''}
                      onChange={(e) => setFamilyInfo({...safeFamilyInfo, mothersMaidenName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.mothersMaidenName}
                    />
                    <Input
                      label="Mother's Birthplace *"
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={safeFamilyInfo.mothersBirthplace || ''}
                      onChange={(e) => {
                        setFamilyInfo({...safeFamilyInfo, mothersBirthplace: e.target.value});
                        // Clear error on change
                        setLocalErrors(prev => ({ ...prev, mothersBirthplace: null }));
                      }}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.mothersBirthplace || localErrors.mothersBirthplace}
                    />
                    {safePersonalInfo.maritalStatus === 'Married' && (
                      <div className="col-span-2">
                        <Input
                          label={`${safePersonalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                          type="text"
                          value={safeFamilyInfo.spousesName || ''}
                          onChange={(e) => setFamilyInfo({...safeFamilyInfo, spousesName: e.target.value})}
                          disabled={savingSection === 'family'}
                          error={fieldErrors.spousesName}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    * Please include city, state/province, and country for birthplaces. Enter "Unknown" if not known.
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              {editMode?.family ? (
                <div className={buttonStyles.actionContainer}>
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('family')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={handleSaveWithValidation}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'family'}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {needsBirthplaceUpdate() ? (
                    <div className="flex items-center justify-between mt-8 pt-6">
                      <ProfileImprovementNotice />
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('family')}
                        className={buttonStyles.whiteButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    </div>
                  ) : (
                    <div className={buttonStyles.actionContainer}>
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('family')}
                        className={buttonStyles.whiteButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyInfoSection;