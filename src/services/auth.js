// src/services/auth.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  getFunctions,
  httpsCallable
} from 'firebase/functions';
import { saveSignupState, saveVerificationState } from '../contexts/UserContext';
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";

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

export async function requestEmailVerification(email, name) {
  if (isDevelopment) {
    console.log("Starting email verification request...", { email, name });
  }
  
  try {
    // Input validation
    if (!email || !name) {
      throw new Error('Email and name are required');
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
    
    // Save verification state to localStorage (without password)
    saveVerificationState({
      email,
      name,
      verificationId: result.data.verificationId,
      isExistingUser: result.data.isExistingUser || false,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      verificationId: result.data.verificationId,
      isExistingUser: result.data.isExistingUser || false
    };
  } catch (error) {
    console.error('Error requesting email verification:', error);
    
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

// Step 2: Create or sign in the user with the provided credentials
export async function createOrSignInUser(verificationResult, email, name, password) {
  try {
    if (!verificationResult || !verificationResult.success) {
      throw new Error('Verification must be completed successfully before account creation');
    }
    
    if (!email || !name || !password) {
      throw new Error('Email, name, and password are required');
    }
    
    // If the user is new (no existing account)
    if (!verificationResult.isExistingUser) {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Update user profile with name
      await updateProfile(auth.currentUser, {
        displayName: name
      });
      
      // Create user document in Firestore
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        email: email,
        name: name,
        signupProgress: 1,
        signupStep: "contact_info",
        createdAt: new Date()
      });
      
      // Save signup state
      saveSignupState({
        userId: userCredential.user.uid,
        isExistingUser: false,
        signupProgress: 1,
        signupStep: "contact_info",
        timestamp: Date.now()
      });
      
      return {
        success: true,
        isExistingUser: false,
        signupProgress: 1
      };
    } else {
      // For existing users, sign in with the provided credentials
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Save signup state
        saveSignupState({
          userId: userCredential.user.uid,
          isExistingUser: true,
          signupProgress: verificationResult.signupProgress || 1,
          signupStep: verificationResult.signupStep || "contact_info",
          timestamp: Date.now()
        });
        
        return {
          success: true,
          isExistingUser: true,
          signupProgress: verificationResult.signupProgress || 1,
          signupStep: verificationResult.signupStep || "contact_info"
        };
      } catch (signInError) {
        if (signInError.code === 'auth/wrong-password') {
          throw new Error('Incorrect password for existing account');
        } else {
          throw signInError;
        }
      }
    }
  } catch (error) {
    console.error('Error creating or signing in user:', error);
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
    const verificationState = JSON.parse(localStorage.getItem('alcor_verification_state'));
    
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

// Rest of your functions remain the same
export async function updateSignupProgress(step, progress, contactData) {
  // Existing implementation
}

// Helper function for direct Firestore access
async function saveContactInfoDirectly(formData) {
  // Existing implementation
}

export const saveContactInfo = async (formData) => {
  // Existing implementation
};

export async function signInWithGoogle() {
  // Existing implementation
}

export async function saveStepData(stepName, stepData) {
  // Existing implementation
}

export { auth, functions, db };