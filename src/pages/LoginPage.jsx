// File: pages/LoginPage.jsx - With improved navigation and skip options for both auth flows

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import darkLogo from "../assets/images/alcor-white-logo.png";
import ResponsiveBanner from "../components/ResponsiveBanner";
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDoc, doc, setDoc } from "firebase/firestore";
import { 
  useUser,
  saveSignupState
} from "../contexts/UserContext";
import PasswordField from "../components/signup/PasswordField"; // Import PasswordField

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
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [pendingGoogleLinking, setPendingGoogleLinking] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [showNoAccountMessage, setShowNoAccountMessage] = useState(false);
  
  // Determine if this is for continuing signup from the URL
  const searchParams = new URLSearchParams(location.search);
  const isContinueSignup = searchParams.get('continue') === 'signup';
  const emailParam = searchParams.get('email');
  const provider = searchParams.get('provider');
  const addPasswordParam = searchParams.get('addPassword') === 'true'; // Renamed to avoid conflict
  const linkAccountsParam = searchParams.get('linkAccounts') === 'true'; // Renamed to avoid conflict
  
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

  // ONLY modify the useEffect in LoginPage.jsx to prevent logout when adding password to Google account
// This is a minimal change to fix Scenario 1

useEffect(() => {
    const checkAuthAndSetup = async () => {
      try {
        // Get current authentication state
        const currentUser = auth.currentUser;
        console.log("DEBUG: Current user on login page load:", currentUser?.uid);
        
        // If we're adding a password to a Google account, check if they're authenticated with Google
        if (provider === 'google' && addPasswordParam) {
          console.log("DEBUG: In add password to Google flow");
          
          // Check if user is authenticated with Google
          const isGoogleUser = currentUser && 
                              currentUser.providerData && 
                              currentUser.providerData.some(p => p.providerId === 'google.com');
          
          console.log("DEBUG: Is Google authenticated:", isGoogleUser);
          setIsGoogleAuthenticated(isGoogleUser);
          
          if (isGoogleUser) {
            console.log("DEBUG: User is authenticated with Google, showing password form");
            setShowAddPasswordForm(true);
            
            // Set email from current user if not provided in URL
            if (!emailParam && currentUser.email) {
              setFormData(prev => ({
                ...prev,
                email: currentUser.email
              }));
            }
            
            // No need to do anything else for this flow
            return;
          }
        }
        
        // For all other scenarios, log out and start fresh
        console.log("DEBUG: Not in Google+addPassword flow or not authenticated, signing out");
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
            
            if (addPasswordParam) {
              setShowAddPasswordForm(true);
            }
          } else if (provider === 'password') {
            // Handle email/password account users trying to use Google
            setLoginMessage({
              type: 'info',
              content: `This email (${emailParam}) already has a password. You can sign in with your password or link your Google account.`
            });
            setHighlightPasswordForm(true);
            
            if (linkAccountsParam) {
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
    
    checkAuthAndSetup();
  }, [emailParam, isContinueSignup, provider, addPasswordParam, linkAccountsParam]);

  // Modified redirect when user becomes authenticated
  useEffect(() => {
    // Only proceed with navigation if we should navigate
    // This helps prevent premature navigation during linking flows
    if (currentUser && shouldNavigate) {
      console.log("DEBUG: User authenticated and shouldNavigate=true, getting step from backend");
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
          setShouldNavigate(false); // Reset flag after navigation
        }
      };
      
      processUser();
    } else if (currentUser && pendingGoogleLinking) {
      // This case handles when a user is authenticated and has pending Google linking
      console.log("DEBUG: User authenticated with pending Google linking");
      setLoginMessage({
        type: 'success',
        content: "Account authenticated. Please click 'Continue with Google' to complete the linking process."
      });
      setHighlightGoogleButton(true);
      setPendingGoogleLinking(false);
    }
  }, [currentUser, navigate, shouldNavigate, pendingGoogleLinking]);

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
  
    // Clear the "No Account Message" if it's showing
    if (showNoAccountMessage) {
      setShowNoAccountMessage(false);
    }
    
    // Clear any success/info messages when user starts typing again
    if (loginMessage) {
      setLoginMessage(null);
    }
    
    // Handle specific password fields for "Add Password" form
    if (name === "newPassword") {
      setNewPassword(value);
    } else if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear errors when the user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    if (name === "newPassword" && errors.addPassword) {
      setErrors(prev => ({...prev, addPassword: ""}));
    }
    if (name === "confirmPassword" && errors.addPassword) {
      setErrors(prev => ({...prev, addPassword: ""}));
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
    let currentAddPasswordError = "";

    if (!newPassword) {
      currentAddPasswordError = "Password is required";
    } else if (newPassword !== confirmPassword) {
      currentAddPasswordError = "Passwords do not match";
    } else {
        // Password strength validation (consistent with PasswordField and SignupPage)
        if (newPassword.length < 8) {
            currentAddPasswordError = "Password must be at least 8 characters";
        } else {
            const hasUppercase = /[A-Z]/.test(newPassword);
            const hasLowercase = /[a-z]/.test(newPassword);
            const hasNumber = /[0-9]/.test(newPassword);
            // const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);


            if (newPassword.length < 12 && (!hasUppercase || !hasLowercase || !hasNumber)) {
                 currentAddPasswordError = "Password must contain uppercase letters, lowercase letters, and numbers. Alternatively, use 12+ characters with mixed character types.";
            }
            // More detailed checks can be added here if desired, aligning with PasswordField.jsx logic
            // For now, the visual feedback will come from PasswordField component itself.
        }
    }
    
    if (currentAddPasswordError) {
        setErrors(prev => ({...prev, addPassword: currentAddPasswordError}));
        return false;
    }
    setErrors(prev => ({...prev, addPassword: ""})); // Clear error if validation passes
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
      
      // Set flag to allow navigation
      setShouldNavigate(true);
      
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
      
      // Special case for account linking - proceed as normal
      if (showLinkGoogleForm || loginMessage?.type === 'success') {
        console.log("DEBUG: In account linking flow, proceeding with Google sign-in");
        const result = await signInWithGoogle();
        
        if (result && result.success) {
          console.log("DEBUG: Google sign-in was part of account linking");
          setLinkingSuccessful(true);
          setShouldNavigate(true);
        }
        return;
      }
      
      // Call your existing signInWithGoogle function
      const result = await signInWithGoogle();
      console.log("DEBUG: Google sign-in result:", result);
      
      // Check if this is a new user from the result
      if (result && result.isNewUser) {
        console.log("DEBUG: This was a new account creation - not allowed from login page");
        
        // If your signInWithGoogle returns the user, use it to delete the user
        if (result.user) {
          await result.user.delete();
        } else {
          // If not, use the current user
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.delete();
          }
        }
        
        // Show inline message with options
        setShowNoAccountMessage(true);
        setIsSubmitting(false);
        return;
      }
      
      // If we get here, this was a successful sign-in to an existing account
      console.log("DEBUG: Successful sign-in to existing Google account");
      setShouldNavigate(true);
      
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
  
  const handleAddPassword = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validatePasswordForm()) return; // Uses updated validation
    
    setIsSubmitting(true);
    
    try {
      // Verify Google authentication
      const currentUser = auth.currentUser;
      const isGoogleAuthenticated = currentUser && 
                                  currentUser.providerData && 
                                  currentUser.providerData.some(p => p.providerId === 'google.com');
      
      console.log("DEBUG: Current user in handleAddPassword:", currentUser?.uid);
      console.log("DEBUG: Is Google authenticated:", isGoogleAuthenticated);
      
      // If not already authenticated with Google, authenticate now
      if (!currentUser || !isGoogleAuthenticated) {
        console.log("DEBUG: Not authenticated with Google, signing in now");
        
        try {
          const result = await signInWithGoogle();
          console.log("DEBUG: Google sign-in result:", result);
          
          if (!result.success) {
            throw new Error(result.message || "Failed to sign in with Google");
          }
          
          // Re-check authentication state after Google sign-in
          const updatedUser = auth.currentUser;
          const nowAuthenticated = updatedUser && 
                                updatedUser.providerData && 
                                updatedUser.providerData.some(p => p.providerId === 'google.com');
                                
          if (!nowAuthenticated) {
            throw new Error("Google authentication failed. Please try again.");
          }
          
          console.log("DEBUG: Successfully authenticated with Google, proceeding with password linking");
        } catch (authError) {
          console.error("DEBUG: Error during Google authentication:", authError);
          throw authError; // Re-throw to be caught by outer catch
        }
      }
      
      console.log("DEBUG: User is authenticated with Google, proceeding with password linking");
      
      // At this point, we should have a Google-authenticated user
      // Link password to the account
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
      
      // Now it's safe to navigate
      setTimeout(() => {
        setShouldNavigate(true);
      }, 1500);
      
    } catch (error) {
      console.error("DEBUG: Error adding password:", error);
      
      let errorMessage = "Failed to add password. Please try again.";
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security reasons, please sign in again with Google by clicking 'Continue with Google' below.";
        
        // Show the Google button in case of re-authentication needs
        setShowAddPasswordForm(false);
        setHighlightGoogleButton(true);
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use with another account.";
      } else if (error.code === 'auth/credential-already-in-use') {
        errorMessage = "This account already has a password. Please use password reset if you forgot it.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors(prev => ({
        ...prev, 
        addPassword: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

// Updated handler for skipping password add with proper navigation
const handleSkipPasswordAdd = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Check if already authenticated
      const currentUser = auth.currentUser;
      const isGoogleUser = currentUser && 
                          currentUser.providerData && 
                          currentUser.providerData.some(p => p.providerId === 'google.com');
      
      console.log("DEBUG: In handleSkipPasswordAdd, authenticated:", !!currentUser);
      console.log("DEBUG: Is Google user:", isGoogleUser);
      
      if (currentUser && isGoogleUser) {
        console.log("DEBUG: Already authenticated with Google, proceeding without re-authentication");
        
        // Show a clear message to the user
        setLoginMessage({
          type: 'success',
          content: "Continuing with Google account only. You can add a password later in your settings."
        });
        
        // Ensure we get the user's current step before navigation
        setIsLoading(true);
        
        try {
          // Set up Firebase functions
          const functions = getFunctions();
          
          // Call the getUserStep function to get the user's current progress
          console.log("DEBUG: Calling getUserStep to get current step");
          const getUserStepFn = httpsCallable(functions, 'getUserStep');
          
          const result = await getUserStepFn({ userId: currentUser.uid });
          
          if (result.data && result.data.success) {
            console.log("DEBUG: getUserStep success:", result.data);
            
            const step = result.data.step || 0;
            const stepName = result.data.stepName || getStepName(step);
            
            // Save the state before navigation
            saveSignupState({
              userId: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || "New Member",
              isExistingUser: true, // This is an existing user
              signupProgress: step,
              signupStep: stepName,
              timestamp: Date.now()
            });
            
            console.log(`DEBUG: Will navigate to step ${step} (${stepName})`);
            
            // Allow the message to be seen before navigation
            setTimeout(() => {
              setIsLoading(false);
              navigate(`/signup?step=${step}`);
            }, 1500);
          } else {
            throw new Error("Error getting user step");
          }
        } catch (error) {
          console.error("DEBUG: Error getting user step:", error);
          
          // Fallback - Check if this is a Google user and default appropriately
          const fallbackStep = isGoogleUser ? 1 : 0;
          
          console.log(`DEBUG: Falling back to step ${fallbackStep}`);
          
          // Update local storage with fallback state
          saveSignupState({
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "New Member",
            isExistingUser: true,
            signupProgress: fallbackStep,
            signupStep: getStepName(fallbackStep),
            timestamp: Date.now()
          });
          
          // Navigate after delay
          setTimeout(() => {
            setIsLoading(false);
            navigate(`/signup?step=${fallbackStep}`);
          }, 1500);
        }
      } else {
        // Need to authenticate with Google first
        console.log("DEBUG: Not authenticated with Google yet, signing in");
        
        // Make the Google sign-in call and ensure it succeeds
        const result = await signInWithGoogle();
        
        if (!result || !result.success) {
          throw new Error("Google authentication failed or was canceled");
        }
        
        // Now that we're authenticated, get the current user again
        const authenticatedUser = auth.currentUser;
        
        console.log("DEBUG: Google sign-in successful", authenticatedUser?.uid);
        
        // Show success message
        setLoginMessage({
          type: 'success',
          content: "Successfully signed in with Google. Continuing to your profile..."
        });
        
        // Just like above, ensure we get the user's current step
        setIsLoading(true);
        
        try {
          // Set up Firebase functions
          const functions = getFunctions();
          
          // Call the getUserStep function
          console.log("DEBUG: Calling getUserStep after authentication");
          const getUserStepFn = httpsCallable(functions, 'getUserStep');
          
          const stepResult = await getUserStepFn({ userId: authenticatedUser.uid });
          
          if (stepResult.data && stepResult.data.success) {
            console.log("DEBUG: getUserStep success:", stepResult.data);
            
            const step = stepResult.data.step || 0;
            const stepName = stepResult.data.stepName || getStepName(step);
            
            // Save the state before navigation
            saveSignupState({
              userId: authenticatedUser.uid,
              email: authenticatedUser.email,
              displayName: authenticatedUser.displayName || "New Member",
              isExistingUser: true, // This is an existing user
              signupProgress: step,
              signupStep: stepName,
              timestamp: Date.now()
            });
            
            console.log(`DEBUG: Will navigate to step ${step} (${stepName})`);
            
            // Navigate after delay
            setTimeout(() => {
              setIsLoading(false);
              navigate(`/signup?step=${step}`);
            }, 1500);
          } else {
            throw new Error("Error getting user step");
          }
        } catch (error) {
          console.error("DEBUG: Error getting user step after authentication:", error);
          
          // Fallback - Default to step 1 for Google users
          const fallbackStep = 1;
          
          console.log(`DEBUG: Falling back to step ${fallbackStep}`);
          
          // Update local storage with fallback state
          saveSignupState({
            userId: authenticatedUser.uid,
            email: authenticatedUser.email,
            displayName: authenticatedUser.displayName || "New Member",
            isExistingUser: true,
            signupProgress: fallbackStep,
            signupStep: getStepName(fallbackStep),
            timestamp: Date.now()
          });
          
          // Navigate after delay
          setTimeout(() => {
            setIsLoading(false);
            navigate(`/signup?step=${fallbackStep}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error("DEBUG: Error during Google sign-in after skip:", error);
      
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.message === 'Sign-in was cancelled') {
        errorMessage = "Google sign-in was cancelled. You must complete the sign-in to continue.";
      } else if (error.message && error.message.includes('pop-up')) {
        errorMessage = "Pop-up was blocked. Please enable pop-ups for this site.";
      }
      
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
      
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };
  
  // Updated function to properly complete authentication
  const handleSkipGoogleLinking = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Don't call the form handler - instead directly call sign in function
      console.log("DEBUG: Skipping Google linking, proceeding with just password auth");
      
      // Make sure we have email and password
      if (!formData.email.trim() || !currentPassword.trim()) {
        setErrors(prev => ({
          ...prev,
          linkGoogle: "Please enter your password to continue"
        }));
        setIsSubmitting(false);
        return;
      }
      
      // Sign in directly with email and password
      const authResult = await signInWithEmailAndPassword(formData.email, currentPassword);
      
      // signInWithEmailAndPassword from auth.js returns the userCredential on success
      // or throws an error. So, if it doesn't throw, it's successful.
      // We don't need to check authResult.success if it's directly from Firebase.
      // However, if your signInWithEmailAndPassword is a wrapper that returns an object,
      // then you might need a check like: if (!authResult || !authResult.success)
      
      console.log("DEBUG: Password sign-in successful");
      
      // Show a clear message to the user that they're proceeding without linking
      setLoginMessage({
        type: 'success',
        content: `Successfully signed in as ${formData.email}. Continuing without linking Google account.`
      });
      
      // Force a delay to show the success message before navigating
      setTimeout(() => {
        console.log("DEBUG: Navigating to signup step");
        setShouldNavigate(true);
        // The navigation will happen automatically through the useEffect that watches currentUser
      }, 1000);
      
    } catch (error) {
      console.error("DEBUG: Error during password sign-in after skipping Google:", error);
      
      let errorMessage = "Failed to sign in. Please check your password and try again.";
      
      if (error.code === "auth/user-not-found" || 
          error.code === "auth/wrong-password" || 
          error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      
      setErrors(prev => ({
        ...prev,
        linkGoogle: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
// Modify the handleResetPassword function in LoginPage.jsx

const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateResetForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("DEBUG: Attempting to send reset password email for:", resetEmail);
      
      // Call the resetPassword function
      const result = await resetPassword(resetEmail);
      
      // Always show success, even if email doesn't exist (for security)
      setLoginMessage({
        type: 'success',
        content: `If an account exists for ${resetEmail}, we've sent a password reset link. Please check your email.`
      });
      
      // Clear any existing error messages
      setErrors({
        email: "",
        password: "",
        general: "",
        reset: "",
        addPassword: "",
        linkGoogle: ""
      });
      
      // Clear the form and go back to login
      setResetEmail("");
      setShowResetForm(false);
      
    } catch (error) {
      console.error("DEBUG: Error in reset password:", error);
      
      // Generic error message that doesn't reveal if email exists
      setErrors(prev => ({
        ...prev,
        reset: "Unable to send reset email. Please try again later."
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

// Modified handleLinkGoogle function for LoginPage.jsx
const handleLinkGoogle = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (!validateLinkGoogleForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // First sign in with email & password
      await signInWithEmailAndPassword(formData.email, currentPassword);
      console.log("DEBUG: Email/password sign-in successful for Google linking");

      // Create a Firebase Functions instance for direct linking
      const functions = getFunctions();
      const finalizeGoogleLinking = httpsCallable(functions, 'finalizeGoogleLinking');
      
      // Call the cloud function to finalize the linking
      // This will check if the user already has both auth providers
      const result = await finalizeGoogleLinking();
      
      if (result.data && result.data.success) {
        console.log("DEBUG: Account linking successful via cloud function");
        
        // Show success message
        setLoginMessage({
          type: 'success',
          content: "Your accounts have been successfully linked! Redirecting to your profile..."
        });
        
        // Set a slight delay before navigating to allow the user to see the success message
        setTimeout(() => {
          setShouldNavigate(true);
        }, 1500);
      } else {
        throw new Error(result.data?.error || "Failed to link accounts");
      }
    } catch (error) {
      console.error("DEBUG: Error during account linking:", error);
      
      let errorMessage = "Failed to authenticate. Please check your password and try again.";
      
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect password. Please check your password and try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later or reset your password.";
      } else if (error.message) {
        errorMessage = error.message;
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
    <ResponsiveBanner 
    logo={darkLogo}
    heading={isContinueSignup ? "Continue Your Membership Application" : "Sign In to Member Portal"}
    subText={isContinueSignup ? "Sign in to continue where you left off." : "Access your Alcor membership account."}
    showSteps={false}
    showStar={true}
    showProgressBar={false}
    useGradient={true} // Use gradient styling instead of isWelcomePage
    textAlignment="center" // Center the text for login page
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

                {/* No Account Message - ADD THIS HERE */}
                {/* No Account Message */}
                {showNoAccountMessage && (
                <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
                    <p className="font-medium mb-3 text-yellow-800">No account exists with this Google account.</p>
                    <p className="mb-4 text-yellow-700">Select 'Create New Account' or continue to sign in another way.</p>
                    <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/signup?step=0')}
                        style={{ backgroundColor: "#172741", color: "white" }}
                        className="py-2 px-4 rounded hover:opacity-90 w-full"
                    >
                        Create New Account
                    </button>
                    </div>
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
                        onClick={() => {
                            if (formData.email) { setResetEmail(formData.email); }
                            setShowResetForm(true);
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
              
              {/* Link Google Account Form - WITH SKIP OPTION & FORGOT PASSWORD */}
              {showLinkGoogleForm && (
                <div className="mt-2 mb-6">
                  <p className="text-gray-600 mb-4">
                    Enter your current Alcor password to connect your Google account.
                    This will allow you to sign in with either Google or your email/password in the future.
                  </p>
                  
                  <div className="mb-6">
                    <label htmlFor="linkEmail" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      id="linkEmail"
                      name="email" // Keep name as email to align with formData
                      value={formData.email}
                      readOnly
                      className="w-full px-5 py-4 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-lg cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="currentPassword" className="block text-gray-700 text-lg font-medium">
                        Current Password
                        </label>
                        <button 
                            type="button" 
                            onClick={() => {
                                if (formData.email) { setResetEmail(formData.email); }
                                setShowResetForm(true);
                            }} 
                            className="text-purple-700 text-sm hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-lg"
                      placeholder="Enter your current Alcor password"
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  {errors.linkGoogle && (
                    <div className="mb-4 text-red-500 text-sm">{errors.linkGoogle}</div>
                  )}
                  
                  <div className="space-y-3">
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
                    
                    {/* Skip option for Google linking */}
                    <button
                      type="button"
                      onClick={handleSkipGoogleLinking}
                      disabled={isSubmitting}
                      className="w-full border border-gray-300 text-gray-700 py-4 px-5 rounded-full font-medium text-lg hover:bg-gray-50 disabled:opacity-70"
                    >
                      {isSubmitting ? "Processing..." : "Skip and Continue with Password Only"}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Add Password Form with Skip Option and Enhanced Password Field */}
              {showAddPasswordForm && (
                <div className="mt-2 mb-6">
                  <p className="text-gray-600 mb-4">
                    Adding a password will allow you to sign in with either Google or email/password.
                    After adding your password, you'll continue to your profile.
                  </p>
                  
                  <div className="mb-4">
                    <label htmlFor="addPasswordEmail" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      id="addPasswordEmail"
                      name="email" // Keep name as email
                      value={formData.email}
                      readOnly
                      className="w-full px-5 py-4 bg-gray-100 border border-gray-300 rounded-md text-gray-800 text-lg cursor-not-allowed"
                    />
                  </div>
                  
                  <PasswordField
                    id="newPassword"
                    name="newPassword" // Ensure name is passed to handleChange
                    value={newPassword}
                    onChange={handleChange} // Use the main handleChange
                    isSubmitting={isSubmitting}
                    error={errors.addPassword} // Pass the specific error for this form
                    label="New Password"
                    placeholder="Create a strong password"
                    className="mb-4" // Adjust margin as needed
                    inputClassName="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-lg"
                    labelClassName="block text-gray-700 text-lg font-medium mb-2"
                    errorClassName="text-red-500 text-sm mt-1"
                  />
                  
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-gray-700 text-lg font-medium mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword" // Ensure name is passed to handleChange
                      value={confirmPassword}
                      onChange={handleChange} // Use the main handleChange
                      className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-lg"
                      placeholder="Confirm your password"
                      disabled={isSubmitting}
                    />
                     {/* Display password match error if passwords don't match but no other addPassword error exists */}
                    {errors.addPassword && errors.addPassword === "Passwords do not match" && (
                        <p className="text-red-500 text-sm mt-1">{errors.addPassword}</p>
                    )}
                  </div>
                  
                  {/* Display general addPassword errors not covered by PasswordField or specific match error */}
                  {errors.addPassword && errors.addPassword !== "Passwords do not match" && (
                    <div className="mb-4 text-red-500 text-sm">{errors.addPassword}</div>
                  )}
                  
                  <div className="space-y-3">
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
                    
                    {/* Skip Password Option */}
                    <button
                      type="button"
                      onClick={handleSkipPasswordAdd}
                      disabled={isSubmitting}
                      className="w-full border border-gray-300 text-gray-700 py-4 px-5 rounded-full font-medium text-lg hover:bg-gray-50 disabled:opacity-70"
                    >
                      {isSubmitting ? "Processing..." : "Skip and Continue with Google Only"}
                    </button>
                  </div>
                </div>
              )}
              
              
              {/* Show the Google Sign-In option except in password-only linking flow */}
              {(!showLinkGoogleForm || loginMessage?.type === 'success') && !showAddPasswordForm && (
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
                      : isGoogleAuthenticated 
                        ? 'Continue with Google' 
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