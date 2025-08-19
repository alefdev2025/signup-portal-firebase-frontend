import React from 'react';

const InvoiceSummary = ({ invoices }) => {
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'Paid' || i.status === 'paidInFull').length;
  const unpaidInvoices = invoices.filter(i => i.status !== 'Paid' && i.status !== 'paidInFull').length;
  
  // Fixed: Use 'total' instead of 'amount'
  const totalAmount = invoices.reduce((sum, inv) => {
    const amount = parseFloat(inv.total || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0).toFixed(2);
  
  // Ensure amountRemaining is parsed correctly
  const totalDue = invoices.reduce((sum, inv) => {
    const remaining = parseFloat(inv.amountRemaining || 0);
    return sum + (isNaN(remaining) ? 0 : remaining);
  }, 0).toFixed(2);

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header */}
      <div className="p-6 sm:p-8 2xl:p-10 border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 2xl:gap-4">
          {/* Updated icon to match Payment History style */}
          <div className="p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#0a41cc] shadow-lg hover:shadow-xl">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg 2xl:text-xl font-semibold text-gray-900">Invoice Summary</h3>
        </div>
      </div>

      {/* Summary Items */}
      <div className="p-4 sm:p-6 2xl:p-8">
        <div className="space-y-4 sm:space-y-5 2xl:space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs 2xl:text-sm text-gray-700 font-normal">Total Invoices</span>
            <span className="text-sm sm:text-base 2xl:text-lg font-semibold text-gray-900">{totalInvoices}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs 2xl:text-sm text-gray-700 font-normal">Paid Invoices</span>
            <span className="text-sm sm:text-base 2xl:text-lg font-semibold text-green-700">{paidInvoices}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[11px] sm:text-xs 2xl:text-sm text-gray-700 font-normal">Unpaid Invoices</span>
            <span className="text-sm sm:text-base 2xl:text-lg font-semibold text-orange-600">{unpaidInvoices}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-4 sm:pt-5 2xl:pt-6 space-y-3 sm:space-y-4 2xl:space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] sm:text-xs 2xl:text-sm text-gray-700 font-normal">Total Invoiced</span>
              <span className="text-base sm:text-lg 2xl:text-xl font-bold text-gray-900">${totalAmount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[11px] sm:text-xs 2xl:text-sm text-gray-700 font-normal">Amount Due</span>
              <span className="text-base sm:text-lg 2xl:text-xl font-bold text-orange-600">${totalDue}</span>
            </div>
          </div>
          
          <div className="pt-3 sm:pt-4 2xl:pt-5 border-t border-gray-200">
            <p className="text-[10px] sm:text-xs 2xl:text-sm text-gray-500 text-center font-normal italic">
              Your Membership Dues are Tax Deductible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;