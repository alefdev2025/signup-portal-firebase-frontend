import React, { useState, useRef, useEffect } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';

// Multi-select dropdown component
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
      <label className={styleConfig.form.label}>{label}</label>
      <div
        className={`${styleConfig.input.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

// Single-select dropdown component (like multi-select but for single selection)
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
      <label className={styleConfig.form.label}>{label}</label>
      <div
        className={`${styleConfig.input.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "", isPlaceholder = false }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.value}>{value || styleConfig.display.item.empty}</dd>
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
  savingSection 
}) => {
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
    if (!ssn) return styleConfig.display.item.empty;
    // If SSN is already masked, return it
    if (ssn.includes('*')) return ssn;
    // Otherwise mask it
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `***-**-${cleaned.slice(-4)}`;
    }
    return styleConfig.display.item.empty;
  };

  // Format multiple selections for display
  const formatMultipleSelections = (selections) => {
    if (!selections || selections.length === 0) return styleConfig.display.item.empty;
    return selections.join(', ');
  };

  // Race options
  const raceOptions = [
    "American Indian or Alaska Native",
    "Asian",
    "Black or African American",
    "Native Hawaiian or Other Pacific Islander",
    "White",
    "Other"
  ];

  // Citizenship options
  const citizenshipOptions = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "China",
    "India",
    "Other"
  ];

  // Ethnicity options
  const ethnicityOptions = [
    { value: "", label: "Select..." },
    { value: "Hispanic or Latino", label: "Hispanic or Latino" },
    { value: "Not Hispanic or Latino", label: "Not Hispanic or Latino" }
  ];

  // Marital Status options
  const maritalStatusOptions = [
    { value: "", label: "Select..." },
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Widowed", label: "Widowed" }
  ];

  // Map citizenship values for display
  const mappedCitizenshipValue = personalInfo.citizenship 
    ? personalInfo.citizenship.map(mapCitizenshipFromBackend)
    : [];

  return (
    <div className="bg-white rounded-2xl sm:rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] sm:shadow-md border border-gray-500 sm:border-gray-200 mb-6 sm:mb-8 -mx-1 sm:mx-0">
      <div className="px-4 py-6 sm:p-6 md:p-8">
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.personal}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Personal Information</h2>
            <p className={styleConfig.header.subtitle}>
              Additional personal details for your member file.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.personal ? (
          <dl className={styleConfig.display.dl.wrapperThree}>
            <div>
              <dt className={styleConfig.display.item.label}>Birth Name</dt>
              <dd className={styleConfig.display.item.value}>
                {personalInfo.birthName || 'Same as current'}
              </dd>
            </div>
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
        ) : (
          /* Edit Mode - Form */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Input
              label="Birth Name"
              type="text"
              value={personalInfo.birthName || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
              disabled={!editMode.personal}
              placeholder="Same as current"
            />
            
            <Input
              label="SSN/Government ID Number"
              type="text"
              value={personalInfo.ssn || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, ssn: e.target.value})}
              disabled={!editMode.personal}
              placeholder="XXX-XX-XXXX"
            />
            
            <Select
              label="Gender *"
              value={personalInfo.gender || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
              disabled={!editMode.personal}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            
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
        )}
        
        <ButtonGroup>
          {editMode.personal ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('personal')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={savePersonalInfo}
                loading={savingSection === 'personal'}
                disabled={savingSection === 'personal'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('personal')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default PersonalInfoSection;