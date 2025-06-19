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

const NextOfKinSection = ({ 
  nextOfKin, 
  setNextOfKin, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveNextOfKin, 
  savingSection 
}) => {
  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.nextOfKin}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Next of Kin</h2>
            <p className={styleConfig.header.subtitle}>
              Your primary emergency contact information.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.nextOfKin ? (
          <dl className={styleConfig.display.dl.wrapperTwo}>
            <InfoDisplay 
              label="Relationship" 
              value={nextOfKin.relationship} 
            />
            <InfoDisplay 
              label="Full Name" 
              value={nextOfKin.fullName} 
            />
            <InfoDisplay 
              label="Phone Number" 
              value={nextOfKin.phone} 
            />
            <InfoDisplay 
              label="Email" 
              value={nextOfKin.email} 
            />
            <InfoDisplay 
              label="Address" 
              value={nextOfKin.address}
              className={styleConfig.display.grid.fullSpan}
            />
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.section.grid.twoColumn}>
            <Input
              label="Relationship"
              type="text"
              value={nextOfKin.relationship || ''}
              onChange={(e) => setNextOfKin({...nextOfKin, relationship: e.target.value})}
              disabled={!editMode.nextOfKin}
            />
            <Input
              label="Full Name"
              type="text"
              value={nextOfKin.fullName || ''}
              onChange={(e) => setNextOfKin({...nextOfKin, fullName: e.target.value})}
              disabled={!editMode.nextOfKin}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={nextOfKin.phone || ''}
              onChange={(e) => setNextOfKin({...nextOfKin, phone: e.target.value})}
              disabled={!editMode.nextOfKin}
            />
            <Input
              label="Email"
              type="email"
              value={nextOfKin.email || ''}
              onChange={(e) => setNextOfKin({...nextOfKin, email: e.target.value})}
              disabled={!editMode.nextOfKin}
            />
            <Input
              containerClassName="col-span-2"
              label="Address"
              type="text"
              value={nextOfKin.address || ''}
              onChange={(e) => setNextOfKin({...nextOfKin, address: e.target.value})}
              disabled={!editMode.nextOfKin}
            />
          </div>
        )}
        
        <ButtonGroup>
          {editMode.nextOfKin ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('nextOfKin')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveNextOfKin}
                loading={savingSection === 'nextOfKin'}
                disabled={savingSection === 'nextOfKin'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('nextOfKin')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default NextOfKinSection;