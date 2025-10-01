import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';
import dewarsImage from '../../../assets/images/dewars2.jpg';
import styleConfig2 from '../styleConfig2';

const ContactInfoMobile = ({ 
  contactInfo,
  personalInfo,
  setContactInfo,
  setPersonalInfo,
  editMode,
  toggleEditMode,
  cancelEdit,
  saveContactInfo,
  savingSection,
  fieldErrors,
  fieldConfig
}) => {
  const formatDateForDisplay = (dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const date = new Date(dateOfBirth);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    if (phone.includes('(')) return phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    let filledRecommended = 0;
    
    Object.values(fieldConfig.required).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ contactInfo, personalInfo })) {
          filledRequired++;
        }
      } else {
        const source = field.source === 'personalInfo' ? personalInfo : contactInfo;
        const value = source?.[field.field];
        if (value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '')) {
          filledRequired++;
        }
      }
    });
    
    Object.values(fieldConfig.recommended).forEach(field => {
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue({ contactInfo, personalInfo })) {
          filledRecommended++;
        }
      } else {
        const source = field.source === 'personalInfo' ? personalInfo : contactInfo;
        const value = source?.[field.field];
        if (value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '')) {
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

  return (
    <div className="-mx-2">
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
        {/* White Header Section */}
      <div className="bg-white px-6 py-6">
        <div className="flex flex-col gap-5 w-full">
          {/* Top row - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className={styleConfig2.sectionIcons.contact}>
              <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900">Contact Information</h3>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Contact Profile</h3>
                    <p className="text-sm text-gray-600">Keep your details current for important communications</p>
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
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#212849" />
                          <stop offset="30%" stopColor="#4d3666" />
                          <stop offset="60%" stopColor="#7d4582" />
                          <stop offset="85%" stopColor="#864d7b" />
                          <stop offset="95%" stopColor="#9f6367" />
                          <stop offset="100%" stopColor="#aa6c61" />
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
                      <p className="text-xs text-gray-500 mt-0.5">First Name, Last Name, Date of Birth, Personal Email, Preferred Phone</p>
                    </div>
                  </div>
                  
                  {/* Recommended fields */}
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-[#6e4376] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900">Recommended Information</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Middle Name, Work Email, Phone Number</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
{/* Display Mode - Contact Preview */}
{!editMode.contact && (
              <div className="bg-blue-50/30 rounded-lg p-4">
                <div className="text-sm text-gray-600 text-center break-words px-2">
                  <style jsx>{`
                    .contact-preview a {
                      color: inherit !important;
                      text-decoration: none !important;
                      pointer-events: none !important;
                      cursor: text !important;
                    }
                  `}</style>
                  <div className="contact-preview">
                    <span data-email="false" data-phone="false">
                      {personalInfo?.firstName && personalInfo?.lastName ? 
                        `${personalInfo.firstName} ${personalInfo.lastName}` : 
                        'No name provided'}
                    </span>
                    {personalInfo?.dateOfBirth ? (
                      <>
                        <span> • </span>
                        <span>{formatDateForDisplay(personalInfo.dateOfBirth)}</span>
                      </>
                    ) : ''}
                    {contactInfo?.preferredPhone && (contactInfo?.mobilePhone || contactInfo?.homePhone || contactInfo?.workPhone) ? (
                      <>
                        <span> • </span>
                        <span data-phone="false">
                          {formatPhone(
                            contactInfo.preferredPhone === 'Mobile' ? contactInfo.mobilePhone :
                            contactInfo.preferredPhone === 'Home' ? contactInfo.homePhone :
                            contactInfo.workPhone
                          ).replace(/(\d)/g, '$1\u200B')}
                        </span>
                      </>
                    ) : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      {editMode.contact && (
        <div className="bg-white px-6 py-6 border-t border-gray-200">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="First Name *"
                value={personalInfo?.firstName || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                error={fieldErrors.firstName}
                disabled={savingSection === 'contact'}
              />
              <FormInput
                label="Middle Name"
                value={personalInfo?.middleName || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, middleName: e.target.value})}
                disabled={savingSection === 'contact'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Last Name *"
                value={personalInfo?.lastName || ''}
                onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                error={fieldErrors.lastName}
                disabled={savingSection === 'contact'}
              />
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Date of Birth</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm">
                  {formatDateForDisplay(personalInfo?.dateOfBirth)}
                </div>
              </div>
            </div>
            
            <FormInput
              label="Personal Email *"
              type="email"
              value={contactInfo?.personalEmail || ''}
              onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
              error={fieldErrors.personalEmail}
              disabled={savingSection === 'contact'}
            />
            
            <FormInput
              label="Work Email"
              type="email"
              value={contactInfo?.workEmail || ''}
              onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
              disabled={savingSection === 'contact'}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Preferred Phone *"
                value={contactInfo?.preferredPhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
                error={fieldErrors.preferredPhone}
                disabled={savingSection === 'contact'}
              >
                <option value="">Select...</option>
                <option value="Mobile">Mobile Phone</option>
                <option value="Home">Home Phone</option>
                <option value="Work">Work Phone</option>
              </FormSelect>
              
              <FormInput
                label="Mobile Phone"
                type="tel"
                value={contactInfo?.mobilePhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, mobilePhone: e.target.value})}
                placeholder="(555) 123-4567"
                error={fieldErrors.mobilePhone}
                disabled={savingSection === 'contact'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Home Phone"
                type="tel"
                value={contactInfo?.homePhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
                placeholder="(555) 123-4567"
                error={fieldErrors.homePhone}
                disabled={savingSection === 'contact'}
              />
              <FormInput
                label="Work Phone"
                type="tel"
                value={contactInfo?.workPhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
                placeholder="(555) 123-4567"
                error={fieldErrors.workPhone}
                disabled={savingSection === 'contact'}
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
            <button
              onClick={() => cancelEdit && cancelEdit('contact')}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              Close
            </button>
            <button
              onClick={saveContactInfo}
              disabled={savingSection === 'contact'}
              className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
            >
              {savingSection === 'contact' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* View/Edit button when not in edit mode */}
      {!editMode.contact && (
        <div className="bg-white px-6 pb-6">
          <button
            onClick={() => toggleEditMode && toggleEditMode('contact')}
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

export default ContactInfoMobile;