// src/services/auth.js
import { auth, db, functions } from './firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  linkWithPopup,
  fetchSignInMethodsForEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import {
  httpsCallable
} from 'firebase/functions';
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion
} from 'firebase/firestore';

// Import storage functions from the new storage.js file
import { 
  saveSignupState, 
  saveVerificationState, 
  getVerificationState, 
  clearVerificationState 
} from './storage';

// Environment flag - true for development, false for production
const isDevelopment = import.meta.env.MODE === 'development';

// Define step mappings to match backend structure
// Define step mappings to match backend structure
export const SIGNUP_STEPS = {
  ACCOUNT: 0,
  SUCCESS: 1,
  CONTACT_INFO: 2,
  PACKAGE: 3,
  FUNDING: 4,
  MEMBERSHIP: 5,
  COMPLETION: 6,    // NEW
  PAYMENT: 7,       // NEW
  WELCOME: 8        // NEW
};

export const STEP_NAMES = {
  0: "account",
  1: "success",
  2: "contact_info",
  3: "package",
  4: "funding",
  5: "membership",
  6: "completion",  // NEW
  7: "payment",     // NEW
  8: "welcome"      // NEW
};

let pendingLinkingEmail = null;

export const getStepName = (step) => STEP_NAMES[step] || "account";
export const getStepNumber = (stepName) => {
  for (const [key, value] of Object.entries(STEP_NAMES)) {
    if (value === stepName) return parseInt(key);
  }
  return 0; // Default to account step
};

// Simplified sign in function with better credential error handling
export const signInWithEmailAndPassword = async (email, password) => {
    // console.log("DEBUG: Starting simplified signInWithEmailAndPassword process");
    
    try {
      // Input validation
      if (!email || !password) {
        // console.log("DEBUG: Email or password missing");
        throw new Error('Email and password are required');
      }
      
      // First, sign out any existing user
      // console.log("DEBUG: Signing out any current user");
      try {
        await auth.signOut();
        // console.log("DEBUG: Sign out successful or no user was logged in");
      } catch (signOutError) {
        console.error("DEBUG: Error during sign out:", signOutError);
        // Continue anyway
      }
      
      // console.log("DEBUG: Attempting to sign in with Firebase");
      // console.log(`DEBUG: Using email: ${email}, password length: ${password.length}`);
      
      // Use a try-catch specifically for the sign-in operation
      try {
        // Sign in with Firebase - this is the core authentication
        const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
        // console.log("DEBUG: Sign in successful, user:", userCredential.user.uid);
        
        // Save minimal signup state to localStorage without trying to access Firestore
        // console.log("DEBUG: Saving minimal signup state to localStorage");
        saveSignupState({
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || "New Member",
          isExistingUser: true, // Assume existing user since they're able to log in
          signupProgress: SIGNUP_STEPS.ACCOUNT, // Default to account step
          signupStep: "account",
          timestamp: Date.now()
        });
        // console.log("DEBUG: Saved minimal signup state to localStorage");
        
        return {
          success: true,
          user: userCredential.user
        };
      } catch (signInError) {
        console.error("DEBUG: Firebase authentication error:", signInError);
        
        // Handle specific authentication errors
        if (signInError.code === 'auth/invalid-credential' || 
            signInError.code === 'auth/user-not-found' || 
            signInError.code === 'auth/wrong-password') {
          throw {
            code: 'auth/invalid-credential',
            message: 'Invalid email or password. Please check your credentials and try again.If you created your account with Google, log in with the Google button below.'
          };
        }
        
        // For any other errors, just pass them through
        throw signInError;
      }
    } catch (error) {
      console.error("DEBUG: Error signing in with email/password:", error);
      throw error;
    }
  };

