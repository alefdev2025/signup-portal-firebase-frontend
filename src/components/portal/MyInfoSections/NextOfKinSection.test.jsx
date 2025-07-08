import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import NextOfKinSection from './NextOfKinSection';

// Mock all dependencies
jest.mock('../FormComponents', () => ({
  Input: ({ label, value, onChange, disabled, error, ...props }) => (
    <div>
      {label && <label>{label}</label>}
      <input
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        data-testid={`input-${label}`}
        {...props}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  Select: ({ label, value, onChange, disabled, children }) => (
    <div>
      {label && <label>{label}</label>}
      <select
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        data-testid={`select-${label}`}
      >
        {children}
      </select>
    </div>
  ),
  Button: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  ButtonGroup: ({ children }) => <div>{children}</div>,
}));

jest.mock('../WebsiteButtonStyle', () => ({
  RainbowButton: ({ text, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="rainbow-button">{text}</button>
  ),
  WhiteButton: ({ text, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="white-button">{text}</button>
  ),
  PurpleButton: ({ text, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="purple-button">{text}</button>
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
    sectionIcons: { 
      nextOfKin: 'nextofkin-icon',
      default: 'default-icon'
    },
    display: {
      dl: { wrapperThree: 'wrapper-three' },
      item: {
        label: 'item-label',
        value: 'item-value',
        empty: 'Not provided'
      }
    },
    form: {
      label: 'form-label',
      textarea: 'form-textarea'
    }
  },
  isFieldVisibleInEditMode: () => true,
  getSectionCheckboxColor: () => '#243655'
}));

jest.mock('../utils/dataFormatting', () => ({
  formatPersonName: (name) => name ? name.trim() : '',
  formatEmail: (email) => email ? email.toLowerCase().trim() : '',
  formatPhone: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },
  formatCity: (city) => city ? city.trim() : '',
  formatStreetAddress: (street) => street ? street.trim() : '',
  formatStateProvince: (state) => state ? state.toUpperCase().trim() : '',
  formatPostalCode: (postal) => postal ? postal.trim() : '',
  formatCountry: (country) => country ? country.toUpperCase().trim() : '',
  cleanString: (str) => str ? str.trim() : ''
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
    <div data-testid="display-field">
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  ),
  FormInput: ({ label, value, onChange, disabled, error, type = 'text', placeholder, ...props }) => (
    <div>
      {label && <label>{label}</label>}
      <input
        type={type}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        data-testid={`form-input-${label}`}
        {...props}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  FormSelect: ({ label, children, value, onChange, disabled }) => (
    <div>
      {label && <label>{label}</label>}
      <select 
        value={value || ''} 
        onChange={onChange} 
        disabled={disabled} 
        aria-label={label}
        data-testid={`form-select-${label}`}
      >
        {children}
      </select>
    </div>
  ),
  ActionButtons: ({ editMode, onEdit, onSave, onCancel, saving }) => (
    <div data-testid="action-buttons">
      {!editMode ? (
        <button onClick={onEdit} data-testid="edit-button">Edit</button>
      ) : (
        <>
          <button onClick={onCancel} disabled={saving} data-testid="cancel-button">Cancel</button>
          <button onClick={onSave} disabled={saving} data-testid="save-button">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      )}
    </div>
  ),
}));

describe('NextOfKinSection', () => {
  let defaultProps;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.innerWidth for desktop view by default
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    window.dispatchEvent(new Event('resize'));

    defaultProps = {
      nextOfKinList: [],
      setNextOfKinList: jest.fn(),
      editMode: { nextOfKin: false },
      toggleEditMode: jest.fn(),
      cancelEdit: jest.fn(),
      saveNextOfKin: jest.fn(),
      savingSection: '',
      memberCategory: 'standard',
      fieldErrors: {}
    };
  });

  describe('Display Mode - Desktop', () => {
    it('renders emergency contacts header', () => {
      render(<NextOfKinSection {...defaultProps} />);
      expect(screen.getByText('Emergency Contacts')).toBeInTheDocument();
    });

    it('shows empty state when no next of kin', () => {
      render(<NextOfKinSection {...defaultProps} />);
      expect(screen.getByText('No next of kin information on file')).toBeInTheDocument();
    });

    it('renders next of kin information when provided', () => {
      const nok = {
        id: '1',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        relationship: 'Spouse',
        email: 'john.doe@example.com',
        mobilePhone: '(555) 123-4567',
        homePhone: '(555) 987-6543',
        dateOfBirth: '1980-01-15',
        address: {
          street1: '123 Main St',
          street2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        },
        willingToSignAffidavit: 'Yes',
        comments: 'Supportive'
      };

      const props = {
        ...defaultProps,
        nextOfKinList: [nok]
      };

      render(<NextOfKinSection {...props} />);

      // Check for rendered data
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('Spouse')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('calls toggleEditMode when Edit button is clicked', () => {
      render(<NextOfKinSection {...defaultProps} />);
      
      const editButton = screen.getByTestId('rainbow-button');
      fireEvent.click(editButton);
      
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('nextOfKin');
    });
  });

  describe('Edit Mode - Desktop', () => {
    it('renders form fields in edit mode', () => {
      const nok = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        relationship: 'Spouse',
        email: 'john@example.com',
        mobilePhone: '(555) 123-4567',
        address: {}
      };

      const props = {
        ...defaultProps,
        nextOfKinList: [nok],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);

      // Check for form inputs
      expect(screen.getByTestId('input-First Name *')).toHaveValue('John');
      expect(screen.getByTestId('input-Last Name *')).toHaveValue('Doe');
      expect(screen.getByTestId('input-Email *')).toHaveValue('john@example.com');
    });

    it('adds a new next of kin when Add button is clicked', () => {
      const props = {
        ...defaultProps,
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);
      
      const addButton = screen.getByText('Add Next of Kin');
      fireEvent.click(addButton);

      expect(defaultProps.setNextOfKinList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringContaining('temp-'),
            firstName: '',
            lastName: '',
            relationship: ''
          })
        ])
      );
    });

    it('updates field values when typing', () => {
      const nok = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        address: {}
      };

      const props = {
        ...defaultProps,
        nextOfKinList: [nok],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);

      const firstNameInput = screen.getByTestId('input-First Name *');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      expect(defaultProps.setNextOfKinList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            firstName: 'Jane',
            fullName: 'Jane Doe'
          })
        ])
      );
    });

    it('removes a next of kin when Remove button is clicked', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [
          { id: '1', firstName: 'John', lastName: 'Doe', address: {} },
          { id: '2', firstName: 'Jane', lastName: 'Smith', address: {} }
        ],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);
      
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(defaultProps.setNextOfKinList).toHaveBeenCalledWith([
        expect.objectContaining({ id: '2' })
      ]);
    });

    it('calls saveNextOfKin when Save button is clicked', () => {
      const props = {
        ...defaultProps,
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);
      
      const saveButton = screen.getByTestId('purple-button');
      fireEvent.click(saveButton);
      
      expect(defaultProps.saveNextOfKin).toHaveBeenCalled();
    });

    it('calls cancelEdit when Cancel button is clicked', () => {
      const props = {
        ...defaultProps,
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);
      
      const cancelButton = screen.getByTestId('white-button');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('nextOfKin');
    });

    it('disables form when saving', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [{ id: '1', firstName: 'John', address: {} }],
        editMode: { nextOfKin: true },
        savingSection: 'nextOfKin'
      };

      render(<NextOfKinSection {...props} />);

      expect(screen.getByTestId('input-First Name *')).toBeDisabled();
      expect(screen.getByText('Add Another Next of Kin')).toBeDisabled();
      expect(screen.getByTestId('purple-button')).toHaveTextContent('Saving...');
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('renders MobileInfoCard in mobile view', () => {
      render(<NextOfKinSection {...defaultProps} />);
      expect(screen.getByTestId('mobile-info-card')).toBeInTheDocument();
    });

    it('shows correct preview with no NOK', () => {
      render(<NextOfKinSection {...defaultProps} />);
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('No next of kin information on file');
    });

    it('shows names in preview', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [
          { id: '1', firstName: 'John', lastName: 'Doe' },
          { id: '2', firstName: 'Jane', lastName: 'Smith' }
        ]
      };

      render(<NextOfKinSection {...props} />);
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('John Doe • Jane Smith');
    });

    it('shows count when more than 2 NOK', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [
          { id: '1', firstName: 'John', lastName: 'Doe' },
          { id: '2', firstName: 'Jane', lastName: 'Smith' },
          { id: '3', firstName: 'Bob', lastName: 'Johnson' },
          { id: '4', firstName: 'Alice', lastName: 'Brown' }
        ]
      };

      render(<NextOfKinSection {...props} />);
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('John Doe • Jane Smith • +2 more');
    });
  });

  describe('Field Validation', () => {
    it('shows email validation error for invalid email', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [{
          id: '1',
          firstName: 'John',
          email: 'invalid-email',
          address: {}
        }],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('displays field errors from props', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [{ id: '1', firstName: '', address: {} }],
        editMode: { nextOfKin: true },
        fieldErrors: {
          'nok_0_firstName': 'First name is required',
          'nok_0_email': 'Email is required'
        }
      };

      render(<NextOfKinSection {...props} />);
      
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('formats phone numbers correctly', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [{ id: '1', mobilePhone: '', address: {} }],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);

      const phoneInput = screen.getByTestId('input-Mobile Phone *');
      fireEvent.change(phoneInput, { target: { value: '5551234567' } });

      expect(defaultProps.setNextOfKinList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            mobilePhone: '(555) 123-4567',
            phone: '(555) 123-4567'
          })
        ])
      );
    });

    it('formats email to lowercase', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [{ id: '1', email: '', address: {} }],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);

      const emailInput = screen.getByTestId('input-Email *');
      fireEvent.change(emailInput, { target: { value: 'JOHN.DOE@EXAMPLE.COM' } });

      expect(defaultProps.setNextOfKinList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            email: 'john.doe@example.com'
          })
        ])
      );
    });

    it('auto-generates fullName when names change', () => {
      const props = {
        ...defaultProps,
        nextOfKinList: [{ id: '1', firstName: 'John', lastName: 'Doe', address: {} }],
        editMode: { nextOfKin: true }
      };

      render(<NextOfKinSection {...props} />);

      const lastNameInput = screen.getByTestId('input-Last Name *');
      fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

      expect(defaultProps.setNextOfKinList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            lastName: 'Smith',
            fullName: 'John Smith'
          })
        ])
      );
    });
  });
});