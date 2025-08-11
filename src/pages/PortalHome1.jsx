import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberPortal } from '../contexts/MemberPortalProvider';
import { logoutUser } from '../services/auth';
import alcorWhiteLogo from '../assets/images/alcor-white-logo.png';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../services/notifications';

// Import all the component parts
import PortalSidebar from '../components/portal/PortalSidebar';
import PortalHeader from '../components/portal/PortalHeader';
import AccountSettingsTab from '../components/portal/AccountSettingsTab';
import NotificationsTab from '../components/portal/NotificationsTab';
import MembershipStatusTab from '../components/portal/MembershipStatusTab';
import MyInformationTab from '../components/portal/MyInformationTab';
import ContractsTab from '../components/portal/ContractsTab';
import FormsTab from '../components/portal/FormsTab';
import PaymentHistoryTab from '../components/portal/PaymentHistoryTab';
import PaymentMethodsTab from '../components/portal/PaymentMethodsTab';
import InvoicesTab from '../components/portal/InvoicesTab';
import MediaTab from '../components/portal/MediaTab';
import CommunityTab from '../components/portal/CommunityTab';
import SupportTab from '../components/portal/SupportTab';
import DocumentsTab from '../components/portal/DocumentsTab';
import InformationDocumentsTab from '../components/portal/InformationDocumentsTab';
import VideoTestimonyTab from '../components/portal/VideoTestimonyTab';
import ActivityLogTab from '../components/portal/ActivityLogTab';
import PaymentContentWrapper from '../components/PaymentContentWrapper'

// Import all overview tab versions
import OverviewTab from '../components/portal/OverviewTab';

import ProcedureTab from '../components/portal/ProcedureTab';

// GLOBAL CONFIGURATION FOR BANNER STYLE
const BANNER_STYLE = 'flat'; // Options: 'rounded' or 'flat'

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
  const navigate = useNavigate();
  const { memberInfoData, currentUser, customerId, salesforceContactId, salesforceCustomer, customerFirstName, notifications, refreshNotifications, notificationsLoaded } = useMemberPortal();
  
  // Debug logging
  //console.log('PortalHome memberInfoData full structure:', JSON.stringify(memberInfoData, null, 2));
  //console.log('PortalHome salesforceContactId:', salesforceContactId);
  //console.log('PortalHome salesforceCustomer:', salesforceCustomer);
  //console.log('PortalHome customerFirstName:', customerFirstName);
  //console.log('PortalHome currentUser:', currentUser);
  
  // Mobile notification bell component - based on working version
  // IMPORTANT: Define this OUTSIDE of PortalHome component
  const MobileNotificationBell = React.memo(({ activeTab, setActiveTab }) => {
    const [isOpen, setIsOpen] = React.useState(false);
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

    // DO NOT refresh notifications on open - it's causing the re-render loop
    // The notifications are already being refreshed elsewhere

    const handleNotificationClick = async (notification) => {
      // Mark as read if not already
      if (!notification.read) {
        try {
          await markNotificationAsRead(notification.id);
          // Don't refresh - let the context handle it
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
        // Don't refresh - let the context handle it
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
         <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
            className="fixed right-2 top-[85px] w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]"
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
    return saved || 'floating'; // Default to floating
  });

  // Overview tab versions configuration
  const overviewTabVersions = [
    { name: 'Default', component: OverviewTab }
  ];

  // Add state for overview tab version
  const [overviewTabVersion, setOverviewTabVersion] = useState(0); // Always use Default

  // Add state for showing overview selector
  const [showOverviewSelector, setShowOverviewSelector] = useState(false);
  
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
      @media (max-width: 1279px) {
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
      
      // Scroll to top when changing tabs
      const scrollToTop = () => {
        // Find the main content area and scroll it to top
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.scrollTop = 0;
        }
        
        // Also try window scroll for mobile
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      
      // Execute scroll immediately
      scrollToTop();
      
      // Also execute after transition completes
      setTimeout(scrollToTop, 60);
      
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

  // Add the logout handler
  const handleLogout = async () => {
    try {
      //console.log('Starting logout process from PortalHome...');
      
      // Call the enhanced logout function
      const result = await logoutUser({
        callBackend: true,
        logoutMethod: 'manual'
      });
      
      if (result.success) {
        //console.log('Logout successful, navigating to login page');
        // Navigate to login page
        navigate('/login', { replace: true });
      } else {
        console.error('Logout failed:', result.error);
        alert('Failed to log out. Please try again.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

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
        return <NotificationsTab />;
      
      // Activity Log Tab
      case 'activity-log':
        return <ActivityLogTab setActiveTab={handleTabChange} />;
      
      // Membership subtabs
      case 'membership':
        return <MembershipTab />;
      case 'membership-status':
        return <MembershipStatusTab />;
      case 'membership-myinfo':
        return <MyInformationTab />;
      case 'membership-memberfiles':
        return <DocumentsTab contactId={salesforceContactId} />;
      case 'membership-video':
        return <VideoTestimonyTab contactId={salesforceContactId} />;
      
      // Documents subtabs
      case 'documents':
        return <FormsTab />;
      case 'documents-forms':
        return <FormsTab />;
      case 'documents-procedure':
        return <ProcedureTab contactId={salesforceContactId} />;
      case 'documents-information':
        return <InformationDocumentsTab />;
      
      // Replace these cases in your renderActiveTab function:
      case 'payments-methods':
        return <PaymentMethodsTab />;

      case 'payments-history':
        return <PaymentHistoryTab />;
        
      case 'payments-invoices':
      return <InvoicesTab customerId={customerId} setActiveTab={handleTabChange} />;

      
      // Resources subtabs
      case 'resources-media':
        return (
          <div className="flex items-center justify-center min-h-[60vh] bg-white">
            <div className="text-center">
              <h2 className="text-3xl font-light text-gray-400 mb-2">Coming Soon</h2>
              <p className="text-gray-400">Media resources are under development</p>
            </div>
          </div>
        );
      
      case 'resources-community':
        return (
          <div className="flex items-center justify-center min-h-[60vh] bg-white">
            <div className="text-center">
              <h2 className="text-3xl font-light text-gray-400 mb-2">Coming Soon</h2>
              <p className="text-gray-400">Community features are under development</p>
            </div>
          </div>
        );
      
      case 'resources-support':
        return (
          <div className="flex items-center justify-center min-h-[60vh] bg-white">
            <div className="text-center">
              <h2 className="text-3xl font-light text-gray-400 mb-2">Coming Soon</h2>
              <p className="text-gray-400">Support features are under development</p>
            </div>
          </div>
        );
      
      default: 
        const DefaultOverviewTab = overviewTabVersions[overviewTabVersion].component;
        return <DefaultOverviewTab setActiveTab={handleTabChange} />;
    }
  };

  // Layout toggle button component
  const LayoutToggle = () => (
    <button
      onClick={() => setLayoutMode(layoutMode === 'floating' ? 'traditional' : 'floating')}
      className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-300 p-2 shadow-lg hover:bg-gray-50 transition-colors"
      title="Toggle layout mode"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    </button>
  );

  // Banner configurations based on BANNER_STYLE
  const getBannerHeight = () => BANNER_STYLE === 'flat' ? 'h-[110px]' : 'h-[112px]';
  const getBannerPaddingTop = () => BANNER_STYLE === 'flat' ? 'pt-[110px]' : 'pt-[112px]';
  const getLogoSize = () => BANNER_STYLE === 'flat' ? 'h-16' : 'h-14';
  
  const renderMobileBanner = (includeWhiteBg = false) => {
    if (BANNER_STYLE === 'flat') {
      return (
        <div className="xl:hidden fixed top-0 left-0 right-0 h-[110px] z-50">
          <div 
            className="relative h-full flex items-center justify-between px-4"
            style={{
              background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 25%, #3c305b 50%, #533966 75%, #6e4376 100%)'
            }}
          >
            <button 
              onClick={() => handleTabChange('overview')}
              className="hover:opacity-80 transition-opacity"
            >
              <img src={alcorWhiteLogo} alt="Alcor" className="h-16 w-auto" />
            </button>
            <div className="flex items-center gap-3">
              <MobileNotificationBell 
                activeTab={activeTab} 
                setActiveTab={handleTabChange}
              />
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-white p-2"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      // Rounded style - NOW WITH NO ROUNDED CORNERS
      return (
        <div className="xl:hidden fixed top-0 left-0 right-0 h-[112px] z-50 px-2 pt-2">
          {includeWhiteBg && <div className="absolute inset-0 bg-white" />}
          
          <div 
            className="relative h-[96px] flex items-center justify-between px-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #0f1a2b 0%, #1a2744 20%, #2a3a5a 50%, #3d3960 75%, #4a3d6b 90%, #5a4076 100%)'
            }}
          >
            <button 
              onClick={() => handleTabChange('overview')}
              className="hover:opacity-80 transition-opacity"
            >
              <img src={alcorWhiteLogo} alt="Alcor" className="h-14 w-auto" />
            </button>
            <div className="flex items-center gap-3">
              <MobileNotificationBell 
                activeTab={activeTab} 
                setActiveTab={handleTabChange}
              />
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-white p-2"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  // Render floating layout (current design)
  const renderFloatingLayout = () => (
    <>
      {/* Full screen gradient background */}
      <div 
        className="absolute inset-0 hidden xl:block"
        style={{
          background: 'linear-gradient(to bottom right, #12243c 0%, #3a2e51 35%, #533966 65%, #6e4376 100%)'
        }}
      />

      {/* Main container */}
      <div className="relative h-screen flex">
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/10 z-[60] xl:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile gradient header - highest z-index */}
        {renderMobileBanner(false)}

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/10 z-[60] xl:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content area with rounded corners - always behind */}
        <div className={`absolute inset-0 flex ${getBannerPaddingTop()} xl:pt-0 bg-[#f3f4f6]`}>
          <div className="w-[240px] xl:w-[280px] flex-shrink-0 hidden xl:block" /> {/* Spacer for sidebar - hidden on mobile */}
          <div className="flex-1 flex flex-col">
            <div className={`flex-1 bg-[#f3f4f6] xl:bg-[#f3f4f6] xl:shadow-2xl overflow-hidden transition-all duration-700 ease-in-out`}>
              <PortalHeader 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                className="hidden xl:block"
              />
              
              <main className={`h-[calc(100%-4rem)] ${activeTab === 'overview' ? 'px-2 py-4 xl:p-8 bg-[#f3f4f6] xl:bg-[#f3f4f6]' : 'p-6 xl:p-8 xl:p-10 lg:p-12 bg-[#f3f4f6] xl:bg-[#f3f4f6]'} overflow-y-auto transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {renderActiveTab()}
              </main>
            </div>
          </div>
        </div>

        {/* Sidebar - always positioned, z-index changes */}
        <div className={`relative ${activeTab !== 'overview' ? 'z-50' : ''} ${isMobileMenuOpen ? 'z-[70]' : ''}`}>
          <PortalSidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            profileImage={profileImage}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isElevated={activeTab !== 'overview'}
            layoutMode="floating"
            memberData={memberInfoData?.personal || salesforceCustomer}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </>
  );

  // Render traditional layout
  const renderTraditionalLayout = () => (
    <div className="h-screen flex bg-[#f3f4f6] relative">
      {/* Mobile gradient header - highest z-index */}
      {renderMobileBanner(true)}

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-30 xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content - positioned absolutely to fill screen */}
      <div className={`absolute inset-0 flex flex-col ${activeTab !== 'overview' ? 'rainbow-gradient-bg' : 'bg-transparent'} xl:bg-[#f3f4f6] xl:ml-[280px] ${getBannerPaddingTop()} xl:pt-0`}>
        <PortalHeader 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          className="bg-white hidden xl:block"
        />
        <main className={`flex-1 p-0 overflow-y-auto bg-transparent transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-[#f3f4f6] min-h-full p-6 xl:p-8 xl:p-10 lg:p-12">
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Sidebar - positioned on top with higher z-index */}
      <div className={`relative z-50 ${isMobileMenuOpen ? 'z-[70]' : ''}`}>
        <PortalSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          profileImage={profileImage}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isElevated={false}
          layoutMode="traditional"
          memberData={memberInfoData?.personal || salesforceCustomer}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
      }}
    >
      {layoutMode === 'floating' ? renderFloatingLayout() : renderTraditionalLayout()}
    </div>
  );
};

export default PortalHome;