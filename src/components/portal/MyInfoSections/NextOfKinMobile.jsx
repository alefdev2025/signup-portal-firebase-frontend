// NextOfKinMobile.js
import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';

const NextOfKinMobile = ({ 
  nextOfKinList,
  setNextOfKinList,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveNextOfKin,
  savingSection,
  fieldErrors,
  fieldConfig,
  updateNextOfKin,
  addNextOfKin,
  removeNextOfKin,
  formatDateForDisplay,
  formatAddress,
  formatPhoneDisplay,
  validateEmail,
  getFieldError
}) => {
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ nextOfKinList })) {
          filledRequired++;
        }
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ nextOfKinList })) {
          filledRecommended++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 0 : 0; // No recommended fields for NOK
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

  const getPreviewText = () => {
    if (nextOfKinList.length === 0) {
      return "No emergency contacts on file";
    }
    const previewParts = [];
    nextOfKinList.slice(0, 2).forEach(nok => {
      const fullName = `${nok.firstName} ${nok.lastName}`.trim();
      if (fullName) {
        previewParts.push(fullName);
      }
    });
    if (nextOfKinList.length > 2) {
      previewParts.push(`+${nextOfKinList.length - 2} more`);
    }
    return previewParts.join(' • ') || "No emergency contacts on file";
  };

  // Wrap saveNextOfKin to prevent duplicate calls
  const handleSaveNextOfKin = async () => {
    // Prevent multiple simultaneous saves
    if (savingSection === 'nextOfKin') {
      console.log('⚠️ Save already in progress, ignoring duplicate call');
      return;
    }
    
    if (saveNextOfKin) {
      try {
        await saveNextOfKin();
      } catch (error) {
        console.error('Error in handleSaveNextOfKin:', error);
      }
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
              <div className={styleConfig2.sectionIcons.nextOfKin || "bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md"}>
                <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900">Emergency Contacts</h3>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Emergency Contact Details</h3>
                      <p className="text-sm text-gray-600">People who can be contacted on your behalf</p>
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
                          At least one emergency contact with name, relationship, email, and phone
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Display Mode - NOK Preview */}
              {!editMode.nextOfKin && (
                <div className="bg-blue-50/30 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form Section */}
        {editMode.nextOfKin && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            <div className="space-y-6">
              {nextOfKinList.map((nok, index) => (
                <div key={nok.id || index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-gray-900">Emergency Contact {index + 1}</h4>
                    {nextOfKinList.length > 0 && (
                      <button
                        onClick={() => removeNextOfKin(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                        disabled={savingSection === 'nextOfKin'}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="First Name *"
                        value={nok.firstName || ''}
                        onChange={(e) => updateNextOfKin(index, 'firstName', e.target.value)}
                        error={getFieldError ? getFieldError(index, 'firstName') : null}
                        disabled={savingSection === 'nextOfKin'}
                      />
                      <FormInput
                        label="Middle Name"
                        value={nok.middleName || ''}
                        onChange={(e) => updateNextOfKin(index, 'middleName', e.target.value)}
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Last Name *"
                        value={nok.lastName || ''}
                        onChange={(e) => updateNextOfKin(index, 'lastName', e.target.value)}
                        error={getFieldError ? getFieldError(index, 'lastName') : null}
                        disabled={savingSection === 'nextOfKin'}
                      />
                      <FormInput
                        label="Relationship *"
                        value={nok.relationship || ''}
                        onChange={(e) => updateNextOfKin(index, 'relationship', e.target.value)}
                        placeholder="e.g., Spouse, Child, Parent"
                        error={getFieldError ? getFieldError(index, 'relationship') : null}
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Date of Birth"
                        type="date"
                        value={nok.dateOfBirth || ''}
                        onChange={(e) => updateNextOfKin(index, 'dateOfBirth', e.target.value)}
                        disabled={savingSection === 'nextOfKin'}
                      />
                      <FormInput
                        label="Email *"
                        type="email"
                        value={nok.email || ''}
                        onChange={(e) => updateNextOfKin(index, 'email', e.target.value)}
                        error={(getFieldError ? getFieldError(index, 'email') : null) || 
                               (validateEmail && !validateEmail(nok.email) && nok.email ? 'Invalid email format' : '')}
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Mobile Phone *"
                        type="tel"
                        value={nok.mobilePhone || ''}
                        onChange={(e) => updateNextOfKin(index, 'mobilePhone', e.target.value)}
                        placeholder="(555) 123-4567"
                        error={getFieldError ? getFieldError(index, 'mobilePhone') : null}
                        disabled={savingSection === 'nextOfKin'}
                      />
                      <FormInput
                        label="Home Phone"
                        type="tel"
                        value={nok.homePhone || ''}
                        onChange={(e) => updateNextOfKin(index, 'homePhone', e.target.value)}
                        placeholder="(555) 123-4567"
                        disabled={savingSection === 'nextOfKin'}
                      />
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Address</h5>
                      <div className="space-y-3">
                        <FormInput
                          label=""
                          value={nok.address?.street1 || ''}
                          onChange={(e) => updateNextOfKin(index, 'address.street1', e.target.value)}
                          placeholder="Street Address Line 1"
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <FormInput
                          label=""
                          value={nok.address?.street2 || ''}
                          onChange={(e) => updateNextOfKin(index, 'address.street2', e.target.value)}
                          placeholder="Street Address Line 2"
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput
                            label=""
                            value={nok.address?.city || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.city', e.target.value)}
                            placeholder="City"
                            disabled={savingSection === 'nextOfKin'}
                          />
                          <FormInput
                            label=""
                            value={nok.address?.state || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.state', e.target.value)}
                            placeholder="State/Province"
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <FormInput
                            label=""
                            value={nok.address?.postalCode || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.postalCode', e.target.value)}
                            placeholder="Zip/Postal Code"
                            disabled={savingSection === 'nextOfKin'}
                          />
                          <FormInput
                            label=""
                            value={nok.address?.country || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.country', e.target.value)}
                            placeholder="Country"
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <FormSelect
                      label="Willing to Sign Affidavit?"
                      value={nok.willingToSignAffidavit || ''}
                      onChange={(e) => updateNextOfKin(index, 'willingToSignAffidavit', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Unknown">Unknown</option>
                    </FormSelect>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comments about attitude toward cryonics
                      </label>
                      <textarea
                        value={nok.comments || ''}
                        onChange={(e) => updateNextOfKin(index, 'comments', e.target.value)}
                        disabled={savingSection === 'nextOfKin'}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addNextOfKin}
                className="w-full py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
                disabled={savingSection === 'nextOfKin'}
              >
                {nextOfKinList.length > 0 ? 'Add Another Emergency Contact' : 'Add Emergency Contact'}
              </button>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={() => cancelEdit && cancelEdit('nextOfKin')}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                disabled={savingSection === 'nextOfKin'}
              >
                Close
              </button>
              <button
                onClick={handleSaveNextOfKin}
                disabled={savingSection === 'nextOfKin'}
                className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {savingSection === 'nextOfKin' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Display Mode Content when not in edit mode */}
        {!editMode.nextOfKin && (
          <div className="bg-white px-6 pb-6">
            {nextOfKinList.length > 0 && (
              <div className="space-y-4 mb-6">
                {nextOfKinList.slice(0, 2).map((nok, index) => (
                  <div key={nok.id || index} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {`${nok.firstName} ${nok.lastName}`.trim() || `Emergency Contact ${index + 1}`}
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Relationship:</span>
                        <p className="text-gray-900">{nok.relationship || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="text-gray-900">{nok.mobilePhone || nok.homePhone || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Email:</span>
                        <p className="text-gray-900">{nok.email || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {nextOfKinList.length > 2 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{nextOfKinList.length - 2} more emergency contact{nextOfKinList.length - 2 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
            
            <button
              onClick={() => toggleEditMode && toggleEditMode('nextOfKin')}
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

export default NextOfKinMobile;