import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { User, Shield, Clock, CheckCircle } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';

const MembershipStatusTab = () => {
  // Context and State Management
  const { salesforceContactId } = useMemberPortal();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // Initialize Helvetica font styling
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

  // Load membership data when component mounts or ID changes
  useEffect(() => {
    if (salesforceContactId) {
      loadMembershipData();
    } else {
      setIsLoading(false);
    }
  }, [salesforceContactId]);

  // API call to fetch membership data
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

  // Utility function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate years of membership
  const calculateYearsOfMembership = (joinDate) => {
    if (!joinDate) return 0;
    const memberSince = new Date(joinDate);
    return Math.floor((new Date() - memberSince) / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Determine membership type based on preservation method and record type
  const getMembershipType = (cryoArrangements, personalInfo) => {
    // Check if user is an applicant
    const isApplicant = personalInfo?.alcorRecordType === 'Applicant' || 
                       personalInfo?.recordType === 'Applicant' ||
                       personalInfo?.memberType === 'Applicant';
    
    let baseType = '';
    
    if (cryoArrangements?.methodOfPreservation?.includes('Whole Body')) {
      baseType = 'Whole Body Cryopreservation';
    } else if (cryoArrangements?.methodOfPreservation?.includes('Neuro')) {
      baseType = 'Neuropreservation';
    } else {
      baseType = 'Basic Membership';
    }
    
    // Add Applicant suffix if applicable
    if (isApplicant) {
      return baseType === 'Basic Membership' ? 'Membership Applicant' : `${baseType} Applicant`;
    }
    
    // Add Member suffix for full members
    return baseType === 'Basic Membership' ? baseType : `${baseType} Member`;
  };

  // Get membership status
  const getStatus = (membershipStatus) => {
    return membershipStatus?.isActive ? 'Active' : 'Inactive';
  };

  // Check if contract needs updating
  const shouldShowContractUpdateFlag = (cryoArrangements) => {
    if (!cryoArrangements?.methodOfPreservation || !cryoArrangements?.contractDate) {
      return false;
    }
    
    const contractDate = new Date(cryoArrangements.contractDate);
    const feb2022 = new Date('2022-02-01');
    
    return contractDate < feb2022;
  };

  // Get icon component for different sections
  const getSectionIcon = (type) => {
    const iconClass = "w-5 h-5 2xl:w-6 2xl:h-6 text-white";
    const containerClass = "p-2.5 2xl:p-3 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]";
    
    const icons = {
      personal: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      cryo: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      requirements: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      timeline: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    return <div className={containerClass}>{icons[type]}</div>;
  };

  // Render loading state
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

  // Render error state
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

  // Render empty state
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

  // Extract data from profileData
  const { personalInfo, cryoArrangements, membershipStatus } = profileData;
  const yearsOfMembership = calculateYearsOfMembership(membershipStatus?.memberJoinDate);
  const membershipType = getMembershipType(cryoArrangements, personalInfo);
  const status = getStatus(membershipStatus);
  const needsContractUpdate = shouldShowContractUpdateFlag(cryoArrangements);

  // Build timeline items
  const buildTimelineItems = () => {
    const items = [];
    
    if (membershipStatus?.memberJoinDate) {
      items.push({
        date: new Date(membershipStatus.memberJoinDate),
        title: 'Joined Alcor',
        dateString: membershipStatus.memberJoinDate
      });
    }
    
    if (membershipStatus?.agreementSent) {
      items.push({
        date: new Date(membershipStatus.agreementSent),
        title: 'Agreement Sent',
        dateString: membershipStatus.agreementSent
      });
    }
    
    if (membershipStatus?.agreementReceived) {
      items.push({
        date: new Date(membershipStatus.agreementReceived),
        title: 'Agreement Received',
        dateString: membershipStatus.agreementReceived
      });
    }
    
    return items.sort((a, b) => a.date - b.date);
  };

  // Render Personal Information Section
  const renderPersonalInfoSection = () => (
    <div className="animate-fadeInUp flex flex-col h-full" style={{ minHeight: '350px' }}>
      <div className="flex items-start gap-4 mb-6">
        {getSectionIcon('personal')}
        <div>
          <h3 className="text-base xl:text-lg font-semibold text-gray-900">Personal Information</h3>
          <p className="text-xs xl:text-sm text-gray-600 mt-0.5">Your account details and membership information</p>
        </div>
      </div>
      
      <div className="pl-0 lg:pl-16 flex-1 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
            <p className="text-xs text-gray-600 mb-1 font-medium">Full Name</p>
            <p className="text-sm 2xl:text-base font-normal text-gray-900">
              {personalInfo?.firstName} {personalInfo?.lastName}
            </p>
          </div>
          <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
            <p className="text-xs text-gray-600 mb-1 font-medium">Member ID</p>
            <p className="text-sm 2xl:text-base font-normal text-gray-900">{personalInfo?.alcorId || 'N/A'}</p>
          </div>
          <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
            <p className="text-xs text-gray-600 mb-1 font-medium">Years of Membership</p>
            <p className="text-sm 2xl:text-base font-normal text-gray-900">{yearsOfMembership}</p>
          </div>
          <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
            <p className="text-xs text-gray-600 mb-1 font-medium">Member Since</p>
            <p className="text-sm 2xl:text-base font-normal text-gray-900">{formatDate(membershipStatus?.memberJoinDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Cryopreservation Details Section
  const renderCryoSection = () => (
    <div className="animate-fadeInUp">
      <div className="flex items-start gap-4 mb-6">
        {getSectionIcon('cryo')}
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
        <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
          <p className="text-xs text-gray-600 mb-1 font-medium">Preservation Type</p>
          <p className="text-sm 2xl:text-base font-normal text-gray-900">
            {cryoArrangements?.methodOfPreservation?.includes('Whole Body') 
              ? 'Whole Body' 
              : cryoArrangements?.methodOfPreservation?.includes('Neuro')
              ? 'Neuro'
              : 'N/A'}
          </p>
        </div>
        <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-1">
          <p className="text-xs text-gray-600 mb-1 font-medium">CMS Fee Waiver</p>
          <p className="text-sm 2xl:text-base font-normal text-gray-900">{cryoArrangements?.cmsWaiver || 'N/A'}</p>
        </div>
        <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
          <p className="text-xs text-gray-600 mb-1 font-medium">Funding Status</p>
          <p className="text-sm 2xl:text-base font-normal text-gray-900">{cryoArrangements?.fundingStatus || 'N/A'}</p>
        </div>
        <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-2">
          <p className="text-xs text-gray-600 mb-1 font-medium">Public Disclosure</p>
          <p className="text-sm 2xl:text-base font-normal text-gray-900">
            {cryoArrangements?.memberPublicDisclosure?.includes('reasonable efforts') 
              ? 'Confidential' 
              : cryoArrangements?.memberPublicDisclosure?.includes('freely') 
              ? 'Public' 
              : 'Limited'}
          </p>
        </div>
        <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-3">
          <p className="text-xs text-gray-600 mb-1 font-medium">Membership Type</p>
          <p className="text-sm 2xl:text-base font-normal text-gray-900">{membershipType}</p>
        </div>
        <div className="p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-3">
          <p className="text-xs text-gray-600 mb-1 font-medium">Contract Version</p>
          <div className="flex items-start gap-2">
            <p className="text-sm 2xl:text-base font-normal text-gray-900">
              {formatDate(cryoArrangements?.contractDate)}
            </p>
            {needsContractUpdate && (
              <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-md px-2 py-1">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-yellow-800 font-medium">May need to sign updated contracts</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Requirements Section
  const renderRequirementsSection = () => {
    const requirements = [
      {
        key: 'hasESignature',
        label: 'E-Signature Completed',
        completed: membershipStatus?.hasESignature
      },
      {
        key: 'hasAuthorizationConsent',
        label: 'Authorization Consent',
        completed: membershipStatus?.hasAuthorizationConsent
      },
      {
        key: 'paidInitialDues',
        label: 'Initial Dues Paid',
        completed: membershipStatus?.paidInitialDues
      },
      {
        key: 'hasProofOfFunding',
        label: 'Proof of Funding',
        completed: membershipStatus?.hasProofOfFunding
      }
    ];

    return (
      <div className="animate-fadeInUp flex flex-col h-full" style={{ minHeight: '350px' }}>
        <div className="flex items-start gap-4 mb-6">
          {getSectionIcon('requirements')}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Membership Requirements</h3>
            <p className="text-sm text-gray-600 mt-0.5">Track your membership completion status</p>
          </div>
        </div>
        
        <div className="pl-0 lg:pl-16 flex-1 flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {requirements.map((req, index) => (
              <div key={req.key} className={`p-2.5 2xl:p-4 border border-gray-300 rounded-lg animate-fadeInUp-delay-${Math.floor(index / 2) + 1}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 2xl:w-8 2xl:h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                    req.completed 
                      ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' 
                      : 'bg-gray-300'
                  }`}>
                    {req.completed ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm 2xl:text-base font-normal text-gray-900">{req.label}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {req.completed ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Timeline Section
  const renderTimelineSection = () => {
    const timelineItems = buildTimelineItems();
    
    return (
      <div className="animate-fadeInUp">
        <div className="flex items-start gap-4 mb-6">
          {getSectionIcon('timeline')}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Membership Timeline</h3>
            <p className="text-sm text-gray-600 mt-0.5">Your membership journey milestones</p>
          </div>
        </div>
        
        <div style={{ 
          //marginTop: `min(max(120px, calc((100vh - 400px) * 0.3)), 280px)`,
          marginTop: `min(max(120px, calc((100vh - 400px) * 0.2)), 200px)`,
          marginLeft: timelineItems.length >= 3 ? '-30px' : '64px' // Conditional left margin
        }}>
          {timelineItems.length >= 3 ? (
            // Horizontal timeline for 3+ items
            <div className="relative flex">
              {timelineItems.map((item, index) => (
                <div key={index} className="flex flex-col items-center relative" style={{ width: '240px' }}>
                  {index < timelineItems.length - 1 && (
                    <div className="absolute h-0.5 bg-gray-300" 
                         style={{ 
                           top: '8px',
                           left: '128px',
                           width: '224px',
                           zIndex: 0
                         }}></div>
                  )}
                  
                  <div className="w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full relative z-10"></div>
                  
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(item.dateString)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Vertical timeline for 1-2 items
            <div className="space-y-4">
              {timelineItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full mt-1"></div>
                  <div>
                    <p className="text-base font-normal text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{formatDate(item.dateString)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="membership-status-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      <div className="h-8"></div>
      
      {/* Desktop View */}
      <div className="hidden sm:block" style={{ height: 'min(calc(100vh - 200px), 700px)' }}>
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeInUp h-full flex flex-col" 
             style={{ 
               boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)', 
               minHeight: '600px'
             }}>
          
          {/* Header */}
          <div className="p-5 xl:p-8 pb-5 xl:pb-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 2xl:p-3 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
                  <svg className="h-8 w-8 2xl:h-9 2xl:w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl 2xl:text-2xl font-semibold text-gray-900 flex items-center">
                  Membership Status
                  <img src={alcorStar} alt="" className="w-5 h-5 2xl:w-6 2xl:h-6 ml-1" />
                </h2>
              </div>
              
              <span className={`inline-block px-4 py-1 rounded-lg border border-black font-medium flex-shrink-0 ${
                membershipStatus?.isActive ? 'text-green-700 bg-white' : 'text-red-700 bg-white'
              }`}>
                {status}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-4 lg:mt-16">
              <div>
                <h3 className="text-base 2xl:text-lg font-semibold text-gray-900 mb-1">
                  {personalInfo?.firstName} {personalInfo?.lastName}
                </h3>
                <p className="text-xs 2xl:text-sm text-gray-600 flex items-center gap-3">
                  <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                  <span>•</span>
                  <span>{membershipType}</span>
                </p>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex bg-gray-200 rounded-lg p-1">
                {['personal', 'cryo', 'requirements', 'timeline'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`px-4 py-2 rounded-md text-sm transition-all capitalize ${
                      activeSection === section 
                        ? 'bg-white text-gray-900 shadow-sm font-medium' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {section === 'cryo' ? 'Membership' : section.charAt(0).toUpperCase() + section.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8 flex-1 overflow-y-auto">
            {activeSection === 'personal' && renderPersonalInfoSection()}
            {activeSection === 'cryo' && renderCryoSection()}
            {activeSection === 'requirements' && renderRequirementsSection()}
            {activeSection === 'timeline' && renderTimelineSection()}
          </div>
        </div>
      </div>
      
      {/* Mobile View */}
      <div className="sm:hidden px-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
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
              
              <span className={`inline-block px-3 py-1 rounded-lg text-sm border border-black font-medium ${
                membershipStatus?.isActive ? 'text-green-700 bg-white' : 'text-red-700 bg-white'
              }`}>
                {status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {personalInfo?.firstName} {personalInfo?.lastName}
              </h3>
              <p className="text-sm text-gray-600 flex flex-col gap-0.5">
                <span>Member ID: {personalInfo?.alcorId || 'N/A'}</span>
                <span>{membershipType}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-1" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-6 bg-gray-50 border-b border-gray-300">
            <div className="flex items-center gap-3">
              {getSectionIcon('personal')}
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
          </div>
        </div>

        {/* Cryopreservation Details Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-2" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getSectionIcon('cryo')}
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
              <p className="text-sm font-normal text-gray-900">{membershipType}</p>
            </div>
            <div className="px-6 py-4 animate-fadeInUp">
              <p className="text-xs text-gray-500 mb-1">Contract Version</p>
              <div className="flex items-start gap-2">
                <p className="text-sm font-normal text-gray-900">
                  {formatDate(cryoArrangements?.contractDate)}
                </p>
                {needsContractUpdate && (
                  <span className="text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 rounded px-1.5 py-0.5">
                    Update needed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Checklist Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-3" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getSectionIcon('requirements')}
              <h3 className="text-base font-semibold text-gray-900">Membership Requirements</h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {[
              { key: 'hasESignature', label: 'E-Signature Completed', completed: membershipStatus?.hasESignature },
              { key: 'hasAuthorizationConsent', label: 'Authorization Consent', completed: membershipStatus?.hasAuthorizationConsent },
              { key: 'paidInitialDues', label: 'Initial Dues Paid', completed: membershipStatus?.paidInitialDues },
              { key: 'hasProofOfFunding', label: 'Proof of Funding', completed: membershipStatus?.hasProofOfFunding }
            ].map((req) => (
              <div key={req.key} className="px-6 py-6 animate-fadeInUp">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                    req.completed ? 'bg-gradient-to-r from-[#0a1628] to-[#6e4376]' : 'bg-gray-300'
                  }`}>
                    {req.completed ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-normal text-gray-900">{req.label}</p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {req.completed ? 'Complete' : (personalInfo?.alcorId ? 'N/A' : 'Pending')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-3" 
             style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-8 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {getSectionIcon('timeline')}
              <h3 className="text-base font-semibold text-gray-900">Membership Timeline</h3>
            </div>
          </div>
          
          <div className="px-6 py-8">
            {(() => {
              const timelineItems = buildTimelineItems();
              
              return (
                <div className="relative">
                  {timelineItems.length > 1 && (
                    <div className="absolute left-[27px] top-2 bottom-2 w-0.5 bg-gray-300"></div>
                  )}
                  
                  <div className="space-y-6">
                    {timelineItems.map((item, index) => (
                      <div key={index} className="relative flex items-start gap-4 animate-fadeInUp">
                        <div className="w-4 h-4 bg-gradient-to-r from-[#0a1628] to-[#6e4376] rounded-full relative z-10 flex-shrink-0 ml-5"></div>
                        <div>
                          <p className="text-sm font-normal text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(item.dateString)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="h-32"></div>

      {/* Help Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <button
          className="w-16 h-16 bg-[#9f5fa6] hover:bg-[#8a4191] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          onClick={() => setShowHelpPopup(!showHelpPopup)}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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