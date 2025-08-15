import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoiceDetails } from './services/netsuite';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { invoiceNotificationsApi } from '../../services/invoiceNotificationsApi';
import { PageLoader, CenteredLoader } from '../DotLoader';

// Import the new service - UPDATED PATH
import { invoiceDataService } from './services/invoiceDataService';

// Component imports
import LoadingState from './InvoicesComponents/LoadingState';
import ErrorState from './InvoicesComponents/ErrorState';
import LegacyAutopayBanner from './InvoicesComponents/LegacyAutopayBanner';
import InvoiceDetail from './InvoicesComponents/InvoiceDetail';
import InvoiceList from './InvoicesComponents/InvoiceList';
import InvoiceSummary from './InvoicesComponents/InvoiceSummary';
import BillingInformation from './InvoicesComponents/BillingInformation';
import EmailNotifications from './InvoicesComponents/EmailNotifications';
import StripeAutopayBanner from './InvoicesComponents/StripeAutopayBanner';

// Utils
import { processInvoices, filterInvoices } from './InvoicesComponents/utils/invoiceHelpers';
import { handlePrintInvoice, handleDownloadInvoice } from './InvoicesComponents/utils/pdfGenerator';

// Feature flags
const SHOW_STRIPE_AUTOPAY_BANNER = true;
const SHOW_LEGACY_AUTOPAY_BANNER = true;

// Empty state component
const EmptyInvoiceListView = () => (
  <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
       style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
    
    <div className="p-10 border-b border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Invoice History</h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed font-normal max-w-xl">
            View and manage all your invoices. Download PDFs or make payments directly from this page.
          </p>
        </div>
      </div>
    </div>

    <div className="p-8">
      <div className="text-center py-16 animate-fadeIn">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-700 text-base">No invoices available at this time.</p>
      </div>
    </div>
  </div>
);

