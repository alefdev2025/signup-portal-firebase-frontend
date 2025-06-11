import React, { useState } from 'react';
import alcorLogo from '../assets/images/alcor-white-logo.png';
import dewarsImage from '../assets/images/dewars2.jpg';

// Portal Navigation Icons
const ProfileIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const MembershipIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

const DocumentsIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

// Help Panel Component
const HelpPanel = ({ showHelpInfo, toggleHelpInfo, helpItems }) => {
  return (
    <>
      <button
        onClick={toggleHelpInfo}
        className={`fixed right-8 bottom-20 z-[100] bg-[#C49278] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
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

  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };

  const portalHelpContent = [
    {
      title: "Member Portal Overview",
      content: "Welcome to your Alcor member portal. Here you can manage your profile, access important documents, schedule appointments, and stay connected with your membership benefits."
    },
    {
      title: "My Profile",
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
      description: 'Manage your personal information and emergency contacts.',
      stats: {
        label: 'Profile Completion',
        value: '85%'
      }
    },
    { 
      name: 'Membership', 
      icon: <MembershipIcon />,
      description: 'Review your membership status and benefits.',
      stats: {
        label: 'Member Since',
        value: '2021'
      }
    },
    { 
      name: 'Documents', 
      icon: <DocumentsIcon />,
      description: 'View and download important membership documents.',
      stats: {
        label: 'Documents Available',
        value: '24'
      }
    },
    { 
      name: 'Payment', 
      icon: <PaymentIcon />,
      description: 'Manage billing and view payment history.',
      stats: {
        label: 'Next Payment',
        value: 'Jan 15'
      }
    }
  ];

  return (
    <div style={marcellusStyle}>
      <header className="absolute top-0 left-0 right-0 z-20 px-4 md:px-6 py-4 flex justify-between items-center">
        <img src={alcorLogo} alt="Alcor" className="h-14 md:h-20" />
        <button className="flex items-center space-x-3 text-white hover:opacity-70 transition-opacity">
          <svg className="w-14 h-14" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
          <span className="font-light text-xl text-white">Logout</span>
        </button>
      </header>

      <div className="relative min-h-screen overflow-hidden">
        <div 
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${dewarsImage})` }}
        />
        <div 
          className="fixed inset-0"
          style={{ background: 'radial-gradient(ellipse at center 65%, rgba(220, 194, 84, 0.3) 0%, rgba(185, 129, 104, 0.96) 10%, rgba(127, 96, 131, 0.96) 25%, rgba(85, 57, 108, 0.96) 45%, rgba(36, 44, 73, 0.95) 65%, rgba(27, 40, 66, 0.94) 85%, rgba(18, 36, 59, 0.93) 100%)' }}
        />
        
        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="flex flex-col items-center justify-center px-4 md:px-8 text-center pt-28 pb-16">
            <h1 className="text-3xl md:text-5xl font-light text-white mb-3">
              Member Portal
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-light">
              Access your membership benefits and resources
            </p>
          </div>
          
          <div className="px-4 md:px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-light text-white mb-6">Member Portal Home</h2>
              
              <div className="bg-white p-6 rounded-xl shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {portalSections.map((section, index) => (
                  <div key={index} className="cursor-pointer group">
                    <div 
                      className="h-full flex flex-col relative bg-gray-50 rounded-lg transition-all duration-300 hover:translate-y-[-2px]" 
                      style={{
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), 0 6px 10px rgba(0, 0, 0, 0.15)'
                      }}
                      onMouseEnter={(e) => { 
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.25), 0 10px 15px rgba(0, 0, 0, 0.2)'; 
                      }}
                      onMouseLeave={(e) => { 
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2), 0 6px 10px rgba(0, 0, 0, 0.15)'; 
                      }}
                    >
                      <div className="p-5 flex flex-col h-full">
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{section.name}</h3>
                            <div 
                              className="h-1 w-full"
                              style={{
                                background: 'linear-gradient(90deg, #B98168 0%, #A67B85 20%, #9B7BA5 40%, #7F6083 60%, #6B5B73 80%, #55396C 100%)'
                              }}
                            />
                          </div>
                          <div 
                            className="p-3 rounded-lg flex-shrink-0"
                            style={{ 
                              backgroundColor: index === 0 ? '#7B5B85' : 
                                             index === 1 ? '#2C3E50' : 
                                             index === 2 ? '#34495E' : 
                                             '#5D4E6D'
                            }}
                          >
                            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                              {index === 0 && <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>}
                              {index === 1 && <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>}
                              {index === 2 && <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>}
                              {index === 3 && <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>}
                            </svg>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-base leading-relaxed mb-4 flex-grow">
                          {section.description}
                        </p>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between" style={{
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
                        }}>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{section.stats.label}</p>
                            <p className="text-xl font-bold text-gray-900">{section.stats.value}</p>
                          </div>
                          <div className="text-[#C49278]">
                            {index === 0 && (
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {index === 1 && (
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {index === 2 && (
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {index === 3 && (
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
                <button className="relative overflow-hidden rounded-lg px-5 py-3 shadow-lg hover:shadow-xl transition-all duration-200 group">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${dewarsImage})` }}
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, rgba(147, 116, 151, 0.9) 0%, rgba(127, 96, 131, 0.9) 50%, rgba(107, 76, 111, 0.9) 100%)' }}
                  />
                  <div className="relative z-10">
                    <h4 className="text-lg font-medium text-white mb-1">Quick Start Guide</h4>
                    <p className="text-white/90 text-sm">Learn how to make the most of your membership</p>
                  </div>
                </button>
                
                <button className="relative overflow-hidden rounded-lg px-5 py-3 shadow-lg hover:shadow-xl transition-all duration-200 group">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${dewarsImage})` }}
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, rgba(107, 76, 111, 0.9) 0%, rgba(85, 57, 108, 0.9) 50%, rgba(60, 50, 90, 0.95) 100%)' }}
                  />
                  <div className="relative z-10">
                    <h4 className="text-lg font-medium text-white mb-1">Member Benefits</h4>
                    <p className="text-white/90 text-sm">Explore all the advantages of your membership</p>
                  </div>
                </button>
                
                <button className="relative overflow-hidden rounded-lg px-5 py-3 shadow-lg hover:shadow-xl transition-all duration-200 group">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${dewarsImage})` }}
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, rgba(60, 50, 90, 0.95) 0%, rgba(36, 44, 73, 0.95) 50%, rgba(18, 36, 59, 0.95) 100%)' }}
                  />
                  <div className="relative z-10">
                    <h4 className="text-lg font-medium text-white mb-1">Support Center</h4>
                    <p className="text-white/90 text-sm">Get help when you need it most</p>
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