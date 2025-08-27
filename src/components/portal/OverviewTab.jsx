import React, { useState, useEffect, useRef } from 'react';
import { getContactInfo } from '../../services/contact';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { useUser } from '../../contexts/UserContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import GradientButton from './GradientButton';
import alcorStar from '../../assets/images/alcor-star.png';
import dewarsImage from '../../assets/images/dewars2.jpg';
import podcastImage from '../../assets/images/podcast-image2.png';
import { getContactActivities, formatActivity, filterDuplicateInvoiceActivities } from '../../services/activity';
import analytics from '../../services/analytics';
import WelcomeOverlay from './WelcomeOverlay';
import { backgroundDataLoader } from '../../services/backgroundDataLoader';

const OverviewTab = ({ setActiveTab }) => {
  const { currentUser } = useUser();
  const { 
    salesforceContactId,
    customerFirstName, 
    isPreloading, 
    announcements = [], 
    mediaItems = [], 
    contentLoaded,
    refreshContent,
    lastRefresh,
    salesforceCustomer
  } = useMemberPortal();
  const [userName, setUserName] = useState(customerFirstName || '');
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Recent activities state
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(null);

  // Refs for scroll animations
  const quickActionsRef = useRef(null);
  const announcementsRef = useRef(null);
  const newslettersRef = useRef(null);
  const recentActivityRef = useRef(null);

  const [showWelcome, setShowWelcome] = useState(false);

  // Track page view when salesforceContactId is available
  useEffect(() => {
    if (salesforceContactId) {
      analytics.logUserAction('overview_tab_viewed', {
        timestamp: new Date().toISOString()
      });
    }
  }, [salesforceContactId]);

  // Helper function to format notification time
  const formatNotificationTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (salesforceContactId && !profileLoading && userName) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [salesforceContactId, profileLoading, userName]);

  useEffect(() => {
    if (customerFirstName) {
      setUserName(customerFirstName);
    }
  }, [customerFirstName]);

  // Helper function to clean activity text
  const cleanActivityText = (text) => {
    if (!text) return text;
    // Remove duplicate dollar signs (e.g., $15.00 $USD becomes $15.00 USD)
    return text
      .replace(/\$\$+/g, '$')  // Replace multiple $ with single $
      .replace(/\$\s*USD/g, 'USD')  // Remove $ before USD
      .replace(/\$\s*INV/g, 'INV');  // Remove $ before INV
  };

  // Fetch user name - now using profile data as primary source
  useEffect(() => {
    const fetchUserName = async () => {
      if (userName) {
        return;
      }

      if (profileData?.personalInfo?.firstName) {
        console.log('✅ [OverviewTab] Using firstName from profile data:', profileData.personalInfo.firstName);
        setUserName(profileData.personalInfo.firstName);
        setLoading(false);
        return;
      }

      if (currentUser) {
        try {
          console.log('📞 [OverviewTab] Calling getContactInfo()...');
          const response = await getContactInfo();
          console.log('📦 [OverviewTab] getContactInfo response:', response);
          
          if (response.success && response.contactInfo?.firstName) {
            console.log('✅ [OverviewTab] Found firstName in contactInfo:', response.contactInfo.firstName);
            setUserName(response.contactInfo.firstName);
          } else {
            console.warn('⚠️ [OverviewTab] No valid contactInfo, will wait for profile data');
          }
        } catch (error) {
          console.error('❌ [OverviewTab] Error fetching contact info:', error);
        }
      }
      
      setLoading(false);
    };

    fetchUserName();
  }, [currentUser, profileData, userName]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (salesforceContactId && !isPreloading) {
        try {
          setProfileLoading(true);
          console.log('📞 [OverviewTab] Calling getMemberProfile with ID:', salesforceContactId);
          const result = await getMemberProfile(salesforceContactId);
          console.log('📦 [OverviewTab] getMemberProfile result:', result);
          
          if (result.success && result.data) {
            const profileInfo = result.data.data || result.data;
            console.log('✅ [OverviewTab] Profile data received:', profileInfo);
            setProfileData(profileInfo);
            
            if (!userName && profileInfo.personalInfo?.firstName) {
              console.log('🔄 [OverviewTab] Setting userName from profile data:', profileInfo.personalInfo.firstName);
              setUserName(profileInfo.personalInfo.firstName);
            }
          }
        } catch (error) {
          console.error('❌ [OverviewTab] Error fetching profile data:', error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [salesforceContactId, isPreloading]);

  // Fetch recent activities - FILTERED FOR CHANGES ONLY
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!currentUser || isPreloading || !salesforceContactId) {
        setActivitiesLoading(false);
        return;
      }

      try {
        setActivitiesLoading(true);
        setActivitiesError(null);
        
        console.log('📊 [OverviewTab] Fetching recent activities for Salesforce ID:', salesforceContactId);
        
        const activities = await getContactActivities(100, null, salesforceContactId);
        const formattedActivities = activities.map(formatActivity);
        const filteredActivities = filterDuplicateInvoiceActivities(formattedActivities);
        
        const changeActivities = filteredActivities.filter(activity => {
          const activityText = (activity.displayText || activity.activity || '').toLowerCase();
          
          const viewKeywords = ['viewed', 'accessed', 'opened', 'visited', 'looked at', 'checked', 'reviewed page'];
          const isViewOnly = viewKeywords.some(keyword => activityText.includes(keyword));
          
          const changeKeywords = ['updated', 'changed', 'modified', 'created', 'added', 'deleted', 'removed', 
                                 'submitted', 'uploaded', 'downloaded', 'edited', 'saved', 'completed', 
                                 'signed', 'paid', 'processed', 'enrolled', 'cancelled', 'renewed'];
          const isChange = changeKeywords.some(keyword => activityText.includes(keyword));
          
          return !isViewOnly && (isChange || activityText.length > 0);
        }).map(activity => ({
          ...activity,
          displayText: cleanActivityText(activity.displayText),
          activity: cleanActivityText(activity.activity)
        }));
        
        console.log('✅ [OverviewTab] Activities loaded:', {
          raw: formattedActivities.length,
          filtered: filteredActivities.length,
          changeOnly: changeActivities.length
        });
        
        setRecentActivities(changeActivities.slice(0, 5));
        
      } catch (error) {
        console.error('❌ [OverviewTab] Error fetching activities:', error);
        setActivitiesError('Unable to load recent activities');
        setRecentActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchRecentActivities();
  }, [currentUser, isPreloading, salesforceContactId]);

  // Add Helvetica font and animations styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .overview-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .overview-tab .font-bold,
      .overview-tab .font-semibold {
        font-weight: 500 !important;
      }
      .overview-tab .font-bold {
        font-weight: 700 !important;
      }
      .overview-tab h1 {
        font-weight: 300 !important;
      }
      .overview-tab h2,
      .overview-tab h3,
      .overview-tab h4 {
        font-weight: 400 !important;
      }
      .overview-tab .font-medium {
        font-weight: 400 !important;
      }
      .overview-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .overview-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .overview-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .overview-tab .slide-in-delay-2 {
        animation: slideIn 0.6s ease-out 0.2s both;
      }
      .overview-tab .stagger-in > * {
        opacity: 0;
        animation: slideIn 0.5s ease-out forwards;
      }
      .overview-tab .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .overview-tab .stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .overview-tab .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .overview-tab .stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      
      /* Scroll-triggered animations */
      .overview-tab .scroll-fade-in {
        opacity: 0;
        transition: opacity 1s ease-out;
      }
      .overview-tab .scroll-fade-in.visible {
        opacity: 1;
      }
      .overview-tab .scroll-slide-up {
        opacity: 0;
        transform: translateY(15px);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .overview-tab .scroll-slide-up.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Set up intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-fade-in, .scroll-slide-up');
    elements.forEach(el => {
      if (el.id) observer.observe(el);
    });

    return () => {
      elements.forEach(el => {
        if (el.id) observer.unobserve(el);
      });
    };
  }, []);

  // Activity icon gradient styles
  const getActivityIconStyle = (category) => {
    const iconStyles = {
      profile: "bg-gradient-to-br from-[#1a3552] via-[#13283f] to-[#0a1825] border-2 border-[#3B82F6]",
      documents: "bg-gradient-to-br from-[#244060] via-[#1a2f4a] to-[#111f33] border-2 border-[#60A5FA]",
      financial: "bg-gradient-to-br from-[#2f476b] via-[#243655] to-[#192540] border-2 border-[#818CF8]",
      membership: "bg-gradient-to-br from-[#3a4f78] via-[#2e3d60] to-[#202b48] border-2 border-[#A78BFA]",
      communication: "bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC]",
      medical: "bg-gradient-to-br from-[#665a85] via-[#52476b] to-[#3e3551] border-2 border-[#E879F9]",
      legal: "bg-gradient-to-br from-[#7a638f] via-[#644e76] to-[#4c395d] border-2 border-[#F472B6]",
      system: "bg-gradient-to-br from-[#876b93] via-[#705579] to-[#57405f] border-2 border-[#FB7185]"
    };
    return iconStyles[category] || iconStyles.system;
  };

  // Get SVG icon for activity type
  const getActivityIcon = (category) => {
    switch(category) {
      case 'profile':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        );
      case 'documents':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
      case 'financial':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5h-15A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 19.5z" />
          </svg>
        );
      case 'membership':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
    }
  };

  // Loading skeleton component
  const ContentSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  // Default announcement images if none provided
  const getAnnouncementImage = (announcement, index) => {
    if (announcement.imageUrl) return announcement.imageUrl;
    // Use dewars image as fallback, alternating with podcast image
    return index % 2 === 0 ? dewarsImage : podcastImage;
  };

  return (
    <div className="overview-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Main Welcome Section - Matching InformationDocumentsTab style */}
      <div className="bg-white shadow-sm rounded-[1.25rem] overflow-hidden slide-in" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        {/* Content area with icon, welcome text and dewars image */}
        <div className="p-8 2xl:p-10 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left side - Icon, Welcome text and button */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 2xl:p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                  <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl 2xl:text-2xl font-semibold text-gray-900">Welcome{userName ? `, ${userName}` : ''}!</h3>
              </div>
              <p className="text-gray-700 text-sm 2xl:text-base leading-relaxed font-normal mb-6">
                Access your membership settings, documents, and resources all in one place. Your membership portal provides everything you need to manage your Alcor membership and stay informed about the latest developments.
              </p>
              <GradientButton 
                onClick={() => {
                  console.log('🔄 [OverviewTab] Navigating to membership status tab');
                  
                  if (salesforceContactId) {
                    analytics.logUserAction('membership_status_button_clicked', {
                      from: 'overview_tab'
                    });
                  }
                  
                  if (setActiveTab) {
                    setActiveTab('membership-status');
                  } else {
                    console.error('❌ [OverviewTab] setActiveTab function not provided');
                  }
                }}
                variant="outline"
                size="sm"
                className="border-[#12243c] text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white"
              >
                View Membership Status
              </GradientButton>
            </div>
            
            {/* Right side - Dewars image with podcast overlay - slightly less wide */}
            {mediaItems.filter(item => item.type === 'podcast').length > 0 && (
              <div className="relative w-full lg:w-[420px] 2xl:w-[480px] h-40 2xl:h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                <img 
                  src={dewarsImage}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: 'grayscale(0.2)' }}
                />
                
                {/* Dark purple/blue overlay base */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'rgba(26, 18, 47, 0.7)'
                  }}
                />
                
                {/* Radial yellow glow from bottom */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse 120% 80% at 50% 120%, rgba(255, 215, 0, 0.8) 0%, rgba(255, 184, 0, 0.6) 20%, rgba(255, 140, 0, 0.4) 40%, transparent 70%)'
                  }}
                />
                
                {/* Purple/pink glow overlay */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(147, 51, 234, 0.3) 0%, rgba(109, 40, 217, 0.4) 30%, transparent 60%)',
                    mixBlendMode: 'screen'
                  }}
                />
                
                {/* Star decoration */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-center" style={{ height: '150%' }}>
                  <img 
                    src={alcorStar} 
                    alt="" 
                    className="w-24 h-24 opacity-40"
                    style={{
                      filter: 'brightness(2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
                      transform: 'translateY(50%)'
                    }}
                  />
                </div>
                
                {/* Podcast content overlay - centered in the space */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="bg-white/15 backdrop-blur-sm rounded p-3 border border-white/20 w-full max-w-[380px]">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white text-xs font-semibold drop-shadow">LATEST MEDIA</h3>
                      <img src={alcorStar} alt="Alcor Star" className="w-3 h-3" />
                    </div>
                    {(() => {
                      const latestPodcast = mediaItems.find(item => item.type === 'podcast');
                      if (!latestPodcast) return null;
                      
                      return (
                        <div className="flex items-start gap-3">
                          <img 
                            src={podcastImage} 
                            alt={latestPodcast.title}
                            className="w-16 h-12 object-cover rounded flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-white/25 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                                PODCAST
                              </span>
                              <span className="text-xs text-white/70">
                                {formatNotificationTime(latestPodcast.publishDate)}
                              </span>
                            </div>
                            <h4 className="text-xs font-light text-white line-clamp-2 mb-1 drop-shadow">
                              {latestPodcast.title}
                            </h4>
                            {latestPodcast.link && (
                              <a 
                                href={latestPodcast.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-white/90 hover:text-white transition-colors font-medium inline-block"
                              >
                                LISTEN NOW →
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Announcements Section - Only showing 2 announcements with images */}
        <div className="p-6 2xl:p-8">
          <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900 mb-6">Latest Announcements</h3>
          {!contentLoaded && announcements.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ContentSkeleton />
              <ContentSkeleton />
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
              {announcements.slice(0, 2).map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all cursor-pointer flex gap-4"
                  onClick={() => {
                    if (salesforceContactId) {
                      analytics.logUserAction('announcement_clicked', {
                        announcementId: announcement.id,
                        announcementTitle: announcement.title
                      });
                    }
                    
                    if (announcement.link) {
                      window.open(announcement.link, '_blank');
                    }
                  }}
                >
                  {/* Announcement image thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden">
                      <img 
                        src={getAnnouncementImage(announcement, index)}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Announcement content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-900 mb-1">
                          {announcement.title}
                        </h4>
                        {announcement.subtitle && (
                          <p className="text-sm text-gray-600 mb-2 font-normal">{announcement.subtitle}</p>
                        )}
                        <p className="text-sm text-gray-700 mb-3 font-normal line-clamp-2">
                          {announcement.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {announcement.eventDate && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {announcement.eventDate}
                            </span>
                          )}
                          {announcement.eventTime && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {announcement.eventTime}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {announcement.link && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(announcement.link, '_blank');
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 flex-shrink-0"
                        >
                          <span>Learn More</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No announcements at this time</p>
              <p className="text-gray-400 text-sm">Check back later for updates</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="py-8">
        <div className="h-[0.5px] mx-8 rounded-full opacity-60" style={{ 
          background: 'linear-gradient(90deg, transparent 0%, #4a5f7a 15%, #5a4f7a 40%, #7a5f8a 60%, #9e7398 85%, transparent 100%)' 
        }}></div>
      </div>

      {/* Member Newsletter Section - Matching document box style */}
      <div className={`bg-white shadow-sm border border-gray-200 rounded-[1.25rem] scroll-slide-up ${visibleSections.has('newsletters-section') ? 'visible' : ''}`} id="newsletters-section" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        {/* Section Header */}
        <div className="p-8 2xl:p-10 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 2xl:p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
              <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900">Member Newsletters</h3>
          </div>
          <p className="text-gray-700 text-sm 2xl:text-base leading-relaxed max-w-xl font-normal">
            Stay informed with the latest Alcor newsletters, research updates, and member communications.
          </p>
        </div>

        {/* Newsletters Grid */}
        <div className="p-6 2xl:p-8">
          {!contentLoaded && mediaItems.filter(item => item.type === 'newsletter').length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ContentSkeleton />
              <ContentSkeleton />
              <ContentSkeleton />
            </div>
          ) : mediaItems.filter(item => item.type === 'newsletter').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
              {mediaItems
                .filter(item => item.type === 'newsletter')
                .slice(0, 6)
                .map((newsletter, index) => (
                  <div
                    key={newsletter.id}
                    className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all cursor-pointer flex gap-4"
                    onClick={() => {
                      if (salesforceContactId) {
                        analytics.logUserAction('newsletter_clicked', {
                          newsletterId: newsletter.id,
                          newsletterTitle: newsletter.title
                        });
                      }
                      
                      if (newsletter.link) {
                        window.open(newsletter.link, '_blank');
                      }
                    }}
                  >
                    {/* Small newsletter image thumbnail */}
                    {newsletter.imageUrl && (
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img 
                            src={newsletter.imageUrl}
                            alt={newsletter.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Newsletter content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        {newsletter.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">
                        {newsletter.publishDate ? new Date(newsletter.publishDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : ''}
                      </p>
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2 font-normal">
                        {newsletter.description}
                      </p>
                      <button className="text-[#d09163] hover:text-[#b87a52] font-medium text-sm transition-colors flex items-center gap-2 underline underline-offset-4">
                        Read Newsletter
                        <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No newsletters available</p>
              <p className="text-gray-400 text-sm">Check back later for new content</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="py-8">
        <div className="h-[0.5px] mx-8 rounded-full opacity-60" style={{ 
          background: 'linear-gradient(90deg, transparent 0%, #4a5f7a 15%, #5a4f7a 40%, #7a5f8a 60%, #9e7398 85%, transparent 100%)' 
        }}></div>
      </div>

      {/* Recent Activity Section - Matching document box style */}
      <div className={`bg-white shadow-sm border border-gray-200 rounded-[1.25rem] scroll-slide-up ${visibleSections.has('recent-activity-section') ? 'visible' : ''}`} id="recent-activity-section" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        {/* Section Header */}
        <div className="p-8 2xl:p-10 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 2xl:p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
              <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900">Recent Changes</h3>
          </div>
          <p className="text-gray-700 text-sm 2xl:text-base leading-relaxed max-w-xl font-normal">
            Track your recent updates and changes to your membership information.
          </p>
        </div>

        {/* Activities List */}
        <div className="p-6 2xl:p-8">
          {activitiesLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activitiesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 font-medium">{activitiesError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 text-sm text-red-500 hover:text-red-700 underline"
              >
                Try Again
              </button>
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4 stagger-in">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Activity icon with gradient styling */}
                    <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl transform transition duration-300 ${getActivityIconStyle(activity.category)}`}
                    >
                      {getActivityIcon(activity.category)}
                    </div>
                    
                    {/* Activity details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#2a2346] font-medium text-base">
                        {activity.displayText || activity.activity}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {activity.relativeTime}
                      </p>
                    </div>
                    
                    {/* Arrow icon */}
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No recent changes</p>
              <p className="text-sm text-gray-400">
                Your changes will appear here as you update your information
              </p>
            </div>
          )}
          
          {/* Activity summary stats */}
          {recentActivities.length > 0 && !activitiesLoading && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                <p className="text-2xl font-semibold text-[#1e2951]">
                  {recentActivities.filter(a => a.category === 'profile').length}
                </p>
                <p className="text-sm text-[#1e2951] mt-1">Profile Updates</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                <p className="text-2xl font-semibold text-[#1e2951]">
                  {recentActivities.filter(a => a.category === 'documents').length}
                </p>
                <p className="text-sm text-[#1e2951] mt-1">Document Changes</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-300">
                <p className="text-2xl font-semibold text-[#1e2951]">
                  {recentActivities.filter(a => a.category === 'financial').length}
                </p>
                <p className="text-sm text-[#1e2951] mt-1">Financial Updates</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add padding at the end */}
      <div className="h-24 sm:h-32"></div>
      
      {/* Welcome Overlay */}
      <WelcomeOverlay />
    </div>
  );
};

export default OverviewTab;