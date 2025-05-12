// File: pages/LoginPage.jsx - With improved navigation after account linking

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import darkLogo from "../assets/images/alcor-white-logo.png";
import Banner from "../components/Banner";
import { 
  auth,
  signInWithEmailAndPassword,
  signInWithGoogle,
  resetPassword,
  logout,
  db,
  linkPasswordToGoogleAccount,
  linkGoogleToEmailAccount
} from "../services/auth";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { 
  useUser,
  saveSignupState
} from "../contexts/UserContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signupState } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [showAddPasswordForm, setShowAddPasswordForm] = useState(false);
  const [showLinkGoogleForm, setShowLinkGoogleForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightGoogleButton, setHighlightGoogleButton] = useState(false);
  const [highlightPasswordForm, setHighlightPasswordForm] = useState(false);
  const [loginMessage, setLoginMessage] = useState(null);
  const [linkingSuccessful, setLinkingSuccessful] = useState(false);
  
  // Determine if this is for continuing signup from the URL
  const searchParams = new URLSearchParams(location.search);
  const isContinueSignup = searchParams.get('continue') === 'signup';
  const emailParam = searchParams.get('email');
  const provider = searchParams.get('provider');
  const addPassword = searchParams.get('addPassword') === 'true';
  const linkAccounts = searchParams.get('linkAccounts') === 'true';
  
  // Account linking states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  
  const [formData, setFormData] = useState({
    email: emailParam || "",
    password: "",
  });
  
  const [resetEmail, setResetEmail] = useState("");
  
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
    reset: "",
    addPassword: "",
    linkGoogle: ""
  });

  // Clear localStorage and sign out on mount
  useEffect(() => {
    const clearAndPrepare = async () => {
      try {
        // First, sign out any existing user
        console.log("DEBUG: Signing out user on login page load");
        try {
          await logout();
        } catch (error) {
          console.log("DEBUG: No user to log out or error during logout:", error);
        }
        
        // Clear verification state
        localStorage.removeItem('alcor_verification_state');
        
        // Set initial form state if email provided
        if (emailParam) {
          setFormData(prev => ({
            ...prev,
            email: emailParam
          }));
        }
        
        // Handle various URL parameters for account linking
        if (emailParam) {
          if (provider === 'google') {
            // Handle Google account users
            setLoginMessage({
              type: 'info',
              content: `This email (${emailParam}) is associated with a Google account. You can sign in with Google or add a password to link your accounts.`
            });
            setHighlightGoogleButton(true);
            
            if (addPassword) {
              setShowAddPasswordForm(true);
            }
          } else if (provider === 'password') {
            // Handle email/password account users trying to use Google
            setLoginMessage({
              type: 'info',
              content: `This email (${emailParam}) already has a password. You can sign in with your password or link your Google account.`
            });
            setHighlightPasswordForm(true);
            
            if (linkAccounts) {
              setShowLinkGoogleForm(true);
            }
          } else if (isContinueSignup) {
            // Generic existing user message
            setLoginMessage({
              type: 'info',
              content: `This email is already registered. Please sign in to continue your membership process.`
            });
          }
        }
      } catch (error) {
        console.error("Error initializing login page:", error);
      }
    };
    
    clearAndPrepare();
  }, [emailParam, isContinueSignup, provider, addPassword, linkAccounts]);

  // Simplified redirect when user becomes authenticated
  useEffect(() => {
    if (currentUser) {
      console.log("DEBUG: User authenticated, getting step from backend");
      console.log("DEBUG: Current user:", currentUser.uid, currentUser.email);
      setIsLoading(true);
      
      // Process user and get step from backend
      const processUser = async () => {
        try {
          // Set up Firebase functions
          const functions = getFunctions();
          
          // Direct approach - call the specific getUserStep function
          // This function will handle all the logic for determining the right step
          console.log("DEBUG: Calling getUserStep Cloud Function");
          const getUserStepFn = httpsCallable(functions, 'getUserStep');
          
          const result = await getUserStepFn({ userId: currentUser.uid });
          
          if (result.data && result.data.success) {
            console.log("DEBUG: getUserStep success:", result.data);
            
            const step = result.data.step || 0;
            const stepName = result.data.stepName || getStepName(step);
            const isNewUser = result.data.isNewUser || false;
            
            // Log what we're going to do
            console.log(`DEBUG: Backend returned step ${step} (${stepName})`);
            console.log(`DEBUG: User is ${isNewUser ? 'new' : 'existing'}`);
            
            // Update local storage with the correct state
            saveSignupState({
              userId: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || "New Member",
              isExistingUser: !isNewUser,
              signupProgress: step,
              signupStep: stepName,
              timestamp: Date.now()
            });
            
            console.log(`DEBUG: Updated local state, navigating to step ${step}`);
            
            // Navigate to the correct step
            navigate(`/signup?step=${step}`);
          } else {
            throw new Error("Backend returned error or unsuccessful response");
          }
        } catch (error) {
          console.error("DEBUG: Error getting step from backend:", error);
          
          // Fallback - Check if this is a Google user and default appropriately
          const isGoogleUser = currentUser.providerData.some(p => p.providerId === 'google.com');
          const fallbackStep = isGoogleUser ? 1 : 0;
          
          console.log(`DEBUG: Falling back to step ${fallbackStep} for ${isGoogleUser ? 'Google' : 'regular'} user`);
          
          // Update local storage with fallback state
          saveSignupState({
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "New Member",
            isExistingUser: !isGoogleUser, // Assume Google users are new
            signupProgress: fallbackStep,
            signupStep: getStepName(fallbackStep),
            timestamp: Date.now()
          });
          
          navigate(`/signup?step=${fallbackStep}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      processUser();
    }
  }, [currentUser, navigate]);

  // Function to get user progress from backend
  const getUserProgressFromBackend = async (userId) => {
    try {
      // This could be a direct Firestore call, Firebase Function, or your own API
      console.log(`DEBUG: Fetching user progress for ${userId} from backend`);
      
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("DEBUG: User document retrieved:", userData);
        return {
          success: true,
          step: userData.signupProgress || 0,
          userData: userData
        };
      } else {
        console.log("DEBUG: No user document found, creating one for new user");
        // Create a basic document for new users
        await setDoc(userDocRef, {
          email: currentUser.email,
          name: currentUser.displayName || "New Member",
          signupProgress: 0,
          signupStep: "account",
          createdAt: new Date(),
          authProvider: determineAuthProvider(currentUser),
          lastSignIn: new Date()
        });
        
        return { success: true, step: 0 };
      }
    } catch (error) {
      console.error("DEBUG: Backend error:", error);
      throw error;
    }
  };

  // Function to update local state to match backend
  const updateLocalState = (user, step) => {
    console.log(`DEBUG: Updating local storage with step ${step}`);
    
    // Update localStorage
    saveSignupState({
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || "New Member",
      isExistingUser: true,
      signupProgress: step,
      signupStep: getStepName(step),
      timestamp: Date.now()
    });
    
    console.log("DEBUG: Local storage updated successfully");
  };

  // Helper to map step numbers to step names
  const getStepName = (step) => {
    const stepMap = {
      0: "account",
      1: "contact_info",
      2: "personal_info",
      3: "payment",
      4: "documents",
      5: "review",
      // Add more steps as needed
    };
    
    return stepMap[step] || "account";
  };
  
  // Helper function to determine auth provider
  const determineAuthProvider = (user) => {
    if (!user || !user.providerData || user.providerData.length === 0) {
      return "unknown";
    }
    
    const providers = user.providerData.map(p => p.providerId);
    
    if (providers.includes("google.com") && providers.includes("password")) {
      return "multiple"; // User has both Google and password
    } else if (providers.includes("google.com")) {
      return "google"; // User only has Google
    } else if (providers.includes("password")) {
      return "password"; // User only has password
    } else {
      return providers[0]; // Return whatever provider is being used
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear errors when the user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    // Clear general error when user types anything
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: ""
      }));
    }
  };
  
  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
    
    // Clear reset error when the user types
    if (errors.reset) {
      setErrors(prev => ({
        ...prev,
        reset: ""
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {
      email: !formData.email.trim() ? "Email is required" : "",
      password: !formData.password.trim() ? "Password is required" : "",
      general: "",
    };
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };
  
  const validateResetForm = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!resetEmail.trim()) {
      setErrors(prev => ({
        ...prev,
        reset: "Email is required"
      }));
      return false;
    }
    
    if (!emailPattern.test(resetEmail)) {
      setErrors(prev => ({
        ...prev,
        reset: "Please enter a valid email address"
      }));
      return false;
    }
    
    return true;
  };
  
  const validatePasswordForm = () => {
    if (!newPassword) {
      setErrors(prev => ({...prev, addPassword: "Password is required"}));
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors(prev => ({...prev, addPassword: "Passwords do not match"}));
      return false;
    }
    
    // Password strength validation
    if (newPassword.length < 8) {
      setErrors(prev => ({...prev, addPassword: "Password must be at least 8 characters"}));
      return false;
    }
    
    // Basic password strength validation
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (newPassword.length < 12 && (!hasUppercase || !hasLowercase || !hasNumber)) {
      setErrors(prev => ({
        ...prev, 
        addPassword: "Password must contain uppercase letters, lowercase letters, and numbers. Alternatively, use 12+ characters with mixed character types."
      }));
      return false;
    }
    
    return true;
  };
  
  const validateLinkGoogleForm = () => {
    if (!currentPassword) {
      setErrors(prev => ({...prev, linkGoogle: "Current password is required"}));
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("DEBUG: Attempting to sign in with email/password");
      console.log(`DEBUG: Email: ${formData.email}, Password length: ${formData.password.length}`);
      
      // Sign in with email and password
      const result = await signInWithEmailAndPassword(formData.email, formData.password);
      console.log("DEBUG: Sign in successful, result:", result);
      
      // Redirect will happen automatically via the useEffect when currentUser changes
    } catch (error) {
      console.error("DEBUG: Login error:", error);
      
      // Handle specific error messages
      if (error.code === "auth/user-not-found" || 
          error.code === "auth/wrong-password" || 
          error.code === "auth/invalid-credential") {
        setErrors(prev => ({
          ...prev,
          general: "Invalid email or password. Please try again."
        }));
      } else if (error.code === "auth/too-many-requests") {
        setErrors(prev => ({
          ...prev,
          general: "Too many failed login attempts. Please try again later or reset your password."
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: error.message || "An error occurred during sign in. Please try again."
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setErrors({
      email: "",
      password: "",
      general: "",
      reset: "",
      addPassword: "",
      linkGoogle: ""
    });
    
    try {
      console.log("DEBUG: Attempting Google sign-in");
      
      // Sign in with Google
      const result = await signInWithGoogle();
      console.log("DEBUG: Google sign-in result:", result);
      
      // Check if there was a linking error
      if (result && result.error === 'auth/account-exists-with-different-credential') {
        // Handle case where email exists but with password auth
        setLoginMessage({
          type: 'warning',
          content: `This email already has a password. Please sign in with your password first to link accounts.`
        });
        setHighlightPasswordForm(true);
        setShowLinkGoogleForm(true);
        setIsSubmitting(false);
        
        // Prefill the email field
        if (result.email) {
          setFormData(prev => ({
            ...prev,
            email: result.email
          }));
        }
        
        return; // Don't proceed with redirect
      }
      
      // If we're in a linking scenario, set the linking successful flag
      if (showLinkGoogleForm || loginMessage?.type === 'success') {
        console.log("DEBUG: Google sign-in was part of account linking");
        setLinkingSuccessful(true);
      }
      
      // Redirect will happen automatically via the useEffect when currentUser changes
    } catch (error) {
      console.error("DEBUG: Google sign-in error:", error);
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.message === 'Sign-in was cancelled') {
        errorMessage = "Google sign-in was cancelled.";
      } else if (error.message && error.message.includes('pop-up')) {
        errorMessage = "Pop-up was blocked. Please enable pop-ups for this site.";
      } else if (error.message && error.message.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "This email is already registered with a password. Please sign in with your password first to link accounts.";
        setHighlightPasswordForm(true);
        setShowLinkGoogleForm(true);
        
        // Prefill the email field if we can extract it from the error
        if (error.email) {
          setFormData(prev => ({
            ...prev,
            email: error.email
          }));
        }
      }
      
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateResetForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(resetEmail);
      
      // Show success message
      setLoginMessage({
        type: 'success',
        content: `Password reset email sent to ${resetEmail}. Please check your inbox and follow the instructions.`
      });
      
      // Reset form and go back to login
      setResetEmail("");
      setShowResetForm(false);
    } catch (error) {
      console.error("Password reset error:", error);
      
      if (error.code === "auth/user-not-found") {
        setErrors(prev => ({
          ...prev,
          reset: "No account found with this email address."
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          reset: error.message || "Failed to send reset email. Please try again."
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle adding password to Google account
  const handleAddPassword = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // First sign in with Google
      await signInWithGoogle();
      console.log("DEBUG: Google sign-in successful for password linking");
      
      // Then link password to the account
      await linkPasswordToGoogleAccount(newPassword);
      console.log("DEBUG: Password successfully linked to Google account");
      
      // Mark linking as successful so we navigate to the appropriate step
      setLinkingSuccessful(true);
      
      // This is just for feedback, but we'll actually navigate away
      setLoginMessage({
        type: 'success',
        content: "Password successfully added to your account. Redirecting to your profile..."
      });
      
      // Reset form fields
      setNewPassword("");
      setConfirmPassword("");
      setShowAddPasswordForm(false);
      
      // The navigation will happen automatically via the useEffect when currentUser changes
    } catch (error) {
      console.error("DEBUG: Error adding password:", error);
      
      let errorMessage = "Failed to add password. Please try again.";
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security reasons, please sign in again before adding a password.";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use with another account.";
      } else if (error.code === 'auth/credential-already-in-use') {
        errorMessage = "This account already has a password. Please use password reset if you forgot it.";
      }
      
      setErrors(prev => ({
        ...prev, 
        addPassword: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle linking Google to password account
  const handleLinkGoogle = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateLinkGoogleForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // First sign in with email & password
      await signInWithEmailAndPassword(formData.email, currentPassword);
      console.log("DEBUG: Email/password sign-in successful for Google linking");
      
      // Then link Google to the account
      await linkGoogleToEmailAccount();
      console.log("DEBUG: Account prepared for Google linking");
      
      // Show success message with instructions
      setLoginMessage({
        type: 'success',
        content: "Account authenticated. Please click 'Continue with Google' to complete the linking process and continue to your profile."
      });
      
      // Reset password field but keep the form visible
      setCurrentPassword("");
      
      // Show a highlighted Google button and hide the password form
      setHighlightGoogleButton(true);
      setHighlightPasswordForm(false);
      setShowLinkGoogleForm(false);
      
      // The user will now need to click the Google button to complete the linking
      // When they do, setLinkingSuccessful will be set to true in handleGoogleSignIn
      // And navigation will occur automatically
    } catch (error) {
      console.error("DEBUG: Error preparing for Google account linking:", error);
      
      let errorMessage = "Failed to authenticate. Please check your password and try again.";
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please check your password and try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later or reset your password.";
      }
      
      setErrors(prev => ({
        ...prev, 
        linkGoogle: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle go back to Welcome page
  const handleGoBack = () => {
    // Clear all state before navigating back
    localStorage.removeItem('alcor_signup_state');
    localStorage.removeItem('alcor_verification_state');
    localStorage.removeItem('navigation_history');
    localStorage.removeItem('alcor_form_data');
    
    // Navigate to Welcome page
    navigate('/');
  };
  
  // Function to register for testing
  const handleRegisterForTesting = () => {
    console.log("Navigating to signup for testing");
    navigate('/signup?step=0');
  };

  // Determine what forms to show based on context
  const showStandardLogin = !showAddPasswordForm && !showLinkGoogleForm;
  const showSignUpOption = !provider && !showAddPasswordForm && !showLinkGoogleForm;

  // Show loading spinner during authentication and progress checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
          <p className="mt-4 text-gray-600">Checking your profile status...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      {/* Header Banner */}
      <Banner 
        logo={darkLogo}
        heading={isContinueSignup ? "Continue Your Membership Application" : "Sign In to Member Portal"}
        subText={isContinueSignup ? "Sign in to continue where you left off." : "Access your Alcor membership account."}
      />
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
          {showResetForm ? (
            // Password Reset Form
            <form onSubmit={handleResetPassword} className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Your Password</h2>
              <p className="text-gray-600 mb-6">Enter your email address below and we'll send you a link to reset your password.</p>
              
              <div className="mb-6">
                <label htmlFor="resetEmail" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  id="resetEmail"
                  value={resetEmail}
                  onChange={handleResetEmailChange}
                  placeholder="e.g. john.smith@example.com" 
                  className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                  disabled={isSubmitting}
                />
                {errors.reset && <p className="text-red-500 text-sm mt-2">{errors.reset}</p>}
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {isSubmitting ? (
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
                  onClick={() => setShowResetForm(false)}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleSubmit} className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {showAddPasswordForm ? "Add Password to Google Account" : 
                 showLinkGoogleForm ? "Link Google Account" :
                 isContinueSignup ? "Sign in to continue" : "Sign in to your account"}
              </h2>
              
              {/* Display any login messages */}
              {loginMessage && (
                <div className={`mb-6 p-4 rounded-md ${
                  loginMessage.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 
                  loginMessage.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                  loginMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-600' : 
                  'bg-blue-50 border border-blue-200 text-blue-600'
                }`}>
                  {loginMessage.content}
                </div>
              )}
              
              {/* Display general errors */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                  {errors.general}
                </div>
              )}
              
              {/* Standard Login Form - Only show when not in special account linking flows */}
              {showStandardLogin && (
                <>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. john.smith@example.com" 
                      className={`w-full px-5 py-4 bg-white border ${highlightPasswordForm ? 'border-blue-400 ring-2 ring-blue-200' : 'border-purple-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg`}
                      disabled={isSubmitting || !!emailParam}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-gray-800 text-lg font-medium">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setShowResetForm(true)} 
                        className="text-purple-700 text-sm hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input 
                      type="password" 
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password" 
                      className={`w-full px-5 py-4 bg-white border ${highlightPasswordForm ? 'border-blue-400 ring-2 ring-blue-200' : 'border-purple-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg`}
                      disabled={isSubmitting}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-2">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: "#6f2d74",
                        color: "white"
                      }}
                      className={`w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70 ${highlightPasswordForm ? 'ring-4 ring-purple-300 animate-pulse' : ''}`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>{highlightPasswordForm ? 'Sign In with Password' : 'Sign In'}</>
                      )}
                    </button>
                  </div>
                </>
              )}
              
              {/* Link Google Account Form */}
              {showLinkGoogleForm && (
                <div className="mt-2 mb-6">
                  <p className="text-gray-600 mb-4">
                    Enter your password and click "Sign In & Link with Google" to connect your Google account.
                    This will allow you to sign in with either Google or email/password in the future.
                  </p>
                  
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-5 py-4 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-lg cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="currentPassword" className="block text-gray-700 text-lg font-medium mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-lg"
                      placeholder="Enter your current password"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {errors.linkGoogle && (
                    <div className="mb-4 text-red-500 text-sm">{errors.linkGoogle}</div>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleLinkGoogle}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-4 px-5 rounded-full font-semibold text-lg hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-5 w-5 mr-2" />
                        Sign In & Link with Google
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Add Password Form */}
              {showAddPasswordForm && (
                <div className="mt-2 mb-6">
                  <p className="text-gray-600 mb-4">
                    Adding a password will allow you to sign in with either Google or email/password.
                    After adding your password, you'll continue to your profile.
                  </p>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-5 py-4 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-lg cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-gray-700 text-lg font-medium mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-lg"
                      placeholder="Create a strong password"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-gray-700 text-lg font-medium mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-lg"
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {errors.addPassword && (
                    <div className="mb-4 text-red-500 text-sm">{errors.addPassword}</div>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleAddPassword}
                    disabled={isSubmitting}
                    className="w-full bg-purple-600 text-white py-4 px-5 rounded-full font-semibold text-lg hover:bg-purple-700 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Add Password & Continue"
                    )}
                  </button>
                </div>
              )}
              
              {/* Show the Google Sign-In option except in password-only linking flow */}
              {(!showLinkGoogleForm || loginMessage?.type === 'success') && (
                <>
                  <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
                    <div className="flex-grow border-t border-gray-300"></div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    className={`w-full bg-white border ${highlightGoogleButton ? 'border-blue-500 ring-2 ring-blue-200 animate-pulse' : 'border-gray-300'} text-gray-700 py-4 px-6 rounded-full font-medium text-lg mb-6 flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70`}
                  >
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
                    {highlightGoogleButton && loginMessage?.type === 'success' 
                      ? 'Continue with Google to Complete Linking' 
                      : highlightGoogleButton 
                        ? 'Sign in with Google (Recommended)' 
                        : 'Continue with Google'}
                  </button>
                </>
              )}
              
              {/* Only show the sign-up option for normal login flow */}
              {showSignUpOption && (
                <div className="text-center mt-6">
                  <p className="text-gray-700 mb-4">
                    Don't have an account?{" "}
                    <button 
                      type="button" 
                      onClick={handleRegisterForTesting}
                      className="text-purple-700 hover:underline"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              )}
              
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