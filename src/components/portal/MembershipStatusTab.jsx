import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { User, Shield, Clock, CheckCircle } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';

const MembershipStatusTab = () => {
  const { salesforceContactId } = useMemberPortal();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .membership-status-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .membership-status-tab .font-bold,
      .membership-status-tab .font-semibold {
        font-weight: 500 !important;
      }
      .membership-status-tab .font-bold {
        font-weight: 700 !important;
      }
      .membership-status-tab h1 {
        font-weight: 300 !important;
      }
      .membership-status-tab h2,
      .membership-status-tab h3,
      .membership-status-tab h4 {
        font-weight: 400 !important;
      }
      .membership-status-tab .font-medium {
        font-weight: 400 !important;
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
      .membership-status-tab .animate-fadeInUp {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      .membership-status-tab .animate-fadeInUp-delay-1 {
        animation: fadeInUp 0.8s ease-out 0.1s both;
      }
      .membership-status-tab .animate-fadeInUp-delay-2 {
        animation: fadeInUp 0.8s ease-out 0.2s both;
      }
      .membership-status-tab .animate-fadeInUp-delay-3 {
        animation: fadeInUp 0.8s ease-out 0.3s both;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (salesforceContactId) {
      loadMembershipData();
    } else {
      setIsLoading(false);
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
        setError(result.error || 'Failed to load membership information');
      }
    } catch (err) {
      setError(err.message || 'Failed to load membership information');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="membership-status-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 relative mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            </div>
            <p className="text-gray-500 font-light">Loading membership data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="membership-status-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
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

  // Handle no data state
  if (!profileData) {
    return (
      <div className="membership-status-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
        <div className="bg-white rounded-2xl p-8 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-gray-500 text-lg font-light">No membership data available</p>
            <button 
              onClick={loadMembershipData}
              className="mt-4 text-sm text-purple-600 hover:text-purple-700 underline font-light"
            >
              Try loading again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Now we can safely destructure
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
    return 'Basic Membership';
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
    // Check if they have a cryo arrangement before showing "In Progress"
    if (cryoArrangements?.methodOfPreservation) return 'In Progress';
    return 'Active'; // Default to Active for non-cryo members with alcor number
  };

  // Get icon for sections
  const getIcon = (type) => {
    return (
      <div className="p-3 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
        {type === 'personal' && (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
        {type === 'cryo' && (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )}
        {type === 'requirements' && (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {type === 'timeline' && (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div className="membership-status-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Main Card - Desktop */}
      <div className="hidden sm:block">
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeInUp" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)', minHeight: '600px' }}>
          {/* Card Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
                  <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  Membership Status
                  <img src={alcorStar} alt="" className="w-6 h-6 ml-1" />
                </h2>
              </div>
              
              <span className={`px-4 py-2 rounded-lg ${
                membershipStatus?.contractComplete 
                  ? 'bg-green-100 text-green-800' 
                  : 'border border-purple-600 text-purple-700 bg-white'
              }`}>
                {getStatus()}
              </span>
            </div>

            {/* Member Info */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {personalInfo?.firstName} {personalInfo?.lastName}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-3">
                  <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                  <span>•</span>
                  <span>{getMembershipType()}</span>
                </p>
              </div>
              
              {/* Section Navigation Tabs */}
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setActiveSection('personal')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    activeSection === 'personal' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Personal Info
                </button>
                <button
                  onClick={() => setActiveSection('cryo')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    activeSection === 'cryo' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Membership
                </button>
                <button
                  onClick={() => setActiveSection('requirements')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    activeSection === 'requirements' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Requirements
                </button>
                <button
                  onClick={() => setActiveSection('timeline')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    activeSection === 'timeline' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Timeline
                </button>
              </div>
            </div>
          </div>

          {/* Content Section - Fixed height with scroll */}
          <div className="p-8" style={{ minHeight: '400px' }}>
            {/* Personal Information Section */}
            {activeSection === 'personal' && (
              <div className="animate-fadeInUp">
                <div className="flex items-start gap-4 mb-6">
                  {getIcon('personal')}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Your account details and membership information</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 lg:pl-16">
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Full Name</p>
                    <p className="text-base font-normal text-gray-900">
                      {personalInfo?.firstName} {personalInfo?.lastName}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Member ID</p>
                    <p className="text-base font-normal text-gray-900">{personalInfo?.alcorId || 'N/A'}</p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Years of Membership</p>
                    <p className="text-base font-normal text-gray-900">{yearsOfMembership}</p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Member Since</p>
                    <p className="text-base font-normal text-gray-900">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-3">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Contract Date</p>
                    <p className="text-base font-normal text-gray-900">{formatDate(membershipStatus?.contractDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cryopreservation Details */}
            {activeSection === 'cryo' && (
              <div className="animate-fadeInUp">
                <div className="flex items-start gap-4 mb-6">
                  {getIcon('cryo')}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cryoArrangements?.methodOfPreservation ? 'Cryopreservation Details' : 'Membership Details'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {cryoArrangements?.methodOfPreservation ? 'Your preservation arrangements and preferences' : 'Your membership information'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 lg:pl-16">
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Preservation Type</p>
                    <p className="text-base font-normal text-gray-900">
                      {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
                        ? 'Whole Body' 
                        : cryoArrangements?.methodOfPreservation?.includes('Neuro')
                        ? 'Neuro'
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                    <p className="text-xs text-gray-600 mb-1 font-medium">CMS Fee Waiver</p>
                    <p className="text-base font-normal text-gray-900">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Funding Status</p>
                    <p className="text-base font-normal text-gray-900">{cryoArrangements?.fundingStatus || 'N/A'}</p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Public Disclosure</p>
                    <p className="text-base font-normal text-gray-900">
                      {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
                        ? 'Confidential' 
                        : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
                        ? 'Public' 
                        : 'Limited'}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-3">
                    <p className="text-xs text-gray-600 mb-1 font-medium">Membership Type</p>
                    <p className="text-base font-normal text-gray-900">{getMembershipType()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Checklist */}
            {activeSection === 'requirements' && (
              <div className="animate-fadeInUp flex flex-col h-full" style={{ minHeight: '350px' }}>
                <div className="flex items-start gap-4 mb-6">
                  {getIcon('requirements')}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Membership Requirements</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Track your membership completion status</p>
                  </div>
                </div>
                
                <div className="pl-0 lg:pl-16 flex-1 flex items-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="p-5 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.hasESignature 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-300'
                        }`}>
                          {membershipStatus?.hasESignature ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-normal text-gray-900">E-Signature Completed</p>
                          <p className="text-xs text-gray-600 mt-1">{membershipStatus?.hasESignature ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.hasAuthorizationConsent 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-300'
                        }`}>
                          {membershipStatus?.hasAuthorizationConsent ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-normal text-gray-900">Authorization Consent</p>
                          <p className="text-xs text-gray-600 mt-1">{membershipStatus?.hasAuthorizationConsent ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.paidInitialDues 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-300'
                        }`}>
                          {membershipStatus?.paidInitialDues ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-normal text-gray-900">Initial Dues Paid</p>
                          <p className="text-xs text-gray-600 mt-1">{membershipStatus?.paidInitialDues ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.hasProofOfFunding 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-300'
                        }`}>
                          {membershipStatus?.hasProofOfFunding ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base font-normal text-gray-900">Proof of Funding</p>
                          <p className="text-xs text-gray-600 mt-1">{membershipStatus?.hasProofOfFunding ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {activeSection === 'timeline' && (
              <div className="animate-fadeInUp flex flex-col h-full" style={{ minHeight: '350px' }}>
                <div className="flex items-start gap-4 mb-6">
                  {getIcon('timeline')}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Membership Timeline</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Your membership journey milestones</p>
                  </div>
                </div>
                
                <div className="pl-0 lg:pl-16 flex-1 flex items-center">
                  {/* Prepare and sort timeline items */}
                  {(() => {
                    const timelineItems = [];
                    
                    if (membershipStatus?.memberJoinDate) {
                      timelineItems.push({
                        date: new Date(membershipStatus.memberJoinDate),
                        title: 'Joined Alcor',
                        dateString: membershipStatus.memberJoinDate
                      });
                    }
                    
                    if (membershipStatus?.agreementSent) {
                      timelineItems.push({
                        date: new Date(membershipStatus.agreementSent),
                        title: 'Agreement Sent',
                        dateString: membershipStatus.agreementSent
                      });
                    }
                    
                    if (membershipStatus?.agreementReceived) {
                      timelineItems.push({
                        date: new Date(membershipStatus.agreementReceived),
                        title: 'Agreement Received',
                        dateString: membershipStatus.agreementReceived
                      });
                    }
                    
                    if (membershipStatus?.contractComplete && membershipStatus?.contractDate) {
                      timelineItems.push({
                        date: new Date(membershipStatus.contractDate),
                        title: 'Contract Completed',
                        dateString: membershipStatus.contractDate
                      });
                    }
                    
                    // Sort by date (oldest first)
                    timelineItems.sort((a, b) => a.date - b.date);
                    
                    return (
                      <div className="space-y-3 w-full">
                        {timelineItems.map((item, index) => (
                          <div key={index} className={`flex items-start gap-3 animate-fadeInUp-delay-${Math.min(index + 1, 3)}`}>
                            <div className="w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full mt-1 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-base font-normal text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-600">{formatDate(item.dateString)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
          
      {/* Mobile View - All sections as separate cards */}
      <div className="sm:hidden px-4 space-y-4">
        {/* Main Status Card - Mobile */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center">
                  Membership Status
                  <img src={alcorStar} alt="" className="w-4 h-4 ml-1" />
                </h2>
              </div>
              
              <span className={`px-3 py-1 rounded-lg text-sm ${
                membershipStatus?.contractComplete 
                  ? 'bg-green-100 text-green-800' 
                  : 'border border-purple-600 text-purple-700 bg-white'
              }`}>
                {getStatus()}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {personalInfo?.firstName} {personalInfo?.lastName}
              </h3>
              <p className="text-sm text-gray-600 flex flex-col gap-0.5">
                <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                <span>{getMembershipType()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-1" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-6 bg-gray-50 border-b border-gray-300">
            <div className="flex items-center gap-3">
              {getIcon('personal')}
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-3 animate-fadeInUp">
              <p className="text-xs text-gray-600 mb-0.5">Full Name</p>
              <p className="text-sm font-normal text-gray-900">
                {personalInfo?.firstName} {personalInfo?.lastName}
              </p>
            </div>
            <div className="px-6 py-3 animate-fadeInUp">
              <p className="text-xs text-gray-600 mb-0.5">Member ID</p>
              <p className="text-sm font-normal text-gray-900">{personalInfo?.alcorId || 'N/A'}</p>
            </div>
            <div className="px-6 py-3 animate-fadeInUp">
              <p className="text-xs text-gray-600 mb-0.5">Years of Membership</p>
              <p className="text-sm font-normal text-gray-900">{yearsOfMembership}</p>
            </div>
            <div className="px-6 py-3 animate-fadeInUp">
              <p className="text-xs text-gray-600 mb-0.5">Member Since</p>
              <p className="text-sm font-normal text-gray-900">{formatDate(membershipStatus?.memberJoinDate)}</p>
            </div>
            <div className="px-6 py-3 animate-fadeInUp">
              <p className="text-xs text-gray-600 mb-0.5">Contract Date</p>
              <p className="text-sm font-normal text-gray-900">{formatDate(membershipStatus?.contractDate)}</p>
            </div>
          </div>
        </div>

        {/* Cryopreservation Details Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-2" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getIcon('cryo')}
              <h3 className="text-base font-semibold text-gray-900">
                {cryoArrangements?.methodOfPreservation ? 'Cryopreservation Details' : 'Membership Details'}
              </h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 animate-fadeInUp">
              <p className="text-xs text-gray-500 mb-1">Preservation Type</p>
              <p className="text-sm font-normal text-gray-900">
                {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
                  ? 'Whole Body' 
                  : cryoArrangements?.methodOfPreservation?.includes('Neuro')
                  ? 'Neuro'
                  : 'N/A'}
              </p>
            </div>
            <div className="px-6 py-4 animate-fadeInUp">
              <p className="text-xs text-gray-500 mb-1">CMS Fee Waiver</p>
              <p className="text-sm font-normal text-gray-900">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
            </div>
            <div className="px-6 py-4 animate-fadeInUp">
              <p className="text-xs text-gray-500 mb-1">Funding Status</p>
              <p className="text-sm font-normal text-gray-900">{cryoArrangements?.fundingStatus || 'N/A'}</p>
            </div>
            <div className="px-6 py-4 animate-fadeInUp">
              <p className="text-xs text-gray-500 mb-1">Public Disclosure</p>
              <p className="text-sm font-normal text-gray-900">
                {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
                  ? 'Confidential' 
                  : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
                  ? 'Public' 
                  : 'Limited'}
              </p>
            </div>
            <div className="px-6 py-4 animate-fadeInUp">
              <p className="text-xs text-gray-500 mb-1">Membership Type</p>
              <p className="text-sm font-normal text-gray-900">{getMembershipType()}</p>
            </div>
          </div>
        </div>

        {/* Requirements Checklist Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-3" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getIcon('requirements')}
              <h3 className="text-base font-semibold text-gray-900">Membership Requirements</h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-6 animate-fadeInUp">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  membershipStatus?.hasESignature 
                    ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                    : 'bg-gray-300'
                }`}>
                  {membershipStatus?.hasESignature ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-normal text-gray-900">E-Signature Completed</p>
                  <p className="text-xs text-gray-500 mt-1.5">{membershipStatus?.hasESignature ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 animate-fadeInUp">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  membershipStatus?.hasAuthorizationConsent 
                    ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                    : 'bg-gray-200'
                }`}>
                  {membershipStatus?.hasAuthorizationConsent ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-normal text-gray-900">Authorization Consent</p>
                  <p className="text-xs text-gray-500 mt-1.5">{membershipStatus?.hasAuthorizationConsent ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 animate-fadeInUp">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  membershipStatus?.paidInitialDues 
                    ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                    : 'bg-gray-200'
                }`}>
                  {membershipStatus?.paidInitialDues ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-normal text-gray-900">Initial Dues Paid</p>
                  <p className="text-xs text-gray-500 mt-1.5">{membershipStatus?.paidInitialDues ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-6 animate-fadeInUp">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  membershipStatus?.hasProofOfFunding 
                    ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                    : 'bg-gray-200'
                }`}>
                  {membershipStatus?.hasProofOfFunding ? (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-normal text-gray-900">Proof of Funding</p>
                  <p className="text-xs text-gray-500 mt-1.5">{membershipStatus?.hasProofOfFunding ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-3" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getIcon('timeline')}
              <h3 className="text-base font-semibold text-gray-900">Membership Timeline</h3>
            </div>
          </div>
          
          <div className="px-6 py-8">
            {(() => {
              const timelineItems = [];
              
              if (membershipStatus?.memberJoinDate) {
                timelineItems.push({
                  date: new Date(membershipStatus.memberJoinDate),
                  title: 'Joined Alcor',
                  dateString: membershipStatus.memberJoinDate
                });
              }
              
              if (membershipStatus?.agreementSent) {
                timelineItems.push({
                  date: new Date(membershipStatus.agreementSent),
                  title: 'Agreement Sent',
                  dateString: membershipStatus.agreementSent
                });
              }
              
              if (membershipStatus?.agreementReceived) {
                timelineItems.push({
                  date: new Date(membershipStatus.agreementReceived),
                  title: 'Agreement Received',
                  dateString: membershipStatus.agreementReceived
                });
              }
              
              if (membershipStatus?.contractComplete && membershipStatus?.contractDate) {
                timelineItems.push({
                  date: new Date(membershipStatus.contractDate),
                  title: 'Contract Completed',
                  dateString: membershipStatus.contractDate
                });
              }
              
              // Sort by date (oldest first)
              timelineItems.sort((a, b) => a.date - b.date);
              
              return (
                <div className="space-y-5">
                  {timelineItems.map((item, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-6 ml-5 relative animate-fadeInUp">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full"></div>
                      <p className="text-sm font-normal text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.dateString)}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Add padding at the end */}
      <div className="h-32"></div>

      {/* Help Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <button
          className="w-16 h-16 bg-[#9f5fa6] hover:bg-[#8a4191] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          onClick={() => setShowHelpPopup(!showHelpPopup)}
        >
          <svg 
            className="w-8 h-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.8" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </button>

        {/* Help Popup */}
        {showHelpPopup && (
          <div className="fixed bottom-28 right-8 w-80 bg-white rounded-lg shadow-2xl overflow-hidden z-50 animate-slideIn">
            <div className="bg-[#9f5fa6] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-medium">Help & Information</h3>
              <button
                onClick={() => setShowHelpPopup(false)}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Membership Status</h4>
                <p className="text-sm text-gray-600">View your current membership status, contract completion, and important dates.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Personal Information</h4>
                <p className="text-sm text-gray-600">Review your account details including member ID, years of membership, and contract dates.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Cryopreservation Details</h4>
                <p className="text-sm text-gray-600">Check your preservation type, funding status, and disclosure preferences.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Requirements Checklist</h4>
                <p className="text-sm text-gray-600">Track your progress completing membership requirements.</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Need assistance?</h4>
                <p className="text-sm text-gray-600">
                  Contact support at{' '}
                  <a href="mailto:info@alcor.org" className="text-[#9f5fa6] hover:underline">
                    info@alcor.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MembershipStatusTab;