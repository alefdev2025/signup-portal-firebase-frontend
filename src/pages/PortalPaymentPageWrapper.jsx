// PortalPaymentPageWrapper.jsx
import React, { useEffect, useState } from 'react';
import PortalPaymentPage from './PortalPaymentPage';

const PortalPaymentPageWrapper = () => {
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const invoiceData = sessionStorage.getItem('invoiceForPayment');
    if (invoiceData) {
      setInvoice(JSON.parse(invoiceData));
    } else {
      window.location.hash = 'payments-invoices';
    }
  }, []);

  const handleBack = () => {
    sessionStorage.removeItem('invoiceForPayment');
    sessionStorage.removeItem('paymentInvoiceId');
    window.location.hash = 'payments-invoices';
  };

  if (!invoice) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2340] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Make it full screen with high z-index to cover everything
  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
      <PortalPaymentPage invoice={invoice} onBack={handleBack} />
    </div>
  );
};

export default PortalPaymentPageWrapper;