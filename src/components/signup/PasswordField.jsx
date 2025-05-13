// File: components/signup/PasswordField.jsx
import React, { useState } from "react";

// Password strength checker function
export const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, isStrong: false, isMedium: false, isWeak: true, meetsMinimumRequirements: false };
  
  // Minimal client-side check
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Calculate a simple strength score (0-100)
  let score = 0;
  
  // Length contributes up to 25 points
  score += Math.min(25, Math.floor(password.length * 2.5));
  
  // Character variety
  score += hasUppercase ? 12.5 : 0;
  score += hasLowercase ? 12.5 : 0;
  score += hasNumbers ? 12.5 : 0;
  score += hasSpecialChar ? 12.5 : 0;
  
  return {
    score,
    isStrong: score >= 70,
    isMedium: score >= 40 && score < 70,
    isWeak: score < 40,
    meetsMinimumRequirements: password.length >= minLength && hasUppercase && hasLowercase && hasNumbers
  };
};

// Enhanced Password Input Component with Requirements Display and Toggle Visibility
const PasswordField = ({ 
  value, 
  onChange, 
  isSubmitting, 
  error,
  id = "password",
  name = "password",
  label = "Password",
  placeholder = "Create a secure password",
  className = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = ""
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = checkPasswordStrength(value || '');
  const showRequirements = value && value.length > 0;

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`${className}`}>
      <label htmlFor={id} className={labelClassName || "block text-gray-800 text-base sm:text-lg font-medium mb-2 sm:mb-4"}>
        {label}
      </label>
      
      {/* Password field with visibility toggle */}
      <div className="relative">
        <input 
          type={showPassword ? "text" : "password"} 
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder} 
          className={inputClassName || `w-full px-3 sm:px-4 py-3 sm:py-5 bg-white border ${strength.isStrong && !error ? 'border-green-500' : 'border-gray-300 sm:border-brand-purple/30'} rounded-md focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 text-gray-800 text-base sm:text-lg pr-12`}
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          tabIndex="-1" // Skip in tab order
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            // Eye-off icon (when password is visible)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            // Eye icon (when password is hidden)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Strong password indicator - outside the field */}
      {strength.isStrong && !error && (
        <div className="flex items-center mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600 text-xs sm:text-sm">Strong password</span>
        </div>
      )}
      
      {/* Only show strength indicator and requirements when user has started typing and password is not strong */}
      {showRequirements && !strength.isStrong && (
        <>
          {/* Password strength indicator */}
          <div className="mt-2 sm:mt-3 mb-1">
            <div className="flex items-center mb-1">
              <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    strength.isStrong ? 'bg-green-500' : 
                    strength.isMedium ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${strength.score}%` }}
                  role="progressbar"
                  aria-valuenow={strength.score}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <span className={`ml-2 text-xs sm:text-sm ${
                strength.isStrong ? 'text-green-600' : 
                strength.isMedium ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {strength.isStrong ? 'Strong' : 
                 strength.isMedium ? 'Medium' : 
                 'Weak'}
              </span>
            </div>
          </div>
          
          {/* Password requirements for non-strong passwords */}
          <div className="bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-200 mb-2 text-xs sm:text-sm">
            <p className="font-medium text-gray-700 mb-1 sm:mb-2">Password must have:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1">
              <li className={`flex items-center ${value && value.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && value.length >= 8 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                At least 8 characters
              </li>
              <li className={`flex items-center ${value && /[A-Z]/.test(value) ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && /[A-Z]/.test(value) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                Uppercase letter (A-Z)
              </li>
              <li className={`flex items-center ${value && /[a-z]/.test(value) ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && /[a-z]/.test(value) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                Lowercase letter (a-z)
              </li>
              <li className={`flex items-center ${value && /[0-9]/.test(value) ? 'text-green-600' : 'text-gray-500'}`}>
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {value && /[0-9]/.test(value) ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
                Number (0-9)
              </li>
            </ul>
          </div>
        </>
      )}
      
      {/* Error message if exists */}
      {error && <p className={errorClassName || "text-red-500 text-xs sm:text-sm mt-1 sm:mt-3"}>{error}</p>}
    </div>
  );
};

export default PasswordField;