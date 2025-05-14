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
          signupProgress: 0, // Default to 0, will be updated when navigating to signup
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
            message: 'Invalid email or password. Please check your credentials and try again.'
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
          navigate('/signup?step=0&showSuccess=true', { replace: true });
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
            signupProgress: 1, // Default to step 1
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
      const sendPasswordResetLinkFn = httpsCallable(functions, 'sendPasswordResetLink');
      
      // Call the cloud function
      const result = await sendPasswordResetLinkFn({ email });
      
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
        const checkAuthMethodFn = httpsCallable(functions, 'checkAuthMethod');
        
        try {
            // console.log("Calling checkAuthMethod with email:", email);
            const authMethodResult = await checkAuthMethodFn({ email });
            
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
        const createEmailVerification = httpsCallable(functions, 'createEmailVerification');
        
        // Call the function with a timeout
        // console.log("Calling createEmailVerification with:", { email, name });
        const result = await Promise.race([
            createEmailVerification({ email, name }),
            new Promise((_, reject) => 
                setTimeout(() => {
                    // console.log("Request timed out after 15 seconds");
                    reject(new Error('Request timed out'));
                }, 15000)
            )
        ]);
        
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
            
            // Call checkAuthMethod again to get detailed auth info
            // This is now our second check, but we need it to get complete auth details
            // console.log("Calling checkAuthMethod to get complete auth details...");
            
            try {
                // console.log("Sending email to checkAuthMethod:", email);
                const authMethodResult = await checkAuthMethodFn({ email });
                
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

/**
 * Checks the user's current step and session status
 * 
 * @param {Object} data Object containing userId
 * @returns {Promise<Object>} Response containing user step information and session status
 */
 export const checkUserStep = async (data) => {
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
        step: 0, // Default to step 0 on error
        stepName: 'account',
        exists: false,
        isSessionExpired: false
      };
    }
  }

