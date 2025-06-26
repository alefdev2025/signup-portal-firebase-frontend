// contexts/MemberPortalProvider.jsx - Enhanced with caching, retry logic, and auto-refresh
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUser } from './UserContext';
import { paymentDataService } from '../components/portal/services/paymentDataService';
import { memberDataService } from '../components/portal/services/memberDataService';
import { CustomerDataProvider } from '../components/portal/contexts/CustomerDataContext';
import { getAnnouncements, getMediaItems } from '../services/content';
import { getNotifications } from '../services/notifications';

// ============================================
// DEMO CONFIGURATION - TOGGLE HERE
// ============================================
const DEMO_MODE = true;  // <-- TOGGLE THIS ON/OFF
const DEMO_CONFIG = {
  netsuiteCustomerId: '4414',
  salesforceContactId: '0031I00000tRcNZ', // <-- PUT YOUR DEMO CONTACT ID HERE
  customerName: '0031I00000tRcNZ',
  customerEmail: 'asnapier@gmail.com'
};
// ============================================

// Cache configuration
const CACHE_KEYS = {
  ANNOUNCEMENTS: 'alcor_announcements_cache',
  MEDIA: 'alcor_media_cache',
  CACHE_TIMESTAMP: 'alcor_content_cache_timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds
const AUTO_REFRESH_ENABLED = false; // TEMPORARY: Disable auto-refresh to debug

const MemberPortalContext = createContext();

// Helper functions for caching
const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(key);
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        console.log(`✅ [Cache] Using cached ${key}, age: ${Math.round(age/1000)}s`);
        return JSON.parse(cached);
      } else {
        console.log(`⏰ [Cache] Cache expired for ${key}, age: ${Math.round(age/1000)}s`);
      }
    }
  } catch (e) {
    console.error('[Cache] Read error:', e);
  }
  return null;
};

const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    console.log(`💾 [Cache] Saved ${key} to cache`);
  } catch (e) {
    console.error('[Cache] Write error:', e);
  }
};

// Retry logic helper
const fetchWithRetry = async (fetchFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 [Retry] Attempt ${i + 1}/${maxRetries}`);
      const result = await fetchFn();
      if (result && (Array.isArray(result) ? result.length > 0 : true)) {
        console.log(`✅ [Retry] Success on attempt ${i + 1}`);
        return result;
      }
      console.log(`⚠️ [Retry] Empty result on attempt ${i + 1}`);
    } catch (error) {
      console.error(`❌ [Retry] Attempt ${i + 1} failed:`, error);
      if (i < maxRetries - 1) {
        const waitTime = delay * (i + 1);
        console.log(`⏳ [Retry] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  console.error('❌ [Retry] All attempts failed');
  return null;
};

