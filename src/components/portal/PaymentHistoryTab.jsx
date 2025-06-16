import React, { useState, useEffect } from 'react';
import { usePayments, usePaymentSummary, useCustomerData } from './contexts/CustomerDataContext';
import { exportPaymentsToCSV } from './services/netsuite/payments';

const PaymentHistoryTab = ({ customerId = '4527' }) => {
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
  const handleExportPayments = async () => {
    try {
      await exportPaymentsToCSV(customerId, {
        dateFrom: selectedYear !== 'All' ? `${selectedYear}-01-01` : undefined,
        dateTo: selectedYear !== 'All' ? `${selectedYear}-12-31` : undefined
      });
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
      <div>
        <h1 className="text-3xl font-light text-[#2a2346] mb-8">Payment History</h1>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !payments.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading payments: {error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 text-sm text-red-600 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Payment History</h1>

      {/* Show banner if refreshing in background */}
      {isLoading && payments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-700">Checking for new payments...</span>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-medium text-[#2a2346]">Transaction History</h2>
          <div className="flex items-center gap-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] text-base"
            >
              <option value="All">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button 
              onClick={handleExportPayments}
              className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-2 px-4 py-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-base">Export</span>
            </button>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-[#4a3d6b]">
              No payments found {selectedYear !== 'All' ? `for ${selectedYear}` : ''}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 text-base font-medium text-[#4a3d6b]">Date</th>
                  <th className="text-left py-4 px-6 text-base font-medium text-[#4a3d6b]">Payment #</th>
                  <th className="text-left py-4 px-6 text-base font-medium text-[#4a3d6b]">Description</th>
                  <th className="text-left py-4 px-6 text-base font-medium text-[#4a3d6b]">Payment Method</th>
                  <th className="text-right py-4 px-6 text-base font-medium text-[#4a3d6b]">Amount</th>
                  <th className="text-center py-4 px-6 text-base font-medium text-[#4a3d6b]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr key={payment.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-6 px-6 text-base text-[#2a2346]">{payment.date}</td>
                    <td className="py-6 px-6 text-base font-medium text-[#0a1629]">
                      {payment.documentNumber}
                    </td>
                    <td className="py-6 px-6">
                      <p className="text-base text-[#2a2346] font-medium">
                        {payment.description || 'Payment'}
                      </p>
                      {payment.invoiceDetails && payment.invoiceDetails.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {payment.invoiceDetails.map((invoice, idx) => (
                            <div key={idx} className="text-sm text-[#4a3d6b]">
                              <span className="font-medium">{invoice.transactionName}:</span>{' '}
                              {invoice.description && (
                                <span>{invoice.description}</span>
                              )}
                              {invoice.invoiceDate && (
                                <span className="text-xs text-[#6b7280] ml-2">
                                  (Invoice date: {formatDate(invoice.invoiceDate)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-6 text-base text-[#4a3d6b]">{payment.method}</td>
                    <td className="py-6 px-6 text-lg font-semibold text-[#2a2346] text-right">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="py-6 px-6 text-center">
                      <span className={`text-sm px-4 py-2 rounded-full font-medium ${
                        payment.status === 'Deposited' 
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'Not Deposited'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status === 'Deposited' ? 'Paid' : 
                         payment.status === 'Not Deposited' ? 'Processing' :
                         payment.status === 'Unapplied' ? 'Pending Application' :
                         payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Year Summary Box */}
      {Object.keys(stats.yearTotals).length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-medium text-[#2a2346] mb-6">Annual Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(stats.yearTotals)
              .sort(([a], [b]) => b - a)
              .map(([year, total]) => (
                <div key={year} className="border border-gray-200 rounded-lg p-6 hover:border-[#0a1629] transition-colors">
                  <p className="text-lg font-medium text-[#4a3d6b] mb-2">{year}</p>
                  <p className="text-2xl font-semibold text-[#2a2346]">${total.toFixed(2)}</p>
                  <p className="text-sm text-[#4a3d6b] mt-2">
                    {payments.filter(p => new Date(p.rawDate).getFullYear() === parseInt(year)).length} payments
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-gray-50 rounded-lg p-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-medium text-[#2a2346] mb-4">Payment Records</h3>
            <p className="text-base text-[#4a3d6b] mb-2">
              This shows all payments recorded in NetSuite for your account.
            </p>
            <p className="text-sm text-[#4a3d6b]">
              Customer ID: {customerId}
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-[#0a1629] text-white px-6 py-3 rounded-lg hover:bg-[#1e2650] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTab;