import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../contexts/MemberPortalProvider';

// Import all the component parts
import PortalSidebar from '../components/portal/PortalSidebar';
import PortalHeader from '../components/portal/PortalHeader';
import OverviewTab from '../components/portal/OverviewTab';
import AccountSettingsTab from '../components/portal/AccountSettingsTab';
import NotificationsTab from '../components/portal/NotificationsTab';
import MembershipStatusTab from '../components/portal/MembershipStatusTab';
import MyInformationTab from '../components/portal/MyInformationTab';
import ContractsTab from '../components/portal/ContractsTab';
import FormsTab from '../components/portal/FormsTab';
import PaymentHistoryTab from '../components/portal/PaymentHistoryTab';
import PaymentMethodsTab from '../components/portal/PaymentMethodsTab';
import InvoicesTab from '../components/portal/InvoicesTab';
import MediaTab from '../components/portal/MediaTab';
import CommunityTab from '../components/portal/CommunityTab';
import SupportTab from '../components/portal/SupportTab';
import DocumentsTab from '../components/portal/DocumentsTab';
import InformationDocumentsTab from '../components/portal/InformationDocumentsTab';
import VideoTestimonyTab from '../components/portal/VideoTestimonyTab';

// Placeholder components for main tabs that don't have content yet
const AccountTab = () => (
  <div className="text-center py-16">
    <h2 className="text-2xl font-medium text-gray-900 mb-4">Account</h2>
    <p className="text-gray-600">Please select a sub-item from the menu</p>
  </div>
);

const MembershipTab = () => (
  <div className="text-center py-16">
    <h2 className="text-2xl font-medium text-gray-900 mb-4">Membership</h2>
    <p className="text-gray-600">Please select a sub-item from the menu</p>
  </div>
);

const PaymentsTab = () => (
  <div className="text-center py-16">
    <h2 className="text-2xl font-medium text-gray-900 mb-4">Payments</h2>
    <p className="text-gray-600">Please select a sub-item from the menu</p>
  </div>
);

const ResourcesTab = () => (
  <div className="text-center py-16">
    <h2 className="text-2xl font-medium text-gray-900 mb-4">Resources</h2>
    <p className="text-gray-600">Please select a sub-item from the menu</p>
  </div>
);

