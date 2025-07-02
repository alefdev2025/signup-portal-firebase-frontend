import React, { useState } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';
import { AlertCircle, HelpCircle } from 'lucide-react';

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
  
  // Helper function to check if birthplace info needs updating
  const needsBirthplaceUpdate = () => {
    const fatherBirthplace = familyInfo.fathersBirthplace || '';
    const motherBirthplace = familyInfo.mothersBirthplace || '';
    
    // Check if either birthplace is missing or appears incomplete (no commas, very short)
    const fatherIncomplete = !fatherBirthplace || 
                           (!fatherBirthplace.includes(',') && fatherBirthplace.length < 10);
    const motherIncomplete = !motherBirthplace || 
                           (!motherBirthplace.includes(',') && motherBirthplace.length < 10);
    
    return fatherIncomplete || motherIncomplete;
  };

  // Get specific missing fields for the message
  const getMissingFields = () => {
    const missing = [];
    const fatherBirthplace = familyInfo.fathersBirthplace || '';
    const motherBirthplace = familyInfo.mothersBirthplace || '';
    
    if (!fatherBirthplace || (!fatherBirthplace.includes(',') && fatherBirthplace.length < 10)) {
      missing.push("father's birthplace");
    }
    if (!motherBirthplace || (!motherBirthplace.includes(',') && motherBirthplace.length < 10)) {
      missing.push("mother's birthplace");
    }
    
    return missing;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] sm:shadow-md border border-gray-500 sm:border-gray-200 mb-6 sm:mb-8 -mx-1 sm:mx-0">
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.family}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Family Information</h2>
            <p className={styleConfig.header.subtitle}>
              Information about your immediate family members.
            </p>
          </div>
        </div>

        {/* Display Mode */}
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
                label="Mother's Maiden Name" 
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
          /* Edit Mode - Form */
          <div className={styleConfig.section.grid.twoColumn}>
            <Input
              label="Father's Full Name"
              type="text"
              value={familyInfo.fathersName || ''}
              onChange={(e) => setFamilyInfo({...familyInfo, fathersName: e.target.value})}
              disabled={!editMode.family}
            />
            <div>
              <Input
                label="Father's Birthplace"
                type="text"
                placeholder="City, State/Province, Country"
                value={familyInfo.fathersBirthplace || ''}
                onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
                disabled={!editMode.family}
              />
              <p className="text-xs text-gray-500 mt-1 font-light">
                Please include city, state/province, and country if available
              </p>
            </div>
            <Input
              label="Mother's Maiden Name"
              type="text"
              value={familyInfo.mothersMaidenName || ''}
              onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
              disabled={!editMode.family}
            />
            <div>
              <Input
                label="Mother's Birthplace"
                type="text"
                placeholder="City, State/Province, Country"
                value={familyInfo.mothersBirthplace || ''}
                onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
                disabled={!editMode.family}
              />
              <p className="text-xs text-gray-500 mt-1 font-light">
                Please include city, state/province, and country if available
              </p>
            </div>
            {personalInfo.maritalStatus === 'Married' && (
              <Input
                containerClassName="col-span-2"
                label={personalInfo.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"}
                type="text"
                value={familyInfo.spousesName || ''}
                onChange={(e) => setFamilyInfo({...familyInfo, spousesName: e.target.value})}
                disabled={!editMode.family}
              />
            )}
          </div>
        )}
        
        {/* Button Group and Profile Improvement Notice on same line */}
        {!editMode.family && needsBirthplaceUpdate() ? (
          <div className="flex items-center justify-between mt-16">
            {/* Profile Improvement Notice - Left side */}
            <div className="flex items-center gap-4">
              <svg className="w-10 h-10 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Add Required Information
                  </p>
                  <div className="relative">
                    <HelpCircle 
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                      strokeWidth={2}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
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
                <p className="text-sm text-gray-600 font-light">
                  Add city, state, country to birthplaces
                </p>
              </div>
            </div>
            
            {/* Edit button - Right side */}
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('family')}
            >
              Edit
            </Button>
          </div>
        ) : (
          <ButtonGroup>
            {editMode.family ? (
              <>
                <Button
                  variant="tertiary"
                  onClick={() => cancelEdit('family')}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={saveFamilyInfo}
                  loading={savingSection === 'family'}
                  disabled={savingSection === 'family'}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => toggleEditMode('family')}
                className="ml-auto"
              >
                Edit
              </Button>
            )}
          </ButtonGroup>
        )}
      </div>
    </div>
  );
};

export default FamilyInfoSection;