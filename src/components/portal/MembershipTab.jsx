import React from 'react';

const MembershipTab = () => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Membership</h1>
      
      <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] rounded-lg p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-light mb-2">Premium Member</h2>
            <p className="text-white/80 mb-4">Member since: January 2020</p>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-white/60">Status</p>
                <p className="text-lg">Active</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Next Renewal</p>
                <p className="text-lg">Jan 15, 2026</p>
              </div>
            </div>
          </div>
          <button className="bg-white/20 border border-white/30 px-6 py-2 rounded-lg hover:bg-white/30 transition-colors">
            Manage Subscription
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-light text-[#2a2346] mb-4">Your Benefits</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-green-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-[#2a2346]">24/7 Support</h3>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-[#4a3d6b]">Get help whenever you need it</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-green-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-[#2a2346]">Priority Processing</h3>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-[#4a3d6b]">Fast-track your requests</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-[#2a2346]">Family Coverage</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Upgrade to unlock</span>
          </div>
          <p className="text-sm text-[#4a3d6b]">Extend benefits to loved ones</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipTab;