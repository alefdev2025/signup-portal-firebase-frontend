// App.jsx - Proper Routing with Isolated Signup Flow
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from "./contexts/UserContext";
import { SignupFlowProvider } from "./contexts/SignupFlowContext";

// Import pages
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPassword";
import SinglePageSignup from "./pages/SinglePageSignup";
import StandalonePaymentPage from './pages/PaymentPage';


// Other components you might have
// import CompletionSummary from "./components/CompletionSummary";
// import ProtectedRoute from './components/ProtectedRoute';

function App() {
  console.log('[APP] App component rendering');
  
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

          
          <Route path="/payment" element={<StandalonePaymentPage />} />
          
          {/* Isolated signup flow - all signup paths go to the same component */}
          <Route path="/signup/*" element={
            <SignupFlowProvider>
              <SinglePageSignup />
            </SignupFlowProvider>
          } />
          
          {/* Add other routes as needed */}
          {/* 
          <Route path="/summary" element={
            <ProtectedRoute>
              <CompletionSummary />
            </ProtectedRoute>
          } />
          
          <Route path="/member-portal" element={
            <ProtectedRoute>
              <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-4">Member Portal</h1>
                  <p className="text-gray-600 mb-6">Welcome! Signup completed successfully.</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
          */}
          
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