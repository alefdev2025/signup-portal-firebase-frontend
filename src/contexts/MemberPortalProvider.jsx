// contexts/MemberPortalProvider.jsx - Enhanced with caching, retry logic, and auto-refresh
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUser } from './UserContext';
import { paymentDataService } from '../components/portal/services/paymentDataService';
import { memberDataService } from '../components/portal/services/memberDataService';
import { CustomerDataProvider } from '../components/portal/contexts/CustomerDataContext';
import { getAnnouncements, getMediaItems } from '../services/content';
import { getNotifications } from '../services/notifications';
import { getMemberCategory } from '../components/portal/services/salesforce/memberInfo';

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
  DOCUMENTS: 'alcor_documents_cache',
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
  const [documents, setDocuments] = useState([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Member info state
  const [memberInfoLoaded, setMemberInfoLoaded] = useState(false);
  const [memberInfoData, setMemberInfoData] = useState({
    personal: null,
    contact: null,
    addresses: null,
    family: null,
    occupation: null,
    medical: null,
    cryo: null,
    legal: null,
    emergency: null,
    insurance: null,
    category: null
  });
  
  // Refs for intervals
  const refreshIntervalRef = useRef(null);

  // Function to preload all member info
  const preloadMemberInfo = async (forceRefresh = false) => {
    if (!salesforceCustomer?.id) {
      console.log('[MemberPortal] No Salesforce ID available for member info preload');
      return;
    }

    // Check if we've already loaded and don't need to refresh
    if (memberInfoLoaded && !forceRefresh) {
      console.log('[MemberPortal] Member info already loaded, skipping preload');
      return memberInfoData;
    }

    console.log('🚀 [MemberPortal] Preloading all member information...');
    
    try {
      // Clear cache if forcing refresh
      if (forceRefresh) {
        memberDataService.clearCache(salesforceCustomer.id);
      }

      // Fetch all member data in parallel
      const [
        personalRes,
        contactRes,
        addressRes,
        familyRes,
        occupationRes,
        medicalRes,
        cryoRes,
        legalRes,
        emergencyRes,
        insuranceRes,
        categoryRes
      ] = await Promise.allSettled([
        memberDataService.getPersonalInfo(salesforceCustomer.id),
        memberDataService.getContactInfo(salesforceCustomer.id),
        memberDataService.getAddresses(salesforceCustomer.id),
        memberDataService.getFamilyInfo(salesforceCustomer.id),
        memberDataService.getOccupation(salesforceCustomer.id),
        memberDataService.getMedicalInfo(salesforceCustomer.id),
        memberDataService.getCryoArrangements(salesforceCustomer.id),
        memberDataService.getLegalInfo(salesforceCustomer.id),
        memberDataService.getEmergencyContacts(salesforceCustomer.id),
        memberDataService.getInsurance(salesforceCustomer.id),
        getMemberCategory(salesforceCustomer.id)
      ]);

      // Process results
      const data = {
        personal: personalRes.status === 'fulfilled' ? personalRes.value : null,
        contact: contactRes.status === 'fulfilled' ? contactRes.value : null,
        addresses: addressRes.status === 'fulfilled' ? addressRes.value : null,
        family: familyRes.status === 'fulfilled' ? familyRes.value : null,
        occupation: occupationRes.status === 'fulfilled' ? occupationRes.value : null,
        medical: medicalRes.status === 'fulfilled' ? medicalRes.value : null,
        cryo: cryoRes.status === 'fulfilled' ? cryoRes.value : null,
        legal: legalRes.status === 'fulfilled' ? legalRes.value : null,
        emergency: emergencyRes.status === 'fulfilled' ? emergencyRes.value : null,
        insurance: insuranceRes.status === 'fulfilled' ? insuranceRes.value : null,
        category: categoryRes.status === 'fulfilled' ? categoryRes.value : null
      };

      setMemberInfoData(data);
      setMemberInfoLoaded(true);

      console.log('✅ [MemberPortal] Member info preloaded successfully');
      return data;
    } catch (error) {
      console.error('❌ [MemberPortal] Failed to preload member info:', error);
      return null;
    }
  };

  // Function to fetch fresh content
  const fetchFreshContent = async (updateUI = true, showLoading = true) => {
    console.log('🚀 [MemberPortal] Fetching fresh content...', { updateUI, showLoading });
    
    if (showLoading && updateUI) {
      setIsPreloading(true);
    }
    
    try {
      const [announcementsData, mediaData, notificationsData, documentsData] = await Promise.all([
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
        }),
        fetchWithRetry(async () => {
          if (salesforceCustomer?.id) {
            console.log('[MemberPortal] Fetching documents for:', salesforceCustomer.id);
            const result = await memberDataService.getDocuments(salesforceCustomer.id);
            if (result.success && result.data) {
              const docs = Array.isArray(result.data) ? result.data : 
                         result.data.documents || 
                         result.data.data?.documents || 
                         [];
              // Filter out .snote files and video testimony files
              return docs.filter(doc => {
                const nameLC = doc.name.toLowerCase();
                return !nameLC.endsWith('.snote') && !nameLC.includes('video testimony');
              });
            }
          }
          return [];
        }).catch(err => {
          console.error('[MemberPortal] Failed to load documents after retries:', err);
          return getCachedData(CACHE_KEYS.DOCUMENTS) || [];
        })
      ]);
      
      // Cache the successful responses
      if (announcementsData && announcementsData.length > 0) {
        setCachedData(CACHE_KEYS.ANNOUNCEMENTS, announcementsData);
      }
      if (mediaData && mediaData.length > 0) {
        setCachedData(CACHE_KEYS.MEDIA, mediaData);
      }
      if (documentsData && documentsData.length > 0) {
        setCachedData(CACHE_KEYS.DOCUMENTS, documentsData);
      }
      
      if (updateUI) {
        setAnnouncements(announcementsData || []);
        setMediaItems(mediaData || []);
        setNotifications(notificationsData || []);
        setDocuments(documentsData || []);
        setContentLoaded(true);
        setNotificationsLoaded(true);
        setDocumentsLoaded(true);
        setLastRefresh(new Date());
      }
      
      console.log('✅ [MemberPortal] Fresh content loaded:', {
        announcements: announcementsData?.length || 0,
        media: mediaData?.length || 0,
        notifications: notificationsData?.length || 0,
        documents: documentsData?.length || 0,
        timestamp: new Date().toLocaleTimeString()
      });
      
      return { announcementsData, mediaData, notificationsData, documentsData };
    } catch (error) {
      console.error('❌ [MemberPortal] Content fetch failed:', error);
      
      // Try to use cache as fallback
      const cachedAnnouncements = getCachedData(CACHE_KEYS.ANNOUNCEMENTS) || [];
      const cachedMedia = getCachedData(CACHE_KEYS.MEDIA) || [];
      const cachedDocuments = getCachedData(CACHE_KEYS.DOCUMENTS) || [];
      
      if (updateUI) {
        setAnnouncements(cachedAnnouncements);
        setMediaItems(cachedMedia);
        setDocuments(cachedDocuments);
        setContentLoaded(true);
        setNotificationsLoaded(true);
        setDocumentsLoaded(true);
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
      const cachedDocuments = getCachedData(CACHE_KEYS.DOCUMENTS);
      
      if (cachedAnnouncements || cachedMedia || cachedDocuments) {
        console.log('📦 [MemberPortal] Displaying cached content while fetching fresh data');
        setAnnouncements(cachedAnnouncements || []);
        setMediaItems(cachedMedia || []);
        setDocuments(cachedDocuments || []);
        setContentLoaded(true);
        setDocumentsLoaded(true);
        
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
          memberDataService.preloadInBackground(salesforceCustomer.id),
          preloadMemberInfo() // Add member info preload here
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

  // Function to refresh just documents
  const refreshDocuments = async () => {
    console.log('🔄 [MemberPortal] Refreshing documents...');
    try {
      if (!salesforceCustomer?.id) {
        console.warn('[MemberPortal] No Salesforce customer ID available for documents');
        return [];
      }
      
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
        setCachedData(CACHE_KEYS.DOCUMENTS, filteredDocs);
        console.log('✅ [MemberPortal] Documents refreshed:', filteredDocs?.length || 0);
        return filteredDocs;
      }
    } catch (error) {
      console.error('❌ [MemberPortal] Documents refresh failed:', error);
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
    documents,
    contentLoaded,
    notificationsLoaded,
    documentsLoaded,
    refreshContent,
    refreshNotifications,
    refreshDocuments,
    lastRefresh,
    
    // Member info values
    memberInfoData,
    memberInfoLoaded,
    refreshMemberInfo: () => preloadMemberInfo(true) // Force refresh
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