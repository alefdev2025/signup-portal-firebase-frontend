import React from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { markNotificationAsRead, markAllNotificationsAsRead, formatNotificationTime } from '../../services/notifications';
// Import the logo (you'll need to update this import path)
import navyALogo from '../../assets/images/navy-a-logo.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

const NotificationBell = ({ activeTab, setActiveTab, isGlassmorphic, variant = 'regular' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { notifications, refreshNotifications, notificationsLoaded } = useMemberPortal();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Force Helvetica font for notification dropdown
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .notification-dropdown * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Refresh notifications when dropdown opens
  React.useEffect(() => {
    if (isOpen && refreshNotifications) {
      refreshNotifications();
    }
  }, [isOpen]); // Remove refreshNotifications from dependencies to prevent loops

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        await refreshNotifications();
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
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    setIsOpen(false);
    setActiveTab('account-notifications');
  };

  const getIcon = (type) => {
    const iconSize = variant === 'compact' ? 'w-6 h-6' : 'w-7 h-7';
    switch(type) {
      case 'message':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'podcast':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'newsletter':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'alert':
      case 'update':
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className={iconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type) => {
    return 'text-[#794384]';
  };

  const bellIconSize = isGlassmorphic ? 'w-6 h-6 md:w-7 md:h-7' : (variant === 'compact' ? 'w-5 h-5 md:w-6 md:h-6' : 'w-7 h-7 md:w-8 md:h-8');
  const buttonPadding = variant === 'compact' ? 'p-1 md:p-1.5' : 'p-1.5 md:p-2';
  
  const buttonClasses = `relative text-gray-700 hover:text-gray-900 ${buttonPadding} rounded-lg hover:bg-gray-100 transition-all`;

  const badgeSize = variant === 'compact' ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-xs';

  return (
    <div className="relative">
      <button 
        className={buttonClasses}
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className={bellIconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 ${badgeSize} bg-[#9662a2] text-white rounded-full flex items-center justify-center font-bold`}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`notification-dropdown absolute right-0 md:-right-16 xl:-right-40 2xl:-right-48 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]`}>
          <div className={`px-4 py-3 border-b border-gray-200 flex items-center justify-between`}>
            <div className="flex items-center gap-0.5">
              <h3 className={`font-semibold text-gray-900`}>Notifications</h3>
              <img src={alcorYellowStar} alt="Alcor" className="w-8 h-8" />
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className={`text-sm font-medium text-[#5b2f4b] hover:text-[#3f2541]`}
                style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!notificationsLoaded ? (
              <div className={`px-4 py-8 text-center text-gray-500`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#794384] mx-auto mb-2"></div>
                <span style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className={`px-4 py-8 text-center text-gray-500`}>
                <span style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>No notifications</span>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 border-gray-100 ${!notification.read ? 'bg-[#3f2541]/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''} text-gray-900`} style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-[#9662a2] rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 text-gray-600`} style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{notification.content}</p>
                      <p className={`text-xs mt-1 text-gray-400`} style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>{formatNotificationTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className={`px-4 py-3 border-t border-gray-200`}>
            <button 
              onClick={handleViewAllNotifications}
              className={`w-full text-center text-sm font-medium text-[#5b2f4b] hover:text-[#3f2541] flex items-center justify-center gap-1`}
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
            >
              <img src={alcorYellowStar} alt="" className="w-4 h-4" />
              View all notifications ({notifications.length} total)
              <img src={alcorYellowStar} alt="" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PortalHeader = ({ 
  setIsMobileMenuOpen, 
  activeTab, 
  setActiveTab,
  className = "",
  isGlassmorphic = false,
  variant = 'regular'
}) => {
  // Add styles for consistent font usage
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      .portal-header * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to generate breadcrumb from activeTab
  const getBreadcrumb = () => {
    if (!activeTab) return 'Home';
    
    const parts = activeTab.split('-');
    
    const labelMap = {
      'overview': 'Home',
      'account': 'Account',
      'settings': 'Settings',
      'notifications': 'Notifications',
      'membership': 'Membership',
      'status': 'Status',
      'myinfo': 'My Information',
      'memberfiles': 'Member Files',
      'video': 'Video Testimony',
      'documents': 'Documents',
      'forms': 'Forms',
      'information': 'Information',
      'procedure': 'Procedure',
      'payments': 'Payments',
      'history': 'Payment History',
      'methods': 'Payment Methods',
      'invoices': 'Invoices',
      'resources': 'Resources',
      'media': 'Media',
      'community': 'Community',
      'support': 'Support'
    };
    
    if (parts.length === 1) {
      return labelMap[parts[0]] || parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    
    const mainTab = labelMap[parts[0]] || parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const subTab = labelMap[parts[1]] || parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    
    return `${mainTab}  >  ${subTab}`;
  };

  // Adjust padding based on variant
  const paddingClasses = variant === 'compact' 
    ? 'px-4 py-2 md:px-6 md:py-2.5' 
    : 'px-6 py-3 md:py-4';

  const headerClasses = isGlassmorphic 
    ? `portal-header bg-transparent ${paddingClasses} ${activeTab !== 'overview' ? 'border border-white/20' : ''} rounded-2xl ${className}`
    : `portal-header bg-white ${paddingClasses} border-b border-gray-200 ${className}`;

  // Adjust search input width based on variant
  const searchInputWidth = variant === 'compact' ? 'w-72' : 'w-96';
  const searchInputPadding = variant === 'compact' ? 'px-3 py-1.5' : 'px-4 py-2';
  
  const searchInputClasses = `bg-gray-100/70 text-gray-700 ${searchInputPadding} rounded-lg ${searchInputWidth} focus:outline-none focus:ring-2 focus:ring-[#9662a2] border border-gray-300 placeholder-gray-500 transition-all focus:bg-gray-100`;

  // Adjust button sizes based on variant
  const emergencyButtonPadding = variant === 'compact' 
    ? 'px-2.5 md:px-4 py-1 md:py-1.5' 
    : 'px-3 md:px-5 py-1.5 md:py-2';
    
  const emergencyButtonText = variant === 'compact' 
    ? 'text-[11px] md:text-xs' 
    : 'text-xs md:text-sm';

  const emergencyButtonClasses = `bg-white text-red-600 ${emergencyButtonPadding} rounded-full ${emergencyButtonText} flex items-center gap-1 md:gap-2 shadow-sm hover:shadow-sm transition-all duration-200 border border-red-600`;

  const settingsIconSize = variant === 'compact' ? 'w-5 h-5 md:w-6 md:h-6' : 'w-7 h-7 md:w-8 md:h-8';
  const settingsButtonPadding = variant === 'compact' ? 'p-1 md:p-1.5' : 'p-1.5 md:p-2';
  
  const settingsButtonClasses = `text-gray-700 hover:text-gray-900 ${settingsButtonPadding} rounded-lg hover:bg-gray-100 transition-all`;

  const searchIconSize = variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <header className={headerClasses}>
      <div className="flex items-center justify-between h-full">
        {/* Left side - Mobile menu, Page Title/Breadcrumb and Search bar */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="md:hidden text-gray-500 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {activeTab !== 'overview' && (
            <div className="hidden md:flex items-center gap-2 pl-8">
              <h1 
                className={`breadcrumb-title ${variant === 'compact' ? 'text-base' : 'text-lg'} tracking-wide text-black`}
                style={{
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: '300',
                }}
              >
                {getBreadcrumb()}
              </h1>
            </div>
          )}
          
          <div className="hidden md:block relative ml-auto mr-8">
            <input 
              type="text" 
              placeholder="Search..." 
              className={searchInputClasses}
            />
            <svg className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${searchIconSize} text-gray-400`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Right side - Action buttons */}
        <div className={`flex items-center ${variant === 'compact' ? 'gap-1.5 md:gap-3' : 'gap-2 md:gap-4'}`}>
          {/* Emergency Button - Now visible on all pages */}
          <button 
            className={emergencyButtonClasses}
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: '300',
            }}
          >
            <svg className={`${variant === 'compact' ? 'w-3.5 h-3.5 md:w-4 md:h-4' : 'w-4 h-4 md:w-5 md:h-5'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="hidden md:inline">Emergency</span>
            <span className="md:hidden">Emergency</span>
          </button>
          
          {/* Settings - Now black */}
          <button 
            className={settingsButtonClasses}
            onClick={() => setActiveTab('account-settings')}
          >
            <svg className={settingsIconSize} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Notification Bell - Now black */}
          <NotificationBell 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            isGlassmorphic={isGlassmorphic}
            variant={variant}
          />
          
          {/* Logo - Desktop only, navigates to home */}
          <button 
            onClick={() => setActiveTab('overview')}
            className="hidden md:block hover:opacity-80 transition-opacity"
          >
            <img 
              src={navyALogo} 
              alt="Alcor Logo" 
              className={variant === 'compact' ? 'h-8' : 'h-10'}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;