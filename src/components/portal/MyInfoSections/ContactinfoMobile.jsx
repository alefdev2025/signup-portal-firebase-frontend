// ContactInfoMobile.js
import React from 'react';
import { FormInput, FormSelect } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';

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
    <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
      {/* White Header Section */}
      <div className="bg-white px-6 py-6">
        <div className="flex flex-col gap-5 w-full">
          {/* Top row - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-lg flex-shrink-0" style={{
              background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)'
            }}>
              <svg className="w-7 h-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900">Contact Information</h3>
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          {/* Content area */}
          <div className="space-y-5">
            {/* Image with white overlay and content */}
            <div className="relative w-full h-64 rounded-lg overflow-hidden shadow-sm">
              {/* Background image */}
              <img 
                src={formsHeaderImage} 
                alt=""
                className="absolute inset-0 w-full h-full object-cover grayscale"
              />
              
              {/* Dark purple/blue overlay base */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'rgba(26, 18, 47, 0.7)'
                }}
              />
              
              {/* Radial yellow glow from bottom */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse 120% 80% at 50% 120%, rgba(255, 215, 0, 0.8) 0%, rgba(255, 184, 0, 0.6) 20%, rgba(255, 140, 0, 0.4) 40%, transparent 70%)'
                }}
              />
              
              {/* Purple/pink glow overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(147, 51, 234, 0.3) 0%, rgba(109, 40, 217, 0.4) 30%, transparent 60%)',
                  mixBlendMode: 'screen'
                }}
              />
              
              {/* White overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-white" style={{ height: '60%' }}>
                <div className="px-6 py-5">
                  <div className="flex items-start gap-5">
                    {/* Left side - Completion wheel */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
                          <circle
                            stroke="#e5e7eb"
                            fill="transparent"
                            strokeWidth={5}
                            r={35}
                            cx={40}
                            cy={40}
                          />
                          <circle
                            stroke="#512BD9"
                            fill="transparent"
                            strokeWidth={5}
                            strokeDasharray={`${219.91} ${219.91}`}
                            style={{ 
                              strokeDashoffset: 219.91 - (completionPercentage / 100) * 219.91,
                              transition: 'stroke-dashoffset 0.5s ease' 
                            }}
                            r={35}
                            cx={40}
                            cy={40}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">
                              {completionPercentage}%
                            </div>
                            <div className="text-[10px] text-gray-600">
                              Complete
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Text content */}
                    <div className="flex-1 space-y-2.5">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Keep your contact details current for important member communications.
                      </p>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#512BD9] mt-0.5 flex-shrink-0"></div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-700">Required:</span> First Name, Last Name, Date of Birth, Personal Email, Preferred Phone
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#F26430] mt-0.5 flex-shrink-0"></div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-semibold text-gray-700">Recommended:</span> Middle Name, Work Email, Phone Number
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Essential Info badge - bottom right corner */}
              <div className="absolute bottom-0 right-0">
                <div className="px-4 py-2" style={{
                  background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                }}>
                  <p className="text-white font-medium text-sm tracking-wider flex items-center gap-1">
                    Essential Info
                    <img src={alcorStar} alt="" className="w-4 h-4" />
                  </p>
                </div>
              </div>
            </div>
            

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
              Cancel
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

      {/* Edit button when not in edit mode */}
      {!editMode.contact && (
        <div className="bg-white px-6 pb-6">
          <button
            onClick={() => toggleEditMode && toggleEditMode('contact')}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactInfoMobile;