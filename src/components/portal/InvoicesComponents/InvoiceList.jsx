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
  
  // Updated status color function with better colors
  const getStatusStyles = (status) => {
    switch (status) {
      case 'Paid':
        return {
          bg: 'bg-green-600',
          text: 'text-white',
          border: 'border-green-600'
        };
      case 'Payment Pending':
      case 'Payment Submitted':
        return {
          bg: 'bg-blue-600',
          text: 'text-white',
          border: 'border-blue-600'
        };
      case 'Unpaid':
        return {
          bg: 'bg-orange-500',
          text: 'text-white',
          border: 'border-orange-500'
        };
      case 'Overdue':
      case 'Past Due':
        return {
          bg: 'bg-red-600',
          text: 'text-white',
          border: 'border-red-600'
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-white',
          border: 'border-gray-500'
        };
    }
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header Section */}
      <div className="p-6 sm:p-8 2xl:p-10 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-5 2xl:gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 2xl:gap-4 mb-3 sm:mb-4 2xl:mb-5">
              <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#0a41cc] shadow-lg hover:shadow-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-base sm:text-lg 2xl:text-xl font-semibold text-gray-900">Invoice History</h2>
            </div>
            <p className="text-gray-700 text-[11px] sm:text-xs 2xl:text-sm leading-relaxed font-normal max-w-xl">
              View and manage all your invoices. Download PDFs or make payments directly from this page.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 2xl:gap-5 items-start sm:items-center">
            <select 
              value={filterValue} 
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-4 sm:px-5 2xl:px-6 py-2 sm:py-2.5 2xl:py-3 bg-white border border-[#12243c] text-[#12243c] rounded-lg focus:border-[#12243c] focus:ring-2 focus:ring-[#12243c] focus:ring-opacity-20 transition-all text-[11px] sm:text-xs 2xl:text-sm"
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

      {/* Invoice List - Now with individual boxes */}
      <div className="p-4 sm:p-6 2xl:p-8 space-y-3 sm:space-y-4 2xl:space-y-5">
        {safeFilteredInvoices.map((invoice) => {
          const statusStyles = getStatusStyles(invoice.status);
          const isLoading = loadingInvoiceId === invoice.id;
          const invoiceNumber = cleanInvoiceNumber(invoice.documentNumber || invoice.tranid || invoice.id);
          
          return (
            <div 
              key={invoice.id} 
              className="border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-6 2xl:p-8 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              onClick={() => !isLoading && onInvoiceSelect(invoice)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-5 2xl:gap-6">
                {/* Invoice Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 sm:gap-4 2xl:gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 2xl:gap-4 mb-1.5 sm:mb-2 2xl:mb-2.5">
                        <h3 className="font-medium text-gray-800 text-[11px] sm:text-xs 2xl:text-sm">
                          Invoice #{invoiceNumber}
                        </h3>
                        <span className={`px-2 sm:px-2.5 2xl:px-3 py-0.5 sm:py-1 2xl:py-1.5 rounded-full text-[0.5rem] sm:text-[0.625rem] 2xl:text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 2xl:gap-5 text-[10px] sm:text-xs 2xl:text-sm text-gray-500">
                        <span>{invoice.description || invoice.memo || `Invoice for ${formatDate(invoice.date)}`}</span>
                        <span>•</span>
                        <span>{formatDate(invoice.date)}</span>
                      </div>
                      {invoice.hasUnapprovedPayment && (
                        <p className="text-[0.5rem] sm:text-[0.625rem] 2xl:text-xs text-blue-600 mt-1.5 sm:mt-2 2xl:mt-2.5">
                          Payment #{invoice.unapprovedPaymentNumber} pending approval
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount and Action */}
                <div className="flex items-center justify-between lg:justify-end lg:gap-4 sm:lg:gap-5 2xl:lg:gap-6 mt-3 sm:mt-4 lg:mt-0">
                  <div className="text-left lg:text-right">
                    <div className="text-base sm:text-lg 2xl:text-xl font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </div>
                    {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.total && (
                      <div className="text-[11px] sm:text-xs 2xl:text-sm text-gray-500">
                        {formatCurrency(invoice.amountRemaining)} remaining
                      </div>
                    )}
                  </div>
                  
                  {/* Square outline button for View Details */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      !isLoading && onInvoiceSelect(invoice);
                    }}
                    disabled={isLoading}
                    className="px-3 sm:px-4 2xl:px-5 py-1.5 sm:py-2 2xl:py-2.5 border border-[#12243c] text-[#12243c] bg-white rounded-lg hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-[11px] sm:text-xs 2xl:text-sm font-medium min-w-[90px] sm:min-w-[110px] 2xl:min-w-[130px]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-1.5 sm:gap-2 2xl:gap-2.5">
                        <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'View Details'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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