import React, { useState, useEffect } from 'react';
import { usePayments, usePaymentSummary, useCustomerData } from './contexts/CustomerDataContext';
import { useMemberPortal } from '../../contexts/MemberPortalProvider'; // ADD THIS IMPORT

// Global testing flag - set this to false in production
const USE_TEST_CUSTOMER_ID = false; // Set to false when ready for production
const TEST_CUSTOMER_ID = '4527';

const PaymentHistoryTab = () => {
  // Get the customer ID from MemberPortal context
  const { customerId: contextCustomerId } = useMemberPortal();
  
  // Use test ID if flag is set, otherwise use the context customer ID
  const customerId = USE_TEST_CUSTOMER_ID ? TEST_CUSTOMER_ID : (contextCustomerId || TEST_CUSTOMER_ID);
  
  const { data: paymentsData, isLoading, error } = usePayments();
  const { data: summaryData } = usePaymentSummary();
  const { fetchPaymentsWithDetails } = useCustomerData();
  
  const [selectedYear, setSelectedYear] = useState('All');
  const [stats, setStats] = useState({
    totalSpent: 0,
    averagePayment: 0,
    lastPayment: 0,
    yearTotals: {}
  });

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

  // Log which customer ID we're using (helpful for debugging)
  useEffect(() => {
    console.log('[PaymentHistoryTab] Using customer ID:', customerId, {
      isTestMode: USE_TEST_CUSTOMER_ID,
      contextCustomerId,
      actualId: customerId
    });
  }, [customerId, contextCustomerId]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        ? `payments_${customerId}_${selectedYear}.csv`
        : `payments_${customerId}_${today}.csv`;
      
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
    await fetchPaymentsWithDetails({ forceRefresh: true });
  };

  if (isLoading && !payments.length) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error && !payments.length) {
    return (
      <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="h-8"></div>
        <div className="px-4 md:px-0">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
            <p className="font-bold">Error loading payments</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
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
        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 md:p-10 mb-6 md:mb-8 animate-fadeIn animation-delay-100" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Annual Summary and Payment Records - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-16">
          {/* Annual Summary Box */}
          <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 md:p-8 animate-fadeIn animation-delay-200 relative" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg relative overflow-hidden" style={{ 
                background: 'linear-gradient(135deg, #4a5578 0%, #3e466d 50%, #485387 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)'
              }}>
                <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-10"></div>
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
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="absolute bottom-6 right-6 flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm text-[#3e466d] bg-white hover:bg-gray-50 border border-[#3e466d] rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Payment Records Box */}
          <div className="w-full bg-white rounded-2xl border border-gray-200 p-5 md:p-8 animate-fadeIn animation-delay-300" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg relative overflow-hidden" style={{ 
                background: 'linear-gradient(135deg, #4a5578 0%, #3e466d 50%, #485387 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)'
              }}>
                <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-10"></div>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Payment Records</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 font-light">
              This shows all recent payments recorded for your account.
            </p>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-500 text-sm font-light">Customer ID</span>
                <span className="font-semibold text-gray-900 text-base md:text-lg">{customerId}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-gray-500 text-sm font-light">Total Payments</span>
                <span className="font-semibold text-gray-900 text-base md:text-lg">{payments.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-light">Last Payment</span>
                <span className="font-semibold text-gray-900 text-base md:text-lg">
                  {payments.length > 0 ? payments[0].date : 'N/A'}
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