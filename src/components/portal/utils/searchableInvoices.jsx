import React, { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';

const SearchableInvoices = ({ invoices, onInvoiceSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search function that checks multiple fields
  const searchInvoices = (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchLower = term.toLowerCase();
    
    const results = invoices.filter(invoice => {
      // Search in invoice number
      if (invoice.id && invoice.id.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in description/memo
      if (invoice.description && invoice.description.toLowerCase().includes(searchLower)) {
        return true;
      }
      if (invoice.memo && invoice.memo.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in amount (exact or partial match)
      const amountStr = invoice.amount?.toString() || '';
      if (amountStr.includes(term)) {
        return true;
      }
      
      // Search in formatted amount (e.g., "60.00" or "$60")
      const formattedAmount = `$${invoice.amount?.toFixed(2)}`;
      if (formattedAmount.includes(term)) {
        return true;
      }
      
      // Search in status
      if (invoice.status && invoice.status.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in dates (multiple formats)
      const dateFormats = [
        new Date(invoice.date).toLocaleDateString('en-US'),
        new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        invoice.date // Original format
      ];
      
      const dueDateFormats = [
        new Date(invoice.dueDate).toLocaleDateString('en-US'),
        new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        invoice.dueDate // Original format
      ];
      
      if (dateFormats.some(format => format.toLowerCase().includes(searchLower)) ||
          dueDateFormats.some(format => format.toLowerCase().includes(searchLower))) {
        return true;
      }
      
      // Search in posting period
      if (invoice.postingPeriod && invoice.postingPeriod.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in subsidiary
      if (invoice.subsidiary && invoice.subsidiary.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search for year
      const year = new Date(invoice.date).getFullYear().toString();
      if (year.includes(term)) {
        return true;
      }
      
      // Search for month names
      const monthName = new Date(invoice.date).toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const shortMonthName = new Date(invoice.date).toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
      if (monthName.includes(searchLower) || shortMonthName.includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    // Sort results by relevance (exact matches first)
    results.sort((a, b) => {
      const aExactMatch = a.id?.toLowerCase() === searchLower;
      const bExactMatch = b.id?.toLowerCase() === searchLower;
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by date (newest first)
      return new Date(b.date) - new Date(a.date);
    });
    
    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  };

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setIsSearching(true);
      searchInvoices(term);
      setIsSearching(false);
    }, 300),
    [invoices]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    debouncedSearch(value);
  };

  // Handle selecting a search result
  const handleSelectInvoice = (invoice) => {
    setSearchTerm('');
    setShowDropdown(false);
    setSearchResults([]);
    onInvoiceSelect(invoice);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching text
  const highlightMatch = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.toString().split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
        part
    );
  };

  return (
    <div className="relative search-container">
      <div className="relative">
        <input
          type="search"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search invoices..."
          className="w-full px-5 py-3 pl-12 border-2 border-[#6b5b7e] rounded-lg focus:outline-none focus:border-[#d09163] transition-all text-base"
        />
        <svg 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b5b7e]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6b5b7e]"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showDropdown && searchTerm.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#6b5b7e] rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
          {searchResults.length > 0 ? (
            <>
              <div className="p-3 border-b border-gray-200">
                <p className="text-sm text-[#6b7280]">
                  Found {searchResults.length} invoice{searchResults.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {searchResults.map((invoice) => (
                  <li key={invoice.id}>
                    <button
                      onClick={() => handleSelectInvoice(invoice)}
                      className="w-full text-left p-4 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-[#2a2346]">
                            {highlightMatch(invoice.id, searchTerm)}
                          </h4>
                          <p className="text-sm text-[#6b7280] mt-1">
                            {highlightMatch(invoice.description || invoice.memo, searchTerm)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          invoice.status === 'Paid' 
                            ? 'bg-[#e5d4f1] text-black' 
                            : 'bg-[#fef3e2] text-black'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-[#6b7280]">
                        <span>
                          Amount: <strong className="text-[#2a2346]">
                            {highlightMatch(`$${invoice.amount.toFixed(2)}`, searchTerm)}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Date: {highlightMatch(
                            new Date(invoice.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }), 
                            searchTerm
                          )}
                        </span>
                        {invoice.postingPeriod && (
                          <>
                            <span>•</span>
                            <span>
                              Period: {highlightMatch(invoice.postingPeriod, searchTerm)}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : searchTerm.length >= 2 && !isSearching ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <p className="text-[#6b7280]">No invoices found for "{searchTerm}"</p>
              <p className="text-sm text-[#6b7280] mt-1">Try searching by invoice number, amount, date, or status</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Search Tips */}
      {showDropdown && searchTerm.length < 2 && searchTerm.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4 z-50">
          <p className="text-sm text-[#6b7280]">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
};

export default SearchableInvoices;