// Updated handleGoogleSignIn with better navigation
const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    // console.log("Starting Google sign-in process");
    
    setIsSubmitting(true);
    setErrors({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: "",
      verificationCode: "",
      general: ""
    });
    
    try {
      // console.log("Calling signInWithGoogle()");
      const result = await signInWithGoogle();
      
      // console.log("Google sign-in result:", result);
      
      // Check specifically for account conflict
      if (result && result.accountConflict === true) {
        pendingLinkingEmail = result.email || '';
        // console.log(`Account conflict detected for email: ${result.existingEmail}`);
        
        // Navigate directly to login page for account linking
        // console.log(`Redirecting to login for account linking`);
        
        const email = result.existingEmail || "";
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      // Also check for the error code directly
      if (result && result.error === 'auth/account-exists-with-different-credential') {
        // console.log(`Account conflict detected from error code`);
        
        const email = result.email || "";
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      if (result && result.success) {
        // Clear verification state since we're now authenticated
        clearVerificationState();
        // console.log("Cleared verification state");
        
        // Set hasNavigatedRef to true to show success screen
        hasNavigatedRef.current = true;
        // console.log("Set hasNavigatedRef to true");
        
        // After sign-in, wait a moment for auth state to update
        setTimeout(() => {
          // Navigate to signup with showSuccess parameter
          // console.log("Navigating to signup with showSuccess parameter");
          navigate('/signup?step=1&showSuccess=true', { replace: true });
        }, 500);
      } else {
        console.error("Google sign-in did not return success=true");
        
        // Show error message
        setErrors(prev => ({
          ...prev,
          general: result?.message || "Failed to sign in with Google. Please try again."
        }));
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      
      // Check for specific error that indicates a conflict
      if (error.code === 'auth/account-exists-with-different-credential') {
        // console.log("Caught auth/account-exists-with-different-credential error");
        
        const email = error.customData?.email || "";
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      // Handle other errors
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (error.message === 'Sign-in was cancelled') {
        errorMessage = "Google sign-in was cancelled. Please try again.";
      } else if (error.message && error.message.includes('popup')) {
        errorMessage = "Pop-up was blocked. Please enable pop-ups for this site and try again.";
      } else if (error.message && error.message.includes('network')) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      setErrors(prev => ({
        ...prev,
        general: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
      // console.log("Setting isSubmitting back to false");
    }
  };

  export const getPendingLinkingEmail = () => {
    const email = pendingLinkingEmail;
    // Clear it after retrieving
    pendingLinkingEmail = null;
    return email;
  };

  export const linkGoogleToEmailAccount = async () => {
    try {
      // console.log("DEBUG: Linking Google account to password-based account");
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Store the current user's email
      const userEmail = currentUser.email;
      // console.log(`DEBUG: Current user email: ${userEmail}`);
      
      // Create Google auth provider
      const googleProvider = new GoogleAuthProvider();
      
      // Set login hint to force selection of the right Google account
      googleProvider.setCustomParameters({
        login_hint: userEmail
      });
      
      // Link the Google account to the current user
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        // console.log("DEBUG: Successfully linked Google account");
        
        // Update user document to reflect multiple auth methods
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            hasGoogleAuth: true,
            authProvider: "multiple",
            authProviders: arrayUnion("google.com"),
            lastUpdated: new Date()
          });
          // console.log("DEBUG: Updated user document with Google auth info");
        } catch (firestoreError) {
          console.error("DEBUG: Error updating user document:", firestoreError);
          // Continue despite error - the Google account is still linked
        }
        
        return { 
          success: true,
          user: result.user
        };
      } catch (linkError) {
        console.error("DEBUG: Linking error:", linkError);
        
        if (linkError.code === 'auth/credential-already-in-use') {
          // console.log("DEBUG: Detected credential already in use");
          
          // This means a Google account with this email already exists separately
          // Let the user know they need to use their password account
          return {
            success: false,
            error: linkError.code,
            message: "A Google account with this email already exists separately. Please continue with your password account."
          };
        }
        
        // For other errors, just pass them through
        throw linkError;
      }
    } catch (error) {
      console.error("DEBUG: Error linking Google account:", error);
      throw error;
    }
  };

  export const linkPasswordToGoogleAccount = async (password) => {
    try {
      // console.log("DEBUG: Linking password to Google account");
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Check if this is actually a Google-authenticated user
      const isGoogleUser = currentUser.providerData.some(p => p.providerId === 'google.com');
      if (!isGoogleUser) {
        console.error("DEBUG: Not a Google-authenticated user");
        throw new Error("User must be authenticated with Google to add a password");
      }
      
      // Check if the user already has password auth
      const hasPasswordAuth = currentUser.providerData.some(p => p.providerId === 'password');
      if (hasPasswordAuth) {
        // console.log("DEBUG: User already has password auth");
        throw new Error("This account already has a password");
      }
      
      // Create email credential
      const emailCredential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      // Link the credential to the current user
      await linkWithCredential(currentUser, emailCredential);
      // console.log("DEBUG: Successfully linked password to Google account");
      
      // Update user document to reflect multiple auth methods
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Update existing document
          await updateDoc(userRef, {
            hasPasswordAuth: true,
            authProvider: "multiple",
            authProviders: arrayUnion("password"),
            lastUpdated: new Date()
          });
        } else {
          // Create new document
          await setDoc(userRef, {
            email: currentUser.email,
            name: currentUser.displayName || "New Member",
            hasPasswordAuth: true,
            hasGoogleAuth: true,
            authProvider: "multiple",
            authProviders: ["google.com", "password"],
            signupProgress: SIGNUP_STEPS.CONTACT_INFO, // Default to contact_info step
            signupStep: "contact_info",
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        }
        
        // console.log("DEBUG: Updated user document with password auth info");
      } catch (firestoreError) {
        console.error("DEBUG: Error updating user document:", firestoreError);
        // Continue despite error - the password is still linked
      }
      
      return { success: true };
    } catch (error) {
      console.error("DEBUG: Error linking password:", error);
      throw error;
    }
  };

// Password reset function for login page
export const resetPassword = async (email) => {
    try {
      // Input validation
      if (!email) {
        throw new Error('Email is required');
      }
      
      // Get Firebase functions
      const authCoreFn = httpsCallable(functions, 'authCore');
      
      // Call the consolidated auth function
      const result = await authCoreFn({ 
        action: 'sendPasswordResetLink',
        email 
      });
      
      // Always return success for security reasons
      // console.log("Password reset email sent for:", email);
      
      return {
        success: true
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      // Generic error for security
      throw new Error('Unable to send reset email. Please try again later.');
    }
  };

  /**
 * Request email verification for portal signup
 * @param {object} data - Contains email, name, alcorId, salesforceContactId
 * @returns {Promise<object>} Verification result
 */
export const requestPortalEmailVerification = async (data) => {
  try {
    const { email, name, alcorId, salesforceContactId } = data;
    
    console.log('Requesting portal email verification:', { email, alcorId });
    
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'createPortalEmailVerification',
      email,
      name,
      alcorId,
      salesforceContactId
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    console.log('Portal verification result:', result.data);
    
    if (result.data.success) {
      // Save verification state for the next step
      saveVerificationState({
        email,
        name,
        alcorId,
        salesforceContactId,
        verificationId: result.data.verificationId,
        isPortalVerification: true,
        timestamp: Date.now()
      });
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Error requesting portal verification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email'
    };
  }
};

export async function requestEmailVerification(email, name) {
    // console.log("========== START: requestEmailVerification ==========");
    // console.log(`Email: ${email}, Name: ${name}`);
    
    try {
        // Input validation
        if (!email || !name) {
            // console.log("ERROR: Missing email or name");
            throw new Error('Email and name are required');
        }
        
        // Normalize email to lowercase
        email = email.toLowerCase();
        
        // First, sign out any existing user to prevent Firestore permission errors
        try {
            // console.log("Signing out any existing user...");
            await auth.signOut();
            // console.log("User signed out successfully (or no user was signed in)");
        } catch (signOutError) {
            // console.log("Error during sign out (or no user to sign out):", signOutError);
            // console.log("Continuing anyway...");
            // Continue anyway
        }
        
        // Pre-check for Google accounts before sending verification codes
        // console.log("Pre-checking if this email belongs to a Google account...");
        const authCoreFn = httpsCallable(functions, 'authCore');
        
        try {
            // console.log("Calling checkAuthMethod with email:", email);
            const authMethodResult = await authCoreFn({ 
              action: 'checkAuthMethod',
              email 
            });
            
            // console.log("checkAuthMethod raw result:", authMethodResult);
            
            if (authMethodResult?.data?.success) {
                // console.log("Pre-check auth result:", JSON.stringify(authMethodResult.data, null, 2));
                
                // Extract user authentication details
                const hasGoogleAuth = authMethodResult.data.hasGoogleAuth === true;
                const hasPasswordAuth = authMethodResult.data.hasPasswordAuth === true;
                const authProviders = authMethodResult.data.authProviders || [];
                const userId = authMethodResult.data.userId;
                
                // console.log("Auth details from pre-check:");
                // console.log("- hasGoogleAuth:", hasGoogleAuth);
                // console.log("- hasPasswordAuth:", hasPasswordAuth);
                // console.log("- authProviders:", authProviders);
                // console.log("- userId:", userId);
                
                // Determine if this is a Google-only user
                const isGoogleOnlyUser = (
                    hasGoogleAuth && !hasPasswordAuth ||
                    (authProviders.includes('google.com') && !authProviders.includes('password'))
                );
                
                // console.log("Is Google-only user:", isGoogleOnlyUser);
                
                if (isGoogleOnlyUser) {
                    // console.log("DETECTED: Google-only account in pre-check");
                    // console.log("Skipping verification code and redirecting to Google flow");
                    
                    // Save verification state for consistent UX
                    saveVerificationState({
                        email,
                        name,
                        isExistingUser: true,
                        authProvider: 'google',
                        isGoogleOnly: true,
                        userId,
                        timestamp: Date.now()
                    });
                    
                    // Return Google account info without sending verification code
                    return {
                        success: true,
                        isExistingUser: true,
                        authProvider: 'google',
                        isGoogleOnly: true,
                        skipVerification: true,
                        userId,
                        email
                    };
                }
                
                // console.log("Not a Google-only account, continuing with verification...");
            } else {
                // console.log("Auth method pre-check failed or returned no data");
                // console.log("Continuing with regular verification flow...");
            }
        } catch (preCheckError) {
            console.error("Error in Google account pre-check:", preCheckError);
            // console.log("Error details:", preCheckError.message);
            // console.log("Continuing with standard verification flow...");
        }
        
        // If we get here, it's either a new user or an existing user with password auth
        // Get the Firebase function for email verification
        // console.log("Getting Firebase function: createEmailVerification");
        
        // Call the function with a timeout
        // console.log("Calling createEmailVerification with:", { email, name });
        const result = await Promise.race([
            authCoreFn({ 
              action: 'createEmailVerification',
              email, 
              name 
            }),
            new Promise((_, reject) => 
                setTimeout(() => {
                    // console.log("Request timed out after 15 seconds");
                    reject(new Error('Request timed out'));
                }, 15000)
            )
        ]);

        console.log("[DEBUG] Raw Firebase function response:", result);
        console.log("[DEBUG] result.data:", result.data);
        console.log("[DEBUG] result.data type:", typeof result.data);
        console.log("[DEBUG] result.data keys:", Object.keys(result.data || {}));
        
        // Log the full result for debugging
        // console.log("createEmailVerification raw result:", result);
        
        // Check if result exists and has data
        if (!result || !result.data) {
            // console.log("ERROR: Invalid response - missing result or result.data");
            throw new Error('Invalid response from server');
        }
        
        // console.log("createEmailVerification result.data:", JSON.stringify(result.data, null, 2));
        
        // Check for success in the response
        if (!result.data.success) {
            // console.log("ERROR: Server reported failure:", result.data.error);
            throw new Error(result.data.error || 'Failed to send verification code');
        }
        
        // Check if this is an existing user
        if (result.data.isExistingUser) {
            // console.log("DETECTED: Email belongs to an existing user:", email);
              // Check if this is a portal user

            // NEW TO REDIRECT TO PORTAL
            if (result.data.isPortalUser) {
              console.log("DETECTED: Portal user account");
              
              // Save state indicating this is a portal user
              saveVerificationState({
                email,
                name,
                verificationId: result.data.verificationId,
                isExistingUser: true,
                isPortalUser: true,  // <-- Add this flag
                authProvider: result.data.authProvider || 'password',
                timestamp: Date.now()
              });
              
              // Return portal user indicator
              return {
                success: true,
                verificationId: result.data.verificationId,
                isExistingUser: true,
                isPortalUser: true,  // <-- Add this flag
                authProvider: result.data.authProvider || 'password',
                redirectToPortal: true  // <-- Signal to redirect
              };
            }
            
            // Call checkAuthMethod again to get detailed auth info
            // This is now our second check, but we need it to get complete auth details
            // console.log("Calling checkAuthMethod to get complete auth details...");
            
            try {
                // console.log("Sending email to checkAuthMethod:", email);
                const authMethodResult = await authCoreFn({ 
                  action: 'checkAuthMethod',
                  email 
                });
                
                // console.log("checkAuthMethod raw result:", authMethodResult);
                
                if (!authMethodResult || !authMethodResult.data) {
                    // console.log("WARNING: Invalid response from checkAuthMethod");
                    // console.log("Defaulting to password authentication");
                    
                    // Default to password if function doesn't give clear answer
                    saveVerificationState({
                        email,
                        name,
                        verificationId: result.data.verificationId,
                        isExistingUser: true,
                        authProvider: 'password',
                        timestamp: Date.now()
                    });
                    
                    return {
                        success: true,
                        verificationId: result.data.verificationId,
                        isExistingUser: true,
                        authProvider: 'password'
                    };
                }
                
                // console.log("checkAuthMethod result.data:", JSON.stringify(authMethodResult.data, null, 2));
                
                if (authMethodResult.data && authMethodResult.data.success) {
                    // Log all auth-related fields for debugging
                    // console.log("Auth provider details:");
                    // console.log("- primaryAuthMethod:", authMethodResult.data.primaryAuthMethod);
                    // console.log("- authProviders:", authMethodResult.data.authProviders);
                    // console.log("- hasGoogleAuth:", authMethodResult.data.hasGoogleAuth);
                    // console.log("- hasPasswordAuth:", authMethodResult.data.hasPasswordAuth);
                    
                    // Get auth provider info using any available field
                    const primaryAuthMethod = authMethodResult.data.primaryAuthMethod || 'unknown';
                    const authProviders = authMethodResult.data.authProviders || [];
                    const hasGoogleAuth = authMethodResult.data.hasGoogleAuth === true;
                    const hasPasswordAuth = authMethodResult.data.hasPasswordAuth === true;
                    
                    // console.log("Analyzed authentication status:");
                    // console.log("- Primary method:", primaryAuthMethod);
                    // console.log("- Available providers:", authProviders);
                    // console.log("- Has Google auth:", hasGoogleAuth);
                    // console.log("- Has Password auth:", hasPasswordAuth);
                    
                    // Double-check if this is a Google-only user (shouldn't happen here, but just in case)
                    const isGoogleOnlyUser = (
                        hasGoogleAuth && !hasPasswordAuth ||
                        primaryAuthMethod === 'google.com' ||
                        primaryAuthMethod === 'google' ||
                        (authProviders.includes('google.com') && !authProviders.includes('password'))
                    );
                    
                    // console.log("Is Google-only user:", isGoogleOnlyUser);
                    
                    if (isGoogleOnlyUser) {
                        // console.log("DETECTED: Google-only account");
                        
                        // Save verification state with Google provider info
                        saveVerificationState({
                            email,
                            name,
                            verificationId: result.data.verificationId,
                            isExistingUser: true,
                            authProvider: 'google',
                            timestamp: Date.now()
                        });
                        
                        // console.log("Returning with Google authProvider");
                        return {
                            success: true,
                            verificationId: result.data.verificationId,
                            isExistingUser: true,
                            authProvider: 'google',
                            isGoogleOnly: true
                        };
                    }
                    
                    // For all other cases, use the primary auth method or default to password
                    const authProvider = primaryAuthMethod === 'google.com' ? 'google' : (primaryAuthMethod || 'password');
                    
                    // console.log("Using authProvider:", authProvider);
                    
                    // Save verification state
                    saveVerificationState({
                        email,
                        name,
                        verificationId: result.data.verificationId,
                        isExistingUser: true,
                        authProvider,
                        timestamp: Date.now()
                    });
                    
                    return {
                        success: true,
                        verificationId: result.data.verificationId,
                        isExistingUser: true,
                        authProvider
                    };
                } else {
                    // console.log("WARNING: checkAuthMethod unsuccessful");
                    // console.log("Error:", authMethodResult.data?.error);
                    // console.log("Defaulting to password authentication");
                    
                    // Default to password if function doesn't give clear answer
                    saveVerificationState({
                        email,
                        name,
                        verificationId: result.data.verificationId,
                        isExistingUser: true,
                        authProvider: 'password',
                        timestamp: Date.now()
                    });
                    
                    return {
                        success: true,
                        verificationId: result.data.verificationId,
                        isExistingUser: true,
                        authProvider: 'password'
                    };
                }
            } catch (authCheckError) {
                console.error("ERROR checking auth method:", authCheckError);
                // console.log("Stack trace:", authCheckError.stack);
                // console.log("Defaulting to password authentication after error");
                
                // Default to password if function fails
                saveVerificationState({
                    email,
                    name,
                    verificationId: result.data.verificationId,
                    isExistingUser: true,
                    authProvider: 'password',
                    timestamp: Date.now()
                });
                
                return {
                    success: true,
                    verificationId: result.data.verificationId,
                    isExistingUser: true,
                    authProvider: 'password'
                };
            }
        }
        
        // This is a new user
        // console.log("This appears to be a new user");
        
        // Save verification state for new user
        saveVerificationState({
            email,
            name,
            verificationId: result.data.verificationId,
            isExistingUser: false,
            timestamp: Date.now()
        });
        
        // console.log("Returning success for new user");
        return {
            success: true,
            verificationId: result.data.verificationId,
            isExistingUser: false
        };
        
    } catch (error) {
        console.error('ERROR in requestEmailVerification:', error);
        // console.log("Stack trace:", error.stack);
        
        // Check for errors that indicate an existing user
        if (error.code === 'auth/email-already-in-use' || 
            (error.message && (
                error.message.toLowerCase().includes('already exists') ||
                error.message.toLowerCase().includes('already in use')
            ))) {
            // console.log("DEBUG: Email already exists error detected:", error.message);
            return {
                success: false,
                isExistingUser: true,
                error: error.message
            };
        }
        
        // Check for CORS errors and provide more helpful message
        if (error.message && error.message.includes('NetworkError') || 
            (error.code && error.code === 'internal') ||
            (error.message && error.message.includes('CORS'))) {
            console.error('CORS issue detected.');
            throw new Error('Network connectivity issue. Please ensure your Firebase configuration allows requests from this application.');
        }
        
        // console.log("========== END: requestEmailVerification (with error) ==========");
        throw error;
    }
    
    // console.log("========== END: requestEmailVerification (success) ==========");
}


export const checkUserStep = async (data) => {
    try {
      // Get userId from data or current user
      const userId = data.userId || (auth.currentUser && auth.currentUser.uid);
      
      if (!userId) {
        console.error('checkUserStep: No user ID provided');
        return { 
          success: false, 
          error: 'User ID is required',
          step: SIGNUP_STEPS.ACCOUNT,
          stepName: "account",
          isSessionExpired: false
        };
      }
      
      console.log(`Checking user step for userId: ${userId}`);
      
      let token;
      
      // Only try to get a token if we have a current user
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
          console.log("Got auth token for user");
        } catch (tokenError) {
          console.error("Failed to get auth token:", tokenError);
          // Continue without token - will use direct userId approach
        }
      } else {
        console.log("No current user, proceeding with userId only");
        // We'll use a different approach for non-authenticated calls
      }
      
      // If we have a token, use the authenticated API endpoint
      if (token) {
        try {
          // Call the VM endpoint with a timeout
          const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/signup/progress`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Apply timeout
          const response = await Promise.race([
            fetchPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timed out')), 15000)
            )
          ]);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Check for success in the response
          if (!result.success) {
            throw new Error(result.error || 'Failed to get user step');
          }
          
          return {
            success: true,
            step: result.step || SIGNUP_STEPS.ACCOUNT,
            stepName: result.stepName || "account",
            isSessionExpired: result.isSessionExpired || false,
            isNewUser: result.isNewUser || false
          };
        } catch (apiError) {
          console.error("API error:", apiError);
          // Fall back to using Firebase function directly
        }
      }
      
      // If we don't have a token or API call failed, use the Firebase function directly
      console.log("Using Firebase function fallback to check user step");
      try {
        // Call checkUserStep Cloud Function directly with just the userId
        const authCoreFn = httpsCallable(functions, 'authCore');
        const result = await authCoreFn({ 
          action: 'checkUserStep',
          userId 
        });
        
        if (result.data && result.data.success) {
          return {
            success: true,
            step: result.data.step || SIGNUP_STEPS.ACCOUNT,
            stepName: result.data.stepName || "account",
            isSessionExpired: result.data.isSessionExpired || false,
            isNewUser: result.data.isNewUser || false
          };
        } else {
          console.error("Firebase function returned error:", result.data?.error);
          throw new Error(result.data?.error || 'Failed to get user step');
        }
      } catch (functionError) {
        console.error("Firebase function error:", functionError);
        throw functionError;
      }
    } catch (error) {
      console.error('Error checking user step:', error);
      
      // Return a standardized error format
      return {
        success: false,
        error: error.message || 'An unknown error occurred while checking user step',
        step: SIGNUP_STEPS.ACCOUNT, // Default to account step on error
        stepName: 'account',
        isSessionExpired: false
      };
    }
  };



/// Firebase function version, phasing out
/**
 * Checks the user's current step and session status
 * 
 * @param {Object} data Object containing userId
 * @returns {Promise<Object>} Response containing user step information and session status
 */
 /*export const checkUserStep = async (data) => {
    try {
      // console.log(`Checking user step for userId: ${data.userId}`);
      
      // Get the current timestamp to track request start time
      const requestStartTime = Date.now();
      
      // Call the Firebase Cloud Function
      const checkUserStepFn = httpsCallable(functions, 'checkUserStep');
      const result = await checkUserStepFn(data);
      
      // Log the response time for performance monitoring
      const responseTime = Date.now() - requestStartTime;
      // console.log(`checkUserStep response time: ${responseTime}ms`);
      
      // Return the result
      const response = result.data;
      
      // console.log(`User step check result:`, response);
      
      // Check for session expiration
      if (response.isSessionExpired) {
        console.warn("User session has expired, should redirect to login");
      }
      
      return response;
    } catch (error) {
      console.error('Error checking user step:', error);
      
      // Return a standardized error format
      return {
        success: false,
        error: error.message || 'An unknown error occurred while checking user step',
        step: SIGNUP_STEPS.ACCOUNT, // Default to account step on error
        stepName: 'account',
        exists: false,
        isSessionExpired: false
      };
    }
  }*/

// Add this function to auth.js

export const updateSignupProgressAPI = async (step, progress) => {
  try {
    console.log("🔄 === updateSignupProgressAPI START ===");
    console.log("Parameters:", { step, progress });
    console.log("Parameters type check - step:", typeof step, "progress:", typeof progress);
    
    const user = auth.currentUser;
    console.log("Current user:", user?.uid);
    console.log("Current user email:", user?.email);
    
    if (!user) {
      console.error("❌ No authenticated user found when updating progress");
      console.error("auth.currentUser is:", auth.currentUser);
      throw new Error("User must be authenticated to update progress");
    }
    
    // Get the Firebase ID token for authentication
    console.log("🔑 Getting ID token...");
    const token = await user.getIdToken();
    console.log("✅ Got token (first 20 chars):", token.substring(0, 20) + "...");
    
    const payload = { step, progress };
    console.log("📤 Sending to API:", payload);
    console.log("📤 JSON stringified payload:", JSON.stringify(payload));
    
    const apiUrl = `https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/signup/progress`;
    console.log("📤 API URL:", apiUrl);
    
    // Call the VM endpoint with a timeout
    const fetchPromise = fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log("⏱️ Waiting for response...");
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => {
          console.error("❌ Request timed out after 15 seconds");
          reject(new Error('Request timed out'));
        }, 15000)
      )
    ]);
    
    console.log("📥 Response received");
    console.log("📥 Response status:", response.status);
    console.log("📥 Response ok:", response.ok);
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("📥 Raw response text:", responseText);
    console.log("📥 Raw response length:", responseText.length);
    
    let result;
    try {
      result = JSON.parse(responseText);
      console.log("📥 Successfully parsed JSON");
    } catch (e) {
      console.error("❌ Failed to parse response as JSON");
      console.error("Parse error:", e);
      console.error("Response text that failed to parse:", responseText);
      throw new Error("Invalid response format from server");
    }
    
    console.log("📥 Parsed response:", result);
    console.log("📥 Response type:", typeof result);
    console.log("📥 Response keys:", Object.keys(result || {}));
    
    if (!response.ok) {
      console.error("❌ Response not OK, status:", response.status);
      console.error("Error from server:", result.error);
      throw new Error(result.error || `Server error: ${response.status}`);
    }
    
    // Check for success in the response
    if (!result.success) {
      console.error("❌ API returned success: false");
      console.error("Error message:", result.error);
      throw new Error(result.error || 'Failed to update signup progress');
    }
    
    console.log("✅ === updateSignupProgressAPI SUCCESS ===");
    console.log("Final result:", result);
    return { success: true };
  } catch (error) {
    console.error("❌ === updateSignupProgressAPI ERROR ===");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);
    return { success: false, error: error.message };
  }
};


// Updated to call VM directly instead of Firebase Function
export async function verifyEmailCodeOnly(verificationId, code) {
    try {
      // Input validation
      if (!verificationId) {
        throw new Error('Verification ID is missing');
      }
      
      if (!code || code.length !== 6) {
        throw new Error('Invalid verification code');
      }
      
      // Call the VM endpoint with a timeout
      const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/verification/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verificationId, code })
      });
      
      // Apply timeout
      const response = await Promise.race([
        fetchPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 15000)
        )
      ]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check for success in the response
      if (!result.success) {
        throw new Error(result.error || 'Invalid verification code');
      }
      
      // Return success with user details
      return {
        success: true,
        userId: result.userId,
        email: result.email,
        isExistingUser: result.isExistingUser || false,
        signupProgress: result.signupProgress || SIGNUP_STEPS.CONTACT_INFO,
        signupStep: result.signupStep || "contact_info"
      };
    } catch (error) {
      console.error('Error verifying email code:', error);
      throw error;
    }
  }





// Start conversion away from fireabse functions   
// Split verification into two steps for security
// Step 1: Verify the code only (no authentication)
/*export async function verifyEmailCodeOnly(verificationId, code) {
  try {
    // Input validation
    if (!verificationId) {
      throw new Error('Verification ID is missing');
    }
    
    if (!code || code.length !== 6) {
      throw new Error('Invalid verification code');
    }
    
    // Get the Firebase function
    const verifyEmailCodeFn = httpsCallable(functions, 'verifyEmailCode');
    
    // Call the function with a timeout
    const result = await Promise.race([
      verifyEmailCodeFn({ verificationId, code }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      )
    ]);
    
    // Check if result exists and has data
    if (!result || !result.data) {
      throw new Error('Invalid response from server');
    }
    
    // Check for success in the response
    if (!result.data.success) {
      throw new Error(result.data.error || 'Invalid verification code');
    }
    
    // Return success with user details
    return {
      success: true,
      userId: result.data.userId,
      email: result.data.email,
      isExistingUser: result.data.isExistingUser || false,
      signupProgress: result.data.signupProgress || SIGNUP_STEPS.CONTACT_INFO,
      signupStep: result.data.signupStep || "contact_info"
    };
  } catch (error) {
    console.error('Error verifying email code:', error);
    throw error;
  }
}*/

export async function createNewUser(verificationResult, email, name, password) {
    try {
      if (!verificationResult || !verificationResult.success) {
        throw new Error('Verification must be completed successfully before account creation');
      }
      
      if (!email || !name || !password) {
        throw new Error('Email, name, and password are required');
      }
      
      // Sign out any existing user first 
      try {
        await auth.signOut();
        // console.log("DEBUG: User signed out before creating new user");
      } catch (signOutError) {
        // console.log("DEBUG: Error signing out or no user to sign out:", signOutError);
        // Continue anyway
      }
      
      // Call the Firebase function to create a new user
      // console.log("DEBUG: Calling createNewUser cloud function");
      const authCoreFn = httpsCallable(functions, 'authCore');
      
      const result = await authCoreFn({
        action: 'createNewUser',
        email,
        name,
        password,
        verificationId: verificationResult.verificationId
      });
      
      if (!result.data || !result.data.success) {
        console.error("DEBUG: Cloud function createNewUser failed:", result.data);
        throw new Error(result.data?.error || 'Failed to create new user');
      }
      
      // console.log("DEBUG: Cloud function createNewUser succeeded");
      
      // Now sign in with the new credentials
      // console.log("DEBUG: Signing in with new credentials");
      try {
        const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
        // console.log("DEBUG: Sign in successful with new user");
        
        // Try to create the user document directly as a fallback
        try {
          // console.log("DEBUG: Checking if user document exists in Firestore");
          const userRef = doc(db, "users", userCredential.user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // console.log("DEBUG: User document doesn't exist, creating one directly");
            await setDoc(userRef, {
              email: email,
              name: name,
              signupProgress: SIGNUP_STEPS.SUCCESS, // Using new step structure (1 = success)
              signupStep: "success",
              createdAt: new Date(),
              authProvider: "email",
              hasPasswordAuth: true,
              authProviders: ["password"],
              lastSignIn: new Date()
            });
            // console.log("DEBUG: User document created directly");
          } else {
            // console.log("DEBUG: User document already exists");
          }
        } catch (firestoreError) {
          console.error("DEBUG: Error checking/creating user document:", firestoreError);
          // Continue anyway - we'll rely on localStorage
        }
        
        // Save signup state even if Firestore fails
        saveSignupState({
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || name,
          isExistingUser: false,
          signupProgress: SIGNUP_STEPS.SUCCESS, // Using new step structure (1 = success)
          signupStep: "success",
          timestamp: Date.now()
        });
        
        return {
          success: true,
          isExistingUser: false,
          signupProgress: SIGNUP_STEPS.SUCCESS,
          signupStep: "success"
        };
      } catch (signInError) {
        console.error("DEBUG: Error signing in after creating user:", signInError);
        throw new Error('User was created but sign-in failed. Please try logging in.');
      }
    } catch (error) {
      console.error('Error creating new user:', error);
      throw error;
    }
  }
  
// Function to sign in an existing user
export async function signInExistingUser(verificationResult, email, password) {
  try {
    if (!verificationResult || !verificationResult.success) {
      throw new Error('Verification must be completed successfully before signing in');
    }
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Sign out any existing user first 
    try {
      await auth.signOut();
      // console.log("DEBUG: User signed out before signing in existing user");
    } catch (signOutError) {
      // console.log("DEBUG: Error signing out or no user to sign out:", signOutError);
      // Continue anyway
    }
    
    // First attempt to sign in with Firebase Auth
    // console.log("DEBUG: Signing in with Firebase Auth");
    try {
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      // console.log("DEBUG: Sign in successful with existing user");
      
      // Call the cloud function to update records and get user state
      // console.log("DEBUG: Calling signInExistingUser cloud function");
      try {
        const authCoreFn = httpsCallable(functions, 'authCore');
        
        const result = await authCoreFn({
          action: 'signInExistingUser',
          email,
          password, // The function won't use this but maintains API consistency
          verificationId: verificationResult.verificationId
        });
        
        if (!result.data || !result.data.success) {
          console.warn("DEBUG: Cloud function signInExistingUser warning:", result.data);
          // Don't throw here - we already authenticated with Firebase Auth
        } else {
          // console.log("DEBUG: Cloud function signInExistingUser succeeded");
          
          // Check if document exists in Firestore (double-check)
          try {
            // console.log("DEBUG: Checking if user document exists in Firestore");
            const userRef = doc(db, "users", userCredential.user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              // console.log("DEBUG: User document doesn't exist, creating one directly");
              await setDoc(userRef, {
                email: email,
                name: userCredential.user.displayName || "Existing User",
                signupProgress: result.data.signupProgress || SIGNUP_STEPS.ACCOUNT,
                signupStep: result.data.signupStep || "account",
                createdAt: new Date(),
                authProvider: "email",
                hasPasswordAuth: true,
                authProviders: ["password"],
                lastSignIn: new Date()
              });
              // console.log("DEBUG: User document created directly");
            } else {
              // console.log("DEBUG: User document already exists");
            }
          } catch (firestoreError) {
            console.error("DEBUG: Error checking/creating user document:", firestoreError);
            // Continue anyway - we'll rely on localStorage
          }
        }
      } catch (functionError) {
        console.error("DEBUG: Error calling signInExistingUser function:", functionError);
        // Continue anyway - we already authenticated with Firebase Auth
      }
      
      // Save signup state
      saveSignupState({
        userId: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || "Existing User",
        isExistingUser: true,
        signupProgress: verificationResult.signupProgress || SIGNUP_STEPS.ACCOUNT,
        signupStep: verificationResult.signupStep || "account",
        timestamp: Date.now()
      });
      
      return {
        success: true,
        isExistingUser: true,
        signupProgress: verificationResult.signupProgress || SIGNUP_STEPS.ACCOUNT,
        signupStep: verificationResult.signupStep || "account"
      };
    } catch (signInError) {
      console.error("DEBUG: Error signing in with Firebase Auth:", signInError);
      
      if (signInError.code === 'auth/wrong-password') {
        throw new Error('Incorrect password for existing account');
      } else {
        throw signInError;
      }
    }
  } catch (error) {
    console.error('Error signing in existing user:', error);
    throw error;
  }
}
  
// Update the createOrSignInUser function to use the new separate functions
export async function createOrSignInUser(verificationResult, email, name, password) {
  try {
    if (!verificationResult || !verificationResult.success) {
      throw new Error('Verification must be completed successfully');
    }
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Check if this is an existing user
    if (verificationResult.isExistingUser) {
      // console.log("DEBUG: Routing to signInExistingUser");
      return signInExistingUser(verificationResult, email, password);
    } else {
      // console.log("DEBUG: Routing to createNewUser");
      return createNewUser(verificationResult, email, name, password);
    }
  } catch (error) {
    console.error('Error in createOrSignInUser:', error);
    throw error;
  }
}

// Legacy function for compatibility - will be phased out
export async function verifyEmailCode(verificationId, code, password) {
  console.warn('verifyEmailCode is deprecated - use verifyEmailCodeOnly followed by createOrSignInUser instead');
  
  try {
    // First verify the code
    const verificationResult = await verifyEmailCodeOnly(verificationId, code);
    
    if (!verificationResult.success) {
      throw new Error('Code verification failed');
    }
    
    // Get verification info from localStorage (but not password)
    const verificationState = getVerificationState();
    
    if (!verificationState || !verificationState.email || !verificationState.name) {
      throw new Error('Verification state not found in local storage');
    }
    
    // Use provided password or fail
    if (!password) {
      throw new Error('Password is required');
    }
    
    // Now create or sign in the user with the verified information
    const authResult = await createOrSignInUser(
      verificationResult,
      verificationState.email,
      verificationState.name,
      password
    );
    
    // Clear verification state as it's no longer needed
    clearVerificationState();
    
    return authResult;
  } catch (error) {
    console.error('Error in legacy verifyEmailCode:', error);
    throw error;
  }
}

export async function signInWithGoogle(options) {
  // Handle options in a backward-compatible way
  const keepExistingUser = options && options.maintainSession === true;
  
  console.log("===== SIGN IN WITH GOOGLE STARTED =====");
  console.log("Options:", options);
  console.log("keepExistingUser:", keepExistingUser);
  
  // REMOVED: Pre-check for specific email
  
  try {
    // Only sign out if not keeping the existing user
    if (!keepExistingUser) {
      console.log("Signing out any current user before Google sign-in");
      try {
        await auth.signOut();
        console.log("Successfully signed out current user (or none was signed in)");
      } catch (signOutError) {
        console.error("Error during sign out:", signOutError);
        // Continue anyway
      }
    } else {
      console.log("Maintaining current session, not signing out");
    }
    
    // Create Google auth provider
    const googleProvider = new GoogleAuthProvider();
    console.log("Created Google auth provider");
    
    // Set custom parameters - REMOVED login_hint restriction
    googleProvider.setCustomParameters({
      prompt: 'select_account'  // Only keep the prompt, remove login_hint
    });
    console.log("Set custom parameters for Google provider");
    
    // Log before authentication
    console.log("About to call signInWithPopup - this should trigger a popup...");
    
    // Authenticate with Google
    let tempResult;
    try {
      tempResult = await signInWithPopup(auth, googleProvider);
      console.log("Successfully completed signInWithPopup");
    } catch (popupError) {
      console.error("===== ERROR DURING GOOGLE POPUP SIGN-IN =====");
      console.error("Error object:", popupError);
      console.error("Error code:", popupError.code);
      console.error("Error message:", popupError.message);
      
      if (popupError.customData) {
        console.error("Custom data:", popupError.customData);
      }
      
      // Check for the specific credential conflict error
      if (popupError.code === 'auth/account-exists-with-different-credential') {
        console.log("DETECTED: auth/account-exists-with-different-credential ERROR!");
        
        // Get conflicting email
        const conflictEmail = popupError.customData?.email || 'unknown';
        console.log("Conflicting email:", conflictEmail);
        
        // Return special error format
        return {
          success: false,
          error: popupError.code,
          accountConflict: true,
          existingEmail: conflictEmail,
          message: "This email is already registered with a different method."
        };
      }
      
      // Re-throw for other processing
      throw popupError;
    }
    
    const user = tempResult.user;
    const email = user.email;
    console.log(`Successfully authenticated with Google. Email: ${email}, UID: ${user.uid}`);
    console.log(`User providers:`, user.providerData.map(p => p.providerId));
    
    // Check for existing accounts using backend instead of direct Firestore query
    try {
      console.log(`Checking for existing accounts with email: ${email}`);
      const authCoreFn = httpsCallable(functions, 'authCore');
      const checkResult = await authCoreFn({ 
        action: 'checkAuthMethod',
        email: email 
      });
      
      console.log('Auth method check result:', checkResult.data);
      
      // Check for portal user
      if (checkResult.data?.isPortalUser) {
        console.log('Portal user detected');
        await auth.signOut();
        
        return {
          success: false,
          isPortalUser: true,
          email: email,
          message: "This email belongs to a portal account. Please use the portal login."
        };
      }
      
      // Check for password auth conflict
      if (checkResult.data?.hasPasswordAuth) {
        console.log('Password account detected');
        await auth.signOut();
        
        return {
          success: false,
          error: 'auth/account-exists-with-different-credential',
          accountConflict: true,
          email: email,
          message: "This email is already registered with a password. Please sign in with your password first to link your accounts."
        };
      }
    } catch (error) {
      console.error('Error checking auth method:', error);
      // Continue anyway - don't block sign-in if check fails
    }
    
    // Double check with fetchSignInMethodsForEmail after successful sign-in
    try {
      console.log("Double-checking sign-in methods after successful Google sign-in");
      const confirmedMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log(`Confirmed sign-in methods for ${email}:`, confirmedMethods);
      
      if (confirmedMethods.includes('password')) {
        console.log("ALERT: Even after successful Google sign-in, this email has a password account!");
        
        // This is a critical condition - we should have detected this earlier
        console.error("CRITICAL: Account conflict was not detected earlier but exists now!");
        
        // Sign out and return conflict
        await auth.signOut();
        
        return {
          success: false,
          error: 'auth/account-exists-with-different-credential',
          accountConflict: true,
          email,
          message: "This email is already registered with a password. Please sign in with your password first to link your accounts."
        };
      }
    } catch (methodCheckError) {
      console.error("Error checking sign-in methods after successful sign-in:", methodCheckError);
      // Continue anyway
    }
    
    // User can safely continue with Google sign-in
    console.log(`Email ${email} can safely use Google sign-in`);
    
    // Check if this user already exists in Firestore
    try {
      console.log(`Checking if user document exists for UID: ${user.uid}`);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      // Determine if this is a new user based on document existence
      const isNewUser = !userDoc.exists();
      console.log(`Is new user in Firestore: ${isNewUser}`);
      
      if (isNewUser) {
        console.log(`Creating new user document for ${user.uid} in Firestore`);
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || "New Member",
          signupProgress: SIGNUP_STEPS.SUCCESS,
          signupStep: "success",
          createdAt: new Date(),
          authProvider: "google",
          hasGoogleAuth: true,
          authProviders: ["google.com"],
          lastSignIn: new Date()
        });
        console.log("User document created successfully");
      } else {
        console.log(`Updating existing user document for ${user.uid} in Firestore`);
        await updateDoc(userRef, {
          lastSignIn: new Date(),
          hasGoogleAuth: true
        });
        console.log("User document updated successfully");
      }
      
      // Get updated user document for accurate progress info
      const updatedUserDoc = isNewUser ? null : await getDoc(userRef);
      const userData = updatedUserDoc ? updatedUserDoc.data() : null;
      console.log("Updated user data:", userData);
      
      // Update local storage
      const signupState = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "New Member",
        isExistingUser: !isNewUser,
        signupProgress: userData ? (userData.signupProgress || SIGNUP_STEPS.SUCCESS) : SIGNUP_STEPS.SUCCESS,
        signupStep: userData ? (userData.signupStep || "success") : "success",
        timestamp: Date.now()
      };
      saveSignupState(signupState);
      console.log("Saved signup state to localStorage:", signupState);
      
      // Clear any verification state
      clearVerificationState();
      console.log("Cleared verification state");
      
      // Return with correct isNewUser flag
      console.log("===== SIGN IN WITH GOOGLE COMPLETED SUCCESSFULLY =====");
      return {
        success: true,
        isNewUser: isNewUser,
        user,
        additionalUserInfo: tempResult.additionalUserInfo
      };
    } catch (firestoreError) {
      console.error("Error with Firestore:", firestoreError);
      
      // Even with Firestore errors, we need to determine if this is actually a new user
      // For safety, we'll use Firebase's additionalUserInfo
      const isNewUser = tempResult.additionalUserInfo?.isNewUser || false;
      console.log(`Falling back to Firebase isNewUser flag: ${isNewUser}`);
      
      // Update local storage with best-effort information
      saveSignupState({
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "New Member",
        isExistingUser: !isNewUser,
        signupProgress: SIGNUP_STEPS.SUCCESS,
        signupStep: "success",
        timestamp: Date.now()
      });
      console.log("Saved fallback signup state to localStorage");
      
      // Clear any verification state
      clearVerificationState();
      
      console.log("===== SIGN IN WITH GOOGLE COMPLETED WITH FIRESTORE ERROR =====");
      return {
        success: true,
        isNewUser: isNewUser,
        user,
        firestoreError: true
      };
    }
  } catch (error) {
    console.error("===== ERROR IN GOOGLE SIGN-IN =====");
    console.error("Error object:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    if (error.customData) {
      console.error("Custom data:", error.customData);
    }
    
    // Handle specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup without completing sign-in");
      return {
        success: false,
        error: error.code,
        message: "Google sign-in was cancelled."
      };
    }
    
    // Check for auth conflict error
    if (error.code === 'auth/account-exists-with-different-credential') {
      console.log("DETECTED: Account exists with different credential");
      
      const conflictEmail = error.customData?.email || error.email || 'unknown';
      console.log("Conflicting email:", conflictEmail);
      
      return {
        success: false,
        error: error.code,
        accountConflict: true,
        existingEmail: conflictEmail,
        message: "This email is already registered with a different method."
      };
    }
    
    console.log("===== GOOGLE SIGN-IN FAILED =====");
    // For any other errors, rethrow
    throw error;
  }
}


// prior to extra security changes July 30th
/*export async function signInWithGoogle(options) {
  // Handle options in a backward-compatible way
  const keepExistingUser = options && options.maintainSession === true;
  
  console.log("===== SIGN IN WITH GOOGLE STARTED =====");
  console.log("Options:", options);
  console.log("keepExistingUser:", keepExistingUser);
  
  // REMOVED: Pre-check for specific email
  
  try {
    // Only sign out if not keeping the existing user
    if (!keepExistingUser) {
      console.log("Signing out any current user before Google sign-in");
      try {
        await auth.signOut();
        console.log("Successfully signed out current user (or none was signed in)");
      } catch (signOutError) {
        console.error("Error during sign out:", signOutError);
        // Continue anyway
      }
    } else {
      console.log("Maintaining current session, not signing out");
    }
    
    // Create Google auth provider
    const googleProvider = new GoogleAuthProvider();
    console.log("Created Google auth provider");
    
    // Set custom parameters - REMOVED login_hint restriction
    googleProvider.setCustomParameters({
      prompt: 'select_account'  // Only keep the prompt, remove login_hint
    });
    console.log("Set custom parameters for Google provider");
    
    // Log before authentication
    console.log("About to call signInWithPopup - this should trigger a popup...");
    
    // Authenticate with Google
    let tempResult;
    try {
      tempResult = await signInWithPopup(auth, googleProvider);
      console.log("Successfully completed signInWithPopup");
    } catch (popupError) {
      console.error("===== ERROR DURING GOOGLE POPUP SIGN-IN =====");
      console.error("Error object:", popupError);
      console.error("Error code:", popupError.code);
      console.error("Error message:", popupError.message);
      
      if (popupError.customData) {
        console.error("Custom data:", popupError.customData);
      }
      
      // Check for the specific credential conflict error
      if (popupError.code === 'auth/account-exists-with-different-credential') {
        console.log("DETECTED: auth/account-exists-with-different-credential ERROR!");
        
        // Get conflicting email
        const conflictEmail = popupError.customData?.email || 'unknown';
        console.log("Conflicting email:", conflictEmail);
        
        // Return special error format
        return {
          success: false,
          error: popupError.code,
          accountConflict: true,
          existingEmail: conflictEmail,
          message: "This email is already registered with a different method."
        };
      }
      
      // Re-throw for other processing
      throw popupError;
    }
    
    const user = tempResult.user;
    const email = user.email;
    console.log(`Successfully authenticated with Google. Email: ${email}, UID: ${user.uid}`);
    console.log(`User providers:`, user.providerData.map(p => p.providerId));
    
    // Check for existing email with password auth in Firestore
    console.log(`Checking Firestore for users with email: ${email}`);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} user(s) in Firestore with email: ${email}`);
    
    // Check if any users were found with password auth
    if (!querySnapshot.empty) {
      console.log(`User documents found in Firestore:`);
      
      let hasPasswordUser = false;
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(`User ${doc.id} data:`, JSON.stringify(userData, null, 2));
        
        if (userData.authProvider === "email" || 
            userData.authProvider === "password" ||
            (userData.authProviders && userData.authProviders.includes("password"))) {
          console.log(`User ${doc.id} has password auth`);
          hasPasswordUser = true;
        }
      });
      
      if (hasPasswordUser) {
        console.log(`Email ${email} exists with password auth in Firestore. Signing out current Google user.`);
        
        // Sign out the temporary user
        await auth.signOut();
        
        return {
          success: false,
          error: 'auth/account-exists-with-different-credential',
          accountConflict: true,
          email,
          message: "This email is already registered with a password. Please sign in with your password first to link your accounts."
        };
      } else {
        console.log(`Users exist with email ${email} but none have password auth. Continuing with Google sign-in.`);
      }
    } else {
      console.log(`No existing users found in Firestore with email: ${email}`);
    }
    
    // Double check with fetchSignInMethodsForEmail after successful sign-in
    try {
      console.log("Double-checking sign-in methods after successful Google sign-in");
      const confirmedMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log(`Confirmed sign-in methods for ${email}:`, confirmedMethods);
      
      if (confirmedMethods.includes('password')) {
        console.log("ALERT: Even after successful Google sign-in, this email has a password account!");
        
        // This is a critical condition - we should have detected this earlier
        console.error("CRITICAL: Account conflict was not detected earlier but exists now!");
        
        // Sign out and return conflict
        await auth.signOut();
        
        return {
          success: false,
          error: 'auth/account-exists-with-different-credential',
          accountConflict: true,
          email,
          message: "This email is already registered with a password. Please sign in with your password first to link your accounts."
        };
      }
    } catch (methodCheckError) {
      console.error("Error checking sign-in methods after successful sign-in:", methodCheckError);
      // Continue anyway
    }
    
    // User can safely continue with Google sign-in
    console.log(`Email ${email} can safely use Google sign-in`);
    
    // Check if this user already exists in Firestore
    try {
      console.log(`Checking if user document exists for UID: ${user.uid}`);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      // Determine if this is a new user based on document existence
      const isNewUser = !userDoc.exists();
      console.log(`Is new user in Firestore: ${isNewUser}`);
      
      if (isNewUser) {
        console.log(`Creating new user document for ${user.uid} in Firestore`);
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || "New Member",
          signupProgress: SIGNUP_STEPS.SUCCESS,
          signupStep: "success",
          createdAt: new Date(),
          authProvider: "google",
          hasGoogleAuth: true,
          authProviders: ["google.com"],
          lastSignIn: new Date()
        });
        console.log("User document created successfully");
      } else {
        console.log(`Updating existing user document for ${user.uid} in Firestore`);
        await updateDoc(userRef, {
          lastSignIn: new Date(),
          hasGoogleAuth: true
        });
        console.log("User document updated successfully");
      }
      
      // Get updated user document for accurate progress info
      const updatedUserDoc = isNewUser ? null : await getDoc(userRef);
      const userData = updatedUserDoc ? updatedUserDoc.data() : null;
      console.log("Updated user data:", userData);
      
      // Update local storage
      const signupState = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "New Member",
        isExistingUser: !isNewUser,
        signupProgress: userData ? (userData.signupProgress || SIGNUP_STEPS.SUCCESS) : SIGNUP_STEPS.SUCCESS,
        signupStep: userData ? (userData.signupStep || "success") : "success",
        timestamp: Date.now()
      };
      saveSignupState(signupState);
      console.log("Saved signup state to localStorage:", signupState);
      
      // Clear any verification state
      clearVerificationState();
      console.log("Cleared verification state");
      
      // Return with correct isNewUser flag
      console.log("===== SIGN IN WITH GOOGLE COMPLETED SUCCESSFULLY =====");
      return {
        success: true,
        isNewUser: isNewUser,
        user,
        additionalUserInfo: tempResult.additionalUserInfo
      };
    } catch (firestoreError) {
      console.error("Error with Firestore:", firestoreError);
      
      // Even with Firestore errors, we need to determine if this is actually a new user
      // For safety, we'll use Firebase's additionalUserInfo
      const isNewUser = tempResult.additionalUserInfo?.isNewUser || false;
      console.log(`Falling back to Firebase isNewUser flag: ${isNewUser}`);
      
      // Update local storage with best-effort information
      saveSignupState({
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "New Member",
        isExistingUser: !isNewUser,
        signupProgress: SIGNUP_STEPS.SUCCESS,
        signupStep: "success",
        timestamp: Date.now()
      });
      console.log("Saved fallback signup state to localStorage");
      
      // Clear any verification state
      clearVerificationState();
      
      console.log("===== SIGN IN WITH GOOGLE COMPLETED WITH FIRESTORE ERROR =====");
      return {
        success: true,
        isNewUser: isNewUser,
        user,
        firestoreError: true
      };
    }
  } catch (error) {
    console.error("===== ERROR IN GOOGLE SIGN-IN =====");
    console.error("Error object:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    
    if (error.customData) {
      console.error("Custom data:", error.customData);
    }
    
    // Handle specific errors
    if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup without completing sign-in");
      return {
        success: false,
        error: error.code,
        message: "Google sign-in was cancelled."
      };
    }
    
    // Check for auth conflict error
    if (error.code === 'auth/account-exists-with-different-credential') {
      console.log("DETECTED: Account exists with different credential");
      
      const conflictEmail = error.customData?.email || error.email || 'unknown';
      console.log("Conflicting email:", conflictEmail);
      
      return {
        success: false,
        error: error.code,
        accountConflict: true,
        existingEmail: conflictEmail,
        message: "This email is already registered with a different method."
      };
    }
    
    console.log("===== GOOGLE SIGN-IN FAILED =====");
    // For any other errors, rethrow
    throw error;
  }
}*/

