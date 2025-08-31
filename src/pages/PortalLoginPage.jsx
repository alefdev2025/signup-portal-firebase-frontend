// pages/PortalLoginPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { resetPassword } from '../services/auth';
import { clearVerificationState } from '../services/storage';
import { useUser } from '../contexts/UserContext';
import ResponsiveBanner from '../components/ResponsiveBanner';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import darkLogo from "../assets/images/alcor-white-logo.png";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import MobilePortalLoginPage from './MobilePortalLoginPage';

const PortalLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  
  // 2FA states
  const [show2FAForm, setShow2FAForm] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempAuthData, setTempAuthData] = useState(null);
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);
  
  // Portal-specific states
  const [showNoPortalAccount, setShowNoPortalAccount] = useState(false);
  const [showCreatePortalOption, setShowCreatePortalOption] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);
  
  const [isChecking2FA, setIsChecking2FA] = useState(false);
  const [skipPortalCheck, setSkipPortalCheck] = useState(false);

  const [isProcessingGoogleSignIn, setIsProcessingGoogleSignIn] = useState(false);
  
  const { currentUser, signupState, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const authCore = httpsCallable(functions, 'authCore');

  const isMobile = window.innerWidth < 768;

  const handleGoogleSignInSuccess = async (result, isNewUser, additionalData) => {
    // SET FLAG AT THE VERY START
    setIsProcessingGoogleSignIn(true);
    
    // Handle special case where Google auth was added to account
    if (!result && additionalData?.googleAuthAdded) {
      setSuccessMessage(additionalData.message);
      setEmail(additionalData.email);
      setIsProcessingGoogleSignIn(false);
      // Don't navigate - user needs to sign in with password
      return;
    }
    
    if (!result || !result.user) {
      setError('Google sign-in failed');
      setIsProcessingGoogleSignIn(false);
      return;
    }
    
    // Set checking flag to prevent navigation
    setIsChecking2FA(true);
    
    try {
      const user = result.user;
      
      // Use portal-specific Google sign-in check
      const portalResult = await authCore({
        action: 'handlePortalGoogleSignIn',
        email: user.email,
        googleUid: user.uid,
        displayName: user.displayName,
        idToken: await user.getIdToken()
      });
      
      if (!portalResult.data.success) {
        // Sign out the Google user FIRST
        await auth.signOut();
        
        // Wait for sign out to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // NOW set the appropriate view
        if (portalResult.data.canCreatePortal && portalResult.data.memberInfo) {
          // Show the "Portal Account Not Set Up" view
          setMemberInfo(portalResult.data.memberInfo);
          setShowCreatePortalOption(true);
          setEmail(user.email); // Set the email for display
        } else if (portalResult.data.noAccount || !portalResult.data.hasPortalAccess) {
          // Show the "No Portal Account Found" view - SAME AS EMAIL/PASSWORD
          setEmail(user.email); // Set the email for display
          setShowNoPortalAccount(true);
        } else if (portalResult.data.requiresPasswordFirst) {
          setError(portalResult.data.error);
        } else if (portalResult.data.requiresCorrectGoogle) {
          setError(portalResult.data.error);
        } else {
          // Default to showing the no portal account view
          setEmail(user.email);
          setShowNoPortalAccount(true);
        }
        
        setIsChecking2FA(false);
        setIsProcessingGoogleSignIn(false);
        return;
      }
      
      const data = portalResult.data;
      
      // Check for 2FA
      if (data.twoFactorEnabled) {
        setTempAuthData({
          email: user.email,
          userId: user.uid
        });
        setShow2FAForm(true);
        setSuccessMessage('Please enter your 2FA code to complete sign in.');
        setIsChecking2FA(false);
        setIsProcessingGoogleSignIn(false);
        return;
      }
      
      // Successful portal login via Google
      setIsChecking2FA(false);
      setIsProcessingGoogleSignIn(false);
      setSuccessMessage("Successfully signed in with Google. Redirecting to portal...");
      
    } catch (error) {
      console.error('Error checking portal access for Google user:', error);
      setIsChecking2FA(false);
      setIsProcessingGoogleSignIn(false);
      setError('Failed to verify portal access. Please try again.');
    }
  };
  
  
  // Also update handleGoogleSignInError to be consistent
  const handleGoogleSignInError = (errorMessage) => {
    if (errorMessage.includes('No account exists')) {
      // Instead of just setting an error, show the No Portal Account view
      setShowNoPortalAccount(true);
    } else {
      setError(errorMessage);
    }
  };
  const handleAccountConflict = (result) => {
    // For portal, we don't handle account conflicts - just show error
    setError('This account requires password sign-in. Please use your email and password.');
  };

  // Clear auth state on mount
  useEffect(() => {
    if (!show2FAForm && !tempAuthData) {
      auth.signOut().catch(console.error);
      clearVerificationState();
      localStorage.removeItem('signupState');
      localStorage.removeItem('fresh_signup');
    }
  }, []);

  // Process URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');
    const setupComplete = searchParams.get('setup') === 'complete';
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (setupComplete) {
      setSuccessMessage('Portal account created successfully! Please sign in with your new credentials.');
    }
  }, [location.search]);

  useEffect(() => {
    // Don't run AT ALL if processing Google sign-in
    if (isProcessingGoogleSignIn) {
      return;
    }
    
    if (currentUser && !userLoading && !loading && !show2FAForm && !isChecking2FA) {
      // Add a small delay to let other state updates settle first
      const timer = setTimeout(() => {
        const verifyPortalAccess = async () => {
          try {
            // Double-check we're not processing Google sign-in
            if (isProcessingGoogleSignIn) {
              return;
            }
            
            // If we're already showing a specific view, don't do anything
            if (showNoPortalAccount || showCreatePortalOption) {
              return;
            }
            
            // Don't rely on signupState from context - fetch fresh data
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            
            if (!userDoc.exists()) {
              // Check again if views were set while we were waiting
              if (!showNoPortalAccount && !showCreatePortalOption && !isProcessingGoogleSignIn) {
                setError('User profile not found. Create Portal Account below.');
                await auth.signOut();
              }
              return;
            }
            
            const userData = userDoc.data();
            
            if (userData.isPortalUser === true) {
              // SCROLL FIX: Reset all scroll positions before navigation
              //window.scrollTo(0, 0);
              //document.documentElement.scrollTop = 0;
              //document.body.scrollTop = 0;
              
              // Also reset any scrollable containers
              //const scrollableElements = document.querySelectorAll('main, .overflow-y-auto, .overflow-y-scroll');
              //scrollableElements.forEach(element => {
              //  element.scrollTop = 0;
              //});
              
              // Small delay to ensure scroll completes before navigation
              //await new Promise(resolve => setTimeout(resolve, 50));
              
              // Success - navigate to portal
              //navigate('/portal-home', { replace: true }); <--- trying a different way below to deal with going to overview tab scrolled down


              window.location.replace('/portal-home');
              //window.location.href = `/portal-home?t=${Date.now()}`;
            } else {
              // Not a portal user
              if (!showNoPortalAccount && !showCreatePortalOption && !isProcessingGoogleSignIn) {
                setError('No portal user found. Create an account below.');
                await auth.signOut();
              }
            }
          } catch (error) {
            console.error('Error checking portal access:', error);
            if (!showNoPortalAccount && !showCreatePortalOption && !isProcessingGoogleSignIn) {
              setError('Failed to verify portal access. Please try again.');
            }
          }
        };
        
        verifyPortalAccess();
      }, 100); // 100ms delay to let state updates settle
      
      // Cleanup function to clear the timer
      return () => clearTimeout(timer);
    }
  }, [currentUser, userLoading, loading, navigate, show2FAForm, isChecking2FA, showNoPortalAccount, showCreatePortalOption, isProcessingGoogleSignIn]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Clear auth state
      try {
        await auth.signOut();
        clearVerificationState();
        localStorage.removeItem('signupState');
        localStorage.removeItem('fresh_signup');
      } catch (clearError) {
        // Continue anyway
      }
      
      // Use portal-specific login check
      const portalCheckResult = await authCore({
        action: 'checkPortalLogin',
        email: email
      });
      
      if (!portalCheckResult.data.success) {
        setError(portalCheckResult.data.error || 'Failed to check portal access');
        setLoading(false);
        return;
      }
      
      const portalCheck = portalCheckResult.data;
      
      if (!portalCheck.hasAccount || !portalCheck.hasPortalAccess) {
        // Show appropriate message based on account status
        if (portalCheck.hasMemberAccount && portalCheck.canCreatePortal) {
          setMemberInfo(portalCheck.memberInfo);
          setShowCreatePortalOption(true);
        } else if (portalCheck.isIncompleteSignup) {
          setError(portalCheck.message || 'Please complete your membership application first.');
        } else {
          setShowNoPortalAccount(true);
        }
        setLoading(false);
        return;
      }
      
      // Try to sign in
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check 2FA
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.data();
        
        if (userData?.twoFactorEnabled === true && userData?.twoFactorSecret) {
          setTempAuthData({
            email,
            userId: userCredential.user.uid
          });
          setShow2FAForm(true);
          setSuccessMessage('Please enter your 2FA code to complete sign in.');
          setLoading(false);
          return;
        }
        
        // Check if portal user
        if (!userData?.isPortalUser) {
          await auth.signOut();
          setError('Portal user not found. Create an account below.');
          setShowNoPortalAccount(true);
          return;
        }

        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        setSuccessMessage('Successfully signed in. Redirecting to portal...');
        // Navigation handled by useEffect
        
      } catch (authError) {
        console.error("Login error:", authError.code, authError.message);
        
        switch(authError.code) {
          case 'auth/user-not-found':
            // Already checked above, but double-check
            setShowNoPortalAccount(true);
            break;
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
          case 'auth/invalid-email':
            setError('Invalid email or password. Please check your credentials and try again.');
            break;
          case 'auth/too-many-requests':
            setError('Too many login attempts. Please try again later.');
            break;
          default:
            setError('Sign in failed. Please try again.');
        }
      }
      
    } catch (err) {
      console.error("Portal login error:", err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIs2FASubmitting(true);
    setError('');
    
    try {
      const result = await authCore({
        action: 'verify2FACode',
        userId: tempAuthData.userId,
        code: twoFactorCode
      });
      
      if (result.data?.success) {
        setSuccessMessage('2FA verified successfully. Redirecting...');
        setShow2FAForm(false);
        setTwoFactorCode('');
      } else {
        setError(result.data?.error || 'Invalid 2FA code. Please try again.');
        setTwoFactorCode('');
      }
      
    } catch (error) {
      setError('Failed to verify 2FA code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setIs2FASubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (successMessage) setSuccessMessage('');
    if (showNoPortalAccount) setShowNoPortalAccount(false);
    if (showCreatePortalOption) setShowCreatePortalOption(false);
    if (error) setError('');
    
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }
    
    setIsSubmittingReset(true);
    
    try {
      await resetPassword(resetEmail);
      setSuccessMessage(`If an account exists for ${resetEmail}, we've sent a password reset link.`);
      setShowResetForm(false);
      setResetEmail('');
      setError('');
    } catch (error) {
      setResetError("Unable to send reset email. Please try again later.");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  if (isMobile && !showNoPortalAccount && !showCreatePortalOption) {
    return (
      <MobilePortalLoginPage
        email={email}
        password={password}
        error={error}
        successMessage={successMessage}
        loading={loading}
        showResetForm={showResetForm}
        resetEmail={resetEmail}
        resetError={resetError}
        isSubmittingReset={isSubmittingReset}
        show2FAForm={show2FAForm}
        twoFactorCode={twoFactorCode}
        is2FASubmitting={is2FASubmitting}
        onLogin={handleLogin}
        onInputChange={handleInputChange}
        onResetPassword={handleResetPassword}
        on2FASubmit={handle2FASubmit}
        onGoogleSignInSuccess={handleGoogleSignInSuccess}
        onGoogleSignInError={handleGoogleSignInError}
        onGoogleAccountConflict={handleAccountConflict}
        setResetEmail={setResetEmail}
        setShowResetForm={setShowResetForm}
        setTwoFactorCode={setTwoFactorCode}
        setError={setError}
        onSignOut={() => auth.signOut().catch(console.error)}
        onNavigateToSetup={() => navigate('/portal-setup')}
        onNavigateToHome={() => navigate('/')}
      />
    );
  }

  // Render different views
  if (showNoPortalAccount) {
    return (
      <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
        <ResponsiveBanner 
          logo={darkLogo}
          heading="Member Portal"
          subText="Access your Alcor membership account"
          showSteps={false}
          showStar={true}
          showProgressBar={false}
          useGradient={true}
          textAlignment="center"
        />
        
        <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              No Portal Account Found
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6">
              <p className="text-blue-800">
                The portal is new! Create your new portal account with the email on your Alcor membership.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/portal-setup')}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base hover:opacity-90"
              >
                Create Portal Account
              </button>
              
              <button
                onClick={() => {
                    setShowNoPortalAccount(false);
                    setEmail('');
                    setPassword('');
                    setSkipPortalCheck(false); // Reset the flag
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base hover:bg-gray-50"
                >
                Try Different Email
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreatePortalOption) {
    return (
      <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
        <ResponsiveBanner 
          logo={darkLogo}
          heading="Member Portal"
          subText="Access your Alcor membership account"
          showSteps={false}
          showStar={true}
          showProgressBar={false}
          useGradient={true}
          textAlignment="center"
        />
        
        <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              Portal Account Not Set Up
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Good news!</h3>
              <p className="text-green-700">
                We found your member record. You just need to create your portal access.
              </p>
              {memberInfo && (
                <div className="mt-3 text-sm text-green-600">
                  <p>Name: {memberInfo.firstName} {memberInfo.lastName}</p>
                  <p>Member ID: {memberInfo.alcorId}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/portal-setup?email=' + encodeURIComponent(email))}
                style={{ backgroundColor: "#6f2d74", color: "white" }}
                className="w-full py-3 px-6 rounded-full font-semibold text-base hover:opacity-90"
              >
                Set Up Portal Access
              </button>
              
              <button
                onClick={() => {
                    setShowCreatePortalOption(false);
                    setMemberInfo(null);
                    setSkipPortalCheck(false); // Reset the flag
                }}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base hover:bg-gray-50"
                >
                Back to Login
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: isMobile ? "#13263f" : "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      <ResponsiveBanner 
        logo={darkLogo}
        heading="Member Portal"
        subText="Access your Alcor membership account"
        showSteps={false}
        showStar={true}
        showProgressBar={false}
        useGradient={true}
        textAlignment="center"
      />
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
          {showResetForm ? (
            // Password Reset Form
            <form onSubmit={handleResetPassword} className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Your Password</h2>
              <p className="text-gray-600 mb-6">
                Enter your email address below and we'll send you a link to reset your password.
              </p>
              
              {resetError && (
                <p className="text-red-600 text-sm mb-4">
                  {resetError}
                </p>
              )}
              
              <div className="mb-6">
                <label htmlFor="resetEmail" className="block text-gray-800 text-base font-medium mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. john.smith@example.com" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={isSubmittingReset}
                />
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  type="submit"
                  disabled={isSubmittingReset}
                  className="w-full bg-purple-700 text-white py-3 px-6 rounded-full font-semibold hover:bg-purple-800 disabled:opacity-70"
                >
                  {isSubmittingReset ? 'Processing...' : 'Send Reset Link'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setResetEmail('');
                    setResetError('');
                    setError('');
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-50"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : show2FAForm ? (
            // 2FA Form
            <form onSubmit={handle2FASubmit} className="p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                Two-Factor Authentication
              </h2>
              
              <p className="text-gray-600 mb-6">
                Enter the 6-digit code from your authenticator app.
              </p>
              
              {error && (
                <p className="text-red-600 text-sm mb-4">
                  {error}
                </p>
              )}
              
              <div className="mb-6">
                <label htmlFor="twoFactorCode" className="block text-gray-800 text-base font-medium mb-2">
                  Verification Code
                </label>
                <input 
                  type="text" 
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) setTwoFactorCode(value);
                  }}
                  placeholder="000000" 
                  maxLength="6"
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-2xl text-center tracking-widest font-mono"
                  disabled={is2FASubmitting}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              
              <div className="space-y-4">
                <button 
                  type="submit"
                  disabled={is2FASubmitting || twoFactorCode.length !== 6}
                  className="w-full bg-purple-700 text-white py-3 px-6 rounded-full font-semibold hover:bg-purple-800 disabled:opacity-70"
                >
                  {is2FASubmitting ? 'Verifying...' : 'Verify Code'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => {
                    auth.signOut().catch(console.error);
                    setShow2FAForm(false);
                    setTwoFactorCode('');
                    setTempAuthData(null);
                    setError('');
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                Member Portal Sign In
              </h2>
              
              {successMessage && (
                <p className="text-green-600 text-sm mb-4">
                  {successMessage}
                </p>
              )}

              {error && (
                <p className="text-red-600 text-sm mb-4">
                  {error}
                </p>
              )}
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-800 text-base font-medium mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleInputChange}
                  placeholder="e.g. john.smith@example.com" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-gray-800 text-base font-medium">
                    Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setResetEmail(email || '');
                      setShowResetForm(true);
                      setError('');
                    }}
                    className="text-purple-700 text-sm hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleInputChange}
                  placeholder="Enter your password" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  disabled={loading}
                />
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
                      Checking...
                    </>
                  ) : (
                    <>Sign In</>
                  )}
                </button>
              </div>
              
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              <GoogleSignInButton
                onSuccess={handleGoogleSignInSuccess}
                onError={handleGoogleSignInError}
                onAccountConflict={handleAccountConflict}
                disabled={loading}
                label="Continue with Google"
                className="py-3 text-base"
              />
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Need portal access?
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/portal-setup')}
                    className="text-purple-700 font-medium hover:underline"
                  >
                    Create Portal Account
                  </button>
                </div>
              </div>
              
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700 underline text-sm"
                >
                  Back to Home
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalLoginPage;