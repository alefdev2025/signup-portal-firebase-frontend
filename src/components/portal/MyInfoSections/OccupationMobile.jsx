// OccupationMobile.js
import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';

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
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    // Create a modified occupation object for the wheel
    const occupationForCheck = {
      ...occupation,
      militaryServiceAnswered: occupation?.hasMilitaryService !== undefined && occupation?.hasMilitaryService !== null ? 'answered' : ''
    };
    
    Object.entries(fieldConfig.required).forEach(([key, field]) => {
      // Check if field has a condition
      if (field.condition && !field.condition({ occupation })) {
        return; // Skip this field if condition is not met
      }
      
      const value = occupationForCheck[field.field];
      if (value && value.toString().trim() !== '') {
        filledRequired++;
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ occupation })) {
          filledRecommended++;
        }
      } else {
        const value = occupation?.[field.field];
        if (value && value.trim() !== '') {
          filledRecommended++;
        }
      }
    });
    
    // Count only active required fields
    const activeRequiredFields = Object.entries(fieldConfig.required).filter(([key, field]) => {
      return !field.condition || field.condition({ occupation });
    });
    
    const totalRequired = activeRequiredFields.length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
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

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
      {/* White Header Section */}
      <div className="bg-white px-6 py-6">
        <div className="flex flex-col gap-5 w-full">
          {/* Top row - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
              <svg className="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Career Details</h3>
                    <p className="text-sm text-gray-600">Your occupation and military service</p>
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
                        {occupation?.hasMilitaryService && ' (Branch, Service Years)'}
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                </div>
                
                {needsOccupationUpdate() && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <ProfileImprovementNotice />
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
          <div className="space-y-6">
            {/* Career Information */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Career Information</h4>
              <div className="space-y-4">
                <div>
                  <FormInput
                    label="Job Title"
                    value={occupation?.occupation || ''}
                    onChange={(e) => setOccupation({...occupation, occupation: e.target.value})}
                    disabled={savingSection === 'occupation'}
                    error={fieldErrors.occupation}
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
                <span className="text-sm text-gray-700 font-medium">Have you served in the US Military?</span>
              </label>
              
              {occupation?.hasMilitaryService && (
                <div className="mt-4 space-y-4">
                  <FormSelect
                    label="Military Branch *"
                    value={occupation?.militaryBranch || ''}
                    onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                    disabled={savingSection === 'occupation'}
                    error={fieldErrors.militaryBranch}
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
                      error={fieldErrors.servedFrom}
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
                      error={fieldErrors.servedTo}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={() => cancelEdit && cancelEdit('occupation')}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              disabled={savingSection === 'occupation'}
            >
              Cancel
            </button>
            <button
              onClick={saveOccupation}
              disabled={savingSection === 'occupation'}
              className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
            >
              {savingSection === 'occupation' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Edit button when not in edit mode */}
      {!editMode.occupation && (
        <div className="bg-white px-6 pb-6">
          <button
            onClick={() => toggleEditMode && toggleEditMode('occupation')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default OccupationMobile;