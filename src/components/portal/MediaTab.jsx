import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import analytics from '../../services/analytics';
import podcastImage from '../../assets/images/podcast-image.png';

const MediaTab = () => {
  const { 
    salesforceContactId,
    announcements = [], 
    mediaItems = [], 
    contentLoaded,
    refreshContent
  } = useMemberPortal();

  const [activeFilter, setActiveFilter] = useState('all');

  // Add Helvetica font styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .media-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .media-tab .font-bold,
      .media-tab .font-semibold {
        font-weight: 500 !important;
      }
      .media-tab .font-bold {
        font-weight: 700 !important;
      }
      .media-tab h1 {
        font-weight: 300 !important;
      }
      .media-tab h2,
      .media-tab h3,
      .media-tab h4 {
        font-weight: 400 !important;
      }
      .media-tab .font-medium {
        font-weight: 400 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Track page view
  useEffect(() => {
    if (salesforceContactId) {
      analytics.logUserAction('media_tab_viewed', {
        timestamp: new Date().toISOString()
      });
    }
  }, [salesforceContactId]);

  // Separate media items by type
  const podcasts = mediaItems.filter(item => item.type === 'podcast');
  const newsletters = mediaItems.filter(item => item.type === 'newsletter');
  const articles = mediaItems.filter(item => item.type === 'article');

  // Combine and filter items based on active filter
  const getFilteredItems = () => {
    let items = [];
    
    switch(activeFilter) {
      case 'podcasts':
        items = podcasts;
        break;
      case 'announcements':
        items = announcements;
        break;
      case 'articles':
        items = [...newsletters, ...articles];
        break;
      case 'all':
      default:
        items = [...announcements, ...podcasts, ...newsletters, ...articles];
        break;
    }

    // Sort by date (newest first)
    return items.sort((a, b) => {
      const dateA = new Date(a.publishDate || a.createdAt || a.eventDate || 0);
      const dateB = new Date(b.publishDate || b.createdAt || b.eventDate || 0);
      return dateB - dateA;
    });
  };

  const filteredItems = getFilteredItems();

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get item type badge
  const getTypeBadge = (item) => {
    if (announcements.includes(item)) {
      return { label: 'ANNOUNCEMENT', color: 'bg-blue-100 text-blue-800' };
    }
    switch(item.type) {
      case 'podcast':
        return { label: 'PODCAST', color: 'bg-purple-100 text-purple-800' };
      case 'newsletter':
        return { label: 'ARTICLE', color: 'bg-green-100 text-green-800' };
      case 'article':
        return { label: 'ARTICLE', color: 'bg-green-100 text-green-800' };
      default:
        return { label: 'MEDIA', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Get icon for item type
  const getItemIcon = (item) => {
    if (announcements.includes(item)) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      );
    }
    switch(item.type) {
      case 'podcast':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'newsletter':
      case 'article':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Loading skeleton
  const ContentSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-56 bg-gray-200 rounded-t-lg"></div>
      <div className="p-8 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );

  // Get count for each filter type
  const getCounts = () => ({
    all: announcements.length + podcasts.length + newsletters.length + articles.length,
    announcements: announcements.length,
    podcasts: podcasts.length,
    articles: newsletters.length + articles.length
  });

  const counts = getCounts();

  return (
    <div className="media-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      {/* Top padding */}
      <div className="h-12"></div>
      
      {/* Main Content Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        {/* Header - Updated to match OverviewTab styling */}
        {/* Header - Corrected scaling */}
        <div className="p-10 2xl:p-12 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[#2a2346] mb-2">Media</h2>
              <p className="text-gray-600 text-sm font-light">
                Podcasts, announcements, and articles
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-5 py-3 pr-12 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#12243c] focus:border-transparent cursor-pointer"
              >
                <option value="all">All ({counts.all})</option>
                <option value="announcements">Announcements ({counts.announcements})</option>
                <option value="podcasts">Podcasts ({counts.podcasts})</option>
                <option value="articles">Articles ({counts.articles})</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-8 2xl:p-10">
          {!contentLoaded ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <ContentSkeleton />
              <ContentSkeleton />
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {filteredItems.map((item, index) => {
                const typeBadge = getTypeBadge(item);
                const itemDate = item.publishDate || item.createdAt || item.eventDate;
                
                return (
                  <div
                    key={item.id || index}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => {
                      if (salesforceContactId) {
                        analytics.logUserAction('media_item_clicked', {
                          itemId: item.id,
                          itemTitle: item.title,
                          itemType: typeBadge.label
                        });
                      }
                      
                      if (item.link) {
                        window.open(item.link, '_blank');
                      }
                    }}
                  >
                    {/* Image or Gradient Header */}
                    <div className="relative h-56 overflow-hidden">
                      {item.type === 'podcast' ? (
                        <img 
                          src={podcastImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : item.imageUrl ? (
                        <img 
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, 
                              ${typeBadge.label === 'ANNOUNCEMENT' ? '#162740 0%, #443660 100%' :
                                '#443660 0%, #785683 100%'}`
                          }}
                        >
                          <div className="text-white opacity-20 scale-[4]">
                            {getItemIcon(item)}
                          </div>
                        </div>
                      )}
                      
                      {/* Type Badge Overlay */}
                      <div className="absolute bottom-5 right-5">
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-7">
                      <div className="mb-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-[#12243c] transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex-shrink-0 text-black">
                            {getItemIcon(item)}
                          </div>
                        </div>

                        {item.subtitle && (
                          <p className="text-sm text-gray-600 mb-3 font-normal">{item.subtitle}</p>
                        )}

                        <p className="text-sm text-gray-700 line-clamp-2 font-normal">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <span className="text-xs text-gray-500">
                          {formatDate(itemDate)}
                        </span>
                        
                        {item.link && (
                          <span className="text-[#d09163] hover:text-[#b87a52] font-medium text-sm transition-colors flex items-center gap-2">
                            {typeBadge.label === 'PODCAST' ? 'Listen' : 'Read'}
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Event metadata */}
                      {(item.eventDate || item.eventTime) && (
                        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-5 text-xs text-gray-500">
                          {item.eventDate && (
                            <span className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {item.eventDate}
                            </span>
                          )}
                          {item.eventTime && (
                            <span className="flex items-center gap-2">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {item.eventTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-20 text-center">
              <svg className="w-24 h-24 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg mb-3">
                No {activeFilter === 'all' ? 'content' : activeFilter}
              </p>
              <p className="text-gray-400 text-sm">
                Check back later
              </p>
            </div>
          )}

          {/* Refresh button */}
          {contentLoaded && (
            <div className="mt-12 text-center">
              <button
                onClick={() => refreshContent && refreshContent()}
                className="inline-flex items-center gap-3 px-5 py-3 text-sm font-medium text-[#12243c] hover:text-[#1a2f4a] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-32 sm:h-40"></div>
    </div>
  );
};

export default MediaTab;