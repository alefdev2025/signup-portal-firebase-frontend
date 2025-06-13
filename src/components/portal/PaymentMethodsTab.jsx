import React, { useState } from 'react';

const PaymentMethodsTab = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Payment Methods</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-[#2a2346]">Saved Payment Methods</h2>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-[#0a1629] text-white px-4 py-2 rounded-lg hover:bg-[#1e2650] transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Payment Method
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-green-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-sm font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium text-[#2a2346]">Visa ending in 4242</p>
                  <p className="text-sm text-[#4a3d6b]">Expires 12/2025</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Default</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Auto-pay enabled</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">Edit</button>
                <button className="text-red-600 hover:text-red-700 transition-colors">Remove</button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-10 bg-gradient-to-r from-red-600 to-yellow-500 rounded flex items-center justify-center text-white text-sm font-bold">
                  MC
                </div>
                <div>
                  <p className="font-medium text-[#2a2346]">Mastercard ending in 5555</p>
                  <p className="text-sm text-[#4a3d6b]">Expires 08/2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">Make Default</button>
                <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">Edit</button>
                <button className="text-red-600 hover:text-red-700 transition-colors">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-medium text-[#2a2346] mb-6">Add New Payment Method</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Card Number</label>
              <input 
                type="text" 
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Expiration Date</label>
                <input 
                  type="text" 
                  placeholder="MM/YY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">CVV</label>
                <input 
                  type="text" 
                  placeholder="123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Name on Card</label>
              <input 
                type="text" 
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="default" className="text-[#0a1629] focus:ring-[#0a1629]" />
              <label htmlFor="default" className="text-sm text-[#4a3d6b]">Set as default payment method</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
                Add Payment Method
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-[#2a2346] px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Auto-Pay Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[#2a2346]">Annual Membership Renewal</p>
              <p className="text-sm text-[#4a3d6b]">Automatically renew your membership each year</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0a1629] focus:ring-[#0a1629]" />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[#2a2346]">Service Agreements</p>
              <p className="text-sm text-[#4a3d6b]">Auto-renew standby and other service agreements</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-[#0a1629] focus:ring-[#0a1629]" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsTab;