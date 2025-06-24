import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { Loading, Alert } from './FormComponents';

const MembershipStatusTab = () => {
  const { salesforceContactId } = useMemberPortal();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (salesforceContactId) {
      loadMembershipData();
    }
  }, [salesforceContactId]);

  const loadMembershipData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getMemberProfile(salesforceContactId);
      if (result.success && result.data) {
        setProfileData(result.data.data || result.data);
      } else {
        setError('Failed to load membership information');
      }
    } catch (err) {
      console.error('Error loading membership data:', err);
      setError('Failed to load membership information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 font-light">Loading membership status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-medium">Error loading membership information</p>
          <p className="text-sm font-light">{error}</p>
          <button 
            onClick={loadMembershipData}
            className="mt-2 text-sm underline hover:no-underline font-light"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen">
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg font-light">No membership data available</p>
        </div>
      </div>
    );
  }

  const { personalInfo, cryoArrangements, membershipStatus } = profileData;

  // Calculate years of membership
  const memberSince = membershipStatus?.memberJoinDate ? new Date(membershipStatus.memberJoinDate) : null;
  const yearsOfMembership = memberSince ? Math.floor((new Date() - memberSince) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Determine membership type based on available data
  const getMembershipType = () => {
    if (cryoArrangements?.methodOfPreservation?.includes('Whole Body')) {
      return 'Whole Body Cryopreservation Member';
    } else if (cryoArrangements?.methodOfPreservation?.includes('Neuro')) {
      return 'Neurocryopreservation Member';
    }
    return 'Member';
  };

  // Get status color
  const getStatusColor = () => {
    if (!membershipStatus?.isActive) return 'text-red-600';
    if (membershipStatus?.contractComplete) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatus = () => {
    if (!membershipStatus?.isActive) return 'Inactive';
    if (membershipStatus?.contractComplete) return 'Active';
    return 'In Progress';
  };

  // Uniform light drop shadow for all boxes
  const boxShadow = 'shadow-md';

  return (
    <div className="bg-gray-50 -m-8 p-4 sm:p-4 lg:pl-2 pt-8 sm:pt-8 min-h-screen max-w-full mx-auto">
      {/* Member Information - Top Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-100 border border-gray-200 mb-8 max-w-full mx-auto" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
        <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center gap-3 flex-wrap">
          <div className="bg-[#0e0e2f] p-3 rounded-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1 font-light">Full Name</p>
            <p className="font-medium text-gray-800 text-lg">
              {personalInfo?.firstName} {personalInfo?.lastName}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1 font-light">Member ID</p>
            <p className="font-medium text-gray-800 text-lg">{personalInfo?.alcorId || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1 font-light">Record Type</p>
            <p className="font-medium text-gray-800 text-lg">{personalInfo?.recordType || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
            <p className="text-sm text-gray-500 mb-1 font-light">Years of Membership</p>
            <p className="font-medium text-gray-800 text-lg">{yearsOfMembership}</p>
          </div>
        </div>
      </div>

      {/* Main content area with grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 max-w-full">
        {/* Membership Details - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl animate-fadeInUp animation-delay-100 border border-gray-200 h-full p-6 sm:p-10" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="bg-[#2a1b3d] p-3 rounded-lg flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-800">{getMembershipType()}</h2>
                <p className="text-gray-400 text-sm font-light">
                  Member since {formatDate(membershipStatus?.memberJoinDate)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">Status</p>
                <div className={`px-3 py-1 text-sm font-medium rounded-lg inline-block ${
                  membershipStatus?.contractComplete 
                    ? 'bg-gray-100 text-black border border-gray-300' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {getStatus()}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">Contract Date</p>
                <p className="font-medium text-gray-800 text-lg">{formatDate(membershipStatus?.contractDate)}</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">Join Date</p>
                <p className="font-medium text-gray-800 text-lg">{formatDate(membershipStatus?.memberJoinDate)}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">Preservation Type</p>
                <p className="font-medium text-gray-800 text-lg">
                  {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
                    ? 'Whole Body' 
                    : cryoArrangements?.methodOfPreservation?.includes('Neuro')
                    ? 'Neuro'
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Timeline - 1/3 width (moved from bottom) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeIn animation-delay-100 border border-gray-200 h-full" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-lg font-medium text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-[#3f2541] p-3 rounded-lg flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Membership Timeline
            </h3>
            <div className="space-y-5">
              {membershipStatus?.contractComplete && (
                <div>
                  <p className="font-medium text-gray-800 text-base">Contract Completed</p>
                  <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.contractDate)}</p>
                </div>
              )}
              {membershipStatus?.agreementReceived && (
                <div>
                  <p className="font-medium text-gray-800 text-base">Agreement Received</p>
                  <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.agreementReceived)}</p>
                </div>
              )}
              {membershipStatus?.agreementSent && (
                <div>
                  <p className="font-medium text-gray-800 text-base">Agreement Sent</p>
                  <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.agreementSent)}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800 text-base">Joined Alcor</p>
                <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.memberJoinDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second row grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 max-w-full">
        {/* Funding & Privacy - 2/3 width (moved from top right) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl animate-fadeInUp animation-delay-300 border border-gray-200 h-full p-4 sm:p-8" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-[#5d4480] p-3 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              Funding & Privacy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">CMS Fee Waiver</p>
                <p className="font-medium text-gray-800 text-lg">
                  {cryoArrangements?.cmsWaiver || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">Funding Status</p>
                <p className="font-medium text-gray-800 text-lg">
                  {cryoArrangements?.fundingStatus || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 outline outline-1 outline-gray-200 shadow-sm">
                <p className="text-sm text-gray-500 mb-1 font-light">Public Disclosure</p>
                <p className="font-medium text-gray-800 text-lg">
                  {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
                    ? 'Confidential' 
                    : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
                    ? 'Public' 
                    : 'Limited'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Requirements - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 sm:p-6 animate-fadeInUp animation-delay-400 border border-gray-200 h-full" style={{ boxShadow: '0 0 4px 1px rgba(0, 0, 0, 0.1)' }}>
            <h3 className="text-lg font-medium text-gray-800 mb-8 flex items-center gap-3">
              <div className="bg-[#806a9c] p-3 rounded-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              Membership Requirements
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                  {membershipStatus?.hasESignature ? (
                    <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-800 text-base font-normal">E-Signature Completed</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                  {membershipStatus?.hasAuthorizationConsent ? (
                    <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-800 text-base font-normal">Authorization Consent</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                  {membershipStatus?.paidInitialDues ? (
                    <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-800 text-base font-normal">Initial Dues Paid</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                  {membershipStatus?.hasProofOfFunding ? (
                    <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <span className="text-gray-800 text-base font-normal">Proof of Funding</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </div>
  );
};

export default MembershipStatusTab;