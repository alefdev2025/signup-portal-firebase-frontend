import React from 'react';
import { CheckCircle, FileText, Mail } from 'lucide-react';

const ProcedureSuccessView = ({
  wider,
  submittedPoaStatus,
  handleDownloadSubmission,
  handleViewMemberFiles,
  alcorStar,
  userEmail  // NEW: Accept user email prop
}) => {
  // Use the same navigation for both POA upload and view documents
  const handleNavigateToDocuments = () => {
    window.location.hash = 'membership-memberfiles';
  };

  return (
    <>
      {/* Mobile Success View */}
      <div className="sm:hidden">
        <div className="bg-white shadow-sm rounded-b-xl overflow-hidden slide-in mx-4" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          {/* Success Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-base sm:text-lg 2xl:text-xl font-medium text-white flex items-center drop-shadow-md">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm mr-2 sm:mr-3" />
              Success!
              <img src={alcorStar} alt="" className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            </h2>
          </div>

          {/* Success Content */}
          <div className="px-8 py-10 text-center">
            <div className="mb-6">
              <div className="w-12 h-12 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900 mb-3">Successfully Submitted!</h3>
              <p className="text-gray-700 text-xs sm:text-sm 2xl:text-base leading-relaxed font-normal mb-2">
                Your procedure information has been sent to Alcor's team.
              </p>
              
              {/* Email Confirmation - NEW */}
              {userEmail && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-200">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <Mail className="w-4 h-4" />
                    <p className="text-xs sm:text-sm">
                      A copy has been emailed to <span className="font-semibold">{userEmail}</span>
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-gray-600 text-[11px] sm:text-xs 2xl:text-sm">
                We'll review the details and prepare for your upcoming procedure.
              </p>
            </div>
            
            {/* POA Upload Reminder */}
            {submittedPoaStatus === 'no' && (
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Action Required: Upload POA</p>
                    <p className="text-xs text-gray-700 mb-2">
                      Please upload your Power of Attorney for healthcare as soon as possible.
                    </p>
                    <button
                      onClick={handleNavigateToDocuments}  // FIXED: Use consistent navigation
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                    >
                      <span>Upload to Documents</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleDownloadSubmission}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Download PDF Copy</span>
              </button>
              
              <button
                onClick={handleViewMemberFiles}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#2a1b3d] to-[#6e4376] hover:from-[#3a2b4d] hover:to-[#7e5386] rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <FileText className="w-4 h-4" strokeWidth="1.5" />
                <span>View Your Documents</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Success View */}
      <div className="hidden sm:block">
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] slide-in" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className={`${wider ? 'p-10' : 'p-8 2xl:p-10'} text-center`}>
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl 2xl:text-2xl font-semibold text-gray-900 mb-3">Successfully Submitted!</h3>
              <p className="text-gray-700 text-sm 2xl:text-base leading-relaxed font-normal mb-2">
                Your procedure information has been sent to Alcor's team.
              </p>
              
              {/* Email Confirmation - NEW */}
              {userEmail && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <Mail className="w-5 h-5" />
                    <p className="text-sm 2xl:text-base">
                      A copy of your submission has been emailed to <span className="font-semibold">{userEmail}</span>
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-gray-600 text-xs 2xl:text-sm mb-8">
                We'll review the details and prepare for your upcoming procedure.
              </p>
              
              {/* POA Upload Reminder */}
              {submittedPoaStatus === 'no' && (
                <div className="bg-gray-50 rounded-xl p-5 text-left mb-8 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900 mb-1">Action Required: Upload POA</p>
                      <p className="text-sm text-gray-700 mb-3">
                        Please upload your Power of Attorney for healthcare as soon as possible.
                      </p>
                      <button
                        onClick={handleNavigateToDocuments}  // FIXED: Use consistent navigation
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        <span>Upload to Documents</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownloadSubmission}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-gray-600 border border-gray-300 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Download PDF Copy</span>
                </button>
                
                <button
                  onClick={handleViewMemberFiles}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#2a1b3d] to-[#6e4376] hover:from-[#3a2b4d] hover:to-[#7e5386] rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" strokeWidth="1.5" />
                  <span>View Your Documents</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProcedureSuccessView;