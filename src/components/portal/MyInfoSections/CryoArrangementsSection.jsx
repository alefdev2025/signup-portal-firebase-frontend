import React, { useState, useEffect } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import { isSectionEditable } from '../memberCategoryConfig';
import { cleanAddressData, cleanAddressObject, formatEmail, formatPhone, formatStreetAddress, formatCity, formatStateProvince, formatPostalCode, formatCountry } from '../utils/dataFormatting';

// Melissa API configuration
const MELISSA_API_KEY = 'AVUaS6bp3WJyyFKHjjwqgj**nSAcwXpxhQ0PC2lXxuDAZ-**';
const MELISSA_API_URL = 'https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress';

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
  savingSection,
  memberCategory,
  setAddressValidationModal
}) => {
  // Add state for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [validatingAddress, setValidatingAddress] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Check if section should be editable based on member category
  const canEdit = isSectionEditable(memberCategory, 'cryoArrangements');
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Clear validation error when edit mode changes
  useEffect(() => {
    if (!editMode.cryoArrangements) {
      setValidationError('');
    }
  }, [editMode.cryoArrangements]);
  
  // Format method display
  const formatMethod = (method) => {
    if (!method) return styleConfig.display.item.empty;
    if (method === 'WholeBody') return 'Whole Body Cryopreservation ($220,000 US / $230,000 International)';
    if (method === 'Neuro') return 'Neurocryopreservation ($80,000 US / $90,000 International)';
    return method;
  };

  // Format method short for mobile preview
  const formatMethodShort = (method) => {
    if (!method) return '';
    if (method === 'WholeBody') return 'Whole Body';
    if (method === 'Neuro') return 'Neuro';
    return method;
  };

  // Format cryopreservation disclosure display (information disclosure)
  const formatCryoDisclosure = (disclosure) => {
    if (!disclosure) return styleConfig.display.item.empty;
    if (disclosure === 'freely') return 'Alcor is authorized to freely release Cryopreservation Member information at its discretion';
    if (disclosure === 'confidential') return 'Alcor will make reasonable efforts to maintain confidentiality of Cryopreservation Member information';
    return disclosure;
  };

  // Format member public disclosure display (name disclosure)
  const formatMemberDisclosure = (disclosure) => {
    if (!disclosure) return styleConfig.display.item.empty;
    if (disclosure === 'freely') return 'I give Alcor permission to freely release my name and related Alcor membership status at its discretion';
    if (disclosure === 'confidential') return 'Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor\'s General Terms and Conditions';
    return disclosure;
  };

  // Format disclosure short for mobile preview
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

  // Format remains handling display
  const formatRemainsHandling = (handling) => {
    if (!handling) return styleConfig.display.item.empty;
    if (handling === 'return') return 'Return to designated recipient';
    if (handling === 'donate') return 'Donate to medical research or dispose at Alcor\'s discretion';
    return handling;
  };
  
  // Format address for display
  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return '';
    return parts.join(', ');
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (cryoArrangements?.method) {
      previewParts.push(formatMethodShort(cryoArrangements.method));
    }
    if (cryoArrangements?.cmsWaiver) {
      previewParts.push('CMS Waiver');
    }
    if (cryoArrangements?.cryopreservationDisclosure || cryoArrangements?.memberPublicDisclosure) {
      previewParts.push(formatDisclosureShort(cryoArrangements.cryopreservationDisclosure, cryoArrangements.memberPublicDisclosure));
    }
    
    return previewParts.slice(0, 2).join(' • ');
  };

  // Read-only field component for mobile
  const ReadOnlyField = ({ label, value, helperText }) => (
    <div>
      <label className="text-white/90 text-sm font-medium mb-1.5 block">
        {label}
        {helperText && (
          <span className="text-xs font-normal text-white/60 ml-2">
            {helperText}
          </span>
        )}
      </label>
      <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80">
        {value}
      </div>
    </div>
  );

  // Validate address with Melissa API
  const validateAddressWithMelissa = async (address) => {
    console.log('🔵 === START validateAddressWithMelissa (Recipient) ===');
    console.log('📋 Address to validate:', address);
    
    try {
      const params = new URLSearchParams({
        id: MELISSA_API_KEY,
        a1: address.street || '',
        a2: '',
        loc: address.city || '',
        admarea: address.state || '',
        postal: address.postalCode || '',
        ctry: address.country || 'US',
        format: 'json'
      });

      const fullUrl = `${MELISSA_API_URL}?${params}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = await response.json();
      console.log('📦 Melissa API Response:', JSON.stringify(data, null, 2));

      // Check for transmission errors
      if (data.TransmissionResults && data.TransmissionResults !== '' && data.TransmissionResults !== 'GE00') {
        console.log('❌ API Error detected');
        return {
          success: false,
          error: 'Address validation service error. Please try again.'
        };
      }

      if (data.Version && data.Records && data.Records.length > 0) {
        const record = data.Records[0];
        const addressVerificationCode = record.Results || '';
        
        // Deliverable codes
        const deliverableCodes = ['AV25', 'AV24', 'AV23', 'AV22', 'AV21'];
        const isDeliverable = deliverableCodes.some(code => addressVerificationCode.includes(code));
        
        if (isDeliverable) {
          const validatedAddress = {
            street: record.AddressLine1 || '',
            city: record.Locality || '',
            state: record.AdministrativeArea || '',
            postalCode: record.PostalCode || '',
            country: record.CountryISO3166_1_Alpha2 || 'US'
          };

          // Check if different
          const isDifferent = 
            validatedAddress.street.toLowerCase() !== (address.street || '').toLowerCase() ||
            validatedAddress.city.toLowerCase() !== (address.city || '').toLowerCase() ||
            validatedAddress.state.toLowerCase() !== (address.state || '').toLowerCase() ||
            validatedAddress.postalCode !== (address.postalCode || '');

          console.log('✅ Valid address, different:', isDifferent);
          console.log('🔵 === END validateAddressWithMelissa ===\n');

          return {
            success: true,
            isValid: true,
            isDifferent,
            suggestedAddress: validatedAddress,
            originalAddress: address
          };
        }
      }
      
      console.log('❌ Address not deliverable');
      return {
        success: true,
        isValid: false,
        error: 'This address could not be verified. Please double-check it\'s correct.'
      };
      
    } catch (error) {
      console.error('❌ Melissa API error:', error);
      return {
        success: false,
        error: 'Address validation service is temporarily unavailable.'
      };
    }
  };

  // Handle save with validation
  const handleSaveWithValidation = async () => {
    console.log('🟢 === START handleSaveWithValidation ===');
    
    // Prevent double-clicks
    if (validatingAddress || savingSection === 'cryoArrangements') {
      console.log('⚠️ Already processing, ignoring click');
      return;
    }
    
    setValidatingAddress(true);
    setValidationError('');

    try {
      // Check if we need to validate recipient address
      if (cryoArrangements.remainsHandling === 'return' && 
          (cryoArrangements.recipientMailingStreet || 
           cryoArrangements.recipientMailingCity || 
           cryoArrangements.recipientMailingState || 
           cryoArrangements.recipientMailingPostalCode)) {
        
        // Check if all required fields are filled
        if (!cryoArrangements.recipientMailingStreet || 
            !cryoArrangements.recipientMailingCity || 
            !cryoArrangements.recipientMailingState || 
            !cryoArrangements.recipientMailingPostalCode) {
          setValidationError('Please complete all recipient address fields.');
          setValidatingAddress(false);
          return;
        }
        
        console.log('📬 Validating recipient address...');
        const recipientValidation = await validateAddressWithMelissa({
          street: cryoArrangements.recipientMailingStreet,
          city: cryoArrangements.recipientMailingCity,
          state: cryoArrangements.recipientMailingState,
          postalCode: cryoArrangements.recipientMailingPostalCode,
          country: cryoArrangements.recipientMailingCountry || 'US'
        });

        if (!recipientValidation.success || !recipientValidation.isValid) {
          setValidationError(recipientValidation.error || 'Recipient address could not be verified.');
          setValidatingAddress(false);
          return;
        }

        if (recipientValidation.isDifferent && setAddressValidationModal) {
          // Show modal for correction
          setAddressValidationModal({
            isOpen: true,
            addressType: 'Recipient',
            originalAddress: recipientValidation.originalAddress,
            suggestedAddress: cleanAddressObject(recipientValidation.suggestedAddress),
            onAccept: () => {
              // Update the recipient address fields
              setCryoArrangements({
                ...cryoArrangements,
                recipientMailingStreet: recipientValidation.suggestedAddress.street,
                recipientMailingCity: recipientValidation.suggestedAddress.city,
                recipientMailingState: recipientValidation.suggestedAddress.state,
                recipientMailingPostalCode: recipientValidation.suggestedAddress.postalCode,
                recipientMailingCountry: recipientValidation.suggestedAddress.country
              });
              setValidationError('');
              // Continue with save after accepting
              saveCryoArrangements();
            }
          });
          setValidatingAddress(false);
          return;
        }
      }

      // All validation passed, proceed with save
      setValidatingAddress(false);
      await saveCryoArrangements();
      
    } catch (error) {
      console.error('❌ Error during validation:', error);
      setValidationError('An error occurred during validation. Please try again.');
      setValidatingAddress(false);
    }
  };

  // Handle save anyway (skip validation)
  const handleSaveAnyway = () => {
    console.log('🟡 Save Anyway clicked');
    setValidationError('');
    saveCryoArrangements();
  };

  return (
    <div className={isMobile ? "" : styleConfig.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          title="Cryopreservation Arrangements"
          preview={getMobilePreview()}
          subtitle="Your cryopreservation method and handling preferences."
          isEditMode={editMode.cryoArrangements}
        >
          {/* Display Mode */}
          {!editMode.cryoArrangements ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Method of Cryopreservation" 
                  value={formatMethod(cryoArrangements.method)} 
                />
                <DisplayField 
                  label="CMS Fee Waiver" 
                  value={cryoArrangements.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No'} 
                />
                <DisplayField 
                  label="Non-Cryopreserved Remains Handling" 
                  value={formatRemainsHandling(cryoArrangements.remainsHandling)} 
                />
                {cryoArrangements.remainsHandling === 'return' && (
                  <>
                    <DisplayField 
                      label="Recipient Name" 
                      value={cryoArrangements.recipientName} 
                    />
                    <DisplayField 
                      label="Recipient Phone" 
                      value={cryoArrangements.recipientPhone} 
                    />
                    <DisplayField 
                      label="Recipient Email" 
                      value={cryoArrangements.recipientEmail} 
                    />
                    <DisplayField 
                      label="Recipient Mailing Address" 
                      value={formatAddress(
                        cryoArrangements.recipientMailingStreet,
                        cryoArrangements.recipientMailingCity,
                        cryoArrangements.recipientMailingState,
                        cryoArrangements.recipientMailingPostalCode,
                        cryoArrangements.recipientMailingCountry
                      ) || styleConfig.display.item.empty} 
                    />
                  </>
                )}
                <DisplayField 
                  label="Cryopreservation Information Disclosure" 
                  value={formatCryoDisclosure(cryoArrangements.cryopreservationDisclosure)} 
                />
                <DisplayField 
                  label="Member Name Disclosure" 
                  value={formatMemberDisclosure(cryoArrangements.memberPublicDisclosure)} 
                />
              </div>
              
              {/* Add info message for CryoMembers on mobile */}
              {memberCategory === 'CryoMember' && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-400/30 rounded-lg">
                  <p className="text-xs text-blue-300">
                    These settings are locked after becoming a Cryopreservation Member. 
                    Contact Alcor staff if changes are needed.
                  </p>
                </div>
              )}
              
              <ActionButtons 
                editMode={false}
                onEdit={() => canEdit && toggleEditMode && toggleEditMode('cryoArrangements')}
                hideEditButton={!canEdit}
              />
            </>
          ) : (
            /* Edit Mode - only accessible for CryoApplicants */
            <>
              <div className="space-y-4">
                {/* Method - Display Only */}
                <ReadOnlyField
                  label="Method of Cryopreservation"
                  value={formatMethod(cryoArrangements.method)}
                  helperText="(Contact Alcor staff to make changes)"
                />

                {/* CMS Waiver - Display Only */}
                <ReadOnlyField
                  label="CMS Fee Waiver"
                  value={cryoArrangements.cmsWaiver ? 'Yes - Waiving $200 annual fee with $20,000 additional funding' : 'No'}
                  helperText="(Contact Alcor staff to make changes)"
                />

                <FormSelect
                  label="Non-Cryopreserved Remains Handling"
                  value={cryoArrangements.remainsHandling || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, remainsHandling: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="return">Return to designated recipient</option>
                  <option value="donate">Donate to medical research or dispose at Alcor's discretion</option>
                </FormSelect>

                {cryoArrangements.remainsHandling === 'return' && (
                  <>
                    <FormInput
                      label="Recipient Name"
                      value={cryoArrangements.recipientName || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, recipientName: e.target.value})}
                    />
                    <FormInput
                      label="Recipient Phone"
                      type="tel"
                      value={cryoArrangements.recipientPhone || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, recipientPhone: e.target.value})}
                    />
                    <FormInput
                      label="Recipient Email"
                      type="email"
                      value={cryoArrangements.recipientEmail || ''}
                      onChange={(e) => setCryoArrangements({...cryoArrangements, recipientEmail: e.target.value})}
                    />
                    
                    {/* Recipient Mailing Address */}
                    <div>
                      <h4 className="text-white/90 text-sm font-medium mb-2 mt-4">Recipient Mailing Address</h4>
                      <div className="space-y-3">
                        <FormInput
                          label="Street Address"
                          value={cryoArrangements.recipientMailingStreet || ''}
                          onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingStreet: e.target.value})}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput
                            label="City"
                            value={cryoArrangements.recipientMailingCity || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCity: e.target.value})}
                          />
                          <FormInput
                            label="State/Province"
                            value={cryoArrangements.recipientMailingState || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingState: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput
                            label="Zip/Postal Code"
                            value={cryoArrangements.recipientMailingPostalCode || ''}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingPostalCode: e.target.value})}
                          />
                          <FormInput
                            label="Country"
                            value={cryoArrangements.recipientMailingCountry || 'US'}
                            onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCountry: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <FormSelect
                  label="Cryopreservation Information Disclosure"
                  value={cryoArrangements.cryopreservationDisclosure || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, cryopreservationDisclosure: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="freely">Alcor is authorized to freely release Cryopreservation Member information</option>
                  <option value="confidential">Alcor will make reasonable efforts to maintain confidentiality</option>
                </FormSelect>

                <FormSelect
                  label="Member Name Disclosure"
                  value={cryoArrangements.memberPublicDisclosure || ''}
                  onChange={(e) => setCryoArrangements({...cryoArrangements, memberPublicDisclosure: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="freely">I give Alcor permission to freely release my name</option>
                  <option value="confidential">Alcor is to make reasonable efforts to maintain confidentiality</option>
                </FormSelect>
              </div>
              
              {validationError && (
                <p className="mt-4 text-sm text-red-300">{validationError}</p>
              )}
              
              <ActionButtons 
                editMode={true}
                onSave={handleSaveWithValidation}
                onCancel={() => cancelEdit && cancelEdit('cryoArrangements')}
                saving={savingSection === 'cryoArrangements' || validatingAddress}
                saveText={validatingAddress ? 'Validating...' : savingSection === 'cryoArrangements' ? 'Saving...' : 'Save'}
                showSaveAnyway={!!validationError}
                onSaveAnyway={handleSaveAnyway}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig.section.innerPadding}>
          {/* Desktop Header */}
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

          {/* Desktop Display Mode */}
          {!editMode.cryoArrangements ? (
            <>
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
                    <InfoDisplay 
                      label="Recipient Mailing Address" 
                      value={formatAddress(
                        cryoArrangements.recipientMailingStreet,
                        cryoArrangements.recipientMailingCity,
                        cryoArrangements.recipientMailingState,
                        cryoArrangements.recipientMailingPostalCode,
                        cryoArrangements.recipientMailingCountry
                      )} 
                    />
                  </>
                )}
                <InfoDisplay 
                  label="Cryopreservation Information Disclosure" 
                  value={formatCryoDisclosure(cryoArrangements.cryopreservationDisclosure)} 
                />
                <InfoDisplay 
                  label="Member Name Disclosure" 
                  value={formatMemberDisclosure(cryoArrangements.memberPublicDisclosure)} 
                />
              </dl>
              
              {/* Add info message for CryoMembers */}
              {memberCategory === 'CryoMember' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    These settings are locked after becoming a Cryopreservation Member. 
                    Contact Alcor staff if changes are needed.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Desktop Edit Mode - Form */
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
                <>
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
                  
                  {/* Recipient Mailing Address */}
                  <div className="mb-6">
                    <h3 className="font-medium text-[#2a2346] mb-4">Recipient Mailing Address</h3>
                    <div className={styleConfig.section.grid.twoColumn}>
                      <Input
                        containerClassName="col-span-2"
                        label="Street Address"
                        type="text"
                        value={cryoArrangements.recipientMailingStreet || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingStreet: e.target.value})}
                        disabled={!editMode.cryoArrangements}
                      />
                      <Input
                        label="City"
                        type="text"
                        value={cryoArrangements.recipientMailingCity || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCity: e.target.value})}
                        disabled={!editMode.cryoArrangements}
                      />
                      <Input
                        label="State/Province"
                        type="text"
                        value={cryoArrangements.recipientMailingState || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingState: e.target.value})}
                        disabled={!editMode.cryoArrangements}
                      />
                      <Input
                        label="Zip/Postal Code"
                        type="text"
                        value={cryoArrangements.recipientMailingPostalCode || ''}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingPostalCode: e.target.value})}
                        disabled={!editMode.cryoArrangements}
                      />
                      <Input
                        label="Country"
                        type="text"
                        value={cryoArrangements.recipientMailingCountry || 'US'}
                        onChange={(e) => setCryoArrangements({...cryoArrangements, recipientMailingCountry: e.target.value})}
                        disabled={!editMode.cryoArrangements}
                      />
                    </div>
                    {validationError && (
                      <p className="mt-2 text-sm text-red-600">{validationError}</p>
                    )}
                  </div>
                </>
              )}

              <Select
                label="Cryopreservation Information Disclosure"
                value={cryoArrangements.cryopreservationDisclosure || ''}
                onChange={(e) => setCryoArrangements({...cryoArrangements, cryopreservationDisclosure: e.target.value})}
                disabled={!editMode.cryoArrangements}
              >
                <option value="">Select...</option>
                <option value="freely">Alcor is authorized to freely release Cryopreservation Member information</option>
                <option value="confidential">Alcor will make reasonable efforts to maintain confidentiality</option>
              </Select>

              <Select
                label="Member Name Disclosure"
                value={cryoArrangements.memberPublicDisclosure || ''}
                onChange={(e) => setCryoArrangements({...cryoArrangements, memberPublicDisclosure: e.target.value})}
                disabled={!editMode.cryoArrangements}
              >
                <option value="">Select...</option>
                <option value="freely">I give Alcor permission to freely release my name</option>
                <option value="confidential">Alcor is to make reasonable efforts to maintain confidentiality</option>
              </Select>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            {editMode?.cryoArrangements ? (
              <div className="flex">
                <WhiteButton
                  text="Cancel"
                  onClick={() => cancelEdit && cancelEdit('cryoArrangements')}
                  className="scale-75 -mr-8"
                  spinStar={false}
                />
                {validationError && (
                  <WhiteButton
                    text="Save Anyway"
                    onClick={handleSaveAnyway}
                    className="scale-75 -mr-8"
                    spinStar={false}
                  />
                )}
                <PurpleButton
                  text={validatingAddress ? 'Validating...' : savingSection === 'saved' ? 'Saved' : savingSection === 'cryoArrangements' ? 'Saving...' : 'Save'}
                  onClick={handleSaveWithValidation}
                  className="scale-75"
                  spinStar={false}
                  disabled={savingSection === 'cryoArrangements' || validatingAddress}
                />
              </div>
            ) : (
              // Only show Edit button for CryoApplicants
              canEdit && (
                <RainbowButton
                  text="Edit"
                  onClick={() => toggleEditMode && toggleEditMode('cryoArrangements')}
                  className="scale-75"
                  spinStar={true}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CryoArrangementsSection;