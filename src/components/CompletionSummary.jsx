import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { auth } from '../services/auth';

export default function CompletionSummary() {
  const { currentUser, signupState } = useUser();
  const navigate = useNavigate();
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/signup');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  // Navigate back to signup at the appropriate step
  const continueSetup = () => {
    const currentStep = signupState?.signupProgress || 0;
    navigate(`/signup?step=${currentStep}`);
  };
  
  // Navigate to a specific step (for completed steps)
  const navigateToStep = (stepIndex) => {
    navigate(`/signup?step=${stepIndex}`);
  };
  
  // Navigate to the external membership portal
  const goToMembershipPortal = () => {
    // Update this URL to your actual membership portal
    window.location.href = process.env.REACT_APP_MEMBERSHIP_PORTAL_URL || 'https://membership.alcor.com';
  };
  
  // Define the steps of the signup process
  const steps = ["Account", "Contact Info", "Method", "Funding", "Membership"];
  
  // Calculate completion percentage
  const completedSteps = signupState?.signupProgress || 0;
  const totalSteps = steps.length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  const isComplete = completionPercentage === 100;
  
  // Get form data for summary
  const getFormData = () => {
    try {
      const data = localStorage.getItem('alcor_form_data');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Error getting form data:", error);
      return {};
    }
  };
  
  const formData = getFormData();
  
  return (
    <div className="min-h-screen bg-gray-100 pt-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6 flex justify-between items-center">
            <h1 className="text-lg font-medium text-gray-900">Sign-up Summary</h1>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentUser?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Your Progress</h2>
            <div className="mt-2">
              <div className="relative pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-purple-600">
                      {completionPercentage}% Complete
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-purple-600">
                      {completedSteps}/{totalSteps} Steps
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${completionPercentage}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Step list - now with ability to navigate to completed steps */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Sign-up Steps</h3>
              <ul className="divide-y divide-gray-200">
                {steps.map((step, index) => (
                  <li 
                    key={index} 
                    className={`py-4 flex items-center justify-between ${index <= completedSteps ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => index <= completedSteps && navigateToStep(index)}
                  >
                    <div className="flex items-center">
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        index <= completedSteps ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index <= completedSteps ? (
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </span>
                      <span className="ml-3 text-sm font-medium text-gray-900">{step}</span>
                    </div>
                    <div className="flex items-center">
                      {index === completedSteps && !isComplete && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Current
                        </span>
                      )}
                      {index < completedSteps && (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                            Completed
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the parent li onClick from firing
                              navigateToStep(index);
                            }}
                            className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            Edit
                          </button>
                        </>
                      )}
                      {index > completedSteps && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Optional: Show step-specific data for quick overview */}
            {completedSteps > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Your Information</h3>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  {/* Contact Info summary if available */}
                  {formData.contact_info && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Contact Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {formData.contact_info.firstName && (
                          <div>
                            <span className="text-gray-500">Name:</span> {formData.contact_info.firstName} {formData.contact_info.lastName}
                          </div>
                        )}
                        {formData.contact_info.dateOfBirth && (
                          <div>
                            <span className="text-gray-500">Date of Birth:</span> {new Date(formData.contact_info.dateOfBirth).toLocaleDateString()}
                          </div>
                        )}
                        {formData.contact_info.streetAddress && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Address:</span> {formData.contact_info.streetAddress}, {formData.contact_info.city}, {formData.contact_info.region} {formData.contact_info.postalCode}
                          </div>
                        )}
                        {formData.contact_info.email && (
                          <div>
                            <span className="text-gray-500">Email:</span> {formData.contact_info.email}
                          </div>
                        )}
                        {formData.contact_info.phoneType && (
                          <div>
                            <span className="text-gray-500">Phone ({formData.contact_info.phoneType}):</span> {
                              formData.contact_info[`${formData.contact_info.phoneType.toLowerCase()}Phone`] || 'Not provided'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Add other form data sections here as needed */}
                  {/* For example, Method, Funding, etc. */}
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4">
              {!isComplete && (
                <button
                  onClick={continueSetup}
                  style={{
                    backgroundColor: "#6f2d74",
                    color: "white"
                  }}
                  className="w-full sm:w-auto mb-4 sm:mb-0 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm hover:opacity-90"
                >
                  Continue Setup
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={goToMembershipPortal}
                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                  isComplete 
                    ? 'bg-purple-600 text-white border-transparent hover:bg-purple-700' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Go to Membership Portal
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}