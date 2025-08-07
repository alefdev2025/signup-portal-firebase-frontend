import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  formatNotificationTime 
} from '../../services/notifications';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';

console.log('📢 [NotificationBell] Module loaded');

const NotificationBell = ({ activeTab, setActiveTab }) => {
  console.log('🚀 [NotificationBell] Component rendering...');
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const navigate = useNavigate();
  const notificationRef = useRef(null); // Single ref for the entire notification component
  
  // Get notifications from context
  const { notifications, refreshNotifications, notificationsLoaded } = useMemberPortal();
  
  console.log('🔔 [NotificationBell] Got notifications from context:', {
    count: notifications?.length || 0,
    loaded: notificationsLoaded,
    notifications: notifications
  });
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Memoize the displayed notifications to prevent excessive re-renders
  const displayedNotifications = useMemo(() => {
    return notifications.slice(0, 10).map(notification => ({
      ...notification,
      formattedTime: formatNotificationTime(notification.createdAt)
    }));
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Check if click is outside the entire notification component
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        console.log('🔄 [NotificationBell] Click outside detected, closing dropdown');
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        console.log('🔄 [NotificationBell] Escape key pressed, closing dropdown');
        setIsOpen(false);
      }
    };

    console.log('📌 [NotificationBell] Adding event listeners');
    
    // Use mousedown/touchstart for better mobile support
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      console.log('🧹 [NotificationBell] Removing event listeners');
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Refresh notifications when dropdown opens (but only once)
  useEffect(() => {
    if (isOpen && refreshNotifications && !hasRefreshed) {
      console.log('🔄 [NotificationBell] Dropdown opened, refreshing notifications ONCE');
      setHasRefreshed(true);
      refreshNotifications();
    }
    
    // Reset the flag when dropdown closes
    if (!isOpen) {
      setHasRefreshed(false);
    }
  }, [isOpen, hasRefreshed]); // Remove refreshNotifications from dependencies

  const handleNotificationClick = async (notification) => {
    console.log('👆 [NotificationBell] Notification clicked:', {
      id: notification.id,
      type: notification.type,
      read: notification.read,
      actionUrl: notification.actionUrl,
      actionType: notification.actionType
    });
    
    // Mark as read if not already
    if (!notification.read) {
      try {
        console.log('📝 [NotificationBell] Marking notification as read:', notification.id);
        await markNotificationAsRead(notification.id);
        // Refresh notifications to update the list
        await refreshNotifications();
        console.log('✅ [NotificationBell] Notification marked as read');
      } catch (error) {
        console.error('❌ [NotificationBell] Error marking notification as read:', error);
      }
    }

    // Handle navigation based on action type
    if (notification.actionUrl) {
      console.log('🚀 [NotificationBell] Navigating to:', notification.actionUrl);
      
      if (notification.actionType === 'external') {
        window.open(notification.actionUrl, '_blank');
      } else if (notification.actionType === 'navigate') {
        setIsOpen(false);
        // Convert actionUrl to tab format if needed
        const tabRoute = notification.actionUrl.replace(/^\//, '').replace(/\//g, '-');
        console.log('🗂️ [NotificationBell] Setting active tab to:', tabRoute);
        setActiveTab(tabRoute);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    console.log('📑 [NotificationBell] Marking all notifications as read...');
    try {
      await markAllNotificationsAsRead();
      // Refresh notifications to update the list
      await refreshNotifications();
      console.log('✅ [NotificationBell] All notifications marked as read');
    } catch (error) {
      console.error('❌ [NotificationBell] Error marking all as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    console.log('📂 [NotificationBell] Navigating to all notifications page');
    setIsOpen(false);
    setActiveTab('account-notifications');
  };

  const getIcon = (type) => {
    switch(type) {
      case 'message':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'travel':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'alert':
      case 'update':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'podcast':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'newsletter':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'membership':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="relative" ref={notificationRef}>
      <button 
        onClick={() => {
          console.log('🔔 [NotificationBell] Bell clicked, isOpen:', !isOpen);
          setIsOpen(!isOpen);
        }}
        className="relative text-gray-700 hover:text-gray-900 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-all"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-[#9662a2] text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                style={{ top: '-2px', right: '-2px' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Invisible overlay to catch clicks outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              console.log('🔄 [NotificationBell] Overlay clicked, closing dropdown');
              setIsOpen(false);
            }}
          />
          
          <div 
            className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Header */}
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

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {!notificationsLoaded ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  Loading notifications...
                </div>
              ) : error ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-red-500 mb-2">{error}</p>
                  <button 
                    onClick={refreshNotifications}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                displayedNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      !notification.read ? 'bg-[#3f2541]/5' : ''
                    }`}
                    title={`ID: ${notification.id}, Type: ${notification.type}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${getTypeColor(notification.type)}`}>
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
                          {notification.formattedTime}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200">
              <button 
                onClick={handleViewAllNotifications}
                className="w-full text-center text-sm text-[#5b2f4b] hover:text-[#3f2541] font-medium"
              >
                View all notifications ({notifications.length} total)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;