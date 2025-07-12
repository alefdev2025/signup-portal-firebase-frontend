import React, { useState, useEffect } from 'react';
import alcorWhiteLogo from '../../assets/images/alcor-white-logo.png';

// Color theme toggle - set to true for new colors, false for original colors
const USE_NEW_COLORS = true;

const navigationItems = [
    { 
      id: 'overview', 
      label: 'Home', 
      icon: ( <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> ) 
    },
    { 
      id: 'account', 
      label: 'Account', 
      icon: ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg> ),
      subItems: [
        { id: 'settings', label: 'Settings' },
        { id: 'notifications', label: 'Notifications' }
      ]
    },
    { 
      id: 'membership', 
      label: 'Membership', 
      icon: ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> ),
      subItems: [
        { id: 'status', label: 'Status' },
        { id: 'myinfo', label: 'My Information' },
        { id: 'memberfiles', label: 'Member Files' },
        { id: 'video', label: 'Video Testimony' }
      ]
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg> ),
      subItems: [
        { id: 'forms', label: 'Forms' },
        { id: 'information', label: 'Information' },
        { id: 'procedure', label: 'Procedure' }  // Add this line
      ]
    },
    { 
      id: 'payments', 
      label: 'Payments', 
      icon: ( <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> ),
      subItems: [
        { id: 'history', label: 'Payment History' },
        { id: 'methods', label: 'Payment Methods' },
        { id: 'invoices', label: 'Invoices' }
      ]
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: ( <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> ),
      subItems: [
        { id: 'media', label: 'Media' },
        { id: 'community', label: 'Community' },
        { id: 'support', label: 'Support' }
      ]
    }
];

const PortalSidebar = ({ 
  activeTab, 
  setActiveTab, 
  profileImage, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
  isElevated,
  layoutMode = 'floating' 
}) => {
  const [expandedItems, setExpandedItems] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      .portal-sidebar * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .portal-sidebar .font-bold,
      .portal-sidebar .font-semibold {
        font-weight: 700 !important;
      }
      .portal-sidebar .font-medium {
        font-weight: 500 !important;
      }
      /* Main menu items - more bold */
      .portal-sidebar nav > div > div > button {
        font-weight: 500 !important;
      }
      /* Sub menu items - stay thin */
      .portal-sidebar nav > div > div > div > button {
        font-weight: 300 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleNavClick = (tabId) => {
    const navItem = navigationItems.find(item => item.id === tabId);
    
    // If item has subitems, toggle expansion
    if (navItem?.subItems) {
      setExpandedItems(prev => 
        prev.includes(tabId) 
          ? prev.filter(id => id !== tabId)
          : [...prev, tabId]
      );
    } else {
      // If no subitems, set as active and close mobile menu
      setActiveTab(tabId);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSubItemClick = (parentId, subItemId) => {
    setActiveTab(`${parentId}-${subItemId}`);
    setIsMobileMenuOpen(false);
  };

  const isItemActive = (itemId) => {
    return activeTab === itemId || activeTab.startsWith(`${itemId}-`);
  };

  // Different styles based on layout mode and device
  const getBackgroundStyle = () => {
    if (isMobile) {
      // New mobile gradient using your colors - slightly diagonal
      return { background: 'linear-gradient(170deg, #1c2644 0%, #3c305b 20%, #74417f 50%, #975d6e 80%, #f1b443 100%)' };
    } else if (layoutMode === 'floating') {
      return { background: USE_NEW_COLORS ? 'linear-gradient(180deg, #0a1628 0%, #12243c 25%, #6e4376 100%)' : 'linear-gradient(180deg, #12243c 0%, #6e4376 100%)' };
    } else {
      return { backgroundColor: USE_NEW_COLORS ? '#1a2744' : '#1a2744' };
    }
  };

  const sidebarStyles = getBackgroundStyle();

  // Same width for both modes, but narrower
  const sidebarWidth = 'w-[70vw] xl:w-[280px]';

  const sidebarClasses = layoutMode === 'floating'
    ? `${sidebarWidth} h-full flex-shrink-0 flex flex-col 
       transition-all duration-700 ease-in-out
       fixed xl:relative z-50
       right-0 xl:left-0 xl:right-auto
       ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
       ${isElevated ? 'shadow-2xl' : ''}`
    : `${sidebarWidth} h-full flex-shrink-0 flex flex-col 
       transition-all duration-700 ease-in-out
       fixed xl:relative shadow-2xl z-50
       right-0 xl:left-0 xl:right-auto
       ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
       overflow-hidden`;

  // Get corner mask colors based on device
  const getCornerMaskColors = () => {
    if (isMobile) {
      return {
        top: 'linear-gradient(180deg, #1c2644 0%, #3c305b 100%)',
        bottom: 'linear-gradient(180deg, #975d6e 0%, #f1b443 100%)'
      };
    } else {
      return {
        top: USE_NEW_COLORS ? 'linear-gradient(180deg, #0a1628 0%, #12243c 100%)' : 'linear-gradient(180deg, #12243c 0%, #1a2d4a 100%)',
        bottom: USE_NEW_COLORS ? 'linear-gradient(180deg, #6a3f73 0%, #6e4376 100%)' : 'linear-gradient(180deg, #6a3f73 0%, #6e4376 100%)'
      };
    }
  };

  const cornerMaskColors = getCornerMaskColors();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Rounded corner masks when elevated (only in floating mode) */}
      {layoutMode === 'floating' && isElevated && (
        <>
          {/* Top right corner mask */}
          <div 
            className="absolute top-0 right-[-30px] w-[30px] h-[30px] hidden xl:block"
            style={{
              background: cornerMaskColors.top
            }}
          >
            <div 
              className="absolute inset-0 bg-gray-50"
            />
          </div>
          
          {/* Bottom right corner mask */}
          <div 
            className="absolute bottom-0 right-[-30px] w-[30px] h-[30px] hidden xl:block"
            style={{
              background: cornerMaskColors.bottom
            }}
          >
            <div 
              className="absolute inset-0 bg-gray-50"
            />
          </div>
        </>
      )}
      
      {/* Sidebar content without wrapper for traditional mode */}
      {layoutMode === 'traditional' ? (
        <div
          className={`portal-sidebar ${sidebarClasses}`}
          aria-label="Sidebar"
          style={sidebarStyles}
        >
            {/* Content layer */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="p-6 pt-10 pb-8 border-b border-white/20 flex items-center justify-between">
                <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-16 w-auto" />
                <button 
                  className="text-white/60 hover:text-white xl:hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 p-4 pt-6 overflow-y-auto">
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <div key={item.id} className="group">
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-normal relative group ${
                          isItemActive(item.id)
                            ? 'bg-white/10 text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isItemActive(item.id) ? 'text-white' : 'text-white/80'}>
                            {item.icon}
                          </span>
                          <span className="text-lg">{item.label}</span>
                        </div>
                        {item.subItems && (
                          <svg 
                            className={`w-4 h-4 transition-all duration-200 opacity-0 xl:group-hover:opacity-100 ${
                              expandedItems.includes(item.id) ? 'rotate-180 !opacity-100' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                      
                      {/* Subitems */}
                      {item.subItems && expandedItems.includes(item.id) && (
                        <div className="mt-1 ml-11 space-y-1">
                          {item.subItems.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => handleSubItemClick(item.id, subItem.id)}
                              className={`w-full text-left px-4 py-2.5 rounded-md transition-all text-base relative group ${
                                activeTab === `${item.id}-${subItem.id}`
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/70 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </nav>

              <div className="p-4 border-t border-white/20">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white text-sm font-medium truncate drop-shadow-sm">Nikki Olson</p>
                    <p className="text-white/80 text-xs truncate">Associate Member</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
      ) : (
        <div
          className={`portal-sidebar ${sidebarClasses}`}
          aria-label="Sidebar"
          style={sidebarStyles}
        >
          {/* Content layer for floating mode */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="p-6 pt-10 pb-8 border-b border-white/20 flex items-center justify-between">
              <img src={alcorWhiteLogo} alt="Alcor Logo" className="h-16 w-auto" />
              <button 
                className="text-white/60 hover:text-white xl:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 p-4 pt-6 overflow-y-auto">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <div key={item.id} className="group">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-normal relative group ${
                        isItemActive(item.id)
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isItemActive(item.id) ? 'text-white' : 'text-white/80'}>
                          {item.icon}
                        </span>
                        <span className="text-lg">{item.label}</span>
                      </div>
                      {item.subItems && (
                        <svg 
                          className={`w-4 h-4 transition-all duration-200 opacity-0 xl:group-hover:opacity-100 ${
                            expandedItems.includes(item.id) ? 'rotate-180 !opacity-100' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Subitems */}
                    {item.subItems && expandedItems.includes(item.id) && (
                      <div className="mt-1 ml-11 space-y-1">
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => handleSubItemClick(item.id, subItem.id)}
                            className={`w-full text-left px-4 py-2.5 rounded-md transition-all text-base relative group ${
                              activeTab === `${item.id}-${subItem.id}`
                                ? 'bg-white/10 text-white'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            <div className="p-4 border-t border-white/20">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-white text-sm font-medium truncate drop-shadow-sm">Nikki Olson</p>
                  <p className="text-white/80 text-xs truncate">Associate Member</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PortalSidebar;