import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getContactActivities, formatActivity } from '../../services/activity';
import GradientButton from './GradientButton';

const ActivityLogTab = ({ setActiveTab }) => {
  const { currentUser } = useUser();
  const { salesforceContactId, isPreloading } = useMemberPortal();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  
  const loadMoreRef = useRef(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Add Helvetica font styling
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .activity-log-page * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .activity-log-page h1,
      .activity-log-page h2,
      .activity-log-page h3,
      .activity-log-page h4 {
        font-weight: 400 !important;
      }
      .activity-log-page .font-medium {
        font-weight: 400 !important;
      }
      .activity-log-page .font-semibold {
        font-weight: 500 !important;
      }
      .activity-log-page .font-bold {
        font-weight: 500 !important;
      }
      .activity-log-page p,
      .activity-log-page span,
      .activity-log-page div {
        font-weight: 300 !important;
      }
      .activity-log-page .text-xs {
        font-weight: 400 !important;
      }
      /* Fix dropdown arrow positioning */
      .activity-log-page select {
        padding-right: 2.5rem !important;
        background-position: right 0.75rem center !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Activity icon gradient styles matching styleConfig2
  const getActivityIconStyle = (category) => {
    const iconStyles = {
      profile: "bg-gradient-to-br from-[#1a3552] via-[#13283f] to-[#0a1825] border-2 border-[#3B82F6]",
      documents: "bg-gradient-to-br from-[#244060] via-[#1a2f4a] to-[#111f33] border-2 border-[#60A5FA]",
      financial: "bg-gradient-to-br from-[#2f476b] via-[#243655] to-[#192540] border-2 border-[#818CF8]",
      membership: "bg-gradient-to-br from-[#3a4f78] via-[#2e3d60] to-[#202b48] border-2 border-[#A78BFA]",
      communication: "bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC]",
      medical: "bg-gradient-to-br from-[#665a85] via-[#52476b] to-[#3e3551] border-2 border-[#E879F9]",
      legal: "bg-gradient-to-br from-[#7a638f] via-[#644e76] to-[#4c395d] border-2 border-[#F472B6]",
      system: "bg-gradient-to-br from-[#876b93] via-[#705579] to-[#57405f] border-2 border-[#FB7185]",
      auth: "bg-gradient-to-br from-[#1e293b] via-[#1e1b4b] to-[#312e81] border-2 border-[#6366F1]"
    };
    return iconStyles[category] || iconStyles.system;
  };

  // Get SVG icon for activity type
  const getActivityIcon = (category) => {
    switch(category) {
      case 'profile':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        );
      case 'documents':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
      case 'financial':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5h-15A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 19.5z" />
          </svg>
        );
      case 'membership':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
        );
      case 'communication':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        );
      case 'medical':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m7.5 3.75a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'legal':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        );
      case 'auth':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
    }
  };

  // Fetch activities - UPDATED to use getContactActivities
  const fetchActivities = async (pageNum = 1, append = false) => {
    if (!currentUser || isPreloading || !salesforceContactId) {
      setLoading(false);
      return;
    }

    try {
      if (!append) setLoading(true);
      setLoadingMore(append);
      setError(null);
      
      // Calculate date filter
      let startDate = null;
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }
      
      // Fetch activities with pagination using getContactActivities
      const limit = ITEMS_PER_PAGE;
      const categoryFilter = filter === 'all' ? null : filter;
      
      const rawActivities = await getContactActivities(
        limit, 
        categoryFilter,
        salesforceContactId
      );
      
      // Format activities
      const formattedActivities = rawActivities.map(formatActivity);
      
      // Filter by date range in memory since the API doesn't support date filtering
      let filteredActivities = formattedActivities;
      if (startDate) {
        filteredActivities = formattedActivities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= startDate;
        });
      }
      
      if (append) {
        setActivities(prev => [...prev, ...filteredActivities]);
      } else {
        setActivities(filteredActivities);
      }
      
      // Check if there are more activities
      setHasMore(filteredActivities.length === ITEMS_PER_PAGE);
      
      // Log first activity to see what data is available
      if (filteredActivities.length > 0) {
        console.log('Sample activity data:', filteredActivities[0]);
      }
      
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Unable to load activities. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    setPage(1);
    fetchActivities(1, false);
  }, [currentUser, isPreloading, salesforceContactId, filter, dateRange]);

  // Load more handler
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, loading, page]);

  // Group activities by date
  const groupActivitiesByDate = (activities) => {
    const groups = {};
    
    activities.forEach(activity => {
      // Try multiple date fields in order of preference
      let dateValue = activity.timestamp || activity.createdAt || activity.date;
      
      if (!dateValue) {
        console.warn('Activity missing date fields:', activity);
        return;
      }
      
      try {
        let date;
        
        // Handle Firestore timestamp object
        if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
          date = new Date(dateValue.seconds * 1000);
        } 
        // Handle Firestore Timestamp with toDate method
        else if (dateValue && typeof dateValue.toDate === 'function') {
          date = dateValue.toDate();
        }
        // Handle ISO string or other date formats
        else {
          date = new Date(dateValue);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for activity:', dateValue);
          return;
        }
        
        const dateKey = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(activity);
      } catch (err) {
        console.error('Error parsing date:', err, dateValue);
      }
    });
    
    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  // Loading skeleton
  const ActivitySkeleton = () => (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="activity-log-page activity-log-tab pt-6 pb-12 px-6 md:px-8 lg:px-12 max-w-7xl mx-auto" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('overview')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-light text-gray-800">Activity Log</h1>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-lg shadow-sm p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundSize: '1.5rem 1.5rem',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <option value="all">All Activities</option>
              <option value="auth">Authentication</option>
              <option value="profile">Profile Updates</option>
              <option value="documents">Document Activities</option>
              <option value="financial">Financial Activities</option>
              <option value="membership">Membership Changes</option>
              <option value="communication">Communications</option>
              <option value="medical">Medical Updates</option>
              <option value="legal">Legal Updates</option>
              <option value="system">System Activities</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundSize: '1.5rem 1.5rem',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {loading && activities.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <ActivitySkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => fetchActivities(1, false)} 
            className="mt-3 text-sm text-red-500 hover:text-red-700 underline"
          >
            Try Again
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg mb-2">No activities found</p>
          <p className="text-sm text-gray-400">
            {filter !== 'all' || dateRange !== 'all' 
              ? 'Try adjusting your filters'
              : 'Your activities will appear here as you use the portal'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                {date}
              </h3>
              <div className="bg-white rounded-lg shadow-md">
                <div className="divide-y divide-gray-100">
                  {dateActivities.map((activity, index) => (
                    <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Activity icon with gradient styling matching overview tab */}
                        <div 
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl transform transition duration-300 ${getActivityIconStyle(activity.category)}`}
                        >
                          {getActivityIcon(activity.category)}
                        </div>
                        
                        {/* Activity details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-[#2a2346] font-medium text-base">
                                {activity.displayText || activity.activity}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-gray-500">
                                  {activity.relativeTime}
                                </p>
                                <span className="text-gray-300">•</span>
                                <p className="text-sm text-gray-500">
                                  {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              {/* Activity type if available */}
                              {activity.type && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Type: {activity.type}
                                </p>
                              )}
                            </div>
                            
                            {/* Category badge */}
                            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ml-4 ${
                              activity.category === 'profile' ? 'bg-purple-50 text-purple-600' :
                              activity.category === 'documents' ? 'bg-blue-50 text-blue-600' :
                              activity.category === 'financial' ? 'bg-green-50 text-green-600' :
                              activity.category === 'membership' ? 'bg-indigo-50 text-indigo-600' :
                              activity.category === 'communication' ? 'bg-pink-50 text-pink-600' :
                              activity.category === 'medical' ? 'bg-red-50 text-red-600' :
                              activity.category === 'legal' ? 'bg-yellow-50 text-yellow-600' :
                              activity.category === 'auth' ? 'bg-slate-50 text-slate-600' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                            </span>
                          </div>
                          
                          {/* Additional metadata */}
                          {(activity.metadata && Object.keys(activity.metadata).length > 0) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1">
                              {activity.metadata.documentName && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Document:</span> {activity.metadata.documentName}
                                </p>
                              )}
                              {activity.metadata.fileName && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">File:</span> {activity.metadata.fileName}
                                </p>
                              )}
                              {activity.metadata.amount && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Amount:</span> ${activity.metadata.amount}
                                </p>
                              )}
                              {activity.metadata.status && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Status:</span> {activity.metadata.status}
                                </p>
                              )}
                              {activity.metadata.details && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Details:</span> {activity.metadata.details}
                                </p>
                              )}
                              {activity.metadata.fieldChanged && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Field Changed:</span> {activity.metadata.fieldChanged}
                                </p>
                              )}
                              {activity.metadata.oldValue && activity.metadata.newValue && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Changed from:</span> {activity.metadata.oldValue} → {activity.metadata.newValue}
                                </p>
                              )}
                              {activity.metadata.ip && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">IP Address:</span> {activity.metadata.ip}
                                </p>
                              )}
                              {activity.metadata.userAgent && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Device:</span> {activity.metadata.userAgent.split('(')[0].trim()}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* User and source info if available */}
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                            {activity.userId && (
                              <span>User ID: {activity.userId.slice(0, 8)}...</span>
                            )}
                            {activity.salesforceId && (
                              <span>SF ID: {activity.salesforceId}</span>
                            )}
                            {activity.source && (
                              <span>Source: {activity.source}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-10" />
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13283f]"></div>
            </div>
          )}
          
          {/* No more items */}
          {!hasMore && activities.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>You've reached the end of your activity log</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogTab;