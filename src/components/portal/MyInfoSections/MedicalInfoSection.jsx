import React, { useState } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.valueWithWrap}>{value || styleConfig.display.item.empty}</dd>
  </div>
);

const MedicalInfoSection = ({ 
  medicalInfo, 
  setMedicalInfo, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveMedicalInfo, 
  savingSection,
  memberCategory 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTooltipBottom, setShowTooltipBottom] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Format height for display
  const formatHeight = (heightValue) => {
    if (!heightValue) return styleConfig.display.item.empty;
    
    // If height is already formatted (contains ' or "), return as-is
    if (typeof heightValue === 'string' && (heightValue.includes("'") || heightValue.includes('"'))) {
      return heightValue;
    }
    
    // Otherwise, assume it's in inches and format it
    const heightNum = parseInt(heightValue);
    if (isNaN(heightNum)) return heightValue; // Return as-is if not a valid number
    const feet = Math.floor(heightNum / 12);
    const inches = heightNum % 12;
    return `${feet}' ${inches}"`;
  };

  const formatWeight = (weight) => {
    if (!weight) return styleConfig.display.item.empty;
    // Remove ' lb' if it exists, then add it back
    const weightNum = weight.toString().replace(' lb', '').replace('lb', '').trim();
    return `${weightNum} lb`;
  };

  // Format doctor's full address for display
  const formatDoctorAddress = () => {
    const parts = [
      medicalInfo.physicianAddress,
      medicalInfo.physicianCity,
      medicalInfo.physicianState,
      medicalInfo.physicianZip,
      medicalInfo.physicianCountry
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : styleConfig.display.item.empty;
  };

  // Format doctor's phone numbers for display
  const formatDoctorPhones = () => {
    const phones = [];
    if (medicalInfo.physicianHomePhone) phones.push(`Home: ${medicalInfo.physicianHomePhone}`);
    if (medicalInfo.physicianWorkPhone) phones.push(`Work: ${medicalInfo.physicianWorkPhone}`);
    return phones.length > 0 ? phones.join(' | ') : styleConfig.display.item.empty;
  };

  const needsProfileImprovement = () => {
    // Check if important medical fields are missing
    const missingFields = [];
    
    console.log('=== CHECKING MEDICAL PROFILE ===');
    console.log('Full medicalInfo object:', medicalInfo);
    
    // Basic health info
    console.log('\n--- Basic Health Info ---');
    console.log('sex:', medicalInfo.sex, '-> missing?', !medicalInfo.sex);
    console.log('height:', medicalInfo.height, '-> missing?', !medicalInfo.height);
    console.log('weight:', medicalInfo.weight, '-> missing?', !medicalInfo.weight);
    console.log('bloodType:', medicalInfo.bloodType, '-> missing?', !medicalInfo.bloodType);
    
    if (!medicalInfo.sex) missingFields.push('sex');
    if (!medicalInfo.height) missingFields.push('height');
    if (!medicalInfo.weight) missingFields.push('weight');
    if (!medicalInfo.bloodType) missingFields.push('blood type');
    
    // Doctor info
    console.log('\n--- Doctor Info ---');
    console.log('primaryPhysician:', medicalInfo.primaryPhysician, '-> missing?', !medicalInfo.primaryPhysician);
    console.log('physicianCity:', medicalInfo.physicianCity, '-> missing?', !medicalInfo.physicianCity);
    console.log('physicianState:', medicalInfo.physicianState, '-> missing?', !medicalInfo.physicianState);
    console.log('doctor location missing?', !medicalInfo.physicianCity || !medicalInfo.physicianState);
    
    if (!medicalInfo.primaryPhysician) missingFields.push('primary physician');
    if (!medicalInfo.physicianCity || !medicalInfo.physicianState) missingFields.push('doctor location');
    
    // Medical history - NOW CHECKS EACH FIELD INDIVIDUALLY
    console.log('\n--- Medical History ---');
    console.log('healthProblems:', medicalInfo.healthProblems, '-> empty?', !medicalInfo.healthProblems);
    console.log('medications:', medicalInfo.medications, '-> empty?', !medicalInfo.medications);
    console.log('allergies:', medicalInfo.allergies, '-> empty?', !medicalInfo.allergies);
    
    // Check each field individually
    if (!medicalInfo.healthProblems) missingFields.push('health problems');
    if (!medicalInfo.medications) missingFields.push('medications');
    if (!medicalInfo.allergies) missingFields.push('allergies');
    
    console.log('\n--- RESULTS ---');
    console.log('Missing fields:', missingFields);
    console.log('Total missing:', missingFields.length);
    console.log('Needs improvement?', missingFields.length > 0);
    console.log('=== END CHECK ===\n');
    
    return missingFields.length > 0;
  };

  // Get specific missing fields for the message
  const getMissingFieldsMessage = () => {
    const missing = [];
    
    if (!medicalInfo.sex || !medicalInfo.height || !medicalInfo.weight || !medicalInfo.bloodType) {
      missing.push('basic health information');
    }
    if (!medicalInfo.primaryPhysician) {
      missing.push('primary physician details');
    }
    if (!medicalInfo.healthProblems && !medicalInfo.medications && !medicalInfo.allergies) {
      missing.push('medical history');
    }
    
    if (missing.length === 0) return '';
    if (missing.length === 1) return `Add ${missing[0]}`;
    if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]}`;
    return `Add ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] sm:shadow-md border border-gray-500 sm:border-gray-200 mb-6 sm:mb-8 -mx-1 sm:mx-0">
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.medical}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Health & Emergency Information</h2>
            <p className={styleConfig.header.subtitle}>
              Your medical history, health details, and emergency contact information.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.medical ? (
          <div className={styleConfig.display.grid.single}>
            {/* Basic Health Information */}
            <div>
              <h3 className={styleConfig.text.heading.h3}>Basic Health Information</h3>
              <dl className={styleConfig.display.dl.wrapperFour}>
                <InfoDisplay label="Sex" value={medicalInfo.sex} />
                <InfoDisplay label="Height" value={formatHeight(medicalInfo.height)} />
                <InfoDisplay label="Weight" value={formatWeight(medicalInfo.weight)} />
                <InfoDisplay label="Blood Type" value={medicalInfo.bloodType} />
              </dl>
            </div>

            {/* Doctor Information */}
            <div className="mt-6">
              <h3 className={styleConfig.text.heading.h3}>Primary Care Physician</h3>
              <dl className={styleConfig.display.dl.wrapperTwo}>
                <InfoDisplay label="Doctor Name" value={medicalInfo.primaryPhysician} />
                <InfoDisplay label="Hospital" value={medicalInfo.hospital} />
                <InfoDisplay 
                  label="Doctor Address" 
                  value={formatDoctorAddress()}
                  className={styleConfig.display.grid.fullSpan}
                />
                <InfoDisplay 
                  label="Phone Numbers" 
                  value={formatDoctorPhones()}
                  className={styleConfig.display.grid.fullSpan}
                />
                <InfoDisplay 
                  label="Will Cooperate with Alcor?" 
                  value={medicalInfo.willDoctorCooperate}
                  className={styleConfig.display.grid.fullSpan}
                />
              </dl>
            </div>
          </div>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.form.fieldSpacing}>
            {/* Basic Health Information */}
            <h3 className={styleConfig.text.heading.h3}>Basic Health Information</h3>
            
            <div className={styleConfig.section.grid.fourColumn}>
              <Select
                label="Sex"
                value={medicalInfo.sex || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, sex: e.target.value})}
                disabled={!editMode.medical}
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              
              <Input
                label="Height (inches)"
                type="text"
                value={medicalInfo.height || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, height: e.target.value})}
                disabled={!editMode.medical}
                placeholder="e.g., 68 for 5'8"
              />
              
              <Input
                label="Weight (lbs)"
                type="text"
                value={medicalInfo.weight ? medicalInfo.weight.toString().replace(' lb', '').replace('lb', '').trim() : ''}
                onChange={(e) => {
                  // Add ' lb' back when saving to state
                  const weightValue = e.target.value.trim();
                  setMedicalInfo({
                    ...medicalInfo, 
                    weight: weightValue ? `${weightValue} lb` : ''
                  });
                }}
                disabled={!editMode.medical}
                placeholder="190"
              />
              
              <Select
                label="Blood Type"
                value={medicalInfo.bloodType || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, bloodType: e.target.value})}
                disabled={!editMode.medical}
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
              </Select>
            </div>

            {/* Doctor Information */}
            <h3 className={styleConfig.text.heading.h3 + " mt-6"}>Primary Care Physician</h3>
            
            <div className={styleConfig.section.grid.twoColumn}>
              <Input
                label="Doctor Name"
                type="text"
                value={medicalInfo.primaryPhysician || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, primaryPhysician: e.target.value})}
                disabled={!editMode.medical}
              />
              
              <Input
                label="Hospital"
                type="text"
                value={medicalInfo.hospital || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, hospital: e.target.value})}
                disabled={!editMode.medical}
              />
              
              <Input
                label="Doctor Address"
                type="text"
                value={medicalInfo.physicianAddress || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianAddress: e.target.value})}
                disabled={!editMode.medical}
                containerClassName={styleConfig.display.grid.fullSpan}
              />
              
              <Input
                label="City"
                type="text"
                value={medicalInfo.physicianCity || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianCity: e.target.value})}
                disabled={!editMode.medical}
              />
              
              <Input
                label="State/Province"
                type="text"
                value={medicalInfo.physicianState || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianState: e.target.value})}
                disabled={!editMode.medical}
              />
              
              <Input
                label="Zip/Postal Code"
                type="text"
                value={medicalInfo.physicianZip || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianZip: e.target.value})}
                disabled={!editMode.medical}
              />
              
              <Input
                label="Country"
                type="text"
                value={medicalInfo.physicianCountry || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianCountry: e.target.value})}
                disabled={!editMode.medical}
              />
              
              <Input
                label="Doctor Home Phone"
                type="tel"
                value={medicalInfo.physicianHomePhone || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianHomePhone: e.target.value})}
                disabled={!editMode.medical}
                placeholder="(555) 123-4567"
              />
              
              <Input
                label="Doctor Work Phone"
                type="tel"
                value={medicalInfo.physicianWorkPhone || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, physicianWorkPhone: e.target.value})}
                disabled={!editMode.medical}
                placeholder="(555) 123-4567"
              />
              
              <Select
                label="Will Doctor Cooperate with Alcor?"
                value={medicalInfo.willDoctorCooperate || ''}
                onChange={(e) => setMedicalInfo({...medicalInfo, willDoctorCooperate: e.target.value})}
                disabled={!editMode.medical}
                containerClassName={styleConfig.display.grid.fullSpan}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </Select>
            </div>

            {/* Medical History - Always show in edit mode */}
            <h3 className={styleConfig.text.heading.h3 + " mt-6"}>Medical History & Conditions</h3>
            <div className={styleConfig.form.fieldSpacing}>
              <div>
                <label className={styleConfig.form.label}>Health Problems</label>
                <textarea 
                  value={medicalInfo.healthProblems || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, healthProblems: e.target.value})}
                  disabled={!editMode.medical}
                  rows={3}
                  className={styleConfig.input.textarea}
                  placeholder="List any current or chronic health problems"
                />
              </div>
              
              <div>
                <label className={styleConfig.form.label}>Allergies (including to drugs)</label>
                <textarea 
                  value={medicalInfo.allergies || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                  disabled={!editMode.medical}
                  rows={3}
                  className={styleConfig.input.textarea}
                  placeholder="e.g., Penicillin; Vicodin"
                />
              </div>
              
              <div>
                <label className={styleConfig.form.label}>Medications Currently or Recently Taken</label>
                <textarea 
                  value={medicalInfo.medications || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})}
                  disabled={!editMode.medical}
                  rows={3}
                  className={styleConfig.input.textarea}
                  placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
                />
              </div>
              
              <div>
                <label className={styleConfig.form.label}>Identifying Scars or Deformities</label>
                <textarea 
                  value={medicalInfo.identifyingScars || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, identifyingScars: e.target.value})}
                  disabled={!editMode.medical}
                  rows={2}
                  className={styleConfig.input.textarea}
                />
              </div>
              
              <div>
                <label className={styleConfig.form.label}>Artificial Appliances, Implants or Prosthetics</label>
                <textarea 
                  value={medicalInfo.artificialAppliances || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, artificialAppliances: e.target.value})}
                  disabled={!editMode.medical}
                  rows={2}
                  className={styleConfig.input.textarea}
                  placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
                />
              </div>
              
              <div>
                <label className={styleConfig.form.label}>Past Medical History</label>
                <textarea 
                  value={medicalInfo.pastMedicalHistory || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, pastMedicalHistory: e.target.value})}
                  disabled={!editMode.medical}
                  rows={4}
                  className={styleConfig.input.textarea}
                  placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
                />
              </div>
              
              <div>
                <label className={styleConfig.form.label}>Hereditary Illnesses or Tendencies in Family</label>
                <textarea 
                  value={medicalInfo.hereditaryIllnesses || ''} 
                  onChange={(e) => setMedicalInfo({...medicalInfo, hereditaryIllnesses: e.target.value})}
                  disabled={!editMode.medical}
                  rows={3}
                  className={styleConfig.input.textarea}
                  placeholder="List any hereditary conditions in your family"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Bottom section - Shows in all cases except read-only with expanded details */}
        {!(showMoreDetails && !editMode.medical) && (
          <div className="flex items-center justify-between mt-16">
            {/* Left side - Warning if profile needs improvement */}
            {needsProfileImprovement() ? (
              <div className="flex items-center gap-4 flex-1">
                <svg className="w-10 h-10 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Improve Your Member Profile
                    </p>
                    <div className="relative">
                      <HelpCircle 
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                        strokeWidth={2}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      />
                      {showTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
                          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">
                                Why Does Alcor Need This?
                              </h3>
                              <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                              </svg>
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-sm text-gray-700">
                              Complete medical information helps Alcor provide better care in emergency situations and ensures your physician can be contacted quickly if needed.
                            </p>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                            <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-light">
                    {getMissingFieldsMessage()}
                  </p>
                </div>
              </div>
            ) : (
              <div></div>
            )}
            
            {/* Right side - buttons */}
            {!editMode.medical ? (
              <div className="flex items-center gap-3 flex-shrink-0">
                {!showMoreDetails && (
                  <button
                    onClick={() => setShowMoreDetails(true)}
                    className="flex items-center text-base text-gray-900 hover:text-gray-700 font-medium"
                  >
                    <ChevronDown className="w-5 h-5 mr-1" />
                    <span className="hidden sm:inline">Show More Details</span>
                    <span className="sm:hidden">More</span>
                  </button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => toggleEditMode('medical')}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-shrink-0">
                <ButtonGroup>
                  <Button
                    variant="tertiary"
                    onClick={() => cancelEdit('medical')}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!medicalInfo.sex || medicalInfo.sex === '') {
                        alert('Please select a sex before saving.');
                        return;
                      }
                      saveMedicalInfo();
                    }}
                    loading={savingSection === 'medical'}
                    disabled={savingSection === 'medical'}
                  >
                    Save
                  </Button>
                </ButtonGroup>
              </div>
            )}
          </div>
        )}
        
        {/* Collapsible Medical History Section - Only in read-only mode */}
        {showMoreDetails && !editMode.medical && (
          <div className="mt-6">
            <h3 className={styleConfig.text.heading.h3}>Medical History & Conditions</h3>
            <dl className={styleConfig.display.dl.wrapper + " mt-4"}>
              <InfoDisplay 
                label="Health Problems" 
                value={medicalInfo.healthProblems}
                className={styleConfig.display.grid.fullSpan}
              />
              <InfoDisplay 
                label="Allergies (including to drugs)" 
                value={medicalInfo.allergies}
                className={styleConfig.display.grid.fullSpan}
              />
              <InfoDisplay 
                label="Current/Recent Medications" 
                value={medicalInfo.medications}
                className={styleConfig.display.grid.fullSpan}
              />
              <InfoDisplay 
                label="Identifying Scars or Deformities" 
                value={medicalInfo.identifyingScars}
                className={styleConfig.display.grid.fullSpan}
              />
              <InfoDisplay 
                label="Artificial Appliances/Implants/Prosthetics" 
                value={medicalInfo.artificialAppliances}
                className={styleConfig.display.grid.fullSpan}
              />
              <InfoDisplay 
                label="Past Medical History" 
                value={medicalInfo.pastMedicalHistory}
                className={styleConfig.display.grid.fullSpan}
              />
              <InfoDisplay 
                label="Hereditary Illnesses or Tendencies" 
                value={medicalInfo.hereditaryIllnesses}
                className={styleConfig.display.grid.fullSpan}
              />
            </dl>
            
            {/* Bottom section when dropdown is open - All three elements on same row */}
            <div className="flex items-center justify-between mt-8">
              {/* Left side - Warning if profile needs improvement */}
              {needsProfileImprovement() ? (
                <div className="flex items-center gap-4 flex-1">
                  <svg className="w-10 h-10 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Improve Your Member Profile
                      </p>
                      <div className="relative">
                        <HelpCircle 
                          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                          strokeWidth={2}
                          onMouseEnter={() => setShowTooltipBottom(true)}
                          onMouseLeave={() => setShowTooltipBottom(false)}
                        />
                        {showTooltipBottom && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  Why Does Alcor Need This?
                                </h3>
                                <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                                </svg>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                Complete medical information helps Alcor provide better care in emergency situations and ensures your physician can be contacted quickly if needed.
                              </p>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                              <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-light">
                      {getMissingFieldsMessage()}
                    </p>
                  </div>
                </div>
              ) : (
                <div></div>
              )}
              
              {/* Right side - buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                  className="flex items-center text-base text-gray-900 hover:text-gray-700 font-medium"
                >
                  <ChevronUp className="w-5 h-5 mr-1" />
                  <span className="hidden sm:inline">Show Less Details</span>
                  <span className="sm:hidden">Less</span>
                </button>
                
                <Button
                  variant="secondary"
                  onClick={() => toggleEditMode('medical')}
                >
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalInfoSection;