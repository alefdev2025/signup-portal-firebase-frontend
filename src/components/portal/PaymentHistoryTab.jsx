import React, { useState, useEffect } from 'react';
import { usePayments, usePaymentSummary, useCustomerData, useAutopay } from './contexts/CustomerDataContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getSignupPaymentHistory } from '../../services/membership';

// Global testing flags
const USE_TEST_CUSTOMER_ID = false; // Set to false when ready for production
const TEST_CUSTOMER_ID = '4527';
const ENABLE_AUTOPAY_FEATURE = true; // Toggle this to enable/disable autopay functionality
const ENABLE_DISABLE_AUTOPAY_OPTION = true; // Toggle this to enable/disable the "Disable Autopay" option

const PaymentHistoryTab = () => {
 // Get the customer ID from MemberPortal context
 const { customerId: contextCustomerId } = useMemberPortal();
 
 // CRITICAL FIX: Don't use customer ID if it's "pending" or invalid
 const isValidCustomerId = contextCustomerId && 
                          contextCustomerId !== 'pending' && 
                          contextCustomerId !== 'undefined' &&
                          contextCustomerId !== 'null' &&
                          !isNaN(contextCustomerId);
 
 // Use test ID if flag is set, otherwise use the context customer ID ONLY if valid
 const customerId = USE_TEST_CUSTOMER_ID ? TEST_CUSTOMER_ID : 
                   (isValidCustomerId ? contextCustomerId : null);
 
 // CRITICAL: Only fetch NetSuite data if we have a valid customer ID
 const { data: paymentsData, isLoading, error } = customerId ? usePayments() : { data: null, isLoading: false, error: null };
 const { data: summaryData } = customerId ? usePaymentSummary() : { data: null };
 const { fetchPaymentsWithDetails } = useCustomerData();
 
 // Always call the hook, but only use it if feature is enabled AND we have valid customer ID
 const { 
   data: autopayStatus, 
   isLoading: autopayLoading, 
   error: autopayError, 
   updateAutopay 
 } = (ENABLE_AUTOPAY_FEATURE && customerId) ? useAutopay() : { 
   data: null, 
   isLoading: false, 
   error: null, 
   updateAutopay: () => {} 
 };
 
 const [selectedYear, setSelectedYear] = useState('All');
 const [showAutopayModal, setShowAutopayModal] = useState(false);
 const [updatingAutopay, setUpdatingAutopay] = useState(false);
 const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
 const [stats, setStats] = useState({
   totalSpent: 0,
   averagePayment: 0,
   lastPayment: 0,
   yearTotals: {}
 });

 // Add state for signup payments
 const [signupPayments, setSignupPayments] = useState([]);
 const [loadingSignup, setLoadingSignup] = useState(true);
 const [signupError, setSignupError] = useState(null);
 const [showSignupDetails, setShowSignupDetails] = useState(false);
 const [selectedSignupPayment, setSelectedSignupPayment] = useState(null);

 // Add Helvetica font with lighter weights
 useEffect(() => {
   const style = document.createElement('style');
   style.innerHTML = `
     .payment-page * {
       font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
       font-weight: 300 !important;
     }
     .payment-page h1,
     .payment-page h2,
     .payment-page h3,
     .payment-page h4 {
       font-weight: 400 !important;
     }
     .payment-page .font-medium {
       font-weight: 400 !important;
     }
     .payment-page .font-semibold {
       font-weight: 500 !important;
     }
     .payment-page .font-bold {
       font-weight: 500 !important;
     }
     .payment-page p,
     .payment-page span,
     .payment-page div {
       font-weight: 300 !important;
     }
     .payment-page .text-xs {
       font-weight: 400 !important;
     }
   `;
   document.head.appendChild(style);
   
   return () => {
     document.head.removeChild(style);
   };
 }, []);

 // Fetch signup payment history - ALWAYS fetch this regardless of customer ID
 useEffect(() => {
   const fetchSignupPayments = async () => {
     try {
       setLoadingSignup(true);
       const result = await getSignupPaymentHistory();
       
       if (result.success && result.data.payments) {
         setSignupPayments(result.data.payments);
       }
     } catch (error) {
       console.error('Failed to load signup payments:', error);
       setSignupError(error.message);
     } finally {
       setLoadingSignup(false);
     }
   };
   
   fetchSignupPayments();
 }, []);

 // Add click outside handler for dropdown
 useEffect(() => {
   const handleClickOutside = (e) => {
     if (!e.target.closest('.autopay-options-dropdown')) {
       setShowOptionsDropdown(false);
     }
   };

   if (showOptionsDropdown) {
     document.addEventListener('click', handleClickOutside);
     return () => document.removeEventListener('click', handleClickOutside);
   }
 }, [showOptionsDropdown]);

 // Handle navigation to payment methods
 const handleNavigateToPaymentMethods = () => {
   // Use the same navigation method that's used in the portal
   window.location.hash = 'payments-methods';
 };

 // Handle autopay toggle (only if feature is enabled)
 const handleAutopayToggle = async () => {
   if (!ENABLE_AUTOPAY_FEATURE || !customerId) return;
   
   setUpdatingAutopay(true);
   try {
     const result = await updateAutopay(!autopayStatus.autopayEnabled);
     
     if (result.success) {
       // Close modal
       setShowAutopayModal(false);
       
       // Show success message (you might want to use a toast library)
       alert(`Autopay has been ${result.currentStatus ? 'enabled' : 'disabled'} successfully`);
     } else {
       throw new Error(result.error || 'Failed to update autopay status');
     }
   } catch (error) {
     console.error('Error updating autopay:', error);
     alert('Failed to update autopay status. Please try again.');
   } finally {
     setUpdatingAutopay(false);
   }
 };

 // Format date for display
 const formatDate = (dateString) => {
   if (!dateString) return 'N/A';
   const date = new Date(dateString);
   return date.toLocaleDateString('en-US', { 
     year: 'numeric', 
     month: 'short', 
     day: 'numeric' 
   });
 };

 // Format currency
 const formatCurrency = (amount, currency = 'USD') => {
   return new Intl.NumberFormat('en-US', {
     style: 'currency',
     currency: currency,
     minimumFractionDigits: 2,
     maximumFractionDigits: 2
   }).format(amount || 0);
 };

 // Process payments when data changes
 const payments = React.useMemo(() => {
   if (!paymentsData?.payments) return [];
   
   return paymentsData.payments.map(payment => ({
     id: payment.id,
     internalId: payment.internalId,
     date: formatDate(payment.date),
     rawDate: payment.date,
     description: payment.memo || `Payment ${payment.documentNumber}`,
     documentNumber: payment.documentNumber,
     amount: parseFloat(payment.amount) || 0,
     status: payment.status || 'Completed',
     method: payment.paymentMethod || 'Unknown',
     currency: payment.currency || 'USD',
     appliedTo: payment.appliedTo || [],
     invoiceDetails: payment.invoiceDetails || [],
     unapplied: parseFloat(payment.unapplied) || 0
   }));
 }, [paymentsData]);

 // Calculate stats when payments or summary data changes
 useEffect(() => {
   if (payments.length > 0) {
     const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
     const averagePayment = totalSpent / payments.length;
     const lastPayment = payments[0].amount;

     // Calculate yearly totals
     const yearTotals = {};
     payments.forEach(payment => {
       const year = new Date(payment.rawDate).getFullYear();
       yearTotals[year] = (yearTotals[year] || 0) + payment.amount;
     });

     setStats({
       totalSpent,
       averagePayment,
       lastPayment,
       yearTotals,
       ...(summaryData?.summary || {})
     });
   }
 }, [payments, summaryData]);

 // Filter payments by year
 const filteredPayments = selectedYear === 'All' 
   ? payments 
   : payments.filter(payment => new Date(payment.rawDate).getFullYear() === parseInt(selectedYear));

 // Get unique years for filter dropdown
 const availableYears = [...new Set(payments.map(p => new Date(p.rawDate).getFullYear()))].sort((a, b) => b - a);

 // Export payments
 const handleExportPayments = () => {
   try {
     // If no payments, alert user
     if (!filteredPayments || filteredPayments.length === 0) {
       alert('No payments found to export');
       return;
     }

     // Convert payments to CSV format
     const csvHeaders = [
       'Date',
       'Payment #',
       'Description',
       'Method',
       'Amount',
       'Currency',
       'Status'
     ];

     // Create CSV rows
     const csvRows = filteredPayments.map(payment => {
       // Format status for export
       let exportStatus = payment.status;
       if (payment.status === 'Deposited') exportStatus = 'Completed';
       else if (payment.status === 'Not Deposited') exportStatus = 'Processing';
       else if (payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment') exportStatus = 'Pending';

       return [
         payment.date || '',
         payment.documentNumber || '',
         payment.description || `Payment ${payment.documentNumber}`,
         payment.method || 'Unknown',
         payment.amount.toFixed(2) || '0.00',
         payment.currency || 'USD',
         exportStatus || 'Unknown'
       ];
     });

     // Combine headers and rows
     const csvContent = [
       csvHeaders,
       ...csvRows
     ].map(row => 
       row.map(cell => {
         // Escape quotes and wrap in quotes if contains comma, newline, or quotes
         const cellStr = String(cell);
         if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
           return `"${cellStr.replace(/"/g, '""')}"`;
         }
         return cellStr;
       }).join(',')
     ).join('\n');

     // Create blob and download
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement('a');
     const url = URL.createObjectURL(blob);
     
     // Generate filename with date
     const today = new Date().toISOString().split('T')[0];
     const filename = selectedYear !== 'All'
       ? `payments_${customerId || 'unknown'}_${selectedYear}.csv`
       : `payments_${customerId || 'unknown'}_${today}.csv`;
     
     link.setAttribute('href', url);
     link.setAttribute('download', filename);
     link.style.visibility = 'hidden';
     
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     
     // Clean up
     URL.revokeObjectURL(url);

   } catch (error) {
     console.error('Error exporting payments:', error);
     alert('Failed to export payments. Please try again.');
   }
 };

 // Handle refresh
 const handleRefresh = async () => {
   if (customerId) {
     await fetchPaymentsWithDetails({ forceRefresh: true });
   }
 };

 // Handle viewing signup payment details
 const handleViewSignupDetails = (payment) => {
   setSelectedSignupPayment(payment);
   setShowSignupDetails(true);
 };

 // Check if we have any payment data at all
 const hasSignupPaymentData = signupPayments.length > 0 && signupPayments.some(p => p.status === 'completed');
 const hasNetSuitePayments = payments.length > 0;

 // Initial loading state - only show if loading signup payments
 if (loadingSignup && !hasSignupPaymentData) {
   return (
     <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
         <p className="text-[#6b7280]">Loading payment history...</p>
       </div>
     </div>
   );
 }

 // If we're waiting for customer ID, show a waiting message
 if (!customerId && !hasSignupPaymentData) {
   return (
     <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
       <div className="text-center">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
         <p className="text-[#6b7280]">Loading member information...</p>
       </div>
     </div>
   );
 }

 return (
   <div className="payment-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
     {/* Small top padding */}
     <div className="h-8"></div>

     {/* Show test mode banner if using test customer ID */}
     {USE_TEST_CUSTOMER_ID && (
       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 mx-4 md:mx-0">
         <p className="text-sm text-yellow-800">
           <strong>Test Mode:</strong> Showing data for test customer {TEST_CUSTOMER_ID}. 
           Set USE_TEST_CUSTOMER_ID to false to use actual customer data.
         </p>
       </div>
     )}

     {/* Show autopay disabled banner if feature flag is off */}
     {!ENABLE_AUTOPAY_FEATURE && (
       <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 mx-4 md:mx-0">
         <p className="text-sm text-gray-600">
           <strong>Note:</strong> Autopay feature is currently disabled. Set ENABLE_AUTOPAY_FEATURE to true to enable.
         </p>
       </div>
     )}

     {/* Autopay Status Banner - Only show if feature is enabled AND autopay is enabled AND we have customer ID */}
     {ENABLE_AUTOPAY_FEATURE && customerId && autopayStatus?.autopayEnabled && (
       <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 mx-4 md:mx-0 animate-fadeIn">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#1a3552] via-[#13283f] to-[#0a1825] border-2 border-[#3B82F6] shadow-lg hover:shadow-xl">
               <svg className="w-6 h-6 text-white stroke-[0.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
               </svg>
             </div>
             <div>
               <h3 className="text-lg font-semibold text-gray-900">Automatic Payments</h3>
               <p className="text-sm text-gray-600">
                 {autopayLoading ? (
                   <span className="flex items-center gap-2">
                     <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Checking status...
                   </span>
                 ) : autopayError ? (
                   <span className="text-red-600">Unable to load autopay status</span>
                 ) : (
                   <span className="text-green-600 font-medium">Enabled - Your card will be charged automatically</span>
                 )}
               </p>
             </div>
           </div>
           
           {!autopayLoading && !autopayError && autopayStatus && (
             <div className="relative autopay-options-dropdown">
               <button
                 onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                 className="px-4 py-2 rounded-lg font-medium transition-all text-sm text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center gap-2"
               >
                 Options
                 <svg className={`w-5 h-5 transition-transform ${showOptionsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                 </svg>
               </button>
               
               {showOptionsDropdown && (
                 <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                   {ENABLE_DISABLE_AUTOPAY_OPTION && (
                     <button
                       onClick={() => {
                         setShowOptionsDropdown(false);
                         setShowAutopayModal(true);
                       }}
                       className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                     >
                       Disable Autopay
                     </button>
                   )}
                   <button
                     onClick={() => {
                       setShowOptionsDropdown(false);
                       handleNavigateToPaymentMethods();
                     }}
                     className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                   >
                     Update Payment Method
                   </button>
                 </div>
               )}
             </div>
           )}
         </div>
       </div>
     )}

     {/* Autopay Confirmation Modal - Only show if feature is enabled */}
     {ENABLE_AUTOPAY_FEATURE && showAutopayModal && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">
             {autopayStatus?.autopayEnabled ? 'Disable Automatic Payments?' : 'Enable Automatic Payments?'}
           </h3>
           <p className="text-gray-600 mb-6">
             {autopayStatus?.autopayEnabled
               ? 'You will need to manually pay your invoices when they are due. Are you sure you want to disable automatic payments?'
               : 'Your payment method on file will be automatically charged when invoices are due. Would you like to enable automatic payments?'}
           </p>
           <div className="flex gap-3 justify-end">
             <button
               onClick={() => setShowAutopayModal(false)}
               className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
             >
               Cancel
             </button>
             <button
               onClick={handleAutopayToggle}
               disabled={updatingAutopay}
               className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                 autopayStatus?.autopayEnabled
                   ? 'bg-red-600 text-white hover:bg-red-700'
                   : 'bg-green-600 text-white hover:bg-green-700'
               } disabled:opacity-50 disabled:cursor-not-allowed`}
             >
               {updatingAutopay && (
                 <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               )}
               {autopayStatus?.autopayEnabled ? 'Disable' : 'Enable'}
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Signup Payment Details Modal */}
     {showSignupDetails && selectedSignupPayment && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-semibold text-gray-900">Initial Signup Payment Details</h3>
             <button
               onClick={() => setShowSignupDetails(false)}
               className="text-gray-400 hover:text-gray-500"
             >
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           
           <div className="space-y-4">
             {/* Basic Information */}
             <div>
               <h4 className="text-sm font-medium text-gray-900 mb-2">Transaction Information</h4>
               <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                 <div>
                   <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                   <dd className="mt-1 text-sm text-gray-900 font-mono">
                     {selectedSignupPayment.paymentIntentId || selectedSignupPayment.id}
                   </dd>
                 </div>
                 <div>
                   <dt className="text-sm font-medium text-gray-500">Date</dt>
                   <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedSignupPayment.date)}</dd>
                 </div>
                 <div>
                   <dt className="text-sm font-medium text-gray-500">Status</dt>
                   <dd className="mt-1">
                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                       Completed
                     </span>
                   </dd>
                 </div>
                 <div>
                   <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                   <dd className="mt-1 text-sm text-gray-900">{selectedSignupPayment.paymentMethod || 'Card'}</dd>
                 </div>
               </dl>
             </div>

             {/* Amount Breakdown */}
             {selectedSignupPayment.breakdown && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Breakdown</h4>
              <dl className="border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Base Membership Cost</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(selectedSignupPayment.breakdown.baseCost)}
                  </dd>
                </div>
                {/* Only show application fee for cryopreservation members */}
                {selectedSignupPayment.breakdown.applicationFee > 0 && 
                (selectedSignupPayment.membershipDetails?.preservationType && 
                  !selectedSignupPayment.membershipDetails.isBasicMembership) && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">
                      Application Fee
                      <span className="text-xs text-gray-400 block">Cryopreservation members only</span>
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedSignupPayment.breakdown.applicationFee)}
                    </dd>
                  </div>
                )}
                {selectedSignupPayment.breakdown.cmsAnnualFee > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">CMS Annual Fee</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedSignupPayment.breakdown.cmsAnnualFee)}
                    </dd>
                  </div>
                )}
                {selectedSignupPayment.breakdown.iceDiscount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">ICE Code Discount</dt>
                    <dd className="text-sm font-medium text-green-600">
                      -{formatCurrency(selectedSignupPayment.breakdown.iceDiscount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-900">Total Paid</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(selectedSignupPayment.amount)}
                  </dd>
                </div>
              </dl>
            </div>
          )}

             {/* Membership Details */}
             {selectedSignupPayment.membershipDetails && (
               <div>
                 <h4 className="text-sm font-medium text-gray-900 mb-2">Membership Details</h4>
                 <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                   <div>
                     <dt className="text-sm font-medium text-gray-500">Preservation Type</dt>
                     <dd className="mt-1 text-sm text-gray-900 capitalize">
                       {selectedSignupPayment.membershipDetails.preservationType || 'Standard'}
                     </dd>
                   </div>
                   <div>
                     <dt className="text-sm font-medium text-gray-500">Payment Frequency</dt>
                     <dd className="mt-1 text-sm text-gray-900 capitalize">
                       {selectedSignupPayment.membershipDetails.paymentFrequency || 'Annual'}
                     </dd>
                   </div>
                   {selectedSignupPayment.membershipDetails.iceCode && (
                     <div>
                       <dt className="text-sm font-medium text-gray-500">ICE Code Used</dt>
                       <dd className="mt-1 text-sm text-gray-900">
                         {selectedSignupPayment.membershipDetails.iceCode}
                       </dd>
                     </div>
                   )}
                 </dl>
               </div>
             )}
           </div>

           <div className="mt-6 flex justify-end">
             <button
               onClick={() => setShowSignupDetails(false)}
               className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
             >
               Close
             </button>
           </div>
         </div>
       </div>
     )}

     {/* Show banner if refreshing in background */}
     {isLoading && payments.length > 0 && (
       <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2 mx-4 md:mx-0">
         <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
         </svg>
         <span className="text-sm text-blue-700">Checking for new payments...</span>
       </div>
     )}

     <div className="px-4 md:px-0">
       {/* Initial Signup Payment Section - Updated with better styling */}
{/* Initial Signup Payment Section - Updated with better styling */}
{hasSignupPaymentData && (
  <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn" 
       style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 md:mb-12">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Initial Membership Payment</h2>
    </div>
    
    {/* Updated design without light blue background */}
    {signupPayments.filter(p => p.status === 'completed').map((payment) => {
      // Determine if this was a cryopreservation member based on presence of application fee or preservation type
      const isCryoMember = payment.breakdown?.applicationFee > 0 || 
                          (payment.membershipDetails?.preservationType && 
                           ['neuro', 'wholebody', 'whole-body', 'neurocryopreservation', 'wholebody-cryopreservation'].includes(payment.membershipDetails.preservationType.toLowerCase()));
      
      return (
        <div key={payment.id}>
          {/* Desktop view - Table-like layout */}
          <div className="hidden sm:block overflow-x-auto -mx-6 md:mx-0">
            <div className="min-w-[600px] px-6 md:px-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Transaction ID</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Method</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white">
                    <td className="py-6 px-6 text-base text-[#2a2346] font-light">{formatDate(payment.date)}</td>
                    <td className="py-6 px-6 text-base font-medium text-[#6b5b7e] font-mono text-sm">
                      {payment.paymentIntentId ? payment.paymentIntentId.substring(0, 16) + '...' : payment.id}
                    </td>
                    <td className="py-6 px-6">
                      <div>
                        <p className="text-sm text-[#2a2346] font-medium">
                          Membership Activation
                        </p>
                        {payment.membershipDetails && (
                          <p className="text-xs text-[#6b7280] mt-1">
                            {payment.membershipDetails.preservationType === 'basic' ? 'Basic Membership' : 
                             payment.membershipDetails.preservationType === 'neuro' ? 'Neurocryopreservation' :
                             payment.membershipDetails.preservationType === 'wholebody' ? 'Whole Body Cryopreservation' :
                             payment.membershipDetails.preservationType || 'Standard'} • {payment.membershipDetails.paymentFrequency || 'Annual'}
                          </p>
                        )}
                        {payment.breakdown && payment.breakdown.iceDiscount > 0 && (
                          <p className="text-xs text-green-600 mt-1">
                            ICE discount: -{formatCurrency(payment.breakdown.iceDiscount)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-6 text-base text-[#4a3d6b] font-light hidden md:table-cell">
                      {payment.paymentMethod || 'Card'}
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div>
                        <p className="text-xl font-semibold text-[#2a2346]">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.breakdown && (
                          <div className="text-xs text-[#6b7280] mt-1">
                            {/* Only show application fee for cryopreservation members */}
                            {payment.breakdown.applicationFee > 0 && isCryoMember && (
                              <div>Includes {formatCurrency(payment.breakdown.applicationFee)} app fee (cryo)</div>
                            )}
                            {payment.breakdown.cmsAnnualFee > 0 && (
                              <div>Includes {formatCurrency(payment.breakdown.cmsAnnualFee)} CMS fee</div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#e5d4f1] text-[#6b5b7e]">
                        Completed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile view - Card layout */}
          <div className="sm:hidden">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{formatDate(payment.date)}</p>
                  <p className="text-base font-medium text-[#6b5b7e]">Membership Activation</p>
                </div>
                <p className="text-xl font-semibold text-[#2a2346]">{formatCurrency(payment.amount)}</p>
              </div>
              <div className="space-y-2 mb-3">
                <p className="text-xs text-gray-600">
                  Transaction: {payment.paymentIntentId ? payment.paymentIntentId.substring(0, 16) + '...' : payment.id}
                </p>
                {payment.membershipDetails && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">
                      {payment.membershipDetails.preservationType === 'basic' ? 'Basic Membership' : 
                       payment.membershipDetails.preservationType === 'neuro' ? 'Neurocryopreservation' :
                       payment.membershipDetails.preservationType === 'wholebody' ? 'Whole Body Cryopreservation' :
                       payment.membershipDetails.preservationType || 'Standard'}
                    </span> • {payment.membershipDetails.paymentFrequency || 'Annual'}
                  </p>
                )}
                {payment.breakdown && payment.breakdown.iceDiscount > 0 && (
                  <p className="text-xs text-green-600">
                    ICE discount applied: -{formatCurrency(payment.breakdown.iceDiscount)}
                  </p>
                )}
                {/* Only show application fee for cryopreservation members */}
                {payment.breakdown && payment.breakdown.applicationFee > 0 && isCryoMember && (
                  <p className="text-xs text-gray-600">
                    Includes {formatCurrency(payment.breakdown.applicationFee)} application fee (cryopreservation)
                  </p>
                )}
                {payment.breakdown && payment.breakdown.cmsAnnualFee > 0 && (
                  <p className="text-xs text-gray-600">
                    Includes {formatCurrency(payment.breakdown.cmsAnnualFee)} CMS annual fee
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">Method: {payment.paymentMethod || 'Card'}</p>
                <span className="text-xs px-2 py-1 rounded bg-[#e5d4f1] text-[#6b5b7e]">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}

       {/* NetSuite Payment History - Only show if has payments AND valid customer ID */}
       {hasNetSuitePayments && customerId && (
         <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100" 
              style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
           <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6 md:mb-12">
             <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Payment History</h2>
             <div className="hidden sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
               <select 
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(e.target.value)}
                 className="w-full sm:w-auto px-4 pr-8 py-2 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-sm border border-[#6b5b7e] focus:border-[#4a4266]"
               >
                 <option value="All">All Payments</option>
                 {availableYears.map(year => (
                   <option key={year} value={year}>{year}</option>
                 ))}
               </select>
               <button 
                 onClick={handleExportPayments}
                 className="px-4 py-2 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border-2 border-[#6b5b7e] rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 </svg>
                 <span>Export</span>
               </button>
             </div>
           </div>

           {filteredPayments.length === 0 ? (
             <div className="text-center py-8 sm:py-16">
               <p className="text-[#4a3d6b] text-base sm:text-lg">
                 No payments found {selectedYear !== 'All' ? `for ${selectedYear}` : ''}
               </p>
             </div>
           ) : (
             <>
               {/* Mobile view - Card layout */}
               <div className="sm:hidden">
                 <div className="space-y-4 mb-6">
                   {filteredPayments.map((payment, index) => (
                     <div key={payment.id} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                       <div className="flex justify-between items-start mb-3">
                         <div>
                           <p className="text-sm text-gray-600 mb-1">{new Date(payment.rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                           <p className="text-base font-medium text-[#6b5b7e]">#{payment.documentNumber}</p>
                         </div>
                         <p className="text-xl font-semibold text-[#2a2346]">${payment.amount.toFixed(2)}</p>
                       </div>
                       <p className="text-sm text-[#2a2346] mb-3">{payment.description || 'Payment'}</p>
                       <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                         <p className="text-sm text-gray-600">Method: {payment.method}</p>
                         <span className={`text-xs px-2 py-1 rounded ${
                           payment.status === 'Deposited' 
                             ? 'bg-[#e5d4f1] text-[#6b5b7e]'
                             : payment.status === 'Not Deposited'
                             ? 'bg-blue-100 text-blue-700'
                             : payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment'
                             ? 'bg-blue-50 text-blue-600'
                             : 'bg-gray-100 text-gray-700'
                         }`}>
                           {payment.status === 'Deposited' ? 'Completed' : 
                            payment.status === 'Not Deposited' ? 'Processing' :
                            payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment' ? 'Pending' :
                            payment.status}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
                 
                 {/* Mobile buttons after payments */}
                 <div className="flex flex-col gap-3 mt-6">
                   <select 
                     value={selectedYear}
                     onChange={(e) => setSelectedYear(e.target.value)}
                     className="w-full px-4 pr-8 py-3 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-base border border-[#6b5b7e] focus:border-[#4a4266]"
                   >
                     <option value="All">All Payments</option>
                     {availableYears.map(year => (
                       <option key={year} value={year}>{year}</option>
                     ))}
                   </select>
                   <button 
                     onClick={handleExportPayments}
                     className="w-full px-4 py-3 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border-2 border-[#6b5b7e] rounded-lg transition-all flex items-center justify-center gap-2 text-base"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                     </svg>
                     <span>Export Payments</span>
                   </button>
                 </div>
               </div>

               {/* Desktop view - Table layout */}
               <div className="hidden sm:block overflow-x-auto -mx-6 md:mx-0">
                 <div className="min-w-[600px] px-6 md:px-0">
                   <table className="w-full">
                     <thead>
                       <tr className="border-b-2 border-gray-200">
                         <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Date</th>
                         <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Payment #</th>
                         <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Description</th>
                         <th className="text-left py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Method</th>
                         <th className="text-right py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
                         <th className="text-center py-4 px-6 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filteredPayments.map((payment, index) => (
                         <tr key={payment.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                           <td className="py-6 px-6 text-base text-[#2a2346] font-light">{payment.date}</td>
                           <td className="py-6 px-6 text-base font-medium text-[#6b5b7e]">
                             {payment.documentNumber}
                           </td>
                           <td className="py-6 px-6">
                             <p className="text-sm text-[#2a2346] font-medium">
                               {payment.description || 'Payment'}
                             </p>
                             {payment.invoiceDetails && payment.invoiceDetails.length > 0 && (
                               <div className="mt-2 space-y-1">
                                 {payment.invoiceDetails.map((invoice, idx) => (
                                   <div key={idx} className="text-sm text-[#6b7280] font-light">
                                     <span className="font-medium">{invoice.transactionName}:</span>{' '}
                                     {invoice.description && (
                                       <span>{invoice.description}</span>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             )}
                           </td>
                           <td className="py-6 px-6 text-base text-[#4a3d6b] font-light hidden md:table-cell">{payment.method}</td>
                           <td className="py-6 px-6 text-xl font-semibold text-[#2a2346] text-right">
                             ${payment.amount.toFixed(2)}
                           </td>
                           <td className="py-6 px-6 text-center">
                             <span className={`text-xs px-3 py-1 rounded-lg font-medium ${
                               payment.status === 'Deposited' 
                                 ? 'bg-[#e5d4f1] text-[#6b5b7e]'
                                 : payment.status === 'Not Deposited'
                                 ? 'bg-blue-100 text-blue-700'
                                 : payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment'
                                 ? 'bg-blue-50 text-blue-600'
                                 : 'bg-gray-100 text-gray-700'
                             }`}>
                               {payment.status === 'Deposited' ? 'Completed' : 
                                payment.status === 'Not Deposited' ? 'Processing' :
                                payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment' ? 'Pending' :
                                payment.status}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </>
           )}
         </div>
       )}

       {/* Show empty state only if no data at all */}
       {!hasSignupPaymentData && !hasNetSuitePayments && !isLoading && !loadingSignup && (
         <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 text-center">
           <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
           </svg>
           <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
           <p className="text-sm text-gray-500">No payments have been recorded yet.</p>
         </div>
       )}

       {/* Annual Summary and Payment Records - Always show, even if empty */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-16">
         {/* Annual Summary Box */}
         <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 md:p-8 animate-fadeIn animation-delay-200 relative" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
               <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
             </div>
             <h3 className="text-lg md:text-xl font-semibold text-gray-900">Annual Summary</h3>
           </div>
           {Object.keys(stats.yearTotals).length > 0 ? (
             <div className="space-y-4 pb-12">
               {Object.entries(stats.yearTotals)
                 .sort(([a], [b]) => b - a)
                 .slice(0, 1)
                 .map(([year, total]) => (
                   <div key={year}>
                     <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                       <span className="text-gray-500 text-sm font-light">{year}</span>
                       <div className="text-right">
                         <span className="font-semibold text-gray-900 text-lg">${total.toFixed(2)}</span>
                         <p className="text-xs text-gray-500 font-light">
                           {payments.filter(p => new Date(p.rawDate).getFullYear() === parseInt(year)).length} payments
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
             </div>
           ) : (
             <div className="pb-12">
               <p className="text-[#6b7280] text-base font-light">No payment data available</p>
             </div>
           )}
           {customerId && (
             <button 
               onClick={handleRefresh}
               disabled={isLoading}
               className="absolute bottom-6 right-6 flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm text-[#3e466d] bg-white hover:bg-gray-50 border border-[#3e466d] rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               {isLoading ? 'Refreshing...' : 'Refresh'}
             </button>
           )}
         </div>

         {/* Payment Records Box */}
         <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 md:p-8 animate-fadeIn animation-delay-300" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#665a85] via-[#52476b] to-[#3e3551] border-2 border-[#E879F9] shadow-lg hover:shadow-xl">
               <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
             </div>
             <h3 className="text-lg md:text-xl font-semibold text-gray-900">Payment Records</h3>
           </div>
           <p className="text-sm text-gray-500 mb-6 font-light">
             This shows all recent payments recorded for your account.
           </p>
           <div className="space-y-4">
             <div className="flex justify-between items-center pb-4 border-b border-gray-100">
               <span className="text-gray-500 text-sm font-light">Customer ID</span>
               <span className="font-semibold text-gray-900 text-base md:text-lg">{customerId || 'Loading...'}</span>
             </div>
             <div className="flex justify-between items-center pb-4 border-b border-gray-100">
               <span className="text-gray-500 text-sm font-light">Total Payments</span>
               <span className="font-semibold text-gray-900 text-base md:text-lg">
                 {(payments.length + (hasSignupPaymentData ? 1 : 0))}
               </span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-gray-500 text-sm font-light">Last Payment</span>
               <span className="font-semibold text-gray-900 text-base md:text-lg">
                 {payments.length > 0 ? payments[0].date : 
                  hasSignupPaymentData ? formatDate(signupPayments[0].date) : 'N/A'}
               </span>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

export default PaymentHistoryTab;