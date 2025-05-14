// File: App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignupPage from "./components/SignupPage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPassword";
import CompletionSummary from "./components/CompletionSummary";
import ProtectedRoute from './components/ProtectedRoute';
import SignupRouteGuard from './components/SignupRouteGuard';
import { UserProvider } from "./contexts/UserContext";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Signup flow with route guard and nested routes */}
          <Route path="/signup/*" element={
            <SignupRouteGuard>
              <SignupPage />
            </SignupRouteGuard>
          } />
          
          {/* Password reset routes */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/__/auth/action" element={<ResetPasswordPage />} />
          
          {/* Protected routes */}
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
                  <p className="text-gray-600 mb-6">Welcome to the Member Portal. This page is under construction.</p>
                  <button 
                    onClick={() => window.location.href = '/'}
                    style={{ backgroundColor: "#6f2d74", color: "white" }}
                    className="py-3 px-6 rounded-full font-semibold text-lg hover:opacity-90"
                  >
                    Go Back to Welcome
                  </button>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* 404 route */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
                <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  style={{ backgroundColor: "#6f2d74", color: "white" }}
                  className="py-3 px-6 rounded-full font-semibold text-lg hover:opacity-90"
                >
                  Go to Welcome Page
                </button>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;