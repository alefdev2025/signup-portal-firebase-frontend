// components/PasswordResetForm.jsx
import React, { useState } from 'react';
import { resetPassword } from "../services/auth"; // Ensure this import path matches your project structure

const PasswordResetForm = ({ onBack, initialEmail = "", onSuccess = null }) => {
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
    setError(""); // Clear error when typing
  };

  const validateForm = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!resetEmail.trim()) {
      setError("Email is required");
      return false;
    }
    
    if (!emailPattern.test(resetEmail)) {
      setError("Please enter a valid email address");
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
      console.log("Attempting to send reset password email for:", resetEmail);
      
      // Call the resetPassword function
      await resetPassword(resetEmail);
      
      // Always show success, even if email doesn't exist (for security)
      const successMsg = `If an account exists for ${resetEmail}, we've sent a password reset link. Please check your email.`;
      setSuccessMessage(successMsg);
      
      // If onSuccess callback provided, call it
      if (onSuccess) {
        onSuccess(successMsg);
      }
      
      // Clear the form
      setResetEmail("");
      // Optional: auto-hide the form after success
      setTimeout(() => {
        if (onBack) onBack();
      }, 3000);
      
    } catch (error) {
      console.error("Error in reset password:", error);
      
      // Generic error message that doesn't reveal if email exists
      setError("Unable to send reset email. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reset Your Password</h2>
      <p className="text-gray-600 mb-6">Enter your email address below and we'll send you a link to reset your password.</p>
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-4 mb-6">
          {successMessage}
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
          className="w-full px-5 py-4 bg-white border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-gray-800 text-lg"
          disabled={isSubmitting}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-full font-medium text-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-70"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
};

export default PasswordResetForm;