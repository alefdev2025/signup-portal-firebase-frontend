import React from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.valueWithWrap}>{value || styleConfig.display.item.empty}</dd>
  </div>
);

const MedicalInfoSection = ({ 
  medicalInfo, 
  setMedicalInfo, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveMedicalInfo, 
  savingSection 
}) => {
  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.medical}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Medical Information</h2>
            <p className={styleConfig.header.subtitle}>
              Your healthcare provider and medical history details.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.medical ? (
          <dl className={styleConfig.display.dl.wrapperTwo}>
            <InfoDisplay 
              label="Primary Care Physician" 
              value={medicalInfo.primaryPhysician} 
            />
            <InfoDisplay 
              label="Physician Phone" 
              value={medicalInfo.physicianPhone} 
            />
            <InfoDisplay 
              label="Medical Conditions" 
              value={medicalInfo.conditions}
              className={styleConfig.display.grid.fullSpan}
            />
            <InfoDisplay 
              label="Current Medications" 
              value={medicalInfo.medications}
              className={styleConfig.display.grid.fullSpan}
            />
            <InfoDisplay 
              label="Allergies" 
              value={medicalInfo.allergies}
              className={styleConfig.display.grid.fullSpan}
            />
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.form.fieldSpacing}>
            <Input
              label="Primary Care Physician"
              type="text"
              value={medicalInfo.primaryPhysician || ''}
              onChange={(e) => setMedicalInfo({...medicalInfo, primaryPhysician: e.target.value})}
              disabled={!editMode.medical}
            />
            <Input
              label="Physician Phone"
              type="tel"
              value={medicalInfo.physicianPhone || ''}
              onChange={(e) => setMedicalInfo({...medicalInfo, physicianPhone: e.target.value})}
              disabled={!editMode.medical}
            />
            <div>
              <label className={styleConfig.form.label}>Medical Conditions</label>
              <textarea 
                value={medicalInfo.conditions || ''} 
                onChange={(e) => setMedicalInfo({...medicalInfo, conditions: e.target.value})}
                disabled={!editMode.medical}
                rows={4}
                className={styleConfig.input.textarea}
              />
            </div>
            <div>
              <label className={styleConfig.form.label}>Current Medications</label>
              <textarea 
                value={medicalInfo.medications || ''} 
                onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})}
                disabled={!editMode.medical}
                rows={4}
                className={styleConfig.input.textarea}
              />
            </div>
            <div>
              <label className={styleConfig.form.label}>Allergies</label>
              <textarea 
                value={medicalInfo.allergies || ''} 
                onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                disabled={!editMode.medical}
                rows={3}
                className={styleConfig.input.textarea}
              />
            </div>
          </div>
        )}
        
        <ButtonGroup>
          {editMode.medical ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('medical')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveMedicalInfo}
                loading={savingSection === 'medical'}
                disabled={savingSection === 'medical'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('medical')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default MedicalInfoSection;