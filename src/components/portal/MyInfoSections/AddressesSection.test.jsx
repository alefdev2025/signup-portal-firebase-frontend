import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddressesSection from './AddressesSection';

// Mock the imported components and utilities
jest.mock('../FormComponents', () => ({
  Section: ({ children }) => <div>{children}</div>,
  Input: ({ label, value, onChange, disabled, error, containerClassName, ...props }) => (
    <div className={containerClassName}>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        {...props}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  Checkbox: ({ label, checked, onChange, disabled }) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
      {label}
    </label>
  ),
  Button: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  ButtonGroup: ({ children }) => <div>{children}</div>,
}));

jest.mock('../WebsiteButtonStyle', () => ({
  RainbowButton: ({ text, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{text}</button>
  ),
  WhiteButton: ({ text, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{text}</button>
  ),
  PurpleButton: ({ text, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{text}</button>
  ),
}));

jest.mock('../styleConfig2', () => ({
  __esModule: true,
  default: {
    section: {
      wrapperEnhanced: 'wrapper-enhanced',
      innerPadding: 'inner-padding',
      grid: { twoColumn: 'two-column' }
    },
    header: {
      wrapper: 'header-wrapper',
      icon: 'header-icon',
      textContainer: 'text-container',
      title: 'header-title',
      subtitle: 'header-subtitle'
    },
    sectionIcons: { addresses: 'addresses-icon' },
    display: {
      dl: { wrapperSingle: 'wrapper-single' },
      item: {
        label: 'item-label',
        value: 'item-value',
        empty: 'Not provided'
      }
    }
  },
  getSectionCheckboxColor: () => '#243655'
}));

jest.mock('../utils/dataFormatting', () => ({
  cleanAddressData: (addresses) => addresses,
  cleanAddressObject: (address) => address
}));

jest.mock('./MobileInfoCard', () => ({
  MobileInfoCard: ({ children, title, preview, subtitle, isEditMode }) => (
    <div data-testid="mobile-info-card">
      <h3>{title}</h3>
      <p data-testid="mobile-preview">{preview}</p>
      <p>{subtitle}</p>
      <div>{children}</div>
    </div>
  ),
  DisplayField: ({ label, value }) => (
    <div>
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  ),
  FormInput: ({ label, value, onChange, disabled, ...props }) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        {...props}
      />
    </div>
  ),
  FormSelect: ({ label, children, value, onChange, disabled }) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={onChange} disabled={disabled} aria-label={label}>
        {children}
      </select>
    </div>
  ),
  ActionButtons: ({ editMode, onEdit, onSave, onCancel, saving, saveText, showSaveAnyway, onSaveAnyway }) => (
    <div>
      {!editMode ? (
        <button onClick={onEdit}>Edit</button>
      ) : (
        <>
          <button onClick={onCancel} disabled={saving}>Cancel</button>
          {showSaveAnyway && (
            <button onClick={onSaveAnyway} disabled={saving}>Save Anyway</button>
          )}
          <button onClick={onSave} disabled={saving}>
            {saveText || (saving ? 'Saving...' : 'Save')}
          </button>
        </>
      )}
    </div>
  ),
}));

// Mock fetch for Melissa API
global.fetch = jest.fn();

describe('AddressesSection', () => {
  const defaultProps = {
    addresses: {
      homeStreet: '123 Main St',
      homeCity: 'New York',
      homeState: 'NY',
      homePostalCode: '10001',
      homeCountry: 'US',
      mailingStreet: '456 Broadway',
      mailingCity: 'New York',
      mailingState: 'NY',
      mailingPostalCode: '10002',
      mailingCountry: 'US',
      sameAsHome: false
    },
    setAddresses: jest.fn(),
    editMode: { addresses: false },
    toggleEditMode: jest.fn(),
    cancelEdit: jest.fn(),
    saveAddresses: jest.fn().mockResolvedValue(undefined), // Make it return a Promise
    savingSection: '',
    setAddressValidationModal: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    // Mock window.innerWidth for desktop view
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Display Mode', () => {
    it('renders all address information in display mode', () => {
      render(<AddressesSection {...defaultProps} />);

      expect(screen.getByText('Home Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, New York, NY, 10001, US')).toBeInTheDocument();
      expect(screen.getByText('Mailing Address')).toBeInTheDocument();
      expect(screen.getByText('456 Broadway, New York, NY, 10002, US')).toBeInTheDocument();
    });

    it('shows "Same as home address" when mailing same as home', () => {
      const propsWithSameAddress = {
        ...defaultProps,
        addresses: {
          ...defaultProps.addresses,
          sameAsHome: true
        }
      };

      render(<AddressesSection {...propsWithSameAddress} />);
      
      expect(screen.getByText('Same as home address')).toBeInTheDocument();
    });

    it('shows "Not provided" for empty addresses', () => {
      const propsWithEmptyAddresses = {
        ...defaultProps,
        addresses: {
          homeStreet: '',
          homeCity: '',
          homeState: '',
          homePostalCode: '',
          homeCountry: '',
          mailingStreet: '',
          mailingCity: '',
          mailingState: '',
          mailingPostalCode: '',
          mailingCountry: '',
          sameAsHome: false
        }
      };

      render(<AddressesSection {...propsWithEmptyAddresses} />);
      
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements).toHaveLength(2); // Home and Mailing
    });

    it('calls toggleEditMode when Edit button is clicked', () => {
      render(<AddressesSection {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Edit'));
      
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('addresses');
    });
  });

  describe('Edit Mode', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { addresses: true }
    };

    it('renders all form fields in edit mode', () => {
      render(<AddressesSection {...editModeProps} />);

      // Home address fields
      expect(screen.getAllByLabelText('Street Address *')[0]).toHaveValue('123 Main St');
      expect(screen.getAllByLabelText('City *')[0]).toHaveValue('New York');
      expect(screen.getAllByLabelText('State/Province *')[0]).toHaveValue('NY');
      expect(screen.getAllByLabelText('Zip/Postal Code *')[0]).toHaveValue('10001');
      expect(screen.getAllByLabelText('Country')[0]).toHaveValue('US');

      // Mailing address fields
      expect(screen.getAllByLabelText('Street Address *')[1]).toHaveValue('456 Broadway');
      expect(screen.getAllByLabelText('City *')[1]).toHaveValue('New York');
    });

    it('updates home address when typing', () => {
      render(<AddressesSection {...editModeProps} />);

      const homeStreetInput = screen.getAllByLabelText('Street Address *')[0];
      
      fireEvent.change(homeStreetInput, { target: { value: '789 Park Ave' } });

      expect(defaultProps.setAddresses).toHaveBeenCalledWith({
        ...defaultProps.addresses,
        homeStreet: '789 Park Ave'
      });
    });

    it('hides mailing address fields when "same as home" is checked', () => {
      const { rerender } = render(<AddressesSection {...editModeProps} />);

      const checkbox = screen.getByLabelText('Mailing address is the same as home address');
      
      fireEvent.click(checkbox);

      expect(defaultProps.setAddresses).toHaveBeenCalledWith({
        ...defaultProps.addresses,
        sameAsHome: true
      });

      // Re-render with updated props to reflect the state change
      rerender(<AddressesSection 
        {...editModeProps} 
        addresses={{ ...defaultProps.addresses, sameAsHome: true }} 
      />);

      // Mailing address fields should be hidden
      expect(screen.getAllByLabelText('Street Address *')).toHaveLength(1); // Only home address
    });

    it('calls cancelEdit when Cancel button is clicked', () => {
      render(<AddressesSection {...editModeProps} />);
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('addresses');
    });
  });

  describe('Address Validation', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { addresses: true }
    };

    beforeEach(() => {
      // Mock successful Melissa API response
      fetch.mockResolvedValue({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN ST',
            Locality: 'NEW YORK',
            AdministrativeArea: 'NY',
            PostalCode: '10001-1234',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });
    });

    it('validates addresses when Save is clicked', async () => {
      // Mock both addresses to be valid without changes
      fetch
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            Version: '1.0',
            TransmissionResults: 'GE00',
            Records: [{
              Results: 'AV25',
              AddressLine1: '123 Main St', // Same as input
              Locality: 'New York',
              AdministrativeArea: 'NY',
              PostalCode: '10001',
              CountryISO3166_1_Alpha2: 'US'
            }]
          })
        })
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            Version: '1.0',
            TransmissionResults: 'GE00',
            Records: [{
              Results: 'AV25',
              AddressLine1: '456 Broadway', // Same as input
              Locality: 'New York',
              AdministrativeArea: 'NY',
              PostalCode: '10002',
              CountryISO3166_1_Alpha2: 'US'
            }]
          })
        });

      render(<AddressesSection {...editModeProps} />);

      fireEvent.click(screen.getByText('Save'));

      // Wait for both validations to complete
      await waitFor(() => {
        expect(defaultProps.saveAddresses).toHaveBeenCalled();
      });

      // Should validate both addresses since neither needs correction
      expect(fetch).toHaveBeenCalledTimes(2); // Home and mailing

      // Should call Melissa API with correct parameters
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('address.melissadata.net'),
        expect.any(Object)
      );
    });

    it('shows validation modal when address is different from suggested', async () => {
      // Mock API to return different address
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN STREET', // Different from input
            Locality: 'NEW YORK',
            AdministrativeArea: 'NY',
            PostalCode: '10001-1234',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      render(<AddressesSection {...editModeProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(defaultProps.setAddressValidationModal).toHaveBeenCalledWith(
          expect.objectContaining({
            isOpen: true,
            addressType: 'Home',
            originalAddress: expect.any(Object),
            suggestedAddress: expect.objectContaining({
              street: '123 MAIN STREET'
            })
          })
        );
      });
    });

    it('shows error message for invalid addresses', async () => {
      // Mock API to return invalid address
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AE09', // Address error
            AddressLine1: '',
            Locality: '',
            AdministrativeArea: '',
            PostalCode: '',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      render(<AddressesSection {...editModeProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/This address could not be verified/)).toBeInTheDocument();
      });
    });

    it('shows "Save Anyway" button when validation fails', async () => {
      // Mock API to return invalid address
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AE09',
            AddressLine1: '',
            Locality: '',
            AdministrativeArea: '',
            PostalCode: '',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      render(<AddressesSection {...editModeProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/This address could not be verified/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Save Anyway')).toBeInTheDocument();
      });

      // Click Save Anyway
      fireEvent.click(screen.getByText('Save Anyway'));

      await waitFor(() => {
        expect(defaultProps.saveAddresses).toHaveBeenCalled();
      });
    });

    it('validates only home address when mailing is same as home', async () => {
      const propsWithSameAddress = {
        ...editModeProps,
        addresses: {
          ...editModeProps.addresses,
          sameAsHome: true
        }
      };

      render(<AddressesSection {...propsWithSameAddress} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1); // Only home address
      });
    });

    it('shows error for partial addresses', async () => {
      const propsWithPartialAddress = {
        ...editModeProps,
        addresses: {
          homeStreet: '123 Main St',
          homeCity: '', // Missing city
          homeState: 'NY',
          homePostalCode: '10001',
          homeCountry: 'US',
          sameAsHome: true
        }
      };

      render(<AddressesSection {...propsWithPartialAddress} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Please complete all home address fields.')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AddressesSection {...editModeProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Address validation service is temporarily unavailable.')).toBeInTheDocument();
      });
      
      // Clean up the mock after this test
      fetch.mockClear();
    });

    it('handles Melissa API key errors', async () => {
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE08', // Invalid API key
          Records: []
        })
      });

      render(<AddressesSection {...editModeProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/Invalid API key/)).toBeInTheDocument();
      });
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      // Mock window.innerWidth for mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('renders MobileInfoCard in mobile view', () => {
      render(<AddressesSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-info-card')).toBeInTheDocument();
      expect(screen.getByText('Addresses')).toBeInTheDocument();
    });

    it('shows correct preview in mobile view', () => {
      render(<AddressesSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('Home: New York, NY • Mailing: New York, NY');
    });

    it('shows "Same as home" in preview when applicable', () => {
      const propsWithSameAddress = {
        ...defaultProps,
        addresses: {
          ...defaultProps.addresses,
          sameAsHome: true
        }
      };

      render(<AddressesSection {...propsWithSameAddress} />);
      
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('Home: New York, NY • Mailing: Same as home');
    });

    it('handles validation in mobile view', async () => {
      const editProps = {
        ...defaultProps,
        editMode: { addresses: true }
      };

      // Mock successful validation
      fetch.mockResolvedValue({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN ST',
            Locality: 'NEW YORK',
            AdministrativeArea: 'NY',
            PostalCode: '10001',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      render(<AddressesSection {...editProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('handles complete edit flow: edit -> modify -> validate -> save', async () => {
      const user = userEvent.setup();
      
      // Clear any previous mocks and set up successful validation for both addresses
      fetch.mockClear();
      fetch
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            Version: '1.0',
            TransmissionResults: 'GE00',
            Records: [{
              Results: 'AV25',
              AddressLine1: '789 Park Ave', // Exact match for home
              Locality: 'New York',
              AdministrativeArea: 'NY',
              PostalCode: '10001',
              CountryISO3166_1_Alpha2: 'US'
            }]
          })
        })
        .mockResolvedValueOnce({
          status: 200,
          json: async () => ({
            Version: '1.0',
            TransmissionResults: 'GE00',
            Records: [{
              Results: 'AV25',
              AddressLine1: '456 Broadway', // Exact match for mailing
              Locality: 'New York',
              AdministrativeArea: 'NY',
              PostalCode: '10002',
              CountryISO3166_1_Alpha2: 'US'
            }]
          })
        });

      const { rerender } = render(<AddressesSection {...defaultProps} />);

      // Click Edit
      fireEvent.click(screen.getByText('Edit'));
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('addresses');

      // Simulate entering edit mode
      rerender(<AddressesSection {...defaultProps} editMode={{ addresses: true }} />);

      // Modify home street address
      const homeStreetInput = screen.getAllByLabelText('Street Address *')[0];
      await user.clear(homeStreetInput);
      await user.type(homeStreetInput, '789 Park Ave');

      // Update the component with the new address value
      const updatedAddresses = {
        ...defaultProps.addresses,
        homeStreet: '789 Park Ave'
      };
      
      rerender(<AddressesSection 
        {...defaultProps} 
        addresses={updatedAddresses}
        editMode={{ addresses: true }} 
      />);

      // Click Save
      fireEvent.click(screen.getByText('Save'));

      // Wait for both validations to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Home and mailing
      }, { timeout: 3000 });

      // Should eventually call saveAddresses after successful validation
      await waitFor(() => {
        expect(defaultProps.saveAddresses).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('handles validation correction flow', async () => {
      // First call returns different address
      fetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN STREET SUITE 100', // Different
            Locality: 'NEW YORK',
            AdministrativeArea: 'NY',
            PostalCode: '10001-1234',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      const editProps = {
        ...defaultProps,
        editMode: { addresses: true }
      };

      render(<AddressesSection {...editProps} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(defaultProps.setAddressValidationModal).toHaveBeenCalled();
      });

      // Get the onAccept function that was passed
      const modalCall = defaultProps.setAddressValidationModal.mock.calls[0][0];
      expect(modalCall.isOpen).toBe(true);
      
      // Simulate accepting the suggestion
      await waitFor(async () => {
        modalCall.onAccept();
      });

      // Should update the address and continue with save
      expect(defaultProps.setAddresses).toHaveBeenCalledWith(
        expect.objectContaining({
          homeStreet: '123 MAIN STREET SUITE 100'
        })
      );
    });
  });

  describe('State Management', () => {
    it('clears validation errors when exiting edit mode', () => {
      const { rerender } = render(<AddressesSection {...defaultProps} editMode={{ addresses: true }} />);

      // Trigger a validation error by clicking save with partial address
      const propsWithPartialAddress = {
        ...defaultProps,
        addresses: {
          homeStreet: '123 Main St',
          homeCity: '', // Missing
          homeState: 'NY',
          homePostalCode: '10001',
          homeCountry: 'US',
          sameAsHome: true
        },
        editMode: { addresses: true }
      };

      rerender(<AddressesSection {...propsWithPartialAddress} />);

      fireEvent.click(screen.getByText('Save'));

      // Error should appear
      waitFor(() => {
        expect(screen.getByText('Please complete all home address fields.')).toBeInTheDocument();
      });

      // Exit edit mode
      rerender(<AddressesSection {...propsWithPartialAddress} editMode={{ addresses: false }} />);

      // Error should be cleared
      expect(screen.queryByText('Please complete all home address fields.')).not.toBeInTheDocument();
    });

    it('prevents double-clicks during validation', async () => {
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          status: 200,
          json: async () => ({
            Version: '1.0',
            TransmissionResults: 'GE00',
            Records: [{
              Results: 'AV25',
              AddressLine1: '123 MAIN ST',
              Locality: 'NEW YORK',
              AdministrativeArea: 'NY',
              PostalCode: '10001',
              CountryISO3166_1_Alpha2: 'US'
            }]
          })
        }), 100))
      );

      render(<AddressesSection {...defaultProps} editMode={{ addresses: true }} />);

      const saveButton = screen.getByText('Save');
      
      // Click save multiple times quickly
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should only call fetch once despite multiple clicks
        expect(fetch).toHaveBeenCalledTimes(2); // Home and mailing, but only one set
      });
    });
  });

  describe('Save Button States', () => {
    it('shows "Validating..." during validation', async () => {
      // Mock slow API response
      fetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          status: 200,
          json: async () => ({
            Version: '1.0',
            TransmissionResults: 'GE00',
            Records: [{
              Results: 'AV25',
              AddressLine1: '123 MAIN ST',
              Locality: 'NEW YORK',
              AdministrativeArea: 'NY',
              PostalCode: '10001',
              CountryISO3166_1_Alpha2: 'US'
            }]
          })
        }), 100))
      );

      render(<AddressesSection {...defaultProps} editMode={{ addresses: true }} />);

      fireEvent.click(screen.getByText('Save'));

      expect(screen.getByText('Validating...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Validating...')).not.toBeInTheDocument();
      });
    });

    it('shows "Saving..." during save operation', async () => {
      const slowSaveProps = {
        ...defaultProps,
        editMode: { addresses: true },
        savingSection: 'addresses'
      };

      render(<AddressesSection {...slowSaveProps} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows "Saved" after successful save', () => {
      const savedProps = {
        ...defaultProps,
        editMode: { addresses: true },
        savingSection: 'saved'
      };

      render(<AddressesSection {...savedProps} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });
});