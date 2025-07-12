import React, { useState, useEffect, useRef } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig from '../styleConfig2';
import { HelpCircle } from 'lucide-react';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd 
      className="text-gray-900" 
      style={{ 
        WebkitTextStroke: '0.6px #1f2937',
        fontWeight: 400,
        letterSpacing: '0.01em',
        fontSize: '15px'
      }}
    >
      {value || styleConfig.display.item.empty}
    </dd>
  </div>
);

const LegalSection = ({ 
  legal, 
  setLegal, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveLegal, 
  savingSection,
  memberCategory,
  sectionImage,  // Add this prop
  sectionLabel   // Add this prop
}) => {
  // Add state for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);
  
  // Helper to check if will is "Yes"
  const hasWillYes = () => {
    const value = legal?.hasWill;
    return value === 'Yes' || value === true || value === 'true';
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 Legal Section Data:', {
      hasWill: legal?.hasWill,
      hasWillType: typeof legal?.hasWill,
      willContraryToCryonics: legal?.willContraryToCryonics,
      willContraryType: typeof legal?.willContraryToCryonics,
      hasWillYesResult: hasWillYes(),
      fullLegalObject: legal
    });
  }, [legal]);

  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (legal?.hasWill) {
      previewParts.push(`Will: ${legal.hasWill}`);
    }
    if ((legal?.hasWill === 'Yes' || legal?.hasWill === true) && legal?.willContraryToCryonics) {
      previewParts.push(`Contrary provisions: ${legal.willContraryToCryonics}`);
    }
    
    return previewParts.join(' • ') || 'No information provided';
  };

  // Check if fields are required based on member category
  const isRequired = memberCategory === 'CryoApplicant' || memberCategory === 'CryoMember';

  // Info notice component (used in both mobile and desktop)
  const LegalInfoNotice = () => (
    <div className={isMobile ? "mt-4 mb-4" : "flex items-center gap-4"}>
      <svg className={isMobile ? "w-8 h-8 text-blue-500 flex-shrink-0 mb-2" : "w-10 h-10 text-blue-500 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={isMobile ? "text-sm font-semibold text-white/90" : "text-sm font-semibold text-gray-900"}>
            Have Questions About Wills?
          </p>
          <div className="relative" ref={tooltipRef}>
            <button
              type="button"
              className={isMobile ? "p-1 rounded-full hover:bg-white/10 transition-colors" : "p-1 rounded-full hover:bg-gray-100 transition-colors"}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <HelpCircle 
                className={isMobile ? "w-4 h-4 text-white/60 hover:text-white/80" : "w-4 h-4 text-gray-400 hover:text-gray-600"} 
                strokeWidth={2}
              />
            </button>
            {showTooltip && (
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${isMobile ? 'w-80' : 'w-96'}`}>
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Why Does Alcor Need This?
                    </h3>
                    <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTooltip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className={`px-4 py-3 overflow-y-auto ${isMobile ? 'max-h-64' : 'max-h-80'}`}>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <em className="font-semibold">these provisions may invalidate your Cryopreservation Agreement.</em>
                    </p>
                    <p className="text-sm text-gray-900 font-semibold">
                      If you have a will, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                    </p>
                    <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                      Both will-related fields are mandatory in the application process, and you must answer whether you have a will and whether it contains any provisions that might conflict with cryopreservation arrangements.
                    </p>
                  </div>
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
          Learn about will requirements and cryonics provisions
        </p>
      </div>
    </div>
  );

  return (
    <div className={isMobile ? "" : styleConfig.section.wrapperEnhanced}>
      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
          title="Legal/Will Information"
          backgroundImage={formsHeaderImage}
          overlayText="Legal Details"
          subtitle="Information about your will and cryonics-related provisions."
          isEditMode={editMode.legal}
        >
          {/* Display Mode */}
          {!editMode.legal ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Do you have a will?" 
                  value={legal.hasWill || 'Not specified'} 
                />
                {hasWillYes() && (
                  <DisplayField 
                    label="Does your will contain any provisions contrary to cryonics?" 
                    value={legal.willContraryToCryonics || 'Not specified'} 
                  />
                )}
              </div>
              
              {/* Add info notice before action buttons */}
              <LegalInfoNotice />
              
              <ActionButtons 
                editMode={false}
                onEdit={() => toggleEditMode && toggleEditMode('legal')}
              />
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <FormSelect
                  label="Do you have a will?"
                  value={legal.hasWill || ''}
                  onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
                  required={isRequired}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </FormSelect>
                
                {legal.hasWill === 'Yes' && (
                  <>
                    <FormSelect
                      label="Does your will contain any provisions contrary to cryonics?"
                      value={legal.willContraryToCryonics || ''}
                      onChange={(e) => setLegal({...legal, willContraryToCryonics: e.target.value})}
                      required={isRequired}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </FormSelect>
                  </>
                )}
                
                {/* Add helpful text for users */}
                {legal.hasWill === 'Yes' && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900 mb-1">Important:</p>
                    <p>Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <strong>these provisions may invalidate your Cryopreservation Agreement.</strong></p>
                    {legal.willContraryToCryonics === 'Yes' && (
                      <p className="mt-2 text-red-700 font-medium">
                        If you have a will with contrary provisions, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveLegal}
                onCancel={() => cancelEdit && cancelEdit('legal')}
                saving={savingSection === 'legal'}
              />
            </>
          )}
        </MobileInfoCard>
      ) : (
        /* Desktop view */
        <div className={styleConfig.section.innerPadding}>
          {/* Desktop Header Section */}
          <div className="relative pb-6 mb-6 border-b border-gray-200">
            {/* Header content */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <div className={styleConfig.header.wrapper}>
                  <div className={styleConfig.sectionIcons.legal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div className={styleConfig.header.textContainer}>
                    <h2 className={styleConfig.header.title}>Legal/Will Information</h2>
                    <p className="text-gray-600 text-base mt-1">
                      Information about your will and cryonics-related provisions.
                      {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Image on right side */}
              {sectionImage && (
                <div className="flex-shrink-0 ml-8">
                  <div className="relative w-64 h-24 rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={sectionImage} 
                      alt="" 
                      className="w-full h-full object-cover grayscale"
                    />
                    {sectionLabel && (
                      <div className="absolute bottom-0 right-0">
                        <div className="px-2.5 py-0.5 bg-gradient-to-r from-[#162740] to-[#6e4376]">
                          <p className="text-white text-xs font-medium tracking-wider flex items-center gap-1">
                            {sectionLabel}
                            <img src={alcorStar} alt="" className="w-3 h-3" />
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
            {/* Desktop Display Mode */}
            {!editMode.legal ? (
              <div className="max-w-2xl">
                <dl className={styleConfig.display.dl.wrapperSingle}>
                  <InfoDisplay 
                    label="Do you have a will?" 
                    value={legal.hasWill || 'Not specified'} 
                  />
                  {hasWillYes() && (
                    <InfoDisplay 
                      label="Does your will contain any provisions contrary to cryonics?" 
                      value={legal.willContraryToCryonics || 'Not specified'} 
                    />
                  )}
                </dl>
              </div>
            ) : (
              /* Desktop Edit Mode - Form */
              <div className="max-w-2xl">
                <div className={styleConfig.form.fieldSpacing}>
                  <Select
                    label="Do you have a will?"
                    value={legal.hasWill || ''}
                    onChange={(e) => setLegal({...legal, hasWill: e.target.value})}
                    disabled={!editMode.legal}
                    required={isRequired}
                  >
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </Select>
                  
                  {legal.hasWill === 'Yes' && (
                    <>
                      <Select
                        label="Does your will contain any provisions contrary to cryonics?"
                        value={legal.willContraryToCryonics || ''}
                        onChange={(e) => setLegal({...legal, willContraryToCryonics: e.target.value})}
                        disabled={!editMode.legal}
                        required={isRequired}
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </Select>
                      
                      {/* Add helpful text for desktop users */}
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Important Information:</h4>
                        <p className="text-sm text-gray-700 mb-2">
                          Alcor does not require that you have a will in order to become a member. However, if you already have a will which has provisions contrary to the goals of cryonics (for example, if your will states that you do not want cryopreservation, or if it requires cremation, burial, or other disposition of your human remains after your legal death), <strong>these provisions may invalidate your Cryopreservation Agreement.</strong>
                        </p>
                        {legal.willContraryToCryonics === 'Yes' && (
                          <p className="text-sm text-red-700 font-medium mt-2 p-2 bg-red-50 rounded">
                            <strong>Action Required:</strong> If you have a will with contrary provisions, it is your responsibility to change it through a new codicil or a new will; otherwise, your cryopreservation arrangements may not be valid.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Desktop Button Group and Info Notice */}
            <div className="flex items-center justify-between mt-16">
              {/* Left side - Info Notice (always visible) */}
              <LegalInfoNotice />
              
              {/* Right side - buttons */}
              <div className="flex justify-end -mr-8">
                {editMode?.legal ? (
                  <div className="flex">
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('legal')}
                      className="scale-75 -mr-8"
                      spinStar={false}
                    />
                    <PurpleButton
                      text={savingSection === 'saved' ? 'Saved' : savingSection === 'legal' ? 'Saving...' : 'Save'}
                      onClick={saveLegal}
                      className="scale-75"
                      spinStar={false}
                      disabled={savingSection === 'legal'}
                    />
                  </div>
                ) : (
                  <RainbowButton
                    text="Edit"
                    onClick={() => toggleEditMode && toggleEditMode('legal')}
                    className="scale-75"
                    spinStar={true}
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

export default LegalSection;