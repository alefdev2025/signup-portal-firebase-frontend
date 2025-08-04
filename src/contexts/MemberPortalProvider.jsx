// contexts/MemberPortalProvider.jsx - Enhanced with caching, retry logic, and auto-refresh
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useUser } from './UserContext';
import { paymentDataService } from '../components/portal/services/paymentDataService';
import { memberDataService } from '../components/portal/services/memberDataService';
import { CustomerDataProvider } from '../components/portal/contexts/CustomerDataContext';
import { getAnnouncements, getMediaItems } from '../services/content';
import { getNotifications } from '../services/notifications';
import { getMemberCategory } from '../components/portal/services/salesforce/memberInfo';
import { auth } from '../services/firebase';

// ============================================
// DEMO CONFIGURATION - TOGGLE HERE
// ============================================
const DEMO_MODE = false;  // <-- TOGGLE THIS ON/OFF

// Set this to 'nicole' or 'anthony'
const DEMO_PERSON = 'anthony'; // 'nicole' or 'anthony'

const DEMO_CONFIGS = {
 nicole: {
   netsuiteCustomerId: '4666',
   salesforceContactId: '0038W00001ShAjyQAF',
   customerName: 'Nicole Olson',
   customerEmail: 'nh4olson@gmail.com',
 },
 anthony: {
   netsuiteCustomerId: '4414',
   salesforceContactId: '0031I00000tRcNZ',  // Fixed: removed 'QAF' suffix
   customerName: 'Anthony [Lastname]',
   customerEmail: 'asnapier@gmail.com',
 },
};

const DEMO_CONFIG = DEMO_CONFIGS[DEMO_PERSON];

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

// Retry logic helper
const fetchWithRetry = async (fetchFn, maxRetries = 3, delay = 1000) => {
 for (let i = 0; i < maxRetries; i++) {
   try {
     const result = await fetchFn();
     if (result && (Array.isArray(result) ? result.length > 0 : true)) {
       return result;
     }
   } catch (error) {
     if (i < maxRetries - 1) {
       const waitTime = delay * (i + 1);
       await new Promise(resolve => setTimeout(resolve, waitTime));
     }
   }
 }
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
   category: null,
   funding: null
 });
 
 // Refs for intervals
 const refreshIntervalRef = useRef(null);

 // NEW: Store Salesforce ID for analytics when it becomes available
 useEffect(() => {
   if (salesforceCustomer?.id) {
     // Store for analytics service
     localStorage.setItem('salesforceContactId', salesforceCustomer.id);
     sessionStorage.setItem('salesforceContactId', salesforceCustomer.id);
     
     // Also set on window for immediate access
     window.__memberPortalData = {
       ...window.__memberPortalData,
       salesforceContactId: salesforceCustomer.id
     };
     
     // Let analytics service know if it exists
     if (window.analytics?.setSalesforceId) {
       window.analytics.setSalesforceId(salesforceCustomer.id);
     }
   }
 }, [salesforceCustomer]);

 const preloadMemberInfo = async (forceRefresh = false) => {
   if (!salesforceCustomer?.id) {
     return;
   }
 
   // Check if we've already loaded and don't need to refresh
   if (memberInfoLoaded && !forceRefresh) {
     return memberInfoData;
   }
   
   try {
     // Clear cache if forcing refresh
     if (forceRefresh) {
       memberDataService.clearCache(salesforceCustomer.id);
     }
 
     // Fetch all member data in parallel - INCLUDING FUNDING
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
       categoryRes,
       fundingRes
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
       getMemberCategory(salesforceCustomer.id),
       memberDataService.getFundingInfo(salesforceCustomer.id)
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
       category: categoryRes.status === 'fulfilled' ? categoryRes.value : null,
       funding: fundingRes.status === 'fulfilled' ? fundingRes.value : null
     };
 
     setMemberInfoData(data);
     setMemberInfoLoaded(true);
 
     return data;
   } catch (error) {
     return null;
   }
 };

 // Function to fetch fresh content
 const fetchFreshContent = async (updateUI = true, showLoading = true) => {
   if (showLoading && updateUI) {
     setIsPreloading(true);
   }
   
   try {
     const [announcementsData, mediaData, notificationsData, documentsData] = await Promise.all([
       fetchWithRetry(() => getAnnouncements()).catch(err => {
         return getCachedData(CACHE_KEYS.ANNOUNCEMENTS) || [];
       }),
       fetchWithRetry(() => getMediaItems()).catch(err => {
         return getCachedData(CACHE_KEYS.MEDIA) || [];
       }),
       fetchWithRetry(() => getNotifications()).catch(err => {
         return [];
       }),
       fetchWithRetry(async () => {
         if (salesforceCustomer?.id) {
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
     
     return { announcementsData, mediaData, notificationsData, documentsData };
   } catch (error) {
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
     return;
   }
   
   const loadContent = async () => {
     setHasInitialLoad(true);
     
     // Try to load from cache first for instant display
     const cachedAnnouncements = getCachedData(CACHE_KEYS.ANNOUNCEMENTS);
     const cachedMedia = getCachedData(CACHE_KEYS.MEDIA);
     const cachedDocuments = getCachedData(CACHE_KEYS.DOCUMENTS);
     
     if (cachedAnnouncements || cachedMedia || cachedDocuments) {
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
       Promise.all([
         //paymentDataService.preloadInBackground(customerId),
         memberDataService.preloadInBackground(salesforceCustomer.id),
         preloadMemberInfo()
       ]).catch(err => {
         // Ignore preload errors
       });
     }
   };
   
   loadContent();
 }, []); // Remove dependencies to ensure this only runs once

 // Auto-refresh effect
 useEffect(() => {
   if (!AUTO_REFRESH_ENABLED) {
     return;
   }
   
   // Clear any existing interval
   if (refreshIntervalRef.current) {
     clearInterval(refreshIntervalRef.current);
   }
   
   // Set up new interval
   refreshIntervalRef.current = setInterval(() => {
     fetchFreshContent(true, false);
   }, AUTO_REFRESH_INTERVAL);
   
   // Cleanup on unmount
   return () => {
     if (refreshIntervalRef.current) {
       clearInterval(refreshIntervalRef.current);
     }
   };
 }, []); // Empty dependency array ensures this only runs once

 // Function to refresh content manually
 const refreshContent = async () => {
   return fetchFreshContent(true, true);
 };

 // Then use this refreshNotifications function:
 const refreshNotifications = async () => {
   try {
     const currentUser = auth?.currentUser;
   } catch (authError) {
     // Ignore auth errors
   }
   
   try {
     const notificationsData = await fetchWithRetry(() => {
       return getNotifications();
     }) || [];
     
     setNotifications(notificationsData);
     setNotificationsLoaded(true);
     
     return notificationsData;
   } catch (error) {
     // Still set loaded to true on error
     setNotifications([]);
     setNotificationsLoaded(true);
     
     return [];
   }
 };

 // Function to refresh just documents
 const refreshDocuments = async () => {
   try {
     if (!salesforceCustomer?.id) {
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
       return filteredDocs;
     }
   } catch (error) {
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
   customerFirstName: salesforceCustomer?.firstName || '',
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
   // No NetSuite customer ID found
 }

 // If no Salesforce customer found after loading and not in demo mode, show a warning
 if (!isLoading && !effectiveSalesforceCustomer?.id && currentUser && !DEMO_MODE) {
   // No Salesforce customer found
 }

 // Show demo mode indicator (optional - remove for production)
 const DemoIndicator = DEMO_MODE ? (
   <div className="fixed bottom-4 right-4 bg-gray-300 text-black px-3 py-1 rounded-md text-sm font-semibold z-50">
     
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