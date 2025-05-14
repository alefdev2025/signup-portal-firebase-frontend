// src/services/contact.js
import { auth, db, functions } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

/**
 * Get contact information for the current user from the backend
 * @returns {Promise<Object>} Response with contact information
 */
export const getContactInfo = async () => {
    try {
      console.log("=== getContactInfo: Starting function ===");
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("getContactInfo: No authenticated user found");
        return { success: false, error: "User not authenticated" };
      }
      
      // Log detailed user information to help diagnose auth issues
      console.log("getContactInfo: User details:", {
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous,
        authProvider: currentUser.providerData.length > 0 ? 
            currentUser.providerData[0].providerId : 'none',
        emailVerified: currentUser.emailVerified,
        tokenExpiration: currentUser.stsTokenManager?.expirationTime ?
            new Date(currentUser.stsTokenManager.expirationTime).toISOString() : 'unknown'
      });
      
      // Check if token is about to expire
      const tokenExpirationMs = currentUser.stsTokenManager?.expirationTime - Date.now();
      if (tokenExpirationMs < 300000 && tokenExpirationMs > 0) { // less than 5 minutes
        console.warn(`getContactInfo: Auth token expires soon (in ${Math.floor(tokenExpirationMs/1000)} seconds)`);
      } else if (tokenExpirationMs <= 0) {
        console.warn("getContactInfo: Auth token may have expired");
      } else {
        console.log(`getContactInfo: Token valid for ${Math.floor(tokenExpirationMs/60000)} minutes`);
      }
      
      console.log("getContactInfo: Getting contact info via Cloud Function");
      
      // Track the start time for performance monitoring
      const startTime = Date.now();
      
      // Call the Cloud Function with explicit userId
      const getContactInfoFn = httpsCallable(functions, 'getContactInfo');
      
      // Add the userId explicitly to resolve the issue
      const result = await getContactInfoFn({ userId: currentUser.uid });
      
      // Log timing information
      console.log(`getContactInfo: Cloud Function call completed in ${Date.now() - startTime}ms`);
      
      // Log the structure of the response
      console.log("getContactInfo: Response structure:", {
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        success: result.data?.success,
        hasContactInfo: result.data?.contactInfo ? 'yes' : 'no',
        contactInfoFields: result.data?.contactInfo ? Object.keys(result.data.contactInfo) : []
      });
      
      if (result.data.success) {
        console.log("getContactInfo: Successfully retrieved contact info");
        return result.data;
      } else {
        console.error("getContactInfo: Failed to get contact info:", result.data.error);
        return {
          success: false,
          error: result.data.error || "Unable to retrieve contact information"
        };
      }
    } catch (error) {
      console.error("getContactInfo: Error in function:", error);
      console.error("getContactInfo: Error stack:", error.stack);
      console.error("getContactInfo: Error code:", error.code);
      console.error("getContactInfo: Error details:", error.details || 'none');
      
      return { 
        success: false, 
        error: error.message || "Unknown error retrieving contact information" 
      };
    } finally {
      console.log("=== getContactInfo: Function completed ===");
    }
  };

/**
 * Save contact information for the current user to the backend
 * @param {Object} contactData - Contact information to save
 * @returns {Promise<boolean>} Success indicator
 */
export const saveContactInfo = async (contactData) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.error("No authenticated user found when trying to save contact info");
        throw new Error("User must be authenticated to save contact info");
      }
      
      console.log("Preparing to save contact info", { 
        userId: currentUser.uid,
        fieldCount: Object.keys(contactData).length 
      });
      
      // First, try the Cloud Function approach
      try {
        console.log("Attempting to use Cloud Function for encrypted storage");
        
        // Make sure the functions object is properly initialized
        if (!functions) {
          console.error("Firebase functions not initialized");
          throw new Error("Firebase functions not available");
        }
        
        const saveContactInfoFn = httpsCallable(functions, 'saveContactInfo');
        
        console.log("Cloud Function obtained, sending data...");
        const result = await saveContactInfoFn(contactData);
        
        console.log("Cloud Function response received:", result);
        
        if (result?.data?.success) {
          console.log("Contact info saved successfully via Cloud Function");
          return true;
        } else {
          console.warn("Cloud Function returned error:", result?.data?.error || "Unknown error");
          throw new Error(result?.data?.error || "Failed to save contact information via Cloud Function");
        }
      } catch (fnError) {
        console.error("Error with Cloud Function, falling back to direct Firestore:", fnError);
        
        // Fallback to the original direct Firestore method
        try {
          console.log("Saving directly to Firestore as fallback");
          const userRef = doc(db, "users", currentUser.uid);
          
          // Check if user document exists
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // Update existing document
            await updateDoc(userRef, {
              contactInfo: {
                ...contactData,
                updatedAt: new Date()
              },
              signupProgress: 1,
              signupStep: "contact_info",
              lastUpdated: new Date()
            });
          } else {
            // Create new document
            await setDoc(userRef, {
              email: currentUser.email,
              name: currentUser.displayName || contactData.firstName + " " + contactData.lastName,
              contactInfo: {
                ...contactData,
                updatedAt: new Date()
              },
              signupProgress: 1,
              signupStep: "contact_info",
              createdAt: new Date(),
              lastUpdated: new Date()
            });
          }
          
          console.log("Contact info saved successfully via direct Firestore");
          return true;
        } catch (firestoreError) {
          console.error("Final fallback Firestore save failed:", firestoreError);
          throw new Error("Failed to save contact information: " + firestoreError.message);
        }
      }
    } catch (error) {
      console.error("Error in saveContactInfo:", error);
      throw error;
    }
  };