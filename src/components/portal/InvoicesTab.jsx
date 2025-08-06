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

const InvoicesTab = ({ customerId }) => {
 // Validate customer ID right at the start
 const isValidCustomerId = customerId && customerId !== 'pending' && /^\d{4,5}$/.test(customerId);
 
 // Pass null if invalid to prevent API calls
 const { data: invoicesData, isLoading, error } = useInvoices(isValidCustomerId ? customerId : null);
 const { data: paymentsData } = usePayments(isValidCustomerId ? customerId : null);
 const { fetchInvoices } = useCustomerData();
 const { salesforceContactId } = useMemberPortal();
 
 const [filterValue, setFilterValue] = useState('all');
 const [selectedInvoice, setSelectedInvoice] = useState(null);
 const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
 const [mostRecentBillingAddress, setMostRecentBillingAddress] = useState(null);
 const [customerInfo, setCustomerInfo] = useState(null);
 
 // Autopay status state
 const [customerAutopayStatus, setCustomerAutopayStatus] = useState(null);
 const [loadingAutopayStatus, setLoadingAutopayStatus] = useState(true);
 
 // Cache for invoice details to prevent duplicate API calls
 const invoiceDetailsCache = useRef(new Map());
 const billingAddressFetchedRef = useRef(false);
 const fetchingInvoicesRef = useRef(new Set());
 
 // Payment page states
 const [showPaymentPage, setShowPaymentPage] = useState(false);
 const [invoiceForPayment, setInvoiceForPayment] = useState(null);
 
 // Email notification settings
 const [newInvoiceAlerts, setNewInvoiceAlerts] = useState(false);
 const [paymentFailureAlerts, setPaymentFailureAlerts] = useState(false);
 const [notificationEmail, setNotificationEmail] = useState('');
 const [loadingNotificationSettings, setLoadingNotificationSettings] = useState(true);
 const [savingNotificationSettings, setSavingNotificationSettings] = useState(false);

 // Add Helvetica font with lighter weights
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
       // Scroll to top after state changes
       requestAnimationFrame(() => {
         window.scrollTo(0, 0);
         document.documentElement.scrollTop = 0;
         document.body.scrollTop = 0;
         // Also try to find and scroll any parent containers
         const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
         containers.forEach(container => {
           if (container) container.scrollTop = 0;
         });
       });
     } else if (event.state && event.state.invoiceView === 'detail') {
       // If we have invoice data in state, we could restore it
       // For now, just go back to list
       setSelectedInvoice(null);
       setShowPaymentPage(false);
       setInvoiceForPayment(null);
       // Scroll to top after state changes
       requestAnimationFrame(() => {
         window.scrollTo(0, 0);
         document.documentElement.scrollTop = 0;
         document.body.scrollTop = 0;
         // Also try to find and scroll any parent containers
         const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
         containers.forEach(container => {
           if (container) container.scrollTop = 0;
         });
       });
     }
   };

   window.addEventListener('popstate', handlePopState);

   // Set initial state for the list view
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
       // Set defaults on error
       setNewInvoiceAlerts(false);
       setPaymentFailureAlerts(false);
       setNotificationEmail(customerInfo?.email || '');
     }
   } catch (error) {
     console.error('Error fetching notification settings:', error);
     // Set defaults on error
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
     // Update state immediately for better UX
     if (type === 'newInvoice') {
       setNewInvoiceAlerts(value);
     } else if (type === 'paymentFailure') {
       setPaymentFailureAlerts(value);
     }
     
     // Call API to update settings
     const result = await invoiceNotificationsApi.toggleNotification(type, value);
     
     if (!result.success) {
       // Revert on error
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
     // Revert on error
     if (type === 'newInvoice') {
       setNewInvoiceAlerts(!value);
     } else if (type === 'paymentFailure') {
       setPaymentFailureAlerts(!value);
     }
   } finally {
     setSavingNotificationSettings(false);
   }
 };

 // Process invoices when data changes
 const invoices = React.useMemo(() => {
   return processInvoices(invoicesData, paymentsData);
 }, [invoicesData, paymentsData]);

 // Fetch billing address from most recent invoice - FIXED to prevent duplicate calls
 useEffect(() => {
   if (invoices.length > 0 && !mostRecentBillingAddress && !billingAddressFetchedRef.current) {
     billingAddressFetchedRef.current = true;
     
     // Sort by date to get most recent
     const sortedByDate = [...invoices].sort((a, b) => 
       new Date(b.date) - new Date(a.date)
     );
     
     // Try to use billing address from the invoice list first
     const mostRecent = sortedByDate[0];
     if (mostRecent.billingAddress) {
       setMostRecentBillingAddress(mostRecent.billingAddress);
       console.log('Using billing address from invoice list');
     }
   }
 }, [invoices, mostRecentBillingAddress]);

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

 // Handle viewing invoice details - FIXED with caching and deduplication
 const handleViewInvoice = useCallback(async (invoice) => {
   const invoiceKey = `${invoice.internalId}-${invoice.id}`;
   
   // Prevent duplicate fetches
   if (fetchingInvoicesRef.current.has(invoiceKey)) {
     console.log('Already fetching this invoice, skipping...');
     return;
   }
   
   setLoadingInvoiceId(invoice.id);
   window.scrollTo(0, 0);
   
   // Push new history state for the detail view
   window.history.pushState(
     { invoiceView: 'detail', invoiceId: invoice.id }, 
     '', 
     window.location.href
   );
   
   try {
     fetchingInvoicesRef.current.add(invoiceKey);
     
     // If we have an internal ID, try to fetch more details
     if (invoice.internalId) {
       let details;
       
       // Check cache first
       if (invoiceDetailsCache.current.has(invoiceKey)) {
         console.log('Using cached invoice details for:', invoice.id);
         details = invoiceDetailsCache.current.get(invoiceKey);
       } else {
         console.log('Fetching fresh invoice details for:', invoice.id);
         details = await getInvoiceDetails(invoice.internalId);
         
         // Cache the result
         invoiceDetailsCache.current.set(invoiceKey, details);
         
         // Clean cache if it gets too large
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
         // Preserve the payment pending status from the list
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
     // Just show what we have
     setSelectedInvoice(invoice);
   } finally {
     setLoadingInvoiceId(null);
     fetchingInvoicesRef.current.delete(invoiceKey);
   }
 }, [mostRecentBillingAddress]);

 // Handle closing invoice detail view
 const handleCloseInvoice = () => {
   setSelectedInvoice(null);
   // Use requestAnimationFrame to ensure DOM updates before scrolling
   requestAnimationFrame(() => {
     window.scrollTo(0, 0);
     document.documentElement.scrollTop = 0;
     document.body.scrollTop = 0;
     // Also try to find and scroll any parent containers
     const containers = document.querySelectorAll('.invoice-page, .bg-gray-50, [class*="overflow"]');
     containers.forEach(container => {
       if (container) container.scrollTop = 0;
     });
   });
 };

 // Handle payment action - Updated to show payment page
 const handlePayInvoice = (invoice) => {
   // Ensure we have all the necessary invoice details
   const invoiceWithDetails = {
     ...invoice,
     billingAddress: invoice.billingAddress || mostRecentBillingAddress
   };
   
   // Push new history state for the payment view
   window.history.pushState(
     { invoiceView: 'payment', invoiceId: invoice.id }, 
     '', 
     window.location.href
   );
   
   setInvoiceForPayment(invoiceWithDetails);
   setShowPaymentPage(true);
   
   // Force scroll to top after state update
   setTimeout(() => {
     // Try multiple approaches to find the scroll container
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
     
     // Also try window scroll
     window.scrollTo(0, 0);
   }, 0);
 };

 // Handle back from payment page
 const handleBackFromPayment = () => {
   setShowPaymentPage(false);
   setInvoiceForPayment(null);
   // Always clear selected invoice to go back to list view
   setSelectedInvoice(null);
   // Refresh invoices to show updated payment status
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
     await fetchInvoices({ forceRefresh: true });
   }
 };

 // Loading state
 if (isLoading && !invoices.length && isValidCustomerId) {
   return <LoadingState />;
 }

 // Error state
 if (error && !invoices.length && isValidCustomerId) {
   return <ErrorState error={error} onRefresh={handleRefresh} />;
 }

 // Show payment page if active
 if (showPaymentPage && invoiceForPayment) {
   return (
     <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
       <PortalPaymentPage 
         invoice={invoiceForPayment} 
         onBack={handleBackFromPayment}
       />
     </div>
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
     {isLoading && invoices.length > 0 && (
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
             <EmptyInvoiceState />
             
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
             />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InvoiceSummary invoices={invoices} />
               <BillingInformation 
                 billingAddress={mostRecentBillingAddress} 
                 isLoading={isLoading} 
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