// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useUser } from '../contexts/UserContext';
import { getStepPathByIndex } from '../services/storage';
import ResponsiveBanner from '../components/ResponsiveBanner';
import darkLogo from "../assets/images/alcor-white-logo.png";

const LoginPage = () => {
  console.log("LoginPage component initialized");
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Wrap user context access in try/catch for debugging
  let currentUser, signupState, authResolved, isLoading;
  try {
    const userContext = useUser();
    currentUser = userContext.currentUser;
    signupState = userContext.signupState;
    authResolved = userContext.authResolved;
    isLoading = userContext.isLoading;
    console.log("UserContext accessed successfully", { 
      hasCurrentUser: !!currentUser,
      hasSignupState: !!signupState,
      authResolved,
      isLoading
    });
  } catch (err) {
    console.error("Error accessing UserContext:", err);
    currentUser = null;
    signupState = null;
    authResolved = false;
    isLoading = false;
  }
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if this is for continuing signup from the URL
  const searchParams = new URLSearchParams(location.search);
  const isContinueSignup = searchParams.get('continue') === 'signup';
  const returnTo = searchParams.get('returnTo') || '';
  
  // Debug information on component mount
  useEffect(() => {
    console.log("LoginPage mounted completely");
    console.log("Auth state:", { 
      authResolved, 
      isLoading,
      hasUser: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email
    });
    
    if (signupState) {
      console.log("Signup state:", {
        progress: signupState.signupProgress,
        completed: signupState.signupCompleted,
        step: signupState.signupStep
      });
    } else {
      console.log("No signup state available");
    }
  }, []);
  
  // Handle redirect logic in a separate effect with error handling
  useEffect(() => {
    try {
      // Only process redirects if auth is resolved and we have a user
      if (!authResolved || !currentUser) {
        console.log("Not ready for redirect checks yet", { authResolved, hasUser: !!currentUser });
        return;
      }
      
      console.log("Processing redirect logic for logged-in user");
      
      // Check if we have a valid return URL (highest priority)
      if (returnTo && (returnTo.startsWith('/') || returnTo.startsWith(window.location.origin))) {
        const returnPath = returnTo.startsWith('/') 
          ? returnTo 
          : new URL(returnTo).pathname;
        
        console.log("Redirecting to return URL:", returnPath);
        navigate(returnPath, { replace: true });
        return;
      } 
      
      // Check if signup is completed (second priority)
      if (signupState?.signupCompleted) {
        console.log("Signup completed, redirecting to member portal");
        navigate('/member-portal', { replace: true });
        return;
      } 
      
      // Handle partial signup progress (route to the correct step)
      if (signupState) {
        // Get the user's current progress (0-5)
        const currentProgress = signupState.signupProgress || 0;
        console.log("Current signup progress:", currentProgress);
        
        if (currentProgress === 0) {
          console.log("User at beginning of signup, redirecting to success page");
          navigate('/signup/success', { replace: true });
        } else {
          // Get the path for their current step
          try {
            const nextStepPath = getStepPathByIndex(currentProgress);
            console.log(`Redirecting to current signup step: ${nextStepPath}`);
            navigate(`/signup${nextStepPath}`, { replace: true });
          } catch (err) {
            console.error("Error getting step path:", err);
            // Fallback to signup main page
            navigate('/signup', { replace: true });
          }
        }
        return;
      }
      
      // Fallback - start signup from beginning
      console.log("No signup state found, redirecting to begin signup");
      navigate('/signup', { replace: true });
      
    } catch (err) {
      console.error("Error in redirect logic:", err);
    }
  }, [authResolved, currentUser, signupState, navigate, returnTo]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login form submitted");
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log("Attempting Firebase login for:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase login successful");
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      
      switch(err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        default:
          setError('Login failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('Google sign-in is currently disabled');
  };

  const handleGoBack = () => {
    navigate('/');
  };
  
  // Render a simple loading state if still loading
  if (isLoading && !authResolved) {
    console.log("Rendering loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
      </div>
    );
  }
  
  console.log("Rendering login form");
  
  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
      <ResponsiveBanner 
        logo={darkLogo}
        heading={isContinueSignup ? "Continue Your Membership Application" : "Sign In to Member Portal"}
        subText={isContinueSignup ? "Sign in to continue where you left off." : "Access your Alcor membership account."}
        showSteps={false}
        showStar={true}
        showProgressBar={false}
        useGradient={true}
        textAlignment="center"
      />
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleLogin} className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Sign in to your account
            </h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john.smith@example.com" 
                className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                disabled={loading}
              />
            </div>
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-gray-800 text-lg font-medium">Password</label>
                <Link 
                  to="/reset-password" 
                  className="text-purple-700 text-sm hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <input 
                type="password" 
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" 
                className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#6f2d74",
                  color: "white"
                }}
                className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
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
            
            {/* Google Sign-In Option */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg mb-6 flex items-center justify-center hover:bg-gray-50 shadow-sm disabled:opacity-70"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="h-6 w-6 mr-3" />
              Continue with Google
            </button>
            
            {/* Sign Up Option */}
            <div className="text-center mt-6">
              <p className="text-gray-700 mb-4">
                Don't have an account?{" "}
                <Link 
                  to="/signup" 
                  className="text-purple-700 hover:underline"
                  onClick={() => {
                    // Set a flag for fresh signup to avoid redirect loops
                    localStorage.setItem('fresh_signup', 'true');
                    console.log("Set fresh_signup flag for new signup");
                  }}
                >
                  Sign up here
                </Link>
              </p>
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;