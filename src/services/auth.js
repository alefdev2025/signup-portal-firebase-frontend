// src/services/auth.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCustomToken,
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator
} from 'firebase/functions';
import { saveSignupState, saveVerificationState } from '../contexts/UserContext';

// Use environment variables for configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

// Connect to Firebase emulators in development mode
if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
  console.log('Connecting to Firebase emulators...');
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

// Function to clear verification state from localStorage
export const clearVerificationState = () => {
  localStorage.removeItem("alcor_verification_state");
};

export async function requestEmailVerification(email, name) {
  console.log("Starting email verification request...", { email, name });
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
    
    // Save verification state to localStorage
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
    throw error;
  }
}

export async function verifyEmailCode(verificationId, code) {
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
    
    // Sign in with custom token if it exists
    if (result.data.customToken) {
      await signInWithCustomToken(auth, result.data.customToken);
      
      // Save signup state
      saveSignupState({
        userId: result.data.userId,
        isExistingUser: result.data.isExistingUser || false,
        signupProgress: result.data.signupProgress || 1,
        signupStep: result.data.signupStep || "contact_info",
        timestamp: Date.now()
      });
      
      // Clear verification state as it's no longer needed
      clearVerificationState();
    } else {
      throw new Error('No authentication token received');
    }
    
    return {
      success: true,
      isExistingUser: result.data.isExistingUser || false,
      signupProgress: result.data.signupProgress || 1
    };
  } catch (error) {
    console.error('Error verifying email code:', error);
    throw error;
  }
}

export async function updateSignupProgress(step, progress) {
  try {
    // Input validation
    if (!step || progress === undefined) {
      throw new Error('Step and progress are required');
    }
    
    // Get the Firebase function
    const updateProgressFn = httpsCallable(functions, 'updateSignupProgress');
    
    // Call the function with a timeout
    const result = await Promise.race([
      updateProgressFn({ step, progress }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      )
    ]);
    
    // Check if result exists and has data
    if (!result || !result.data) {
      throw new Error('Invalid response from server');
    }
    
    // Check for success in the response
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to update progress');
    }
    
    // Update local signup state
    saveSignupState({
      signupProgress: progress,
      signupStep: step,
      timestamp: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating signup progress:', error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Call backend function to process the sign-in
    const processGoogleSignIn = httpsCallable(functions, 'processGoogleSignIn');
    
    // Call the function with a timeout
    const backendResult = await Promise.race([
      processGoogleSignIn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 10000)
      )
    ]);
    
    // Check if result exists and has data
    if (!backendResult || !backendResult.data) {
      throw new Error('Invalid response from server');
    }
    
    // Check for success in the response
    if (!backendResult.data.success) {
      throw new Error(backendResult.data.error || 'Failed to process sign-in');
    }
    
    // Save signup state
    saveSignupState({
      userId: result.user.uid,
      signupProgress: backendResult.data.signupProgress || 1,
      signupStep: backendResult.data.signupStep || "contact_info",
      timestamp: Date.now()
    });
    
    return {
      success: true,
      user: result.user,
      signupProgress: backendResult.data.signupProgress || 1
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export { auth, functions };