const InvoicesTab = ({ setActiveTab }) => { 
  const navigate = useNavigate();
  // NOW call the hook inside the component
  const { 
    customerId, 
    salesforceContactId, 
    salesforceCustomer,
    customerName 
  } = useMemberPortal();
  
  // State management - ALL data in one place
  const [data, setData] = useState(null); // null = not loaded yet
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterValue, setFilterValue] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  
  // Email notification settings
  const [newInvoiceAlerts, setNewInvoiceAlerts] = useState(false);
  const [paymentFailureAlerts, setPaymentFailureAlerts] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [savingNotificationSettings, setSavingNotificationSettings] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Add styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .invoice-page * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .invoice-page h1,
      .invoice-page h2,
      .invoice-page h3,
      .invoice-page h4 {
        font-weight: 400 !important;
      }
      .invoice-page .font-medium {
        font-weight: 400 !important;
      }
      .invoice-page .font-semibold {
        font-weight: 500 !important;
      }
      .invoice-page .font-bold {
        font-weight: 500 !important;
      }
      .invoice-page p,
      .invoice-page span,
      .invoice-page div {
        font-weight: 300 !important;
      }
      .invoice-page .text-xs {
        font-weight: 400 !important;
      }
      
      .invoice-page select {
        text-align: center !important;
        text-align-last: center !important;
        padding-right: 2.5rem !important;
      }
      
      .invoice-page select {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.75rem center;
        background-size: 1.5em 1.5em;
        background-repeat: no-repeat;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // SINGLE DATA FETCH - GET EVERYTHING AT ONCE
  const fetchAllData = useCallback(async () => {
    // Validate customer ID first
    if (!customerId || 
        customerId === 'pending' || 
        customerId === 'loading' ||
        customerId === 'undefined' ||
        customerId === 'null' ||
        customerId === '' ||
        !/^\d{4,5}$/.test(customerId)) {
      console.log('Invalid customer ID:', customerId);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching ALL data for customer:', customerId);
      
      // Clear any cache
      invoiceDataService.clearCache();
      
      // Get ALL data in one call
      const result = await invoiceDataService.getInvoiceData(customerId, {
        forceRefresh: true,
        salesforceContactId: salesforceContactId
      });
      
      console.log('Got complete data:', {
        invoices: result.invoices?.length || 0,
        payments: result.payments?.length || 0,
        hasSalesOrderAnalysis: !!result.salesOrderAnalysis,
        hasNotificationSettings: !!result.notificationSettings
      });
      
      // Log sales order analysis if present
      if (result.salesOrderAnalysis) {
        console.log('Sales Order Analysis received:', {
          hasOrders: result.salesOrderAnalysis.hasOrders,
          autopayStatus: result.salesOrderAnalysis.analysis?.autopayStatus,
          canEnableAutopay: result.salesOrderAnalysis.canEnableAutopay,
          billingPattern: result.salesOrderAnalysis.billingPattern?.type
        });
      }
      
      // Process invoices with payments to get correct statuses
      let processedInvoices = [];
      if (result.invoices && result.invoices.length > 0) {
        processedInvoices = processInvoices(
          { invoices: result.invoices }, 
          { payments: result.payments || [] }
        );
      }
      
      // Set ALL data at once
      setData({
        invoices: processedInvoices,
        rawInvoices: result.invoices || [],
        payments: result.payments || [],
        autopayStatus: result.autopayStatus || null,
        customerInfo: result.customerInfo || null,
        emailNotificationSettings: result.emailNotificationSettings || null,
        salesOrderAnalysis: result.salesOrderAnalysis || null,
        billingAddress: result.customerInfo?.billingAddress || 
                       processedInvoices.find(inv => inv.billingAddress)?.billingAddress || null
      });
      
      // Set email notification settings - UPDATED TO USE notificationSettings
      if (result.notificationSettings) {
        console.log('Setting notification settings from API:', result.notificationSettings);
        setNewInvoiceAlerts(result.notificationSettings.newInvoiceAlerts || false);
        setPaymentFailureAlerts(result.notificationSettings.paymentFailureAlerts || false);
        setNotificationEmail(result.notificationSettings.notificationEmail || '');
      } else if (result.emailNotificationSettings) {
        // Fallback to emailNotificationSettings if notificationSettings is not available
        console.log('Using fallback emailNotificationSettings');
        setNewInvoiceAlerts(result.emailNotificationSettings.newInvoiceAlerts || false);
        setPaymentFailureAlerts(result.emailNotificationSettings.paymentFailureAlerts || false);
        setNotificationEmail(result.emailNotificationSettings.notificationEmail || '');
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load invoice data');
    } finally {
      setIsLoading(false);
    }
  }, [customerId, salesforceContactId]);

  // Fetch data when customer ID is ready
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Scroll to top when returning from invoice detail
  useEffect(() => {
    if (!selectedInvoice) {
      window.scrollTo(0, 0);
    }
  }, [selectedInvoice]);

  // Scroll to top when filter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filterValue]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      setSelectedInvoice(null);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    
    if (!window.history.state || !window.history.state.invoiceView) {
      window.history.replaceState({ invoiceView: 'list' }, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = async (type, value) => {
    setSavingNotificationSettings(true);
    
    try {
      if (type === 'newInvoice') {
        setNewInvoiceAlerts(value);
      } else if (type === 'paymentFailure') {
        setPaymentFailureAlerts(value);
      }
      
      const result = await invoiceNotificationsApi.toggleNotification(type, value);
      
      if (!result.success) {
        if (type === 'newInvoice') {
          setNewInvoiceAlerts(!value);
        } else if (type === 'paymentFailure') {
          setPaymentFailureAlerts(!value);
        }
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      if (type === 'newInvoice') {
        setNewInvoiceAlerts(!value);
      } else if (type === 'paymentFailure') {
        setPaymentFailureAlerts(!value);
      }
    } finally {
      setSavingNotificationSettings(false);
    }
  };

  // Handle viewing invoice details
  const handleViewInvoice = useCallback(async (invoice) => {
    setLoadingInvoiceId(invoice.id);
    window.scrollTo(0, 0);
    
    window.history.pushState(
      { invoiceView: 'detail', invoiceId: invoice.id }, 
      '', 
      window.location.href
    );
    
    try {
      // Find the full invoice from our already-loaded data
      const fullInvoice = data.rawInvoices.find(inv => 
        inv.id === invoice.id || inv.internalId === invoice.internalId
      );
      
      // Clean the invoice number (remove INV prefix)
      const cleanInvoiceNumber = (invoice.documentNumber || invoice.tranid || invoice.id).replace(/^INV[-\s]*/i, '');
      
      let detailedInvoice = {
        ...(fullInvoice || invoice),
        // Map the fields correctly from backend response
        id: cleanInvoiceNumber, // Use clean invoice number for display
        internalId: invoice.id || invoice.internalId, // Keep internal ID for API calls
        documentNumber: invoice.documentNumber || invoice.tranid,
        billingAddress: invoice.billingAddress || data?.billingAddress,
        // IMPORTANT: Use 'total' not 'amount' - this is what backend returns
        amount: parseFloat(invoice.total) || 0,
        subtotal: parseFloat(invoice.subtotal) || parseFloat(invoice.total) || 0,
        taxTotal: parseFloat(invoice.taxTotal || invoice.taxtotal) || 0,
        discountTotal: parseFloat(invoice.discountTotal) || 0,
        amountRemaining: parseFloat(invoice.amountRemaining) || 0,
        amountPaid: (parseFloat(invoice.total) || 0) - (parseFloat(invoice.amountRemaining) || 0),
        // Keep the processed status from processInvoices
        status: invoice.status,
        hasUnapprovedPayment: invoice.hasUnapprovedPayment,
        unapprovedPaymentNumber: invoice.unapprovedPaymentNumber,
        unapprovedPaymentAmount: invoice.unapprovedPaymentAmount,
        // Add other fields that might be needed
        description: invoice.description || invoice.memo,
        date: invoice.date || invoice.trandate,
        dueDate: invoice.dueDate,
        currency: invoice.currency || 'USD',
        terms: invoice.terms,
        subsidiary: invoice.subsidiary
      };
      
      setSelectedInvoice(detailedInvoice);
    } finally {
      setLoadingInvoiceId(null);
    }
  }, [data]);

  // Handle closing invoice detail
  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
    window.scrollTo(0, 0);
  };

  // Handle payment
  const handlePayInvoice = (invoice) => {

    console.log('=== handlePayInvoice START ===');
    console.log('Invoice passed:', invoice);
    console.log('Current URL:', window.location.href);

    const invoiceWithDetails = {
      ...invoice,
      billingAddress: invoice.billingAddress || data?.billingAddress,
      amount: parseFloat(invoice.amount) || 0,
      amountRemaining: parseFloat(invoice.amountRemaining) || 0,
      amountPaid: parseFloat(invoice.amountPaid) || 0,
      subtotal: parseFloat(invoice.subtotal) || parseFloat(invoice.amount) || 0,
      taxTotal: parseFloat(invoice.taxTotal) || 0,
      discountTotal: parseFloat(invoice.discountTotal) || 0,
      internalId: invoice.internalId || invoice.id,
      id: invoice.documentNumber || invoice.id,
      currency: invoice.currency || 'USD',
      description: invoice.description || invoice.memo || `Invoice ${invoice.documentNumber || invoice.id}`,
      date: invoice.date || invoice.tranDate,
      dueDate: invoice.dueDate
    };
    
    // Store invoice data in sessionStorage for the payment page
    sessionStorage.setItem('invoiceForPayment', JSON.stringify(invoiceWithDetails));
    sessionStorage.setItem('paymentInvoiceId', invoice.internalId || invoice.id);
    
    console.log('About to navigate to:', '/portal-home#payments-pay');
    
    // Use window.location.hash instead of navigate
    window.location.hash = 'payments-pay';
    
    console.log('Navigate called, new URL:', window.location.href);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchAllData();
  };

  // WAIT FOR DATA BEFORE SHOWING ANYTHING
  if (isLoading || !data) {
    return <CenteredLoader message="Loading invoices..." minHeight="500px" />;
  }

  // Show error
  if (error && (!data || data.invoices.length === 0)) {
    return <ErrorState error={error} onRefresh={handleRefresh} />;
  }

  // Filter invoices
  const filteredInvoices = data ? filterInvoices(data.invoices, filterValue) : [];

  return (
    <div className="invoice-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="h-8"></div>

      {/* Invoice Detail or List */}
      {selectedInvoice ? (
        <InvoiceDetail 
          invoice={selectedInvoice}
          customerInfo={{
            name: customerName,
            alcorId: data?.customerInfo?.alcorId || data?.alcorId || 'N/A',
            subsidiary: data?.customerInfo?.subsidiary || selectedInvoice.subsidiary || ''
          }}
          onClose={handleCloseInvoice}
          onPrint={(invoice) => handlePrintInvoice(invoice, data?.customerInfo)}
          onDownload={(invoice) => handleDownloadInvoice(invoice, data?.customerInfo)}
          onPay={handlePayInvoice}
        />
      ) : (
        <div className="px-4 md:px-0">
          {/* Show empty state or invoice list */}
          {!data || data.invoices.length === 0 ? (
            <>
              <EmptyInvoiceListView />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <InvoiceSummary invoices={[]} />
                <BillingInformation billingAddress={null} isLoading={false} />
              </div>

              {/* Autopay Banners for Empty State - REMOVED wrapper div with mt-12 md:mt-16 */}
              {/* Legacy Autopay Banner
              {data?.salesOrderAnalysis?.analysis?.autopayStatus === 'ON_AUTOPAY' && 
              SHOW_LEGACY_AUTOPAY_BANNER && (
                <LegacyAutopayBanner 
                  salesOrderAnalysis={data?.salesOrderAnalysis}
                  setActiveTab={setActiveTab}
                />
              )} */}

              {/* Stripe Autopay Banner 
              {data?.salesOrderAnalysis?.analysis?.autopayStatus !== 'ON_AUTOPAY' && 
              SHOW_STRIPE_AUTOPAY_BANNER && (
                <StripeAutopayBanner 
                  stripeAutopayStatus={data?.autopayStatus?.stripe}
                  setActiveTab={setActiveTab}
                />
              )} */}

              <EmailNotifications 
                newInvoiceAlerts={newInvoiceAlerts}
                paymentFailureAlerts={paymentFailureAlerts}
                notificationEmail={notificationEmail}
                loadingNotificationSettings={false}
                onToggleNotification={handleNotificationToggle}
              />
            </>
          ) : (
            <>
              <InvoiceList 
                invoices={data.invoices}
                filteredInvoices={filteredInvoices}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                onInvoiceSelect={handleViewInvoice}
                loadingInvoiceId={loadingInvoiceId}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <InvoiceSummary invoices={data.invoices} />
                <BillingInformation 
                  billingAddress={data.billingAddress} 
                  isLoading={false} 
                />
              </div>

              {/* Autopay Banners - Above Email Notifications */}
              {data?.salesOrderAnalysis?.analysis?.autopayStatus === 'ON_AUTOPAY' && 
              SHOW_LEGACY_AUTOPAY_BANNER && (
                <LegacyAutopayBanner 
                  salesOrderAnalysis={data?.salesOrderAnalysis}
                  setActiveTab={setActiveTab}
                />
              )}

              {data?.salesOrderAnalysis?.analysis?.autopayStatus !== 'ON_AUTOPAY' && 
              SHOW_STRIPE_AUTOPAY_BANNER && (
                <StripeAutopayBanner 
                  stripeAutopayStatus={data?.autopayStatus?.stripe}
                  setActiveTab={setActiveTab}
                />
              )}

              <EmailNotifications 
                newInvoiceAlerts={newInvoiceAlerts}
                paymentFailureAlerts={paymentFailureAlerts}
                notificationEmail={notificationEmail}
                loadingNotificationSettings={false}
                onToggleNotification={handleNotificationToggle}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoicesTab;