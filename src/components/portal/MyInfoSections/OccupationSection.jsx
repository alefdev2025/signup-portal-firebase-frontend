import React, { useState } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';
import { HelpCircle } from 'lucide-react';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.value}>{value || styleConfig.display.item.empty}</dd>
  </div>
);

const OccupationSection = ({ 
  occupation, 
  setOccupation, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveOccupation, 
  savingSection,
  memberCategory
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [occupationError, setOccupationError] = useState('');
  
  // Format military service years for display
  const formatServiceYears = (from, to) => {
    if (!from && !to) return styleConfig.display.item.empty;
    if (from && to) return `${from} - ${to}`;
    if (from && !to) return `${from} - Present`;
    return styleConfig.display.item.empty;
  };

  // Check if occupation is just "Retired" (case-insensitive)
  const isJustRetired = (occupationValue) => {
    return occupationValue && occupationValue.toLowerCase().trim() === 'retired';
  };

  // Validate occupation field
  const validateOccupation = (value) => {
    if (isJustRetired(value)) {
      return 'Please specify your occupation before retirement (e.g., "Retired Software Engineer")';
    }
    return '';
  };

  // Handle occupation change
  const handleOccupationChange = (value) => {
    setOccupation({...occupation, occupation: value});
    setOccupationError(validateOccupation(value));
  };

  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.occupation}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Occupation</h2>
            <p className={styleConfig.header.subtitle}>
              Your current occupation and military service history.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.occupation ? (
          <dl className={styleConfig.display.dl.wrapperTwo}>
            <InfoDisplay 
              label="Job Title" 
              value={occupation.occupation} 
            />
            <InfoDisplay 
              label="Industry" 
              value={occupation.occupationalIndustry} 
            />
            <InfoDisplay 
              label="Military Service" 
              value={occupation.hasMilitaryService ? 'Yes' : 'No'}
              className={styleConfig.display.grid.fullSpan}
            />
            {occupation.hasMilitaryService && (
              <>
                <InfoDisplay 
                  label="Military Branch" 
                  value={occupation.militaryBranch} 
                />
                <InfoDisplay 
                  label="Service Years" 
                  value={formatServiceYears(occupation.servedFrom, occupation.servedTo)} 
                />
              </>
            )}
          </dl>
        ) : (
          /* Edit Mode - Form */
          <div className={styleConfig.section.grid.twoColumn}>
            <div>
              <Input
                label="Job Title"
                type="text"
                value={occupation.occupation || ''}
                onChange={(e) => handleOccupationChange(e.target.value)}
                disabled={!editMode.occupation}
                error={!!occupationError}
              />
              {occupationError && (
                <p className="text-red-600 text-sm mt-1 font-light">
                  {occupationError}
                </p>
              )}
              {occupation.occupation && occupation.occupation.toLowerCase().includes('retired') && !isJustRetired(occupation.occupation) && (
                <p className="text-green-600 text-sm mt-1 font-light">
                  ✓ Good format - includes previous occupation
                </p>
              )}
            </div>
            <Input
              label="Industry"
              type="text"
              value={occupation.occupationalIndustry || ''}
              onChange={(e) => setOccupation({...occupation, occupationalIndustry: e.target.value})}
              disabled={!editMode.occupation}
            />
            <Checkbox
              containerClassName="col-span-2"
              label="Have you served in the US Military?"
              checked={occupation.hasMilitaryService || false}
              onChange={(e) => setOccupation({...occupation, hasMilitaryService: e.target.checked, militaryBranch: e.target.checked ? occupation.militaryBranch : 'None'})}
              disabled={!editMode.occupation}
            />
            {occupation.hasMilitaryService && (
              <>
                <Select
                  label="Military Branch"
                  value={occupation.militaryBranch || ''}
                  onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                  disabled={!editMode.occupation}
                >
                  <option value="">Select...</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                  <option value="Marines">Marines</option>
                  <option value="Coast Guard">Coast Guard</option>
                  <option value="Space Force">Space Force</option>
                </Select>
                <Input
                  label="Service Start Year"
                  type="number"
                  value={occupation.servedFrom || ''}
                  onChange={(e) => setOccupation({...occupation, servedFrom: e.target.value})}
                  disabled={!editMode.occupation}
                  min="1900"
                  max={new Date().getFullYear()}
                />
                <Input
                  label="Service End Year"
                  type="number"
                  value={occupation.servedTo || ''}
                  onChange={(e) => setOccupation({...occupation, servedTo: e.target.value})}
                  disabled={!editMode.occupation}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </>
            )}
          </div>
        )}
        
        {/* Button Group and Warning Notice */}
        {!editMode.occupation && isJustRetired(occupation.occupation) ? (
          <div className="flex items-center justify-between mt-16">
            {/* Profile Improvement Notice - Left side */}
            <div className="flex items-center gap-4">
              <svg className="w-10 h-10 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    Update Your Occupation
                  </p>
                  <div className="relative">
                    <HelpCircle 
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                      strokeWidth={2}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
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
                            Alcor needs complete occupation information to better obtain a death certificate
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
                <p className="text-sm text-gray-600 font-light">
                  Please include your occupation before retirement
                </p>
              </div>
            </div>
            
            {/* Edit button - Right side */}
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('occupation')}
            >
              Edit
            </Button>
          </div>
        ) : (
          <ButtonGroup>
            {editMode.occupation ? (
              <>
                <Button
                  variant="tertiary"
                  onClick={() => cancelEdit('occupation')}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={saveOccupation}
                  loading={savingSection === 'occupation'}
                  disabled={savingSection === 'occupation' || !!occupationError}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => toggleEditMode('occupation')}
                className="ml-auto"
              >
                Edit
              </Button>
            )}
          </ButtonGroup>
        )}
      </div>
    </div>
  );
};

export default OccupationSection;