import React from 'react';

const InvoiceDetail = ({ invoice, customerInfo, onClose, onPrint, onDownload, onPay }) => {
  return (
    <div className="animate-fadeIn">
      <div className="px-4 sm:px-4 md:px-0">
        <div className="bg-white rounded-lg shadow-[0_-2px_10px_rgba(0,0,0,0.08),0_4px_15px_rgba(0,0,0,0.1)] animate-fadeInUp">
          {/* Invoice Details */}
          <div className="p-5 sm:p-6 lg:p-8">
            {/* Invoice Header Information */}
            <div className="mb-6 lg:mb-10 mt-1 lg:mt-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4 lg:pb-8 border-b border-gray-200">
                <div className="mb-3 sm:mb-0">
                  <h2 className="text-lg lg:text-2xl font-semibold text-[#2a2346] mb-3 lg:mb-6 mt-1 animate-fadeIn">Invoice {invoice.id}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 lg:gap-x-8 gap-y-1.5 lg:gap-y-3 text-xs lg:text-base text-[#6b7280] animate-fadeIn animation-delay-100">
                    <div>
                      <span className="font-medium">Invoice Date:</span>
                      <span className="ml-1 lg:ml-3 block sm:inline">{new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span>
                      <span className="ml-1 lg:ml-3 block sm:inline">{new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <span className={`self-start px-2.5 lg:px-4 py-1 lg:py-2 text-xs lg:text-base font-medium rounded-lg mt-3 sm:mt-2 animate-fadeIn animation-delay-200 ${
                  invoice.status === 'Paid' 
                    ? 'bg-[#e5d4f1] text-black' 
                    : invoice.status === 'Payment Pending'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-[#fef3e2] text-black'
                }`}>
                  {invoice.status === 'Paid' ? 'Paid' : 
                   invoice.status === 'Payment Pending' ? 'Payment Pending' :
                   'Payment Due'}
                </span>
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-6 lg:mb-10 animate-fadeIn animation-delay-300">
              <h3 className="text-sm lg:text-lg font-semibold text-[#2a2346] mb-3 lg:mb-4">Customer Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                <p className="text-[#2a2346] font-medium text-sm lg:text-lg mb-1.5">{customerInfo?.name || 'Loading...'}</p>
                <p className="text-[#6b7280] text-xs lg:text-base">Alcor ID: {customerInfo?.alcorId || 'Loading...'}</p>
                <p className="text-[#6b7280] text-xs lg:text-base">{customerInfo?.subsidiary || invoice.subsidiary}</p>
              </div>
            </div>

            {/* Billing Address */}
            {invoice.billingAddress && (
              <div className="mb-6 lg:mb-10 animate-fadeIn animation-delay-350">
                <h3 className="text-sm lg:text-lg font-semibold text-[#2a2346] mb-3 lg:mb-4">Billing Address</h3>
                <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                  <p className="text-[#2a2346] font-medium text-sm lg:text-lg mb-1.5">
                    {invoice.billingAddress.addressee}
                  </p>
                  <p className="text-[#6b7280] text-xs lg:text-base">{invoice.billingAddress.addr1}</p>
                  {invoice.billingAddress.addr2 && (
                    <p className="text-[#6b7280] text-xs lg:text-base">{invoice.billingAddress.addr2}</p>
                  )}
                  <p className="text-[#6b7280] text-xs lg:text-base">
                    {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.zip}
                  </p>
                  <p className="text-[#6b7280] text-xs lg:text-base">{invoice.billingAddress.country || 'United States'}</p>
                </div>
              </div>
            )}

            {/* Invoice Items */}
            <div className="mb-6 lg:mb-10 animate-fadeIn animation-delay-400">
              <h3 className="text-sm lg:text-lg font-semibold text-[#2a2346] mb-3 lg:mb-4">Invoice Items</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Description</th>
                      <th className="text-center px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Qty</th>
                      <th className="text-right px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Rate</th>
                      <th className="text-right px-2 lg:px-6 py-2 lg:py-4 text-[10px] lg:text-sm font-medium text-[#6b7280] uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346]">{item.description || invoice.description}</td>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-center">{item.quantity || 1}</td>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-right">${(item.rate || invoice.amount).toFixed(2)}</td>
                          <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] font-medium text-right">${(item.amount || invoice.amount).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346]">{invoice.description}</td>
                        <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-center">1</td>
                        <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] text-right">${invoice.amount.toFixed(2)}</td>
                        <td className="px-2 lg:px-6 py-3 lg:py-6 text-xs lg:text-base text-[#2a2346] font-medium text-right">${invoice.amount.toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end mb-6 lg:mb-10 animate-fadeIn animation-delay-500">
              <div className="w-full sm:w-72 lg:w-96 max-w-[280px] sm:max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
                  <div className="flex justify-between items-center mb-1.5 lg:mb-3">
                    <span className="text-xs lg:text-base text-[#6b7280]">Subtotal</span>
                    <span className="text-xs lg:text-base text-[#2a2346] font-medium">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discountTotal > 0 && (
                    <div className="flex justify-between items-center mb-1.5 lg:mb-3">
                      <span className="text-xs lg:text-base text-[#6b7280]">Discount</span>
                      <span className="text-xs lg:text-base text-[#2a2346] font-medium">-${invoice.discountTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1.5 lg:mb-3">
                    <span className="text-xs lg:text-base text-[#6b7280]">Tax</span>
                    <span className="text-xs lg:text-base text-[#2a2346] font-medium">${invoice.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm lg:text-lg font-semibold text-[#2a2346]">Total</span>
                      <span className="text-lg lg:text-2xl font-semibold text-[#2a2346]">${invoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs lg:text-base text-[#6b7280]">Amount Due</span>
                      <span className="text-base lg:text-xl font-semibold text-[#d09163]">
                        ${invoice.amountRemaining.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center border-t pt-12 pb-4 animate-fadeIn animation-delay-700">
              <button 
                onClick={() => onPrint(invoice)}
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:bg-[#6b5b7e] hover:text-white transition-all text-xs w-full sm:w-40"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button 
                onClick={() => onDownload(invoice)}
                className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#6b5b7e] text-[#6b5b7e] rounded-lg hover:bg-[#6b5b7e] hover:text-white transition-all text-xs w-full sm:w-40"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
              {invoice.status !== 'Paid' && invoice.status !== 'Payment Pending' && (
                <button 
                  onClick={() => onPay(invoice)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#6c4674] text-white rounded-lg hover:bg-[#5a4862] transition-colors font-medium text-xs w-full sm:w-40"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pay Invoice
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Back button - moved to bottom */}
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors mt-6 mb-8 text-sm lg:text-lg animate-fadeInUp mx-4 md:mx-0"
        >
          <svg className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Invoices
        </button>
      </div>
    </div>
  );
};

export default InvoiceDetail;