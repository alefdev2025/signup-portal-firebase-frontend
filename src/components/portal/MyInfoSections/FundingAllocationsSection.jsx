import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import FundingAllocationsMobile from './FundingAllocationsMobile';
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
import { CompletionWheelWithLegend } from './CompletionWheel';
import { isSectionEditable } from '../memberCategoryConfig';

// DEBUG CONFIGURATION - Change these values to test different user states
const OVERRIDE_MEMBER_CATEGORY = true;  // Set to true to use debug category, false to use actual
const DEBUG_CATEGORY = 'CryoApplicant'; // Options: 'CryoApplicant', 'CryoMember', 'AssociateMember'

// Helper function to get effective member category
const getEffectiveMemberCategory = (actualCategory) => {
  if (OVERRIDE_MEMBER_CATEGORY) {
    console.log(`🔧 DEBUG: Override active - Using ${DEBUG_CATEGORY} instead of ${actualCategory}`);
    return DEBUG_CATEGORY;
  }
  return actualCategory;
};

// Card Overlay Component
const CardOverlay = ({ isOpen, onClose, section, data, onEdit, onSave, savingSection, fieldErrors, fundingAllocations, setFundingAllocations, saveFundingAllocations, canEdit, memberCategory }) => {
  const [editMode, setEditMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditMode(canEdit);
      setShowSuccess(false);
    }
  }, [isOpen, canEdit]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (canEdit) {
      const success = await saveFundingAllocations();
      if (success) {
        setEditMode(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      }
    }
  };

  const handleCancel = () => {
    setFundingAllocations(data.fundingAllocations);
    setEditMode(false);
    onClose();
  };

  const calculateTotal = (allocations, prefix = '') => {
    const fields = prefix ? [
      `patientCareTrust${prefix}`,
      `generalOperatingFund${prefix}`,
      `alcorResearchFund${prefix}`,
      `endowmentFund${prefix}`,
      `individuals${prefix}`,
      `others${prefix}`
    ] : [
      'patientCareTrust',
      'generalOperatingFund',
      'alcorResearchFund',
      'endowmentFund',
      'individuals',
      'others'
    ];
    
    const total = fields.reduce((sum, field) => sum + (parseFloat(allocations[field]) || 0), 0);
    
    // Round to 2 decimal places to avoid floating point issues
    return Math.round(total * 100) / 100;
  };

  const getFieldDescriptions = () => {
    switch (section) {
      case 'primary':
        return {
          title: 'Primary Fund Allocation',
          description: 'How your funds should be allocated if cryopreservation is not possible. These allocations ensure your contribution supports Alcor\'s mission even if preservation cannot be performed.',
          fields: {
            'Patient Care Trust': 'Supports long-term care of cryopreserved patients',
            'General Operating Fund': 'Supports Alcor\'s daily operations and services',
            'Research Fund': 'Advances cryonics research and technology',
            'Endowment Fund': 'Provides long-term financial stability'
          }
        };
      case 'overMinimum':
        return {
          title: 'Over-Minimum Fund Allocation',
          description: 'How funds exceeding the minimum cryopreservation requirements should be allocated. This ensures any surplus funds are distributed according to your wishes.',
          fields: {
            'Patient Care Trust': 'Additional support for patient care',
            'General Operating Fund': 'Additional operational support',
            'Research Fund': 'Additional research funding',
            'Endowment Fund': 'Additional endowment contributions'
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <p className={overlayStyles.body.successMessage.text}>Funding allocations updated successfully!</p>
            </div>
          )}

          {/* Content */}
          <div className={overlayStyles.body.wrapper}>
            {!editMode || !canEdit ? (
              /* Display Mode */
              <div className={overlayStyles.body.content}>
                {section === 'primary' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Customize Primary Allocations</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(false)}
                      >
                        {fundingAllocations?.customPrimary ? 'Yes - Custom allocations set' : 'No - Using default allocations (50% PCT / 50% GOF)'}
                      </p>
                    </div>
                    
                    {fundingAllocations?.customPrimary && (
                      <>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Patient Care Trust</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.patientCareTrust || 0}%
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>General Operating Fund</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.generalOperatingFund || 0}%
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Alcor Research Fund</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.alcorResearchFund || 0}%
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Endowment Fund</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.endowmentFund || 0}%
                            </p>
                          </div>
                          {(fundingAllocations?.individuals > 0 || fundingAllocations?.others > 0) && (
                            <>
                              <div>
                                <label className={overlayStyles.displayMode.field.label}>Individuals</label>
                                <p className={overlayStyles.displayMode.field.value}>
                                  {fundingAllocations?.individuals || 0}%
                                </p>
                              </div>
                              <div>
                                <label className={overlayStyles.displayMode.field.label}>Others</label>
                                <p className={overlayStyles.displayMode.field.value}>
                                  {fundingAllocations?.others || 0}%
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        {fundingAllocations?.individuals > 0 && (
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Individual Recipients</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.followingPersons || '—'}
                            </p>
                          </div>
                        )}
                        {fundingAllocations?.others > 0 && (
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Other Recipients</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.other || '—'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {!canEdit && (
                      <div className={overlayStyles.displayMode.field.note}>
                        <p className="text-sm text-gray-500 italic">
                          Contact Alcor staff to make changes to these selections
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {section === 'overMinimum' && (
                  <div className="space-y-6">
                    <div>
                      <label className={overlayStyles.displayMode.field.label}>Customize Over-Minimum Allocations</label>
                      <p 
                        className={overlayStyles.displayMode.field.value}
                        style={overlayStyles.displayMode.field.getFieldStyle(false)}
                      >
                        {fundingAllocations?.customOverMinimum ? 'Yes - Custom allocations set' : 'No - Using default allocations (50% PCT / 50% GOF)'}
                      </p>
                    </div>
                    
                    {fundingAllocations?.customOverMinimum && (
                      <>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Patient Care Trust</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.patientCareTrustOM || 0}%
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>General Operating Fund</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.generalOperatingFundOM || 0}%
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Alcor Research Fund</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.alcorResearchFundOM || 0}%
                            </p>
                          </div>
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Endowment Fund</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.endowmentFundOM || 0}%
                            </p>
                          </div>
                          {(fundingAllocations?.individualsOM > 0 || fundingAllocations?.othersOM > 0) && (
                            <>
                              <div>
                                <label className={overlayStyles.displayMode.field.label}>Individuals</label>
                                <p className={overlayStyles.displayMode.field.value}>
                                  {fundingAllocations?.individualsOM || 0}%
                                </p>
                              </div>
                              <div>
                                <label className={overlayStyles.displayMode.field.label}>Others</label>
                                <p className={overlayStyles.displayMode.field.value}>
                                  {fundingAllocations?.othersOM || 0}%
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        {fundingAllocations?.individualsOM > 0 && (
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Individual Recipients</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.followingPersonsOM || '—'}
                            </p>
                          </div>
                        )}
                        {fundingAllocations?.othersOM > 0 && (
                          <div>
                            <label className={overlayStyles.displayMode.field.label}>Other Recipients</label>
                            <p className={overlayStyles.displayMode.field.value}>
                              {fundingAllocations?.otherOM || '—'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode */
              <div className={overlayStyles.body.content}>
                {section === 'primary' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Do you want to customize primary fund allocations?
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        If cryopreservation is not possible, your funds will be allocated to support Alcor's mission. 
                        By default, funds are split 50/50 between Patient Care Trust and General Operating Fund.
                      </p>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={fundingAllocations?.customPrimary || false}
                          onChange={(e) => setFundingAllocations({...fundingAllocations, customPrimary: e.target.checked})}
                          disabled={savingSection === 'fundingAllocations'}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Yes - I want to customize how my funds are allocated
                        </span>
                      </label>
                    </div>

                    {fundingAllocations?.customPrimary && (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> All percentages must add up to exactly 100%. 
                            Current total: {calculateTotal(fundingAllocations)}%
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Patient Care Trust (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.patientCareTrust || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, patientCareTrust: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="General Operating Fund (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.generalOperatingFund || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, generalOperatingFund: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Alcor Research Fund (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.alcorResearchFund || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, alcorResearchFund: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Endowment Fund (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.endowmentFund || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, endowmentFund: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Individuals (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.individuals || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, individuals: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Others (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.others || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, others: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                        </div>

                        {fundingAllocations?.individuals > 0 && (
                          <Input
                            label="Individual Recipients (Name, Relationship, Percentage) *"
                            type="text"
                            placeholder="e.g., John Smith, Father, 50%"
                            value={fundingAllocations?.followingPersons || ''}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, followingPersons: e.target.value})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                        )}

                        {fundingAllocations?.others > 0 && (
                          <Input
                            label="Other Recipients (Organization, Percentage) *"
                            type="text"
                            placeholder="e.g., ASPCA, 20%"
                            value={fundingAllocations?.other || ''}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, other: e.target.value})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

                {section === 'overMinimum' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Do you want to customize over-minimum fund allocations?
                      </label>
                      <p className="text-sm text-gray-600 mb-3">
                        For funds exceeding the minimum cryopreservation requirements, you can specify how the surplus should be allocated. 
                        By default, surplus funds are split 50/50 between Patient Care Trust and General Operating Fund.
                      </p>
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={fundingAllocations?.customOverMinimum || false}
                          onChange={(e) => setFundingAllocations({...fundingAllocations, customOverMinimum: e.target.checked})}
                          disabled={savingSection === 'fundingAllocations'}
                          className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          Yes - I want to customize how surplus funds are allocated
                        </span>
                      </label>
                    </div>

                    {fundingAllocations?.customOverMinimum && (
                      <>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> All percentages must add up to exactly 100%. 
                            Current total: {calculateTotal(fundingAllocations, 'OM')}%
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Patient Care Trust (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.patientCareTrustOM || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, patientCareTrustOM: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="General Operating Fund (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.generalOperatingFundOM || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, generalOperatingFundOM: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Alcor Research Fund (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.alcorResearchFundOM || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, alcorResearchFundOM: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Endowment Fund (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.endowmentFundOM || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, endowmentFundOM: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Individuals (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.individualsOM || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, individualsOM: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                          <Input
                            label="Others (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={fundingAllocations?.othersOM || 0}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, othersOM: parseFloat(e.target.value) || 0})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                        </div>

                        {fundingAllocations?.individualsOM > 0 && (
                          <Input
                            label="Individual Recipients (Name, Relationship, Percentage) *"
                            type="text"
                            placeholder="e.g., John Smith, Father, 50%"
                            value={fundingAllocations?.followingPersonsOM || ''}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, followingPersonsOM: e.target.value})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                        )}

                        {fundingAllocations?.othersOM > 0 && (
                          <Input
                            label="Other Recipients (Organization, Percentage) *"
                            type="text"
                            placeholder="e.g., ASPCA, 20%"
                            value={fundingAllocations?.otherOM || ''}
                            onChange={(e) => setFundingAllocations({...fundingAllocations, otherOM: e.target.value})}
                            disabled={savingSection === 'fundingAllocations'}
                          />
                        )}
                      </>
                    )}
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
                  text={savingSection === 'fundingAllocations' ? 'Saving...' : 'Save'}
                  onClick={handleSave}
                  className={buttonStyles.overlayButtons.save}
                  spinStar={buttonStyles.starConfig.enabled}
                  disabled={savingSection === 'fundingAllocations'}
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

const FundingAllocationsSection = ({ 
  fundingAllocations = {}, 
  setFundingAllocations, 
  editMode = {}, 
  toggleEditMode, 
  cancelEdit, 
  saveFundingAllocations, 
  savingSection,
  memberCategory,
  sectionImage,
  sectionLabel,
  fieldErrors = {}
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlaySection, setOverlaySection] = useState(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  
  // Get effective member category for debugging
  const effectiveMemberCategory = getEffectiveMemberCategory(memberCategory);
  
  // Check if section should be editable based on member category
  const canEdit = isSectionEditable(effectiveMemberCategory, 'fundingAllocations');

  // Field configuration for completion wheel - Updated to match CryoArrangements pattern
  const fieldConfig = {
    required: {
      customPrimary: { 
        field: 'customPrimary', 
        source: 'fundingAllocations', 
        label: 'Primary Allocation Decision',
        checkValue: ({ fundingAllocations }) => fundingAllocations?.customPrimary !== undefined
      },
      customOverMinimum: { 
        field: 'customOverMinimum', 
        source: 'fundingAllocations', 
        label: 'Over-Minimum Allocation Decision',
        checkValue: ({ fundingAllocations }) => fundingAllocations?.customOverMinimum !== undefined
      }
    },
    recommended: {}
  };

  // Add conditional required fields based on customization choices
  if (fundingAllocations?.customPrimary) {
    fieldConfig.required.primaryAllocations = {
      field: 'primaryAllocations',
      source: 'fundingAllocations',
      label: 'Primary Allocations Total 100%',
      checkValue: ({ fundingAllocations }) => {
        const total = (parseFloat(fundingAllocations?.patientCareTrust) || 0) +
                     (parseFloat(fundingAllocations?.generalOperatingFund) || 0) +
                     (parseFloat(fundingAllocations?.alcorResearchFund) || 0) +
                     (parseFloat(fundingAllocations?.endowmentFund) || 0) +
                     (parseFloat(fundingAllocations?.individuals) || 0) +
                     (parseFloat(fundingAllocations?.others) || 0);
        return total === 100;
      }
    };
    
    if (fundingAllocations?.individuals > 0) {
      fieldConfig.required.followingPersons = { field: 'followingPersons', source: 'fundingAllocations', label: 'Individual Recipients' };
    }
    if (fundingAllocations?.others > 0) {
      fieldConfig.required.other = { field: 'other', source: 'fundingAllocations', label: 'Other Recipients' };
    }
  }

  if (fundingAllocations?.customOverMinimum) {
    fieldConfig.required.overMinimumAllocations = {
      field: 'overMinimumAllocations',
      source: 'fundingAllocations',
      label: 'Over-Minimum Allocations Total 100%',
      checkValue: ({ fundingAllocations }) => {
        const total = (parseFloat(fundingAllocations?.patientCareTrustOM) || 0) +
                     (parseFloat(fundingAllocations?.generalOperatingFundOM) || 0) +
                     (parseFloat(fundingAllocations?.alcorResearchFundOM) || 0) +
                     (parseFloat(fundingAllocations?.endowmentFundOM) || 0) +
                     (parseFloat(fundingAllocations?.individualsOM) || 0) +
                     (parseFloat(fundingAllocations?.othersOM) || 0);
        return total === 100;
      }
    };
    
    if (fundingAllocations?.individualsOM > 0) {
      fieldConfig.required.followingPersonsOM = { field: 'followingPersonsOM', source: 'fundingAllocations', label: 'Individual Recipients (Over-Minimum)' };
    }
    if (fundingAllocations?.othersOM > 0) {
      fieldConfig.required.otherOM = { field: 'otherOM', source: 'fundingAllocations', label: 'Other Recipients (Over-Minimum)' };
    }
  }

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
          setTimeout(() => {
            setHasLoaded(true);
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
    saveFundingAllocations();
  };

  // Calculate totals for display
  const calculateTotal = (prefix = '') => {
    const fields = prefix ? [
      `patientCareTrust${prefix}`,
      `generalOperatingFund${prefix}`,
      `alcorResearchFund${prefix}`,
      `endowmentFund${prefix}`,
      `individuals${prefix}`,
      `others${prefix}`
    ] : [
      'patientCareTrust',
      'generalOperatingFund',
      'alcorResearchFund',
      'endowmentFund',
      'individuals',
      'others'
    ];
    
    const total = fields.reduce((sum, field) => sum + (parseFloat(fundingAllocations[field]) || 0), 0);
    
    // Round to 2 decimal places to avoid floating point issues
    return Math.round(total * 100) / 100;
  };

  return (
    <div ref={sectionRef} className={`funding-allocations-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
      {/* Overlay */}
      <CardOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        section={overlaySection}
        data={{ fundingAllocations }}
        onEdit={() => {}}
        onSave={handleOverlaySave}
        savingSection={savingSection}
        fieldErrors={fieldErrors}
        fundingAllocations={fundingAllocations}
        setFundingAllocations={setFundingAllocations}
        saveFundingAllocations={saveFundingAllocations}
        canEdit={canEdit}
        memberCategory={effectiveMemberCategory}
      />

      {isMobile ? (
        <FundingAllocationsMobile
          fundingAllocations={fundingAllocations}
          setFundingAllocations={setFundingAllocations}
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          cancelEdit={cancelEdit}
          saveFundingAllocations={saveFundingAllocations}
          savingSection={savingSection}
          fieldErrors={fieldErrors}
          canEdit={canEdit}
          memberCategory={effectiveMemberCategory}
          fieldConfig={fieldConfig}
        />
      ) : (
        /* Desktop Version */
        <div className={styleConfig2.section.wrapperEnhanced}>
          <div className={styleConfig2.section.innerPadding}>
            {/* Header Section */}
            <div className={headerStyles.container}>
              <div className="w-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div>
                      <div className="flex items-center space-x-4 mb-3">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'funding')} style={{ backgroundColor: '#162740' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Funding Allocations</h2>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className={headerStyles.getIconContainer(styleConfig2, 'funding')} style={{ visibility: 'hidden' }}>
                          <svg className={headerStyles.getIcon(styleConfig2).className}>
                            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm leading-5 max-w-lg">
                            How your funds should be distributed if cryopreservation is not possible.
                          </p>
                          <p className="text-gray-400 text-sm leading-5 mt-2">
                            Specify allocations for primary funds and over-minimum amounts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <CompletionWheelWithLegend
                    data={{ fundingAllocations }}
                    fieldConfig={fieldConfig}
                    sectionColor="#162740"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white">
              {!editMode.fundingAllocations ? (
                /* Display Mode with Cards */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Primary Allocation Card */}
                  <InfoCard
                    title="Primary Fund Allocation"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    }
                    sectionKey="primary"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('primary')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('primary')}
                    cardIndex={0}
                    isVisible={cardsVisible}
                  >
                    <InfoField 
                      label="Customized" 
                      value={fundingAllocations?.customPrimary ? 'Yes' : 'No (Default)'} 
                      isRequired 
                    />
                    {fundingAllocations?.customPrimary ? (
                      <>
                        <InfoField 
                          label="PCT / GOF" 
                          value={`${fundingAllocations?.patientCareTrust || 0}% / ${fundingAllocations?.generalOperatingFund || 0}%`} 
                        />
                        <InfoField 
                          label="Total" 
                          value={`${calculateTotal()}%`} 
                          isRequired={fundingAllocations?.customPrimary}
                        />
                      </>
                    ) : (
                      <>
                        <InfoField label="PCT / GOF" value="50% / 50%" />
                        <InfoField label="Total" value="100%" />
                      </>
                    )}
                  </InfoCard>

                  {/* Over-Minimum Allocation Card */}
                  <InfoCard
                    title="Over-Minimum Fund Allocation"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                    sectionKey="overMinimum"
                    hoveredSection={hoveredSection}
                    onMouseEnter={() => setHoveredSection('overMinimum')}
                    onMouseLeave={() => setHoveredSection(null)}
                    onClick={() => handleCardClick('overMinimum')}
                    cardIndex={1}
                    isVisible={cardsVisible}
                  >
                    <InfoField 
                      label="Customized" 
                      value={fundingAllocations?.customOverMinimum ? 'Yes' : 'No (Default)'} 
                      isRequired 
                    />
                    {fundingAllocations?.customOverMinimum ? (
                      <>
                        <InfoField 
                          label="PCT / GOF" 
                          value={`${fundingAllocations?.patientCareTrustOM || 0}% / ${fundingAllocations?.generalOperatingFundOM || 0}%`} 
                        />
                        <InfoField 
                          label="Total" 
                          value={`${calculateTotal('OM')}%`} 
                          isRequired={fundingAllocations?.customOverMinimum}
                        />
                      </>
                    ) : (
                      <>
                        <InfoField label="PCT / GOF" value="50% / 50%" />
                        <InfoField label="Total" value="100%" />
                      </>
                    )}
                  </InfoCard>
                </div>
              ) : (
                /* Edit Mode */
                <div className="max-w-4xl">
                  <div className="space-y-8">
                    {/* Primary Allocations */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Fund Allocations</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-3">
                            If cryopreservation is not possible, your funds will be allocated to support Alcor's mission. 
                            By default, funds are split 50/50 between Patient Care Trust and General Operating Fund.
                          </p>
                          <label className="flex items-start">
                            <input
                              type="checkbox"
                              checked={fundingAllocations.customPrimary || false}
                              onChange={(e) => setFundingAllocations({...fundingAllocations, customPrimary: e.target.checked})}
                              disabled={savingSection === 'fundingAllocations'}
                              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              I want to customize how my funds are allocated
                            </span>
                          </label>
                        </div>

                        {fundingAllocations.customPrimary && (
                          <>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                              <p className="text-sm text-yellow-800">
                                <strong>Important:</strong> All percentages must add up to exactly 100%. 
                                Current total: {calculateTotal()}%
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <Input
                                label="Patient Care Trust (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.patientCareTrust || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, patientCareTrust: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="General Operating Fund (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.generalOperatingFund || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, generalOperatingFund: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Alcor Research Fund (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.alcorResearchFund || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, alcorResearchFund: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Endowment Fund (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.endowmentFund || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, endowmentFund: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Individuals (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.individuals || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, individuals: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Others (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.others || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, others: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                            </div>

                            {fundingAllocations.individuals > 0 && (
                              <Input
                                label="Individual Recipients (Name, Relationship, Percentage) *"
                                type="text"
                                placeholder="e.g., John Smith, Father, 50%"
                                value={fundingAllocations.followingPersons || ''}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, followingPersons: e.target.value})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                            )}

                            {fundingAllocations.others > 0 && (
                              <Input
                                label="Other Recipients (Organization, Percentage) *"
                                type="text"
                                placeholder="e.g., ASPCA, 20%"
                                value={fundingAllocations.other || ''}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, other: e.target.value})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Over-Minimum Allocations */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Over-Minimum Fund Allocations</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-3">
                            For funds exceeding the minimum cryopreservation requirements, you can specify how the surplus should be allocated. 
                            By default, surplus funds are split 50/50 between Patient Care Trust and General Operating Fund.
                          </p>
                          <label className="flex items-start">
                            <input
                              type="checkbox"
                              checked={fundingAllocations.customOverMinimum || false}
                              onChange={(e) => setFundingAllocations({...fundingAllocations, customOverMinimum: e.target.checked})}
                              disabled={savingSection === 'fundingAllocations'}
                              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              I want to customize how surplus funds are allocated
                            </span>
                          </label>
                        </div>

                        {fundingAllocations.customOverMinimum && (
                          <>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                              <p className="text-sm text-yellow-800">
                                <strong>Important:</strong> All percentages must add up to exactly 100%. 
                                Current total: {calculateTotal('OM')}%
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <Input
                                label="Patient Care Trust (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.patientCareTrustOM || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, patientCareTrustOM: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="General Operating Fund (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.generalOperatingFundOM || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, generalOperatingFundOM: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Alcor Research Fund (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.alcorResearchFundOM || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, alcorResearchFundOM: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Endowment Fund (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.endowmentFundOM || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, endowmentFundOM: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Individuals (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.individualsOM || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, individualsOM: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                              <Input
                                label="Others (%)"
                                type="number"
                                min="0"
                                max="100"
                                value={fundingAllocations.othersOM || 0}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, othersOM: parseFloat(e.target.value) || 0})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                            </div>

                            {fundingAllocations.individualsOM > 0 && (
                              <Input
                                label="Individual Recipients (Name, Relationship, Percentage) *"
                                type="text"
                                placeholder="e.g., John Smith, Father, 50%"
                                value={fundingAllocations.followingPersonsOM || ''}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, followingPersonsOM: e.target.value})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                            )}

                            {fundingAllocations.othersOM > 0 && (
                              <Input
                                label="Other Recipients (Organization, Percentage) *"
                                type="text"
                                placeholder="e.g., ASPCA, 20%"
                                value={fundingAllocations.otherOM || ''}
                                onChange={(e) => setFundingAllocations({...fundingAllocations, otherOM: e.target.value})}
                                disabled={savingSection === 'fundingAllocations'}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              {editMode?.fundingAllocations ? (
                <div className={buttonStyles.actionContainer}>
                  <div className={buttonStyles.buttonGroup}>
                    <WhiteButton
                      text="Cancel"
                      onClick={() => cancelEdit && cancelEdit('fundingAllocations')}
                      className={buttonStyles.whiteButton.withMargin}
                      spinStar={buttonStyles.starConfig.enabled}
                    />
                    <PurpleButton
                      text={savingSection === 'fundingAllocations' ? 'Saving...' : 'Save'}
                      onClick={saveFundingAllocations}
                      className={buttonStyles.purpleButton.base}
                      spinStar={buttonStyles.starConfig.enabled}
                      disabled={savingSection === 'fundingAllocations'}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {!canEdit ? (
                    <div className="text-sm text-gray-500 italic mt-12 pt-6 text-right">
                      Contact Alcor to update funding allocations
                    </div>
                  ) : (
                    <div className={buttonStyles.actionContainer}>
                      <WhiteButton
                        text="Edit"
                        onClick={() => toggleEditMode && toggleEditMode('fundingAllocations')}
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

export default FundingAllocationsSection;