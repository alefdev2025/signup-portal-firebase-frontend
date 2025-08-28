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

  // In StaffPage.jsx useEffect:
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const hasStaffRole = idTokenResult.claims.roles?.includes('staff') || 
                              idTokenResult.claims.roles?.includes('admin');
          
          if (hasStaffRole) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              // Check for staff-specific 2FA
              const needsStaff2FA = userData.staffTwoFactorEnabled === true && 
                                  userData.staffTwoFactorSecret;
              
              // Check for session verification
              const twoFAVerified = sessionStorage.getItem(`staff_2fa_verified_${firebaseUser.uid}`);
              
              if (needsStaff2FA && !twoFAVerified) {
                console.log('Staff needs 2FA verification');
                setNeeds2FA(true);
                setUser(null);
              } else {
                setUser(firebaseUser);
                setNeeds2FA(false);
              }
            }
          } else {
            setAccessError('Access denied. This account does not have staff permissions.');
            setUser(null);
          }
        } catch (error) {
          console.error('Error checking staff access:', error);
          setAccessError('Error verifying staff access.');
          setUser(null);
        }
      } else {
        setUser(null);
        setAccessError(null);
        setNeeds2FA(false);
        // Clear session storage
        if (typeof sessionStorage !== 'undefined') {
          const keys = Object.keys(sessionStorage);
          keys.forEach(key => {
            if (key.startsWith('staff_2fa_verified_')) {
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