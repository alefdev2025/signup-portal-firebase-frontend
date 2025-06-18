// contexts/MemberPortalProvider.jsx - Updated to preload Salesforce member data
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { paymentDataService } from '../components/portal/services/paymentDataService';
import { memberDataService } from '../components/portal/services/memberDataService';

// Import the CustomerDataProvider so we can wrap with it
import { CustomerDataProvider } from '../components/portal/contexts/CustomerDataContext';

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
        salesforceId: salesforceCustomer.id
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
    salesforceContactId: salesforceCustomer?.id || null
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
  
  // Use the NetSuite ID from UserContext
  //const customerId = netsuiteCustomerId || '4527'; // Fallback for testing
  const customerId = '4527';
  
  console.log('[MemberPortalProvider] Current state:', {
    hasUser: !!currentUser,
    email: currentUser?.email,
    netsuiteCustomerId: netsuiteCustomerId,
    salesforceCustomerId: salesforceCustomer?.id,
    isLoading: isLoading
  });
  
  // Show loading state while we fetch the customer IDs
  if (isLoading && !netsuiteCustomerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  // If no NetSuite ID found after loading, show a warning but continue
  if (!isLoading && !netsuiteCustomerId && currentUser) {
    console.warn('[MemberPortal] No NetSuite customer ID found for user:', currentUser.email);
    // You might want to show an error UI here or handle this case differently
  }

  // If no Salesforce customer found after loading, show a warning
  if (!isLoading && !salesforceCustomer?.id && currentUser) {
    console.warn('[MemberPortal] No Salesforce customer found for user:', currentUser.email);
  }

  // Wrap with CustomerDataProvider so all children have access to it
  return (
    <CustomerDataProvider customerId={customerId}>
      <MemberPortalProviderInner 
        customerId={customerId} 
        salesforceCustomer={salesforceCustomer}
      >
        {children}
      </MemberPortalProviderInner>
    </CustomerDataProvider>
  );
};

export const useMemberPortal = () => {
  const context = useContext(MemberPortalContext);
  if (!context) {
    throw new Error('useMemberPortal must be used within MemberPortalProvider');
  }
  return context;
};