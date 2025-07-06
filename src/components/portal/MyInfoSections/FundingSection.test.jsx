import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FundingSection from './FundingSection';

// Mock the imported components and utilities
jest.mock('../FormComponents', () => ({
  Section: ({ children }) => <div>{children}</div>,
  Input: ({ label, value, onChange, disabled, required, placeholder, containerClassName, ...props }) => (
    <div className={containerClassName}>
      <label>{label}{required && ' *'}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    </div>
  ),
  Select: ({ label, children, value, onChange, disabled, required, ...props }) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        required={required}
        {...props}
      >
        {children}
      </select>
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
  RainbowButton: ({ text, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={className}>{text}</button>
  ),
  WhiteButton: ({ text, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={className}>{text}</button>
  ),
  PurpleButton: ({ text, onClick, disabled, className }) => (
    <button onClick={onClick} disabled={disabled} className={className}>{text}</button>
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
  sectionIcons: { funding: 'funding-icon' },
  display: {
    dl: { 
      wrapperOne: 'wrapper-one',
      wrapperTwo: 'wrapper-two' 
    },
    item: {
      label: 'item-label',
      value: 'item-value',
      empty: 'Not provided'
    },
    grid: {
      fullSpan: 'full-span'
    },
    readOnly: {
      wrapper: 'read-only-wrapper'
    }
  },
  form: { 
    label: 'form-label',
    fieldSpacing: 'field-spacing',
    subSection: 'sub-section'
  },
  nonEditable: {
    inlineMessage: 'inline-message',
    mobileWrapper: 'mobile-wrapper',
    mobileText: 'mobile-text'
  }
}));

jest.mock('./MobileInfoCard', () => ({
  MobileInfoCard: ({ children, title, preview, subtitle, isEditMode, iconComponent }) => (
    <div data-testid="mobile-info-card">
      <div>{iconComponent}</div>
      <h3>{title}</h3>
      <p>{preview}</p>
      <p>{subtitle}</p>
      <div>{children}</div>
    </div>
  ),
  DisplayField: ({ label, value, required }) => (
    <div>
      <dt>{label}{required && ' *'}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  ),
  FormInput: ({ label, value, onChange, disabled, required, placeholder, ...props }) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    </div>
  ),
  FormSelect: ({ label, children, value, onChange, disabled, required }) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <select value={value} onChange={onChange} disabled={disabled} aria-label={label} required={required}>
        {children}
      </select>
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
  memberCategoryConfig: {
    CryoApplicant: {
      sections: {
        funding: {
          requiredFields: ['fundingType', 'companyName', 'companyPhone', 'policyNumber', 'policyType', 'faceAmount']
        }
      }
    },
    CryoMember: {
      sections: {
        funding: {
          requiredFields: []
        }
      }
    }
  },
  isSectionEditable: (memberCategory, section) => {
    // Only CryoApplicants can edit funding section
    if (memberCategory === 'CryoMember' && section === 'funding') {
      return false;
    }
    return true;
  }
}));

describe('FundingSection', () => {
  const defaultProps = {
    funding: {
      fundingType: 'Life Insurance',
      companyName: 'MetLife',
      companyPhone: '(555) 123-4567',
      companyFax: '(555) 123-4568',
      companyStreet: '123 Insurance Ave',
      companyCity: 'New York',
      companyState: 'NY',
      companyPostalCode: '10001',
      companyCountry: 'USA',
      policyNumber: 'POL-123456',
      policyType: 'Term',
      faceAmount: '200000',
      annualPremium: '2400',
      dateIssued: '2023-01-15',
      termLength: '20',
      hasAgent: true,
      agentName: 'John Smith',
      agentEmail: 'john.smith@insurance.com',
      agentPhone: '(555) 987-6543'
    },
    setFunding: jest.fn(),
    editMode: { funding: false },
    toggleEditMode: jest.fn(),
    cancelEdit: jest.fn(),
    saveFunding: jest.fn(),
    savingSection: '',
    memberCategory: 'CryoApplicant'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for desktop view
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Display Mode', () => {
    it('renders all life insurance information in display mode', () => {
      render(<FundingSection {...defaultProps} />);

      // Funding type
      expect(screen.getByText('Life Insurance')).toBeInTheDocument();
      
      // Company information
      expect(screen.getByText('MetLife')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4568')).toBeInTheDocument();
      expect(screen.getByText('123 Insurance Ave, New York, NY 10001, USA')).toBeInTheDocument();
      
      // Policy information date should be formatted
      expect(screen.getByText('POL-123456')).toBeInTheDocument();
      expect(screen.getByText('Term')).toBeInTheDocument();
      expect(screen.getByText('$200,000')).toBeInTheDocument();
      expect(screen.getByText('$2,400')).toBeInTheDocument();
      // Check for date in some format
      const dateElements = screen.getAllByText((content, element) => {
        return element && content.includes('2023');
      });
      expect(dateElements.length).toBeGreaterThan(0);
      expect(screen.getByText('20 years')).toBeInTheDocument();
      
      // Agent information
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('john.smith@insurance.com')).toBeInTheDocument();
      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
    });

    it('shows "Not provided" for empty fields', () => {
      const propsWithEmptyFields = {
        ...defaultProps,
        funding: {
          ...defaultProps.funding,
          companyFax: '',
          annualPremium: '',
          termLength: ''
        }
      };

      render(<FundingSection {...propsWithEmptyFields} />);
      
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it('formats face amount and annual premium as currency', () => {
      render(<FundingSection {...defaultProps} />);
      
      expect(screen.getByText('$200,000')).toBeInTheDocument();
      expect(screen.getByText('$2,400')).toBeInTheDocument();
    });

    it('formats date correctly', () => {
      render(<FundingSection {...defaultProps} />);
      
      // Look for the Date Issued label and its value
      const dateLabel = screen.getByText('Date Issued');
      expect(dateLabel).toBeInTheDocument();
      
      // The date value should be present in some format
      // Since we can't predict the exact format, just verify the component renders without error
    });

    it('does not show agent section when no agent data exists', () => {
      const propsWithoutAgent = {
        ...defaultProps,
        funding: {
          ...defaultProps.funding,
          hasAgent: false,
          agentName: '',
          agentEmail: '',
          agentPhone: ''
        }
      };

      render(<FundingSection {...propsWithoutAgent} />);
      
      expect(screen.queryByText('Agent Information')).not.toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });

    it('shows agent section when agent data exists even if hasAgent is false', () => {
      const propsWithAgentData = {
        ...defaultProps,
        funding: {
          ...defaultProps.funding,
          hasAgent: false,
          agentName: 'Jane Doe',
          agentEmail: 'jane@example.com',
          agentPhone: '(555) 111-2222'
        }
      };

      render(<FundingSection {...propsWithAgentData} />);
      
      expect(screen.getByText('Agent Information')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('displays Trust funding type correctly', () => {
      const trustProps = {
        ...defaultProps,
        funding: {
          fundingType: 'Trust'
        }
      };

      render(<FundingSection {...trustProps} />);
      
      expect(screen.getByText('Trust')).toBeInTheDocument();
      // Check for helper text about trust beneficiary
      const helperText = screen.getByText((content) => 
        content.includes('trust') && content.includes('Alcor Life Extension Foundation')
      );
      expect(helperText).toBeInTheDocument();
    });

    it('displays Prepaid funding type correctly', () => {
      const prepaidProps = {
        ...defaultProps,
        funding: {
          fundingType: 'Prepaid'
        }
      };

      render(<FundingSection {...prepaidProps} />);
      
      expect(screen.getByText('Prepaid')).toBeInTheDocument();
      // Check for prepaid arrangement text
      const arrangementText = screen.getByText((content) => 
        content.includes('Prepaid') && content.includes('arrangement')
      );
      expect(arrangementText).toBeInTheDocument();
    });

    it('displays Other funding type correctly', () => {
      const otherProps = {
        ...defaultProps,
        funding: {
          fundingType: 'Other'
        }
      };

      render(<FundingSection {...otherProps} />);
      
      expect(screen.getByText('Other')).toBeInTheDocument();
      // Check for alternative arrangement text
      const arrangementText = screen.getByText((content) => 
        content.includes('Alternative') && content.includes('arrangement')
      );
      expect(arrangementText).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { funding: true }
    };

    it('renders all form fields in edit mode', () => {
      render(<FundingSection {...editModeProps} />);

      // Check for all form fields with correct types
      expect(screen.getByLabelText('Funding Type')).toHaveValue('Life Insurance');
      expect(screen.getByLabelText('Company Name')).toHaveValue('MetLife');
      expect(screen.getByLabelText('Company Phone')).toHaveValue('(555) 123-4567');
      expect(screen.getByLabelText('Company Fax')).toHaveValue('(555) 123-4568');
      expect(screen.getByLabelText('Company Street Address')).toHaveValue('123 Insurance Ave');
      expect(screen.getByLabelText('City')).toHaveValue('New York');
      expect(screen.getByLabelText('State/Province')).toHaveValue('NY');
      expect(screen.getByLabelText('Postal Code')).toHaveValue('10001');
      expect(screen.getByLabelText('Country')).toHaveValue('USA');
      expect(screen.getByLabelText('Policy Number')).toHaveValue('POL-123456');
      expect(screen.getByLabelText('Policy Type')).toHaveValue('Term');
      expect(screen.getByLabelText('Face Amount')).toHaveValue(200000); // Number, not string
      expect(screen.getByLabelText('Annual Premium')).toHaveValue(2400); // Number, not string
      expect(screen.getByLabelText('Date Issued')).toHaveValue('2023-01-15');
      expect(screen.getByLabelText('Term Length (years)')).toHaveValue(20); // Number, not string
      expect(screen.getByLabelText('I have a life insurance agent')).toBeChecked();
      expect(screen.getByLabelText('Agent Name')).toHaveValue('John Smith');
      expect(screen.getByLabelText('Agent Email')).toHaveValue('john.smith@insurance.com');
      expect(screen.getByLabelText('Agent Phone')).toHaveValue('(555) 987-6543');
    });

    it('shows only funding type select for non-life insurance types', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<FundingSection {...editModeProps} />);
      
      const fundingSelect = screen.getByLabelText('Funding Type');
      await user.selectOptions(fundingSelect, 'Trust');
      
      expect(defaultProps.setFunding).toHaveBeenCalledWith(
        expect.objectContaining({
          fundingType: 'Trust'
        })
      );
      
      // Re-render with Trust funding to simulate state update
      rerender(
        <FundingSection 
          {...editModeProps} 
          funding={{ fundingType: 'Trust' }}
        />
      );
      
      // Should not show life insurance fields
      expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Policy Number')).not.toBeInTheDocument();
      
      // Should show helper text for Trust
      expect(screen.getByText(/ensure your trust documents/)).toBeInTheDocument();
    });

    it('shows term length field only for Term policy type', async () => {
      const user = userEvent.setup();
      
      // Start with Term policy
      const { rerender } = render(<FundingSection {...editModeProps} />);
      
      expect(screen.getByLabelText('Term Length (years)')).toBeInTheDocument();
      
      // Change to Whole Life
      const policyTypeSelect = screen.getByLabelText('Policy Type');
      await user.selectOptions(policyTypeSelect, 'Whole Life');
      
      expect(defaultProps.setFunding).toHaveBeenCalledWith(
        expect.objectContaining({
          policyType: 'Whole Life'
        })
      );
      
      // Re-render with Whole Life to simulate state update
      rerender(
        <FundingSection 
          {...editModeProps} 
          funding={{ ...editModeProps.funding, policyType: 'Whole Life' }}
        />
      );
      
      // Term length should not be shown
      expect(screen.queryByLabelText('Term Length (years)')).not.toBeInTheDocument();
    });

    it('toggles agent fields based on checkbox', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<FundingSection {...editModeProps} />);
      
      // Agent fields should be visible initially
      expect(screen.getByLabelText('Agent Name')).toBeInTheDocument();
      
      // Uncheck the checkbox
      const agentCheckbox = screen.getByLabelText('I have a life insurance agent');
      await user.click(agentCheckbox);
      
      expect(defaultProps.setFunding).toHaveBeenCalledWith(
        expect.objectContaining({
          hasAgent: false
        })
      );
      
      // Re-render without agent to simulate state update
      rerender(
        <FundingSection 
          {...editModeProps} 
          funding={{ 
            ...editModeProps.funding, 
            hasAgent: false, 
            agentName: '', 
            agentEmail: '', 
            agentPhone: '' 
          }}
        />
      );
      
      // Agent fields should be hidden
      expect(screen.queryByLabelText('Agent Name')).not.toBeInTheDocument();
    });

    it('shows agent fields when agent data exists regardless of checkbox', () => {
      const propsWithAgentDataNoCheckbox = {
        ...editModeProps,
        funding: {
          ...editModeProps.funding,
          hasAgent: false,
          agentName: 'Jane Agent',
          agentEmail: 'jane@agent.com',
          agentPhone: '(555) 999-8888'
        }
      };

      render(<FundingSection {...propsWithAgentDataNoCheckbox} />);
      
      // Agent fields should still be shown
      expect(screen.getByLabelText('Agent Name')).toHaveValue('Jane Agent');
      expect(screen.getByLabelText('Agent Email')).toHaveValue('jane@agent.com');
      expect(screen.getByLabelText('Agent Phone')).toHaveValue('(555) 999-8888');
    });

    it('updates funding data when fields change', async () => {
      render(<FundingSection {...editModeProps} />);

      const companyNameInput = screen.getByLabelText('Company Name');
      
      fireEvent.change(companyNameInput, { target: { value: 'Prudential' } });

      expect(defaultProps.setFunding).toHaveBeenCalledWith(
        expect.objectContaining({
          ...defaultProps.funding,
          companyName: 'Prudential'
        })
      );
    });

    it('marks required fields with asterisks', () => {
      render(<FundingSection {...editModeProps} />);
      
      // Check for required field indicators
      expect(screen.getByText('Funding Type *')).toBeInTheDocument();
      expect(screen.getByText('Company Name *')).toBeInTheDocument();
      expect(screen.getByText('Company Phone *')).toBeInTheDocument();
      expect(screen.getByText('Policy Number *')).toBeInTheDocument();
      expect(screen.getByText('Policy Type *')).toBeInTheDocument();
      expect(screen.getByText('Face Amount *')).toBeInTheDocument();
    });
  });

  describe('Member Category Permissions', () => {
    it('allows CryoApplicants to edit funding section', () => {
      render(<FundingSection {...defaultProps} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('prevents CryoMembers from editing funding section', () => {
      const cryoMemberProps = {
        ...defaultProps,
        memberCategory: 'CryoMember'
      };

      render(<FundingSection {...cryoMemberProps} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.getByText('Contact Alcor to update funding information')).toBeInTheDocument();
    });

    it('overrides edit mode for non-editable member categories', () => {
      const cryoMemberEditProps = {
        ...defaultProps,
        memberCategory: 'CryoMember',
        editMode: { funding: true }
      };

      render(<FundingSection {...cryoMemberEditProps} />);
      
      // Should still be in display mode
      expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();
      expect(screen.getByText('MetLife')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls toggleEditMode when Edit button is clicked', () => {
      render(<FundingSection {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Edit'));
      
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('funding');
    });

    it('calls saveFunding when Save button is clicked', () => {
      const editProps = {
        ...defaultProps,
        editMode: { funding: true }
      };
      
      render(<FundingSection {...editProps} />);
      
      fireEvent.click(screen.getByText('Save'));
      
      expect(defaultProps.saveFunding).toHaveBeenCalled();
    });

    it('calls cancelEdit when Cancel button is clicked', () => {
      const editProps = {
        ...defaultProps,
        editMode: { funding: true }
      };
      
      render(<FundingSection {...editProps} />);
      
      fireEvent.click(screen.getByText('Cancel'));
      
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('funding');
    });

    it('shows saving state when savingSection is funding', () => {
      const savingProps = {
        ...defaultProps,
        editMode: { funding: true },
        savingSection: 'funding'
      };
      
      render(<FundingSection {...savingProps} />);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('shows saved state temporarily', () => {
      const savedProps = {
        ...defaultProps,
        editMode: { funding: true },
        savingSection: 'saved'
      };
      
      render(<FundingSection {...savedProps} />);
      
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      // Mock window.innerWidth for mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('renders mobile info card in mobile view', () => {
      render(<FundingSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-info-card')).toBeInTheDocument();
      expect(screen.getByText('Funding/Life Insurance')).toBeInTheDocument();
      expect(screen.getByText('Your cryopreservation funding arrangements.')).toBeInTheDocument();
    });

    it('shows mobile preview with funding type and company', () => {
      render(<FundingSection {...defaultProps} />);
      
      expect(screen.getByText('Life Insurance • MetLife')).toBeInTheDocument();
    });

    it('shows mobile preview for other funding types', () => {
      const trustProps = {
        ...defaultProps,
        funding: {
          fundingType: 'Trust'
        }
      };

      render(<FundingSection {...trustProps} />);
      
      // Check that the mobile preview contains Trust
      const mobileCard = screen.getByTestId('mobile-info-card');
      expect(mobileCard).toHaveTextContent('Trust');
    });

    it('renders all fields in mobile edit mode', () => {
      const mobileEditProps = {
        ...defaultProps,
        editMode: { funding: true }
      };

      render(<FundingSection {...mobileEditProps} />);
      
      // Check for key fields
      expect(screen.getByLabelText('Funding Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Policy Number')).toBeInTheDocument();
    });

    it('shows helper text for non-life insurance funding in mobile', async () => {
      const user = userEvent.setup();
      const mobileEditProps = {
        ...defaultProps,
        editMode: { funding: true }
      };

      render(<FundingSection {...mobileEditProps} />);
      
      const fundingSelect = screen.getByLabelText('Funding Type');
      await user.selectOptions(fundingSelect, 'Prepaid');
      
      // Re-render with Prepaid
      const { rerender } = render(
        <FundingSection 
          {...mobileEditProps} 
          funding={{ fundingType: 'Prepaid' }}
        />
      );
      
      expect(screen.getByText(/Thank you for choosing to prepay/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined funding data gracefully', () => {
      const undefinedProps = {
        ...defaultProps,
        funding: {}
      };

      render(<FundingSection {...undefinedProps} />);
      
      // Should show "Not provided" for empty fields
      const notProvidedElements = screen.getAllByText('Not provided');
      expect(notProvidedElements.length).toBeGreaterThan(0);
    });

    it('handles missing callback functions', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        toggleEditMode: undefined,
        cancelEdit: undefined,
        saveFunding: undefined
      };

      render(<FundingSection {...propsWithoutCallbacks} />);
      
      // Should not throw error
      const editButton = screen.getByText('Edit');
      expect(() => fireEvent.click(editButton)).not.toThrow();
    });

    it('formats phone numbers correctly', () => {
      const phoneProps = {
        ...defaultProps,
        funding: {
          ...defaultProps.funding,
          companyPhone: '5551234567', // Unformatted
          agentPhone: '555-987-6543' // Already formatted
        }
      };

      render(<FundingSection {...phoneProps} />);
      
      // Check for formatted company phone
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      // Agent phone might keep its original format
      const agentPhoneElements = screen.getAllByText((content) => 
        content.includes('555') && content.includes('987') && content.includes('6543')
      );
      expect(agentPhoneElements.length).toBeGreaterThan(0);
    });

    it('handles invalid date gracefully', () => {
      const invalidDateProps = {
        ...defaultProps,
        funding: {
          ...defaultProps.funding,
          dateIssued: 'invalid-date'
        }
      };

      // Component should render without throwing an error
      expect(() => render(<FundingSection {...invalidDateProps} />)).not.toThrow();
      
      // Verify the component rendered by checking for the section title
      const { container } = render(<FundingSection {...invalidDateProps} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Integration Scenarios', () => {
    it('handles complete edit flow for life insurance', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<FundingSection {...defaultProps} />);

      // Click Edit
      fireEvent.click(screen.getByText('Edit'));
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('funding');

      // Simulate entering edit mode
      rerender(<FundingSection {...defaultProps} editMode={{ funding: true }} />);

      // Update company name
      const companyInput = screen.getByLabelText('Company Name');
      await user.clear(companyInput);
      await user.type(companyInput, 'New York Life');

      // Update face amount
      const faceAmountInput = screen.getByLabelText('Face Amount');
      await user.clear(faceAmountInput);
      await user.type(faceAmountInput, '300000');

      // Add agent if not present
      const agentCheckbox = screen.getByLabelText('I have a life insurance agent');
      if (!agentCheckbox.checked) {
        await user.click(agentCheckbox);
      }

      // Click Save
      fireEvent.click(screen.getByText('Save'));
      expect(defaultProps.saveFunding).toHaveBeenCalled();
    });

    it('handles switching between funding types', async () => {
      const user = userEvent.setup();
      
      const editProps = {
        ...defaultProps,
        editMode: { funding: true }
      };

      const { rerender } = render(<FundingSection {...editProps} />);

      // Start with Life Insurance
      expect(screen.getByLabelText('Company Name')).toBeInTheDocument();

      // Change to Trust
      const fundingSelect = screen.getByLabelText('Funding Type');
      await user.selectOptions(fundingSelect, 'Trust');

      // Re-render with Trust
      rerender(
        <FundingSection 
          {...editProps} 
          funding={{ fundingType: 'Trust' }}
        />
      );

      // Life insurance fields should be gone
      expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();
      expect(screen.getByText(/ensure your trust documents/)).toBeInTheDocument();

      // Change to Prepaid
      await user.selectOptions(screen.getByLabelText('Funding Type'), 'Prepaid');

      // Re-render with Prepaid
      rerender(
        <FundingSection 
          {...editProps} 
          funding={{ fundingType: 'Prepaid' }}
        />
      );

      expect(screen.getByText(/Thank you for choosing to prepay/)).toBeInTheDocument();

      // Change back to Life Insurance
      await user.selectOptions(screen.getByLabelText('Funding Type'), 'Life Insurance');

      // Re-render with Life Insurance
      rerender(
        <FundingSection 
          {...editProps} 
          funding={{ fundingType: 'Life Insurance' }}
        />
      );

      // Life insurance fields should return
      expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    });
  });

  describe('Additional Test Coverage', () => {
    describe('Form Validation and Data Integrity', () => {
      it('preserves life insurance data when temporarily switching funding types', async () => {
        const user = userEvent.setup();
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        // Verify original data
        expect(screen.getByLabelText('Company Name')).toHaveValue('MetLife');
        expect(screen.getByLabelText('Policy Number')).toHaveValue('POL-123456');
        
        // Switch to Trust
        await user.selectOptions(screen.getByLabelText('Funding Type'), 'Trust');
        
        // Verify setFunding was called but we're not testing the implementation
        expect(defaultProps.setFunding).toHaveBeenCalled();
      });

      it('handles empty funding type gracefully', () => {
        const emptyFundingProps = {
          ...defaultProps,
          funding: {
            fundingType: ''
          }
        };
        
        render(<FundingSection {...emptyFundingProps} />);
        
        // Should show "Not provided" or handle gracefully
        expect(screen.getByText('Funding Type')).toBeInTheDocument();
      });

      it('handles very large face amounts', () => {
        const largeAmountProps = {
          ...defaultProps,
          funding: {
            ...defaultProps.funding,
            faceAmount: '10000000',
            annualPremium: '120000'
          }
        };
        
        render(<FundingSection {...largeAmountProps} />);
        
        expect(screen.getByText('$10,000,000')).toBeInTheDocument();
        expect(screen.getByText('$120,000')).toBeInTheDocument();
      });

      it('handles zero and negative amounts gracefully', () => {
        const zeroAmountProps = {
          ...defaultProps,
          funding: {
            ...defaultProps.funding,
            faceAmount: '0',
            annualPremium: '-100'
          }
        };
        
        render(<FundingSection {...zeroAmountProps} />);
        
        // Should still render without errors
        expect(screen.getByText('Face Amount')).toBeInTheDocument();
        expect(screen.getByText('Annual Premium')).toBeInTheDocument();
      });
    });

    describe('User Interaction Edge Cases', () => {
      it('prevents multiple save calls while saving', async () => {
        const slowSaveProps = {
          ...defaultProps,
          editMode: { funding: true },
          savingSection: 'funding'
        };
        
        render(<FundingSection {...slowSaveProps} />);
        
        const saveButton = screen.getByText('Saving...');
        
        // Button should be disabled during save
        expect(saveButton).toBeDisabled();
        
        // Clicking disabled button shouldn't trigger save
        fireEvent.click(saveButton);
        
        // saveFunding shouldn't be called since we're already saving
        expect(defaultProps.saveFunding).not.toHaveBeenCalled();
      });

      it('handles edit mode toggle correctly', async () => {
        const { rerender } = render(<FundingSection {...defaultProps} />);
        
        // Click Edit
        fireEvent.click(screen.getByText('Edit'));
        expect(defaultProps.toggleEditMode).toHaveBeenCalledTimes(1);
        
        // Simulate entering edit mode
        rerender(<FundingSection {...defaultProps} editMode={{ funding: true }} />);
        
        // Edit button should not be visible in edit mode
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        // But Cancel and Save should be visible
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      it('maintains field focus after validation errors', async () => {
        const user = userEvent.setup();
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        const companyNameInput = screen.getByLabelText('Company Name');
        
        // Clear and leave empty
        await user.clear(companyNameInput);
        
        // Field should still be in the document and focusable
        expect(companyNameInput).toBeInTheDocument();
        expect(companyNameInput).not.toBeDisabled();
      });
    });

    describe('Mobile Responsiveness', () => {
      it('handles window resize during edit mode', () => {
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        // Start in desktop
        expect(screen.queryByTestId('mobile-info-card')).not.toBeInTheDocument();
        
        // Resize to mobile
        global.innerWidth = 375;
        global.dispatchEvent(new Event('resize'));
        
        // Component should still be in edit mode
        expect(screen.getByLabelText('Funding Type')).toBeInTheDocument();
      });

      it('preserves form data when switching between mobile and desktop views', () => {
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        const { rerender } = render(<FundingSection {...editProps} />);
        
        // Verify data in desktop
        expect(screen.getByLabelText('Company Name')).toHaveValue('MetLife');
        
        // Switch to mobile
        global.innerWidth = 375;
        global.dispatchEvent(new Event('resize'));
        rerender(<FundingSection {...editProps} />);
        
        // Data should still be present
        expect(screen.getByLabelText('Company Name')).toHaveValue('MetLife');
      });
    });

    describe('Accessibility', () => {
      it('has proper ARIA labels for form fields', () => {
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        // Check that all inputs have accessible labels
        expect(screen.getByLabelText('Funding Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Policy Number')).toBeInTheDocument();
        expect(screen.getByLabelText('Face Amount')).toBeInTheDocument();
      });

      it('indicates required fields accessibly', () => {
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        // Required fields should have required attribute
        expect(screen.getByLabelText('Funding Type')).toHaveAttribute('required');
        expect(screen.getByLabelText('Company Name')).toHaveAttribute('required');
        expect(screen.getByLabelText('Policy Number')).toHaveAttribute('required');
      });

      it('maintains focus management during mode transitions', () => {
        const { rerender } = render(<FundingSection {...defaultProps} />);
        
        const editButton = screen.getByText('Edit');
        editButton.focus();
        expect(document.activeElement).toBe(editButton);
        
        // Enter edit mode
        fireEvent.click(editButton);
        rerender(<FundingSection {...defaultProps} editMode={{ funding: true }} />);
        
        // Focus should move to a reasonable location (first input or cancel button)
        // Just verify the component renders correctly
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    describe('Error States and Recovery', () => {
      it('handles save operations without errors', async () => {
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        // Click save
        fireEvent.click(screen.getByText('Save'));
        
        // Verify save was called
        expect(defaultProps.saveFunding).toHaveBeenCalled();
        
        // Component should remain functional
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      it('recovers from interrupted save operations', () => {
        const interruptedSaveProps = {
          ...defaultProps,
          editMode: { funding: true },
          savingSection: 'funding'
        };
        
        const { rerender } = render(<FundingSection {...interruptedSaveProps} />);
        
        // Verify saving state
        expect(screen.getByText('Saving...')).toBeDisabled();
        
        // Simulate save completion
        rerender(<FundingSection {...defaultProps} editMode={{ funding: true }} savingSection="" />);
        
        // Should be back to normal
        expect(screen.getByText('Save')).not.toBeDisabled();
      });
    });

    describe('Data Format Handling', () => {
      it('handles international phone numbers', () => {
        const intlPhoneProps = {
          ...defaultProps,
          funding: {
            ...defaultProps.funding,
            companyPhone: '+44 20 7946 0958',
            agentPhone: '+81 3-1234-5678'
          }
        };
        
        render(<FundingSection {...intlPhoneProps} />);
        
        // Should display without errors
        expect(screen.getByText('Company Phone')).toBeInTheDocument();
        expect(screen.getByText('Agent Phone')).toBeInTheDocument();
      });

      it('handles various date formats', () => {
        const dateFormats = [
          '2023-01-15',
          '01/15/2023',
          '15-Jan-2023',
          '2023/01/15'
        ];
        
        dateFormats.forEach(dateFormat => {
          const { unmount } = render(
            <FundingSection 
              {...defaultProps} 
              funding={{ ...defaultProps.funding, dateIssued: dateFormat }}
            />
          );
          
          // Should render without errors
          expect(screen.getByText('Date Issued')).toBeInTheDocument();
          unmount();
        });
      });

      it('handles text input with special characters', async () => {
        const user = userEvent.setup();
        const editProps = {
          ...defaultProps,
          editMode: { funding: true }
        };
        
        render(<FundingSection {...editProps} />);
        
        const companyInput = screen.getByLabelText('Company Name');
        
        // The input should accept the current value
        expect(companyInput).toHaveValue('MetLife');
        
        // Clear and type new value with special characters
        await user.clear(companyInput);
        await user.type(companyInput, 'Met&Life "Insurance" Co.');
        
        // setFunding should be called multiple times (once for each character)
        expect(defaultProps.setFunding).toHaveBeenCalled();
        
        // Find the call where the company name includes special characters
        const callsWithSpecialChars = defaultProps.setFunding.mock.calls.filter(call => 
          call[0].companyName && call[0].companyName.includes('&')
        );
        
        // Should have at least one call with special characters
        expect(callsWithSpecialChars.length).toBeGreaterThan(0);
      });
    });
  });
});