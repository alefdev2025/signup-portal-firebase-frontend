// MedicalInfoMobile.js
import React, { useState } from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';
import { ChevronDown, ChevronUp } from 'lucide-react';

// FormTextarea component for mobile
const MobileFormTextarea = ({ label, value, onChange, placeholder, rows = 3, disabled = false }) => (
  <div>
    <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-purple-500 transition-all resize-none"
    />
  </div>
);

const MedicalInfoMobile = ({ 
  medicalInfo,
  setMedicalInfo,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveMedicalInfo,
  savingSection,
  fieldErrors,
  fieldConfig,
  formatHeight,
  formatWeight,
  needsProfileImprovement,
  getMissingFieldsMessage,
  ProfileImprovementNotice
}) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      const value = medicalInfo?.[field.field];
      if (value && value.trim() !== '') {
        filledRequired++;
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ medicalInfo })) {
          filledRecommended++;
        }
      } else {
        const value = medicalInfo?.[field.field];
        if (value && value.trim() !== '') {
          filledRecommended++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    const totalRecommended = Object.keys(fieldConfig.recommended).length;
    
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 70 : 0;
    const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 30 : 0;
    
    return Math.round(requiredPercentage + recommendedPercentage);
  };

  const completionPercentage = calculateCompletion();

  const getPreviewText = () => {
    const previewParts = [];
    
    if (medicalInfo?.sex && medicalInfo?.height && medicalInfo?.weight) {
      previewParts.push(`${medicalInfo.sex}, ${formatHeight(medicalInfo.height)}, ${formatWeight(medicalInfo.weight)}`);
    }
    if (medicalInfo?.bloodType) {
      previewParts.push(`Blood: ${medicalInfo.bloodType}`);
    }
    if (medicalInfo?.primaryPhysician) {
      previewParts.push(`Dr. ${medicalInfo.primaryPhysician}`);
    }
    
    return previewParts.length > 0 ? previewParts.slice(0, 2).join(' • ') : 'No medical information provided';
  };

  const formatDoctorAddress = () => {
    const parts = [
      medicalInfo?.physicianAddress,
      medicalInfo?.physicianCity,
      medicalInfo?.physicianState,
      medicalInfo?.physicianZip,
      medicalInfo?.physicianCountry
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const formatDoctorPhones = () => {
    const phones = [];
    if (medicalInfo?.physicianHomePhone) phones.push(`Home: ${medicalInfo.physicianHomePhone}`);
    if (medicalInfo?.physicianWorkPhone) phones.push(`Work: ${medicalInfo.physicianWorkPhone}`);
    return phones.length > 0 ? phones.join(' | ') : '—';
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900">Health & Emergency Information</h3>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Medical Details</h3>
                    <p className="text-sm text-gray-600">Your health information and emergency contacts</p>
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
                      <p className="text-xs text-gray-500 mt-0.5">Sex, Blood Type</p>
                    </div>
                  </div>
                  
                  {/* Recommended fields */}
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#6e4376] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Recommended Information</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Height, Weight, Primary Physician, Medical History</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Display Mode - Medical Preview */}
            {!editMode.medical && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                </div>
                
                {needsProfileImprovement() && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <ProfileImprovementNotice />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      {editMode.medical && (
        <div className="bg-white px-6 py-6 border-t border-gray-200">
          <div className="space-y-6">
            {/* Basic Health Information */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Basic Health Information</h4>
              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="Sex"
                  value={medicalInfo?.sex || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, sex: e.target.value})}
                  disabled={savingSection === 'medical'}
                  error={fieldErrors.sex}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </FormSelect>
                
                <FormInput
                  label="Height (inches)"
                  type="text"
                  value={medicalInfo?.height || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, height: e.target.value})}
                  placeholder="e.g., 68 for 5'8"
                  disabled={savingSection === 'medical'}
                />
                
                <FormInput
                  label="Weight (lbs)"
                  type="text"
                  value={medicalInfo?.weight ? medicalInfo.weight.toString().replace(' lbs', '').replace(' lb', '').replace('lbs', '').replace('lb', '').trim() : ''}
                  onChange={(e) => {
                    const weightValue = e.target.value.trim();
                    setMedicalInfo({
                      ...medicalInfo, 
                      weight: weightValue ? `${weightValue} lb` : ''
                    });
                  }}
                  placeholder="190"
                  disabled={savingSection === 'medical'}
                />
                
                <FormSelect
                  label="Blood Type"
                  value={medicalInfo?.bloodType || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, bloodType: e.target.value})}
                  disabled={savingSection === 'medical'}
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </FormSelect>
              </div>
            </div>

            {/* Doctor Information */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Primary Care Physician</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Doctor Name"
                    value={medicalInfo?.primaryPhysician || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, primaryPhysician: e.target.value})}
                    disabled={savingSection === 'medical'}
                  />
                  
                  <FormInput
                    label="Hospital"
                    value={medicalInfo?.hospital || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, hospital: e.target.value})}
                    disabled={savingSection === 'medical'}
                  />
                </div>
                
                <FormInput
                  label="Doctor Address"
                  value={medicalInfo?.physicianAddress || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, physicianAddress: e.target.value})}
                  disabled={savingSection === 'medical'}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="City"
                    value={medicalInfo?.physicianCity || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, physicianCity: e.target.value})}
                    disabled={savingSection === 'medical'}
                  />
                  
                  <FormInput
                    label="State/Province"
                    value={medicalInfo?.physicianState || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, physicianState: e.target.value})}
                    disabled={savingSection === 'medical'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Zip/Postal Code"
                    value={medicalInfo?.physicianZip || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, physicianZip: e.target.value})}
                    disabled={savingSection === 'medical'}
                  />
                  
                  <FormInput
                    label="Country"
                    value={medicalInfo?.physicianCountry || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, physicianCountry: e.target.value})}
                    disabled={savingSection === 'medical'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Doctor Home Phone"
                    type="tel"
                    value={medicalInfo?.physicianHomePhone || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, physicianHomePhone: e.target.value})}
                    placeholder="(555) 123-4567"
                    disabled={savingSection === 'medical'}
                  />
                  
                  <FormInput
                    label="Doctor Work Phone"
                    type="tel"
                    value={medicalInfo?.physicianWorkPhone || ''}
                    onChange={(e) => setMedicalInfo({...medicalInfo, physicianWorkPhone: e.target.value})}
                    placeholder="(555) 123-4567"
                    disabled={savingSection === 'medical'}
                  />
                </div>
                
                <FormSelect
                  label="Will Doctor Cooperate with Alcor?"
                  value={medicalInfo?.willDoctorCooperate || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, willDoctorCooperate: e.target.value})}
                  disabled={savingSection === 'medical'}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unknown">Unknown</option>
                </FormSelect>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <h4 className="text-base font-medium text-gray-900 mb-4">Medical History</h4>
              <div className="space-y-3">
                <MobileFormTextarea
                  label="Health Problems"
                  value={medicalInfo?.healthProblems || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, healthProblems: e.target.value})}
                  placeholder="List any current or chronic health problems"
                  rows={3}
                  disabled={savingSection === 'medical'}
                />
                
                <MobileFormTextarea
                  label="Allergies (including to drugs)"
                  value={medicalInfo?.allergies || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                  placeholder="e.g., Penicillin; Vicodin"
                  rows={3}
                  disabled={savingSection === 'medical'}
                />
                
                <MobileFormTextarea
                  label="Medications Currently or Recently Taken"
                  value={medicalInfo?.medications || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})}
                  placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
                  rows={3}
                  disabled={savingSection === 'medical'}
                />
                
                <MobileFormTextarea
                  label="Identifying Scars or Deformities"
                  value={medicalInfo?.identifyingScars || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, identifyingScars: e.target.value})}
                  rows={2}
                  disabled={savingSection === 'medical'}
                />
                
                <MobileFormTextarea
                  label="Artificial Appliances, Implants or Prosthetics"
                  value={medicalInfo?.artificialAppliances || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, artificialAppliances: e.target.value})}
                  placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
                  rows={2}
                  disabled={savingSection === 'medical'}
                />
                
                <MobileFormTextarea
                  label="Past Medical History"
                  value={medicalInfo?.pastMedicalHistory || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, pastMedicalHistory: e.target.value})}
                  placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
                  rows={4}
                  disabled={savingSection === 'medical'}
                />
                
                <MobileFormTextarea
                  label="Hereditary Illnesses or Tendencies in Family"
                  value={medicalInfo?.hereditaryIllnesses || ''}
                  onChange={(e) => setMedicalInfo({...medicalInfo, hereditaryIllnesses: e.target.value})}
                  placeholder="List any hereditary conditions in your family"
                  rows={3}
                  disabled={savingSection === 'medical'}
                />
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={() => cancelEdit && cancelEdit('medical')}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              disabled={savingSection === 'medical'}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!medicalInfo?.sex || medicalInfo.sex === '') {
                  alert('Please select a sex before saving.');
                  return;
                }
                saveMedicalInfo();
              }}
              disabled={savingSection === 'medical'}
              className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
            >
              {savingSection === 'medical' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Edit button when not in edit mode */}
      {!editMode.medical && (
        <div className="bg-white px-6 pb-6">
          <button
            onClick={() => toggleEditMode && toggleEditMode('medical')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicalInfoMobile;