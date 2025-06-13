import React from 'react';

const MembershipStatusTab = () => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Membership Status</h1>
      
      <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] rounded-lg p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-light mb-2">Premium Member</h2>
            <p className="text-white/80 mb-4">Member since: January 2020</p>
            <div className="flex gap-6">
              <div>
                <p className="text-sm text-white/60">Status</p>
                <p className="text-lg font-medium">Active</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Member ID</p>
                <p className="text-lg font-medium">#A2020-1542</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Next Renewal</p>
                <p className="text-lg font-medium">Jan 15, 2026</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-light mb-2">5 Years</p>
            <p className="text-white/60">of membership</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Membership Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#2a2346]">Renewed Membership</p>
                <p className="text-sm text-[#4a3d6b]">January 15, 2025</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#2a2346]">Upgraded to Premium</p>
                <p className="text-sm text-[#4a3d6b]">March 1, 2023</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-[#2a2346]">Joined Alcor</p>
                <p className="text-sm text-[#4a3d6b]">January 15, 2020</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-[#2a2346] mb-4">Membership Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#4a3d6b]">Plan Type</span>
              <span className="font-medium text-[#2a2346]">Premium Annual</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4a3d6b]">Annual Fee</span>
              <span className="font-medium text-[#2a2346]">$395.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4a3d6b]">Payment Method</span>
              <span className="font-medium text-[#2a2346]">Visa •••• 4242</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4a3d6b]">Auto-Renewal</span>
              <span className="font-medium text-green-600">Enabled</span>
            </div>
          </div>
          <button className="w-full mt-4 bg-gray-100 text-[#2a2346] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Manage Subscription
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-[#2a2346] mb-4">Membership Certificate</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[#4a3d6b] mb-4">Download your official membership certificate</p>
          <button className="bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
            Download Certificate
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipStatusTab;