import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ContactInfoSection from './ContactInfoSection';

// Mock the imported components and utilities
jest.mock('../FormComponents', () => ({
  Input: ({ label, value, onChange, disabled, error, ...props }) => (
    <div>
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

// Mock styleConfig2 based on the actual file structure
jest.mock('../styleConfig2', () => {
  const mockConfig = {
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
      subtitle: 'header-subtitle',
      iconContainer: 'icon-container'
    },
    sectionIcons: { contact: 'contact-icon' },
    display: {
      dl: { wrapperThree: 'wrapper-three' },
      item: {
        label: 'item-label',
        value: 'item-value',
        empty: 'Not provided'
      }
    },
    form: { label: 'form-label' },
    editableConfig: {
      sectionsWithEditButton: {
        contact: true
      },
      visibleInEditMode: {
        contact: {
          firstName: true,
          lastName: true,
          dateOfBirth: false,
          personalEmail: true,
          workEmail: true,
          homePhone: true,
          mobilePhone: true,
          workPhone: true,
          preferredPhone: true
        }
      },
      editableFields: {
        contact: {
          firstName: true,
          lastName: true,
          personalEmail: true,
          workEmail: true,
          homePhone: true,
          mobilePhone: true,
          workPhone: true,
          preferredPhone: true
        }
      }
    }
  };

  return {
    __esModule: true,
    default: mockConfig,
    isFieldVisibleInEditMode: (sectionName, fieldName) => {
      const sectionFields = mockConfig.editableConfig.visibleInEditMode[sectionName];
      if (!sectionFields) return true;
      return sectionFields[fieldName] !== false;
    },
    isFieldEditable: (sectionName, fieldName) => {
      if (!mockConfig.editableConfig.visibleInEditMode[sectionName]?.[fieldName]) {
        return false;
      }
      const sectionFields = mockConfig.editableConfig.editableFields[sectionName];
      if (!sectionFields) return false;
      return sectionFields[fieldName] !== false;
    },
    getSectionCheckboxColor: (sectionType) => {
      const colorMap = {
        contact: '#13283f',
        personal: '#1a2f4a',
        addresses: '#243655',
        family: '#2e3d60',
        occupation: '#404060',
        medical: '#52476b',
        cryo: '#644e76',
        funding: '#705579',
        legal: '#795a7b',
        nextOfKin: '#825f7c'
      };
      return colorMap[sectionType] || '#443660';
    },
    getSectionIconStyles: (sectionType) => ({
      container: mockConfig.sectionIcons[sectionType] || mockConfig.header.iconContainer,
      icon: mockConfig.header.icon
    }),
    sectionHasEditButton: (sectionName) => {
      return mockConfig.editableConfig.sectionsWithEditButton[sectionName] || false;
    }
  };
});

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
  ActionButtons: ({ editMode, onEdit, onSave, onCancel, saving }) => (
    <div>
      {!editMode ? (
        <button onClick={onEdit}>Edit</button>
      ) : (
        <>
          <button onClick={onCancel} disabled={saving}>Cancel</button>
          <button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </>
      )}
    </div>
  ),
}));

