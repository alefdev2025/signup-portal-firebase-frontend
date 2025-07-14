import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
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

// Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, personalInfo, setPersonalInfo, savePersonalInfo }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in display mode
      setShowSuccess(false);
    }
  }, [isOpen]);

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
    return selections.join(', ');
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = () => {
    savePersonalInfo();
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    setPersonalInfo(data.personalInfo);
    setEditMode(false);
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'identity':
        return {
          title: 'Identity Details',
          description: 'Your personal identification information including birth name, government ID, and gender identity.',
          fields: {
            'Birth Name': 'Your name at birth if different from your current legal name.',
            'SSN/Government ID': 'Your Social Security Number or government-issued identification number.',
            'Gender': 'Your gender identity.'
          }
        };
      case 'demographics':
        return {
          title: 'Demographics',
          description: 'Demographic information that helps us better understand our member community and ensure inclusive services.',
          fields: {
            'Race': 'Your racial background (you may select multiple options).',
            'Ethnicity': 'Your ethnic heritage.',
            'Marital Status': 'Your current marital or relationship status.'
          }
        };
      case 'origin':
        return {
          title: 'Origin & Citizenship',
          description: 'Information about your place of birth and citizenship status, which may be relevant for legal documentation.',
          fields: {
            'Place of Birth': 'The city, state/province, and country where you were born.',
            'Citizenship': 'Countries where you hold citizenship (you may select multiple).'
          }
        };
      default:
        return { title: '', description: '', fields: {} };
    }
  };

  const fieldInfo = getFieldDescriptions();

  // Race options
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

  // Citizenship options - Full list from mobile
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

  // Ethnicity options
  const ethnicityOptions = [
    { value: "Hispanic or Latino", label: "Hispanic or Latino" },
    { value: "Not Hispanic or Latino", label: "Not Hispanic or Latino" }
  ];

  // Marital Status options
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
              <div className="space-y-6">
                {section === 'identity' && (
                  <>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Birth Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.birthName || personalInfo?.birthName === 'Same as current')}
                        >
                          {personalInfo?.birthName || 'Same as current'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>SSN/Government ID</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.ssn)}
                        >
                          {formatSSN(personalInfo?.ssn)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Gender</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.gender)}
                      >
                        {personalInfo?.gender || '—'}
                      </p>
                    </div>
                  </>
                )}

                {section === 'demographics' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Race</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.race || personalInfo?.race?.length === 0)}
                      >
                        {formatMultipleSelections(personalInfo?.race)}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Ethnicity</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.ethnicity)}
                      >
                        {personalInfo?.ethnicity || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Marital Status</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.maritalStatus)}
                      >
                        {personalInfo?.maritalStatus || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'origin' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Place of Birth</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.placeOfBirth)}
                      >
                        {personalInfo?.placeOfBirth || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Citizenship</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!personalInfo?.citizenship || personalInfo?.citizenship?.length === 0)}
                      >
                        {formatMultipleSelections(personalInfo?.citizenship)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {section === 'identity' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Birth Name"
                        type="text"
                        value={personalInfo?.birthName || ''}
                        onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                        disabled={savingSection === 'personal'}
                        placeholder="Same as current"
                      />
                      <StyledSelect
                        label="Gender *"
                        value={personalInfo?.gender || ''}
                        onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
                        disabled={savingSection === 'personal'}
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </StyledSelect>
                    </div>
                  </>
                )}

                {section === 'demographics' && (
                  <>
                    <MultiSelectDropdown
                      label="Race"
                      options={raceOptions}
                      value={personalInfo?.race || []}
                      onChange={(selected) => setPersonalInfo({...personalInfo, race: selected})}
                      disabled={savingSection === 'personal'}
                    />
                    <SingleSelectDropdown
                      label="Ethnicity"
                      options={ethnicityOptions}
                      value={personalInfo?.ethnicity || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                    <SingleSelectDropdown
                      label="Marital Status"
                      options={maritalStatusOptions}
                      value={personalInfo?.maritalStatus || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                  </>
                )}

                {section === 'origin' && (
                  <>
                    <Input
                      label="Place of Birth"
                      type="text"
                      value={personalInfo?.placeOfBirth || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
                      disabled={savingSection === 'personal'}
                    />
                    <MultiSelectDropdown
                      label="Citizenship"
                      options={citizenshipOptions}
                      value={personalInfo?.citizenship || []}
                      onChange={(selected) => setPersonalInfo({...personalInfo, citizenship: selected})}
                      disabled={savingSection === 'personal'}
                    />
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

// Modified InfoCard component with View More link
const InfoCardWithViewMore = ({ title, icon, sectionKey, hoveredSection, onMouseEnter, onMouseLeave, onClick, children, viewMoreCount = 3, cardIndex, isVisible }) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, viewMoreCount);
  const hasMore = childrenArray.length > viewMoreCount;

  return (
    <InfoCard 
      title={title} 
      icon={icon}
      sectionKey={sectionKey}
      hoveredSection={hoveredSection}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      cardIndex={cardIndex}
      isVisible={isVisible}
    >
      {visibleChildren}
      {hasMore && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
          >
            View More
          </button>
        </div>
      )}
    </InfoCard>
  );
};

const MultiSelectDropdown = ({ label, options, value = [], onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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
    
    onChange(newValue);
  };

  const displayValue = value.length > 0 
    ? value.join(', ') 
    : 'Select...';

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
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={value.includes(option)}
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

// Mobile Multi-select component - Simple checkbox list
const MobileMultiSelect = ({ label, options, value = [], onChange, disabled = false }) => {
  const [showAll, setShowAll] = useState(false);
  
  const toggleOption = (option) => {
    if (disabled) return;
    
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    
    onChange(newValue);
  };

  // For Race, show all options. For Citizenship, show limited options unless expanded
  const isRace = label.includes('Race');
  const displayOptions = isRace || showAll ? options : options.slice(0, 5);

  return (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
      <div className="border border-gray-300 rounded-lg bg-gray-50 p-3 max-h-48 overflow-y-auto">
        {displayOptions.map((option) => (
          <label
            key={option}
            className="flex items-center py-1.5 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => toggleOption(option)}
              disabled={disabled}
              className="mr-2.5 w-4 h-4 rounded border-gray-300 text-[#162740] focus:ring-2 focus:ring-[#162740]/20"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
        {!isRace && options.length > 5 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm text-[#162740] mt-2 underline"
          >
            Show all {options.length} options
          </button>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-600 mt-1">
          {value.length} selected
        </p>
      )}
    </div>
  );
};

// Single-select dropdown component for desktop
const SingleSelectDropdown = ({ label, options, value = '', onChange, disabled = false, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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

const PersonalInfoSection = ({ 
  personalInfo, 
  setPersonalInfo, 
  familyInfo,
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  savePersonalInfo, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    // Inject animation styles
    const style = animationStyles.injectStyles();
    
    setTimeout(() => setHasLoaded(true), 100);
    
    // Setup scroll trigger instead of automatic animation
    const observer = animationStyles.helpers.setupScrollTrigger(sectionRef, () => {
      // Trigger card animations when section comes into view
      setTimeout(() => setCardsVisible(true), 100);
    });
    
    return () => {
      document.head.removeChild(style);
      if (observer) observer.disconnect();
    };
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mapping functions for citizenship values
  const mapCitizenshipFromBackend = (backendValue) => {
    const mapping = {
      'United States of America': 'United States',
      'USA': 'United States',
      'US': 'United States',
      // Add more mappings as needed
    };
    return mapping[backendValue] || backendValue;
  };

  const mapCitizenshipToBackend = (frontendValue) => {
    const mapping = {
      'United States': 'United States of America',
      // Add more mappings as needed
    };
    return mapping[frontendValue] || frontendValue;
  };

  // Format SSN for display (show only last 4 digits)
  const formatSSN = (ssn) => {
    if (!ssn) return '—';
    // If SSN is already masked, return it
    if (ssn.includes('*')) return ssn;
    // Otherwise mask it
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return '—';
  };

  // Format multiple selections for display
  const formatMultipleSelections = (selections) => {
    if (!selections || selections.length === 0) return '—';
    return selections.join(', ');
  };

  // Race options - Updated to match Salesforce picklist
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

  // Citizenship options
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

  // Ethnicity options
  const ethnicityOptions = [
    { value: "Hispanic or Latino", label: "Hispanic or Latino" },
    { value: "Not Hispanic or Latino", label: "Not Hispanic or Latino" }
  ];

  // Marital Status options - Updated based on Salesforce picklist values
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

  // Map citizenship values for display
  const mappedCitizenshipValue = personalInfo.citizenship 
    ? personalInfo.citizenship.map(mapCitizenshipFromBackend)
    : [];

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = () => {
    savePersonalInfo();
  };

  return (
    <div ref={sectionRef} className={`personal-info-section ${animationStyles.classes.scrollTriggerSection} ${hasLoaded ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ personalInfo }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={{}}
        personalInfo={personalInfo}
        setPersonalInfo={setPersonalInfo}
        savePersonalInfo={savePersonalInfo}
      />
      
      {isMobile ? (
        /* Mobile Version - Keeping original mobile implementation */
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Personal Information"
          backgroundImage={formsHeaderImage}
          overlayText="Personal Details"
          subtitle="Additional personal details for your member file."
          isEditMode={editMode.personal}
        >
          {/* Display Mode */}
          {!editMode.personal ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Birth Name" value={personalInfo.birthName || 'Same as current'} />
                  <DisplayField label="SSN/Gov ID" value={formatSSN(personalInfo.ssn)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Gender" value={personalInfo.gender} />
                  <DisplayField label="Marital Status" value={personalInfo.maritalStatus} />
                </div>
                
                <DisplayField label="Race" value={formatMultipleSelections(personalInfo.race)} />
                
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Ethnicity" value={personalInfo.ethnicity} />
                  <DisplayField label="Place of Birth" value={personalInfo.placeOfBirth} />
                </div>
                
                <DisplayField label="Citizenship" value={formatMultipleSelections(personalInfo.citizenship)} />
              </div>
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('personal')}
              />
            </>
          ) : (
            /* Edit Mode */
            <div className="w-full overflow-x-hidden">
              <FormInput
                label="Birth Name"
                value={personalInfo.birthName || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                placeholder="Same as current"
              />
              
              <FormSelect
                label="Gender *"
                value={personalInfo.gender || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </FormSelect>
              
              <FormSelect
                label="Marital Status"
                value={personalInfo.maritalStatus || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Separated">Separated</option>
                <option value="Widowed">Widowed</option>
                <option value="Widower">Widower</option>
                <option value="Domestic Partner">Domestic Partner</option>
                <option value="Significant Other">Significant Other</option>
              </FormSelect>
              
              <MobileMultiSelect
                label="Race"
                options={raceOptions}
                value={personalInfo.race || []}
                onChange={(selected) => setPersonalInfo({...personalInfo, race: selected})}
              />
              
              <FormInput
                label="Place of Birth"
                value={personalInfo.placeOfBirth || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
              />
              
              <MobileMultiSelect
                label="Citizenship"
                options={citizenshipOptions}
                value={mappedCitizenshipValue}
                onChange={(selected) => {
                  const backendValues = selected.map(mapCitizenshipToBackend);
                  setPersonalInfo({...personalInfo, citizenship: backendValues});
                }}
              />
              
              <ActionButtons 
                editMode={true}
                onSave={savePersonalInfo}
                onCancel={() => cancelEdit && cancelEdit('personal')}
                saving={savingSection === 'personal'}
              />
            </div>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop Version - Using imported styles */
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Header Section */}
            <div className={headerStyles.container}>
              <div className={headerStyles.contentWrapper}>
                <div className={headerStyles.leftContent}>
                  <div className={headerStyles.iconTextWrapper(styleConfig2)}>
                    <div className={headerStyles.getIconContainer(styleConfig2, 'personal')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Personal Information</h2>
                      <p className={headerStyles.subtitle}>
                        Additional personal details for your member file.
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
                      {/* Dark purple/blue overlay base */}
                      <div 
                        className={sectionImageStyles.overlays.darkBase.className} 
                        style={sectionImageStyles.overlays.darkBase.style}
                      ></div>
                      {/* Radial yellow glow from bottom */}
                      <div 
                        className={sectionImageStyles.overlays.yellowGlow.className} 
                        style={sectionImageStyles.overlays.yellowGlow.style}
                      ></div>
                      {/* Purple/pink glow overlay */}
                      <div 
                        className={sectionImageStyles.overlays.purpleGlow.className} 
                        style={sectionImageStyles.overlays.purpleGlow.style}
                      ></div>
                      {/* Large star positioned lower */}
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
              {!editMode.personal ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Identity Card */}
                  <InfoCardWithViewMore 
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
                    viewMoreCount={3}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Birth Name" value={personalInfo?.birthName || 'Same as current'} />
                    <InfoField label="SSN/Government ID" value={formatSSN(personalInfo?.ssn)} />
                    <InfoField label="Gender" value={personalInfo?.gender || '—'} />
                  </InfoCardWithViewMore>

                  {/* Demographics Card */}
                  <InfoCardWithViewMore 
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
                    viewMoreCount={3}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Race" value={formatMultipleSelections(personalInfo?.race)} />
                    <InfoField label="Ethnicity" value={personalInfo?.ethnicity || '—'} />
                    <InfoField label="Marital Status" value={personalInfo?.maritalStatus || '—'} />
                  </InfoCardWithViewMore>

                  {/* Origin Card */}
                  <InfoCardWithViewMore 
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
                    viewMoreCount={3}
                    cardIndex={2}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Place of Birth" value={personalInfo?.placeOfBirth || '—'} />
                    <InfoField label="Citizenship" value={formatMultipleSelections(personalInfo?.citizenship)} />
                    <div className="opacity-0 pointer-events-none">
                      <InfoField label="" value="" />
                    </div>
                  </InfoCardWithViewMore>
                </div>
              ) : (
                /* Edit Mode - Using same style as ContactInfoSection */
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
                      label="Gender *"
                      value={personalInfo.gender || ''}
                      onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
                      disabled={savingSection === 'personal'}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </StyledSelect>
                    
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
                      value={mappedCitizenshipValue}
                      onChange={(selected) => {
                        // Map back to backend format when saving
                        const backendValues = selected.map(mapCitizenshipToBackend);
                        setPersonalInfo({...personalInfo, citizenship: backendValues});
                      }}
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
              
              {/* Action buttons */}
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
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={savePersonalInfo}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
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