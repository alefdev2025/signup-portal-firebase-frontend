import React from 'react';

const InvoiceListItem = ({ invoice, onViewInvoice, isLoading, animationDelay }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    
    switch(status) {
      case 'Paid In Full':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200`;
      case 'Open':
      case 'Payment Due':
        return `${baseClasses} bg-amber-50 text-amber-700 border border-amber-200`;
      case 'Pending Payment':
        return `${baseClasses} bg-violet-50 text-violet-700 border border-violet-200`;
      case 'Overdue':
        return `${baseClasses} bg-rose-50 text-rose-700 border border-rose-200`;
      default:
        return `${baseClasses} bg-slate-50 text-slate-700 border border-slate-200`;
    }
  };

  return (
    <div 
      className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 animate-fadeIn"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section - Invoice Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Invoice #{invoice.documentNumber}
            </h3>
            <span className={getStatusBadge(invoice.status)}>
              {invoice.status}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(invoice.date)}
            </span>
            {invoice.dueDate && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Due: {formatDate(invoice.dueDate)}
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Amount and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(invoice.amount)}
            </p>
            {invoice.amountRemaining > 0 && invoice.status !== 'Paid In Full' && (
              <p className="text-sm text-gray-600">
                Balance: {formatCurrency(invoice.amountRemaining)}
              </p>
            )}
          </div>

          <button
            onClick={() => onViewInvoice(invoice)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#525278] border border-[#525278] rounded-lg 
                     hover:bg-[#525278] hover:text-white transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Invoice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceListItem;