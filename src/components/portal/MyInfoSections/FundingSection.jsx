import React, { useState, useEffect } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import { memberCategoryConfig, isSectionEditable } from '../memberCategoryConfig';
import { findInsuranceCompany } from '../utils/lifeInsuranceCompanyMatcher';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.value}>{value || styleConfig.display.item.empty}</dd>
  </div>
);

const FundingSection = ({ 
  funding, 
  setFunding, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveFunding, 
  savingSection,
  memberCategory 
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
  
  // Check if this section is editable for the current member category
  const canEditSection = isSectionEditable(memberCategory, 'funding');
  
  // Override edit mode if user is not allowed to edit
  const effectiveEditMode = editMode.funding && canEditSection;
  
  // Format funding type display
  const formatFundingType = (type) => {
    if (!type) return styleConfig.display.item.empty;
    const typeMap = {
      'Life Insurance': 'Life Insurance',
      'Trust': 'Trust',
      'Prepaid': 'Prepaid',
      'Other': 'Other'
    };
    return typeMap[type] || type;
  };

  // Format policy type display
  const formatPolicyType = (type) => {
    if (!type) return styleConfig.display.item.empty;
    const typeMap = {
      'Term': 'Term',
      'Whole Life': 'Whole Life',
      'Universal': 'Universal',
      'Term Life': 'Term',
      'Whole': 'Whole Life'
    };
    return typeMap[type] || type;
  };

  // Format face amount display
  const formatFaceAmount = (amount) => {
    if (!amount) return styleConfig.display.item.empty;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return styleConfig.display.item.empty;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format phone number display
  const formatPhone = (phone) => {
    if (!phone) return styleConfig.display.item.empty;
    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (xxx) xxx-xxxx
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (funding?.fundingType) {
      previewParts.push(formatFundingType(funding.fundingType));
    }
    if (funding?.fundingType === 'Life Insurance' && funding?.companyName) {
      previewParts.push(funding.companyName);
    }
    if (funding?.fundingType === 'Life Insurance' && funding?.faceAmount) {
      previewParts.push(formatFaceAmount(funding.faceAmount));
    }
    
    return previewParts.slice(0, 2).join(' • ');
  };

  // Get required fields based on member category
  const requiredFields = memberCategoryConfig[memberCategory]?.sections.funding?.requiredFields || [];
  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);

  // Render company name with link if matched
  const renderCompanyName = () => {
    const companyMatch = findInsuranceCompany(funding?.companyName);
    
    if (companyMatch) {
      return (
        <>
          {funding.companyName || styleConfig.display.item.empty}
          {' '}
          <a 
            href={companyMatch.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 inline-flex align-text-bottom"
            title={`Visit ${funding.companyName} website`}
            style={{ position: 'relative', top: '-1px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </>
      );
    }
    
    return funding.companyName || styleConfig.display.item.empty;
  };

  return (
    <div className={isMobile ? "" : styleConfig.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Funding/Life Insurance"
          preview={getMobilePreview()}
          subtitle="Your cryopreservation funding arrangements."
          isEditMode={effectiveEditMode}
        >
          {/* Display Mode */}
          {!effectiveEditMode ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Funding Type" 
                  value={formatFundingType(funding.fundingType)}
                  required={isFieldRequired('fundingType')}
                />
                
                {/* Only show Life Insurance fields if that's the funding type */}
                {funding.fundingType === 'Life Insurance' && (
                  <>
                    {/* Company Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Insurance Company</h4>
                      <DisplayField 
                        label="Company Name" 
                        value={renderCompanyName()}
                        required={isFieldRequired('companyName')}
                      />
                      <DisplayField 
                        label="Company Phone" 
                        value={formatPhone(funding.companyPhone)}
                        required={isFieldRequired('companyPhone')}
                      />
                      <DisplayField 
                        label="Company Fax" 
                        value={formatPhone(funding.companyFax)}
                      />
                      <DisplayField 
                        label="Company Address" 
                        value={[
                          funding.companyStreet,
                          funding.companyCity && funding.companyState ? 
                            `${funding.companyCity}, ${funding.companyState} ${funding.companyPostalCode}` : '',
                          funding.companyCountry
                        ].filter(Boolean).join('\n')}
                      />
                    </div>

                    {/* Policy Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <DisplayField 
                        label="Policy Number" 
                        value={funding.policyNumber}
                        required={isFieldRequired('policyNumber')}
                      />
                      <DisplayField 
                        label="Policy Type" 
                        value={formatPolicyType(funding.policyType)}
                        required={isFieldRequired('policyType')}
                      />
                      <DisplayField 
                        label="Face Amount" 
                        value={formatFaceAmount(funding.faceAmount)}
                        required={isFieldRequired('faceAmount')}
                      />
                      <DisplayField 
                        label="Annual Premium" 
                        value={formatFaceAmount(funding.annualPremium)}
                      />
                      <DisplayField 
                        label="Date Issued" 
                        value={formatDate(funding.dateIssued)}
                      />
                      {funding.termLength && (
                        <DisplayField 
                          label="Term Length" 
                          value={`${funding.termLength} years`}
                        />
                      )}
                    </div>

                    {/* Agent Information Section - Show if agent data exists */}
                    {(funding.agentName || funding.agentEmail || funding.agentPhone) && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Information</h4>
                        <DisplayField 
                          label="Agent Name" 
                          value={funding.agentName}
                        />
                        <DisplayField 
                          label="Agent Email" 
                          value={funding.agentEmail}
                        />
                        <DisplayField 
                          label="Agent Phone" 
                          value={formatPhone(funding.agentPhone)}
                        />
                      </div>
                    )}
                  </>
                )}
                
                {/* Show simple info for other funding types */}
                {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                  <div className="pt-4 text-sm text-gray-600">
                    {funding.fundingType === 'Trust' && (
                      <p>Funding via trust. Please ensure Alcor Life Extension Foundation is named as beneficiary.</p>
                    )}
                    {funding.fundingType === 'Prepaid' && (
                      <p>Prepaid funding arrangement.</p>
                    )}
                    {funding.fundingType === 'Other' && (
                      <p>Alternative funding arrangement.</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Show edit button only if editable, otherwise show message */}
              {!canEditSection ? (
                <ActionButtons 
                  editMode={false}
                  onEdit={() => toggleEditMode && toggleEditMode('funding')}
                />
              ) : (
                <div className={styleConfig.nonEditable.mobileWrapper}>
                  <p className={styleConfig.nonEditable.mobileText}>
                    Funding information cannot be edited. Contact membership@alcor.org for changes.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <FormSelect
                  label="Funding Type"
                  value={funding.fundingType || ''}
                  onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
                  required={isFieldRequired('fundingType')}
                >
                  <option value="">Select...</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Trust">Trust</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="Other">Other</option>
                </FormSelect>

                {funding.fundingType === 'Life Insurance' && (
                  <>
                    {/* Company Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Insurance Company</h4>
                      <FormInput
                        label="Company Name"
                        value={funding.companyName || ''}
                        onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                        required={isFieldRequired('companyName')}
                        placeholder="e.g., MetLife, Prudential"
                      />
                      <FormInput
                        label="Company Phone"
                        type="tel"
                        value={funding.companyPhone || ''}
                        onChange={(e) => setFunding({...funding, companyPhone: e.target.value})}
                        required={isFieldRequired('companyPhone')}
                        placeholder="(555) 123-4567"
                      />
                      <FormInput
                        label="Company Fax"
                        type="tel"
                        value={funding.companyFax || ''}
                        onChange={(e) => setFunding({...funding, companyFax: e.target.value})}
                        placeholder="(555) 123-4568"
                      />
                      <FormInput
                        label="Company Street Address"
                        value={funding.companyStreet || ''}
                        onChange={(e) => setFunding({...funding, companyStreet: e.target.value})}
                        required={isFieldRequired('companyStreet')}
                        placeholder="123 Main Street"
                      />
                      <FormInput
                        label="City"
                        value={funding.companyCity || ''}
                        onChange={(e) => setFunding({...funding, companyCity: e.target.value})}
                        required={isFieldRequired('companyCity')}
                        placeholder="New York"
                      />
                      <FormInput
                        label="State/Province"
                        value={funding.companyState || ''}
                        onChange={(e) => setFunding({...funding, companyState: e.target.value})}
                        required={isFieldRequired('companyState')}
                        placeholder="NY"
                      />
                      <FormInput
                        label="Postal Code"
                        value={funding.companyPostalCode || ''}
                        onChange={(e) => setFunding({...funding, companyPostalCode: e.target.value})}
                        required={isFieldRequired('companyPostalCode')}
                        placeholder="10001"
                      />
                      <FormInput
                        label="Country"
                        value={funding.companyCountry || ''}
                        onChange={(e) => setFunding({...funding, companyCountry: e.target.value})}
                        required={isFieldRequired('companyCountry')}
                        placeholder="USA"
                      />
                    </div>

                    {/* Policy Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <FormInput
                        label="Policy Number"
                        value={funding.policyNumber || ''}
                        onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                        required={isFieldRequired('policyNumber')}
                        placeholder="Enter policy number"
                      />
                      <FormSelect
                        label="Policy Type"
                        value={funding.policyType || ''}
                        onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                        required={isFieldRequired('policyType')}
                      >
                        <option value="">Select...</option>
                        <option value="Term">Term</option>
                        <option value="Whole Life">Whole Life</option>
                        <option value="Universal">Universal</option>
                      </FormSelect>
                      <FormInput
                        label="Face Amount"
                        type="number"
                        value={funding.faceAmount || ''}
                        onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                        required={isFieldRequired('faceAmount')}
                        placeholder="e.g., 200000"
                      />
                      <FormInput
                        label="Annual Premium"
                        type="number"
                        value={funding.annualPremium || ''}
                        onChange={(e) => setFunding({...funding, annualPremium: e.target.value})}
                        placeholder="e.g., 2400"
                      />
                      <FormInput
                        label="Date Issued"
                        type="date"
                        value={funding.dateIssued || ''}
                        onChange={(e) => setFunding({...funding, dateIssued: e.target.value})}
                      />
                      {funding.policyType === 'Term' && (
                        <FormInput
                          label="Term Length (years)"
                          type="number"
                          value={funding.termLength || ''}
                          onChange={(e) => setFunding({...funding, termLength: e.target.value})}
                          placeholder="e.g., 20"
                        />
                      )}
                    </div>

                    {/* Agent Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Information</h4>
                      <div className="mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={funding.hasAgent || false}
                            onChange={(e) => setFunding({...funding, hasAgent: e.target.checked})}
                            className="mr-2"
                          />
                          <span className="text-sm">I have a life insurance agent</span>
                        </label>
                      </div>
                      {/* Show agent fields if checkbox is checked OR if agent data exists */}
                      {(funding.hasAgent || funding.agentName || funding.agentEmail || funding.agentPhone) && (
                        <>
                          <FormInput
                            label="Agent Name"
                            value={funding.agentName || ''}
                            onChange={(e) => setFunding({...funding, agentName: e.target.value})}
                            placeholder="John Smith"
                          />
                          <FormInput
                            label="Agent Email"
                            type="email"
                            value={funding.agentEmail || ''}
                            onChange={(e) => setFunding({...funding, agentEmail: e.target.value})}
                            placeholder="agent@example.com"
                          />
                          <FormInput
                            label="Agent Phone"
                            type="tel"
                            value={funding.agentPhone || ''}
                            onChange={(e) => setFunding({...funding, agentPhone: e.target.value})}
                            placeholder="(555) 123-4567"
                          />
                        </>
                      )}
                    </div>
                  </>
                )}
                
                {/* Show helper text for other funding types */}
                {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {funding.fundingType === 'Trust' && 
                        "Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary for your cryopreservation funding."}
                      {funding.fundingType === 'Prepaid' && 
                        "Thank you for choosing to prepay. An Alcor representative will contact you to complete the funding arrangement."}
                      {funding.fundingType === 'Other' && 
                        "An Alcor representative will contact you to discuss your funding arrangement."}
                    </p>
                  </div>
                )}
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveFunding}
                onCancel={() => cancelEdit && cancelEdit('funding')}
                saving={savingSection === 'funding'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig.section.innerPadding}>
          {/* Desktop Header */}
          <div className={styleConfig.header.wrapper}>
            <div className={styleConfig.sectionIcons.funding}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={styleConfig.header.textContainer}>
              <h2 className={styleConfig.header.title}>Funding/Life Insurance</h2>
              <p className={styleConfig.header.subtitle}>
                Your cryopreservation funding arrangements.
              </p>
            </div>
          </div>

          {/* Desktop Display Mode */}
          {!effectiveEditMode ? (
            <div>
              <dl className={styleConfig.display.dl.wrapperOne}>
                <InfoDisplay 
                  label="Funding Type" 
                  value={formatFundingType(funding.fundingType)}
                  className={styleConfig.display.grid.fullSpan}
                />
              </dl>
              
              {funding.fundingType === 'Life Insurance' && (
                <>
                  {/* Company Information */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Company</h3>
                    <dl className={styleConfig.display.dl.wrapperTwo}>
                      <InfoDisplay label="Company Name" value={renderCompanyName()} />
                      <InfoDisplay label="Company Phone" value={formatPhone(funding.companyPhone)} />
                      <InfoDisplay label="Company Fax" value={formatPhone(funding.companyFax)} />
                      <InfoDisplay 
                        label="Company Address" 
                        value={[
                          funding.companyStreet,
                          funding.companyCity && funding.companyState ? 
                            `${funding.companyCity}, ${funding.companyState} ${funding.companyPostalCode}` : '',
                          funding.companyCountry
                        ].filter(Boolean).join(', ')}
                        className={styleConfig.display.grid.fullSpan}
                      />
                    </dl>
                  </div>

                  {/* Policy Information */}
                  <div className="mt-6">
                    <dl className={styleConfig.display.dl.wrapperTwo}>
                      <InfoDisplay label="Policy Number" value={funding.policyNumber} />
                      <InfoDisplay label="Policy Type" value={formatPolicyType(funding.policyType)} />
                      <InfoDisplay label="Face Amount" value={formatFaceAmount(funding.faceAmount)} />
                      <InfoDisplay label="Annual Premium" value={formatFaceAmount(funding.annualPremium)} />
                      <InfoDisplay label="Date Issued" value={formatDate(funding.dateIssued)} />
                      {funding.termLength && (
                        <InfoDisplay label="Term Length" value={`${funding.termLength} years`} />
                      )}
                    </dl>
                  </div>

                  {/* Agent Information - Show if agent data exists */}
                  {(funding.agentName || funding.agentEmail || funding.agentPhone) && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Information</h3>
                      <dl className={styleConfig.display.dl.wrapperTwo}>
                        <InfoDisplay label="Agent Name" value={funding.agentName} />
                        <InfoDisplay label="Agent Email" value={funding.agentEmail} />
                        <InfoDisplay label="Agent Phone" value={formatPhone(funding.agentPhone)} />
                      </dl>
                    </div>
                  )}
                </>
              )}
              
              {/* Show simple info for other funding types */}
              {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {funding.fundingType === 'Trust' && 
                      "Funding via trust. Please ensure Alcor Life Extension Foundation is properly named as beneficiary in your trust documents."}
                    {funding.fundingType === 'Prepaid' && 
                      "Prepaid funding arrangement on file."}
                    {funding.fundingType === 'Other' && 
                      "Alternative funding arrangement on file."}
                  </p>
                </div>
              )}
              
            </div>
          ) : (
            /* Desktop Edit Mode - Form */
            <div className={styleConfig.form.fieldSpacing}>
              <Select
                label="Funding Type"
                value={funding.fundingType || ''}
                onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
                disabled={!effectiveEditMode}
                required={isFieldRequired('fundingType')}
              >
                <option value="">Select...</option>
                <option value="Life Insurance">Life Insurance</option>
                <option value="Trust">Trust</option>
                <option value="Prepaid">Prepaid</option>
                <option value="Other">Other</option>
              </Select>

              {funding.fundingType === 'Life Insurance' && (
                <>
                  {/* Company Information */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Company</h3>
                    <div className={styleConfig.section.grid.twoColumn}>
                      <Input
                        label="Company Name"
                        type="text"
                        value={funding.companyName || ''}
                        onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyName')}
                        placeholder="e.g., MetLife, Prudential"
                      />
                      <Input
                        label="Company Phone"
                        type="tel"
                        value={funding.companyPhone || ''}
                        onChange={(e) => setFunding({...funding, companyPhone: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyPhone')}
                        placeholder="(555) 123-4567"
                      />
                      <Input
                        label="Company Fax"
                        type="tel"
                        value={funding.companyFax || ''}
                        onChange={(e) => setFunding({...funding, companyFax: e.target.value})}
                        disabled={!effectiveEditMode}
                        placeholder="(555) 123-4568"
                      />
                      <Input
                        label="Company Street Address"
                        type="text"
                        value={funding.companyStreet || ''}
                        onChange={(e) => setFunding({...funding, companyStreet: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyStreet')}
                        placeholder="123 Main Street"
                      />
                      <Input
                        label="City"
                        type="text"
                        value={funding.companyCity || ''}
                        onChange={(e) => setFunding({...funding, companyCity: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyCity')}
                        placeholder="New York"
                      />
                      <Input
                        label="State/Province"
                        type="text"
                        value={funding.companyState || ''}
                        onChange={(e) => setFunding({...funding, companyState: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyState')}
                        placeholder="NY"
                      />
                      <Input
                        label="Postal Code"
                        type="text"
                        value={funding.companyPostalCode || ''}
                        onChange={(e) => setFunding({...funding, companyPostalCode: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyPostalCode')}
                        placeholder="10001"
                      />
                      <Input
                        label="Country"
                        type="text"
                        value={funding.companyCountry || ''}
                        onChange={(e) => setFunding({...funding, companyCountry: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('companyCountry')}
                        placeholder="USA"
                      />
                    </div>
                  </div>

                  {/* Policy Information */}
                  <div className="mt-6">
                    <div className={styleConfig.section.grid.twoColumn}>
                      <Input
                        label="Policy Number"
                        type="text"
                        value={funding.policyNumber || ''}
                        onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('policyNumber')}
                        placeholder="Enter policy number"
                      />
                      <Select
                        label="Policy Type"
                        value={funding.policyType || ''}
                        onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('policyType')}
                      >
                        <option value="">Select...</option>
                        <option value="Term">Term</option>
                        <option value="Whole Life">Whole Life</option>
                        <option value="Universal">Universal</option>
                      </Select>
                      <Input
                        label="Face Amount"
                        type="number"
                        value={funding.faceAmount || ''}
                        onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                        disabled={!effectiveEditMode}
                        required={isFieldRequired('faceAmount')}
                        placeholder="e.g., 200000"
                      />
                      <Input
                        label="Annual Premium"
                        type="number"
                        value={funding.annualPremium || ''}
                        onChange={(e) => setFunding({...funding, annualPremium: e.target.value})}
                        disabled={!effectiveEditMode}
                        placeholder="e.g., 2400"
                      />
                      <Input
                        label="Date Issued"
                        type="date"
                        value={funding.dateIssued || ''}
                        onChange={(e) => setFunding({...funding, dateIssued: e.target.value})}
                        disabled={!effectiveEditMode}
                      />
                      {funding.policyType === 'Term' && (
                        <Input
                          label="Term Length (years)"
                          type="number"
                          value={funding.termLength || ''}
                          onChange={(e) => setFunding({...funding, termLength: e.target.value})}
                          disabled={!effectiveEditMode}
                          placeholder="e.g., 20"
                        />
                      )}
                    </div>
                  </div>

                  {/* Agent Information */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Information</h3>
                    <div className="mb-4">
                      <Checkbox
                        label="I have a life insurance agent"
                        checked={funding.hasAgent || false}
                        onChange={(e) => setFunding({...funding, hasAgent: e.target.checked})}
                        disabled={!effectiveEditMode}
                      />
                    </div>
                    {/* Show agent fields if checkbox is checked OR if agent data exists */}
                    {(funding.hasAgent || funding.agentName || funding.agentEmail || funding.agentPhone) && (
                      <div className={styleConfig.section.grid.twoColumn}>
                        <Input
                          label="Agent Name"
                          type="text"
                          value={funding.agentName || ''}
                          onChange={(e) => setFunding({...funding, agentName: e.target.value})}
                          disabled={!effectiveEditMode}
                          placeholder="John Smith"
                        />
                        <Input
                          label="Agent Email"
                          type="email"
                          value={funding.agentEmail || ''}
                          onChange={(e) => setFunding({...funding, agentEmail: e.target.value})}
                          disabled={!effectiveEditMode}
                          placeholder="agent@example.com"
                        />
                        <Input
                          label="Agent Phone"
                          type="tel"
                          value={funding.agentPhone || ''}
                          onChange={(e) => setFunding({...funding, agentPhone: e.target.value})}
                          disabled={!effectiveEditMode}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Show helper text for other funding types */}
              {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {funding.fundingType === 'Trust' && 
                      "Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary for your cryopreservation funding."}
                    {funding.fundingType === 'Prepaid' && 
                      "Thank you for choosing to prepay. An Alcor representative will contact you to complete the funding arrangement."}
                    {funding.fundingType === 'Other' && 
                      "An Alcor representative will contact you to discuss your funding arrangement."}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            {effectiveEditMode ? (
              <div className="flex">
                <WhiteButton
                  text="Cancel"
                  onClick={() => cancelEdit && cancelEdit('funding')}
                  className="scale-75 -mr-8"
                  spinStar={false}
                />
                <PurpleButton
                  text={savingSection === 'saved' ? 'Saved' : savingSection === 'funding' ? 'Saving...' : 'Save'}
                  onClick={saveFunding}
                  className="scale-75"
                  spinStar={false}
                  disabled={savingSection === 'funding'}
                />
              </div>
            ) : (
              canEditSection ? (
                <RainbowButton
                  text="Edit"
                  onClick={() => toggleEditMode && toggleEditMode('funding')}
                  className="scale-75"
                  spinStar={true}
                />
              ) : (
                <div className={styleConfig.nonEditable.inlineMessage}>
                  Contact Alcor to update funding information
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FundingSection;