// Add this function to auth.js
export const getAndNavigateToCurrentStep = async (navigate) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found");
        return false;
      }
      
      console.log("Getting current step from backend for navigation");
      
      // Call checkUserStep Cloud Function directly
      const authCoreFn = httpsCallable(functions, 'authCore');
      const result = await authCoreFn({ 
        action: 'checkUserStep',
        userId: user.uid 
      });
      
      if (result.data && result.data.success) {
        const step = result.data.step;
        console.log(`Backend reports user should be at step ${step}`);
        
        // Force navigation to the correct step with a clean URL
        navigate(`/signup?step=${step}&force=true`, { replace: true });
        return true;
      } else {
        console.error("Failed to get step from backend:", result.data?.error);
        return false;
      }
    } catch (error) {
      console.error("Error navigating to current step:", error);
      return false;
    }
  };


export const getUserProgressAPI = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found when fetching user progress");
        throw new Error("User must be authenticated to fetch progress");
      }
      
      // Get user ID from current user
      const userId = user.uid;
      
      // Get the Firebase ID token for authentication
      const token = await user.getIdToken();
      
      // Call the VM endpoint with a timeout
      const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/signup/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Apply timeout
      const response = await Promise.race([
        fetchPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 15000)
        )
      ]);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check for success in the response
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user progress');
      }
      
      return {
        success: true,
        step: result.step || SIGNUP_STEPS.ACCOUNT,
        stepName: result.stepName || 'account',
        completed: result.completed || false
      };
    } catch (error) {
      console.error("Error fetching user progress via API:", error);
      return { 
        success: false, 
        error: error.message,
        step: SIGNUP_STEPS.ACCOUNT,
        stepName: 'account',
        completed: false
      };
    }
  };

