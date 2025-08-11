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
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select 
              value={filterValue} 
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-6 py-2.5 bg-white border border-[#12243c] text-[#12243c] rounded-lg focus:border-[#12243c] focus:ring-2 focus:ring-[#12243c] focus:ring-opacity-20 transition-all text-sm"
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
      <div className="p-6 space-y-4">
        {safeFilteredInvoices.map((invoice) => {
          const statusStyles = getStatusStyles(invoice.status);
          const isLoading = loadingInvoiceId === invoice.id;
          const invoiceNumber = cleanInvoiceNumber(invoice.documentNumber || invoice.tranid || invoice.id);
          
          return (
            <div 
              key={invoice.id} 
              className="border border-gray-200 rounded-lg p-6 lg:p-8 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              onClick={() => !isLoading && onInvoiceSelect(invoice)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Invoice Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Invoice #{invoiceNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{invoice.description || invoice.memo || `Invoice for ${formatDate(invoice.date)}`}</span>
                        <span>•</span>
                        <span>{formatDate(invoice.date)}</span>
                      </div>
                      {invoice.hasUnapprovedPayment && (
                        <p className="text-xs text-blue-600 mt-2">
                          Payment #{invoice.unapprovedPaymentNumber} pending approval
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount and Action */}
                <div className="flex items-center justify-between lg:justify-end lg:gap-6 mt-4 lg:mt-0">
                  <div className="text-left lg:text-right">
                    <div className="text-lg lg:text-xl font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </div>
                    {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.total && (
                      <div className="text-sm text-gray-500">
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
                    className="px-4 py-2 border border-[#12243c] text-[#12243c] bg-white rounded-lg hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium min-w-[120px]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
        <div className="p-16 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">
            {safeInvoices.length === 0 ? 'No invoices available.' : 'No invoices match your filter criteria.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;