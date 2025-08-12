// pages/ResetPasswordPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

// Core Firebase service
import { auth } from "../services/firebase";

// Auth functions
import { 
  verifyPasswordResetCode,
  confirmPasswordReset
} from "../services/auth";

// Components and assets
import darkLogo from "../assets/images/alcor-white-logo.png";
import ResponsiveBanner from "../components/ResponsiveBanner";
import PasswordField, { checkPasswordStrength } from "../components/signup/PasswordField";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract code from URL - check both action URL and direct URL formats
  const searchParams = new URLSearchParams(location.search);
  const oobCode = searchParams.get('oobCode') || searchParams.get('code');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [message, setMessage] = useState(null);
  const [resetSuccessful, setResetSuccessful] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [errors, setErrors] = useState({
    newPassword: "",
    confirmPassword: "",
    general: ""
  });

  // Handle URL redirections and parameter extraction
  useEffect(() => {
    // If we're on the Firebase action URL, redirect to our app with the code
    if (location.pathname.includes('/__/auth/action')) {
      // Extract all query parameters
      const params = new URLSearchParams(location.search);
      const oobCode = params.get('oobCode');
      
      if (oobCode) {
        // Redirect to the actual reset page with the code
        navigate(`/reset-password?oobCode=${oobCode}`, { replace: true });
        return;
      }
    }
    
    // Log all search params to help debug
    console.log("URL search params:", Object.fromEntries([...searchParams.entries()]));
    console.log("Extracted oobCode:", oobCode);
    
    // Continue with normal verification
    verifyResetCode();
  }, [location.pathname, location.search]);

  // Countdown effect for redirection after successful reset
  useEffect(() => {
    if (resetSuccessful && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (resetSuccessful && redirectCountdown === 0) {
      navigate('/login');
    }
  }, [resetSuccessful, redirectCountdown, navigate]);

  // Verify the reset code
  const verifyResetCode = async () => {
    // Skip if we're redirecting
    if (location.pathname.includes('/__/auth/action')) {
      return;
    }
    
    if (!oobCode) {
      setIsVerifying(false);
      setIsValid(false);
      setMessage({
        type: 'error',
        content: 'Invalid or missing reset code. Please request a new password reset link.'
      });
      return;
    }
    
    try {
      console.log("Verifying reset code:", oobCode);
      // Call Firebase to verify the code and get the associated email
      const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
      console.log("Code verified successfully for email:", emailFromCode);
      setEmail(emailFromCode);
      setIsValid(true);
      setIsVerifying(false);
    } catch (error) {
      console.error("Error verifying reset code:", error);
      setIsValid(false);
      setIsVerifying(false);
      
      // Handle specific errors
      if (error.code === 'auth/expired-action-code') {
        setMessage({
          type: 'error',
          content: 'This reset link has expired. Please request a new password reset link.'
        });
      } else {
        setMessage({
          type: 'error',
          content: 'Invalid reset link. Please request a new password reset link.'
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {
      newPassword: "",
      confirmPassword: "",
      general: ""
    };
    
    // Use the same validation logic as your signup form
    const strength = checkPasswordStrength(newPassword);
    
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (!strength.meetsMinimumRequirements) {
      newErrors.newPassword = "Password must meet all requirements";
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
    
    // Clear errors when typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid || isSubmitting) return;
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Attempting to reset password with code:", oobCode);
      
      // Call Firebase to complete the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      console.log("Password reset successful for email:", email);
      
      // Clear the form fields
      setNewPassword("");
      setConfirmPassword("");
      
      // Show success message and start redirection countdown
      setResetSuccessful(true);
      
    } catch (error) {
      console.error("Error resetting password:", error);
      
      // Handle specific errors
      if (error.code === 'auth/weak-password') {
        setErrors({
          ...errors,
          newPassword: "Password is too weak. Please choose a stronger password."
        });
      } else {
        setErrors({
          ...errors,
          general: "Failed to reset password. Please try again or request a new reset link."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while verifying the code
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6f2d74]"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f2f3fe" }} className="min-h-screen flex flex-col md:bg-white">
      <ResponsiveBanner 
        logo={darkLogo}
        heading="Reset Your Password"
        subText="Create a new secure password for your account."
        showSteps={false}
        showStar={true}
        showProgressBar={false}
        useGradient={true}
        textAlignment="center"
      />
      
      <div className="flex-1 flex justify-center items-start px-4 sm:px-8 md:px-12 pb-16 sm:pb-12 pt-12 sm:pt-8">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            {/* Show messages */}
            {message && !resetSuccessful && (
              <div className={`p-4 mb-6 rounded-md ${
                message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 
                message.type === 'success' ? 'bg-gray-50 border border-gray-200 text-gray-700' : 
                'bg-gray-50 border border-gray-200 text-gray-700'
              }`}>
                {message.content}
              </div>
            )}
            
            {resetSuccessful ? (
              // Success state with countdown
              <div className="text-center py-8">
                <div className="inline-block bg-gray-100 rounded-full p-3 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your password for <span className="font-medium">{email}</span> has been successfully reset.
                </p>
                <div className="mt-4 bg-gray-50 rounded-md p-4 text-center">
                  <p className="text-gray-600">
                    Redirecting to login page in <span className="font-bold text-purple-600">{redirectCountdown}</span> seconds<span className="dots">
                      <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="mt-6 py-3 px-6 rounded-full font-semibold text-base hover:opacity-90"
                >
                  Go to Login Now
                </button>
              </div>
            ) : isValid ? (
              // Password reset form
              <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Password</h2>
                
                {/* Show email being reset */}
                <div className="mb-6">
                  <p className="text-gray-600">
                    Resetting password for: <span className="font-medium">{email}</span>
                  </p>
                </div>
                
                {/* General error */}
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
                    {errors.general}
                  </div>
                )}
                
                {/* New password field using your custom PasswordField component */}
                <PasswordField
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  isSubmitting={isSubmitting}
                  error={errors.newPassword}
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  placeholder="Create a strong password"
                  className="mb-6"
                  inputClassName="w-full px-4 py-3 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base pr-12"
                  labelClassName="block text-gray-800 text-base font-medium mb-2"
                />
                
                {/* Confirm password field */}
                <div className="mb-8">
                  <label htmlFor="confirmPassword" className="block text-gray-800 text-base font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your new password" 
                      className={`w-full px-4 py-3 bg-white border ${
                        errors.confirmPassword ? 'border-red-500' : 
                        confirmPassword && confirmPassword === newPassword ? 'border-green-500' : 
                        'border-purple-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 text-base`}
                      disabled={isSubmitting}
                    />
                    {confirmPassword && confirmPassword === newPassword && !errors.confirmPassword && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  {confirmPassword && confirmPassword !== newPassword && !errors.confirmPassword && (
                    <p className="text-gray-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                
                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="w-full py-3 px-6 rounded-full font-semibold text-base flex items-center justify-center hover:opacity-90 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            ) : (
              // Invalid reset link message
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Password</h2>
                <p className="text-gray-600 mb-6">
                  Please request a new password reset link from the{" "}
                  <a 
                    href="/login" 
                    className="text-purple-700 hover:underline font-medium"
                  >
                    login page
                  </a>.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="mt-4 py-3 px-6 rounded-full font-semibold text-base hover:opacity-90"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add CSS for animated dots
const style = document.createElement('style');
style.textContent = `
  .dots .dot {
    animation: loading 1.4s infinite;
    display: inline-block;
    opacity: 0;
  }
  .dots .dot:nth-child(1) {
    animation-delay: 0s;
  }
  .dots .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .dots .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes loading {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(style);

export default ResetPasswordPage;