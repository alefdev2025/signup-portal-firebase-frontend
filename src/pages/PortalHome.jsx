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
  
  // Get the IDs from context
  const { customerId, salesforceContactId } = useMemberPortal();

  // Handle tab changes with history
  const handleTabChange = (newTab) => {
    // Don't push to history if it's the same tab
    if (newTab !== activeTab) {
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

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{ 
        fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif"
      }}
    >
      {/* Full screen gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, #12243c 0%, #3a2e51 35%, #533966 65%, #6e4376 100%)'
        }}
      />

      {/* Main container */}
      <div className="relative h-screen flex">
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content area with rounded corners - behind sidebar */}
        <div className="absolute inset-0 flex">
          <div className="w-[230px] md:w-[250px] flex-shrink-0" /> {/* Spacer for sidebar */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-white rounded-l-2xl md:rounded-l-3xl shadow-2xl overflow-hidden">
              <PortalHeader 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
                activeTab={activeTab}
                setActiveTab={handleTabChange}
              />
              
              <main className="h-[calc(100%-4rem)] p-4 sm:p-8 overflow-y-auto bg-gray-50">
                {renderActiveTab()}
              </main>
            </div>
          </div>
        </div>

        {/* Sidebar on top */}
        <div className="relative z-20">
          <PortalSidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            profileImage={profileImage}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default PortalHome;