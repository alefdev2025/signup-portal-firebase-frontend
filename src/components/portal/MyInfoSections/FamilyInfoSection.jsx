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
import { HelpCircle } from 'lucide-react';

// Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, familyInfo, setFamilyInfo, personalInfo, saveFamilyInfo }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(true);  // Start in edit mode
      setShowSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveFamilyInfo();
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    setFamilyInfo(data.familyInfo);
    setEditMode(false);
    onClose();
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'father':
        return {
          title: 'Father Information',
          description: 'Information about your father including his full name and birthplace. This information is required for legal documentation.',
          fields: {
            'Father\'s Name': 'Your father\'s full legal name.',
            'Father\'s Birthplace': 'City, state/province, and country where your father was born.'
          }
        };
      case 'mother':
        return {
          title: 'Mother Information',
          description: 'Information about your mother including her full maiden name and birthplace. This information is required for legal documentation.',
          fields: {
            'Mother\'s Maiden Name': 'Your mother\'s full maiden name (birth name before marriage).',
            'Mother\'s Birthplace': 'City, state/province, and country where your mother was born.'
          }
        };
      case 'spouse':
        return {
          title: 'Spouse Information',
          description: 'Information about your spouse. This section is required if your marital status is "Married".',
          fields: {
            'Spouse\'s Name': 'Your spouse\'s full legal name or maiden name.'
          }
        };
      default:
        return { title: '', description: '', fields: {} };
    }
  };

  const fieldInfo = getFieldDescriptions();

  // Validation function
  const validateBirthplaceFormat = (birthplace) => {
    if (!birthplace) return false;
    const trimmed = birthplace.trim().toLowerCase();
    
    if (trimmed === 'unknown') return true;
    
    const commaCount = (birthplace.match(/,/g) || []).length;
    const parts = birthplace.split(/[,\s]+/).filter(part => part.length > 0);
    
    return commaCount >= 2 || parts.length >= 3;
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
              /* Display Mode */
              <div className={overlayStyles.body.content}>
                {section === 'father' && (
                  <div className={overlayStyles.displayMode.grid.twoColumn}>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Father's Full Name</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!familyInfo?.fathersName)}
                      >
                        {familyInfo?.fathersName || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Father's Birthplace</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!familyInfo?.fathersBirthplace)}
                      >
                        {familyInfo?.fathersBirthplace || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'mother' && (
                  <div className={overlayStyles.displayMode.grid.twoColumn}>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Mother's Full Maiden Name</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!familyInfo?.mothersMaidenName)}
                      >
                        {familyInfo?.mothersMaidenName || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Mother's Birthplace</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!familyInfo?.mothersBirthplace)}
                      >
                        {familyInfo?.mothersBirthplace || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'spouse' && (
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>
                      {personalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
                    </label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!familyInfo?.spousesName)}
                    >
                      {familyInfo?.spousesName || '—'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className={overlayStyles.body.content}>
                {section === 'father' && (
                  <div className={overlayStyles.editMode.grid.twoColumn}>
                    <div>
                      <Input
                        label="Father's Full Name *"
                        type="text"
                        value={familyInfo?.fathersName || ''}
                        onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
                        disabled={savingSection === 'family'}
                        error={fieldErrors.fathersName}
                      />
                    </div>
                    <div>
                      <Input
                        label="Father's Birthplace *"
                        type="text"
                        placeholder="City, State/Province, Country"
                        value={familyInfo?.fathersBirthplace || ''}
                        onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
                        disabled={savingSection === 'family'}
                        error={fieldErrors.fathersBirthplace}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter "Unknown" if not known
                      </p>
                    </div>
                  </div>
                )}

                {section === 'mother' && (
                  <div className={overlayStyles.editMode.grid.twoColumn}>
                    <div>
                      <Input
                        label="Mother's Full Maiden Name *"
                        type="text"
                        value={familyInfo?.mothersMaidenName || ''}
                        onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
                        disabled={savingSection === 'family'}
                        error={fieldErrors.mothersMaidenName}
                      />
                    </div>
                    <div>
                      <Input
                        label="Mother's Birthplace *"
                        type="text"
                        placeholder="City, State/Province, Country"
                        value={familyInfo?.mothersBirthplace || ''}
                        onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
                        disabled={savingSection === 'family'}
                        error={fieldErrors.mothersBirthplace}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter "Unknown" if not known
                      </p>
                    </div>
                  </div>
                )}

                {section === 'spouse' && (
                  <div>
                    <Input
                      label={`${personalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                      type="text"
                      value={familyInfo?.spousesName || ''}
                      onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
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
  sectionLabel
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [cardsVisible, setCardsVisible] = useState(false);

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

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear errors when canceling edit
  useEffect(() => {
    if (!editMode.family) {
      setFieldErrors({});
    }
  }, [editMode.family]);

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = () => {
    saveFamilyInfo();
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

  const needsBirthplaceUpdate = () => {
    const fatherBirthplace = familyInfo.fathersBirthplace || '';
    const motherBirthplace = familyInfo.mothersBirthplace || '';
    
    const fatherIncomplete = !fatherBirthplace || 
                           (!fatherBirthplace.includes(',') && fatherBirthplace.length < 10 && fatherBirthplace.toLowerCase() !== 'unknown');
    const motherIncomplete = !motherBirthplace || 
                           (!motherBirthplace.includes(',') && motherBirthplace.length < 10 && motherBirthplace.toLowerCase() !== 'unknown');
    
    return fatherIncomplete || motherIncomplete;
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
        data={{ familyInfo }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        familyInfo={familyInfo}
        setFamilyInfo={setFamilyInfo}
        personalInfo={personalInfo}
        saveFamilyInfo={saveFamilyInfo}
      />

      {isMobile ? (
        /* Mobile Version */
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Family Information"
          backgroundImage={formsHeaderImage}
          overlayText="Family Details"
          subtitle="Information about your immediate family members."
          isEditMode={editMode.family}
        >
          {/* Display Mode */}
          {!editMode.family ? (
            <>
              <div className={`space-y-4 ${hasLoaded && isVisible ? 'family-section-stagger-in' : ''}`}>
                <DisplayField 
                  label="Father's Full Name" 
                  value={familyInfo.fathersName} 
                />
                <DisplayField 
                  label="Father's Birthplace" 
                  value={familyInfo.fathersBirthplace} 
                />
                <DisplayField 
                  label="Mother's Full Maiden Name" 
                  value={familyInfo.mothersMaidenName} 
                />
                <DisplayField 
                  label="Mother's Birthplace" 
                  value={familyInfo.mothersBirthplace} 
                />
                {personalInfo.maritalStatus === 'Married' && (
                  <DisplayField 
                    label={personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
                    value={familyInfo.spousesName}
                  />
                )}
              </div>
              
              {needsBirthplaceUpdate() && (
                <div className="mt-4">
                  <ProfileImprovementNotice />
                </div>
              )}
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('family')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <FormInput
                  label="Father's Full Name *"
                  value={familyInfo.fathersName || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
                  error={fieldErrors.fathersName}
                />
                <FormInput
                  label="Father's Birthplace *"
                  placeholder="City, State/Province, Country (or 'Unknown')"
                  value={familyInfo.fathersBirthplace || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
                  error={fieldErrors.fathersBirthplace}
                />
                <FormInput
                  label="Mother's Full Maiden Name *"
                  value={familyInfo.mothersMaidenName || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
                  error={fieldErrors.mothersMaidenName}
                />
                <FormInput
                  label="Mother's Birthplace *"
                  placeholder="City, State/Province, Country (or 'Unknown')"
                  value={familyInfo.mothersBirthplace || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
                  error={fieldErrors.mothersBirthplace}
                />
                {personalInfo.maritalStatus === 'Married' && (
                  <FormInput
                    label={`${personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                    value={familyInfo.spousesName || ''}
                    onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
                    error={fieldErrors.spousesName}
                  />
                )}
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveFamilyInfo}
                onCancel={() => cancelEdit && cancelEdit('family')}
                saving={savingSection === 'family'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop Version */
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Header Section */}
            <div className={headerStyles.container}>
              <div className={headerStyles.contentWrapper}>
                <div className={headerStyles.leftContent}>
                  <div className={headerStyles.iconTextWrapper(styleConfig2)}>
                    <div className={headerStyles.getIconContainer(styleConfig2, 'family')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Family Information</h2>
                      <p className={headerStyles.subtitle}>
                        Information about your immediate family members.
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
                      <div 
                        className={sectionImageStyles.overlays.darkBase.className} 
                        style={sectionImageStyles.overlays.darkBase.style}
                      ></div>
                      <div 
                        className={sectionImageStyles.overlays.yellowGlow.className} 
                        style={sectionImageStyles.overlays.yellowGlow.style}
                      ></div>
                      <div 
                        className={sectionImageStyles.overlays.purpleGlow.className} 
                        style={sectionImageStyles.overlays.purpleGlow.style}
                      ></div>
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
              {!editMode.family ? (
                /* Display Mode with Cards */
                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                      <InfoField label="Full Name" value={familyInfo?.fathersName || '—'} />
                      <InfoField label="Birthplace" value={familyInfo?.fathersBirthplace || '—'} />
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
                      <InfoField label="Full Maiden Name" value={familyInfo?.mothersMaidenName || '—'} />
                      <InfoField label="Birthplace" value={familyInfo?.mothersBirthplace || '—'} />
                      <div className="opacity-0 pointer-events-none">
                        <InfoField label="" value="" />
                      </div>
                    </InfoCard>

                    {/* Spouse Card - Only show if married */}
                    {personalInfo.maritalStatus === 'Married' && (
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
                          label={personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} 
                          value={familyInfo?.spousesName || '—'} 
                        />
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                      </InfoCard>
                    )}
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Father's Full Name *"
                      type="text"
                      value={familyInfo.fathersName || ''}
                      onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.fathersName}
                    />
                    <Input
                      label="Father's Birthplace *"
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={familyInfo.fathersBirthplace || ''}
                      onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.fathersBirthplace}
                    />
                    <Input
                      label="Mother's Full Maiden Name *"
                      type="text"
                      value={familyInfo.mothersMaidenName || ''}
                      onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.mothersMaidenName}
                    />
                    <Input
                      label="Mother's Birthplace *"
                      type="text"
                      placeholder="City, State/Province, Country"
                      value={familyInfo.mothersBirthplace || ''}
                      onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
                      disabled={savingSection === 'family'}
                      error={fieldErrors.mothersBirthplace}
                    />
                    {personalInfo.maritalStatus === 'Married' && (
                      <div className="col-span-2">
                        <Input
                          label={`${personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                          type="text"
                          value={familyInfo.spousesName || ''}
                          onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
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
                      onClick={saveFamilyInfo}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {needsBirthplaceUpdate() ? (
                    <div className="flex items-center justify-between mt-8 pt-6">
                      {/* Profile Improvement Notice - Left side */}
                      <ProfileImprovementNotice />
                      
                      {/* Edit button - Right side */}
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