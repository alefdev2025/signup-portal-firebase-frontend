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
  // Local state for editing - completely separate from parent
  const [localOccupation, setLocalOccupation] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in view mode
      setShowSuccess(false);
      // Reset local state to current data when opening - create copy not reference
      setLocalOccupation({...data.occupation} || {});
    }
  }, [isOpen, data.occupation]);

  if (!isOpen) return null;

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    // Pass the local data back to parent via callback
    onSave(localOccupation);
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset to original data - create new copy
    setLocalOccupation({...data.occupation} || {});
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    switch (section) {
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

  const fieldInfo = getFieldDescriptions();

  // Format military service years for display
  const formatServiceYears = (from, to) => {
    if (!from && !to) return '—';
    if (from && to) return `${from} - ${to}`;
    if (from && !to) return `${from} - Present`;
    return '—';
  };

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
                {section === 'career' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Job Title</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localOccupation?.occupation)}
                      >
                        {localOccupation?.occupation || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Industry</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localOccupation?.occupationalIndustry)}
                      >
                        {localOccupation?.occupationalIndustry || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'military' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Military Service</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!localOccupation?.hasMilitaryService)}
                      >
                        {localOccupation?.hasMilitaryService ? 'Yes' : 'No'}
                      </p>
                    </div>
                    {localOccupation?.hasMilitaryService && (
                      <>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Military Branch</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!localOccupation?.militaryBranch)}
                          >
                            {localOccupation?.militaryBranch || '—'}
                          </p>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Service Years</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!localOccupation?.servedFrom && !localOccupation?.servedTo)}
                          >
                            {formatServiceYears(localOccupation?.servedFrom, localOccupation?.servedTo)}
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
                {section === 'career' && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        label="Job Title"
                        type="text"
                        value={localOccupation?.occupation || ''}
                        onChange={(e) => setLocalOccupation({...localOccupation, occupation: e.target.value})}
                        disabled={savingSection === 'occupation'}
                        error={fieldErrors.occupation}
                      />
                      {!localOccupation?.occupation && (
                        <p className="text-gray-500 text-sm mt-1 font-light">
                          "Homemaker" is an option if you did not have employment
                        </p>
                      )}
                    </div>
                    <Select
                      label="Industry"
                      value={localOccupation?.occupationalIndustry || ''}
                      onChange={(e) => setLocalOccupation({...localOccupation, occupationalIndustry: e.target.value})}
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
                  </div>
                )}

                {section === 'military' && (
                  <div className="space-y-4">
                    <Checkbox
                      label="Have you served in the US Military?"
                      checked={!!localOccupation?.hasMilitaryService}
                      onChange={(e) => setLocalOccupation({...localOccupation, hasMilitaryService: e.target.checked})}
                      disabled={savingSection === 'occupation'}
                    />
                    {localOccupation?.hasMilitaryService && (
                      <>
                        <Select
                          label="Military Branch *"
                          value={localOccupation?.militaryBranch || ''}
                          onChange={(e) => setLocalOccupation({...localOccupation, militaryBranch: e.target.value})}
                          disabled={savingSection === 'occupation'}
                          error={fieldErrors.militaryBranch}
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
                            value={localOccupation?.servedFrom || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d{0,4}$/.test(value)) {
                                setLocalOccupation({...localOccupation, servedFrom: value});
                              }
                            }}
                            placeholder="YYYY"
                            maxLength="4"
                            pattern="\d{4}"
                            disabled={savingSection === 'occupation'}
                            error={fieldErrors.servedFrom}
                          />
                          <Input
                            label="Service End Year *"
                            type="text"
                            value={localOccupation?.servedTo || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || /^\d{0,4}$/.test(value)) {
                                setLocalOccupation({...localOccupation, servedTo: value});
                              }
                            }}
                            placeholder="YYYY"
                            maxLength="4"
                            pattern="\d{4}"
                            disabled={savingSection === 'occupation'}
                            error={fieldErrors.servedTo}
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
                  text={savingSection === 'occupation' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'occupation'}
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
  // Add pendingSave flag for triggering save after state update
  const [pendingSave, setPendingSave] = useState(false);

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
      saveOccupation();
      setPendingSave(false);
    }
  }, [pendingSave, occupation]);

  // Create a modified occupation object that has a string representation of military service status
  const occupationForWheel = {
    ...safeOccupation,
    militaryServiceAnswered: safeOccupation?.hasMilitaryService !== undefined && safeOccupation?.hasMilitaryService !== null ? 'answered' : ''
  };

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      occupation: { field: 'occupation', source: 'occupation', label: 'Job Title' },
      militaryServiceAnswered: { field: 'militaryServiceAnswered', source: 'occupation', label: 'Military Service Status' },
      militaryBranch: { 
        field: 'militaryBranch', 
        source: 'occupation', 
        label: 'Military Branch',
        condition: (data) => data.occupation?.hasMilitaryService === true
      },
      servedFrom: { 
        field: 'servedFrom', 
        source: 'occupation', 
        label: 'Service Start Year',
        condition: (data) => data.occupation?.hasMilitaryService === true
      },
      servedTo: { 
        field: 'servedTo', 
        source: 'occupation', 
        label: 'Service End Year',
        condition: (data) => data.occupation?.hasMilitaryService === true
      }
    },
    recommended: {
      occupationalIndustry: { field: 'occupationalIndustry', source: 'occupation', label: 'Industry' }
    }
  };

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = (updatedOccupation) => {
    // Update parent state with the new data
    setOccupation(updatedOccupation);
    // Set flag to trigger save after state updates
    setPendingSave(true);
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

  return (
    <div ref={sectionRef} className={`occupation-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ occupation: safeOccupation }}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
      />

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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Job Title"
                        type="text"
                        value={safeOccupation.occupation || ''}
                        onChange={(e) => setOccupation({...safeOccupation, occupation: e.target.value})}
                        disabled={savingSection === 'occupation'}
                        error={fieldErrors.occupation}
                      />
                      {!safeOccupation.occupation && (
                        <p className="text-gray-500 text-sm mt-1 font-light">
                          "Homemaker" is an option if you did not have employment
                        </p>
                      )}
                      {fieldErrors.occupation && (
                        <p className="text-red-600 text-sm mt-1 font-light">
                          {fieldErrors.occupation}
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
                          error={fieldErrors.militaryBranch}
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
                          error={fieldErrors.servedFrom}
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
                          error={fieldErrors.servedTo}
                        />
                      </>
                    )}
                  </div>
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