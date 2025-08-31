import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { Lock, Mail, AlertCircle, User, Eye, EyeOff, Check, X } from 'lucide-react';
import darkLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";

const StaffLoginPage = ({ onAuthenticated, initialError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [verificationStep, setVerificationStep] = useState('form'); // 'form', 'verification', 'twoFactorSetup'
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  // Clear initial error after showing it
  useEffect(() => {
    if (initialError) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [initialError]);

  // Password strength checker
  const checkPasswordStrength = (pwd) => {
    const feedback = [];
    let score = 0;
    
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (pwd.length < 8) feedback.push('At least 8 characters');
    if (!/[a-z]/.test(pwd)) feedback.push('Include lowercase letter');
    if (!/[A-Z]/.test(pwd)) feedback.push('Include uppercase letter');
    if (!/[0-9]/.test(pwd)) feedback.push('Include number');
    if (!/[^A-Za-z0-9]/.test(pwd)) feedback.push('Include special character');
    
    return { score: Math.min(Math.floor((score / 6) * 4), 4), feedback };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  }, [password]);

  const checkStaffAccess = async (user) => {
    try {
      // Check custom claims first
      const idTokenResult = await user.getIdTokenResult();
      const hasStaffRole = idTokenResult.claims.roles?.includes('staff') || 
                          idTokenResult.claims.roles?.includes('admin');
      
      if (hasStaffRole) return true;
      
      // Check Firestore as fallback
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.roles?.includes('staff') || userData.roles?.includes('admin');
      }
      
      return false;
    } catch (error) {
      console.error('Error checking staff access:', error);
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('=== STAFF LOGIN DEBUG START ===');
      console.log('Attempting login with email:', email);
      
      // First, try to sign in with Firebase Auth to validate credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Firebase Auth successful, user ID:', user.uid);
      
      // Check if user has staff access
      const isStaff = await checkStaffAccess(user);
      console.log('Is staff?', isStaff);
      
      if (!isStaff) {
        setError('Access denied. This account does not have staff permissions.');
        setTimeout(async () => {
          await auth.signOut();
          setError('You have been signed out. Please contact an administrator to request staff access.');
        }, 5000);
        setLoading(false);
        return;
      }
      
      // Get the user document from Firestore to check 2FA status
      console.log('Fetching user document from Firestore...');
      const userDocRef = doc(db, 'users', user.uid);
      console.log('Document reference path:', userDocRef.path);
      
      const userDoc = await getDoc(userDocRef);
      console.log('Document exists?', userDoc.exists());
      
      if (!userDoc.exists()) {
        console.error('USER DOCUMENT DOES NOT EXIST!');
        setError('User profile not found. Please contact support.');
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      console.log('Full user data:', JSON.stringify(userData, null, 2));
      console.log('twoFactorEnabled:', userData?.twoFactorEnabled);
      console.log('twoFactorEnabled type:', typeof userData?.twoFactorEnabled);
      console.log('twoFactorSecret exists?', !!userData?.twoFactorSecret);
      console.log('twoFactorSecret first 10 chars:', userData?.twoFactorSecret?.substring(0, 10));
      
      // Check the exact condition
      const condition1 = userData?.twoFactorEnabled === true;
      const condition2 = !!userData?.twoFactorSecret;
      const bothConditions = condition1 && condition2;
      
      console.log('Condition checks:');
      console.log('- twoFactorEnabled === true:', condition1);
      console.log('- has twoFactorSecret:', condition2);
      console.log('- both conditions met:', bothConditions);
      
      // Check if user has 2FA enabled AND completed setup
      // Check if user has 2FA enabled AND completed setup
      if (userData?.twoFactorEnabled === true && userData?.twoFactorSecret) {
        console.log('2FA CONDITIONS MET - SHOWING 2FA FORM');
        
        // CRITICAL: Sign out immediately to prevent dashboard access
        await auth.signOut();
        
        // Store user info for re-authentication after 2FA
        sessionStorage.setItem('pending2FAAuth', JSON.stringify({
          email: email,
          password: password,
          uid: user.uid
        }));
        
        setShowTwoFactorInput(true);
        setSuccessMessage('Please enter your two-factor authentication code.');
        setLoading(false);
        return;
      }
      
      console.log('=== STAFF LOGIN DEBUG END ===');
      
      // If we get here for staff, something is wrong
      console.error('Staff user logged in without 2FA - this should not be allowed!');
      setSuccessMessage('Successfully signed in. Redirecting...');
      if (onAuthenticated) {
        onAuthenticated(user);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      // ... rest of error handling
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorLogin = async (e) => {
    e.preventDefault();
    
    if (twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get stored credentials
      const pendingAuth = JSON.parse(sessionStorage.getItem('pending2FAAuth') || '{}');
      if (!pendingAuth.email || !pendingAuth.password) {
        setError('Session expired. Please sign in again.');
        setShowTwoFactorInput(false);
        return;
      }
      
      // Re-authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, pendingAuth.email, pendingAuth.password);
      
      // Now verify 2FA code
      const authCoreFn = httpsCallable(functions, 'authCore');
      const result = await authCoreFn({
        action: 'verify2FACode',
        userId: userCredential.user.uid,
        code: twoFactorCode,
        token: twoFactorCode
      });
      
      if (result.data?.success) {
        // Clear stored credentials
        sessionStorage.removeItem('pending2FAAuth');
        
        // Mark 2FA as verified for this session
        sessionStorage.setItem(`2fa_verified_${userCredential.user.uid}`, 'true');
        
        setSuccessMessage('Successfully signed in. Redirecting...');
        if (onAuthenticated) {
          onAuthenticated(userCredential.user);
        }
      } else {
        // Sign out again if 2FA fails
        await auth.signOut();
        setError(result.data?.error || 'Invalid authentication code');
        setTwoFactorCode('');
      }
    } catch (err) {
      console.error('2FA login error:', err);
      await auth.signOut();
      setError('Authentication failed. Please try again.');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Please fill in all fields');
      return;
    }
    
    // Validate email domain
    const emailLower = email.toLowerCase();
    const isValidDomain = emailLower.endsWith('@alcor.org') || 
                         emailLower === 'alcor.dev.2025@gmail.com';
    
    if (!isValidDomain) {
      setError('Staff accounts can only be created with @alcor.org email addresses');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('=== STAFF ACCOUNT CREATION START ===');
      console.log('Email:', emailLower);
      console.log('Display Name:', displayName);
      
      // Step 1: Send verification email
      const authCoreFn = httpsCallable(functions, 'authCore');
      const verificationResult = await authCoreFn({
        action: 'createStaffEmailVerification',  // Changed from 'createEmailVerification'
        email: emailLower,
        name: displayName
      });
      
      console.log('Email verification result:', verificationResult.data);
      
      if (!verificationResult.data.success) {
        // Check if it's because account already exists
        if (verificationResult.data.isExistingUser) {
          setError('An account with this email already exists. Please sign in instead.');
          setTimeout(() => {
            setIsCreateAccount(false);
          }, 2000);
          return;
        }
        
        setError(verificationResult.data.error || 'Failed to send verification email');
        return;
      }
      
      // Store verification ID and user data for after verification
      setVerificationId(verificationResult.data.verificationId);
      
      // Store all account data in session for use after verification
      const accountData = {
        email: emailLower,
        displayName: displayName,
        password: password,
        verificationId: verificationResult.data.verificationId,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('pendingStaffAccount', JSON.stringify(accountData));
      
      // Switch to verification code input
      setVerificationStep('verification');
      setSuccessMessage('');
      
      // Log the verification code in development
      if (verificationResult.data.__devOnly?.code) {
        console.log('DEV: Verification code:', verificationResult.data.__devOnly.code);
      }
      
      console.log('=== STAFF ACCOUNT CREATION - VERIFICATION SENT ===');
      
    } catch (err) {
      console.error('Create account error:', err);
      
      // Handle specific error cases
      if (err.code === 'functions/permission-denied') {
        setError('Permission denied. Please ensure you have the right to create staff accounts.');
      } else if (err.code === 'functions/unauthenticated') {
        setError('Authentication error. Please refresh the page and try again.');
      } else if (err.message?.includes('already exists')) {
        setError('An account already exists with this email. Please sign in instead.');
        setTimeout(() => {
          setIsCreateAccount(false);
        }, 2000);
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (successMessage) {
      setSuccessMessage('');
    }
    
    switch(name) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      case 'displayName':
        setDisplayName(value);
        break;
    }
    
    if (error && !initialError) {
      setError('');
    }
  };

  const handleShowResetForm = () => {
    setResetEmail(email || '');
    setShowResetForm(true);
  };

  const handleCancelReset = () => {
    setShowResetForm(false);
    setResetEmail('');
    setResetError('');
  };

  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
    setResetError('');
  };

  const validateResetForm = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!resetEmail.trim()) {
      setResetError('Email is required');
      return false;
    }
    
    if (!emailPattern.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (isSubmittingReset) return;
    if (!validateResetForm()) return;
    
    setIsSubmittingReset(true);
    
    try {
      // Call the backend function for staff password reset
      const sendStaffPasswordReset = httpsCallable(functions, 'authCore');
      const result = await sendStaffPasswordReset({
        action: 'sendStaffPasswordResetLink',
        email: resetEmail
      });
      
      console.log('Password reset result:', result.data);
      
      if (result.data.success) {
        const message = result.data.message || `If a staff account exists for ${resetEmail}, we've sent a password reset link. Please check your email.`;
        setSuccessMessage(message);
        setShowResetForm(false);
        setResetEmail('');
      } else {
        setResetError(result.data.error || 'Unable to send reset email. Please try again later.');
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError('Unable to send reset email. Please try again later.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handler for verification code submission
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('=== VERIFYING EMAIL CODE ===');
      
      // Verify the email code
      const authCoreFn = httpsCallable(functions, 'authCore');
      const verifyResult = await authCoreFn({
        action: 'verifyEmailCode',
        verificationId: verificationId,
        code: verificationCode
      });
      
      console.log('Verification result:', verifyResult.data);
      
      if (!verifyResult.data.success) {
        setError(verifyResult.data.error || 'Invalid verification code');
        return;
      }
      
      // Get stored account data
      const pendingAccount = JSON.parse(
        sessionStorage.getItem('pendingStaffAccount') || '{}'
      );
      
      if (!pendingAccount.email) {
        setError('Session expired. Please start over.');
        setVerificationStep('form');
        return;
      }
      
      // Now create the staff account or add staff access
      console.log('Creating staff account/access...');
      const createResult = await authCoreFn({
        action: 'createOrAddStaffAccess',
        email: pendingAccount.email,
        displayName: pendingAccount.displayName,
        password: pendingAccount.password
      });
      
      console.log('Account creation result:', createResult.data);
      
      if (!createResult.data.success) {
        setError(createResult.data.error || 'Failed to create account');
        
        // If they already have staff access, redirect to login
        if (createResult.data.hasStaffAccess) {
          setTimeout(() => {
            setIsCreateAccount(false);
            setVerificationStep('form');
          }, 2000);
        }
        return;
      }
      
      // Clear stored account data
      sessionStorage.removeItem('pendingStaffAccount');
      
      // Check if 2FA setup is required
      if (createResult.data.requiresTwoFactorSetup || 
          createResult.data.requires2FASetup) {
        
        // Store 2FA setup data
        const twoFAData = {
          qrCode: createResult.data.qrCode,
          secret: createResult.data.secret,
          userId: createResult.data.userId
        };
        
        console.log('Setting up 2FA with data:', {
          hasQrCode: !!twoFAData.qrCode,
          hasSecret: !!twoFAData.secret,
          userId: twoFAData.userId
        });
        
        if (!twoFAData.qrCode || !twoFAData.secret) {
          console.error('Missing 2FA setup data');
          setError('2FA setup data is missing. Please contact support.');
          return;
        }
        
        setTwoFactorData(twoFAData);
        setTempUserId(twoFAData.userId);
        setVerificationStep('twoFactorSetup');
        
        const message = createResult.data.isExistingUser
          ? 'Staff access added! Now set up two-factor authentication.'
          : 'Account created! Now set up two-factor authentication.';
        
        setSuccessMessage(message);
        
      } else {
        // This shouldn't happen for staff
        console.error('Staff account created without 2FA requirement');
        setError('Two-factor authentication setup is required. Please contact support.');
      }
      
      console.log('=== EMAIL VERIFICATION COMPLETE ===');
      
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for 2FA setup completion
  const handleTwoFactorSetup = async (e) => {
    e.preventDefault();
    
    if (twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('=== COMPLETING STAFF 2FA SETUP ===');
      console.log('User ID:', tempUserId);
      
      // Make sure we have a userId
      const userIdToUse = tempUserId || auth.currentUser?.uid;
      if (!userIdToUse) {
        console.error('No user ID available for 2FA setup');
        setError('User ID is missing. Please restart the setup process.');
        return;
      }
      
      const authCoreFn = httpsCallable(functions, 'authCore');
      const result = await authCoreFn({
        action: 'completeStaff2FASetup',
        userId: userIdToUse,
        token: twoFactorCode,
        code: twoFactorCode
      });
      
      console.log('2FA setup result:', result.data);
      
      if (result.data?.success) {
        setSuccessMessage('Two-factor authentication enabled! Signing you in...');
        
        // Try to sign in automatically
        try {
          const pendingAccount = JSON.parse(
            sessionStorage.getItem('pendingStaffAccount') || '{}'
          );
          
          if (pendingAccount.email && pendingAccount.password) {
            const userCredential = await signInWithEmailAndPassword(
              auth, 
              pendingAccount.email, 
              pendingAccount.password
            );
            
            // Mark staff 2FA as verified for this session
            sessionStorage.setItem(
              `staff_2fa_verified_${userCredential.user.uid}`, 
              'true'
            );
            
            if (onAuthenticated) {
              onAuthenticated(userCredential.user);
            }
          } else {
            // Can't auto-sign in, redirect to login
            setTimeout(() => {
              setIsCreateAccount(false);
              setVerificationStep('form');
              setSuccessMessage('Account created successfully! Please sign in.');
            }, 2000);
          }
        } catch (signinError) {
          console.error('Auto-signin failed:', signinError);
          setTimeout(() => {
            setIsCreateAccount(false);
            setVerificationStep('form');
            setSuccessMessage('Account created successfully! Please sign in.');
          }, 2000);
        }
        
        // Store backup codes if provided
        if (result.data.backupCodes?.length > 0) {
          console.log('=== IMPORTANT: BACKUP CODES ===');
          console.log('Store these backup codes safely:');
          result.data.backupCodes.forEach((code, index) => {
            console.log(`${index + 1}. ${code}`);
          });
          
          // You could show these in a modal or alert
          alert(`IMPORTANT: Save these backup codes:\n\n${result.data.backupCodes.join('\n')}`);
        }
        
      } else {
        setError(result.data?.error || 'Invalid code. Please try again.');
        setTwoFactorCode('');
      }
      
      console.log('=== STAFF 2FA SETUP COMPLETE ===');
      
    } catch (error) {
      console.error('2FA setup error:', error);
      setError('Failed to verify code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setError('');
    setLoading(true);
    const pendingAccount = JSON.parse(sessionStorage.getItem('pendingStaffAccount') || '{}');
    
    if (!pendingAccount.email) return;
    
    try {
      const createEmailVerification = httpsCallable(functions, 'authCore');
      const result = await createEmailVerification({
        action: 'createStaffEmailVerification',
        email: pendingAccount.email,
        name: pendingAccount.displayName
      });
      
      if (result.data.success) {
        // Update the verification ID with the new one
        setVerificationId(result.data.verificationId);
        
        // Update the stored pending account with new verification ID
        const updatedAccount = {
          ...pendingAccount,
          verificationId: result.data.verificationId
        };
        sessionStorage.setItem('pendingStaffAccount', JSON.stringify(updatedAccount));
        
        setSuccessMessage('Verification code resent!');
        setVerificationCode(''); // Clear the old code
        
        if (result.data.__devOnly?.code) {
          console.log('DEV: New verification code:', result.data.__devOnly.code);
        }
      } else {
        setError('Failed to resend code');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    sessionStorage.removeItem('pendingStaffAccount');
    setVerificationStep('form');
    setVerificationCode('');
    setVerificationId('');
    setError('');
  };

  const toggleAccountMode = () => {
    setIsCreateAccount(!isCreateAccount);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setVerificationStep('form');
    setVerificationCode('');
    sessionStorage.removeItem('pendingStaffAccount');
  };

  const getPasswordStrengthColor = () => {
    switch(passwordStrength.score) {
      case 0: return 'bg-gray-300';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      {/* Custom Compact Banner */}
      <div className="relative">
        {/* Mobile Banner */}
        <div className="md:hidden">
          <div 
            className="text-white px-4 py-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #0a1629 0%, #1e2650 100%)',
              fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
            }}
          >
            <div className="flex items-center justify-between">
              <img 
                src={darkLogo} 
                alt="Alcor Logo" 
                className="h-10"
              />
              <h1 className="text-lg font-bold">Staff Portal</h1>
            </div>
            <p className="text-sm text-white/90 mt-2 text-center">
              {isCreateAccount ? "Create staff account" : "Sign in to staff dashboard"}
            </p>
          </div>
        </div>
        
        {/* Desktop Banner */}
        <div 
          className="hidden md:block"
          style={{
            background: 'linear-gradient(90deg, #0a1629 0%, #1e2650 100%)',
            fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
          }}
        >
          <div className="text-white px-10 pt-8 pb-12">
            <div className="flex justify-start mb-6">
              <img 
                src={darkLogo} 
                alt="Alcor Logo" 
                className="h-16"
              />
            </div>
            
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="flex items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold">
                  Staff Portal
                </span>
                <img src={yellowStar} alt="" className="h-7 ml-1" />
              </h1>
              <p className="text-lg md:text-xl mt-3 text-white/90">
                {isCreateAccount ? "Create a new staff account" : "Sign in to access the Alcor staff dashboard."}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-8 sm:pt-12">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-md overflow-hidden">
          {showResetForm ? (
            // Password Reset Form
            <form onSubmit={handleResetPassword} className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Your Password</h2>
              <p className="text-base text-gray-600 mb-6">Enter your email address below and we'll send you a link to reset your password.</p>
              
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 text-base">
                  {resetError}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="resetEmail" className="block text-gray-800 text-base font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  id="resetEmail"
                  value={resetEmail}
                  onChange={handleResetEmailChange}
                  placeholder="e.g. john.smith@alcor.org" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                  disabled={isSubmittingReset}
                />
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  type="submit"
                  disabled={isSubmittingReset}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {isSubmittingReset ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>Send Reset Link</>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={handleCancelReset}
                  disabled={isSubmittingReset}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : showTwoFactorInput ? (
            // 2FA Input Form for Login
            <form onSubmit={handleTwoFactorLogin} className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Two-Factor Authentication</h2>
              
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-6 text-base">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <p className="text-gray-600 mb-6">
                Enter the 6-digit code from your authenticator app
              </p>
              
              <div className="mb-6">
                <label htmlFor="twoFactorCode" className="block text-gray-800 text-base font-medium mb-2">
                  Authentication Code
                </label>
                <input 
                  type="text" 
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setTwoFactorCode(value);
                    }
                  }}
                  placeholder="000000" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base text-center tracking-widest font-mono text-2xl"
                  disabled={loading}
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              
              <div className="space-y-3">
                <button 
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>Verify</>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={() => {
                    setShowTwoFactorInput(false);
                    setTwoFactorCode('');
                    setError('');
                    sessionStorage.removeItem('pending2FAAuth');
                    setPassword(''); // Clear password for security
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base flex items-center justify-center hover:bg-gray-50"
                  disabled={loading}
                >
                  Back
                </button>
              </div>
            </form>
          ) : isCreateAccount ? (
            verificationStep === 'verification' ? (
              // Verification Code Form
              <form onSubmit={handleVerifyCode} className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Verify Your Email</h2>
                
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-6 text-base">
                    {successMessage}
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="mb-6">
                  <label htmlFor="verificationCode" className="block text-gray-800 text-base font-medium mb-2">
                    Verification Code
                  </label>
                  <input 
                    type="text" 
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter the 6-digit code" 
                    className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base text-center tracking-widest"
                    disabled={loading}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                
                <p className="text-sm text-gray-600 mb-8">
                  A verification code has been sent to <strong>{email}</strong>
                </p>
                
                <div className="space-y-3">
                  <button 
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    style={{ backgroundColor: "#6f2d74", color: "white" }}
                    className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      <>Verify</>
                    )}
                  </button>
                  
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={resendVerificationCode}
                      disabled={loading}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-full font-medium text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
                    >
                      Resend Code
                    </button>
                    
                    <button 
                      type="button"
                      onClick={changeEmail}
                      disabled={loading}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-full font-medium text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              </form>
            ) : verificationStep === 'twoFactorSetup' ? (
              // 2FA Setup Form - Enhanced UI like PortalSetupPage
              <form onSubmit={handleTwoFactorSetup} className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Set Up Two-Factor Authentication</h2>
                
                <p className="text-base text-gray-600 mb-6">
                  Two-factor authentication is required for all staff accounts. This adds an extra layer of security.
                </p>
                
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-6 text-base">
                    {successMessage}
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
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
                
                {/* QR Code Section */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 text-center">Step 1: Add to Authenticator App</h3>
                  
                  {/* Desktop: Show QR Code */}
                  {twoFactorData && twoFactorData.qrCode && (
                    <>
                      <div className="hidden sm:block text-center">
                        <img 
                          src={twoFactorData.qrCode} 
                          alt="2FA QR Code" 
                          className="mx-auto mb-4 border-2 border-gray-300 rounded-lg"
                          style={{ maxWidth: '250px' }}
                        />
                        <p className="text-sm text-gray-600 text-center">
                          Scan this QR code with your authenticator app
                        </p>
                      </div>
                      
                      {/* Mobile: Show setup key directly */}
                      <div className="sm:hidden">
                        <div className="bg-white rounded border border-gray-200 p-4">
                          <p className="text-sm text-gray-700 mb-2">Add this account to your authenticator app:</p>
                          <p className="text-sm font-medium text-gray-900 mb-1">Account: Alcor Staff</p>
                          <p className="text-sm font-medium text-gray-900 mb-3">Email: {email}</p>
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
                      <details className="hidden sm:block text-xs text-gray-500 mt-4">
                        <summary className="cursor-pointer hover:text-gray-700 text-center">Can't scan? Enter manually</summary>
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <p className="mb-2">Account: <strong>Alcor Staff - {email}</strong></p>
                          <p>Secret: <code className="font-mono text-xs break-all">{twoFactorData.secret}</code></p>
                        </div>
                      </details>
                    </>
                  )}
                </div>
                
                {/* Verification Code Input */}
                <h3 className="font-semibold text-gray-800 mb-4">Step 2: Enter Verification Code</h3>
                <div className="mb-6">
                  <label htmlFor="twoFactorCode" className="block text-gray-800 text-base font-medium mb-2">
                    Enter 6-digit code from your app
                  </label>
                  <input 
                    type="text" 
                    id="twoFactorCode"
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setTwoFactorCode(value);
                      }
                    }}
                    placeholder="000000" 
                    maxLength="6"
                    className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                    disabled={loading}
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6 text-sm">
                  <p className="text-yellow-800">
                    <strong>Important:</strong> Save your secret key in a safe place. You'll need it if you lose access to your authenticator app.
                  </p>
                </div>
                
                <button 
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>Complete Setup</>
                  )}
                </button>
              </form>
            ) : (
              // Create Account Form
              <form onSubmit={handleCreateAccount} className="p-8">
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-6 text-base">
                    {successMessage}
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="mb-6">
                  <label htmlFor="displayName" className="block text-gray-800 text-base font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      id="displayName"
                      name="displayName"
                      value={displayName}
                      onChange={handleInputChange}
                      placeholder="e.g. John Smith" 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="email" className="block text-gray-800 text-base font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={email}
                      onChange={handleInputChange}
                      placeholder="e.g. john.smith@alcor.org" 
                      className="w-full pl-12 pr-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must use @alcor.org email address</p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-800 text-base font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password" 
                      className="w-full pl-12 pr-12 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-2">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded ${
                              i < passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="text-xs text-gray-600 space-y-1">
                          {passwordStrength.feedback.map((item, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <X className="w-3 h-3 text-red-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                      {passwordStrength.score === 4 && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Strong password
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mb-8">
                  <label htmlFor="confirmPassword" className="block text-gray-800 text-base font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter your password" 
                      className="w-full pl-12 pr-12 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Passwords match
                    </p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <button 
                    type="submit"
                    disabled={loading || passwordStrength.score < 3}
                    style={{ backgroundColor: "#6f2d74", color: "white" }}
                    className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>Create Staff Account</>
                    )}
                  </button>
                </div>
                
                <div className="text-center mt-6">
                  <span className="text-gray-600 text-base">Already have an account? </span>
                  <button
                    type="button"
                    onClick={toggleAccountMode}
                    className="text-purple-700 text-base hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            )
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="p-8">
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-6 text-base">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-6 flex items-start gap-3 text-base">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-800 text-base font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    placeholder="e.g. john.smith@alcor.org" 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-gray-800 text-base font-medium">Password</label>
                  <button 
                    type="button" 
                    onClick={handleShowResetForm}
                    className="text-purple-700 text-sm hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    placeholder="Enter your password" 
                    className="w-full pl-12 pr-12 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-base"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <button 
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>Sign In</>
                  )}
                </button>
              </div>
              
              <div className="text-center mt-6">
                <span className="text-gray-600 text-base">Need a staff account? </span>
                <button
                  type="button"
                  onClick={toggleAccountMode}
                  className="text-purple-700 text-base hover:underline"
                >
                  Create account
                </button>
              </div>
              
              <div className="text-center mt-8 pt-8 border-t border-gray-200">
                <a
                  href="/"
                  className="text-gray-500 hover:text-gray-700 underline text-base"
                >
                  Back to Member Portal
                </a>
              </div>
              
              <div className="text-center mt-6 text-sm text-gray-500">
                <p>© 2025 Alcor Life Extension Foundation</p>
                <p className="mt-1">Staff Access Only</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;