// LegalMobile.jsx
import React from 'react';
import { FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';

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
  // Local state for validation errors
  const [localErrors, setLocalErrors] = React.useState({});
  
  // Clear errors when entering/exiting edit mode
  React.useEffect(() => {
    if (editMode.legal) {
      setLocalErrors({});
    }
  }, [editMode.legal]);

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    
    // Check if hasWill is filled
    if (legal?.hasWill && legal.hasWill !== '') {
      filledRequired++;
    }
    
    // Only check willContraryToCryonics if hasWill is "Yes"
    if (legal?.hasWill === 'Yes') {
      // They have a will, so we need to check the second field
      if (legal?.willContraryToCryonics && legal.willContraryToCryonics !== '') {
        filledRequired++;
      }
      // Total required is 2 when they have a will
      const totalRequired = 2;
      const requiredPercentage = (filledRequired / totalRequired) * 100;
      return Math.round(requiredPercentage);
    } else {
      // They either said "No" or haven't answered yet
      // Only hasWill field is required
      const totalRequired = 1;
      const requiredPercentage = (filledRequired / totalRequired) * 100;
      return Math.round(requiredPercentage);
    }
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

  // Handle save with complete validation
  const handleSave = async () => {
    const errors = {};
    
    // Validate hasWill (always required)
    if (!legal?.hasWill || !legal.hasWill.trim()) {
      errors.hasWill = "Please indicate if you have a will";
    }
    
    // If they have a will, validate willContraryToCryonics
    if (legal?.hasWill === 'Yes') {
      if (!legal?.willContraryToCryonics || !legal.willContraryToCryonics.trim()) {
        errors.willContraryToCryonics = "Please indicate if your will contains contrary provisions";
      }
    }
    
    // If there are validation errors, set them and don't save
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    
    // Clear errors and proceed with save
    setLocalErrors({});
    
    // Call saveLegal and check if it returns a result
    try {
      const result = await saveLegal();
      
      // If saveLegal returns a failure indication, show errors
      if (result && !result.success) {
        const errorMessage = result.errors 
          ? Object.values(result.errors).join('. ')
          : result.error || 'Failed to save legal information';
        
        setLocalErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('Error saving legal info:', error);
      setLocalErrors({ general: 'Failed to save. Please try again.' });
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
              <div className={styleConfig2.sectionIcons.legal}>
                <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
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
                    <div className="pr-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Legal Details</h3>
                      <p className="text-sm text-gray-600">Information about your will<br />and cryonics provisions</p>
                    </div>
                    
                    {/* Updated completion indicator to match FamilyInfo and Occupation */}
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
                            <stop offset="0%" stopColor="#512BD9" />
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
                <div className="bg-blue-50/30 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form Section */}
        {editMode.legal && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            {/* Error Message Section - Only show if there are errors after attempting to save */}
            {localErrors && Object.keys(localErrors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-800">
                    {localErrors.general ? (
                      <p>{localErrors.general}</p>
                    ) : (
                      <>
                        <p className="font-medium">Please fix the following errors:</p>
                        <ul className="mt-1 list-disc list-inside">
                          {Object.entries(localErrors).filter(([field]) => field !== 'general').map(([field, error]) => (
                            <li key={field}>{error}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Legal Information</h4>
                
                <div className="space-y-4">
                  <FormSelect
                    label="Do you have a will? *"
                    value={legal?.hasWill || ''}
                    onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
                    error={fieldErrors?.hasWill || localErrors.hasWill}
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
                      error={fieldErrors?.willContraryToCryonics || localErrors.willContraryToCryonics}
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
                        <strong>Action Required:</strong> Update your will to remove any provisions contrary to cryonics.
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
                onClick={() => {
                  setLocalErrors({});
                  cancelEdit && cancelEdit('legal');
                }}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                disabled={savingSection === 'legal'}
              >
                Close
              </button>
              <button
                onClick={handleSave}
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
              View/Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalMobile;