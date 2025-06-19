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

const LegalSection = ({ 
  legal, 
  setLegal, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveLegal, 
  savingSection 
}) => {
  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.legal}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Legal/Will Information</h2>
            <p className={styleConfig.header.subtitle}>
              Information about your will and cryonics-related provisions.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.legal ? (
          <dl className={styleConfig.display.dl.wrapperSingle}>
            <InfoDisplay 
              label="Do you have a will?" 
              value={legal.hasWill} 
            />
            {legal.hasWill === 'Yes' && (
              <InfoDisplay 
                label="Does your will contain any provisions contrary to cryonics?" 
                value={legal.contraryProvisions} 
              />
            )}
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.form.fieldSpacing}>
            <Select
              label="Do you have a will?"
              value={legal.hasWill || ''}
              onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
              disabled={!editMode.legal}
            >
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </Select>
            
            {legal.hasWill === 'Yes' && (
              <Select
                label="Does your will contain any provisions contrary to cryonics?"
                value={legal.contraryProvisions || ''}
                onChange={(e) => setLegal({...legal, contraryProvisions: e.target.value})}
                disabled={!editMode.legal}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Select>
            )}
          </div>
        )}
        
        <ButtonGroup>
          {editMode.legal ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('legal')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveLegal}
                loading={savingSection === 'legal'}
                disabled={savingSection === 'legal'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('legal')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default LegalSection;