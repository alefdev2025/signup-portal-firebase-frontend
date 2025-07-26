// PortalSetupPage.jsx - Complete implementation with debug logging for 2FA

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ResponsiveBanner from '../components/ResponsiveBanner';
import darkLogo from "../assets/images/alcor-white-logo.png";
import PasswordField, { checkPasswordStrength } from '../components/signup/PasswordField';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { 
  requestPortalEmailVerification,
  verifyPortalCode,
  createPortalAccountWithPassword,
  formatAlcorId,
  checkMemberAccount
} from '../services/auth';

const PortalSetupPage = () => {
  const [step, setStep] = useState('email'); // 'email', 'alcorId', 'verify', 'password', '2fa', 'noAccount', 'existingAccount'
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
  const [twoFactorCode, setTwoFactorCode] = useState('');
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

  // Step 1: Check email in backend
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await checkMemberAccount(formData.email);
      
      if (!result.success) {
        setError(result.error || 'Failed to check account');
        return;
      }
      
      if (!result.hasAccount) {
        setStep('noAccount');
        return;
      }
      
      if (result.requiresAlcorId) {
        // Multiple accounts - need Alcor ID
        setStep('alcorId');
        setSuccessMessage(result.message || `Found ${result.count} accounts with this email. Please enter your A-number to continue.`);
      } else {
        // Single account - extract the first customer from the data array
        const customerData = result.data[0];
        setSalesforceData(customerData);
        await sendVerificationEmail(customerData);
      }
    } catch (err) {
      console.error('Email check error:', err);
      setError('Failed to check account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle Alcor ID submission
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
      await sendVerificationEmail(customerData);
    } catch (err) {
      console.error('Alcor ID check error:', err);
      setError('Invalid Alcor ID. Please check your A-number and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async (accountData) => {
    try {
      if (!accountData) {
        throw new Error('No account data available');
      }
      
      // Check if this member already has a portal account
      try {
        const authCoreFn = httpsCallable(functions, 'authCore');
        const portalCheckResult = await authCoreFn({
          action: 'checkPortalAccountExists',
          email: formData.email
        });
        
        if (portalCheckResult.data?.hasPortalAccount) {
          console.log('Member already has portal account, but continuing to send verification');
          // Don't reveal this yet - continue with verification
        }
      } catch (checkError) {
        console.error('Error checking portal account:', checkError);
        // Continue anyway
      }
      
      // Safely construct the name
      const firstName = accountData.firstName || '';
      const lastName = accountData.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Member';
      
      const result = await requestPortalEmailVerification({
        email: formData.email,
        name: fullName,
        alcorId: accountData.alcorId || '',
        salesforceContactId: accountData.id || accountData.salesforceContactId || ''
      });
      
      if (result.success) {
        setVerificationId(result.verificationId);
        setStep('verify');
        setSuccessMessage('Verification code sent! Please check your email.');
      } else {
        setError(result.error || 'Failed to send verification email.');
      }
    } catch (err) {
      console.error('Verification email error:', err);
      setError('Failed to send verification email. Please try again.');
    }
  };

  // Step 3: Verify code
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
        // NOW check if this user already has a portal account
        // This is secure because they've proven they have access to the email
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
            // Scroll to top
            setTimeout(() => {
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }, 0);
            return;
          }
        } catch (checkError) {
          console.error('Error checking portal account:', checkError);
          // Continue with normal flow if check fails
        }
        
        // No existing portal account, continue with setup
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

  // Step 4: Create account with password (WITH DEBUG LOGGING)
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
          
          // Show 2FA setup
          setTwoFactorData(twoFAData);
          setStep('2fa');
          setSuccessMessage('Account created! Now set up two-factor authentication.');
          
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
            navigate('/login?portal=true&setup=complete');
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

  // Handler for 2FA setup verification
  const handle2FASetup = async (e) => {
    e.preventDefault();
    
    if (twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting to complete 2FA setup with code:', twoFactorCode);
      console.log('User ID:', twoFactorData.userId);
      
      const authCoreFn = httpsCallable(functions, 'authCore');
      const result = await authCoreFn({
        action: 'completePortal2FASetup',
        userId: twoFactorData.userId,
        token: twoFactorCode,
        code: twoFactorCode // Some backends expect 'code' instead of 'token'
      });
      
      console.log('2FA setup result:', result.data);
      
      if (result.data?.success) {
        setSuccessMessage('Two-factor authentication enabled successfully!');
        // Clear the code
        setTwoFactorCode('');
        // Wait a bit to show success message
        setTimeout(() => {
          navigate('/login?portal=true&setup=complete&2fa=enabled');
        }, 2000);
      } else {
        console.error('2FA setup failed:', result.data?.error);
        setError(result.data?.error || 'Invalid code. Please try again.');
        // Clear the code so user can try again
        setTwoFactorCode('');
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      setError('Failed to verify code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/login');
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
              If the email you enter is connected to an Alcor account you'll receive an email with a verification code.
            </p>
            
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
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
              <div className="bg-blue-50 border border-blue-200 text-blue-600 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="alcorId" className="block text-gray-800 text-lg font-medium mb-2">
                Alcor ID (A-Number) <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="alcorId"
                name="alcorId"
                value={formData.alcorId}
                onChange={handleInputChange}
                placeholder="e.g. A-1234" 
                className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
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
                className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg hover:bg-gray-50"
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
              We've sent a 6-digit verification code to <strong>{formData.email}</strong>
            </p>
            
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="verificationCode" className="block text-gray-800 text-lg font-medium mb-2">
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
                className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg text-center tracking-widest font-mono text-2xl"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
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
                  <strong>Member ID:</strong> {salesforceData.alcorId}
                </p>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {typeof error === 'string' ? error : <div>{error}</div>}
              </div>
            )}
            
            {/* Use PasswordField component */}
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
            />
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading || !checkPasswordStrength(formData.password).meetsMinimumRequirements}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
              >
                {loading ? 'Creating Account...' : 'Create Portal Account'}
              </button>
            </div>
          </form>
        );

      case '2fa':
        return (
          <div className="p-8" tabIndex={-1} ref={el => el && el.focus()}>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2" tabIndex={-1}>
              Optional: Set Up Two-Factor Authentication
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your portal account has been created successfully! You can add an extra layer of security now, or set it up later.
            </p>
            
            {/* Show success message if 2FA was successfully enabled */}
            {successMessage && successMessage.includes('successfully') && (
              <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {successMessage}
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {error}
              </div>
            )}
            
            {/* Main action buttons - Skip is prominent */}
            {!successMessage?.includes('successfully') && (
              <div className="mb-8 space-y-4">
                <button
                  type="button"
                  onClick={() => navigate('/login?portal=true&setup=complete')}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="w-full py-4 px-6 rounded-full font-semibold text-lg hover:opacity-90 flex items-center justify-center"
                >
                  Continue to Portal
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    // Scroll to 2FA setup section
                    document.getElementById('2fa-setup-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full bg-white border-2 border-purple-600 text-purple-700 py-4 px-6 rounded-full font-medium text-lg hover:bg-purple-50"
                >
                  Set Up 2FA Now (Recommended)
                </button>
              </div>
            )}
            
            {/* Success message banner */}
            {!successMessage?.includes('successfully') && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Account Created Successfully!
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your portal account is ready to use. You can log in now or add 2FA for extra security.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show QR code if we have the data and 2FA isn't complete yet */}
            {twoFactorData && twoFactorData.qrCode && !successMessage?.includes('successfully') && (
              <div id="2fa-setup-section">
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Add Two-Factor Authentication (Optional)
                  </h3>
                  
                  <div className="bg-blue-50 border border-blue-200 text-blue-600 rounded-md p-4 mb-6">
                    <p className="text-sm">Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.</p>
                  </div>
                  
                  {/* Mobile device warning */}
                  <div className="sm:hidden bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">
                          Mobile Device Detected
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          You'll need an authenticator app on this device. If you haven't installed one yet, we recommend:
                        </p>
                        <ul className="list-disc list-inside text-sm text-amber-700 mt-2">
                          <li>Google Authenticator</li>
                          <li>Microsoft Authenticator</li>
                          <li>Authy</li>
                        </ul>
                        <p className="text-sm text-amber-700 mt-2">
                          Install one of these apps first, then return here to continue.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4 text-center">Step 1: Add to Authenticator App</h4>
                    
                    {/* Desktop: Show QR Code */}
                    <div className="hidden sm:block text-center">
                      <img 
                        src={twoFactorData.qrCode} 
                        alt="2FA QR Code" 
                        className="mx-auto mb-4 border-2 border-gray-300 rounded-lg"
                        style={{ maxWidth: '250px', height: 'auto' }}
                      />
                      <p className="text-sm text-gray-600 mb-2">
                        Scan this QR code with your authenticator app
                      </p>
                    </div>
                    
                    {/* Mobile: Show setup key directly */}
                    <div className="sm:hidden">
                      <div className="bg-white rounded border border-gray-200 p-4 mb-4">
                        <p className="text-sm text-gray-700 mb-2">Add this account to your authenticator app:</p>
                        <p className="text-sm font-medium text-gray-900 mb-1">Account: Alcor Portal</p>
                        <p className="text-sm font-medium text-gray-900 mb-3">Email: {formData.email}</p>
                        <p className="text-xs text-gray-600 mb-2">Setup key:</p>
                        <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded select-all">
                          {twoFactorData.secret}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(twoFactorData.secret);
                            alert('Setup key copied to clipboard!');
                          }}
                          className="mt-3 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm hover:bg-gray-300"
                        >
                          Copy Setup Key
                        </button>
                      </div>
                    </div>
                    
                    {/* Manual entry option for desktop */}
                    <details className="hidden sm:block text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700">Can't scan? Enter manually</summary>
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                        <p className="mb-2">Account name: <strong>Alcor Portal - {formData.email}</strong></p>
                        <p className="mb-2">Secret key:</p>
                        <p className="font-mono break-all select-all bg-gray-100 p-2 rounded">{twoFactorData.secret}</p>
                      </div>
                    </details>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Step 2: Enter Verification Code</h4>
                    <form onSubmit={handle2FASetup}>
                      <label htmlFor="twoFactorCode" className="block text-gray-700 text-sm font-medium mb-2">
                        Enter the 6-digit code from your authenticator app:
                      </label>
                      <input 
                        type="text" 
                        id="twoFactorCode"
                        name="twoFactorCode"
                        value={twoFactorCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 6) {
                            setTwoFactorCode(value);
                            if (error) setError(''); // Clear error when typing
                          }
                        }}
                        placeholder="000000" 
                        maxLength="6"
                        className="w-full px-5 py-4 mb-4 border border-purple-300 rounded-md text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        autoComplete="off"
                        autoFocus
                        required
                      />
                      
                      <button
                        type="submit"
                        disabled={loading || twoFactorCode.length !== 6}
                        className="w-full bg-purple-600 text-white py-4 px-6 rounded-full font-semibold text-lg hover:bg-purple-700 disabled:opacity-70 flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          'Enable 2FA'
                        )}
                      </button>
                    </form>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Save your backup codes or secret key in a safe place. You'll need them if you lose access to your authenticator app.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error state - no 2FA data */}
            {!twoFactorData && !successMessage?.includes('successfully') && (
              <div className="bg-red-50 border border-red-200 rounded-md p-6">
                <h3 className="text-red-800 font-medium mb-2">Setup Error</h3>
                <p className="text-red-700 mb-4">
                  We couldn't load your 2FA setup information. Don't worry - your account was created successfully!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login?portal=true&setup=complete')}
                  className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Continue to Login
                </button>
              </div>
            )}
          </div>
        );

      case 'existingAccount':
        return (
          <div className="p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Portal Account Already Exists
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Account Found!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
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
                  <p>Member ID: {salesforceData.alcorId}</p>
                  <p>Email: {formData.email}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/login?email=' + encodeURIComponent(formData.email))}
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
                onClick={() => navigate('/login?email=' + encodeURIComponent(formData.email) + '&reset=true')}
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
                  Email: <a href="mailto:support@alcor.org" className="ml-1 text-purple-700 hover:underline">support@alcor.org</a>
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