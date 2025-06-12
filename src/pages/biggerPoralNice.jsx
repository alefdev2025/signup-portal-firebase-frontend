import React, { useState } from 'react';

const PortalPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImage, setProfileImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const navigationItems = [
    { 
      id: 'overview', 
      label: 'Home', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: 'account', 
      label: 'Account', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      )
    },
    { 
      id: 'membership', 
      label: 'Membership', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      )
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
      )
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  const renderOverview = () => (
    <div>
      <div 
        className="relative h-96 rounded-lg overflow-hidden mb-8"
        style={{ background: 'linear-gradient(135deg, #0a1629 0%, #1e2650 50%, #2a3670 100%)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="relative z-10 p-8 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-light text-white mb-4">Welcome Back, Nikki!</h1>
            <p className="text-xl text-white/80 mb-6">
              Access your membership benefits, documents, and resources all in one place.
            </p>
            <button className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] text-white px-8 py-3 rounded-lg hover:from-[#1e2650] hover:to-[#2a3670] transition-all font-medium shadow-lg hover:shadow-xl">
              View Membership Status
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-light text-[#2a2346] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#0a1629] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1e2650] transition-colors">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">View Documents</h3>
            <p className="text-sm text-[#4a3d6b]">Access your contracts and forms</p>
          </div>
          
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#0a1629] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1e2650] transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Payment History</h3>
            <p className="text-sm text-[#4a3d6b]">Review recent transactions</p>
          </div>
          
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#0a1629] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1e2650] transition-colors">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Member Benefits</h3>
            <p className="text-sm text-[#4a3d6b]">Explore your perks</p>
          </div>
          
          <div className="bg-gray-100 hover:bg-gray-200 rounded-lg p-6 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-[#0a1629] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#1e2650] transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-medium text-[#2a2346] mb-2">Support Center</h3>
            <p className="text-sm text-[#4a3d6b]">Get help when you need it</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-[#2a2346] mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <p className="text-[#2a2346] font-medium">Updated profile information</p>
              <p className="text-sm text-[#4a3d6b]">2 days ago</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <p className="text-[#2a2346] font-medium">Downloaded membership contract</p>
              <p className="text-sm text-[#4a3d6b]">1 week ago</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Account Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Profile Information</h2>
        
        <div className="flex items-start gap-8 mb-8">
          <div>
            <label htmlFor="profile-upload" className="cursor-pointer group block">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 group-hover:border-gray-300 transition-all duration-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center group-hover:border-gray-300 group-hover:bg-gray-200 transition-all duration-200">
                  <svg className="w-12 h-12 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </label>
            <input 
              id="profile-upload"
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="hidden"
            />
            <button 
              onClick={() => document.getElementById('profile-upload').click()}
              className="mt-4 text-sm text-[#0a1629] hover:text-[#1e2650] transition-colors"
            >
              Change Photo
            </button>
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">First Name</label>
                <input 
                  type="text" 
                  defaultValue="Nikki" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Last Name</label>
                <input 
                  type="text" 
                  defaultValue="Olson" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue="nikki@example.com" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone</label>
                <input 
                  type="tel" 
                  placeholder="(555) 123-4567" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
            </div>
            <button className="mt-6 bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Security Settings</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-[#2a2346] mb-3">Change Password</h3>
            <button className="text-[#0a1629] hover:text-[#1e2650] transition-colors">
              Update your password →
            </button>
          </div>
          <div className="border-t pt-6">
            <h3 className="font-medium text-[#2a2346] mb-3">Two-Factor Authentication</h3>
            <p className="text-sm text-[#4a3d6b] mb-3">Add an extra layer of security to your account</p>
            <button className="bg-gray-100 text-[#2a2346] px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembership = () => (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Membership</h1>
      
      <div className="bg-gradient-to-r from-[#0a1629] to-[#1e2650] rounded-lg p-8 text-white mb-8 shadow-lg">
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
        <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-[#2a2346]">24/7 Support</h3>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-[#4a3d6b]">Get help whenever you need it</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-green-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-[#2a2346]">Priority Processing</h3>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-[#4a3d6b]">Fast-track your requests</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-[#2a2346]">Family Coverage</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Upgrade to unlock</span>
          </div>
          <p className="text-sm text-[#4a3d6b]">Extend benefits to loved ones</p>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Documents</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📄</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">3 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Contracts</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Membership Agreement</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">🏥</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">2 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Medical Directives</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Advance Directive</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">⚖️</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">5 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Legal Forms</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Power of Attorney</p>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">📚</div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">12 files</span>
          </div>
          <h3 className="text-lg font-medium text-[#2a2346] mb-2">Educational Materials</h3>
          <p className="text-sm text-[#4a3d6b]">Most recent: Member Handbook</p>
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
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

  const renderResources = () => (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#2a2346] mb-2">Video Library</h3>
            <p className="text-sm text-[#4a3d6b] mb-4">Educational videos and tutorials</p>
            <p className="text-sm font-medium text-[#0a1629]">24 videos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#2a2346] mb-2">Knowledge Base</h3>
            <p className="text-sm text-[#4a3d6b] mb-4">Articles and guides</p>
            <p className="text-sm font-medium text-[#0a1629]">156 articles</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#2a2346] mb-2">Webinar Archive</h3>
            <p className="text-sm text-[#4a3d6b] mb-4">Past webinar recordings</p>
            <p className="text-sm font-medium text-[#0a1629]">18 webinars</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'account':
        return renderAccount();
      case 'membership':
        return renderMembership();
      case 'documents':
        return renderDocuments();
      case 'payments':
        return renderPayments();
      case 'resources':
        return renderResources();
      default:
        return renderOverview();
    }
  };

  return (
    <div 
      className="min-h-screen p-4"
      style={{ 
        fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
        background: 'linear-gradient(135deg, #0a1629 0%, #1e2650 50%, #2a3670 100%)' 
      }}
    >
      <div className="flex h-[calc(100vh-2rem)] rounded-lg overflow-hidden shadow-2xl">
        {/* === Sidebar === */}
        <div className="w-64 flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-[#0a1629]">A</span>
              </div>
              <span className="text-white text-xl font-light">ALCOR</span>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={activeTab === item.id ? 'text-white' : ''}>
                    {item.icon}
                  </span>
                  <span className="font-light">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-white text-sm font-medium truncate">Nikki Olson</p>
                <p className="text-gray-400 text-xs truncate">Premium Member</p>
              </div>
            </div>
          </div>
        </div>

        {/* === Main Content === */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* --- Content Header --- */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-[#1e2650]/50"
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-500 hover:text-gray-800 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-gray-800 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* --- Scrollable Content Area --- */}
          <div className="flex-1 p-8 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalPage;