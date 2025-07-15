import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { isFieldVisibleInEditMode, getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import fieldStyles from './desktopCardStyles/fieldStyles';
import alcorStar from '../../../assets/images/alcor-star.png';
import { 
  overlayStyles, 
  infoCardStyles, 
  sectionImageStyles, 
  headerStyles, 
  buttonStyles, 
  animationStyles 
} from './desktopCardStyles/index';
import { InfoField, InfoCard } from './SharedInfoComponents';
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

// Overlay Component
const CardOverlay = ({ 
  isOpen, 
  onClose, 
  section, 
  data, 
  nextOfKinList,
  setNextOfKinList,
  saveNextOfKin,
  savingSection,
  fieldErrors = {}
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedNok, setExpandedNok] = useState(0); // Which NOK to show in display mode

  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false);
      setExpandedNok(0); // Show first NOK by default
    }
  }, [isOpen, nextOfKinList]);

  if (!isOpen) return null;

  // Format date for display
  const formatDateForDisplay = (dateOfBirth) => {
    if (!dateOfBirth) return '—';
    try {
      const date = new Date(dateOfBirth);
      if (isNaN(date.getTime())) return '—';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return '—';
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '—';
    const parts = [];
    if (address.street1) parts.push(address.street1);
    if (address.street2) parts.push(address.street2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  const getFieldDescriptions = () => {
    return {
      title: 'Emergency Contacts',
      description: 'Emergency contacts and family members who can be contacted on your behalf. These individuals may be contacted in case of medical emergency or to help with cryopreservation arrangements.',
      fields: {
        'Name': 'Full legal name of your emergency contact.',
        'Relationship': 'How this person is related to you (e.g., spouse, child, parent).',
        'Contact Info': 'Phone numbers and email address for reaching this person.',
        'Address': 'Current residential address.',
        'Willing to Sign': 'Whether they would sign an affidavit supporting your cryopreservation wishes.'
      }
    };
  };

  const fieldInfo = getFieldDescriptions();

  return ReactDOM.createPortal(
    <div className={overlayStyles.container}>
      <div className={overlayStyles.backdrop} onClick={onClose}></div>
      
      <div className={overlayStyles.contentWrapper}>
        <div className={overlayStyles.contentBox}>
          {/* Header */}
          <div className={overlayStyles.header.wrapper}>
            <button
              onClick={onClose}
              className={overlayStyles.header.closeButton}
            >
              <svg className={overlayStyles.header.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className={overlayStyles.header.content}>
              <div className={overlayStyles.header.iconSection}>
                <div className={overlayStyles.header.iconBox} style={overlayStyles.header.iconBoxBg}>
                  <svg className={overlayStyles.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={overlayStyles.header.iconColor}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className={overlayStyles.header.textWrapper}>
                  <h3 className={overlayStyles.header.title}>
                    {fieldInfo.title}
                  </h3>
                  <p className={overlayStyles.header.description}>
                    {fieldInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={overlayStyles.body.wrapper}>
            {/* Success Message */}
            {showSuccess && (
              <div className={overlayStyles.body.successMessage.container}>
                <svg className={overlayStyles.body.successMessage.icon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className={overlayStyles.body.successMessage.text}>Emergency contacts updated successfully!</p>
              </div>
            )}

            {/* Display Only - No Edit Mode in Overlay */}
            <div className="space-y-8">
              {nextOfKinList.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No emergency contacts on file</p>
              ) : (
                <>
                  {/* Navigation tabs for multiple NOKs */}
                  {nextOfKinList.length > 1 && (
                    <div className="flex space-x-2 border-b border-gray-200">
                      {nextOfKinList.map((nok, index) => (
                        <button
                          key={nok.id || index}
                          onClick={() => setExpandedNok(index)}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            expandedNok === index
                              ? 'text-purple-600 border-purple-600'
                              : 'text-gray-500 border-transparent hover:text-gray-700'
                          }`}
                        >
                          {`${nok.firstName} ${nok.lastName}`.trim() || `Contact ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Display selected NOK with improved spacing */}
                  {nextOfKinList[expandedNok] && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Name</label>
                          <p className={overlayStyles.displayMode.field.value}>
                            {`${nextOfKinList[expandedNok].firstName} ${nextOfKinList[expandedNok].middleName} ${nextOfKinList[expandedNok].lastName}`.trim() || '—'}
                          </p>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Relationship</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!nextOfKinList[expandedNok]?.relationship)}
                          >
                            {nextOfKinList[expandedNok]?.relationship || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Date of Birth</label>
                          <p className={overlayStyles.displayMode.field.value}>
                            {formatDateForDisplay(nextOfKinList[expandedNok]?.dateOfBirth)}
                          </p>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Email</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!nextOfKinList[expandedNok]?.email)}
                          >
                            {nextOfKinList[expandedNok]?.email || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Mobile Phone</label>
                          <p 
                            className={overlayStyles.displayMode.field.value}
                            style={overlayStyles.displayMode.field.getFieldStyle(!nextOfKinList[expandedNok]?.mobilePhone)}
                          >
                            {nextOfKinList[expandedNok]?.mobilePhone || '—'}
                          </p>
                        </div>
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Home Phone</label>
                          <p className={overlayStyles.displayMode.field.value}>
                            {nextOfKinList[expandedNok]?.homePhone || '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Address</label>
                        <p className={overlayStyles.displayMode.field.value}>
                          {formatAddress(nextOfKinList[expandedNok]?.address)}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Willing to Sign Affidavit</label>
                        <p className={overlayStyles.displayMode.field.value}>
                          {nextOfKinList[expandedNok]?.willingToSignAffidavit || '—'}
                        </p>
                      </div>
                      {nextOfKinList[expandedNok]?.comments && (
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Comments</label>
                          <p className={overlayStyles.displayMode.field.value}>
                            {nextOfKinList[expandedNok]?.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer - Only Close button since no editing in overlay */}
          <div className={overlayStyles.footer.wrapper}>
            <PurpleButton
              text="Close"
              onClick={onClose}
              className={buttonStyles.overlayButtons.save}
              spinStar={buttonStyles.starConfig.enabled}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const NextOfKinSection = ({ 
  nextOfKinList = [],
  setNextOfKinList,
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveNextOfKin, 
  savingSection,
  memberCategory,
  fieldErrors = {},
  sectionImage,
  sectionLabel
}) => {
  
  // Add state for mobile
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inject animation styles
  useEffect(() => {
    const style = animationStyles.injectStyles();
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Delay to create smooth entrance
          setTimeout(() => {
            setHasLoaded(true);
            // Stagger card animations after section fades in
            setTimeout(() => setCardsVisible(true), 200);
          }, 100);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isVisible]);
  
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
    
    // Clean all data before saving
    const cleanedList = nextOfKinList.map(nok => cleanNokData(nok));
    setNextOfKinList(cleanedList);
    
    // Call the parent's save function with the cleaned data
    // The parent should implement saveNextOfKin to either:
    // 1. Accept the data as a parameter: saveNextOfKin(cleanedList)
    // 2. Use the state that we just updated with setNextOfKinList
    if (saveNextOfKin) {
      try {
        await saveNextOfKin(cleanedList);
      } catch (error) {
        console.error('Error in handleSaveNextOfKin:', error);
      }
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

  const handleCardClick = (nokIndex) => {
    setOverlaySection(nokIndex);
    setOverlayOpen(true);
  };

  return (
    <div ref={sectionRef} className={`nextofkin-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        selectedIndex={overlaySection}
        nextOfKinList={nextOfKinList}
      />

      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          title="Emergency Contacts"
          backgroundImage={formsHeaderImage}
          overlayText="Emergency Info"
          subtitle="Emergency contacts and family members who can be contacted on your behalf."
          isEditMode={editMode.nextOfKin}
        >
          {/* Display Mode */}
          {!editMode.nextOfKin ? (
            <>
              {nextOfKinList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No emergency contacts on file</p>
              ) : (
                <div className={`space-y-6 ${hasLoaded && isVisible ? 'nextofkin-section-stagger-in' : ''}`}>
                  {nextOfKinList.map((nok, index) => (
                    <div key={nok.id || index} className="border-b border-gray-200 pb-6 last:border-0">
                      <h4 className="font-medium text-white mb-4">
                        {`${nok.firstName} ${nok.lastName}`.trim() || `Emergency Contact ${index + 1}`}
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
                  {nextOfKinList.length > 0 ? 'Add Another Emergency Contact' : 'Add Emergency Contact'}
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
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Desktop Header Section */}
            <div className={headerStyles.container}>
              <div className={headerStyles.contentWrapper}>
                <div className={headerStyles.leftContent}>
                  <div className={headerStyles.iconTextWrapper(styleConfig2)}>
                    <div className={headerStyles.getIconContainer(styleConfig2, 'nextOfKin')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Emergency Contacts</h2>
                      <p className={headerStyles.subtitle}>
                        Emergency contacts and family members who can be contacted on your behalf.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Image on right side */}
                {sectionImage && (
                  <div className={sectionImageStyles.wrapper}>
                    <div className={sectionImageStyles.imageBox}>
                      <img 
                        src={sectionImage} 
                        alt="" 
                        className={sectionImageStyles.image}
                      />
                      {/* Dark purple/blue overlay base */}
                      <div 
                        className={sectionImageStyles.overlays.darkBase.className} 
                        style={sectionImageStyles.overlays.darkBase.style}
                      ></div>
                      {/* Radial yellow glow from bottom */}
                      <div 
                        className={sectionImageStyles.overlays.yellowGlow.className} 
                        style={sectionImageStyles.overlays.yellowGlow.style}
                      ></div>
                      {/* Purple/pink glow overlay */}
                      <div 
                        className={sectionImageStyles.overlays.purpleGlow.className} 
                        style={sectionImageStyles.overlays.purpleGlow.style}
                      ></div>
                      {/* Large star positioned lower */}
                      <div className={sectionImageStyles.star.wrapper}>
                        <img 
                          src={alcorStar} 
                          alt="" 
                          className={sectionImageStyles.star.image}
                          style={sectionImageStyles.star.imageStyle}
                        />
                      </div>
                      {sectionLabel && (
                        <div className={sectionImageStyles.label.wrapper}>
                          <div className={sectionImageStyles.label.container}>
                            <p className={sectionImageStyles.label.text}>
                              {sectionLabel}
                              <img src={alcorStar} alt="" className={sectionImageStyles.label.starIcon} />
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Content - Fields Section */}
            <div className="bg-white">
              {/* Display Mode */}
              {!editMode.nextOfKin ? (
                nextOfKinList.length === 0 ? (
                  <div className="py-16 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No emergency contacts on file</p>
                    <p className="text-gray-400 text-sm mt-2">Add emergency contacts who can be reached on your behalf</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {nextOfKinList.map((nok, index) => (
                      <InfoCard 
                        key={nok.id || index}
                        title={`${nok.firstName} ${nok.lastName}`.trim() || `Emergency Contact ${index + 1}`} 
                        icon={
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        }
                        sectionKey={`nok-${index}`}
                        hoveredSection={hoveredSection}
                        onMouseEnter={() => setHoveredSection(`nok-${index}`)}
                        onMouseLeave={() => setHoveredSection(null)}
                        onClick={() => handleCardClick(index)}
                        cardIndex={index}
                        isVisible={cardsVisible}
                      >
                        <InfoField label="Relationship" value={nok.relationship || '—'} />
                        <InfoField label="Phone" value={nok.mobilePhone || nok.homePhone || '—'} />
                        <InfoField label="Email" value={nok.email || '—'} />
                      </InfoCard>
                    ))}
                  </div>
                )
              ) : (
                /* Edit Mode - Form */
                <div className="space-y-6 max-w-4xl">
                  {nextOfKinList.map((nok, index) => (
                    <div key={nok.id || index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-medium text-[#2a2346]">Emergency Contact {index + 1}</h3>
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
                    {nextOfKinList.length > 0 ? 'Add Another Emergency Contact' : 'Add Emergency Contact'}
                  </button>
                </div>
              )}
              
              {/* Action buttons */}
              <div className={buttonStyles.actionContainer}>
                {editMode?.nextOfKin ? (
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('nextOfKin')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={handleSaveNextOfKin}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                  </div>
                ) : (
                  <WhiteButton
                    text="Edit"
                    onClick={() => toggleEditMode && toggleEditMode('nextOfKin')}
                    className={buttonStyles.whiteButton.base}
                    spinStar={buttonStyles.starConfig.enabled}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextOfKinSection;