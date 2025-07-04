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

const LegalSection = ({ 
  legal, 
  setLegal, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveLegal, 
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
    
    if (legal?.hasWill) {
      previewParts.push(`Will: ${legal.hasWill}`);
    }
    if (legal?.hasWill === 'Yes' && legal?.contraryProvisions) {
      previewParts.push(`Contrary provisions: ${legal.contraryProvisions}`);
    }
    
    return previewParts.join(' • ');
  };

  return (
    <div className={isMobile ? "" : styleConfig.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
          title="Legal/Will Information"
          preview={getMobilePreview()}
          subtitle="Information about your will and cryonics-related provisions."
          isEditMode={editMode.legal}
        >
          {/* Display Mode */}
          {!editMode.legal ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Do you have a will?" 
                  value={legal.hasWill} 
                />
                {legal.hasWill === 'Yes' && (
                  <DisplayField 
                    label="Does your will contain any provisions contrary to cryonics?" 
                    value={legal.contraryProvisions} 
                  />
                )}
              </div>
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('legal')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <FormSelect
                  label="Do you have a will?"
                  value={legal.hasWill || ''}
                  onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </FormSelect>
                
                {legal.hasWill === 'Yes' && (
                  <FormSelect
                    label="Does your will contain any provisions contrary to cryonics?"
                    value={legal.contraryProvisions || ''}
                    onChange={(e) => setLegal({...legal, contraryProvisions: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </FormSelect>
                )}
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveLegal}
                onCancel={() => cancelEdit && cancelEdit('legal')}
                saving={savingSection === 'legal'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig.section.innerPadding}>
          {/* Desktop Header */}
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

          {/* Desktop Display Mode */}
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
            /* Desktop Edit Mode - Form */
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
          
          <div className="flex justify-end mt-6">
            {editMode?.legal ? (
              <div className="flex">
                <WhiteButton
                  text="Cancel"
                  onClick={() => cancelEdit && cancelEdit('legal')}
                  className="scale-75 -mr-8"
                  spinStar={false}
                />
                <PurpleButton
                  text={savingSection === 'saved' ? 'Saved' : savingSection === 'legal' ? 'Saving...' : 'Save'}
                  onClick={saveLegal}
                  className="scale-75"
                  spinStar={false}
                  disabled={savingSection === 'legal'}
                />
              </div>
            ) : (
              <RainbowButton
                text="Edit"
                onClick={() => toggleEditMode && toggleEditMode('legal')}
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

export default LegalSection;