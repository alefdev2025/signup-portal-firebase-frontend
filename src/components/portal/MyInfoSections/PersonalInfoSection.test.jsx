import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PersonalInfoSection from './PersonalInfoSection';

// Mock the imported components and utilities
jest.mock('../FormComponents', () => ({
  Input: ({ label, value, onChange, disabled, error, placeholder, ...props }) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
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

// Mock styleConfig2
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
      subtitle: 'header-subtitle'
    },
    sectionIcons: { personal: 'personal-icon' },
    display: {
      dl: { wrapperThree: 'wrapper-three' },
      item: {
        label: 'item-label',
        value: 'item-value',
        empty: 'Not provided'
      }
    },
    form: { label: 'form-label' },
    input: { default: 'input-default' }
  };

  return {
    __esModule: true,
    default: mockConfig,
    getSectionCheckboxColor: jest.fn()
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
  FormInput: ({ label, value, onChange, disabled, error, placeholder, ...props }) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
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

describe('PersonalInfoSection', () => {
  const defaultProps = {
    personalInfo: {
      birthName: 'Jonathan Doe',
      ssn: '123-45-6789',
      gender: 'Male',
      race: ['White or Caucasian', 'Asian'],
      ethnicity: 'Not Hispanic or Latino',
      citizenship: ['United States of America'],
      placeOfBirth: 'Los Angeles, CA',
      maritalStatus: 'Married'
    },
    familyInfo: {
      spousesName: 'Jane Doe'
    },
    editMode: { personal: false },
    toggleEditMode: jest.fn(),
    cancelEdit: jest.fn(),
    savePersonalInfo: jest.fn(),
    savingSection: '',
    memberCategory: 'CryoMember',
    setPersonalInfo: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for desktop view
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Display Mode', () => {
    it('renders all personal information in display mode', () => {
      render(<PersonalInfoSection {...defaultProps} />);

      expect(screen.getByText('Jonathan Doe')).toBeInTheDocument();
      expect(screen.getByText('***-**-6789')).toBeInTheDocument(); // SSN is masked
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('White or Caucasian, Asian')).toBeInTheDocument();
      expect(screen.getByText('Not Hispanic or Latino')).toBeInTheDocument();
      expect(screen.getByText('United States of America')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles, CA')).toBeInTheDocument();
      expect(screen.getByText('Married')).toBeInTheDocument();
    });

    it('shows "Not provided" for empty fields', () => {
      const propsWithEmptyFields = {
        ...defaultProps,
        personalInfo: {
          ...defaultProps.personalInfo,
          birthName: '',
          placeOfBirth: '',
          race: [],
          citizenship: []
        }
      };

      render(<PersonalInfoSection {...propsWithEmptyFields} />);
      
      expect(screen.getByText('Same as current')).toBeInTheDocument(); // birthName shows this instead
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it('formats SSN correctly showing only last 4 digits', () => {
      render(<PersonalInfoSection {...defaultProps} />);
      
      expect(screen.getByText('***-**-6789')).toBeInTheDocument();
      expect(screen.queryByText('123-45-6789')).not.toBeInTheDocument();
    });

    it('handles already masked SSN', () => {
      const propsWithMaskedSSN = {
        ...defaultProps,
        personalInfo: {
          ...defaultProps.personalInfo,
          ssn: '***-**-6789'
        }
      };

      render(<PersonalInfoSection {...propsWithMaskedSSN} />);
      expect(screen.getByText('***-**-6789')).toBeInTheDocument();
    });

    it('calls toggleEditMode when Edit button is clicked', () => {
      render(<PersonalInfoSection {...defaultProps} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('personal');
    });
  });

  describe('Edit Mode', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { personal: true }
    };

    it('renders all form fields in edit mode', () => {
      render(<PersonalInfoSection {...editModeProps} />);

      expect(screen.getByLabelText('Birth Name')).toHaveValue('Jonathan Doe');
      expect(screen.getByLabelText('Gender *')).toHaveValue('Male');
      expect(screen.getByLabelText('Place of Birth')).toHaveValue('Los Angeles, CA');
      
      // For custom dropdown components, check by text content instead
      expect(screen.getByText('Race')).toBeInTheDocument();
      expect(screen.getByText('Ethnicity')).toBeInTheDocument();
      expect(screen.getByText('Citizenship')).toBeInTheDocument();
      expect(screen.getByText('Marital Status')).toBeInTheDocument();
    });

    it('renders multi-select dropdowns for race and citizenship', () => {
      render(<PersonalInfoSection {...editModeProps} />);

      // Check for the custom dropdown components
      expect(screen.getByText('Race')).toBeInTheDocument();
      expect(screen.getByText('Citizenship')).toBeInTheDocument();
      
      // The selected values should be displayed
      expect(screen.getByText('White or Caucasian, Asian')).toBeInTheDocument();
      // Citizenship is mapped to "United States" in edit mode
      expect(screen.getByText('United States')).toBeInTheDocument();
    });

    it('updates personal info when changing gender', () => {
      render(<PersonalInfoSection {...editModeProps} />);

      const genderSelect = screen.getByLabelText('Gender *');
      fireEvent.change(genderSelect, { target: { value: 'Female' } });

      expect(defaultProps.setPersonalInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          ...defaultProps.personalInfo,
          gender: 'Female'
        })
      );
    });

    it('updates personal info when typing in birth name', () => {
      render(<PersonalInfoSection {...editModeProps} />);

      const birthNameInput = screen.getByLabelText('Birth Name');
      fireEvent.change(birthNameInput, { target: { value: 'John Smith' } });

      expect(defaultProps.setPersonalInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          ...defaultProps.personalInfo,
          birthName: 'John Smith'
        })
      );
    });

    it('calls cancelEdit when Cancel button is clicked', () => {
      render(<PersonalInfoSection {...editModeProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('personal');
    });

    it('calls savePersonalInfo when Save button is clicked', () => {
      render(<PersonalInfoSection {...editModeProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.savePersonalInfo).toHaveBeenCalled();
    });

    it('shows saving state when savingSection is personal', () => {
      const savingProps = {
        ...editModeProps,
        savingSection: 'personal'
      };

      render(<PersonalInfoSection {...savingProps} />);

      // When saving, the button text changes to "Saving..."
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('shows saved state briefly', () => {
      const savedProps = {
        ...editModeProps,
        savingSection: 'saved'
      };

      render(<PersonalInfoSection {...savedProps} />);
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      // Mock window.innerWidth for mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('renders MobileInfoCard in mobile view', () => {
      render(<PersonalInfoSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-info-card')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Additional personal details for your member file.')).toBeInTheDocument();
    });

    it('shows correct preview in mobile collapsed state', () => {
      render(<PersonalInfoSection {...defaultProps} />);
      
      // Check the preview shows key information
      expect(screen.getByText('Male • Married • Not Hispanic or Latino')).toBeInTheDocument();
    });

    it('renders mobile-specific multi-select component', () => {
      const editProps = {
        ...defaultProps,
        editMode: { personal: true }
      };

      render(<PersonalInfoSection {...editProps} />);

      // Check for the mobile multi-select component (checkbox list)
      expect(screen.getByText('Race')).toBeInTheDocument();
      expect(screen.getByText('Citizenship')).toBeInTheDocument();
    });

    it('does not render ethnicity field in edit mode on mobile', () => {
      const editProps = {
        ...defaultProps,
        editMode: { personal: true }
      };

      render(<PersonalInfoSection {...editProps} />);

      // Ethnicity should not have an input field on mobile
      const ethnicitySelect = screen.queryByRole('combobox', { name: /ethnicity/i });
      expect(ethnicitySelect).not.toBeInTheDocument();
    });

    it('shows ethnicity in display mode on mobile', () => {
      render(<PersonalInfoSection {...defaultProps} />);
      
      expect(screen.getByText('Not Hispanic or Latino')).toBeInTheDocument();
    });
  });

  describe('Citizenship mapping', () => {
    it('maps citizenship values correctly from backend format', () => {
      const propsWithUSA = {
        ...defaultProps,
        personalInfo: {
          ...defaultProps.personalInfo,
          citizenship: ['United States of America']
        }
      };

      render(<PersonalInfoSection {...propsWithUSA} />);
      expect(screen.getByText('United States of America')).toBeInTheDocument();
    });

    it('handles multiple citizenships', () => {
      const propsWithMultipleCitizenship = {
        ...defaultProps,
        personalInfo: {
          ...defaultProps.personalInfo,
          citizenship: ['United States of America', 'Canada', 'Mexico']
        }
      };

      render(<PersonalInfoSection {...propsWithMultipleCitizenship} />);
      expect(screen.getByText('United States of America, Canada, Mexico')).toBeInTheDocument();
    });
  });

  describe('Race multi-select functionality', () => {
    it('displays multiple race selections correctly', () => {
      render(<PersonalInfoSection {...defaultProps} />);
      expect(screen.getByText('White or Caucasian, Asian')).toBeInTheDocument();
    });

    it('handles empty race array', () => {
      const propsWithNoRace = {
        ...defaultProps,
        personalInfo: {
          ...defaultProps.personalInfo,
          race: []
        }
      };

      render(<PersonalInfoSection {...propsWithNoRace} />);
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });
  });

  describe('Member category specific behavior', () => {
    it('shows all fields for CryoMember category', () => {
      render(<PersonalInfoSection {...defaultProps} />);

      // All fields should be visible for CryoMember
      expect(screen.getByText('Birth Name')).toBeInTheDocument();
      expect(screen.getByText('SSN/Government ID Number')).toBeInTheDocument();
      expect(screen.getByText('Gender')).toBeInTheDocument();
      expect(screen.getByText('Race')).toBeInTheDocument();
      expect(screen.getByText('Ethnicity')).toBeInTheDocument();
      expect(screen.getByText('Citizenship')).toBeInTheDocument();
      expect(screen.getByText('Place of Birth')).toBeInTheDocument();
      expect(screen.getByText('Marital Status')).toBeInTheDocument();
    });

    it('respects member category for field requirements', () => {
      const basicMemberProps = {
        ...defaultProps,
        memberCategory: 'BasicMember'
      };

      render(<PersonalInfoSection {...basicMemberProps} />);

      // Should still render but may have different validation requirements
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete edit flow with multi-select changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PersonalInfoSection {...defaultProps} />);

      // Click Edit
      fireEvent.click(screen.getByText('Edit'));
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('personal');

      // Simulate entering edit mode
      rerender(<PersonalInfoSection {...defaultProps} editMode={{ personal: true }} />);

      // Modify birth name
      const birthNameInput = screen.getByLabelText('Birth Name');
      await user.clear(birthNameInput);
      await user.type(birthNameInput, 'New Name');

      // Change gender
      const genderSelect = screen.getByLabelText('Gender *');
      fireEvent.change(genderSelect, { target: { value: 'Other' } });

      // Click Save
      fireEvent.click(screen.getByText('Save'));
      expect(defaultProps.savePersonalInfo).toHaveBeenCalled();
    });

    it('handles cancel flow correctly', () => {
      const { rerender } = render(<PersonalInfoSection {...defaultProps} />);

      // Enter edit mode
      rerender(<PersonalInfoSection {...defaultProps} editMode={{ personal: true }} />);

      // Make some changes
      const birthNameInput = screen.getByLabelText('Birth Name');
      fireEvent.change(birthNameInput, { target: { value: 'Changed Name' } });

      // Click Cancel
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('personal');
    });
  });

  describe('Logging and debugging', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    afterEach(() => {
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('logs personal info data on render', () => {
      render(<PersonalInfoSection {...defaultProps} />);

      // Check that the debug logging occurs - adjust to match actual console.log format
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔍 === PersonalInfoSection RENDER ==='
      );
      
      // Verify the log includes the props
      expect(consoleSpy).toHaveBeenCalledWith(
        '📋 Props received:',
        expect.objectContaining({
          personalInfo: expect.any(Object),
          ethnicity: expect.any(String),
          citizenship: expect.any(Array),
          maritalStatus: expect.any(String)
        })
      );
    });

    it('logs place of birth changes on mobile', () => {
      // Set mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      const editProps = {
        ...defaultProps,
        editMode: { personal: true }
      };

      render(<PersonalInfoSection {...editProps} />);

      const placeOfBirthInput = screen.getByLabelText('Place of Birth');
      fireEvent.change(placeOfBirthInput, { target: { value: 'New York, NY' } });

      // Check for the mobile-specific logging
      expect(consoleSpy).toHaveBeenCalledWith(
        'Mobile Place of Birth onChange:',
        'New York, NY'
      );
    });
  });
});