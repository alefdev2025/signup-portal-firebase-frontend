// LegalMobile.jsx
import React from 'react';
import { FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';

const LegalMobile = ({ 
  legal,
  setLegal,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveLegal,
  savingSection,
  fieldErrors,
  fieldConfig,
  memberCategory,
  getFieldError
}) => {
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ legal })) {
          filledRequired++;
        }
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ legal })) {
          filledRecommended++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 0 : 0; // No recommended fields for Legal
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

  const getPreviewText = () => {
    const previewParts = [];
    
    if (legal?.hasWill) {
      previewParts.push(`Will: ${legal.hasWill}`);
    }
    if (legal?.hasWill === 'Yes' && legal?.willContraryToCryonics) {
      previewParts.push(`Contrary provisions: ${legal.willContraryToCryonics}`);
    }
    
    return previewParts.join(' • ') || 'No information provided';
  };

  // Check if fields are required based on member category
  const isRequired = memberCategory === 'CryoApplicant' || memberCategory === 'CryoMember';

  // Wrap saveLegal to prevent duplicate calls
  const handleSaveLegal = async () => {
    // Prevent multiple simultaneous saves
    if (savingSection === 'legal') {
      console.log('⚠️ Save already in progress, ignoring duplicate call');
      return;
    }
    
    if (saveLegal) {
      try {
        await saveLegal();
      } catch (error) {
        console.error('Error in handleSaveLegal:', error);
      }
    }
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900">Legal/Will Information</h3>
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
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Legal Details</h3>
                    <p className="text-sm text-gray-600">Information about your will and cryonics provisions</p>
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
                        Will status and any contrary provisions if applicable
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Display Mode - Legal Preview */}
            {!editMode.legal && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      {editMode.legal && (
        <div className="bg-white px-6 py-6 border-t border-gray-200">
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Legal Information</h4>
              
              <div className="space-y-4">
                <FormSelect
                  label="Do you have a will? *"
                  value={legal?.hasWill || ''}
                  onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
                  error={getFieldError('legal', 'hasWill')}
                  disabled={savingSection === 'legal'}
                  required={isRequired}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </FormSelect>
                
                {legal?.hasWill === 'Yes' && (
                  <FormSelect
                    label="Does your will contain any provisions contrary to cryonics? *"
                    value={legal?.willContraryToCryonics || ''}
                    onChange={(e) => setLegal({...legal, willContraryToCryonics: e.target.value})}
                    error={getFieldError('legal', 'willContraryToCryonics')}
                    disabled={savingSection === 'legal'}
                    required={isRequired}
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </FormSelect>
                )}
                
                {/* Warning for contrary provisions */}
                {legal?.hasWill === 'Yes' && legal?.willContraryToCryonics === 'Yes' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <strong>Action Required:</strong> You must update your will to remove any provisions contrary to cryonics.
                    </p>
                  </div>
                )}
                
                {/* Help text */}
                {legal?.hasWill === 'Yes' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-gray-700">
                      <strong>Important:</strong> If your will contains provisions contrary to cryonics (e.g., cremation, burial requirements), these may invalidate your Cryopreservation Agreement. You must update your will through a new codicil or new will.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={() => cancelEdit && cancelEdit('legal')}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              disabled={savingSection === 'legal'}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLegal}
              disabled={savingSection === 'legal'}
              className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
            >
              {savingSection === 'legal' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Display Mode Content when not in edit mode */}
      {!editMode.legal && (
        <div className="bg-white px-6 pb-6">
          <div className="space-y-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Will Information</h5>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Do you have a will?</span>
                  <p className="text-gray-900">{legal?.hasWill || '—'}</p>
                </div>
                {legal?.hasWill === 'Yes' && (
                  <div>
                    <span className="text-gray-500">Contains contrary provisions?</span>
                    <p className="text-gray-900">{legal?.willContraryToCryonics || '—'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => toggleEditMode && toggleEditMode('legal')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default LegalMobile;