import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../services/notifications';
import { reportActivity, ACTIVITY_TYPES } from '../../services/activity';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Clock, User, Bell, AlertCircle, Mic, FileText, MapPin, RefreshCw, Info, Mail } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

const NotificationsTab2 = () => {
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
  
  // Define pagination constant
  const ITEMS_PER_PAGE = 2;
  
  // Icon style configuration - easily toggle between styles
  const USE_OUTLINED_ICONS_FOR_READ = false; // Set to true for different read/unread styles
  const USE_GRAY_CIRCLE_STYLE = true; // Set to true for all icons to be circles with gray borders
  
  // Modal width configuration - easily switch between sizes
  const MODAL_WIDTH_CONFIG = {
    small: 'max-w-xl',    // 36rem / 576px
    medium: 'max-w-2xl',  // 42rem / 672px
    large: 'max-w-3xl',   // 48rem / 768px
    xlarge: 'max-w-4xl'   // 56rem / 896px
  };
  
  // Current modal width setting - change this to switch sizes
  const CURRENT_MODAL_WIDTH = MODAL_WIDTH_CONFIG.large; // Set to large (768px)

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
      .notifications-tab .font-extra-bold {
        font-weight: 900 !important;
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
      .notifications-tab .section-title-text {
        font-weight: 500 !important;
        letter-spacing: -0.02em;
        color: white !important;
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
      .gradient-border-top {
        position: relative;
        border-top: 3px solid transparent;
        background-clip: padding-box;
      }
      .gradient-border-top::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -1px;
        right: -1px;
        height: 3px;
        background: linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%);
        border-radius: 1.5rem 1.5rem 0 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  useEffect(() => {
    refreshNotifications();
    
    // Report viewing notifications
    if (salesforceContactId) {
      reportActivity(salesforceContactId, ACTIVITY_TYPES.VIEWED_NOTIFICATIONS)
        .catch(error => console.error('Failed to report activity:', error));
    }
  }, [salesforceContactId]);

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
    // Get the color for each type
    const getColor = (type) => {
      switch(type) {
        case 'message':
          return '#734477'; // Purple
        case 'travel':
          return '#443660'; // Dark purple from gradient
        case 'announcement':
        case 'update':
          return '#785683'; // Mauve from gradient
        case 'podcast':
          return '#693674'; // Purple-pink
        case 'newsletter':
          return '#112944'; // Dark blue
        default:
          return '#996a68'; // Rose from gradient
      }
    };
    
    const color = getColor(type);
    
    // Gray circle style for all icons
    if (USE_GRAY_CIRCLE_STYLE) {
      const iconClass = "w-5 h-5 sm:w-6 sm:h-6 text-[#303050] stroke-[#303050] transition-transform duration-200";
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
      
      return (
        <div className="w-full h-full rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
          {type === 'message' && <Mail {...iconProps} />}
          {type === 'travel' && <MapPin {...iconProps} />}
          {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
          {type === 'podcast' && <Mic {...iconProps} />}
          {type === 'newsletter' && <FileText {...iconProps} />}
          {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
        </div>
      );
    }
    
    if (isRead && USE_OUTLINED_ICONS_FOR_READ) {
      // Outlined version for read messages
      const iconClass = "w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200";
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5", style: { color: color } };
      
      return (
        <div className="w-full h-full rounded-full flex items-center justify-center border-2" style={{ borderColor: color }}>
          {type === 'message' && <Mail {...iconProps} />}
          {type === 'travel' && <MapPin {...iconProps} />}
          {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
          {type === 'podcast' && <Mic {...iconProps} />}
          {type === 'newsletter' && <FileText {...iconProps} />}
          {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
        </div>
      );
    } else {
      // Solid background for unread messages (or all messages if USE_OUTLINED_ICONS_FOR_READ is false)
      const iconClass = "w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200";
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
      
      return (
        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          {type === 'message' && <Mail {...iconProps} />}
          {type === 'travel' && <MapPin {...iconProps} />}
          {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
          {type === 'podcast' && <Mic {...iconProps} />}
          {type === 'newsletter' && <FileText {...iconProps} />}
          {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
        </div>
      );
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Handle page change with scroll to top
  const handlePageChange = (newPage) => {
    console.log('[NotificationsTab] Changing page from', currentPage, 'to', newPage);
    setCurrentPage(newPage);
    
    // Log current scroll positions
    console.log('[NotificationsTab] Current scroll positions:', {
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop
    });
    
    // Force immediate scroll to top
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0; // For Safari
    window.scrollTo(0, 0);
    
    // Check if scroll worked after a delay
    setTimeout(() => {
      console.log('[NotificationsTab] After scroll positions:', {
        windowScrollY: window.scrollY,
        documentScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop
      });
      
      // Find scrollable parent
      let element = notificationsRef.current;
      while (element) {
        if (element.scrollHeight > element.clientHeight) {
          console.log('[NotificationsTab] Found scrollable parent:', element, {
            scrollTop: element.scrollTop,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight
          });
          // Try scrolling this element
          element.scrollTop = 0;
        }
        element = element.parentElement;
      }
    }, 100);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter]);

  // Loading state
  if (!notificationsLoaded) {
    return null;
  }

  return (
    <div className="notifications-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-0" ref={notificationsRef}>
      {/* Desktop: Same width as Settings */}
      <div className="hidden sm:block">
        <div className="slide-in">
          {/* Main Container with Dark Banner */}
          <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: 'transparent' }}>
            <div>
              {/* Dark Gradient Banner */}
              <div className="px-6 py-6 sm:py-6 rounded-t-2xl sm:rounded-t-[1.25rem] banner-section" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-normal text-white flex items-center drop-shadow-md">
                    <Bell className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-sm mr-3" />
                    <span className="section-title-text">Notifications</span>
                  </h2>
                  
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 text-xs font-normal text-white hover:bg-white/10 border border-white/30 rounded-md transition-all duration-200"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>

              {/* White Content Area */}
              <div className="bg-white rounded-b-2xl">
                {/* Filters Section */}
                <div className="px-6 py-6 border-b border-gray-100">
                  <div className="flex flex-row gap-3">
                    {/* Read Status Filter */}
                    <div className="flex bg-gray-300 rounded-lg p-0.5">
                      <button
                        onClick={() => setFilter('all')}
                        className={`flex-initial w-24 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                          filter === 'all' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        All
                        {filter === 'all' && <img src={alcorStar} alt="" className="w-3 h-3 ml-0.5" />}
                      </button>
                      <button
                        onClick={() => setFilter('unread')}
                        className={`flex-initial w-32 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                          filter === 'unread' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Unread ({unreadCount})
                        {filter === 'unread' && <img src={alcorStar} alt="" className="w-3 h-3 ml-0.5" />}
                      </button>
                      <button
                        onClick={() => setFilter('read')}
                        className={`flex-initial w-24 px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                          filter === 'read' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Read
                        {filter === 'read' && <img src={alcorStar} alt="" className="w-3 h-3 ml-0.5" />}
                      </button>
                    </div>

                    {/* Type Filter Dropdown */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-auto px-3 pr-8 py-2 rounded-md border-2 border-gray-500 text-xs font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#12243c]/50 focus:border-[#12243c]/50 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%23444%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="all">All Types</option>
                      <option value="message">Messages</option>
                      <option value="announcement">Announcements</option>
                      <option value="podcast">Podcasts</option>
                      <option value="newsletter">Newsletters</option>
                    </select>
                  </div>
                </div>
                
                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                    </div>
                    <p className="text-gray-500 text-lg font-normal">No notifications found</p>
                    {filter !== 'all' && (
                      <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 stagger-in relative z-10">
                    {paginatedNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-6 py-6 transition-all duration-200 cursor-pointer group ${
                            !notification.read ? 'bg-gray-100' : 'bg-white'
                          } hover:bg-gray-50`}
                        >
                          <div className="flex items-start gap-5">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 overflow-hidden">
                              {getIcon(notification.type, notification.read)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className={`text-base text-gray-900 mb-1 flex items-center ${
                                    !notification.read ? 'font-bold' : 'font-normal'
                                  }`}>
                                    {notification.title}
                                    {!notification.read && <img src={alcorYellowStar} alt="" className="w-5 h-5 ml-1 inline-block align-middle" />}
                                  </h3>
                                  <p className={`text-sm line-clamp-2 ${
                                    !notification.read ? 'text-gray-700' : 'text-gray-600'
                                  }`} style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
                                    {notification.type === 'message' && notification.metadata?.messageId && messageContentCache[notification.metadata.messageId]
                                      ? messageContentCache[notification.metadata.messageId]
                                      : notification.content}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-3">{formatDate(notification.createdAt)}</p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {!notification.read && (
                                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9d6980' }}></span>
                                  )}
                                  
                                  {/* Actions Menu */}
                                  <div className="relative dropdown-menu-container" style={{ position: 'static' }}>
                                    <button 
                                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === notification.id ? null : notification.id);
                                      }}
                                    >
                                      <svg className="w-6 h-6 text-[#162740]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </button>
                                    
                                    {openMenuId === notification.id && (
                                      <div className="absolute right-0 top-8 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200" style={{ zIndex: 9999 }}>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination Controls - Desktop */}
                {filteredNotifications.length > ITEMS_PER_PAGE && (
                  <div className="px-6 py-6 border-t border-gray-200 flex items-center justify-between bg-white rounded-b-2xl">
                    <p className="text-sm text-gray-700 font-light">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} notifications
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 text-sm font-normal rounded-lg transition-all duration-200 ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white border border-[#9d6980]/30 text-gray-700 hover:bg-[#9d6980]/5 hover:border-[#9d6980]/50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          const showPage = pageNum === 1 || 
                                         pageNum === totalPages || 
                                         (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);
                          const showEllipsis = pageNum === currentPage - 2 || pageNum === currentPage + 2;
                          
                          if (showEllipsis && totalPages > 5) {
                            return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                          }
                          
                          if (!showPage && totalPages > 5) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 text-sm font-normal rounded-lg transition-all duration-200 ${
                                currentPage === pageNum 
                                  ? 'bg-gradient-to-r from-[#162740] to-[#785683] text-white shadow-sm' 
                                  : 'bg-white border border-[#9d6980]/30 text-gray-700 hover:bg-[#9d6980]/5 hover:border-[#9d6980]/50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 text-sm font-normal rounded-lg transition-all duration-200 ${
                          currentPage === totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white border border-[#9d6980]/30 text-gray-700 hover:bg-[#9d6980]/5 hover:border-[#9d6980]/50'
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
        </div>
      </div>

      {/* Mobile: Same style with dark banner */}
      <div className="sm:hidden">
        <div className="slide-in">
          {/* Main Container with Dark Banner */}
          <div className="overflow-hidden rounded-2xl mx-4" style={{ backgroundColor: 'transparent' }}>
            <div>
              {/* Dark Gradient Banner */}
              <div className="px-6 py-6 rounded-t-2xl banner-section" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
                <h2 className="text-lg font-normal text-white flex items-center drop-shadow-md">
                  <Bell className="w-5 h-5 text-white drop-shadow-sm mr-3" />
                  <strong className="text-white">Notifications</strong>
                  <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
                </h2>
              </div>

              {/* White Content Area */}
              <div className="bg-white rounded-b-2xl">
                {/* Filters Section */}
                <div className="px-6 py-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex bg-gray-300 rounded-lg p-0.5">
                      <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                          filter === 'all' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        All
                        {filter === 'all' && <img src={alcorStar} alt="" className="w-3 h-3 ml-0.5" />}
                      </button>
                      <button
                        onClick={() => setFilter('unread')}
                        className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                          filter === 'unread' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Unread ({unreadCount})
                        {filter === 'unread' && <img src={alcorStar} alt="" className="w-3 h-3 ml-0.5" />}
                      </button>
                      <button
                        onClick={() => setFilter('read')}
                        className={`flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 ${
                          filter === 'read' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Read
                        {filter === 'read' && <img src={alcorStar} alt="" className="w-3 h-3 ml-0.5" />}
                      </button>
                    </div>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 pr-10 py-2 rounded-md border-2 border-gray-500 text-xs font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#12243c]/50 focus:border-[#12243c]/50 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%23444%22%20stroke-width%3d%222%22%20stroke-linecap%3d%22round%22%20stroke-linejoin%3d%22round%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')] bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="all">All Types</option>
                      <option value="message">Messages</option>
                      <option value="announcement">Announcements</option>
                      <option value="podcast">Podcasts</option>
                      <option value="newsletter">Newsletters</option>
                    </select>
                  </div>
                </div>
                
                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                  <div className="px-6 py-16 text-center bg-white">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                    </div>
                    <p className="text-gray-500 text-lg font-normal">No notifications found</p>
                    {filter !== 'all' && (
                      <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 stagger-in bg-white relative z-10">
                    {paginatedNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-6 pb-8 transition-all duration-200 cursor-pointer group ${
                            !notification.read ? 'bg-gray-100' : 'bg-white'
                          } hover:bg-gray-50`}
                        >
                          <div className="flex items-start gap-5">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200 overflow-hidden">
                              {getIcon(notification.type, notification.read)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className={`text-base text-gray-900 mb-1 ${
                                    !notification.read ? 'font-bold' : 'font-normal'
                                  }`}>
                                    {notification.title}{!notification.read && <img src={alcorYellowStar} alt="" className="w-5 h-5 inline-block align-text-bottom ml-1" />}
                                  </h3>
                                  <p className={`text-sm line-clamp-2 ${
                                    !notification.read ? 'text-gray-700' : 'text-gray-600'
                                  }`} style={{ display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
                                    {notification.type === 'message' && notification.metadata?.messageId && messageContentCache[notification.metadata.messageId]
                                      ? messageContentCache[notification.metadata.messageId]
                                      : notification.content}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-3">{formatDate(notification.createdAt)}</p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {!notification.read && (
                                    <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9d6980' }}></span>
                                  )}
                                  
                                  {/* Actions Menu */}
                                  <div className="relative dropdown-menu-container">
                                    <button 
                                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === notification.id ? null : notification.id);
                                      }}
                                    >
                                      <svg className="w-6 h-6 text-[#162740]" fill="currentColor" viewBox="0 0 20 20">
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
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination Controls - Mobile */}
                {filteredNotifications.length > ITEMS_PER_PAGE && (
                  <div className="px-6 py-6 border-t border-gray-200 flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 text-sm font-normal rounded-lg transition-all duration-200 ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white border border-[#9d6980]/30 text-gray-700 hover:bg-[#9d6980]/5 hover:border-[#9d6980]/50'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-700 font-light">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 text-sm font-normal rounded-lg transition-all duration-200 ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white border border-[#9d6980]/30 text-gray-700 hover:bg-[#9d6980]/5 hover:border-[#9d6980]/50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal - Rendered via Portal */}
      {selectedMessage && messageContent && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMessageModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4 pl-10">
            <div className={`relative bg-white rounded-xl ${CURRENT_MODAL_WIDTH} w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl`}>
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-start justify-between flex-shrink-0 bg-white">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-lg bg-gradient-to-r from-[#162740] to-[#785683]">
                    <Bell className="w-7 h-7 text-white" fill="none" strokeWidth="1.5" />
                  </div>
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
                </div>
                <button
                  onClick={closeMessageModal}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6 bg-gray-50 h-[300px]">
                {loadingMessage ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#785683]"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">{messageContent.content}</p>
                    </div>

                    {/* Action Prompt */}
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Need assistance with this message? Contact our support team at support@alcor.org
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 flex justify-between items-center flex-shrink-0 bg-white">
                <p className="text-xs text-gray-400">
                  This message was sent through the Alcor Member Portal secure messaging system
                </p>
                <button
                  onClick={closeMessageModal}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#162740] to-[#785683] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-normal flex items-center gap-1"
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
    </div>
  );
};

export default NotificationsTab2;