const PortalHome = () => {
  // Get initial tab from URL hash or default to 'overview'
  const getInitialTab = () => {
    const hash = window.location.hash.slice(1);
    return hash || 'overview';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [profileImage, setProfileImage] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // NEW: Add state for layout mode with localStorage persistence
  const [layoutMode, setLayoutMode] = useState(() => {
    const saved = localStorage.getItem('portalLayoutMode');
    return saved || 'floating'; // Default to floating
  });
  
  // Get the IDs from context
  const { customerId, salesforceContactId } = useMemberPortal();
  
  // NEW: Save layout preference to localStorage
  useEffect(() => {
    localStorage.setItem('portalLayoutMode', layoutMode);
  }, [layoutMode]);

  // Handle tab changes with history
  const handleTabChange = (newTab) => {
    // Don't push to history if it's the same tab
    if (newTab !== activeTab) {
      // Add transition effect
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 50);
      
      // Just update the hash - this automatically creates a history entry
      window.location.hash = newTab;
      // The hashchange event listener will handle updating the activeTab
    }
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    // Handle hash changes (including back button)
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveTab(hash);
      } else {
        setActiveTab('overview');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if none exists
    if (!window.location.hash) {
      window.location.hash = 'overview';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': 
        return <OverviewTab setActiveTab={handleTabChange} />;
      
      // Account tabs
      case 'account':
        return <AccountTab />;
      case 'account-settings':
        return <AccountSettingsTab />;
      case 'account-notifications':
        return <NotificationsTab />;
      
      // Membership subtabs
      case 'membership':
        return <MembershipTab />;
      case 'membership-status':
        return <MembershipStatusTab />;
      case 'membership-myinfo':
        return <MyInformationTab />;
      case 'membership-memberfiles':
        return <DocumentsTab contactId={salesforceContactId} />;
      case 'membership-video':
        return <VideoTestimonyTab contactId={salesforceContactId} />;
      
      // Documents subtabs
      case 'documents':
        return <FormsTab />;
      case 'documents-forms':
        return <FormsTab />;
      case 'documents-information':
        return <InformationDocumentsTab />;
      
      // Payments subtabs
      case 'payments':
        return <PaymentsTab />;
      case 'payments-history':
        return <PaymentHistoryTab customerId={customerId} />;
      case 'payments-methods':
        return <PaymentMethodsTab customerId={customerId} />;
      case 'payments-invoices':
        return <InvoicesTab customerId={customerId} />;
      
      // Resources subtabs
      case 'resources':
        return <ResourcesTab />;
      case 'resources-media':
        return <MediaTab />;
      case 'resources-community':
        return <CommunityTab />;
      case 'resources-support':
        return <SupportTab />;
      
      default: 
        return <OverviewTab setActiveTab={handleTabChange} />;
    }
  };

  // NEW: Layout toggle button component
  const LayoutToggle = () => (
    <button
      onClick={() => setLayoutMode(layoutMode === 'floating' ? 'traditional' : 'floating')}
      className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-4 py-2 shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      title="Toggle layout mode"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
      <span className="text-sm font-medium">
        {layoutMode === 'floating' ? 'Traditional' : 'Floating'} Layout
      </span>
    </button>
  );

  // Render floating layout (current design)
  const renderFloatingLayout = () => (
    <>
      {/* Full screen gradient background */}
      <div 
        className="absolute inset-0 hidden md:block"
        style={{
          background: 'linear-gradient(to bottom right, #12243c 0%, #3a2e51 35%, #533966 65%, #6e4376 100%)'
        }}
      />

      {/* Main container */}
      <div className="relative h-screen flex">
        {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

              {/* Mobile gradient header - highest z-index */}
        <div 
          className="md:hidden fixed top-6 left-[2.5rem] right-[2.5rem] sm:left-[3.5rem] sm:right-[3.5rem] h-14 z-50 flex items-center justify-between px-4 rounded-2xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #1a2744 0%, #2a3a5a 60%, #3d3960 80%, #4a3d6b 100%)'
          }}
        >
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-white p-1.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-white text-base font-medium ml-3">Alcor Portal</h1>
          </div>
          <button 
            className="text-white p-1.5"
            onClick={() => handleTabChange('account-notifications')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content area with rounded corners - always behind */}
        <div className="absolute inset-0 flex pt-28 md:pt-0">
          <div className="w-[240px] md:w-[260px] flex-shrink-0 hidden md:block" /> {/* Spacer for sidebar - hidden on mobile */}
          <div className="flex-1 flex flex-col">
            <div className={`flex-1 bg-white md:rounded-l-2xl md:rounded-l-3xl md:rounded-tr-2xl md:rounded-tr-3xl md:rounded-br-2xl md:rounded-br-3xl md:mr-0.5 md:mr-1 md:shadow-2xl overflow-hidden transition-all duration-700 ease-in-out`}>
              <PortalHeader 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                className="hidden md:block"
              />
              
              <main className={`h-[calc(100%-4rem)] ${activeTab === 'overview' ? 'p-4 sm:p-8' : 'p-8 md:p-12 lg:p-16'} overflow-y-auto ${activeTab === 'overview' ? 'bg-gray-50' : 'bg-gray-300'} transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {activeTab !== 'overview' ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 max-w-6xl mx-auto min-h-full">
                    {renderActiveTab()}
                  </div>
                ) : (
                  renderActiveTab()
                )}
              </main>
            </div>
          </div>
        </div>

        {/* Sidebar - always positioned, z-index changes */}
        <div className={`relative ${activeTab !== 'overview' ? 'z-50' : ''} ${isMobileMenuOpen ? 'z-[70]' : ''}`}>
          <PortalSidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            profileImage={profileImage}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isElevated={activeTab !== 'overview'}
            layoutMode="floating"
          />
        </div>
      </div>
    </>
  );

  // Render traditional layout
  const renderTraditionalLayout = () => (
    <div className="h-screen flex bg-gray-50 relative">
      {/* Mobile gradient header - highest z-index */}
      <div 
        className="md:hidden fixed top-4 left-4 right-4 h-14 z-50 flex items-center justify-between px-4 rounded-2xl shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #1a2744 0%, #2a3a5a 100%)'
        }}
      >
        <div className="flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-white text-lg font-medium ml-3">Alcor Portal</h1>
        </div>
        <button 
          className="text-white p-2"
          onClick={() => handleTabChange('account-notifications')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content - positioned absolutely to fill screen */}
      <div className="absolute inset-0 flex flex-col bg-gray-300 md:ml-[260px] pt-28 md:pt-0">
        <PortalHeader 
          setIsMobileMenuOpen={setIsMobileMenuOpen} 
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          className="bg-white hidden md:block"
        />
        <main className={`flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-10 lg:p-12 max-w-6xl mx-auto min-h-full">
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Sidebar - positioned on top with higher z-index */}
      <div className={`relative z-50 ${isMobileMenuOpen ? 'z-[70]' : ''}`}>
        <PortalSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          profileImage={profileImage}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isElevated={false}
          layoutMode="traditional"
        />
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
      }}
    >
      {layoutMode === 'floating' ? renderFloatingLayout() : renderTraditionalLayout()}
      <LayoutToggle />
    </div>
  );
};

export default PortalHome;