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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading membership status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading membership information</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={loadMembershipData}
            className="mt-2 text-sm underline hover:no-underline"
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
          <p className="text-[#6b7280] text-lg">No membership data available</p>
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
      {/* Main content area with new grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left content - 2/3 width */}
        <div className="lg:col-span-2 flex">
          {/* Member info box - moved to left side */}
          <div className="bg-white rounded-xl shadow-lg p-8 animate-fadeInUp animation-delay-200 w-full">
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-medium text-[#2a2346] mb-2">{getMembershipType()}</h2>
              <p className="text-[#6b7280] mb-6 text-base">
                Member since {formatDate(membershipStatus?.memberJoinDate)}
              </p>
              
              <div className="grid grid-cols-2 gap-6 flex-grow">
                <div>
                  <p className="text-sm text-[#6b7280] mb-2">Status</p>
                  <p className="text-base font-semibold text-[#2a2346]">
                    {getStatus()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-[#6b7280] mb-2">Member ID</p>
                  <p className="text-lg font-semibold text-[#2a2346]">{personalInfo?.alcorId || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-[#6b7280] mb-2">Contract Date</p>
                  <p className="text-lg font-semibold text-[#2a2346]">{formatDate(membershipStatus?.contractDate)}</p>
                </div>

                <div className="text-center">
                  <p className="text-4xl font-medium text-[#2a2346] mb-1">{yearsOfMembership}</p>
                  <p className="text-[#6b7280] text-sm">Years of membership</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - 1/3 width */}
        <div className="lg:col-span-1 flex">
          {/* Cryopreservation Details - moved to right side */}
          <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn animation-delay-100 w-full">
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-medium text-[#2a2346] mb-4">Cryopreservation Details</h3>
              <div className="space-y-3 flex-grow">
                <div className="py-2">
                  <p className="text-sm text-[#6b7280] mb-1">Preservation Method</p>
                  <p className="font-semibold text-[#2a2346] text-base">
                    {cryoArrangements?.methodOfPreservation || 'N/A'}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-sm text-[#6b7280] mb-1">CMS Fee Waiver</p>
                  <p className="font-semibold text-[#2a2346] text-base">
                    {cryoArrangements?.cmsWaiver || 'N/A'}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-sm text-[#6b7280] mb-1">Funding Status</p>
                  <p className="font-semibold text-[#2a2346] text-base">
                    {cryoArrangements?.fundingStatus || 'N/A'}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-sm text-[#6b7280] mb-1">Public Disclosure</p>
                  <p className="font-semibold text-[#2a2346] text-base">
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

      {/* Second row grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Membership Timeline - 2/3 width */}
        <div className="lg:col-span-2 flex">
          <div className="bg-white rounded-xl shadow-lg p-8 animate-fadeInUp animation-delay-300 w-full">
            <div className="h-full flex flex-col">
              <h3 className="text-2xl font-medium text-[#2a2346] mb-6">Membership Timeline</h3>
              <div className="space-y-5 flex-grow">
                {membershipStatus?.contractComplete && (
                  <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                    <div className="bg-[#74384d] p-3 rounded-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2a2346] text-lg">Contract Completed</p>
                      <p className="text-base text-[#6b7280]">{formatDate(membershipStatus?.contractDate)}</p>
                    </div>
                  </div>
                )}
                {membershipStatus?.agreementReceived && (
                  <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                    <div className="bg-[#914451] p-3 rounded-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2a2346] text-lg">Agreement Received</p>
                      <p className="text-base text-[#6b7280]">{formatDate(membershipStatus?.agreementReceived)}</p>
                    </div>
                  </div>
                )}
                {membershipStatus?.agreementSent && (
                  <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                    <div className="bg-[#a25357] p-3 rounded-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2a2346] text-lg">Agreement Sent</p>
                      <p className="text-base text-[#6b7280]">{formatDate(membershipStatus?.agreementSent)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                  <div className="bg-[#cb8863] p-3 rounded-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#2a2346] text-lg">Joined Alcor</p>
                    <p className="text-base text-[#6b7280]">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Requirements - narrow, 1/3 width */}
        <div className="lg:col-span-1 flex">
          <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeInUp animation-delay-400 w-full">
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-medium text-[#2a2346] mb-6">Membership Requirements</h3>
              <div className="space-y-4 flex-grow">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${membershipStatus?.hasESignature ? 'bg-[#74384d]' : 'bg-gray-300'}`}>
                    {membershipStatus?.hasESignature ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[#2a2346] text-sm font-medium">E-Signature Completed</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${membershipStatus?.hasAuthorizationConsent ? 'bg-[#914451]' : 'bg-gray-300'}`}>
                    {membershipStatus?.hasAuthorizationConsent ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[#2a2346] text-sm font-medium">Authorization Consent</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${membershipStatus?.paidInitialDues ? 'bg-[#a25357]' : 'bg-gray-300'}`}>
                    {membershipStatus?.paidInitialDues ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[#2a2346] text-sm font-medium">Initial Dues Paid</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${membershipStatus?.hasProofOfFunding ? 'bg-[#b66e5d]' : 'bg-gray-300'}`}>
                    {membershipStatus?.hasProofOfFunding ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[#2a2346] text-sm font-medium">Proof of Funding</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Information - Updated with consistent styling */}
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fadeInUp animation-delay-500">
        <h3 className="text-2xl font-medium text-[#2a2346] mb-6">Member Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#6b7280] mb-1">Full Name</p>
            <p className="font-semibold text-[#2a2346] text-lg">
              {personalInfo?.firstName} {personalInfo?.lastName}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#6b7280] mb-1">Member ID</p>
            <p className="font-semibold text-[#2a2346] text-lg">{personalInfo?.alcorId || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#6b7280] mb-1">Record Type</p>
            <p className="font-semibold text-[#2a2346] text-lg">{personalInfo?.recordType || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-[#6b7280] mb-1">Status</p>
            <div className={`px-3 py-1 text-base font-medium rounded-lg inline-block ${
              membershipStatus?.contractComplete 
                ? 'bg-[#e5d4f1] text-black' 
                : 'bg-[#fef3e2] text-black'
            }`}>
              {getStatus()}
            </div>
          </div>
        </div>
      </div>

      {/* Help Section - Similar to other tabs */}
      <div className="mt-10 bg-gradient-to-r from-[#0a1629] to-[#384e7a] rounded-xl p-8 text-white animate-fadeIn animation-delay-600">
        <h3 className="text-xl font-medium mb-5">Need Help with Your Membership?</h3>
        <p className="text-white/90 mb-6 text-base">Our membership team is here to assist you with any questions about your status or requirements.</p>
        <div className="flex flex-wrap gap-5">
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg transition-colors duration-300 flex items-center gap-3 text-base">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Membership Team
          </button>
          <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg transition-colors duration-300 flex items-center gap-3 text-base">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Membership Guide
          </button>
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