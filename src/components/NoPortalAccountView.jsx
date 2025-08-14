// components/NoPortalAccountView.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NoPortalAccountView = ({ email, onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
        No Portal Account Found
      </h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Account Not Found
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>The Alcor portal is new! We couldn't find a portal account for:</p>
              <p className="font-semibold mt-1">{email}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Option 1: Create Portal Account */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I'm an Existing Alcor Member
              </h3>
              <p className="text-gray-600 mb-4">
                If you're already an Alcor member but don't have online portal access yet, you can create your portal account here.
              </p>
              <button
                type="button"
                onClick={() => navigate('/portal-setup')}
                style={{ backgroundColor: "#6f2d74" }}
                className="w-full sm:w-auto text-white py-3 px-6 rounded-full font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center sm:inline-flex"
              >
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Create Portal Account
              </button>
            </div>
          </div>
        </div>
        
        {/* Option 2: Become a Member */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-600 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I Want to Become an Alcor Member
              </h3>
              <p className="text-gray-600 mb-4">
                Join Alcor and take the first step toward securing your future. Create an account to begin your membership application.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('fresh_signup', 'true');
                  navigate('/signup');
                }}
                className="w-full sm:w-auto bg-white border-2 border-purple-600 text-purple-700 py-3 px-6 rounded-full font-medium text-base hover:bg-purple-50 transition-colors flex items-center justify-center sm:inline-flex"
              >
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Become an Alcor Member
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-3">Need Help?</h3>
        <div className="space-y-2 text-gray-600">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Phone: <a href="tel:4809051906" className="ml-1 text-purple-700 hover:underline">(480) 905-1906</a>
          </p>
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email: <a href="mailto:info@alcor.org" className="ml-1 text-purple-700 hover:underline">info@alcor.org</a>
          </p>
        </div>
      </div>
      
      {/* Back Option */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
        >
          Try different credentials
        </button>
      </div>
    </div>
  );
};

export default NoPortalAccountView;