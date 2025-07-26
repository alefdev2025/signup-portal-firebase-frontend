// CryoArrangementsMobile.js
import React, { useState } from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import styleConfig2 from '../styleConfig2';

const CryoArrangementsMobile = ({ 
  cryoArrangements,
  setCryoArrangements,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveCryoArrangements,
  savingSection,
  fieldErrors,
  validationError,
  handleSaveWithValidation,
  handleSaveAnyway,
  canEdit,
  memberCategory,
  validatingAddress,
  fieldConfig
}) => {
  const [viewMode, setViewMode] = useState(false);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ cryoArrangements })) {
          filledRequired++;
        }
      } else {
        const value = cryoArrangements?.[field.field];
        if (value && value !== '' && value !== undefined) {
          filledRequired++;
        }
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ cryoArrangements })) {
          filledRecommended++;
        }
      } else {
        const value = cryoArrangements?.[field.field];
        if (value && value !== '' && value !== undefined) {
          filledRecommended++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 0 : 0; // No recommended fields for cryo
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

  // Format methods for display
  const formatMethodShort = (method) => {
    if (!method) return '—';
    if (method === 'WholeBody') return 'Whole Body';
    if (method === 'Neuro') return 'Neuro';
    return method;
  };

  const formatMethod = (method) => {
    if (!method) return '—';
    if (method === 'WholeBody') return 'Whole Body Cryopreservation ($220,000 US / $230,000 International)';
    if (method === 'Neuro') return 'Neurocryopreservation ($80,000 US / $90,000 International)';
    return method;
  };

  const formatDisclosureShort = (cryoDisclosure, memberDisclosure) => {
    if (!cryoDisclosure && !memberDisclosure) return '';
    
    const parts = [];
    if (cryoDisclosure === 'freely' || memberDisclosure === 'freely') {
      parts.push('Public disclosure allowed');
    } else if (cryoDisclosure === 'confidential' || memberDisclosure === 'confidential') {
      parts.push('Confidential');
    }
    
    return parts.join(' • ');
  };

  const formatCryoDisclosure = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'Alcor is authorized to freely release Cryopreservation Member information at its discretion';
    if (disclosure === 'confidential') return 'Alcor will make reasonable efforts to maintain confidentiality of Cryopreservation Member information';
    return disclosure;
  };

  const formatMemberDisclosure = (disclosure) => {
    if (!disclosure) return '—';
    if (disclosure === 'freely') return 'I give Alcor permission to freely release my name and related Alcor membership status at its discretion';
    if (disclosure === 'confidential') return 'Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor\'s General Terms and Conditions';
    return disclosure;
  };

  const formatRemainsHandling = (handling) => {
    if (!handling) return '—';
    if (handling === 'return') return 'Return to designated recipient';
    if (handling === 'donate') return 'Donate to medical research or dispose at Alcor\'s discretion';
    return handling;
  };

  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return '—';
    return parts.join(', ');
  };

  const getPreviewText = () => {
    const parts = [];
    
    if (cryoArrangements?.method) {
      parts.push(formatMethodShort(cryoArrangements.method));
    }
    if (cryoArrangements?.cmsWaiver) {
      parts.push('CMS Waiver');
    }
    if (cryoArrangements?.cryopreservationDisclosure || cryoArrangements?.memberPublicDisclosure) {
      parts.push(formatDisclosureShort(cryoArrangements.cryopreservationDisclosure, cryoArrangements.memberPublicDisclosure));
    }
    
    return parts.length > 0 ? parts.slice(0, 2).join(' • ') : 'No arrangements specified';
  };

  // Read-only field component for edit mode
  const ReadOnlyField = ({ label, value, helperText }) => (
    <div>
      <label className="text-gray-700 text-sm font-medium mb-1.5 block">
        {label}
        {helperText && (
          <span className="text-xs font-normal text-gray-500 ml-2">
            {helperText}
          </span>
        )}
      </label>
      <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
        {value}
      </div>
    </div>
  );

  // Display field component for view mode
  const DisplayField = ({ label, value, isEmpty = false }) => (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <p className={`text-sm ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}`}>
        {value || '—'}
      </p>
    </div>
  );

  return (
    <div className="-mx-2">
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
        {/* White Header Section */}
        <div className="bg-white px-6 py-6">
          <div className="flex flex-col gap-5 w-full">
            {/* Top row - Icon and Title */}
            <div className="flex items-center gap-3">
              <div className={styleConfig2.sectionIcons.cryoArrangements}>
                <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900">Cryopreservation Arrangements</h3>
            </div>
            
            <div className="border-t border-gray-200"></div>
            
            {/* Content area */}
            <div className="space-y-5">
              {/* Card with subtle shadow */}
              <div className="relative w-full rounded-lg overflow-hidden shadow-sm bg-white">
                {/* Content section */}
                <div className="px-6 py-6">
                  {/* Header with completion */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Arrangement Details</h3>
                      <p className="text-sm text-gray-600">Your cryopreservation method and preferences</p>
                    </div>
                    
                    {/* Compact completion indicator */}
                    <div className="relative">
                      <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                        <circle
                          stroke="#f5f5f5"
                          fill="transparent"
                          strokeWidth={4}
                          r={36}
                          cx={40}
                          cy={40}
                        />
                        <circle
                          stroke="url(#gradient)"
                          fill="transparent"
                          strokeWidth={4}
                          strokeDasharray={`${226.19} ${226.19}`}
                          style={{ 
                            strokeDashoffset: 226.19 - (completionPercentage / 100) * 226.19,
                            transition: 'stroke-dashoffset 0.5s ease',
                            strokeLinecap: 'round'
                          }}
                          r={36}
                          cx={40}
                          cy={40}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#734477" />
                            <stop offset="100%" stopColor="#F26430" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-base font-bold text-gray-900">{completionPercentage}%</div>
                          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Complete</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-gray-100 mb-5"></div>
                  
                  {/* Progress indicators */}
                  <div className="space-y-3">
                    {/* Required fields */}
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#734477] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Key Arrangements</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Method, CMS Waiver, Remains Handling, Disclosure Preferences
                          {cryoArrangements?.remainsHandling === 'return' && ', Recipient Details'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Display Mode - Preview (when not in view or edit mode) */}
              {!editMode.cryoArrangements && !viewMode && (
                <div className="bg-blue-50/30 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                </div>
              )}
              
              {/* Note for non-editable users */}
              {!canEdit && !editMode.cryoArrangements && !viewMode && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 text-center">
                    Contact Alcor staff to make changes to these selections
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Section - Shows all details */}
        {viewMode && !editMode.cryoArrangements && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            <div className="space-y-6">
              {/* Method and CMS Waiver */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">Cryopreservation Method</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <DisplayField 
                    label="Method" 
                    value={formatMethod(cryoArrangements?.method)}
                    isEmpty={!cryoArrangements?.method}
                  />
                  <DisplayField 
                    label="CMS Fee Waiver" 
                    value={cryoArrangements?.cmsWaiver !== undefined ? 
                      (cryoArrangements?.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No') : '—'}
                    isEmpty={cryoArrangements?.cmsWaiver === undefined}
                  />
                </div>
              </div>

              {/* Remains Handling */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">Remains Handling</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <DisplayField 
                    label="Non-Cryopreserved Remains" 
                    value={formatRemainsHandling(cryoArrangements?.remainsHandling)}
                    isEmpty={!cryoArrangements?.remainsHandling}
                  />
                  
                  {cryoArrangements?.remainsHandling === 'return' && (
                    <>
                      <DisplayField 
                        label="Recipient Name" 
                        value={cryoArrangements?.recipientName}
                        isEmpty={!cryoArrangements?.recipientName}
                      />
                      <DisplayField 
                        label="Recipient Phone" 
                        value={cryoArrangements?.recipientPhone}
                        isEmpty={!cryoArrangements?.recipientPhone}
                      />
                      <DisplayField 
                        label="Recipient Email" 
                        value={cryoArrangements?.recipientEmail}
                        isEmpty={!cryoArrangements?.recipientEmail}
                      />
                      <DisplayField 
                        label="Recipient Mailing Address" 
                        value={formatAddress(
                          cryoArrangements?.recipientMailingStreet,
                          cryoArrangements?.recipientMailingCity,
                          cryoArrangements?.recipientMailingState,
                          cryoArrangements?.recipientMailingPostalCode,
                          cryoArrangements?.recipientMailingCountry
                        )}
                        isEmpty={!cryoArrangements?.recipientMailingStreet}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Privacy & Disclosure */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">Privacy & Disclosure</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <DisplayField 
                    label="Cryopreservation Information Disclosure" 
                    value={formatCryoDisclosure(cryoArrangements?.cryopreservationDisclosure)}
                    isEmpty={!cryoArrangements?.cryopreservationDisclosure}
                  />
                  <DisplayField 
                    label="Member Name Disclosure" 
                    value={formatMemberDisclosure(cryoArrangements?.memberPublicDisclosure)}
                    isEmpty={!cryoArrangements?.memberPublicDisclosure}
                  />
                </div>
              </div>

              {/* Note for non-editable users */}
              {!canEdit && (
                <div className="bg-yellow-50 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-800 text-center">
                    Contact Alcor staff to make changes to these selections
                  </p>
                </div>
              )}
            </div>
            
            {/* Close button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setViewMode(false)}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edit Form Section */}
        {editMode.cryoArrangements && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            <div className="space-y-6">
              {/* Method - Read Only */}
              <ReadOnlyField
                label="Method of Cryopreservation *"
                value={formatMethod(cryoArrangements?.method)}
                helperText="(Contact Alcor staff to make changes)"
              />

              {/* CMS Waiver - Read Only */}
              <ReadOnlyField
                label="CMS Fee Waiver *"
                value={cryoArrangements?.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No'}
                helperText="(Contact Alcor staff to make changes)"
              />

              {/* Remains Handling */}
              <FormSelect
                label="Non-Cryopreserved Remains Handling *"
                value={cryoArrangements?.remainsHandling || ''}
                onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
                disabled={savingSection === 'cryoArrangements'}
              >
                <option value="">Select...</option>
                <option value="return">Return to designated recipient</option>
                <option value="donate">Donate to medical research or dispose at Alcor's discretion</option>
              </FormSelect>

              {/* Recipient Information */}
              {cryoArrangements?.remainsHandling === 'return' && (
                <>
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Recipient Information</h4>
                    <div className="space-y-4">
                      <FormInput
                        label="Recipient Name *"
                        value={cryoArrangements?.recipientName || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientName: e.target.value})}
                        disabled={savingSection === 'cryoArrangements'}
                      />
                      <FormInput
                        label="Recipient Phone *"
                        type="tel"
                        value={cryoArrangements?.recipientPhone || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                        disabled={savingSection === 'cryoArrangements'}
                      />
                      <FormInput
                        label="Recipient Email *"
                        type="email"
                        value={cryoArrangements?.recipientEmail || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                        disabled={savingSection === 'cryoArrangements'}
                      />
                    </div>
                  </div>

                  {/* Recipient Address */}
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Recipient Mailing Address</h4>
                    <div className="space-y-4">
                      <FormInput
                        label="Street Address *"
                        value={cryoArrangements?.recipientMailingStreet || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingStreet: e.target.value})}
                        disabled={savingSection === 'cryoArrangements'}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput
                          label="City *"
                          value={cryoArrangements?.recipientMailingCity || ''}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCity: e.target.value})}
                          disabled={savingSection === 'cryoArrangements'}
                        />
                        <FormInput
                          label="State/Province"
                          value={cryoArrangements?.recipientMailingState || ''}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingState: e.target.value})}
                          disabled={savingSection === 'cryoArrangements'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput
                          label="Zip/Postal Code"
                          value={cryoArrangements?.recipientMailingPostalCode || ''}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingPostalCode: e.target.value})}
                          disabled={savingSection === 'cryoArrangements'}
                        />
                        <FormInput
                          label="Country"
                          value={cryoArrangements?.recipientMailingCountry || 'US'}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCountry: e.target.value})}
                          disabled={savingSection === 'cryoArrangements'}
                        />
                      </div>
                    </div>
                    {validationError && (
                      <p className="mt-2 text-sm text-red-600">{validationError}</p>
                    )}
                  </div>
                </>
              )}

              {/* Disclosure Preferences */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Disclosure Preferences</h4>
                <div className="space-y-4">
                  <FormSelect
                    label="Cryopreservation Information Disclosure *"
                    value={cryoArrangements?.cryopreservationDisclosure || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, cryopreservationDisclosure: e.target.value})}
                    disabled={savingSection === 'cryoArrangements'}
                  >
                    <option value="">Select...</option>
                    <option value="freely">Alcor is authorized to freely release Cryopreservation Member information</option>
                    <option value="confidential">Alcor will make reasonable efforts to maintain confidentiality</option>
                  </FormSelect>

                  <FormSelect
                    label="Member Name Disclosure *"
                    value={cryoArrangements?.memberPublicDisclosure || ''}
                    onChange={(e) => setCryoArrangements({...cryoArrangements, memberPublicDisclosure: e.target.value})}
                    disabled={savingSection === 'cryoArrangements'}
                  >
                    <option value="">Select...</option>
                    <option value="freely">I give Alcor permission to freely release my name</option>
                    <option value="confidential">Alcor is to make reasonable efforts to maintain confidentiality</option>
                  </FormSelect>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={() => cancelEdit && cancelEdit('cryoArrangements')}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                disabled={savingSection === 'cryoArrangements'}
              >
                Close
              </button>
              {validationError && (
                <button
                  onClick={handleSaveAnyway}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                  disabled={savingSection === 'cryoArrangements'}
                >
                  Save Anyway
                </button>
              )}
              <button
                onClick={handleSaveWithValidation}
                disabled={savingSection === 'cryoArrangements' || validatingAddress}
                className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {validatingAddress ? 'Validating...' : savingSection === 'cryoArrangements' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* View/Edit button when not in edit mode or view mode */}
        {!editMode.cryoArrangements && !viewMode && (
          <div className="bg-white px-6 pb-6">
            <button
              onClick={() => canEdit ? (toggleEditMode && toggleEditMode('cryoArrangements')) : setViewMode(true)}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              {canEdit ? 'View/Edit' : 'View Details'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryoArrangementsMobile;