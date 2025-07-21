import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import LegalMobile from './LegalMobile';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { HelpCircle } from 'lucide-react';
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

// Overlay Component
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  data, 
  legal,
  onSave,
  savingSection,
  memberCategory
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localLegal, setLocalLegal] = useState(legal);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in display mode
      setShowSuccess(false);
      // Reset local legal to match the current legal when opening
      setLocalLegal(legal);
    }
  }, [isOpen, legal]);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  if (!isOpen) return null;

  const isRequired = memberCategory === 'CryoApplicant' || memberCategory === 'CryoMember';

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    // Pass the local data back to parent via callback
    onSave(localLegal);
    setEditMode(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset local legal to original values
    setLocalLegal(legal);
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    return {
      title: 'Legal/Will Information',
      description: 'Information about your will and cryonics-related provisions. These fields help ensure your cryopreservation arrangements are legally valid.',
      fields: {
        'Do you have a will?': 'Whether you currently have a last will and testament.',
        'Contains contrary provisions?': 'Whether your will contains provisions that might conflict with cryopreservation (e.g., cremation, burial requirements).'
      }
    };
  };

  const fieldInfo = getFieldDescriptions();

  const hasWillYes = () => {
    const value = localLegal?.hasWill;
    return value === 'Yes' || value === true || value === 'true';
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
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
                <p className={overlayStyles.body.successMessage.text}>Legal information updated successfully!</p>
              </div>
            )}

            {/* Help Tooltip Button */}
            <div className="mb-6 flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                Have Questions About Wills?
              </p>
              <div className="relative" ref={tooltipRef}>
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowTooltip(!showTooltip)}
                >
                  <HelpCircle 
                    className="w-4 h-4 text-gray-400 hover:text-gray-600" 
                    strokeWidth={2}
                  />
                </button>
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-96">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Why Does Alcor Need This?
                        </h3>
                        <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTooltip(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="px-4 py-3 overflow-y-auto max-h-80">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <em className="font-semibold">these provisions may invalidate your Cryopreservation Agreement.</em>
                        </p>
                        <p className="text-sm text-gray-900 font-semibold">
                          If you have a will, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                        </p>
                        <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                          Both will-related fields are mandatory in the application process, and you must answer whether you have a will and whether it contains any provisions that might conflict with cryopreservation arrangements.
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                      <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fields */}
            {!editMode ? (
              /* Display Mode */
              <div className="space-y-6">
                <div>
                  <label className={overlayStyles.displayMode.field.label}>Do you have a will?</label>
                  <p 
                    className={overlayStyles.displayMode.field.value}
                    style={overlayStyles.displayMode.field.getFieldStyle(!localLegal?.hasWill)}
                  >
                    {localLegal?.hasWill || '—'}
                  </p>
                </div>
                {hasWillYes() && (
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Contains contrary provisions?</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!localLegal?.willContraryToCryonics)}
                    >
                      {localLegal?.willContraryToCryonics || '—'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                <Select
                  label="Do you have a will? *"
                  value={localLegal?.hasWill || ''}
                  onChange={(e) => setLocalLegal({...localLegal, hasWill: e.target.value})}
                  disabled={savingSection === 'legal'}
                  required={isRequired}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Select>
                
                {localLegal?.hasWill === 'Yes' && (
                  <>
                    <Select
                      label="Does your will contain any provisions contrary to cryonics? *"
                      value={localLegal?.willContraryToCryonics || ''}
                      onChange={(e) => setLocalLegal({...localLegal, willContraryToCryonics: e.target.value})}
                      disabled={savingSection === 'legal'}
                      required={isRequired}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Select>
                    
                    {localLegal?.willContraryToCryonics === 'Yes' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <strong>Action Required:</strong> You must update your will to remove any provisions contrary to cryonics.
                        </p>
                      </div>
                    )}
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
                  text={savingSection === 'legal' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'legal'}
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

const LegalSection = ({ 
  legal, 
  setLegal, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveLegal, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors,
  fieldConfig,
  getFieldError
}) => {
  // Add state for mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  // Add pendingSave flag for triggering save after state update
  const [pendingSave, setPendingSave] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

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
      saveLegal();
      setPendingSave(false);
    }
  }, [pendingSave, legal]);

  // Helper to check if will is "Yes"
  const hasWillYes = () => {
    const value = legal?.hasWill;
    return value === 'Yes' || value === true || value === 'true';
  };

  // Check if fields are required based on member category
  const isRequired = memberCategory === 'CryoApplicant' || memberCategory === 'CryoMember';

  // Field configuration for completion wheel
  const fieldConfigLocal = fieldConfig || {
    required: {
      hasWill: { 
        field: 'hasWill', 
        source: 'legal', 
        label: 'Do you have a will?',
        checkValue: (data) => data.legal?.hasWill && data.legal.hasWill !== ''
      },
      willContraryToCryonics: { 
        field: 'willContraryToCryonics', 
        source: 'legal', 
        label: 'Contains contrary provisions?',
        checkValue: (data) => {
          // Only check this field if hasWill is "Yes"
          if (data.legal?.hasWill !== 'Yes') return true; // Not applicable, so considered complete
          return data.legal?.willContraryToCryonics && data.legal.willContraryToCryonics !== '';
        }
      }
    },
    recommended: {}
  };

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = (updatedLegal) => {
    // Update parent state with the new data
    setLegal(updatedLegal);
    // Set flag to trigger save after state updates
    setPendingSave(true);
  };

  return (
    <div ref={sectionRef} className={`legal-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ legal }}
        legal={legal}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        memberCategory={memberCategory}
      />

      {isMobile ? (
        <LegalMobile
        legal={legal}
        setLegal={setLegal}
        editMode={editMode}
        toggleEditMode={toggleEditMode}
        cancelEdit={cancelEdit}
        saveLegal={saveLegal}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        fieldConfig={fieldConfigLocal}
        memberCategory={memberCategory}
        getFieldError={getFieldError}
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'legal')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Legal/Will Information</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'legal')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Information about your will and cryonics-related provisions.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: Will status and any contrary provisions if applicable
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ legal }}
                    fieldConfig={fieldConfigLocal}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Content - Fields Section */}
            <div className="bg-white">
              {/* Display Mode */}
              {!editMode.legal ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Legal Information Card */}
                    <InfoCard 
                      title="Will Information" 
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      }
                      sectionKey="legal"
                      hoveredSection={hoveredSection}
                      onMouseEnter={() => setHoveredSection('legal')}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => handleCardClick('legal')}
                      cardIndex={0}
                      isVisible={cardsVisible}
                    >
                      <InfoField label="Do you have a will?" value={legal?.hasWill || '—'} />
                      {hasWillYes() ? (
                        <InfoField label="Contains contrary provisions?" value={legal?.willContraryToCryonics || '—'} />
                      ) : (
                        <div className="opacity-0 pointer-events-none">
                          <InfoField label="" value="" />
                        </div>
                      )}
                      <div className="opacity-0 pointer-events-none">
                        <InfoField label="" value="" />
                      </div>
                    </InfoCard>

                    {/* Empty columns for consistent layout */}
                    <div></div>
                    <div></div>
                  </div>

                  
                  {/* "Have Questions About Wills?" section - Always visible at bottom */}
                  <div className="mt-16 flex items-center justify-between">
                    {/* Left side - Info Notice */}
                    <div className="flex items-center gap-4">
                      <svg className="w-10 h-10 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            Have Questions About Wills?
                          </p>
                          <div className="relative" ref={tooltipRef}>
                            <button
                              type="button"
                              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                              onClick={() => setShowTooltip(!showTooltip)}
                            >
                              <HelpCircle 
                                className="w-4 h-4 text-gray-400 hover:text-gray-600" 
                                strokeWidth={2}
                              />
                            </button>
                            {showTooltip && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-96">
                                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      Why Does Alcor Need This?
                                    </h3>
                                    <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                                    </svg>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setShowTooltip(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="px-4 py-3 overflow-y-auto max-h-80">
                                  <div className="space-y-3">
                                    <p className="text-sm text-gray-700">
                                      Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <em className="font-semibold">these provisions may invalidate your Cryopreservation Agreement.</em>
                                    </p>
                                    <p className="text-sm text-gray-900 font-semibold">
                                      If you have a will, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                                    </p>
                                    <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                                      Both will-related fields are mandatory in the application process, and you must answer whether you have a will and whether it contains any provisions that might conflict with cryopreservation arrangements.
                                    </p>
                                  </div>
                                </div>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                                  <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-light">
                          Learn about will requirements and cryonics provisions
                        </p>
                      </div>
                    </div>
                    
                    {/* Right side - Edit button */}
                    <div className="flex justify-end -mr-8">
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('legal')}
                        className={buttonStyles.whiteButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Edit Mode - Form */
                <div className="max-w-2xl">
                  <div className="mb-6">
                    <div className="space-y-4">
                      <Select
                        label="Do you have a will? *"
                        value={legal.hasWill || ''}
                        onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
                        disabled={!editMode.legal}
                        required={isRequired}
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Select>
                      
                      {legal.hasWill === 'Yes' && (
                        <>
                          <Select
                            label="Does your will contain any provisions contrary to cryonics? *"
                            value={legal.willContraryToCryonics || ''}
                            onChange={(e) => setLegal({...legal, willContraryToCryonics: e.target.value})}
                            disabled={!editMode.legal}
                            required={isRequired}
                          >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </Select>
                          
                          {/* Add helpful text for desktop users */}
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Important Information:</h4>
                            <p className="text-sm text-gray-700 mb-2">
                              Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <strong>these provisions may invalidate your Cryopreservation Agreement.</strong>
                            </p>
                            {legal.willContraryToCryonics === 'Yes' && (
                              <p className="text-sm text-red-700 font-medium mt-2 p-2 bg-red-50 rounded">
                                <strong>Action Required:</strong> If you have a will with contrary provisions, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* "Have Questions About Wills?" section - Only visible in edit mode at bottom */}
              {editMode?.legal && (
                <div className="mt-16 flex items-center justify-between">
                  {/* Left side - Info Notice */}
                  <div className="flex items-center gap-4">
                    <svg className="w-10 h-10 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          Have Questions About Wills?
                        </p>
                        <div className="relative" ref={tooltipRef}>
                          <button
                            type="button"
                            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={() => setShowTooltip(!showTooltip)}
                          >
                            <HelpCircle 
                              className="w-4 h-4 text-gray-400 hover:text-gray-600" 
                              strokeWidth={2}
                            />
                          </button>
                          {showTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-96">
                              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    Why Does Alcor Need This?
                                  </h3>
                                  <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                                  </svg>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowTooltip(false)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                              <div className="px-4 py-3 overflow-y-auto max-h-80">
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-700">
                                    Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <em className="font-semibold">these provisions may invalidate your Cryopreservation Agreement.</em>
                                  </p>
                                  <p className="text-sm text-gray-900 font-semibold">
                                    If you have a will, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                                  </p>
                                  <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                                    Both will-related fields are mandatory in the application process, and you must answer whether you have a will and whether it contains any provisions that might conflict with cryopreservation arrangements.
                                  </p>
                                </div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                                <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 font-light">
                        Learn about will requirements and cryonics provisions
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Action buttons */}
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('legal')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={saveLegal}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
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

export default LegalSection;