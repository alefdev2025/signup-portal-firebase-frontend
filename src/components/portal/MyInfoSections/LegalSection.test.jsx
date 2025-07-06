import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LegalSection from './LegalSection';

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
  Select: ({ label, children, value, onChange, disabled, error, required, ...props }) => (
    <div>
      <label>{label}{required && ' *'}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        aria-invalid={!!error}
        aria-required={required}
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
  Section: ({ children }) => <section>{children}</section>
}));

jest.mock('../WebsiteButtonStyle', () => ({
  RainbowButton: ({ text, onClick, disabled, className, spinStar }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {text}
    </button>
  ),
  WhiteButton: ({ text, onClick, disabled, className, spinStar }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {text}
    </button>
  ),
  PurpleButton: ({ text, onClick, disabled, className, spinStar }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {text}
    </button>
  ),
}));

// Mock styleConfig
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
    sectionIcons: { legal: 'legal-icon' },
    display: {
      dl: { 
        wrapperSingle: 'wrapper-single',
        wrapperThree: 'wrapper-three' 
      },
      item: {
        label: 'item-label',
        value: 'item-value',
        empty: 'Not specified'
      }
    },
    form: { 
      label: 'form-label',
      fieldSpacing: 'field-spacing' 
    }
  }
}));

jest.mock('./MobileInfoCard', () => ({
  MobileInfoCard: ({ children, title, preview, subtitle, isEditMode, iconComponent }) => (
    <div data-testid="mobile-info-card" data-edit-mode={isEditMode}>
      <div data-testid="mobile-icon">{iconComponent}</div>
      <h3>{title}</h3>
      <p data-testid="mobile-preview">{preview}</p>
      <p>{subtitle}</p>
      <div>{children}</div>
    </div>
  ),
  DisplayField: ({ label, value }) => (
    <div data-testid="display-field">
      <dt>{label}</dt>
      <dd>{value || 'Not specified'}</dd>
    </div>
  ),
  FormInput: ({ label, value, onChange, disabled, error, required, ...props }) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
        required={required}
        {...props}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  FormSelect: ({ label, children, value, onChange, disabled, error, required }) => (
    <div>
      <label>{label}</label>
      <select 
        value={value} 
        onChange={onChange} 
        disabled={disabled} 
        aria-label={label}
        required={required}
      >
        {children}
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  ActionButtons: ({ editMode, onEdit, onSave, onCancel, saving }) => (
    <div data-testid="action-buttons">
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

// Mock lucide-react
jest.mock('lucide-react', () => ({
  HelpCircle: ({ className, strokeWidth, onClick }) => (
    <div 
      data-testid="help-circle" 
      className={className}
      onClick={onClick}
    >
      HelpCircle Icon
    </div>
  )
}));

describe('LegalSection', () => {
  const defaultProps = {
    legal: {
      hasWill: 'Yes',
      willContraryToCryonics: 'No'
    },
    setLegal: jest.fn(),
    editMode: { legal: false },
    toggleEditMode: jest.fn(),
    cancelEdit: jest.fn(),
    saveLegal: jest.fn(),
    savingSection: '',
    memberCategory: 'CryoMember'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.innerWidth for desktop view
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  describe('Display Mode', () => {
    it('renders all legal information in display mode', () => {
      render(<LegalSection {...defaultProps} />);

      expect(screen.getByText('Legal/Will Information')).toBeInTheDocument();
      expect(screen.getByText('Do you have a will?')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('shows "Not specified" for empty fields', () => {
      const propsWithEmptyFields = {
        ...defaultProps,
        legal: {
          hasWill: '',
          willContraryToCryonics: ''
        }
      };

      render(<LegalSection {...propsWithEmptyFields} />);
      
      const notSpecifiedElements = screen.getAllByText('Not specified');
      expect(notSpecifiedElements).toHaveLength(1); // Only hasWill shows when empty
    });

    it('only shows contrary provisions question when hasWill is Yes', () => {
      const propsWithNoWill = {
        ...defaultProps,
        legal: {
          hasWill: 'No',
          willContraryToCryonics: ''
        }
      };

      render(<LegalSection {...propsWithNoWill} />);
      
      expect(screen.getByText('Do you have a will?')).toBeInTheDocument();
      expect(screen.queryByText('Does your will contain any provisions contrary to cryonics?')).not.toBeInTheDocument();
    });

    it('calls toggleEditMode when Edit button is clicked', () => {
      render(<LegalSection {...defaultProps} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('legal');
    });

    it('shows required asterisk for CryoApplicant member category', () => {
      const requiredProps = {
        ...defaultProps,
        memberCategory: 'CryoApplicant'
      };

      render(<LegalSection {...requiredProps} />);
      
      expect(screen.getByText(/Information about your will and cryonics-related provisions\./)).toBeInTheDocument();
      // Check for asterisk in subtitle
      const subtitle = screen.getByText(/Information about your will and cryonics-related provisions\./);
      expect(subtitle.parentElement.innerHTML).toContain('*');
    });

    it('does not show required asterisk for other member categories', () => {
      const nonRequiredProps = {
        ...defaultProps,
        memberCategory: 'Associate'
      };

      render(<LegalSection {...nonRequiredProps} />);
      
      const subtitle = screen.getByText(/Information about your will and cryonics-related provisions\./);
      expect(subtitle.parentElement.innerHTML).not.toContain('*');
    });
  });

  describe('Edit Mode', () => {
    const editModeProps = {
      ...defaultProps,
      editMode: { legal: true }
    };

    it('renders form fields in edit mode', () => {
      render(<LegalSection {...editModeProps} />);

      const hasWillSelect = screen.getByLabelText('Do you have a will?');
      expect(hasWillSelect).toHaveValue('Yes');
      
      const contraryProvisionsSelect = screen.getByLabelText('Does your will contain any provisions contrary to cryonics?');
      expect(contraryProvisionsSelect).toHaveValue('No');
    });

    it('shows required asterisk on form fields for CryoMember', () => {
      render(<LegalSection {...editModeProps} />);

      expect(screen.getByText('Do you have a will? *')).toBeInTheDocument();
      expect(screen.getByText('Does your will contain any provisions contrary to cryonics? *')).toBeInTheDocument();
    });

    it('updates legal info when selecting different will option', () => {
      render(<LegalSection {...editModeProps} />);

      const hasWillSelect = screen.getByLabelText('Do you have a will?');
      fireEvent.change(hasWillSelect, { target: { value: 'No' } });

      expect(defaultProps.setLegal).toHaveBeenCalledWith({
        hasWill: 'No',
        willContraryToCryonics: 'No'
      });
    });

    it('hides contrary provisions field when hasWill is No', () => {
      const noWillProps = {
        ...editModeProps,
        legal: {
          hasWill: 'No',
          willContraryToCryonics: ''
        }
      };

      render(<LegalSection {...noWillProps} />);

      expect(screen.getByLabelText('Do you have a will?')).toBeInTheDocument();
      expect(screen.queryByLabelText('Does your will contain any provisions contrary to cryonics?')).not.toBeInTheDocument();
    });

    it('shows warning message when will has contrary provisions', () => {
      const contraryProps = {
        ...editModeProps,
        legal: {
          hasWill: 'Yes',
          willContraryToCryonics: 'Yes'
        }
      };

      render(<LegalSection {...contraryProps} />);

      expect(screen.getByText(/Action Required:/)).toBeInTheDocument();
      expect(screen.getByText(/it is your responsibility to change it through a new codicil or a new will/)).toBeInTheDocument();
    });

    it('calls cancelEdit when Cancel button is clicked', () => {
      render(<LegalSection {...editModeProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.cancelEdit).toHaveBeenCalledWith('legal');
    });

    it('calls saveLegal when Save button is clicked', () => {
      render(<LegalSection {...editModeProps} />);
      
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);
      
      expect(defaultProps.saveLegal).toHaveBeenCalled();
    });



    it('shows saved state after successful save', () => {
      const savedProps = {
        ...editModeProps,
        savingSection: 'saved'
      };

      render(<LegalSection {...savedProps} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  describe('Info Notice and Tooltip', () => {
    it('renders info notice in display mode', () => {
      render(<LegalSection {...defaultProps} />);

      expect(screen.getByText('Have Questions About Wills?')).toBeInTheDocument();
      expect(screen.getByText('Learn about will requirements and cryonics provisions')).toBeInTheDocument();
    });

    it('shows tooltip when help icon is clicked', () => {
      render(<LegalSection {...defaultProps} />);

      const helpIcon = screen.getByTestId('help-circle');
      fireEvent.click(helpIcon);

      expect(screen.getByText('Why Does Alcor Need This?')).toBeInTheDocument();
      expect(screen.getByText(/Alcor does not require that you have a will/)).toBeInTheDocument();
    });

    it('closes tooltip when clicking outside', () => {
      render(<LegalSection {...defaultProps} />);

      // Open tooltip
      const helpIcon = screen.getByTestId('help-circle');
      fireEvent.click(helpIcon);
      expect(screen.getByText('Why Does Alcor Need This?')).toBeInTheDocument();

      // Click outside
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('Why Does Alcor Need This?')).not.toBeInTheDocument();
    });

    it('closes tooltip when close button is clicked', () => {
      render(<LegalSection {...defaultProps} />);

      // Open tooltip
      const helpIcon = screen.getByTestId('help-circle');
      fireEvent.click(helpIcon);

      // Find and click close button (X)
      const closeButton = screen.getByRole('button', { name: '' });
      const svgCloseButtons = Array.from(closeButton.parentElement.querySelectorAll('button')).filter(
        btn => btn.querySelector('svg')
      );
      fireEvent.click(svgCloseButtons[svgCloseButtons.length - 1]);

      expect(screen.queryByText('Why Does Alcor Need This?')).not.toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      // Mock window.innerWidth for mobile view
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('renders MobileInfoCard in mobile view', () => {
      render(<LegalSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-info-card')).toBeInTheDocument();
      expect(screen.getByText('Legal/Will Information')).toBeInTheDocument();
    });

    it('shows correct preview in mobile view', () => {
      render(<LegalSection {...defaultProps} />);
      
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('Will: Yes • Contrary provisions: No');
    });

    it('shows simplified preview when no will', () => {
      const noWillProps = {
        ...defaultProps,
        legal: {
          hasWill: 'No',
          willContraryToCryonics: ''
        }
      };

      render(<LegalSection {...noWillProps} />);
      
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('Will: No');
    });

    it('shows "No information provided" when legal data is empty', () => {
      const emptyProps = {
        ...defaultProps,
        legal: {
          hasWill: '',
          willContraryToCryonics: ''
        }
      };

      render(<LegalSection {...emptyProps} />);
      
      expect(screen.getByTestId('mobile-preview')).toHaveTextContent('No information provided');
    });

    it('renders display fields in mobile view', () => {
      render(<LegalSection {...defaultProps} />);

      const displayFields = screen.getAllByTestId('display-field');
      expect(displayFields).toHaveLength(2);
      expect(screen.getByText('Do you have a will?')).toBeInTheDocument();
      expect(screen.getByText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
    });

    it('renders form fields in mobile edit mode', () => {
      const mobileEditProps = {
        ...defaultProps,
        editMode: { legal: true }
      };

      render(<LegalSection {...mobileEditProps} />);

      expect(screen.getByLabelText('Do you have a will?')).toBeInTheDocument();
      expect(screen.getByLabelText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
    });

    it('shows mobile-specific tooltip styling', () => {
      render(<LegalSection {...defaultProps} />);

      const helpIcon = screen.getByTestId('help-circle');
      fireEvent.click(helpIcon);

      // Find the tooltip container (has the rounded-lg and shadow-xl classes)
      const tooltipContainer = screen.getByText('Why Does Alcor Need This?').closest('.rounded-lg');
      expect(tooltipContainer.className).toContain('w-80'); // Mobile width
    });
  });

  describe('Integration Scenarios', () => {
    it('handles complete edit flow: edit -> modify -> save', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<LegalSection {...defaultProps} />);

      // Click Edit
      fireEvent.click(screen.getByText('Edit'));
      expect(defaultProps.toggleEditMode).toHaveBeenCalledWith('legal');

      // Simulate entering edit mode
      rerender(<LegalSection {...defaultProps} editMode={{ legal: true }} />);

      // Change hasWill to No
      const hasWillSelect = screen.getByLabelText('Do you have a will?');
      fireEvent.change(hasWillSelect, { target: { value: 'No' } });

      // Click Save
      fireEvent.click(screen.getByText('Save'));
      expect(defaultProps.saveLegal).toHaveBeenCalled();
    });

    it('handles will change flow: No -> Yes -> set contrary provisions', () => {
      const props = {
        ...defaultProps,
        editMode: { legal: true },
        legal: {
          hasWill: 'No',
          willContraryToCryonics: ''
        }
      };

      const { rerender } = render(<LegalSection {...props} />);

      // Initially, contrary provisions field should not be visible
      expect(screen.queryByLabelText('Does your will contain any provisions contrary to cryonics?')).not.toBeInTheDocument();

      // Change to Yes
      const hasWillSelect = screen.getByLabelText('Do you have a will?');
      fireEvent.change(hasWillSelect, { target: { value: 'Yes' } });

      // Update props to reflect the change
      const updatedProps = {
        ...props,
        legal: {
          hasWill: 'Yes',
          willContraryToCryonics: ''
        }
      };
      rerender(<LegalSection {...updatedProps} />);

      // Now contrary provisions field should be visible
      expect(screen.getByLabelText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
    });

    it('handles edge case: boolean values for hasWill', () => {
      const booleanProps = {
        ...defaultProps,
        legal: {
          hasWill: true,
          willContraryToCryonics: 'No'
        }
      };

      render(<LegalSection {...booleanProps} />);

      // Should still show contrary provisions question
      expect(screen.getByText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
    });

    it('handles edge case: string "true" value for hasWill', () => {
      const stringTrueProps = {
        ...defaultProps,
        legal: {
          hasWill: 'true',
          willContraryToCryonics: 'No'
        }
      };

      render(<LegalSection {...stringTrueProps} />);

      // Should still show contrary provisions question
      expect(screen.getByText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on form elements', () => {
      const editProps = {
        ...defaultProps,
        editMode: { legal: true }
      };

      render(<LegalSection {...editProps} />);

      expect(screen.getByLabelText('Do you have a will?')).toBeInTheDocument();
      expect(screen.getByLabelText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
    });

    it('marks required fields appropriately', () => {
      const editProps = {
        ...defaultProps,
        editMode: { legal: true },
        memberCategory: 'CryoApplicant'
      };

      render(<LegalSection {...editProps} />);

      const hasWillSelect = screen.getByLabelText('Do you have a will?');
      expect(hasWillSelect).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Component State Management', () => {
    it('preserves legal data when toggling edit mode', () => {
      const { rerender } = render(<LegalSection {...defaultProps} />);

      // Verify initial display
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();

      // Enter edit mode
      rerender(<LegalSection {...defaultProps} editMode={{ legal: true }} />);
      expect(screen.getByLabelText('Do you have a will?')).toHaveValue('Yes');

      // Exit edit mode
      rerender(<LegalSection {...defaultProps} editMode={{ legal: false }} />);
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('handles missing legal prop gracefully', () => {
      // Test with empty object instead of null/undefined
      // The component should handle this case
      const propsWithEmptyLegal = {
        ...defaultProps,
        legal: {}
      };

      render(<LegalSection {...propsWithEmptyLegal} />);

      // Should render without crashing and show default empty state
      expect(screen.getByText('Legal/Will Information')).toBeInTheDocument();
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('component needs fix for null/undefined legal prop', () => {
      // This test documents that the component currently doesn't handle null/undefined legal prop
      // When the component is fixed to handle this gracefully, this test should be updated
      const propsWithNullLegal = {
        ...defaultProps,
        legal: null
      };

      // Currently throws TypeError - component should be updated to handle this
      expect(() => {
        render(<LegalSection {...propsWithNullLegal} />);
      }).toThrow(TypeError);
    });

    it('handles empty legal object', () => {
      const propsWithEmptyLegal = {
        ...defaultProps,
        legal: {}
      };

      render(<LegalSection {...propsWithEmptyLegal} />);

      // Should render with empty/default values
      expect(screen.getByText('Legal/Will Information')).toBeInTheDocument();
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('handles legal prop with partial data', () => {
      const propsWithPartialLegal = {
        ...defaultProps,
        legal: {
          hasWill: 'Yes'
          // willContraryToCryonics is missing
        }
      };

      render(<LegalSection {...propsWithPartialLegal} />);

      expect(screen.getByText('Yes')).toBeInTheDocument();
      // Should still show contrary provisions question with default value
      expect(screen.getByText('Does your will contain any provisions contrary to cryonics?')).toBeInTheDocument();
      expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0);
    });
  });
});