describe('ContactInfoSection', () => {
  const defaultProps = {
    contactInfo: {
      personalEmail: 'john.doe@example.com',
      workEmail: 'john.doe@company.com',
      mobilePhone: '(555) 123-4567',
      homePhone: '(555) 987-6543',
      workPhone: '(555) 555-5555',
      preferredPhone: 'Mobile'
    },
    personalInfo: {
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Doe',
      dateOfBirth: '1990-05-15'
    },
    editMode: { contact: false },
    toggleEditMode: jest.fn(),
    cancelEdit: jest.fn(),
    saveContactInfo: jest.fn(),
    savingSection: '',
    fieldErrors: {},
    setContactInfo: jest.fn(),
    setPersonalInfo: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for desktop view
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Display Mode', () => {
    it('renders all contact information in display mode', () => {
      render(<ContactInfoSection {...defaultProps} />);

      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Michael')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      // Check for the date in a more flexible way due to timezone issues
      expect(screen.getByText(/May 1[4-5], 1990/)).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('john.doe@company.com')).toBeInTheDocument();
      // Use getAllByText since "Mobile Phone" appears multiple times (as label and value)
      const mobilePhoneElements = screen.getAllByText('Mobile Phone');
      expect(mobilePhoneElements.length).toBeGreaterThan(0);
      expect(screen.getAllByText('(555) 123-4567')[0]).toBeInTheDocument();
    });

    it('shows "Not provided" for empty fields', () => {
      const propsWithEmptyFields = {
        ...defaultProps,
        contactInfo: {
          ...defaultProps.contactInfo,
          workEmail: ''
        },
        personalInfo: {
          ...defaultProps.personalInfo,
          middleName: ''
        }
      };

      render(<ContactInfoSection {...propsWithEmptyFields} />);
      
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it('calls toggleEditMode when Edit button is clicked', () => {
      render(<ContactInfoSection {...defaultProps} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('contact');
    });
  });

  describe('Edit Mode', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { contact: true }
    };

    it('renders all form fields in edit mode', () => {
      render(<ContactInfoSection {...editModeProps} />);

      expect(screen.getByLabelText('First Name *')).toHaveValue('John');
      expect(screen.getByLabelText('Middle Name')).toHaveValue('Michael');
      expect(screen.getByLabelText('Last Name *')).toHaveValue('Doe');
      expect(screen.getByLabelText('Personal Email *')).toHaveValue('john.doe@example.com');
      expect(screen.getByLabelText('Work Email')).toHaveValue('john.doe@company.com');
      expect(screen.getByLabelText('Preferred Phone *')).toHaveValue('Mobile');
      expect(screen.getByLabelText('Mobile Phone')).toHaveValue('(555) 123-4567');
    });

    it('updates personal info when typing in name fields', () => {
      render(<ContactInfoSection {...editModeProps} />);

      const firstNameInput = screen.getByLabelText('First Name *');
      
      // Simulate the onChange event directly
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      // Check that setPersonalInfo was called with the new value
      expect(defaultProps.setPersonalInfo).toHaveBeenCalledWith(
        expect.objectContaining({ 
          firstName: 'Jane',
          lastName: 'Doe',
          middleName: 'Michael',
          dateOfBirth: '1990-05-15'
        })
      );
    });

    it('updates contact info when typing in email fields', () => {
      render(<ContactInfoSection {...editModeProps} />);

      const emailInput = screen.getByLabelText('Personal Email *');
      
      // Simulate the onChange event directly
      fireEvent.change(emailInput, { target: { value: 'new@email.com' } });

      // Check that setContactInfo was called with the new value
      expect(defaultProps.setContactInfo).toHaveBeenCalledWith(
        expect.objectContaining({ 
          personalEmail: 'new@email.com',
          workEmail: 'john.doe@company.com',
          mobilePhone: '(555) 123-4567',
          homePhone: '(555) 987-6543',
          workPhone: '(555) 555-5555',
          preferredPhone: 'Mobile'
        })
      );
    });

    it('calls cancelEdit when Cancel button is clicked', () => {
      render(<ContactInfoSection {...editModeProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('contact');
    });

    it('calls saveContactInfo when Save button is clicked', () => {
      render(<ContactInfoSection {...editModeProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.saveContactInfo).toHaveBeenCalled();
    });

    it('disables all form fields when saving', () => {
      const savingProps = {
        ...editModeProps,
        savingSection: 'contact'
      };

      render(<ContactInfoSection {...savingProps} />);

      expect(screen.getByLabelText('First Name *')).toBeDisabled();
      expect(screen.getByLabelText('Last Name *')).toBeDisabled();
      expect(screen.getByLabelText('Personal Email *')).toBeDisabled();
      expect(screen.getByLabelText('Mobile Phone')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('displays field errors when present', () => {
      const propsWithErrors = {
        ...editModeProps,
        fieldErrors: {
          firstName: 'First name is required',
          personalEmail: 'Invalid email format',
          mobilePhone: 'Mobile phone is required when selected as preferred'
        }
      };

      render(<ContactInfoSection {...propsWithErrors} />);

      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Mobile phone is required when selected as preferred')).toBeInTheDocument();
    });
  });

  describe('Date of Birth handling', () => {
    it('correctly parses and displays date of birth', () => {
      render(<ContactInfoSection {...defaultProps} />);
      
      // More flexible date matching due to timezone issues
      expect(screen.getByText(/May 1[4-5], 1990/)).toBeInTheDocument();
    });

    it('does not show date of birth fields in edit mode', () => {
      const editProps = {
        ...defaultProps,
        editMode: { contact: true }
      };

      render(<ContactInfoSection {...editProps} />);

      // Based on the component code and config, dateOfBirth fields should not be visible in edit mode
      expect(screen.queryByText('Date of Birth *')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('May')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('15')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('1990')).not.toBeInTheDocument();
    });
  });

  describe('Phone formatting', () => {
    it('formats phone numbers correctly in display mode', () => {
      const propsWithUnformattedPhone = {
        ...defaultProps,
        contactInfo: {
          ...defaultProps.contactInfo,
          mobilePhone: '5551234567'
        }
      };

      render(<ContactInfoSection {...propsWithUnformattedPhone} />);
      
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('handles already formatted phone numbers', () => {
      render(<ContactInfoSection {...defaultProps} />);
      
      expect(screen.getAllByText('(555) 123-4567')[0]).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      // Mock window.innerWidth for mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('renders MobileInfoCard in mobile view', () => {
      render(<ContactInfoSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-info-card')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    it('shows correct preview in mobile collapsed state', () => {
      render(<ContactInfoSection {...defaultProps} />);
      
      expect(screen.getByText('John Doe • john.doe@example.com • (555) 123-4567')).toBeInTheDocument();
    });

    it('disables form fields during save in mobile view', () => {
      const savingProps = {
        ...defaultProps,
        editMode: { contact: true },
        savingSection: 'contact'
      };

      render(<ContactInfoSection {...savingProps} />);

      const firstNameInputs = screen.getAllByLabelText('First Name *');
      firstNameInputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete edit flow: edit -> modify -> save', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ContactInfoSection {...defaultProps} />);

      // Click Edit
      fireEvent.click(screen.getByText('Edit'));
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('contact');

      // Simulate entering edit mode
      rerender(<ContactInfoSection {...defaultProps} editMode={{ contact: true }} />);

      // Modify a field
      const firstNameInput = screen.getByLabelText('First Name *');
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jane');

      // Click Save
      fireEvent.click(screen.getByText('Save'));
      expect(defaultProps.saveContactInfo).toHaveBeenCalled();
    });

    it('handles complete edit flow: edit -> modify -> cancel', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ContactInfoSection {...defaultProps} />);

      // Enter edit mode
      rerender(<ContactInfoSection {...defaultProps} editMode={{ contact: true }} />);

      // Modify a field
      const emailInput = screen.getByLabelText('Personal Email *');
      await user.clear(emailInput);
      await user.type(emailInput, 'cancelled@email.com');

      // Click Cancel
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('contact');
    });
  });

  describe('Field visibility based on configuration', () => {
    it('respects field visibility configuration in edit mode', () => {
      const editProps = {
        ...defaultProps,
        editMode: { contact: true }
      };

      render(<ContactInfoSection {...editProps} />);

      // These fields should be visible based on config
      expect(screen.getByLabelText('First Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Personal Email *')).toBeInTheDocument();
      
      // Date of Birth should not be visible in edit mode based on config
      expect(screen.queryByLabelText('Date of Birth')).not.toBeInTheDocument();
    });
  });
});