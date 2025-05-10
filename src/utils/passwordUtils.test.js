import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SignupPage from '../SignupPage';
import { checkPasswordStrength } from '../utils/passwordUtils'; // Assuming we extract these functions to utils

// Mock the imports and functions
jest.mock('../components/Banner', () => () => <div data-testid="banner" />);
jest.mock('../components/CircularProgress', () => () => <div data-testid="progress-bar" />);
jest.mock('../services/auth', () => ({
  requestEmailVerification: jest.fn().mockResolvedValue({ success: true, verificationId: '123' }),
  verifyEmailCodeOnly: jest.fn(),
  createOrSignInUser: jest.fn(),
  signInWithGoogle: jest.fn(),
  updateSignupProgress: jest.fn(),
  clearVerificationState: jest.fn(),
}));
jest.mock('../contexts/UserContext', () => ({
  useUser: jest.fn().mockReturnValue({ currentUser: null, signupState: null }),
  getVerificationState: jest.fn().mockReturnValue(null),
  saveVerificationState: jest.fn(),
}));
jest.mock('./signup/ContactInfoPage.jsx', () => () => <div>Contact Info Page</div>);

// Unit tests for the password strength checker function
describe('checkPasswordStrength', () => {
  test('returns lowest score for empty password', () => {
    const result = checkPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.isStrong).toBe(false);
    expect(result.isWeak).toBe(true);
    expect(result.meetsMinimumRequirements).toBe(false);
  });

  test('detects passwords with spaces', () => {
    const result = checkPasswordStrength('Test Password1');
    expect(result.score).toBeGreaterThan(0); // Should have some score
    expect(result.isStrong).toBe(false); // But should not be considered strong due to space
    expect(result.meetsMinimumRequirements).toBe(false);
  });

  test('scores short simple password as weak', () => {
    const result = checkPasswordStrength('pass123');
    expect(result.score).toBeLessThan(40);
    expect(result.isWeak).toBe(true);
    expect(result.meetsMinimumRequirements).toBe(false);
  });

  test('scores medium strength password correctly', () => {
    const result = checkPasswordStrength('Password123');
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.isMedium).toBe(true);
    expect(result.meetsMinimumRequirements).toBe(true);
  });

  test('scores strong password correctly', () => {
    const result = checkPasswordStrength('Password123!@#');
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.isStrong).toBe(true);
    expect(result.meetsMinimumRequirements).toBe(true);
  });
});

// Tests for isValidPassword function
describe('isValidPassword validation', () => {
  // Since isValidPassword is not directly exported, we'll test it through component behavior
  
  let originalConsoleError;
  
  beforeEach(() => {
    // Suppress expected console errors from failing validations
    originalConsoleError = console.error;
    console.error = jest.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('rejects passwords with spaces', async () => {
    render(<SignupPage />);
    
    // Fill in form data
    userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
    userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    userEvent.type(screen.getByLabelText(/Password/i), 'Password With Spaces123');
    
    // Check terms
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    // Submit form
    const submitButton = screen.getByText(/Get Started/i);
    fireEvent.click(submitButton);
    
    // Check for error message about spaces
    await waitFor(() => {
      expect(screen.getByText(/Password cannot contain spaces/i)).toBeInTheDocument();
    });
  });
  
  test('rejects password missing uppercase letter', async () => {
    render(<SignupPage />);
    
    userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
    userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    userEvent.type(screen.getByLabelText(/Password/i), 'password123');
    
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    const submitButton = screen.getByText(/Get Started/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 8 characters with uppercase letters/i)).toBeInTheDocument();
    });
  });
  
  test('rejects password missing lowercase letter', async () => {
    render(<SignupPage />);
    
    userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
    userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    userEvent.type(screen.getByLabelText(/Password/i), 'PASSWORD123');
    
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    const submitButton = screen.getByText(/Get Started/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 8 characters with uppercase letters, lowercase letters/i)).toBeInTheDocument();
    });
  });
  
  test('rejects password missing number', async () => {
    render(<SignupPage />);
    
    userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
    userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    userEvent.type(screen.getByLabelText(/Password/i), 'PasswordNoNumbers');
    
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    const submitButton = screen.getByText(/Get Started/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/must be at least 8 characters with uppercase letters, lowercase letters, and numbers/i)).toBeInTheDocument();
    });
  });
  
  test('accepts valid password', async () => {
    // Mock the auth service to simulate success
    const mockRequestEmail = require('../services/auth').requestEmailVerification;
    mockRequestEmail.mockResolvedValue({ success: true, verificationId: '123456' });
    
    render(<SignupPage />);
    
    userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
    userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    userEvent.type(screen.getByLabelText(/Password/i), 'ValidPassword123');
    
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    const submitButton = screen.getByText(/Get Started/i);
    fireEvent.click(submitButton);
    
    // If validation passes, we should call the email verification service
    await waitFor(() => {
      expect(mockRequestEmail).toHaveBeenCalledWith('test@example.com', 'Test User');
    });
  });
});

// Test for password input field and automatic space removal
describe('PasswordField component', () => {
  test('automatically removes spaces from password input', () => {
    render(<SignupPage />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    
    // Type a password with spaces
    userEvent.type(passwordInput, 'Pass word 123');
    
    // Check that spaces were automatically removed
    expect(passwordInput.value).toBe('Password123');
  });
  
  test('displays password requirements when user starts typing', () => {
    render(<SignupPage />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    
    // Initially, requirements should not be visible
    expect(screen.queryByText(/Password must have:/i)).not.toBeInTheDocument();
    
    // Start typing in password field
    userEvent.type(passwordInput, 'P');
    
    // Requirements should now be visible
    expect(screen.getByText(/Password must have:/i)).toBeInTheDocument();
    expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/Lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/Number/i)).toBeInTheDocument();
    expect(screen.getByText(/Special character/i)).toBeInTheDocument();
  });
  
  test('toggle password visibility button works', () => {
    render(<SignupPage />);
    
    const passwordInput = screen.getByLabelText(/Password/i);
    
    // Password should be hidden initially
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Find and click the toggle button
    const toggleButton = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleButton);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    fireEvent.click(toggleButton);
    
    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

// Integration test for form submission with spaces in password
describe('Form submission with password validation', () => {
  test('handleSubmit removes spaces before validation', async () => {
    // Mock the auth service to simulate success
    const mockRequestEmail = require('../services/auth').requestEmailVerification;
    mockRequestEmail.mockResolvedValue({ success: true, verificationId: '123456' });
    
    render(<SignupPage />);
    
    // Fill form with valid data except password has spaces
    userEvent.type(screen.getByLabelText(/Full Name/i), 'Test User');
    userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com');
    
    // Type password with spaces, they should be automatically removed
    const passwordInput = screen.getByLabelText(/Password/i);
    userEvent.type(passwordInput, 'Valid Pass word 123');
    
    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    
    // Submit form
    const submitButton = screen.getByText(/Get Started/i);
    fireEvent.click(submitButton);
    
    // The cleaned password should pass validation and the form should be submitted
    await waitFor(() => {
      expect(mockRequestEmail).toHaveBeenCalledWith('test@example.com', 'Test User');
    });
  });
});