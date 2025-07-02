import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../services/notifications';
import { reportActivity, ACTIVITY_TYPES } from '../../services/activity';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Clock, User, Bell, AlertCircle, Mic, FileText, MapPin, RefreshCw, Info } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

const NotificationsTab = () => {
  const { notifications, refreshNotifications, notificationsLoaded, salesforceContactId } = useMemberPortal();
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageContent, setMessageContent] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .notifications-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .notifications-tab .font-bold,
      .notifications-tab .font-semibold {
        font-weight: 500 !important;
      }
      .notifications-tab .font-bold {
        font-weight: 700 !important;
      }
      .notifications-tab h1 {
        font-weight: 300 !important;
      }
      .notifications-tab h2,
      .notifications-tab h3,
      .notifications-tab h4 {
        font-weight: 400 !important;
      }
      .notifications-tab .font-medium {
        font-weight: 400 !important;
      }
      .notifications-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .notifications-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .notifications-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .notifications-tab .stagger-in > * {
        opacity: 0;
        animation: slideIn 0.5s ease-out forwards;
      }
      .notifications-tab .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .notifications-tab .stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .notifications-tab .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .notifications-tab .stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      .notifications-tab .stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
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
      .creamsicle-outline {
        border: 2px solid #FFCAA6 !important;
      }
      .creamsicle-outline-faint {
        border: 1px solid #FFCAA630 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    refreshNotifications();
    
    // Report viewing notifications
    if (salesforceContactId) {
      reportActivity(salesforceContactId, ACTIVITY_TYPES.VIEWED_NOTIFICATIONS)
        .catch(error => console.error('Failed to report activity:', error));
    }
  }, [salesforceContactId]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        await refreshNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.type === 'message' && notification.metadata?.messageId) {
      setLoadingMessage(true);
      try {
        const messageDoc = await getDoc(doc(db, 'staff_messages', notification.metadata.messageId));
        if (messageDoc.exists()) {
          setMessageContent({
            id: messageDoc.id,
            ...messageDoc.data()
          });
          setSelectedMessage(notification);
        }
      } catch (error) {
        console.error('Error fetching message:', error);
      } finally {
        setLoadingMessage(false);
      }
    } else if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('http') || notification.actionType === 'external') {
        window.open(notification.actionUrl, '_blank');
      } else {
        console.log('Navigate to:', notification.actionUrl);
      }
    } else if (notification.metadata?.link) {
      window.open(notification.metadata.link, '_blank');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAsUnread = async (id) => {
    console.log('Mark as unread not implemented yet');
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      await refreshNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
    setMessageContent(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
    const iconClass = "w-6 h-6 sm:w-7 sm:h-7 text-[#404060] stroke-[#404060]";
    const iconProps = { className: iconClass, fill: "none", strokeWidth: "2" };
    
    switch(type) {
      case 'message':
        return <Bell {...iconProps} />;
      case 'travel':
        return <MapPin {...iconProps} />;
      case 'announcement':
      case 'update':
        return <AlertCircle {...iconProps} />;
      case 'podcast':
        return <Mic {...iconProps} />;
      case 'newsletter':
        return <FileText {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'unread' && !n.read) || 
      (filter === 'read' && n.read);
    
    const matchesTypeFilter = typeFilter === 'all' || n.type === typeFilter;
    
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Loading state
  if (!notificationsLoaded) {
    return (
      <div className="max-w-4xl pl-8">
        <div className="mb-10 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
      {/* Mobile: Single Box Container */}
      <div className="sm:hidden">
        <div className="bg-white shadow-sm border border-gray-400 rounded-[1.5rem] overflow-hidden slide-in mx-4" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          {/* Header */}
          <div className="px-6 py-8 rounded-t-[1.5rem]" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md mt-2">
              <Bell className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Notifications
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          {/* Filters Section */}
          <div className="p-8 pb-10 border-b border-gray-100">
            <div className="flex flex-col gap-8">
              <div className="flex bg-gray-100 rounded-2xl p-1 creamsicle-outline-faint">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                    filter === 'all' 
                      ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm ring-2 ring-[#FFCAA6] ring-offset-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                  {filter === 'all' && <img src={alcorStar} alt="" className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-2.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    filter === 'unread' 
                      ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm ring-2 ring-[#FFCAA6] ring-offset-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Unread ({unreadCount})
                  {filter === 'unread' && <img src={alcorStar} alt="" className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`flex-1 px-3 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                    filter === 'read' 
                      ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm ring-2 ring-[#FFCAA6] ring-offset-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Read
                  {filter === 'read' && <img src={alcorStar} alt="" className="w-5 h-5 ml-0.5" />}
                </button>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 pr-16 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#12243c]/50 focus:border-[#12243c]/50 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%23666%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat"
              >
                <option value="all">All Types</option>
                <option value="message">Messages</option>
                <option value="announcement">Announcements</option>
                <option value="podcast">Podcasts</option>
                <option value="newsletter">Newsletters</option>
              </select>
            </div>
          </div>

          {/* Notifications List - Inside the same box on mobile */}
          {filteredNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
              </div>
              <p className="text-gray-500 text-lg font-normal">No notifications found</p>
              {filter !== 'all' && (
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 stagger-in">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-8 pb-12 hover:bg-gray-50/50 transition-all cursor-pointer ${
                    !notification.read ? 'bg-[#9d6980]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-base text-gray-900 mb-1 ${
                            !notification.read ? 'font-bold' : 'font-semibold'
                          }`}>
                            {notification.title}{!notification.read && <img src={alcorYellowStar} alt="" className="w-5 h-5 inline-block align-text-bottom" />}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed">{notification.content}</p>
                          <p className="text-xs text-gray-400 mt-3">{formatDate(notification.createdAt)}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9d6980' }}></span>
                          )}
                          
                          {/* Actions Menu */}
                          <div className="relative group">
                            <button 
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-6 h-6 text-[#FFCAA6]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              {notification.read ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsUnread(notification.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                                >
                                  Mark as unread
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                                >
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Separated Boxes */}
      <div className="hidden sm:block">
        {/* Header Section */}
        <div className="mb-0 sm:mb-10">
          <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] overflow-hidden slide-in sm:rounded-b-none" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
            <div className="px-6 py-7 rounded-t-[1.25rem]" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
              <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
                <Bell className="w-5 h-5 text-white drop-shadow-sm mr-3" />
                Notifications
                <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
              </h2>
            </div>

            {/* Filters Section */}
            <div className="p-6 md:p-8 md:pl-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-row flex-wrap gap-3">
                  {/* Read Status Filter */}
                  <div className="flex bg-gray-100 rounded-2xl p-1 creamsicle-outline-faint">
                    <button
                      onClick={() => setFilter('all')}
                      className={`flex-initial w-32 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                        filter === 'all' 
                          ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm ring-2 ring-[#FFCAA6] ring-offset-1' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      All
                      {filter === 'all' && <img src={alcorStar} alt="" className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setFilter('unread')}
                      className={`flex-initial w-32 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                        filter === 'unread' 
                          ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm ring-2 ring-[#FFCAA6] ring-offset-1' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Unread ({unreadCount})
                      {filter === 'unread' && <img src={alcorStar} alt="" className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setFilter('read')}
                      className={`flex-initial w-32 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                        filter === 'read' 
                          ? 'bg-gradient-to-r from-[#3d5a80] to-[#5a7ea6] text-white shadow-sm ring-2 ring-[#FFCAA6] ring-offset-1' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Read
                      {filter === 'read' && <img src={alcorStar} alt="" className="w-5 h-5 ml-0.5" />}
                    </button>
                  </div>

                  {/* Type Filter Dropdown */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-auto px-4 pr-16 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#12243c]/50 focus:border-[#12243c]/50 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%23666%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat"
                  >
                    <option value="all">All Types</option>
                    <option value="message">Messages</option>
                    <option value="announcement">Announcements</option>
                    <option value="podcast">Podcasts</option>
                    <option value="newsletter">Newsletters</option>
                  </select>
                </div>

                <button
                  onClick={handleMarkAllAsRead}
                  className="w-auto px-5 py-2.5 text-sm font-normal text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden slide-in-delay-1 mt-0 rounded-t-none" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          {filteredNotifications.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
              </div>
              <p className="text-gray-500 text-lg font-normal">No notifications found</p>
              {filter !== 'all' && (
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 stagger-in">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-6 py-5 md:px-8 md:py-6 hover:bg-gray-50/50 transition-all cursor-pointer ${
                    !notification.read ? 'bg-[#9d6980]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 md:w-12 md:h-12 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className={`text-base text-gray-900 mb-1 flex items-center ${
                            !notification.read ? 'font-bold' : 'font-semibold'
                          }`}>
                            {notification.title}
                            {!notification.read && <img src={alcorYellowStar} alt="" className="w-5 h-5 ml-1 inline-block align-middle" />}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed">{notification.content}</p>
                          <p className="text-xs text-gray-400 mt-3">{formatDate(notification.createdAt)}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9d6980' }}></span>
                          )}
                          
                          {/* Actions Menu */}
                          <div className="relative group">
                            <button 
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-6 h-6 text-[#FFCAA6]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                            
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              {notification.read ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsUnread(notification.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                                >
                                  Mark as unread
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                                >
                                  Mark as read
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal - Rendered via Portal */}
      {selectedMessage && messageContent && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMessageModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-start justify-between flex-shrink-0 bg-white">
                <div>
                  <h2 className="text-xl font-medium text-gray-900">
                    {messageContent.subject}
                  </h2>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      From: Alcor Staff
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(messageContent.createdAt?.toDate?.() || messageContent.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeMessageModal}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {loadingMessage ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#12243c]"></div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">{messageContent.content}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-4 flex justify-end flex-shrink-0 bg-white">
                <button
                  onClick={closeMessageModal}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-normal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationsTab;