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

const OccupationSection = ({ 
  occupation, 
  setOccupation, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveOccupation, 
  savingSection 
}) => {
  // Format military service years for display
  const formatServiceYears = (from, to) => {
    if (!from && !to) return styleConfig.display.item.empty;
    if (from && to) return `${from} - ${to}`;
    if (from && !to) return `${from} - Present`;
    return styleConfig.display.item.empty;
  };

  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
       {/* Header with icon */}
       <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.occupation}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Occupation</h2>
            <p className={styleConfig.header.subtitle}>
              Your current occupation and military service history.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.occupation ? (
          <dl className={styleConfig.display.dl.wrapperTwo}>
            <InfoDisplay 
              label="Job Title" 
              value={occupation.occupation} 
            />
            <InfoDisplay 
              label="Industry" 
              value={occupation.occupationalIndustry} 
            />
            <InfoDisplay 
              label="Military Service" 
              value={occupation.hasMilitaryService ? 'Yes' : 'No'}
              className={styleConfig.display.grid.fullSpan}
            />
            {occupation.hasMilitaryService && (
              <>
                <InfoDisplay 
                  label="Military Branch" 
                  value={occupation.militaryBranch} 
                />
                <InfoDisplay 
                  label="Service Years" 
                  value={formatServiceYears(occupation.servedFrom, occupation.servedTo)} 
                />
              </>
            )}
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.section.grid.twoColumn}>
            <Input
              label="Job Title"
              type="text"
              value={occupation.occupation || ''}
              onChange={(e) => setOccupation({...occupation, occupation: e.target.value})}
              disabled={!editMode.occupation}
            />
            <Input
              label="Industry"
              type="text"
              value={occupation.occupationalIndustry || ''}
              onChange={(e) => setOccupation({...occupation, occupationalIndustry: e.target.value})}
              disabled={!editMode.occupation}
            />
            <Checkbox
              containerClassName="col-span-2"
              label="Have you served in the US Military?"
              checked={occupation.hasMilitaryService || false}
              onChange={(e) => setOccupation({...occupation, hasMilitaryService: e.target.checked, militaryBranch: e.target.checked ? occupation.militaryBranch : 'None'})}
              disabled={!editMode.occupation}
            />
            {occupation.hasMilitaryService && (
              <>
                <Select
                  label="Military Branch"
                  value={occupation.militaryBranch || ''}
                  onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                  disabled={!editMode.occupation}
                >
                  <option value="">Select...</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Marines">Marines</option>
                  <option value="Coast Guard">Coast Guard</option>
                  <option value="Space Force">Space Force</option>
                </Select>
                <Input
                  label="Service Start Year"
                  type="number"
                  value={occupation.servedFrom || ''}
                  onChange={(e) => setOccupation({...occupation, servedFrom: e.target.value})}
                  disabled={!editMode.occupation}
                  min="1900"
                  max={new Date().getFullYear()}
                />
                <Input
                  label="Service End Year"
                  type="number"
                  value={occupation.servedTo || ''}
                  onChange={(e) => setOccupation({...occupation, servedTo: e.target.value})}
                  disabled={!editMode.occupation}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </>
            )}
          </div>
        )}
        
        <ButtonGroup>
          {editMode.occupation ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('occupation')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveOccupation}
                loading={savingSection === 'occupation'}
                disabled={savingSection === 'occupation'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('occupation')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default OccupationSection;