// Inner component that uses CustomerDataProvider
const MemberPortalProviderInner = ({ children, customerId, salesforceCustomer }) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  // Content state
  const [announcements, setAnnouncements] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Refs for intervals
  const refreshIntervalRef = useRef(null);

  // Function to fetch fresh content
  const fetchFreshContent = async (updateUI = true, showLoading = true) => {
    console.log('🚀 [MemberPortal] Fetching fresh content...', { updateUI, showLoading });
    
    if (showLoading && updateUI) {
      setIsPreloading(true);
    }
    
    try {
      const [announcementsData, mediaData, notificationsData] = await Promise.all([
        fetchWithRetry(() => getAnnouncements()).catch(err => {
          console.error('[MemberPortal] Failed to load announcements after retries:', err);
          return getCachedData(CACHE_KEYS.ANNOUNCEMENTS) || [];
        }),
        fetchWithRetry(() => getMediaItems()).catch(err => {
          console.error('[MemberPortal] Failed to load media after retries:', err);
          return getCachedData(CACHE_KEYS.MEDIA) || [];
        }),
        fetchWithRetry(() => getNotifications()).catch(err => {
          console.error('[MemberPortal] Failed to load notifications after retries:', err);
          return [];
        })
      ]);
      
      // Cache the successful responses
      if (announcementsData && announcementsData.length > 0) {
        setCachedData(CACHE_KEYS.ANNOUNCEMENTS, announcementsData);
      }
      if (mediaData && mediaData.length > 0) {
        setCachedData(CACHE_KEYS.MEDIA, mediaData);
      }
      
      if (updateUI) {
        setAnnouncements(announcementsData || []);
        setMediaItems(mediaData || []);
        setNotifications(notificationsData || []);
        setContentLoaded(true);
        setNotificationsLoaded(true);
        setLastRefresh(new Date());
      }
      
      console.log('✅ [MemberPortal] Fresh content loaded:', {
        announcements: announcementsData?.length || 0,
        media: mediaData?.length || 0,
        notifications: notificationsData?.length || 0,
        timestamp: new Date().toLocaleTimeString()
      });
      
      return { announcementsData, mediaData, notificationsData };
    } catch (error) {
      console.error('❌ [MemberPortal] Content fetch failed:', error);
      
      // Try to use cache as fallback
      const cachedAnnouncements = getCachedData(CACHE_KEYS.ANNOUNCEMENTS) || [];
      const cachedMedia = getCachedData(CACHE_KEYS.MEDIA) || [];
      
      if (updateUI) {
        setAnnouncements(cachedAnnouncements);
        setMediaItems(cachedMedia);
        setContentLoaded(true);
        setNotificationsLoaded(true);
      }
      
      setPreloadError(error.message);
    } finally {
      if (updateUI) {
        setIsPreloading(false);
      }
    }
  };

  // Initial load effect
  useEffect(() => {
    if (hasInitialLoad) {
      console.log('🚫 [MemberPortalProvider] Initial load already completed, skipping...');
      return;
    }
    
    const loadContent = async () => {
      console.log('🚀 [MemberPortalProvider] Initial content load...');
      setHasInitialLoad(true);
      
      // Try to load from cache first for instant display
      const cachedAnnouncements = getCachedData(CACHE_KEYS.ANNOUNCEMENTS);
      const cachedMedia = getCachedData(CACHE_KEYS.MEDIA);
      
      if (cachedAnnouncements || cachedMedia) {
        console.log('📦 [MemberPortal] Displaying cached content while fetching fresh data');
        setAnnouncements(cachedAnnouncements || []);
        setMediaItems(cachedMedia || []);
        setContentLoaded(true);
        
        // Fetch fresh data in background
        fetchFreshContent(true, false);
      } else {
        // No cache, fetch immediately with loading state
        await fetchFreshContent(true, true);
      }
      
      // Load customer-specific data if we have IDs
      if (customerId && salesforceCustomer?.id) {
        console.log('[MemberPortal] Loading customer-specific data:', {
          netsuiteId: customerId,
          salesforceId: salesforceCustomer.id,
          demoMode: DEMO_MODE
        });
        
        Promise.all([
          paymentDataService.preloadInBackground(customerId),
          memberDataService.preloadInBackground(salesforceCustomer.id)
        ]).catch(err => {
          console.error('[MemberPortal] Customer data preload failed:', err);
        });
      }
    };
    
    loadContent();
  }, []); // Remove dependencies to ensure this only runs once

  // Auto-refresh effect
  useEffect(() => {
    if (!AUTO_REFRESH_ENABLED) {
      console.log('⏰ [MemberPortal] Auto-refresh is disabled');
      return;
    }
    
    console.log('⏰ [MemberPortal] Setting up auto-refresh interval (30s)');
    
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up new interval
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 [MemberPortal] Auto-refresh triggered');
      fetchFreshContent(true, false);
    }, AUTO_REFRESH_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        console.log('🛑 [MemberPortal] Clearing auto-refresh interval');
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []); // Empty dependency array ensures this only runs once

  // Function to refresh content manually
  const refreshContent = async () => {
    console.log('🔄 [MemberPortal] Manual refresh triggered');
    return fetchFreshContent(true, true);
  };

  // Function to refresh just notifications
  const refreshNotifications = async () => {
    console.log('🔄 [MemberPortal] Refreshing notifications...');
    try {
      const notificationsData = await fetchWithRetry(() => getNotifications()) || [];
      setNotifications(notificationsData);
      setNotificationsLoaded(true);
      console.log('✅ [MemberPortal] Notifications refreshed:', notificationsData?.length || 0);
      return notificationsData;
    } catch (error) {
      console.error('❌ [MemberPortal] Notifications refresh failed:', error);
      return [];
    }
  };

  const value = {
    // Existing values
    isPreloading,
    preloadError,
    customerId,
    salesforceCustomer,
    customerName: salesforceCustomer ? `${salesforceCustomer.firstName} ${salesforceCustomer.lastName}` : '',
    customerEmail: salesforceCustomer?.email || '',
    salesforceContactId: salesforceCustomer?.id || null,
    isDemoMode: DEMO_MODE,
    
    // Content values
    announcements,
    mediaItems,
    notifications,
    contentLoaded,
    notificationsLoaded,
    refreshContent,
    refreshNotifications,
    lastRefresh
  };

  return (
    <MemberPortalContext.Provider value={value}>
      {children}
    </MemberPortalContext.Provider>
  );
};

