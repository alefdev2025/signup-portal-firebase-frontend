// PersonalInfoMobile.js
import React, { useState } from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';

// Mobile Multi-Select Component
const MobileMultiSelect = ({ label, options, value = [], onChange, disabled = false }) => {
  const [showAll, setShowAll] = useState(false);
  
  const toggleOption = (option) => {
    if (disabled) return;
    
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    
    // Remove duplicates
    const uniqueValue = [...new Set(newValue)];
    onChange(uniqueValue);
  };

  const isRace = label.includes('Race');
  
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
  
  const displayOptions = isRace || showAll ? sortedOptions : sortedOptions.slice(0, 5);

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
              checked={value.includes(option) || (option === "United States of America" && value.includes("United States"))}
              onChange={() => toggleOption(option)}
              disabled={disabled}
              className="mr-2.5 w-4 h-4 rounded border-gray-300 text-[#162740] focus:ring-2 focus:ring-[#162740]/20"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
        {!isRace && sortedOptions.length > 5 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm text-[#162740] mt-2 underline"
          >
            Show all {sortedOptions.length} options
          </button>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-600 mt-1">
          {[...new Set(value)].length} selected
        </p>
      )}
    </div>
  );
};

const PersonalInfoMobile = ({ 
  personalInfo,
  setPersonalInfo,
  editMode,
  toggleEditMode,
  cancelEdit,
  savePersonalInfo,
  savingSection,
  fieldErrors,
  fieldConfig
}) => {
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

  // Clean citizenship and race data to remove duplicates
  React.useEffect(() => {
    if (personalInfo?.citizenship && Array.isArray(personalInfo.citizenship)) {
      // Normalize "United States" to "United States of America"
      const normalizedCitizenship = personalInfo.citizenship.map(country => 
        country === "United States" ? "United States of America" : country
      );
      const uniqueCitizenship = [...new Set(normalizedCitizenship)];
      if (uniqueCitizenship.length !== personalInfo.citizenship.length || 
          normalizedCitizenship.some((c, i) => c !== personalInfo.citizenship[i])) {
        setPersonalInfo({...personalInfo, citizenship: uniqueCitizenship});
      }
    }
  }, [personalInfo?.citizenship]);

  React.useEffect(() => {
    if (personalInfo?.race && Array.isArray(personalInfo.race)) {
      const uniqueRace = [...new Set(personalInfo.race)];
      if (uniqueRace.length !== personalInfo.race.length) {
        setPersonalInfo({...personalInfo, race: uniqueRace});
      }
    }
  }, [personalInfo?.race]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      const value = personalInfo?.[field.field];
      if (value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '')) {
        filledRequired++;
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      const value = personalInfo?.[field.field];
      if (value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '')) {
        filledRecommended++;
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 70 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 30 : 0;
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

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

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
      {/* White Header Section */}
      <div className="bg-white px-6 py-6">
        <div className="flex flex-col gap-5 w-full">
          {/* Top row - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
              <svg className="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900">Personal Information</h3>
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          {/* Content area */}
          <div className="space-y-5">
            {/* Card with subtle shadow and no harsh lines */}
            <div className="relative w-full rounded-lg overflow-hidden shadow-sm bg-white">
              {/* Content section */}
              <div className="px-6 py-6">
                {/* Header with completion */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Personal Profile</h3>
                    <p className="text-sm text-gray-600">Additional personal details for your member file</p>
                  </div>
                  
                  {/* Compact completion indicator */}
                  <div className="relative">
                    <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                      <circle
                        stroke="#f5f5f5"
                        fill="transparent"
                        strokeWidth={4}
                        r={36}
                        cx={40}
                        cy={40}
                      />
                      <circle
                        stroke="url(#gradient)"
                        fill="transparent"
                        strokeWidth={4}
                        strokeDasharray={`${226.19} ${226.19}`}
                        style={{ 
                          strokeDashoffset: 226.19 - (completionPercentage / 100) * 226.19,
                          transition: 'stroke-dashoffset 0.5s ease',
                          strokeLinecap: 'round'
                        }}
                        r={36}
                        cx={40}
                        cy={40}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F26430" />
                          <stop offset="100%" stopColor="#512BD9" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-base font-bold text-gray-900">{completionPercentage}%</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider">Complete</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-gray-100 mb-5"></div>
                
                {/* Progress indicators */}
                <div className="space-y-3">
                  {/* Required fields */}
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Required Information</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Gender, Birth Name, SSN/Government ID, Race, Marital Status, Place of Birth, Citizenship</p>
                    </div>
                  </div>
                  
                  {/* Recommended fields */}
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#6e4376] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Recommended Information</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Ethnicity</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      {editMode.personal && (
        <div className="bg-white px-6 py-6 border-t border-gray-200">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Birth Name"
                value={personalInfo?.birthName || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                placeholder="Same as current"
                disabled={savingSection === 'personal'}
              />
              <FormSelect
                label="Gender *"
                value={personalInfo?.gender || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, gender: e.target.value})}
                error={fieldErrors.gender}
                disabled={savingSection === 'personal'}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </FormSelect>
            </div>
            
            <MobileMultiSelect
              label="Race *"
              options={raceOptions}
              value={personalInfo?.race || []}
              onChange={(selected) => setPersonalInfo({...personalInfo, race: selected})}
              disabled={savingSection === 'personal'}
            />
            
            <FormSelect
              label="Ethnicity"
              value={personalInfo?.ethnicity || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
              disabled={savingSection === 'personal'}
            >
              <option value="">Select...</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
            </FormSelect>
            
            <FormSelect
              label="Marital Status *"
              value={personalInfo?.maritalStatus || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
              error={fieldErrors.maritalStatus}
              disabled={savingSection === 'personal'}
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
            
            <FormInput
              label="Place of Birth *"
              value={personalInfo?.placeOfBirth || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
              error={fieldErrors.placeOfBirth}
              disabled={savingSection === 'personal'}
            />
            
            <MobileMultiSelect
              label="Citizenship *"
              options={citizenshipOptions}
              value={personalInfo?.citizenship || []}
              onChange={(selected) => setPersonalInfo({...personalInfo, citizenship: selected})}
              disabled={savingSection === 'personal'}
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={() => cancelEdit && cancelEdit('personal')}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={savePersonalInfo}
              disabled={savingSection === 'personal'}
              className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
            >
              {savingSection === 'personal' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Edit button when not in edit mode */}
      {!editMode.personal && (
        <div className="bg-white px-6 pb-6">
          <button
            onClick={() => toggleEditMode && toggleEditMode('personal')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoMobile;