import React, { useState, useRef, useEffect } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';

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
      <label className={styleConfig2.form.label}>{label}</label>
      <div
        className={`${styleConfig2.input.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

// Mobile Multi-select component
const MobileMultiSelect = ({ label, options, value = [], onChange, disabled = false }) => {
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
    
    onChange(newValue);
  };

  const displayValue = value.length > 0 
    ? value.join(', ') 
    : 'Select...';

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
      <div
        className={`w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                className="mr-2 w-4 h-4 rounded border-gray-300 text-[#162740] focus:ring-2 focus:ring-[#162740]/20 accent-[#162740]"
              />
              <span className="ml-2 text-gray-700">{option}</span>
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
      <label className={styleConfig2.form.label}>{label}</label>
      <div
        className={`${styleConfig2.input.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    <dt className={styleConfig2.display.item.label}>{label}</dt>
    <dd className={styleConfig2.display.item.value}>{value || styleConfig2.display.item.empty}</dd>
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
  // Add state for mobile collapse
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
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
    <div className={isMobile ? "" : styleConfig2.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Personal Information"
          preview={getMobilePreview()}
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
            <>
              <div className="space-y-4">
                <FormInput
                  label="Birth Name"
                  value={personalInfo.birthName || ''}
                  onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                  placeholder="Same as current"
                />
                
                <FormInput
                  label="SSN/Government ID Number"
                  value={personalInfo.ssn || ''}
                  onChange={(e) => setPersonalInfo({...personalInfo, ssn: e.target.value})}
                  placeholder="XXX-XX-XXXX"
                />
                
                <div className="grid grid-cols-2 gap-4">
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
                    <option value="Widowed">Widowed</option>
                  </FormSelect>
                </div>
                
                <MobileMultiSelect
                  label="Race"
                  options={raceOptions}
                  value={personalInfo.race || []}
                  onChange={(selected) => setPersonalInfo({...personalInfo, race: selected})}
                />
                
                <FormSelect
                  label="Ethnicity"
                  value={personalInfo.ethnicity || ''}
                  onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="Hispanic or Latino">Hispanic or Latino</option>
                  <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
                </FormSelect>
                
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
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={savePersonalInfo}
                onCancel={() => cancelEdit && cancelEdit('personal')}
                saving={savingSection === 'personal'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig2.section.innerPadding}>
          {/* Desktop Header */}
          <div className={styleConfig2.header.wrapper}>
            <div className={styleConfig2.sectionIcons.personal}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig2.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className={styleConfig2.header.textContainer}>
              <h2 className={styleConfig2.header.title}>Personal Information</h2>
              <p className={styleConfig2.header.subtitle}>
                Additional personal details for your member file.
              </p>
            </div>
          </div>

          {/* Desktop Content */}
          {/* Display Mode */}
          {!editMode.personal ? (
            <dl className={styleConfig2.display.dl.wrapperThree}>
              <div>
                <dt className={styleConfig2.display.item.label}>Birth Name</dt>
                <dd className={styleConfig2.display.item.value}>
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
            <div className={styleConfig2.section.grid.twoColumn}>
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
          
          <div className="flex justify-end mt-6">
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
      )}
    </div>
  );
};

export default PersonalInfoSection;