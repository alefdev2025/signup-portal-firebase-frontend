import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';

// Multi-select dropdown component for desktop
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

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "", isPlaceholder = false }) => (
  <div className={className}>
    <dt className={styleConfig2.display.item.label}>{label}</dt>
    <dd 
      className="text-gray-900" 
      style={{ 
        WebkitTextStroke: '0.6px #1f2937',
        fontWeight: 400,
        letterSpacing: '0.01em',
        fontSize: '15px'
      }}
    >
      {value || styleConfig2.display.item.empty}
    </dd>
  </div>
);

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
  sectionImage,  // Add this prop
  sectionLabel   // Add this prop
}) => {
  // Add state for mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    console.log('🔍 === PersonalInfoSection RENDER ===');
    console.log('📋 Props received:', {
      personalInfo: personalInfo,
      ethnicity: personalInfo?.ethnicity,
      citizenship: personalInfo?.citizenship,
      maritalStatus: personalInfo?.maritalStatus,
      hasAllData: !!(personalInfo?.ethnicity || personalInfo?.citizenship || personalInfo?.maritalStatus)
    });
    console.log('🔍 === END PersonalInfoSection ===\n');
  }, [personalInfo]);
  
  // Debug ethnicity specifically in edit mode
  useEffect(() => {
    if (editMode.personal && isMobile) {
      console.log('📱 Mobile Edit Mode - Ethnicity value:', personalInfo?.ethnicity);
      console.log('📱 Type of ethnicity:', typeof personalInfo?.ethnicity);
      console.log('📱 Exact value with quotes:', `"${personalInfo?.ethnicity}"`);
    }
  }, [editMode.personal, personalInfo?.ethnicity, isMobile]);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add loading animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .personal-section-fade-in {
        animation: personalFadeIn 0.8s ease-out forwards;
      }
      .personal-section-slide-in {
        animation: personalSlideIn 0.8s ease-out forwards;
      }
      .personal-section-stagger-in > * {
        opacity: 0;
        animation: personalSlideIn 0.5s ease-out forwards;
      }
      .personal-section-stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .personal-section-stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .personal-section-stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .personal-section-stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      .personal-section-stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
      .personal-section-stagger-in > *:nth-child(6) { animation-delay: 0.3s; }
      .personal-section-stagger-in > *:nth-child(7) { animation-delay: 0.35s; }
      .personal-section-stagger-in > *:nth-child(8) { animation-delay: 0.4s; }
      .personal-section-stagger-in > *:nth-child(9) { animation-delay: 0.45s; }
      .personal-section-stagger-in > *:nth-child(10) { animation-delay: 0.5s; }
      .personal-section-stagger-in > *:nth-child(11) { animation-delay: 0.55s; }
      .personal-section-stagger-in > *:nth-child(12) { animation-delay: 0.6s; }
      .personal-section-stagger-in > *:nth-child(13) { animation-delay: 0.65s; }
      .personal-section-stagger-in > *:nth-child(14) { animation-delay: 0.7s; }
      .personal-section-stagger-in > *:nth-child(15) { animation-delay: 0.75s; }
      .personal-section-stagger-in > *:nth-child(16) { animation-delay: 0.8s; }
      @keyframes personalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes personalSlideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
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
          setTimeout(() => setHasLoaded(true), 100);
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
    if (!ssn) return styleConfig2.display.item.empty;
    // If SSN is already masked, return it
    if (ssn.includes('*')) return ssn;
    // Otherwise mask it
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return styleConfig2.display.item.empty;
  };

  // Format multiple selections for display
  const formatMultipleSelections = (selections) => {
    if (!selections || selections.length === 0) return styleConfig2.display.item.empty;
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
    { value: "Widowed", label: "Widowed" },  // This will be mapped to "Widow" in backend
    { value: "Widower", label: "Widower" },
    { value: "Domestic Partner", label: "Domestic Partner" },
    { value: "Significant Other", label: "Significant Other" }
  ];

  // Map citizenship values for display
  const mappedCitizenshipValue = personalInfo.citizenship 
    ? personalInfo.citizenship.map(mapCitizenshipFromBackend)
    : [];

  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (personalInfo?.gender) {
      previewParts.push(personalInfo.gender);
    }
    if (personalInfo?.maritalStatus) {
      previewParts.push(personalInfo.maritalStatus);
    }
    if (personalInfo?.ethnicity) {
      previewParts.push(personalInfo.ethnicity);
    }
    if (personalInfo?.citizenship && personalInfo.citizenship.length > 0) {
      const citizenshipDisplay = personalInfo.citizenship.length === 1 
        ? mapCitizenshipFromBackend(personalInfo.citizenship[0])
        : `${personalInfo.citizenship.length} citizenships`;
      previewParts.push(citizenshipDisplay);
    }
    if (personalInfo?.placeOfBirth) {
      previewParts.push(personalInfo.placeOfBirth);
    }
    
    return previewParts.slice(0, 3).join(' • '); // Return as string with bullet separators
  };

  return (
    <div ref={sectionRef} className={`${isMobile ? "" : styleConfig2.section.wrapperEnhanced} ${hasLoaded && isVisible ? 'personal-section-fade-in' : 'opacity-0'}`}>
      {isMobile ? (
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
              <div className={`space-y-4 ${hasLoaded && isVisible ? 'personal-section-stagger-in' : ''}`}>
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
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('Mobile Place of Birth onChange:', newValue);
                  console.log('Current state before update:', personalInfo);
                  const updatedInfo = {...personalInfo, placeOfBirth: newValue};
                  console.log('State after update:', updatedInfo);
                  setPersonalInfo(updatedInfo);
                }}
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
        /* Desktop view */
        <div className={styleConfig2.section.innerPadding}>
          {/* Desktop Header Section */}
          <div className={`relative pb-6 mb-6 border-b border-gray-200 ${hasLoaded && isVisible ? 'personal-section-slide-in' : ''}`}>
            {/* Header content */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className={styleConfig2.header.wrapper}>
                  <div className={styleConfig2.sectionIcons.personal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig2.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className={styleConfig2.header.textContainer}>
                    <h2 className={styleConfig2.header.title}>Personal Information</h2>
                    <p className="text-gray-600 text-base mt-1">
                      Additional personal details for your member file.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Image on right side */}
              {sectionImage && (
                <div className="flex-shrink-0 ml-8">
                  <div className="relative w-64 h-24 rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={sectionImage} 
                      alt="" 
                      className="w-full h-full object-cover grayscale"
                    />
                    {sectionLabel && (
                      <div className="absolute bottom-0 right-0">
                        <div className="px-2.5 py-0.5 bg-gradient-to-r from-[#162740] to-[#6e4376]">
                          <p className="text-white text-xs font-medium tracking-wider flex items-center gap-1">
                            {sectionLabel}
                            <img src={alcorStar} alt="" className="w-3 h-3" />
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Content - Fields Section */}
          <div className="bg-white">
            {/* Display Mode */}
            {!editMode.personal ? (
              <div className={`max-w-2xl ${hasLoaded && isVisible ? 'personal-section-stagger-in' : ''}`}>
                <dl className={styleConfig2.display.dl.wrapperThree}>
                  <InfoDisplay 
                    label="Birth Name" 
                    value={personalInfo.birthName || 'Same as current'} 
                  />
                  <InfoDisplay 
                    label="SSN/Government ID Number" 
                    value={formatSSN(personalInfo.ssn)} 
                  />
                  <InfoDisplay 
                    label="Gender" 
                    value={personalInfo.gender} 
                  />
                  <InfoDisplay 
                    label="Race" 
                    value={formatMultipleSelections(personalInfo.race)} 
                  />
                  <InfoDisplay 
                    label="Ethnicity" 
                    value={personalInfo.ethnicity} 
                  />
                  <InfoDisplay 
                    label="Citizenship" 
                    value={formatMultipleSelections(personalInfo.citizenship)} 
                  />
                  <InfoDisplay 
                    label="Place of Birth" 
                    value={personalInfo.placeOfBirth} 
                  />
                  <InfoDisplay 
                    label="Marital Status" 
                    value={personalInfo.maritalStatus} 
                  />
                </dl>
              </div>
            ) : (
              /* Edit Mode - Form */
              <div className="max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Birth Name"
                    type="text"
                    value={personalInfo.birthName || ''}
                    onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                    disabled={!editMode.personal}
                    placeholder="Same as current"
                  />
                  
                  <StyledSelect
                    label="Gender *"
                    value={personalInfo.gender || ''}
                    onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
                    disabled={!editMode.personal}
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
                    disabled={!editMode.personal}
                  />
                  
                  <SingleSelectDropdown
                    label="Ethnicity"
                    options={ethnicityOptions}
                    value={personalInfo.ethnicity || ''}
                    onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
                    disabled={!editMode.personal}
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
                    disabled={!editMode.personal}
                  />
                  
                  <Input
                    label="Place of Birth"
                    type="text"
                    value={personalInfo.placeOfBirth || ''}
                    onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
                    disabled={!editMode.personal}
                  />
                  
                  <SingleSelectDropdown
                    label="Marital Status"
                    options={maritalStatusOptions}
                    value={personalInfo.maritalStatus || ''}
                    onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
                    disabled={!editMode.personal}
                  />
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 -mr-8">
              {editMode?.personal ? (
                <div className="flex">
                  <WhiteButton
                    text="Cancel"
                    onClick={() => cancelEdit && cancelEdit('personal')}
                    className="scale-75 -mr-8"
                    spinStar={false}
                  />
                  <PurpleButton
                    text={savingSection === 'saved' ? 'Saved' : savingSection === 'personal' ? 'Saving...' : 'Save'}
                    onClick={savePersonalInfo}
                    className="scale-75"
                    spinStar={false}
                  />
                </div>
              ) : (
                <RainbowButton
                  text="Edit"
                  onClick={() => toggleEditMode && toggleEditMode('personal')}
                  className="scale-75"
                  spinStar={true}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSection;