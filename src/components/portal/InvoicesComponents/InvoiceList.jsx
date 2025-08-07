import React from 'react';
import InvoiceListItem from './InvoiceListItem';

const InvoiceList = ({ 
  invoices, 
  filteredInvoices, 
  filterValue, 
  onFilterChange, 
  onInvoiceSelect, 
  loadingInvoiceId,
  onRefresh,
  isRefreshing 
}) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header Section */}
      <div className="p-10 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Title */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              {/* Updated icon to match Payment History style */}
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
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
            
            <select 
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-4 pr-10 py-2 text-sm font-medium text-[#12243c] border border-[#12243c] rounded-lg transition-all duration-200 
                         hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white cursor-pointer
                         text-center appearance-none bg-no-repeat"
              style={{
                textAlignLast: 'center',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2312243c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="all">All Invoices</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="recent">Last 30 Days</option>
              <option value="older">Older than 30 Days</option>
              <option value="pastYear">Past Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="p-8">
        <div className="space-y-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice, index) => (
              <InvoiceListItem
                key={invoice.id}
                invoice={invoice}
                onViewInvoice={onInvoiceSelect}
                isLoading={loadingInvoiceId === invoice.id}
                animationDelay={100 + index * 50}
              />
            ))
          ) : (
            <div className="text-center py-16 animate-fadeIn">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-700 text-base mb-2">No invoices found matching your filter.</p>
              <button 
                onClick={() => onFilterChange('all')}
                className="text-sm text-[#12243c] hover:text-[#1a2f4a] transition-colors underline"
              >
                Show all invoices
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;