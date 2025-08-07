// components/PaymentContentWrapper.jsx
// wraps components that need payment data

import React from 'react';
import { CustomerDataProvider } from './portal/contexts/CustomerDataContext';
import { useMemberPortal } from '../contexts/MemberPortalProvider';

const PaymentContentWrapper = ({ children }) => {
  const { customerId } = useMemberPortal();
  
  if (!customerId || customerId === 'pending') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <CustomerDataProvider customerId={customerId}>
      {children}
    </CustomerDataProvider>
  );
};

export default PaymentContentWrapper;