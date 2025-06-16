// contexts/MemberPortalProvider.jsx - REVISED
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { paymentDataService } from '../components/portal/services/paymentDataService';

// Import the CustomerDataProvider so we can wrap with it
import { CustomerDataProvider } from '../components/portal/contexts/CustomerDataContext';

const MemberPortalContext = createContext();

// Inner component that uses CustomerDataProvider
const MemberPortalProviderInner = ({ children, customerId }) => {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState(null);

  useEffect(() => {
    // Only preload if we have a logged-in user with customerId
    if (customerId) {
      console.log('[MemberPortal] Starting data preload for customer:', customerId);
      setIsPreloading(true);
      
      // Start preloading payment data in the background
      Promise.all([
        paymentDataService.preloadInBackground(customerId),
        // Add other preloads here as needed
      ])
        .then(() => {
          console.log('[MemberPortal] Data preload completed');
          setIsPreloading(false);
        })
        .catch(error => {
          console.error('[MemberPortal] Data preload failed:', error);
          setPreloadError(error.message);
          setIsPreloading(false);
        });
    }
  }, [customerId]);

  const value = {
    isPreloading,
    preloadError,
    customerId
  };

  return (
    <MemberPortalContext.Provider value={value}>
      {children}
    </MemberPortalContext.Provider>
  );
};

// Main provider that wraps with CustomerDataProvider
export const MemberPortalProvider = ({ children }) => {
  const { currentUser } = useUser();
  const customerId = currentUser?.customerId || '4527'; // Use actual customer ID or fallback

  // Wrap with CustomerDataProvider so all children have access to it
  return (
    <CustomerDataProvider customerId={customerId}>
      <MemberPortalProviderInner customerId={customerId}>
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