import React, { useState } from 'react';
import alcorLogo from '../assets/images/alcor-white-logo.png';
import dewarsImage from '../assets/images/dewars2.jpg';
import astronautImage from '../assets/images/astronaut-launch.png';

// Portal Navigation Icons - updated to match specifications
const ProfileIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MembershipIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
  </svg>
);

const DocumentsIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
  </svg>
);

const PaymentIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="white" strokeWidth="1" viewBox="0 0 24 24">
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
          style={{ 
            background: 'radial-gradient(ellipse at center 65%, rgba(220, 194, 84, 0.3) 0%, rgba(185, 129, 104, 0.96) 10%, rgba(127, 96, 131, 0.96) 27.5%, rgba(85, 57, 108, 0.96) 45%, rgba(36, 44, 73, 0.95) 65%, rgba(27, 40, 66, 0.94) 82.5%, rgba(12, 24, 40, 0.95) 100%)'
          }}
        />
        
        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="flex flex-col items-center justify-center px-4 md:px-8 text-center pt-20 pb-6">
            <h1 className="text-4xl md:text-5xl font-thin text-white mb-2">
              Member Portal
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-thin">
              Access your membership benefits and resources
            </p>
          </div>
          
          <div className="px-4 md:px-8 py-1">
            <div className="max-w-[1280px] mx-auto">
              
              {/* Glassmorphic band with astronaut */}
              <div className="relative mb-4 overflow-hidden rounded-xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between p-6">
                  <div className="relative h-24 w-24 md:h-32 md:w-32 mr-6">
                    <img 
                      src={astronautImage} 
                      alt="Astronaut" 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-light text-white mb-1">Welcome Back, Member</h3>
                    <p className="text-base md:text-lg text-white/80">Your journey to the future continues here</p>
                  </div>
                  
                  {/* Icon buttons in the middle */}
                  <div className="flex items-center gap-4 ml-8">
                    {/* Magazine Icon */}
                    <button className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </button>
                    
                    {/* Podcast Icon */}
                    <button className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                    </button>
                    
                    {/* YouTube Icon */}
                    <button className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 3.993L9 16z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur px-4 pt-5 pb-4 rounded-xl" style={{ boxShadow: '10px 15px 30px -12px rgba(0, 0, 0, 0.2), 3px 7px 15px -8px rgba(0, 0, 0, 0.15)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {portalSections.map((section, index) => (
                    <div key={index} className="cursor-pointer group">
                      <div className="bg-white rounded-lg h-full flex flex-col min-h-[250px]" style={{ boxShadow: '0px 8px 14px -3px rgba(0, 0, 0, 0.15), 0px 14px 24px -5px rgba(0, 0, 0, 0.18), 0px 18px 32px -7px rgba(0, 0, 0, 0.12)' }}>
                        <div className="p-4 pb-3 flex-grow">
                          <div className="flex items-start gap-3 mb-3">
                            <div 
                              className="p-5 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: section.bgColor }}
                            >
                              {section.icon}
                            </div>
                            <h3 className="text-[1.4rem] font-normal text-gray-900 pt-0">{section.name}</h3>
                          </div>
                          
                          <p className="text-gray-600 text-base leading-relaxed">
                            {section.description}
                          </p>
                        </div>
                        
                        <div className="mx-3 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
                            <p className="text-sm text-gray-500 mb-1 font-medium">{section.stats.label}</p>
                            <p className="text-2xl font-extrabold text-gray-900">{section.stats.value}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
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