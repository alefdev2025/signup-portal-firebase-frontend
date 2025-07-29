import React from 'react';
import SearchableInvoices from './SearchableInvoices';
import InvoiceListItem from './InvoiceListItem';

const InvoiceList = ({ 
  invoices, 
  filteredInvoices, 
  filterValue, 
  onFilterChange, 
  onInvoiceSelect, 
  loadingInvoiceId 
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 mb-8 animate-fadeIn animation-delay-100" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-12">
        <h2 className="text-2xl font-semibold text-gray-900">Invoice History</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="w-full sm:w-80">
            <SearchableInvoices 
              invoices={invoices} 
              onInvoiceSelect={onInvoiceSelect}
            />
          </div>
          <select 
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full sm:w-auto px-5 pr-10 py-3 rounded-lg focus:outline-none transition-all text-[#6b5b7e] cursor-pointer text-base h-[50px] border border-[#6b5b7e] focus:border-[#4a4266]"
          >
            <option value="all">All Invoices</option>
            <option value="unpaid">Unpaid Only</option>
            <option value="recent">Last 30 Days</option>
            <option value="older">Older than 30 Days</option>
            <option value="pastYear">Past Year</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice, index) => (
            <InvoiceListItem
              key={invoice.id}
              invoice={invoice}
              onViewInvoice={onInvoiceSelect}
              isLoading={loadingInvoiceId === invoice.id}
              animationDelay={300 + index * 100}
            />
          ))
        ) : (
          <div className="text-center py-16 animate-fadeIn">
            <p className="text-[#4a3d6b] text-lg">No invoices found matching your filter.</p>
            <button 
              onClick={() => onFilterChange('all')}
              className="mt-3 text-base text-[#6b5b7e] hover:text-[#4a4266] transition-colors underline"
            >
              Show all invoices
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;