export const getUserProgress = async (userId) => {
  try {
    if (!userId) {
      console.error("getUserProgress: Missing userId");
      throw new Error('User ID is required');
    }
    
    // Use the existing checkUserStep function instead of fetch
    const result = await checkUserStep({ userId });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user progress');
    }
    
    return {
      maxStep: result.step || SIGNUP_STEPS.ACCOUNT,
      currentStep: result.step || SIGNUP_STEPS.ACCOUNT,
      completed: result.completed || false,
      stepName: result.stepName || 'account'
    };
  } catch (error) {
    console.error('Error fetching user progress:', error);
    
    // Return default values instead of throwing
    return {
      maxStep: SIGNUP_STEPS.ACCOUNT,
      currentStep: SIGNUP_STEPS.ACCOUNT,
      completed: false,
      stepName: 'account'
    };
  }
};

export const updateSignupProgress = async (stepName, stepIndex, stepData = {}) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found when updating progress");
      throw new Error("User must be authenticated to update progress");
    }
    
    console.log(`Updating progress for user ${user.uid} to step: ${stepName}, progress: ${stepIndex}`);
    
    // Update user document with progress information
    const userRef = doc(db, "users", user.uid);
    
    // Check if document exists first
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        signupStep: stepName,
        signupProgress: stepIndex,
        lastUpdated: new Date(),
        [`formData.${stepName}`]: stepData, // Store form data for this step
      });
      console.log("Updated existing user document with new progress");
    } else {
      // Create new document
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || "New Member",
        signupStep: stepName,
        signupProgress: stepIndex,
        createdAt: new Date(),
        lastUpdated: new Date(),
        formData: {
          [stepName]: stepData,
        },
      });
      console.log("Created new user document with initial progress");
    }
    
    // Also update local storage for redundancy
    const signupState = {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || "New Member",
      signupStep: stepName,
      signupProgress: stepIndex,
      timestamp: Date.now(),
    };
    
    saveSignupState(signupState);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating signup progress:", error);
    return { success: false, error };
  }
};

