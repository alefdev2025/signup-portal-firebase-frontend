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
  return (
    <div className={styleConfig.section.wrapperEnhanced}>
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
          <dl className={styleConfig.display.dl.wrapperTwo}>
            <InfoDisplay 
              label="Father's Full Name" 
              value={familyInfo.fathersName} 
            />
            <InfoDisplay 
              label="Father's Birthplace" 
              value={familyInfo.fathersBirthplace} 
            />
            <InfoDisplay 
              label="Mother's Maiden Name" 
              value={familyInfo.mothersMaidenName} 
            />
            <InfoDisplay 
              label="Mother's Birthplace" 
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
            <Input
              label="Father's Birthplace"
              type="text"
              value={familyInfo.fathersBirthplace || ''}
              onChange={(e) => setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value})}
              disabled={!editMode.family}
            />
            <Input
              label="Mother's Maiden Name"
              type="text"
              value={familyInfo.mothersMaidenName || ''}
              onChange={(e) => setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value})}
              disabled={!editMode.family}
            />
            <Input
              label="Mother's Birthplace"
              type="text"
              value={familyInfo.mothersBirthplace || ''}
              onChange={(e) => setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value})}
              disabled={!editMode.family}
            />
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
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default FamilyInfoSection;