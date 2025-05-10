// src/utils/navigationUtils.js

// Constants
const NAVIGATION_HISTORY_KEY = 'alcor_navigation_history';
const MAX_HISTORY_LENGTH = 20; // Prevent history from growing too large

/**
 * Add a path to navigation history in localStorage
 * @param {string} path - Current path to add to history
 */
export const addToNavigationHistory = (path) => {
  try {
    // Get existing history
    const history = getNavigationHistory();
    
    // Don't add duplicate consecutive entries
    if (history.length > 0 && history[history.length - 1] === path) {
      return;
    }
    
    // Add new path to history, limiting the size
    const newHistory = [...history, path].slice(-MAX_HISTORY_LENGTH);
    
    // Save to localStorage
    localStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error saving navigation history:', error);
  }
};

/**
 * Get the navigation history array
 * @returns {string[]} Array of navigation paths
 */
export const getNavigationHistory = () => {
  try {
    const history = localStorage.getItem(NAVIGATION_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving navigation history:', error);
    return [];
  }
};

/**
 * Get the previous path from history
 * @param {string} currentPath - The current path to get previous from
 * @param {string} defaultPath - Default path to return if no previous path exists
 * @returns {string} The previous path or default
 */
export const getPreviousPath = (currentPath, defaultPath = '/') => {
  const history = getNavigationHistory();
  
  // Find current path in history
  const currentIndex = history.lastIndexOf(currentPath);
  
  // If found and not first item, return previous item
  if (currentIndex > 0) {
    return history[currentIndex - 1];
  }
  
  // Return default path if no previous path found
  return defaultPath;
};

/**
 * Clear navigation history
 */
export const clearNavigationHistory = () => {
  localStorage.removeItem(NAVIGATION_HISTORY_KEY);
};

/**
 * Parse step from URL query parameters
 * @param {string} search - The location.search string
 * @returns {number|null} The step number or null if not found/invalid
 */
export const parseStepFromURL = (search) => {
  try {
    const params = new URLSearchParams(search);
    const stepParam = params.get('step');
    
    if (stepParam !== null) {
      const step = parseInt(stepParam, 10);
      return !isNaN(step) ? step : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing step from URL:', error);
    return null;
  }
};

/**
 * Create URL with step parameter
 * @param {string} basePath - The base path
 * @param {number} step - The step number
 * @returns {string} URL with step parameter
 */
export const createStepURL = (basePath, step) => {
  return `${basePath}?step=${step}`;
};

/**
 * Handle step navigation based on authentication state
 * @param {object} navigate - React Router's navigate function
 * @param {number} requestedStep - Step user is trying to access
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @param {boolean} isVerified - Whether email is verified
 * @param {number} maxStep - Maximum allowed step based on progress
 */
export const handleStepNavigation = (
  navigate, 
  requestedStep,
  isAuthenticated,
  isVerified,
  maxStep
) => {
  // If not authenticated, can only access step 0
  if (!isAuthenticated && requestedStep > 0) {
    navigate('/signup?step=0', { replace: true });
    return;
  }
  
  // If not verified and trying to access beyond step 0, redirect to step 0
  if (!isVerified && requestedStep > 0) {
    navigate('/signup?step=0', { replace: true });
    return;
  }
  
  // If trying to access a step beyond progress, limit to max completed step
  if (requestedStep > maxStep) {
    navigate(`/signup?step=${maxStep}`, { replace: true });
    return;
  }
  
  // Otherwise, allow access to requested step
  navigate(`/signup?step=${requestedStep}`, { replace: true });
};