import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { Loading, Alert } from './FormComponents';
import alcorStar from '../../assets/images/alcor-star.png';
import dewarsImage from '../../assets/images/dewars-high-res3.png';

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
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
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
      <div className="bg-gray-50 min-h-screen p-4">
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
      <div className="bg-gray-50 min-h-screen p-4">
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
      return 'Whole Body Cryopreservation';
    } else if (cryoArrangements?.methodOfPreservation?.includes('Neuro')) {
      return 'Neurocryopreservation';
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

  // Animation styles
  const animationStyles = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
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
      animation: fadeIn 0.8s ease-in-out;
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
  `;

  return (
    <div className="bg-gray-50 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Hero Section with Member Overview - Constrained to content width */}
      <div className="-mt-4 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="relative h-48 rounded-2xl overflow-hidden animate-fadeIn"
            style={{ 
              animation: 'fadeIn 0.8s ease-in-out'
            }}
          >
            {/* Background image */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${dewarsImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            {/* Gradient overlay with yellow/orange rising from bottom right corner only */}
            <div 
              className="absolute inset-0"
              style={{ 
                background: 'linear-gradient(135deg, #0e0e2f 0%, #1b163a 15%, #2a1b3d 25%, #3f2541 35%, rgba(46, 65, 104, 0.7) 50%, rgba(56, 78, 122, 0.5) 65%, rgba(255, 140, 90, 0.4) 75%, rgba(255, 179, 102, 0.5) 85%, rgba(255, 204, 128, 0.4) 95%, rgba(255, 220, 150, 0.3) 100%)',
              }}
            />
            
            {/* Mesh gradient overlay with warm accent rising from bottom right corner */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at 90% 110%, rgba(255, 204, 128, 0.6) 0%, rgba(255, 179, 102, 0.4) 20%, rgba(255, 140, 90, 0.3) 35%, transparent 55%), radial-gradient(ellipse at 95% 105%, rgba(255, 179, 102, 0.4) 0%, transparent 45%)',
              }}
            />
            
            {/* Additional accent gradient rising from bottom right corner */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, transparent 60%, rgba(255, 140, 90, 0.15) 75%, rgba(255, 179, 102, 0.25) 85%, rgba(255, 204, 128, 0.35) 95%, rgba(255, 220, 150, 0.4) 100%)',
              }}
            />
            
            <div className="relative z-10 px-6 sm:px-8 py-4 h-full flex items-center">
              <div className="flex items-center gap-8 w-full">
                {/* Member info on the left - perfect middle ground */}
                <div className="flex-1">
                  <h1 className="text-[1.75rem] sm:text-[2.125rem] font-light text-white mb-3 drop-shadow-lg tracking-tight flex items-center gap-2">
                    <span>{personalInfo?.firstName} {personalInfo?.lastName}</span>
                    <img src={alcorStar} alt="Alcor Star" className="w-[34px] h-[34px] flex-shrink-0" />
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-white/90 text-base">
                    <span className="font-light">Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                    <span className="text-white/60">•</span>
                    <span className="font-light">{personalInfo?.recordType || 'N/A'}</span>
                    <span className="text-white/60">•</span>
                    <span className="font-light">Since {formatDate(membershipStatus?.memberJoinDate)}</span>
                  </div>
                </div>
                
                {/* Glassmorphic stats card on the right - compact version */}
                <div className="hidden lg:block bg-white/15 backdrop-blur-sm rounded-lg p-4 max-w-sm border border-white/20">
                  <h3 className="text-white text-sm font-medium mb-3 drop-shadow">MEMBERSHIP OVERVIEW</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide mb-0.5">Years</p>
                      <p className="text-xl font-bold text-white">{yearsOfMembership}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide mb-0.5">Type</p>
                      <p className="text-sm font-semibold text-white">{getMembershipType().split(' ')[0]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide mb-0.5">Funding</p>
                      <p className="text-sm font-semibold text-white">{cryoArrangements?.fundingStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70 uppercase tracking-wide mb-0.5">Complete</p>
                      <p className="text-sm font-semibold text-white">
                        {Object.values({
                          hasESignature: membershipStatus?.hasESignature,
                          hasAuthorizationConsent: membershipStatus?.hasAuthorizationConsent,
                          paidInitialDues: membershipStatus?.paidInitialDues,
                          hasProofOfFunding: membershipStatus?.hasProofOfFunding
                        }).filter(Boolean).length}/4
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Status badge - positioned absolutely for mobile */}
                <div className={`lg:hidden absolute top-4 right-4 px-3 py-1.5 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-sm shadow-md ${
                  membershipStatus?.contractComplete 
                    ? 'text-green-800' 
                    : 'text-yellow-800'
                }`}>
                  {getStatus()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content - Two Row Grid */}
        <div className="space-y-6">
          
          {/* First Row: Member Information (2/3) and Requirements (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Member Information Card - 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeInUp animation-delay-100 h-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Member Information
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Full Name</p>
                    <p className="text-xl font-medium text-gray-900">{personalInfo?.firstName} {personalInfo?.lastName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Member ID</p>
                    <p className="text-xl font-medium text-gray-900">{personalInfo?.alcorId || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Record Type</p>
                    <p className="text-xl font-medium text-gray-900">{personalInfo?.recordType || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Status</p>
                    <p className={`text-xl font-medium ${getStatusColor()}`}>{getStatus()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Contract Date</p>
                    <p className="text-xl font-medium text-gray-900">{formatDate(membershipStatus?.contractDate)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Member Since</p>
                    <p className="text-xl font-medium text-gray-900">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Checklist - 1/3 width */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeInUp animation-delay-400 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Membership Requirements
              </h2>
              
              <div className="space-y-4 flex-grow">
                {[
                  { label: 'E-Signature Completed', completed: membershipStatus?.hasESignature },
                  { label: 'Authorization Consent', completed: membershipStatus?.hasAuthorizationConsent },
                  { label: 'Initial Dues Paid', completed: membershipStatus?.paidInitialDues },
                  { label: 'Proof of Funding', completed: membershipStatus?.hasProofOfFunding }
                ].map((item, index) => (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    item.completed ? 'bg-purple-50' : 'bg-gray-50'
                  }`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.completed 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                        : 'bg-gray-200'
                    }`}>
                      {item.completed ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      item.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs font-medium">
                    {membershipStatus?.contractComplete 
                      ? 'All requirements completed' 
                      : `${Object.values({
                          hasESignature: membershipStatus?.hasESignature,
                          hasAuthorizationConsent: membershipStatus?.hasAuthorizationConsent,
                          paidInitialDues: membershipStatus?.paidInitialDues,
                          hasProofOfFunding: membershipStatus?.hasProofOfFunding
                        }).filter(Boolean).length}/4 requirements completed`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Cryopreservation Details (2/3) and Timeline (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Cryopreservation Details Card - 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeInUp animation-delay-200 h-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Cryopreservation Details
                </h2>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Preservation Method</p>
                    <p className="text-xl font-medium text-gray-900">{cryoArrangements?.methodOfPreservation || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">CMS Fee Waiver</p>
                    <p className="text-xl font-medium text-gray-900">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Funding Status</p>
                    <p className="text-xl font-medium text-gray-900">{cryoArrangements?.fundingStatus || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-gray-500 font-light">Public Disclosure</p>
                    <p className="text-xl font-medium text-gray-900">
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

            {/* Timeline Card - 1/3 width */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeInUp animation-delay-500 h-full">
              <h2 className="text-lg font-light text-[#2a2346] mb-6">Membership Timeline</h2>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gradient-to-b from-[#b8a2d4] to-[#483264]"></div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-[#b8a2d4] shadow-sm">
                      <svg className="w-5 h-5 text-[#9c86b8]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="text-sm font-medium text-[#2a2346]">Joined Alcor</h3>
                      <p className="text-sm text-[#4a3d6b] mt-0.5">{formatDate(membershipStatus?.memberJoinDate)}</p>
                    </div>
                  </div>

                  {membershipStatus?.agreementSent && (
                    <div className="flex gap-3">
                      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-[#806a9c] shadow-sm">
                        <svg className="w-5 h-5 text-[#644e80]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-sm font-medium text-[#2a2346]">Agreement Sent</h3>
                        <p className="text-sm text-[#4a3d6b] mt-0.5">{formatDate(membershipStatus?.agreementSent)}</p>
                      </div>
                    </div>
                  )}

                  {membershipStatus?.agreementReceived && (
                    <div className="flex gap-3">
                      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-white border-2 border-[#644e80] shadow-sm">
                        <svg className="w-5 h-5 text-[#483264]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-sm font-medium text-[#2a2346]">Agreement Received</h3>
                        <p className="text-sm text-[#4a3d6b] mt-0.5">{formatDate(membershipStatus?.agreementReceived)}</p>
                      </div>
                    </div>
                  )}

                  {membershipStatus?.contractComplete && (
                    <div className="flex gap-3">
                      <div 
                        className="relative z-10 flex items-center justify-center w-10 h-10 rounded-lg shadow-md"
                        style={{ background: 'linear-gradient(135deg, #4e3a6f 0%, #5d4480 50%, #6c5578 100%)' }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-sm font-medium text-[#2a2346]">Contract Completed</h3>
                        <p className="text-sm text-[#4a3d6b] mt-0.5">{formatDate(membershipStatus?.contractDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipStatusTab;