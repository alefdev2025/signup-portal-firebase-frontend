import React, { useState } from 'react';

const PaymentHistoryTab = () => {
  const [selectedYear, setSelectedYear] = useState('2025');
  
  const payments = [
    { id: 1, date: 'Jan 15, 2025', description: 'Annual Membership Renewal', amount: 395.00, status: 'Completed', method: 'Visa •••• 4242' },
    { id: 2, date: 'Dec 1, 2024', description: 'Document Processing Fee', amount: 25.00, status: 'Completed', method: 'Visa •••• 4242' },
    { id: 3, date: 'Nov 15, 2024', description: 'Express Service Fee', amount: 49.00, status: 'Completed', method: 'Visa •••• 4242' },
    { id: 4, date: 'Sep 30, 2024', description: 'Form Processing', amount: 15.00, status: 'Completed', method: 'Visa •••• 4242' },
    { id: 5, date: 'Mar 1, 2024', description: 'Standby Service Agreement', amount: 149.00, status: 'Completed', method: 'Visa •••• 4242' },
    { id: 6, date: 'Jan 15, 2024', description: 'Annual Membership Renewal', amount: 395.00, status: 'Completed', method: 'Visa •••• 4242' }
  ];

  const yearTotals = {
    '2025': 395.00,
    '2024': 633.00,
    '2023': 544.00
  };

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Payment History</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-[#4a3d6b] mb-2">Total Spent (All Time)</p>
          <p className="text-3xl font-light text-[#2a2346]">$2,147.00</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-[#4a3d6b] mb-2">Average Annual</p>
          <p className="text-3xl font-light text-[#2a2346]">$429.40</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-[#4a3d6b] mb-2">Last Payment</p>
          <p className="text-3xl font-light text-[#2a2346]">$395.00</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-[#2a2346]">Transaction History</h2>
          <div className="flex items-center gap-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="All">All Years</option>
            </select>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4a3d6b]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4a3d6b]">Description</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#4a3d6b]">Payment Method</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[#4a3d6b]">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-[#4a3d6b]">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-[#2a2346]">{payment.date}</td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-[#2a2346]">{payment.description}</p>
                    <p className="text-xs text-green-600">{payment.status}</p>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#4a3d6b]">{payment.method}</td>
                  <td className="py-4 px-4 text-sm font-medium text-[#2a2346] text-right">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="py-4 px-4 text-sm font-medium text-[#2a2346]">
                  {selectedYear} Total
                </td>
                <td className="py-4 px-4 text-sm font-medium text-[#2a2346] text-right">
                  ${yearTotals[selectedYear]?.toFixed(2) || '0.00'}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-[#2a2346] mb-4">Need a Receipt?</h3>
        <p className="text-[#4a3d6b] mb-4">
          All receipts are available for download. You can also request a consolidated annual statement for tax purposes.
        </p>
        <button className="bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
          Request Annual Statement
        </button>
      </div>
    </div>
  );
};

export default PaymentHistoryTab;