// File: pages/SignupPage.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from "../contexts/UserContext";

// Import step components
import AccountCreationStep from "./signup/AccountCreationStep";
import AccountSuccessStep from "./signup/AccountSuccessStep";
import ContactInfoStep from "./signup/ContactInfoStep";
import PackageStep from "./signup/PackageStep";
import FundingStep from "./signup/FundingStep";
import MembershipStep from "./signup/MembershipStep";

// Import shared components
import ResponsiveBanner from "./ResponsiveBanner";

// Define step information
const steps = [
  { id: "account", label: "Account", path: "" },
  { id: "success", label: "Account", path: "/success" },
  { id: "contact", label: "Contact Info", path: "/contact" }, 
  { id: "package", label: "Package", path: "/package" },
  { id: "funding", label: "Funding", path: "/funding" },
  { id: "membership", label: "Membership", path: "/membership" }
];

export default function SignupPage() {
  const { currentUser, signupState } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Calculate active step based on current path
  const getActiveStep = () => {
    const currentPath = location.pathname;
    
    if (currentPath.includes("/signup/success")) return 1;
    if (currentPath.includes("/signup/contact")) return 2;
    if (currentPath.includes("/signup/package")) return 3;
    if (currentPath.includes("/signup/funding")) return 4;
    if (currentPath.includes("/signup/membership")) return 5;
    return 0; // Default to account creation
  };
  
  const activeStep = getActiveStep();
  
  // Function to get user's max allowed step
  const getMaxAllowedStep = () => {
    // If user is authenticated, use their progress from backend
    if (currentUser && signupState) {
      return Math.min(signupState.signupProgress + 1, steps.length - 1);
    }
    
    // For non-authenticated users, only allow first step
    return 0;
  };
  
  // Enforce step access restrictions
  useEffect(() => {
    const maxAllowedStep = getMaxAllowedStep();
    
    // If trying to access a step beyond allowed progress
    if (activeStep > maxAllowedStep) {
      // Navigate to highest allowed step
      navigate(`/signup${steps[maxAllowedStep].path}`, { replace: true });
    }
  }, [activeStep, currentUser, signupState, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Banner with progress bar */}
      <ResponsiveBanner 
        activeStep={Math.min(activeStep, 5)} // Account creation & success count as one step in the UI 
        steps={steps.filter((_, index) => index !== 1).map(step => step.label)} // Skip "success" in visual steps
        showSteps={true}
        showStar={true}
        showProgressBar={true}
        useGradient={true}
        textAlignment="center"
      />
      
      {/* Main content - Routes for each step */}
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <div className="w-full sm:max-w-[520px] md:max-w-[650px] lg:max-w-[800px] px-4 sm:px-6 md:px-8">
          <Routes>
            {/* Account Creation (Step 0) */}
            <Route path="" element={<AccountCreationStep />} />
            
            {/* Account Success (Step 1) */}
            <Route 
              path="/success" 
              element={
                currentUser ? <AccountSuccessStep /> : <Navigate to="/signup" replace />
              } 
            />
            
            {/* Contact Info (Step 2) */}
            <Route 
              path="/contact" 
              element={
                currentUser && getMaxAllowedStep() >= 2 ? 
                <ContactInfoStep /> : 
                <Navigate to={currentUser ? "/signup/success" : "/signup"} replace />
              } 
            />
            
            {/* Package Selection (Step 3) */}
            <Route 
              path="/package" 
              element={
                currentUser && getMaxAllowedStep() >= 3 ? 
                <PackageStep /> : 
                <Navigate to={currentUser ? "/signup/contact" : "/signup"} replace />
              } 
            />
            
            {/* Funding (Step 4) */}
            <Route 
              path="/funding" 
              element={
                currentUser && getMaxAllowedStep() >= 4 ? 
                <FundingStep /> : 
                <Navigate to={currentUser ? "/signup/package" : "/signup"} replace />
              } 
            />
            
            {/* Membership (Step 5) */}
            <Route 
              path="/membership" 
              element={
                currentUser && getMaxAllowedStep() >= 5 ? 
                <MembershipStep /> : 
                <Navigate to={currentUser ? "/signup/funding" : "/signup"} replace />
              } 
            />
            
            {/* Catch any other paths and redirect to first step */}
            <Route path="*" element={<Navigate to="/signup" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}