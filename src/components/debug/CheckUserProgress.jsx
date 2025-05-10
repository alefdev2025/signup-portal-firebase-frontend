// Debug helper component - Add this to your project for testing
// File: components/debug/CheckUserProgress.jsx

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../services/auth';
import { doc, getDoc } from 'firebase/firestore';

const CheckUserProgress = () => {
  const [userProgress, setUserProgress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localStorageData, setLocalStorageData] = useState(null);
  
  const checkProgress = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if user is logged in
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError("No user is logged in");
        setLoading(false);
        return;
      }
      
      // First check localStorage
      try {
        const localData = localStorage.getItem('alcor_signup_state');
        if (localData) {
          const parsedLocalData = JSON.parse(localData);
          setLocalStorageData(parsedLocalData);
        } else {
          setLocalStorageData("No data found in localStorage");
        }
      } catch (localError) {
        console.error("Error checking localStorage:", localError);
        setLocalStorageData(`Error: ${localError.message}`);
      }
      
      // Then check Firestore
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserProgress({
            userId: currentUser.uid,
            email: currentUser.email,
            ...userDoc.data()
          });
        } else {
          setUserProgress("No user document found in Firestore");
        }
      } catch (firestoreError) {
        console.error("Error fetching from Firestore:", firestoreError);
        setError(`Firestore error: ${firestoreError.message}`);
      }
    } catch (error) {
      console.error("General error:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Check on mount
  useEffect(() => {
    checkProgress();
  }, []);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md m-6">
      <h2 className="text-xl font-bold mb-4">User Progress Debug Tool</h2>
      
      <div className="space-y-4">
        <div>
          <p className="font-medium">Current User:</p>
          <p className="text-gray-700">{auth.currentUser ? auth.currentUser.email : 'Not logged in'}</p>
        </div>
        
        <div>
          <p className="font-medium">Status:</p>
          <p className="text-gray-700">{loading ? 'Loading...' : 'Completed'}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="font-medium text-red-800">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div>
          <p className="font-medium">LocalStorage Data:</p>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
            {localStorageData ? JSON.stringify(localStorageData, null, 2) : 'None'}
          </pre>
        </div>
        
        <div>
          <p className="font-medium">Firestore User Document:</p>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
            {userProgress ? JSON.stringify(userProgress, null, 2) : 'None'}
          </pre>
        </div>
        
        <button
          onClick={checkProgress}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default CheckUserProgress;