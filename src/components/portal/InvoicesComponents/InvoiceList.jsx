// InvoicesComponents/InvoiceList.js
import React from 'react';
import { formatCurrency, formatDate } from './utils/invoiceHelpersOG';

const InvoiceList = ({ 
  invoices = [], 
  filteredInvoices = [], 
  filterValue, 
  onFilterChange, 
  onInvoiceSelect, 
  loadingInvoiceId,
  onRefresh,
  isRefreshing 
}) => {
  
  // Ensure we always have arrays to work with
  const safeInvoices = invoices || [];
  const safeFilteredInvoices = filteredInvoices || [];
  
  // Function to clean invoice number
  const cleanInvoiceNumber = (invoiceNumber) => {
    if (!invoiceNumber) return '';
    
    // Remove "INV" prefix (case insensitive) and any following dash or space
    return invoiceNumber.replace(/^INV[-\s]*/i, '');
  };

  // Updated status styles with pill badges - all same width
  const getStatusBadge = (status) => {
    // On mobile, just return text without badge styling
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      switch (status) {
        case 'Paid':
          return <span className="text-xs text-gray-600">Paid</span>;
        case 'Payment Pending':
        case 'Payment Submitted':
          return <span className="text-xs text-blue-600">Pending</span>;
        case 'Open':
          return <span className="text-xs text-gray-600">Open</span>;
        case 'Unpaid':
          return <span className="text-xs text-yellow-600">Unpaid</span>;
        case 'Overdue':
        case 'Past Due':
          return <span className="text-xs text-red-600">Overdue</span>;
        default:
          return <span className="text-xs text-gray-600">{status}</span>;
      }
    }
    
    // Desktop badges - now just text like payment history
    switch (status) {
      case 'Paid':
        return <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">Paid</span>;
      case 'Payment Pending':
      case 'Payment Submitted':
        return <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">Pending</span>;
      case 'Open':
        return <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">Open</span>;
      case 'Unpaid':
        return <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">Unpaid</span>;
      case 'Overdue':
      case 'Past Due':
        return <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">Overdue</span>;
      default:
        return <span className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">{status}</span>;
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] overflow-hidden animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header Section */}
      <div className="p-4 sm:p-6 md:p-8 2xl:p-10 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-5 2xl:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 2xl:gap-4 mb-3 sm:mb-4 2xl:mb-5">
              <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl 2xl:text-2xl font-semibold text-gray-900">Invoice History</h2>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 2xl:gap-5 items-start sm:items-center">
            <select 
              value={filterValue} 
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-4 sm:px-5 2xl:px-6 py-2 sm:py-2.5 2xl:py-3 bg-white border border-[#6b5b7e] text-[#6b5b7e] rounded-lg focus:border-[#6b5b7e] focus:ring-2 focus:ring-[#6b5b7e] focus:ring-opacity-20 transition-all text-[11px] sm:text-xs 2xl:text-sm"
            >
              <option value="all">All Invoices</option>
              <option value="unpaid">Unpaid</option>
              <option value="recent">Last 30 Days</option>
              <option value="older">Older than 30 Days</option>
              <option value="pastYear">Past Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto mx-2 sm:mx-6 2xl:mx-8 mb-2 sm:mb-6 2xl:mb-8">
        <div className="min-w-[600px]">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                <th className="text-center py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 sm:py-4 px-4 sm:px-5 md:px-6 text-xs sm:text-sm 2xl:text-base font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {safeFilteredInvoices.map((invoice, index) => {
                const isLoading = loadingInvoiceId === invoice.id;
                const invoiceNumber = cleanInvoiceNumber(invoice.documentNumber || invoice.tranid || invoice.id);
                const isUnpaid = invoice.status === 'Unpaid' || invoice.status === 'Open' || invoice.status === 'Overdue' || invoice.status === 'Past Due';
                
                return (
                  <tr 
                    key={invoice.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                    onClick={() => !isLoading && onInvoiceSelect(invoice)}
                  >
                    <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-sm sm:text-base 2xl:text-lg font-normal text-[#6b5b7e]">
                      {invoiceNumber}
                    </td>
                    <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6">
                      <div>
                        <p className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                          Membership
                        </p>
                        {invoice.hasUnapprovedPayment && (
                          <p className="text-[10px] sm:text-xs 2xl:text-sm text-blue-600 mt-0.5 sm:mt-1">
                            Payment #{invoice.unapprovedPaymentNumber} pending
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-5 sm:py-6 px-4 sm:px-5 md:px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isUnpaid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onInvoiceSelect(invoice);
                            }}
                            className="px-3 py-1.5 bg-[#6b5b7e] text-white text-xs font-medium rounded hover:bg-[#5a4a6d] transition-colors"
                          >
                            Pay Now
                          </button>
                        )}
                        <div>
                          <div className="text-sm sm:text-base 2xl:text-lg font-normal text-gray-900">
                            {formatCurrency(invoice.total)}
                          </div>
                          {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.total && (
                            <div className="text-[10px] sm:text-xs 2xl:text-sm text-gray-500 mt-0.5">
                              {formatCurrency(invoice.amountRemaining)} remaining
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view - keeping original mobile layout */}
      <div className="sm:hidden">
        {/* Mobile Table Header */}
        <div className="border-b border-gray-200 mx-2 rounded-t-lg">
          <div className="px-2 py-2">
            <div className="grid grid-cols-12 gap-1 text-xs text-[#6b5b7e]" style={{ fontWeight: '700' }}>
              <div className="col-span-2 pl-1" style={{ fontWeight: '700' }}>Status</div>
              <div className="col-span-2" style={{ fontWeight: '700' }}>Invoice</div>
              <div className="col-span-3" style={{ fontWeight: '700' }}>Date</div>
              <div className="col-span-5 text-right pr-1" style={{ fontWeight: '700' }}>Amount</div>
            </div>
          </div>
        </div>

        {/* Mobile Invoice List */}
        <div className="divide-y divide-gray-100 mx-2 mb-2">
          {safeFilteredInvoices.map((invoice) => {
            const isLoading = loadingInvoiceId === invoice.id;
            const invoiceNumber = cleanInvoiceNumber(invoice.documentNumber || invoice.tranid || invoice.id);
            const isUnpaid = invoice.status === 'Unpaid' || invoice.status === 'Open' || invoice.status === 'Overdue' || invoice.status === 'Past Due';
            
            return (
              <div 
                key={invoice.id} 
                className="relative px-4 py-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                onClick={() => !isLoading && onInvoiceSelect(invoice)}
              >
                <div className="grid grid-cols-12 gap-1 items-center">
                  {/* Status */}
                  <div className="col-span-2">
                    {getStatusBadge(invoice.status)}
                  </div>
                  
                  {/* Invoice Number */}
                  <div className="col-span-2">
                    <span className="font-medium text-gray-900 text-xs">
                      {invoiceNumber}
                    </span>
                  </div>
                  
                  {/* Date */}
                  <div className="col-span-3">
                    <span className="text-gray-600 text-[10px]">
                      {formatDate(invoice.date)}
                    </span>
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isUnpaid && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInvoiceSelect(invoice);
                          }}
                          className="px-2 py-1 bg-[#6b5b7e] text-white text-[10px] font-medium rounded hover:bg-[#5a4a6d] transition-colors whitespace-nowrap"
                        >
                          Pay Now
                        </button>
                      )}
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {formatCurrency(invoice.total)}
                        </div>
                        {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.total && (
                          <div className="text-[0.5rem] text-gray-500">
                            {formatCurrency(invoice.amountRemaining)} remaining
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {safeFilteredInvoices.length === 0 && (
        <div className="p-12 sm:p-16 2xl:p-20 text-center">
          <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 2xl:h-18 2xl:w-18 text-gray-400 mb-3 sm:mb-4 2xl:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-[11px] sm:text-xs 2xl:text-sm">
            {safeInvoices.length === 0 ? 'No invoices available.' : 'No invoices match your filter criteria.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;