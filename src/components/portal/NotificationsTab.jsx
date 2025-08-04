import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../services/notifications';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Clock, User, Bell, AlertCircle, Mic, FileText, MapPin, RefreshCw, Info, Mail, Check } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

const NotificationsTab = () => {
  const { notifications, refreshNotifications, notificationsLoaded, salesforceContactId } = useMemberPortal();
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageContent, setMessageContent] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [messageContentCache, setMessageContentCache] = useState({});
  const notificationsRef = React.useRef(null);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  
  // Define pagination constant
  const ITEMS_PER_PAGE = 3;
  
  // Modal width configuration
  const MODAL_WIDTH_CONFIG = {
    small: 'max-w-xl',
    medium: 'max-w-2xl',
    large: 'max-w-3xl',
    xlarge: 'max-w-4xl'
  };
  
  const CURRENT_MODAL_WIDTH = MODAL_WIDTH_CONFIG.large;

  // Add Helvetica font to match MembershipStatusTab
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
      .notifications-tab .animate-fadeInUp {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      .notifications-tab .animate-fadeInUp-delay-1 {
        animation: fadeInUp 0.8s ease-out 0.1s both;
      }
      .notifications-tab .animate-fadeInUp-delay-2 {
        animation: fadeInUp 0.8s ease-out 0.2s both;
      }
      .notifications-tab .animate-fadeInUp-delay-3 {
        animation: fadeInUp 0.8s ease-out 0.3s both;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [salesforceContactId]);

  // Add click outside handler for dropdown menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch message content for all message type notifications
  useEffect(() => {
    const fetchMessageContents = async () => {
      const messageNotifications = notifications.filter(n => 
        n.type === 'message' && 
        n.metadata?.messageId && 
        !messageContentCache[n.metadata.messageId]
      );

      for (const notification of messageNotifications) {
        try {
          const messageDoc = await getDoc(doc(db, 'staff_messages', notification.metadata.messageId));
          if (messageDoc.exists()) {
            setMessageContentCache(prev => ({
              ...prev,
              [notification.metadata.messageId]: messageDoc.data().content
            }));
          }
        } catch (error) {
          console.error('Error fetching message content:', error);
        }
      }
    };

    if (notifications.length > 0) {
      fetchMessageContents();
    }
  }, [notifications]);

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

  const getIcon = (type, isRead = false) => {
    const iconClass = "w-5 h-5 lg:w-6 lg:h-6 text-white transition-transform duration-200";
    const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
    
    return (
      <div className="w-full h-full rounded-lg bg-gradient-to-r from-[#0a1628] to-[#6e4376] flex items-center justify-center shadow-md">
        {type === 'message' && <Mail {...iconProps} />}
        {type === 'travel' && <MapPin {...iconProps} />}
        {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
        {type === 'podcast' && <Mic {...iconProps} />}
        {type === 'newsletter' && <FileText {...iconProps} />}
        {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
      </div>
    );
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'unread' && !n.read) || 
      (filter === 'read' && n.read);
    
    const matchesTypeFilter = typeFilter === 'all' || n.type === typeFilter;
    
    return matchesReadFilter && matchesTypeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter]);

  // Loading state
  if (!notificationsLoaded) {
    return (
      <div className="notifications-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 relative mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            </div>
            <p className="text-gray-500 font-light">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4" ref={notificationsRef}>
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Main Card - Desktop */}
      <div className="hidden sm:block">
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeInUp" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)', minHeight: '600px' }}>
          {/* Card Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
                  <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  Notifications
                  <img src={alcorStar} alt="" className="w-6 h-6 ml-1" />
                </h2>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-purple-600 hover:text-purple-700 font-normal transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mt-6">
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    filter === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    filter === 'unread' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${
                    filter === 'read' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Read
                </button>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="message">Messages</option>
                <option value="announcement">Announcements</option>
                <option value="podcast">Podcasts</option>
                <option value="newsletter">Newsletters</option>
              </select>
            </div>
          </div>

          {/* Content Section - Fixed height with scroll */}
          <div className="p-8" style={{ minHeight: '400px' }}>
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-normal">No notifications found</p>
                {filter !== 'all' && (
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all animate-fadeInUp-delay-${Math.min(index + 1, 3)} ${
                      !notification.read 
                        ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {getIcon(notification.type, notification.read)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-base ${!notification.read ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                            {notification.title}
                            {!notification.read && <img src={alcorYellowStar} alt="" className="w-4 h-4 inline-block ml-1 align-text-bottom" />}
                          </h3>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            )}
                            
                            {/* Actions Menu */}
                            <div className="relative dropdown-menu-container">
                              <button 
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === notification.id ? null : notification.id);
                                }}
                              >
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              
                              {openMenuId === notification.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                  {notification.read ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsUnread(notification.id);
                                        setOpenMenuId(null);
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
                                        setOpenMenuId(null);
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
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.type === 'message' && notification.metadata?.messageId && messageContentCache[notification.metadata.messageId]
                            ? messageContentCache[notification.metadata.messageId]
                            : notification.content}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {filteredNotifications.length > ITEMS_PER_PAGE && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length}
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-normal rounded-lg transition-all ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white hover:shadow-md'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-normal rounded-lg transition-all ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white hover:shadow-md'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden px-4 space-y-4">
        {/* Header Card - Mobile */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg transform transition duration-300 bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center">
                  Notifications
                  <img src={alcorStar} alt="" className="w-4 h-4 ml-1" />
                </h2>
              </div>
              
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Mobile Filters */}
            <div className="space-y-3">
              <div className="flex bg-gray-200 rounded-lg p-0.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    filter === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-700'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    filter === 'unread' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-700'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    filter === 'read' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-700'
                  }`}
                >
                  Read
                </button>
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="message">Messages</option>
                <option value="announcement">Announcements</option>
                <option value="podcast">Podcasts</option>
                <option value="newsletter">Newsletters</option>
              </select>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="w-full py-2 text-xs text-purple-600 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List - Mobile */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white shadow-sm rounded-xl p-8 text-center animate-fadeInUp-delay-1" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <>
            {paginatedNotifications.map((notification, index) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white shadow-sm rounded-xl overflow-hidden animate-fadeInUp-delay-${Math.min(index + 1, 3)} ${
                  !notification.read ? 'border-l-4 border-l-purple-500' : ''
                }`}
                style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      {getIcon(notification.type, notification.read)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-normal'} text-gray-900`}>
                          {notification.title}
                        </h3>
                        
                        <div className="relative dropdown-menu-container">
                          <button 
                            className="p-1 rounded hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === notification.id ? null : notification.id);
                            }}
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {filteredNotifications.length > ITEMS_PER_PAGE && (
              <div className="bg-white shadow-sm rounded-xl p-4 animate-fadeInUp-delay-3" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 text-xs rounded-lg ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-xs text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 text-xs rounded-lg ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400' 
                        : 'bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add padding at the end */}
      <div className="h-32"></div>

      {/* Message Modal */}
      {selectedMessage && messageContent && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMessageModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative bg-white rounded-2xl ${CURRENT_MODAL_WIDTH} w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl`}>
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-start justify-between flex-shrink-0 bg-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#0a1628] to-[#6e4376]">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-medium text-gray-900">
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
                </div>
                <button
                  onClick={closeMessageModal}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6 bg-gray-50 flex-1">
                {loadingMessage ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-light">
                        {messageContent.content}
                      </p>
                    </div>

                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Need assistance? Contact support at info@alcor.org
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 flex justify-between items-center flex-shrink-0 bg-white">
                <p className="text-xs text-gray-400">
                  Secure message from Alcor Member Portal
                </p>
                <button
                  onClick={closeMessageModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#0a1628] to-[#6e4376] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-normal flex items-center gap-2"
                >
                  Close
                  <img src={alcorStar} alt="" className="w-4 h-4 brightness-0 invert" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Help Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-50">
        <button
          className="w-16 h-16 bg-[#9f5fa6] hover:bg-[#8a4191] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          onClick={() => setShowHelpPopup(!showHelpPopup)}
        >
          <svg 
            className="w-8 h-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.8" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
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
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Notifications Overview</h4>
                <p className="text-sm text-gray-600">View and manage all your notifications including messages, announcements, and updates from Alcor.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Filter Options</h4>
                <p className="text-sm text-gray-600">Use filters to view all notifications, only unread ones, or previously read messages. Filter by type to see specific categories.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Notification Types</h4>
                <p className="text-sm text-gray-600">Messages from staff, announcements, podcasts, and newsletters. Click any notification to view details.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2 font-semibold">Managing Notifications</h4>
                <p className="text-sm text-gray-600">Mark notifications as read/unread or delete them using the menu icon. Use "Mark all as read" to clear all unread notifications.</p>
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

export default NotificationsTab;