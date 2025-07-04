


import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../contexts/MemberPortalProvider';
import alcorWhiteLogo from '../assets/images/alcor-white-logo.png';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/notifications';

// ============================================
// GLOBAL CONFIGURATION - EASY TO CHANGE
// ============================================
const SHOW_FLOATING_ACTION_BUTTONS = true;  // Side action buttons (help, documents, etc.)
const SHOW_LAYOUT_TOGGLE = false;           // Toggle between floating/traditional layout
const SHOW_BACKGROUND_TOGGLE = false;       // Toggle between image/white background
const SHOW_OVERVIEW_SELECTOR = false;       // Dropdown to change overview tab styles

// Default settings
const DEFAULT_PORTAL_VERSION = 2;           // 1 or 2
const DEFAULT_LAYOUT_MODE = 'floating';     // 'floating' or 'traditional'
const DEFAULT_SHOW_BACKGROUND = true;       // true for image background, false for white
const DEFAULT_OVERVIEW_TAB_VERSION = 5;     // 0-5 for different overview styles

// ============================================
// GRADIENT CONFIGURATION
// ============================================
const UNIVERSAL_GRADIENT = `
  radial-gradient(
    ellipse at 60% 85%,
    rgba(255, 215, 64, 0.32) 0%,
    rgba(255, 198, 133, 0.18) 22%,
    rgba(247, 187, 250, 0.13) 54%,
    rgba(196, 163, 250, 0.09) 75%,
    transparent 95%
  ),
  linear-gradient(
    180deg,
    #fff5e1 0%,
    #ffeabf 33%,
    #efd8fa 75%,
    #c7b5ea 100%
  )
`;

// ============================================
// COMPONENT IMPORTS
// ============================================

// Import all the component parts
import PortalSidebarV2 from '../components/portal/PortalSidebarV2';
import PortalHeader from '../components/portal/PortalHeader';
import AccountSettingsTab from '../components/portal/AccountSettingsTab2';
import NotificationsTab from '../components/portal/NotificationsTab';
import NotificationsTab2 from '../components/portal/NotificationsTab2';
import MembershipStatusTab from '../components/portal/MembershipStatusTab2';
import MyInformationTab from '../components/portal/MyInformationTab';
import ContractsTab from '../components/portal/ContractsTab';
import FormsTab from '../components/portal/FormsTab2';
import PaymentHistoryTab from '../components/portal/PaymentHistoryTab';
import PaymentMethodsTab from '../components/portal/PaymentMethodsTab';
import InvoicesTab from '../components/portal/InvoicesTab';
import MediaTab from '../components/portal/MediaTab';
import CommunityTab from '../components/portal/CommunityTab';
import SupportTab from '../components/portal/SupportTab';
import DocumentsTab from '../components/portal/DocumentsTab2';
import InformationDocumentsTab from '../components/portal/InformationDocumentsTab';
import VideoTestimonyTab from '../components/portal/VideoTestimonyTab2';
import MyInformationTab2 from '../components/portal/MyInformationTab2'; 

// Import all overview tab versions
import OverviewTab from '../components/portal/OverviewTab';
import OverviewTabStandard from '../components/portal/OverviewTabStandard';
import OverviewTabPurpleGradient from '../components/portal/OverviewTabPurpleGradient';
import OverviewTabDarkBackground from '../components/portal/OverviewTabDarkBackground';
import OverviewTabCorrnerSideImage from '../components/portal/OverviewTabCorrnerSideImage';
import OverviewTabPinkPurple from '../components/portal/OverviewTabPinkPurple';
import OverviewTabLighterGradient from '../components/portal/OverviewTabLighterGradient';

// Import dewars image for background
import dewarsImage from '../assets/images/dewars2.jpg';

// Placeholder components for main tabs that don't have content yet
const AccountTab = () => (
 <div className="text-center py-16">
   <h2 className="text-2xl font-medium text-gray-900 mb-4">Account</h2>
   <p className="text-gray-600">Please select a sub-item from the menu</p>
 </div>
);

