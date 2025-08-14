// PortalSetupPage.jsx - Updated implementation with applicant handling feature flag

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveBanner from '../components/ResponsiveBanner';
import darkLogo from "../assets/images/alcor-white-logo.png";
import PasswordField, { checkPasswordStrength } from '../components/signup/PasswordField';
import TwoFactorSetup from './TwoFactorSetup'; // Import from adjacent file
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { sendPortalWelcomeNotification } from '../services/notifications';
import { 
  requestPortalEmailVerification,
  verifyPortalCode,
  createPortalAccountWithPassword,
  formatAlcorId,
  checkMemberAccount
} from '../services/auth';

// FEATURE FLAG: Set to true to allow applicants to create portal accounts
const ALLOW_APPLICANT_PORTAL_ACCESS = true;

const PortalSetupPage = () => {
  const [step, setStep] = useState('email'); // 'email', 'alcorId', 'verify', 'password', '2fa-choice', '2fa-setup', 'noAccount', 'existingAccount', 'applicantMessage'
  const [formData, setFormData] = useState({
    email: '',
    alcorId: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [salesforceData, setSalesforceData] = useState(null);
  const [verificationId, setVerificationId] = useState('');
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const pageTopRef = useRef(null);

  // Force scroll to top function
  const forceScrollToTop = () => {
    // Method 1: Use ref if available
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    
    // Method 2: Force layout recalculation
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Method 3: Use requestAnimationFrame for next paint
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  };

  // Scroll to top when step changes
  useEffect(() => {
    forceScrollToTop();
  }, [step]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format Alcor ID as user types
    if (name === 'alcorId') {
      setFormData(prev => ({
        ...prev,
        [name]: formatAlcorId(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors and success messages when user types
    if (error) {
      setError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Step 1: Check email in backend - SECURE VERSION
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Calling checkMemberAccount with email:', formData.email);
      const result = await checkMemberAccount(formData.email);
      console.log('checkMemberAccount result:', result);
      
      // ALWAYS show the same success message
      setSuccessMessage('If an account exists with this email, you\'ll receive a verification code.');
      
      if (!result.success || !result.hasAccount) {
        // No account - just show success message but don't actually proceed
        // Don't reveal that no account was found
        setLoading(false);
        return;
      }
      
      if (result.requiresAlcorId) {
        // Multiple accounts - need Alcor ID
        // Don't reveal this until AFTER they verify email
        // Store this info for later
        sessionStorage.setItem('pendingMultipleAccounts', 'true');
        sessionStorage.setItem('pendingAccountCount', result.count.toString());
        
        // Just send verification to the email
        // Pick the first account for now
        const customerData = result.data[0];
        setSalesforceData(customerData);
        await sendVerificationEmail(customerData);
      } else {
        // Single account found
        const customerData = result.data[0];
        setSalesforceData(customerData);
        await sendVerificationEmail(customerData);
      }
    } catch (err) {
      console.error('Email check error:', err);
      // Don't reveal specific errors
      setSuccessMessage('If an account exists with this email, you\'ll receive a verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Alcor ID submission (after email verification)
  const handleAlcorIdSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.alcorId) {
      setError('Please enter your Alcor ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await checkMemberAccount(formData.email, formData.alcorId);
      
      if (!result.success) {
        setError(result.error || 'Invalid Alcor ID or email combination');
        return;
      }
      
      if (!result.hasAccount || !result.data) {
        setError('No account found with this Alcor ID and email combination.');
        return;
      }
      
      // For Alcor ID search, data might be an object or single item in array
      const customerData = result.data.id ? result.data : result.data[0];
      setSalesforceData(customerData);
      
      // Continue to password step
      setStep('password');
      setSuccessMessage('Account verified! Now create your password.');
    } catch (err) {
      console.error('Alcor ID check error:', err);
      setError('Invalid Alcor ID. Please check your A-number and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send verification email - SIMPLIFIED VERSION
  const sendVerificationEmail = async (accountData) => {
    try {
      if (!accountData) {
        throw new Error('No account data available');
      }
      
      // Just send the verification email
      const firstName = accountData.firstName || '';
      const lastName = accountData.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Member';
      
      const result = await requestPortalEmailVerification({
        email: formData.email,
        name: fullName,
        alcorId: accountData.alcorId || '', // Empty string for applicants is OK
        salesforceContactId: accountData.id || accountData.salesforceContactId || ''
      });
      
      if (result.success) {
        setVerificationId(result.verificationId);
        setStep('verify');
        // Don't show success message here - the generic message is already shown
      } else {
        // Don't reveal error details
        console.error('Failed to send verification:', result.error);
      }
    } catch (err) {
      console.error('Verification email error:', err);
      // Don't reveal error details
    }
  };

  // Step 3: Verify code - WITH ALL CHECKS MOVED HERE
  const handleCodeVerification = async (e) => {
    e.preventDefault();
    
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await verifyPortalCode(
        formData.email,
        formData.verificationCode
      );
      
      if (result.success) {
        // NOW do all checks after successful verification
        
        // Check if we stored multiple accounts flag
        const hasMultipleAccounts = sessionStorage.getItem('pendingMultipleAccounts') === 'true';
        
        if (hasMultipleAccounts) {
          // NOW we can reveal they have multiple accounts and ask for Alcor ID
          const accountCount = sessionStorage.getItem('pendingAccountCount') || 'multiple';
          sessionStorage.removeItem('pendingMultipleAccounts');
          sessionStorage.removeItem('pendingAccountCount');
          
          setStep('alcorId');
          setSuccessMessage(`Found ${accountCount} accounts with this email. Please enter your A-number to continue.`);
          return;
        }
        
        // 1. Check if portal account already exists
        try {
          console.log('Checking if portal account already exists for:', formData.email);
          const authCoreFn = httpsCallable(functions, 'authCore');
          const portalCheckResult = await authCoreFn({
            action: 'checkPortalAccountExists',
            email: formData.email,
            verificationId: verificationId
          });
          
          console.log('Portal check result:', portalCheckResult.data);
          
          if (portalCheckResult.data?.hasPortalAccount) {
            // User already has a portal account
            console.log('Portal account already exists!');
            setStep('existingAccount');
            forceScrollToTop();
            return;
          }
        } catch (checkError) {
          console.error('Error checking portal account:', checkError);
          // Continue with normal flow if check fails
        }
        
        // 2. Check if this is an applicant and if they're allowed
        const isApplicant = !salesforceData.alcorId;
        if (isApplicant) {
          console.log('Applicant detected - no Alcor ID assigned yet');
          console.log('ALLOW_APPLICANT_PORTAL_ACCESS flag:', ALLOW_APPLICANT_PORTAL_ACCESS);
          
          if (!ALLOW_APPLICANT_PORTAL_ACCESS) {
            // Show applicant message (not allowed)
            setStep('applicantMessage');
            forceScrollToTop();
            return;
          }
          
          // If feature flag is enabled, continue with portal creation for applicants
          console.log('Applicant portal access is enabled, continuing to password step');
        }
        
        // 3. No existing portal account and allowed to proceed - continue with setup
        setStep('password');
        setSuccessMessage('Email verified! Now create your password.');
      } else {
        setError(result.error || 'Invalid verification code.');
      }
    } catch (err) {
      console.error('Code verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create account with password
  const handleAccountCreation = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!formData.password || !formData.confirmPassword) {
      setError('Please enter and confirm your password');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Use the same password strength validation
    const passwordStrength = checkPasswordStrength(formData.password);
    if (!passwordStrength.meetsMinimumRequirements) {
      setError('Password does not meet minimum requirements. Please create a stronger password.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if this is an applicant
      const isApplicant = !salesforceData.alcorId;
      
      if (isApplicant && ALLOW_APPLICANT_PORTAL_ACCESS) {
        // Handle applicant portal creation differently
        console.log('Creating portal account for applicant');
        
        // You might want to call a different backend function for applicants
        // For now, we'll use the same function but with empty alcorId
        const result = await createPortalAccountWithPassword({
          email: formData.email,
          password: formData.password,
          verificationId: verificationId,
          alcorId: '', // Empty for applicants
          firstName: salesforceData.firstName,
          lastName: salesforceData.lastName,
          salesforceContactId: salesforceData.id || salesforceData.salesforceContactId
        });
        
        if (result.success) {
          // Applicants might not need 2FA setup
          setSuccessMessage('Portal account created successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/portal-login?setup=complete&userType=applicant');
          }, 2000);
        } else {
          setError(result.error || 'Failed to create account.');
        }
        
        return;
      }
      
      // Regular member portal creation
      const result = await createPortalAccountWithPassword({
        email: formData.email,
        password: formData.password,
        verificationId: verificationId,
        alcorId: salesforceData.alcorId,
        firstName: salesforceData.firstName,
        lastName: salesforceData.lastName,
        salesforceContactId: salesforceData.id || salesforceData.salesforceContactId
      });
      
      // DEBUG: Log the entire result to see what's being returned
      console.log('Account creation result:', result);
      console.log('Result success:', result.success);
      console.log('Result requires2FASetup:', result.requires2FASetup);
      console.log('Result qrCode:', result.qrCode);
      console.log('Result secret:', result.secret);
      console.log('Result userId:', result.userId);
      
      if (result.success) {
        if (result.requires2FASetup) {
          // DEBUG: Log what we're setting in twoFactorData
          const twoFAData = {
            qrCode: result.qrCode || result.qrCodeUrl || result.qr_code || result.qrcode,
            secret: result.secret || result.totpSecret || result.totp_secret,
            userId: result.userId || result.user_id
          };
          
          console.log('Setting twoFactorData to:', twoFAData);
          
          // Check if we actually have a QR code
          if (!twoFAData.qrCode) {
            console.error('No QR code found in result. Checking all fields:', Object.keys(result));
            setError('2FA setup data is missing. Please contact support.');
            return;
          }
          
          // Show 2FA choice screen
          setTwoFactorData(twoFAData);
          setStep('2fa-choice');
          setSuccessMessage('Account created! Now choose whether to set up two-factor authentication.');
          
          // Force scroll with multiple attempts
          forceScrollToTop();
          
          // Try again after state updates
          setTimeout(() => {
            forceScrollToTop();
            // Also try focusing on a specific element
            const heading = document.querySelector('h2');
            if (heading) {
              heading.focus();
              heading.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
          }, 100);
        } else {
          // Success - redirect to login
          setSuccessMessage('Portal account created successfully! Redirecting to login...');

          setTimeout(() => {
            navigate('/portal-login?setup=complete');
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to create account.');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/portal-login');
  };

  // Handle 2FA setup success
  const handle2FASuccess = () => {
    navigate('/portal-login?setup=complete&2fa=enabled');
  };

  // Handle 2FA skip
  const handle2FASkip = () => {
    navigate('/portal-login?setup=complete');
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Create Portal Account
            </h2>
            
            <p className="text-gray-600 mb-6">
              If an application or membership account exists for this email, you'll receive a verification code.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-800 text-base font-medium mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </div>
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={handleGoBack}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        );

      case 'alcorId':
        return (
          <form onSubmit={handleAlcorIdSubmit} className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Enter Your Alcor ID
            </h2>
            
            <p className="text-gray-600 mb-6">
              Multiple accounts found with email: <strong>{formData.email}</strong><br/>
              Please enter your A-number to identify your account.
            </p>
            
            {successMessage && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="alcorId" className="block text-gray-800 text-base font-medium mb-2">
                Alcor ID (A-Number) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="alcorId"
                name="alcorId"
                value={formData.alcorId}
                onChange={handleInputChange}
                placeholder="e.g. A-1234" 
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
                disabled={loading}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Your A-number can be found on your membership documents
              </p>
            </div>
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
            </div>
          </form>
        );

      case 'verify':
        return (
          <form onSubmit={handleCodeVerification} className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Verify Your Email
            </h2>
            
            <p className="text-gray-600 mb-6">
              Enter the 6-digit verification code sent to <strong>{formData.email}</strong>
            </p>
            
            {successMessage && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="verificationCode" className="block text-gray-800 text-base font-medium mb-2">
                Verification Code <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit code" 
                maxLength="6"
                className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base text-center tracking-widest font-mono"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Didn't receive the code? Check your spam folder or contact support.
            </p>
          </form>
        );

      case 'password':
        return (
          <form onSubmit={handleAccountCreation} className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Create Your Password
            </h2>
            
            {salesforceData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Account:</strong> {salesforceData.firstName} {salesforceData.lastName}<br/>
                  {salesforceData.alcorId ? (
                    <><strong>Member ID:</strong> {salesforceData.alcorId}</>
                  ) : (
                    <><strong>Status:</strong> Applicant (Pending A-number)</>
                  )}
                </p>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            {/* Use PasswordField component with custom className */}
            <PasswordField
              value={formData.password}
              onChange={(e) => handleInputChange(e)}
              isSubmitting={loading}
              error=""
              id="password"
              name="password"
              label="Password"
              placeholder="Create a secure password"
              className="mb-6"
              inputClassName="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base pr-12"
              labelClassName="block text-gray-800 text-base font-medium mb-2"
            />
            
            {/* Confirm Password */}
            <PasswordField
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange(e)}
              isSubmitting={loading}
              error=""
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter your password"
              className="mb-8"
              inputClassName="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base pr-12"
              labelClassName="block text-gray-800 text-base font-medium mb-2"
            />
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading || !checkPasswordStrength(formData.password).meetsMinimumRequirements}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {loading ? 'Creating Account...' : 'Create Portal Account'}
              </button>
            </div>
          </form>
        );

      case '2fa-choice':
        return (
          <div className="p-8" tabIndex={-1} ref={el => el && el.focus()}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2" tabIndex={-1}>
              Account Created Successfully!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your portal account is ready to use. Would you like to add two-factor authentication for extra security?
            </p>
            
            {/* Success message banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Portal Access Enabled
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    You can now log in to your member portal using your email and password.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 2FA information
            <div className="bg-gray-100 border border-gray-300 rounded-md p-4 mb-8">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Why use two-factor authentication?
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Adds an extra layer of security to your account</li>
                <li>Protects against unauthorized access even if your password is compromised</li>
                <li>Required by many organizations for sensitive data protection</li>
                <li>Can be set up now or anytime later from your account settings</li>
              </ul>
            </div> */}
            
            {/* Main action buttons */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/portal-login?setup=complete')}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base hover:opacity-90 flex items-center justify-center"
              >
                Continue to Portal
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => setStep('2fa-setup')}
                className="w-full bg-white border-2 border-purple-600 text-purple-700 py-3 px-6 rounded-full font-medium text-base hover:bg-purple-50"
              >
                Set Up 2FA Now (Recommended)
              </button>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              You can always enable two-factor authentication later from your account settings.
            </p>
          </div>
        );

      case '2fa-setup':
        return (
          <TwoFactorSetup
            twoFactorData={twoFactorData}
            formData={formData}
            onSuccess={handle2FASuccess}
            onSkip={handle2FASkip}
            loading={loading}
          />
        );

      case 'applicantMessage':
        return (
          <div className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Applicant Account Detected
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Portal Access for Applicants
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>We found your application record for: <strong>{formData.email}</strong></p>
                    <p className="mt-2">
                      As an applicant, you'll need to complete your membership process before creating portal access. 
                      Your Alcor ID (A-number) will be assigned once your membership is finalized.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">What to do next:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Complete your membership application if you haven't already</li>
                <li>Wait for your A-number to be assigned (you'll receive an email)</li>
                <li>Return here to create your portal access once you have your A-number</li>
              </ol>
            </div>
            
            {salesforceData && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Applicant:</strong> {salesforceData.firstName} {salesforceData.lastName}<br/>
                  <strong>Status:</strong> Pending A-number assignment
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/portal-login')}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold hover:opacity-90"
              >
                Back to Login
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setFormData({ ...formData, email: '' });
                  setSalesforceData(null);
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-50"
              >
                Try Different Email
              </button>
            </div>
          </div>
        );

      case 'existingAccount':
        return (
          <div className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Portal Account Already Exists
            </h2>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-800">
                    Account Found!
                  </h3>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>Good news! You already have a portal account for:</p>
                    <p className="font-semibold mt-1">{formData.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">What to do next:</h3>
              <p className="text-gray-600 mb-4">
                Simply sign in with your existing email and password. If you've forgotten your password, you can reset it on the login page.
              </p>
              {salesforceData && (
                <div className="text-sm text-gray-500">
                  <p>Name: {salesforceData.firstName} {salesforceData.lastName}</p>
                  {salesforceData.alcorId && <p>Member ID: {salesforceData.alcorId}</p>}
                  <p>Email: {formData.email}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/portal-login?email=' + encodeURIComponent(formData.email))}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-4 px-6 rounded-full font-semibold text-lg hover:opacity-90 flex items-center justify-center"
              >
                Go to Login
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/portal-login?email=' + encodeURIComponent(formData.email) + '&reset=true')}
                className="w-full bg-white border-2 border-purple-600 text-purple-700 py-4 px-6 rounded-full font-medium text-lg hover:bg-purple-50"
              >
                Reset Password
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Not your account? 
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setFormData({ ...formData, email: '', verificationCode: '' });
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="ml-1 text-purple-700 hover:underline"
                >
                  Try a different email
                </button>
              </p>
            </div>
          </div>
        );

      case 'noAccount':
        return (
          <div className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Member Account Not Found
            </h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    No Member Account Found
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>We couldn't find a member account associated with the email:</p>
                    <p className="font-semibold mt-1">{formData.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">What to do next:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Double-check that you entered your email correctly</li>
                <li>Try using an alternate email address if you have one on file</li>
                <li>Contact Alcor support for assistance</li>
              </ol>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Contact Alcor Support</h3>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone: <a href="tel:4809051906" className="ml-1 text-purple-700 hover:underline">(480) 905-1906</a>
                </p>
                <p className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email: <a href="mailto:info@alcor.org" className="ml-1 text-purple-700 hover:underline">info@alcor.org</a>
                </p>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Please have your member number ready when contacting support.
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setFormData(prev => ({ ...prev, email: '' }));
                  setError('');
                }}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-4 px-6 rounded-full font-semibold text-lg hover:opacity-90"
              >
                Try Another Email
              </button>
              
              <button
                type="button"
                onClick={handleGoBack}
                className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg hover:bg-gray-50"
              >
                Back to Login
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      {/* Hidden anchor for scroll targeting */}
      <div ref={pageTopRef} style={{ position: 'absolute', top: 0 }} />
      
      <ResponsiveBanner 
        logo={darkLogo}
        heading="Create Portal Account"
        subText="Set up online access to your Alcor membership account"
        showSteps={false}
        showStar={true}
        showProgressBar={false}
        useGradient={true}
        textAlignment="center"
      />
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default PortalSetupPage;