// Enhanced logout function
export const logout = async () => {
  // console.log("DEBUG: Starting logout process");
  
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // console.log("DEBUG: Current user found, signing out", currentUser.uid);
      await auth.signOut();
      // console.log("DEBUG: User signed out successfully");
    } else {
      // console.log("DEBUG: No user to sign out");
    }
    
    return { success: true };
  } catch (error) {
    console.error("DEBUG: Error signing out:", error);
    throw error;
  }
};

export async function checkEmailExists(email) {
  if (!email) return { exists: false };
  
  // console.log(`DEBUG: Checking if email exists: ${email}`);
  
  try {
    // First attempt to fetch sign-in methods for the email
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    console.log(`DEBUG: Sign in methods for ${email}:`, signInMethods);
    
    // Check if email/password is one of the methods
    const hasPasswordProvider = signInMethods.includes('password');
    const hasGoogleProvider = signInMethods.includes('google.com');
    
    return { 
      exists: signInMethods.length > 0,
      hasPasswordProvider,
      hasGoogleProvider,
      signInMethods
    };
  } catch (error) {
    console.error(`DEBUG: Error checking if email exists:`, error);
    // If there's an error, assume the email doesn't exist
    return { exists: false, error: error.message };
  }
}

export const sendProcedureNotificationEmail = async (data) => {
  try {
    console.log('📧 Calling authCore to send procedure notification');
    
    // Validate required fields
    const { memberName, memberNumber, pdfData, fileName } = data;
    
    if (!memberName || !memberNumber || !pdfData || !fileName) {
      throw new Error('Missing required fields for procedure notification');
    }
    
    // Get the authCore function
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    // Call the function with the sendProcedureEmail action
    const result = await authCoreFn({
      action: 'sendProcedureEmail',
      memberName,
      memberNumber,
      pdfData,
      fileName
    });
    
    // Check the result
    if (result.data?.success) {
      console.log('✅ Procedure notification sent successfully');
      return {
        success: true,
        messageId: result.data.messageId,
        recipientEmail: result.data.recipientEmail
      };
    } else {
      console.error('❌ authCore returned failure:', result.data);
      throw new Error(result.data?.error || 'Failed to send procedure notification');
    }
    
  } catch (error) {
    console.error('❌ Error sending procedure notification:', error);
    
    // Don't throw the error, just return failure
    // This way the form submission can still succeed even if email fails
    return {
      success: false,
      error: error.message || 'Failed to send email notification'
    };
  }
};

