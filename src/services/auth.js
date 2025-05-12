// src/services/auth.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
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
  fetchSignInMethodsForEmail ,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import {
  getFunctions,
  httpsCallable
} from 'firebase/functions';
import { saveSignupState, saveVerificationState, getVerificationState } from '../contexts/UserContext';
//import { getFirestore, doc, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";

import {
    getFirestore,
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

// Environment flag - true for development, false for production
const isDevelopment = import.meta.env.MODE === 'development';

// Use environment variables for configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Set the region for your Firebase functions
const FIREBASE_REGION = import.meta.env.VITE_FIREBASE_REGION || 'us-central1';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, FIREBASE_REGION);

// Log environment for debugging
if (isDevelopment) {
  console.log('Running in development environment');
  console.log('Firebase config:', {
    projectId: firebaseConfig.projectId,
    region: FIREBASE_REGION
  });
}

// Function to clear verification state from localStorage
export const clearVerificationState = () => {
  localStorage.removeItem("alcor_verification_state");
};

// Simplified sign in function with better credential error handling
export const signInWithEmailAndPassword = async (email, password) => {
    console.log("DEBUG: Starting simplified signInWithEmailAndPassword process");
    
    try {
      // Input validation
      if (!email || !password) {
        console.log("DEBUG: Email or password missing");
        throw new Error('Email and password are required');
      }
      
      // First, sign out any existing user
      console.log("DEBUG: Signing out any current user");
      try {
        await auth.signOut();
        console.log("DEBUG: Sign out successful or no user was logged in");
      } catch (signOutError) {
        console.error("DEBUG: Error during sign out:", signOutError);
        // Continue anyway
      }
      
      console.log("DEBUG: Attempting to sign in with Firebase");
      console.log(`DEBUG: Using email: ${email}, password length: ${password.length}`);
      
      // Use a try-catch specifically for the sign-in operation
      try {
        // Sign in with Firebase - this is the core authentication
        const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
        console.log("DEBUG: Sign in successful, user:", userCredential.user.uid);
        
        // Save minimal signup state to localStorage without trying to access Firestore
        console.log("DEBUG: Saving minimal signup state to localStorage");
        saveSignupState({
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || "New Member",
          isExistingUser: true, // Assume existing user since they're able to log in
          signupProgress: 0, // Default to 0, will be updated when navigating to signup
          signupStep: "account",
          timestamp: Date.now()
        });
        console.log("DEBUG: Saved minimal signup state to localStorage");
        
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
    console.log("Starting Google sign-in process");
    
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
      console.log("Calling signInWithGoogle()");
      const result = await signInWithGoogle();
      
      console.log("Google sign-in result:", result);
      
      // Check specifically for account conflict
      if (result && result.accountConflict === true) {
        console.log(`Account conflict detected for email: ${result.existingEmail}`);
        
        // Navigate directly to login page for account linking
        console.log(`Redirecting to login for account linking`);
        
        const email = result.existingEmail || "";
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      // Also check for the error code directly
      if (result && result.error === 'auth/account-exists-with-different-credential') {
        console.log(`Account conflict detected from error code`);
        
        const email = result.email || "";
        navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
        return;
      }
      
      if (result && result.success) {
        // Clear verification state since we're now authenticated
        clearVerificationState();
        console.log("Cleared verification state");
        
        // Set hasNavigatedRef to true to show success screen
        hasNavigatedRef.current = true;
        console.log("Set hasNavigatedRef to true");
        
        // After sign-in, wait a moment for auth state to update
        setTimeout(() => {
          // Navigate to signup with showSuccess parameter
          console.log("Navigating to signup with showSuccess parameter");
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
        console.log("Caught auth/account-exists-with-different-credential error");
        
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
      console.log("Setting isSubmitting back to false");
    }
  };

  export const linkGoogleToEmailAccount = async () => {
    try {
      console.log("DEBUG: Linking Google account to password-based account");
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Store the current user's email
      const userEmail = currentUser.email;
      console.log(`DEBUG: Current user email: ${userEmail}`);
      
      // Create Google auth provider
      const googleProvider = new GoogleAuthProvider();
      
      // Set login hint to force selection of the right Google account
      googleProvider.setCustomParameters({
        login_hint: userEmail
      });
      
      // Link the Google account to the current user
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        console.log("DEBUG: Successfully linked Google account");
        
        // Update user document to reflect multiple auth methods
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            hasGoogleAuth: true,
            authProvider: "multiple",
            authProviders: arrayUnion("google.com"),
            lastUpdated: new Date()
          });
          console.log("DEBUG: Updated user document with Google auth info");
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
          console.log("DEBUG: Detected credential already in use");
          
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
      console.log("DEBUG: Linking password to Google account");
      
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
        console.log("DEBUG: User already has password auth");
        throw new Error("This account already has a password");
      }
      
      // Create email credential
      const emailCredential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      // Link the credential to the current user
      await linkWithCredential(currentUser, emailCredential);
      console.log("DEBUG: Successfully linked password to Google account");
      
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
        
        console.log("DEBUG: Updated user document with password auth info");
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

  /*export const linkPasswordToGoogleAccount = async (password) => {
    try {
      console.log("DEBUG: Linking password to Google account");
      
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
      
      // Log full provider data for debugging
      console.log("DEBUG: User provider data:", currentUser.providerData);
      
      // Check if already has password provider
      const hasPasswordProvider = currentUser.providerData.some(
        p => p.providerId === 'password'
      );
      
      if (hasPasswordProvider) {
        console.log("DEBUG: User already has password auth");
        throw new Error("This account already has a password");
      }
      
      // Create email credential
      const emailCredential = EmailAuthProvider.credential(
        currentUser.email,
        password
      );
      
      // Link the credential to the current user
      try {
        await linkWithCredential(currentUser, emailCredential);
        console.log("DEBUG: Successfully linked password to Google account");
      } catch (linkError) {
        console.error("DEBUG: Error linking credentials:", linkError);
        throw linkError;
      }
      
      // Update user document to reflect multiple auth methods
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          hasPasswordAuth: true,
          authProvider: "multiple",
          authProviders: arrayUnion("password"),
          lastUpdated: new Date()
        });
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

export const linkGoogleToEmailAccount = async () => {
    try {
      console.log("DEBUG: Linking Google account to password-based account");
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Store the current user's email
      const userEmail = currentUser.email;
      
      // Create Google auth provider
      const googleProvider = new GoogleAuthProvider();
      
      // Set login hint to force selection of the right Google account
      googleProvider.setCustomParameters({
        login_hint: userEmail
      });
      
      // Link the Google account to the current user
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        
        console.log("DEBUG: Successfully linked Google account");
        
        // Update user document to reflect multiple auth methods
        try {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            hasGoogleAuth: true,
            authProviders: arrayUnion("google.com"),
            lastUpdated: new Date()
          });
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
          console.log("DEBUG: Detected credential already in use");
          
          // This means a Google account with this email already exists separately
          // Let's tell the user to just continue with their password account for now
          return {
            success: false,
            error: linkError.code,
            message: "A Google account with this email already exists. Please continue with your password account for now."
          };
        }
        
        throw linkError;
      }
    } catch (error) {
      console.error("DEBUG: Error linking Google account:", error);
      throw error;
    }
  };*/

// Password reset function for login page
export const resetPassword = async (email) => {
    try {
      // Input validation
      if (!email) {
        throw new Error('Email is required');
      }
      
      // Get Firebase functions
      const functions = getFunctions();
      const sendPasswordResetLinkFn = httpsCallable(functions, 'sendPasswordResetLink');
      
      // Call the cloud function
      const result = await sendPasswordResetLinkFn({ email });
      
      // Always return success for security reasons
      console.log("Password reset email sent for:", email);
      
      return {
        success: true
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      // Generic error for security
      throw new Error('Unable to send reset email. Please try again later.');
    }
  };

// Updated requestEmailVerification function in auth.js
export async function requestEmailVerification(email, name) {
    if (isDevelopment) {
      console.log("Starting email verification request...", { email, name });
    }
    
    try {
      // Input validation
      if (!email || !name) {
        throw new Error('Email and name are required');
      }
      
      // First, sign out any existing user to prevent Firestore permission errors
      try {
        await auth.signOut();
        console.log("DEBUG: User signed out before verification request");
      } catch (signOutError) {
        console.log("DEBUG: Error signing out or no user to sign out:", signOutError);
        // Continue anyway
      }
      
      // Get the Firebase function
      const createEmailVerification = httpsCallable(functions, 'createEmailVerification');
      
      // Call the function with a timeout
      const result = await Promise.race([
        createEmailVerification({ email, name }),
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
        throw new Error(result.data.error || 'Failed to send verification code');
      }
      
      // Check if this is an existing user
      if (result.data.isExistingUser) {
        console.log("DEBUG: Email belongs to an existing user:", email);
        
        // Call a server function to check auth method (need to create this)
        const checkAuthMethodFn = httpsCallable(functions, 'checkAuthMethod');
        
        try {
          const authMethodResult = await checkAuthMethodFn({ email });
          
          if (authMethodResult.data && authMethodResult.data.success) {
            // Get auth provider info
            const authProvider = authMethodResult.data.primaryAuthMethod || 'password';
            
            // Save verification state with auth provider info
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
          console.error("Error checking auth method:", authCheckError);
          
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
      
      // Save verification state for new user
      saveVerificationState({
        email,
        name,
        verificationId: result.data.verificationId,
        isExistingUser: false,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        verificationId: result.data.verificationId,
        isExistingUser: false
      };
      
    } catch (error) {
      console.error('Error requesting email verification:', error);
      
      // Check for errors that indicate an existing user
      if (error.code === 'auth/email-already-in-use' || 
          (error.message && (
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('already in use')
          ))) {
        console.log("DEBUG: Email already exists error detected:", error.message);
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
        console.error('CORS issue detected. Make sure your Firebase Functions have CORS configured properly.');
        throw new Error('Network connectivity issue. Please ensure your Firebase configuration allows requests from this application.');
      }
      
      throw error;
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
        console.log("DEBUG: User signed out before creating new user");
      } catch (signOutError) {
        console.log("DEBUG: Error signing out or no user to sign out:", signOutError);
        // Continue anyway
      }
      
      // Call the Firebase function to create a new user
      console.log("DEBUG: Calling createNewUser cloud function");
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
      
      console.log("DEBUG: Cloud function createNewUser succeeded");
      
      // Now sign in with the new credentials
      console.log("DEBUG: Signing in with new credentials");
      try {
        const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
        console.log("DEBUG: Sign in successful with new user");
        
        // Try to create the user document directly as a fallback
        try {
          console.log("DEBUG: Checking if user document exists in Firestore");
          const userRef = doc(db, "users", userCredential.user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            console.log("DEBUG: User document doesn't exist, creating one directly");
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
            console.log("DEBUG: User document created directly");
          } else {
            console.log("DEBUG: User document already exists");
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
        console.log("DEBUG: User signed out before signing in existing user");
      } catch (signOutError) {
        console.log("DEBUG: Error signing out or no user to sign out:", signOutError);
        // Continue anyway
      }
      
      // First attempt to sign in with Firebase Auth
      console.log("DEBUG: Signing in with Firebase Auth");
      try {
        const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
        console.log("DEBUG: Sign in successful with existing user");
        
        // Call the cloud function to update records and get user state
        console.log("DEBUG: Calling signInExistingUser cloud function");
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
            console.log("DEBUG: Cloud function signInExistingUser succeeded");
            
            // Check if document exists in Firestore (double-check)
            try {
              console.log("DEBUG: Checking if user document exists in Firestore");
              const userRef = doc(db, "users", userCredential.user.uid);
              const userDoc = await getDoc(userRef);
              
              if (!userDoc.exists()) {
                console.log("DEBUG: User document doesn't exist, creating one directly");
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
                console.log("DEBUG: User document created directly");
              } else {
                console.log("DEBUG: User document already exists");
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
        console.log("DEBUG: Routing to signInExistingUser");
        return signInExistingUser(verificationResult, email, password);
      } else {
        console.log("DEBUG: Routing to createNewUser");
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

// Modified signInWithGoogle with direct Firestore check
/*export async function signInWithGoogle() {
    console.log("DEBUG: Starting Google sign-in process");
    
    try {
      // First, sign out any existing user
      console.log("DEBUG: Signing out any current user");
      try {
        await auth.signOut();
        console.log("DEBUG: Sign out successful or no user was logged in");
      } catch (signOutError) {
        console.error("DEBUG: Error during sign out:", signOutError);
        // Continue anyway
      }
      
      console.log("DEBUG: Creating Google auth provider");
      const provider = new GoogleAuthProvider();
      
      try {
        // Get the Google account info
        console.log("DEBUG: Getting Google account info");
        const tempResult = await signInWithPopup(auth, provider);
        const user = tempResult.user;
        const email = user.email;
        console.log(`DEBUG: Google account email: ${email}`);
        
        // **** CRITICAL FIX: Check Firestore directly for existing users with this email ****
        console.log(`DEBUG: Checking Firestore directly for users with email: ${email}`);
        
        // Query Firestore for users with this email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        // Check if any users were found
        if (!querySnapshot.empty) {
          console.log(`DEBUG: Found ${querySnapshot.size} existing user(s) in Firestore with email: ${email}`);
          
          // Check each user to see if they have password auth
          let hasPasswordUser = false;
          
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            console.log(`DEBUG: User data for ${doc.id}:`, userData);
            
            // Check if this user has password auth
            if (userData.authProvider === "email" || 
                userData.authProvider === "password" ||
                (userData.authProviders && userData.authProviders.includes("password"))) {
              
              console.log(`DEBUG: User ${doc.id} has password auth`);
              hasPasswordUser = true;
            }
          });
          
          // If we found a user with password auth, sign out and return conflict
          if (hasPasswordUser) {
            console.log(`DEBUG: Email ${email} exists with password auth, signing out user`);
            
            // Sign out the temporary user
            await auth.signOut();
            
            // CHANGE THIS RETURN:
            return {
              success: false,
              error: 'auth/account-exists-with-different-credential',
              email: email,                                        
              message: "This email is already registered with a password. Please sign in with your password first to link your Google account."
            };
          }
        } else {
          console.log(`DEBUG: No existing users found in Firestore with email: ${email}`);
        }
        
        // If we get here, either no users with this email or none with password auth
        console.log(`DEBUG: Email ${email} can safely use Google sign-in`);
        
        // The user is already signed in from our check
        // Check for existing Firestore document and create if needed
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            console.log("DEBUG: Creating Firestore document for Google user");
            await setDoc(userRef, {
              email: user.email,
              name: user.displayName || "New Member",
              signupProgress: 1, // Default to 1 (contact info) for new Google users
              signupStep: "contact_info",
              createdAt: new Date(),
              authProvider: "google",
              hasGoogleAuth: true,
              authProviders: ["google.com"],
              lastSignIn: new Date()
            });
          } else {
            console.log("DEBUG: Updating last sign-in time for existing Google user");
            await updateDoc(userRef, {
              lastSignIn: new Date()
            });
          }
        } catch (firestoreError) {
          console.error("DEBUG: Error with Firestore for Google user:", firestoreError);
          // Continue anyway - we'll use localStorage state
        }
        
        // Save to localStorage for redundancy
        saveSignupState({
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || "New Member",
          isExistingUser: false, // Assume new user for Google sign-in
          signupProgress: 1, // Default to step 1 for Google users
          signupStep: "contact_info",
          timestamp: Date.now()
        });
        
        // Clear verification state if exists
        clearVerificationState();
        
        return {
          success: true,
          isNewUser: true,
          user: user
        };
      } catch (signInError) {
        console.error("DEBUG: Google sign-in error:", signInError);
        throw signInError;
      }
    } catch (error) {
      console.error("DEBUG: Error in Google sign-in:", error);
      throw error;
    }
  }*/

// The error is likely in the signInWithGoogle function where I added options parameters.
// Let's provide the correct version that maintains compatibility:

export async function signInWithGoogle(options) {
    // Handle options in a backward-compatible way
    const keepExistingUser = options && options.maintainSession === true;
    
    console.log("DEBUG: Starting Google sign-in process", { keepExistingUser });
    
    try {
      // Only sign out if not keeping the existing user
      if (!keepExistingUser) {
        console.log("DEBUG: Signing out any current user");
        try {
          await auth.signOut();
          console.log("DEBUG: Sign out successful or no user was logged in");
        } catch (signOutError) {
          console.error("DEBUG: Error during sign out:", signOutError);
          // Continue anyway
        }
      } else {
        console.log("DEBUG: Maintaining current session, not signing out");
      }
      
      // Create Google auth provider
      const googleProvider = new GoogleAuthProvider();
      
      // Authenticate with Google
      console.log("DEBUG: Authenticating with Google");
      const tempResult = await signInWithPopup(auth, googleProvider);
      const user = tempResult.user;
      const email = user.email;
      console.log(`DEBUG: Google account email: ${email}`);
      
      // Check for existing email with password auth
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      // Check if any users were found with password auth
      if (!querySnapshot.empty) {
        console.log(`DEBUG: Found ${querySnapshot.size} existing user(s) in Firestore with email: ${email}`);
        
        let hasPasswordUser = false;
        
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log(`DEBUG: User data for ${doc.id}:`, userData);
          
          if (userData.authProvider === "email" || 
              userData.authProvider === "password" ||
              (userData.authProviders && userData.authProviders.includes("password"))) {
            console.log(`DEBUG: User ${doc.id} has password auth`);
            hasPasswordUser = true;
          }
        });
        
        if (hasPasswordUser) {
          console.log(`DEBUG: Email ${email} exists with password auth, signing out user`);
          
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
        console.log(`DEBUG: No existing users found in Firestore with email: ${email}`);
      }
      
      // User can safely continue with Google sign-in
      console.log(`DEBUG: Email ${email} can safely use Google sign-in`);
      
      // Update Firestore
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Create new user document
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
          await updateDoc(userRef, {
            lastSignIn: new Date(),
            hasGoogleAuth: true
          });
        }
      } catch (firestoreError) {
        console.error("DEBUG: Error with Firestore:", firestoreError);
        // Continue anyway
      }
      
      // Update local storage
      saveSignupState({
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || "New Member",
        isExistingUser: false,
        signupProgress: 1,
        signupStep: "contact_info",
        timestamp: Date.now()
      });
      
      // Clear any verification state
      clearVerificationState();
      
      return {
        success: true,
        isNewUser: true,
        user
      };
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
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found when updating progress");
        throw new Error("User must be authenticated to update progress");
      }
      
      console.log(`Updating progress for user ${user.uid} to step: ${step}, progress: ${progress}`);
      
      // Update user document with progress information
      const userRef = doc(db, "users", user.uid);
      
      // Check if document exists first
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userRef, {
          signupStep: step,
          signupProgress: progress,
          lastUpdated: new Date(),
          [`formData.${step}`]: data, // Store form data for this step
        });
        console.log("Updated existing user document with new progress");
      } else {
        // Create new document
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || "New Member",
          signupStep: step,
          signupProgress: progress,
          createdAt: new Date(),
          lastUpdated: new Date(),
          formData: {
            [step]: data,
          },
        });
        console.log("Created new user document with initial progress");
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
      
      saveSignupState(signupState);
      console.log("Updated local signupState:", signupState);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating signup progress:", error);
      return { success: false, error };
    }
  };
  
// Modified helper functions with better error handling
export async function saveContactInfo(formData) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User must be authenticated to save contact info');
    }
    
    try {
      console.log("DEBUG: Attempting to update contact info in Firestore");
      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        contactInfo: {
          ...formData,
          updatedAt: new Date()
        }
      });
      
      console.log("DEBUG: Contact info updated in Firestore");
    } catch (firestoreError) {
      console.error("DEBUG: Error updating contact info in Firestore:", firestoreError);
      
      // Try to create the document if it doesn't exist
      try {
        console.log("DEBUG: Attempting to create user document with contact info");
        const userRef = doc(db, "users", currentUser.uid);
        
        await setDoc(userRef, {
          email: currentUser.email,
          name: currentUser.displayName || "New Member",
          contactInfo: {
            ...formData,
            updatedAt: new Date()
          },
          createdAt: new Date()
        });
        
        console.log("DEBUG: Successfully created user document with contact info");
      } catch (createError) {
        console.error("DEBUG: Failed to create document:", createError);
        // At this point, we've tried everything and it's still failing
        // Just alert the user about permission issues
        throw new Error("Permission error: Unable to save data to the database. Please check your Firestore security rules.");
      }
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error saving contact info:', error);
    throw error;
  }
}

// Modified helper function for saving step data
export async function saveStepData(stepName, stepData) {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User must be authenticated to save step data');
    }
    
    try {
      console.log(`DEBUG: Attempting to save ${stepName} data to Firestore`);
      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        [`steps.${stepName}`]: {
          ...stepData,
          updatedAt: new Date()
        }
      });
      
      console.log(`DEBUG: ${stepName} data saved to Firestore`);
    } catch (firestoreError) {
      console.error(`DEBUG: Error saving ${stepName} data to Firestore:`, firestoreError);
      
      // Try to create the document if it doesn't exist
      try {
        console.log(`DEBUG: Attempting to create user document with ${stepName} data`);
        const userRef = doc(db, "users", currentUser.uid);
        
        await setDoc(userRef, {
          email: currentUser.email,
          name: currentUser.displayName || "New Member",
          steps: {
            [stepName]: {
              ...stepData,
              updatedAt: new Date()
            }
          },
          createdAt: new Date()
        });
        
        console.log(`DEBUG: Successfully created user document with ${stepName} data`);
      } catch (createError) {
        console.error(`DEBUG: Failed to create document for ${stepName}:`, createError);
        // At this point we've tried everything and it's still failing
        throw new Error("Permission error: Unable to save data to the database. Please check your Firestore security rules.");
      }
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error saving ${stepName} data:`, error);
    throw error;
  }
}

// Enhanced logout function
export const logout = async () => {
  console.log("DEBUG: Starting logout process");
  
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("DEBUG: Current user found, signing out", currentUser.uid);
      await auth.signOut();
      console.log("DEBUG: User signed out successfully");
    } else {
      console.log("DEBUG: No user to sign out");
    }
    
    return { success: true };
  } catch (error) {
    console.error("DEBUG: Error signing out:", error);
    throw error;
  }
};

export async function checkEmailExists(email) {
    if (!email) return { exists: false };
    
    console.log(`DEBUG: Checking if email exists: ${email}`);
    
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
    auth, 
    functions, 
    db,
    // Re-export necessary Firebase functions for use in other components
    EmailAuthProvider,
    GoogleAuthProvider,
    linkWithCredential,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    linkWithPopup,
    verifyPasswordResetCode,
    confirmPasswordReset
  };