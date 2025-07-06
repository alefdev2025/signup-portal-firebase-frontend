import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CryoArrangementsSection from './CryoArrangementsSection';

// Mock fetch for Melissa API
global.fetch = jest.fn();

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
        aria-invalid={!!error}
        {...props}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  Select: ({ label, children, value, onChange, disabled, error, ...props }) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  Checkbox: ({ label, checked, onChange, disabled }) => (
    <div>
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
    </div>
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
  sectionIcons: { cryo: 'cryo-icon' },
  display: {
    dl: { 
      wrapperSingle: 'wrapper-single',
      wrapperThree: 'wrapper-three' 
    },
    item: {
      label: 'item-label',
      value: 'item-value',
      empty: 'Not provided'
    },
    readOnly: {
      wrapper: 'read-only-wrapper'
    }
  },
  form: { 
    label: 'form-label',
    fieldSpacing: 'field-spacing',
    subSection: 'sub-section'
  }
}));

jest.mock('./MobileInfoCard', () => ({
  MobileInfoCard: ({ children, title, preview, subtitle, isEditMode }) => (
    <div data-testid="mobile-info-card">
      <h3>{title}</h3>
      <p>{preview}</p>
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
  FormInput: ({ label, value, onChange, disabled, error, ...props }) => (
    <div>
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
  FormSelect: ({ label, children, value, onChange, disabled, error }) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={onChange} disabled={disabled} aria-label={label}>
        {children}
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  ActionButtons: ({ editMode, onEdit, onSave, onCancel, saving, saveText, hideEditButton, showSaveAnyway, onSaveAnyway }) => (
    <div>
      {!editMode && !hideEditButton ? (
        <button onClick={onEdit}>Edit</button>
      ) : editMode ? (
        <>
          <button onClick={onCancel} disabled={saving}>Cancel</button>
          {showSaveAnyway && (
            <button onClick={onSaveAnyway} disabled={saving}>Save Anyway</button>
          )}
          <button onClick={onSave} disabled={saving}>
            {saveText || (saving ? 'Saving...' : 'Save')}
          </button>
        </>
      ) : null}
    </div>
  ),
}));

jest.mock('../memberCategoryConfig', () => ({
  isSectionEditable: (memberCategory, section) => {
    // CryoMembers cannot edit cryoArrangements section
    if (memberCategory === 'CryoMember' && section === 'cryoArrangements') {
      return false;
    }
    return true;
  }
}));

jest.mock('../utils/dataFormatting', () => ({
  cleanAddressData: jest.fn(data => data),
  cleanAddressObject: jest.fn(data => data),
  formatEmail: jest.fn(email => email),
  formatPhone: jest.fn(phone => phone),
  formatStreetAddress: jest.fn(street => street),
  formatCity: jest.fn(city => city),
  formatStateProvince: jest.fn(state => state),
  formatPostalCode: jest.fn(zip => zip),
  formatCountry: jest.fn(country => country)
}));

// Helper to create a successful validation response
const createSuccessfulValidationResponse = (address) => ({
  ok: true,
  status: 200,
  json: async () => ({
    Version: '1.0',
    TransmissionResults: 'GE00',
    Records: [{
      Results: 'AV25',
      AddressLine1: address.street?.toUpperCase() || '',
      Locality: address.city?.toUpperCase() || '',
      AdministrativeArea: address.state?.toUpperCase() || '',
      PostalCode: address.postalCode || '',
      CountryISO3166_1_Alpha2: address.country || 'US'
    }]
  })
});

describe('CryoArrangementsSection', () => {
  const defaultProps = {
    cryoArrangements: {
      method: 'WholeBody',
      cmsWaiver: true,
      remainsHandling: 'return',
      recipientName: 'Jane Doe',
      recipientPhone: '(555) 123-4567',
      recipientEmail: 'jane.doe@example.com',
      recipientMailingStreet: '123 Main St',
      recipientMailingCity: 'Anytown',
      recipientMailingState: 'AZ',
      recipientMailingPostalCode: '85001',
      recipientMailingCountry: 'US',
      cryopreservationDisclosure: 'freely',
      memberPublicDisclosure: 'confidential'
    },
    setCryoArrangements: jest.fn(),
    editMode: { cryoArrangements: false },
    toggleEditMode: jest.fn(),
    cancelEdit: jest.fn(),
    saveCryoArrangements: jest.fn(),
    savingSection: '',
    memberCategory: 'CryoApplicant',
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
    it('renders all cryopreservation information including recipient address in display mode', () => {
      render(<CryoArrangementsSection {...defaultProps} />);

      expect(screen.getByText('Whole Body Cryopreservation ($220,000 US / $230,000 International)')).toBeInTheDocument();
      expect(screen.getByText('Yes - Waiving $200 annual fee with $20,000 additional funding')).toBeInTheDocument();
      expect(screen.getByText('Return to designated recipient')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
      
      // Check for recipient mailing address
      expect(screen.getByText('123 Main St, Anytown, AZ, 85001, US')).toBeInTheDocument();
    });

    it('shows "Not provided" for empty recipient address fields', () => {
      const propsWithEmptyAddress = {
        ...defaultProps,
        cryoArrangements: {
          ...defaultProps.cryoArrangements,
          recipientMailingStreet: '',
          recipientMailingCity: '',
          recipientMailingState: '',
          recipientMailingPostalCode: '',
          recipientMailingCountry: ''
        }
      };

      render(<CryoArrangementsSection {...propsWithEmptyAddress} />);
      
      // Find the "Not provided" text for the recipient mailing address
      const labels = screen.getAllByText('Recipient Mailing Address');
      expect(labels.length).toBeGreaterThan(0);
      
      // Check that at least one shows "Not provided"
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it('does not show recipient fields including address when remains handling is donate', () => {
      const propsWithDonate = {
        ...defaultProps,
        cryoArrangements: {
          ...defaultProps.cryoArrangements,
          remainsHandling: 'donate'
        }
      };

      render(<CryoArrangementsSection {...propsWithDonate} />);
      
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Recipient Name')).not.toBeInTheDocument();
      expect(screen.queryByText('Recipient Mailing Address')).not.toBeInTheDocument();
      expect(screen.queryByText('123 Main St')).not.toBeInTheDocument();
      expect(screen.getByText('Donate to medical research or dispose at Alcor\'s discretion')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { cryoArrangements: true }
    };

    it('renders all form fields including recipient address in edit mode', () => {
      render(<CryoArrangementsSection {...editModeProps} />);

      // Check for all recipient fields
      expect(screen.getByLabelText('Recipient Name')).toHaveValue('Jane Doe');
      expect(screen.getByLabelText('Recipient Phone')).toHaveValue('(555) 123-4567');
      expect(screen.getByLabelText('Recipient Email')).toHaveValue('jane.doe@example.com');
      
      // Check for recipient address fields
      expect(screen.getByLabelText('Street Address')).toHaveValue('123 Main St');
      expect(screen.getByLabelText('City')).toHaveValue('Anytown');
      expect(screen.getByLabelText('State/Province')).toHaveValue('AZ');
      expect(screen.getByLabelText('Zip/Postal Code')).toHaveValue('85001');
      expect(screen.getByLabelText('Country')).toHaveValue('US');
    });

    it('shows recipient address fields only when remains handling is return', async () => {
      const user = userEvent.setup();
      
      // Initial render shows recipient fields because remainsHandling is 'return'
      const { rerender } = render(<CryoArrangementsSection {...editModeProps} />);
      
      // Verify recipient fields are present initially
      expect(screen.getByLabelText('Recipient Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Street Address')).toBeInTheDocument();

      const remainsSelect = screen.getByLabelText('Non-Cryopreserved Remains Handling');
      
      // Change to donate
      await user.selectOptions(remainsSelect, 'donate');
      
      // Verify setCryoArrangements was called
      expect(defaultProps.setCryoArrangements).toHaveBeenCalledWith(
        expect.objectContaining({
          remainsHandling: 'donate'
        })
      );
      
      // Re-render with donate handling to reflect state change
      rerender(
        <CryoArrangementsSection 
          {...editModeProps} 
          cryoArrangements={{ ...editModeProps.cryoArrangements, remainsHandling: 'donate' }}
        />
      );
      
      // All recipient fields should disappear
      expect(screen.queryByLabelText('Recipient Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Street Address')).not.toBeInTheDocument();
      expect(screen.queryByText('Recipient Mailing Address')).not.toBeInTheDocument();
      
      // Change back to return
      const remainsSelectAfter = screen.getByLabelText('Non-Cryopreserved Remains Handling');
      await user.selectOptions(remainsSelectAfter, 'return');
      
      // Re-render with return handling
      rerender(
        <CryoArrangementsSection 
          {...editModeProps} 
          cryoArrangements={{ ...editModeProps.cryoArrangements, remainsHandling: 'return' }}
        />
      );
      
      // All recipient fields should reappear
      expect(screen.getByLabelText('Recipient Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
      expect(screen.getByText('Recipient Mailing Address')).toBeInTheDocument();
    });

    it('updates recipient address fields when changed', async () => {
      render(<CryoArrangementsSection {...editModeProps} />);

      const streetInput = screen.getByLabelText('Street Address');
      
      // Simulate a change event directly
      fireEvent.change(streetInput, { target: { value: '456 Elm St' } });

      // Check that setCryoArrangements was called with the new value
      expect(defaultProps.setCryoArrangements).toHaveBeenCalledWith(
        expect.objectContaining({
          ...defaultProps.cryoArrangements,
          recipientMailingStreet: '456 Elm St'
        })
      );
    });
  });

  describe('Address Validation', () => {
    beforeEach(() => {
      // Default to successful validation
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN ST',
            Locality: 'ANYTOWN',
            AdministrativeArea: 'AZ',
            PostalCode: '85001',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });
    });

    it('validates recipient address when saving with return handling', async () => {
      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('address.melissadata.net'),
          expect.any(Object)
        );
      });

      // Should call saveCryoArrangements after successful validation
      await waitFor(() => {
        expect(defaultProps.saveCryoArrangements).toHaveBeenCalled();
      });
    });

    it('shows validation error for invalid recipient address', async () => {
      // Mock invalid address response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AE01',
            AddressLine1: '',
            Locality: '',
            AdministrativeArea: '',
            PostalCode: '',
            CountryISO3166_1_Alpha2: ''
          }]
        })
      });

      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('This address could not be verified. Please double-check it\'s correct.')).toBeInTheDocument();
      });

      // Should not call saveCryoArrangements
      expect(defaultProps.saveCryoArrangements).not.toHaveBeenCalled();
    });

    it('shows Save Anyway button when validation fails', async () => {
      // Mock invalid address response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AE01',
            AddressLine1: '',
            Locality: '',
            AdministrativeArea: '',
            PostalCode: '',
            CountryISO3166_1_Alpha2: ''
          }]
        })
      });

      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Save Anyway')).toBeInTheDocument();
      });

      // Click Save Anyway
      fireEvent.click(screen.getByText('Save Anyway'));
      
      expect(defaultProps.saveCryoArrangements).toHaveBeenCalled();
    });

    it('shows validation modal for address correction', async () => {
      const correctedAddressResponse = {
        Version: '1.0',
        TransmissionResults: 'GE00',
        Records: [{
          Results: 'AV25',
          AddressLine1: '123 MAIN STREET', // Different from input
          Locality: 'ANYTOWN',
          AdministrativeArea: 'AZ',
          PostalCode: '85001-1234', // Enhanced ZIP
          CountryISO3166_1_Alpha2: 'US'
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => correctedAddressResponse
      });

      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.setAddressValidationModal).toHaveBeenCalledWith(
          expect.objectContaining({
            isOpen: true,
            addressType: 'Recipient',
            originalAddress: expect.objectContaining({
              street: '123 Main St',
              city: 'Anytown',
              state: 'AZ',
              postalCode: '85001'
            }),
            suggestedAddress: expect.objectContaining({
              street: '123 MAIN STREET',
              city: 'ANYTOWN',
              state: 'AZ',
              postalCode: '85001-1234'
            })
          })
        );
      });
    });

    it('does not validate address when remains handling is donate', async () => {
      const editProps = {
        ...defaultProps,
        cryoArrangements: {
          ...defaultProps.cryoArrangements,
          remainsHandling: 'donate'
        },
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Should not call fetch for validation
      expect(fetch).not.toHaveBeenCalled();
      
      // Should call saveCryoArrangements directly
      await waitFor(() => {
        expect(defaultProps.saveCryoArrangements).toHaveBeenCalled();
      });
    });

    it('shows validation error for incomplete recipient address', async () => {
      const incompleteAddressProps = {
        ...defaultProps,
        cryoArrangements: {
          ...defaultProps.cryoArrangements,
          recipientMailingStreet: '123 Main St',
          recipientMailingCity: '', // Missing city
          recipientMailingState: 'AZ',
          recipientMailingPostalCode: '85001'
        },
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...incompleteAddressProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Please complete all recipient address fields.')).toBeInTheDocument();
      });

      // Should not call fetch or saveCryoArrangements
      expect(fetch).not.toHaveBeenCalled();
      expect(defaultProps.saveCryoArrangements).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      // Silence console.error for this test since we expect an error
      const originalError = console.error;
      console.error = jest.fn();

      fetch.mockRejectedValueOnce(new Error('Network error'));

      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Address validation service is temporarily unavailable.')).toBeInTheDocument();
      });

      // Restore console.error
      console.error = originalError;
    });

    it('shows Validating... text while processing', async () => {
      // Mock a slow API response
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      fetch.mockImplementationOnce(() => promise);

      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...editProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Should show validating text
      expect(screen.getByText('Validating...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({
        ok: true,
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN ST',
            Locality: 'ANYTOWN',
            AdministrativeArea: 'AZ',
            PostalCode: '85001',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      await waitFor(() => {
        expect(screen.queryByText('Validating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile View with Address Fields', () => {
    beforeEach(() => {
      // Mock window.innerWidth for mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('renders recipient address fields in mobile edit mode', () => {
      const mobileEditProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };

      render(<CryoArrangementsSection {...mobileEditProps} />);
      
      expect(screen.getByText('Recipient Mailing Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Street Address')).toHaveValue('123 Main St');
      expect(screen.getByLabelText('City')).toHaveValue('Anytown');
      expect(screen.getByLabelText('State/Province')).toHaveValue('AZ');
      expect(screen.getByLabelText('Zip/Postal Code')).toHaveValue('85001');
      expect(screen.getByLabelText('Country')).toHaveValue('US');
    });

    it('displays recipient address in mobile view', () => {
      render(<CryoArrangementsSection {...defaultProps} />);
      
      expect(screen.getByText('123 Main St, Anytown, AZ, 85001, US')).toBeInTheDocument();
    });

    it('shows validation error in mobile view', async () => {
      // Mock invalid address response
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AE01',
            AddressLine1: '',
            Locality: '',
            AdministrativeArea: '',
            PostalCode: '',
            CountryISO3166_1_Alpha2: ''
          }]
        })
      });

      const mobileEditProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };
      
      render(<CryoArrangementsSection {...mobileEditProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('This address could not be verified. Please double-check it\'s correct.')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Scenarios with Address', () => {
    it('handles complete edit flow with address validation', async () => {
      const user = userEvent.setup();
      
      // Mock saveCryoArrangements to resolve immediately
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const integrationProps = {
        ...defaultProps,
        saveCryoArrangements: mockSave
      };
      
      const { rerender } = render(<CryoArrangementsSection {...integrationProps} />);

      // Click Edit
      fireEvent.click(screen.getByText('Edit'));
      expect(integrationProps.toggleEditMode).toHaveBeenCalledWith('cryoArrangements');

      // Simulate entering edit mode by re-rendering with edit mode true
      rerender(<CryoArrangementsSection {...integrationProps} editMode={{ cryoArrangements: true }} />);

      // Set up successful validation mock
      fetch.mockResolvedValueOnce(createSuccessfulValidationResponse({
        street: '789 OAK AVE',
        city: 'ANYTOWN',
        state: 'AZ',
        postalCode: '85001',
        country: 'US'
      }));

      // Modify recipient address
      const streetInput = screen.getByLabelText('Street Address');
      await user.clear(streetInput);
      await user.type(streetInput, '789 Oak Ave');

      // Click Save - this should trigger validation
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Wait for validation to complete
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('address.melissadata.net'),
          expect.any(Object)
        );
      });

      // Since the address is different in the response, it should call setAddressValidationModal
      await waitFor(() => {
        expect(integrationProps.setAddressValidationModal).toHaveBeenCalled();
      });
      
      // Simulate accepting the suggested address by calling onAccept
      const modalCall = integrationProps.setAddressValidationModal.mock.calls[0][0];
      expect(modalCall.addressType).toBe('Recipient');
      
      // Call onAccept to continue with save
      modalCall.onAccept();
      
      // Now saveCryoArrangements should be called
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
    }, 10000); // Increase timeout to 10 seconds

    it('preserves address when switching remains handling back and forth', async () => {
      const user = userEvent.setup();
      
      // Start with return handling
      const editProps = {
        ...defaultProps,
        editMode: { cryoArrangements: true }
      };

      const { rerender } = render(<CryoArrangementsSection {...editProps} />);

      // Verify initial address values
      expect(screen.getByLabelText('Street Address')).toHaveValue('123 Main St');

      // Change to donate
      const remainsSelect = screen.getByLabelText('Non-Cryopreserved Remains Handling');
      await user.selectOptions(remainsSelect, 'donate');

      // Re-render with updated props to reflect the state change
      rerender(
        <CryoArrangementsSection 
          {...editProps} 
          cryoArrangements={{ ...editProps.cryoArrangements, remainsHandling: 'donate' }}
        />
      );

      // Address fields should be gone
      expect(screen.queryByLabelText('Street Address')).not.toBeInTheDocument();

      // Change back to return
      await user.selectOptions(screen.getByLabelText('Non-Cryopreserved Remains Handling'), 'return');
      
      // Re-render with return handling
      rerender(
        <CryoArrangementsSection 
          {...editProps} 
          cryoArrangements={{ ...editProps.cryoArrangements, remainsHandling: 'return' }}
        />
      );

      // Address fields should return with preserved values
      expect(screen.getByLabelText('Street Address')).toHaveValue('123 Main St');
      expect(screen.getByLabelText('City')).toHaveValue('Anytown');
      expect(screen.getByLabelText('State/Province')).toHaveValue('AZ');
      expect(screen.getByLabelText('Zip/Postal Code')).toHaveValue('85001');
    });
  });

  describe('Edge Cases with Address', () => {
    it('handles undefined recipient address fields gracefully', () => {
      const propsWithoutAddress = {
        ...defaultProps,
        cryoArrangements: {
          ...defaultProps.cryoArrangements,
          recipientMailingStreet: undefined,
          recipientMailingCity: undefined,
          recipientMailingState: undefined,
          recipientMailingPostalCode: undefined,
          recipientMailingCountry: undefined
        }
      };

      render(<CryoArrangementsSection {...propsWithoutAddress} />);
      
      // Should show "Not provided" for address
      const labels = screen.getAllByText('Recipient Mailing Address');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('handles missing setAddressValidationModal prop', async () => {
      const propsWithoutModal = {
        ...defaultProps,
        setAddressValidationModal: undefined,
        editMode: { cryoArrangements: true }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          Version: '1.0',
          TransmissionResults: 'GE00',
          Records: [{
            Results: 'AV25',
            AddressLine1: '123 MAIN STREET', // Different
            Locality: 'ANYTOWN',
            AdministrativeArea: 'AZ',
            PostalCode: '85001-1234',
            CountryISO3166_1_Alpha2: 'US'
          }]
        })
      });

      render(<CryoArrangementsSection {...propsWithoutModal} />);
      
      const saveButton = screen.getByText('Save');
      
      // Should not throw error
      expect(() => fireEvent.click(saveButton)).not.toThrow();
      
      // Should still call saveCryoArrangements
      await waitFor(() => {
        expect(defaultProps.saveCryoArrangements).toHaveBeenCalled();
      });
    });
  });
});