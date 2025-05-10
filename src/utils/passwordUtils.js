// utils/passwordUtils.js

/**
 * Checks the strength of a password and returns an object with various indicators.
 * 
 * @param {string} password - The password to check
 * @returns {Object} An object containing:
 *   - score: A numeric score from 0-100
 *   - isStrong: Boolean indicating if password is strong
 *   - isMedium: Boolean indicating if password is medium strength
 *   - isWeak: Boolean indicating if password is weak
 *   - meetsMinimumRequirements: Boolean indicating if password meets minimum requirements
 */
 export const checkPasswordStrength = (password) => {
    if (!password) return { 
      score: 0, 
      isStrong: false, 
      isMedium: false, 
      isWeak: true, 
      meetsMinimumRequirements: false 
    };
    
    // Minimal client-side check
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasNoSpaces = !/\s/.test(password);
    
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
      isStrong: score >= 70 && hasNoSpaces,
      isMedium: score >= 40 && score < 70 && hasNoSpaces,
      isWeak: score < 40 || !hasNoSpaces,
      meetsMinimumRequirements: password.length >= minLength && 
                                hasUppercase && 
                                hasLowercase && 
                                hasNumbers &&
                                hasNoSpaces
    };
  };
  
  /**
   * Validates if a password meets all requirements.
   * 
   * @param {string} password - The password to validate
   * @returns {boolean} Whether the password meets all requirements
   */
  export const isValidPassword = (password) => {
    // Check if password contains spaces
    if (/\s/.test(password)) {
      return false;
    }
    
    // Check other password requirements
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  };
  
  /**
   * Removes all spaces from a password string.
   * 
   * @param {string} password - The password string with possible spaces
   * @returns {string} The password with all spaces removed
   */
  export const removeSpacesFromPassword = (password) => {
    return password.replace(/\s/g, '');
  };
  
  /**
   * Gets a specific error message for password validation issues.
   * 
   * @param {string} password - The password to check
   * @returns {string} An error message describing the issue, or empty string if valid
   */
  export const getPasswordValidationError = (password) => {
    if (!password) {
      return "Password is required";
    }
    
    if (/\s/.test(password)) {
      return "Password cannot contain spaces. Please remove any spaces from your password.";
    }
    
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    
    if (!/[A-Z]/.test(password)) {
      return "Password must include at least one uppercase letter (A-Z).";
    }
    
    if (!/[a-z]/.test(password)) {
      return "Password must include at least one lowercase letter (a-z).";
    }
    
    if (!/[0-9]/.test(password)) {
      return "Password must include at least one number (0-9).";
    }
    
    return "";
  };