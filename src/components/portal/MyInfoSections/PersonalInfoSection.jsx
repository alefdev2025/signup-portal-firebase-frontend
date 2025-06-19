import React from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
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

  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
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
            {personalInfo.hasDifferentBirthName && (
              <InfoDisplay 
                label="Birth Name" 
                value={personalInfo.birthName}
                className={styleConfig.display.grid.tripleSpan}
              />
            )}
            <InfoDisplay 
              label="Social Security Number" 
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
          <div className={styleConfig.section.grid.twoColumn}>
            <Checkbox
              containerClassName="col-span-2"
              label="Is your birth name different from your current name?"
              checked={personalInfo.hasDifferentBirthName || false}
              onChange={(e) => setPersonalInfo({...personalInfo, hasDifferentBirthName: e.target.checked})}
              disabled={!editMode.personal}
            />
            
            {personalInfo.hasDifferentBirthName && (
              <Input
                containerClassName="col-span-2"
                label="Birth Name"
                type="text"
                value={personalInfo.birthName || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, birthName: e.target.value})}
                disabled={!editMode.personal}
              />
            )}
            
            <Input
              label="Social Security Number"
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
            
            <Select
              label="Race"
              multiple
              value={personalInfo.race || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setPersonalInfo({...personalInfo, race: selected});
              }}
              disabled={!editMode.personal}
            >
              <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
              <option value="Asian">Asian</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
              <option value="White">White</option>
              <option value="Other">Other</option>
            </Select>
            
            <Select
              label="Ethnicity"
              value={personalInfo.ethnicity || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, ethnicity: e.target.value})}
              disabled={!editMode.personal}
            >
              <option value="">Select...</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
            </Select>
            
            <Select
              label="Citizenship"
              multiple
              value={personalInfo.citizenship || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setPersonalInfo({...personalInfo, citizenship: selected});
              }}
              disabled={!editMode.personal}
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Other">Other</option>
            </Select>
            
            <Input
              label="Place of Birth"
              type="text"
              value={personalInfo.placeOfBirth || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, placeOfBirth: e.target.value})}
              disabled={!editMode.personal}
            />
            
            <Select
              label="Marital Status"
              value={personalInfo.maritalStatus || ''}
              onChange={(e) => setPersonalInfo({...personalInfo, maritalStatus: e.target.value})}
              disabled={!editMode.personal}
            >
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </Select>
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