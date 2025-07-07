import React, { useState, useEffect } from 'react';
import { Input, Select, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { isFieldVisibleInEditMode, getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import { 
  formatPersonName, 
  formatEmail, 
  formatPhone, 
  formatCity,
  formatStreetAddress,
  formatStateProvince,
  formatPostalCode,
  formatCountry,
  cleanString 
} from '../utils/dataFormatting';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig2.display.item.label}>{label}</dt>
    <dd className={styleConfig2.display.item.value}>{value || styleConfig2.display.item.empty}</dd>
  </div>
);

const NextOfKinSection = ({ 
  nextOfKinList = [],
  setNextOfKinList,
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveNextOfKin, 
  savingSection,
  memberCategory,
  fieldErrors = {}
}) => {
  
  // Add state for mobile collapse
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Clean NOK data helper function
  const cleanNokData = (nok) => {
    return {
      id: nok.id,
      firstName: formatPersonName(nok.firstName || ''),
      middleName: formatPersonName(nok.middleName || ''),
      lastName: formatPersonName(nok.lastName || ''),
      fullName: '', // Will be computed
      relationship: cleanString(nok.relationship || ''),
      dateOfBirth: nok.dateOfBirth || '',
      homePhone: formatPhone(nok.homePhone || ''),
      mobilePhone: formatPhone(nok.mobilePhone || ''),
      phone: '', // Will be computed
      email: formatEmail(nok.email || ''),
      address: {
        street1: formatStreetAddress(nok.address?.street1 || ''),
        street2: formatStreetAddress(nok.address?.street2 || ''),
        city: formatCity(nok.address?.city || ''),
        state: formatStateProvince(nok.address?.state || ''),
        postalCode: formatPostalCode(nok.address?.postalCode || ''),
        country: formatCountry(nok.address?.country || '')
      },
      willingToSignAffidavit: cleanString(nok.willingToSignAffidavit || ''),
      comments: cleanString(nok.comments || '')
    };
  };
  
  // Add a new empty Next of Kin
  const addNextOfKin = () => {
    const newNok = cleanNokData({
      id: `temp-${Date.now()}`,
      firstName: '',
      middleName: '',
      lastName: '',
      relationship: '',
      dateOfBirth: '',
      homePhone: '',
      mobilePhone: '',
      email: '',
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      },
      willingToSignAffidavit: '',
      comments: ''
    });
    setNextOfKinList([...nextOfKinList, newNok]);
  };

  // Remove a Next of Kin
  const removeNextOfKin = (index) => {
    const updated = nextOfKinList.filter((_, i) => i !== index);
    setNextOfKinList(updated);
  };

  // Update a specific Next of Kin with cleaning
  const updateNextOfKin = (index, field, value) => {
    const updated = [...nextOfKinList];
    
    // Apply appropriate formatting based on field type
    let cleanedValue = value;
    
    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      cleanedValue = formatPersonName(value);
    } else if (field === 'email') {
      cleanedValue = formatEmail(value);
    } else if (field === 'mobilePhone' || field === 'homePhone') {
      cleanedValue = formatPhone(value);
    } else if (field === 'relationship' || field === 'willingToSignAffidavit' || field === 'comments') {
      cleanedValue = cleanString(value);
    } else if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      if (addressField === 'street1' || addressField === 'street2') {
        cleanedValue = formatStreetAddress(value);
      } else if (addressField === 'city') {
        cleanedValue = formatCity(value);
      } else if (addressField === 'state') {
        cleanedValue = formatStateProvince(value);
      } else if (addressField === 'postalCode') {
        cleanedValue = formatPostalCode(value);
      } else if (addressField === 'country') {
        cleanedValue = formatCountry(value);
      }
    }
    
    // Update the field
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent] = {
        ...updated[index][parent],
        [child]: cleanedValue
      };
    } else {
      updated[index][field] = cleanedValue;
    }
    
    // Auto-generate fullName when firstName or lastName changes
    if (field === 'firstName' || field === 'lastName') {
      const firstName = field === 'firstName' ? cleanedValue : updated[index].firstName || '';
      const lastName = field === 'lastName' ? cleanedValue : updated[index].lastName || '';
      updated[index].fullName = `${firstName} ${lastName}`.trim();
    }
    
    // Set phone field to mobile phone (primary phone for validation)
    if (field === 'mobilePhone') {
      updated[index].phone = cleanedValue;
    } else if (field === 'homePhone' && !updated[index].mobilePhone) {
      // If no mobile phone, use home phone as the phone field
      updated[index].phone = cleanedValue;
    }
    
    setNextOfKinList(updated);
  };

  // Format phone for display (already formatted)
  const formatPhoneDisplay = (phone) => {
    if (!phone) return styleConfig2.display.item.empty;
    return phone; // Already formatted by formatPhone
  };

  // Format date for display
  const formatDateForDisplay = (dateOfBirth) => {
    if (!dateOfBirth) return styleConfig2.display.item.empty;
    try {
      const date = new Date(dateOfBirth);
      if (isNaN(date.getTime())) return styleConfig2.display.item.empty;
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return styleConfig2.display.item.empty;
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return styleConfig2.display.item.empty;
    const parts = [];
    if (address.street1) parts.push(address.street1);
    if (address.street2) parts.push(address.street2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : styleConfig2.display.item.empty;
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    if (nextOfKinList.length === 0) {
      return "No next of kin information on file";
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
    return previewParts.join(' • ') || "No next of kin information on file";
  };

  // Wrap saveNextOfKin to prevent duplicate calls
  const handleSaveNextOfKin = () => {
    // Prevent multiple simultaneous saves
    if (savingSection === 'nextOfKin') {
      console.log('⚠️ Save already in progress, ignoring duplicate call');
      return;
    }
    
    // Clean all data before saving
    const cleanedList = nextOfKinList.map(nok => cleanNokData(nok));
    setNextOfKinList(cleanedList);
    
    // Call the parent's save function
    if (saveNextOfKin) {
      saveNextOfKin();
    }
  };
  
  // Validate email format
  const validateEmail = (email) => {
    if (!email) return true; // Empty is valid (might not be required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Get field error for a specific NOK and field
  const getFieldError = (index, field) => {
    return fieldErrors[`nok_${index}_${field}`];
  };

  return (
    <div className={isMobile ? "" : styleConfig2.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          title="Next of Kin"
          preview={getMobilePreview()}
          subtitle="Emergency contacts and family members who can be contacted on your behalf."
          isEditMode={editMode.nextOfKin}
        >
          {/* Display Mode */}
          {!editMode.nextOfKin ? (
            <>
              {nextOfKinList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No next of kin information on file</p>
              ) : (
                <div className="space-y-6">
                  {nextOfKinList.map((nok, index) => (
                    <div key={nok.id || index} className="border-b border-gray-200 pb-6 last:border-0">
                      <h4 className="font-medium text-white mb-4">
                        {`${nok.firstName} ${nok.lastName}`.trim() || `Next of Kin ${index + 1}`}
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <DisplayField label="First Name" value={nok.firstName} />
                          <DisplayField label="Middle Name" value={nok.middleName} />
                          <DisplayField label="Last Name" value={nok.lastName} />
                          <DisplayField label="Relationship" value={nok.relationship} />
                          <DisplayField label="Date of Birth" value={formatDateForDisplay(nok.dateOfBirth)} />
                          <DisplayField label="Email" value={nok.email} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <DisplayField label="Mobile Phone" value={formatPhoneDisplay(nok.mobilePhone)} />
                          <DisplayField label="Home Phone" value={formatPhoneDisplay(nok.homePhone)} />
                        </div>
                        <DisplayField label="Address" value={formatAddress(nok.address)} />
                        <DisplayField label="Willing to Sign Affidavit" value={nok.willingToSignAffidavit} />
                        {nok.comments && (
                          <DisplayField label="Comments" value={nok.comments} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('nextOfKin')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-6">
                {nextOfKinList.map((nok, index) => (
                  <div key={nok.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-gray-900">Next of Kin {index + 1}</h4>
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
                          error={getFieldError(index, 'firstName')}
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
                          error={getFieldError(index, 'lastName')}
                          disabled={savingSection === 'nextOfKin'}
                        />
                        <FormInput
                          label="Relationship *"
                          value={nok.relationship || ''}
                          onChange={(e) => updateNextOfKin(index, 'relationship', e.target.value)}
                          placeholder="e.g., Spouse, Child, Parent"
                          error={getFieldError(index, 'relationship')}
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
                          error={getFieldError(index, 'email') || 
                                 (!validateEmail(nok.email) && nok.email ? 'Invalid email format' : '')}
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
                          error={getFieldError(index, 'mobilePhone')}
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
                  {nextOfKinList.length > 0 ? 'Add Another Next of Kin' : 'Add Next of Kin'}
                </button>
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={handleSaveNextOfKin}
                onCancel={() => cancelEdit && cancelEdit('nextOfKin')}
                saving={savingSection === 'nextOfKin'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig2.section.innerPadding}>
          {/* Desktop Header */}
          <div className={styleConfig2.header.wrapper}>
            <div className={styleConfig2.sectionIcons.nextOfKin || styleConfig2.sectionIcons.default}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig2.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div className={styleConfig2.header.textContainer}>
              <h2 className={styleConfig2.header.title}>Next of Kin</h2>
              <p className={styleConfig2.header.subtitle}>
                Emergency contacts and family members who can be contacted on your behalf.
              </p>
            </div>
          </div>

          {/* Desktop Content */}
          {!editMode.nextOfKin ? (
            nextOfKinList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No next of kin information on file</p>
            ) : (
              <div className="space-y-8">
                {nextOfKinList.map((nok, index) => (
                  <div key={nok.id || index} className="border-b border-gray-200 pb-6 last:border-0">
                    <h3 className="text-lg font-medium text-[#2a2346] mb-4">
                      {`${nok.firstName} ${nok.lastName}`.trim() || `Next of Kin ${index + 1}`}
                    </h3>
                    <dl className={styleConfig2.display.dl.wrapperThree}>
                      <InfoDisplay label="First Name" value={nok.firstName} />
                      <InfoDisplay label="Middle Name" value={nok.middleName} />
                      <InfoDisplay label="Last Name" value={nok.lastName} />
                      <InfoDisplay label="Relationship" value={nok.relationship} />
                      <InfoDisplay label="Date of Birth" value={formatDateForDisplay(nok.dateOfBirth)} />
                      <InfoDisplay label="Email" value={nok.email} />
                      <InfoDisplay label="Mobile Phone" value={formatPhoneDisplay(nok.mobilePhone)} />
                      <InfoDisplay label="Home Phone" value={formatPhoneDisplay(nok.homePhone)} />
                      <InfoDisplay label="Address" value={formatAddress(nok.address)} className="col-span-3" />
                      <InfoDisplay label="Willing to Sign Affidavit" value={nok.willingToSignAffidavit} />
                      {nok.comments && (
                        <InfoDisplay label="Comments" value={nok.comments} className="col-span-3" />
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Edit Mode - Form */
            <div className="space-y-6">
              {nextOfKinList.map((nok, index) => (
                <div key={nok.id || index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-medium text-[#2a2346]">Next of Kin {index + 1}</h3>
                    {nextOfKinList.length > 0 && (
                      <button
                        onClick={() => removeNextOfKin(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                        disabled={savingSection === 'nextOfKin'}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className={styleConfig2.section.grid.twoColumn}>
                    <Input
                      label="First Name *"
                      type="text"
                      value={nok.firstName || ''}
                      onChange={(e) => updateNextOfKin(index, 'firstName', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                      error={getFieldError(index, 'firstName')}
                    />

                    <Input
                      label="Middle Name"
                      type="text"
                      value={nok.middleName || ''}
                      onChange={(e) => updateNextOfKin(index, 'middleName', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                    />

                    <Input
                      label="Last Name *"
                      type="text"
                      value={nok.lastName || ''}
                      onChange={(e) => updateNextOfKin(index, 'lastName', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                      error={getFieldError(index, 'lastName')}
                    />

                    <Input
                      label="Relationship *"
                      type="text"
                      value={nok.relationship || ''}
                      onChange={(e) => updateNextOfKin(index, 'relationship', e.target.value)}
                      placeholder="e.g., Spouse, Child, Parent"
                      disabled={savingSection === 'nextOfKin'}
                      error={getFieldError(index, 'relationship')}
                    />

                    <Input
                      label="Date of Birth"
                      type="date"
                      value={nok.dateOfBirth || ''}
                      onChange={(e) => updateNextOfKin(index, 'dateOfBirth', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                    />

                    <Input
                      label="Email *"
                      type="email"
                      value={nok.email || ''}
                      onChange={(e) => updateNextOfKin(index, 'email', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                      error={getFieldError(index, 'email') || 
                             (!validateEmail(nok.email) && nok.email ? 'Invalid email format' : '')}
                    />

                    <Input
                      label="Mobile Phone *"
                      type="tel"
                      value={nok.mobilePhone || ''}
                      onChange={(e) => updateNextOfKin(index, 'mobilePhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      disabled={savingSection === 'nextOfKin'}
                      error={getFieldError(index, 'mobilePhone')}
                    />

                    <Input
                      label="Home Phone"
                      type="tel"
                      value={nok.homePhone || ''}
                      onChange={(e) => updateNextOfKin(index, 'homePhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      disabled={savingSection === 'nextOfKin'}
                    />

                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-[#4a3d6b] mb-4">Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Input
                            type="text"
                            value={nok.address?.street1 || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.street1', e.target.value)}
                            placeholder="Street Address Line 1"
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Input
                            type="text"
                            value={nok.address?.street2 || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.street2', e.target.value)}
                            placeholder="Street Address Line 2"
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <Input
                            type="text"
                            value={nok.address?.city || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.city', e.target.value)}
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                          <Input
                            type="text"
                            value={nok.address?.state || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.state', e.target.value)}
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Zip/Postal Code</label>
                          <Input
                            type="text"
                            value={nok.address?.postalCode || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.postalCode', e.target.value)}
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <Input
                            type="text"
                            value={nok.address?.country || ''}
                            onChange={(e) => updateNextOfKin(index, 'address.country', e.target.value)}
                            disabled={savingSection === 'nextOfKin'}
                          />
                        </div>
                      </div>
                    </div>

                    <Select
                      label="Willing to Sign Affidavit?"
                      value={nok.willingToSignAffidavit || ''}
                      onChange={(e) => updateNextOfKin(index, 'willingToSignAffidavit', e.target.value)}
                      disabled={savingSection === 'nextOfKin'}
                      containerClassName="col-span-2"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Unknown">Unknown</option>
                    </Select>

                    <div className="col-span-2">
                      <label className={styleConfig2.form.label}>
                        Comments about attitude toward cryonics
                      </label>
                      <textarea
                        value={nok.comments || ''}
                        onChange={(e) => updateNextOfKin(index, 'comments', e.target.value)}
                        disabled={savingSection === 'nextOfKin'}
                        rows={3}
                        className={styleConfig2.form.textarea || "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100"}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addNextOfKin}
                className="w-full px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50 font-medium"
                disabled={savingSection === 'nextOfKin'}
              >
                {nextOfKinList.length > 0 ? 'Add Another Next of Kin' : 'Add Next of Kin'}
              </button>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            {editMode?.nextOfKin ? (
              <div className="flex">
                <WhiteButton
                  text="Cancel"
                  onClick={() => cancelEdit && cancelEdit('nextOfKin')}
                  className="scale-75 -mr-8"
                  spinStar={false}
                  disabled={savingSection === 'nextOfKin'}
                />
                <PurpleButton
                  text={savingSection === 'saved' ? 'Saved' : savingSection === 'nextOfKin' ? 'Saving...' : 'Save'}
                  onClick={handleSaveNextOfKin}
                  className="scale-75"
                  spinStar={false}
                  disabled={savingSection === 'nextOfKin'}
                />
              </div>
            ) : (
              <RainbowButton
                text="Edit"
                onClick={() => toggleEditMode && toggleEditMode('nextOfKin')}
                className="scale-75"
                spinStar={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NextOfKinSection;