const MembershipTab = () => (
 <div className="text-center py-16">
   <h2 className="text-2xl font-medium text-gray-900 mb-4">Membership</h2>
   <p className="text-gray-600">Please select a sub-item from the menu</p>
 </div>
);

const PaymentsTab = () => (
 <div className="text-center py-16">
   <h2 className="text-2xl font-medium text-gray-900 mb-4">Payments</h2>
   <p className="text-gray-600">Please select a sub-item from the menu</p>
 </div>
);

const ResourcesTab = () => (
 <div className="text-center py-16">
   <h2 className="text-2xl font-medium text-gray-900 mb-4">Resources</h2>
   <p className="text-gray-600">Please select a sub-item from the menu</p>
 </div>
);

const PortalHome = () => {
// Mobile notification bell component - based on working version
// IMPORTANT: Define this OUTSIDE of PortalHome component
const MobileNotificationBell = React.memo(({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { notifications, refreshNotifications, notificationsLoaded } = useMemberPortal();
  const notificationRef = React.useRef(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle click outside to close dropdown
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Check if click is outside the entire notification component
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Add listeners after a small delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchend', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Close dropdown and navigate to notifications tab
    setIsOpen(false);
    setActiveTab('account-notifications');
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    setIsOpen(false);
    setActiveTab('account-notifications');
  };

  const formatNotificationTime = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type) => {
    switch(type) {
      case 'message':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'travel':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'alert':
      case 'update':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'podcast':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'newsletter':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'membership':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'message': return 'text-[#9662a2]';
      case 'alert': return 'text-[#8551a1]';
      case 'update': return 'text-[#8551a1]';
      case 'podcast': return 'text-[#a770b2]';
      case 'newsletter': return 'text-[#7f4fa0]';
      case 'travel': return 'text-[#8e5ba3]';
      case 'payment': return 'text-[#6b5b7e]';
      case 'membership': return 'text-[#7a4e8f]';
      case 'document': return 'text-[#8f5da1]';
      default: return 'text-[#9662a2]';
    }
  };

  return (
    <div className="relative mobile-notification-wrapper" ref={notificationRef}>
      <button 
        className="relative text-white p-1.5"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-white text-[#1a2744] text-xs rounded-full flex items-center justify-center font-bold pointer-events-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dimming overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[99]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown */}
      {isOpen && (
                  <div 
          className="fixed right-2 top-[60px] w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]"
        >
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-[#5b2f4b] hover:text-[#3f2541] font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!notificationsLoaded ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    !notification.read ? 'bg-[#3f2541]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${getTypeColor(notification.type)} flex-shrink-0`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-[#9662a2] rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{notification.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200">
            <button 
              onClick={handleViewAllNotifications}
              className="w-full text-center text-sm text-[#5b2f4b] hover:text-[#3f2541] font-medium"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

 // Add state for Portal version (can be controlled by props or context later)
 const [portalVersion] = useState(DEFAULT_PORTAL_VERSION);
 
 // Get initial tab from URL hash or default to 'overview'
 const getInitialTab = () => {
   const hash = window.location.hash.slice(1);
   return hash || 'overview';
 };

 const [activeTab, setActiveTab] = useState(getInitialTab());
 const [profileImage, setProfileImage] = useState(null);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [isTransitioning, setIsTransitioning] = useState(false);
 
 // Add state for layout mode with localStorage persistence
 const [layoutMode, setLayoutMode] = useState(() => {
   const saved = localStorage.getItem('portalLayoutMode');
   return saved || DEFAULT_LAYOUT_MODE;
 });

 // Overview tab versions configuration
 const overviewTabVersions = [
   { name: 'Default', component: OverviewTab },
   { name: 'Standard', component: OverviewTabStandard },
   { name: 'Purple Gradient', component: OverviewTabPurpleGradient },
   { name: 'Dark Background', component: OverviewTabDarkBackground },
   { name: 'Corner Side Image', component: OverviewTabCorrnerSideImage },
   { name: 'Pink Purple', component: OverviewTabPinkPurple },
   { name: 'Lighter Purple', component: OverviewTabLighterGradient }
 ];

 // Add state for overview tab version
// Force overview tab to "Dark Background" for Portal 2 (index 3)
const [overviewTabVersion, setOverviewTabVersion] = useState(6);


 // Add state for showing overview selector
 const [showOverviewSelector, setShowOverviewSelector] = useState(false);
 
 // Add state for background toggle
 const [showBackground, setShowBackground] = useState(() => {
   const saved = localStorage.getItem('portalShowBackground');
   return saved !== null ? saved === 'true' : DEFAULT_SHOW_BACKGROUND;
 });
 
 // Get the IDs from context
 const { customerId, salesforceContactId } = useMemberPortal();
 
 // Add mobile notification styles and rainbow gradient styles
 useEffect(() => {
   const style = document.createElement('style');
   style.innerHTML = `
     .mobile-notification-wrapper button {
       color: white !important;
     }
     .mobile-notification-wrapper button:hover {
       background-color: rgba(255, 255, 255, 0.1) !important;
     }
     .mobile-notification-wrapper .absolute span {
       background-color: white !important;
       color: #1a2744 !important;
     }
     
     /* Rainbow gradient background for mobile */
     @media (max-width: 768px) {
       .rainbow-gradient-bg {
         background: linear-gradient(135deg, 
           #ff6b6b 0%, 
           #feca57 10%, 
           #48dbfb 20%, 
           #ff9ff3 30%, 
           #54a0ff 40%, 
           #5f27cd 50%, 
           #00d2d3 60%, 
           #ff6b6b 70%, 
           #feca57 80%, 
           #48dbfb 90%, 
           #ff9ff3 100%);
         background-size: 300% 300%;
         animation: rainbow-shift 15s ease infinite;
       }
       
       .rainbow-gradient-bg::before {
         content: '';
         position: fixed;
         top: 0;
         left: 0;
         right: 0;
         bottom: 0;
         background: inherit;
         z-index: -1;
       }
       
       @keyframes rainbow-shift {
         0% { background-position: 0% 50%; }
         50% { background-position: 100% 50%; }
         100% { background-position: 0% 50%; }
       }
     }
   `;
   document.head.appendChild(style);
   
   return () => {
     document.head.removeChild(style);
   };
 }, []);
 
 // Save background preference
 useEffect(() => {
   localStorage.setItem('portalShowBackground', showBackground.toString());
 }, [showBackground]);

 // Save layout preference to localStorage
 useEffect(() => {
   localStorage.setItem('portalLayoutMode', layoutMode);
 }, [layoutMode]);

 // Save overview tab version preference
 useEffect(() => {
   localStorage.setItem('overviewTabVersion', overviewTabVersion.toString());
 }, [overviewTabVersion]);

 // Handle tab changes with history
 const handleTabChange = (newTab) => {
   // Don't push to history if it's the same tab
   if (newTab !== activeTab) {
     // Add transition effect
     setIsTransitioning(true);
     setTimeout(() => setIsTransitioning(false), 50);
     
     // Just update the hash - this automatically creates a history entry
     window.location.hash = newTab;
     // The hashchange event listener will handle updating the activeTab
   }
 };

 // Listen for browser back/forward buttons
 useEffect(() => {
   // Handle hash changes (including back button)
   const handleHashChange = () => {
     const hash = window.location.hash.slice(1);
     if (hash) {
       setActiveTab(hash);
     } else {
       setActiveTab('overview');
     }
   };

   window.addEventListener('hashchange', handleHashChange);
   
   // Set initial hash if none exists
   if (!window.location.hash) {
     window.location.hash = 'overview';
   }

   return () => {
     window.removeEventListener('hashchange', handleHashChange);
   };
 }, []);

 const handleImageUpload = (e) => {
   const file = e.target.files[0];
   if (file) {
     const reader = new FileReader();
     reader.onloadend = () => {
       setProfileImage(reader.result);
     };
     reader.readAsDataURL(file);
   }
 };

 const renderActiveTab = () => {
   // Check if we're rendering settings tab with dewars background
   const isSettingsWithDewars = activeTab === 'account-settings' && 
     localStorage.getItem('settingsTabStyle') === 'dewars';

   switch (activeTab) {
     case 'overview': 
       const SelectedOverviewTab = overviewTabVersions[overviewTabVersion].component;
       return <SelectedOverviewTab setActiveTab={handleTabChange} />;
     
     // Account tabs
     case 'account':
       return <AccountTab />;
     case 'account-settings':
       return <AccountSettingsTab />;
     case 'account-notifications':
       return portalVersion === 2 ? <NotificationsTab2 /> : <NotificationsTab />;
     
     // Membership subtabs
     case 'membership':
       return <MembershipTab />;
     case 'membership-status':
       return <MembershipStatusTab />;
     case 'membership-myinfo':
        return portalVersion === 2 ? <MyInformationTab2 /> : <MyInformationTab />;
     case 'membership-memberfiles':
       return <DocumentsTab contactId={salesforceContactId} />;
     case 'membership-video':
       return <VideoTestimonyTab contactId={salesforceContactId} />;
     
     // Documents subtabs
     case 'documents':
       return <FormsTab />;
     case 'documents-forms':
       return <FormsTab />;
     case 'documents-information':
       return <InformationDocumentsTab />;
     
     // Payments subtabs
     case 'payments':
       return <PaymentsTab />;
     case 'payments-history':
       return <PaymentHistoryTab customerId={customerId} />;
     case 'payments-methods':
       return <PaymentMethodsTab customerId={customerId} />;
     case 'payments-invoices':
       return <InvoicesTab customerId={customerId} />;
     
     // Resources subtabs
     case 'resources':
       return <ResourcesTab />;
     case 'resources-media':
       return <MediaTab />;
     case 'resources-community':
       return <CommunityTab />;
     case 'resources-support':
       return <SupportTab />;
     
     default: 
       const DefaultOverviewTab = overviewTabVersions[overviewTabVersion].component;
       return <DefaultOverviewTab setActiveTab={handleTabChange} />;
   }
 };

 // Layout toggle button component
 const LayoutToggle = () => (
   <button
     onClick={() => setLayoutMode(layoutMode === 'floating' ? 'traditional' : 'floating')}
     className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
     title="Toggle layout mode"
   >
     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
     </svg>
   </button>
 );

 // Background Toggle component
 const BackgroundToggle = () => (
   <button
     onClick={() => setShowBackground(!showBackground)}
     className="fixed bottom-20 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors"
     title={showBackground ? "Switch to white background" : "Switch to image background"}
   >
     {showBackground ? (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
       </svg>
     ) : (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
       </svg>
     )}
   </button>
 );

 // Overview Tab Selector component
 const OverviewTabSelector = () => (
   <div className="fixed bottom-4 right-4 z-50">
     {/* Toggle button */}
     <button
       onClick={() => setShowOverviewSelector(!showOverviewSelector)}
       className={`bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-2 shadow-lg hover:bg-gray-50 transition-all flex items-center gap-2 ${
         activeTab === 'overview' ? '' : 'opacity-50 cursor-not-allowed'
       }`}
       disabled={activeTab !== 'overview'}
       title={activeTab === 'overview' ? "Change overview tab style" : "Only available on overview tab"}
     >
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
       </svg>
       <span className="text-sm font-medium">
         Overview: {overviewTabVersions[overviewTabVersion].name}
       </span>
     </button>

     {/* Selector dropdown */}
     {showOverviewSelector && activeTab === 'overview' && (
       <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
         <div className="p-2">
           <h3 className="text-sm font-semibold text-gray-700 px-2 py-1">Overview Tab Styles</h3>
           {overviewTabVersions.map((version, index) => (
             <button
               key={index}
               onClick={() => {
                 setOverviewTabVersion(index);
                 setShowOverviewSelector(false);
               }}
               className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors flex items-center justify-between ${
                 index === overviewTabVersion ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
               }`}
             >
               <span>{version.name}</span>
               {index === overviewTabVersion && (
                 <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                 </svg>
               )}
             </button>
           ))}
         </div>
       </div>
     )}
   </div>
 );

 // Floating Action Buttons component
 const FloatingActionButtons = () => {
   const [showTooltip, setShowTooltip] = useState(null);

   const actionButtons = [
     {
       id: 'help',
       icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
       ),
       label: 'Help & Support',
       onClick: () => handleTabChange('resources-support'),
       color: 'bg-[#825f7c] hover:bg-[#6b4e66] text-white'
     },
     {
       id: 'documents',
       icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
         </svg>
       ),
       label: 'Quick Documents',
       onClick: () => handleTabChange('documents-forms'),
       color: 'bg-[#13283f] hover:bg-[#0f1f31] text-white'
     },
     {
       id: 'payment',
       icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
         </svg>
       ),
       label: 'Make Payment',
       onClick: () => handleTabChange('payments-methods'),
       color: 'bg-[#404060] hover:bg-[#333350] text-white'
     },
     {
       id: 'profile',
       icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
         </svg>
       ),
       label: 'My Profile',
       onClick: () => handleTabChange('membership-myinfo'),
       color: 'bg-[#825f7c] hover:bg-[#6b4e66] text-white'
     },
     {
       id: 'emergency',
       icon: (
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
         </svg>
       ),
       label: 'Emergency Contact',
       onClick: () => alert('Emergency: 1-877-462-5267'),
       color: 'bg-[#13283f] hover:bg-[#0f1f31] text-white'
     }
   ];

   return (
    
     <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
       {actionButtons.map((button) => (
         <div key={button.id} className="relative">
           <button
             onClick={button.onClick}
             onMouseEnter={() => setShowTooltip(button.id)}
             onMouseLeave={() => setShowTooltip(null)}
             className={`${button.color} p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200`}
             aria-label={button.label}
           >
             {button.icon}
           </button>
           
           {/* Tooltip */}
           {showTooltip === button.id && (
             <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap">
               {button.label}
               <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
             </div>
           )}
         </div>
       ))}
     </div>
   );
 };

 // Render floating layout (current design) - UPDATED WITH WIDER CONTENT AND LESS SIDEBAR PADDING
 const renderFloatingLayout = () => (
   <>
     {/* Background - either image or white */}
     {showBackground ? (
       /* Full screen background with dewars image */
       <div className="fixed inset-0 z-0">
         <div 
           className="absolute inset-0"
           style={{
             backgroundImage: `url(${dewarsImage})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}
         />
         
         <div 
           className="absolute inset-0"
           style={{
             background: `
               radial-gradient(
                 ellipse at 60% 85%,
                 rgba(255, 215, 64, 0.40) 0%,
                 rgba(255, 198, 133, 0.22) 32%,
                 rgba(247, 187, 250, 0.13) 54%,
                 rgba(196, 163, 250, 0.10) 70%,
                 transparent 95%
               ),
               linear-gradient(
                 180deg,
                 #fff5e1 0%,
                 #ffeabf 38%,
                 #efd8fa 75%,
                 #c7b5ea 100%
               )
             `,
             mixBlendMode: 'screen'
           }}
         />
         
         <div 
           className="absolute inset-0"
           style={{
             background: `
               radial-gradient(
                 ellipse at bottom right,
                 transparent 0%,
                 rgba(10, 22, 40, 0.3) 20%,
                 rgba(10, 22, 40, 0.7) 40%,
                 rgba(10, 22, 40, 0.9) 60%,
                 rgba(10, 22, 40, 0.95) 80%,
                 rgba(10, 22, 40, 1) 100%
               ),
               linear-gradient(180deg, 
                 #0a1628 0%, 
                 #12243c 25%, 
                 rgba(110, 67, 118, 0.9) 70%,
                 rgba(110, 67, 118, 0.4) 100%
               )
             `,
             mixBlendMode: 'multiply'
           }}
         />
       </div>
     ) : (
       /* White background */
       <div className="fixed inset-0 bg-gray-50 z-0" />
     )}

     {/* Main container */}
     <div className="relative h-screen">
       {/* Mobile header */}
       <div className="md:hidden fixed top-0 left-0 right-0 h-[80px] z-50 px-2 pt-2">
         <div className="absolute inset-0 bg-white" />
         <div 
           className="relative h-[64px] rounded-2xl flex items-center justify-between px-4 shadow-lg"
           style={{
             background: 'linear-gradient(135deg, #0f1a2b 0%, #1a2744 20%, #2a3a5a 50%, #3d3960 75%, #4a3d6b 90%, #5a4076 100%)'
           }}
         >
           <img src={alcorWhiteLogo} alt="Alcor" className="h-10 w-auto" />
           <div className="flex items-center gap-3">
             <MobileNotificationBell activeTab={activeTab} setActiveTab={handleTabChange} />
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-1.5">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
               </svg>
             </button>
           </div>
         </div>
       </div>

       {/* Desktop: Sidebar + Content - REDUCED PADDING */}
       <div className="hidden md:flex h-full p-3">
         {/* Sidebar - floating with rounded corners - REDUCED MARGIN */}
         <div className="w-[260px] mr-3">
           <PortalSidebarV2
             activeTab={activeTab}
             setActiveTab={handleTabChange}
             profileImage={profileImage}
             isMobileMenuOpen={false}
             setIsMobileMenuOpen={setIsMobileMenuOpen}
             isElevated={true}
             layoutMode="floating"
           />
         </div>

         {/* Content area - WIDER */}
         <div className="flex-1 flex flex-col overflow-hidden pl-6">
{/* Floating header - ALWAYS SHOW */}
<div className="w-full max-w-full mx-auto mb-3 flex-shrink-0 pr-6">
  <div className="bg-transparent backdrop-blur-md rounded-2xl shadow-lg relative z-[100]">
    <PortalHeader 
      setIsMobileMenuOpen={setIsMobileMenuOpen} 
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      isGlassmorphic={true}
      variant="compact"
    />
  </div>
</div>
           
           {/* Main content - INCREASED MAX WIDTH */}
           <div className="flex-1 overflow-hidden flex items-center justify-center relative z-10 pr-6">
             <div className={`w-full h-full ${activeTab === 'overview' ? 'max-w-[92%]' : 'max-w-full'} ${activeTab === 'overview' ? '-ml-6' : 'mx-auto'} overflow-hidden`}>
               {activeTab === 'overview' ? (
                 <div className="h-full overflow-y-auto">
                   {renderActiveTab()}
                 </div>
               ) : (
                 <div className="h-full bg-transparent backdrop-blur-md shadow-2xl overflow-hidden">
                   <main className="h-full p-6 overflow-y-auto">
                     <div className="bg-transparent p-8 min-h-full">
                       {renderActiveTab()}
                     </div>
                   </main>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>

       {/* Mobile: Content only */}
       <div className="md:hidden pt-[80px] h-full">
         {activeTab === 'overview' ? (
           renderActiveTab()
         ) : (
           <main className="h-full px-2 py-6 overflow-y-auto">
             <div className="bg-white rounded-2xl p-6 min-h-full">
               {renderActiveTab()}
             </div>
           </main>
         )}
       </div>

       {/* Mobile sidebar overlay */}
       {isMobileMenuOpen && (
         <>
           <div 
             className="fixed inset-0 bg-black/50 z-40 md:hidden"
             onClick={() => setIsMobileMenuOpen(false)}
           />
           <div className="fixed right-0 top-0 h-full z-50 md:hidden">
             <PortalSidebarV2
               activeTab={activeTab}
               setActiveTab={handleTabChange}
               profileImage={profileImage}
               isMobileMenuOpen={isMobileMenuOpen}
               setIsMobileMenuOpen={setIsMobileMenuOpen}
               isElevated={true}
               layoutMode="floating"
             />
           </div>
         </>
       )}
     </div>
   </>
 );

 // Render traditional layout
 const renderTraditionalLayout = () => (
   <div className="h-screen flex bg-gray-50 relative">
     {/* Mobile gradient header - highest z-index */}
     <div className="md:hidden fixed top-0 left-0 right-0 h-[80px] z-50 px-2 pt-2">
       {/* White background layer */}
       <div className="absolute inset-0 bg-white" />
       
       {/* Gradient banner with rounded corners */}
       <div 
         className="relative h-[64px] rounded-2xl flex items-center justify-between px-4 shadow-lg"
         style={{
           background: 'linear-gradient(135deg, #0f1a2b 0%, #1a2744 20%, #2a3a5a 50%, #3d3960 75%, #4a3d6b 90%, #5a4076 100%)'
         }}
       >
         <img src={alcorWhiteLogo} alt="Alcor" className="h-10 w-auto" />
         <div className="flex items-center gap-3">
           <MobileNotificationBell 
             activeTab={activeTab} 
             setActiveTab={handleTabChange}
           />
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="text-white p-2"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>
         </div>
       </div>
     </div>

     {/* Mobile menu overlay */}
     {isMobileMenuOpen && (
       <div 
         className="fixed inset-0 bg-black/10 z-30 md:hidden"
         onClick={() => setIsMobileMenuOpen(false)}
         aria-hidden="true"
       />
     )}

     {/* Main content - positioned absolutely to fill screen */}
     <div className={`absolute inset-0 flex flex-col ${activeTab !== 'overview' ? 'rainbow-gradient-bg' : 'bg-transparent'} md:bg-gray-100 md:ml-[260px] pt-[80px] md:pt-0`}>
       <PortalHeader 
         setIsMobileMenuOpen={setIsMobileMenuOpen} 
         activeTab={activeTab}
         setActiveTab={handleTabChange}
         className="bg-white hidden md:block"
         variant="compact"
       />
       <main className={`flex-1 px-2 py-6 sm:p-6 md:p-8 md:pt-4 lg:p-12 lg:pt-6 overflow-y-auto bg-transparent transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
         <div className="bg-transparent md:bg-white border-0 md:border md:border-gray-50 rounded-2xl p-6 sm:rounded-xl sm:p-8 md:p-10 lg:p-12 max-w-6xl mx-auto min-h-full">
           {renderActiveTab()}
         </div>
       </main>
     </div>

     {/* Sidebar - positioned on top with higher z-index */}
     <div className={`relative z-50 ${isMobileMenuOpen ? 'z-[70]' : ''}`}>
       <PortalSidebarV2
         activeTab={activeTab}
         setActiveTab={handleTabChange}
         profileImage={profileImage}
         isMobileMenuOpen={isMobileMenuOpen}
         setIsMobileMenuOpen={setIsMobileMenuOpen}
         isElevated={false}
         layoutMode="traditional"
       />
     </div>
   </div>
 );

 return (
  <div
    className="min-h-screen relative overflow-hidden"
    style={{ fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif" }}
  >
    {layoutMode === 'floating' ? renderFloatingLayout() : renderTraditionalLayout()}
    {SHOW_FLOATING_ACTION_BUTTONS && <FloatingActionButtons />}
    {SHOW_BACKGROUND_TOGGLE && <BackgroundToggle />}
    {SHOW_LAYOUT_TOGGLE && <LayoutToggle />}
  </div>
);
};

export default PortalHome;