// FundingMobile.jsx
import React, { useState } from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';
import { findInsuranceCompany } from '../utils/lifeInsuranceCompanyMatcher';
import styleConfig2 from '../styleConfig2';

const FundingMobile = ({ 
  funding,
  setFunding,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveFunding,
  savingSection,
  fieldErrors,
  fieldConfig,
  canEdit,
  memberCategory,
  isFieldRequired
}) => {
  const [viewMode, setViewMode] = useState(false);
  
  // Local state for validation errors
  const [localErrors, setLocalErrors] = React.useState({});
  
  // Clear errors when entering/exiting edit mode
  React.useEffect(() => {
    if (editMode.funding) {
      setLocalErrors({});
    }
  }, [editMode.funding]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ funding })) {
          filledRequired++;
        }
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ funding })) {
          filledRecommended++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 0 : 0; // No recommended fields for Funding
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

  const getPreviewText = () => {
    const previewParts = [];
    
    if (funding?.fundingType) {
      previewParts.push(funding.fundingType);
    }
    if (funding?.fundingType === 'Life Insurance' && funding?.companyName) {
      previewParts.push(funding.companyName);
    }
    
    return previewParts.join(' • ') || 'No funding information';
  };

  // Format functions
  const formatFaceAmount = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
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

  // Display field component for view mode
  const DisplayField = ({ label, value, isEmpty = false, isLink = false, linkData = null }) => (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <div className={`text-sm ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}`}>
        {isLink && linkData ? (
          <span className="flex items-center gap-2">
            <span>{value}</span>
            <a 
              href={linkData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 inline-flex"
              title={linkData.title}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </span>
        ) : (
          value || '—'
        )}
      </div>
    </div>
  );

  // Get company match for view mode
  const getCompanyLinkData = () => {
    const companyMatch = findInsuranceCompany(funding?.companyName);
    if (companyMatch) {
      return {
        url: companyMatch.url,
        title: `Visit ${funding.companyName} website`
      };
    }
    return null;
  };

  // Handle save with complete validation
  const handleSave = () => {
    const errors = {};
    
    // Validate funding type (always required)
    if (!funding?.fundingType || !funding.fundingType.trim()) {
      errors.fundingType = "Funding type is required";
    }
    
    // If Life Insurance, validate additional required fields
    if (funding?.fundingType === 'Life Insurance') {
      if (!funding?.companyName || !funding.companyName.trim()) {
        errors.companyName = "Company name is required";
      }
      if (!funding?.policyNumber || !funding.policyNumber.trim()) {
        errors.policyNumber = "Policy number is required";
      }
      if (!funding?.policyType || !funding.policyType.trim()) {
        errors.policyType = "Policy type is required";
      }
      if (!funding?.faceAmount || funding.faceAmount === '') {
        errors.faceAmount = "Face amount is required";
      }
    }
    
    // If there are validation errors, set them and don't save
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    
    // Clear errors and proceed with save
    setLocalErrors({});
    if (saveFunding) {
      saveFunding();
    }
  };

  return (
    <div className="-mx-2">
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
        {/* White Header Section */}
        <div className="bg-white px-6 py-6">
          <div className="flex flex-col gap-5 w-full">
            {/* Top row - Icon and Title */}
            <div className="flex items-center gap-3">
              <div className={styleConfig2.sectionIcons.funding}>
                <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900">Funding/Life Insurance</h3>
            </div>
            
            <div className="border-t border-gray-200"></div>
            
            {/* Content area */}
            <div className="space-y-5">
              {/* Card with subtle shadow and no harsh lines */}
              <div className="relative w-full rounded-lg overflow-hidden shadow-sm bg-white">
                {/* Content section */}
                <div className="px-6 py-6">
                  {/* Header with completion */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="pr-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Funding Details</h3>
                      <p className="text-sm text-gray-600">Your cryopreservation<br />funding arrangements</p>
                    </div>
                    
                    {/* Fixed completion indicator - matching Family and Occupation */}
                    <div className="relative">
                      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                        <circle
                          stroke="#f5f5f5"
                          fill="transparent"
                          strokeWidth={8}
                          r={42}
                          cx={50}
                          cy={50}
                        />
                        <circle
                          stroke="url(#gradient)"
                          fill="transparent"
                          strokeWidth={8}
                          strokeDasharray={`${264} ${264}`}
                          style={{ 
                            strokeDashoffset: 264 - (completionPercentage / 100) * 264,
                            transition: 'stroke-dashoffset 0.5s ease',
                            strokeLinecap: 'round'
                          }}
                          r={42}
                          cx={50}
                          cy={50}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F26430" />
                            <stop offset="100%" stopColor="#512BD9" />
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
                      <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Required Information</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Funding type
                          {funding?.fundingType === 'Life Insurance' && ' and insurance details'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Display Mode - Funding Preview (when not in view or edit mode) */}
              {!editMode.funding && !viewMode && (
                <div className="bg-blue-50/30 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                </div>
              )}
              
              {/* Note for non-editable users */}
              {!canEdit && !editMode.funding && !viewMode && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 text-center">
                    Funding information cannot be edited. Contact info@alcor.org for changes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Section - Shows all details */}
        {viewMode && !editMode.funding && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            <div className="space-y-6">
              {/* Funding Type */}
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">Funding Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <DisplayField 
                    label="Funding Type" 
                    value={funding?.fundingType}
                    isEmpty={!funding?.fundingType}
                  />
                </div>
              </div>

              {/* Life Insurance Details */}
              {funding?.fundingType === 'Life Insurance' && (
                <>
                  {/* Company Information */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Insurance Company</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                      <DisplayField 
                        label="Company Name" 
                        value={funding?.companyName}
                        isEmpty={!funding?.companyName}
                        isLink={!!getCompanyLinkData()}
                        linkData={getCompanyLinkData()}
                      />
                      <DisplayField 
                        label="Company Phone" 
                        value={formatPhone(funding?.companyPhone)}
                        isEmpty={!funding?.companyPhone}
                      />
                    </div>
                  </div>

                  {/* Policy Information */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Policy Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                      <DisplayField 
                        label="Policy Number" 
                        value={funding?.policyNumber}
                        isEmpty={!funding?.policyNumber}
                      />
                      <DisplayField 
                        label="Policy Type" 
                        value={funding?.policyType}
                        isEmpty={!funding?.policyType}
                      />
                      <DisplayField 
                        label="Face Amount" 
                        value={formatFaceAmount(funding?.faceAmount)}
                        isEmpty={!funding?.faceAmount}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Other Funding Types */}
              {funding?.fundingType && funding?.fundingType !== 'Life Insurance' && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {funding.fundingType === 'Trust' && 
                      "Trust funding arrangement on file. Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary."}
                    {funding.fundingType === 'Prepaid' && 
                      "Prepaid funding arrangement on file. Thank you for choosing to prepay."}
                    {funding.fundingType === 'Other' && 
                      "Alternative funding arrangement on file. An Alcor representative will contact you to discuss your funding arrangement."}
                  </p>
                </div>
              )}

              {/* Note for non-editable users */}
              {!canEdit && (
                <div className="bg-yellow-50 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-800 text-center">
                    Funding information cannot be edited. Contact info@alcor.org for changes.
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
        {editMode.funding && canEdit && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            {/* Error Message Section - Only show if there are errors after attempting to save */}
            {localErrors && Object.keys(localErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Please fix the following errors:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {Object.entries(localErrors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Funding Information</h4>
                
                <div className="space-y-4">
                  <FormSelect
                    label="Funding Type *"
                    value={funding?.fundingType || ''}
                    onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
                    error={fieldErrors?.fundingType || localErrors.fundingType}
                    disabled={savingSection === 'funding'}
                    required={isFieldRequired ? isFieldRequired('fundingType') : true}
                  >
                    <option value="">Select...</option>
                    <option value="Life Insurance">Life Insurance</option>
                    <option value="Trust">Trust</option>
                    <option value="Prepaid">Prepaid</option>
                    <option value="Other">Other</option>
                  </FormSelect>

                  {funding?.fundingType === 'Life Insurance' && (
                    <>
                      {/* Company Information Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Insurance Company</h5>
                        <FormInput
                          label="Company Name *"
                          value={funding?.companyName || ''}
                          onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                          error={fieldErrors?.companyName || localErrors.companyName}
                          disabled={savingSection === 'funding'}
                          required={isFieldRequired ? isFieldRequired('companyName') : true}
                          placeholder="e.g., MetLife, Prudential"
                        />
                        <FormInput
                          label="Company Phone"
                          type="tel"
                          value={funding?.companyPhone || ''}
                          onChange={(e) => setFunding({...funding, companyPhone: e.target.value})}
                          disabled={savingSection === 'funding'}
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      {/* Policy Information Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Policy Details</h5>
                        <FormInput
                          label="Policy Number *"
                          value={funding?.policyNumber || ''}
                          onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                          error={fieldErrors?.policyNumber || localErrors.policyNumber}
                          disabled={savingSection === 'funding'}
                          required={isFieldRequired ? isFieldRequired('policyNumber') : true}
                          placeholder="Enter policy number"
                        />
                        <FormSelect
                          label="Policy Type *"
                          value={funding?.policyType || ''}
                          onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                          error={fieldErrors?.policyType || localErrors.policyType}
                          disabled={savingSection === 'funding'}
                          required={isFieldRequired ? isFieldRequired('policyType') : true}
                        >
                          <option value="">Select...</option>
                          <option value="Term">Term</option>
                          <option value="Whole Life">Whole Life</option>
                          <option value="Universal">Universal</option>
                        </FormSelect>
                        <FormInput
                          label="Face Amount *"
                          type="number"
                          value={funding?.faceAmount || ''}
                          onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                          error={fieldErrors?.faceAmount || localErrors.faceAmount}
                          disabled={savingSection === 'funding'}
                          required={isFieldRequired ? isFieldRequired('faceAmount') : true}
                          placeholder="e.g., 200000"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Show helper text for other funding types */}
                  {funding?.fundingType && funding?.fundingType !== 'Life Insurance' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        {funding.fundingType === 'Trust' && 
                          "Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary."}
                        {funding.fundingType === 'Prepaid' && 
                          "Thank you for choosing to prepay. An Alcor representative will contact you."}
                        {funding.fundingType === 'Other' && 
                          "An Alcor representative will contact you to discuss your funding arrangement."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={() => {
                  setLocalErrors({});
                  cancelEdit && cancelEdit('funding');
                }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                disabled={savingSection === 'funding'}
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={savingSection === 'funding'}
                className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {savingSection === 'funding' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* View/Edit button when not in edit mode or view mode */}
        {!editMode.funding && !viewMode && (
          <div className="bg-white px-6 pb-6">
            <button
              onClick={() => canEdit ? (toggleEditMode && toggleEditMode('funding')) : setViewMode(true)}
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

export default FundingMobile;