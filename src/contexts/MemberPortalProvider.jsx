// contexts/MemberPortalProvider.jsx - Updated with demo mode toggle
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { paymentDataService } from '../components/portal/services/paymentDataService';
import { memberDataService } from '../components/portal/services/memberDataService';
import { CustomerDataProvider } from '../components/portal/contexts/CustomerDataContext';

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

const MemberPortalContext = createContext();

// Inner component that uses CustomerDataProvider
const MemberPortalProviderInner = ({ children, customerId, salesforceCustomer }) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(null);

  useEffect(() => {
    // Only preload if we have both customer IDs
    if (customerId && salesforceCustomer?.id) {
      console.log('[MemberPortal] Starting data preload for customers:', {
        netsuiteId: customerId,
        salesforceId: salesforceCustomer.id,
        demoMode: DEMO_MODE
      });
      setIsPreloading(true);
      
      // Start preloading both payment and member data in the background
      Promise.all([
        paymentDataService.preloadInBackground(customerId),
        memberDataService.preloadInBackground(salesforceCustomer.id)
      ])
        .then(() => {
          console.log('[MemberPortal] All data preload completed');
          setIsPreloading(false);
        })
        .catch(error => {
          console.error('[MemberPortal] Data preload failed:', error);
          setPreloadError(error.message);
          setIsPreloading(false);
        });
    } else {
      console.log('[MemberPortal] Missing customer IDs:', {
        netsuiteId: customerId,
        salesforceId: salesforceCustomer?.id
      });
    }
  }, [customerId, salesforceCustomer?.id]);

  const value = {
    isPreloading,
    preloadError,
    customerId,
    salesforceCustomer,
    // Add convenience getters
    customerName: salesforceCustomer ? `${salesforceCustomer.firstName} ${salesforceCustomer.lastName}` : '',
    customerEmail: salesforceCustomer?.email || '',
    salesforceContactId: salesforceCustomer?.id || null,
    isDemoMode: DEMO_MODE // Expose demo mode status
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
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-md text-sm font-semibold z-50">
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