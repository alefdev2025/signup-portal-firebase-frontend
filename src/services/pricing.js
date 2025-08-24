// File: services/pricing.js
import { auth } from './firebase';

import { API_BASE_URL } from '../config/api';

/**
 * Get membership cost information from the backend
 * @returns {Promise<object>} Membership cost details based on user age
 */
export const getMembershipCost = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      throw new Error("User must be authenticated to get membership cost");
    }
    
    // Get the Firebase ID token for authentication
    const token = await user.getIdToken();
    
    console.log("Fetching membership cost from API");
    
    // Call the VM endpoint with a timeout
    const fetchPromise = fetch(`${API_BASE_URL}/api/pricing/membership-cost`, {
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
      throw new Error(result.error || 'Failed to calculate membership cost');
    }
    
    return {
      success: true,
      membershipCost: result.membershipCost,
      monthlyDues: result.monthlyDues,
      annualDues: result.annualDues,
      duesMultiplier: result.duesMultiplier,
      currency: result.currency,
      calculatedAt: result.calculatedAt,
      age: result.age
    };
  } catch (error) {
    console.error("Error calculating membership cost via API:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export default {
  getMembershipCost
};