// create portal account
// Add these functions to your existing auth.js file

/**
 * Check authentication method and Salesforce account status
 * Used in portal signup/login to handle multiple accounts
 */
 export const checkAuthMethod = async ({ email, alcorId }) => {
  try {
    console.log(`Checking auth method for email: ${email}, alcorId: ${alcorId || 'none'}`);
    
    // Use the existing authCore function pattern
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'checkAuthMethod',
      email,
      alcorId
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    console.log('checkAuthMethod result:', result.data);
    
    return result.data;
    
  } catch (error) {
    console.error('Error checking auth method:', error);
    return {
      success: false,
      error: error.message || 'Failed to check authentication method'
    };
  }
};

/**
 * Send verification email for portal signup
 * Uses the existing verification system
 */
export const sendPortalVerificationEmail = async (email, name) => {
  try {
    console.log(`Sending portal verification email to: ${email}`);
    
    // Use your existing requestEmailVerification function
    const result = await requestEmailVerification(email, name);
    
    return result;
    
  } catch (error) {
    console.error('Error sending portal verification email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send verification email'
    };
  }
};

/**
 * Verify portal signup code
 * Uses the existing verification system
 */
export const verifyPortalCode = async (email, code) => {
  try {
    console.log(`Verifying portal code for: ${email}`);
    
    // Get verification state from localStorage
    const verificationState = getVerificationState();
    
    if (!verificationState || !verificationState.verificationId) {
      throw new Error('No verification session found');
    }
    
    // Use your existing verifyEmailCodeOnly function
    const result = await verifyEmailCodeOnly(verificationState.verificationId, code);
    
    return result;
    
  } catch (error) {
    console.error('Error verifying portal code:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify code'
    };
  }
};

