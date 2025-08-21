import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import OccupationMobile from './OccupationMobile';
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
                    {section === 'career' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    )}
                    {section === 'military' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
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

const OccupationSection = ({ 
  occupation = {}, 
  setOccupation,
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveOccupation, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  // Ensure occupation is always an object
  const safeOccupation = occupation || {};
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
    if (overlayWaitingForSave && savingSection !== 'occupation') {
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

  // Create a modified occupation object that has a string representation of military service status
  const occupationForWheel = {
    ...safeOccupation,
    militaryServiceAnswered: safeOccupation?.hasMilitaryService !== undefined && safeOccupation?.hasMilitaryService !== null ? 'answered' : ''
  };

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      occupation: { field: 'occupation', source: 'occupation', label: 'Job Title' },
      militaryServiceAnswered: { field: 'militaryServiceAnswered', source: 'occupation', label: 'Military Service Status' }
    },
    recommended: {
      occupationalIndustry: { field: 'occupationalIndustry', source: 'occupation', label: 'Industry' }
    }
  };
  
  // Only add military fields as required if they actually served
  if (safeOccupation?.hasMilitaryService === true) {
    fieldConfig.required.militaryBranch = { 
      field: 'militaryBranch', 
      source: 'occupation', 
      label: 'Military Branch'
    };
    fieldConfig.required.servedFrom = { 
      field: 'servedFrom', 
      source: 'occupation', 
      label: 'Service Start Year'
    };
    fieldConfig.required.servedTo = { 
      field: 'servedTo', 
      source: 'occupation', 
      label: 'Service End Year'
    };
  }

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
    setOverlayEditMode(false); // Start in view mode
    setShowOverlaySuccess(false); // Reset success message
    setOverlayFieldErrors({}); // Clear any previous errors
  };

  const handleOverlayEdit = () => {
    // Set the main edit mode to true if not already
    if (!editMode.occupation) {
      toggleEditMode('occupation');
    }
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
  };

  const handleOverlaySave = () => {
    // Do local validation first
    const errors = {};
    
    // Validate based on section
    if (overlaySection === 'career') {
      if (!safeOccupation?.occupation || !safeOccupation.occupation.trim()) {
        errors.occupation = "Job title is required";
      }
    }
    
    if (overlaySection === 'military') {
      // Military service status is always required (yes/no answer)
      if (safeOccupation?.hasMilitaryService === undefined || safeOccupation?.hasMilitaryService === null) {
        errors.hasMilitaryService = "Please indicate if you served in the military";
      }
      
      // If they served, validate additional fields
      if (safeOccupation?.hasMilitaryService === true) {
        if (!safeOccupation?.militaryBranch || !safeOccupation.militaryBranch.trim()) {
          errors.militaryBranch = "Military branch is required";
        }
        if (!safeOccupation?.servedFrom || !safeOccupation.servedFrom.trim()) {
          errors.servedFrom = "Service start year is required";
        }
        if (!safeOccupation?.servedTo || !safeOccupation.servedTo.trim()) {
          errors.servedTo = "Service end year is required";
        }
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
    
    // Call the parent's save function
    saveOccupation();
    // The useEffect will handle the result when savingSection changes
  };

  const handleOverlayCancel = () => {
    // Call the parent's cancel function
    cancelEdit('occupation');
    setOverlayEditMode(false);
    setIsOverlaySaving(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const handleOverlayClose = () => {
    // If we're saving, don't allow close
    if (isOverlaySaving || overlayWaitingForSave || savingSection === 'occupation') {
      return;
    }
    
    // If we're in edit mode, cancel first
    if (overlayEditMode) {
      cancelEdit('occupation');
      setOverlayEditMode(false);
    }
    setOverlayOpen(false);
    setShowOverlaySuccess(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const getFieldDescriptions = () => {
    switch (overlaySection) {
      case 'career':
        return {
          title: 'Career Information',
          description: 'Your current or former occupation and industry. This information helps us understand our member demographics.',
        };
      case 'military':
        return {
          title: 'Military Service',
          description: 'Information about your military service history, if applicable.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  // Format military service years for display
  const formatServiceYears = (from, to) => {
    if (!from && !to) return '—';
    if (from && to) return `${from} - ${to}`;
    if (from && !to) return `${from} - Present`;
    return '—';
  };

  // Check if occupation is just "Retired" (case-insensitive)
  const isJustRetired = (occupationValue) => {
    return occupationValue && occupationValue.toLowerCase().trim() === 'retired';
  };

  // Check if occupation needs update (empty or just "Retired")
  const needsOccupationUpdate = () => {
    return !safeOccupation.occupation || isJustRetired(safeOccupation.occupation);
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
            Update Your Occupation
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
                    Alcor needs complete occupation information to better obtain a death certificate
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
          {!safeOccupation.occupation ? "Please add your occupation information" : "Please include your occupation before retirement"}
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
        {isInOverlay && overlaySection === 'career' && (
          <>
            <div>
              <Input
                label="Job Title *"
                type="text"
                value={safeOccupation?.occupation || ''}
                onChange={(e) => setOccupation({...safeOccupation, occupation: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'occupation'}
                error={currentErrors.occupation}
              />
              {!safeOccupation?.occupation && (
                <p className="text-gray-500 text-sm mt-1 font-light">
                  "Homemaker" is an option if you did not have employment
                </p>
              )}
            </div>
            <Select
              label="Industry"
              value={safeOccupation?.occupationalIndustry || ''}
              onChange={(e) => setOccupation({...safeOccupation, occupationalIndustry: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'occupation'}
            >
              <option value="">Select...</option>
              <option value="Academic">Academic</option>
              <option value="Accounting">Accounting</option>
              <option value="Actuarial Sciences">Actuarial Sciences</option>
              <option value="Admin">Admin</option>
              <option value="Advertising/Marketing">Advertising/Marketing</option>
              <option value="Agricultural Services">Agricultural Services</option>
              <option value="Animation">Animation</option>
              <option value="Architecture">Architecture</option>
              <option value="Art">Art</option>
              <option value="Author/Journalist">Author/Journalist</option>
              <option value="Automotive">Automotive</option>
              <option value="Aviation">Aviation</option>
              <option value="Business/Finance">Business/Finance</option>
              <option value="Child">Child</option>
              <option value="Construction">Construction</option>
              <option value="Consulting">Consulting</option>
              <option value="Disabled">Disabled</option>
              <option value="Education">Education</option>
              <option value="Engineering">Engineering</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Executive">Executive</option>
              <option value="Factory/Manufacturing">Factory/Manufacturing</option>
              <option value="Fashion/Design">Fashion/Design</option>
              <option value="Film/Theater">Film/Theater</option>
              <option value="Firefighter">Firefighter</option>
              <option value="Food Services">Food Services</option>
              <option value="Government">Government</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Insurance">Insurance</option>
              <option value="Legal Services">Legal Services</option>
              <option value="Logistics">Logistics</option>
              <option value="Management">Management</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Media/Broadcasting">Media/Broadcasting</option>
              <option value="Medicine/Health Care">Medicine/Health Care</option>
              <option value="Military/Armed Forced">Military/Armed Forced</option>
              <option value="Non-Profit">Non-Profit</option>
              <option value="Pharmaceutical">Pharmaceutical</option>
              <option value="Police">Police</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Retail">Retail</option>
              <option value="Retired">Retired</option>
              <option value="Sales">Sales</option>
              <option value="Science/Research">Science/Research</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Sports">Sports</option>
              <option value="Student">Student</option>
              <option value="Transportation">Transportation</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Veterinary Sciences">Veterinary Sciences</option>
              <option value="Other">Other</option>
            </Select>
          </>
        )}

        {isInOverlay && overlaySection === 'military' && (
          <>
            <Checkbox
              label="Have you served in the US Military?"
              checked={!!safeOccupation?.hasMilitaryService}
              onChange={(e) => setOccupation({...safeOccupation, hasMilitaryService: e.target.checked})}
              disabled={isOverlaySaving || savingSection === 'occupation'}
            />
            {safeOccupation?.hasMilitaryService && (
              <>
                <Select
                  label="Military Branch *"
                  value={safeOccupation?.militaryBranch || ''}
                  onChange={(e) => setOccupation({...safeOccupation, militaryBranch: e.target.value})}
                  disabled={isOverlaySaving || savingSection === 'occupation'}
                  error={currentErrors.militaryBranch}
                >
                  <option value="">Select...</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Marines">Marines</option>
                  <option value="Coast Guard">Coast Guard</option>
                  <option value="Space Force">Space Force</option>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Service Start Year *"
                    type="text"
                    value={safeOccupation?.servedFrom || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d{0,4}$/.test(value)) {
                        setOccupation({...safeOccupation, servedFrom: value});
                      }
                    }}
                    placeholder="YYYY"
                    maxLength="4"
                    pattern="\d{4}"
                    disabled={isOverlaySaving || savingSection === 'occupation'}
                    error={currentErrors.servedFrom}
                  />
                  <Input
                    label="Service End Year *"
                    type="text"
                    value={safeOccupation?.servedTo || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d{0,4}$/.test(value)) {
                        setOccupation({...safeOccupation, servedTo: value});
                      }
                    }}
                    placeholder="YYYY"
                    maxLength="4"
                    pattern="\d{4}"
                    disabled={isOverlaySaving || savingSection === 'occupation'}
                    error={currentErrors.servedTo}
                  />
                </div>
              </>
            )}
          </>
        )}

        {!isInOverlay && (
          <>
            <div>
              <Input
                label="Job Title"
                type="text"
                value={safeOccupation.occupation || ''}
                onChange={(e) => setOccupation({...safeOccupation, occupation: e.target.value})}
                disabled={savingSection === 'occupation'}
                error={currentErrors.occupation}
              />
              {!safeOccupation.occupation && (
                <p className="text-gray-500 text-sm mt-1 font-light">
                  "Homemaker" is an option if you did not have employment
                </p>
              )}
              {currentErrors.occupation && (
                <p className="text-red-600 text-sm mt-1 font-light">
                  {currentErrors.occupation}
                </p>
              )}
              {safeOccupation.occupation && safeOccupation.occupation.toLowerCase().includes('retired') && !isJustRetired(safeOccupation.occupation) && (
                <p className="text-green-600 text-sm mt-1 font-light">
                  ✓ Good format - includes previous occupation
                </p>
              )}
            </div>
            <Select
              label="Industry"
              value={safeOccupation.occupationalIndustry || ''}
              onChange={(e) => setOccupation({...safeOccupation, occupationalIndustry: e.target.value})}
              disabled={savingSection === 'occupation'}
            >
              <option value="">Select...</option>
              <option value="Academic">Academic</option>
              <option value="Accounting">Accounting</option>
              <option value="Actuarial Sciences">Actuarial Sciences</option>
              <option value="Admin">Admin</option>
              <option value="Advertising/Marketing">Advertising/Marketing</option>
              <option value="Agricultural Services">Agricultural Services</option>
              <option value="Animation">Animation</option>
              <option value="Architecture">Architecture</option>
              <option value="Art">Art</option>
              <option value="Author/Journalist">Author/Journalist</option>
              <option value="Automotive">Automotive</option>
              <option value="Aviation">Aviation</option>
              <option value="Business/Finance">Business/Finance</option>
              <option value="Child">Child</option>
              <option value="Construction">Construction</option>
              <option value="Consulting">Consulting</option>
              <option value="Disabled">Disabled</option>
              <option value="Education">Education</option>
              <option value="Engineering">Engineering</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Executive">Executive</option>
              <option value="Factory/Manufacturing">Factory/Manufacturing</option>
              <option value="Fashion/Design">Fashion/Design</option>
              <option value="Film/Theater">Film/Theater</option>
              <option value="Firefighter">Firefighter</option>
              <option value="Food Services">Food Services</option>
              <option value="Government">Government</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Insurance">Insurance</option>
              <option value="Legal Services">Legal Services</option>
              <option value="Logistics">Logistics</option>
              <option value="Management">Management</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Media/Broadcasting">Media/Broadcasting</option>
              <option value="Medicine/Health Care">Medicine/Health Care</option>
              <option value="Military/Armed Forced">Military/Armed Forced</option>
              <option value="Non-Profit">Non-Profit</option>
              <option value="Pharmaceutical">Pharmaceutical</option>
              <option value="Police">Police</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Retail">Retail</option>
              <option value="Retired">Retired</option>
              <option value="Sales">Sales</option>
              <option value="Science/Research">Science/Research</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Sports">Sports</option>
              <option value="Student">Student</option>
              <option value="Transportation">Transportation</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Veterinary Sciences">Veterinary Sciences</option>
              <option value="Other">Other</option>
            </Select>
            <Checkbox
              containerClassName="col-span-2"
              label="Have you served in the US Military?"
              checked={!!safeOccupation?.hasMilitaryService}
              onChange={(e) => setOccupation({...safeOccupation, hasMilitaryService: e.target.checked})}
              disabled={savingSection === 'occupation'}
            />
            {safeOccupation.hasMilitaryService && (
              <>
                <Select
                  label="Military Branch *"
                  value={safeOccupation.militaryBranch || ''}
                  onChange={(e) => setOccupation({...safeOccupation, militaryBranch: e.target.value})}
                  disabled={savingSection === 'occupation'}
                  error={currentErrors.militaryBranch}
                >
                  <option value="">Select...</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Marines">Marines</option>
                  <option value="Coast Guard">Coast Guard</option>
                  <option value="Space Force">Space Force</option>
                </Select>
                <Input
                  label="Service Start Year *"
                  type="text"
                  value={safeOccupation.servedFrom || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d{0,4}$/.test(value)) {
                      setOccupation({...safeOccupation, servedFrom: value});
                    }
                  }}
                  disabled={savingSection === 'occupation'}
                  placeholder="YYYY"
                  maxLength="4"
                  pattern="\d{4}"
                  error={currentErrors.servedFrom}
                />
                <Input
                  label="Service End Year *"
                  type="text"
                  value={safeOccupation.servedTo || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d{0,4}$/.test(value)) {
                      setOccupation({...safeOccupation, servedTo: value});
                    }
                  }}
                  disabled={savingSection === 'occupation'}
                  placeholder="YYYY"
                  maxLength="4"
                  pattern="\d{4}"
                  error={currentErrors.servedTo}
                />
              </>
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
        {overlaySection === 'career' && (
          <div className="space-y-6">
            <div>
              <label className={overlayStyles.displayMode.field.label}>Job Title</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeOccupation?.occupation)}
              >
                {safeOccupation?.occupation || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Industry</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeOccupation?.occupationalIndustry)}
              >
                {safeOccupation?.occupationalIndustry || '—'}
              </p>
            </div>
          </div>
        )}

        {overlaySection === 'military' && (
          <div className="space-y-6">
            <div>
              <label className={overlayStyles.displayMode.field.label}>Military Service</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(safeOccupation?.hasMilitaryService === undefined || safeOccupation?.hasMilitaryService === null)}
              >
                {safeOccupation?.hasMilitaryService !== undefined && safeOccupation?.hasMilitaryService !== null 
                  ? (safeOccupation.hasMilitaryService ? 'Yes' : 'No') 
                  : '—'}
              </p>
            </div>
            {safeOccupation?.hasMilitaryService && (
              <>
                <div>
                  <label className={overlayStyles.displayMode.field.label}>Military Branch</label>
                  <p 
                    className={overlayStyles.displayMode.field.value}
                    style={overlayStyles.displayMode.field.getFieldStyle(!safeOccupation?.militaryBranch)}
                  >
                    {safeOccupation?.militaryBranch || '—'}
                  </p>
                </div>
                <div>
                  <label className={overlayStyles.displayMode.field.label}>Service Years</label>
                  <p 
                    className={overlayStyles.displayMode.field.value}
                    style={overlayStyles.displayMode.field.getFieldStyle(!safeOccupation?.servedFrom && !safeOccupation?.servedTo)}
                  >
                    {formatServiceYears(safeOccupation?.servedFrom, safeOccupation?.servedTo)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} className={`occupation-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
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
        <OccupationMobile
          occupation={safeOccupation}
          setOccupation={setOccupation}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveOccupation={saveOccupation}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          fieldConfig={fieldConfig}
          formatServiceYears={formatServiceYears}
          isJustRetired={isJustRetired}
          needsOccupationUpdate={needsOccupationUpdate}
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'occupation')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Occupation</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'occupation')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Your current occupation and military service history.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: Job Title, Military Service Status{safeOccupation?.hasMilitaryService && ' (Branch, Service Years)'}
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-1">
                            Recommended: Industry
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ occupation: occupationForWheel }}
                    fieldConfig={fieldConfig}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.occupation ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Career Card */}
                  <InfoCard 
                    title="Career Information" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    }
                    sectionKey="career"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('career')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('career')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Job Title" value={safeOccupation?.occupation || '—'} isRequired />
                    <InfoField label="Industry" value={safeOccupation?.occupationalIndustry || '—'} isRecommended />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCard>

                  {/* Military Service Card */}
                  <InfoCard 
                    title="Military Service" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                    }
                    sectionKey="military"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('military')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('military')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Military Service" value={safeOccupation?.hasMilitaryService ? 'Yes' : 'No'} isRequired />
                    {safeOccupation?.hasMilitaryService ? (
                      <>
                        <InfoField label="Branch" value={safeOccupation?.militaryBranch || '—'} isRequired />
                        <InfoField label="Service Years" value={formatServiceYears(safeOccupation?.servedFrom, safeOccupation?.servedTo)} isRequired />
                      </>
                    ) : (
                      <>
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                      </>
                    )}
                  </InfoCard>

                  {/* Empty third column for consistent layout */}
                  <div></div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  {renderEditForm(false)}
                </div>
              )}
              
              {/* Action buttons */}
              {editMode?.occupation ? (
                <div className={buttonStyles.actionContainer}>
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('occupation')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={saveOccupation}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'occupation'}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {needsOccupationUpdate() ? (
                    <div className="flex items-center justify-between mt-8 pt-6">
                      <ProfileImprovementNotice />
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('occupation')}
                        className={buttonStyles.whiteButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    </div>
                  ) : (
                    <div className={buttonStyles.actionContainer}>
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('occupation')}
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

export default OccupationSection;