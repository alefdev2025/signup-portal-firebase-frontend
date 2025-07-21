import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import CryoArrangementsMobile from './CryoArrangementsMobile';
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
import { isSectionEditable } from '../memberCategoryConfig';
import { cleanAddressData, cleanAddressObject, formatEmail, formatPhone, formatStreetAddress, formatCity, formatStateProvince, formatPostalCode, formatCountry } from '../utils/dataFormatting';

// Melissa API configuration
const MELISSA_API_KEY = 'AVUaS6bp3WJyyFKHjjwqgj**nSAcwXpxhQ0PC2lXxuDAZ-**';
const MELISSA_API_URL = 'https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress';

// DEBUG CONFIGURATION - Change these values to test different user states
const OVERRIDE_MEMBER_CATEGORY = true;  // Set to true to use debug category, false to use actual
const DEBUG_CATEGORY = 'CryoApplicant'; // Options: 'CryoApplicant', 'CryoMember', 'AssociateMember'

// Helper function to get effective member category
const getEffectiveMemberCategory = (actualCategory) => {
  if (OVERRIDE_MEMBER_CATEGORY) {
    console.log(`🔧 DEBUG: Override active - Using ${DEBUG_CATEGORY} instead of ${actualCategory}`);
    return DEBUG_CATEGORY;
  }
  return actualCategory;
};

// Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, cryoArrangements, setCryoArrangements, saveCryoArrangements, validatingAddress, validationError, handleSaveWithValidation, handleSaveAnyway, canEdit, memberCategory }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(canEdit);  // Only start in edit mode if user can edit
      setShowSuccess(false);
    }
  }, [isOpen, canEdit]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (canEdit) {
      handleSaveWithValidation();
    }
  };

  const handleCancel = () => {
    setCryoArrangements(data.cryoArrangements);
    setEditMode(false);
    onClose();
  };

  const formatMethod = (method) => {
    if (!method) return '—';
    if (method === 'WholeBody') return 'Whole Body Cryopreservation ($220,000 US / $230,000 International)';
    if (method === 'Neuro') return 'Neurocryopreservation ($80,000 US / $90,000 International)';
    return method;
  };

  const formatCryoDisclosure = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'Alcor is authorized to freely release Cryopreservation Member information at its discretion';
    if (disclosure === 'confidential') return 'Alcor will make reasonable efforts to maintain confidentiality of Cryopreservation Member information';
    return disclosure;
  };

  const formatMemberDisclosure = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'I give Alcor permission to freely release my name and related Alcor membership status at its discretion';
    if (disclosure === 'confidential') return 'Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor\'s General Terms and Conditions';
    return disclosure;
  };

  const formatRemainsHandling = (handling) => {
    if (!handling) return '—';
    if (handling === 'return') return 'Return to designated recipient';
    if (handling === 'donate') return 'Donate to medical research or dispose at Alcor\'s discretion';
    return handling;
  };

  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return '—';
    return parts.join(', ');
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'method':
        return {
          title: 'Cryopreservation Method',
          description: 'Your chosen method of cryopreservation and associated funding requirements. These selections affect your funding minimums and cannot be changed through this portal.',
          fields: {
            'Method': 'Whole Body or Neurocryopreservation',
            'CMS Waiver': 'Comprehensive Member Standby waiver option'
          }
        };
      case 'remains':
        return {
          title: 'Remains Handling',
          description: 'Instructions for handling of non-cryopreserved remains. If returning to a recipient, please provide complete contact information.',
          fields: {
            'Handling': 'Return to recipient or donate to medical research',
            'Recipient': 'Contact person for remains return'
          }
        };
      case 'disclosure':
        return {
          title: 'Privacy & Disclosure',
          description: 'Your preferences for how Alcor handles your personal information and membership status. These settings control public disclosure of your cryopreservation arrangements.',
          fields: {
            'Information': 'Cryopreservation information disclosure preference',
            'Name': 'Member name and status disclosure preference'
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
                    {section === 'method' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    )}
                    {section === 'remains' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.5l-11.224 4.52a1 1 0 01-1.553-.894V7.874a1 1 0 011.553-.894L21 11.5v-3zm0 7v-3l-11.224 4.52a1 1 0 01-1.553-.894v-4.252a1 1 0 011.553-.894L21 15.5z" />
                    )}
                    {section === 'disclosure' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
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

          {/* Success Message */}
          {showSuccess && (
            <div className={overlayStyles.body.successMessage.container}>
              <svg className={overlayStyles.body.successMessage.icon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className={overlayStyles.body.successMessage.text}>Information updated successfully!</p>
            </div>
          )}

          {/* Content */}
          <div className={overlayStyles.body.wrapper}>
            {/* Fields */}
            {!editMode || !canEdit ? (
              /* Display Mode */
              <div className={overlayStyles.body.content}>
                {section === 'method' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Method of Cryopreservation</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.method)}
                      >
                        {formatMethod(cryoArrangements?.method)}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>CMS Fee Waiver</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(cryoArrangements?.cmsWaiver === undefined)}
                      >
                        {cryoArrangements?.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No'}
                      </p>
                    </div>
                    {!canEdit && (
                      <div className={overlayStyles.displayMode.field.note}>
                        <p className="text-sm text-gray-500 italic">
                          Contact Alcor staff to make changes to these selections
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {section === 'remains' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Non-Cryopreserved Remains Handling</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.remainsHandling)}
                      >
                        {formatRemainsHandling(cryoArrangements?.remainsHandling)}
                      </p>
                    </div>
                    {cryoArrangements?.remainsHandling === 'return' && (
                      <>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Recipient Name</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.recipientName)}
                          >
                            {cryoArrangements?.recipientName || '—'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Recipient Phone</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.recipientPhone)}
                            >
                              {cryoArrangements?.recipientPhone || '—'}
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Recipient Email</label>
                            <p 
                              className={overlayStyles.displayMode.field.value}
                              style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.recipientEmail)}
                            >
                              {cryoArrangements?.recipientEmail || '—'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Recipient Mailing Address</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.recipientMailingStreet)}
                          >
                            {formatAddress(
                              cryoArrangements?.recipientMailingStreet,
                              cryoArrangements?.recipientMailingCity,
                              cryoArrangements?.recipientMailingState,
                              cryoArrangements?.recipientMailingPostalCode,
                              cryoArrangements?.recipientMailingCountry
                            )}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {section === 'disclosure' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Cryopreservation Information Disclosure</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.cryopreservationDisclosure)}
                      >
                        {formatCryoDisclosure(cryoArrangements?.cryopreservationDisclosure)}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Member Name Disclosure</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!cryoArrangements?.memberPublicDisclosure)}
                      >
                        {formatMemberDisclosure(cryoArrangements?.memberPublicDisclosure)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode - Only for editable sections */
              <div className={overlayStyles.body.content}>
                {section === 'method' && (
                  <div className="space-y-4">
                    <Select
                      label="Method of Cryopreservation"
                      value={cryoArrangements?.method || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, method: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="WholeBody">Whole Body Cryopreservation ($220,000 US / $230,000 International)</option>
                      <option value="Neuro">Neurocryopreservation ($80,000 US / $90,000 International)</option>
                    </Select>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        CMS Fee Waiver
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={cryoArrangements?.cmsWaiver || false}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, cmsWaiver: e.target.checked})}
                          disabled={savingSection === 'cryoArrangements'}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Yes - I want to waive the $200 annual CMS fee by providing $20,000 additional funding
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {section === 'remains' && (
                  <div className="space-y-4">
                    <Select
                      label="Non-Cryopreserved Remains Handling"
                      value={cryoArrangements?.remainsHandling || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="return">Return to designated recipient</option>
                      <option value="donate">Donate to medical research or dispose at Alcor's discretion</option>
                    </Select>

                    {cryoArrangements?.remainsHandling === 'return' && (
                      <>
                        <Input
                          label="Recipient Name"
                          type="text"
                          value={cryoArrangements?.recipientName || ''}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientName: e.target.value})}
                          disabled={savingSection === 'cryoArrangements'}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Recipient Phone"
                            type="tel"
                            value={cryoArrangements?.recipientPhone || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                          <Input
                            label="Recipient Email"
                            type="email"
                            value={cryoArrangements?.recipientEmail || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-700 mt-4">Recipient Mailing Address</h4>
                        <Input
                          label="Street Address"
                          value={cryoArrangements?.recipientMailingStreet || ''}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingStreet: e.target.value})}
                          disabled={savingSection === 'cryoArrangements'}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="City"
                            value={cryoArrangements?.recipientMailingCity || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCity: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                          <Input
                            label="State/Province"
                            value={cryoArrangements?.recipientMailingState || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingState: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Zip/Postal Code"
                            value={cryoArrangements?.recipientMailingPostalCode || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingPostalCode: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                          <Input
                            label="Country"
                            value={cryoArrangements?.recipientMailingCountry || 'US'}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCountry: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                        </div>
                        {validationError && (
                          <p className="mt-2 text-sm text-red-600">{validationError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {section === 'disclosure' && (
                  <div className="space-y-4">
                    <Select
                      label="Cryopreservation Information Disclosure"
                      value={cryoArrangements?.cryopreservationDisclosure || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, cryopreservationDisclosure: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="freely">Alcor is authorized to freely release Cryopreservation Member information</option>
                      <option value="confidential">Alcor will make reasonable efforts to maintain confidentiality</option>
                    </Select>

                    <Select
                      label="Member Name Disclosure"
                      value={cryoArrangements?.memberPublicDisclosure || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, memberPublicDisclosure: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="freely">I give Alcor permission to freely release my name</option>
                      <option value="confidential">Alcor is to make reasonable efforts to maintain confidentiality</option>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={overlayStyles.footer.wrapper}>
            {canEdit && editMode ? (
              <>
                <WhiteButton
                  text="Cancel"
                  onClick={handleCancel}
                  className={buttonStyles.overlayButtons.cancel}
                  spinStar={buttonStyles.starConfig.enabled}
                />
                {validationError && (
                  <WhiteButton
                    text="Save Anyway"
                    onClick={handleSaveAnyway}
                    className={`${buttonStyles.overlayButtons.cancel} ml-2`}
                    spinStar={buttonStyles.starConfig.enabled}
                  />
                )}
                <PurpleButton
                  text={validatingAddress ? 'Validating...' : savingSection === 'cryoArrangements' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'cryoArrangements' || validatingAddress}
                />
              </>
            ) : (
              <PurpleButton
                text="Close"
                onClick={onClose}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const CryoArrangementsSection = ({ 
  cryoArrangements = {}, 
  setCryoArrangements, 
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveCryoArrangements, 
  savingSection,
  memberCategory,
  setAddressValidationModal,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  
  // Get effective member category for debugging
  const effectiveMemberCategory = getEffectiveMemberCategory(memberCategory);
  
  // Check if section should be editable based on member category
  const canEdit = isSectionEditable(effectiveMemberCategory, 'cryoArrangements');

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      method: { field: 'method', source: 'cryoArrangements', label: 'Cryopreservation Method' },
      cmsWaiver: { 
        field: 'cmsWaiver', 
        source: 'cryoArrangements', 
        label: 'CMS Waiver Decision',
        checkValue: ({ cryoArrangements }) => cryoArrangements?.cmsWaiver !== undefined
      },
      remainsHandling: { field: 'remainsHandling', source: 'cryoArrangements', label: 'Remains Handling' },
      cryopreservationDisclosure: { field: 'cryopreservationDisclosure', source: 'cryoArrangements', label: 'Information Disclosure' },
      memberPublicDisclosure: { field: 'memberPublicDisclosure', source: 'cryoArrangements', label: 'Member Name Disclosure' }
    },
    recommended: {}
  };

  // Add conditional required fields for recipient information
  if (cryoArrangements?.remainsHandling === 'return') {
    fieldConfig.required.recipientName = { field: 'recipientName', source: 'cryoArrangements', label: 'Recipient Name' };
    fieldConfig.required.recipientPhone = { field: 'recipientPhone', source: 'cryoArrangements', label: 'Recipient Phone' };
    fieldConfig.required.recipientEmail = { field: 'recipientEmail', source: 'cryoArrangements', label: 'Recipient Email' };
    fieldConfig.required.recipientMailingStreet = { field: 'recipientMailingStreet', source: 'cryoArrangements', label: 'Recipient Street' };
    fieldConfig.required.recipientMailingCity = { field: 'recipientMailingCity', source: 'cryoArrangements', label: 'Recipient City' };
  }

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
  
  // Clear validation error when edit mode changes
  useEffect(() => {
    if (!editMode.cryoArrangements) {
      setValidationError('');
    }
  }, [editMode.cryoArrangements]);

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = () => {
    handleSaveWithValidation();
  };
  
  // Format method display
  const formatMethod = (method) => {
    if (!method) return '—';
    if (method === 'WholeBody') return 'Whole Body Cryopreservation ($220,000 US / $230,000 International)';
    if (method === 'Neuro') return 'Neurocryopreservation ($80,000 US / $90,000 International)';
    return method;
  };

  // Format method short for mobile preview and cards
  const formatMethodShort = (method) => {
    if (!method) return '—';
    if (method === 'WholeBody') return 'Whole Body';
    if (method === 'Neuro') return 'Neuro';
    return method;
  };

  // Format cryopreservation disclosure display (information disclosure)
  const formatCryoDisclosure = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'Alcor is authorized to freely release Cryopreservation Member information at its discretion';
    if (disclosure === 'confidential') return 'Alcor will make reasonable efforts to maintain confidentiality of Cryopreservation Member information';
    return disclosure;
  };

  // Format cryopreservation disclosure short
  const formatCryoDisclosureShort = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'Freely release';
    if (disclosure === 'confidential') return 'Confidential';
    return disclosure;
  };

  // Format member public disclosure display (name disclosure)
  const formatMemberDisclosure = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'I give Alcor permission to freely release my name and related Alcor membership status at its discretion';
    if (disclosure === 'confidential') return 'Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor\'s General Terms and Conditions';
    return disclosure;
  };

  // Format member disclosure short
  const formatMemberDisclosureShort = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'Public';
    if (disclosure === 'confidential') return 'Confidential';
    return disclosure;
  };

  // Format remains handling display
  const formatRemainsHandling = (handling) => {
    if (!handling) return '—';
    if (handling === 'return') return 'Return to designated recipient';
    if (handling === 'donate') return 'Donate to medical research or dispose at Alcor\'s discretion';
    return handling;
  };

  // Format remains handling short
  const formatRemainsHandlingShort = (handling) => {
    if (!handling) return '—';
    if (handling === 'return') return 'Return to recipient';
    if (handling === 'donate') return 'Donate/Dispose';
    return handling;
  };
  
  // Format address for display
  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return '';
    return parts.join(', ');
  };

  // Validate address with Melissa API
  const validateAddressWithMelissa = async (address) => {
    console.log('🔵 === START validateAddressWithMelissa (Recipient) ===');
    console.log('📋 Address to validate:', address);
    
    try {
      const params = new URLSearchParams({
        id: MELISSA_API_KEY,
        a1: address.street || '',
        a2: '',
        loc: address.city || '',
        admarea: address.state || '',
        postal: address.postalCode || '',
        ctry: address.country || 'US',
        format: 'json'
      });

      const fullUrl = `${MELISSA_API_URL}?${params}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = await response.json();
      console.log('📦 Melissa API Response:', JSON.stringify(data, null, 2));

      // Check for transmission errors
      if (data.TransmissionResults && data.TransmissionResults !== '' && data.TransmissionResults !== 'GE00') {
        console.log('❌ API Error detected');
        return {
          success: false,
          error: 'Address validation service error. Please try again.'
        };
      }

      if (data.Version && data.Records && data.Records.length > 0) {
        const record = data.Records[0];
        const addressVerificationCode = record.Results || '';
        
        // Deliverable codes
        const deliverableCodes = ['AV25', 'AV24', 'AV23', 'AV22', 'AV21'];
        const isDeliverable = deliverableCodes.some(code => addressVerificationCode.includes(code));
        
        if (isDeliverable) {
          const validatedAddress = {
            street: record.AddressLine1 || '',
            city: record.Locality || '',
            state: record.AdministrativeArea || '',
            postalCode: record.PostalCode || '',
            country: record.CountryISO3166_1_Alpha2 || 'US'
          };

          // Check if different
          const isDifferent = 
            validatedAddress.street.toLowerCase() !== (address.street || '').toLowerCase() ||
            validatedAddress.city.toLowerCase() !== (address.city || '').toLowerCase() ||
            validatedAddress.state.toLowerCase() !== (address.state || '').toLowerCase() ||
            validatedAddress.postalCode !== (address.postalCode || '');

          console.log('✅ Valid address, different:', isDifferent);
          console.log('🔵 === END validateAddressWithMelissa ===\n');

          return {
            success: true,
            isValid: true,
            isDifferent,
            suggestedAddress: validatedAddress,
            originalAddress: address
          };
        }
      }
      
      console.log('❌ Address not deliverable');
      return {
        success: true,
        isValid: false,
        error: 'This address could not be verified. Please double-check it\'s correct.'
      };
      
    } catch (error) {
      console.error('❌ Melissa API error:', error);
      return {
        success: false,
        error: 'Address validation service is temporarily unavailable.'
      };
    }
  };

  const handleSaveWithValidation = async () => {
    console.log('🟢 === START handleSaveWithValidation ===');
    
    // Prevent double-clicks
    if (validatingAddress || savingSection === 'cryoArrangements') {
      console.log('⚠️ Already processing, ignoring click');
      return;
    }
    
    // Call save and wait for the result
    const success = await saveCryoArrangements();
     
    // Close overlay only on successful save
    if (success) {
      setOverlayOpen(false);
    }
    
    console.log('🟢 === END handleSaveWithValidation ===');
  };

  // Handle save anyway (skip validation)
  const handleSaveAnyway = () => {
    console.log('🟡 Save Anyway clicked');
    setValidationError('');
    saveCryoArrangements();
  };

  return (
    <div ref={sectionRef} className={`cryo-arrangements-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ cryoArrangements }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        cryoArrangements={cryoArrangements}
        setCryoArrangements={setCryoArrangements}
        saveCryoArrangements={saveCryoArrangements}
        validatingAddress={validatingAddress}
        validationError={validationError}
        handleSaveWithValidation={handleSaveWithValidation}
        handleSaveAnyway={handleSaveAnyway}
        canEdit={canEdit}
        memberCategory={effectiveMemberCategory}
      />

      {isMobile ? (
        <CryoArrangementsMobile
          cryoArrangements={cryoArrangements}
          setCryoArrangements={setCryoArrangements}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveCryoArrangements={saveCryoArrangements}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          validationError={validationError}
          handleSaveWithValidation={handleSaveWithValidation}
          handleSaveAnyway={handleSaveAnyway}
          canEdit={canEdit}
          memberCategory={effectiveMemberCategory}
          validatingAddress={validatingAddress}
          fieldConfig={fieldConfig}
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'cryo')} style={{ backgroundColor: '#734477' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Cryopreservation Arrangements</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'cryo')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Your cryopreservation method and handling preferences.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Configure your preservation method, remains handling, and disclosure preferences
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ cryoArrangements }}
                    fieldConfig={fieldConfig}
                    sectionColor="#734477"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.cryoArrangements ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Cryopreservation Method Card */}
                  <InfoCard
                    title="Cryopreservation Method"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    }
                    sectionKey="method"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('method')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('method')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Method" value={formatMethodShort(cryoArrangements?.method)} isRequired />
                    <InfoField label="CMS Waiver" value={cryoArrangements?.cmsWaiver ? 'Yes' : 'No'} isRequired />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCard>

                  {/* Remains Handling Card */}
                  <InfoCard
                    title="Remains Handling"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.5l-11.224 4.52a1 1 0 01-1.553-.894V7.874a1 1 0 011.553-.894L21 11.5v-3zm0 7v-3l-11.224 4.52a1 1 0 01-1.553-.894v-4.252a1 1 0 011.553-.894L21 15.5z" />
                      </svg>
                    }
                    sectionKey="remains"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('remains')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('remains')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Handling" value={formatRemainsHandlingShort(cryoArrangements?.remainsHandling)} isRequired />
                    {cryoArrangements?.remainsHandling === 'return' && (
                      <>
                        <InfoField label="Recipient" value={cryoArrangements?.recipientName || '—'} isRequired />
                        <InfoField label="Contact" value={cryoArrangements?.recipientPhone || cryoArrangements?.recipientEmail || '—'} isRequired />
                      </>
                    )}
                    {cryoArrangements?.remainsHandling !== 'return' && (
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

                  {/* Privacy & Disclosure Card */}
                  <InfoCard
                    title="Privacy & Disclosure"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    }
                    sectionKey="disclosure"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('disclosure')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('disclosure')}
                    cardIndex={2}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Information" value={formatCryoDisclosureShort(cryoArrangements?.cryopreservationDisclosure)} isRequired />
                    <InfoField label="Name" value={formatMemberDisclosureShort(cryoArrangements?.memberPublicDisclosure)} isRequired />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCard>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  <div className="space-y-6">
                    {/* Method - Editable */}
                    <Select
                      label="Method of Cryopreservation *"
                      value={cryoArrangements.method || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, method: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="WholeBody">Whole Body Cryopreservation ($220,000 US / $230,000 International)</option>
                      <option value="Neuro">Neurocryopreservation ($80,000 US / $90,000 International)</option>
                    </Select>

                    {/* CMS Waiver - Editable */}
                    <div className="space-y-2">
                      <label className={styleConfig2.form.label}>
                        CMS Fee Waiver *
                      </label>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={cryoArrangements.cmsWaiver || false}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, cmsWaiver: e.target.checked})}
                          disabled={savingSection === 'cryoArrangements'}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Yes - I want to waive the $200 annual CMS fee by providing $20,000 additional funding
                        </span>
                      </label>
                    </div>

                    <Select
                      label="Non-Cryopreserved Remains Handling *"
                      value={cryoArrangements.remainsHandling || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="return">Return to designated recipient</option>
                      <option value="donate">Donate to medical research or dispose at Alcor's discretion</option>
                    </Select>

                    {cryoArrangements.remainsHandling === 'return' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Recipient Name *"
                            type="text"
                            value={cryoArrangements.recipientName || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientName: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                          <Input
                            label="Recipient Phone *"
                            type="tel"
                            value={cryoArrangements.recipientPhone || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                          <Input
                            containerClassName="col-span-2"
                            label="Recipient Email *"
                            type="email"
                            value={cryoArrangements.recipientEmail || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                            disabled={savingSection === 'cryoArrangements'}
                          />
                        </div>
                        
                        {/* Recipient Mailing Address */}
                        <div>
                          <h3 className="font-medium text-[#2a2346] mb-4">Recipient Mailing Address</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              containerClassName="col-span-2"
                              label="Street Address *"
                              type="text"
                              value={cryoArrangements.recipientMailingStreet || ''}
                              onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingStreet: e.target.value})}
                              disabled={savingSection === 'cryoArrangements'}
                            />
                            <Input
                              label="City *"
                              type="text"
                              value={cryoArrangements.recipientMailingCity || ''}
                              onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCity: e.target.value})}
                              disabled={savingSection === 'cryoArrangements'}
                            />
                            <Input
                              label="State/Province"
                              type="text"
                              value={cryoArrangements.recipientMailingState || ''}
                              onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingState: e.target.value})}
                              disabled={savingSection === 'cryoArrangements'}
                            />
                            <Input
                              label="Zip/Postal Code"
                              type="text"
                              value={cryoArrangements.recipientMailingPostalCode || ''}
                              onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingPostalCode: e.target.value})}
                              disabled={savingSection === 'cryoArrangements'}
                            />
                            <Input
                              label="Country"
                              type="text"
                              value={cryoArrangements.recipientMailingCountry || 'US'}
                              onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCountry: e.target.value})}
                              disabled={savingSection === 'cryoArrangements'}
                            />
                          </div>
                          {validationError && (
                            <p className="mt-2 text-sm text-red-600">{validationError}</p>
                          )}
                        </div>
                      </>
                    )}

                    <Select
                      label="Cryopreservation Information Disclosure *"
                      value={cryoArrangements.cryopreservationDisclosure || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, cryopreservationDisclosure: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="freely">Alcor is authorized to freely release Cryopreservation Member information</option>
                      <option value="confidential">Alcor will make reasonable efforts to maintain confidentiality</option>
                    </Select>

                    <Select
                      label="Member Name Disclosure *"
                      value={cryoArrangements.memberPublicDisclosure || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, memberPublicDisclosure: e.target.value})}
                      disabled={savingSection === 'cryoArrangements'}
                    >
                      <option value="">Select...</option>
                      <option value="freely">I give Alcor permission to freely release my name</option>
                      <option value="confidential">Alcor is to make reasonable efforts to maintain confidentiality</option>
                    </Select>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
            {editMode?.cryoArrangements ? (
              <div className={buttonStyles.actionContainer}>
                <div className={buttonStyles.buttonGroup}>
                  <WhiteButton
                    text="Cancel"
                    onClick={() => cancelEdit && cancelEdit('cryoArrangements')}
                    className={buttonStyles.whiteButton.withMargin}
                    spinStar={buttonStyles.starConfig.enabled}
                  />
                  {/* COMMENT OUT THIS SAVE ANYWAY BUTTON
                  {validationError && (
                    <WhiteButton
                      text="Save Anyway"
                      onClick={handleSaveAnyway}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                  )}
                  */}
                  <PurpleButton
                    text={savingSection === 'cryoArrangements' ? 'Saving...' : 'Save'}
                    onClick={handleSaveWithValidation}
                    className={buttonStyles.purpleButton.base}
                    spinStar={buttonStyles.starConfig.enabled}
                    disabled={savingSection === 'cryoArrangements'}
                  />
                </div>
              </div>
              ) : (
                <>
                  {!canEdit ? (
                    <div className="text-sm text-gray-500 italic mt-12 pt-6 text-right">
                      Contact Alcor to update arrangements
                    </div>
                  ) : (
                    <div className={buttonStyles.actionContainer}>
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('cryoArrangements')}
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

export default CryoArrangementsSection;