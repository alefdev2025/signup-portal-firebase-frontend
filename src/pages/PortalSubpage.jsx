import React, { useState } from 'react';
import alcorLogo from '../assets/images/alcor-white-logo.png';
import dewarsImage from '../assets/images/dewars2.jpg';

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

const PortalSubpage = () => {
  const [showHelpInfo, setShowHelpInfo] = useState(false);

  const toggleHelpInfo = () => {
    setShowHelpInfo(prev => !prev);
  };

  const subpageHelpContent = [
    {
      title: "Page Overview",
      content: "This is a subpage of your member portal. Navigate through different sections using the menu options."
    },
    {
      title: "Navigation",
      content: "Use the breadcrumbs at the top to navigate back to previous pages or click the portal home link."
    },
    {
      title: "Need assistance?",
      content: (
        <span>
          Our support team is here to help. Contact us at{' '}
          <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">
            info@alcor.org
          </a>{' '}
          or call (480) 905-1906.
        </span>
      )
    }
  ];

  const marcellusStyle = {
    fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
  };

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
        
        <div className="relative z-10 min-h-screen flex flex-col pt-24">
          <div className="px-4 md:px-8 flex-grow">
            <div className="max-w-[1280px] mx-auto">
              <div className="bg-white/95 backdrop-blur px-6 py-6 rounded-xl min-h-[calc(100vh-140px)]" style={{ boxShadow: '10px 15px 30px -12px rgba(0, 0, 0, 0.2), 3px 7px 15px -8px rgba(0, 0, 0, 0.15)' }}>
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                  <a href="#" className="hover:text-gray-900 transition-colors">Portal Home</a>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-gray-900">Current Page</span>
                </div>

                {/* Page Content */}
                <div className="space-y-6">
                  <h1 className="text-3xl font-light text-gray-900">Page Title</h1>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-600 leading-relaxed">
                      This is a subpage template with the same design system as the portal home. 
                      The white content area extends to take up most of the screen space, providing 
                      ample room for your content while maintaining the consistent header and background design.
                    </p>
                  </div>

                  {/* Example content sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-normal text-gray-900 mb-3">Section One</h3>
                      <p className="text-gray-600">
                        Add your content here. This layout supports various content types and maintains 
                        consistency with the main portal design.
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-normal text-gray-900 mb-3">Section Two</h3>
                      <p className="text-gray-600">
                        The page automatically adjusts to your content while keeping the same 
                        visual style as the rest of the portal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HelpPanel 
          showHelpInfo={showHelpInfo} 
          toggleHelpInfo={toggleHelpInfo} 
          helpItems={subpageHelpContent} 
        />
      </div>
    </div>
  );
};

export default PortalSubpage;