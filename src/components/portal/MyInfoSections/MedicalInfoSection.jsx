import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';
import { 
  overlayStyles, 
  infoCardStyles, 
  sectionImageStyles, 
  headerStyles, 
  buttonStyles, 
  animationStyles 
} from './desktopCardStyles/index';
import { InfoField, InfoCard } from './SharedInfoComponents';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

// FormTextarea component for both mobile and overlay
const FormTextarea = ({ label, value, onChange, placeholder, rows = 3, disabled = false, error = false }) => (
  <div>
    <label className={styleConfig2.form.label}>{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className={`${styleConfig2.input.textarea} ${error ? styleConfig2.input.error : ''}`}
    />
  </div>
);

// Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, medicalInfo, setMedicalInfo, saveMedicalInfo }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(false);  // Start in edit mode
      setShowSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (section === 'basic' && (!medicalInfo?.sex || medicalInfo.sex === '')) {
      alert('Please select a sex before saving.');
      return;
    }
    saveMedicalInfo();
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    setMedicalInfo(data.medicalInfo);
    setEditMode(false);
    onClose();
  };

  const formatHeight = (heightValue) => {
    if (!heightValue) return '—';
    if (typeof heightValue === 'string' && (heightValue.includes("'") || heightValue.includes('"'))) {
      return heightValue;
    }
    const heightNum = parseInt(heightValue);
    if (isNaN(heightNum)) return heightValue;
    const feet = Math.floor(heightNum / 12);
    const inches = heightNum % 12;
    return `${feet}' ${inches}"`;
  };

  const formatWeight = (weight) => {
    if (!weight) return '—';
    const weightNum = weight.toString()
      .replace(' lbs', '')
      .replace(' lb', '')
      .replace('lbs', '')
      .replace('lb', '')
      .trim();
    return `${weightNum} lb`;
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

  const getFieldDescriptions = () => {
    switch (section) {
      case 'basic':
        return {
          title: 'Basic Health Information',
          description: 'Your fundamental health metrics including sex, height, weight, and blood type. This information is essential for medical care and emergency situations.',
          fields: {
            'Sex': 'Your biological sex for medical purposes.',
            'Height': 'Your height in feet and inches.',
            'Weight': 'Your current weight in pounds.',
            'Blood Type': 'Your blood type for emergency transfusions.'
          }
        };
      case 'physician':
        return {
          title: 'Primary Care Physician',
          description: 'Your primary doctor\'s contact information ensures Alcor can quickly reach your physician in emergency situations and coordinate care.',
          fields: {
            'Doctor Name': 'Full name of your primary care physician.',
            'Hospital': 'Hospital or medical center affiliation.',
            'Address': 'Complete address of your doctor\'s office.',
            'Phone Numbers': 'Contact numbers for your physician.',
            'Cooperation': 'Whether your doctor will cooperate with Alcor procedures.'
          }
        };
      case 'history':
        return {
          title: 'Medical History',
          description: 'Comprehensive medical history including current conditions, medications, allergies, and past medical events. This information is crucial for proper medical care.',
          fields: {
            'Health Problems': 'Current or chronic health conditions.',
            'Allergies': 'All allergies including drug allergies.',
            'Medications': 'Current and recent medications with dosages.',
            'Medical History': 'Past surgeries, hospitalizations, and significant medical events.'
          }
        };
      default:
        return { title: '', description: '', fields: {} };
    }
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
                    {section === 'basic' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                    {section === 'physician' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                    {section === 'history' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    )}
                  </svg>
                </div>
                <div className={overlayStyles.header.textWrapper}>
                  <span className={overlayStyles.header.title} style={{ display: 'block' }}>
                    {fieldInfo.title}
                  </span>
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
                <p className={overlayStyles.body.successMessage.text}>Information updated successfully!</p>
              </div>
            )}

            {/* Fields */}
            {!editMode ? (
              /* Display Mode */
              <div className={overlayStyles.body.content}>
                {section === 'basic' && (
                  <div className={overlayStyles.displayMode.grid.twoColumn}>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Sex</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.sex)}
                      >
                        {medicalInfo?.sex || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Height</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.height)}
                      >
                        {formatHeight(medicalInfo?.height)}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Weight</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.weight)}
                      >
                        {formatWeight(medicalInfo?.weight)}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Blood Type</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.bloodType)}
                      >
                        {medicalInfo?.bloodType || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'physician' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Doctor Name</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.primaryPhysician)}
                        >
                          {medicalInfo?.primaryPhysician || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Hospital</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.hospital)}
                        >
                          {medicalInfo?.hospital || '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Doctor Address</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!formatDoctorAddress() || formatDoctorAddress() === '—')}
                      >
                        {formatDoctorAddress()}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Phone Numbers</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!formatDoctorPhones() || formatDoctorPhones() === '—')}
                      >
                        {formatDoctorPhones()}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Will Cooperate with Alcor?</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.willDoctorCooperate)}
                      >
                        {medicalInfo?.willDoctorCooperate || '—'}
                      </p>
                    </div>
                  </div>
                )}

                {section === 'history' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Health Problems</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.healthProblems)}
                      >
                        {medicalInfo?.healthProblems || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Allergies (including to drugs)</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.allergies)}
                      >
                        {medicalInfo?.allergies || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Current/Recent Medications</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.medications)}
                      >
                        {medicalInfo?.medications || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Identifying Scars or Deformities</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.identifyingScars)}
                      >
                        {medicalInfo?.identifyingScars || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Artificial Appliances/Implants/Prosthetics</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.artificialAppliances)}
                      >
                        {medicalInfo?.artificialAppliances || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Past Medical History</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.pastMedicalHistory)}
                      >
                        {medicalInfo?.pastMedicalHistory || '—'}
                      </p>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Hereditary Illnesses or Tendencies</label>
                      <p 
                        className={`${overlayStyles.displayMode.field.value} whitespace-pre-wrap`}
                        style={overlayStyles.displayMode.field.getFieldStyle(!medicalInfo?.hereditaryIllnesses)}
                      >
                        {medicalInfo?.hereditaryIllnesses || '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className={overlayStyles.body.content}>
                {section === 'basic' && (
                  <div className={overlayStyles.editMode.grid.twoColumn}>
                    <Select
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
                    </Select>
                    
                    <Input
                      label="Height (inches)"
                      type="text"
                      value={medicalInfo?.height || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, height: e.target.value})}
                      disabled={savingSection === 'medical'}
                      placeholder="e.g., 68 for 5'8"
                    />
                    
                    <Input
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
                      disabled={savingSection === 'medical'}
                      placeholder="190"
                    />
                    
                    <Select
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
                    </Select>
                  </div>
                )}

                {section === 'physician' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Doctor Name"
                        value={medicalInfo?.primaryPhysician || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, primaryPhysician: e.target.value})}
                        disabled={savingSection === 'medical'}
                      />
                      
                      <Input
                        label="Hospital"
                        value={medicalInfo?.hospital || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, hospital: e.target.value})}
                        disabled={savingSection === 'medical'}
                      />
                    </div>
                    
                    <Input
                      label="Doctor Address"
                      value={medicalInfo?.physicianAddress || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, physicianAddress: e.target.value})}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        value={medicalInfo?.physicianCity || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianCity: e.target.value})}
                        disabled={savingSection === 'medical'}
                      />
                      
                      <Input
                        label="State/Province"
                        value={medicalInfo?.physicianState || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianState: e.target.value})}
                        disabled={savingSection === 'medical'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Zip/Postal Code"
                        value={medicalInfo?.physicianZip || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianZip: e.target.value})}
                        disabled={savingSection === 'medical'}
                      />
                      
                      <Input
                        label="Country"
                        value={medicalInfo?.physicianCountry || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianCountry: e.target.value})}
                        disabled={savingSection === 'medical'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Doctor Home Phone"
                        type="tel"
                        value={medicalInfo?.physicianHomePhone || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianHomePhone: e.target.value})}
                        disabled={savingSection === 'medical'}
                        placeholder="(555) 123-4567"
                      />
                      
                      <Input
                        label="Doctor Work Phone"
                        type="tel"
                        value={medicalInfo?.physicianWorkPhone || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianWorkPhone: e.target.value})}
                        disabled={savingSection === 'medical'}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    
                    <Select
                      label="Will Doctor Cooperate with Alcor?"
                      value={medicalInfo?.willDoctorCooperate || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, willDoctorCooperate: e.target.value})}
                      disabled={savingSection === 'medical'}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Unknown">Unknown</option>
                    </Select>
                  </div>
                )}

                {section === 'history' && (
                  <div className="space-y-4">
                    <FormTextarea
                      label="Health Problems"
                      value={medicalInfo?.healthProblems || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, healthProblems: e.target.value})}
                      placeholder="List any current or chronic health problems"
                      rows={3}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <FormTextarea
                      label="Allergies (including to drugs)"
                      value={medicalInfo?.allergies || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                      placeholder="e.g., Penicillin; Vicodin"
                      rows={3}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <FormTextarea
                      label="Medications Currently or Recently Taken"
                      value={medicalInfo?.medications || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})}
                      placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
                      rows={3}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <FormTextarea
                      label="Identifying Scars or Deformities"
                      value={medicalInfo?.identifyingScars || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, identifyingScars: e.target.value})}
                      rows={2}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <FormTextarea
                      label="Artificial Appliances, Implants or Prosthetics"
                      value={medicalInfo?.artificialAppliances || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, artificialAppliances: e.target.value})}
                      placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
                      rows={2}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <FormTextarea
                      label="Past Medical History"
                      value={medicalInfo?.pastMedicalHistory || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, pastMedicalHistory: e.target.value})}
                      placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
                      rows={4}
                      disabled={savingSection === 'medical'}
                    />
                    
                    <FormTextarea
                      label="Hereditary Illnesses or Tendencies in Family"
                      value={medicalInfo?.hereditaryIllnesses || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, hereditaryIllnesses: e.target.value})}
                      placeholder="List any hereditary conditions in your family"
                      rows={3}
                      disabled={savingSection === 'medical'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={overlayStyles.footer.wrapper}>
            {!editMode ? (
              <PurpleButton
                text="Edit"
                onClick={() => setEditMode(true)}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            ) : (
              <>
                <WhiteButton
                  text="Cancel"
                  onClick={handleCancel}
                  className={buttonStyles.overlayButtons.cancel}
                  spinStar={buttonStyles.starConfig.enabled}
                />
                <PurpleButton
                  text={savingSection === 'medical' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'medical'}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const MedicalInfoSection = ({ 
  medicalInfo = {}, 
  setMedicalInfo,
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveMedicalInfo, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  // Ensure medicalInfo is always an object
  const safeMedicalInfo = medicalInfo || {};
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTooltipBottom, setShowTooltipBottom] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    // Inject animation styles
    const style = animationStyles.injectStyles();
    
    setTimeout(() => setHasLoaded(true), 100);
    
    // Trigger card animations after section loads
    setTimeout(() => setCardsVisible(true), 300);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCardClick = (sectionKey) => {
    setOverlaySection(sectionKey);
    setOverlayOpen(true);
  };

  const handleOverlaySave = () => {
    saveMedicalInfo();
  };

  // Format height for display
  const formatHeight = (heightValue) => {
    if (!heightValue) return '—';
    if (typeof heightValue === 'string' && (heightValue.includes("'") || heightValue.includes('"'))) {
      return heightValue;
    }
    const heightNum = parseInt(heightValue);
    if (isNaN(heightNum)) return heightValue;
    const feet = Math.floor(heightNum / 12);
    const inches = heightNum % 12;
    return `${feet}' ${inches}"`;
  };

  const formatWeight = (weight) => {
    if (!weight) return '—';
    const weightNum = weight.toString()
      .replace(' lbs', '')
      .replace(' lb', '')
      .replace('lbs', '')
      .replace('lb', '')
      .trim();
    return `${weightNum} lb`;
  };

  // Format doctor's full address for display
  const formatDoctorAddress = () => {
    const parts = [
      safeMedicalInfo.physicianAddress,
      safeMedicalInfo.physicianCity,
      safeMedicalInfo.physicianState,
      safeMedicalInfo.physicianZip,
      safeMedicalInfo.physicianCountry
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  // Format doctor's phone numbers for display
  const formatDoctorPhones = () => {
    const phones = [];
    if (safeMedicalInfo.physicianHomePhone) phones.push(`Home: ${safeMedicalInfo.physicianHomePhone}`);
    if (safeMedicalInfo.physicianWorkPhone) phones.push(`Work: ${safeMedicalInfo.physicianWorkPhone}`);
    return phones.length > 0 ? phones.join(' | ') : '—';
  };

  const needsProfileImprovement = () => {
    // Check if important medical fields are missing
    const missingFields = [];
    
    if (!safeMedicalInfo.sex) missingFields.push('sex');
    if (!safeMedicalInfo.height) missingFields.push('height');
    if (!safeMedicalInfo.weight) missingFields.push('weight');
    if (!safeMedicalInfo.bloodType) missingFields.push('blood type');
    
    if (!safeMedicalInfo.primaryPhysician) missingFields.push('primary physician');
    if (!safeMedicalInfo.physicianCity || !safeMedicalInfo.physicianState) missingFields.push('doctor location');
    
    // Check each field individually
    if (!safeMedicalInfo.healthProblems) missingFields.push('health problems');
    if (!safeMedicalInfo.medications) missingFields.push('medications');
    if (!safeMedicalInfo.allergies) missingFields.push('allergies');
    
    return missingFields.length > 0;
  };

  // Get specific missing fields for the message
  const getMissingFieldsMessage = () => {
    const missing = [];
    
    if (!safeMedicalInfo.sex || !safeMedicalInfo.height || !safeMedicalInfo.weight || !safeMedicalInfo.bloodType) {
      missing.push('basic health information');
    }
    if (!safeMedicalInfo.primaryPhysician) {
      missing.push('primary physician details');
    }
    if (!safeMedicalInfo.healthProblems && !safeMedicalInfo.medications && !safeMedicalInfo.allergies) {
      missing.push('medical history');
    }
    
    if (missing.length === 0) return '';
    if (missing.length === 1) return `Add ${missing[0]}`;
    if (missing.length === 2) return `Add ${missing[0]} and ${missing[1]}`;
    return `Add ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (safeMedicalInfo?.sex && safeMedicalInfo?.height && safeMedicalInfo?.weight) {
      previewParts.push(`${safeMedicalInfo.sex}, ${formatHeight(safeMedicalInfo.height)}, ${formatWeight(safeMedicalInfo.weight)}`);
    }
    if (safeMedicalInfo?.bloodType) {
      previewParts.push(`Blood: ${safeMedicalInfo.bloodType}`);
    }
    if (safeMedicalInfo?.primaryPhysician) {
      previewParts.push(`Dr. ${safeMedicalInfo.primaryPhysician}`);
    }
    
    return previewParts.slice(0, 2).join(' • ');
  };

  // FormTextarea component for mobile
  const MobileFormTextarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
    <div>
      <label className="block text-gray-700 text-sm font-medium mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-purple-500 transition-all resize-none"
      />
    </div>
  );

  // Profile improvement notice component (used in both mobile and desktop)
  const ProfileImprovementNotice = () => (
    <div className={isMobile ? "mt-4 mb-4" : "flex items-center gap-4"}>
      <svg className={isMobile ? "w-8 h-8 text-orange-500 flex-shrink-0 mb-2" : "w-10 h-10 text-orange-500 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={isMobile ? "text-sm font-semibold text-white/90" : "text-sm font-semibold text-gray-900"}>
            Improve Your Member Profile
          </p>
          <div className="relative">
            <HelpCircle 
              className={isMobile ? "w-4 h-4 text-white/60 hover:text-white/80 cursor-help" : "w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"} 
              strokeWidth={2}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            />
            {showTooltip && (
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 ${isMobile ? 'w-64' : 'w-72'}`}>
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
        <p className={isMobile ? "text-sm text-white/70 font-light" : "text-sm text-gray-600 font-light"}>
          {getMissingFieldsMessage()}
        </p>
      </div>
    </div>
  );

  return (
    <div className={`medical-info-section ${hasLoaded ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ medicalInfo: safeMedicalInfo }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        medicalInfo={safeMedicalInfo}
        setMedicalInfo={setMedicalInfo}
        saveMedicalInfo={saveMedicalInfo}
      />

      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Health & Emergency Information"
          backgroundImage={formsHeaderImage}
          overlayText="Medical Details"
          subtitle="Your medical history, health details, and emergency contact information."
          isEditMode={editMode.medical}
        >
          {/* Display Mode */}
          {!editMode.medical ? (
            <>
              <div className="space-y-6">
                {/* Basic Health Information */}
                <div>
                  <h3 className="text-white/90 text-sm font-medium mb-3">Basic Health Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DisplayField label="Sex" value={safeMedicalInfo.sex} />
                    <DisplayField label="Height" value={formatHeight(safeMedicalInfo.height)} />
                    <DisplayField label="Weight" value={formatWeight(safeMedicalInfo.weight)} />
                    <DisplayField label="Blood Type" value={safeMedicalInfo.bloodType} />
                  </div>
                </div>

                {/* Doctor Information */}
                <div>
                  <h3 className="text-white/90 text-sm font-medium mb-3">Primary Care Physician</h3>
                  <div className="space-y-4">
                    <DisplayField label="Doctor Name" value={safeMedicalInfo.primaryPhysician} />
                    <DisplayField label="Hospital" value={safeMedicalInfo.hospital} />
                    <DisplayField label="Doctor Address" value={formatDoctorAddress()} />
                    <DisplayField label="Phone Numbers" value={formatDoctorPhones()} />
                    <DisplayField label="Will Cooperate with Alcor?" value={safeMedicalInfo.willDoctorCooperate} />
                  </div>
                </div>

                {/* Expandable Medical History */}
                {showMoreDetails && (
                  <div>
                    <h3 className="text-white/90 text-sm font-medium mb-3">Medical History</h3>
                    <div className="space-y-4">
                      <DisplayField label="Health Problems" value={safeMedicalInfo.healthProblems} />
                      <DisplayField label="Allergies (including to drugs)" value={safeMedicalInfo.allergies} />
                      <DisplayField label="Current/Recent Medications" value={safeMedicalInfo.medications} />
                      <DisplayField label="Identifying Scars or Deformities" value={safeMedicalInfo.identifyingScars} />
                      <DisplayField label="Artificial Appliances/Implants/Prosthetics" value={safeMedicalInfo.artificialAppliances} />
                      <DisplayField label="Past Medical History" value={safeMedicalInfo.pastMedicalHistory} />
                      <DisplayField label="Hereditary Illnesses or Tendencies" value={safeMedicalInfo.hereditaryIllnesses} />
                    </div>
                  </div>
                )}
              </div>
              
              {needsProfileImprovement() && <ProfileImprovementNotice />}
              
              <div className="space-y-3">
                {!showMoreDetails && (
                  <button
                    onClick={() => setShowMoreDetails(true)}
                    className="w-full flex items-center justify-center text-white/80 hover:text-white py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 mr-1" />
                    Show More Details
                  </button>
                )}
                {showMoreDetails && (
                  <button
                    onClick={() => setShowMoreDetails(false)}
                    className="w-full flex items-center justify-center text-white/80 hover:text-white py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ChevronUp className="w-5 h-5 mr-1" />
                    Show Less Details
                  </button>
                )}
                <ActionButtons 
                  editMode={false}
                  onEdit={() => toggleEditMode && toggleEditMode('medical')}
                />
              </div>
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-6">
                {/* Basic Health Information */}
                <div>
                  <h3 className="text-gray-700 text-sm font-medium mb-3">Basic Health Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormSelect
                      label="Sex"
                      value={medicalInfo.sex || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, sex: e.target.value})}
                    >
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </FormSelect>
                    
                    <FormInput
                      label="Height (inches)"
                      type="text"
                      value={medicalInfo.height || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, height: e.target.value})}
                      placeholder="e.g., 68 for 5'8"
                    />
                    
                    <FormInput
                      label="Weight (lbs)"
                      type="text"
                      value={safeMedicalInfo.weight ? safeMedicalInfo.weight.toString().replace(' lbs', '').replace(' lb', '').replace('lbs', '').replace('lb', '').trim() : ''}
                      onChange={(e) => {
                        const weightValue = e.target.value.trim();
                        setMedicalInfo({
                          ...medicalInfo, 
                          weight: weightValue ? `${weightValue} lb` : ''
                        });
                      }}
                      placeholder="190"
                    />
                    
                    <FormSelect
                      label="Blood Type"
                      value={medicalInfo.bloodType || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, bloodType: e.target.value})}
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
                  <h3 className="text-gray-700 text-sm font-medium mb-3">Primary Care Physician</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="Doctor Name"
                        value={medicalInfo.primaryPhysician || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, primaryPhysician: e.target.value})}
                      />
                      
                      <FormInput
                        label="Hospital"
                        value={medicalInfo.hospital || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, hospital: e.target.value})}
                      />
                    </div>
                    
                    <FormInput
                      label="Doctor Address"
                      value={medicalInfo.physicianAddress || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, physicianAddress: e.target.value})}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="City"
                        value={medicalInfo.physicianCity || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianCity: e.target.value})}
                      />
                      
                      <FormInput
                        label="State/Province"
                        value={medicalInfo.physicianState || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianState: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="Zip/Postal Code"
                        value={medicalInfo.physicianZip || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianZip: e.target.value})}
                      />
                      
                      <FormInput
                        label="Country"
                        value={medicalInfo.physicianCountry || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianCountry: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput
                        label="Doctor Home Phone"
                        type="tel"
                        value={medicalInfo.physicianHomePhone || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianHomePhone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                      
                      <FormInput
                        label="Doctor Work Phone"
                        type="tel"
                        value={medicalInfo.physicianWorkPhone || ''}
                        onChange={(e) => setMedicalInfo({...medicalInfo, physicianWorkPhone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    
                    <FormSelect
                      label="Will Doctor Cooperate with Alcor?"
                      value={medicalInfo.willDoctorCooperate || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, willDoctorCooperate: e.target.value})}
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
                  <h3 className="text-gray-700 text-sm font-medium mb-3">Medical History</h3>
                  <div className="space-y-3">
                    <MobileFormTextarea
                      label="Health Problems"
                      value={medicalInfo.healthProblems || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, healthProblems: e.target.value})}
                      placeholder="List any current or chronic health problems"
                      rows={3}
                    />
                    
                    <MobileFormTextarea
                      label="Allergies (including to drugs)"
                      value={medicalInfo.allergies || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, allergies: e.target.value})}
                      placeholder="e.g., Penicillin; Vicodin"
                      rows={3}
                    />
                    
                    <MobileFormTextarea
                      label="Medications Currently or Recently Taken"
                      value={medicalInfo.medications || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, medications: e.target.value})}
                      placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
                      rows={3}
                    />
                    
                    <MobileFormTextarea
                      label="Identifying Scars or Deformities"
                      value={medicalInfo.identifyingScars || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, identifyingScars: e.target.value})}
                      rows={2}
                    />
                    
                    <MobileFormTextarea
                      label="Artificial Appliances, Implants or Prosthetics"
                      value={medicalInfo.artificialAppliances || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, artificialAppliances: e.target.value})}
                      placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
                      rows={2}
                    />
                    
                    <MobileFormTextarea
                      label="Past Medical History"
                      value={medicalInfo.pastMedicalHistory || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, pastMedicalHistory: e.target.value})}
                      placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
                      rows={4}
                    />
                    
                    <MobileFormTextarea
                      label="Hereditary Illnesses or Tendencies in Family"
                      value={medicalInfo.hereditaryIllnesses || ''}
                      onChange={(e) => setMedicalInfo({...medicalInfo, hereditaryIllnesses: e.target.value})}
                      placeholder="List any hereditary conditions in your family"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={() => {
                  if (!safeMedicalInfo.sex || safeMedicalInfo.sex === '') {
                    alert('Please select a sex before saving.');
                    return;
                  }
                  saveMedicalInfo();
                }}
                onCancel={() => cancelEdit && cancelEdit('medical')}
                saving={savingSection === 'medical'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop Version */
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Header Section */}
            <div className={headerStyles.container}>
              <div className={headerStyles.contentWrapper}>
                <div className={headerStyles.leftContent}>
                  <div className={headerStyles.iconTextWrapper(styleConfig2)}>
                    <div className={headerStyles.getIconContainer(styleConfig2, 'medical')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Health & Emergency Information</h2>
                      <p className={headerStyles.subtitle}>
                        Your medical history, health details, and emergency contact information.
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
                      <div 
                        className={sectionImageStyles.overlays.darkBase.className} 
                        style={sectionImageStyles.overlays.darkBase.style}
                      ></div>
                      <div 
                        className={sectionImageStyles.overlays.yellowGlow.className} 
                        style={sectionImageStyles.overlays.yellowGlow.style}
                      ></div>
                      <div 
                        className={sectionImageStyles.overlays.purpleGlow.className} 
                        style={sectionImageStyles.overlays.purpleGlow.style}
                      ></div>
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

            {/* Content */}
            <div className="bg-white">
              {!editMode.medical ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Health Information Card */}
{/* Basic Health Information Card */}
<InfoCard 
  title="Basic Health Information" 
  icon={
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  }
  sectionKey="basic"
  hoveredSection={hoveredSection}
  onMouseEnter={() => setHoveredSection('basic')}
  onMouseLeave={() => setHoveredSection(null)}
  onClick={() => handleCardClick('basic')}
  cardIndex={0}
  isVisible={cardsVisible}
>
  <InfoField label="Sex" value={safeMedicalInfo?.sex || '—'} />
  <InfoField label="Height" value={formatHeight(safeMedicalInfo?.height)} />
  <div className="pt-4">    {/* ← padding above */}
  <div className="text-xs text-gray-500 italic mt-8">
    2 additional fields, tap to view
  </div>
</div>

</InfoCard>

{/* Medical History Card */}
<InfoCard 
  title="Medical Information" 
  icon={
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  }
  sectionKey="history"
  hoveredSection={hoveredSection}
  onMouseEnter={() => setHoveredSection('history')}
  onMouseLeave={() => setHoveredSection(null)}
  onClick={() => handleCardClick('history')}
  cardIndex={1}
  isVisible={cardsVisible}
>
  <InfoField label="Health Problems" value={safeMedicalInfo?.healthProblems || '—'} />
  <InfoField label="Allergies" value={safeMedicalInfo?.allergies || '—'} />
  <div className="pt-4">    {/* ← padding above */}
  <div className="text-xs text-gray-500 italic mt-8">
    5 additional fields, tap to view
  </div>
  </div>
</InfoCard>

{/* Primary Care Physician Card */}
<InfoCard 
  title="Primary Care Physician" 
  icon={
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  }
  sectionKey="physician"
  hoveredSection={hoveredSection}
  onMouseEnter={() => setHoveredSection('physician')}
  onMouseLeave={() => setHoveredSection(null)}
  onClick={() => handleCardClick('physician')}
  cardIndex={2}
  isVisible={cardsVisible}
>
  <InfoField label="Doctor Name" value={safeMedicalInfo?.primaryPhysician || '—'} />
  <InfoField label="Hospital" value={safeMedicalInfo?.hospital || '—'} />
  <div className="pt-4">    {/* ← padding above */}
  <div className="text-xs text-gray-500 italic mt-8">
    3 additional fields, tap to view
  </div>
  </div>
</InfoCard>
               </div>
             ) : (
               /* Edit Mode */
               <div className="max-w-4xl">
                 <div className="space-y-6">
                   {/* Basic Health Information */}
                   <div>
                     <h3 className="text-[#2a2346] mb-4 font-medium">Basic Health Information</h3>
                     <div className="grid grid-cols-4 gap-4">
                       <Select
                         label="Sex"
                         value={safeMedicalInfo?.sex || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, sex: e.target.value})}
                         disabled={savingSection === 'medical'}
                         error={fieldErrors.sex}
                       >
                         <option value="">Select...</option>
                         <option value="Male">Male</option>
                         <option value="Female">Female</option>
                         <option value="Other">Other</option>
                       </Select>
                       
                       <Input
                         label="Height (inches)"
                         type="text"
                         value={safeMedicalInfo?.height || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, height: e.target.value})}
                         disabled={savingSection === 'medical'}
                         placeholder="e.g., 68 for 5'8"
                       />
                       
                       <Input
                         label="Weight (lbs)"
                         type="text"
                         value={safeMedicalInfo?.weight ? safeMedicalInfo.weight.toString().replace(' lbs', '').replace(' lb', '').replace('lbs', '').replace('lb', '').trim() : ''}
                         onChange={(e) => {
                           const weightValue = e.target.value.trim();
                           setMedicalInfo({
                             ...safeMedicalInfo, 
                             weight: weightValue ? `${weightValue} lb` : ''
                           });
                         }}
                         disabled={savingSection === 'medical'}
                         placeholder="190"
                       />
                       
                       <Select
                         label="Blood Type"
                         value={safeMedicalInfo?.bloodType || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, bloodType: e.target.value})}
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
                       </Select>
                     </div>
                   </div>

                   {/* Doctor Information */}
                   <div>
                     <h3 className="text-[#2a2346] mb-4 font-medium">Primary Care Physician</h3>
                     <div className="grid grid-cols-2 gap-4">
                       <Input
                         label="Doctor Name"
                         type="text"
                         value={safeMedicalInfo?.primaryPhysician || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, primaryPhysician: e.target.value})}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <Input
                         label="Hospital"
                         type="text"
                         value={safeMedicalInfo?.hospital || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, hospital: e.target.value})}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <Input
                         label="Doctor Address"
                         type="text"
                         value={safeMedicalInfo?.physicianAddress || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianAddress: e.target.value})}
                         disabled={savingSection === 'medical'}
                         containerClassName="col-span-2"
                       />
                       
                       <Input
                         label="City"
                         type="text"
                         value={safeMedicalInfo?.physicianCity || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianCity: e.target.value})}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <Input
                         label="State/Province"
                         type="text"
                         value={safeMedicalInfo?.physicianState || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianState: e.target.value})}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <Input
                         label="Zip/Postal Code"
                         type="text"
                         value={safeMedicalInfo?.physicianZip || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianZip: e.target.value})}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <Input
                         label="Country"
                         type="text"
                         value={safeMedicalInfo?.physicianCountry || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianCountry: e.target.value})}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <Input
                         label="Doctor Home Phone"
                         type="tel"
                         value={safeMedicalInfo?.physicianHomePhone || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianHomePhone: e.target.value})}
                         disabled={savingSection === 'medical'}
                         placeholder="(555) 123-4567"
                       />
                       
                       <Input
                         label="Doctor Work Phone"
                         type="tel"
                         value={safeMedicalInfo?.physicianWorkPhone || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, physicianWorkPhone: e.target.value})}
                         disabled={savingSection === 'medical'}
                         placeholder="(555) 123-4567"
                       />
                       
                       <Select
                         label="Will Doctor Cooperate with Alcor?"
                         value={safeMedicalInfo?.willDoctorCooperate || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, willDoctorCooperate: e.target.value})}
                         disabled={savingSection === 'medical'}
                         containerClassName="col-span-2"
                       >
                         <option value="">Select...</option>
                         <option value="Yes">Yes</option>
                         <option value="No">No</option>
                         <option value="Unknown">Unknown</option>
                       </Select>
                     </div>
                   </div>

                   {/* Medical History */}
                   <div>
                     <h3 className="text-[#2a2346] mb-4 font-medium">Medical History</h3>
                     <div className="space-y-4">
                       <FormTextarea
                         label="Health Problems"
                         value={safeMedicalInfo?.healthProblems || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, healthProblems: e.target.value})}
                         placeholder="List any current or chronic health problems"
                         rows={3}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <FormTextarea
                         label="Allergies (including to drugs)"
                         value={safeMedicalInfo?.allergies || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, allergies: e.target.value})}
                         placeholder="e.g., Penicillin; Vicodin"
                         rows={3}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <FormTextarea
                         label="Medications Currently or Recently Taken"
                         value={safeMedicalInfo?.medications || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, medications: e.target.value})}
                         placeholder="e.g., Statin 20 mg; Nicotinamide Riboside 250 mg"
                         rows={3}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <FormTextarea
                         label="Identifying Scars or Deformities"
                         value={safeMedicalInfo?.identifyingScars || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, identifyingScars: e.target.value})}
                         rows={2}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <FormTextarea
                         label="Artificial Appliances, Implants or Prosthetics"
                         value={safeMedicalInfo?.artificialAppliances || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, artificialAppliances: e.target.value})}
                         placeholder="e.g., Tooth Implants: #3 #4 #5 #12"
                         rows={2}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <FormTextarea
                         label="Past Medical History"
                         value={safeMedicalInfo?.pastMedicalHistory || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, pastMedicalHistory: e.target.value})}
                         placeholder="List any significant past medical conditions, surgeries, or hospitalizations"
                         rows={4}
                         disabled={savingSection === 'medical'}
                       />
                       
                       <FormTextarea
                         label="Hereditary Illnesses or Tendencies in Family"
                         value={safeMedicalInfo?.hereditaryIllnesses || ''}
                         onChange={(e) => setMedicalInfo({...safeMedicalInfo, hereditaryIllnesses: e.target.value})}
                         placeholder="List any hereditary conditions in your family"
                         rows={3}
                         disabled={savingSection === 'medical'}
                       />
                     </div>
                   </div>
                 </div>
               </div>
             )}
             
             {/* Action buttons */}
             {editMode?.medical ? (
               <div className={buttonStyles.actionContainer}>
                 <div className={buttonStyles.buttonGroup}>
                   <WhiteButton
                     text="Cancel"
                     onClick={() => cancelEdit && cancelEdit('medical')}
                     className={buttonStyles.whiteButton.withMargin}
                     spinStar={buttonStyles.starConfig.enabled}
                   />
                   <PurpleButton
                     text={buttonStyles.getSaveButtonText(savingSection)}
                     onClick={() => {
                       if (!safeMedicalInfo.sex || safeMedicalInfo.sex === '') {
                         alert('Please select a sex before saving.');
                         return;
                       }
                       saveMedicalInfo();
                     }}
                     className={buttonStyles.purpleButton.base}
                     spinStar={buttonStyles.starConfig.enabled}
                     disabled={savingSection === 'medical'}
                   />
                 </div>
               </div>
             ) : (
               <>
                 {needsProfileImprovement() ? (
                   <div className="flex items-center justify-between mt-8 pt-6">
                     {/* Profile Improvement Notice - Left side */}
                     <ProfileImprovementNotice />
                     
                     {/* Edit button - Right side */}
                     <WhiteButton
                       text="Edit"
                       onClick={() => toggleEditMode && toggleEditMode('medical')}
                       className={buttonStyles.whiteButton.base}
                       spinStar={buttonStyles.starConfig.enabled}
                     />
                   </div>
                 ) : (
                   <div className={buttonStyles.actionContainer}>
                     <WhiteButton
                       text="Edit"
                       onClick={() => toggleEditMode && toggleEditMode('medical')}
                       className={buttonStyles.whiteButton.base}
                       spinStar={buttonStyles.starConfig.enabled}
                     />
                   </div>
                 )}
               </>
             )}
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default MedicalInfoSection;