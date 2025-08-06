// contexts/MemberPortalProvider.jsx - Enhanced with security checks
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
   netsuiteCustomerId: '4667', // changed from 4666
   salesforceContactId: '0038W00001ShAjyQAF',
   customerName: 'Nicole Olson',
   customerEmail: 'nh4olson@gmail.com',
 },
 anthony: {
   netsuiteCustomerId: '4414',
   salesforceContactId: '0031I00000tRcNZ',
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
const AUTO_REFRESH_ENABLED = false;

const MemberPortalContext = createContext();

// Helper function to check if NetSuite ID is valid
const isValidNetsuiteId = (id) => {
  return id && id !== 'null' && id !== 'undefined' && id !== '' && id !== null && id !== undefined;
};

// Helper function to ensure fresh auth token
const ensureFreshToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    // Force token refresh if it's close to expiring
    const token = await user.getIdTokenResult();
    const expiresIn = new Date(token.expirationTime).getTime() - Date.now();
    
    if (expiresIn < 5 * 60 * 1000) { // Less than 5 minutes
      console.log('[MemberPortal] Token expiring soon, refreshing...');
      await user.getIdToken(true);
    }
    
    return token;
  } catch (err) {
    console.error('[MemberPortal] Token refresh error:', err);
    throw err;
  }
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

// Retry logic helper
const fetchWithRetry = async (fetchFn, maxRetries = 1, delay = 200) => {
 for (let i = 0; i < maxRetries; i++) {
   try {
     const result = await fetchFn();
     if (result && (Array.isArray(result) ? result.length > 0 : true)) {
       return result;
     }
   } catch (error) {
     if (i < maxRetries - 1) {
       await new Promise(resolve => setTimeout(resolve, delay));
     }
   }
 }
 return null;
};

// Inner component that uses CustomerDataProvider
const MemberPortalProviderInner = ({ children, customerId, salesforceCustomer, isUserLoading, currentUser }) => {
 const [isPreloading, setIsPreloading] = useState(false);
 const [preloadError, setPreloadError] = useState(null);
 const [hasInitialLoad, setHasInitialLoad] = useState(false);
 const [authCheckComplete, setAuthCheckComplete] = useState(false);
 
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
 const contentLoadStartedRef = useRef(false);

 // CRITICAL SECURITY CHECK - Run on every render
 /*useEffect(() => {
   const checkAuth = async () => {
     // Always verify we have an authenticated user
     if (!currentUser) {
       console.error('[MemberPortalProvider] SECURITY: No authenticated user detected');
       window.location.href = '/login';
       return;
     }
     
     // Verify the auth token is still valid
     try {
       await ensureFreshToken();
       setAuthCheckComplete(true);
     } catch (error) {
       console.error('[MemberPortalProvider] SECURITY: Invalid auth token');
       window.location.href = '/login';
     }
   };
   
   checkAuth();
 }, [currentUser]); // Removed navigate from dependencies*/

 // Don't render anything until auth check is complete
 /*if (!authCheckComplete) {
   return (
     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
         <p className="text-gray-600">Verifying access...</p>
       </div>
     </div>
   );
 }*/

 // Store Salesforce ID for analytics when it becomes available
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

 const preloadMemberInfo = async (forceRefresh = false) => {
   if (!salesforceCustomer?.id) {
     return;
   }
 
   if (memberInfoLoaded && !forceRefresh) {
     return memberInfoData;
   }
   
   try {
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
   console.time('[MemberPortal] fetchFreshContent');
   
   try {
     await ensureFreshToken();
   } catch (error) {
     console.error('[MemberPortal] Auth error during content fetch');
     window.location.href = '/login';
     return;
   }
   
   if (showLoading && updateUI) {
     setIsPreloading(true);
   }
   
   try {
     console.time('[MemberPortal] Content API Calls');
     const [announcementsData, mediaData, notificationsData, documentsData] = await Promise.all([
       fetchWithRetry(() => {
         console.time('[MemberPortal] Announcements Fetch');
         return getAnnouncements().finally(() => {
           //console.timeEnd('[MemberPortal] Announcements Fetch');
         });
       }).catch(err => {
         console.error('[MemberPortal] Announcements error:', err);
         return getCachedData(CACHE_KEYS.ANNOUNCEMENTS) || [];
       }),
       fetchWithRetry(() => {
         console.time('[MemberPortal] Media Fetch');
         return getMediaItems().finally(() => {
           //console.timeEnd('[MemberPortal] Media Fetch');
         });
       }).catch(err => {
         console.error('[MemberPortal] Media error:', err);
         return getCachedData(CACHE_KEYS.MEDIA) || [];
       }),
       fetchWithRetry(() => getNotifications()).catch(err => {
         console.error('[MemberPortal] Notifications error:', err);
         return [];
       }),
       fetchWithRetry(async () => {
         if (salesforceCustomer?.id) {
           try {
             const result = await memberDataService.getDocuments(salesforceCustomer.id);
             if (result.success && result.data) {
               const docs = Array.isArray(result.data) ? result.data : 
                          result.data.documents || 
                          result.data.data?.documents || 
                          [];
               return docs.filter(doc => {
                 const nameLC = doc.name.toLowerCase();
                 return !nameLC.endsWith('.snote') && !nameLC.includes('video testimony');
               });
             }
           } catch (err) {
             console.error('[MemberPortal] Documents fetch error:', err);
             return [];
           }
         }
         return [];
       }).catch(err => {
         console.error('[MemberPortal] Documents retry failed:', err);
         return getCachedData(CACHE_KEYS.DOCUMENTS) || [];
       })
     ]);
     //console.timeEnd('[MemberPortal] Content API Calls');
     
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
     
     //console.timeEnd('[MemberPortal] fetchFreshContent');
     return { announcementsData, mediaData, notificationsData, documentsData };
   } catch (error) {
     console.error('[MemberPortal] fetchFreshContent error:', error);
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
     //console.timeEnd('[MemberPortal] fetchFreshContent');
   }
 };

 // Load content when currentUser is available
 useEffect(() => {
   if (contentLoadStartedRef.current || !currentUser) {
     return;
   }
   contentLoadStartedRef.current = true;
   
   console.log('[MemberPortal] Component mounted with currentUser, starting parallel content load');
   
   const loadContentImmediately = async () => {
     const cachedAnnouncements = getCachedData(CACHE_KEYS.ANNOUNCEMENTS);
     const cachedMedia = getCachedData(CACHE_KEYS.MEDIA);
     const cachedDocuments = getCachedData(CACHE_KEYS.DOCUMENTS);
     
     if (cachedAnnouncements || cachedMedia || cachedDocuments) {
       console.log('[MemberPortal] Loading from cache first');
       setAnnouncements(cachedAnnouncements || []);
       setMediaItems(cachedMedia || []);
       setDocuments(cachedDocuments || []);
       setContentLoaded(true);
       setDocumentsLoaded(true);
     }
     
     try {
       await currentUser.getIdToken();
       await fetchFreshContent(true, !cachedAnnouncements);
     } catch (error) {
       console.error('[MemberPortal] Error loading content:', error);
     }
   };
   
   loadContentImmediately();
 }, [currentUser]);

 // Load member-specific data when salesforce customer becomes available
 useEffect(() => {
   if (salesforceCustomer?.id && !isUserLoading && currentUser) {
     console.log('[MemberPortal] Loading member-specific data');
     console.log('[MemberPortal] NetSuite Customer ID:', customerId);
     console.log('[MemberPortal] Is valid NetSuite ID:', isValidNetsuiteId(customerId));
     
     const loadCoreData = async () => {
       try {
         await Promise.all([
           memberDataService.preloadInBackground(salesforceCustomer.id),
           preloadMemberInfo()
         ]);
         console.log('[MemberPortal] Core member data loaded successfully');
       } catch (err) {
         console.error('[MemberPortal] Error loading core member data:', err);
       }
     };
     
     const loadNetSuiteData = async () => {
       if (isValidNetsuiteId(customerId)) {
         console.log('[MemberPortal] Valid NetSuite ID found, preloading payment data');
         try {
           const timeoutPromise = new Promise((_, reject) => 
             setTimeout(() => reject(new Error('NetSuite timeout')), 5000)
           );
           
           await Promise.race([
             paymentDataService.preloadInBackground(customerId),
             timeoutPromise
           ]);
           console.log('[MemberPortal] NetSuite data loaded successfully');
         } catch (err) {
           console.error('[MemberPortal] NetSuite error (isolated):', err);
         }
       } else {
         console.log('[MemberPortal] No valid NetSuite ID, skipping payment data preload');
       }
     };
     
     loadCoreData();
     loadNetSuiteData();
   }
 }, [salesforceCustomer, customerId, isUserLoading, currentUser]);

 // Auto-refresh effect
 useEffect(() => {
   if (!AUTO_REFRESH_ENABLED) {
     return;
   }
   
   if (refreshIntervalRef.current) {
     clearInterval(refreshIntervalRef.current);
   }
   
   refreshIntervalRef.current = setInterval(() => {
     fetchFreshContent(true, false);
   }, AUTO_REFRESH_INTERVAL);
   
   return () => {
     if (refreshIntervalRef.current) {
       clearInterval(refreshIntervalRef.current);
     }
   };
 }, []);

 const refreshContent = async () => {
   return fetchFreshContent(true, true);
 };

 const refreshNotifications = async () => {
   await ensureFreshToken();
   
   try {
     const notificationsData = await fetchWithRetry(() => {
       return getNotifications();
     }) || [];
     
     setNotifications(notificationsData);
     setNotificationsLoaded(true);
     
     return notificationsData;
   } catch (error) {
     console.error('[MemberPortal] Notifications refresh error:', error);
     setNotifications([]);
     setNotificationsLoaded(true);
     
     return [];
   }
 };

 const refreshDocuments = async () => {
   await ensureFreshToken();
   
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
     console.error('[MemberPortal] Documents refresh error:', error);
     return [];
   }
 };

 const value = {
   isPreloading,
   preloadError,
   customerId,
   salesforceCustomer,
   customerName: salesforceCustomer ? `${salesforceCustomer.firstName} ${salesforceCustomer.lastName}` : '',
   customerEmail: salesforceCustomer?.email || '',
   salesforceContactId: salesforceCustomer?.id || null,
   customerFirstName: salesforceCustomer?.firstName || '',
   isDemoMode: DEMO_MODE,
   hasValidNetsuiteId: isValidNetsuiteId(customerId),
   currentUser, // Add this for components to check
   
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
   
   memberInfoData,
   memberInfoLoaded,
   refreshMemberInfo: () => preloadMemberInfo(true)
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
 
 console.log('=== MEMBER PORTAL PROVIDER DEBUG ===');
 console.log('isLoading:', isLoading);
 console.log('salesforceCustomer:', salesforceCustomer);
 console.log('currentUser:', currentUser);
 console.log('netsuiteCustomerId:', netsuiteCustomerId);
 console.log('===================================');
 
 // CRITICAL SECURITY CHECK - Don't render anything if no authenticated user
 if (!isLoading && !currentUser) {
   console.error('[MemberPortalProvider] SECURITY: No authenticated user - blocking access');
   window.location.href = '/login';
   return null;
 }
 
 let effectiveCustomerId = netsuiteCustomerId;
 let effectiveSalesforceCustomer = salesforceCustomer;
 
 if (DEMO_MODE) {
   effectiveCustomerId = DEMO_CONFIG.netsuiteCustomerId;
   
   if (salesforceCustomer) {
     effectiveSalesforceCustomer = {
       ...salesforceCustomer,
       id: DEMO_CONFIG.salesforceContactId
     };
   } else {
     effectiveSalesforceCustomer = {
       id: DEMO_CONFIG.salesforceContactId,
       firstName: DEMO_CONFIG.customerName.split(' ')[0],
       lastName: DEMO_CONFIG.customerName.split(' ')[1] || '',
       email: currentUser?.email || DEMO_CONFIG.customerEmail,
       netsuiteCustomerId: DEMO_CONFIG.netsuiteCustomerId
     };
   }
 }
 
 // If we have a user but no Salesforce customer and not in demo mode, show error
 if (!isLoading && currentUser && !effectiveSalesforceCustomer && !DEMO_MODE) {
   return (
     <div className="flex items-center justify-center min-h-screen">
       <div className="text-center">
         <p className="text-red-600 mb-4">Unable to load customer data. Please try refreshing the page.</p>
         <button 
           onClick={() => window.location.reload()} 
           className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
         >
           Refresh Page
         </button>
       </div>
     </div>
   );
 }

 const DemoIndicator = DEMO_MODE ? (
   <div className="fixed bottom-4 right-4 bg-gray-300 text-black px-3 py-1 rounded-md text-sm font-semibold z-50">
     DEMO MODE
   </div>
 ) : null;  

 return (
   <>
     {DemoIndicator}
     <CustomerDataProvider customerId={effectiveCustomerId}>
       <MemberPortalProviderInner 
         customerId={effectiveCustomerId} 
         salesforceCustomer={effectiveSalesforceCustomer}
         isUserLoading={isLoading}
         currentUser={currentUser}
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