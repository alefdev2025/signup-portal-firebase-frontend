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

const FundingSection = ({ 
  funding, 
  setFunding, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveFunding, 
  savingSection 
}) => {
  // Format funding type display
  const formatFundingType = (type) => {
    if (!type) return styleConfig.display.item.empty;
    if (type === 'LifeInsurance') return 'Life Insurance';
    if (type === 'Trust') return 'Trust';
    if (type === 'Prepaid') return 'Prepaid';
    if (type === 'Other') return 'Other';
    return type;
  };

  // Format policy type display
  const formatPolicyType = (type) => {
    if (!type) return styleConfig.display.item.empty;
    if (type === 'Term') return 'Term';
    if (type === 'Whole') return 'Whole Life';
    if (type === 'Universal') return 'Universal';
    return type;
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

  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
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

        {/* Display Mode */}
        {!editMode.funding ? (
          <dl className={funding.fundingType === 'LifeInsurance' ? styleConfig.display.dl.wrapperTwo : styleConfig.display.dl.wrapperSingle}>
            <InfoDisplay 
              label="Funding Type" 
              value={formatFundingType(funding.fundingType)}
              className={funding.fundingType === 'LifeInsurance' ? styleConfig.display.grid.fullSpan : ''}
            />
            {funding.fundingType === 'LifeInsurance' && (
              <>
                <InfoDisplay 
                  label="Insurance Company Name" 
                  value={funding.companyName} 
                />
                <InfoDisplay 
                  label="Policy Number" 
                  value={funding.policyNumber} 
                />
                <InfoDisplay 
                  label="Policy Type" 
                  value={formatPolicyType(funding.policyType)} 
                />
                <InfoDisplay 
                  label="Face Amount" 
                  value={formatFaceAmount(funding.faceAmount)} 
                />
              </>
            )}
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.form.fieldSpacing}>
            <Select
              label="Funding Type"
              value={funding.fundingType || ''}
              onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
              disabled={!editMode.funding}
            >
              <option value="">Select...</option>
              <option value="LifeInsurance">Life Insurance</option>
              <option value="Trust">Trust</option>
              <option value="Prepaid">Prepaid</option>
              <option value="Other">Other</option>
            </Select>

            {funding.fundingType === 'LifeInsurance' && (
              <div className={styleConfig.section.grid.twoColumn}>
                <Input
                  label="Insurance Company Name"
                  type="text"
                  value={funding.companyName || ''}
                  onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                  disabled={!editMode.funding}
                />
                <Input
                  label="Policy Number"
                  type="text"
                  value={funding.policyNumber || ''}
                  onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                  disabled={!editMode.funding}
                />
                <Select
                  label="Policy Type"
                  value={funding.policyType || ''}
                  onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                  disabled={!editMode.funding}
                >
                  <option value="">Select...</option>
                  <option value="Term">Term</option>
                  <option value="Whole">Whole Life</option>
                  <option value="Universal">Universal</option>
                </Select>
                <Input
                  label="Face Amount"
                  type="number"
                  value={funding.faceAmount || ''}
                  onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                  disabled={!editMode.funding}
                />
              </div>
            )}
          </div>
        )}
        
        <ButtonGroup>
          {editMode.funding ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('funding')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveFunding}
                loading={savingSection === 'funding'}
                disabled={savingSection === 'funding'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('funding')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default FundingSection;