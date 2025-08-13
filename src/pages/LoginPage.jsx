// LoginPage.jsx - Updated with 2FA support

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { resetPassword, verify2FACode } from '../services/auth';
import { clearVerificationState } from '../services/storage';
import { useUser } from '../contexts/UserContext';
import ResponsiveBanner from '../components/ResponsiveBanner';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import darkLogo from "../assets/images/alcor-white-logo.png";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [isContinueSignup, setIsContinueSignup] = useState(false);
  
  // States for Google sign-in integration
  const [pendingGoogleLinking, setPendingGoogleLinking] = useState(false);
  const [highlightGoogleButton, setHighlightGoogleButton] = useState(false);
  const [showNoAccountMessage, setShowNoAccountMessage] = useState(false);
  
  // New states for 2FA
  const [show2FAForm, setShow2FAForm] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempAuthData, setTempAuthData] = useState(null); // Store user/session data during 2FA
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);
  
  const { currentUser, signupState, isLoading: userLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [isChecking2FA, setIsChecking2FA] = useState(false);

  // Clear auth state on component mount (unless in 2FA flow)
  useEffect(() => {
    // If user navigated to login page, sign out any existing session
    // unless they're in the middle of 2FA
    if (!show2FAForm && !tempAuthData) {
      auth.signOut().catch(console.error);
      // Clear storage
      clearVerificationState();
      localStorage.removeItem('signupState');
      localStorage.removeItem('fresh_signup');
    }
  }, []); // Run once on mount

  // Process URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const continueSignup = searchParams.get('continue') === 'signup';
    const emailParam = searchParams.get('email');
    const provider = searchParams.get('provider');
    
    if (continueSignup) {
      setIsContinueSignup(true);
    }
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (provider === 'google' && emailParam) {
      setHighlightGoogleButton(true);
      setSuccessMessage(`This email (${emailParam}) is associated with a Google account. Please sign in with Google.`);
    }
  }, [location.search]);
  
  // Navigate based on backend progress after successful login
  useEffect(() => {
    if (currentUser && signupState && !userLoading && !loading && !show2FAForm && !isChecking2FA) {
      //console.log(`User logged in. Progress: ${signupState.signupProgress}, Step: ${signupState.signupStep}, Completed: ${signupState.signupCompleted}`);
      
      // If continuing signup
      if (isContinueSignup) {
        // If signup is completed, go to member portal
        if (signupState.signupCompleted) {
          //console.log('Signup completed - going to member portal');
          navigate('/portal-home', { replace: true });
          return;
        }
        
        // Navigate to signup - SignupFlowContext will handle setting the right step
        //console.log('Going to signup flow');
        navigate('/signup', { replace: true });
      } else {
        // Member portal login - navigate to portal home
        //console.log('Member portal login - going to portal home');
        navigate('/portal-home', { replace: true });
      }
    }
  }, [currentUser, signupState, userLoading, loading, navigate, isContinueSignup, show2FAForm, isChecking2FA]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      //console.log('Attempting login...');
      
      // Clear ALL auth state before login
      try {
        await auth.signOut();
        // Clear storage
        clearVerificationState();
        localStorage.removeItem('signupState');
        localStorage.removeItem('fresh_signup');
        //console.log('Cleared all auth state before login');
      } catch (clearError) {
        //console.error('Error clearing auth state:', clearError);
        // Continue anyway
      }
      
      // First, try to sign in with Firebase Auth
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        //console.log('Firebase auth successful, user:', userCredential.user.uid);
        
        // Get the user document from Firestore to check 2FA status
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.data();
        
        //console.log('User data from Firestore:', userData);
        //console.log('2FA enabled?', userData?.twoFactorEnabled);
        //console.log('Is portal user?', userData?.isPortalUser);
        
        // Check if user has 2FA enabled AND completed setup
        if (userData?.twoFactorEnabled === true && userData?.twoFactorSecret) {
          //console.log('User has 2FA enabled and completed, showing 2FA form');
          // Store temp auth data for after 2FA verification
          setTempAuthData({
            email,
            userId: userCredential.user.uid
          });
          setShow2FAForm(true);
          setSuccessMessage('Please enter your 2FA code to complete sign in.');
          setLoading(false);
          return;
        }
        
        // If they have pending 2FA setup but didn't complete it, just log them in
        if (userData?.pending2FASetup && !userData?.twoFactorEnabled) {
          //console.log('User has pending 2FA setup but it\'s not enabled - logging in normally');
        }
        
        // No 2FA required, proceed with normal login flow
        setSuccessMessage('Successfully signed in. Redirecting...');
        // Navigation will happen in useEffect above once backend data loads
        
      } catch (authError) {
        //console.error("Login error:", authError.code, authError.message);
        
        // Check if this is a 2FA-related error from Firebase
        if (authError.code === 'auth/multi-factor-auth-required') {
          //console.log('Firebase indicates 2FA is required');
          setTempAuthData({
            email,
            multiFactorResolver: authError.resolver // Firebase MFA resolver if using Firebase 2FA
          });
          setShow2FAForm(true);
          setSuccessMessage('Please enter your 2FA code to complete sign in.');
          setLoading(false);
          return;
        }
        
        // Handle other auth errors
        switch(authError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
          case 'auth/invalid-email':
            setError('Invalid email or password. Please check your credentials and try again. If you created your account with Google, log in with the Google button below.');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed login attempts. Please try again later or reset your password.');
            break;
          case 'auth/user-disabled':
            setError('This account has been disabled. Please contact support.');
            break;
          case 'auth/network-request-failed':
            setError('Network error. Please check your internet connection and try again.');
            break;
          default:
            setError('Sign in failed. Please check your credentials and try again.');
        }
        throw authError;
      }
      
    } catch (err) {
      //console.error("Login process error:", err);
      // Error already handled above
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
      //console.log('Verifying 2FA code...');
      //console.log('User ID:', tempAuthData.userId);
      
      // Call the verify2FACode function through authCore
      const authCoreFn = httpsCallable(functions, 'authCore');
      const result = await authCoreFn({
        action: 'verify2FACode',
        userId: tempAuthData.userId || auth.currentUser?.uid,
        code: twoFactorCode,
        token: twoFactorCode // Some backends expect 'token' instead of 'code'
      });
      
      //console.log('2FA verification result:', result.data);
      
      if (result.data?.success) {
        //console.log('2FA verification successful');
        setSuccessMessage('2FA verified successfully. Redirecting...');
        setShow2FAForm(false);
        setTwoFactorCode('');
        setIsChecking2FA(false); // ADD THIS LINE - Clear the flag to allow navigation
        // Navigation will happen in useEffect above
      } else {
        setError(result.data?.error || 'Invalid 2FA code. Please try again.');
        setTwoFactorCode('');
      }
      
    } catch (error) {
      //console.error('2FA verification error:', error);
      setError('Failed to verify 2FA code. Please try again.');
      setTwoFactorCode('');
    } finally {
      setIs2FASubmitting(false);
    }
  };
  
  const handleCancel2FA = () => {
    // Sign out the partially authenticated user
    auth.signOut().catch(console.error);
    
    // Reset all states
    setShow2FAForm(false);
    setTwoFactorCode('');
    setTempAuthData(null);
    setError('');
    setSuccessMessage('');
    setIsChecking2FA(false); // ADD THIS LINE
  };


  const handleGoogleSignInSuccess = async (result, isNewUser) => {
    if (isNewUser) {
      setShowNoAccountMessage(true);
      return;
    }
    
    // Set checking flag to prevent navigation
    setIsChecking2FA(true);
    
    try {
      const user = result.user;
      
      if (!user || !user.uid) {
        //console.log('No user in Google sign-in result');
        setSuccessMessage("Successfully signed in with Google. Redirecting...");
        setIsChecking2FA(false);
        return;
      }
      
      //console.log('Checking 2FA for Google user:', user.uid);
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      //console.log('Google user 2FA status:', userData?.twoFactorEnabled);
      //console.log('Google user has 2FA secret:', !!userData?.twoFactorSecret);
      
      if (userData?.twoFactorEnabled === true && userData?.twoFactorSecret) {
        //console.log('Google user has 2FA enabled, showing 2FA form');
        
        setTempAuthData({
          email: user.email,
          userId: user.uid
        });
        setShow2FAForm(true);
        setSuccessMessage('Please enter your 2FA code to complete sign in.');
        // Keep isChecking2FA true to prevent navigation
        return;
      }
    } catch (error) {
      console.error('Error checking 2FA for Google user:', error);
    }
    
    // No 2FA needed - allow navigation
    setIsChecking2FA(false);
    setSuccessMessage("Successfully signed in with Google. Redirecting...");
  };
  
  /*const handleGoogleSignInSuccess = (result, isNewUser) => {
    if (isNewUser) {
      setShowNoAccountMessage(true);
      return;
    }
    
    // Check if Google user has 2FA enabled
    // This would need to be implemented in your Google sign-in flow
    setSuccessMessage("Successfully signed in with Google. Redirecting...");
    // Navigation will happen in useEffect above once backend data loads
  };*/
  
  const handleGoogleSignInError = (errorMessage) => {
    setError(errorMessage);
  };
  
  const handleAccountConflict = (result) => {
    const email = result.email || result.existingEmail || "";
    navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
  };

  const handleGoBack = () => {
    navigate('/');
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (successMessage) {
      setSuccessMessage('');
    }
    
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    
    if (error) {
      setError('');
    }
  };
  
  const handle2FACodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setTwoFactorCode(value);
    }
    if (error) {
      setError('');
    }
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
      await resetPassword(resetEmail);
      
      const message = `If an account exists for ${resetEmail}, we've sent a password reset link. Please check your email.`;
      setSuccessMessage(message);
      setShowResetForm(false);
      setResetEmail('');
      
    } catch (error) {
      setResetError("Unable to send reset email. Please try again later.");
    } finally {
      setIsSubmittingReset(false);
    }
  };
  
  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      <ResponsiveBanner 
        logo={darkLogo}
        heading={isContinueSignup ? "Continue Application" : "Member Portal"}
        subText={isContinueSignup ? "Sign in to continue where you left off." : "Access your Alcor membership account."}
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
              <p className="text-gray-600 mb-6">Enter your email address below and we'll send you a link to reset your password.</p>
              
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
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
                  placeholder="e.g. john.smith@example.com" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
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
          ) : show2FAForm ? (
            // 2FA Verification Form
            <form onSubmit={handle2FASubmit} className="p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                Two-Factor Authentication
              </h2>
              
              <p className="text-gray-600 mb-6">
                Enter the 6-digit code from your authenticator app to complete sign in.
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                  {error}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="twoFactorCode" className="block text-gray-800 text-base font-medium mb-2">
                  Verification Code
                </label>
                <input 
                  type="text" 
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={handle2FACodeChange}
                  placeholder="000000" 
                  maxLength="6"
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-2xl text-center tracking-widest font-mono"
                  disabled={is2FASubmitting}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  Open your authenticator app to get your code
                </p>
              </div>
              
              <div className="space-y-4">
                <button 
                  type="submit"
                  disabled={is2FASubmitting || twoFactorCode.length !== 6}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {is2FASubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>Verify Code</>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={handleCancel2FA}
                  disabled={is2FASubmitting}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-full font-medium text-base flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Lost access to your authenticator app?
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/support')}
                  className="text-purple-700 hover:underline text-sm mt-1"
                >
                  Contact support for help
                </button>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
                {isContinueSignup ? "Sign in to continue" : "Sign in to your account"}
              </h2>
              
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                  {successMessage}
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                  {error}
                </div>
              )}
              
              {showNoAccountMessage && (
                <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
                  <p className="font-medium mb-3 text-yellow-800">No account exists with this Google account.</p>
                  <p className="mb-4 text-yellow-700">Select 'Create New Account' or continue to sign in another way.</p>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      style={{ backgroundColor: "#172741", color: "white" }}
                      className="py-2 px-4 rounded hover:opacity-90 w-full"
                    >
                      Create New Account
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-800 text-base font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleInputChange}
                  placeholder="e.g. john.smith@example.com" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
                  disabled={loading}
                />
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
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleInputChange}
                  placeholder="Enter your password" 
                  className="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base"
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
                      Signing in...
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
                highlight={highlightGoogleButton}
                setIsSubmitting={setLoading}
                setPendingGoogleLinking={setPendingGoogleLinking}
                label={highlightGoogleButton ? "Sign in with Google (Recommended)" : "Continue with Google"}
                className="py-3 text-base"
              />
              
              <div className="text-center mt-6">
                <p className="text-gray-700 mb-4">
                  Don't have an account?{" "}
                  <Link 
                    to="/signup" 
                    className="text-purple-700 hover:underline"
                    onClick={() => {
                      localStorage.setItem('fresh_signup', 'true');
                    }}
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
              
              {/* New section for existing members without portal access */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Already a member?</span>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-gray-600 text-sm mb-3">
                  If you're an existing Alcor member but don't have portal access yet
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/portal-setup')}
                  className="w-full bg-white border-2 border-purple-600 text-purple-700 py-3 px-6 rounded-full font-medium text-base flex items-center justify-center hover:bg-purple-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Create Portal Account
                </button>
              </div>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Back to Welcome Page
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;