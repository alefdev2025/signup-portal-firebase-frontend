import React, { useState, useEffect, useRef } from 'react';
import { getContactInfo } from '../../services/contact';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { useUser } from '../../contexts/UserContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import GradientButton from './GradientButton';
import { bannerStyles, fadeInAnimation } from './OverviewBannerStyles';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';
import dewarsImage from '../../assets/images/dewars2.jpg';
import podcastImage from '../../assets/images/podcast-image2.png';
import { getContactActivities, formatActivity, filterDuplicateInvoiceActivities } from '../../services/activity';
import analytics from '../../services/analytics';
import WelcomeOverlay from './WelcomeOverlay';
import { backgroundDataLoader } from '../../services/backgroundDataLoader';

// Global toggle for Quick Actions colors
const USE_GRADIENT_COLORS = true;

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
   if (salesforceContactId && !profileLoading && userName) {
     // Delay showing the welcome message
     const timer = setTimeout(() => {
       setShowWelcome(true);
     }, 300); // Adjust delay as needed
     
     return () => clearTimeout(timer);
   }
 }, [salesforceContactId, profileLoading, userName]);

 useEffect(() => {
  if (customerFirstName) {
    setUserName(customerFirstName);
  }
}, [customerFirstName]);

 // Fetch user name - now using profile data as primary source
 useEffect(() => {
   const fetchUserName = async () => {
     // If we already have a valid userName, skip
     if (userName) {
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
     // Only fetch if user is authenticated and we have Salesforce ID
     if (!currentUser || isPreloading || !salesforceContactId) {
       setActivitiesLoading(false);
       return;
     }

     try {
       setActivitiesLoading(true);
       setActivitiesError(null);
       
       console.log('📊 [OverviewTab] Fetching recent activities for Salesforce ID:', salesforceContactId);
       
       // Fetch more activities to account for filtering
       const activities = await getContactActivities(100, null, salesforceContactId);
       
       // Format activities for display
       const formattedActivities = activities.map(formatActivity);
       
       // Apply filtering to remove duplicate invoice/payment activities
       const filteredActivities = filterDuplicateInvoiceActivities(formattedActivities);
       
       // ADDITIONAL FILTER: Only show activities that represent changes, not views
       const changeActivities = filteredActivities.filter(activity => {
         const activityText = (activity.displayText || activity.activity || '').toLowerCase();
         
         // Exclude view-only activities
         const viewKeywords = ['viewed', 'accessed', 'opened', 'visited', 'looked at', 'checked', 'reviewed page'];
         const isViewOnly = viewKeywords.some(keyword => activityText.includes(keyword));
         
         // Include change activities
         const changeKeywords = ['updated', 'changed', 'modified', 'created', 'added', 'deleted', 'removed', 
                                'submitted', 'uploaded', 'downloaded', 'edited', 'saved', 'completed', 
                                'signed', 'paid', 'processed', 'enrolled', 'cancelled', 'renewed'];
         const isChange = changeKeywords.some(keyword => activityText.includes(keyword));
         
         // If it's explicitly a view activity, exclude it
         // If it's explicitly a change activity, include it
         // If unclear, default to excluding (conservative approach)
         return !isViewOnly && (isChange || activityText.length > 0);
       });
       
       console.log('✅ [OverviewTab] Activities loaded:', {
         raw: formattedActivities.length,
         filtered: filteredActivities.length,
         changeOnly: changeActivities.length
       });
       
       // Only take the first 5 after all filtering
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
     }
     .overview-tab .font-thin {
       font-weight: 100 !important;
     }
     .overview-tab .font-extralight {
       font-weight: 200 !important;
     }
     .overview-tab .font-light {
       font-weight: 300 !important;
     }
     .overview-tab .font-normal {
       font-weight: 400 !important;
     }
     .overview-tab .font-medium {
       font-weight: 500 !important;
     }
     .overview-tab .font-semibold {
       font-weight: 600 !important;
     }
     .overview-tab .font-bold,
     .overview-tab h1, 
     .overview-tab h2, 
     .overview-tab h3, 
     .overview-tab h4 {
       font-weight: 700 !important;
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

 // Activity icon gradient styles matching styleConfig2
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
     case 'communication':
       return (
         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
         </svg>
       );
     case 'medical':
       return (
         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m7.5 3.75a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
       );
     case 'legal':
       return (
         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
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

 return (
   <div className="overview-tab -mt-4 pt-6 px-2 sm:px-6 md:px-8 lg:px-12">
     {/* Hero Banner - Updated with gradient overlays and reduced height */}
     <div 
       className="relative rounded-xl overflow-hidden mb-12 animate-fadeIn"
       style={{ height: '200px' }} // Reduced from ~400px to 200px
     >
       <style jsx>{fadeInAnimation}</style>
       
       {/* Background Image */}
       <img 
         src={dewarsImage}
         alt=""
         className="absolute inset-0 w-full h-full object-cover"
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
           className="w-32 h-32 opacity-40"
           style={{
             filter: 'brightness(2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
             transform: 'translateY(50%)'
           }}
         />
       </div>
       
       {/* Content */}
       <div className="relative z-10 px-8 py-4 h-full flex items-center">
         <div className="flex items-center gap-12 w-full">
           {/* Welcome message */}
           <div className="flex-1">
             <h1 
               className="font-medium text-white mb-2 drop-shadow-lg tracking-tight"
               style={{ 
                 fontSize: '1.5rem',
                 fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif !important",
                 opacity: (!salesforceContactId || profileLoading || !userName) ? 0 : 1,
                 transition: 'opacity 0.5s ease-in-out',
                 transitionDelay: '0.3s'
               }}
             >
               <span className="text-white/90">Welcome</span>
               <span className="text-white">, {userName}!</span>
             </h1>
             <p className="text-sm md:text-base text-white/80 mb-4 drop-shadow font-light">
               Access your membership settings, documents, and resources all in one place.
             </p>
             <GradientButton 
               onClick={() => {
                 console.log('🔄 [OverviewTab] Navigating to membership status tab');
                 
                 // Only track analytics if we have Salesforce ID
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
               className="border-white/30 text-white hover:bg-white/10"
             >
               View Membership Status
             </GradientButton>
           </div>
           
           {/* Latest Media - only show if we have podcasts */}
           {mediaItems.filter(item => item.type === 'podcast').length > 0 && (
             <div className="hidden lg:block bg-white/15 backdrop-blur-sm rounded p-4 max-w-sm border border-white/20">
               <div className="flex items-center gap-2 mb-2">
                 <h3 className="text-white text-xs font-semibold drop-shadow">LATEST MEDIA</h3>
                 <img 
                   src={alcorStar} 
                   alt="Alcor Star" 
                   className="w-3 h-3"
                 />
               </div>
               <div className="flex items-start gap-3">
                 {(() => {
                   const latestPodcast = mediaItems.find(item => item.type === 'podcast');
                   if (!latestPodcast) return null;
                   
                   return (
                     <>
                       <img 
                         src={podcastImage} 
                         alt={latestPodcast.title}
                         className="w-20 h-14 object-cover rounded flex-shrink-0"
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
                     </>
                   );
                 })()}
               </div>
             </div>
           )}
         </div>
       </div>
     </div>
{/* Announcements Section */}
{/* Announcements Section */}
<div ref={announcementsRef} id="announcements" className="mt-16">
  <h2 className={`text-2xl font-semibold text-[#2a2346] mb-10 transition-all duration-1000 ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
    Announcements
  </h2>
  {!contentLoaded && announcements.length === 0 ? (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ContentSkeleton />
      <ContentSkeleton />
    </div>
  ) : announcements.length > 0 ? (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {announcements.slice(0, 2).map((announcement, index) => (
        <div 
          key={announcement.id}
          className={`bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-1000 cursor-pointer relative flex flex-col ${visibleSections.has('announcements') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: `${200 + (index * 200)}ms`, minHeight: '320px', height: '320px' }}
          onClick={() => {
            // Track analytics if we have Salesforce ID
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
          {/* Background Image - Very Faded covering entire card */}
          {announcement.imageUrl && (
            <img 
              src={announcement.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: '0.12',
                filter: 'grayscale(1)',
                WebkitFilter: 'grayscale(1)',
                zIndex: 0
              }}
            />
          )}
          
          {/* White overlay for better text readability */}
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)', zIndex: 1 }} />
          
          {/* Content Section */}
          <div className="relative z-10 p-8 flex-grow flex flex-col">
            <div className="flex items-start gap-0.5 mb-3">
              <h3 className="text-xl font-normal text-[#2a2346]">
                {announcement.title}
              </h3>
              {/* Yellow Alcor star accent */}
              <img 
                src={alcorYellowStar}
                alt=""
                className="w-7 h-7 -mt-0.5"
              />
            </div>
            
            {announcement.subtitle && (
              <p className="text-gray-700 font-light text-base mb-2 border-l-4 border-yellow-400 pl-4">
                {announcement.subtitle}
              </p>
            )}
            
            <p className="text-gray-600 text-sm font-light leading-relaxed mb-2">
              {announcement.description}
            </p>
            
            {/* Spacer to push content to bottom */}
            <div className="flex-grow"></div>
            
            {/* Event Details */}
            {(announcement.eventDate || announcement.eventTime || announcement.location) && (
              <div className="bg-[#1e2951] rounded-lg p-5 space-y-2 relative mt-2">
                {announcement.eventDate && (
                  <div className="flex items-center gap-3 text-sm text-white font-light">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-light">Date:</span>
                    <span className="text-white/90 font-extralight">{announcement.eventDate}</span>
                  </div>
                )}
                {announcement.eventTime && (
                  <div className="flex items-center gap-3 text-sm text-white font-light">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-light">Time:</span>
                    <span className="text-white/90 font-extralight">{announcement.eventTime}</span>
                  </div>
                )}
                {announcement.location && (
                  <div className="flex items-center gap-3 text-sm text-white font-light">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-light">Location:</span>
                    <span className="text-white/90 font-extralight">{announcement.location}</span>
                  </div>
                )}
                {announcement.link && (
                  <div className="absolute bottom-5 right-5">
                    <a 
                      href={announcement.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white hover:text-yellow-400 font-light text-sm transition-all hover:gap-3 group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Learn More
                      <span className="text-yellow-400 group-hover:text-yellow-300 transition-colors">→</span>
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* Learn More Link when no event details */}
            {announcement.link && !(announcement.eventDate || announcement.eventTime || announcement.location) && (
              <div className="flex justify-end">
                <a 
                  href={announcement.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#52385c] hover:text-[#3f2b56] font-light text-sm transition-all hover:gap-3 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  Learn More
                  <span className="text-yellow-500 group-hover:text-yellow-600 transition-colors">→</span>
                </a>
              </div>
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

     {/* Member Newsletter Section */}
     <div ref={newslettersRef} id="newsletters" className="mt-20">
       <h2 className={`text-2xl font-semibold text-[#2a2346] mb-10 transition-all duration-800 ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                 className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-700 cursor-pointer ${visibleSections.has('newsletters') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                 style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                 onClick={() => {
                   // Track analytics if we have Salesforce ID
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
                 <div className="p-6 bg-white border-2 border-[#f5e6d3] border-t-0 rounded-b-lg">
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

     {/* Recent Activity - RESTYLED to match screenshot */}
     <div ref={recentActivityRef} id="recentActivity" className="mt-16 mb-20">
       <div className="flex items-center justify-between mb-6">
         <h2 className={`text-2xl font-semibold text-[#2a2346] transition-all duration-800 ${
           visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
         }`}>
           Recent Changes
         </h2>
       </div>

       {activitiesLoading ? (
         // Loading skeleton for single box
         <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
           <div className="space-y-4">
             {[1, 2, 3].map((i) => (
               <div key={i} className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                 <div className="flex-1">
                   <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                   <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       ) : activitiesError ? (
         // Error state
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
         // Display activities in single box matching screenshot
         <div className={`bg-white rounded-lg shadow-md transition-all duration-700 ${
           visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
         }`}>
           <div className="divide-y divide-gray-100">
             {recentActivities.slice(0, 3).map((activity, index) => (
               <div 
                 key={activity.id} 
                 className="p-6 hover:bg-gray-50 transition-colors"
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
         </div>
       ) : (
         // Empty state
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
       
       {/* Activity summary stats - Updated with white background and navy styling */}
       {recentActivities.length > 0 && !activitiesLoading && (
         <div className={`mt-8 grid grid-cols-3 gap-4 transition-all duration-800 ${
           visibleSections.has('recentActivity') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
         }`} style={{ transitionDelay: '600ms' }}>
           <div className="bg-white rounded-lg p-4 text-center border border-[#1e2951]">
             <p className="text-2xl font-semibold text-[#1e2951]">
               {recentActivities.filter(a => a.category === 'profile').length}
             </p>
             <p className="text-sm text-[#1e2951] mt-1">Profile Updates</p>
           </div>
           <div className="bg-white rounded-lg p-4 text-center border border-[#1e2951]">
             <p className="text-2xl font-semibold text-[#1e2951]">
               {recentActivities.filter(a => a.category === 'documents').length}
             </p>
             <p className="text-sm text-[#1e2951] mt-1">Document Changes</p>
           </div>
           <div className="bg-white rounded-lg p-4 text-center border border-[#1e2951]">
             <p className="text-2xl font-semibold text-[#1e2951]">
               {recentActivities.filter(a => a.category === 'financial').length}
             </p>
             <p className="text-sm text-[#1e2951] mt-1">Financial Updates</p>
           </div>
         </div>
       )}
     </div>
      {/* Welcome Overlay */}
    <WelcomeOverlay />
   </div>
 );
};

export default OverviewTab;