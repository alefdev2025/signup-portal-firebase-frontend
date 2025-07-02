import React from 'react';
import { Input, Select, Button, ButtonGroup } from '../FormComponents';
import styleConfig, { isFieldVisibleInEditMode } from '../styleConfig';

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
      <label className={styleConfig.form.label}>Date of Birth *</label>
      <div className="grid grid-cols-3 gap-3">
        {/* Month dropdown */}
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
        
        {/* Day dropdown */}
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
        
        {/* Year dropdown */}
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
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.value}>{value || styleConfig.display.item.empty}</dd>
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
    // Ensure personalInfo is always an object
    const safePersonalInfo = personalInfo || {};
    
    // Parse date of birth into separate fields with safety checks
    const parseDateOfBirth = (dateOfBirth) => {
      if (!dateOfBirth) return { birthMonth: '', birthDay: '', birthYear: '' };
      const [year, month, day] = dateOfBirth.split('-');
      return { birthMonth: month || '', birthDay: day || '', birthYear: year || '' };
    };
  
    const { birthMonth, birthDay, birthYear } = parseDateOfBirth(safePersonalInfo.dateOfBirth || '');

    // Format date for display
    const formatDateForDisplay = (dateOfBirth) => {
      if (!dateOfBirth) return styleConfig.display.item.empty;
      const date = new Date(dateOfBirth);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    // Format phone for display
    const formatPhone = (phone) => {
      if (!phone) return styleConfig.display.item.empty;
      // If phone is already formatted, return it
      if (phone.includes('(')) return phone;
      // Otherwise, format it
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
      
      // Only update if all fields are filled
      if (updatedDate.birthMonth && updatedDate.birthDay && updatedDate.birthYear) {
        const formattedDate = `${updatedDate.birthYear}-${updatedDate.birthMonth}-${updatedDate.birthDay}`;
        setPersonalInfo({...safePersonalInfo, dateOfBirth: formattedDate});
      }
    };

  return (
    <div className="bg-white rounded-2xl sm:rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] sm:shadow-md border border-gray-500 sm:border-gray-200 mb-6 sm:mb-8 -mx-1 sm:mx-0">
      <div className="px-4 py-6 sm:p-6 md:p-8">
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
            <div className={styleConfig.sectionIcons.contact}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Contact Information</h2>
            <p className={styleConfig.header.subtitle}>
              Your personal details and how we can reach you for important communications.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.contact ? (
          <dl className={styleConfig.display.dl.wrapperThree}>
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
              value={contactInfo?.preferredPhone ? `${contactInfo.preferredPhone} Phone` : styleConfig.display.item.empty} 
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
          <div className={styleConfig.section.grid.twoColumn}>
            {/* Name fields moved here from personal info */}
            <Input
              label="First Name *"
              type="text"
              value={safePersonalInfo?.firstName || ''}
              onChange={(e) => setPersonalInfo({...safePersonalInfo, firstName: e.target.value})}
              disabled={!editMode.contact}
              error={fieldErrors.firstName}
            />
            
            <Input
              label="Middle Name"
              type="text"
              value={safePersonalInfo?.middleName || ''}
              onChange={(e) => setPersonalInfo({...safePersonalInfo, middleName: e.target.value})}
              disabled={!editMode.contact}
            />
            
            <Input
              label="Last Name *"
              type="text"
              value={safePersonalInfo?.lastName || ''}
              onChange={(e) => setPersonalInfo({...safePersonalInfo, lastName: e.target.value})}
              disabled={!editMode.contact}
              error={fieldErrors.lastName}
            />
            
            {/* Date of Birth - Only show if configured to be visible in edit mode */}
            {isFieldVisibleInEditMode('contact', 'dateOfBirth') && (
              <DateOfBirthFields
                birthMonth={birthMonth}
                birthDay={birthDay}
                birthYear={birthYear}
                onChange={handleDateChange}
                disabled={!editMode.contact}
              />
            )}
            
            <Input
              label="Personal Email *"
              type="email"
              value={contactInfo?.personalEmail || ''}
              onChange={(e) => setContactInfo({...contactInfo, personalEmail: e.target.value})}
              disabled={!editMode.contact}
            />
            
            <Input
              label="Work Email"
              type="email"
              value={contactInfo?.workEmail || ''}
              onChange={(e) => setContactInfo({...contactInfo, workEmail: e.target.value})}
              disabled={!editMode.contact}
            />
            
            <Select
              label="Preferred Phone *"
              value={contactInfo?.preferredPhone || ''}
              onChange={(e) => setContactInfo({...contactInfo, preferredPhone: e.target.value})}
              disabled={!editMode.contact}
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
              disabled={!editMode.contact}
              placeholder="(555) 123-4567"
              error={fieldErrors.mobilePhone}
            />
            
            <Input
              label="Home Phone"
              type="tel"
              value={contactInfo?.homePhone || ''}
              onChange={(e) => setContactInfo({...contactInfo, homePhone: e.target.value})}
              disabled={!editMode.contact}
              placeholder="(555) 123-4567"
              error={fieldErrors.homePhone}
            />
            
            <Input
              label="Work Phone"
              type="tel"
              value={contactInfo?.workPhone || ''}
              onChange={(e) => setContactInfo({...contactInfo, workPhone: e.target.value})}
              disabled={!editMode.contact}
              placeholder="(555) 123-4567"
              error={fieldErrors.workPhone}
            />
          </div>
        )}
        
        <ButtonGroup>
          {editMode?.contact ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit && cancelEdit('contact')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveContactInfo}
                loading={savingSection === 'contact'}
                disabled={savingSection === 'contact' || savingSection === 'saved'}
              >
                {savingSection === 'saved' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </>
                ) : savingSection === 'contact' ? (
                  'Saving...'
                ) : (
                  'Save'
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode && toggleEditMode('contact')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default ContactInfoSection;