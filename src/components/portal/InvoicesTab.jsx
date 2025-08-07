import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInvoices, useCustomerData, usePayments } from './contexts/CustomerDataContext';
import { getInvoiceDetails, getStripeIntegrationStatus } from './services/netsuite';
import { getMemberProfile } from './services/salesforce/memberInfo';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import PortalPaymentPage from '../../pages/PortalPaymentPage';
import { invoiceNotificationsApi } from '../../services/invoiceNotificationsApi';

// Component imports
import LoadingState from './InvoicesComponents/LoadingState';
import ErrorState from './InvoicesComponents/ErrorState';
import LegacyAutopayBanner from './InvoicesComponents/LegacyAutopayBanner';
import InvoiceDetail from './InvoicesComponents/InvoiceDetail';
import InvoiceList from './InvoicesComponents/InvoiceList';
import InvoiceSummary from './InvoicesComponents/InvoiceSummary';
import BillingInformation from './InvoicesComponents/BillingInformation';
import EmailNotifications from './InvoicesComponents/EmailNotifications';

// Utils
import { processInvoices, filterInvoices } from './InvoicesComponents/utils/invoiceHelpers';
import { handlePrintInvoice, handleDownloadInvoice } from './InvoicesComponents/utils/pdfGenerator';

// Feature flags
const SHOW_LEGACY_AUTOPAY_BANNER = true;
const DEBUG_TIMING = false;

