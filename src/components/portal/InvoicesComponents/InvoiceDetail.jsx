import React from 'react';

const InvoiceDetail = ({ invoice, customerInfo, onClose, onPrint, onDownload, onPay }) => {
  return (
    <div className="animate-fadeIn">
      <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem]" 
           style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
        
        {/* Header */}
        <div className="p-10 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice {invoice.id}</h2>
              <div className="space-y-2 text-sm text-gray-700 font-normal">
                <div>
                  <span className="font-medium">Invoice Date:</span>
                  <span className="ml-2">{new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div>
                  <span className="font-medium">Due Date:</span>
                  <span className="ml-2">{new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            <span className={`self-start px-4 py-2 text-sm font-medium rounded-lg mt-4 sm:mt-0 ${
              invoice.status === 'Paid' 
                ? 'bg-green-100 text-green-700' 
                : invoice.status === 'Pending' || invoice.status === 'Payment Processing'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {invoice.status === 'Paid' ? 'Paid' : 
               invoice.status === 'Pending' ? 'Payment Pending' :
               invoice.status === 'Payment Processing' ? 'Processing' :
               'Payment Due'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-10">
          {/* Customer Information */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-900 font-medium text-base mb-1">{customerInfo?.name || 'Loading...'}</p>
              <p className="text-gray-700 text-sm font-normal">Alcor ID: {customerInfo?.alcorId || 'Loading...'}</p>
              <p className="text-gray-700 text-sm font-normal">{customerInfo?.subsidiary || invoice.subsidiary}</p>
            </div>
          </div>

          {/* Billing Address */}
          {invoice.billingAddress && (
            <div className="mb-8">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Billing Address</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-900 font-medium text-base mb-1">
                  {invoice.billingAddress.addressee}
                </p>
                <p className="text-gray-700 text-sm font-normal">{invoice.billingAddress.addr1}</p>
                {invoice.billingAddress.addr2 && (
                  <p className="text-gray-700 text-sm font-normal">{invoice.billingAddress.addr2}</p>
                )}
                <p className="text-gray-700 text-sm font-normal">
                  {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.zip}
                </p>
                <p className="text-gray-700 text-sm font-normal">{invoice.billingAddress.country || 'United States'}</p>
              </div>
            </div>
          )}

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Invoice Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-center px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-normal">{item.description || invoice.description}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-center font-normal">{item.quantity || 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right font-normal">${(item.rate || invoice.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">${(item.amount || invoice.amount).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-900 font-normal">{invoice.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center font-normal">1</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-normal">${invoice.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">${invoice.amount.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-normal">Subtotal</span>
                    <span className="text-sm text-gray-900 font-medium">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-normal">Discount</span>
                      <span className="text-sm text-gray-900 font-medium">-${invoice.discountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-normal">Tax</span>
                    <span className="text-sm text-gray-900 font-medium">${invoice.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-semibold text-gray-900">${invoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-normal">Amount Due</span>
                      <span className="text-base font-semibold text-orange-600">
                        ${invoice.amountRemaining.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message for Pending Payments */}
          {invoice.status === 'Pending' && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Payment Pending</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your payment has been submitted and is awaiting approval. 
                    {invoice.unappliedPaymentNumber && (
                      <span> Payment reference: {invoice.unappliedPaymentNumber}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8 border-t border-gray-200">
            <button 
              onClick={() => onPrint(invoice)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
            
            <button 
              onClick={() => onDownload(invoice)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>
            
            {/* Only show Pay button if invoice is NOT Paid, Pending, or Processing */}
            {invoice.status !== 'Paid' && 
             invoice.status !== 'Pending' && 
             invoice.status !== 'Payment Processing' && (
              <button 
                onClick={() => onPay(invoice)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#12243c] to-[#1a2f4a] text-white rounded-lg hover:from-[#1a2f4a] hover:to-[#12243c] transition-all duration-200 font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Pay Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Back button */}
      <button 
        onClick={onClose}
        className="flex items-center gap-2 text-[#12243c] hover:text-[#1a2f4a] transition-colors mt-8 text-sm font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Invoices
      </button>
    </div>
  );
};

export default InvoiceDetail;