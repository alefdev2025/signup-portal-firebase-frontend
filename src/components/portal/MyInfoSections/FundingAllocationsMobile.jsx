// FundingAllocationsMobile.js
import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';

const FundingAllocationsMobile = ({ 
  fundingAllocations,
  setFundingAllocations,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveFundingAllocations,
  savingSection,
  fieldErrors,
  canEdit,
  memberCategory,
  fieldConfig
}) => {
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ fundingAllocations })) {
          filledRequired++;
        }
      } else {
        const value = fundingAllocations?.[field.field];
        if (value !== undefined && value !== '' && value !== null) {
          filledRequired++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    
    return Math.round(requiredPercentage);
  };

  const completionPercentage = calculateCompletion();

  // Calculate totals with rounding to avoid floating point issues
  const calculateTotal = (prefix = '') => {
    const fields = prefix ? [
      `patientCareTrust${prefix}`,
      `generalOperatingFund${prefix}`,
      `alcorResearchFund${prefix}`,
      `endowmentFund${prefix}`,
      `individuals${prefix}`,
      `others${prefix}`
    ] : [
      'patientCareTrust',
      'generalOperatingFund',
      'alcorResearchFund',
      'endowmentFund',
      'individuals',
      'others'
    ];
    
    const total = fields.reduce((sum, field) => sum + (parseFloat(fundingAllocations[field]) || 0), 0);
    
    // Round to 2 decimal places to avoid floating point issues
    return Math.round(total * 100) / 100;
  };

  const getPreviewText = () => {
    const parts = [];
    
    if (fundingAllocations?.customPrimary !== undefined) {
      parts.push(`Primary: ${fundingAllocations.customPrimary ? 'Custom' : 'Default'}`);
    }
    if (fundingAllocations?.customOverMinimum !== undefined) {
      parts.push(`Over-Min: ${fundingAllocations.customOverMinimum ? 'Custom' : 'Default'}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No allocations specified';
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
      {/* White Header Section */}
      <div className="bg-white px-6 py-6">
        <div className="flex flex-col gap-5 w-full">
          {/* Top row - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
              <svg className="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900">Funding Allocations</h3>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Allocation Details</h3>
                    <p className="text-sm text-gray-600">How your funds should be distributed</p>
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
                          <stop offset="0%" stopColor="#162740" />
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
                    <div className="w-8 h-8 rounded-full bg-[#162740] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Allocation Decisions</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Primary Allocation, Over-Minimum Allocation
                        {fundingAllocations?.customPrimary && ', Primary Total 100%'}
                        {fundingAllocations?.customOverMinimum && ', Over-Min Total 100%'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Display Mode - Preview */}
            {!editMode.fundingAllocations && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
              </div>
            )}
            
            {/* Note for non-editable users */}
            {!canEdit && !editMode.fundingAllocations && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-800 text-center">
                  Contact Alcor staff to make changes to funding allocations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      {editMode.fundingAllocations && (
        <div className="bg-white px-6 py-6 border-t border-gray-200">
          <div className="space-y-6">
            {/* Primary Allocations */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Primary Fund Allocations</h4>
              <p className="text-sm text-gray-600 mb-3">
                If cryopreservation is not possible, your funds will be allocated to support Alcor's mission.
              </p>
              
              <label className="flex items-start mb-4">
                <input
                  type="checkbox"
                  checked={fundingAllocations?.customPrimary || false}
                  onChange={(e) => setFundingAllocations({...fundingAllocations, customPrimary: e.target.checked})}
                  disabled={savingSection === 'fundingAllocations'}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Customize allocations (default: 50% PCT / 50% GOF)
                </span>
              </label>

              {fundingAllocations?.customPrimary && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Total must equal 100%</strong> (Current: {calculateTotal()}%)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="Patient Care Trust (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.patientCareTrust || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, patientCareTrust: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="General Operating (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.generalOperatingFund || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, generalOperatingFund: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Research Fund (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.alcorResearchFund || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, alcorResearchFund: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Endowment (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.endowmentFund || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, endowmentFund: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Individuals (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.individuals || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, individuals: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Others (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.others || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, others: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  </div>

                  {fundingAllocations?.individuals > 0 && (
                    <FormInput
                      label="Individual Recipients *"
                      type="text"
                      placeholder="e.g., John Smith, Father, 50%"
                      value={fundingAllocations?.followingPersons || ''}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, followingPersons: e.target.value})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  )}

                  {fundingAllocations?.others > 0 && (
                    <FormInput
                      label="Other Recipients *"
                      type="text"
                      placeholder="e.g., ASPCA, 20%"
                      value={fundingAllocations?.other || ''}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, other: e.target.value})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Over-Minimum Allocations */}
            <div className="border-t pt-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Over-Minimum Fund Allocations</h4>
              <p className="text-sm text-gray-600 mb-3">
                For funds exceeding the minimum cryopreservation requirements.
              </p>
              
              <label className="flex items-start mb-4">
                <input
                  type="checkbox"
                  checked={fundingAllocations?.customOverMinimum || false}
                  onChange={(e) => setFundingAllocations({...fundingAllocations, customOverMinimum: e.target.checked})}
                  disabled={savingSection === 'fundingAllocations'}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Customize allocations (default: 50% PCT / 50% GOF)
                </span>
              </label>

              {fundingAllocations?.customOverMinimum && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Total must equal 100%</strong> (Current: {calculateTotal('OM')}%)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput
                      label="Patient Care Trust (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.patientCareTrustOM || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, patientCareTrustOM: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="General Operating (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.generalOperatingFundOM || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, generalOperatingFundOM: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Research Fund (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.alcorResearchFundOM || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, alcorResearchFundOM: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Endowment (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.endowmentFundOM || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, endowmentFundOM: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Individuals (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.individualsOM || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, individualsOM: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                    <FormInput
                      label="Others (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={fundingAllocations?.othersOM || 0}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, othersOM: parseFloat(e.target.value) || 0})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  </div>

                  {fundingAllocations?.individualsOM > 0 && (
                    <FormInput
                      label="Individual Recipients *"
                      type="text"
                      placeholder="e.g., John Smith, Father, 50%"
                      value={fundingAllocations?.followingPersonsOM || ''}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, followingPersonsOM: e.target.value})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  )}

                  {fundingAllocations?.othersOM > 0 && (
                    <FormInput
                      label="Other Recipients *"
                      type="text"
                      placeholder="e.g., ASPCA, 20%"
                      value={fundingAllocations?.otherOM || ''}
                      onChange={(e) => setFundingAllocations({...fundingAllocations, otherOM: e.target.value})}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={() => cancelEdit && cancelEdit('fundingAllocations')}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              disabled={savingSection === 'fundingAllocations'}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const success = await saveFundingAllocations();
                if (success) {
                  toggleEditMode('fundingAllocations');
                }
              }}
              disabled={savingSection === 'fundingAllocations'}
              className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
            >
              {savingSection === 'fundingAllocations' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Edit button when not in edit mode */}
      {!editMode.fundingAllocations && canEdit && (
        <div className="bg-white px-6 pb-6">
          <button
            onClick={() => toggleEditMode && toggleEditMode('fundingAllocations')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default FundingAllocationsMobile;