// Empty state component that matches InvoiceList styling
const EmptyInvoiceListView = () => (
  <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
       style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
    
    {/* Header Section - matches InvoiceList */}
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

    {/* Empty State Content */}
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

const InvoicesTab = () => {
  const { customerId } = useMemberPortal();
  
  // Debug timing on every render
  if (DEBUG_TIMING) {
    console.log('🕐 InvoicesTab Render:', {
      customerId,
      customerIdType: typeof customerId,
      timestamp: new Date().toISOString()
    });
  }

  // Check if customer ID is still loading
  const isCustomerIdLoading = !customerId || customerId === 'pending' || customerId === 'loading';
  const isValidCustomerId = customerId && 
                           customerId !== 'pending' && 
                           customerId !== 'loading' &&
                           customerId !== 'undefined' &&
                           customerId !== 'null' &&
                           /^\d{4,5}$/.test(customerId);
  
  // Don't pass null to hooks if customer ID is still loading
  const shouldFetchData = isValidCustomerId;
  
  // Hooks - only fetch when we have a valid customer ID
  const { 
    data: invoicesData, 
    isLoading: invoicesLoading, 
    error: invoicesError,
    refetch: refetchInvoices 
  } = useInvoices(shouldFetchData ? customerId : null);
  
  const { 
    data: paymentsData,
    isLoading: paymentsLoading,
    refetch: refetchPayments
  } = usePayments(shouldFetchData ? customerId : null);
  
  const { fetchInvoices } = useCustomerData();
  const { salesforceContactId } = useMemberPortal();
  
  // State management
  const [filterValue, setFilterValue] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [mostRecentBillingAddress, setMostRecentBillingAddress] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  // Autopay status state
  const [customerAutopayStatus, setCustomerAutopayStatus] = useState(null);
  const [loadingAutopayStatus, setLoadingAutopayStatus] = useState(true);
  
  // Cache for invoice details to prevent duplicate API calls
  const invoiceDetailsCache = useRef(new Map());
  const billingAddressFetchedRef = useRef(false);
  const fetchingInvoicesRef = useRef(new Set());
  
  // Track if we've attempted to fetch for this customer ID
  const fetchAttemptedRef = useRef(new Set());
  
  // Payment page states
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  
  // Email notification settings
  const [newInvoiceAlerts, setNewInvoiceAlerts] = useState(false);
  const [paymentFailureAlerts, setPaymentFailureAlerts] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(true);
  const [savingNotificationSettings, setSavingNotificationSettings] = useState(false);

  // Set timeout for loading state
  useEffect(() => {
    if (isCustomerIdLoading) {
      const timer = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimedOut(false);
    }
  }, [isCustomerIdLoading]);

  // In InvoicesTab
  useEffect(() => {
    if (showPaymentPage) {
      // Hide sidebar when payment page is shown
      document.body.classList.add('payment-page-active');
    } else {
      // Show sidebar when payment page is hidden
      document.body.classList.remove('payment-page-active');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('payment-page-active');
    };
  }, [showPaymentPage]);

  // Debug data flow
  useEffect(() => {
    if (DEBUG_TIMING) {
      console.log('🔍 Data Flow Debug:', {
        customerId,
        isCustomerIdLoading,
        isValidCustomerId,
        shouldFetchData,
        invoicesData: {
          exists: !!invoicesData,
          dataArray: invoicesData?.data,
          dataLength: invoicesData?.data?.length || 0,
          success: invoicesData?.success
        },
        paymentsData: {
          exists: !!paymentsData,
          dataLength: paymentsData?.data?.length || 0
        },
        isLoading: invoicesLoading,
        error: invoicesError,
        timestamp: new Date().toISOString()
      });
    }
  }, [customerId, isCustomerIdLoading, isValidCustomerId, shouldFetchData, invoicesData, paymentsData, invoicesLoading, invoicesError]);

  // Force refetch when customer ID becomes valid
  useEffect(() => {
    if (isValidCustomerId && customerId && !fetchAttemptedRef.current.has(customerId)) {
      console.log('🔄 Customer ID became valid, triggering data fetch:', customerId);
      fetchAttemptedRef.current.add(customerId);
      
      // If hooks didn't automatically fetch, force it
      if (!invoicesLoading && !invoicesData) {
        console.log('🔄 Forcing invoice refetch');
        if (refetchInvoices) {
          refetchInvoices();
        } else if (fetchInvoices) {
          fetchInvoices({ forceRefresh: true });
        }
      }
    }
  }, [isValidCustomerId, customerId, invoicesLoading, invoicesData, refetchInvoices, fetchInvoices]);

  // Add Helvetica font with lighter weights and fix dropdown styling
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
      
      /* Center text in select dropdown and fix arrow spacing */
      .invoice-page select {
        text-align: center !important;
        text-align-last: center !important;
        padding-right: 2.5rem !important;
      }
      
      /* Style the dropdown arrow */
      .invoice-page select {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.75rem center;
        background-size: 1.5em 1.5em;
        background-repeat: no-repeat;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
      
      /* Hide sidebar when payment page is active - Desktop only */
      @media (min-width: 1280px) {
        /* Hide the sidebar container */
        body.payment-page-active .relative.z-50 > div:first-child,
        body.payment-page-active [class*="w-[280px]"] {
          display: none !important;
        }
        
        /* Remove sidebar spacer */
        body.payment-page-active .w-\\[240px\\],
        body.payment-page-active .w-\\[280px\\] {
          width: 0 !important;
        }
        
        /* Make main content full width */
        body.payment-page-active main {
          margin-left: 0 !important;
        }
        
        /* Make the content area full width */
        body.payment-page-active .flex-1.flex.flex-col {
          margin-left: 0 !important;
        }
        
        /* Ensure payment page takes full width */
        body.payment-page-active .invoice-page {
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check customer's autopay status
  useEffect(() => {
    const checkAutopayStatus = async () => {
      if (!isValidCustomerId || !SHOW_LEGACY_AUTOPAY_BANNER) {
        setLoadingAutopayStatus(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/netsuite/customers/${customerId}/stripe`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCustomerAutopayStatus(data);
        }
      } catch (error) {
        console.error('Error checking autopay status:', error);
      } finally {
        setLoadingAutopayStatus(false);
      }
    };
    
    checkAutopayStatus();
  }, [customerId, isValidCustomerId]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.invoiceView === 'list') {
        setSelectedInvoice(null);
        setShowPaymentPage(false);
        setInvoiceForPayment(null);
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
          containers.forEach(container => {
            if (container) container.scrollTop = 0;
          });
        });
      } else if (event.state && event.state.invoiceView === 'detail') {
        setSelectedInvoice(null);
        setShowPaymentPage(false);
        setInvoiceForPayment(null);
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
          containers.forEach(container => {
            if (container) container.scrollTop = 0;
          });
        });
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state || !window.history.state.invoiceView) {
      window.history.replaceState({ invoiceView: 'list' }, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  
  // Fetch notification settings from backend
  const fetchNotificationSettings = async () => {
    try {
      const response = await invoiceNotificationsApi.getSettings();
      
      if (response.success) {
        setNewInvoiceAlerts(response.newInvoiceAlerts || false);
        setPaymentFailureAlerts(response.paymentFailureAlerts || false);
        setNotificationEmail(response.notificationEmail || customerInfo?.email || '');
      } else {
        setNewInvoiceAlerts(false);
        setPaymentFailureAlerts(false);
        setNotificationEmail(customerInfo?.email || '');
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      setNewInvoiceAlerts(false);
      setPaymentFailureAlerts(false);
      setNotificationEmail(customerInfo?.email || '');
    } finally {
      setLoadingNotificationSettings(false);
    }
  };
  
  // Fetch notification settings on mount
  useEffect(() => {
    if (isValidCustomerId) {
      fetchNotificationSettings();
    } else {
      setLoadingNotificationSettings(false);
    }
  }, [isValidCustomerId]);
  
  // Update notification email when customerInfo changes
  useEffect(() => {
    if (customerInfo?.email && !notificationEmail) {
      setNotificationEmail(customerInfo.email);
    }
  }, [customerInfo, notificationEmail]);
  
  // Handle notification toggle changes
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
        console.error('Failed to update notification setting:', result.error);
      } else {
        console.log(`Successfully updated ${type} notification setting to:`, value);
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

  // Process invoices when data changes - with better error handling
  const invoices = React.useMemo(() => {
    if (DEBUG_TIMING) {
      console.log('📊 Processing invoices:', {
        invoicesData,
        paymentsData,
        hasInvoicesData: !!invoicesData,
        invoicesDataStructure: invoicesData ? Object.keys(invoicesData) : null
      });
    }
    
    try {
      // Handle different possible response structures
      let invoiceArray = [];
      
      if (invoicesData) {
        if (Array.isArray(invoicesData)) {
          invoiceArray = invoicesData;
        } else if (invoicesData.data && Array.isArray(invoicesData.data)) {
          invoiceArray = invoicesData.data;
        } else if (invoicesData.invoices && Array.isArray(invoicesData.invoices)) {
          invoiceArray = invoicesData.invoices;
        } else if (invoicesData.success && invoicesData.data && Array.isArray(invoicesData.data)) {
          invoiceArray = invoicesData.data;
        }
      }
      
      const processed = processInvoices({ invoices: invoiceArray, data: invoiceArray }, paymentsData);
      
      if (DEBUG_TIMING) {
        console.log('📊 Processed result:', {
          inputLength: invoiceArray.length,
          outputLength: processed?.length || 0,
          sample: processed?.[0]
        });
      }
      
      return processed || [];
    } catch (error) {
      console.error('Error processing invoices:', error);
      return [];
    }
  }, [invoicesData, paymentsData]);

  // Fetch billing address from most recent invoice
  useEffect(() => {
    if (invoices.length > 0 && !mostRecentBillingAddress) {
      const sortedByDate = [...invoices].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Try to find the first invoice with a billing address
      for (const invoice of sortedByDate) {
        if (invoice.billingAddress) {
          setMostRecentBillingAddress(invoice.billingAddress);
          console.log('Found billing address from invoice:', invoice.id);
          break;
        }
      }
      
      // If no invoices have billing address in the list data, 
      // we might need to fetch details for the most recent invoice
      if (!mostRecentBillingAddress && sortedByDate[0]?.internalId && !billingAddressFetchedRef.current) {
        billingAddressFetchedRef.current = true;
        console.log('No billing address in list, fetching details for most recent invoice');
        
        getInvoiceDetails(sortedByDate[0].internalId)
          .then(details => {
            if (details?.invoice?.billingAddress) {
              setMostRecentBillingAddress(details.invoice.billingAddress);
              console.log('Got billing address from invoice details');
            }
          })
          .catch(err => {
            console.error('Error fetching invoice details for billing address:', err);
          });
      }
    }
  }, [invoices]); // Remove mostRecentBillingAddress from dependencies to avoid infinite loop

  // Fetch customer information from Salesforce
  useEffect(() => {
    if (salesforceContactId && !customerInfo && isValidCustomerId) {
      getMemberProfile(salesforceContactId)
        .then(result => {
          if (result.success && result.data) {
            const profileData = result.data.data || result.data;
            const info = {
              name: `${profileData.personalInfo?.firstName || ''} ${profileData.personalInfo?.lastName || ''}`.trim(),
              alcorId: profileData.personalInfo?.alcorId || 'N/A',
              subsidiary: profileData.personalInfo?.subsidiary || invoices[0]?.subsidiary || 'Alcor Life Extension Foundation',
              email: profileData.personalInfo?.email || profileData.contactInfo?.email || ''
            };
            setCustomerInfo(info);
          }
        })
        .catch(err => {
          console.error('Error fetching customer info:', err);
        });
    }
  }, [salesforceContactId, customerInfo, invoices, isValidCustomerId]);

  // Handle viewing invoice details
  const handleViewInvoice = useCallback(async (invoice) => {
    const invoiceKey = `${invoice.internalId}-${invoice.id}`;
    
    if (fetchingInvoicesRef.current.has(invoiceKey)) {
      console.log('Already fetching this invoice, skipping...');
      return;
    }
    
    setLoadingInvoiceId(invoice.id);
    window.scrollTo(0, 0);
    
    window.history.pushState(
      { invoiceView: 'detail', invoiceId: invoice.id }, 
      '', 
      window.location.href
    );
    
    try {
      fetchingInvoicesRef.current.add(invoiceKey);
      
      if (invoice.internalId) {
        let details;
        
        if (invoiceDetailsCache.current.has(invoiceKey)) {
          console.log('Using cached invoice details for:', invoice.id);
          details = invoiceDetailsCache.current.get(invoiceKey);
        } else {
          console.log('Fetching fresh invoice details for:', invoice.id);
          details = await getInvoiceDetails(invoice.internalId);
          
          invoiceDetailsCache.current.set(invoiceKey, details);
          
          if (invoiceDetailsCache.current.size > 50) {
            const firstKey = invoiceDetailsCache.current.keys().next().value;
            invoiceDetailsCache.current.delete(firstKey);
          }
        }
        
        setSelectedInvoice({
          ...invoice,
          ...details.invoice,
          detailedInfo: details.invoice,
          billingAddress: details.invoice.billingAddress || invoice.billingAddress || mostRecentBillingAddress,
          status: invoice.status,
          hasUnapprovedPayment: invoice.hasUnapprovedPayment,
          unapprovedPaymentNumber: invoice.unapprovedPaymentNumber,
          unapprovedPaymentAmount: invoice.unapprovedPaymentAmount
        });
      } else {
        setSelectedInvoice(invoice);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      setSelectedInvoice(invoice);
    } finally {
      setLoadingInvoiceId(null);
      fetchingInvoicesRef.current.delete(invoiceKey);
    }
  }, [mostRecentBillingAddress]);

  // Handle closing invoice detail view
  const handleCloseInvoice = () => {
    setSelectedInvoice(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
      containers.forEach(container => {
        if (container) container.scrollTop = 0;
      });
    });
  };

  // Handle payment action
  const handlePayInvoice = (invoice) => {
    const invoiceWithDetails = {
      ...invoice,
      billingAddress: invoice.billingAddress || mostRecentBillingAddress
    };
    
    window.history.pushState(
      { invoiceView: 'payment', invoiceId: invoice.id }, 
      '', 
      window.location.href
    );
    
    setInvoiceForPayment(invoiceWithDetails);
    setShowPaymentPage(true);
    
    setTimeout(() => {
      const scrollableElements = [
        document.documentElement,
        document.body,
        document.querySelector('.bg-gray-50'),
        document.querySelector('[class*="overflow"]'),
        document.querySelector('[class*="scroll"]'),
        document.querySelector('main'),
        document.querySelector('#root')
      ].filter(Boolean);
      
      scrollableElements.forEach(el => {
        if (el) {
          el.scrollTop = 0;
          el.scrollTo && el.scrollTo(0, 0);
        }
      });
      
      window.scrollTo(0, 0);
    }, 0);
  };

  // Handle back from payment page
  const handleBackFromPayment = () => {
    setShowPaymentPage(false);
    setInvoiceForPayment(null);
    setSelectedInvoice(null);
    if (isValidCustomerId) {
      fetchInvoices({ forceRefresh: true });
    }
    window.scrollTo(0, 0);
  };

  // Filter invoices based on selected filter
  const filteredInvoices = filterInvoices(invoices, filterValue);

  // Handle refresh
  const handleRefresh = async () => {
    if (isValidCustomerId) {
      setIsRefreshing(true);
      try {
        console.log('🔄 Manual refresh triggered');
        await fetchInvoices({ forceRefresh: true });
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Combined loading state (for initial load)
  const isInitialLoading = invoicesLoading && !invoices.length && isValidCustomerId;
  const isDataLoading = invoicesLoading || paymentsLoading;

  // Show empty state if customer ID is invalid or loading timed out
  if ((!isValidCustomerId && !isCustomerIdLoading) || loadingTimedOut) {
    console.log('⚠️ No valid customer ID or loading timeout - showing empty state');
    return (
      <div className="invoice-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="h-8"></div>
        <div className="px-4 md:px-0">
          <EmptyInvoiceListView />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <InvoiceSummary invoices={[]} />
            <BillingInformation billingAddress={null} isLoading={false} />
          </div>
        </div>
      </div>
    );
  }

  // Show loading if customer ID is still loading (but not timed out)
  if (isCustomerIdLoading && !loadingTimedOut) {
    console.log('⏳ Showing loading - Customer ID is still loading');
    return <LoadingState />;
  }

  // Show loading if we have a valid customer ID but data is still loading
  if (isInitialLoading) {
    console.log('⏳ Showing loading - Initial data load');
    return <LoadingState />;
  }

  // Error state
  if (invoicesError && !invoices.length && isValidCustomerId) {
    console.error('❌ Showing error state:', invoicesError);
    return <ErrorState error={invoicesError} onRefresh={handleRefresh} />;
  }

  // Show payment page if active
  if (showPaymentPage && invoiceForPayment) {
    return (
      <>
        {/* Add styles to hide sidebar on desktop */}
        <style>
          {`
            @media (min-width: 1280px) {
              .hide-sidebar-for-payment [class*="PortalSidebar"],
              .hide-sidebar-for-payment .relative.z-50 > div:first-child {
                display: none !important;
              }
              .hide-sidebar-for-payment main {
                margin-left: 0 !important;
              }
            }
          `}
        </style>
        <div className="hide-sidebar-for-payment">
          <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
            <PortalPaymentPage 
              invoice={invoiceForPayment} 
              onBack={handleBackFromPayment}
            />
          </div>
        </div>
      </>
    );
  }

  // Custom empty state for invalid customer ID or no invoices
  const EmptyInvoiceState = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Available</h3>
        <p className="text-sm text-gray-500">
          {!isValidCustomerId 
            ? "There are no invoices to display at this time."
            : "You don't have any invoices yet."}
        </p>
      </div>
    </div>
  );

  return (
    <div className="invoice-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Show banner if refreshing in background */}
      {isDataLoading && invoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2 mx-4 md:mx-0">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-700">Checking for new invoices...</span>
        </div>
      )}

      {/* Legacy Autopay Migration Banner */}
      {!loadingAutopayStatus && customerAutopayStatus && customerAutopayStatus.legacy?.autopayEnabled && !customerAutopayStatus.stripe?.autopayEnabled && SHOW_LEGACY_AUTOPAY_BANNER && isValidCustomerId && (
        <LegacyAutopayBanner />
      )}

      {/* Full Invoice View */}
      {selectedInvoice ? (
        <InvoiceDetail 
          invoice={selectedInvoice}
          customerInfo={customerInfo}
          onClose={handleCloseInvoice}
          onPrint={(invoice) => handlePrintInvoice(invoice, customerInfo)}
          onDownload={(invoice) => handleDownloadInvoice(invoice, customerInfo)}
          onPay={handlePayInvoice}
        />
      ) : (
        <div className="px-4 md:px-0">
          {/* Show empty state if no valid customer ID or no invoices */}
          {(!isValidCustomerId || invoices.length === 0) ? (
            <>
              <EmptyInvoiceListView />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <InvoiceSummary invoices={[]} />
                <BillingInformation 
                  billingAddress={null} 
                  isLoading={false} 
                />
              </div>

              <EmailNotifications 
                newInvoiceAlerts={newInvoiceAlerts}
                paymentFailureAlerts={paymentFailureAlerts}
                notificationEmail={notificationEmail}
                loadingNotificationSettings={loadingNotificationSettings}
                onToggleNotification={handleNotificationToggle}
              />
            </>
          ) : (
            <>
              <InvoiceList 
                invoices={invoices}
                filteredInvoices={filteredInvoices}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                onInvoiceSelect={handleViewInvoice}
                loadingInvoiceId={loadingInvoiceId}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <InvoiceSummary invoices={invoices} />
                <BillingInformation 
                  billingAddress={mostRecentBillingAddress} 
                  isLoading={isDataLoading} 
                />
              </div>

              <EmailNotifications 
                newInvoiceAlerts={newInvoiceAlerts}
                paymentFailureAlerts={paymentFailureAlerts}
                notificationEmail={notificationEmail}
                loadingNotificationSettings={loadingNotificationSettings}
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