// AddressesMobile.js
import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';
import { normalizeAddressCountries } from './CountryMapper';
import { countries } from './countries';  // CHANGED: Added countries import

const AddressesMobile = ({ 
  addresses,
  setAddresses,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveAddresses,
  savingSection,
  fieldConfig,
  formatAddress,
  areAddressesSame
}) => {
  const getAddressPreview = () => {
    const homeCity = addresses.homeCity || '';
    const homeState = addresses.homeState || '';
    const mailingCity = addresses.mailingCity || '';
    const mailingState = addresses.mailingState || '';
    
    const homePart = homeCity && homeState ? `${homeCity}, ${homeState}` : 'Not provided';
    const mailingPart = addresses.sameAsHome ? 'Same as home' : 
                       (mailingCity && mailingState ? `${mailingCity}, ${mailingState}` : 'Not provided');
    
    return `Home: ${homePart} • Mailing: ${mailingPart}`;
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      const value = addresses?.[field.field];
      if (value && value.trim() !== '') {
        filledRequired++;
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ addresses })) {
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

  // Handle save with country normalization
  const handleSaveWithNormalization = () => {
    // Normalize country codes before saving
    const normalizedAddresses = normalizeAddressCountries(addresses);
    setAddresses(normalizedAddresses);
    // Call the parent's save function
    saveAddresses();
  };

  return (
    <div className="-mx-2">
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
        {/* White Header Section */}
        <div className="bg-white px-6 py-6">
          <div className="flex flex-col gap-5 w-full">
            {/* Top row - Icon and Title */}
            <div className="flex items-center gap-3">
              <div className={styleConfig2.sectionIcons.addresses}>
                <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-900">Addresses</h3>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Addresses</h3>
                      <p className="text-sm text-gray-600">Home and mailing addresses</p>
                    </div>
                    
                    {/* Compact completion indicator */}
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
                        <p className="text-xs text-gray-500 mt-0.5">Home Address (including Country)</p>
                      </div>
                    </div>
                    
                    {/* Recommended fields */}
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#6e4376] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">!</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Recommended Information</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Mailing Address</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Display Mode - Address Preview */}
              {!editMode.addresses && (
                <div className="bg-blue-50/30 rounded-lg p-4">
                  <p className="text-sm text-gray-600 text-center">{getAddressPreview()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form Section */}
        {editMode.addresses && (
          <div className="bg-white px-6 py-6 border-t border-gray-200">
            <div className="space-y-6">
              {/* Home Address */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-4">Home Address</h4>
                <div className="space-y-4">
                  <FormInput
                    label="Street Address *"
                    value={addresses?.homeStreet || ''}
                    onChange={(e) => setAddresses({...addresses, homeStreet: e.target.value})}
                    disabled={savingSection === 'addresses'}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="City *"
                      value={addresses?.homeCity || ''}
                      onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                      disabled={savingSection === 'addresses'}
                    />
                    <FormInput
                      label="State/Province *"
                      value={addresses?.homeState || ''}
                      onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                      disabled={savingSection === 'addresses'}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Zip/Postal Code *"
                      value={addresses?.homePostalCode || ''}
                      onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                      disabled={savingSection === 'addresses'}
                    />
                    <FormSelect
                      label="Country *"
                      value={addresses?.homeCountry || 'United States'}
                      onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                      disabled={savingSection === 'addresses'}
                    >
                      <option value="">Select a country</option>
                      {countries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </FormSelect>
                  </div>
                </div>
              </div>
              
              {/* Mailing Address */}
              <div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addresses?.sameAsHome || false}
                      onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
                      disabled={savingSection === 'addresses'}
                      className="mr-2 w-4 h-4 rounded border-gray-300 text-[#162740] focus:ring-2 focus:ring-[#162740]/20"
                    />
                    <span className="text-sm text-gray-700">Mailing address is the same as home address</span>
                  </label>
                </div>
                
                {!addresses?.sameAsHome && (
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Mailing Address</h4>
                    <div className="space-y-4">
                      <FormInput
                        label="Street Address *"
                        value={addresses?.mailingStreet || ''}
                        onChange={(e) => setAddresses({...addresses, mailingStreet: e.target.value})}
                        disabled={savingSection === 'addresses'}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormInput
                          label="City *"
                          value={addresses?.mailingCity || ''}
                          onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                          disabled={savingSection === 'addresses'}
                        />
                        <FormInput
                          label="State/Province *"
                          value={addresses?.mailingState || ''}
                          onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                          disabled={savingSection === 'addresses'}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormInput
                          label="Zip/Postal Code *"
                          value={addresses?.mailingPostalCode || ''}
                          onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                          disabled={savingSection === 'addresses'}
                        />
                        <FormSelect
                          label="Country *"
                          value={addresses?.mailingCountry || 'United States'}
                          onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                          disabled={savingSection === 'addresses'}
                        >
                          <option value="">Select a country</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </FormSelect>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
              <button
                onClick={() => cancelEdit && cancelEdit('addresses')}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                disabled={savingSection === 'addresses'}
              >
                Close
              </button>
              <button
                onClick={handleSaveWithNormalization}
                disabled={savingSection === 'addresses'}
                className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
              >
                {savingSection === 'addresses' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* View/Edit button when not in edit mode */}
        {!editMode.addresses && (
          <div className="bg-white px-6 pb-6">
            <button
              onClick={() => toggleEditMode && toggleEditMode('addresses')}
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

export default AddressesMobile;