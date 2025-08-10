import React from 'react';

const InvoiceListItem = ({ invoice, onViewInvoice, isLoading, animationDelay }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  // Determine the display status
  const getStatusDisplay = () => {
    // If there's an unapproved payment, always show "Payment Submitted"
    if (invoice.hasUnapprovedPayment) {
      return {
        text: 'Payment Submitted',
        className: 'bg-violet-100 text-violet-800'
      };
    }
    
    // Otherwise show the regular status
    switch (invoice.status) {
      case 'Paid':
        return {
          text: 'Paid',
          className: 'bg-green-100 text-green-800'
        };
      case 'Unpaid':
      case 'Open':
        return {
          text: 'Unpaid',
          className: 'bg-orange-100 text-orange-800'
        };
      case 'Partially Paid':
        return {
          text: 'Partially Paid',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'Overdue':
        return {
          text: 'Overdue',
          className: 'bg-red-100 text-red-800'
        };
      default:
        return {
          text: invoice.status || 'Unknown',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer animate-fadeIn`}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        transform: isLoading ? 'scale(0.98)' : 'scale(1)',
        opacity: isLoading ? 0.7 : 1
      }}
      onClick={() => !isLoading && onViewInvoice(invoice)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side - Invoice info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-gray-500">{formatDate(invoice.date)}</span>
            <span className="text-gray-300">•</span>
            {/* Show proper invoice number */}
            <span className="text-sm font-medium text-[#6b5b7e]">
              Invoice #{invoice.documentNumber || invoice.tranid || invoice.id}
            </span>
          </div>
          
          <p className="text-gray-900 font-medium mb-1">
            {invoice.memo || invoice.description || `Invoice for ${formatDate(invoice.date)}`}
          </p>
          
          {/* Show unapproved payment info if exists */}
          {invoice.hasUnapprovedPayment && (
            <p className="text-xs text-violet-600 mt-1">
              Payment #{invoice.unapprovedPaymentNumber} pending approval 
              ({formatCurrency(invoice.unapprovedPaymentAmount)})
            </p>
          )}
        </div>

        {/* Right side - Amount and status */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(invoice.amount || invoice.total)}
            </p>
            {invoice.amountRemaining > 0 && invoice.amountRemaining < invoice.amount && (
              <p className="text-sm text-gray-500">
                {formatCurrency(invoice.amountRemaining)} remaining
              </p>
            )}
          </div>
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.className}`}>
            {statusDisplay.text}
          </span>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-4 flex justify-end">
        <button
          className="text-sm text-[#6b5b7e] hover:text-[#4a4266] font-medium transition-colors flex items-center gap-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InvoiceListItem;