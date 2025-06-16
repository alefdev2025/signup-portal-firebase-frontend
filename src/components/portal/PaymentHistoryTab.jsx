import React, { useState, useEffect } from 'react';
import { getCustomerPayments, getPaymentSummary, exportPaymentsToCSV } from './services/netsuite/payments';
import { getInvoiceDetails } from './services/netsuite/invoices';

const PaymentHistoryTab = ({ customerId = '4527' }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('All');
  const [stats, setStats] = useState({
    totalSpent: 0,
    averagePayment: 0,
    lastPayment: 0,
    yearTotals: {}
  });

  // Fetch payments on component mount
  useEffect(() => {
    fetchPayments();
  }, [customerId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch payments using the service
      const result = await getCustomerPayments(customerId, { limit: 50 });
      
      if (result.success && result.payments) {
        // Process the payments data and fetch invoice details
        const processedPayments = await processPaymentsWithInvoiceDetails(result.payments);
        setPayments(processedPayments);
        calculateStats(processedPayments);
        
        // Optionally fetch summary for more detailed stats
        try {
          const summaryResult = await getPaymentSummary(customerId);
          if (summaryResult.success && summaryResult.summary) {
            // Update stats with summary data if available
            setStats(prevStats => ({
              ...prevStats,
              ...summaryResult.summary
            }));
          }
        } catch (summaryError) {
          console.warn('Could not fetch payment summary:', summaryError);
        }
      } else {
        throw new Error(result.error || 'Failed to load payments');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process payment data and fetch invoice details
  const processPaymentsWithInvoiceDetails = async (rawPayments) => {
    const processedPayments = await Promise.all(
      rawPayments.map(async (payment) => {
        const processed = {
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
          unapplied: parseFloat(payment.unapplied) || 0,
          invoiceDetails: []
        };

        // Fetch details for each applied invoice
        if (payment.appliedTo && payment.appliedTo.length > 0) {
          const invoiceDetails = await Promise.all(
            payment.appliedTo.map(async (applied) => {
              try {
                // Only fetch if we have a transaction ID
                if (applied.transactionId) {
                  const details = await getInvoiceDetails(applied.transactionId);
                  if (details.invoice) {
                    return {
                      ...applied,
                      description: details.invoice.memo || details.invoice.description || 'Invoice',
                      invoiceDate: details.invoice.date || details.invoice.trandate,
                      items: details.invoice.items || []
                    };
                  }
                }
              } catch (err) {
                console.warn(`Could not fetch details for invoice ${applied.transactionId}:`, err);
              }
              // Return original if fetch fails
              return applied;
            })
          );
          processed.invoiceDetails = invoiceDetails;
        }

        return processed;
      })
    );

    return processedPayments;
  };

  // Calculate statistics
  const calculateStats = (paymentList) => {
    const totalSpent = paymentList.reduce((sum, payment) => sum + payment.amount, 0);
    const averagePayment = paymentList.length > 0 ? totalSpent / paymentList.length : 0;
    const lastPayment = paymentList.length > 0 ? paymentList[0].amount : 0;

    // Calculate yearly totals
    const yearTotals = {};
    paymentList.forEach(payment => {
      const year = new Date(payment.rawDate).getFullYear();
      yearTotals[year] = (yearTotals[year] || 0) + payment.amount;
    });

    setStats({
      totalSpent,
      averagePayment,
      lastPayment,
      yearTotals
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter payments by year
  const filteredPayments = selectedYear === 'All' 
    ? payments 
    : payments.filter(payment => new Date(payment.rawDate).getFullYear() === parseInt(selectedYear));

  // Get unique years for filter dropdown
  const availableYears = [...new Set(payments.map(p => new Date(p.rawDate).getFullYear()))].sort((a, b) => b - a);

  // Export payments
  const handleExportPayments = async () => {
    try {
      // Use the service export function
      await exportPaymentsToCSV(customerId, {
        dateFrom: selectedYear !== 'All' ? `${selectedYear}-01-01` : undefined,
        dateTo: selectedYear !== 'All' ? `${selectedYear}-12-31` : undefined
      });
    } catch (error) {
      console.error('Error exporting payments:', error);
      alert('Failed to export payments. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#4a3d6b]">Loading payment history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading payments: {error}</p>
        <button 
          onClick={fetchPayments}
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

      {/* Transaction History - Now the main focus */}
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
                      {payment.invoiceDetails.length > 0 && (
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
            onClick={fetchPayments}
            className="bg-[#0a1629] text-white px-6 py-3 rounded-lg hover:bg-[#1e2650] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTab;