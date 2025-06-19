import React from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import styleConfig from '../styleConfig';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
  <div className={className}>
    <dt className={styleConfig.display.item.label}>{label}</dt>
    <dd className={styleConfig.display.item.value}>{value || styleConfig.display.item.empty}</dd>
  </div>
);

const AddressesSection = ({ 
  addresses, 
  setAddresses, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveAddresses, 
  savingSection 
}) => {
  // Format address for display
  const formatAddress = (street, city, state, postalCode, country) => {
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    if (parts.length === 0) return styleConfig.display.item.empty;
    return parts.join(', ');
  };

  return (
    <div className={styleConfig.section.wrapperEnhanced}>
      <div className={styleConfig.section.innerPadding}>
        {/* Header with icon */}
        <div className={styleConfig.header.wrapper}>
          <div className={styleConfig.sectionIcons.addresses}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className={styleConfig.header.textContainer}>
            <h2 className={styleConfig.header.title}>Addresses</h2>
            <p className={styleConfig.header.subtitle}>
              Your home and mailing addresses.
            </p>
          </div>
        </div>

        {/* Display Mode */}
        {!editMode.addresses ? (
          <dl className={styleConfig.display.dl.wrapperSingle}>
            <div>
              <dt className={`${styleConfig.display.item.label} mb-1`}>Home Address</dt>
              <dd className={styleConfig.display.item.value}>
                {formatAddress(
                  addresses.homeStreet,
                  addresses.homeCity,
                  addresses.homeState,
                  addresses.homePostalCode,
                  addresses.homeCountry
                )}
              </dd>
            </div>
            <div>
              <dt className={`${styleConfig.display.item.label} mb-1`}>Mailing Address</dt>
              <dd className={styleConfig.display.item.value}>
                {addresses.sameAsHome ? 
                  'Same as home address' : 
                  formatAddress(
                    addresses.mailingStreet,
                    addresses.mailingCity,
                    addresses.mailingState,
                    addresses.mailingPostalCode,
                    addresses.mailingCountry
                  )
                }
              </dd>
            </div>
          </dl>
        ) : (
          /* Edit Mode - Form */
          <>
            {/* Home Address */}
            <div className="mb-6">
              <h3 className="font-medium text-[#2a2346] mb-4">Home Address</h3>
              <div className={styleConfig.section.grid.twoColumn}>
                <Input
                  containerClassName="col-span-2"
                  label="Street Address"
                  type="text"
                  value={addresses.homeStreet || ''}
                  onChange={(e) => setAddresses({...addresses, homeStreet: e.target.value})}
                  disabled={!editMode.addresses}
                />
                <Input
                  label="City"
                  type="text"
                  value={addresses.homeCity || ''}
                  onChange={(e) => setAddresses({...addresses, homeCity: e.target.value})}
                  disabled={!editMode.addresses}
                />
                <Input
                  label="State/Province"
                  type="text"
                  value={addresses.homeState || ''}
                  onChange={(e) => setAddresses({...addresses, homeState: e.target.value})}
                  disabled={!editMode.addresses}
                />
                <Input
                  label="Zip/Postal Code"
                  type="text"
                  value={addresses.homePostalCode || ''}
                  onChange={(e) => setAddresses({...addresses, homePostalCode: e.target.value})}
                  disabled={!editMode.addresses}
                />
                <Input
                  label="Country"
                  type="text"
                  value={addresses.homeCountry || ''}
                  onChange={(e) => setAddresses({...addresses, homeCountry: e.target.value})}
                  disabled={!editMode.addresses}
                />
              </div>
            </div>

            {/* Mailing Address */}
            <div className="mb-6">
              <Checkbox
                label="Mailing address is the same as home address"
                checked={addresses.sameAsHome || false}
                onChange={(e) => setAddresses({...addresses, sameAsHome: e.target.checked})}
                disabled={!editMode.addresses}
              />
              
              {!addresses.sameAsHome && (
                <>
                  <h3 className="font-medium text-[#2a2346] mb-4 mt-4">Mailing Address</h3>
                  <div className={styleConfig.section.grid.twoColumn}>
                    <Input
                      containerClassName="col-span-2"
                      label="Street Address"
                      type="text"
                      value={addresses.mailingStreet || ''}
                      onChange={(e) => setAddresses({...addresses, mailingStreet: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="City"
                      type="text"
                      value={addresses.mailingCity || ''}
                      onChange={(e) => setAddresses({...addresses, mailingCity: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="State/Province"
                      type="text"
                      value={addresses.mailingState || ''}
                      onChange={(e) => setAddresses({...addresses, mailingState: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="Zip/Postal Code"
                      type="text"
                      value={addresses.mailingPostalCode || ''}
                      onChange={(e) => setAddresses({...addresses, mailingPostalCode: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                    <Input
                      label="Country"
                      type="text"
                      value={addresses.mailingCountry || ''}
                      onChange={(e) => setAddresses({...addresses, mailingCountry: e.target.value})}
                      disabled={!editMode.addresses}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
        <ButtonGroup>
          {editMode.addresses ? (
            <>
              <Button
                variant="tertiary"
                onClick={() => cancelEdit('addresses')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveAddresses}
                loading={savingSection === 'addresses'}
                disabled={savingSection === 'addresses'}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => toggleEditMode('addresses')}
            >
              Edit
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

export default AddressesSection;