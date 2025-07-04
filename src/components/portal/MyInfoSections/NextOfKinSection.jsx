import React, { useState, useEffect } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';

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
  // Add state for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (nextOfKin?.fullName) {
      previewParts.push(nextOfKin.fullName);
    }
    if (nextOfKin?.relationship) {
      previewParts.push(`(${nextOfKin.relationship})`);
    }
    if (nextOfKin?.phone) {
      previewParts.push(nextOfKin.phone);
    }
    
    return previewParts.slice(0, 2).join(' ');
  };

  return (
    <div className={isMobile ? "" : styleConfig.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Next of Kin"
          preview={getMobilePreview()}
          subtitle="Your primary emergency contact information."
          isEditMode={editMode.nextOfKin}
        >
          {/* Display Mode */}
          {!editMode.nextOfKin ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Relationship" 
                  value={nextOfKin.relationship} 
                />
                <DisplayField 
                  label="Full Name" 
                  value={nextOfKin.fullName} 
                />
                <DisplayField 
                  label="Phone Number" 
                  value={nextOfKin.phone} 
                />
                <DisplayField 
                  label="Email" 
                  value={nextOfKin.email} 
                />
                <DisplayField 
                  label="Address" 
                  value={nextOfKin.address}
                />
              </div>
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('nextOfKin')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <FormInput
                  label="Relationship"
                  value={nextOfKin.relationship || ''}
                  onChange={(e) => setNextOfKin({...nextOfKin, relationship: e.target.value})}
                />
                <FormInput
                  label="Full Name"
                  value={nextOfKin.fullName || ''}
                  onChange={(e) => setNextOfKin({...nextOfKin, fullName: e.target.value})}
                />
                <FormInput
                  label="Phone Number"
                  type="tel"
                  value={nextOfKin.phone || ''}
                  onChange={(e) => setNextOfKin({...nextOfKin, phone: e.target.value})}
                />
                <FormInput
                  label="Email"
                  type="email"
                  value={nextOfKin.email || ''}
                  onChange={(e) => setNextOfKin({...nextOfKin, email: e.target.value})}
                />
                <FormInput
                  label="Address"
                  value={nextOfKin.address || ''}
                  onChange={(e) => setNextOfKin({...nextOfKin, address: e.target.value})}
                />
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveNextOfKin}
                onCancel={() => cancelEdit && cancelEdit('nextOfKin')}
                saving={savingSection === 'nextOfKin'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig.section.innerPadding}>
          {/* Desktop Header */}
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

          {/* Desktop Display Mode */}
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
            /* Desktop Edit Mode - Form */
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
          
          <div className="flex justify-end mt-6">
            {editMode?.nextOfKin ? (
              <div className="flex">
                <WhiteButton
                  text="Cancel"
                  onClick={() => cancelEdit && cancelEdit('nextOfKin')}
                  className="scale-75 -mr-8"
                  spinStar={false}
                />
                <PurpleButton
                  text={savingSection === 'saved' ? 'Saved' : savingSection === 'nextOfKin' ? 'Saving...' : 'Save'}
                  onClick={saveNextOfKin}
                  className="scale-75"
                  spinStar={false}
                  disabled={savingSection === 'nextOfKin'}
                />
              </div>
            ) : (
              <RainbowButton
                text="Edit"
                onClick={() => toggleEditMode && toggleEditMode('nextOfKin')}
                className="scale-75"
                spinStar={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NextOfKinSection;