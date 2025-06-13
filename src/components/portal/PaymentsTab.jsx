import React from 'react';

const PaymentsTab = () => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Payments</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-4">Payment Methods</h2>
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium text-[#2a2346]">•••• •••• •••• 4242</p>
                <p className="text-sm text-[#4a3d6b]">Expires 12/25</p>
              </div>
            </div>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">Edit</button>
          </div>
        </div>
        <button className="mt-4 text-[#0a1629] hover:text-[#1e2650] transition-colors">
          + Add payment method
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          <div className="border-b border-gray-100 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#2a2346]">Annual Membership Renewal</p>
                <p className="text-sm text-[#4a3d6b]">Jan 15, 2025</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-[#2a2346]">$395.00</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
            </div>
          </div>
          
          <div className="border-b border-gray-100 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#2a2346]">Document Processing Fee</p>
                <p className="text-sm text-[#4a3d6b]">Dec 1, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-[#2a2346]">$25.00</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;