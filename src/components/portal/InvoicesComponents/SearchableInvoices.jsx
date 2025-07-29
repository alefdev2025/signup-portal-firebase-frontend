import React, { useState } from 'react';

const SearchableInvoices = ({ invoices, onInvoiceSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredInvoices = invoices.filter(invoice => 
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search invoices..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsOpen(true)}
        className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all text-[#6b5b7e] placeholder-gray-400 text-base h-[50px] border border-[#6b5b7e] focus:border-[#4a4266]"
      />
      {isOpen && searchTerm && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto z-10"
             onMouseLeave={() => setIsOpen(false)}>
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map(invoice => (
              <button
                key={invoice.id}
                onClick={() => {
                  onInvoiceSelect(invoice);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-[#2a2346]">{invoice.id}</div>
                <div className="text-sm text-[#6b7280]">{invoice.description}</div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-[#6b7280]">No invoices found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableInvoices;