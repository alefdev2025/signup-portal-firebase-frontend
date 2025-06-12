import React, { useState } from 'react';
import alcorLogo from '../assets/images/alcor-white-logo.png';
import dewarsImage from '../assets/images/dewars2.jpg';
import astronautImage from '../assets/images/astronaut-launch.png';
import podcastImage from '../assets/images/podcast.png';
import newsletterImage from '../assets/images/recent-newsletter.png';
import februaryNewsletterImage from '../assets/images/february-newsletter.png';

// Portal Navigation Icons - updated to match specifications
const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MembershipIcon = () => (
  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

const DocumentsIcon = () => (
  <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

// Help Panel Component
const HelpPanel = ({ showHelpInfo, toggleHelpInfo, helpItems }) => {
  return (
    <>
      <button
        onClick={toggleHelpInfo}
        className={`fixed right-5 bottom-20 z-[100] bg-[#C49278] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
          showHelpInfo ? 'ring-4 ring-white ring-opacity-50' : ''
        }`}
      >
        {showHelpInfo ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {showHelpInfo && (
        <div className="fixed right-5 bottom-40 z-[99] bg-white rounded-xl shadow-2xl w-80 max-h-[60vh] overflow-y-auto border border-gray-200">
          <div className="bg-[#C49278] text-white p-4 rounded-t-xl sticky top-0 z-10">
            <h3 className="font-semibold text-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help & Information
            </h3>
          </div>
          <div className="p-4">
            {helpItems.map((item, index) => (
              <div key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-b-0">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{item.title}</h4>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {typeof item.content === 'string' ? item.content : item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const PortalPage = () => {
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };

  const portalHelpContent = [
    {
      title: "Member Portal Overview",
      content: "Welcome to your Alcor member portal. Here you can manage your profile, access important documents, schedule appointments, and stay connected with your membership benefits."
    },
    {
      title: "Profile",
      content: "Update your personal information, emergency contacts, and membership preferences. Keep your profile current to ensure we can reach you when needed."
    },
    {
      title: "Documents",
      content: "Access and download important membership documents, contracts, and educational materials. All your essential paperwork in one secure location."
    },
    {
      title: "Calendar",
      content: "View upcoming events, schedule consultations, and manage appointments. Stay informed about Alcor activities and important dates."
    },
    {
      title: "Messages",
      content: "Communicate securely with Alcor staff, receive important updates, and manage your correspondence history."
    },
    {
      title: "Payments",
      content: "View payment history, update billing information, and manage your membership dues. Secure payment processing through Stripe."
    },
    {
      title: "Need assistance?",
      content: (
        <span>
          Our support team is here to help. Contact us at{' '}
          <a href="mailto:support@alcor.com" className="text-[#775684] hover:underline">
            support@alcor.com
          </a>{' '}
          or call (480) 905-1906.
        </span>
      )
    }
  ];

  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

  const portalSections = [
    { 
      name: 'My Profile', 
      icon: <ProfileIcon />,
      description: 'Update your personal information and account settings.',
      bgColor: '#7B5B85',
      stats: {
        label: 'Profile Completion',
        value: '85%'
      }
    },
    { 
      name: 'Membership', 
      icon: <MembershipIcon />,
      description: 'Review your membership status and benefits.',
      bgColor: '#2C3E50',
      stats: {
        label: 'Cryopreservation Member Since',
        value: '2021'
      }
    },
    { 
      name: 'Documents', 
      icon: <DocumentsIcon />,
      description: 'View and upload important membership documents and videos.',
      bgColor: '#34495E',
      stats: {
        label: 'Required Documents Added',
        value: '78%'
      }
    },
    { 
      name: 'Payment', 
      icon: <PaymentIcon />,
      description: 'Manage billing and view payment history.',
      bgColor: '#6B4C75',
      stats: {
        label: 'Next Payment',
        value: 'Jan 15'
      }
    }
  ];

  return (
    <div style={marcellusStyle} className="relative min-h-screen">
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'radial-gradient(ellipse at center 50%, rgba(220, 194, 84, 0.4) 0%, rgba(185, 129, 104, 0.8) 15%, rgba(127, 96, 131, 0.9) 30%, rgba(85, 57, 108, 0.95) 50%, rgba(36, 44, 73, 0.98) 70%, rgba(12, 24, 40, 1) 90%, rgba(0, 0, 0, 1) 100%)'
        }}
      />
      
      <div className="relative z-10">
        <header className="px-4 md:px-6 py-4 pt-6 flex justify-between items-center">
          <img src={alcorLogo} alt="Alcor" className="h-14 md:h-20" />
          <button className="flex items-center space-x-3 text-white hover:opacity-70 transition-opacity">
            <svg className="w-14 h-14" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <span className="font-light text-xl text-white">Logout</span>
          </button>
        </header>

        <div className="min-h-screen flex flex-col">
          <div className="flex flex-col items-center justify-center px-4 md:px-8 text-center pb-1 -mt-10">
            <div className="flex items-center justify-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-light text-white mb-1">
                  Member Portal
                </h1>
                <p className="text-lg md:text-xl text-white/80 font-light">
                  Access your membership benefits and resources
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-4 md:px-8 -mt-8">
            <div className="max-w-[1280px] mx-auto mt-2">
              {/* Social Media Icons */}
              <div className="flex justify-end gap-3 mb-2 mt-8">
                {/* YouTube Icon */}
                <a href="#" className="group relative">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                  </div>
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">YouTube</span>
                </a>
                
                {/* Podcast Icon */}
                <a href="#" className="group relative">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                    </svg>
                  </div>
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Podcast</span>
                </a>
                
                {/* Magazine Icon */}
                <a href="#" className="group relative">
                  <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9L10 5.5 13.5 9H11v4H9V9H6.5zm11 6L14 18.5 10.5 15H13v-4h2v4h2.5z"/>
                    </svg>
                  </div>
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Magazine</span>
                </a>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 items-end">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`relative px-6 py-3 transition-all duration-200 ${
                    activeTab === 'overview' 
                      ? 'bg-white/95 text-gray-900 rounded-t-lg' 
                      : 'bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 rounded-t-md mt-2'
                  }`}>
                  <span className={activeTab === 'overview' ? 'font-medium' : ''}>Overview</span>
                  {activeTab === 'overview' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/95" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('membership')}
                  className={`relative px-6 py-3 transition-all duration-200 ${
                    activeTab === 'membership' 
                      ? 'bg-white/95 text-gray-900 rounded-t-lg' 
                      : 'bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 rounded-t-md mt-2'
                  }`}>
                  <span className={activeTab === 'membership' ? 'font-medium' : ''}>Membership</span>
                  {activeTab === 'membership' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/95" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('documents')}
                  className={`relative px-6 py-3 transition-all duration-200 ${
                    activeTab === 'documents' 
                      ? 'bg-white/95 text-gray-900 rounded-t-lg' 
                      : 'bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 rounded-t-md mt-2'
                  }`}>
                  <span className={activeTab === 'documents' ? 'font-medium' : ''}>Documents</span>
                  {activeTab === 'documents' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/95" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className={`relative px-6 py-3 transition-all duration-200 ${
                    activeTab === 'payments' 
                      ? 'bg-white/95 text-gray-900 rounded-t-lg' 
                      : 'bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 rounded-t-md mt-2'
                  }`}>
                  <span className={activeTab === 'payments' ? 'font-medium' : ''}>Payments</span>
                  {activeTab === 'payments' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/95" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('resources')}
                  className={`relative px-6 py-3 transition-all duration-200 ${
                    activeTab === 'resources' 
                      ? 'bg-white/95 text-gray-900 rounded-t-lg' 
                      : 'bg-white/10 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/20 rounded-t-md mt-2'
                  }`}>
                  <span className={activeTab === 'resources' ? 'font-medium' : ''}>Resources</span>
                  {activeTab === 'resources' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/95" />
                  )}
                </button>
              </div>
              
              {/* Content box with tab views */}
              <div className="bg-white/95 backdrop-blur px-6 pt-4 pb-6 -mt-[1px] rounded-lg min-h-[800px] flex flex-col" style={{ 
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                borderTopLeftRadius: 0
              }}>
                {/* Tab content based on active tab */}
                {activeTab === 'overview' && (
                  <>
                    <div className="mb-6 mt-4">
                      <h2 className="text-2xl font-light text-gray-900">Welcome Back, Nikki!</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                      {/* Left column - Recent Activity */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="bg-purple-50/50 border border-gray-200 p-6">
                          <div className="space-y-4">
                            <div className="border border-gray-200 bg-white rounded-lg p-4 hover:border-gray-300 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #212a44 0%, #3b3459 25%, #624c74 50%, #8a676f 75%, #b48e73 100%)' }}>
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900">Profile updated</p>
                                  <p className="text-sm text-gray-700 mt-1">Emergency contacts modified</p>
                                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border border-gray-200 bg-white rounded-lg p-4 hover:border-gray-300 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #212a44 0%, #3b3459 25%, #624c74 50%, #8a676f 75%, #b48e73 100%)' }}>
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900">Payment processed</p>
                                  <p className="text-sm text-gray-700 mt-1">Monthly membership dues - $35.00</p>
                                  <p className="text-xs text-gray-500 mt-1">Dec 15, 2024</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border border-gray-200 bg-white rounded-lg p-4 hover:border-gray-300 transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #212a44 0%, #3b3459 25%, #624c74 50%, #8a676f 75%, #b48e73 100%)' }}>
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900">Document uploaded</p>
                                  <p className="text-sm text-gray-700 mt-1">Medical directive signed</p>
                                  <p className="text-xs text-gray-500 mt-1">Dec 10, 2024</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle column - Media */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Media</h3>
                        
                        <div className="space-y-4">
                          {/* Podcast Episode */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors cursor-pointer">
                            <div className="h-48 overflow-hidden bg-gray-100">
                              <img src={podcastImage} alt="Podcast" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-4">
                              <p className="font-bold text-gray-900">The Future of Cryonics Technology</p>
                              <p className="text-sm text-gray-700 mt-1">Podcast Episode 47 • Dec 20, 2024</p>
                            </div>
                          </div>

                          {/* Video */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors cursor-pointer">
                            <div className="h-48 overflow-hidden bg-gray-900 relative">
                              <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" alt="Video" className="w-full h-full object-cover opacity-80" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <p className="font-bold text-gray-900">Alcor Facility Tour</p>
                              <p className="text-sm text-gray-700 mt-1">Veritasium • 8.7M views</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right column - Newsletters */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Newsletters</h3>
                        
                        <div className="space-y-4">
                          {/* Newsletter 1 */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors cursor-pointer">
                            <div className="h-48 overflow-hidden bg-gray-100">
                              <img src={newsletterImage} alt="Newsletter" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-4">
                              <p className="font-bold text-gray-900">December 2024 Edition</p>
                              <p className="text-sm text-gray-700 mt-1">Research updates & member spotlights</p>
                            </div>
                          </div>

                          {/* Newsletter 2 */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors cursor-pointer">
                            <div className="h-48 overflow-hidden bg-gray-100">
                              <img src={februaryNewsletterImage} alt="Newsletter" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-4">
                              <p className="font-bold text-gray-900">Research In Motion</p>
                              <p className="text-sm text-gray-700 mt-1">February 2025 Edition</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom section - Membership info */}
                    <div className="mt-8 pt-8 border-t border-gray-200 px-4">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Membership</h3>
                          <p className="text-gray-600 leading-relaxed">
                            You've been an active Alcor member since 2021. Complete your remaining documents and update your emergency contacts to finalize your arrangements.
                          </p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Payment</h3>
                          <p className="text-gray-600 leading-relaxed">
                            Your next monthly membership payment of $35.00 is scheduled for January 15, 2025. Payments are processed automatically using your card on file.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === 'membership' && (
                  <div className="min-h-[420px]">
                    <h2 className="text-2xl font-light text-gray-900 mb-6">Membership Details</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Membership Type</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-2">Cryopreservation Member</p>
                        <p className="text-gray-600">Full body preservation</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Member Since</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-2">2021</p>
                        <p className="text-gray-600">3 years of membership</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="min-h-[420px]">
                    <h2 className="text-2xl font-light text-gray-900 mb-6">Documents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-gray-900 mb-2">Membership Agreement</h3>
                        <p className="text-sm text-gray-600 mb-3">Your signed membership contract</p>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">View Document →</button>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-gray-900 mb-2">Medical Directive</h3>
                        <p className="text-sm text-gray-600 mb-3">Advanced medical directive for cryopreservation</p>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">View Document →</button>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'payments' && (
                  <div className="min-h-[420px]">
                    <h2 className="text-2xl font-light text-gray-900 mb-6">Payment History</h2>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">Monthly Membership</p>
                            <p className="text-sm text-gray-600">December 15, 2024</p>
                          </div>
                          <p className="font-semibold text-gray-900">$35.00</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">Monthly Membership</p>
                            <p className="text-sm text-gray-600">November 15, 2024</p>
                          </div>
                          <p className="font-semibold text-gray-900">$35.00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'resources' && (
                  <div className="min-h-[420px]">
                    <h2 className="text-2xl font-light text-gray-900 mb-6">Member Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-gray-900 mb-2">Educational Materials</h3>
                        <p className="text-sm text-gray-600 mb-3">Learn about cryonics science and procedures</p>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">Browse Library →</button>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-gray-900 mb-2">Forms & Documents</h3>
                        <p className="text-sm text-gray-600 mb-3">Download important membership forms</p>
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">View Documents →</button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bottom buttons section - always visible */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-auto pt-8">
                  <button className="relative overflow-hidden rounded-lg px-6 py-4 shadow-xl hover:shadow-2xl transition-all duration-200 group">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${dewarsImage})` }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, rgba(147, 116, 151, 0.9) 0%, rgba(127, 96, 131, 0.9) 50%, rgba(107, 76, 111, 0.9) 100%)' }}
                    />
                    <div className="relative z-10 text-center">
                      <h4 className="text-lg font-medium text-white mb-1">Quick Start Guide</h4>
                      <p className="text-white/90 text-sm">Learn how to use the member portal</p>
                    </div>
                  </button>
                  
                  <button className="relative overflow-hidden rounded-lg px-6 py-4 shadow-xl hover:shadow-2xl transition-all duration-200 group">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${dewarsImage})` }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, rgba(107, 76, 111, 0.9) 0%, rgba(85, 57, 108, 0.9) 50%, rgba(60, 50, 90, 0.95) 100%)' }}
                    />
                    <div className="relative z-10 text-center">
                      <h4 className="text-lg font-medium text-white mb-1">Member Resources</h4>
                      <p className="text-white/90 text-sm">Explore resources for improving your cryopreservation</p>
                    </div>
                  </button>
                  
                  <button className="relative overflow-hidden rounded-lg px-6 py-4 shadow-xl hover:shadow-2xl transition-all duration-200 group">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${dewarsImage})` }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, rgba(60, 50, 90, 0.95) 0%, rgba(36, 44, 73, 0.95) 50%, rgba(18, 36, 59, 0.95) 100%)' }}
                    />
                    <div className="relative z-10 text-center">
                      <h4 className="text-lg font-medium text-white mb-1">Support Center</h4>
                      <p className="text-white/90 text-sm">Get help with member services</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HelpPanel 
          showHelpInfo={showHelpInfo} 
          toggleHelpInfo={toggleHelpInfo} 
          helpItems={portalHelpContent} 
        />
      </div>
    </div>
  );
};

export default PortalPage;