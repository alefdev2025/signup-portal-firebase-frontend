import React from 'react';

const InvoiceListItem = ({ invoice, onViewInvoice, isLoading, animationDelay }) => {
  return (
    <div className="relative p-6 pl-10 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all animate-fadeInUp" style={{animationDelay: `${animationDelay}ms`}}>
      {/* Vertical line - on the edge */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#785683] rounded-l-lg"></div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between sm:justify-start sm:items-center gap-4 mb-3">
            <h3 className="text-base font-semibold text-gray-900">{invoice.id}</h3>
            <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
              invoice.status === 'Paid' 
                ? 'bg-[#e5d4f1] text-[#6b5b7e]' 
                : invoice.status === 'Payment Pending'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-[#fef3e2] text-[#d09163]'
            }`}>
              {invoice.status === 'Paid' ? 'Paid' : 
               invoice.status === 'Payment Pending' ? `Payment Pending #${invoice.unapprovedPaymentNumber}` :
               'Payment Due'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2 font-light">{invoice.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 font-light">
            <span>{new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>Due: {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xl font-semibold text-gray-900">${invoice.amount.toFixed(2)}</p>
            {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.amount && (
              <p className="text-xs text-orange-600 mt-1 font-medium">Due: ${invoice.amountRemaining.toFixed(2)}</p>
            )}
          </div>
          <button 
            onClick={() => onViewInvoice(invoice)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-light text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed w-[80px] h-[32px] justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceListItem;