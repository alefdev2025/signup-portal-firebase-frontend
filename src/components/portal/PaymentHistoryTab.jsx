import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { getSignupPaymentHistory } from '../../services/membership';

// Global testing flags
const USE_TEST_CUSTOMER_ID = false;
const TEST_CUSTOMER_ID = '4527';
const ENABLE_AUTOPAY_FEATURE = true;
const ENABLE_DISABLE_AUTOPAY_OPTION = true;

// Import the payment data service
import { paymentDataService } from './services/paymentDataService';

const PaymentHistoryTab = () => {
  // Create a ref for the top of the component
  const topRef = useRef(null);
  
  // Get customer ID from context
  const { customerId: contextCustomerId } = useMemberPortal();
  
  // Validate customer ID
  const isValidCustomerId = contextCustomerId && 
                           contextCustomerId !== 'pending' && 
                           contextCustomerId !== 'undefined' &&
                           contextCustomerId !== 'null' &&
                           !isNaN(contextCustomerId);
  
  const customerId = USE_TEST_CUSTOMER_ID ? TEST_CUSTOMER_ID : 
                    (isValidCustomerId ? contextCustomerId : null);
  
  // State management - Simple, no caching
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [autopayStatus, setAutopayStatus] = useState(null);
  const [signupPayments, setSignupPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('All');
  const [showAutopayModal, setShowAutopayModal] = useState(false);
  const [updatingAutopay, setUpdatingAutopay] = useState(false);
  const [showSignupDetails, setShowSignupDetails] = useState(false);
  const [selectedSignupPayment, setSelectedSignupPayment] = useState(null);
  const [expandedPayments, setExpandedPayments] = useState(new Set());
  const [stats, setStats] = useState({
    totalSpent: 0,
    averagePayment: 0,
    lastPayment: 0,
    yearTotals: {}
  });

  // Format helpers
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  }, []);

  const formatCurrency = useCallback((amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }, []);

  // Add styles
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
      .payment-expandable {
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .payment-expandable:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Toggle payment expansion
  const togglePaymentExpansion = useCallback((paymentId) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  }, []);

  // SIMPLE DATA FETCH - NO CACHING
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Always clear cache if the service has one
      if (paymentDataService.clearCache) {
        paymentDataService.clearCache();
      }
      
      if (!customerId) {
        // Still fetch signup payments even without customerId
        try {
          const signupResult = await getSignupPaymentHistory();
          if (signupResult.success && signupResult.data.payments) {
            setSignupPayments(signupResult.data.payments);
          }
        } catch (error) {
          console.error('Failed to load signup payments:', error);
        }
        setIsLoading(false);
        return;
      }

      console.log('Fetching fresh payment data for customer:', customerId);
      
      // Always get fresh data - removed includeLineItems parameter
      const data = await paymentDataService.getPaymentData(customerId, false);
      
      console.log('Payment data received:', {
        data: data,
        paymentsType: typeof data.payments,
        paymentCount: data.payments?.length || 0,
        hasInvoiceDetails: data.payments?.some(p => paymentDataService.hasInvoiceDetails(p)),
        samplePayment: data.payments?.[0]
      });
      
      // Process and set payments - data.payments should now be a proper array
      const processedPayments = (data.payments || []).map(payment => {
        // Debug individual payment
        console.log('Processing payment:', {
          id: payment.id,
          documentNumber: payment.documentNumber,
          amount: payment.amount,
          date: payment.date,
          appliedTo: payment.appliedTo?.length || 0
        });
        
        return {
          id: payment.id || payment.internalId || Math.random().toString(),
          internalId: payment.internalId,
          date: formatDate(payment.date || payment.tranDate || payment.paymentDate),
          rawDate: payment.date || payment.tranDate || payment.paymentDate,
          description: payment.memo || payment.note || `Payment ${payment.documentNumber || payment.tranId || ''}`,
          documentNumber: payment.documentNumber || payment.tranId || payment.refNum || '',
          amount: parseFloat(payment.amount || payment.total || 0) || 0,
          status: payment.status || payment.approvalStatus || 'Completed',
          method: payment.paymentMethod || payment.method || 'Unknown',
          currency: payment.currency || 'USD',
          appliedTo: payment.appliedTo || payment.applied || [],
          unapplied: parseFloat(payment.unapplied || payment.remaining || 0) || 0,
          hasInvoiceDetails: paymentDataService.hasInvoiceDetails(payment)
        };
      });
      
      console.log(`Processed ${processedPayments.length} payments`);
      
      setPayments(processedPayments);
      setPaymentSummary(data.paymentSummary || null);
      setAutopayStatus(data.autopayStatus || null);
      setSignupPayments(data.signupPayments || []);
      
    } catch (error) {
      console.error('Error loading payment data:', error);
      setError(error.message);
      
      // On error, still try to fetch signup payments
      try {
        const signupResult = await getSignupPaymentHistory();
        if (signupResult.success && signupResult.data.payments) {
          setSignupPayments(signupResult.data.payments);
        }
      } catch (signupError) {
        console.error('Failed to load signup payments:', signupError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerId, formatDate]);

  // Fetch data on mount and when customer changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats whenever payments change
  useEffect(() => {
    if (payments.length > 0) {
      const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const averagePayment = totalSpent / payments.length;
      const lastPayment = payments[0]?.amount || 0;

      const yearTotals = {};
      payments.forEach(payment => {
        const year = new Date(payment.rawDate).getFullYear();
        if (!isNaN(year)) {
          yearTotals[year] = (yearTotals[year] || 0) + payment.amount;
        }
      });

      setStats({
        totalSpent,
        averagePayment,
        lastPayment,
        yearTotals,
        ...(paymentSummary || {})
      });
    }
  }, [payments, paymentSummary]);

  // Handlers
  const handleNavigateToPaymentMethods = () => {
    window.location.hash = 'payments-methods';
  };

  const handleAutopayToggle = async () => {
    if (!ENABLE_AUTOPAY_FEATURE || !customerId) return;
    
    setUpdatingAutopay(true);
    try {
      const response = await fetch(`/api/customer/${customerId}/autopay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !autopayStatus?.autopayEnabled
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update autopay status');
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setAutopayStatus(prev => ({
          ...prev,
          autopayEnabled: result.currentStatus
        }));
        
        setShowAutopayModal(false);
        alert(`Autopay has been ${result.currentStatus ? 'enabled' : 'disabled'} successfully`);
        
        // Refresh data to get latest status
        fetchData();
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

  const handleRefresh = () => {
    console.log('Manually refreshing payments...');
    fetchData();
  };

  const handleExportPayments = () => {
    try {
      const paymentsToExport = selectedYear === 'All' 
        ? payments 
        : payments.filter(payment => new Date(payment.rawDate).getFullYear() === parseInt(selectedYear));

      if (!paymentsToExport || paymentsToExport.length === 0) {
        alert('No payments found to export');
        return;
      }

      const csvHeaders = ['Date', 'Payment #', 'Invoice #', 'Description', 'Amount', 'Currency', 'Status', 'Applied To'];
      const csvRows = paymentsToExport.map(payment => {
        let exportStatus = payment.status;
        if (payment.status === 'Deposited') exportStatus = 'Completed';
        else if (payment.status === 'Not Deposited') exportStatus = 'Processing';
        else if (payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment') exportStatus = 'Payment Submitted';

        const appliedInvoices = payment.appliedTo?.map(a => a.transactionName).join('; ') || 'None';

        const invoiceNumbers = payment.appliedTo && payment.appliedTo.length > 0 
          ? payment.appliedTo.map(a => a.transactionName).join('; ')
          : 'Unapplied';

        return [
          payment.date || '',
          payment.documentNumber || '',
          invoiceNumbers,
          payment.description || 'Payment',
          payment.amount.toFixed(2) || '0.00',
          payment.currency || 'USD',
          exportStatus || 'Unknown',
          appliedInvoices
        ];
      });

      const csvContent = [
        csvHeaders,
        ...csvRows
      ].map(row => 
        row.map(cell => {
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
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
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting payments:', error);
      alert('Failed to export payments. Please try again.');
    }
  };

  const handleViewSignupDetails = (payment) => {
    setSelectedSignupPayment(payment);
    setShowSignupDetails(true);
  };

  // Render invoice details within a payment
  const renderInvoiceDetails = (applied) => {
    if (!applied.invoiceDetails) {
      return null;
    }

    const details = applied.invoiceDetails;
    
    return (
      <div className="ml-4 mt-2 p-3 bg-gray-50 rounded-md text-xs sm:text-sm 2xl:text-base">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-gray-600">Invoice Date:</span> {formatDate(details.invoiceDate)}
          </div>
          <div>
            <span className="font-medium text-gray-600">Due Date:</span> {formatDate(details.dueDate)}
          </div>
          {details.description && (
            <div className="col-span-2">
              <span className="font-medium text-gray-600">Description:</span> {details.description}
            </div>
          )}
        </div>

        {/* Show line items if available (full details) */}
        {details.detailLevel === 'full' && details.items && details.items.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <div className="font-medium text-gray-600 mb-1">Line Items:</div>
            {details.items.map((item, idx) => (
              <div key={idx} className="ml-2 text-[10px] sm:text-xs 2xl:text-sm text-gray-700">
                {item.line}. {item.item}: {item.description || 'N/A'} - 
                Qty: {item.quantity} × ${parseFloat(item.rate || 0).toFixed(2)} = ${parseFloat(item.amount || 0).toFixed(2)}
              </div>
            ))}
            {details.hasMoreItems && (
              <div className="ml-2 text-[10px] sm:text-xs 2xl:text-sm text-gray-500 italic">
                ... and more items
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Filter payments by year
  const filteredPayments = selectedYear === 'All' 
    ? payments 
    : payments.filter(payment => {
        const year = new Date(payment.rawDate).getFullYear();
        return !isNaN(year) && year === parseInt(selectedYear);
      });

  // Get unique years
  const availableYears = [...new Set(payments.map(p => {
    const year = new Date(p.rawDate).getFullYear();
    return isNaN(year) ? null : year;
  }).filter(y => y !== null))].sort((a, b) => b - a);

  // Check data availability
  const hasCompletedSignupPayment = signupPayments.length > 0 && 
    signupPayments.some(p => p.status === 'completed' && p.amount > 0);
  const hasNetSuitePayments = payments.length > 0;
  const shouldShowEmptyState = !hasCompletedSignupPayment && 
                              !hasNetSuitePayments && 
                              !isLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 sm:h-11 2xl:h-12 w-10 sm:w-11 2xl:w-12 border-b-2 border-[#6b5b7e] mx-auto mb-3 sm:mb-4"></div>
          <p className="text-[#6b7280] text-sm sm:text-base 2xl:text-lg">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="payment-page -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Small top padding */}
      <div className="h-8 md:h-12"></div>

      {/* Test mode banner */}
      {USE_TEST_CUSTOMER_ID && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3 2xl:p-3.5 mb-3 sm:mb-4 mx-4 md:mx-0">
          <p className="text-xs sm:text-sm 2xl:text-base text-yellow-800">
            <strong>Test Mode:</strong> Showing data for test customer {TEST_CUSTOMER_ID}. 
            Set USE_TEST_CUSTOMER_ID to false to use actual customer data.
          </p>
        </div>
      )}

      {/* Autopay disabled banner */}
      {!ENABLE_AUTOPAY_FEATURE && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 sm:p-3 2xl:p-3.5 mb-3 sm:mb-4 mx-4 md:mx-0">
          <p className="text-xs sm:text-sm 2xl:text-base text-gray-600">
            <strong>Note:</strong> Autopay feature is currently disabled. Set ENABLE_AUTOPAY_FEATURE to true to enable.
          </p>
        </div>
      )}

      {/* Autopay Status Banner */}
      {ENABLE_AUTOPAY_FEATURE && customerId && autopayStatus?.autopayEnabled && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 md:p-6 2xl:p-7 mb-5 sm:mb-6 mx-4 md:mx-0 animate-fadeIn">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white stroke-[0.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900 mb-0.5 sm:mb-1">Automatic Payments</h3>
              <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-500">
                Enabled - Your card will be charged automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Autopay Confirmation Modal */}
      {ENABLE_AUTOPAY_FEATURE && showAutopayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 2xl:p-7 shadow-xl">
            <h3 className="text-base sm:text-lg 2xl:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              {autopayStatus?.autopayEnabled ? 'Disable Automatic Payments?' : 'Enable Automatic Payments?'}
            </h3>
            <p className="text-sm sm:text-base 2xl:text-lg text-gray-600 mb-5 sm:mb-6">
              {autopayStatus?.autopayEnabled
                ? 'You will need to manually pay your invoices when they are due. Are you sure you want to disable automatic payments?'
                : 'Your payment method on file will be automatically charged when invoices are due. Would you like to enable automatic payments?'}
            </p>
            <div className="flex gap-2.5 sm:gap-3 justify-end">
              <button
                onClick={() => setShowAutopayModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm 2xl:text-base text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAutopayToggle}
                disabled={updatingAutopay}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm 2xl:text-base ${
                  autopayStatus?.autopayEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updatingAutopay && (
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 2xl:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-base sm:text-lg 2xl:text-xl font-semibold text-gray-900">Initial Signup Payment Details</h3>
              <button
                onClick={() => setShowSignupDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Basic Information */}
              <div>
                <h4 className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900 mb-2">Transaction Information</h4>
                <dl className="grid grid-cols-1 gap-x-3 sm:gap-x-4 gap-y-2.5 sm:gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">Transaction ID</dt>
                    <dd className="mt-1 text-xs sm:text-sm 2xl:text-base text-gray-900 font-mono">
                      {selectedSignupPayment.paymentIntentId || selectedSignupPayment.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-xs sm:text-sm 2xl:text-base text-gray-900">{formatDate(selectedSignupPayment.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className="px-2 inline-flex text-[10px] sm:text-xs 2xl:text-sm leading-5 font-normal text-gray-900">
                        Completed
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">Payment Method</dt>
                    <dd className="mt-1 text-xs sm:text-sm 2xl:text-base text-gray-900">{selectedSignupPayment.paymentMethod || 'Card'}</dd>
                  </div>
                </dl>
              </div>

              {/* Amount Breakdown */}
              {selectedSignupPayment.breakdown && (
                <div>
                  <h4 className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900 mb-2">Payment Breakdown</h4>
                  <dl className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-xs sm:text-sm 2xl:text-base text-gray-500">Base Membership Cost</dt>
                      <dd className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900">
                        {formatCurrency(selectedSignupPayment.breakdown.baseCost)}
                      </dd>
                    </div>
                    {selectedSignupPayment.breakdown.applicationFee > 0 && 
                    (selectedSignupPayment.membershipDetails?.preservationType && 
                      !selectedSignupPayment.membershipDetails.isBasicMembership) && (
                      <div className="flex justify-between">
                        <dt className="text-xs sm:text-sm 2xl:text-base text-gray-500">
                          Application Fee
                          <span className="text-[10px] sm:text-xs 2xl:text-sm text-gray-400 block">Cryopreservation members only</span>
                        </dt>
                        <dd className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900">
                          {formatCurrency(selectedSignupPayment.breakdown.applicationFee)}
                        </dd>
                      </div>
                    )}
                    {selectedSignupPayment.breakdown.cmsAnnualFee > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-xs sm:text-sm 2xl:text-base text-gray-500">CMS Annual Fee</dt>
                        <dd className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900">
                          {formatCurrency(selectedSignupPayment.breakdown.cmsAnnualFee)}
                        </dd>
                      </div>
                    )}
                    {selectedSignupPayment.breakdown.iceDiscount > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-xs sm:text-sm 2xl:text-base text-gray-500">ICE Code Discount</dt>
                        <dd className="text-xs sm:text-sm 2xl:text-base font-medium text-green-600">
                          -{formatCurrency(selectedSignupPayment.breakdown.iceDiscount)}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900">Total Paid</dt>
                      <dd className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900">
                        {formatCurrency(selectedSignupPayment.amount)}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Membership Details */}
              {selectedSignupPayment.membershipDetails && (
                <div>
                  <h4 className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-900 mb-2">Membership Details</h4>
                  <dl className="grid grid-cols-1 gap-x-3 sm:gap-x-4 gap-y-2.5 sm:gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">Preservation Type</dt>
                      <dd className="mt-1 text-xs sm:text-sm 2xl:text-base text-gray-900 capitalize">
                        {selectedSignupPayment.membershipDetails.preservationType || 'Standard'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">Payment Frequency</dt>
                      <dd className="mt-1 text-xs sm:text-sm 2xl:text-base text-gray-900 capitalize">
                        {selectedSignupPayment.membershipDetails.paymentFrequency || 'Annual'}
                      </dd>
                    </div>
                    {selectedSignupPayment.membershipDetails.iceCode && (
                      <div>
                        <dt className="text-xs sm:text-sm 2xl:text-base font-medium text-gray-500">ICE Code Used</dt>
                        <dd className="mt-1 text-xs sm:text-sm 2xl:text-base text-gray-900">
                          {selectedSignupPayment.membershipDetails.iceCode}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end">
              <button
                onClick={() => setShowSignupDetails(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-xs sm:text-sm 2xl:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 md:px-0">
        {/* Initial Signup Payment Section */}
        {hasCompletedSignupPayment && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn" 
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#4a3f5e] via-[#3b3249] to-[#2c2537] border-2 border-[#9F7AEA] shadow-lg hover:shadow-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Initial Membership Payment</h2>
              </div>
            </div>
            
            {signupPayments.filter(p => p.status === 'completed' && p.amount > 0).map((payment) => {
              const isCryoMember = payment.breakdown?.applicationFee > 0 || 
                                  (payment.membershipDetails?.preservationType && 
                                   ['neuro', 'wholebody', 'whole-body', 'neurocryopreservation', 'wholebody-cryopreservation'].includes(payment.membershipDetails.preservationType.toLowerCase()));
              
              return (
                <div key={payment.id}>
                  {/* Desktop view */}
                  <div className="hidden sm:block overflow-x-auto -mx-6 md:mx-0">
                    <div className="min-w-[600px] px-6 md:px-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-[#6b7280] uppercase tracking-wider">Date</th>
                            <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-[#6b7280] uppercase tracking-wider">Transaction ID</th>
                            <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-[#6b7280] uppercase tracking-wider">Type</th>
                            <th className="text-center py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-[#6b7280] uppercase tracking-wider">Status</th>
                            <th className="text-right py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-[#6b7280] uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors bg-white">
                            <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">{formatDate(payment.date)}</td>
                            <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-[#6b5b7e]">
                              {payment.paymentIntentId ? payment.paymentIntentId.substring(0, 16) + '...' : payment.id}
                            </td>
                            <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6">
                              <div>
                                <p className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                                  Membership Activation
                                </p>
                                {payment.membershipDetails && (
                                  <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-600 mt-0.5 sm:mt-1 font-normal">
                                    {payment.membershipDetails.preservationType === 'basic' ? 'Basic Membership' : 
                                     payment.membershipDetails.preservationType === 'neuro' ? 'Neurocryopreservation' :
                                     payment.membershipDetails.preservationType === 'wholebody' ? 'Whole Body Cryopreservation' :
                                     payment.membershipDetails.preservationType || 'Standard'} • {payment.membershipDetails.paymentFrequency || 'Annual'}
                                  </p>
                                )}
                                {payment.breakdown && payment.breakdown.iceDiscount > 0 && (
                                  <p className="text-[10px] sm:text-xs 2xl:text-sm text-green-600 mt-0.5 sm:mt-1 font-normal">
                                    ICE discount: -{formatCurrency(payment.breakdown.iceDiscount)}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-center">
                              <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                                Completed
                              </span>
                            </td>
                            <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-right">
                              <div>
                                <p className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                                {payment.breakdown && (
                                  <div className="text-[10px] sm:text-xs 2xl:text-sm text-gray-600 mt-0.5 sm:mt-1 font-normal">
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
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile view */}
                  <div className="sm:hidden">
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200">
                      <div className="flex justify-between items-start mb-2.5 sm:mb-3">
                        <div>
                          <p className="text-xs sm:text-sm 2xl:text-base text-gray-600 mb-0.5 sm:mb-1 font-normal">{formatDate(payment.date)}</p>
                          <p className="text-sm sm:text-base 2xl:text-lg font-medium text-[#6b5b7e]">Membership Activation</p>
                        </div>
                        <p className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">{formatCurrency(payment.amount)}</p>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 mb-2.5 sm:mb-3">
                        <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-600 font-normal">
                          Transaction: {payment.paymentIntentId ? payment.paymentIntentId.substring(0, 16) + '...' : payment.id}
                        </p>
                        {payment.membershipDetails && (
                          <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-600 font-normal">
                            <span className="font-medium">
                              {payment.membershipDetails.preservationType === 'basic' ? 'Basic Membership' : 
                               payment.membershipDetails.preservationType === 'neuro' ? 'Neurocryopreservation' :
                               payment.membershipDetails.preservationType === 'wholebody' ? 'Whole Body Cryopreservation' :
                               payment.membershipDetails.preservationType || 'Standard'}
                            </span> • {payment.membershipDetails.paymentFrequency || 'Annual'}
                          </p>
                        )}
                        {payment.breakdown && payment.breakdown.iceDiscount > 0 && (
                          <p className="text-[10px] sm:text-xs 2xl:text-sm text-green-600 font-normal">
                            ICE discount applied: -{formatCurrency(payment.breakdown.iceDiscount)}
                          </p>
                        )}
                        {payment.breakdown && payment.breakdown.applicationFee > 0 && isCryoMember && (
                          <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-600 font-normal">
                            Includes {formatCurrency(payment.breakdown.applicationFee)} application fee (cryopreservation)
                          </p>
                        )}
                        {payment.breakdown && payment.breakdown.cmsAnnualFee > 0 && (
                          <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-600 font-normal">
                            Includes {formatCurrency(payment.breakdown.cmsAnnualFee)} CMS annual fee
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2.5 sm:pt-3 border-t border-gray-200">
                        <p className="text-xs sm:text-sm 2xl:text-base text-gray-600 font-normal">Method: {payment.paymentMethod || 'Card'}</p>
                        <span className="text-[10px] sm:text-xs 2xl:text-sm font-normal text-gray-900">
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

        {/* NetSuite Payment History */}
        {hasNetSuitePayments && customerId && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-6 md:p-8 2xl:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100" 
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 sm:gap-4 mb-5 sm:mb-6 md:mb-8 2xl:mb-10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Payment History</h2>
              </div>
              <div className="hidden sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 md:gap-4">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-xs sm:text-sm 2xl:text-base border border-[#6b5b7e] focus:border-[#4a4266] bg-white appearance-none bg-no-repeat"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5b7e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="All">All Payments</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <button 
                  onClick={handleExportPayments}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border border-[#6b5b7e] rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm 2xl:text-base font-medium"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12 2xl:py-16">
                <p className="text-gray-700 text-sm sm:text-base md:text-lg 2xl:text-xl font-normal">
                  No payments found {selectedYear !== 'All' ? `for ${selectedYear}` : ''}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile view */}
                <div className="sm:hidden">
                  <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                    {filteredPayments.map((payment) => {
                      const isExpanded = expandedPayments.has(payment.id);
                      const hasAppliedInvoices = payment.appliedTo && payment.appliedTo.length > 0;
                      
                      return (
                        <div key={payment.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div 
                            className={`p-4 sm:p-5 ${hasAppliedInvoices ? 'payment-expandable' : ''}`}
                            onClick={() => hasAppliedInvoices && togglePaymentExpansion(payment.id)}
                          >
                            <div className="flex justify-between items-start mb-2.5 sm:mb-3">
                              <div className="flex-1">
                                <p className="text-xs sm:text-sm 2xl:text-base text-gray-600 mb-0.5 sm:mb-1 font-normal">{payment.date}</p>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <p className="text-sm sm:text-base 2xl:text-lg font-medium text-[#6b5b7e]">
                                    {payment.appliedTo && payment.appliedTo.length > 0 
                                      ? payment.appliedTo.length === 1 
                                        ? payment.appliedTo[0].transactionName 
                                        : `${payment.appliedTo.length} invoices`
                                      : 'Unapplied'}
                                  </p>
                                  {hasAppliedInvoices && (
                                    <svg 
                                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform text-gray-400 ${isExpanded ? 'rotate-180' : ''}`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  )}
                                </div>
                                {payment.hasInvoiceDetails && (
                                  <span className="inline-block mt-0.5 sm:mt-1 text-[10px] sm:text-xs 2xl:text-sm text-blue-700 border border-blue-400 px-1.5 sm:px-2 py-0.5 rounded">
                                    Invoice Details
                                  </span>
                                )}
                              </div>
                              <p className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">${payment.amount.toFixed(2)}</p>
                            </div>
                            {!hasAppliedInvoices && (
                              <p className="text-xs sm:text-sm 2xl:text-base text-gray-900 mb-2.5 sm:mb-3 font-normal">{payment.description || 'Payment'}</p>
                            )}
                            
                            <div className="flex justify-between items-center pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t border-gray-200">
                              <span className="text-[10px] sm:text-xs 2xl:text-sm font-normal text-gray-900">
                                {payment.status === 'Deposited' ? 'Completed' : 
                                 payment.status === 'Not Deposited' ? 'Processing' :
                                 payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment' ? 'Payment Submitted' :
                                 payment.status}
                              </span>
                            </div>
                          </div>
                          
                          {/* Expanded payment details */}
                          {isExpanded && (
                            <div className="px-4 sm:px-5 pb-4 sm:pb-5 bg-white border-t border-gray-200">
                              <div className="mt-2.5 sm:mt-3">
                                <div className="space-y-2.5 sm:space-y-3">
                                  <div>
                                    <h4 className="font-medium text-xs sm:text-sm 2xl:text-base text-gray-900 mb-1.5 sm:mb-2">Payment Details</h4>
                                    <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs 2xl:text-sm">
                                      <div>
                                        <span className="text-gray-600">Payment #:</span> 
                                        <span className="text-gray-900 ml-1">{payment.documentNumber || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Description:</span> 
                                        <span className="text-gray-900 ml-1">{payment.description || 'Payment'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Payment ID:</span> 
                                        <span className="text-gray-900 font-mono ml-1">{payment.internalId || payment.id}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Method:</span> 
                                        <span className="text-gray-900 ml-1">{payment.method}</span>
                                      </div>
                                      {payment.unapplied > 0 && (
                                        <div>
                                          <span className="text-gray-600">Unapplied:</span> 
                                          <span className="text-gray-900 ml-1">${payment.unapplied.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {hasAppliedInvoices && (
                                    <div>
                                      <div className="font-medium text-xs sm:text-sm 2xl:text-base mb-1.5 sm:mb-2 pt-1.5 sm:pt-2 border-t">Applied Invoices:</div>
                                      {payment.appliedTo.map((applied, idx) => (
                                        <div key={idx} className="mb-2.5 sm:mb-3 last:mb-0">
                                          <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                                            <span className="font-medium text-xs sm:text-sm 2xl:text-base">{applied.transactionName}</span>
                                            <span className="font-medium text-xs sm:text-sm 2xl:text-base">${parseFloat(applied.amount || 0).toFixed(2)}</span>
                                          </div>
                                          {renderInvoiceDetails(applied)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Mobile buttons */}
                  <div className="flex flex-col gap-2.5 sm:gap-3 mt-5 sm:mt-6">
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-xs sm:text-sm 2xl:text-base border border-[#6b5b7e] focus:border-[#4a4266] bg-white text-center appearance-none bg-no-repeat"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b5b7e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'right 0.75rem center',
                        paddingRight: '2rem'
                      }}
                    >
                      <option value="All">All Payments</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <button 
                      onClick={handleExportPayments}
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border border-[#6b5b7e] rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm 2xl:text-base font-medium"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export Payments</span>
                    </button>
                  </div>
                </div>

                {/* Desktop view */}
                <div className="hidden sm:block overflow-x-auto -mx-6 md:mx-0">
                  <div className="min-w-[600px] px-6 md:px-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Payment #</th>
                          <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                          <th className="text-center py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="text-right py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((payment, index) => {
                          const isExpanded = expandedPayments.has(payment.id);
                          const hasAppliedInvoices = payment.appliedTo && payment.appliedTo.length > 0;
                          
                          return (
                            <React.Fragment key={payment.id}>
                              <tr 
                                className={`border-b border-gray-100 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                } ${hasAppliedInvoices ? 'payment-expandable hover:bg-gray-50' : ''}`}
                                onClick={() => hasAppliedInvoices && togglePaymentExpansion(payment.id)}
                              >
                                <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">{payment.date}</td>
                                <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-[#6b5b7e]">
                                  {payment.documentNumber}
                                </td>
                                <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                                      {payment.appliedTo && payment.appliedTo.length > 0 
                                        ? payment.appliedTo.length === 1 
                                          ? payment.appliedTo[0].transactionName 
                                          : `${payment.appliedTo.length} invoices`
                                        : 'Unapplied'}
                                    </span>
                                    {hasAppliedInvoices && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePaymentExpansion(payment.id);
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                      >
                                        <svg 
                                          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-center">
                                  <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                                    {payment.status === 'Deposited' ? 'Completed' : 
                                     payment.status === 'Not Deposited' ? 'Processing' :
                                     payment.status === 'Unapplied' || payment.status === 'Unapproved' || payment.status === 'Unapproved Payment' ? 'Payment Submitted' :
                                     payment.status}
                                  </span>
                                </td>
                                <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-gray-900 text-right">
                                  ${payment.amount.toFixed(2)}
                                </td>
                              </tr>
                              
                              {/* Expanded invoice details row */}
                              {isExpanded && hasAppliedInvoices && (
                                <tr>
                                  <td colSpan="5" className="px-4 sm:px-5 md:px-6 pb-5 sm:pb-6 bg-gray-50/50">
                                    <div className="mt-2.5 sm:mt-3 p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                        <div>
                                          <h4 className="font-medium text-xs sm:text-sm 2xl:text-base text-gray-900 mb-1.5 sm:mb-2">Payment Details</h4>
                                          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm 2xl:text-base">
                                            <div>
                                              <span className="text-gray-600">Payment #:</span> 
                                              <span className="text-gray-900 ml-1">{payment.documentNumber || 'N/A'}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Description:</span> 
                                              <span className="text-gray-900 ml-1">{payment.description || 'Payment'}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Payment ID:</span> 
                                              <span className="text-gray-900 font-mono text-[10px] sm:text-xs 2xl:text-sm ml-1">{payment.internalId || payment.id}</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Method:</span> 
                                              <span className="text-gray-900 ml-1">{payment.method}</span>
                                            </div>
                                            {payment.unapplied > 0 && (
                                              <div>
                                                <span className="text-gray-600">Unapplied:</span> 
                                                <span className="text-gray-900 ml-1">${payment.unapplied.toFixed(2)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        {hasAppliedInvoices && (
                                          <div>
                                            <h4 className="font-medium text-xs sm:text-sm 2xl:text-base text-gray-900 mb-1.5 sm:mb-2">Applied to Invoices</h4>
                                            <div className="text-xs sm:text-sm 2xl:text-base text-gray-600">
                                              {payment.appliedTo.length} invoice{payment.appliedTo.length !== 1 ? 's' : ''} totaling ${payment.appliedTo.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0).toFixed(2)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {hasAppliedInvoices && (
                                        <div>
                                          <div className="font-medium text-xs sm:text-sm 2xl:text-base mb-2.5 sm:mb-3 border-t pt-2.5 sm:pt-3">Invoice Applications:</div>
                                          {payment.appliedTo.map((applied, idx) => (
                                            <div key={idx} className="mb-3 sm:mb-4 last:mb-0 p-2.5 sm:p-3 bg-gray-50 rounded">
                                              <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                                                <span className="font-medium text-xs sm:text-sm 2xl:text-base">{applied.transactionName}</span>
                                                <span className="font-medium text-xs sm:text-sm 2xl:text-base">${parseFloat(applied.amount || 0).toFixed(2)}</span>
                                              </div>
                                              {renderInvoiceDetails(applied)}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {shouldShowEmptyState && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-6 sm:p-8 2xl:p-10 mb-5 sm:mb-6 text-center" 
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 2xl:h-14 2xl:w-14 text-gray-400 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-base sm:text-lg 2xl:text-xl font-medium text-gray-900 mb-1.5 sm:mb-2">No payment history found</h3>
            <p className="text-xs sm:text-sm 2xl:text-base text-gray-500 font-normal mb-3 sm:mb-4">
              {error ? 'Unable to load payment history at this time.' : 'No payments have been recorded for your account yet.'}
            </p>
            {customerId && (
              <button 
                onClick={handleRefresh}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[#6b5b7e] hover:bg-[#6b5b7e] hover:text-white border border-[#6b5b7e] rounded-lg transition-all text-xs sm:text-sm 2xl:text-base"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Annual Summary and Payment Records */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 2xl:gap-8 mb-6 md:mb-8 2xl:mb-12">
          {/* Annual Summary Box */}
          <div className="w-full bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-5 md:p-6 2xl:p-8 animate-fadeIn animation-delay-200 relative" 
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
              <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Annual Summary</h3>
            </div>
            {Object.keys(stats.yearTotals).length > 0 ? (
              <div className="space-y-3 sm:space-y-4 pb-10 sm:pb-12">
                {Object.entries(stats.yearTotals)
                  .sort(([a], [b]) => b - a)
                  .slice(0, 1)
                  .map(([year, total]) => (
                    <div key={year}>
                      <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-100">
                        <span className="text-gray-700 text-xs sm:text-sm 2xl:text-base font-normal">{year}</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900 text-base sm:text-lg 2xl:text-xl">${total.toFixed(2)}</span>
                          <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-500 font-normal">
                            {payments.filter(p => new Date(p.rawDate).getFullYear() === parseInt(year)).length} payments
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="pb-10 sm:pb-12">
                <p className="text-gray-700 text-sm sm:text-base 2xl:text-lg font-normal">No payment data available</p>
              </div>
            )}
            {customerId && (
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="absolute bottom-5 sm:bottom-6 right-5 sm:right-6 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm 2xl:text-base text-[#525278] bg-white hover:bg-gray-50 border border-[#525278] rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {/* Payment Records Box */}
          <div className="w-full bg-white shadow-sm border border-gray-200 rounded-[1.25rem] p-4 sm:p-5 md:p-6 2xl:p-8 animate-fadeIn animation-delay-300" 
               style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
              <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#665a85] via-[#52476b] to-[#3e3551] border-2 border-[#E879F9] shadow-lg hover:shadow-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Payment Records</h3>
            </div>
            <p className="text-xs sm:text-sm 2xl:text-base text-gray-500 mb-5 sm:mb-6 font-normal">
              This shows all recent payments recorded for your account.
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-gray-100">
                <span className="text-gray-700 text-xs sm:text-sm 2xl:text-base font-normal">Total Payments</span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg 2xl:text-xl">
                  {(payments.length + (hasCompletedSignupPayment ? 1 : 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 text-xs sm:text-sm 2xl:text-base font-normal">Last Payment</span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg 2xl:text-xl">
                  {payments.length > 0 ? payments[0].date : 
                   hasCompletedSignupPayment ? formatDate(signupPayments[0].date) : 'N/A'}
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