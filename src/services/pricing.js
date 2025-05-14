// src/services/membership.js
import { auth, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Get the calculated membership cost based on user's age
 * @returns {Promise<Object>} Calculated membership cost details
 */
export const getMembershipCost = async () => {
    try {
      console.log("=== getMembershipCost: Starting function ===");
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("getMembershipCost: No authenticated user found");
        return { success: false, error: "User not authenticated" };
      }
      
      console.log("getMembershipCost: Calling Cloud Function");
      
      // Track the start time for performance monitoring
      const startTime = Date.now();
      
      // Call the Cloud Function to calculate membership cost
      const getMembershipCostFn = httpsCallable(functions, 'getMembershipCost');
      
      // Add the userId explicitly to resolve any potential issues
      const result = await getMembershipCostFn({ userId: currentUser.uid });
      
      // Log timing information
      console.log(`getMembershipCost: Cloud Function call completed in ${Date.now() - startTime}ms`);
      
      if (result.data.success) {
        console.log("getMembershipCost: Successfully retrieved membership cost");
        return result.data;
      } else {
        console.error("getMembershipCost: Failed to get membership cost:", result.data.error);
        return {
          success: false,
          error: result.data.error || "Unable to calculate membership cost"
        };
      }
    } catch (error) {
      console.error("getMembershipCost: Error in function:", error);
      console.error("getMembershipCost: Error stack:", error.stack);
      
      return { 
        success: false, 
        error: error.message || "Unknown error calculating membership cost" 
      };
    } finally {
      console.log("=== getMembershipCost: Function completed ===");
    }
  };