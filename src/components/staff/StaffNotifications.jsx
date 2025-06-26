import React, { useState, useEffect } from 'react';
import { Send, Megaphone, Mic, FileText, Users, Calendar, CheckCircle, XCircle, RefreshCw, Filter, Download } from 'lucide-react';
import { auth } from '../../services/firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

const StaffNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 });

  useEffect(() => {
    fetchNotifications();
    // fetchStats(); // Comment out for now since endpoint doesn't exist
  }, [filterType]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return user.getIdToken();
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      
      // Build query string - using the correct staff notifications endpoint
      let url = `${API_BASE_URL}/api/staff/notifications/notifications-staff?all=true`;
      if (filterType && filterType !== 'all') {
        url += `&type=${filterType}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetching from URL:', url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      console.log('Filter type:', filterType);
      
      if (data.success && data.notifications) {
        console.log('Notifications count:', data.notifications.length);
        setNotifications(data.notifications);
      } else {
        console.log('No notifications in response');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setError(error.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/staff/notifications/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/staff/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Refresh stats
        fetchStats();
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type, metadata) => {
    if (type === 'media' && metadata?.mediaType === 'podcast') return <Mic className="w-5 h-5" />;
    if (type === 'media' || type === 'newsletter') return <FileText className="w-5 h-5" />;
    if (type === 'update' || type === 'announcement') return <Megaphone className="w-5 h-5" />;
    if (type === 'message') return <Send className="w-5 h-5" />;
    if (type === 'podcast') return <Mic className="w-5 h-5" />;
    return <Send className="w-5 h-5" />;
  };

  const getNotificationTypeLabel = (type, metadata) => {
    if (type === 'media' && metadata?.mediaType === 'podcast') return 'Podcast';
    if (type === 'media' && metadata?.mediaType === 'newsletter') return 'Newsletter';
    if (type === 'podcast') return 'Podcast';
    if (type === 'newsletter') return 'Newsletter';
    if (type === 'announcement') return 'Announcement';
    if (type === 'update') return 'Update'; // Keep for backwards compatibility
    if (type === 'message') return 'Message';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const exportNotifications = () => {
    const csv = [
      ['Date', 'Type', 'Title', 'Content', 'Recipient', 'Read Status'],
      ...notifications.map(n => [
        formatDate(n.createdAt),
        getNotificationTypeLabel(n.type, n.metadata),
        n.title,
        n.content,
        n.user?.email || 'Unknown',
        n.read ? 'Read' : 'Unread'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">All Notifications</h1>
            <p className="text-sm text-gray-600 mt-1">View all notifications sent to members</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportNotifications}
              disabled={notifications.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => {
                fetchNotifications();
                // fetchStats(); // Comment out for now
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Last 24 Hours</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.last24Hours || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Read Rate</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.total > 0 && stats.byReadStatus ? Math.round((stats.byReadStatus.read / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.byReadStatus?.unread || 0}</p>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs font-mono">
          <p><strong>Current Filter:</strong> {filterType}</p>
          <p><strong>Total Notifications:</strong> {notifications.length}</p>
          <p><strong>URL:</strong> {`${API_BASE_URL}/api/staff/notifications/notifications-staff?all=true${filterType && filterType !== 'all' ? `&type=${filterType}` : ''}`}</p>
          <p><strong>Unique Types in Database:</strong> {[...new Set(notifications.map(n => n.type))].join(', ')}</p>
          <details>
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Notification Types</summary>
            <div className="mt-2 space-y-1">
              {notifications.slice(0, 10).map((n, idx) => (
                <div key={idx} className="text-xs">
                  {idx + 1}. Type: <span className="font-bold">{n.type || 'undefined'}</span> | Title: {n.title}
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
              filterType === 'all' 
                ? 'bg-black text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Types
          </button>
          {['message', 'podcast', 'newsletter', 'announcement'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${
                filterType === type 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type === 'podcast' ? 'Podcasts' :
               type === 'newsletter' ? 'Newsletters' :
               type === 'announcement' ? 'Announcements' :
               type === 'message' ? 'Messages' :
               type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="text-purple-600 mt-1">
                      {getNotificationIcon(notification.type, notification.metadata)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                            notification.type === 'podcast' || (notification.type === 'media' && notification.metadata?.mediaType === 'podcast')
                              ? 'bg-purple-100 text-purple-700'
                              : notification.type === 'newsletter' || (notification.type === 'media' && notification.metadata?.mediaType === 'newsletter')
                              ? 'bg-blue-100 text-blue-700'
                              : notification.type === 'announcement'
                              ? 'bg-yellow-100 text-yellow-700'
                              : notification.type === 'update'
                              ? 'bg-gray-100 text-gray-700'
                              : notification.type === 'message'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getNotificationTypeLabel(notification.type, notification.metadata)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {notification.read && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Read
                            </span>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete notification"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{notification.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(notification.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {notification.recipientCount 
                            ? `Sent to ${notification.recipientCount} member${notification.recipientCount > 1 ? 's' : ''}`
                            : notification.user?.email || 'All members'}
                        </span>
                        {notification.actionUrl && (
                          <span className="text-purple-600">
                            • {notification.actionType === 'external' ? 'External link' : 'In-app link'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications found.</p>
              <p className="text-sm mt-2">
                {filterType !== 'all' 
                  ? `No ${filterType} notifications have been sent.`
                  : 'Notifications will appear here when they are sent to members.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
                fetchNotifications();
              }}
              disabled={pagination.offset === 0}
              className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Showing {pagination.offset + 1}-{Math.min(pagination.offset + notifications.length, pagination.total)} of {pagination.total}
            </span>
            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
                fetchNotifications();
              }}
              disabled={pagination.offset + notifications.length >= pagination.total}
              className="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffNotifications;