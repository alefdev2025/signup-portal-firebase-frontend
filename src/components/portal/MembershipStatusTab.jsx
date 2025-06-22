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

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen">
      {/* Member Information - Moved to top */}
      <div className="bg-white rounded-xl shadow-md p-8 animate-fadeInUp animation-delay-100 border border-gray-200 mb-10 relative">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Member Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1 font-light">Full Name</p>
            <p className="font-medium text-gray-800 text-lg">
              {personalInfo?.firstName} {personalInfo?.lastName}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1 font-light">Member ID</p>
            <p className="font-medium text-gray-800 text-lg">{personalInfo?.alcorId || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1 font-light">Record Type</p>
            <p className="font-medium text-gray-800 text-lg">{personalInfo?.recordType || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1 font-light">Status</p>
            <div className={`px-3 py-1 text-sm font-medium rounded-lg inline-block ${
              membershipStatus?.contractComplete 
                ? 'text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {getStatus()}
            </div>
          </div>
        </div>
      </div>

      {/* Section Separator */}
      <div className="h-1 my-12 w-1/5 rounded-full bg-gray-400 mx-auto"></div>

      {/* Main content area with new grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left content - 2/3 width */}
        <div className="lg:col-span-2 flex">
          {/* Member info box - moved to left side */}
          <div className="bg-white rounded-xl shadow-md p-8 animate-fadeInUp animation-delay-200 w-full border border-gray-200">
            <div className="h-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{getMembershipType()}</h2>
              <p className="text-gray-500 mb-6 text-sm font-light">
                Member since {formatDate(membershipStatus?.memberJoinDate)}
              </p>
              
              <div className="grid grid-cols-2 gap-6 flex-grow">
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-light">Status</p>
                  <p className="text-base font-medium text-gray-800">
                    {getStatus()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-light">Years of Membership</p>
                  <p className="text-2xl font-light text-gray-800">{yearsOfMembership}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2 font-light">Contract Date</p>
                  <p className="text-lg font-medium text-gray-800">{formatDate(membershipStatus?.contractDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2 font-light">Member ID</p>
                  <p className="text-lg font-medium text-gray-800">{personalInfo?.alcorId || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - 1/3 width */}
        <div className="lg:col-span-1 flex">
          {/* Cryopreservation Details - moved to right side */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-fadeIn animation-delay-100 w-full border border-gray-200">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cryopreservation Details</h3>
              <div className="space-y-3 flex-grow">
                <div className="py-2">
                  <p className="text-sm text-gray-500 mb-1 font-light">Preservation Method</p>
                  <p className="font-medium text-gray-800 text-base">
                    {cryoArrangements?.methodOfPreservation || 'N/A'}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-sm text-gray-500 mb-1 font-light">CMS Fee Waiver</p>
                  <p className="font-medium text-gray-800 text-base">
                    {cryoArrangements?.cmsWaiver || 'N/A'}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-sm text-gray-500 mb-1 font-light">Funding Status</p>
                  <p className="font-medium text-gray-800 text-base">
                    {cryoArrangements?.fundingStatus || 'N/A'}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-sm text-gray-500 mb-1 font-light">Public Disclosure</p>
                  <p className="font-medium text-gray-800 text-base">
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
        </div>
      </div>

      {/* Section Separator */}
      <div className="h-1 my-12 w-1/5 rounded-full bg-gray-400 mx-auto"></div>

      {/* Second row grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Membership Timeline - 2/3 width */}
        <div className="lg:col-span-2 flex">
          <div className="bg-white rounded-xl shadow-md p-8 animate-fadeInUp animation-delay-300 w-full border border-gray-200">
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Membership Timeline</h3>
              <div className="space-y-5 flex-grow">
                {membershipStatus?.contractComplete && (
                  <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                    <div className="p-2.5 rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg, #4e3a6f 0%, #5d4480 50%, #6c5578 100%)' }}>
                      <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 border-b border-dotted border-purple-100 pb-2">
                      <p className="font-medium text-gray-800 text-base">Contract Completed</p>
                      <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.contractDate)}</p>
                    </div>
                  </div>
                )}
                {membershipStatus?.agreementReceived && (
                  <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                    <div className="p-2.5 rounded-xl shadow-sm" style={{ background: 'linear-gradient(135deg, #5d4480 0%, #6c5578 50%, #7b5670 100%)' }}>
                      <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-base">Agreement Received</p>
                      <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.agreementReceived)}</p>
                    </div>
                  </div>
                )}
                {membershipStatus?.agreementSent && (
                  <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                    <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #6c5578 0%, #7b5670 50%, #8a5f64 100%)' }}>
                      <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-base">Agreement Sent</p>
                      <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.agreementSent)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                  <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #7b5670 0%, #8a5f64 50%, #996b66 100%)' }}>
                    <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-base">Joined Alcor</p>
                    <p className="text-sm text-gray-500 font-light">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Requirements - narrow, 1/3 width */}
        <div className="lg:col-span-1 flex">
          <div className="bg-white rounded-xl shadow-md p-6 animate-fadeInUp animation-delay-400 w-full border border-gray-200">
            <div className="h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Membership Requirements</h3>
              <div className="space-y-4 flex-grow">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white border-2" 
                    style={{ borderColor: membershipStatus?.hasESignature ? '#5d4480' : '#e5e7eb' }}>
                    {membershipStatus?.hasESignature ? (
                      <svg className="w-5 h-5" fill="none" stroke="#5d4480" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-800 text-sm font-normal">E-Signature Completed</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white border-2"
                    style={{ borderColor: membershipStatus?.hasAuthorizationConsent ? '#6c5578' : '#e5e7eb' }}>
                    {membershipStatus?.hasAuthorizationConsent ? (
                      <svg className="w-5 h-5" fill="none" stroke="#6c5578" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-800 text-sm font-normal">Authorization Consent</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white border-2"
                    style={{ borderColor: membershipStatus?.paidInitialDues ? '#7b5670' : '#e5e7eb' }}>
                    {membershipStatus?.paidInitialDues ? (
                      <svg className="w-5 h-5" fill="none" stroke="#7b5670" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-800 text-sm font-normal">Initial Dues Paid</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white border-2"
                    style={{ borderColor: membershipStatus?.hasProofOfFunding ? '#8a5f64' : '#e5e7eb' }}>
                    {membershipStatus?.hasProofOfFunding ? (
                      <svg className="w-5 h-5" fill="none" stroke="#8a5f64" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="#9ca3af" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-800 text-sm font-normal">Proof of Funding</span>
                </div>
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