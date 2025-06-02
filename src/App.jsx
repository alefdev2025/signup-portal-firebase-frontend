// App.jsx - Integrated with Demo Service
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from "./contexts/UserContext";
import { SignupFlowProvider } from "./contexts/SignupFlowContext";

// Import pages and components
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPassword";
import SinglePageSignup from "./pages/SinglePageSignup";
import StandalonePaymentPage from './pages/PaymentPage';
import WelcomeMember from './pages/WelcomeMember';
import DemoPasswordPage from './pages/DemoPasswordPage';

// Import demo service
import { checkDemoAuth } from './services/demo';

function App() {
  console.log('[APP] App component rendering');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Environment check - enable password protection for demo/staging
  const isProduction = import.meta.env.MODE === 'production';
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || 
                     window.location.hostname.includes('demo') ||
                     window.location.hostname.includes('staging') ||
                     window.location.hostname.includes('client') ||
                     window.location.hostname.includes('preview');
  
  const shouldProtect = isDemoMode || !isProduction;

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (!shouldProtect) {
        // If not in demo mode, skip auth check
        console.log('[APP] Not in demo mode, skipping auth check');
        setIsAuthenticated(true);
        setCheckingAuth(false);
        return;
      }

      console.log('[APP] Checking demo authentication...');
      
      try {
        const result = await checkDemoAuth();
        
        if (result.success && result.authenticated) {
          console.log('[APP] ✅ Demo session is valid');
          setIsAuthenticated(true);
        } else {
          console.log('[APP] ❌ No valid demo session found');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.log('[APP] Demo auth check failed:', err.message);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [shouldProtect]);

  // Show loading state while checking authentication
  if (checkingAuth) {
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
    return (
      <DemoPasswordPage 
        onAuthenticated={() => {
          console.log('[APP] Demo authentication successful');
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  // Main app - only renders after authentication (or if protection is disabled)
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          {/* Welcome page at root */}
          <Route path="/" element={<WelcomePage />} />
          
          {/* Login and auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/__/auth/action" element={<ResetPasswordPage />} />

          {/* Payment and member welcome pages */}
          <Route path="/payment" element={<StandalonePaymentPage />} />
          <Route path="/welcome-member" element={<WelcomeMember />} />
          
          {/* Isolated signup flow - all signup paths go to the same component */}
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
  );
}

export default App;