export const checkMemberAccount = async (email, alcorId = null) => {
  try {
    const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
    
    let endpoint, body;
    
    if (alcorId) {
      // Use the Alcor ID search endpoint
      endpoint = '/api/salesforce/customers/search-by-alcor-id';
      body = { alcorId, email };
    } else {
      // Use the email search endpoint
      endpoint = '/api/salesforce/customers/search-by-email';
      body = { email };
    }
    
    console.log('[checkMemberAccount] Calling:', endpoint, body);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    console.log('[checkMemberAccount] Result:', result);
    
    // The response should already be in the right format from your backend
    return result;
    
  } catch (error) {
    console.error('[checkMemberAccount] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to check member account'
    };
  }
};

/**
 * Create portal account after verification
 * @param {object} data - Contains email, password, verificationId, etc.
 * @returns {Promise<object>} Account creation result
 */
 export const createPortalAccountWithPassword = async (data) => {
  try {
    const { email, password, verificationId, alcorId, firstName, lastName, salesforceContactId } = data;
    
    console.log('Creating portal account with password');
    
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'createPortalAccount',
      email,
      password,
      verificationId,
      alcorId,
      firstName,
      lastName,
      salesforceContactId
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    if (result.data.success) {
      // Clear verification state
      clearVerificationState();
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Error creating portal account:', error);
    return {
      success: false,
      error: error.message || 'Failed to create portal account'
    };
  }
};

/**
 * Create portal account for signup flow applicant
 * Used when user completes step 8 without an A-number
 */
 export const createApplicantPortalAccount = async (data) => {
  try {
    const { email, firstName, lastName, membershipType, completedSignup } = data;
    
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }
    
    console.log('Creating applicant portal account:', { email, membershipType });
    
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'createApplicantPortalAccount',
      userId: user.uid,
      email: email || user.email,
      firstName,
      lastName,
      membershipType,
      completedSignup
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    console.log('createApplicantPortalAccount result:', result.data);
    
    return result.data;
    
  } catch (error) {
    console.error('Error creating applicant portal account:', error);
    return {
      success: false,
      error: error.message || 'Failed to create applicant portal account'
    };
  }
};

