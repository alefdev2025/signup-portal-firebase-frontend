import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import PersonalInfoMobile from './PersonalInfoMobile';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
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
import { isSectionEditable } from '../memberCategoryConfig';

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

// Custom Select component that uses styleConfig2
const StyledSelect = ({ label, value, onChange, disabled, children, error }) => {
  return (
    <div>
      <label className={styleConfig2.form.label}>{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styleConfig2.select.default} ${error ? styleConfig2.input.error : ''}`}
      >
        {children}
      </select>
    </div>
  );
};

// Multi-Select Dropdown Component
const MultiSelectDropdown = ({ label, options, value = [], onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (disabled) return;
    
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    
    // Remove duplicates
    const uniqueValue = [...new Set(newValue)];
    onChange(uniqueValue);
  };

  const displayValue = value.length > 0 
    ? [...new Set(value)].join(', ') 
    : 'Select...';

  // Sort options to show selected ones first
  const sortedOptions = React.useMemo(() => {
    // Normalize values for comparison
    const normalizedValue = value.map(v => 
      v === "United States" ? "United States of America" : v
    );
    const selected = options.filter(opt => normalizedValue.includes(opt));
    const unselected = options.filter(opt => !normalizedValue.includes(opt));
    return [...selected, ...unselected];
  }, [options, value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className={styleConfig2.form.label}>{label}</label>
      <div
        className={`${styleConfig2.select.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`${value.length === 0 ? 'text-gray-400' : ''} truncate pr-2`}>{displayValue}</span>
        <svg className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {sortedOptions.map((option) => (
            <label
              key={option}
              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={value.includes(option) || (option === "United States of America" && value.includes("United States"))}
                onChange={() => toggleOption(option)}
                className="mr-2 w-4 h-4 rounded border-gray-300 text-[#734477] focus:ring-2 focus:ring-[#734477]/20 accent-[#734477]"
              />
              <span className="ml-2 text-gray-700 font-medium">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// Single-Select Dropdown Component
const SingleSelectDropdown = ({ label, options, value = '', onChange, disabled = false, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange({ target: { value: option } });
    setIsOpen(false);
  };

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className={styleConfig2.form.label}>{label}</label>
      <div
        className={`${styleConfig2.select.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`${!value ? 'text-gray-400' : ''} truncate pr-2`}>{displayValue}</span>
        <svg className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer font-medium ${value === option.value ? 'bg-[#734477]/10 text-[#734477]' : 'text-gray-700'}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Overlay Component
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  data, 
  onSave,
  savingSection,
  fieldErrors,
  memberCategory
}) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localPersonalInfo, setLocalPersonalInfo] = useState({});

  // Get effective member category for debugging
  const effectiveMemberCategory = getEffectiveMemberCategory(memberCategory);
  const canEditSSN = effectiveMemberCategory === 'CryoApplicant' && !data.personalInfo?.ssn;

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);
      setShowSuccess(false);
      // Reset local state to current data when opening
      setLocalPersonalInfo({...data.personalInfo} || {});
    }
  }, [isOpen, data.personalInfo]);

  if (!isOpen) return null;

  const formatSSN = (ssn) => {
    if (!ssn) return '—';
    if (ssn.includes('*')) return ssn;
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return '—';
  };

  const formatMultipleSelections = (selections) => {
    if (!selections || selections.length === 0) return '—';
    // Remove duplicates before formatting
    const uniqueSelections = [...new Set(selections)];
    return uniqueSelections.join(', ');
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    // Pass the local data back to parent
    onSave(localPersonalInfo);
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    // Reset to original data
    setLocalPersonalInfo({...data.personalInfo} || {});
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'identity':
        return {
          title: 'Identity Details',
          description: 'Your personal identification information including birth name, government ID, and sex.',
        };
      case 'demographics':
        return {
          title: 'Demographics',
          description: 'Demographic information that helps us better understand our member community and ensure inclusive services.',
        };
      case 'origin':
        return {
          title: 'Origin & Citizenship',
          description: 'Information about your place of birth and citizenship status, which may be relevant for legal documentation.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const fieldInfo = getFieldDescriptions();

  const raceOptions = [
    "American Indian or Alaska Native",
    "Asian",
    "Black or African American",
    "Hispanic or Latino",
    "Native Hawaiian or Other Pacific Islander",
    "White or Caucasian",
    "Multiracial",
    "Middle Eastern",
    "Prefer Not to Say",
    "Other"
  ];

  const citizenshipOptions = [
    "United States of America",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Côte d'Ivoire",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czechia (Czech Republic)",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini (fmr. \"Swaziland\")",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Holy See",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (formerly Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine State",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ];

  const ethnicityOptions = [
    { value: "Hispanic or Latino", label: "Hispanic or Latino" },
    { value: "Not Hispanic or Latino", label: "Not Hispanic or Latino" }
  ];

  const maritalStatusOptions = [
    { value: "", label: "Select..." },
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Separated", label: "Separated" },
    { value: "Widowed", label: "Widowed" },
    { value: "Widower", label: "Widower" },
    { value: "Domestic Partner", label: "Domestic Partner" },
    { value: "Significant Other", label: "Significant Other" }
  ];

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={onClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
        <div className={overlayStyles.contentBox}>
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
                    {section === 'identity' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    )}
                    {section === 'demographics' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    )}
                    {section === 'origin' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
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

          <div className={overlayStyles.body.wrapper}>
          {showSuccess && (
            <p className="text-sm text-gray-500 mb-6">Information updated successfully</p>
          )}

            {!editMode ? (
              <div className="space-y-6">
                {section === 'identity' && (
                  <>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Birth Name</label>
                        <p className={overlayStyles.displayMode.field.value}>
                          {localPersonalInfo?.birthName || 'Same as current'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>SSN/Government ID</label>
                        <p className={overlayStyles.displayMode.field.value}>
                          {formatSSN(localPersonalInfo?.ssn)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Sex</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {localPersonalInfo?.gender || '—'}
                      </p>
                    </div>
                  </>
                )}

                {section === 'demographics' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Race</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {formatMultipleSelections(localPersonalInfo?.race)}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Ethnicity</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {localPersonalInfo?.ethnicity || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Marital Status</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {localPersonalInfo?.maritalStatus || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'origin' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Place of Birth</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {localPersonalInfo?.placeOfBirth || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Citizenship</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {formatMultipleSelections(localPersonalInfo?.citizenship)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {section === 'identity' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Birth Name"
                        type="text"
                        value={localPersonalInfo?.birthName || ''}
                        onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, birthName: e.target.value})}
                        disabled={savingSection === 'personal'}
                        placeholder="Same as current"
                      />
                      <StyledSelect
                        label="Sex *"
                        value={localPersonalInfo?.gender || ''}
                        onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, gender: e.target.value})}
                        disabled={savingSection === 'personal'}
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </StyledSelect>
                    </div>
                    {canEditSSN ? (
                      <Input
                        label="SSN/Government ID *"
                        type="text"
                        value={localPersonalInfo?.ssn || ''}
                        onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, ssn: e.target.value})}
                        disabled={savingSection === 'personal'}
                        error={fieldErrors.ssn}
                      />
                    ) : (
                      <div>
                        <label className={styleConfig2.form.label}>SSN/Government ID *</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                          {formatSSN(localPersonalInfo?.ssn)}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Contact Alcor to update SSN</p>
                      </div>
                    )}
                  </>
                )}

                {section === 'demographics' && (
                  <>
                    <MultiSelectDropdown
                      label="Race"
                      options={raceOptions}
                      value={localPersonalInfo?.race || []}
                      onChange={(selected) => setLocalPersonalInfo({...localPersonalInfo, race: selected})}
                      disabled={savingSection === 'personal'}
                    />
                    <SingleSelectDropdown
                      label="Ethnicity"
                      options={ethnicityOptions}
                      value={localPersonalInfo?.ethnicity || ''}
                      onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, ethnicity: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                    <SingleSelectDropdown
                      label="Marital Status"
                      options={maritalStatusOptions}
                      value={localPersonalInfo?.maritalStatus || ''}
                      onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, maritalStatus: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                  </>
                )}

                {section === 'origin' && (
                  <>
                    <Input
                      label="Place of Birth"
                      type="text"
                      value={localPersonalInfo?.placeOfBirth || ''}
                      onChange={(e) => setLocalPersonalInfo({...localPersonalInfo, placeOfBirth: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                    <MultiSelectDropdown
                      label="Citizenship"
                      options={citizenshipOptions}
                      value={localPersonalInfo?.citizenship || []}
                      onChange={(selected) => setLocalPersonalInfo({...localPersonalInfo, citizenship: selected})}
                      disabled={savingSection === 'personal'}
                    />
                  </>
                )}
              </div>
            )}
          </div>

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
                  text={savingSection === 'personal' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'personal'}
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

const PersonalInfoSection = ({ 
  personalInfo = {}, 
  setPersonalInfo, 
  familyInfo,
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  savePersonalInfo, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  const safePersonalInfo = personalInfo || {};
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [pendingSave, setPendingSave] = useState(false);

  // Get effective member category for debugging
  const effectiveMemberCategory = getEffectiveMemberCategory(memberCategory);
  const canEditSSN = effectiveMemberCategory === 'CryoApplicant' && !safePersonalInfo?.ssn;

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

  // Field configuration for completion wheel
  const fieldConfig = {
    required: {
      gender: { field: 'gender', source: 'personalInfo', label: 'Sex' },
      birthName: { field: 'birthName', source: 'personalInfo', label: 'Birth Name' },
      ssn: { field: 'ssn', source: 'personalInfo', label: 'SSN/Government ID' },
      race: { field: 'race', source: 'personalInfo', label: 'Race' },
      maritalStatus: { field: 'maritalStatus', source: 'personalInfo', label: 'Marital Status' },
      placeOfBirth: { field: 'placeOfBirth', source: 'personalInfo', label: 'Place of Birth' },
      citizenship: { field: 'citizenship', source: 'personalInfo', label: 'Citizenship' }
    },
    recommended: {
      ethnicity: { field: 'ethnicity', source: 'personalInfo', label: 'Ethnicity' }
    }
  };

  // Clean citizenship data to remove duplicates and normalize "United States"
  useEffect(() => {
    if (safePersonalInfo.citizenship && Array.isArray(safePersonalInfo.citizenship)) {
      // Normalize "United States" to "United States of America"
      const normalizedCitizenship = safePersonalInfo.citizenship.map(country => 
        country === "United States" ? "United States of America" : country
      );
      const uniqueCitizenship = [...new Set(normalizedCitizenship)];
      if (uniqueCitizenship.length !== safePersonalInfo.citizenship.length || 
          normalizedCitizenship.some((c, i) => c !== safePersonalInfo.citizenship[i])) {
        setPersonalInfo({...safePersonalInfo, citizenship: uniqueCitizenship});
      }
    }
  }, [safePersonalInfo.citizenship]);

  // Trigger save after state update from overlay
  useEffect(() => {
    if (pendingSave) {
      savePersonalInfo();
      setPendingSave(false);
    }
  }, [pendingSave]);
  /*useEffect(() => {
    if (pendingSave) {
      savePersonalInfo();
      setPendingSave(false);
    }
  }, [pendingSave, personalInfo]);*/

  const formatSSN = (ssn) => {
    if (!ssn) return '—';
    if (ssn.includes('*')) return ssn;
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return '—';
  };

  const formatMultipleSelections = (selections) => {
    if (!selections || selections.length === 0) return '—';
    return selections.join(', ');
  };

  const raceOptions = [
    "American Indian or Alaska Native",
    "Asian",
    "Black or African American",
    "Hispanic or Latino",
    "Native Hawaiian or Other Pacific Islander",
    "White or Caucasian",
    "Multiracial",
    "Middle Eastern",
    "Prefer Not to Say",
    "Other"
  ];

  const citizenshipOptions = [
    "United States of America",
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Côte d'Ivoire",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czechia (Czech Republic)",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini (fmr. \"Swaziland\")",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Holy See",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (formerly Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine State",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe"
  ];

  const ethnicityOptions = [
    { value: "Hispanic or Latino", label: "Hispanic or Latino" },
    { value: "Not Hispanic or Latino", label: "Not Hispanic or Latino" }
  ];

  const maritalStatusOptions = [
    { value: "", label: "Select..." },
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Separated", label: "Separated" },
    { value: "Widowed", label: "Widowed" },
    { value: "Widower", label: "Widower" },
    { value: "Domestic Partner", label: "Domestic Partner" },
    { value: "Significant Other", label: "Significant Other" }
  ];

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = (updatedPersonalInfo) => {
    // Use React 18's automatic batching
    ReactDOM.flushSync(() => {
      setPersonalInfo(updatedPersonalInfo);
    });
    // Set flag to trigger save after state updates
    setPendingSave(true);
  };

  return (
    <div ref={sectionRef} className={`personal-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ personalInfo: safePersonalInfo }}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        memberCategory={memberCategory}
      />
      
      {isMobile ? (
        <PersonalInfoMobile
          personalInfo={safePersonalInfo}
          setPersonalInfo={setPersonalInfo}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          savePersonalInfo={savePersonalInfo}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          fieldConfig={fieldConfig}
          memberCategory={memberCategory}
        />
      ) : (
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            <div className={headerStyles.container}>
              <div className="w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'personal')} style={{ backgroundColor: '#512BD9' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Personal Information</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'personal')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            Additional personal details for your member file.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Required: Sex, Birth Name, SSN/Government ID, Race, Marital Status, Place of Birth, Citizenship
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-1">
                            Recommended: Ethnicity
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ personalInfo: safePersonalInfo }}
                    fieldConfig={fieldConfig}
                    sectionColor="#512BD9"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white">
              {!editMode.personal ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <InfoCard 
                    title="Identity Details" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    }
                    sectionKey="identity"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('identity')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('identity')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Birth Name" value={personalInfo?.birthName || 'Same as current'} isRequired />
                    <InfoField label="SSN/Government ID" value={formatSSN(personalInfo?.ssn)} isRequired />
                    <InfoField label="Sex" value={personalInfo?.gender || '—'} isRequired />
                  </InfoCard>

                  <InfoCard 
                    title="Demographics" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    sectionKey="demographics"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('demographics')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('demographics')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Race" value={formatMultipleSelections(personalInfo?.race)} isRequired />
                    <InfoField label="Ethnicity" value={personalInfo?.ethnicity || '—'} isRecommended />
                    <InfoField label="Marital Status" value={personalInfo?.maritalStatus || '—'} isRequired />
                  </InfoCard>

                  <InfoCard 
                    title="Origin & Citizenship" 
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    sectionKey="origin"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('origin')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('origin')}
                    cardIndex={2}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Place of Birth" value={personalInfo?.placeOfBirth || '—'} isRequired />
                    <InfoField label="Citizenship" value={formatMultipleSelections(personalInfo?.citizenship)} isRequired />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCard>
                </div>
              ) : (
                <div className="max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Birth Name"
                      type="text"
                      value={personalInfo.birthName || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                      disabled={savingSection === 'personal'}
                      placeholder="Same as current"
                    />
                    
                    <StyledSelect
                      label="Sex *"
                      value={personalInfo.gender || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
                      disabled={savingSection === 'personal'}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </StyledSelect>
                    
                    {canEditSSN ? (
                      <Input
                        containerClassName="col-span-2"
                        label="SSN/Government ID *"
                        type="text"
                        value={personalInfo.ssn || ''}
                        onChange={(e) => setPersonalInfo({...personalInfo, ssn: e.target.value})}
                        disabled={savingSection === 'personal'}
                        error={fieldErrors.ssn}
                      />
                    ) : (
                      <div className="col-span-2">
                        <label className={styleConfig2.form.label}>SSN/Government ID *</label>
                        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                          {formatSSN(personalInfo.ssn)}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Contact Alcor to update SSN</p>
                      </div>
                    )}
                    
                    <MultiSelectDropdown
                      label="Race"
                      options={raceOptions}
                      value={personalInfo.race || []}
                      onChange={(selected) => setPersonalInfo({...personalInfo, race: selected})}
                      disabled={savingSection === 'personal'}
                    />
                    
                    <SingleSelectDropdown
                      label="Ethnicity"
                      options={ethnicityOptions}
                      value={personalInfo.ethnicity || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                    
                    <MultiSelectDropdown
                      label="Citizenship"
                      options={citizenshipOptions}
                      value={personalInfo.citizenship || []}
                      onChange={(selected) => setPersonalInfo({...personalInfo, citizenship: selected})}
                      disabled={savingSection === 'personal'}
                    />
                    
                    <Input
                      label="Place of Birth"
                      type="text"
                      value={personalInfo.placeOfBirth || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                    
                    <SingleSelectDropdown
                      label="Marital Status"
                      options={maritalStatusOptions}
                      value={personalInfo.maritalStatus || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                  </div>
                </div>
              )}
              
              <div className={buttonStyles.actionContainer}>
                {editMode?.personal ? (
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('personal')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText?.(savingSection) || (savingSection === 'personal' ? 'Saving...' : 'Save')}
                      onClick={savePersonalInfo}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'personal'}
                    />
                  </div>
                ) : (
                  <WhiteButton
                    text="Edit"
                    onClick={() => toggleEditMode && toggleEditMode('personal')}
                    className={buttonStyles.whiteButton.base}
                    spinStar={buttonStyles.starConfig.enabled}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSection;