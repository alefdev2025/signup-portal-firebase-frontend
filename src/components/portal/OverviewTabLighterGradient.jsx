import React, { useState, useEffect, useRef } from 'react';
import { getContactInfo } from '../../services/contact';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { useUser } from '../../contexts/UserContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import GradientButton from './GradientButton';
import { bannerStyles, fadeInAnimation } from './OverviewBannerStyles';
import alcorStar from '../../assets/images/alcor-star.png';
import dewarsImage from '../../assets/images/dewars2.jpg';
import podcastImage from '../../assets/images/podcast-image2.png';
import sunsetIllustration from '../../assets/images/sunset-illustration.jpg';
import { getActivities, formatActivity } from '../../services/activity';

// Global toggle for Quick Actions colors
const USE_GRADIENT_COLORS = true;

const OverviewTab = ({ setActiveTab }) => {
  const { currentUser } = useUser();
  const { 
    salesforceContactId, 
    isPreloading, 
    announcements = [], 
    mediaItems = [], 
    contentLoaded,
    refreshContent,
    lastRefresh,
    salesforceCustomer
  } = useMemberPortal();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Recent activities state
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Refs for scroll animations
  const quickActionsRef = useRef(null);
  const announcementsRef = useRef(null);
  const newslettersRef = useRef(null);
  const recentActivityRef = useRef(null);

  const [showWelcome, setShowWelcome] = useState(false);

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

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshContent();
      console.log('✅ [OverviewTab] Manual refresh completed');
    } catch (error) {
      console.error('❌ [OverviewTab] Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (salesforceContactId && !profileLoading && userName && userName !== '0031I00000tRcNZ') {
      // Delay showing the welcome message
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 300); // Adjust delay as needed
      
      return () => clearTimeout(timer);
    }
  }, [salesforceContactId, profileLoading, userName]);

  // Fetch user name - now using profile data as primary source
  useEffect(() => {
    const fetchUserName = async () => {
      // If we already have a valid userName, skip
      if (userName && userName !== '0031I00000tRcNZ') {
        return;
      }

      // First try to get from profile data if available
      if (profileData?.personalInfo?.firstName) {
        console.log('✅ [OverviewTab] Using firstName from profile data:', profileData.personalInfo.firstName);
        setUserName(profileData.personalInfo.firstName);
        setLoading(false);
        return;
      }

      // Then try getContactInfo if we have currentUser
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
            
            // Set userName from profile data if not already set
            if ((!userName || userName === '0031I00000tRcNZ') && profileInfo.personalInfo?.firstName) {
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
  }, [salesforceContactId, isPreloading, userName]);
  
  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (salesforceContactId && !isPreloading) {
        try {
          setActivitiesLoading(true);
          console.log('📊 [OverviewTab] Fetching recent activities for:', salesforceContactId);
          
          // Get last 5 activities
          const activities = await getActivities(5, salesforceContactId);
          
          // Format activities for display
          const formattedActivities = activities.map(formatActivity);
          console.log('✅ [OverviewTab] Activities fetched:', formattedActivities.length);
          
          setRecentActivities(formattedActivities);
        } catch (error) {
          console.error('❌ [OverviewTab] Error fetching activities:', error);
          setRecentActivities([]);
        } finally {
          setActivitiesLoading(false);
        }
      } else {
        setActivitiesLoading(false);
      }
    };

    fetchRecentActivities();
  }, [salesforceContactId, isPreloading]);

  // Content logging effect
  useEffect(() => {
    console.log('OverviewTab received content from context:', {
      announcements: announcements?.length || 0,
      media: mediaItems?.length || 0,
      contentLoaded,
      lastRefresh: lastRefresh?.toLocaleTimeString()
    });
  }, [announcements, mediaItems, contentLoaded, lastRefresh]);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const delayedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.3 }
    );

    // Quick actions and recent activity use regular observer
    if (quickActionsRef.current) observer.observe(quickActionsRef.current);
    if (recentActivityRef.current) observer.observe(recentActivityRef.current);
    
    // Announcements and newsletters need more scroll
    if (announcementsRef.current) delayedObserver.observe(announcementsRef.current);
    if (newslettersRef.current) delayedObserver.observe(newslettersRef.current);

    return () => {
      if (quickActionsRef.current) observer.unobserve(quickActionsRef.current);
      if (recentActivityRef.current) observer.unobserve(recentActivityRef.current);
      if (announcementsRef.current) delayedObserver.unobserve(announcementsRef.current);
      if (newslettersRef.current) delayedObserver.unobserve(newslettersRef.current);
    };
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .overview-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .overview-tab .font-bold,
      .overview-tab .font-semibold,
      .overview-tab h1, 
      .overview-tab h2, 
      .overview-tab h3, 
      .overview-tab h4 {
        font-weight: 700 !important;
      }
      .overview-tab .font-medium {
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Quick Actions color configuration
  const originalColor = '#6f2d74';
  const gradients = {
    account: 'linear-gradient(to right, #b8a2d4, #b19bcd, #aa94c6, #a38dbf, #9c86b8)',
    membership: 'linear-gradient(to right, #9c86b8, #957fb1, #8e78aa, #8771a3, #806a9c)',
    payments: 'linear-gradient(to right, #806a9c, #796395, #725c8e, #6b5587, #644e80)',
    support: 'linear-gradient(to right, #644e80, #5d4779, #564072, #4f396b, #483264)'
  };

  return (
    <div className="overview-tab relative -mx-6 md:-mx-8 lg:-mx-12 -mt-6">
      {/* Fixed Background with Dewars Image */}
      <div className="fixed inset-0 z-0">
        {/* Dewars image layer */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${dewarsImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* UPDATED: Dark navy overlay in top left, fading to colors and transparency in bottom right */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                135deg,
                rgba(10, 25, 47, 1.0) 0%,          /* dark navy - completely solid in top left */
                rgba(10, 25, 47, 1.0) 15%,         /* still dark navy */
                rgba(15, 30, 55, 0.98) 25%,        /* very slightly lighter */
                rgba(25, 40, 70, 0.90) 40%,        /* gradually lighter */
                rgba(100, 80, 150, 0.70) 55%,      /* purple transition */
                rgba(255, 200, 150, 0.50) 70%,     /* peachy transition */
                rgba(255, 183, 0, 0.35) 80%,       /* orange - more transparent */
                rgba(255, 234, 0, 0.20) 90%,       /* golden yellow */
                transparent 100%                    /* fully transparent in corner */
              )
            `
          }}
        />
        
        {/* Original gradient overlay - MUCH LIGHTER to let white show through */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                ellipse at bottom right,
                transparent 0%,
                rgba(10, 22, 40, 0.05) 20%,
                rgba(10, 22, 40, 0.10) 40%,
                rgba(10, 22, 40, 0.15) 60%,
                rgba(10, 22, 40, 0.20) 80%,
                rgba(10, 22, 40, 0.25) 100%
              )
            `,
            mixBlendMode: 'multiply'
          }}
        />
      </div>

      {/* Scrollable Content Container - Full width */}
      <div className="relative z-10 px-6 md:px-8 lg:px-12 pb-24 pl-8 md:pl-10 lg:pl-14">
        {/* Hero Banner - Transparent with white text */}
        <div className="relative mb-12 animate-fadeIn pt-24">
          <style>{fadeInAnimation}</style>
          
          <div className="relative z-10">
            {/* Welcome message */}
            <div className="max-w-4xl">
              <h1 
                className="font-semibold text-white mb-5 drop-shadow-lg tracking-tight"
                style={{ 
                  fontSize: '2.25rem',
                  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important",
                  opacity: (!salesforceContactId || profileLoading || !userName || userName === '0031I00000tRcNZ') ? 0 : 1,
                  transition: 'opacity 0.5s ease-in-out',
                  transitionDelay: '0.3s'
                }}
              >
                <span className="text-white/90">Welcome</span>
                <span className="text-white">, {userName}!</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 drop-shadow max-w-2xl">
                Access your membership settings, documents, and resources all in one place.
              </p>
              <GradientButton 
                onClick={() => {
                  console.log('🔄 [OverviewTab] Navigating to membership status tab');
                  if (setActiveTab) {
                    setActiveTab('membership-status');
                  } else {
                    console.error('❌ [OverviewTab] setActiveTab function not provided');
                  }
                }}
                variant="outline"
                size="md"
                className="border-white/30 text-white hover:bg-white/10"
              >
                View Membership Status
              </GradientButton>
            </div>
          </div>
        </div>

        {/* Quick Actions - Transparent background with glass effect */}
        <div ref={quickActionsRef} id="quickActions" className="mb-16">
          <h2 className={`text-2xl font-semibold text-white mb-8 transition-all duration-800 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div 
              className={`bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 border border-white/20 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '100ms' }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
                style={{ 
                  background: USE_GRADIENT_COLORS ? gradients.account : originalColor 
                }}
              >
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-lg text-white mb-1">Account</h3>
              <p className="text-sm text-white/70 font-normal">Manage your profile and preferences</p>
            </div>
            
            <div 
              className={`bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 border border-white/20 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
                style={{ 
                  background: USE_GRADIENT_COLORS ? gradients.membership : originalColor 
                }}
              >
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h3 className="font-medium text-lg text-white mb-1">Membership</h3>
              <p className="text-sm text-white/70 font-normal">Check your membership details</p>
            </div>
            
            <div 
              className={`bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 border border-white/20 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
                style={{ 
                  background: USE_GRADIENT_COLORS ? gradients.payments : originalColor 
                }}
              >
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h3 className="font-medium text-lg text-white mb-1">Payments</h3>
              <p className="text-sm text-white/70 font-normal">Review recent transactions</p>
            </div>
            
            <div 
              className={`bg-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 rounded-lg p-6 transition-all cursor-pointer group duration-300 border border-white/20 ${visibleSections.has('quickActions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '400ms' }}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
                style={{ 
                  background: USE_GRADIENT_COLORS ? gradients.support : originalColor 
                }}
              >
                <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-medium text-lg text-white mb-1">Support</h3>
              <p className="text-sm text-white/70 font-normal">Get help when you need it</p>
            </div>
          </div>
        </div>

        {/* Announcements Section - Seamless integration */}
        <div ref={announcementsRef} id="announcements" className="mb-16">
          <h2 className={`text-2xl font-semibold text-white mb-10 transition-all duration-1000 ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Announcements
          </h2>
          {!contentLoaded && announcements.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ContentSkeleton />
              <ContentSkeleton />
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {announcements.slice(0, 2).map((announcement, index) => (
                <div 
                  key={announcement.id}
                  className={`bg-white rounded overflow-hidden shadow-md hover:shadow-xl transition-all duration-1000 cursor-pointer ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${200 + (index * 200)}ms` }}
                  onClick={() => {
                    if (announcement.link) {
                      window.open(announcement.link, '_blank');
                    }
                  }}
                >
                  <div className="relative h-64 overflow-hidden">
                    {announcement.imageUrl ? (
                      <img 
                        src={announcement.imageUrl}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                        <div className="text-white text-center">
                          <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                          <p className="text-sm opacity-75">Announcement</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                      <h3 className="text-2xl font-medium mb-2">{announcement.title}</h3>
                      {announcement.subtitle && (
                        <p className="text-lg mb-3 text-white/90">{announcement.subtitle}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        {announcement.eventDate && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {announcement.eventDate}
                          </span>
                        )}
                        {announcement.eventTime && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {announcement.eventTime}
                          </span>
                        )}
                        {announcement.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {announcement.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <p className="text-gray-600 mb-4">{announcement.description}</p>
                    {announcement.link && (
                      <a 
                        href={announcement.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#6b5b7e] hover:text-[#4a4266] font-medium transition-colors inline-flex items-center gap-2 underline underline-offset-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Learn More
                        <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
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

        {/* Member Newsletter Section - Seamless integration */}
        <div ref={newslettersRef} id="newsletters" className="mb-16">
          <h2 className={`text-2xl font-semibold text-white mb-10 transition-all duration-800 ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Member Newsletters
          </h2>
          {!contentLoaded && mediaItems.filter(item => item.type === 'newsletter').length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContentSkeleton />
              <ContentSkeleton />
              <ContentSkeleton />
            </div>
          ) : mediaItems.filter(item => item.type === 'newsletter').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaItems
                .filter(item => item.type === 'newsletter')
                .slice(0, 3)
                .map((newsletter, index) => (
                  <div 
                    key={newsletter.id}
                    className={`bg-white rounded overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 cursor-pointer ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                    onClick={() => {
                      if (newsletter.link) {
                        window.open(newsletter.link, '_blank');
                      }
                    }}
                  >
                    <div className="relative h-64 overflow-hidden">
                      {newsletter.imageUrl ? (
                        <img 
                          src={newsletter.imageUrl}
                          alt={newsletter.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <h3 className="text-xl font-medium mb-1">{newsletter.title}</h3>
                        <p className="text-sm opacity-90">
                          {newsletter.publishDate ? new Date(newsletter.publishDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : ''}
                        </p>
                      </div>
                    </div>
                    <div className="p-6 bg-white">
                      <p className="text-gray-600 mb-4 line-clamp-2">{newsletter.description}</p>
                      <button className="text-[#d09163] hover:text-[#b87a52] font-medium transition-colors flex items-center gap-2 underline underline-offset-4">
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

        {/* Recent Activity - Seamless integration */}
        <div ref={recentActivityRef} id="recentActivity" className="mb-20">
          <h2 className={`text-2xl font-semibold text-white mb-4 transition-all duration-800 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>Recent Activity</h2>
          <div className="space-y-4">
            {activitiesLoading ? (
              // Loading skeleton for activities
              <>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-5 animate-pulse">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-lg bg-white/20"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-5 animate-pulse">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-lg bg-white/20"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/20 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              </>
            ) : recentActivities.length > 0 ? (
              // Display activities
              recentActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-5 flex items-center gap-6 hover:bg-white/20 transition-all duration-700 ${visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} 
                  style={{ transitionDelay: `${100 + (index * 100)}ms` }}
                >
                  <div 
                    className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: USE_GRADIENT_COLORS 
                        ? 'linear-gradient(135deg, #b8a2d4 0%, #6f2d74 100%)' 
                        : '#6f2d74' 
                    }}
                  >
                    <span className="text-2xl">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.displayText}</p>
                    <p className="text-sm text-white/70">{activity.relativeTime}</p>
                  </div>
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))
            ) : (
              // No activities message
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 text-center border border-white/20">
                <svg className="w-12 h-12 text-white/60 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white">No recent activity</p>
                <p className="text-sm text-white/60 mt-1">Your activities will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;