import React, { useState, useEffect } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig from '../styleConfig2';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.value}>{value || styleConfig.display.item.empty}</dd>
  </div>
);

const FamilyInfoSection = ({ 
  familyInfo, 
  setFamilyInfo, 
  personalInfo,
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveFamilyInfo, 
  savingSection 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [errors, setErrors] = useState({});
  const [attemptedSave, setAttemptedSave] = useState(false);
  
  // Add state for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear errors when canceling edit
  useEffect(() => {
    if (!editMode.family) {
      setErrors({});
      setAttemptedSave(false);
    }
  }, [editMode.family]);
  
  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    console.log('📌 Starting validation with familyInfo:', familyInfo);
    
    // Father's name is required
    if (!familyInfo.fathersName || familyInfo.fathersName.trim() === '') {
      newErrors.fathersName = "Father's name is required";
    }
    
    // Father's birthplace is required and must have proper format
    if (!familyInfo.fathersBirthplace || familyInfo.fathersBirthplace.trim() === '') {
      newErrors.fathersBirthplace = "Father's birthplace is required (enter 'Unknown' if not known)";
    } else if (!validateBirthplaceFormat(familyInfo.fathersBirthplace)) {
      newErrors.fathersBirthplace = "Please include city, state/province, and country (or 'Unknown')";
    }
    
    // Mother's full maiden name is required
    if (!familyInfo.mothersMaidenName || familyInfo.mothersMaidenName.trim() === '') {
      newErrors.mothersMaidenName = "Mother's full maiden name is required";
    }
    
    // Mother's birthplace is required and must have proper format
    if (!familyInfo.mothersBirthplace || familyInfo.mothersBirthplace.trim() === '') {
      newErrors.mothersBirthplace = "Mother's birthplace is required (enter 'Unknown' if not known)";
    } else if (!validateBirthplaceFormat(familyInfo.mothersBirthplace)) {
      newErrors.mothersBirthplace = "Please include city, state/province, and country (or 'Unknown')";
    }
    
    // Spouse's name is required if married
    if (personalInfo.maritalStatus === 'Married' && (!familyInfo.spousesName || familyInfo.spousesName.trim() === '')) {
      newErrors.spousesName = "Spouse's name is required";
    }
    
    console.log('📌 Validation errors found:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate birthplace format (should have at least 2 commas or be "Unknown")
  const validateBirthplaceFormat = (birthplace) => {
    if (!birthplace) return false;
    const trimmed = birthplace.trim().toLowerCase();
    
    console.log('📌 Validating birthplace:', birthplace, 'Trimmed:', trimmed);
    
    // Accept "unknown" in any case
    if (trimmed === 'unknown') {
      console.log('📌 Birthplace is "unknown" - valid');
      return true;
    }
    
    // Check if it has at least 2 commas (for city, state, country)
    const commaCount = (birthplace.match(/,/g) || []).length;
    
    // Also accept if it has at least 2 parts even without perfect comma formatting
    const parts = birthplace.split(/[,\s]+/).filter(part => part.length > 0);
    
    const isValid = commaCount >= 2 || parts.length >= 3;
    console.log('📌 Birthplace validation:', { commaCount, partsLength: parts.length, isValid });
    
    return isValid;
  };
  
  // Modified save handler
  const handleSave = () => {
    console.log('📌 handleSave called');
    console.log('📌 Current familyInfo:', familyInfo);
    setAttemptedSave(true);
    
    const isValid = validateForm();
    console.log('📌 Validation result:', isValid);
    console.log('📌 Validation errors:', errors);
    
    if (isValid) {
      console.log('📌 Validation passed, calling saveFamilyInfo');
      saveFamilyInfo();
    } else {
      console.log('📌 Validation failed, showing errors');
    }
  };
  
  // Helper function to check if birthplace info needs updating
  const needsBirthplaceUpdate = () => {
    const fatherBirthplace = familyInfo.fathersBirthplace || '';
    const motherBirthplace = familyInfo.mothersBirthplace || '';
    
    // Check if either birthplace is missing or appears incomplete (no commas, very short)
    const fatherIncomplete = !fatherBirthplace || 
                           (!fatherBirthplace.includes(',') && fatherBirthplace.length < 10 && fatherBirthplace.toLowerCase() !== 'unknown');
    const motherIncomplete = !motherBirthplace || 
                           (!motherBirthplace.includes(',') && motherBirthplace.length < 10 && motherBirthplace.toLowerCase() !== 'unknown');
    
    return fatherIncomplete || motherIncomplete;
  };

  // Get specific missing fields for the message
  const getMissingFields = () => {
    const missing = [];
    const fatherBirthplace = familyInfo.fathersBirthplace || '';
    const motherBirthplace = familyInfo.mothersBirthplace || '';
    
    if (!fatherBirthplace || (!fatherBirthplace.includes(',') && fatherBirthplace.length < 10 && fatherBirthplace.toLowerCase() !== 'unknown')) {
      missing.push("father's birthplace");
    }
    if (!motherBirthplace || (!motherBirthplace.includes(',') && motherBirthplace.length < 10 && motherBirthplace.toLowerCase() !== 'unknown')) {
      missing.push("mother's birthplace");
    }
    
    return missing;
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (familyInfo?.fathersName) {
      previewParts.push(`Father: ${familyInfo.fathersName}`);
    }
    if (familyInfo?.mothersMaidenName) {
      previewParts.push(`Mother: ${familyInfo.mothersMaidenName}`);
    }
    if (personalInfo?.maritalStatus === 'Married' && familyInfo?.spousesName) {
      previewParts.push(`Spouse: ${familyInfo.spousesName}`);
    }
    
    return previewParts.slice(0, 2).join(' • ');
  };

  // Profile improvement notice component (used in both mobile and desktop)
  const ProfileImprovementNotice = () => (
    <div className={isMobile ? "mt-4 mb-4" : "flex items-center gap-4"}>
      <svg className={isMobile ? "w-8 h-8 text-red-600 flex-shrink-0 mb-2" : "w-10 h-10 text-red-600 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={isMobile ? "text-sm font-semibold text-white/90" : "text-sm font-semibold text-gray-900"}>
            Add Required Information
          </p>
          <div className="relative">
            <HelpCircle 
              className={isMobile ? "w-4 h-4 text-white/60 hover:text-white/80 cursor-help" : "w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"} 
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
                    Alcor needs complete family birthplace location to better obtain a death certificate
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
        <p className={isMobile ? "text-sm text-white/70 font-light" : "text-sm text-gray-600 font-light"}>
          Add city, state, country to birthplaces ("Unknown" if unknown)
        </p>
      </div>
    </div>
  );

  // Error message component
  const ErrorMessage = ({ error }) => (
    error ? (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    ) : null
  );

  return (
    <div className={isMobile ? "" : "bg-white rounded-2xl sm:rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] sm:shadow-md border border-gray-500 sm:border-gray-200 mb-6 sm:mb-8 -mx-1 sm:mx-0"}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Family Information"
          preview={getMobilePreview()}
          subtitle="Information about your immediate family members."
          isEditMode={editMode.family}
        >
          {/* Display Mode */}
          {!editMode.family ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Father's Full Name" 
                  value={familyInfo.fathersName} 
                />
                <DisplayField 
                  label="Father's Birthplace (City, State/Province, Country)" 
                  value={familyInfo.fathersBirthplace} 
                />
                <DisplayField 
                  label="Mother's Full Maiden Name" 
                  value={familyInfo.mothersMaidenName} 
                />
                <DisplayField 
                  label="Mother's Birthplace (City, State/Province, Country)" 
                  value={familyInfo.mothersBirthplace} 
                />
                {personalInfo.maritalStatus === 'Married' && (
                  <DisplayField 
                    label={personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
                    value={familyInfo.spousesName}
                  />
                )}
              </div>
              
              {needsBirthplaceUpdate() && <ProfileImprovementNotice />}
              
              <ActionButtons 
                editMode={false}
                onEdit={() => {
                  console.log('📌 Mobile Edit button clicked');
                  toggleEditMode && toggleEditMode('family');
                }}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <div>
                  <FormInput
                    label="Father's Full Name *"
                    value={familyInfo.fathersName || ''}
                    onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
                    error={errors.fathersName}
                  />
                </div>
                <div>
                  <FormInput
                    label="Father's Birthplace *"
                    placeholder="City, State/Province, Country (or 'Unknown')"
                    value={familyInfo.fathersBirthplace || ''}
                    onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
                    error={errors.fathersBirthplace}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">
                    Please include city, state/province, and country. Enter "Unknown" if not known.
                  </p>
                </div>
                <div>
                  <FormInput
                    label="Mother's Full Maiden Name *"
                    value={familyInfo.mothersMaidenName || ''}
                    onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
                    error={errors.mothersMaidenName}
                  />
                </div>
                <div>
                  <FormInput
                    label="Mother's Birthplace *"
                    placeholder="City, State/Province, Country (or 'Unknown')"
                    value={familyInfo.mothersBirthplace || ''}
                    onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
                    error={errors.mothersBirthplace}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">
                    Please include city, state/province, and country. Enter "Unknown" if not known.
                  </p>
                </div>
                {personalInfo.maritalStatus === 'Married' && (
                  <div>
                    <FormInput
                      label={`${personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                      value={familyInfo.spousesName || ''}
                      onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
                      error={errors.spousesName}
                    />
                  </div>
                )}
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={handleSave}
                onCancel={() => {
                  console.log('📌 Mobile Cancel button clicked');
                  cancelEdit && cancelEdit('family');
                }}
                saving={savingSection === 'family'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig.section.innerPadding}>
          {/* Desktop Header */}
          <div className={styleConfig.header.wrapper}>
            <div className={styleConfig.sectionIcons.family}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className={styleConfig.header.textContainer}>
              <h2 className={styleConfig.header.title}>Family Information</h2>
              <p className={styleConfig.header.subtitle}>
                Information about your immediate family members. All fields are required.
              </p>
            </div>
          </div>

          {/* Desktop Display Mode */}
          {!editMode.family ? (
            <>
              <dl className={styleConfig.display.dl.wrapperTwo}>
                <InfoDisplay 
                  label="Father's Full Name" 
                  value={familyInfo.fathersName} 
                />
                <InfoDisplay 
                  label="Father's Birthplace (City, State/Province, Country)" 
                  value={familyInfo.fathersBirthplace} 
                />
                <InfoDisplay 
                  label="Mother's Full Maiden Name" 
                  value={familyInfo.mothersMaidenName} 
                />
                <InfoDisplay 
                  label="Mother's Birthplace (City, State/Province, Country)" 
                  value={familyInfo.mothersBirthplace} 
                />
                {personalInfo.maritalStatus === 'Married' && (
                  <InfoDisplay 
                    label={personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
                    value={familyInfo.spousesName}
                    className={styleConfig.display.grid.fullSpan}
                  />
                )}
              </dl>
            </>
          ) : (
            /* Desktop Edit Mode - Form */
            <div className={styleConfig.section.grid.twoColumn}>
              <div>
                <Input
                  label="Father's Full Name *"
                  type="text"
                  value={familyInfo.fathersName || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
                  disabled={!editMode.family}
                  className={errors.fathersName ? 'border-red-500' : ''}
                />
                {errors.fathersName && <ErrorMessage error={errors.fathersName} />}
              </div>
              <div>
                <Input
                  label="Father's Birthplace *"
                  type="text"
                  placeholder="City, State/Province, Country (or 'Unknown')"
                  value={familyInfo.fathersBirthplace || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
                  disabled={!editMode.family}
                  className={errors.fathersBirthplace ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Please include city, state/province, and country. Enter "Unknown" if not known.
                </p>
                {errors.fathersBirthplace && <ErrorMessage error={errors.fathersBirthplace} />}
              </div>
              <div>
                <Input
                  label="Mother's Full Maiden Name *"
                  type="text"
                  value={familyInfo.mothersMaidenName || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
                  disabled={!editMode.family}
                  className={errors.mothersMaidenName ? 'border-red-500' : ''}
                />
                {errors.mothersMaidenName && <ErrorMessage error={errors.mothersMaidenName} />}
              </div>
              <div>
                <Input
                  label="Mother's Birthplace *"
                  type="text"
                  placeholder="City, State/Province, Country (or 'Unknown')"
                  value={familyInfo.mothersBirthplace || ''}
                  onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
                  disabled={!editMode.family}
                  className={errors.mothersBirthplace ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1 font-light">
                  Please include city, state/province, and country. Enter "Unknown" if not known.
                </p>
                {errors.mothersBirthplace && <ErrorMessage error={errors.mothersBirthplace} />}
              </div>
              {personalInfo.maritalStatus === 'Married' && (
                <div className="col-span-2">
                  <Input
                    containerClassName="col-span-2"
                    label={`${personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                    type="text"
                    value={familyInfo.spousesName || ''}
                    onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
                    disabled={!editMode.family}
                    className={errors.spousesName ? 'border-red-500' : ''}
                  />
                  {errors.spousesName && <ErrorMessage error={errors.spousesName} />}
                </div>
              )}
            </div>
          )}
          
          {/* Desktop Button Group and Profile Improvement Notice on same line */}
          {!editMode.family && needsBirthplaceUpdate() ? (
            <div className="flex items-center justify-between mt-16">
              {/* Profile Improvement Notice - Left side */}
              <ProfileImprovementNotice />
              
              {/* Edit button - Right side */}
              <RainbowButton
                text="Edit"
                onClick={() => {
                  console.log('📌 Desktop Edit button clicked (with notice)');
                  toggleEditMode && toggleEditMode('family');
                }}
                className="scale-75"
                spinStar={true}
              />
            </div>
          ) : (
            <div className="flex justify-end mt-6">
              {editMode?.family ? (
                <div className="flex">
                  <WhiteButton
                    text="Cancel"
                    onClick={() => {
                      console.log('📌 Desktop Cancel button clicked');
                      cancelEdit && cancelEdit('family');
                    }}
                    className="scale-75 -mr-8"
                    spinStar={false}
                  />
                  <PurpleButton
                    text={savingSection === 'saved' ? 'Saved' : savingSection === 'family' ? 'Saving...' : 'Save'}
                    onClick={handleSave}
                    className="scale-75"
                    spinStar={false}
                  />
                </div>
              ) : (
                <RainbowButton
                  text="Edit"
                  onClick={() => {
                    console.log('📌 Desktop Edit button clicked');
                    toggleEditMode && toggleEditMode('family');
                  }}
                  className="scale-75"
                  spinStar={true}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyInfoSection;