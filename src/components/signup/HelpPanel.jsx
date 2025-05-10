// File: components/signup/HelpPanel.jsx
import React from 'react';

const HelpPanel = ({ showHelpInfo, toggleHelpInfo }) => {
  return (
    <>
      {/* Help icon in the bottom right corner */}
      <div className="fixed bottom-8 md:bottom-10 right-8 md:right-10 z-40">
        <button 
          onClick={toggleHelpInfo}
          className="flex items-center justify-center rounded-full shadow-lg bg-[#9f5fa6] hover:bg-[#8a4191] text-white focus:outline-none transition-all duration-200 h-14 w-14 md:h-16 md:w-16"
          aria-label="Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Help information box */}
      {showHelpInfo && (
        <div className="fixed bottom-24 md:bottom-28 right-8 md:right-10 z-40 w-64 sm:w-80 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-[#9f5fa6] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-medium">Help & Information</h3>
            <button 
              onClick={toggleHelpInfo}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-5">
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-1">Account Creation</h4>
              <p className="text-gray-600 text-sm">Creating an account allows you to become a member as well as manage membership and contracts.</p>
            </div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-1">Email Verification</h4>
              <p className="text-gray-600 text-sm">We'll send a 6-digit code to your email to verify your identity and secure your account.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Need assistance?</h4>
              <p className="text-gray-600 text-sm">Contact our support team at <a href="mailto:support@alcor.com" className="text-brand-purple">support@alcor.com</a> or call (800) 555-1234.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpPanel;