// FamilyInfoSection.jsx

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
import { memberCategoryConfig } from '../memberCategoryConfig';

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
  // Initialize familyInfo if empty
  useEffect(() => {
    if (!familyInfo || Object.keys(familyInfo).length === 0) {
      setFamilyInfo({
        fathersName: '',
        fathersBirthplace: '',
        mothersMaidenName: '',
        mothersBirthplace: '',
        spousesName: ''
      });
    }
  }, []);

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
    if (overlayWaitingForSave && savingSection !== 'family') {
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
        }, 1500);
      } else {
        // There were errors, keep overlay open in edit mode
        setOverlayFieldErrors(fieldErrors);
      }
    }
  }, [savingSection, overlayWaitingForSave, fieldErrors]);

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
    setOverlayEditMode(false); // Start in view mode
    setShowOverlaySuccess(false); // Reset success message
    setOverlayFieldErrors({}); // Clear any previous errors
  };

  // IMPROVED: More lenient birthplace validation
  const validateBirthplaceFormat = (birthplace) => {
    if (!birthplace) return false;
    const trimmed = birthplace.trim().toLowerCase();
    
    // Accept "unknown"
    if (trimmed === 'unknown') return true;
    
    // Accept if it has at least 1 comma (e.g., "New York, USA")
    const commaCount = (birthplace.match(/,/g) || []).length;
    if (commaCount >= 1) return true;
    
    // Accept if it's reasonably detailed even without commas
    // (e.g., "London United Kingdom" or "Tokyo Japan")
    const parts = birthplace.split(/[\s,]+/).filter(part => part.length > 0);
    if (parts.length >= 2 && birthplace.length >= 10) return true;
    
    return false;
  };

  const validateBirthplace = (value) => {
    if (!value || !value.trim()) return null;
    
    const trimmedValue = value.trim().toLowerCase();
    
    // Check if it's "unknown"
    if (trimmedValue === 'unknown') return null;
    
    // Check if it has at least 1 comma
    const commaCount = (value.match(/,/g) || []).length;
    if (commaCount >= 1) return null;
    
    // Check if it's reasonably detailed even without commas
    const parts = value.split(/[\s,]+/).filter(part => part.length > 0);
    if (parts.length >= 2 && value.length >= 10) return null;
    
    // Return helpful error message
    return 'Please include location details (e.g., "City, Country" or enter "Unknown")';
  };

  const needsBirthplaceUpdate = () => {
    const fatherBirthplace = safeFamilyInfo.fathersBirthplace || '';
    const motherBirthplace = safeFamilyInfo.mothersBirthplace || '';
    
    const fatherIncomplete = !validateBirthplaceFormat(fatherBirthplace);
    const motherIncomplete = !validateBirthplaceFormat(motherBirthplace);
    
    return fatherIncomplete || motherIncomplete;
  };

  const handleOverlayEdit = () => {
    // Set the main edit mode to true if not already
    if (!editMode.family) {
      toggleEditMode('family');
    }
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
  };

  // IMPROVED: Allow saving partial data from overlay
  const handleOverlaySave = async () => {
    // Do local validation for ONLY the current section being edited
    const errors = {};
    
    // Only validate the fields for the current overlay section
    if (overlaySection === 'father') {
      if (!safeFamilyInfo?.fathersName || !safeFamilyInfo.fathersName.trim()) {
        errors.fathersName = "Father's name is required";
      }
      if (!safeFamilyInfo?.fathersBirthplace || !safeFamilyInfo.fathersBirthplace.trim()) {
        errors.fathersBirthplace = "Father's birthplace is required";
      } else {
        const birthplaceError = validateBirthplace(safeFamilyInfo.fathersBirthplace);
        if (birthplaceError) {
          errors.fathersBirthplace = birthplaceError;
        }
      }
    }
    
    if (overlaySection === 'mother') {
      if (!safeFamilyInfo?.mothersMaidenName || !safeFamilyInfo.mothersMaidenName.trim()) {
        errors.mothersMaidenName = "Mother's maiden name is required";
      }
      if (!safeFamilyInfo?.mothersBirthplace || !safeFamilyInfo.mothersBirthplace.trim()) {
        errors.mothersBirthplace = "Mother's birthplace is required";
      } else {
        const birthplaceError = validateBirthplace(safeFamilyInfo.mothersBirthplace);
        if (birthplaceError) {
          errors.mothersBirthplace = birthplaceError;
        }
      }
    }
    
    if (overlaySection === 'spouse' && safePersonalInfo?.maritalStatus === 'Married') {
      if (!safeFamilyInfo?.spousesName || !safeFamilyInfo.spousesName.trim()) {
        errors.spousesName = "Spouse's name is required";
      }
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
    
    // IMPORTANT: Call a PARTIAL save function instead of the full saveFamilyInfo
    // We need to save just the current section's data
    try {
      // Create a custom save that only validates/saves the current section
      await savePartialFamilyInfo(overlaySection);
      
      // Show success
      setShowOverlaySuccess(true);
      setOverlayEditMode(false);
      setOverlayFieldErrors({});
      setIsOverlaySaving(false);
      setOverlayWaitingForSave(false);
      
      // Close overlay after showing success
      setTimeout(() => {
        setOverlayOpen(false);
        setShowOverlaySuccess(false);
      }, 1500);
    } catch (error) {
      // Handle error
      setOverlayFieldErrors({ general: 'Failed to save. Please try again.' });
      setIsOverlaySaving(false);
      setOverlayWaitingForSave(false);
    }
  };

  // NEW: Function to save partial family info (only validates what's being saved)
  const savePartialFamilyInfo = async (section) => {
    // This would need to be implemented in the parent component or here
    // For now, we'll call the regular saveFamilyInfo but with a flag
    
    // Temporarily bypass full validation by modifying the data
    const tempFamilyInfo = { ...safeFamilyInfo };
    
    // If saving father, ensure mother fields have at least empty strings
    if (section === 'father') {
      if (!tempFamilyInfo.mothersMaidenName) tempFamilyInfo.mothersMaidenName = '';
      if (!tempFamilyInfo.mothersBirthplace) tempFamilyInfo.mothersBirthplace = '';
    }
    
    // If saving mother, ensure father fields have at least empty strings
    if (section === 'mother') {
      if (!tempFamilyInfo.fathersName) tempFamilyInfo.fathersName = '';
      if (!tempFamilyInfo.fathersBirthplace) tempFamilyInfo.fathersBirthplace = '';
    }
    
    // Update the familyInfo with the temp data
    setFamilyInfo(tempFamilyInfo);
    
    // Call the parent's save function
    // Note: This still might fail if the parent requires ALL fields
    // The parent component would need to be updated to allow partial saves
    return saveFamilyInfo();
  };

  const handleOverlayCancel = () => {
    // Call the parent's cancel function
    cancelEdit('family');
    setOverlayEditMode(false);
    setIsOverlaySaving(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const handleOverlayClose = () => {
    // If we're saving, don't allow close
    if (isOverlaySaving || overlayWaitingForSave || savingSection === 'family') {
      return;
    }
    
    // If we're in edit mode, cancel first
    if (overlayEditMode) {
      cancelEdit('family');
      setOverlayEditMode(false);
    }
    setOverlayOpen(false);
    setShowOverlaySuccess(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const getFieldDescriptions = () => {
    switch (overlaySection) {
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

// Profile improvement notice component
const ProfileImprovementNotice = () => (
  <div className={isMobile ? "flex items-start space-x-2" : "flex items-center gap-4"}>
    <svg className={isMobile ? "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" : "w-10 h-10 text-red-600 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className={isMobile ? "text-sm font-semibold text-gray-900" : "text-sm font-semibold text-gray-900"}>
          Add Required Information
        </p>
        <div className="relative">
          <HelpCircle 
            className={isMobile ? "w-4 h-4 text-gray-600 hover:text-gray-800 cursor-help" : "w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"} 
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
      <p className={isMobile ? "text-sm text-gray-700 font-light" : "text-sm text-gray-600 font-light"}>
        Add location details (e.g., "City, Country" or enter "Unknown")
      </p>
    </div>
  </div>
);

  // Create the edit form component that will be reused
  const renderEditForm = (isInOverlay = false) => {
    const containerClass = isInOverlay ? "space-y-4" : "grid grid-cols-2 gap-4";
    // Use overlay-specific errors when in overlay, otherwise use parent fieldErrors
    const currentErrors = isInOverlay ? overlayFieldErrors : fieldErrors;
    
    return (
      <div className={containerClass}>
        {isInOverlay && overlaySection === 'father' && (
          <>
            <Input
              label="Father's Full Name *"
              type="text"
              value={safeFamilyInfo?.fathersName || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, fathersName: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'family'}
              error={currentErrors.fathersName}
            />
            <Input
              label="Father's Birthplace *"
              type="text"
              placeholder="City, State/Province, Country"
              value={safeFamilyInfo?.fathersBirthplace || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, fathersBirthplace: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'family'}
              error={currentErrors.fathersBirthplace}
            />
            <p className="text-xs text-gray-500 -mt-2">
              Enter "Unknown" if not known. Include location details for best results.
            </p>
          </>
        )}

        {isInOverlay && overlaySection === 'mother' && (
          <>
            <Input
              label="Mother's Full Maiden Name *"
              type="text"
              value={safeFamilyInfo?.mothersMaidenName || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, mothersMaidenName: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'family'}
              error={currentErrors.mothersMaidenName}
            />
            <Input
              label="Mother's Birthplace *"
              type="text"
              placeholder="City, State/Province, Country"
              value={safeFamilyInfo?.mothersBirthplace || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, mothersBirthplace: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'family'}
              error={currentErrors.mothersBirthplace}
            />
            <p className="text-xs text-gray-500 -mt-2">
              Enter "Unknown" if not known. Include location details for best results.
            </p>
          </>
        )}

        {isInOverlay && overlaySection === 'spouse' && (
          <Input
            label={`${safePersonalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
            type="text"
            value={safeFamilyInfo?.spousesName || ''}
            onChange={(e) => setFamilyInfo({...safeFamilyInfo, spousesName: e.target.value})}
            disabled={isOverlaySaving || savingSection === 'family'}
            error={currentErrors.spousesName}
          />
        )}

        {!isInOverlay && (
          <>
            <Input
              label="Father's Full Name *"
              type="text"
              value={safeFamilyInfo.fathersName || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, fathersName: e.target.value})}
              disabled={savingSection === 'family'}
              error={currentErrors.fathersName}
            />
            <Input
              label="Father's Birthplace *"
              type="text"
              placeholder="City, State/Province, Country"
              value={safeFamilyInfo.fathersBirthplace || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, fathersBirthplace: e.target.value})}
              disabled={savingSection === 'family'}
              error={currentErrors.fathersBirthplace}
            />
            <Input
              label="Mother's Full Maiden Name *"
              type="text"
              value={safeFamilyInfo.mothersMaidenName || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, mothersMaidenName: e.target.value})}
              disabled={savingSection === 'family'}
              error={currentErrors.mothersMaidenName}
            />
            <Input
              label="Mother's Birthplace *"
              type="text"
              placeholder="City, State/Province, Country"
              value={safeFamilyInfo.mothersBirthplace || ''}
              onChange={(e) => setFamilyInfo({...safeFamilyInfo, mothersBirthplace: e.target.value})}
              disabled={savingSection === 'family'}
              error={currentErrors.mothersBirthplace}
            />
            {safePersonalInfo.maritalStatus === 'Married' && (
              <div className="col-span-2">
                <Input
                  label={`${safePersonalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                  type="text"
                  value={safeFamilyInfo.spousesName || ''}
                  onChange={(e) => setFamilyInfo({...safeFamilyInfo, spousesName: e.target.value})}
                  disabled={savingSection === 'family'}
                  error={currentErrors.spousesName}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Create the view content for overlay
  const renderOverlayViewContent = () => {
    return (
      <div className="space-y-6">
        {overlaySection === 'father' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Father's Full Name</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeFamilyInfo?.fathersName)}
                >
                  {safeFamilyInfo?.fathersName || '—'}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Father's Birthplace</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeFamilyInfo?.fathersBirthplace)}
                >
                  {safeFamilyInfo?.fathersBirthplace || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {overlaySection === 'mother' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Mother's Full Maiden Name</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeFamilyInfo?.mothersMaidenName)}
                >
                  {safeFamilyInfo?.mothersMaidenName || '—'}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Mother's Birthplace</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeFamilyInfo?.mothersBirthplace)}
                >
                  {safeFamilyInfo?.mothersBirthplace || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {overlaySection === 'spouse' && (
          <div className="space-y-6">
            <div>
              <label className={overlayStyles.displayMode.field.label}>
                {safePersonalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
              </label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeFamilyInfo?.spousesName)}
              >
                {safeFamilyInfo?.spousesName || '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} className={`family-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
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
            {renderEditForm(true)}
            
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
                  {renderEditForm(false)}
                  <p className="text-sm text-gray-500 mt-4">
                    * Include location details for birthplaces (e.g., "City, Country"). Enter "Unknown" if not known.
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
                      onClick={saveFamilyInfo}
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