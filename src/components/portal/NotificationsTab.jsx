import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../services/notifications';
import { reportActivity, ACTIVITY_TYPES } from '../../services/activity';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { X, Clock, User, Bell, AlertCircle, Mic, FileText, MapPin, RefreshCw, Info, Mail, Check } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';

// Import the icon components from settings

import { IconWrapper, BellIcon, iconStyle } from '../portal/iconStyle';

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
  
  // Define pagination constant
  const ITEMS_PER_PAGE = 2;
  
  // Modal width configuration
  const MODAL_WIDTH_CONFIG = {
    small: 'max-w-xl',
    medium: 'max-w-2xl',
    large: 'max-w-3xl',
    xlarge: 'max-w-4xl'
  };
  
  const CURRENT_MODAL_WIDTH = MODAL_WIDTH_CONFIG.large;

  // Add Inter font and styles matching settings
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
      
      .notifications-tab * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      }
      .notifications-tab p,
      .notifications-tab span,
      .notifications-tab div {
        font-weight: 300 !important;
      }
      .notifications-tab .font-bold,
      .notifications-tab .font-semibold {
        font-weight: 600 !important;
      }
      .notifications-tab h1 {
        font-weight: 500 !important;
        letter-spacing: -0.02em !important;
      }
      .notifications-tab h2,
      .notifications-tab h3,
      .notifications-tab h4 {
        font-weight: 400 !important;
        letter-spacing: -0.01em !important;
      }
      .notifications-tab .section-subtitle {
        font-weight: 400 !important;
        letter-spacing: 0.05em !important;
        color: #6b7280 !important;
      }
      @media (min-width: 640px) {
        .notifications-tab .card-title {
          font-weight: 400 !important;
        }
      }
      @media (max-width: 640px) {
        .notifications-tab .card-title {
          font-weight: 600 !important;
        }
      }
      .notifications-tab .fade-in {
        animation: fadeIn 0.8s ease-out;
      }
      .notifications-tab .slide-in {
        animation: slideIn 0.8s ease-out;
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
      @media (max-width: 640px) {
        .notifications-tab pre,
        .notifications-tab code {
          line-height: 2 !important;
        }
        .notifications-tab .comment-line {
          margin-bottom: 1rem !important;
          display: block !important;
        }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
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
      .professional-card {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        background: #ffffff;
        border-radius: 1rem;
      }
      @media (max-width: 767px) {
        .professional-card {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      }
      .professional-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
      }
      @media (max-width: 767px) {
        .professional-card:hover {
          box-shadow: 0 6px 10px rgba(0, 0, 0, 0.18);
        }
      }
      .notification-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .notification-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        transition: left 0.6s ease;
      }
      .luxury-divider {
        height: 1px;
        background: linear-gradient(to right, transparent, #d1d5db 20%, #d1d5db 80%, transparent);
      }
      .notification-description {
        font-weight: 400 !important;
        line-height: 1.6 !important;
        color: #9ca3af !important;
      }
      @media (min-width: 640px) {
        .notification-description {
          color: #b8bcc8 !important;
        }
      }
      .notification-item h3 {
        font-weight: 600 !important;
        color: #111827 !important;
      }
      .notification-item p {
        font-weight: 400 !important;
        color: #4b5563 !important;
      }
      .status-badge,
      .status-badge span {
        font-weight: 500 !important;
        letter-spacing: 0.08em !important;
        font-size: 0.6875rem !important;
        text-transform: uppercase !important;
      }
      .icon-luxury {
        position: relative;
        overflow: hidden;
      }
      .icon-luxury::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
        transform: rotate(45deg);
        transition: all 0.6s;
        opacity: 0;
      }
      .professional-card:hover .icon-luxury::after {
        opacity: 1;
        animation: shimmer 1.5s ease;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @media (min-width: 640px) {
        .next-button:hover .star-icon {
          animation: spin 0.5s ease-in-out;
        }
      }
      .gradient-border-top {
        position: relative;
        border-top: 3px solid transparent;
        background-clip: padding-box;
      }
      .gradient-border {
        position: relative;
        background: linear-gradient(#f3f4f6, #f3f4f6) padding-box,
                    linear-gradient(to right, #0a1628, #6e4376) border-box;
        border: 1px solid transparent;
        border-radius: 0.5rem;
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
    
    // Report viewing notifications
    if (salesforceContactId) {
      reportActivity(salesforceContactId, ACTIVITY_TYPES.VIEWED_NOTIFICATIONS)
        .catch(error => console.error('Failed to report activity:', error));
    }
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
    // STYLE OPTIONS - Change this number to try different styles (1-5)
    const ICON_STYLE = 3;
    
    if (ICON_STYLE === 1) {
      // Style 1: Gradient backgrounds with white icons
      const gradients = {
        message: 'from-blue-500 to-blue-700',
        travel: 'from-green-500 to-green-700',
        announcement: 'from-red-500 to-red-700',
        update: 'from-red-500 to-red-700',
        podcast: 'from-purple-500 to-purple-700',
        newsletter: 'from-indigo-500 to-indigo-700',
        default: 'from-gray-500 to-gray-700'
      };
      
      const gradient = gradients[type] || gradients.default;
      const iconClass = "w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200";
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
      
      return (
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
          {type === 'message' && <Mail {...iconProps} />}
          {type === 'travel' && <MapPin {...iconProps} />}
          {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
          {type === 'podcast' && <Mic {...iconProps} />}
          {type === 'newsletter' && <FileText {...iconProps} />}
          {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
        </div>
      );
    } else if (ICON_STYLE === 2) {
      // Style 2: Soft pastel backgrounds with colored icons
      const colors = {
        message: { bg: 'bg-blue-100', icon: 'text-blue-600' },
        travel: { bg: 'bg-green-100', icon: 'text-green-600' },
        announcement: { bg: 'bg-red-100', icon: 'text-red-600' },
        update: { bg: 'bg-red-100', icon: 'text-red-600' },
        podcast: { bg: 'bg-purple-100', icon: 'text-purple-600' },
        newsletter: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
        default: { bg: 'bg-gray-100', icon: 'text-gray-600' }
      };
      
      const style = colors[type] || colors.default;
      const iconClass = `w-5 h-5 sm:w-6 sm:h-6 ${style.icon} transition-transform duration-200`;
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
      
      return (
        <div className={`w-full h-full rounded-lg ${style.bg} flex items-center justify-center`}>
          {type === 'message' && <Mail {...iconProps} />}
          {type === 'travel' && <MapPin {...iconProps} />}
          {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
          {type === 'podcast' && <Mic {...iconProps} />}
          {type === 'newsletter' && <FileText {...iconProps} />}
          {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
        </div>
      );
    } else if (ICON_STYLE === 3) {
      // Style 3: Dark navy gradient background matching the theme
      const iconClass = "w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200";
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
    } else if (ICON_STYLE === 4) {
      // Style 4: Outlined with colored borders
      const colors = {
        message: 'border-blue-500 text-blue-500',
        travel: 'border-green-500 text-green-500',
        announcement: 'border-red-500 text-red-500',
        update: 'border-red-500 text-red-500',
        podcast: 'border-purple-500 text-purple-500',
        newsletter: 'border-indigo-500 text-indigo-500',
        default: 'border-gray-500 text-gray-500'
      };
      
      const style = colors[type] || colors.default;
      const iconClass = `w-5 h-5 sm:w-6 sm:h-6 ${style.split(' ')[1]} transition-transform duration-200`;
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
      
      return (
        <div className={`w-full h-full rounded-full bg-white border-2 ${style.split(' ')[0]} flex items-center justify-center`}>
          {type === 'message' && <Mail {...iconProps} />}
          {type === 'travel' && <MapPin {...iconProps} />}
          {(type === 'announcement' || type === 'update') && <AlertCircle {...iconProps} />}
          {type === 'podcast' && <Mic {...iconProps} />}
          {type === 'newsletter' && <FileText {...iconProps} />}
          {!['message', 'travel', 'announcement', 'update', 'podcast', 'newsletter'].includes(type) && <Info {...iconProps} />}
        </div>
      );
    } else {
      // Style 5: Original dark gray with light border
      const iconClass = "w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200";
      const iconProps = { className: iconClass, fill: "none", strokeWidth: "1.5" };
      
      return (
        <div className="w-full h-full rounded-full bg-gray-600 border-2 border-gray-300 flex items-center justify-center">
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

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Don't scroll - just change the page
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter]);

  // Loading state
  if (!notificationsLoaded) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:mt-0">
        <div className="animate-pulse">
          <div className="mb-12">
            <div className="h-10 bg-gray-100 w-48 mb-3"></div>
            <div className="h-4 bg-gray-50 w-72"></div>
          </div>
          <div className="bg-white border border-gray-100 p-8 rounded-2xl">
            <div className="space-y-6">
              <div className="h-4 bg-gray-100 w-32 mb-2 rounded"></div>
              <div className="h-3 bg-gray-50 w-full rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-tab -mx-6 -mt-6 md:mx-0 md:mt-0" ref={notificationsRef}>
      {/* Header */}
      <div className="mb-12 px-6 pt-10 sm:pt-0 md:px-0 md:pt-0 hidden sm:block">
        <h1 className="text-[1.5rem] md:text-[1.75rem] font-medium text-gray-900 mb-2 leading-tight">Notifications</h1>
        <p className="text-gray-400 text-xs md:text-sm tracking-wide uppercase section-subtitle">Stay updated with your messages and alerts</p>
      </div>

      {/* Main Card */}
      <div className="px-6 md:px-0 pt-10 sm:pt-0">
        <div className="professional-card bg-white shadow-lg border border-gray-200 rounded-2xl overflow-hidden gradient-border-top">
          {/* Card Header */}
          <div className="px-8 py-6 sm:py-6 pb-8 sm:pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6 sm:mb-6 pb-4 sm:pb-0">
              <div className="flex items-center gap-4">
                <IconWrapper className="icon-luxury" size="large">
                  <BellIcon className={iconStyle.iconSizeLarge} />
                </IconWrapper>
                <h2 className="text-lg font-normal text-gray-800 card-title flex items-center">
                  Notifications
                  <img src={alcorStar} alt="" className="w-5 h-5 ml-1" />
                </h2>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs tracking-wider uppercase text-gray-600 sm:text-gray-500 hover:text-gray-700 font-normal transition-all duration-300 border-b border-transparent hover:border-gray-400"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6 sm:mt-0">
              <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit h-12 sm:h-auto">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 h-full ${
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
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 h-full ${
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
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-0.5 h-full ${
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
                className="px-3 py-2.5 sm:py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#6e4376] focus:border-[#6e4376] transition-all sm:w-auto h-12 sm:h-auto"
                style={{ '--tw-ring-width': '1px' }}
              >
                <option value="all">All Types</option>
                <option value="message">Messages</option>
                <option value="announcement">Announcements</option>
                <option value="podcast">Podcasts</option>
                <option value="newsletter">Newsletters</option>
                <option value="travel">Travel Updates</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white">
            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-normal">No notifications found</p>
                {filter !== 'all' && (
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                )}
              </div>
            ) : (
              <div className="stagger-in">
                {paginatedNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-8 py-6 transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                        !notification.read ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 mt-0 sm:mt-0.5">
                          {getIcon(notification.type, notification.read)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1 sm:mb-0.5">
                            <h3 className={`text-base ${!notification.read ? 'font-semibold text-gray-900' : 'font-normal text-gray-800'}`}>
                              {notification.title}
                              {!notification.read && <img src={alcorYellowStar} alt="" className="w-4 h-4 inline-block ml-1 align-text-bottom" />}
                            </h3>
                            
                            <div className="flex items-center gap-3">
                              {!notification.read && (
                                <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-500"></span>
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
                                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
                          
                          <p className="text-sm sm:text-[0.8125rem] notification-description line-clamp-2 text-gray-500 sm:text-gray-400" style={{ minHeight: '2.5rem' }}>
                            {notification.type === 'message' && notification.metadata?.messageId && messageContentCache[notification.metadata.messageId]
                              ? messageContentCache[notification.metadata.messageId]
                              : notification.content}
                          </p>
                          <p className="text-xs text-gray-400 sm:text-gray-500 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < paginatedNotifications.length - 1 && (
                      <div className="px-12">
                        <div className="h-px bg-gray-100"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {filteredNotifications.length > ITEMS_PER_PAGE && (
              <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600 hidden sm:block">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length}
                </p>
                
                <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-normal rounded-lg transition-all ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#0a1628] to-[#3a2f5a] text-white hover:from-[#1e2f4a] hover:to-[#6e4376] hover:shadow-md'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600 px-2 sm:px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`next-button px-4 py-2 text-sm font-normal rounded-lg transition-all flex items-center gap-1 ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-[#0a1628] to-[#3a2f5a] text-white hover:from-[#1e2f4a] hover:to-[#6e4376] hover:shadow-md'
                    }`}
                  >
                    Next
                    {currentPage !== totalPages && <img src={alcorStar} alt="" className="star-icon w-4 h-4 sm:w-5 sm:h-5 brightness-0 invert" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-16 px-6 md:px-0 pb-2 sm:pb-8">
        <div className="luxury-divider mb-8"></div>
        <div className="flex items-center justify-between px-4 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-600 sm:text-gray-500 tracking-wider uppercase font-light">Updates in real-time</p>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {selectedMessage && messageContent && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMessageModal}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative bg-white rounded-2xl ${CURRENT_MODAL_WIDTH} w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl`}>
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-start justify-between flex-shrink-0 bg-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#162740] to-[#785683]">
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
                        Need assistance? Contact support at support@alcor.org
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
                  className="px-6 py-2.5 bg-gradient-to-r from-[#162740] to-[#785683] text-white rounded-lg hover:shadow-lg transition-all duration-200 font-normal flex items-center gap-2"
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

export default NotificationsTab;