// File: components/signup/DebugInfo.jsx
import React from 'react';

const DebugInfo = ({ showLoginOption, verificationStep, currentUser, activeStep }) => {
  return (
    <div className="fixed top-0 left-0 bg-black/80 text-white p-2 text-xs max-w-xs z-50">
      <h3>DEBUG INFO</h3>
      <p>showLoginOption: {showLoginOption ? 'true' : 'false'}</p>
      <p>verificationStep: {verificationStep}</p>
      <p>isUserLoggedIn: {currentUser ? 'yes' : 'no'}</p>
      <p>activeStep: {activeStep}</p>
      <p>localStorage: {localStorage.getItem('alcor_verification_state') ? 'has verification state' : 'no verification state'}</p>
    </div>
  );
};

export default DebugInfo;