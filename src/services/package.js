// File: services/package.js
import { auth } from './firebase';

/**
 * Save package selection information to the backend
 * @param {object} packageData Package selection data including type and preferences
 * @returns {Promise<object>} Result of save operation
 */
export const savePackageInfo = async (packageData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to save package information");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Saving package info to API:", packageData);
    
    // Call the VM endpoint with a timeout
    const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/signup/package`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packageData)
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check for success in the response
    if (!result.success) {
      throw new Error(result.error || 'Failed to save package information');
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving package info via API:", error);
    throw error;
  }
};

/**
 * Get saved package information from the backend
 * @returns {Promise<object>} Package info if it exists
 */
export const getPackageInfo = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to get package information");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Fetching package info from API");
    
    // Call the VM endpoint with a timeout
    const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/signup/package`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Apply timeout
    const response = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      )
    ]);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Check for success in the response
    if (!result.success) {
      throw new Error(result.error || 'Failed to retrieve package information');
    }
    
    return {
      success: true,
      packageInfo: result.packageInfo || null
    };
  } catch (error) {
    console.error("Error getting package info from API:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export default {
  savePackageInfo,
  getPackageInfo
};