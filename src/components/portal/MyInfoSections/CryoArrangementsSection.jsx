// Frontend: CryoArrangementsSection.jsx - Updated with simple values

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

const CryoArrangementsSection = ({ 
  cryoArrangements, 
  setCryoArrangements, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveCryoArrangements, 
  savingSection 
}) => {
  // Format method display
  const formatMethod = (method) => {
    if (!method) return styleConfig.display.item.empty;
    if (method === 'WholeBody') return 'Whole Body Cryopreservation ($220,000 US / $230,000 International)';
    if (method === 'Neuro') return 'Neurocryopreservation ($80,000 US / $90,000 International)';
    return method;
  };

  // Format disclosure display - using simple codes
  const formatDisclosure = (disclosure) => {
    if (!disclosure) return styleConfig.display.item.empty;
    if (disclosure === 'freely') return 'I give Alcor permission to freely release my name and related Alcor membership status at its discretion';
    if (disclosure === 'confidential') return 'Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor\'s General Terms and Conditions';
    return disclosure;
  };

  // Format remains handling display - using simple codes
  const formatRemainsHandling = (handling) => {
    if (!handling) return styleConfig.display.item.empty;
    if (handling === 'return') return 'Return to designated recipient';
    if (handling === 'donate') return 'Donate to medical research or dispose at Alcor\'s discretion';
    return handling;
  };

  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.cryo}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Cryopreservation Arrangements</h2>
            <p className={styleConfig.header.subtitle}>
              Your cryopreservation method and handling preferences.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.cryoArrangements ? (
          <dl className={styleConfig.display.dl.wrapperSingle}>
            <InfoDisplay 
              label="Method of Cryopreservation" 
              value={formatMethod(cryoArrangements.method)} 
            />
            <InfoDisplay 
              label="CMS Fee Waiver" 
              value={cryoArrangements.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No'} 
            />
            <InfoDisplay 
              label="Non-Cryopreserved Remains Handling" 
              value={formatRemainsHandling(cryoArrangements.remainsHandling)} 
            />
            {cryoArrangements.remainsHandling === 'return' && (
              <>
                <InfoDisplay 
                  label="Recipient Name" 
                  value={cryoArrangements.recipientName} 
                />
                <InfoDisplay 
                  label="Recipient Phone" 
                  value={cryoArrangements.recipientPhone} 
                />
                <InfoDisplay 
                  label="Recipient Email" 
                  value={cryoArrangements.recipientEmail} 
                />
              </>
            )}
            <InfoDisplay 
              label="Public Disclosure Preference" 
              value={formatDisclosure(cryoArrangements.publicDisclosure)} 
            />
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.form.fieldSpacing}>
            {/* Method - Display Only */}
            <div>
              <label className={styleConfig.form.label}>
                Method of Cryopreservation
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Contact Alcor staff to make changes)
                </span>
              </label>
              <div className={styleConfig.display.readOnly.wrapper}>
                {formatMethod(cryoArrangements.method)}
              </div>
            </div>

            {/* CMS Waiver - Display Only */}
            <div>
              <label className={styleConfig.form.label}>
                CMS Fee Waiver
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Contact Alcor staff to make changes)
                </span>
              </label>
              <div className={styleConfig.display.readOnly.wrapper}>
                {cryoArrangements.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No'}
              </div>
            </div>

            <Select
              label="Non-Cryopreserved Remains Handling"
              value={cryoArrangements.remainsHandling || ''}
              onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
              disabled={!editMode.cryoArrangements}
            >
              <option value="">Select...</option>
              <option value="return">Return to designated recipient</option>
              <option value="donate">Donate to medical research or dispose at Alcor's discretion</option>
            </Select>

            {cryoArrangements.remainsHandling === 'return' && (
              <div className={`${styleConfig.section.grid.twoColumn} ${styleConfig.form.subSection}`}>
                <Input
                  label="Recipient Name"
                  type="text"
                  value={cryoArrangements.recipientName || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientName: e.target.value})}
                  disabled={!editMode.cryoArrangements}
                />
                <Input
                  label="Recipient Phone"
                  type="tel"
                  value={cryoArrangements.recipientPhone || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                  disabled={!editMode.cryoArrangements}
                />
                <Input
                  containerClassName="col-span-2"
                  label="Recipient Email"
                  type="email"
                  value={cryoArrangements.recipientEmail || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                  disabled={!editMode.cryoArrangements}
                />
              </div>
            )}

            <Select
              label="Public Disclosure Preference"
              value={cryoArrangements.publicDisclosure || ''}
              onChange={(e) => setCryoArrangements({...cryoArrangements, publicDisclosure: e.target.value})}
              disabled={!editMode.cryoArrangements}
            >
              <option value="">Select...</option>
              <option value="freely">I give Alcor permission to freely release my name</option>
              <option value="confidential">Alcor is to make reasonable efforts to maintain confidentiality</option>
            </Select>
          </div>
        )}
        
        <ButtonGroup>
          {editMode.cryoArrangements ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('cryoArrangements')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveCryoArrangements}
                loading={savingSection === 'cryoArrangements'}
                disabled={savingSection === 'cryoArrangements'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('cryoArrangements')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default CryoArrangementsSection;