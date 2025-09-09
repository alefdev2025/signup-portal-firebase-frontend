// contexts/MemberPortalProvider.jsx - Complete version with documents
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUser } from './UserContext';
import { useNavigate } from 'react-router-dom';
import { getAnnouncements, getMediaItems } from '../services/content';
import { getNotifications } from '../services/notifications';
import { backgroundDataLoader } from '../services/backgroundDataLoader';
import { memberDataService } from '../components/portal/services/memberDataService';

const MemberPortalContext = createContext();

// Cache configuration
const CACHE_KEYS = {
  ANNOUNCEMENTS: 'alcor_announcements_cache',
  MEDIA: 'alcor_media_cache',
  CACHE_TIMESTAMP: 'alcor_content_cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if NetSuite ID is valid
const isValidNetsuiteId = (id) => {
  return id && id !== 'null' && id !== 'undefined' && id !== '' && id !== null && id !== undefined;
};

// Helper functions for caching
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {
    // Ignore cache read errors
  }
  return null;
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
  } catch (e) {
    // Ignore cache write errors
  }
};

const MemberPortalProviderInner = ({ children, customerId, salesforceCustomer, isUserLoading, currentUser }) => {
  const navigate = useNavigate();
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(null);
  
  // Content state
  const [announcements, setAnnouncements] = useState(() => getCachedData(CACHE_KEYS.ANNOUNCEMENTS) || []);
  const [mediaItems, setMediaItems] = useState(() => getCachedData(CACHE_KEYS.MEDIA) || []);
  const [notifications, setNotifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(true);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Member info state - starts empty, filled by background loader
  const [memberInfoLoaded, setMemberInfoLoaded] = useState(false);
  const [memberInfoData, setMemberInfoData] = useState({
    personal: salesforceCustomer ? {
      firstName: salesforceCustomer.firstName,
      lastName: salesforceCustomer.lastName,
      email: salesforceCustomer.email
    } : null,
    contact: null,
    addresses: null,
    family: null,
    occupation: null,
    medical: null,
    cryo: null,
    legal: null,
    emergency: null,
    insurance: null,
    category: null,
    funding: null
  });
  
  // Track loading states
  const hasStartedLoading = useRef(false);
  const [backgroundLoadStarted, setBackgroundLoadStarted] = useState(false);

  // CRITICAL: Verify authentication
  useEffect(() => {
    if (!currentUser && !isUserLoading) {
      console.error('[MemberPortalProvider] No authenticated user');
      navigate('/login', { replace: true });
    }
  }, [currentUser, isUserLoading, navigate]);

  // Store Salesforce ID for analytics when available
  useEffect(() => {
    if (salesforceCustomer?.id) {
      localStorage.setItem('salesforceContactId', salesforceCustomer.id);
      sessionStorage.setItem('salesforceContactId', salesforceCustomer.id);
      
      window.__memberPortalData = {
        ...window.__memberPortalData,
        salesforceContactId: salesforceCustomer.id
      };
      
      if (window.analytics?.setSalesforceId) {
        window.analytics.setSalesforceId(salesforceCustomer.id);
      }
    }
  }, [salesforceCustomer]);

  // Load essential content (announcements & media) when component mounts
  useEffect(() => {
    if (!currentUser || hasStartedLoading.current) return;
    
    hasStartedLoading.current = true;
    
    const loadEssentialContent = async () => {
      console.log('[MemberPortal] Loading essential content...');
      
      try {
        // Load from cache first if available
        const cachedAnnouncements = getCachedData(CACHE_KEYS.ANNOUNCEMENTS);
        const cachedMedia = getCachedData(CACHE_KEYS.MEDIA);
        
        if (cachedAnnouncements || cachedMedia) {
          console.log('[MemberPortal] Using cached content');
          if (cachedAnnouncements) setAnnouncements(cachedAnnouncements);
          if (cachedMedia) setMediaItems(cachedMedia);
        }
        
        // Then fetch fresh data
        const [announcementsData, mediaData, notificationsData] = await Promise.allSettled([
          getAnnouncements().catch(err => {
            console.error('[MemberPortal] Announcements error:', err);
            return cachedAnnouncements || [];
          }),
          getMediaItems().catch(err => {
            console.error('[MemberPortal] Media error:', err);
            return cachedMedia || [];
          }),
          getNotifications().catch(err => {
            console.error('[MemberPortal] Notifications error:', err);
            return [];
          })
        ]);
        
        // Update state with fresh data
        const freshAnnouncements = announcementsData.status === 'fulfilled' ? announcementsData.value : [];
        const freshMedia = mediaData.status === 'fulfilled' ? mediaData.value : [];
        const freshNotifications = notificationsData.status === 'fulfilled' ? notificationsData.value : [];
        
        if (freshAnnouncements.length > 0) {
          setAnnouncements(freshAnnouncements);
          setCachedData(CACHE_KEYS.ANNOUNCEMENTS, freshAnnouncements);
        }
        
        if (freshMedia.length > 0) {
          setMediaItems(freshMedia);
          setCachedData(CACHE_KEYS.MEDIA, freshMedia);
        }
        
        setNotifications(freshNotifications);
        setNotificationsLoaded(true);
        setLastRefresh(new Date());
        
        // Set contentLoaded ONLY ONCE at the end
        setContentLoaded(true);
        
        console.log('[MemberPortal] Essential content loaded:', {
          announcements: freshAnnouncements.length,
          media: freshMedia.length,
          notifications: freshNotifications.length
        });
        
      } catch (error) {
        console.error('[MemberPortal] Error loading content:', error);
        setContentLoaded(true); // Still mark as loaded to prevent infinite loading
      }
    };
    
    loadEssentialContent();
  }, [currentUser]);

  // Start background loading of member data after essential content loads
  useEffect(() => {
    if (!salesforceCustomer?.id || !contentLoaded || backgroundLoadStarted) return;
    
    console.log('[MemberPortal] Starting background data load immediately...');
    setBackgroundLoadStarted(true);
    
    // Subscribe to updates from background loader
    backgroundDataLoader.subscribe((type, data) => {
      console.log(`[MemberPortal] Background data loaded: ${type}`);
      
      if (type === 'documents') {
        // Handle documents specifically
        if (data?.success && data?.data) {
          const docs = Array.isArray(data.data) ? data.data : 
                       data.data.documents || 
                       data.data.data?.documents || 
                       [];
          
          // Filter out .snote files and video testimony files
          const filteredDocs = docs.filter(doc => {
            const nameLC = doc.name.toLowerCase();
            return !nameLC.endsWith('.snote') && !nameLC.includes('video testimony');
          });
          
          setDocuments(filteredDocs);
          setDocumentsLoaded(true);
          console.log(`[MemberPortal] Documents loaded: ${filteredDocs.length} documents`);
        } else {
          // Even if documents fail, mark as loaded to prevent infinite loading
          setDocumentsLoaded(true);
          console.log('[MemberPortal] Documents loaded with no data');
        }
      } else {
        // Update memberInfoData with other data
        setMemberInfoData(prev => ({
          ...prev,
          [type]: data
        }));
      }
      
      // Mark as loaded when we get key data
      if (type === 'personal' || type === 'category') {
        setMemberInfoLoaded(true);
      }
    });
    
    // Start loading immediately - no delay!
    backgroundDataLoader.loadMemberDataInBackground(
      salesforceCustomer.id,
      customerId
    );
    
  }, [salesforceCustomer, customerId, contentLoaded, backgroundLoadStarted]);

  // Clean up background loader on unmount
  useEffect(() => {
    return () => {
      backgroundDataLoader.clear();
    };
  }, []);

  // SIMPLIFIED: Just get the user name from what we already have
  const customerName = React.useMemo(() => {
    // First check if we have loaded personal info from background
    if (memberInfoData.personal?.firstName && memberInfoData.personal?.lastName) {
      return `${memberInfoData.personal.firstName} ${memberInfoData.personal.lastName}`.trim();
    }
    
    // Then try salesforceCustomer
    if (salesforceCustomer) {
      return `${salesforceCustomer.firstName || ''} ${salesforceCustomer.lastName || ''}`.trim();
    }
    
    // Fallback to currentUser
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    
    // Last resort - use email
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    
    return 'Member';
  }, [salesforceCustomer, currentUser, memberInfoData.personal]);

  // Refresh functions
  const refreshContent = async () => {
    setIsPreloading(true);
    try {
      console.log('[MemberPortal] Refreshing content...');
      
      const [announcementsData, mediaData, notificationsData] = await Promise.allSettled([
        getAnnouncements(),
        getMediaItems(),
        getNotifications()
      ]);
      
      const freshAnnouncements = announcementsData.status === 'fulfilled' ? announcementsData.value : [];
      const freshMedia = mediaData.status === 'fulfilled' ? mediaData.value : [];
      const freshNotifications = notificationsData.status === 'fulfilled' ? notificationsData.value : [];
      
      setAnnouncements(freshAnnouncements || []);
      setMediaItems(freshMedia || []);
      setNotifications(freshNotifications || []);
      setLastRefresh(new Date());
      
      if (freshAnnouncements.length > 0) setCachedData(CACHE_KEYS.ANNOUNCEMENTS, freshAnnouncements);
      if (freshMedia.length > 0) setCachedData(CACHE_KEYS.MEDIA, freshMedia);
      
      return { announcementsData: freshAnnouncements, mediaData: freshMedia, notificationsData: freshNotifications };
    } catch (error) {
      console.error('[MemberPortal] Refresh error:', error);
      throw error;
    } finally {
      setIsPreloading(false);
    }
  };

  const refreshNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
      setNotificationsLoaded(true);
      return data;
    } catch (error) {
      console.error('[MemberPortal] Notifications refresh error:', error);
      return [];
    }
  };

  const refreshDocuments = async () => {
    if (!salesforceCustomer?.id) return [];
    
    try {
      console.log('[MemberPortal] Refreshing documents...');
      const result = await memberDataService.getDocuments(salesforceCustomer.id);
      
      if (result.success && result.data) {
        const docs = Array.isArray(result.data) ? result.data : 
                     result.data.documents || 
                     result.data.data?.documents || 
                     [];
        
        // Filter out .snote files and video testimony files
        const filteredDocs = docs.filter(doc => {
          const nameLC = doc.name.toLowerCase();
          return !nameLC.endsWith('.snote') && !nameLC.includes('video testimony');
        });
        
        setDocuments(filteredDocs);
        setDocumentsLoaded(true);
        console.log(`[MemberPortal] Documents refreshed: ${filteredDocs.length} documents`);
        return filteredDocs;
      }
    } catch (error) {
      console.error('[MemberPortal] Error refreshing documents:', error);
    }
    return [];
  };

  const refreshMemberInfo = async (forceRefresh = false) => {
    if (!salesforceCustomer?.id) return;
    
    console.log('[MemberPortal] Refreshing member info...');
    
    // Clear cache and restart background loading
    backgroundDataLoader.clear();
    setBackgroundLoadStarted(false);
    
    // Reset documents state
    setDocuments([]);
    setDocumentsLoaded(false);
    
    // Restart the background loading process
    setTimeout(() => {
      setBackgroundLoadStarted(true);
      backgroundDataLoader.loadMemberDataInBackground(
        salesforceCustomer.id,
        customerId
      );
    }, 100);
  };

  const value = {
    isPreloading,
    preloadError,
    customerId,
    salesforceCustomer,
    customerName,
    customerEmail: salesforceCustomer?.email || currentUser?.email || '',
    salesforceContactId: salesforceCustomer?.id || null,
    customerFirstName: salesforceCustomer?.firstName || customerName.split(' ')[0] || '',
    isDemoMode: false,
    hasValidNetsuiteId: isValidNetsuiteId(customerId),
    currentUser,
    
    // Content
    announcements,
    mediaItems,
    notifications,
    documents,
    contentLoaded,
    notificationsLoaded,
    documentsLoaded,
    refreshContent,
    refreshNotifications,
    refreshDocuments,
    lastRefresh,
    
    // Member info - populated by background loader
    memberInfoData,
    memberInfoLoaded,
    refreshMemberInfo
  };

  return (
    <MemberPortalContext.Provider value={value}>
      {children}
    </MemberPortalContext.Provider>
  );
};

// Main provider
export const MemberPortalProvider = ({ children }) => {
  const { currentUser, netsuiteCustomerId, salesforceCustomer, isLoading } = useUser();
  
  //console.log('=== MEMBER PORTAL PROVIDER DEBUG ===');
  //console.log('isLoading:', isLoading);
  //console.log('salesforceCustomer:', salesforceCustomer);
  //console.log('currentUser:', currentUser);
  //console.log('netsuiteCustomerId:', netsuiteCustomerId);
  //console.log('===================================');
  
  // CRITICAL SECURITY CHECK
  if (!isLoading && !currentUser) {
    //console.error('[MemberPortalProvider] SECURITY: No authenticated user - blocking access');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  // Show loading while UserContext loads
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <MemberPortalProviderInner 
      customerId={netsuiteCustomerId} 
      salesforceCustomer={salesforceCustomer}
      isUserLoading={isLoading}
      currentUser={currentUser}
    >
      {children}
    </MemberPortalProviderInner>
  );
};

export const useMemberPortal = () => {
  const context = useContext(MemberPortalContext);
  if (!context) {
    throw new Error('useMemberPortal must be used within MemberPortalProvider');
  }
  return context;
};