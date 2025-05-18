// src/services/contact.js
import { auth, db, functions } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// In services/contact.js
export const getContactInfo = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("User must be authenticated to get contact info");
      }
      
      // Get the Firebase ID token for authentication
      const token = await user.getIdToken();
      
      console.log("Fetching contact info from API");
      
      // Call the VM endpoint with a timeout
      const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/contact`, {
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
        throw new Error(result.error || 'Failed to get contact information');
      }
      
      return {
        success: true,
        contactInfo: result.contactInfo
      };
    } catch (error) {
      console.error("Error fetching contact info:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // In services/contact.js
export const saveContactInfo = async (contactData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No authenticated user found");
        throw new Error("User must be authenticated to save contact info");
      }
      
      // Get the Firebase ID token for authentication
      const token = await user.getIdToken();
      
      console.log("Saving contact info to API");
      
      // Call the VM endpoint with a timeout
      const fetchPromise = fetch(`https://alcor-backend-dev-ik555kxdwq-uc.a.run.app/api/contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
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
        throw new Error(result.error || 'Failed to save contact information');
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error saving contact info:", error);
      throw error; // Re-throw to match original behavior
    }
  };