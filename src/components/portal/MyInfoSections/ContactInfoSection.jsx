import React, { useState, useEffect } from 'react';
import { Input, Select, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { isFieldVisibleInEditMode, getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';

// Date of Birth Component
const DateOfBirthFields = ({ 
  birthMonth, 
  birthDay, 
  birthYear, 
  onChange,
  disabled = false,
  errors = {}
}) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="col-span-2">
      <label className={styleConfig2.form.label}>Date of Birth *</label>
      <div className="grid grid-cols-3 gap-3">
        <Select
          name="birthMonth"
          value={birthMonth || ""}
          onChange={onChange}
          disabled={disabled}
          error={errors.birthMonth}
          containerClassName=""
        >
          <option value="" disabled>Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </Select>
        
        <Select
          name="birthDay"
          value={birthDay || ""}
          onChange={onChange}
          disabled={disabled}
          error={errors.birthDay}
          containerClassName=""
        >
          <option value="" disabled>Day</option>
          {Array.from({ length: 31 }, (_, i) => {
            const day = (i + 1).toString().padStart(2, '0');
            return <option key={day} value={day}>{day}</option>;
          })}
        </Select>
        
        <Select
          name="birthYear"
          value={birthYear || ""}
          onChange={onChange}
          disabled={disabled}
          error={errors.birthYear}
          containerClassName=""
        >
          <option value="" disabled>Year</option>
          {Array.from({ length: 100 }, (_, i) => {
            const year = currentYear - i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </Select>
      </div>
    </div>
  );
};

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig2.display.item.label}>{label}</dt>
    <dd className={styleConfig2.display.item.value}>{value || styleConfig2.display.item.empty}</dd>
  </div>
);

const ContactInfoSection = ({ 
    contactInfo = {}, 
    setContactInfo,
    personalInfo = {},
    setPersonalInfo,
    editMode = {}, 
    toggleEditMode, 
    cancelEdit, 
    saveContactInfo, 
    savingSection,
    fieldErrors = {}
  }) => {
    const safePersonalInfo = personalInfo || {};
    
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
    
    // Parse date of birth into separate fields with safety checks
    const parseDateOfBirth = (dateOfBirth) => {
      if (!dateOfBirth) return { birthMonth: '', birthDay: '', birthYear: '' };
      const [year, month, day] = dateOfBirth.split('-');
      return { birthMonth: month || '', birthDay: day || '', birthYear: year || '' };
    };
  
    const { birthMonth, birthDay, birthYear } = parseDateOfBirth(safePersonalInfo.dateOfBirth || '');

    // Format date for display
    const formatDateForDisplay = (dateOfBirth) => {
      if (!dateOfBirth) return styleConfig2.display.item.empty;
      const date = new Date(dateOfBirth);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    // Format phone for display
    const formatPhone = (phone) => {
      if (!phone) return styleConfig2.display.item.empty;
      if (phone.includes('(')) return phone;
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      return phone;
    };

    // Handle date change
    const handleDateChange = (e) => {
      const { name, value } = e.target;
      const currentDate = parseDateOfBirth(safePersonalInfo?.dateOfBirth || '');
      
      const updatedDate = {
        ...currentDate,
        [name]: value
      };
      
      if (updatedDate.birthMonth && updatedDate.birthDay && updatedDate.birthYear) {
        const formattedDate = `${updatedDate.birthYear}-${updatedDate.birthMonth}-${updatedDate.birthDay}`;
        setPersonalInfo({...safePersonalInfo, dateOfBirth: formattedDate});
      }
    };
    
    // Mobile preview data
    const getMobilePreview = () => {
      const previewParts = [];
      
      if (safePersonalInfo?.firstName && safePersonalInfo?.lastName) {
        previewParts.push(`${safePersonalInfo.firstName} ${safePersonalInfo.lastName}`);
      }
      if (contactInfo?.personalEmail) {
        previewParts.push(contactInfo.personalEmail);
      }
      if (contactInfo?.mobilePhone) {
        previewParts.push(formatPhone(contactInfo.mobilePhone));
      }
      
      return previewParts.slice(0, 3).join(' • '); // Return as string with bullet separators
    };

  return (
    <div className={isMobile ? "" : styleConfig2.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="Contact Information"
          preview={getMobilePreview()}
          subtitle="Your personal details and how we can reach you for important communications."
          isEditMode={editMode.contact}
        >
          {/* Display Mode */}
          {!editMode.contact ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="First Name" value={safePersonalInfo?.firstName} />
                  <DisplayField label="Middle Name" value={safePersonalInfo?.middleName} />
                  <DisplayField label="Last Name" value={safePersonalInfo?.lastName} />
                  <DisplayField label="Date of Birth" value={formatDateForDisplay(safePersonalInfo?.dateOfBirth)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Personal Email" value={contactInfo?.personalEmail} />
                  <DisplayField label="Work Email" value={contactInfo?.workEmail} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <DisplayField label="Preferred Phone" value={contactInfo?.preferredPhone ? `${contactInfo.preferredPhone} Phone` : styleConfig2.display.item.empty} />
                  <DisplayField label="Mobile Phone" value={formatPhone(contactInfo?.mobilePhone)} />
                  <DisplayField label="Home Phone" value={formatPhone(contactInfo?.homePhone)} />
                  <DisplayField label="Work Phone" value={formatPhone(contactInfo?.workPhone)} />
                </div>
              </div>
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('contact')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="First Name *"
                    value={safePersonalInfo?.firstName || ''}
                    onChange={(e) => setPersonalInfo({...safePersonalInfo, firstName: e.target.value})}
                    error={fieldErrors.firstName}
                    disabled={savingSection === 'contact'}
                  />
                  <FormInput
                    label="Middle Name"
                    value={safePersonalInfo?.middleName || ''}
                    onChange={(e) => setPersonalInfo({...safePersonalInfo, middleName: e.target.value})}
                    disabled={savingSection === 'contact'}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Last Name *"
                    value={safePersonalInfo?.lastName || ''}
                    onChange={(e) => setPersonalInfo({...safePersonalInfo, lastName: e.target.value})}
                    error={fieldErrors.lastName}
                    disabled={savingSection === 'contact'}
                  />
                  <FormInput
                    label="Personal Email *"
                    type="email"
                    value={contactInfo?.personalEmail || ''}
                    onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
                    error={fieldErrors.personalEmail}
                    disabled={savingSection === 'contact'}
                  />
                </div>
                
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
              
              <ActionButtons 
                editMode={true}
                onSave={saveContactInfo}
                onCancel={() => cancelEdit && cancelEdit('contact')}
                saving={savingSection === 'contact'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig2.section.innerPadding}>
          {/* Desktop Header */}
          <div className={styleConfig2.header.wrapper}>
            <div className={styleConfig2.sectionIcons.contact}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig2.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className={styleConfig2.header.textContainer}>
              <h2 className={styleConfig2.header.title}>Contact Information</h2>
              <p className={styleConfig2.header.subtitle}>
                Your personal details and how we can reach you for important communications.
              </p>
            </div>
          </div>

          {/* Desktop Content */}
          {/* Display Mode */}
          {!editMode.contact ? (
            <dl className={styleConfig2.display.dl.wrapperThree}>
              <InfoDisplay 
                label="First Name" 
                value={safePersonalInfo?.firstName} 
              />
              <InfoDisplay 
                label="Middle Name" 
                value={safePersonalInfo?.middleName} 
              />
              <InfoDisplay 
                label="Last Name" 
                value={safePersonalInfo?.lastName} 
              />
              <InfoDisplay 
                label="Date of Birth" 
                value={formatDateForDisplay(safePersonalInfo?.dateOfBirth)} 
              />
              <InfoDisplay 
                label="Personal Email" 
                value={contactInfo?.personalEmail} 
              />
              <InfoDisplay 
                label="Work Email" 
                value={contactInfo?.workEmail} 
              />
              <InfoDisplay 
                label="Preferred Phone" 
                value={contactInfo?.preferredPhone ? `${contactInfo.preferredPhone} Phone` : styleConfig2.display.item.empty} 
              />
              <InfoDisplay 
                label="Mobile Phone" 
                value={formatPhone(contactInfo?.mobilePhone)} 
              />
              <InfoDisplay 
                label="Home Phone" 
                value={formatPhone(contactInfo?.homePhone)} 
              />
              <InfoDisplay 
                label="Work Phone" 
                value={formatPhone(contactInfo?.workPhone)} 
              />
            </dl>
          ) : (
            /* Edit Mode - Form */
            <div className={styleConfig2.section.grid.twoColumn}>
              <Input
                label="First Name *"
                type="text"
                value={safePersonalInfo?.firstName || ''}
                onChange={(e) => setPersonalInfo({...safePersonalInfo, firstName: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                error={fieldErrors.firstName}
              />
              
              <Input
                label="Middle Name"
                type="text"
                value={safePersonalInfo?.middleName || ''}
                onChange={(e) => setPersonalInfo({...safePersonalInfo, middleName: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
              />
              
              <Input
                label="Last Name *"
                type="text"
                value={safePersonalInfo?.lastName || ''}
                onChange={(e) => setPersonalInfo({...safePersonalInfo, lastName: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                error={fieldErrors.lastName}
              />
              
              {isFieldVisibleInEditMode('contact', 'dateOfBirth') && (
                <DateOfBirthFields
                  birthMonth={birthMonth}
                  birthDay={birthDay}
                  birthYear={birthYear}
                  onChange={handleDateChange}
                  disabled={!editMode.contact || savingSection === 'contact'}
                />
              )}
              
              <Input
                label="Personal Email *"
                type="email"
                value={contactInfo?.personalEmail || ''}
                onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                error={fieldErrors.personalEmail}
              />
              
              <Input
                label="Work Email"
                type="email"
                value={contactInfo?.workEmail || ''}
                onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
              />
              
              <Select
                label="Preferred Phone *"
                value={contactInfo?.preferredPhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                error={fieldErrors.preferredPhone}
              >
                <option value="">Select...</option>
                <option value="Mobile">Mobile Phone</option>
                <option value="Home">Home Phone</option>
                <option value="Work">Work Phone</option>
              </Select>
              
              <Input
                label="Mobile Phone"
                type="tel"
                value={contactInfo?.mobilePhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, mobilePhone: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                placeholder="(555) 123-4567"
                error={fieldErrors.mobilePhone}
              />
              
              <Input
                label="Home Phone"
                type="tel"
                value={contactInfo?.homePhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                placeholder="(555) 123-4567"
                error={fieldErrors.homePhone}
              />
              
              <Input
                label="Work Phone"
                type="tel"
                value={contactInfo?.workPhone || ''}
                onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
                disabled={!editMode.contact || savingSection === 'contact'}
                placeholder="(555) 123-4567"
                error={fieldErrors.workPhone}
              />
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            {editMode?.contact ? (
              <div className="flex">
                <WhiteButton
                  text="Cancel"
                  onClick={() => cancelEdit && cancelEdit('contact')}
                  className="scale-75 -mr-8"
                  spinStar={false}
                  disabled={savingSection === 'contact'}
                />
                <PurpleButton
                  text={savingSection === 'saved' ? 'Saved' : savingSection === 'contact' ? 'Saving...' : 'Save'}
                  onClick={saveContactInfo}
                  className="scale-75"
                  spinStar={false}
                  disabled={savingSection === 'contact'}
                />
              </div>
            ) : (
              <RainbowButton
                text="Edit"
                onClick={() => toggleEditMode && toggleEditMode('contact')}
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

export default ContactInfoSection;