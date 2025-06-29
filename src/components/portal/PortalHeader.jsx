import React from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { markNotificationAsRead, markAllNotificationsAsRead, formatNotificationTime } from '../../services/notifications';

const NotificationBell = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { notifications, refreshNotifications, notificationsLoaded } = useMemberPortal();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Refresh notifications when dropdown opens
  React.useEffect(() => {
    if (isOpen && refreshNotifications) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

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
    switch(type) {
      case 'message':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'podcast':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'newsletter':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'alert':
      case 'update':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'message': return 'text-purple-600';
      case 'alert': return 'text-yellow-600';
      case 'update': return 'text-blue-600';
      case 'podcast': return 'text-purple-600';
      case 'newsletter': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button 
        className="relative text-gray-700 hover:text-gray-900 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#9662a2] text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
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
                    <div className={`flex-shrink-0 ${getTypeColor(notification.type)}`}>
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
                      <p className="text-xs text-gray-400 mt-1">{formatNotificationTime(notification.createdAt)}</p>
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
              View all notifications ({notifications.length} total)
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
  className = ""
}) => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .portal-header * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .portal-header .font-bold,
      .portal-header .font-semibold,
      .portal-header h1,
      .portal-header h2,
      .portal-header h3,
      .portal-header h4 {
        font-weight: 700 !important;
      }
      .portal-header .font-medium {
        font-weight: 500 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <header className={`portal-header bg-white px-6 py-3 md:py-4 border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Search bar */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="md:hidden text-gray-500 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden md:block relative ml-auto mr-8">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-gray-100/70 text-gray-700 px-4 py-2 rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-[#9662a2] border border-gray-300 placeholder-gray-500 transition-all focus:bg-gray-100"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Emergency Button */}
          <button className="bg-white text-black md:text-[#DC143C] px-3 md:px-5 py-1.5 md:py-2 rounded-full font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-black md:border-[#DC143C] md:hover:bg-[#DC143C] md:hover:text-white">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="hidden sm:inline">Emergency Number</span>
            <span className="sm:hidden">Emergency</span>
          </button>
          
          {/* Settings */}
          <button className="text-gray-700 hover:text-gray-900 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-all">
            <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Notification Bell */}
          <NotificationBell 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          />
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;