// Split verification into two steps for security
// Step 1: Verify the code only (no authentication)
export async function verifyEmailCodeOnly(verificationId, code) {
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
      signupProgress: result.data.signupProgress || 1,
      signupStep: result.data.signupStep || "contact_info"
    };
  } catch (error) {
    console.error('Error verifying email code:', error);
    throw error;
  }
}

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
      const createNewUserFn = httpsCallable(functions, 'createNewUser');
      
      const result = await createNewUserFn({
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
              signupProgress: 1,
              signupStep: "contact_info",
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
          signupProgress: 1,
          signupStep: "contact_info",
          timestamp: Date.now()
        });
        
        return {
          success: true,
          isExistingUser: false,
          signupProgress: 1,
          signupStep: "contact_info"
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
          const signInExistingUserFn = httpsCallable(functions, 'signInExistingUser');
          
          const result = await signInExistingUserFn({
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
                  signupProgress: result.data.signupProgress || 0,
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
          signupProgress: verificationResult.signupProgress || 0,
          signupStep: verificationResult.signupStep || "account",
          timestamp: Date.now()
        });
        
        return {
          success: true,
          isExistingUser: true,
          signupProgress: verificationResult.signupProgress || 0,
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
    
    // console.log("DEBUG: Starting Google sign-in process", { keepExistingUser });
    
    try {
      // Only sign out if not keeping the existing user
      if (!keepExistingUser) {
        // console.log("DEBUG: Signing out any current user");
        try {
          await auth.signOut();
          // console.log("DEBUG: Sign out successful or no user was logged in");
        } catch (signOutError) {
          console.error("DEBUG: Error during sign out:", signOutError);
          // Continue anyway
        }
      } else {
        // console.log("DEBUG: Maintaining current session, not signing out");
      }
      
      // Create Google auth provider
      const googleProvider = new GoogleAuthProvider();
      
      // Authenticate with Google
      // console.log("DEBUG: Authenticating with Google");
      const tempResult = await signInWithPopup(auth, googleProvider);
      const user = tempResult.user;
      const email = user.email;
      // console.log(`DEBUG: Google account email: ${email}`);
      
      // Check for existing email with password auth
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      // Check if any users were found with password auth
      if (!querySnapshot.empty) {
        // console.log(`DEBUG: Found ${querySnapshot.size} existing user(s) in Firestore with email: ${email}`);
        
        let hasPasswordUser = false;
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // console.log(`DEBUG: User data for ${doc.id}:`, userData);
          
          if (userData.authProvider === "email" || 
              userData.authProvider === "password" ||
              (userData.authProviders && userData.authProviders.includes("password"))) {
            // console.log(`DEBUG: User ${doc.id} has password auth`);
            hasPasswordUser = true;
          }
        });
        
        if (hasPasswordUser) {
          // console.log(`DEBUG: Email ${email} exists with password auth, signing out user`);
          
          // Sign out the temporary user
          await auth.signOut();
          
          return {
            success: false,
            error: 'auth/account-exists-with-different-credential',
            email,
            message: "This email is already registered with a password. Please sign in with your password first to link your accounts."
          };
        }
      } else {
        // console.log(`DEBUG: No existing users found in Firestore with email: ${email}`);
      }
      
      // User can safely continue with Google sign-in
      // console.log(`DEBUG: Email ${email} can safely use Google sign-in`);
      
      // Check if this user already exists in Firestore
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        // Determine if this is a new user based on document existence
        const isNewUser = !userDoc.exists();
        // console.log(`DEBUG: Is new user: ${isNewUser}`);
        
        if (isNewUser) {
          // Create new user document
          // console.log(`DEBUG: Creating new user document for ${user.uid}`);
          await setDoc(userRef, {
            email: user.email,
            name: user.displayName || "New Member",
            signupProgress: 1,
            signupStep: "contact_info",
            createdAt: new Date(),
            authProvider: "google",
            hasGoogleAuth: true,
            authProviders: ["google.com"],
            lastSignIn: new Date()
          });
        } else {
          // Update existing document
          // console.log(`DEBUG: Updating existing user document for ${user.uid}`);
          await updateDoc(userRef, {
            lastSignIn: new Date(),
            hasGoogleAuth: true
          });
        }
        
        // Get updated user document for accurate progress info
        const updatedUserDoc = isNewUser ? null : await getDoc(userRef);
        const userData = updatedUserDoc ? updatedUserDoc.data() : null;
        
        // Update local storage
        saveSignupState({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          isExistingUser: !isNewUser,
          signupProgress: userData ? (userData.signupProgress || 1) : 1,
          signupStep: userData ? (userData.signupStep || "contact_info") : "contact_info",
          timestamp: Date.now()
        });
        
        // Clear any verification state
        clearVerificationState();
        
        // Return with correct isNewUser flag
        return {
          success: true,
          isNewUser: isNewUser,
          user,
          // Include additionalUserInfo from Firebase for validation
          additionalUserInfo: tempResult.additionalUserInfo
        };
      } catch (firestoreError) {
        console.error("DEBUG: Error with Firestore:", firestoreError);
        
        // Even with Firestore errors, we need to determine if this is actually a new user
        // For safety, we'll use Firebase's additionalUserInfo
        const isNewUser = tempResult.additionalUserInfo?.isNewUser || false;
        // console.log(`DEBUG: Falling back to Firebase isNewUser flag: ${isNewUser}`);
        
        // Update local storage with best-effort information
        saveSignupState({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          isExistingUser: !isNewUser,
          signupProgress: 1,
          signupStep: "contact_info",
          timestamp: Date.now()
        });
        
        // Clear any verification state
        clearVerificationState();
        
        return {
          success: true,
          isNewUser: isNewUser,
          user,
          firestoreError: true
        };
      }
    } catch (error) {
      console.error("DEBUG: Error in Google sign-in:", error);
      
      // Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: error.code,
          message: "Google sign-in was cancelled."
        };
      }
      
      // For any other errors, rethrow
      throw error;
    }
  }

  export const updateSignupProgress = async (step, progress, data = {}) => {
    console.log(`🔄 PROGRESS: Function called with step="${step}", progress=${progress}`);
    console.log(`🔄 PROGRESS: Data keys:`, Object.keys(data));
    
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("❌ PROGRESS: No authenticated user found when updating progress");
        throw new Error("User must be authenticated to update progress");
      }
      
      console.log(`🔄 PROGRESS: User authenticated: ${user.uid} (${user.email})`);
      
      // Update user document with progress information
      const userRef = doc(db, "users", user.uid);
      console.log(`🔄 PROGRESS: Getting user document reference: users/${user.uid}`);
      
      // Check if document exists first
      console.log(`🔄 PROGRESS: Checking if user document exists...`);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log(`🔄 PROGRESS: User document exists, current data:`, userDoc.data());
        console.log(`🔄 PROGRESS: Current progress: ${userDoc.data().signupProgress}, signupStep: "${userDoc.data().signupStep}"`);
        
        // Create update object
        const updateData = {
          signupStep: step,
          signupProgress: progress,
          lastUpdated: new Date(),
          [`formData.${step}`]: data
        };
        console.log(`🔄 PROGRESS: Updating document with:`, updateData);
        
        // Update existing document
        await updateDoc(userRef, updateData);
        console.log(`🔄 PROGRESS: Document updated successfully`);
        
        // Verify update worked
        const updatedDoc = await getDoc(userRef);
        console.log(`🔄 PROGRESS: Verification - Updated progress: ${updatedDoc.data().signupProgress}, step: "${updatedDoc.data().signupStep}"`);
      } else {
        console.log(`🔄 PROGRESS: User document doesn't exist, creating new document`);
        
        // Create document data
        const docData = {
          email: user.email,
          displayName: user.displayName || "New Member",
          signupStep: step,
          signupProgress: progress,
          createdAt: new Date(),
          lastUpdated: new Date(),
          formData: {
            [step]: data,
          }
        };
        console.log(`🔄 PROGRESS: Creating document with:`, docData);
        
        // Create new document
        await setDoc(userRef, docData);
        console.log(`🔄 PROGRESS: New document created successfully`);
      }
      
      // Also update local storage for redundancy
      const signupState = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "New Member",
        signupStep: step,
        signupProgress: progress,
        timestamp: Date.now(),
      };
      
      console.log(`🔄 PROGRESS: Updating local storage with:`, signupState);
      saveSignupState(signupState);
      console.log(`🔄 PROGRESS: Local storage updated`);
      
      console.log(`🔄 PROGRESS: Function completed successfully`);
      return { success: true };
    } catch (error) {
      console.error(`❌ PROGRESS: Error updating progress:`, error);
      console.error(`❌ PROGRESS: Error stack:`, error.stack);
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


export const getContactInfo = async () => {
    try {
      console.log("=== getContactInfo: Starting function ===");
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("getContactInfo: No authenticated user found");
        return { success: false, error: "User not authenticated" };
      }
      
      // Log detailed user information to help diagnose auth issues
      console.log("getContactInfo: User details:", {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous,
        authProvider: currentUser.providerData.length > 0 ? 
            currentUser.providerData[0].providerId : 'none',
        emailVerified: currentUser.emailVerified,
        tokenExpiration: currentUser.stsTokenManager?.expirationTime ?
            new Date(currentUser.stsTokenManager.expirationTime).toISOString() : 'unknown'
      });
      
      // Check if token is about to expire
      const tokenExpirationMs = currentUser.stsTokenManager?.expirationTime - Date.now();
      if (tokenExpirationMs < 300000 && tokenExpirationMs > 0) { // less than 5 minutes
        console.warn(`getContactInfo: Auth token expires soon (in ${Math.floor(tokenExpirationMs/1000)} seconds)`);
      } else if (tokenExpirationMs <= 0) {
        console.warn("getContactInfo: Auth token may have expired");
      } else {
        console.log(`getContactInfo: Token valid for ${Math.floor(tokenExpirationMs/60000)} minutes`);
      }
      
      console.log("getContactInfo: Getting contact info via Cloud Function");
      
      // Track the start time for performance monitoring
      const startTime = Date.now();
      
      // Call the Cloud Function with explicit userId
      const getContactInfoFn = httpsCallable(functions, 'getContactInfo');
      
      // Add the userId explicitly to resolve the issue
      const result = await getContactInfoFn({ userId: currentUser.uid });
      
      // Log timing information
      console.log(`getContactInfo: Cloud Function call completed in ${Date.now() - startTime}ms`);
      
      // Log the structure of the response
      console.log("getContactInfo: Response structure:", {
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        success: result.data?.success,
        hasContactInfo: result.data?.contactInfo ? 'yes' : 'no',
        contactInfoFields: result.data?.contactInfo ? Object.keys(result.data.contactInfo) : []
      });
      
      if (result.data.success) {
        console.log("getContactInfo: Successfully retrieved contact info");
        return result.data;
      } else {
        console.error("getContactInfo: Failed to get contact info:", result.data.error);
        return {
          success: false,
          error: result.data.error || "Unable to retrieve contact information"
        };
      }
    } catch (error) {
      console.error("getContactInfo: Error in function:", error);
      console.error("getContactInfo: Error stack:", error.stack);
      console.error("getContactInfo: Error code:", error.code);
      console.error("getContactInfo: Error details:", error.details || 'none');
      
      return { 
        success: false, 
        error: error.message || "Unknown error retrieving contact information" 
      };
    } finally {
      console.log("=== getContactInfo: Function completed ===");
    }
  };


