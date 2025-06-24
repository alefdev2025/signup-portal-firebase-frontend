import React, { useState, useEffect } from 'react';

const NotificationsTab = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, message, alert, podcast, newsletter, travel, update

  // Simulate loading notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setNotifications([
        {
          id: 1,
          type: 'podcast',
          title: 'New Podcast Episode',
          content: 'Deployment and Recovery: Inside Alcor\'s DART Team - Part 2',
          time: '5 minutes ago',
          date: '2025-06-24',
          read: false,
        },
        {
          id: 2,
          type: 'newsletter',
          title: 'New Member Newsletter',
          content: 'June: Alcor makes strong showing at Vitalist Bay Biostasis Conference',
          time: '1 hour ago',
          date: '2025-06-24',
          read: false,
        },
        {
          id: 3,
          type: 'travel',
          title: 'James Arrowood Will Be Visiting Texas',
          content: 'CEO James Arrowood will be in Texas next week for member meetings',
          time: '3 hours ago',
          date: '2025-06-24',
          read: true,
        },
        {
          id: 4,
          type: 'message',
          title: 'New Message from Member Services',
          content: 'Response to your inquiry about membership documentation',
          time: 'Yesterday',
          date: '2025-06-23',
          read: true,
        },
        {
          id: 5,
          type: 'update',
          title: 'Account Update',
          content: 'Your payment method has been successfully updated',
          time: '2 days ago',
          date: '2025-06-22',
          read: true,
        },
        {
          id: 6,
          type: 'alert',
          title: 'Important: Annual Documentation Review',
          content: 'Please review and update your emergency contact information',
          time: '3 days ago',
          date: '2025-06-21',
          read: true,
        },
        {
          id: 7,
          type: 'podcast',
          title: 'New Podcast Episode',
          content: 'Deployment and Recovery: Inside Alcor\'s DART Team - Part 1',
          time: '1 week ago',
          date: '2025-06-17',
          read: true,
        },
        {
          id: 8,
          type: 'newsletter',
          title: 'May Member Newsletter',
          content: 'Updates on new research initiatives and member services improvements',
          time: '2 weeks ago',
          date: '2025-06-10',
          read: true,
        },
      ]);
      
      setIsLoading(false);
    };

    loadNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAsUnread = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: false } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
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
      case 'update':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'message': return 'text-[#9662a2]';
      case 'alert': return 'text-[#8551a1]';
      case 'podcast': return 'text-[#a770b2]';
      case 'newsletter': return 'text-[#7f4fa0]';
      case 'travel': return 'text-[#8e5ba3]';
      case 'update': return 'text-[#9662a2]';
      default: return 'text-[#9662a2]';
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
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fadeInDown">
          <div className="h-9 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-fadeIn animation-delay-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn animation-delay-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto" style={{ fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif" }}>
      <div className="mb-8 animate-fadeInDown">
        <h1 className="text-3xl font-medium text-gray-900 mb-2">Notifications</h1>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-fadeIn animation-delay-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {/* Read Status Filter */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === 'unread' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === 'read' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Read
              </button>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 pr-10 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9662a2]"
              style={{ fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif" }}
            >
              <option value="all">All Types</option>
              <option value="message">Messages</option>
              <option value="alert">Alerts</option>
              <option value="podcast">Podcasts</option>
              <option value="newsletter">Newsletters</option>
              <option value="travel">Travel Updates</option>
              <option value="update">Account Updates</option>
            </select>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-[#5b2f4b] hover:text-[#3f2541] hover:bg-gray-50 rounded-lg transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center animate-fadeIn">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">No notifications found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter !== 'all' && 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 transition-all animate-fadeInUp ${
                  !notification.read ? 'bg-[#3f2541]/5' : ''
                }`}
                style={{animationDelay: `${200 + index * 50}ms`}}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 ${getTypeColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`text-base font-medium text-gray-900 mb-1 ${
                          !notification.read ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600">{notification.content}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-[#9662a2] rounded-full"></span>
                        )}
                        
                        {/* Actions Menu */}
                        <div className="relative group">
                          <button className="p-1 rounded hover:bg-gray-100">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            {notification.read ? (
                              <button
                                onClick={() => markAsUnread(notification.id)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                              >
                                Mark as unread
                              </button>
                            ) : (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
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



      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsTab;