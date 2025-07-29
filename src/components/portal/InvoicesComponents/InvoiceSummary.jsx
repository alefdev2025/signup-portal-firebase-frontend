import React from 'react';

const InvoiceSummary = ({ invoices }) => {
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'Paid').length;
  const totalDue = invoices.reduce((sum, inv) => sum + inv.amountRemaining, 0).toFixed(2);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-fadeIn animation-delay-500" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg relative overflow-hidden" style={{ 
          background: 'linear-gradient(135deg, #4a5578 0%, #3e466d 50%, #485387 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)'
        }}>
          <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-10"></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Invoice Summary</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-500 text-sm font-light">Total Invoices</span>
          <span className="font-semibold text-gray-900 text-lg">{totalInvoices}</span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-500 text-sm font-light">Paid Invoices</span>
          <span className="font-semibold text-purple-700 text-lg">{paidInvoices}</span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="text-gray-500 text-sm font-light">Total Due</span>
          <span className="font-semibold text-orange-600 text-lg">${totalDue}</span>
        </div>
        <div className="pt-2">
          <p className="text-base text-[#4a3d6b] font-light italic text-center">
            Reminder: Your Membership Dues are Tax Deductible
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;