/**
 * Get contact information for the current user from the backend
 * @returns {Promise<Object>} Response with contact information
 */
/*export const getContactInfo = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error("No authenticated user found when trying to get contact info");
      return { success: false, error: "User not authenticated" };
    }
    
    console.log("Getting contact info for user:", currentUser.uid);
    
    // Try to get directly from Firestore
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().contactInfo) {
        console.log("Found contact info in Firestore");
        return { 
          success: true, 
          contactInfo: userDoc.data().contactInfo
        };
      } else {
        console.log("No contact info found in Firestore");
        return {
          success: false,
          error: "No contact information found"
        };
      }
    } catch (firestoreError) {
      console.error("Error accessing Firestore:", firestoreError);
      return {
        success: false,
        error: "Database error: " + firestoreError.message
      };
    }
  } catch (error) {
    console.error("Error in getContactInfo:", error);
    return { 
      success: false, 
      error: error.message || "Unknown error retrieving contact information" 
    };
  }
};*/



/**
 * Save contact information for the current user to the backend
 * @param {Object} contactData - Contact information to save
 * @returns {Promise<boolean>} Success indicator
 */
 export const saveContactInfo = async (contactData) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("No authenticated user found when trying to save contact info");
        throw new Error("User must be authenticated to save contact info");
      }
      
      console.log("Preparing to save contact info", { 
        userId: currentUser.uid,
        fieldCount: Object.keys(contactData).length 
      });
      
      // First, try the Cloud Function approach
      try {
        console.log("Attempting to use Cloud Function for encrypted storage");
        
        // Make sure the functions object is properly initialized
        if (!functions) {
          console.error("Firebase functions not initialized");
          throw new Error("Firebase functions not available");
        }
        
        const saveContactInfoFn = httpsCallable(functions, 'saveContactInfo');
        
        console.log("Cloud Function obtained, sending data...");
        const result = await saveContactInfoFn(contactData);
        
        console.log("Cloud Function response received:", result);
        
        if (result?.data?.success) {
          console.log("Contact info saved successfully via Cloud Function");
          return true;
        } else {
          console.warn("Cloud Function returned error:", result?.data?.error || "Unknown error");
          throw new Error(result?.data?.error || "Failed to save contact information via Cloud Function");
        }
      } catch (fnError) {
        console.error("Error with Cloud Function, falling back to direct Firestore:", fnError);
        
        // Fallback to the original direct Firestore method
        try {
          console.log("Saving directly to Firestore as fallback");
          const userRef = doc(db, "users", currentUser.uid);
          
          // Check if user document exists
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // Update existing document
            await updateDoc(userRef, {
              contactInfo: {
                ...contactData,
                updatedAt: new Date()
              },
              signupProgress: 1,
              signupStep: "contact_info",
              lastUpdated: new Date()
            });
          } else {
            // Create new document
            await setDoc(userRef, {
              email: currentUser.email,
              name: currentUser.displayName || contactData.firstName + " " + contactData.lastName,
              contactInfo: {
                ...contactData,
                updatedAt: new Date()
              },
              signupProgress: 1,
              signupStep: "contact_info",
              createdAt: new Date(),
              lastUpdated: new Date()
            });
          }
          
          console.log("Contact info saved successfully via direct Firestore");
          return true;
        } catch (firestoreError) {
          console.error("Final fallback Firestore save failed:", firestoreError);
          throw new Error("Failed to save contact information: " + firestoreError.message);
        }
      }
    } catch (error) {
      console.error("Error in saveContactInfo:", error);
      throw error;
    }
  };