// Main provider that wraps with CustomerDataProvider
export const MemberPortalProvider = ({ children }) => {
  const { currentUser, netsuiteCustomerId, salesforceCustomer, isLoading } = useUser();
  
  // Apply demo overrides if enabled
  let effectiveCustomerId = netsuiteCustomerId;
  let effectiveSalesforceCustomer = salesforceCustomer;
  
  if (DEMO_MODE) {
    console.log('🎮 DEMO MODE ACTIVE - Using demo IDs');
    
    // Override NetSuite ID
    effectiveCustomerId = DEMO_CONFIG.netsuiteCustomerId;
    
    // Override Salesforce customer
    if (salesforceCustomer) {
      // If we have a real customer, just override the ID
      effectiveSalesforceCustomer = {
        ...salesforceCustomer,
        id: DEMO_CONFIG.salesforceContactId
      };
    } else {
      // If no customer found, create a demo one
      effectiveSalesforceCustomer = {
        id: DEMO_CONFIG.salesforceContactId,
        firstName: DEMO_CONFIG.customerName.split(' ')[0],
        lastName: DEMO_CONFIG.customerName.split(' ')[1] || '',
        email: currentUser?.email || DEMO_CONFIG.customerEmail,
        netsuiteCustomerId: DEMO_CONFIG.netsuiteCustomerId
      };
    }
  }
  
  console.log('[MemberPortalProvider] Current state:', {
    hasUser: !!currentUser,
    email: currentUser?.email,
    netsuiteCustomerId: effectiveCustomerId,
    salesforceCustomerId: effectiveSalesforceCustomer?.id,
    isLoading: isLoading,
    demoMode: DEMO_MODE
  });
  
  // Show loading state while we fetch the customer IDs
  if (isLoading && !DEMO_MODE && !netsuiteCustomerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  // If no NetSuite ID found after loading and not in demo mode, show a warning
  if (!isLoading && !effectiveCustomerId && currentUser && !DEMO_MODE) {
    console.warn('[MemberPortal] No NetSuite customer ID found for user:', currentUser.email);
  }

  // If no Salesforce customer found after loading and not in demo mode, show a warning
  if (!isLoading && !effectiveSalesforceCustomer?.id && currentUser && !DEMO_MODE) {
    console.warn('[MemberPortal] No Salesforce customer found for user:', currentUser.email);
  }

  // Show demo mode indicator (optional - remove for production)
  const DemoIndicator = DEMO_MODE ? (
    <div className="fixed bottom-4 right-4 bg-gray-300 text-black px-3 py-1 rounded-md text-sm font-semibold z-50">
      🎮 DEMO MODE
    </div>
  ) : null;  

  // Wrap with CustomerDataProvider so all children have access to it
  return (
    <>
      {DemoIndicator}
      <CustomerDataProvider customerId={effectiveCustomerId}>
        <MemberPortalProviderInner 
          customerId={effectiveCustomerId} 
          salesforceCustomer={effectiveSalesforceCustomer}
        >
          {children}
        </MemberPortalProviderInner>
      </CustomerDataProvider>
    </>
  );
};

export const useMemberPortal = () => {
  const context = useContext(MemberPortalContext);
  if (!context) {
    throw new Error('useMemberPortal must be used within MemberPortalProvider');
  }
  return context;
};