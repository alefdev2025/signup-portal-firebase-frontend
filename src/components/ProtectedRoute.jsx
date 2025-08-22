// components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const ProtectedRoute = ({ children, requirePortalAccess = false, requireSignupComplete = false }) => {
  const { currentUser, isLoading, signupState, salesforceCustomer } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingPortalAccess, setCheckingPortalAccess] = useState(false);
  const [isPortalUser, setIsPortalUser] = useState(null);
  
  /*console.log('[ProtectedRoute] INITIAL RENDER:', {
    path: location.pathname,
    requirePortalAccess,
    requireSignupComplete,
    hasCurrentUser: !!currentUser,
    signupCompleted: signupState?.signupCompleted,
    signupProgress: signupState?.signupProgress,
    signupStep: signupState?.signupStep
  });*/
  
  // Check if user is a portal user from Firestore
  useEffect(() => {
    const checkPortalUser = async () => {
      if (!currentUser || !requirePortalAccess) {
        //console.log('[ProtectedRoute] Skipping portal check - no user or not required');
        return;
      }
      
      //console.log('[ProtectedRoute] Checking portal access for user:', currentUser.uid);
      setCheckingPortalAccess(true);
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        
        /*console.log('[ProtectedRoute] Firestore user data:', {
          uid: currentUser.uid,
          isPortalUser: userData?.isPortalUser,
          userType: userData?.userType,
          paymentCompleted: userData?.paymentCompleted,
          portalSetupComplete: userData?.portalSetupComplete,
          signupCompleted: userData?.signupCompleted,
          twoFactorEnabled: userData?.twoFactorEnabled,
          membershipType: userData?.membershipType,
          alcorIdStatus: userData?.alcorIdStatus
        });*/
        
        setIsPortalUser(userData?.isPortalUser === true);
      } catch (error) {
        console.error('[ProtectedRoute] Error checking portal access:', error);
        setIsPortalUser(false);
      } finally {
        setCheckingPortalAccess(false);
      }
    };
    
    checkPortalUser();
  }, [currentUser, requirePortalAccess]);
  
  // Log access attempts for security monitoring
  useEffect(() => {
    /*console.log('[ProtectedRoute] Access attempt FULL LOG:', {
      path: location.pathname,
      hasUser: !!currentUser,
      userEmail: currentUser?.email,
      isLoading,
      checkingPortalAccess,
      requirePortalAccess,
      requireSignupComplete,
      hasSalesforceCustomer: !!salesforceCustomer,
      signupCompleted: signupState?.signupCompleted,
      signupProgress: signupState?.signupProgress,
      isPortalUser,
      isPortalUserNull: isPortalUser === null,
      isPortalUserTrue: isPortalUser === true,
      isPortalUserFalse: isPortalUser === false
    });*/
  }, [location.pathname, currentUser, isLoading, checkingPortalAccess, requirePortalAccess, requireSignupComplete, salesforceCustomer, signupState, isPortalUser]);
  
  // Show loading spinner while checking auth or portal access
  if (isLoading || (requirePortalAccess && checkingPortalAccess)) {
    //console.log('[ProtectedRoute] SHOWING LOADING SPINNER');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // CRITICAL: If no authenticated user, redirect to login
  if (!currentUser) {
    console.error('[ProtectedRoute] SECURITY: Unauthorized access attempt to', location.pathname);
    
    // Save the attempted location so we can redirect back after login
    const redirectUrl = location.pathname + location.search;
    sessionStorage.setItem('redirectAfterLogin', redirectUrl);
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  /*console.log('[ProtectedRoute] CHECKING ROUTE TYPE:', {
    requireSignupComplete,
    signupCompleted: signupState?.signupCompleted
  });*/
  
  // Check if this is a signup-related route that requires signup completion
  if (requireSignupComplete && !signupState?.signupCompleted) {
    console.warn('[ProtectedRoute] User has not completed signup (requireSignupComplete=true), redirecting to signup');
    return <Navigate to="/signup" replace />;
  }
  
  // Additional check for portal access
  if (requirePortalAccess) {
    //console.log('[ProtectedRoute] PORTAL ACCESS REQUIRED - Checking access...');
    //console.log('[ProtectedRoute] isPortalUser value:', isPortalUser);
    //console.log('[ProtectedRoute] isPortalUser type:', typeof isPortalUser);
    
    // PRIMARY CHECK: Use the isPortalUser field from Firestore
    if (isPortalUser === true) {
      //console.log('[ProtectedRoute] ✅ User has isPortalUser=true - ALLOWING PORTAL ACCESS');
      return children;
    }
    
    // If we're still checking, wait
    if (isPortalUser === null && checkingPortalAccess) {
      //console.log('[ProtectedRoute] Still checking portal access...');
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying portal access...</p>
          </div>
        </div>
      );
    }
    
    // If isPortalUser is false or still null after checking, check other indicators
    if (isPortalUser === false || isPortalUser === null) {
      //console.log('[ProtectedRoute] ❌ User has isPortalUser=false or null - checking other indicators...');
      
      // Check for other portal indicators as fallback
      const hasPortalIndicators = 
        signupState?.userType === 'member' ||
        signupState?.userType === 'applicant' ||
        signupState?.isPortalUser === true ||
        signupState?.portalSetupComplete === true ||
        signupState?.paymentCompleted === true ||
        (salesforceCustomer && salesforceCustomer.id);
      
      /*console.log('[ProtectedRoute] Other portal indicators:', {
        hasPortalIndicators,
        userType: signupState?.userType,
        isPortalUserFromState: signupState?.isPortalUser,
        portalSetupComplete: signupState?.portalSetupComplete,
        paymentCompleted: signupState?.paymentCompleted,
        hasSalesforceId: !!(salesforceCustomer && salesforceCustomer.id)
      });*/
      
      if (hasPortalIndicators) {
        //console.log('[ProtectedRoute] ✅ User has other portal indicators - ALLOWING ACCESS');
        return children;
      }
      
      // Check if they're in the middle of signup
      if (signupState && signupState.signupProgress >= 0 && signupState.signupProgress < 100) {
        //console.log('[ProtectedRoute] User appears to be in signup process - redirecting to signup');
        return <Navigate to="/signup" replace />;
      }
      
      //console.log('[ProtectedRoute] ❌ DENYING PORTAL ACCESS - No portal indicators found');
      
      // Otherwise show access denied
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Portal Access Required</h2>
            <p className="text-gray-600 mb-6">
              Your account doesn't have access to the member portal yet. 
              Please complete your application or contact support if you believe this is an error.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
              >
                Complete Application
              </button>
              <button
                onClick={() => {
                  import('../services/auth').then(({ logoutUser }) => {
                    logoutUser({ callBackend: true }).then(() => {
                      navigate('/login', { replace: true });
                    });
                  });
                }}
                className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback - check if they need to wait for data
    if (!salesforceCustomer) {
      //console.log('[ProtectedRoute] Waiting for Salesforce customer data...');
      
      // Give it a moment to load if we just authenticated
      const timeSinceLogin = Date.now() - (signupState?.lastLoginTime || 0);
      if (timeSinceLogin < 5000) {
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your account data...</p>
            </div>
          </div>
        );
      }
    }
  }
  
  // User is authenticated and has necessary access, render the protected content
  //console.log('[ProtectedRoute] ✅ ALLOWING ACCESS - All checks passed');
  return children;
};

export default ProtectedRoute;