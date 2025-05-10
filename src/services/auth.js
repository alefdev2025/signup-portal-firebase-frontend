// src/services/auth.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFunctions,
  httpsCallable
} from 'firebase/functions';
import { saveSignupState, saveVerificationState, getVerificationState } from '../contexts/UserContext';
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

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

// Password reset function for login page
export const resetPassword = async (email) => {
  try {
    // Input validation
    if (!email) {
      throw new Error('Email is required');
    }
    
    // Send password reset email
    await sendPasswordResetEmail(auth, email);
    
    console.log("DEBUG: Password reset email sent successfully");
    
    return {
      success: true
    };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
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
        
        // We still save verification state, but will handle redirect in UI component
        saveVerificationState({
          email,
          name,
          verificationId: result.data.verificationId,
          isExistingUser: true,
          timestamp: Date.now()
        });
        
        return {
          success: true,
          verificationId: result.data.verificationId,
          isExistingUser: true
        };
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

// Simplified Google sign-in function
export async function signInWithGoogle() {
  console.log("DEBUG: Starting simplified Google sign-in process");
  
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
    
    console.log("DEBUG: Attempting sign in with popup");
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("DEBUG: Google sign-in successful, user:", user.uid);
    
    // Save directly to localStorage without trying to access Firestore
    console.log("DEBUG: Saving minimal signup state to localStorage");
    saveSignupState({
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || "New Member",
      isExistingUser: true, // Assume existing for safety
      signupProgress: 0,
      signupStep: "account",
      timestamp: Date.now()
    });
    
    // Clear verification state if exists
    clearVerificationState();
    
    return {
      success: true,
      isExistingUser: true,
      signupProgress: 0,
      signupStep: "account"
    };
  } catch (error) {
    console.error("DEBUG: Error in Google sign-in:", error);
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

export { auth, functions, db };