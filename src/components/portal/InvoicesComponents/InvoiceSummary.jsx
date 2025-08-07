import React from 'react';

const InvoiceSummary = ({ invoices }) => {
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
  const unpaidInvoices = invoices.filter(i => i.status !== 'Paid').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.amountRemaining, 0).toFixed(2);

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] animate-fadeIn" 
         style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
      
      {/* Header */}
      <div className="p-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Updated icon to match Payment History style */}
          <div className="p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#525278] via-[#404060] to-[#303048] border-2 border-[#C084FC] shadow-lg hover:shadow-xl">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Invoice Summary</h3>
        </div>
      </div>

      {/* Summary Items */}
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-normal">Total Invoices</span>
            <span className="text-base font-semibold text-gray-900">{totalInvoices}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-normal">Paid Invoices</span>
            <span className="text-base font-semibold text-green-700">{paidInvoices}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700 font-normal">Unpaid Invoices</span>
            <span className="text-base font-semibold text-orange-600">{unpaidInvoices}</span>
          </div>
          
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 font-normal">Total Invoiced</span>
              <span className="text-lg font-bold text-gray-900">${totalAmount}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 font-normal">Amount Due</span>
              <span className="text-lg font-bold text-orange-600">${totalDue}</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center font-normal italic">
              Your Membership Dues are Tax Deductible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;