import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import MedicalInfoMobile from './MedicalInfoMobile';
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
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

// FormTextarea component for both desktop and overlay
const FormTextarea = ({ label, value, onChange, placeholder, rows = 3, disabled = false, error = false }) => (
  <div>
    <label className={styleConfig2.form.label}>{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styleConfig2.input.textarea} ${error ? styleConfig2.input.error : ''}`}
    />
  </div>
);

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
                    {section === 'basic' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                    {section === 'physician' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                    {section === 'history' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
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

const MedicalInfoSection = ({ 
  medicalInfo = {}, 
  setMedicalInfo,
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveMedicalInfo, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  // Ensure medicalInfo is always an object
  const safeMedicalInfo = medicalInfo || {};
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
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

  // Watch for save completion when we're waiting for it
  useEffect(() => {
    if (overlayWaitingForSave && savingSection !== 'medical') {
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

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
    setOverlayEditMode(false); // Start in view mode
    setShowOverlaySuccess(false); // Reset success message
    setOverlayFieldErrors({}); // Clear any previous errors
  };

  const handleOverlayEdit = () => {
    // Set the main edit mode to true if not already
    if (!editMode.medical) {
      toggleEditMode('medical');
    }
    setOverlayEditMode(true);
    setShowOverlaySuccess(false);
  };

  const handleOverlaySave = () => {
    // Do local validation first
    const errors = {};
    
    // Validate based on section
    if (overlaySection === 'basic') {
      if (!safeMedicalInfo?.sex || !safeMedicalInfo.sex.trim()) {
        errors.sex = "Sex is required";
      }
      if (!safeMedicalInfo?.bloodType || !safeMedicalInfo.bloodType.trim()) {
        errors.bloodType = "Blood type is required";
      }
      if (!safeMedicalInfo?.height || !safeMedicalInfo.height.toString().trim()) {
        errors.height = "Height is required";
      }
      if (!safeMedicalInfo?.weight || !safeMedicalInfo.weight.toString().trim()) {
        errors.weight = "Weight is required";
      }
    }
    
    // No required fields for physician or history sections
    
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
    saveMedicalInfo();
    // The useEffect will handle the result when savingSection changes
  };

  const handleOverlayCancel = () => {
    // Call the parent's cancel function
    cancelEdit('medical');
    setOverlayEditMode(false);
    setIsOverlaySaving(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  const handleOverlayClose = () => {
    // If we're saving, don't allow close
    if (isOverlaySaving || overlayWaitingForSave || savingSection === 'medical') {
      return;
    }
    
    // If we're in edit mode, cancel first
    if (overlayEditMode) {
      cancelEdit('medical');
      setOverlayEditMode(false);
    }
    setOverlayOpen(false);
    setShowOverlaySuccess(false);
    setOverlayWaitingForSave(false);
    setOverlayFieldErrors({}); // Clear errors
  };

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      sex: { field: 'sex', source: 'medicalInfo', label: 'Sex' },
      bloodType: { field: 'bloodType', source: 'medicalInfo', label: 'Blood Type' },
      height: { field: 'height', source: 'medicalInfo', label: 'Height' },
      weight: { field: 'weight', source: 'medicalInfo', label: 'Weight' }
    },
    recommended: {
      primaryPhysician: { field: 'primaryPhysician', source: 'medicalInfo', label: 'Primary Physician' },
      healthProblems: { field: 'healthProblems', source: 'medicalInfo', label: 'Health Problems' },
      medications: { field: 'medications', source: 'medicalInfo', label: 'Medications' },
      allergies: { field: 'allergies', source: 'medicalInfo', label: 'Allergies' }
    }
  };

  // Format height for display
  const formatHeight = (heightValue) => {
    if (!heightValue) return '—';
    if (typeof heightValue === 'string' && (heightValue.includes("'") || heightValue.includes('"'))) {
      return heightValue;
    }
    const heightNum = parseInt(heightValue);
    if (isNaN(heightNum)) return heightValue;
    const feet = Math.floor(heightNum / 12);
    const inches = heightNum % 12;
    return `${feet}' ${inches}"`;
  };

  const formatWeight = (weight) => {
    if (!weight) return '—';
    const weightNum = weight.toString()
      .replace(' lbs', '')
      .replace(' lb', '')
      .replace('lbs', '')
      .replace('lb', '')
      .trim();
    return `${weightNum} lb`;
  };

  const formatDoctorAddress = () => {
    const parts = [
      safeMedicalInfo?.physicianAddress,
      safeMedicalInfo?.physicianCity,
      safeMedicalInfo?.physicianState,
      safeMedicalInfo?.physicianZip,
      safeMedicalInfo?.physicianCountry
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const formatDoctorPhones = () => {
    const phones = [];
    if (safeMedicalInfo?.physicianHomePhone) phones.push(`Home: ${safeMedicalInfo.physicianHomePhone}`);
    if (safeMedicalInfo?.physicianWorkPhone) phones.push(`Work: ${safeMedicalInfo.physicianWorkPhone}`);
    return phones.length > 0 ? phones.join(' | ') : '—';
  };

  const getFieldDescriptions = () => {
    switch (overlaySection) {
      case 'basic':
        return {
          title: 'Basic Health Information',
          description: 'Your fundamental health metrics including sex, height, weight, and blood type. This information is essential for medical care and emergency situations.',
        };
      case 'physician':
        return {
          title: 'Primary Care Physician',
          description: 'Your primary doctor\'s contact information ensures Alcor can quickly reach your physician in emergency situations and coordinate care.',
        };
      case 'history':
        return {
          title: 'Medical History',
          description: 'Comprehensive medical history including current conditions, medications, allergies, and past medical events. This information is crucial for proper medical care.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const needsProfileImprovement = () => {
    // Check if important medical fields are missing
    const missingFields = [];
    
    if (!safeMedicalInfo.sex) missingFields.push('sex');
    if (!safeMedicalInfo.height) missingFields.push('height');
    if (!safeMedicalInfo.weight) missingFields.push('weight');
    if (!safeMedicalInfo.bloodType) missingFields.push('blood type');
    
    if (!safeMedicalInfo.primaryPhysician) missingFields.push('primary physician');
    
    // Check each field individually
    if (!safeMedicalInfo.healthProblems) missingFields.push('health problems');
    if (!safeMedicalInfo.medications) missingFields.push('medications');
    if (!safeMedicalInfo.allergies) missingFields.push('allergies');
    
    return missingFields.length > 0;
  };

  // Get specific missing fields for the message
  const getMissingFieldsMessage = () => {
    const missing = [];
    
    if (!safeMedicalInfo.sex || !safeMedicalInfo.height || !safeMedicalInfo.weight || !safeMedicalInfo.bloodType) {
      missing.push('basic health information');
    }
    if (!safeMedicalInfo.primaryPhysician) {
      missing.push('primary physician details');
    }
    if (!safeMedicalInfo.healthProblems && !safeMedicalInfo.medications && !safeMedicalInfo.allergies) {
      missing.push('medical history');
    }
    
    if (missing.length === 0) return '';
    if (missing.length === 1) return `Add ${missing[0]}`;
    if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]}`;
    return `Add ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
  };

  // Profile improvement notice component
  const ProfileImprovementNotice = () => (
    <div className={isMobile ? "flex items-center gap-2" : "flex items-center gap-4"}>
      <svg className={isMobile ? "w-5 h-5 text-orange-500 flex-shrink-0" : "w-10 h-10 text-orange-500 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">
            Improve Your Member Profile
          </p>
          <div className="relative">
            <HelpCircle 
              className={isMobile ? "w-4 h-4 text-gray-600 cursor-help" : "w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"}
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
                    Complete medical information helps Alcor provide better care in emergency situations and ensures your physician can be contacted quickly if needed.
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
        {!isMobile && (
          <p className="text-sm text-gray-600 font-light">
            {getMissingFieldsMessage()}
          </p>
        )}
      </div>
    </div>
  );

  // Create the edit form component that will be reused
  const renderEditForm = (isInOverlay = false) => {
    // Use overlay-specific errors when in overlay, otherwise use parent fieldErrors
    const currentErrors = isInOverlay ? overlayFieldErrors : fieldErrors;
    
    return (
      <>
        {isInOverlay && overlaySection === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Sex *"
                value={safeMedicalInfo?.sex || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, sex: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
                error={currentErrors.sex}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              
              <Input
                label="Height (inches) *"
                type="text"
                value={safeMedicalInfo?.height || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, height: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
                placeholder="e.g., 68 for 5'8"
                error={currentErrors.height}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Weight (lbs) *"
                type="text"
                value={safeMedicalInfo?.weight ? safeMedicalInfo.weight.toString().replace(' lbs', '').replace(' lb', '').replace('lbs', '').replace('lb', '').trim() : ''}
                onChange={(e) => {
                  const weightValue = e.target.value.trim();
                  setMedicalInfo({
                    ...safeMedicalInfo, 
                    weight: weightValue ? `${weightValue} lb` : ''
                  });
                }}
                disabled={isOverlaySaving || savingSection === 'medical'}
                placeholder="190"
                error={currentErrors.weight}
              />
              
              <Select
                label="Blood Type *"
                value={safeMedicalInfo?.bloodType || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, bloodType: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
                error={currentErrors.bloodType}
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </Select>
            </div>
          </div>
        )}

        {isInOverlay && overlaySection === 'physician' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Doctor Name"
                value={safeMedicalInfo?.primaryPhysician || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, primaryPhysician: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
              />
              
              <Input
                label="Hospital"
                value={safeMedicalInfo?.hospital || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, hospital: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
              />
            </div>
            
            <Input
              label="Doctor Address"
              value={safeMedicalInfo?.physicianAddress || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianAddress: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={safeMedicalInfo?.physicianCity || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianCity: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
              />
              
              <Input
                label="State/Province"
                value={safeMedicalInfo?.physicianState || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianState: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Zip/Postal Code"
                value={safeMedicalInfo?.physicianZip || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianZip: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
              />
              
              <Input
                label="Country"
                value={safeMedicalInfo?.physicianCountry || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianCountry: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Doctor Home Phone"
                type="tel"
                value={safeMedicalInfo?.physicianHomePhone || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianHomePhone: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
                placeholder="(555) 123-4567"
              />
              
              <Input
                label="Doctor Work Phone"
                type="tel"
                value={safeMedicalInfo?.physicianWorkPhone || ''}
                onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianWorkPhone: e.target.value})}
                disabled={isOverlaySaving || savingSection === 'medical'}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <Select
              label="Will Doctor Cooperate with Alcor?"
              value={safeMedicalInfo?.willDoctorCooperate || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, willDoctorCooperate: e.target.value})}
              disabled={isOverlaySaving || savingSection === 'medical'}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Unknown">Unknown</option>
            </Select>
          </div>
        )}

        {isInOverlay && overlaySection === 'history' && (
          <div className="space-y-4">
            <FormTextarea
              label="Health Problems"
              value={safeMedicalInfo?.healthProblems || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, healthProblems: e.target.value})}
              placeholder="List any current or chronic health problems"
              rows={3}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <FormTextarea
              label="Allergies (including to drugs)"
              value={safeMedicalInfo?.allergies || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, allergies: e.target.value})}
              placeholder="e.g., Penicillin; Vicodin"
              rows={3}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <FormTextarea
              label="Medications Currently or Recently Taken"
              value={safeMedicalInfo?.medications || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, medications: e.target.value})}
              placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
              rows={3}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <FormTextarea
              label="Identifying Scars or Deformities"
              value={safeMedicalInfo?.identifyingScars || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, identifyingScars: e.target.value})}
              rows={2}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <FormTextarea
              label="Artificial Appliances, Implants or Prosthetics"
              value={safeMedicalInfo?.artificialAppliances || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, artificialAppliances: e.target.value})}
              placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
              rows={2}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <FormTextarea
              label="Past Medical History"
              value={safeMedicalInfo?.pastMedicalHistory || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, pastMedicalHistory: e.target.value})}
              placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
              rows={4}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
            
            <FormTextarea
              label="Hereditary Illnesses or Tendencies in Family"
              value={safeMedicalInfo?.hereditaryIllnesses || ''}
              onChange={(e) => setMedicalInfo({...safeMedicalInfo, hereditaryIllnesses: e.target.value})}
              placeholder="List any hereditary conditions in your family"
              rows={3}
              disabled={isOverlaySaving || savingSection === 'medical'}
            />
          </div>
        )}
      </>
    );
  };

  // Create the view content for overlay
  const renderOverlayViewContent = () => {
    return (
      <div className="space-y-6">
        {overlaySection === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Sex</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.sex)}
                >
                  {safeMedicalInfo?.sex || '—'}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Height</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.height)}
                >
                  {formatHeight(safeMedicalInfo?.height)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Weight</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.weight)}
                >
                  {formatWeight(safeMedicalInfo?.weight)}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Blood Type</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.bloodType)}
                >
                  {safeMedicalInfo?.bloodType || '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {overlaySection === 'physician' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className={overlayStyles.displayMode.field.label}>Doctor Name</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.primaryPhysician)}
                >
                  {safeMedicalInfo?.primaryPhysician || '—'}
                </p>
              </div>
              <div>
                <label className={overlayStyles.displayMode.field.label}>Hospital</label>
                <p 
                  className={overlayStyles.displayMode.field.value}
                  style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.hospital)}
                >
                  {safeMedicalInfo?.hospital || '—'}
                </p>
              </div>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Doctor Address</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!formatDoctorAddress() || formatDoctorAddress() === '—')}
              >
                {formatDoctorAddress()}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Phone Numbers</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!formatDoctorPhones() || formatDoctorPhones() === '—')}
              >
                {formatDoctorPhones()}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Will Cooperate with Alcor?</label>
              <p 
                className={overlayStyles.displayMode.field.value}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.willDoctorCooperate)}
              >
                {safeMedicalInfo?.willDoctorCooperate || '—'}
              </p>
            </div>
          </div>
        )}

        {overlaySection === 'history' && (
          <div className="space-y-6">
            <div>
              <label className={overlayStyles.displayMode.field.label}>Health Problems</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.healthProblems)}
              >
                {safeMedicalInfo?.healthProblems || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Allergies (including to drugs)</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.allergies)}
              >
                {safeMedicalInfo?.allergies || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Current/Recent Medications</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.medications)}
              >
                {safeMedicalInfo?.medications || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Identifying Scars or Deformities</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.identifyingScars)}
              >
                {safeMedicalInfo?.identifyingScars || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Artificial Appliances/Implants/Prosthetics</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.artificialAppliances)}
              >
                {safeMedicalInfo?.artificialAppliances || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Past Medical History</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.pastMedicalHistory)}
              >
                {safeMedicalInfo?.pastMedicalHistory || '—'}
              </p>
            </div>
            <div>
              <label className={overlayStyles.displayMode.field.label}>Hereditary Illnesses or Tendencies</label>
              <p 
                className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                style={overlayStyles.displayMode.field.getFieldStyle(!safeMedicalInfo?.hereditaryIllnesses)}
              >
                {safeMedicalInfo?.hereditaryIllnesses || '—'}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} className={`medical-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
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
        <MedicalInfoMobile
          medicalInfo={safeMedicalInfo}
          setMedicalInfo={setMedicalInfo}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveMedicalInfo={saveMedicalInfo}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          fieldConfig={fieldConfig}
          formatHeight={formatHeight}
          formatWeight={formatWeight}
          needsProfileImprovement={needsProfileImprovement}
          getMissingFieldsMessage={getMissingFieldsMessage}
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
                        <div className={headerStyles.getIconContainer(styleConfig2, 'medical')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Health & Emergency Information</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'medical')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Your medical history, health details, and emergency contact information.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: Sex, Height, Weight, Blood Type
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-1">
                            Recommended: Primary Physician, Medical History
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ medicalInfo: safeMedicalInfo }}
                    fieldConfig={fieldConfig}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.medical ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Health Information Card */}
                  <InfoCard 
                    title="Basic Health Information" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    sectionKey="basic"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('basic')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('basic')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Sex" value={safeMedicalInfo?.sex || '—'} isRequired />
                    <InfoField label="Height" value={formatHeight(safeMedicalInfo?.height)} isRequired />
                    <InfoField label="Weight" value={formatWeight(safeMedicalInfo?.weight)} isRequired />
                    <InfoField label="Blood Type" value={safeMedicalInfo?.bloodType || '—'} isRequired />
                  </InfoCard>

                  {/* Primary Care Physician Card */}
                  <InfoCard 
                    title="Primary Care Physician" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                    sectionKey="physician"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('physician')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('physician')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Doctor Name" value={safeMedicalInfo?.primaryPhysician || '—'} isRecommended />
                    <InfoField label="Hospital" value={safeMedicalInfo?.hospital || '—'} />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                    <div className="text-xs text-gray-500 italic mt-1">
                      3 additional fields, tap to view
                    </div>
                  </InfoCard>

                  {/* Medical History Card */}
                  <InfoCard 
                    title="Medical Information" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    }
                    sectionKey="history"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('history')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('history')}
                    cardIndex={2}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Health Problems" value={safeMedicalInfo?.healthProblems || '—'} isRecommended />
                    <InfoField label="Allergies" value={safeMedicalInfo?.allergies || '—'} isRecommended />
                    <InfoField label="Medications" value={safeMedicalInfo?.medications || '—'} isRecommended />
                    <div className="text-xs text-gray-500 italic mt-1">
                      4 additional fields, tap to view
                    </div>
                  </InfoCard>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-4xl">
                  <div className="space-y-6">
                    {/* Basic Health Information */}
                    <div>
                      <h3 className="text-[#2a2346] mb-4 font-medium">Basic Health Information</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <Select
                          label="Sex"
                          value={safeMedicalInfo?.sex || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, sex: e.target.value})}
                          disabled={savingSection === 'medical'}
                          error={fieldErrors.sex}
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Select>
                        
                        <Input
                          label="Height (inches)"
                          type="text"
                          value={safeMedicalInfo?.height || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, height: e.target.value})}
                          disabled={savingSection === 'medical'}
                          placeholder="e.g., 68 for 5'8"
                        />
                        
                        <Input
                          label="Weight (lbs)"
                          type="text"
                          value={safeMedicalInfo?.weight ? safeMedicalInfo.weight.toString().replace(' lbs', '').replace(' lb', '').replace('lbs', '').replace('lb', '').trim() : ''}
                          onChange={(e) => {
                            const weightValue = e.target.value.trim();
                            setMedicalInfo({
                              ...safeMedicalInfo, 
                              weight: weightValue ? `${weightValue} lb` : ''
                            });
                          }}
                          disabled={savingSection === 'medical'}
                          placeholder="190"
                        />
                        
                        <Select
                          label="Blood Type"
                          value={safeMedicalInfo?.bloodType || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, bloodType: e.target.value})}
                          disabled={savingSection === 'medical'}
                        >
                          <option value="">Select...</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="Unknown">Unknown</option>
                        </Select>
                      </div>
                    </div>

                    {/* Doctor Information */}
                    <div>
                      <h3 className="text-[#2a2346] mb-4 font-medium">Primary Care Physician</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Doctor Name"
                          type="text"
                          value={safeMedicalInfo?.primaryPhysician || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, primaryPhysician: e.target.value})}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <Input
                          label="Hospital"
                          type="text"
                          value={safeMedicalInfo?.hospital || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, hospital: e.target.value})}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <Input
                          label="Doctor Address"
                          type="text"
                          value={safeMedicalInfo?.physicianAddress || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianAddress: e.target.value})}
                          disabled={savingSection === 'medical'}
                          containerClassName="col-span-2"
                        />
                        
                        <Input
                          label="City"
                          type="text"
                          value={safeMedicalInfo?.physicianCity || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianCity: e.target.value})}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <Input
                          label="State/Province"
                          type="text"
                          value={safeMedicalInfo?.physicianState || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianState: e.target.value})}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <Input
                          label="Zip/Postal Code"
                          type="text"
                          value={safeMedicalInfo?.physicianZip || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianZip: e.target.value})}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <Input
                          label="Country"
                          type="text"
                          value={safeMedicalInfo?.physicianCountry || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianCountry: e.target.value})}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <Input
                          label="Doctor Home Phone"
                          type="tel"
                          value={safeMedicalInfo?.physicianHomePhone || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianHomePhone: e.target.value})}
                          disabled={savingSection === 'medical'}
                          placeholder="(555) 123-4567"
                        />
                        
                        <Input
                          label="Doctor Work Phone"
                          type="tel"
                          value={safeMedicalInfo?.physicianWorkPhone || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianWorkPhone: e.target.value})}
                          disabled={savingSection === 'medical'}
                          placeholder="(555) 123-4567"
                        />
                        
                        <Select
                          label="Will Doctor Cooperate with Alcor?"
                          value={safeMedicalInfo?.willDoctorCooperate || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, willDoctorCooperate: e.target.value})}
                          disabled={savingSection === 'medical'}
                          containerClassName="col-span-2"
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Unknown">Unknown</option>
                        </Select>
                      </div>
                    </div>

                    {/* Medical History */}
                    <div>
                      <h3 className="text-[#2a2346] mb-4 font-medium">Medical History</h3>
                      <div className="space-y-4">
                        <FormTextarea
                          label="Health Problems"
                          value={safeMedicalInfo?.healthProblems || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, healthProblems: e.target.value})}
                          placeholder="List any current or chronic health problems"
                          rows={3}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <FormTextarea
                          label="Allergies (including to drugs)"
                          value={safeMedicalInfo?.allergies || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, allergies: e.target.value})}
                          placeholder="e.g., Penicillin; Vicodin"
                          rows={3}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <FormTextarea
                          label="Medications Currently or Recently Taken"
                          value={safeMedicalInfo?.medications || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, medications: e.target.value})}
                          placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
                          rows={3}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <FormTextarea
                          label="Identifying Scars or Deformities"
                          value={safeMedicalInfo?.identifyingScars || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, identifyingScars: e.target.value})}
                          rows={2}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <FormTextarea
                          label="Artificial Appliances, Implants or Prosthetics"
                          value={safeMedicalInfo?.artificialAppliances || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, artificialAppliances: e.target.value})}
                          placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
                          rows={2}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <FormTextarea
                          label="Past Medical History"
                          value={safeMedicalInfo?.pastMedicalHistory || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, pastMedicalHistory: e.target.value})}
                          placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
                          rows={4}
                          disabled={savingSection === 'medical'}
                        />
                        
                        <FormTextarea
                          label="Hereditary Illnesses or Tendencies in Family"
                          value={safeMedicalInfo?.hereditaryIllnesses || ''}
                          onChange={(e) => setMedicalInfo({...safeMedicalInfo, hereditaryIllnesses: e.target.value})}
                          placeholder="List any hereditary conditions in your family"
                          rows={3}
                          disabled={savingSection === 'medical'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              {editMode?.medical ? (
                <div className={buttonStyles.actionContainer}>
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('medical')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={() => {
                        if (!safeMedicalInfo.sex || safeMedicalInfo.sex === '') {
                          alert('Please select a sex before saving.');
                          return;
                        }
                        saveMedicalInfo();
                      }}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'medical'}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {needsProfileImprovement() ? (
                    <div className="flex items-center justify-between mt-8 pt-6">
                      <ProfileImprovementNotice />
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('medical')}
                        className={buttonStyles.whiteButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    </div>
                  ) : (
                    <div className={buttonStyles.actionContainer}>
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('medical')}
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

export default MedicalInfoSection;