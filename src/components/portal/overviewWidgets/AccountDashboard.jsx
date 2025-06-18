import React from 'react';

const AccountDashboard = ({ isVisible }) => {
  // Sample data - this would come from your user context or API
  const membershipData = {
    status: 'Active',
    type: 'Lifetime Member',
    joinDate: 'January 15, 2022',
    memberNumber: 'ALM-2022-0156',
    nextPayment: 'Paid in Full',
    lastPayment: 'January 15, 2022',
    paymentAmount: '$28,000',
    documentsCompleted: 12,
    documentsTotal: 14,
    emergencyContacts: 2,
    medicalRecords: 'Updated',
    lastLogin: '2 days ago'
  };

  const DashboardCard = ({ icon, title, value, subtitle }) => (
    <div className="bg-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#6b5b95] to-[#d4a5a5]">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`transition-all duration-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Main Cards Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Latest Media Card */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
          <h3 className="text-lg font-semibold mb-1">Latest Media</h3>
          <p className="text-sm opacity-90 mb-4">Podcast • 2 weeks ago</p>
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&q=80" 
              alt="Podcast"
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-medium">Deployment and Recovery: Inside Alcor's DART Team Part 2</p>
            </div>
          </div>
        </div>

        {/* Membership Status Card */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #6b5b95 0%, #b19bcd 100%)' }}>
          <div className="flex items-start justify-between mb-auto">
            <div>
              <h3 className="text-lg font-semibold mb-1">Membership Status</h3>
              <p className="text-2xl font-bold mt-2">{membershipData.status}</p>
              <p className="text-sm opacity-90 mt-1">{membershipData.type}</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
          </div>
          <button className="mt-8 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
            View Details →
          </button>
        </div>

        {/* Latest Newsletter Card */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
          <div className="flex items-start justify-between mb-auto">
            <div>
              <h3 className="text-lg font-semibold mb-1">Latest Newsletter</h3>
              <p className="text-base font-medium mt-2">March 2024 Newsletter</p>
              <p className="text-sm opacity-90 mt-1">January 31, 2024</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
          </div>
          <button className="mt-8 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
            Read Now
          </button>
        </div>
      </div>

      {/* Secondary Cards - 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Account Settings Card */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #6b5b95 0%, #d4a5a5 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Account Settings</h3>
              <p className="text-sm opacity-90 mt-1">Manage your profile</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Payment History Card */}
        <div className="rounded-3xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Payment History</h3>
              <p className="text-sm opacity-90 mt-1">View transactions</p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Support Center Card - Full Width */}
      <div className="rounded-3xl p-8 text-gray-800 bg-gray-100 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold mb-2">Support Center</h3>
            <p className="text-base text-gray-600">Get help when you need it</p>
            <p className="text-sm text-gray-500 mt-2">Available Monday-Friday, 9AM-5PM PST</p>
          </div>
          <div className="flex flex-col gap-3">
            <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm font-medium transition-colors">
              Contact Support
            </button>
            <button className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-sm font-medium transition-colors border border-gray-200">
              View FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {/* Member Since */}
        <DashboardCard
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Member Since"
          value={membershipData.joinDate}
          subtitle={`ID: ${membershipData.memberNumber}`}
        />

        {/* Payment Status */}
        <DashboardCard
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          title="Payment Status"
          value={membershipData.nextPayment}
          subtitle={`Last: ${membershipData.paymentAmount}`}
        />

        {/* Documents */}
        <DashboardCard
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title="Documents"
          value={`${membershipData.documentsCompleted}/${membershipData.documentsTotal}`}
          subtitle="2 pending completion"
        />

        {/* Emergency Contacts */}
        <DashboardCard
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title="Emergency Contacts"
          value={`${membershipData.emergencyContacts} Active`}
          subtitle="Last updated 30 days ago"
        />
      </div>
    </div>
  );
};

export default AccountDashboard;