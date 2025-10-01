import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import CryoArrangementsMobile from './CryoArrangementsMobile';
import formsHeaderImage from '../../../assets/images/forms-image.png';
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
const OVERRIDE_MEMBER_CATEGORY = false;  // Set to true to use debug category, false to use actual
const DEBUG_CATEGORY = 'CryoApplicant'; // Options: 'CryoApplicant', 'CryoMember', 'AssociateMember'

// Helper function to get effective member category
const getEffectiveMemberCategory = (actualCategory) => {
  if (OVERRIDE_MEMBER_CATEGORY) {
    console.log(`🔧 DEBUG: Override active - Using ${DEBUG_CATEGORY} instead of ${actualCategory}`);
    return DEBUG_CATEGORY;
  }
  return actualCategory;
};

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
  
  // Get effective member category for debugging
  const effectiveMemberCategory = getEffectiveMemberCategory(memberCategory);
  
  // Check if section should be editable based on member category
  const canEdit = isSectionEditable(effectiveMemberCategory, 'cryoArrangements');

  // Watch for save completion when we're waiting for it
  useEffect(() => {
    if (overlayWaitingForSave && savingSection !== 'cryoArrangements') {
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
    setOverlayEditMode(false); // Start in view mode
    setShowOverlaySuccess(false); // Reset success message
    setOverlayFieldErrors({}); // Clear any previous errors
  };

  const handleOverlayEdit = () => {
    // Check if user can edit
    if (!canEdit) {
      return;
    }
    // Set the main edit mode to true if not already
    if (!editMode.cryoArrangements) {
      toggleEditMode('cryoArrangements');
    }
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
  };

  const handleOverlaySave = async () => {
    // Do local validation first
    const errors = {};
    
    // Validate based on section
    if (overlaySection === 'method') {
      // Method and CMS waiver are read-only, no validation needed
    }
    
    if (overlaySection === 'remains') {
      if (!cryoArrangements?.remainsHandling || !cryoArrangements.remainsHandling.trim()) {
        errors.remainsHandling = "Remains handling preference is required";
      }
      
      // If returning to recipient, validate additional fields
      if (cryoArrangements?.remainsHandling === 'return') {
        if (!cryoArrangements?.recipientName || !cryoArrangements.recipientName.trim()) {
          errors.recipientName = "Recipient name is required";
        }
        if (!cryoArrangements?.recipientPhone || !cryoArrangements.recipientPhone.trim()) {
          errors.recipientPhone = "Recipient phone is required";
        }
        if (!cryoArrangements?.recipientEmail || !cryoArrangements.recipientEmail.trim()) {
          errors.recipientEmail = "Recipient email is required";
        }
        if (!cryoArrangements?.recipientMailingStreet || !cryoArrangements.recipientMailingStreet.trim()) {
          errors.recipientMailingStreet = "Recipient street address is required";
        }
        if (!cryoArrangements?.recipientMailingCity || !cryoArrangements.recipientMailingCity.trim()) {
          errors.recipientMailingCity = "Recipient city is required";
        }
      }
    }
    
    if (overlaySection === 'disclosure') {
      // Disclosure fields are read-only, no validation needed
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
    const success = await saveCryoArrangements();
    // The useEffect will handle the result when savingSection changes
  };

  const handleOverlayCancel = () => {
    // Call the parent's cancel function
    cancelEdit('cryoArrangements');
    setOverlayEditMode(false);
    setIsOverlaySaving(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const handleOverlayClose = () => {
    // If we're saving, don't allow close
    if (isOverlaySaving || overlayWaitingForSave || savingSection === 'cryoArrangements') {
      return;
    }
    
    // If we're in edit mode, cancel first
    if (overlayEditMode) {
      cancelEdit('cryoArrangements');
      setOverlayEditMode(false);
    }
    setOverlayOpen(false);
    setShowOverlaySuccess(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
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
    if (parts.length === 0) return '—';
    return parts.join(', ');
  };

  const getFieldDescriptions = () => {
    switch (overlaySection) {
      case 'method':
        return {
          title: 'Cryopreservation Method',
          description: 'Your chosen method of cryopreservation and associated funding requirements. These selections affect your funding minimums and cannot be changed through this portal.',
        };
      case 'remains':
        return {
          title: 'Remains Handling',
          description: 'Instructions for handling of non-cryopreserved remains. If returning to a recipient, please provide complete contact information.',
        };
      case 'disclosure':
        return {
          title: 'Privacy & Disclosure',
          description: 'Your preferences for how Alcor handles your personal information and membership status. These settings control public disclosure of your cryopreservation arrangements.',
        };
      default:
        return { title: '', description: '' };
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

  // Create the edit form component that will be reused
  const renderEditForm = (isInOverlay = false) => {
    const containerClass = isInOverlay ? "space-y-4" : "max-w-2xl";
    // Use overlay-specific errors when in overlay, otherwise use parent fieldErrors
    const currentErrors = isInOverlay ? overlayFieldErrors : fieldErrors;
    
    return (
      <div className={containerClass}>
        {isInOverlay && overlaySection === 'method' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Method of Cryopreservation</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {formatMethod(cryoArrangements?.method)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">CMS Fee Waiver</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {cryoArrangements?.cmsWaiver 
                  ? 'Yes - Waiving $200 annual fee with $20,000 additional funding'
                  : 'No - Not waiving CMS fee'}
              </p>
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Contact Alcor staff to change these selections
            </p>
          </div>
        )}

        {isInOverlay && overlaySection === 'remains' && (
          <div className="space-y-4">
            <Select
              label="Non-Cryopreserved Remains Handling"
              value={cryoArrangements?.remainsHandling || ''}
              onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
              error={currentErrors.remainsHandling}
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
                  disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                  error={currentErrors.recipientName}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Recipient Phone"
                    type="tel"
                    value={cryoArrangements?.recipientPhone || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                    disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                    error={currentErrors.recipientPhone}
                  />
                  <Input
                    label="Recipient Email"
                    type="email"
                    value={cryoArrangements?.recipientEmail || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                    disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                    error={currentErrors.recipientEmail}
                  />
                </div>
                
                <h4 className="text-sm font-medium text-gray-700 mt-4">Recipient Mailing Address</h4>
                <Input
                  label="Street Address"
                  value={cryoArrangements?.recipientMailingStreet || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingStreet: e.target.value})}
                  disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                  error={currentErrors.recipientMailingStreet}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={cryoArrangements?.recipientMailingCity || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCity: e.target.value})}
                    disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                    error={currentErrors.recipientMailingCity}
                  />
                  <Input
                    label="State/Province"
                    value={cryoArrangements?.recipientMailingState || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingState: e.target.value})}
                    disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Zip/Postal Code"
                    value={cryoArrangements?.recipientMailingPostalCode || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingPostalCode: e.target.value})}
                    disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                  />
                  <Input
                    label="Country"
                    value={cryoArrangements?.recipientMailingCountry || 'US'}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCountry: e.target.value})}
                    disabled={isOverlaySaving || savingSection === 'cryoArrangements'}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {isInOverlay && overlaySection === 'disclosure' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cryopreservation Information Disclosure</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {formatCryoDisclosure(cryoArrangements?.cryopreservationDisclosure)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Member Name Disclosure</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {formatMemberDisclosure(cryoArrangements?.memberPublicDisclosure)}
              </p>
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Contact Alcor staff to change these selections
            </p>
          </div>
        )}

        {!isInOverlay && (
          <div className="space-y-6">
            {/* Method - Read-only */}
            <div>
              <label className={styleConfig2.form.label}>Method of Cryopreservation *</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {formatMethod(cryoArrangements?.method)}
              </p>
            </div>

            {/* CMS Waiver - Read-only */}
            <div>
              <label className={styleConfig2.form.label}>CMS Fee Waiver *</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {cryoArrangements?.cmsWaiver 
                  ? 'Yes - Waiving $200 annual fee with $20,000 additional funding'
                  : 'No - Not waiving CMS fee'}
              </p>
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

            {/* Disclosure fields - Read-only */}
            <div>
              <label className={styleConfig2.form.label}>Cryopreservation Information Disclosure *</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {formatCryoDisclosure(cryoArrangements?.cryopreservationDisclosure)}
              </p>
            </div>

            <div>
              <label className={styleConfig2.form.label}>Member Name Disclosure *</label>
              <p className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {formatMemberDisclosure(cryoArrangements?.memberPublicDisclosure)}
              </p>
            </div>
            
            <p className="text-xs text-gray-500 italic">
              * Only Non-Cryopreserved Remains Handling can be edited. Contact Alcor staff to change other selections.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Create the view content for overlay
  const renderOverlayViewContent = () => {
    return (
      <div className="space-y-6">
        {overlaySection === 'method' && (
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

        {overlaySection === 'remains' && (
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

        {overlaySection === 'disclosure' && (
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
    );
  };

  return (
    <div ref={sectionRef} className={`cryo-arrangements-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
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
            
            {/* Footer with Edit button or Close button based on canEdit */}
            <div className={overlayStyles.footer.wrapper}>
              {canEdit ? (
                <PurpleButton
                  text="Edit"
                  onClick={handleOverlayEdit}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                />
              ) : (
                <PurpleButton
                  text="Close"
                  onClick={handleOverlayClose}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                />
              )}
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
                renderEditForm(false)
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