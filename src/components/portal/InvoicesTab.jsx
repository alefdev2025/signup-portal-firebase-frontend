import React from 'react';

const InvoicesTab = () => {
  const invoices = [
    { 
      id: 'INV-2025-001', 
      date: 'Jan 15, 2025', 
      description: 'Annual Membership Renewal',
      amount: 395.00,
      status: 'Paid',
      dueDate: 'Jan 15, 2025'
    },
    { 
      id: 'INV-2024-012', 
      date: 'Dec 1, 2024', 
      description: 'Document Processing Fee',
      amount: 25.00,
      status: 'Paid',
      dueDate: 'Dec 15, 2024'
    },
    { 
      id: 'INV-2024-011', 
      date: 'Nov 15, 2024', 
      description: 'Express Service Fee',
      amount: 49.00,
      status: 'Paid',
      dueDate: 'Nov 30, 2024'
    },
    { 
      id: 'INV-2024-008', 
      date: 'Sep 30, 2024', 
      description: 'Form Processing',
      amount: 15.00,
      status: 'Paid',
      dueDate: 'Oct 15, 2024'
    },
    { 
      id: 'INV-2024-003', 
      date: 'Mar 1, 2024', 
      description: 'Standby Service Agreement',
      amount: 149.00,
      status: 'Paid',
      dueDate: 'Mar 15, 2024'
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Invoices</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-[#2a2346]">Invoice History</h2>
          <div className="flex items-center gap-4">
            <input 
              type="search" 
              placeholder="Search invoices..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]"
            />
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-medium text-[#2a2346]">{invoice.id}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#4a3d6b] mb-1">{invoice.description}</p>
                  <div className="flex items-center gap-4 text-sm text-[#4a3d6b]">
                    <span>Invoice Date: {invoice.date}</span>
                    <span>•</span>
                    <span>Due Date: {invoice.dueDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-medium text-[#2a2346] mb-2">${invoice.amount.toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Invoice Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Total Invoices</span>
              <span className="font-medium text-[#2a2346]">{invoices.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Paid Invoices</span>
              <span className="font-medium text-green-600">{invoices.filter(i => i.status === 'Paid').length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Pending</span>
              <span className="font-medium text-yellow-600">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#4a3d6b]">Total Amount</span>
              <span className="font-medium text-[#2a2346]">
                ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Billing Information</h3>
          <div className="space-y-2 text-sm">
            <p className="text-[#2a2346]">Nikki Olson</p>
            <p className="text-[#4a3d6b]">123 Main Street</p>
            <p className="text-[#4a3d6b]">Seattle, WA 98101</p>
            <p className="text-[#4a3d6b]">United States</p>
          </div>
          <button className="mt-4 text-[#0a1629] hover:text-[#1e2650] transition-colors text-sm">
            Update Billing Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicesTab;