// App.jsx - With Unprotected Staff Routes
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from "./contexts/UserContext";
import { SignupFlowProvider } from "./contexts/SignupFlowContext";
import { MemberPortalProvider } from "./contexts/MemberPortalProvider";

// Import the new ProtectedRoute component
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

// Import pages and components
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPassword";
import SinglePageSignup from "./pages/SinglePageSignup";
import StandalonePaymentPage from './pages/PaymentPageBackup';
import WelcomeMember from './pages/WelcomeMember';
import DemoPasswordPage from './pages/DemoPasswordPage';
import PortalHome from './pages/PortalHome';
import StaffPage from './pages/StaffPage';
import StaffPasswordReset from './pages/StaffPasswordReset';
import PortalSetupPage from './pages/PortalSetupPage';
import PortalLoginPage from './pages/PortalLoginPage';

// Import demo service
import { checkDemoAuth } from './services/demo';

// Debug wrapper to track component mounting
const DebugWrapper = ({ name, children }) => {
  React.useEffect(() => {
    //console.log(`[DEBUG] ${name} mounted`);
    return () => console.log(`[DEBUG] ${name} unmounted`);
  }, [name]);
  
  return children;
};

// Protected route wrapper for member portal - now includes authentication check
const MemberPortalRoute = ({ children }) => {
  return (
    <DebugWrapper name="MemberPortalRoute">
      <ProtectedRoute requirePortalAccess={true}>
        <MemberPortalProvider>
          {children}
        </MemberPortalProvider>
      </ProtectedRoute>
    </DebugWrapper>
  );
};

function App() {
  // Track renders with a ref
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  
  // Add instance ID to track if component is remounting
  const instanceId = React.useRef(Math.random().toString(36).substr(2, 9));
  
  //console.log(`[APP] Render #${renderCount.current} - Instance: ${instanceId.current}`);
  
  // Calculate these values once and memoize them
  const isProduction = React.useMemo(() => {
    const val = import.meta.env.MODE === 'production';
    //console.log(`[APP] isProduction calculated: ${val}`);
    return val;
  }, []);
  
  const isDemoMode = React.useMemo(() => {
    const val = import.meta.env.VITE_DEMO_MODE === 'true' || 
      window.location.hostname.includes('demo') ||
      window.location.hostname.includes('staging') ||
      window.location.hostname.includes('client') ||
      window.location.hostname.includes('preview');
    //console.log(`[APP] isDemoMode calculated: ${val}`);
    return val;
  }, []);
  
  const shouldProtect = React.useMemo(() => {
    const val = isDemoMode || !isProduction;
    //console.log(`[APP] shouldProtect calculated: ${val}`);
    return val;
  }, [isDemoMode, isProduction]);
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    //console.log('[APP] Initial isAuthenticated state: false');
    return false;
  });
  
  const [checkingAuth, setCheckingAuth] = useState(() => {
    //console.log('[APP] Initial checkingAuth state: true');
    return true;
  });

  // Check if user is already authenticated on app load
  useEffect(() => {
    //console.log(`[APP] Auth check useEffect running - Instance: ${instanceId.current}`);
    
    const checkAuth = async () => {
      if (!shouldProtect) {
        //console.log('[APP] Not in demo mode, skipping auth check');
        setIsAuthenticated(true);
        setCheckingAuth(false);
        return;
      }

      //console.log('[APP] Checking demo authentication...');
      
      try {
        const result = await checkDemoAuth();
        
        if (result.success && result.authenticated) {
          //console.log('[APP] ✅ Demo session is valid');
          setIsAuthenticated(true);
        } else {
          //console.log('[APP] ❌ No valid demo session found');
          setIsAuthenticated(false);
        }
      } catch (err) {
        //console.log('[APP] Demo auth check failed:', err.message);
        setIsAuthenticated(false);
      } finally {
        //console.log('[APP] Setting checkingAuth to false');
        setCheckingAuth(false);
      }
    };

    checkAuth();
    
    return () => {
      //console.log(`[APP] Auth check useEffect cleanup - Instance: ${instanceId.current}`);
    };
  }, [shouldProtect, instanceId]);

  // Log state changes
  useEffect(() => {
    //console.log(`[APP] State changed - isAuthenticated: ${isAuthenticated}, checkingAuth: ${checkingAuth}`);
  }, [isAuthenticated, checkingAuth]);

  // Show loading state while checking authentication
  if (checkingAuth) {
    //console.log('[APP] Rendering loading state');
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2340] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show password page if protection is enabled and user is not authenticated
  if (shouldProtect && !isAuthenticated) {
    //console.log('[APP] Rendering demo password page');
     return (
     <DemoPasswordPage 
        onAuthenticated={async () => {
          //console.log('[APP] Demo authentication successful');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            const checkResult = await checkDemoAuth();
            if (checkResult.success && checkResult.authenticated) {
              //console.log('[APP] Auth verified, setting authenticated');
              setIsAuthenticated(true);
            } else {
              //console.error('[APP] Auth verification failed after login');
              setIsAuthenticated(true);
            }
          } catch (err) {
            //console.error('[APP] Error verifying auth:', err);
            setIsAuthenticated(true);
          }
        }} 
      />
    );
  }

  //console.log('[APP] Rendering main app routes');

  // Main app - only renders after authentication (or if protection is disabled)
  return (
    <DebugWrapper name="App-Main">
      <BrowserRouter>
        {/*<ScrollToTop /> */}
        <UserProvider>
          <Routes>
            {/* Public routes - no authentication required */}
            <Route path="/" element={<DebugWrapper name="WelcomePage"><WelcomePage /></DebugWrapper>} />
            <Route path="/login" element={<DebugWrapper name="LoginPage"><LoginPage /></DebugWrapper>} />
            <Route path="/portal-login" element={<DebugWrapper name="PortalLoginPage"><PortalLoginPage /></DebugWrapper>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/__/auth/action" element={<ResetPasswordPage />} />
            <Route path="/portal-setup" element={<PortalSetupPage />} />

            {/* Payment page - protected but doesn't require full portal access */}
            <Route path="/payment" element={
              <ProtectedRoute>
                <StandalonePaymentPage />
              </ProtectedRoute>
            } />

            
            {/* Staff Portal Routes - NOW UNPROTECTED */}
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/staff/reset-password" element={<StaffPasswordReset />} />
            <Route path="/staff/*" element={<StaffPage />} />
            
            {/* Member Portal Routes - FULLY PROTECTED with portal access check */}
            <Route path="/welcome-member" element={
              <MemberPortalRoute>
                <WelcomeMember />
              </MemberPortalRoute>
            } />
            
            <Route path="/portal-home" element={
              <MemberPortalRoute>
                <PortalHome />
              </MemberPortalRoute>
            } />

            {/* Special route for Google signup flow 
            <Route path="/signup/google-callback" element={
              <SignupFlowProvider>
                <GoogleSignupCallback />
              </SignupFlowProvider>
            } />*/}

            {/* Payment route within portal 
            <Route path="/portal-home/payments/pay/:invoiceId" element={
              <MemberPortalRoute>
                <PortalPaymentPageWrapper />
              </MemberPortalRoute>
            } /> */}
            
            {/* All other portal routes */}
            <Route path="/portal/*" element={
              <MemberPortalRoute>
                <PortalHome />
              </MemberPortalRoute>
            } />
            
            {/* Signup flow - protected but special handling */}
            <Route path="/signup/*" element={
              <SignupFlowProvider>
                <SinglePageSignup />
              </SignupFlowProvider>
            } />
            
            {/* 404 page */}
            <Route path="*" element={
              <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
                  <a href="/" className="text-blue-600 hover:underline">Go back to home</a>
                </div>
              </div>
            } />
          </Routes>
        </UserProvider>
      </BrowserRouter>
    </DebugWrapper>
  );
}

export default App;