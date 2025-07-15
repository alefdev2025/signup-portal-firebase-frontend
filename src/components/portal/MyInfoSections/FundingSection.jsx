import React, { useState, useEffect, useRef } from 'react';
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
import { memberCategoryConfig, isSectionEditable } from '../memberCategoryConfig';
import { findInsuranceCompany } from '../utils/lifeInsuranceCompanyMatcher';

// Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, funding, setFunding, saveFunding, canEdit }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(canEdit);  // Only start in edit mode if user can edit
      setShowSuccess(false);
    }
  }, [isOpen, canEdit]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveFunding();
    setEditMode(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    setFunding(data.funding);
    setEditMode(false);
    onClose();
  };

  const formatFundingType = (type) => {
    if (!type) return '—';
    const typeMap = {
      'Life Insurance': 'Life Insurance',
      'Trust': 'Trust',
      'Prepaid': 'Prepaid',
      'Other': 'Other'
    };
    return typeMap[type] || type;
  };

  const formatPolicyType = (type) => {
    if (!type) return '—';
    const typeMap = {
      'Term': 'Term',
      'Whole Life': 'Whole Life',
      'Universal': 'Universal',
      'Term Life': 'Term',
      'Whole': 'Whole Life'
    };
    return typeMap[type] || type;
  };

  const formatFaceAmount = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const renderCompanyName = () => {
    const companyMatch = findInsuranceCompany(funding?.companyName);
    
    if (companyMatch) {
      return (
        <span className="flex items-center gap-2">
          {funding.companyName || '—'}
          <a 
            href={companyMatch.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 inline-flex"
            title={`Visit ${funding.companyName} website`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </span>
      );
    }
    
    return funding.companyName || '—';
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'type':
        return {
          title: 'Funding Type',
          description: 'Select how you will fund your cryopreservation arrangement. Life insurance is the most common method.',
          fields: {
            'Type': 'Life Insurance, Trust, Prepaid, or Other arrangement'
          }
        };
      case 'insurance':
        return {
          title: 'Insurance Details',
          description: 'Complete information about your life insurance policy including company details, policy information, and agent contact.',
          fields: {
            'Company': 'Insurance company name and contact information',
            'Policy': 'Policy number, type, and coverage amount',
            'Agent': 'Your insurance agent\'s contact information'
          }
        };
      case 'policy':
        return {
          title: 'Policy Information',
          description: 'Specific details about your life insurance policy including coverage amounts and premium information.',
          fields: {
            'Policy Number': 'Your unique policy identification number',
            'Face Amount': 'Total death benefit amount',
            'Premium': 'Annual premium payment amount'
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
                    {section === 'type' && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                    {(section === 'insurance' || section === 'policy') && (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

          {/* Success Message */}
          {showSuccess && (
            <div className={overlayStyles.body.successMessage.container}>
              <svg className={overlayStyles.body.successMessage.icon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className={overlayStyles.body.successMessage.text}>Information updated successfully!</p>
            </div>
          )}

          {/* Content */}
          <div className={overlayStyles.body.wrapper}>
            {/* Fields */}
            {!editMode || !canEdit ? (
              /* Display Mode */
              <div className={overlayStyles.body.content}>
                {section === 'type' && (
                  <div>
                    <label className={overlayStyles.displayMode.field.label}>Funding Type</label>
                    <p 
                      className={overlayStyles.displayMode.field.value}
                      style={overlayStyles.displayMode.field.getFieldStyle(!funding?.fundingType)}
                    >
                      {formatFundingType(funding?.fundingType)}
                    </p>
                    {funding?.fundingType && funding?.fundingType !== 'Life Insurance' && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          {funding.fundingType === 'Trust' && 
                            "Please ensure Alcor Life Extension Foundation is properly named as beneficiary in your trust documents."}
                          {funding.fundingType === 'Prepaid' && 
                            "Prepaid funding arrangement on file."}
                          {funding.fundingType === 'Other' && 
                            "Alternative funding arrangement on file."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {section === 'insurance' && funding?.fundingType === 'Life Insurance' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Company Name</label>
                      <p className={overlayStyles.displayMode.field.value}>
                        {renderCompanyName()}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Company Phone</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.companyPhone)}
                        >
                          {formatPhone(funding?.companyPhone)}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Company Fax</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.companyFax)}
                        >
                          {formatPhone(funding?.companyFax)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Company Address</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(!funding?.companyStreet)}
                      >
                        {[
                          funding?.companyStreet,
                          funding?.companyCity && funding?.companyState ? 
                            `${funding.companyCity}, ${funding.companyState} ${funding.companyPostalCode}` : '',
                          funding?.companyCountry
                        ].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                    {(funding?.agentName || funding?.agentEmail || funding?.agentPhone) && (
                      <>
                        <div className="border-t pt-6">
                          <h4 className="font-medium text-gray-900 mb-4">Agent Information</h4>
                          <div className="space-y-4">
                            <div>
                              <label className={overlayStyles.displayMode.field.label}>Agent Name</label>
                              <p className={overlayStyles.displayMode.field.value}>
                                {funding?.agentName || '—'}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <label className={overlayStyles.displayMode.field.label}>Agent Email</label>
                                <p className={overlayStyles.displayMode.field.value}>
                                  {funding?.agentEmail || '—'}
                                </p>
                              </div>
                              <div>
                                <label className={overlayStyles.displayMode.field.label}>Agent Phone</label>
                                <p className={overlayStyles.displayMode.field.value}>
                                  {formatPhone(funding?.agentPhone)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {section === 'policy' && funding?.fundingType === 'Life Insurance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Policy Number</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.policyNumber)}
                        >
                          {funding?.policyNumber || '—'}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Policy Type</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.policyType)}
                        >
                          {formatPolicyType(funding?.policyType)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Face Amount</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.faceAmount)}
                        >
                          {formatFaceAmount(funding?.faceAmount)}
                        </p>
                      </div>
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Annual Premium</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.annualPremium)}
                        >
                          {formatFaceAmount(funding?.annualPremium)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className={overlayStyles.displayMode.field.label}>Date Issued</label>
                        <p 
                          className={overlayStyles.displayMode.field.value}
                          style={overlayStyles.displayMode.field.getFieldStyle(!funding?.dateIssued)}
                        >
                          {formatDate(funding?.dateIssued)}
                        </p>
                      </div>
                      {funding?.policyType === 'Term' && funding?.termLength && (
                        <div>
                          <label className={overlayStyles.displayMode.field.label}>Term Length</label>
                          <p className={overlayStyles.displayMode.field.value}>
                            {funding.termLength} years
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className={overlayStyles.body.content}>
                {section === 'type' && (
                  <div>
                    <Select
                      label="Funding Type"
                      value={funding?.fundingType || ''}
                      onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
                      disabled={savingSection === 'funding'}
                    >
                      <option value="">Select...</option>
                      <option value="Life Insurance">Life Insurance</option>
                      <option value="Trust">Trust</option>
                      <option value="Prepaid">Prepaid</option>
                      <option value="Other">Other</option>
                    </Select>
                    {funding?.fundingType && funding?.fundingType !== 'Life Insurance' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {funding.fundingType === 'Trust' && 
                            "Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary for your cryopreservation funding."}
                          {funding.fundingType === 'Prepaid' && 
                            "Thank you for choosing to prepay. An Alcor representative will contact you to complete the funding arrangement."}
                          {funding.fundingType === 'Other' && 
                            "An Alcor representative will contact you to discuss your funding arrangement."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {section === 'insurance' && funding?.fundingType === 'Life Insurance' && (
                  <div className="space-y-4">
                    <Input
                      label="Company Name"
                      value={funding?.companyName || ''}
                      onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                      disabled={savingSection === 'funding'}
                      placeholder="e.g., MetLife, Prudential"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Company Phone"
                        type="tel"
                        value={funding?.companyPhone || ''}
                        onChange={(e) => setFunding({...funding, companyPhone: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="(555) 123-4567"
                      />
                      <Input
                        label="Company Fax"
                        type="tel"
                        value={funding?.companyFax || ''}
                        onChange={(e) => setFunding({...funding, companyFax: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="(555) 123-4568"
                      />
                    </div>
                    <Input
                      label="Company Street Address"
                      value={funding?.companyStreet || ''}
                      onChange={(e) => setFunding({...funding, companyStreet: e.target.value})}
                      disabled={savingSection === 'funding'}
                      placeholder="123 Main Street"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        value={funding?.companyCity || ''}
                        onChange={(e) => setFunding({...funding, companyCity: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="New York"
                      />
                      <Input
                        label="State/Province"
                        value={funding?.companyState || ''}
                        onChange={(e) => setFunding({...funding, companyState: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="NY"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Postal Code"
                        value={funding?.companyPostalCode || ''}
                        onChange={(e) => setFunding({...funding, companyPostalCode: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="10001"
                      />
                      <Input
                        label="Country"
                        value={funding?.companyCountry || ''}
                        onChange={(e) => setFunding({...funding, companyCountry: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="USA"
                      />
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-4">Agent Information</h4>
                      <div className="mb-4">
                        <Checkbox
                          label="I have a life insurance agent"
                          checked={funding?.hasAgent || false}
                          onChange={(e) => setFunding({...funding, hasAgent: e.target.checked})}
                          disabled={savingSection === 'funding'}
                        />
                      </div>
                      {(funding?.hasAgent || funding?.agentName || funding?.agentEmail || funding?.agentPhone) && (
                        <div className="space-y-4">
                          <Input
                            label="Agent Name"
                            value={funding?.agentName || ''}
                            onChange={(e) => setFunding({...funding, agentName: e.target.value})}
                            disabled={savingSection === 'funding'}
                            placeholder="John Smith"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="Agent Email"
                              type="email"
                              value={funding?.agentEmail || ''}
                              onChange={(e) => setFunding({...funding, agentEmail: e.target.value})}
                              disabled={savingSection === 'funding'}
                              placeholder="agent@example.com"
                            />
                            <Input
                              label="Agent Phone"
                              type="tel"
                              value={funding?.agentPhone || ''}
                              onChange={(e) => setFunding({...funding, agentPhone: e.target.value})}
                              disabled={savingSection === 'funding'}
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {section === 'policy' && funding?.fundingType === 'Life Insurance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Policy Number"
                        value={funding?.policyNumber || ''}
                        onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="Enter policy number"
                      />
                      <Select
                        label="Policy Type"
                        value={funding?.policyType || ''}
                        onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                        disabled={savingSection === 'funding'}
                      >
                        <option value="">Select...</option>
                        <option value="Term">Term</option>
                        <option value="Whole Life">Whole Life</option>
                        <option value="Universal">Universal</option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Face Amount"
                        type="number"
                        value={funding?.faceAmount || ''}
                        onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="e.g., 200000"
                      />
                      <Input
                        label="Annual Premium"
                        type="number"
                        value={funding?.annualPremium || ''}
                        onChange={(e) => setFunding({...funding, annualPremium: e.target.value})}
                        disabled={savingSection === 'funding'}
                        placeholder="e.g., 2400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Date Issued"
                        type="date"
                        value={funding?.dateIssued || ''}
                        onChange={(e) => setFunding({...funding, dateIssued: e.target.value})}
                        disabled={savingSection === 'funding'}
                      />
                      {funding?.policyType === 'Term' && (
                        <Input
                          label="Term Length (years)"
                          type="number"
                          value={funding?.termLength || ''}
                          onChange={(e) => setFunding({...funding, termLength: e.target.value})}
                          disabled={savingSection === 'funding'}
                          placeholder="e.g., 20"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={overlayStyles.footer.wrapper}>
            {canEdit && editMode ? (
              <>
                <WhiteButton
                  text="Cancel"
                  onClick={handleCancel}
                  className={buttonStyles.overlayButtons.cancel}
                  spinStar={buttonStyles.starConfig.enabled}
                />
                <PurpleButton
                  text={savingSection === 'funding' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'funding'}
                />
              </>
            ) : (
              <PurpleButton
                text="Close"
                onClick={onClose}
                className={buttonStyles.overlayButtons.save}
                spinStar={buttonStyles.starConfig.enabled}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const FundingSection = ({ 
  funding = {}, 
  setFunding, 
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveFunding, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  
  // Check if section should be editable based on member category
  const canEditSection = isSectionEditable(memberCategory, 'funding');
  
  // Override edit mode if user is not allowed to edit
  const effectiveEditMode = editMode.funding && canEditSection;

  useEffect(() => {
    // Inject animation styles
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
    saveFunding();
  };

  // Get required fields based on member category
  const requiredFields = memberCategoryConfig[memberCategory]?.sections.funding?.requiredFields || [];
  const isFieldRequired = (fieldName) => requiredFields.includes(fieldName);
  
  // Format funding type display
  const formatFundingType = (type) => {
    if (!type) return '—';
    const typeMap = {
      'Life Insurance': 'Life Insurance',
      'Trust': 'Trust',
      'Prepaid': 'Prepaid',
      'Other': 'Other'
    };
    return typeMap[type] || type;
  };

  // Format policy type display
  const formatPolicyType = (type) => {
    if (!type) return '—';
    const typeMap = {
      'Term': 'Term',
      'Whole Life': 'Whole Life',
      'Universal': 'Universal',
      'Term Life': 'Term',
      'Whole': 'Whole Life'
    };
    return typeMap[type] || type;
  };

  // Format face amount display
  const formatFaceAmount = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Format phone number display
  const formatPhone = (phone) => {
    if (!phone) return '—';
    // Remove non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (xxx) xxx-xxxx
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };
  
  // Mobile preview data
  const getMobilePreview = () => {
    const previewParts = [];
    
    if (funding?.fundingType) {
      previewParts.push(formatFundingType(funding.fundingType));
    }
    if (funding?.fundingType === 'Life Insurance' && funding?.companyName) {
      previewParts.push(funding.companyName);
    }
    if (funding?.fundingType === 'Life Insurance' && funding?.faceAmount) {
      previewParts.push(formatFaceAmount(funding.faceAmount));
    }
    
    return previewParts.slice(0, 2).join(' • ');
  };

  // Render company name with link if matched
  const renderCompanyName = () => {
    const companyMatch = findInsuranceCompany(funding?.companyName);
    
    if (companyMatch) {
      return (
        <span className="flex items-center gap-2">
          {funding.companyName || '—'}
          <a 
            href={companyMatch.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 inline-flex"
            title={`Visit ${funding.companyName} website`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </span>
      );
    }
    
    return funding.companyName || '—';
  };

  return (
    <div ref={sectionRef} className={`funding-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ funding }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={{}}
        funding={funding}
        setFunding={setFunding}
        saveFunding={saveFunding}
        canEdit={canEditSection}
      />

      {isMobile ? (
        <MobileInfoCard
          iconComponent={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Funding/Life Insurance"
          backgroundImage={formsHeaderImage}
          overlayText="Funding Details"
          subtitle="Your cryopreservation funding arrangements."
          isEditMode={effectiveEditMode}
        >
          {/* Display Mode */}
          {!effectiveEditMode ? (
            <>
              <div className="space-y-4">
                <DisplayField 
                  label="Funding Type" 
                  value={formatFundingType(funding.fundingType)}
                  required={isFieldRequired('fundingType')}
                />
                
                {/* Only show Life Insurance fields if that's the funding type */}
                {funding.fundingType === 'Life Insurance' && (
                  <>
                    {/* Company Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Insurance Company</h4>
                      <DisplayField 
                        label="Company Name" 
                        value={renderCompanyName()}
                        required={isFieldRequired('companyName')}
                      />
                      <DisplayField 
                        label="Company Phone" 
                        value={formatPhone(funding.companyPhone)}
                        required={isFieldRequired('companyPhone')}
                      />
                      <DisplayField 
                        label="Company Fax" 
                        value={formatPhone(funding.companyFax)}
                      />
                      <DisplayField 
                        label="Company Address" 
                        value={[
                          funding.companyStreet,
                          funding.companyCity && funding.companyState ? 
                            `${funding.companyCity}, ${funding.companyState} ${funding.companyPostalCode}` : '',
                          funding.companyCountry
                        ].filter(Boolean).join('\n')}
                      />
                    </div>

                    {/* Policy Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <DisplayField 
                        label="Policy Number" 
                        value={funding.policyNumber}
                        required={isFieldRequired('policyNumber')}
                      />
                      <DisplayField 
                        label="Policy Type" 
                        value={formatPolicyType(funding.policyType)}
                        required={isFieldRequired('policyType')}
                      />
                      <DisplayField 
                        label="Face Amount" 
                        value={formatFaceAmount(funding.faceAmount)}
                        required={isFieldRequired('faceAmount')}
                      />
                      <DisplayField 
                        label="Annual Premium" 
                        value={formatFaceAmount(funding.annualPremium)}
                      />
                      <DisplayField 
                        label="Date Issued" 
                        value={formatDate(funding.dateIssued)}
                      />
                      {funding.termLength && (
                        <DisplayField 
                          label="Term Length" 
                          value={`${funding.termLength} years`}
                        />
                      )}
                    </div>

                    {/* Agent Information Section - Show if agent data exists */}
                    {(funding.agentName || funding.agentEmail || funding.agentPhone) && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Information</h4>
                        <DisplayField 
                          label="Agent Name" 
                          value={funding.agentName}
                        />
                        <DisplayField 
                          label="Agent Email" 
                          value={funding.agentEmail}
                        />
                        <DisplayField 
                          label="Agent Phone" 
                          value={formatPhone(funding.agentPhone)}
                        />
                      </div>
                    )}
                  </>
                )}
                
                {/* Show simple info for other funding types */}
                {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                  <div className="pt-4 text-sm text-gray-600">
                    {funding.fundingType === 'Trust' && (
                      <p>Funding via trust. Please ensure Alcor Life Extension Foundation is named as beneficiary.</p>
                    )}
                    {funding.fundingType === 'Prepaid' && (
                      <p>Prepaid funding arrangement.</p>
                    )}
                    {funding.fundingType === 'Other' && (
                      <p>Alternative funding arrangement.</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Show edit button only if editable, otherwise show message */}
              {canEditSection ? (
                <ActionButtons 
                  editMode={false}
                  onEdit={() => toggleEditMode && toggleEditMode('funding')}
                  hideEditButton={!canEditSection}
                />
              ) : (
                <div className={styleConfig2.nonEditable.mobileWrapper}>
                  <p className={styleConfig2.nonEditable.mobileText}>
                    Funding information cannot be edited. Contact membership@alcor.org for changes.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Edit Mode */
            <>
              <div className="space-y-4">
                <FormSelect
                  label="Funding Type"
                  value={funding.fundingType || ''}
                  onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
                  required={isFieldRequired('fundingType')}
                >
                  <option value="">Select...</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Trust">Trust</option>
                  <option value="Prepaid">Prepaid</option>
                  <option value="Other">Other</option>
                </FormSelect>

                {funding.fundingType === 'Life Insurance' && (
                  <>
                    {/* Company Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Insurance Company</h4>
                      <FormInput
                        label="Company Name"
                        value={funding.companyName || ''}
                        onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                        required={isFieldRequired('companyName')}
                        placeholder="e.g., MetLife, Prudential"
                      />
                      <FormInput
                        label="Company Phone"
                        type="tel"
                        value={funding.companyPhone || ''}
                        onChange={(e) => setFunding({...funding, companyPhone: e.target.value})}
                        required={isFieldRequired('companyPhone')}
                        placeholder="(555) 123-4567"
                      />
                      <FormInput
                        label="Company Fax"
                        type="tel"
                        value={funding.companyFax || ''}
                        onChange={(e) => setFunding({...funding, companyFax: e.target.value})}
                        placeholder="(555) 123-4568"
                      />
                      <FormInput
                        label="Company Street Address"
                        value={funding.companyStreet || ''}
                        onChange={(e) => setFunding({...funding, companyStreet: e.target.value})}
                        required={isFieldRequired('companyStreet')}
                        placeholder="123 Main Street"
                      />
                      <FormInput
                        label="City"
                        value={funding.companyCity || ''}
                        onChange={(e) => setFunding({...funding, companyCity: e.target.value})}
                        required={isFieldRequired('companyCity')}
                        placeholder="New York"
                      />
                      <FormInput
                        label="State/Province"
                        value={funding.companyState || ''}
                        onChange={(e) => setFunding({...funding, companyState: e.target.value})}
                        required={isFieldRequired('companyState')}
                        placeholder="NY"
                      />
                      <FormInput
                        label="Postal Code"
                        value={funding.companyPostalCode || ''}
                        onChange={(e) => setFunding({...funding, companyPostalCode: e.target.value})}
                        required={isFieldRequired('companyPostalCode')}
                        placeholder="10001"
                      />
                      <FormInput
                        label="Country"
                        value={funding.companyCountry || ''}
                        onChange={(e) => setFunding({...funding, companyCountry: e.target.value})}
                        required={isFieldRequired('companyCountry')}
                        placeholder="USA"
                      />
                    </div>

                    {/* Policy Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <FormInput
                        label="Policy Number"
                        value={funding.policyNumber || ''}
                        onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                        required={isFieldRequired('policyNumber')}
                        placeholder="Enter policy number"
                      />
                      <FormSelect
                        label="Policy Type"
                        value={funding.policyType || ''}
                        onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                        required={isFieldRequired('policyType')}
                      >
                        <option value="">Select...</option>
                        <option value="Term">Term</option>
                        <option value="Whole Life">Whole Life</option>
                        <option value="Universal">Universal</option>
                      </FormSelect>
                      <FormInput
                        label="Face Amount"
                        type="number"
                        value={funding.faceAmount || ''}
                        onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                        required={isFieldRequired('faceAmount')}
                        placeholder="e.g., 200000"
                      />
                      <FormInput
                        label="Annual Premium"
                        type="number"
                        value={funding.annualPremium || ''}
                        onChange={(e) => setFunding({...funding, annualPremium: e.target.value})}
                        placeholder="e.g., 2400"
                      />
                      <FormInput
                        label="Date Issued"
                        type="date"
                        value={funding.dateIssued || ''}
                        onChange={(e) => setFunding({...funding, dateIssued: e.target.value})}
                      />
                      {funding.policyType === 'Term' && (
                        <FormInput
                          label="Term Length (years)"
                          type="number"
                          value={funding.termLength || ''}
                          onChange={(e) => setFunding({...funding, termLength: e.target.value})}
                          placeholder="e.g., 20"
                        />
                      )}
                    </div>

                    {/* Agent Information Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Agent Information</h4>
                      <div className="mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={funding.hasAgent || false}
                            onChange={(e) => setFunding({...funding, hasAgent: e.target.checked})}
                            className="mr-2"
                          />
                          <span className="text-sm">I have a life insurance agent</span>
                        </label>
                      </div>
                      {/* Show agent fields if checkbox is checked OR if agent data exists */}
                      {(funding.hasAgent || funding.agentName || funding.agentEmail || funding.agentPhone) && (
                        <>
                          <FormInput
                            label="Agent Name"
                            value={funding.agentName || ''}
                            onChange={(e) => setFunding({...funding, agentName: e.target.value})}
                            placeholder="John Smith"
                          />
                          <FormInput
                            label="Agent Email"
                            type="email"
                            value={funding.agentEmail || ''}
                            onChange={(e) => setFunding({...funding, agentEmail: e.target.value})}
                            placeholder="agent@example.com"
                          />
                          <FormInput
                            label="Agent Phone"
                            type="tel"
                            value={funding.agentPhone || ''}
                            onChange={(e) => setFunding({...funding, agentPhone: e.target.value})}
                            placeholder="(555) 123-4567"
                          />
                        </>
                      )}
                    </div>
                  </>
                )}
                
                {/* Show helper text for other funding types */}
                {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {funding.fundingType === 'Trust' && 
                        "Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary for your cryopreservation funding."}
                      {funding.fundingType === 'Prepaid' && 
                        "Thank you for choosing to prepay. An Alcor representative will contact you to complete the funding arrangement."}
                      {funding.fundingType === 'Other' && 
                        "An Alcor representative will contact you to discuss your funding arrangement."}
                    </p>
                  </div>
                )}
              </div>
              
              <ActionButtons 
                editMode={true}
                onSave={saveFunding}
                onCancel={() => cancelEdit && cancelEdit('funding')}
                saving={savingSection === 'funding'}
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
                    <div className={headerStyles.getIconContainer(styleConfig2, 'funding')}>
                      <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className={headerStyles.textContainer(styleConfig2)}>
                      <h2 className={headerStyles.title(styleConfig2)}>Funding/Life Insurance</h2>
                      <p className={headerStyles.subtitle}>
                        Your cryopreservation funding arrangements.
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
              {!effectiveEditMode ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Funding Type Card */}
                  <InfoCard
                    title="Funding Type"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    sectionKey="type"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('type')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('type')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField label="Type" value={formatFundingType(funding?.fundingType)} />
                    {funding?.fundingType && funding?.fundingType !== 'Life Insurance' && (
                      <InfoField label="Status" value="Arrangement on file" />
                    )}
                  </InfoCard>

                  {/* Insurance Details Card - Only show if Life Insurance */}
                  {funding?.fundingType === 'Life Insurance' && (
                    <>
                      <InfoCard
                        title="Insurance Details"
                        icon={
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                        sectionKey="insurance"
                        hoveredSection={hoveredSection}
                        onMouseEnter={() => setHoveredSection('insurance')}
                        onMouseLeave={() => setHoveredSection(null)}
                        onClick={() => handleCardClick('insurance')}
                        cardIndex={1}
                        isVisible={cardsVisible}
                      >
                        <InfoField label="Company" value={funding?.companyName || '—'} />
                        <InfoField label="Phone" value={formatPhone(funding?.companyPhone)} />
                        {(funding?.agentName || funding?.agentEmail || funding?.agentPhone) && (
                          <InfoField label="Agent" value={funding?.agentName || 'Has agent info'} />
                        )}
                      </InfoCard>

                      <InfoCard
                        title="Policy Information"
                        icon={
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                        }
                        sectionKey="policy"
                        hoveredSection={hoveredSection}
                        onMouseEnter={() => setHoveredSection('policy')}
                        onMouseLeave={() => setHoveredSection(null)}
                        onClick={() => handleCardClick('policy')}
                        cardIndex={2}
                        isVisible={cardsVisible}
                      >
                        <InfoField label="Policy #" value={funding?.policyNumber || '—'} />
                        <InfoField label="Type" value={formatPolicyType(funding?.policyType)} />
                        <InfoField label="Face Amount" value={formatFaceAmount(funding?.faceAmount)} />
                      </InfoCard>
                    </>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-2xl">
                  <div className={styleConfig2.form.fieldSpacing}>
                    <Select
                      label="Funding Type"
                      value={funding.fundingType || ''}
                      onChange={(e) => setFunding({...funding, fundingType: e.target.value})}
                      disabled={!effectiveEditMode}
                      required={isFieldRequired('fundingType')}
                    >
                      <option value="">Select...</option>
                      <option value="Life Insurance">Life Insurance</option>
                      <option value="Trust">Trust</option>
                      <option value="Prepaid">Prepaid</option>
                      <option value="Other">Other</option>
                    </Select>

                    {funding.fundingType === 'Life Insurance' && (
                      <>
                        {/* Company Information */}
                        <div className="mt-6">
                          <h3 className="text-[#2a2346] mb-4 font-medium">Insurance Company</h3>
                          <div className={styleConfig2.section.grid.twoColumn}>
                            <Input
                              label="Company Name"
                              type="text"
                              value={funding.companyName || ''}
                              onChange={(e) => setFunding({...funding, companyName: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyName')}
                              placeholder="e.g., MetLife, Prudential"
                            />
                            <Input
                              label="Company Phone"
                              type="tel"
                              value={funding.companyPhone || ''}
                              onChange={(e) => setFunding({...funding, companyPhone: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyPhone')}
                              placeholder="(555) 123-4567"
                            />
                            <Input
                              label="Company Fax"
                              type="tel"
                              value={funding.companyFax || ''}
                              onChange={(e) => setFunding({...funding, companyFax: e.target.value})}
                              disabled={!effectiveEditMode}
                              placeholder="(555) 123-4568"
                            />
                            <Input
                              label="Company Street Address"
                              type="text"
                              value={funding.companyStreet || ''}
                              onChange={(e) => setFunding({...funding, companyStreet: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyStreet')}
                              placeholder="123 Main Street"
                            />
                            <Input
                              label="City"
                              type="text"
                              value={funding.companyCity || ''}
                              onChange={(e) => setFunding({...funding, companyCity: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyCity')}
                              placeholder="New York"
                            />
                            <Input
                              label="State/Province"
                              type="text"
                              value={funding.companyState || ''}
                              onChange={(e) => setFunding({...funding, companyState: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyState')}
                              placeholder="NY"
                            />
                            <Input
                              label="Postal Code"
                              type="text"
                              value={funding.companyPostalCode || ''}
                              onChange={(e) => setFunding({...funding, companyPostalCode: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyPostalCode')}
                              placeholder="10001"
                            />
                            <Input
                              label="Country"
                              type="text"
                              value={funding.companyCountry || ''}
                              onChange={(e) => setFunding({...funding, companyCountry: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('companyCountry')}
                              placeholder="USA"
                            />
                          </div>
                        </div>

                        {/* Policy Information */}
                        <div className="mt-6">
                          <div className={styleConfig2.section.grid.twoColumn}>
                            <Input
                              label="Policy Number"
                              type="text"
                              value={funding.policyNumber || ''}
                              onChange={(e) => setFunding({...funding, policyNumber: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('policyNumber')}
                              placeholder="Enter policy number"
                            />
                            <Select
                              label="Policy Type"
                              value={funding.policyType || ''}
                              onChange={(e) => setFunding({...funding, policyType: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('policyType')}
                            >
                              <option value="">Select...</option>
                              <option value="Term">Term</option>
                              <option value="Whole Life">Whole Life</option>
                              <option value="Universal">Universal</option>
                            </Select>
                            <Input
                              label="Face Amount"
                              type="number"
                              value={funding.faceAmount || ''}
                              onChange={(e) => setFunding({...funding, faceAmount: e.target.value})}
                              disabled={!effectiveEditMode}
                              required={isFieldRequired('faceAmount')}
                              placeholder="e.g., 200000"
                            />
                            <Input
                              label="Annual Premium"
                              type="number"
                              value={funding.annualPremium || ''}
                              onChange={(e) => setFunding({...funding, annualPremium: e.target.value})}
                              disabled={!effectiveEditMode}
                              placeholder="e.g., 2400"
                            />
                            <Input
                              label="Date Issued"
                              type="date"
                              value={funding.dateIssued || ''}
                              onChange={(e) => setFunding({...funding, dateIssued: e.target.value})}
                              disabled={!effectiveEditMode}
                            />
                            {funding.policyType === 'Term' && (
                              <Input
                                label="Term Length (years)"
                                type="number"
                                value={funding.termLength || ''}
                                onChange={(e) => setFunding({...funding, termLength: e.target.value})}
                                disabled={!effectiveEditMode}
                                placeholder="e.g., 20"
                              />
                            )}
                          </div>
                        </div>

                        {/* Agent Information */}
                        <div className="mt-6">
                          <h3 className="text-[#2a2346] mb-4 font-medium">Agent Information</h3>
                          <div className="mb-4">
                            <Checkbox
                              label="I have a life insurance agent"
                              checked={funding.hasAgent || false}
                              onChange={(e) => setFunding({...funding, hasAgent: e.target.checked})}
                              disabled={!effectiveEditMode}
                            />
                          </div>
                          {/* Show agent fields if checkbox is checked OR if agent data exists */}
                          {(funding.hasAgent || funding.agentName || funding.agentEmail || funding.agentPhone) && (
                            <div className={styleConfig2.section.grid.twoColumn}>
                              <Input
                                label="Agent Name"
                                type="text"
                                value={funding.agentName || ''}
                                onChange={(e) => setFunding({...funding, agentName: e.target.value})}
                                disabled={!effectiveEditMode}
                                placeholder="John Smith"
                              />
                              <Input
                                label="Agent Email"
                                type="email"
                                value={funding.agentEmail || ''}
                                onChange={(e) => setFunding({...funding, agentEmail: e.target.value})}
                                disabled={!effectiveEditMode}
                                placeholder="agent@example.com"
                              />
                              <Input
                                label="Agent Phone"
                                type="tel"
                                value={funding.agentPhone || ''}
                                onChange={(e) => setFunding({...funding, agentPhone: e.target.value})}
                                disabled={!effectiveEditMode}
                                placeholder="(555) 123-4567"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Show helper text for other funding types */}
                    {funding.fundingType && funding.fundingType !== 'Life Insurance' && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {funding.fundingType === 'Trust' && 
                            "Please ensure your trust documents properly name Alcor Life Extension Foundation as the beneficiary for your cryopreservation funding."}
                          {funding.fundingType === 'Prepaid' && 
                            "Thank you for choosing to prepay. An Alcor representative will contact you to complete the funding arrangement."}
                          {funding.fundingType === 'Other' && 
                            "An Alcor representative will contact you to discuss your funding arrangement."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              {effectiveEditMode ? (
                <div className={buttonStyles.actionContainer}>
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('funding')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={buttonStyles.getSaveButtonText(savingSection)}
                      onClick={saveFunding}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'funding'}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {canEditSection ? (
                    <div className={buttonStyles.actionContainer}>
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('funding')}
                        className={buttonStyles.whiteButton.base}
                        spinStar={buttonStyles.starConfig.enabled}
                      />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic mt-8 pt-6 text-right">
                      Contact Alcor to update funding information
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

export default FundingSection;