/**
 * Save contact information for the current user to the backend
 * @param {Object} contactData - Contact information to save
 * @returns {Promise<boolean>} Success indicator
 */
/*export const saveContactInfo = async (contactData) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error("No authenticated user found when trying to save contact info");
      throw new Error("User must be authenticated to save contact info");
    }
    
    console.log("Saving contact info for user:", currentUser.uid);
    
    try {
      // Save directly to Firestore
      const userRef = doc(db, "users", currentUser.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userRef, {
          contactInfo: {
            ...contactData,
            updatedAt: new Date()
          },
          signupProgress: 1,
          signupStep: "contact_info",
          lastUpdated: new Date()
        });
      } else {
        // Create new document
        await setDoc(userRef, {
          email: currentUser.email,
          name: currentUser.displayName || contactData.firstName + " " + contactData.lastName,
          contactInfo: {
            ...contactData,
            updatedAt: new Date()
          },
          signupProgress: 1,
          signupStep: "contact_info",
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      }
      
      console.log("Contact info saved successfully");
      return true;
    } catch (firestoreError) {
      console.error("Error saving to Firestore:", firestoreError);
      throw new Error("Failed to save contact information: " + firestoreError.message);
    }
  } catch (error) {
    console.error("Error in saveContactInfo:", error);
    throw error;
  }
};*/

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