// File: pages/LoginPage.jsx - With progress-aware redirection
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
  db
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
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if this is for continuing signup from the URL
  const searchParams = new URLSearchParams(location.search);
  const isContinueSignup = searchParams.get('continue') === 'signup';
  const emailParam = searchParams.get('email');
  
  const [formData, setFormData] = useState({
    email: emailParam || "",
    password: "",
  });
  
  const [resetEmail, setResetEmail] = useState("");
  
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
    reset: ""
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
          
          // If this is a signup redirect, show a helpful message
          if (isContinueSignup) {
            setErrors(prev => ({
              ...prev,
              general: `This email is already registered. Please sign in to continue your membership process.`
            }));
          }
        }
      } catch (error) {
        console.error("Error initializing login page:", error);
      }
    };
    
    clearAndPrepare();
  }, [emailParam, isContinueSignup]);

  // Redirect when user becomes authenticated
  useEffect(() => {
    if (currentUser) {
      console.log("DEBUG: User authenticated, checking signup progress");
      setIsLoading(true);
      
      // First check if we have a signupState from context
      if (signupState) {
        const progress = signupState.signupProgress || 0;
        console.log(`DEBUG: Found signup state in context, progress: ${progress}`);
        
        // Navigate to the appropriate step
        navigate(`/signup?step=${progress}`);
        return;
      }
      
      getUserProgress();
    }
  }, [currentUser, navigate, signupState]);

  // Add this enhanced getUserProgress function to your LoginPage.jsx
  const getUserProgress = async () => {
    try {
      console.log("DEBUG: Attempting to get user document from Firestore");
      console.log(`DEBUG: User ID: ${currentUser.uid}`);
      
      const userDocRef = doc(db, "users", currentUser.uid);
      console.log("DEBUG: Created document reference");
      
      try {
        const userDoc = await getDoc(userDocRef);
        console.log("DEBUG: Document fetch result:", userDoc);
        
        if (userDoc.exists()) {
          // Get progress from Firestore document
          const userData = userDoc.data();
          console.log("DEBUG: User document data:", userData);
          
          const progress = userData.signupProgress || 0;
          console.log(`DEBUG: Found progress in Firestore: ${progress}`);
          
          // Save to localStorage for future use
          saveSignupState({
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "New Member",
            isExistingUser: true,
            signupProgress: progress,
            signupStep: userData.signupStep || "account",
            timestamp: Date.now()
          });
          console.log("DEBUG: Saved signup state to localStorage with progress:", progress);
          
          // Navigate to the appropriate step
          console.log(`DEBUG: Navigating to step ${progress}`);
          navigate(`/signup?step=${progress}`);
        } else {
          // User document doesn't exist, create one and go to step 0
          console.log("DEBUG: No user document found in Firestore, creating one");
          
          try {
            // Create a basic user document
            await setDoc(userDocRef, {
              email: currentUser.email,
              name: currentUser.displayName || "New Member",
              signupProgress: 0,
              signupStep: "account",
              createdAt: new Date(),
              authProvider: currentUser.providerData[0]?.providerId || "email",
              lastSignIn: new Date(),
              isCreatedByFallback: true // Flag to track documents created this way
            });
            
            console.log("DEBUG: User document created successfully");
          } catch (createError) {
            console.error("DEBUG: Error creating user document:", createError);
            // Continue anyway - we'll use localStorage state
          }
          
          // Save minimal state
          saveSignupState({
            userId: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || "New Member",
            isExistingUser: true,
            signupProgress: 0,
            signupStep: "account",
            timestamp: Date.now()
          });
          console.log("DEBUG: Saved minimal signup state to localStorage with default progress 0");
          
          // Navigate to step 0
          console.log("DEBUG: Navigating to step 0 (default)");
          navigate('/signup?step=0');
        }
      } catch (firestoreError) {
        console.error("DEBUG: Firestore getDoc error:", firestoreError);
        console.error("DEBUG: Firestore error code:", firestoreError.code);
        console.error("DEBUG: Firestore error message:", firestoreError.message);
        
        // Try to create user document despite the error
        try {
          console.log("DEBUG: Attempting to create user document after Firestore error");
          await setDoc(userDocRef, {
            email: currentUser.email,
            name: currentUser.displayName || "New Member",
            signupProgress: 0,
            signupStep: "account",
            createdAt: new Date(),
            authProvider: currentUser.providerData[0]?.providerId || "email",
            lastSignIn: new Date(),
            isCreatedAfterError: true // Flag to track documents created after errors
          });
          console.log("DEBUG: User document created after Firestore error");
        } catch (createError) {
          console.error("DEBUG: Error creating user document after Firestore error:", createError);
        }
        
        // In case of Firestore error, check localStorage as fallback
        console.log("DEBUG: Checking localStorage for signup progress");
        const localSignupState = localStorage.getItem('alcor_signup_state');
        
        if (localSignupState) {
          try {
            const parsedState = JSON.parse(localSignupState);
            console.log("DEBUG: Found local signup state:", parsedState);
            
            const localProgress = parsedState.signupProgress || 0;
            console.log(`DEBUG: Using progress from localStorage: ${localProgress}`);
            
            // Navigate to the step from localStorage
            navigate(`/signup?step=${localProgress}`);
            return;
          } catch (parseError) {
            console.error("DEBUG: Error parsing localStorage state:", parseError);
          }
        }
        
        // If all else fails, default to step 0
        console.log("DEBUG: Defaulting to step 0 due to errors");
        navigate('/signup?step=0');
      }
    } catch (error) {
      console.error("DEBUG: General error getting user progress:", error);
      
      // In case of error, default to step 0
      console.log("DEBUG: Defaulting to step 0 due to error");
      saveSignupState({
        userId: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || "New Member",
        isExistingUser: true,
        signupProgress: 0,
        signupStep: "account",
        timestamp: Date.now()
      });
      
      navigate('/signup?step=0');
    } finally {
      setIsLoading(false);
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
      reset: ""
    });
    
    try {
      console.log("DEBUG: Attempting Google sign-in");
      
      // Sign in with Google
      await signInWithGoogle();
      console.log("DEBUG: Google sign-in successful");
      
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
      alert(`Password reset email sent to ${resetEmail}. Please check your inbox and follow the instructions.`);
      
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

  // Show loading spinner during authentication and progress checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
          <p className="mt-4 text-gray-600">Checking your signup progress...</p>
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
      
      <div className="flex-1 flex justify-center items-start px-8 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
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
                  className="w-full px-4 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
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
                {isContinueSignup ? "Sign in to continue" : "Sign in to your account"}
              </h2>
              
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                  {errors.general}
                </div>
              )}
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john.smith@example.com" 
                  className="w-full px-4 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                  disabled={isSubmitting}
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
                  className="w-full px-4 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
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
                  className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
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
                    <>Sign In</>
                  )}
                </button>
              </div>
              
              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg mb-6 flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70"
              >
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
                Continue with Google
              </button>
              
              <div className="text-center">
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