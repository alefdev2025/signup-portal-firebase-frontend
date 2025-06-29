import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { Loading, Alert } from './FormComponents';
import { User, Shield, Clock, CheckCircle, FileText, DollarSign } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

const MembershipStatusTab = () => {
  const { salesforceContactId } = useMemberPortal();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');

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
      .membership-status-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .membership-status-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .membership-status-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .membership-status-tab .slide-in-delay-2 {
        animation: slideIn 0.6s ease-out 0.2s both;
      }
      .membership-status-tab .slide-in-delay-3 {
        animation: slideIn 0.6s ease-out 0.3s both;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .creamsicle-outline-faint {
        border: 1px solid #FFCAA630 !important;
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
      <div className="max-w-4xl pl-8">
        <div className="mb-10 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
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
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
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
    <div className="membership-status-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
      {/* Single Container with Banner */}
      <div className="bg-white shadow-sm border border-gray-400 sm:border-gray-200 rounded-[1.5rem] sm:rounded-[1.25rem] overflow-hidden slide-in mx-4 sm:mx-0">
        {/* Header Banner */}
        <div className="px-6 py-8 sm:py-7 rounded-t-[1.5rem] sm:rounded-t-[1.25rem]" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
          <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md mt-2 sm:mt-0">
            <User className="w-5 h-5 text-white drop-shadow-sm mr-3" />
            Membership Status
            <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
          </h2>
        </div>

        {/* All Content in Single Container */}
        <div className="p-6 sm:p-8 lg:p-10">
          {/* Member Header Info */}
          <div className="mb-10 pb-10 sm:mb-8 sm:pb-8 lg:mb-6 lg:pb-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-4">
              <div className="flex flex-col sm:block">
                <div className="flex justify-between items-start sm:block">
                  <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-2">
                    {personalInfo?.firstName} {personalInfo?.lastName}
                  </h3>
                  <div className="sm:hidden">
                    <span className={`text-sm px-4 py-2 rounded-md font-medium inline-block ${
                      membershipStatus?.contractComplete 
                        ? 'border border-[#3d5a80] text-[#3d5a80]' 
                        : 'border border-yellow-600 text-yellow-700'
                    }`}>
                      {getStatus()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-base lg:text-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 sm:gap-4">
                  <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{getMembershipType()}</span>
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className={`text-sm lg:text-base px-4 py-2 lg:px-6 lg:py-3 rounded-md font-medium inline-block flex items-center gap-1 ${
                  membershipStatus?.contractComplete 
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {getStatus()}
                  {membershipStatus?.contractComplete && <img src={alcorStar} alt="" className="w-4 h-4 lg:w-5 lg:h-5" />}
                </span>
              </div>
            </div>

            {/* Section Navigation Tabs - Mobile */}
            <div className="mt-10 sm:mt-8 lg:mt-6 flex flex-wrap gap-3 sm:hidden">
              <button
                onClick={() => setActiveSection('personal')}
                className={`w-36 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'personal'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Personal Info
                {activeSection === 'personal' && <img src={alcorStar} alt="" className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveSection('cryo')}
                className={`w-36 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'cryo'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Cryopreservation
                {activeSection === 'cryo' && <img src={alcorStar} alt="" className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveSection('requirements')}
                className={`w-36 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'requirements'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Requirements
                {activeSection === 'requirements' && <img src={alcorStar} alt="" className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveSection('timeline')}
                className={`w-36 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'timeline'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Timeline
                {activeSection === 'timeline' && <img src={alcorStar} alt="" className="w-4 h-4" />}
              </button>
            </div>

            {/* Section Navigation Tabs - Desktop */}
            <div className="hidden sm:flex mt-8 lg:mt-6 gap-3">
              <button
                onClick={() => setActiveSection('personal')}
                className={`flex-1 max-w-[160px] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'personal'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Personal Info
                {activeSection === 'personal' && <img src={alcorStar} alt="" className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => setActiveSection('cryo')}
                className={`flex-1 max-w-[160px] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'cryo'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Cryopreservation
                {activeSection === 'cryo' && <img src={alcorStar} alt="" className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => setActiveSection('requirements')}
                className={`flex-1 max-w-[160px] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'requirements'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Requirements
                {activeSection === 'requirements' && <img src={alcorStar} alt="" className="w-4 h-4 ml-0.5" />}
              </button>
              <button
                onClick={() => setActiveSection('timeline')}
                className={`flex-1 max-w-[160px] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeSection === 'timeline'
                    ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Timeline
                {activeSection === 'timeline' && <img src={alcorStar} alt="" className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Dynamic Content Section */}
          <div>
            {/* Personal Information Section */}
            {activeSection === 'personal' && (
              <div className="bg-gray-50 rounded-xl p-6 lg:p-8 fade-in border border-gray-200">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mr-3 lg:mr-4">
                    <User className="w-5 h-5 lg:w-6 lg:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 lg:pl-16">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">
                      {personalInfo?.firstName} {personalInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Member ID</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{personalInfo?.alcorId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Record Type</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{personalInfo?.recordType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Years of Membership</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{yearsOfMembership}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Member Since</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Contract Date</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{formatDate(membershipStatus?.contractDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cryopreservation Details */}
            {activeSection === 'cryo' && (
              <div className="bg-gray-50 rounded-xl p-6 lg:p-8 fade-in border border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mr-3 lg:mr-4">
                    <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  Cryopreservation Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 lg:pl-16">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Preservation Type</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">
                      {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
                        ? 'Whole Body' 
                        : cryoArrangements?.methodOfPreservation?.includes('Neuro')
                        ? 'Neuro'
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">CMS Fee Waiver</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Funding Status</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{cryoArrangements?.fundingStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Public Disclosure</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">
                      {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
                        ? 'Confidential' 
                        : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
                        ? 'Public' 
                        : 'Limited'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-500 mb-1">Membership Type</p>
                    <p className="text-base lg:text-lg font-medium text-gray-900">{getMembershipType()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Requirements Checklist */}
            {activeSection === 'requirements' && (
              <div className="bg-gray-50 rounded-xl p-6 lg:p-8 fade-in border border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mr-3 lg:mr-4">
                    <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  Membership Requirements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-0 lg:pl-16">
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${
                      membershipStatus?.hasESignature 
                        ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6]' 
                        : 'bg-gray-300'
                    }`}>
                      {membershipStatus?.hasESignature && (
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">E-Signature Completed</p>
                      <p className="text-xs lg:text-sm text-gray-500">{membershipStatus?.hasESignature ? 'Complete' : 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${
                      membershipStatus?.hasAuthorizationConsent 
                        ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6]' 
                        : 'bg-gray-300'
                    }`}>
                      {membershipStatus?.hasAuthorizationConsent && (
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">Authorization Consent</p>
                      <p className="text-xs lg:text-sm text-gray-500">{membershipStatus?.hasAuthorizationConsent ? 'Complete' : 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${
                      membershipStatus?.paidInitialDues 
                        ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6]' 
                        : 'bg-gray-300'
                    }`}>
                      {membershipStatus?.paidInitialDues && (
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">Initial Dues Paid</p>
                      <p className="text-xs lg:text-sm text-gray-500">{membershipStatus?.paidInitialDues ? 'Complete' : 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center ${
                      membershipStatus?.hasProofOfFunding 
                        ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6]' 
                        : 'bg-gray-300'
                    }`}>
                      {membershipStatus?.hasProofOfFunding && (
                        <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">Proof of Funding</p>
                      <p className="text-xs lg:text-sm text-gray-500">{membershipStatus?.hasProofOfFunding ? 'Complete' : 'Pending'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {activeSection === 'timeline' && (
              <div className="bg-gray-50 rounded-xl p-6 lg:p-8 fade-in border border-gray-200">
                <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mr-3 lg:mr-4">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                  </div>
                  Membership Timeline
                </h3>
                <div className="space-y-6 pl-0 lg:pl-16">
                  {membershipStatus?.contractComplete && (
                    <div className="border-l-2 border-gray-300 pl-6 ml-5 relative">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] rounded-full"></div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">Contract Completed</p>
                      <p className="text-sm lg:text-base text-gray-500">{formatDate(membershipStatus?.contractDate)}</p>
                    </div>
                  )}
                  {membershipStatus?.agreementReceived && (
                    <div className="border-l-2 border-gray-300 pl-6 ml-5 relative">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] rounded-full"></div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">Agreement Received</p>
                      <p className="text-sm lg:text-base text-gray-500">{formatDate(membershipStatus?.agreementReceived)}</p>
                    </div>
                  )}
                  {membershipStatus?.agreementSent && (
                    <div className="border-l-2 border-gray-300 pl-6 ml-5 relative">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] rounded-full"></div>
                      <p className="text-base lg:text-lg font-medium text-gray-900">Agreement Sent</p>
                      <p className="text-sm lg:text-base text-gray-500">{formatDate(membershipStatus?.agreementSent)}</p>
                    </div>
                  )}
                  <div className="border-l-2 border-gray-300 pl-6 ml-5 relative">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] rounded-full"></div>
                    <p className="text-base lg:text-lg font-medium text-gray-900">Joined Alcor</p>
                    <p className="text-sm lg:text-base text-gray-500">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipStatusTab;