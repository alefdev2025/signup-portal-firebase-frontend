import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { Loading, Alert } from './FormComponents';
import { User, Shield, Clock, CheckCircle, FileText, DollarSign } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

// Import the icon components from settings
import { IconWrapper, iconStyle } from '../portal/iconStyle';

const MembershipStatusTab = () => {
  const { salesforceContactId } = useMemberPortal();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // Add Inter font and styles matching notifications
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
      
      .membership-status-tab * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      }
      .membership-status-tab p,
      .membership-status-tab span,
      .membership-status-tab div {
        font-weight: 300 !important;
      }
      .membership-status-tab .font-bold,
      .membership-status-tab .font-semibold {
        font-weight: 600 !important;
      }
      .membership-status-tab button.font-bold {
        font-weight: 700 !important;
      }
      .membership-status-tab h1 {
        font-weight: 500 !important;
        letter-spacing: -0.02em !important;
      }
      .membership-status-tab h2,
      .membership-status-tab h4 {
        font-weight: 400 !important;
        letter-spacing: -0.01em !important;
      }
      .membership-status-tab h3 {
        font-weight: 300 !important;
        letter-spacing: -0.01em !important;
      }
      .membership-status-tab .section-subtitle {
        font-weight: 400 !important;
        letter-spacing: 0.05em !important;
        color: #6b7280 !important;
      }
      @media (min-width: 1024px) {
        .membership-status-tab .card-title {
          font-weight: 600 !important;
        }
      }
      @media (max-width: 1023px) {
        .membership-status-tab .card-title {
          font-weight: 600 !important;
        }
      }
      .membership-status-tab .fade-in {
        animation: fadeIn 0.8s ease-out;
      }
      .membership-status-tab .slide-in {
        animation: slideIn 0.8s ease-out;
      }
      .membership-status-tab .stagger-in > * {
        opacity: 0;
        animation: slideIn 0.5s ease-out forwards;
      }
      .membership-status-tab .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .membership-status-tab .stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .membership-status-tab .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .membership-status-tab .stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      .membership-status-tab .stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
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
      .professional-card {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        background: #ffffff;
        border-radius: 1rem;
      }
      @media (max-width: 1023px) {
        .professional-card {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      }
      .professional-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
      }
      @media (max-width: 1023px) {
        .professional-card:hover {
          box-shadow: 0 6px 10px rgba(0, 0, 0, 0.18);
        }
      }
      .luxury-divider {
        height: 1px;
        background: linear-gradient(to right, transparent, #9ca3af 20%, #9ca3af 80%, transparent);
      }
      .icon-luxury {
        position: relative;
        overflow: hidden;
      }
      .icon-luxury::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
        transform: rotate(45deg);
        transition: all 0.6s;
        opacity: 0;
      }
      .professional-card:hover .icon-luxury::after {
        opacity: 1;
        animation: shimmer 1.5s ease;
      }
      .gradient-border-top {
        position: relative;
        border-top: 3px solid transparent;
        background-clip: padding-box;
      }
      .gradient-border {
        position: relative;
        background: linear-gradient(#f3f4f6, #f3f4f6) padding-box,
                    linear-gradient(to right, #0a1628, #6e4376) border-box;
        border: 1px solid transparent;
        border-radius: 0.5rem;
      }
      @media (max-width: 1023px) {
        .status-badge {
          max-width: none !important;
        }
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
    return null;
  }

  if (error) {
    return (
      <div className="membership-status-tab -mx-6 -mt-6 lg:mx-0 lg:mt-0">
        <div className="px-2 sm:px-6 lg:px-0 pt-10 lg:pt-0">
          <div className="w-[95%] mx-auto lg:max-w-5xl">
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
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="membership-status-tab -mx-6 -mt-6 lg:mx-0 lg:mt-0">
        <div className="px-4 sm:px-6 lg:px-0 pt-10 lg:pt-0">
          <div className="max-w-sm mx-auto lg:max-w-5xl">
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg font-light">No membership data available</p>
            </div>
          </div>
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

  // Get icon for sections
  const getIcon = (type) => {
    const iconClass = "w-5 h-5 lg:w-6 lg:h-6 text-white transition-transform duration-200";
    const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
    
    return (
      <div className="w-full h-full rounded-lg bg-gradient-to-r from-[#0a1628] to-[#6e4376] flex items-center justify-center shadow-md">
        {type === 'personal' && <User {...iconProps} />}
        {type === 'cryo' && <Shield {...iconProps} />}
        {type === 'requirements' && <CheckCircle {...iconProps} />}
        {type === 'timeline' && <Clock {...iconProps} />}
      </div>
    );
  };

  return (
    <div className="membership-status-tab -mx-6 -mt-6 lg:mx-0 lg:mt-0">
      {/* Main Card - Hidden on Mobile */}
      <div className="hidden lg:block px-2 sm:px-6 lg:px-0 pt-10 lg:pt-8">
        <div className="w-[95%] mx-auto lg:max-w-5xl lg:ml-8 lg:mr-auto">
          <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden gradient-border-top">
            {/* Card Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6 pb-8 lg:pb-10 border-b border-gray-200 fade-in">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 pb-4 lg:pb-2 pt-2 w-full slide-in">
                <div className="flex items-center justify-between lg:justify-start w-full lg:w-auto">
                  <div className="flex items-center gap-4">
                    <IconWrapper className="icon-luxury" size="large" color="gradient">
                      <User className={`${iconStyle.iconSizeLarge} ${iconStyle.iconColor}`} strokeWidth={iconStyle.strokeWidth} />
                    </IconWrapper>
                    <h2 className="text-xl font-bold text-gray-800 card-title flex items-center">
                      Membership Status
                      <img src={alcorStar} alt="" className="w-5 h-5 ml-1" />
                    </h2>
                  </div>
                  
                  <span className={`lg:hidden status-badge px-4 py-2 rounded-lg ${
                    membershipStatus?.contractComplete 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    <span>{getStatus()}</span>
                  </span>
                </div>
                
                <span className={`hidden lg:block px-4 py-2 rounded-lg ml-auto ${
                  membershipStatus?.contractComplete 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <span>{getStatus()}</span>
                </span>
              </div>

              {/* Member Info */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 lg:mt-8 stagger-in">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-1">
                    {personalInfo?.firstName} {personalInfo?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-3">
                    <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                    <span className="hidden lg:inline">•</span>
                    <span>{getMembershipType()}</span>
                  </p>
                </div>
                
                {/* Section Navigation Tabs - Desktop Only */}
                <div className="hidden lg:flex bg-gray-300 rounded-lg p-0.5 overflow-x-auto lg:w-[512px] self-start lg:self-center lg:mt-1">
                  <button
                    onClick={() => setActiveSection('personal')}
                    className={`relative px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-[13px] transition-all whitespace-nowrap lg:w-[127px] ${
                      activeSection === 'personal' 
                        ? 'bg-white text-[#6e4376] shadow-sm font-bold' 
                        : 'text-[#6e4376] hover:text-[#8a4191]'
                    }`}
                    style={{ fontWeight: activeSection === 'personal' ? 700 : 400 }}
                  >
                    <span className="block text-center">Personal Info</span>
                    {activeSection === 'personal' && (
                      <img src={alcorStar} alt="" className="w-3 h-3 absolute top-1/2 right-2 -translate-y-1/2" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveSection('cryo')}
                    className={`relative px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-[13px] transition-all whitespace-nowrap lg:w-[127px] ${
                      activeSection === 'cryo' 
                        ? 'bg-white text-[#6e4376] shadow-sm font-bold' 
                        : 'text-[#6e4376] hover:text-[#8a4191]'
                    }`}
                    style={{ fontWeight: activeSection === 'cryo' ? 700 : 400 }}
                  >
                    <span className="block text-center">Cryopreservation</span>
                    {activeSection === 'cryo' && (
                      <img src={alcorStar} alt="" className="w-3 h-3 absolute top-1/2 right-2 -translate-y-1/2" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveSection('requirements')}
                    className={`relative px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-[13px] transition-all whitespace-nowrap lg:w-[127px] ${
                      activeSection === 'requirements' 
                        ? 'bg-white text-[#6e4376] shadow-sm font-bold' 
                        : 'text-[#6e4376] hover:text-[#8a4191]'
                    }`}
                    style={{ fontWeight: activeSection === 'requirements' ? 700 : 400 }}
                  >
                    <span className="block text-center">Requirements</span>
                    {activeSection === 'requirements' && (
                      <img src={alcorStar} alt="" className="w-3 h-3 absolute top-1/2 right-2 -translate-y-1/2" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveSection('timeline')}
                    className={`relative px-2 lg:px-3 py-2 lg:py-2.5 rounded-md text-xs lg:text-[13px] transition-all whitespace-nowrap lg:w-[127px] ${
                      activeSection === 'timeline' 
                        ? 'bg-white text-[#6e4376] shadow-sm font-bold' 
                        : 'text-[#6e4376] hover:text-[#8a4191]'
                    }`}
                    style={{ fontWeight: activeSection === 'timeline' ? 700 : 400 }}
                  >
                    <span className="block text-center">Timeline</span>
                    {activeSection === 'timeline' && (
                      <img src={alcorStar} alt="" className="w-3 h-3 absolute top-1/2 right-2 -translate-y-1/2" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Content Section - Desktop */}
            <div className="hidden lg:block bg-white pt-4 lg:pt-6">
              <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-10 min-h-[300px] lg:min-h-[300px]">
                {/* Personal Information Section */}
                {activeSection === 'personal' && (
                  <div className="stagger-in">
                    <div className="flex items-start gap-4 mb-6 lg:mb-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {getIcon('personal')}
                      </div>
                      <div>
                        <h3 className="text-base lg:text-lg font-thin text-gray-900">Personal Information</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your account details and membership information</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 pl-0 lg:pl-16 pb-6 lg:pb-12">
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Full Name</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">
                          {personalInfo?.firstName} {personalInfo?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Member ID</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{personalInfo?.alcorId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Years of Membership</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{yearsOfMembership}</p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Member Since</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{formatDate(membershipStatus?.memberJoinDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Contract Date</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{formatDate(membershipStatus?.contractDate)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cryopreservation Details */}
                {activeSection === 'cryo' && (
                  <div className="stagger-in">
                    <div className="flex items-start gap-4 mb-6 lg:mb-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {getIcon('cryo')}
                      </div>
                      <div>
                        <h3 className="text-base lg:text-lg font-thin text-gray-900">Cryopreservation Details</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your preservation arrangements and preferences</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10 pl-0 lg:pl-16 pb-6 lg:pb-12">
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Preservation Type</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">
                          {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
                            ? 'Whole Body' 
                            : cryoArrangements?.methodOfPreservation?.includes('Neuro')
                            ? 'Neuro'
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">CMS Fee Waiver</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Funding Status</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{cryoArrangements?.fundingStatus || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Public Disclosure</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">
                          {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
                            ? 'Confidential' 
                            : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
                            ? 'Public' 
                            : 'Limited'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs lg:text-sm text-gray-400 mb-1 lg:mb-2">Membership Type</p>
                        <p className="text-base lg:text-lg font-normal text-gray-800">{getMembershipType()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requirements Checklist */}
                {activeSection === 'requirements' && (
                  <div className="stagger-in">
                    <div className="flex items-start gap-4 mb-6 lg:mb-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {getIcon('requirements')}
                      </div>
                      <div>
                        <h3 className="text-base lg:text-lg font-thin text-gray-900">Membership Requirements</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Track your membership completion status</p>
                      </div>
                    </div>
                    
                    {/* Add extra padding before the 4 requirement items */}
                    <div className="h-4 lg:h-8"></div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 lg:gap-y-16 lg:gap-x-20 pl-0 lg:pl-16 pb-6 lg:pb-12">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.hasESignature 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-300'
                        }`}>
                          {membershipStatus?.hasESignature ? (
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base lg:text-lg font-normal text-gray-800">E-Signature Completed</p>
                          <p className="text-xs lg:text-sm text-gray-500 mt-1">{membershipStatus?.hasESignature ? 'Complete' : 'Pending'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.hasAuthorizationConsent 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-200'
                        }`}>
                          {membershipStatus?.hasAuthorizationConsent ? (
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base lg:text-lg font-normal text-gray-800">Authorization Consent</p>
                          <p className="text-xs lg:text-sm text-gray-500 mt-1">{membershipStatus?.hasAuthorizationConsent ? 'Complete' : 'Pending'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.paidInitialDues 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-200'
                        }`}>
                          {membershipStatus?.paidInitialDues ? (
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base lg:text-lg font-normal text-gray-800">Initial Dues Paid</p>
                          <p className="text-xs lg:text-sm text-gray-500 mt-1">{membershipStatus?.paidInitialDues ? 'Complete' : 'Pending'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          membershipStatus?.hasProofOfFunding 
                            ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                            : 'bg-gray-200'
                        }`}>
                          {membershipStatus?.hasProofOfFunding ? (
                            <svg className="w-4 h-4 lg:w-5 lg:h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-base lg:text-lg font-normal text-gray-800">Proof of Funding</p>
                          <p className="text-xs lg:text-sm text-gray-500 mt-1">{membershipStatus?.hasProofOfFunding ? 'Complete' : 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {activeSection === 'timeline' && (
                  <div className="stagger-in">
                    <div className="flex items-start gap-4 mb-6 lg:mb-8">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {getIcon('timeline')}
                      </div>
                      <div>
                        <h3 className="text-base lg:text-lg font-normal text-gray-900">Membership Timeline</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your membership journey milestones</p>
                      </div>
                    </div>
                    
                    <div className="pl-0 lg:pl-16 pb-6 lg:pb-12">
                      {/* Add extra space before timeline */}
                      <div className="h-8 lg:h-16"></div>
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
                          <div className="relative">
                            {/* Desktop: Horizontal Timeline */}
                            <div className="hidden lg:block">
                              <div className="absolute top-2 left-0 w-[87.5%] h-0.5 bg-gray-200"></div>
                              <div className="grid grid-cols-4 gap-8 relative">
                                {timelineItems.map((item, index) => (
                                  <div key={index} className="relative">
                                    <div className="w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full absolute top-0 left-0"></div>
                                    <div className="pt-8">
                                      <p className="text-sm font-normal text-gray-800">{item.title}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.dateString)}</p>
                                    </div>
                                  </div>
                                ))}
                                {/* Add empty divs to fill the grid if fewer than 4 items */}
                                {[...Array(Math.max(0, 4 - timelineItems.length))].map((_, index) => (
                                  <div key={`empty-${index}`}></div>
                                ))}
                              </div>
                            </div>

                            {/* Mobile: Vertical Timeline */}
                            <div className="space-y-6 lg:hidden">
                              {timelineItems.map((item, index) => (
                                <div key={index} className="border-l-2 border-gray-200 pl-6 ml-5 relative">
                                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full"></div>
                                  <p className="text-base font-normal text-gray-800">{item.title}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(item.dateString)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Extra spacing at bottom */}
                      <div className="h-6 lg:h-16"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
          
      {/* Mobile View - All sections as separate cards */}
      <div className="lg:hidden px-2 sm:px-6 pt-10">
        <div className="w-[95%] mx-auto space-y-6">
            {/* Main Status Card - Mobile */}
            <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden gradient-border-top">
              <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                  <IconWrapper className="icon-luxury" size="default" color="gradient">
                    <User className={`${iconStyle.iconSize} ${iconStyle.iconColor}`} strokeWidth={iconStyle.strokeWidth} />
                  </IconWrapper>
                    <h2 className="text-lg font-bold text-gray-800 card-title flex items-center">
                      Membership Status
                      <img src={alcorStar} alt="" className="w-5 h-5 ml-1" />
                    </h2>
                  </div>
                  
                  <span className={`status-badge px-3 py-1.5 rounded-lg text-sm ${
                    membershipStatus?.contractComplete 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatus()}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {personalInfo?.firstName} {personalInfo?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 flex flex-col gap-1">
                    <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                    <span>{getMembershipType()}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getIcon('personal')}
                  </div>
                  <div>
                    <h3 className="text-base font-thin text-gray-900">Personal Information</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Your account details and membership information</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Full Name</p>
                    <p className="text-base font-normal text-gray-800">
                      {personalInfo?.firstName} {personalInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Member ID</p>
                    <p className="text-base font-normal text-gray-800">{personalInfo?.alcorId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Years of Membership</p>
                    <p className="text-base font-normal text-gray-800">{yearsOfMembership}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Member Since</p>
                    <p className="text-base font-normal text-gray-800">{formatDate(membershipStatus?.memberJoinDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Contract Date</p>
                    <p className="text-base font-normal text-gray-800">{formatDate(membershipStatus?.contractDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryopreservation Details Card */}
            <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-[420px]">
              <div className="px-4 py-6 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getIcon('cryo')}
                  </div>
                  <div>
                    <h3 className="text-base font-thin text-gray-900">Cryopreservation Details</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Your preservation arrangements and preferences</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 flex-1">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Preservation Type</p>
                    <p className="text-base font-normal text-gray-800">
                      {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
                        ? 'Whole Body' 
                        : cryoArrangements?.methodOfPreservation?.includes('Neuro')
                        ? 'Neuro'
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">CMS Fee Waiver</p>
                    <p className="text-base font-normal text-gray-800">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Funding Status</p>
                    <p className="text-base font-normal text-gray-800">{cryoArrangements?.fundingStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Public Disclosure</p>
                    <p className="text-base font-normal text-gray-800">
                      {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
                        ? 'Confidential' 
                        : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
                        ? 'Public' 
                        : 'Limited'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Membership Type</p>
                    <p className="text-base font-normal text-gray-800">{getMembershipType()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Checklist Card */}
            <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-[420px]">
              <div className="px-4 py-6 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getIcon('requirements')}
                  </div>
                  <div>
                    <h3 className="text-base font-thin text-gray-900">Membership Requirements</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Track your membership completion status</p>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center">
                  <div className="space-y-5 w-full">
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
                        <p className="text-base font-normal text-gray-800">E-Signature Completed</p>
                        <p className="text-xs text-gray-500 mt-1">{membershipStatus?.hasESignature ? 'Complete' : 'Pending'}</p>
                      </div>
                    </div>
                    
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
                        <p className="text-base font-normal text-gray-800">Authorization Consent</p>
                        <p className="text-xs text-gray-500 mt-1">{membershipStatus?.hasAuthorizationConsent ? 'Complete' : 'Pending'}</p>
                      </div>
                    </div>
                    
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
                        <p className="text-base font-normal text-gray-800">Initial Dues Paid</p>
                        <p className="text-xs text-gray-500 mt-1">{membershipStatus?.paidInitialDues ? 'Complete' : 'Pending'}</p>
                      </div>
                    </div>
                    
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
                        <p className="text-base font-normal text-gray-800">Proof of Funding</p>
                        <p className="text-xs text-gray-500 mt-1">{membershipStatus?.hasProofOfFunding ? 'Complete' : 'Pending'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden h-[420px]">
              <div className="px-4 py-6 h-full flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    {getIcon('timeline')}
                  </div>
                  <div>
                    <h3 className="text-base font-normal text-gray-900">Membership Timeline</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Your membership journey milestones</p>
                  </div>
                </div>
                
                <div className="flex-1 flex items-center">
                  <div className="w-full">
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
                            <div key={index} className="border-l-2 border-gray-200 pl-6 ml-5 relative">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full"></div>
                              <p className="text-base font-normal text-gray-800">{item.title}</p>
                              <p className="text-sm text-gray-500 mt-0.5">{formatDate(item.dateString)}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Footer Actions */}
      <div className="mt-16 px-2 sm:px-6 lg:px-0 pb-2 lg:pb-8 w-[95%] mx-auto lg:max-w-5xl">
        <div className="luxury-divider mb-8"></div>
        <div className="flex items-center justify-between px-4 lg:px-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-600 lg:text-gray-500 tracking-wider uppercase font-light">Membership data synced</p>
          </div>
        </div>
      </div>

      {/* Help Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <button
          className="w-14 h-14 bg-[#9f5fa6] hover:bg-[#8a4191] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          onClick={() => setShowHelpPopup(!showHelpPopup)}
        >
          <svg 
            className="w-7 h-7 text-white" 
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
              <h3 className="text-base" style={{ fontWeight: 500 }}>Help & Information</h3>
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
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Membership Status</h4>
                <p className="text-sm text-gray-600">View your current membership status, contract completion, and important dates.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Personal Information</h4>
                <p className="text-sm text-gray-600">Review your account details including member ID, years of membership, and contract dates.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Cryopreservation Details</h4>
                <p className="text-sm text-gray-600">Check your preservation type, funding status, and disclosure preferences.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Requirements Checklist</h4>
                <p className="text-sm text-gray-600">Track completed and pending membership requirements including signatures, consent forms, and funding proof.</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Need assistance?</h4>
                <p className="text-sm text-gray-600">
                  Contact support at{' '}
                  <a href="mailto:support@alcor.org" className="text-[#9f5fa6] hover:underline">
                    support@alcor.org
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