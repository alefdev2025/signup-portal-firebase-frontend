import React, { useState, useEffect } from 'react';
import { useInvoices, useCustomerData } from './contexts/CustomerDataContext';
import { getInvoiceDetails } from './services/netsuite';
import SearchableInvoices from './utils/searchableInvoices.jsx';
import PortalPaymentPage from '../../pages/PortalPaymentPage';

const InvoicesTab = ({ customerId = '4666' }) => {
  const { data: invoicesData, isLoading, error } = useInvoices();
  const { fetchInvoices } = useCustomerData();
  
  const [filterValue, setFilterValue] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [mostRecentBillingAddress, setMostRecentBillingAddress] = useState(null);
  
  // Payment page states
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);

  // Process invoices when data changes
  const invoices = React.useMemo(() => {
    if (!invoicesData?.invoices) return [];
    
    return invoicesData.invoices.map(inv => ({
      id: inv.documentNumber || inv.id,
      internalId: String(inv.internalId || inv.id),
      date: inv.date,
      description: inv.memo || 'Associate Member',
      amount: parseFloat(inv.total) || 0,
      subtotal: parseFloat(inv.subtotal) || parseFloat(inv.total) || 0,
      taxTotal: parseFloat(inv.taxTotal) || 0,
      discountTotal: parseFloat(inv.discountTotal) || 0,
      amountRemaining: parseFloat(inv.amountRemaining) || 0,
      status: inv.status === 'paidInFull' || parseFloat(inv.amountRemaining) === 0 ? 'Paid' : 'Unpaid',
      dueDate: inv.dueDate || inv.date,
      memo: inv.memo || 'Associate Member Dues (Annual)',
      postingPeriod: inv.postingPeriod,
      terms: inv.terms || 'Net 30',
      currency: inv.currency || 'USD',
      subsidiary: inv.subsidiary,
      automaticPayment: inv.automaticPayment || 'ICE AMBASSADOR',
      merchantELink: inv.merchantELink,
      billingAddress: inv.billingAddress,
      _original: inv
    }));
  }, [invoicesData]);

  // Fetch billing address from most recent invoice
  useEffect(() => {
    if (invoices.length > 0 && !mostRecentBillingAddress) {
      // Sort by date to get most recent
      const sortedByDate = [...invoices].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Try to fetch billing address from the most recent invoice
      const mostRecent = sortedByDate[0];
      if (mostRecent.internalId) {
        getInvoiceDetails(mostRecent.internalId)
          .then(details => {
            if (details.invoice && details.invoice.billingAddress) {
              setMostRecentBillingAddress(details.invoice.billingAddress);
              console.log('Fetched billing address from invoice:', mostRecent.id);
            }
          })
          .catch(err => {
            console.warn('Could not fetch billing address from most recent invoice:', err.message);
          });
      }
    }
  }, [invoices, mostRecentBillingAddress]);

  // Handle viewing invoice details
  const handleViewInvoice = async (invoice) => {
    try {
      // If we have an internal ID, try to fetch more details
      if (invoice.internalId) {
        const details = await getInvoiceDetails(invoice.internalId);
        setSelectedInvoice({
          ...invoice,
          ...details.invoice,
          detailedInfo: details.invoice,
          billingAddress: details.invoice.billingAddress || invoice.billingAddress
        });
      } else {
        setSelectedInvoice(invoice);
      }
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      // Just show what we have
      setSelectedInvoice(invoice);
    }
  };

  // Handle payment action - Updated to show payment page
  const handlePayInvoice = (invoice) => {
    // Ensure we have all the necessary invoice details
    const invoiceWithDetails = {
      ...invoice,
      billingAddress: invoice.billingAddress || mostRecentBillingAddress
    };
    
    setInvoiceForPayment(invoiceWithDetails);
    setShowPaymentPage(true);
  };

  // Handle back from payment page
  const handleBackFromPayment = () => {
    setShowPaymentPage(false);
    setInvoiceForPayment(null);
    // Clear selected invoice if we were in detail view
    if (selectedInvoice) {
      setSelectedInvoice(null);
    }
    // Refresh invoices to show updated payment status
    fetchInvoices({ forceRefresh: true });
  };

  // Filter invoices based on selected filter
  const filteredInvoices = invoices.filter(invoice => {
    if (filterValue === 'unpaid') {
      return invoice.status !== 'Paid';
    } else if (filterValue === 'recent') {
      const invoiceDate = new Date(invoice.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return invoiceDate >= thirtyDaysAgo;
    } else if (filterValue === 'older') {
      const invoiceDate = new Date(invoice.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return invoiceDate < thirtyDaysAgo;
    } else if (filterValue === 'pastYear') {
      const invoiceDate = new Date(invoice.date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return invoiceDate >= oneYearAgo;
    }
    return true;
  });

  // Handle refresh
  const handleRefresh = async () => {
    await fetchInvoices({ forceRefresh: true });
  };

  // Loading state
  if (isLoading && !invoices.length) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invoices.length) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading invoices</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show payment page if active
  if (showPaymentPage && invoiceForPayment) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen">
        <PortalPaymentPage 
          invoice={invoiceForPayment} 
          onBack={handleBackFromPayment}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen">
      {/* Show banner if refreshing in background */}
      {isLoading && invoices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm text-blue-700">Checking for new invoices...</span>
        </div>
      )}

      {/* Full Invoice View */}
      {selectedInvoice ? (
        <div className="animate-fadeIn">
          {/* Back button */}
          <button 
            onClick={() => setSelectedInvoice(null)}
            className="flex items-center gap-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors mb-8 text-lg animate-fadeInDown"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Invoices
          </button>

          <div className="bg-white rounded-lg shadow-[0_-2px_10px_rgba(0,0,0,0.08),0_4px_15px_rgba(0,0,0,0.1)] animate-fadeInUp">
            {/* Invoice Details */}
            <div className="p-8">
              {/* Invoice Header Information */}
              <div className="mb-10 mt-4">
                <div className="flex justify-between items-start pb-8 border-b border-gray-200">
                  <div>
                    <h2 className="text-3xl font-semibold text-[#2a2346] mb-6 mt-2 animate-fadeIn">Invoice {selectedInvoice.id}</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-base text-[#6b7280] animate-fadeIn animation-delay-100">
                      <div>
                        <span className="font-medium">Invoice Date:</span>
                        <span className="ml-3">{new Date(selectedInvoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <span className="ml-3">{new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="font-medium">Posting Period:</span>
                        <span className="ml-3">{selectedInvoice.postingPeriod}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-2 text-base font-medium rounded-lg mt-2 animate-fadeIn animation-delay-200 ${
                    selectedInvoice.status === 'Paid' 
                      ? 'bg-[#e5d4f1] text-black' 
                      : 'bg-[#fef3e2] text-black'
                  }`}>
                    {selectedInvoice.status === 'Paid' ? 'Paid' : 'Payment Due'}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-10 animate-fadeIn animation-delay-300">
                <h3 className="text-lg font-semibold text-[#2a2346] mb-4">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-[#2a2346] font-medium text-lg mb-2">TODO Name from Salesforce</p>
                  <p className="text-[#6b7280] text-base">Alcor ID: TODO id from Salesforce</p>
                  <p className="text-[#6b7280] text-base">{selectedInvoice.subsidiary}</p>
                </div>
              </div>

              {/* Billing Address */}
              {selectedInvoice.billingAddress && (
                <div className="mb-10 animate-fadeIn animation-delay-350">
                  <h3 className="text-lg font-semibold text-[#2a2346] mb-4">Billing Address</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-[#2a2346] font-medium text-lg mb-2">
                      {selectedInvoice.billingAddress.addressee}
                    </p>
                    <p className="text-[#6b7280] text-base">{selectedInvoice.billingAddress.addr1}</p>
                    {selectedInvoice.billingAddress.addr2 && (
                      <p className="text-[#6b7280] text-base">{selectedInvoice.billingAddress.addr2}</p>
                    )}
                    <p className="text-[#6b7280] text-base">
                      {selectedInvoice.billingAddress.city}, {selectedInvoice.billingAddress.state} {selectedInvoice.billingAddress.zip}
                    </p>
                    <p className="text-[#6b7280] text-base">{selectedInvoice.billingAddress.country || 'United States'}</p>
                  </div>
                </div>
              )}

              {/* Invoice Items */}
              <div className="mb-10 animate-fadeIn animation-delay-400">
                <h3 className="text-lg font-semibold text-[#2a2346] mb-4">Invoice Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Description</th>
                        <th className="text-center px-6 py-4 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Quantity</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Rate</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-6 text-base text-[#2a2346]">{item.description || selectedInvoice.description}</td>
                            <td className="px-6 py-6 text-base text-[#2a2346] text-center">{item.quantity || 1}</td>
                            <td className="px-6 py-6 text-base text-[#2a2346] text-right">${(item.rate || selectedInvoice.amount).toFixed(2)}</td>
                            <td className="px-6 py-6 text-base text-[#2a2346] font-medium text-right">${(item.amount || selectedInvoice.amount).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-6 py-6 text-base text-[#2a2346]">{selectedInvoice.description}</td>
                          <td className="px-6 py-6 text-base text-[#2a2346] text-center">1</td>
                          <td className="px-6 py-6 text-base text-[#2a2346] text-right">${selectedInvoice.amount.toFixed(2)}</td>
                          <td className="px-6 py-6 text-base text-[#2a2346] font-medium text-right">${selectedInvoice.amount.toFixed(2)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="flex justify-end mb-10 animate-fadeIn animation-delay-500">
                <div className="w-full sm:w-96">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-base text-[#6b7280]">Subtotal</span>
                      <span className="text-base text-[#2a2346] font-medium">${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.discountTotal > 0 && (
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base text-[#6b7280]">Discount</span>
                        <span className="text-base text-[#2a2346] font-medium">-${selectedInvoice.discountTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-base text-[#6b7280]">Tax</span>
                      <span className="text-base text-[#2a2346] font-medium">${selectedInvoice.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-[#2a2346]">Total</span>
                        <span className="text-2xl font-semibold text-[#2a2346]">${selectedInvoice.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-base text-[#6b7280]">Amount Due</span>
                        <span className="text-xl font-semibold text-[#d09163]">
                          ${selectedInvoice.amountRemaining.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center border-t pt-8 animate-fadeIn animation-delay-700">
                <button className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:bg-[#6b5b7e] hover:text-white transition-all text-base w-full sm:w-48">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                {selectedInvoice.status !== 'Paid' && (
                  <button 
                    onClick={() => handlePayInvoice(selectedInvoice)}
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-[#6c4674] text-white rounded-lg hover:bg-[#5a4862] transition-colors font-medium text-base w-full sm:w-48"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Pay Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Invoice List */
        <>
        <h1 className="text-4xl font-light text-[#2a2346] mb-10 animate-fadeInDown">Invoices</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 animate-fadeIn animation-delay-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-8">
            <h2 className="text-2xl font-medium text-[#2a2346]">Invoice History</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              <div className="w-full sm:w-80">
                <SearchableInvoices 
                  invoices={invoices} 
                  onInvoiceSelect={handleViewInvoice}
                />
              </div>
              <select 
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full sm:w-auto px-5 pr-10 py-3 border-2 border-[#6b5b7e] rounded-lg focus:outline-none focus:border-[#d09163] transition-all text-[#6b5b7e] cursor-pointer text-base h-[50px]"
              >
                <option value="all">All Invoices</option>
                <option value="unpaid">Unpaid Only</option>
                <option value="recent">Last 30 Days</option>
                <option value="older">Older than 30 Days</option>
                <option value="pastYear">Past Year</option>
              </select>
            </div>
          </div>

            {/* Email Notifications Section */}
            <div className="bg-gray-200 rounded-lg p-4 lg:p-6 mb-8 animate-fadeIn animation-delay-200">
              <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-shrink-0">
                  <h3 className="text-lg font-semibold text-[#2a2346] mb-1">Email Notifications</h3>
                  <p className="text-sm lg:text-base text-[#6b7280]">Get notified when new invoices are available</p>
                </div>
                
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                        <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                      </div>
                      <span className="text-sm lg:text-base text-[#4a3d6b] group-hover:text-[#2a2346] transition-colors">New invoice alerts</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-[#232f4e] transition-colors"></div>
                        <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                      </div>
                      <span className="text-sm lg:text-base text-[#4a3d6b] group-hover:text-[#2a2346] transition-colors">Payment failures</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3 lg:ml-auto">
                    <div>
                      <p className="text-sm lg:text-base text-[#6b5b7e]">Sending to:</p>
                      <p className="font-medium text-[#2a2346] text-sm lg:text-base break-all">nh4olson@gmail.com</p>
                    </div>
                    <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors underline whitespace-nowrap">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice, index) => (
                  <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:border-gray-300 group relative overflow-hidden animate-fadeInUp" style={{animationDelay: `${300 + index * 100}ms`}}>
                    {/* Colored accent band with stronger gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-[#3a5a8f] via-[#4a6fa5] to-[#6b8fc4]"></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pl-5 sm:pl-7 pr-4 sm:pr-8 py-6 sm:py-8 gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 mb-3">
                          <h3 className="font-semibold text-[#2a2346] text-base sm:text-lg">{invoice.id}</h3>
                          <span className={`px-3 py-1.5 text-sm font-medium rounded-lg w-28 text-center text-black ${
                            invoice.status === 'Paid' 
                              ? 'bg-[#e5d4f1]' 
                              : 'bg-[#fef3e2]'
                          }`}>
                            {invoice.status === 'Paid' ? 'Paid' : 'Payment Due'}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base text-[#6b7280] mb-2">{invoice.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-sm sm:text-base text-[#6b7280]">
                          <span>Invoice Date: {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span>Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <span>Period: {invoice.postingPeriod}</span>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-center justify-between sm:justify-start gap-4 min-w-[120px]">
                        <p className="text-xl sm:text-2xl font-medium text-[#2a2346]">${invoice.amount.toFixed(2)}</p>
                        {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.amount && (
                          <p className="text-sm text-[#6b7280]">Due: ${invoice.amountRemaining.toFixed(2)}</p>
                        )}
                        <div className="sm:mt-6">
                          <button 
                            onClick={() => handleViewInvoice(invoice)}
                            className="text-[#6b5b7e] hover:text-[#4a4266] transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base sm:opacity-0 group-hover:opacity-100 sm:transition-opacity sm:duration-300"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 animate-fadeIn">
                  <p className="text-[#4a3d6b] text-lg">No invoices found matching your filter.</p>
                  <button 
                    onClick={() => setFilterValue('all')}
                    className="mt-3 text-base text-[#6b5b7e] hover:text-[#4a4266] transition-colors underline"
                  >
                    Show all invoices
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-8 animate-fadeIn animation-delay-500">
              <h3 className="text-xl font-medium text-[#2a2346] mb-6">Invoice Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-[#4a3d6b] text-base">Total Invoices</span>
                  <span className="font-medium text-[#2a2346] text-lg">{invoices.length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-[#4a3d6b] text-base">Paid Invoices</span>
                  <span className="font-medium text-[#6b5b7e] text-lg">{invoices.filter(i => i.status === 'Paid').length}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-[#4a3d6b] text-base">Total Due</span>
                  <span className="font-medium text-[#d09163] text-lg">
                    ${invoices.reduce((sum, inv) => sum + inv.amountRemaining, 0).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-base text-[#4a3d6b] italic text-center">
                    Reminder: Your Membership Dues are Tax Deductible
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8 animate-fadeIn animation-delay-600">
              <h3 className="text-xl font-medium text-[#2a2346] mb-6">Billing Information</h3>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              ) : mostRecentBillingAddress ? (
                <div className="space-y-3 text-base">
                  <p className="text-[#2a2346] font-medium text-lg">
                    {mostRecentBillingAddress.addressee}
                  </p>
                  <p className="text-[#4a3d6b]">{mostRecentBillingAddress.addr1}</p>
                  {mostRecentBillingAddress.addr2 && (
                    <p className="text-[#4a3d6b]">{mostRecentBillingAddress.addr2}</p>
                  )}
                  <p className="text-[#4a3d6b]">
                    {mostRecentBillingAddress.city}, {mostRecentBillingAddress.state} {mostRecentBillingAddress.zip}
                  </p>
                  <p className="text-[#4a3d6b]">{mostRecentBillingAddress.country || 'United States'}</p>
                  <p className="text-xs text-[#6b7280] mt-3 italic">
                    From most recent invoice
                  </p>
                </div>
              ) : (
                <div className="text-[#6b7280] text-base">
                  <p>No billing address available</p>
                  <p className="text-sm mt-2">Billing address will appear here once an invoice is created.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-10 bg-gradient-to-r from-[#0a1629] to-[#384e7a] rounded-lg p-8 text-white animate-fadeIn animation-delay-700">
            <h3 className="text-xl font-medium mb-5">Need Help with Invoices?</h3>
            <p className="text-white/90 mb-6 text-base">Our support team is here to assist you with any billing questions or concerns.</p>
            <div className="flex flex-wrap gap-5">
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg transition-colors duration-300 flex items-center gap-3 text-base">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Support
              </button>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg transition-colors duration-300 flex items-center gap-3 text-base">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                View FAQ
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes fadeInDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animate-fadeIn {
              animation: fadeIn 0.6s ease-out forwards;
              opacity: 0;
            }

            .animate-fadeInUp {
              animation: fadeInUp 0.6s ease-out forwards;
              opacity: 0;
            }

            .animate-fadeInDown {
              animation: fadeInDown 0.6s ease-out forwards;
              opacity: 0;
            }

            .animation-delay-100 {
              animation-delay: 100ms;
            }

            .animation-delay-200 {
              animation-delay: 200ms;
            }

            .animation-delay-300 {
              animation-delay: 300ms;
            }

            .animation-delay-350 {
              animation-delay: 350ms;
            }

            .animation-delay-400 {
              animation-delay: 400ms;
            }

            .animation-delay-500 {
              animation-delay: 500ms;
            }

            .animation-delay-550 {
              animation-delay: 550ms;
            }

            .animation-delay-600 {
              animation-delay: 600ms;
            }

            .animation-delay-700 {
              animation-delay: 700ms;
            }
          `}</style>
        </>
      )}
    </div>
  );
};

export default InvoicesTab;