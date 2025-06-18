// Simple Fixed LoginPage.jsx - Get backend progress and navigate accordingly

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { resetPassword } from '../services/auth';
import { useUser } from '../contexts/UserContext';
import ResponsiveBanner from '../components/ResponsiveBanner';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import darkLogo from "../assets/images/alcor-white-logo.png";

const LoginPage = () => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const [showResetForm, setShowResetForm] = useState(false);
 const [resetEmail, setResetEmail] = useState('');
 const [resetError, setResetError] = useState('');
 const [successMessage, setSuccessMessage] = useState('');
 const [isSubmittingReset, setIsSubmittingReset] = useState(false);
 const [isContinueSignup, setIsContinueSignup] = useState(false);
 
 // States for Google sign-in integration
 const [pendingGoogleLinking, setPendingGoogleLinking] = useState(false);
 const [highlightGoogleButton, setHighlightGoogleButton] = useState(false);
 const [showNoAccountMessage, setShowNoAccountMessage] = useState(false);
 
 const { currentUser, signupState, isLoading: userLoading } = useUser();
 const navigate = useNavigate();
 const location = useLocation();

 // Process URL parameters
 useEffect(() => {
   const searchParams = new URLSearchParams(location.search);
   const continueSignup = searchParams.get('continue') === 'signup';
   const emailParam = searchParams.get('email');
   const provider = searchParams.get('provider');
   
   if (continueSignup) {
     setIsContinueSignup(true);
   }
   
   if (emailParam) {
     setEmail(emailParam);
   }
   
   if (provider === 'google' && emailParam) {
     setHighlightGoogleButton(true);
     setSuccessMessage(`This email (${emailParam}) is associated with a Google account. Please sign in with Google.`);
   }
 }, [location.search]);
 
 // SIMPLE: Navigate based on backend progress after successful login
 useEffect(() => {
   if (currentUser && signupState && !userLoading && !loading) {
     console.log(`User logged in. Progress: ${signupState.signupProgress}, Step: ${signupState.signupStep}, Completed: ${signupState.signupCompleted}`);
     
     // If continuing signup
     if (isContinueSignup) {
       // If signup is completed, go to member portal
       if (signupState.signupCompleted) {
         console.log('Signup completed - going to member portal');
         navigate('/portal-home', { replace: true });
         return;
       }
       
       // Navigate to signup - SignupFlowContext will handle setting the right step
       console.log('Going to signup flow');
       navigate('/signup', { replace: true });
     } else {
       // Member portal login - navigate to portal home
       console.log('Member portal login - going to portal home');
       navigate('/portal-home', { replace: true });
     }
   }
 }, [currentUser, signupState, userLoading, loading, navigate, isContinueSignup]);
 
 const handleLogin = async (e) => {
   e.preventDefault();
   
   if (!email || !password) {
     setError('Please enter both email and password');
     return;
   }
   
   try {
     setLoading(true);
     setError('');
     
     console.log('Attempting login...');
     await signInWithEmailAndPassword(auth, email, password);
     setSuccessMessage('Successfully signed in. Redirecting...');
     // Navigation will happen in useEffect above once backend data loads
     
   } catch (err) {
     console.error("Login error:", err.code, err.message);
     
     switch(err.code) {
       case 'auth/user-not-found':
       case 'auth/wrong-password':
       case 'auth/invalid-credential':
       case 'auth/invalid-email':
         setError('Invalid email or password. Please check your credentials and try again.');
         break;
       case 'auth/too-many-requests':
         setError('Too many failed login attempts. Please try again later or reset your password.');
         break;
       case 'auth/user-disabled':
         setError('This account has been disabled. Please contact support.');
         break;
       case 'auth/network-request-failed':
         setError('Network error. Please check your internet connection and try again.');
         break;
       default:
         setError('Sign in failed. Please check your credentials and try again.');
     }
   } finally {
     setLoading(false);
   }
 };
 
 const handleGoogleSignInSuccess = (result, isNewUser) => {
   if (isNewUser) {
     setShowNoAccountMessage(true);
     return;
   }
   
   setSuccessMessage("Successfully signed in with Google. Redirecting...");
   // Navigation will happen in useEffect above once backend data loads
 };
 
 const handleGoogleSignInError = (errorMessage) => {
   setError(errorMessage);
 };
 
 const handleAccountConflict = (result) => {
   const email = result.email || result.existingEmail || "";
   navigate(`/login?email=${encodeURIComponent(email)}&continue=signup&provider=password&linkAccounts=true`);
 };

 const handleGoBack = () => {
   navigate('/');
 };
 
 const handleShowResetForm = () => {
   setResetEmail(email || '');
   setShowResetForm(true);
 };
 
 const handleCancelReset = () => {
   setShowResetForm(false);
   setResetEmail('');
   setResetError('');
 };
 
 const handleResetEmailChange = (e) => {
   setResetEmail(e.target.value);
   setResetError('');
 };
 
 const handleInputChange = (e) => {
   const { name, value } = e.target;
   
   if (successMessage) {
     setSuccessMessage('');
   }
   
   if (name === 'email') {
     setEmail(value);
   } else if (name === 'password') {
     setPassword(value);
   }
   
   if (error) {
     setError('');
   }
 };
 
 const validateResetForm = () => {
   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
   if (!resetEmail.trim()) {
     setResetError('Email is required');
     return false;
   }
   
   if (!emailPattern.test(resetEmail)) {
     setResetError('Please enter a valid email address');
     return false;
   }
   
   return true;
 };
 
 const handleResetPassword = async (e) => {
   e.preventDefault();
   
   if (isSubmittingReset) return;
   if (!validateResetForm()) return;
   
   setIsSubmittingReset(true);
   
   try {
     await resetPassword(resetEmail);
     
     const message = `If an account exists for ${resetEmail}, we've sent a password reset link. Please check your email.`;
     setSuccessMessage(message);
     setShowResetForm(false);
     setResetEmail('');
     
   } catch (error) {
     setResetError("Unable to send reset email. Please try again later.");
   } finally {
     setIsSubmittingReset(false);
   }
 };
 
 return (
   <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white relative">
     <ResponsiveBanner 
       logo={darkLogo}
       heading={isContinueSignup ? "Continue Application" : "Sign In to Member Portal"}
       subText={isContinueSignup ? "Sign in to continue where you left off." : "Access your Alcor membership account."}
       showSteps={false}
       showStar={true}
       showProgressBar={false}
       useGradient={true}
       textAlignment="center"
     />
     
     <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
       <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
         {showResetForm ? (
           // Password Reset Form
           <form onSubmit={handleResetPassword} className="p-8">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Your Password</h2>
             <p className="text-gray-600 mb-6">Enter your email address below and we'll send you a link to reset your password.</p>
             
             {resetError && (
               <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                 {resetError}
               </div>
             )}
             
             <div className="mb-6">
               <label htmlFor="resetEmail" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
               <input 
                 type="email" 
                 id="resetEmail"
                 value={resetEmail}
                 onChange={handleResetEmailChange}
                 placeholder="e.g. john.smith@example.com" 
                 className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                 disabled={isSubmittingReset}
               />
             </div>
             
             <div className="flex flex-col space-y-3">
               <button 
                 type="submit"
                 disabled={isSubmittingReset}
                 style={{ backgroundColor: "#6f2d74", color: "white" }}
                 className="w-full py-4 px-6 rounded-full font-semibold text-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70"
               >
                 {isSubmittingReset ? (
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
                 onClick={handleCancelReset}
                 disabled={isSubmittingReset}
                 className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
               >
                 Back to Sign In
               </button>
             </div>
           </form>
         ) : (
           // Login Form
           <form onSubmit={handleLogin} className="p-8">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">
               {isContinueSignup ? "Sign in to continue" : "Sign in to your account"}
             </h2>
             
             {successMessage && (
               <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
                 {successMessage}
               </div>
             )}
             
             {error && (
               <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                 {error}
               </div>
             )}
             
             {showNoAccountMessage && (
               <div className="mb-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
                 <p className="font-medium mb-3 text-yellow-800">No account exists with this Google account.</p>
                 <p className="mb-4 text-yellow-700">Select 'Create New Account' or continue to sign in another way.</p>
                 <div className="flex justify-center">
                   <button
                     type="button"
                     onClick={() => navigate('/signup')}
                     style={{ backgroundColor: "#172741", color: "white" }}
                     className="py-2 px-4 rounded hover:opacity-90 w-full"
                   >
                     Create New Account
                   </button>
                 </div>
               </div>
             )}
             
             <div className="mb-6">
               <label htmlFor="email" className="block text-gray-800 text-lg font-medium mb-2">Email</label>
               <input 
                 type="email" 
                 id="email"
                 name="email"
                 value={email}
                 onChange={handleInputChange}
                 placeholder="e.g. john.smith@example.com" 
                 className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                 disabled={loading}
               />
             </div>
             
             <div className="mb-8">
               <div className="flex justify-between items-center mb-2">
                 <label htmlFor="password" className="block text-gray-800 text-lg font-medium">Password</label>
                 <button 
                   type="button" 
                   onClick={handleShowResetForm}
                   className="text-purple-700 text-sm hover:underline"
                 >
                   Forgot Password?
                 </button>
               </div>
               <input 
                 type="password" 
                 id="password"
                 name="password"
                 value={password}
                 onChange={handleInputChange}
                 placeholder="Enter your password" 
                 className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-lg"
                 disabled={loading}
               />
             </div>
             
             <div className="space-y-4">
               <button 
                 type="submit"
                 disabled={loading}
                 style={{ backgroundColor: "#6f2d74", color: "white" }}
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
             
             <div className="flex items-center my-6">
               <div className="flex-grow border-t border-gray-300"></div>
               <div className="px-4 text-gray-500 uppercase text-sm">OR</div>
               <div className="flex-grow border-t border-gray-300"></div>
             </div>
             
             <GoogleSignInButton
               onSuccess={handleGoogleSignInSuccess}
               onError={handleGoogleSignInError}
               onAccountConflict={handleAccountConflict}
               disabled={loading}
               highlight={highlightGoogleButton}
               setIsSubmitting={setLoading}
               setPendingGoogleLinking={setPendingGoogleLinking}
               label={highlightGoogleButton ? "Sign in with Google (Recommended)" : "Continue with Google"}
             />
             
             <div className="text-center mt-6">
               <p className="text-gray-700 mb-4">
                 Don't have an account?{" "}
                 <Link 
                   to="/signup" 
                   className="text-purple-700 hover:underline"
                   onClick={() => {
                     localStorage.setItem('fresh_signup', 'true');
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
         )}
       </div>
     </div>
   </div>
 );
};

export default LoginPage;