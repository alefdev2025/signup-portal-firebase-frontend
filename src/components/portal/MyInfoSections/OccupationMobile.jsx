// OccupationMobile.js
import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';

const OccupationMobile = ({ 
  occupation,
  setOccupation,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveOccupation,
  savingSection,
  fieldErrors,
  fieldConfig,
  formatServiceYears,
  isJustRetired,
  needsOccupationUpdate,
  ProfileImprovementNotice
}) => {
  // Local state for validation errors
  const [localErrors, setLocalErrors] = React.useState({});
  
  // Clear errors when entering/exiting edit mode
  React.useEffect(() => {
    if (editMode.occupation) {
      setLocalErrors({});
    }
  }, [editMode.occupation]);
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    // Create a modified occupation object for the wheel
    const occupationForCheck = {
      ...occupation,
      militaryServiceAnswered: occupation?.hasMilitaryService !== undefined && occupation?.hasMilitaryService !== null ? 'answered' : ''
    };
    
    // For required fields, we need to check dynamically based on military service
    // Always required: occupation and militaryServiceAnswered
    if (occupationForCheck?.occupation && occupationForCheck.occupation.trim() !== '') {
      filledRequired++;
    }
    if (occupationForCheck?.militaryServiceAnswered) {
      filledRequired++;
    }
    
    // If they served, check additional required fields
    if (occupation?.hasMilitaryService === true) {
      if (occupation?.militaryBranch && occupation.militaryBranch.trim() !== '') {
        filledRequired++;
      }
      if (occupation?.servedFrom && occupation.servedFrom.trim() !== '') {
        filledRequired++;
      }
      if (occupation?.servedTo && occupation.servedTo.trim() !== '') {
        filledRequired++;
      }
    }
    
    // Check recommended fields
    if (occupation?.occupationalIndustry && occupation.occupationalIndustry.trim() !== '') {
      filledRecommended++;
    }
    
    // Calculate total required fields based on military service
    const totalRequired = occupation?.hasMilitaryService === true ? 5 : 2;
    const totalRecommended = 1; // Just industry
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 70 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 30 : 0;
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

  const getPreviewText = () => {
    const parts = [];
    
    if (occupation?.occupation) {
      parts.push(occupation.occupation);
    }
    
    if (occupation?.hasMilitaryService) {
      parts.push(`Military: ${occupation.militaryBranch || 'Yes'}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No occupation information provided';
  };
  
  // Handle save with complete validation
  const handleSave = () => {
    const errors = {};
    
    // Validate job title (required)
    if (!occupation?.occupation || !occupation.occupation.trim()) {
      errors.occupation = "Job title is required";
    }
    
    // Military service status is always required (must be answered yes/no)
    if (occupation?.hasMilitaryService === undefined || occupation?.hasMilitaryService === null) {
      errors.hasMilitaryService = "Please indicate if you served in the military";
    }
    
    // If they served, validate additional fields
    if (occupation?.hasMilitaryService === true) {
      if (!occupation?.militaryBranch || !occupation.militaryBranch.trim()) {
        errors.militaryBranch = "Military branch is required";
      }
      if (!occupation?.servedFrom || !occupation.servedFrom.trim()) {
        errors.servedFrom = "Service start year is required";
      }
      if (!occupation?.servedTo || !occupation.servedTo.trim()) {
        errors.servedTo = "Service end year is required";
      }
    }
    
    // If there are validation errors, set them and don't save
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    
    // Clear errors and proceed with save
    setLocalErrors({});
    saveOccupation();
  };

  // Default ProfileImprovementNotice component if not provided
  const DefaultProfileImprovementNotice = () => (
    <div className="flex items-start space-x-2">
      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm text-red-800 font-medium">Profile Improvement Needed</p>
        <p className="text-sm text-red-700 mt-1">
          {isJustRetired && isJustRetired(occupation?.occupation) ? 
            'Please include your previous occupation (e.g., "Retired Software Engineer")' :
            'Please update your occupation information to improve your profile completeness.'
          }
        </p>
      </div>
    </div>
  );

  return (
    <div className="-mx-2">
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
        {/* White Header Section */}
        <div className="bg-white px-6 py-6">
          <div className="flex flex-col gap-5 w-full">
            {/* Top row - Icon and Title */}
            <div className="flex items-center gap-3">
              <div className={styleConfig2.sectionIcons.occupation}>
                <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900">Occupation</h3>
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
                    <div className="pr-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Career Details</h3>
                      <p className="text-sm text-gray-600">Your occupation and<br />military service</p>
                    </div>
                    
                    {/* Updated completion indicator with correct dimensions to match FamilyInfo */}
                    <div className="relative">
                      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle
                          stroke="#f5f5f5"
                          fill="transparent"
                          strokeWidth={8}
                          r={42}
                          cx={50}
                          cy={50}
                        />
                        <circle
                          stroke="url(#gradient)"
                          fill="transparent"
                          strokeWidth={8}
                          strokeDasharray={`${264} ${264}`}
                          style={{ 
                            strokeDashoffset: 264 - (completionPercentage / 100) * 264,
                            transition: 'stroke-dashoffset 0.5s ease',
                            strokeLinecap: 'round'
                          }}
                          r={42}
                          cx={50}
                          cy={50}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#512BD9" />
                            <stop offset="100%" stopColor="#F26430" />
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
                        <p className="text-xs text-gray-500 mt-0.5">
                          Job Title, Military Service Status
                          {occupation?.hasMilitaryService === true && ' (Branch, Service Years)'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Recommended fields */}
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#6e4376] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">!</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Recommended Information</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Industry</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Display Mode - Occupation Preview */}
              {!editMode.occupation && (
                <>
                  <div className="bg-blue-50/30 rounded-lg p-4">
                    <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                  </div>
                  
                  {needsOccupationUpdate && needsOccupationUpdate() && (
                    <div className="bg-red-50 rounded-lg p-4">
                      {ProfileImprovementNotice ? (
                        <ProfileImprovementNotice />
                      ) : (
                        <DefaultProfileImprovementNotice />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form Section */}
        {editMode.occupation && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            {/* Error Message Section - Only show if there are errors after attempting to save */}
            {localErrors && Object.keys(localErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Please fix the following errors:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {Object.entries(localErrors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Career Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Career Information</h4>
                <div className="space-y-4">
                  <div>
                    <FormInput
                      label="Job Title *"
                      value={occupation?.occupation || ''}
                      onChange={(e) => setOccupation({...occupation, occupation: e.target.value})}
                      disabled={savingSection === 'occupation'}
                      error={fieldErrors.occupation || localErrors.occupation}
                    />
                    {!occupation?.occupation && (
                      <p className="text-gray-500 text-sm mt-1 font-light">
                        "Homemaker" is an option if you did not have employment
                      </p>
                    )}
                    {occupation?.occupation && occupation.occupation.toLowerCase().includes('retired') && !isJustRetired(occupation.occupation) && (
                      <p className="text-green-600 text-sm mt-1 font-light">
                        ✓ Good format - includes previous occupation
                      </p>
                    )}
                  </div>
                  
                  <FormSelect
                    label="Industry"
                    value={occupation?.occupationalIndustry || ''}
                    onChange={(e) => setOccupation({...occupation, occupationalIndustry: e.target.value})}
                    disabled={savingSection === 'occupation'}
                  >
                    <option value="">Select...</option>
                    <option value="Academic">Academic</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Actuarial Sciences">Actuarial Sciences</option>
                    <option value="Admin">Admin</option>
                    <option value="Advertising/Marketing">Advertising/Marketing</option>
                    <option value="Agricultural Services">Agricultural Services</option>
                    <option value="Animation">Animation</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Art">Art</option>
                    <option value="Author/Journalist">Author/Journalist</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Aviation">Aviation</option>
                    <option value="Business/Finance">Business/Finance</option>
                    <option value="Child">Child</option>
                    <option value="Construction">Construction</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Disabled">Disabled</option>
                    <option value="Education">Education</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Executive">Executive</option>
                    <option value="Factory/Manufacturing">Factory/Manufacturing</option>
                    <option value="Fashion/Design">Fashion/Design</option>
                    <option value="Film/Theater">Film/Theater</option>
                    <option value="Firefighter">Firefighter</option>
                    <option value="Food Services">Food Services</option>
                    <option value="Government">Government</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Legal Services">Legal Services</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Management">Management</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Media/Broadcasting">Media/Broadcasting</option>
                    <option value="Medicine/Health Care">Medicine/Health Care</option>
                    <option value="Military/Armed Forced">Military/Armed Forced</option>
                    <option value="Non-Profit">Non-Profit</option>
                    <option value="Pharmaceutical">Pharmaceutical</option>
                    <option value="Police">Police</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Retail">Retail</option>
                    <option value="Retired">Retired</option>
                    <option value="Sales">Sales</option>
                    <option value="Science/Research">Science/Research</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Sports">Sports</option>
                    <option value="Student">Student</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Veterinary Sciences">Veterinary Sciences</option>
                    <option value="Other">Other</option>
                  </FormSelect>
                </div>
              </div>
              
              {/* Military Service */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Military Service</h4>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!occupation?.hasMilitaryService}
                    onChange={(e) => setOccupation({...occupation, hasMilitaryService: e.target.checked})}
                    disabled={savingSection === 'occupation'}
                    className="w-4 h-4 rounded mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Have you served in the US Military? *</span>
                </label>
                {localErrors.hasMilitaryService && (
                  <p className="text-red-600 text-xs mt-1">{localErrors.hasMilitaryService}</p>
                )}
                
                {occupation?.hasMilitaryService && (
                  <div className="mt-4 space-y-4">
                    <FormSelect
                      label="Military Branch *"
                      value={occupation?.militaryBranch || ''}
                      onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                      disabled={savingSection === 'occupation'}
                      error={fieldErrors.militaryBranch || localErrors.militaryBranch}
                    >
                      <option value="">Select...</option>
                      <option value="Army">Army</option>
                      <option value="Navy">Navy</option>
                      <option value="Air Force">Air Force</option>
                      <option value="Marines">Marines</option>
                      <option value="Coast Guard">Coast Guard</option>
                      <option value="Space Force">Space Force</option>
                    </FormSelect>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="Service Start Year *"
                        type="text"
                        value={occupation?.servedFrom || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d{0,4}$/.test(value)) {
                            setOccupation({...occupation, servedFrom: value});
                          }
                        }}
                        placeholder="YYYY"
                        maxLength="4"
                        pattern="\d{4}"
                        disabled={savingSection === 'occupation'}
                        error={fieldErrors.servedFrom || localErrors.servedFrom}
                      />
                      <FormInput
                        label="Service End Year *"
                        type="text"
                        value={occupation?.servedTo || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d{0,4}$/.test(value)) {
                            setOccupation({...occupation, servedTo: value});
                          }
                        }}
                        placeholder="YYYY"
                        maxLength="4"
                        pattern="\d{4}"
                        disabled={savingSection === 'occupation'}
                        error={fieldErrors.servedTo || localErrors.servedTo}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={() => {
                  setLocalErrors({});
                  cancelEdit && cancelEdit('occupation');
                }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                disabled={savingSection === 'occupation'}
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={savingSection === 'occupation'}
                className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {savingSection === 'occupation' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* View/Edit button when not in edit mode */}
        {!editMode.occupation && (
          <div className="bg-white px-6 pb-6">
            <button
              onClick={() => toggleEditMode && toggleEditMode('occupation')}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              View/Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OccupationMobile;