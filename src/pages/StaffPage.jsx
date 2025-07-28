import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import StaffLoginPage from './StaffLoginPage';
import StaffDashboard from '../components/staff/StaffDashboard';

const StaffPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [needs2FA, setNeeds2FA] = useState(false);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user has staff access
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const hasStaffRole = idTokenResult.claims.roles?.includes('staff') || 
                              idTokenResult.claims.roles?.includes('admin');
          
          if (hasStaffRole) {
            // Check if 2FA is enabled and not yet verified
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // Check if user has 2FA enabled
              if (userData?.twoFactorEnabled === true && userData?.twoFactorSecret) {
                // Check if this session has completed 2FA
                const twoFAVerified = sessionStorage.getItem(`2fa_verified_${firebaseUser.uid}`);
                
                if (!twoFAVerified) {
                  console.log('User needs to complete 2FA verification');
                  setNeeds2FA(true);
                  setUser(null);
                  setAccessError(null);
                } else {
                  setUser(firebaseUser);
                  setNeeds2FA(false);
                  setAccessError(null);
                }
              } else {
                // No 2FA required or not enabled (this shouldn't happen for staff)
                console.error('Staff user without 2FA enabled - this should not be allowed');
                setUser(firebaseUser);
                setNeeds2FA(false);
                setAccessError(null);
              }
            } else {
              setAccessError('User profile not found. Please contact support.');
              setUser(null);
            }
          } else {
            // Don't immediately sign out - show error first
            setAccessError('Access denied. This account does not have staff permissions. Please contact an administrator.');
            setUser(null);
            
            // Sign out after a delay to allow user to see the error
            setTimeout(async () => {
              await auth.signOut();
            }, 5000);
          }
        } catch (error) {
          console.error('Error checking staff access:', error);
          setAccessError('Error verifying staff access. Please try again.');
          setUser(null);
        }
      } else {
        setUser(null);
        setAccessError(null);
        setNeeds2FA(false);
        // Clear any 2FA verification from session
        if (typeof sessionStorage !== 'undefined') {
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.startsWith('2fa_verified_')) {
              sessionStorage.removeItem(key);
            }
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthenticated = (authenticatedUser) => {
    // The login component already verified 2FA
    // Mark 2FA as verified for this session
    sessionStorage.setItem(`2fa_verified_${authenticatedUser.uid}`, 'true');
    setUser(authenticatedUser);
    setNeeds2FA(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated, needs 2FA, or has access errors
  if (!user || needs2FA) {
    return <StaffLoginPage 
      onAuthenticated={handleAuthenticated} 
      initialError={accessError}
    />;
  }

  // Show dashboard if authenticated and 2FA verified
  return <StaffDashboard />;
};

export default StaffPage;