// NEED THIS?
/**
 * Create portal account for existing Alcor member
 */
export const createPortalAccount = async (data) => {
  try {
    const { email, alcorId, firstName, lastName, salesforceContactId } = data;
    
    console.log('Creating portal account:', { email, alcorId, salesforceContactId });
    
    // Validate required fields
    if (!email || !alcorId || !firstName || !lastName || !salesforceContactId) {
      throw new Error('Missing required fields for portal account creation');
    }
    
    // Use the authCore function pattern
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'createPortalAccount',
      email,
      alcorId,
      firstName,
      lastName,
      salesforceContactId
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    console.log('createPortalAccount result:', result.data);
    
    return result.data;
    
  } catch (error) {
    console.error('Error creating portal account:', error);
    return {
      success: false,
      error: error.message || 'Failed to create portal account'
    };
  }
};

/**
 * Complete portal 2FA setup
 */
export const completePortal2FASetup = async ({ userId, token }) => {
  try {
    console.log('Completing portal 2FA setup for user:', userId);
    
    if (!userId || !token) {
      throw new Error('User ID and verification token are required');
    }
    
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'completePortal2FASetup',
      userId,
      token
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    console.log('completePortal2FASetup result:', result.data);
    
    return result.data;
    
  } catch (error) {
    console.error('Error completing 2FA setup:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete 2FA setup'
    };
  }
};

/**
 * Send portal welcome email
 * Used after portal account creation
 */
export const sendPortalWelcomeEmail = async (email, data) => {
  try {
    console.log('Sending portal welcome email to:', email);
    
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'sendPortalWelcomeEmail',
      email,
      ...data
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    return result.data;
    
  } catch (error) {
    console.error('Error sending portal welcome email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email'
    };
  }
};

/**
 * Check if user has portal access
 * Used to determine if user should see portal features
 */
export const checkPortalAccess = async (userId) => {
  try {
    if (!userId) {
      console.log('No userId provided for portal access check');
      return { hasPortalAccess: false };
    }
    
    console.log('Checking portal access for user:', userId);
    
    // Check the user document in Firestore
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('User document not found');
      return { hasPortalAccess: false };
    }
    
    const userData = userDoc.data();
    const hasPortalAccess = userData.isPortalUser === true;
    
    console.log('Portal access check result:', hasPortalAccess);
    
    return {
      hasPortalAccess,
      alcorId: userData.alcorId,
      salesforceContactId: userData.salesforceContactId
    };
    
  } catch (error) {
    console.error('Error checking portal access:', error);
    return { hasPortalAccess: false };
  }
};

// Add this function to your auth.js file

export const verify2FACode = async (userId, code) => {
  try {
    console.log('Verifying 2FA code for user:', userId);
    
    if (!userId || !code) {
      throw new Error('User ID and verification code are required');
    }
    
    if (code.length !== 6) {
      throw new Error('Invalid code format. Please enter a 6-digit code.');
    }
    
    const authCoreFn = httpsCallable(functions, 'authCore');
    
    const result = await authCoreFn({
      action: 'verify2FACode',
      userId,
      code
    });
    
    if (!result.data) {
      throw new Error('Invalid response from server');
    }
    
    console.log('verify2FACode result:', result.data);
    
    return result.data;
    
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify 2FA code'
    };
  }
};

/**
 * Validate Alcor ID format
 * Client-side validation before sending to backend
 */
export const validateAlcorId = (alcorId) => {
  if (!alcorId || typeof alcorId !== 'string') {
    return {
      isValid: false,
      error: 'Alcor ID is required'
    };
  }
  
  // Remove whitespace and convert to uppercase
  const cleaned = alcorId.trim().toUpperCase().replace(/\s/g, '');
  
  // Match patterns: A-1234, A1234, 1234
  const match = cleaned.match(/^[A]?[-]?(\d+)$/);
  
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid format. Expected: A-1234'
    };
  }
  
  const numericId = match[1];
  
  if (numericId.length < 1 || numericId.length > 6) {
    return {
      isValid: false,
      error: 'ID must be 1-6 digits'
    };
  }
  
  return {
    isValid: true,
    normalizedId: `A-${numericId}`,
    numericId: numericId
  };
};

// Add this enhanced logout function to your auth.js file

/**
 * Enhanced logout function with optional backend cleanup
 * @param {Object} options - Logout options
 * @param {boolean} options.callBackend - Whether to call backend logout function
 * @param {string} options.logoutMethod - Method of logout ('manual', 'timeout', 'forced')
 * @returns {Promise<Object>} Logout result
 */
 export const logoutUser = async (options = {}) => {
  const { callBackend = true, logoutMethod = 'manual' } = options;
  
  console.log("Starting logout process", { callBackend, logoutMethod });
  
  try {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log("Current user found:", currentUser.uid);
      
      // Calculate session duration if we have metadata
      let sessionDuration = null;
      if (currentUser.metadata?.lastSignInTime) {
        sessionDuration = Date.now() - new Date(currentUser.metadata.lastSignInTime).getTime();
      }
      
      // Call backend logout function if requested
      if (callBackend) {
        try {
          console.log("Calling backend logout function");
          const authCoreFn = httpsCallable(functions, 'authCore');
          
          const result = await authCoreFn({
            action: 'logoutUser',
            logoutMethod,
            sessionDuration
          });
          
          if (result.data?.success) {
            console.log("Backend logout successful");
          } else {
            console.warn("Backend logout returned non-success:", result.data);
          }
        } catch (backendError) {
          console.error("Backend logout error:", backendError);
          // Continue with frontend logout even if backend fails
        }
      }
      
      // Sign out from Firebase Auth
      await auth.signOut();
      console.log("Firebase Auth signout successful");
      
    } else {
      console.log("No user currently signed in");
    }
    
    // Clear all local storage related to authentication
    clearVerificationState();
    localStorage.removeItem('signupState');
    localStorage.removeItem('fresh_signup');
    localStorage.removeItem('portalUser');
    localStorage.removeItem('userProfile');
    
    // Clear any session storage
    sessionStorage.clear();
    
    console.log("Local storage cleared");
    
    return { 
      success: true,
      message: 'Logout successful'
    };
    
  } catch (error) {
    console.error("Error during logout:", error);
    
    // Even if there's an error, try to clear local storage
    try {
      clearVerificationState();
      localStorage.clear();
      sessionStorage.clear();
    } catch (clearError) {
      console.error("Error clearing storage:", clearError);
    }
    
    return {
      success: false,
      error: error.message || 'Logout failed'
    };
  }
};

/**
 * Get user profile data including photo URL
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // First try to get from Firebase Auth
    const user = auth.currentUser;
    let photoURL = null;
    let displayName = null;
    
    if (user && user.uid === userId) {
      photoURL = user.photoURL;
      displayName = user.displayName;
      
      // For Google users, photoURL is usually available
      if (user.providerData && user.providerData.length > 0) {
        const googleProvider = user.providerData.find(p => p.providerId === 'google.com');
        if (googleProvider && googleProvider.photoURL) {
          photoURL = googleProvider.photoURL;
        }
      }
    }
    
    // Then get additional data from Firestore
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      return {
        success: true,
        profile: {
          photoURL: userData.photoURL || photoURL,
          displayName: userData.name || userData.displayName || displayName || 'Member',
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          memberType: userData.memberType || userData.userType || 'Member',
          alcorId: userData.alcorId,
          isPortalUser: userData.isPortalUser || false,
          isApplicant: userData.isApplicant || false,
          twoFactorEnabled: userData.twoFactorEnabled || false
        }
      };
    }
    
    // Return basic info if no Firestore document
    return {
      success: true,
      profile: {
        photoURL,
        displayName: displayName || 'Member',
        email: user?.email,
        memberType: 'Member'
      }
    };
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: error.message,
      profile: {
        displayName: 'Member',
        memberType: 'Member'
      }
    };
  }
};

/**
 * Force logout for session timeout
 * @returns {Promise<Object>} Logout result
 */
export const forceLogoutForTimeout = async () => {
  console.log("Forcing logout due to session timeout");
  
  return logoutUser({
    callBackend: true,
    logoutMethod: 'timeout'
  });
};

/**
 * Format Alcor ID for display
 * Ensures consistent A-#### format
 */
export const formatAlcorId = (value) => {
  if (!value) return '';
  
  // Remove non-alphanumeric characters except dash
  let cleaned = value.replace(/[^A-Za-z0-9-]/g, '');
  
  // If it starts with a number, add A-
  if (cleaned && /^\d/.test(cleaned)) {
    cleaned = 'A-' + cleaned;
  }
  
  // Convert to uppercase
  return cleaned.toUpperCase();
};

export { 
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  linkWithPopup,
  verifyPasswordResetCode,
  confirmPasswordReset,
  db
};