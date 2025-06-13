import React, { useState } from 'react';

// Import all the component parts
import PortalSidebar from '../components/portal/PortalSidebar';
import PortalHeader from '../components/portal/PortalHeader';
import OverviewTab from '../components/portal/OverviewTab';

import ProfileSettingsTab from '../components/portal/ProfileSettingsTab';
import SecurityTab from '../components/portal/SecurityTab';
import MembershipStatusTab from '../components/portal/MembershipStatusTab';
import MyInformationTab from '../components/portal/MyInformationTab';
import FinancialDocumentsTab from '../components/portal/FinancialDocumentsTab';
import ContractsTab from '../components/portal/ContractsTab';
import FormsTab from '../components/portal/FormsTab';
import PaymentHistoryTab from '../components/portal/PaymentHistoryTab';
import PaymentMethodsTab from '../components/portal/PaymentMethodsTab';
import InvoicesTab from '../components/portal/InvoicesTab';
import MediaTab from '../components/portal/MediaTab';
import CommunityTab from '../components/portal/CommunityTab';
import SupportTab from '../components/portal/SupportTab';

const PortalHome = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImage, setProfileImage] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        return <OverviewTab />;
      case 'account': 
        return <AccountTab profileImage={profileImage} onImageUpload={handleImageUpload} />;
      
      // Account subtabs
      case 'account-profile':
        return <ProfileSettingsTab profileImage={profileImage} onImageUpload={handleImageUpload} />;
      case 'account-security':
        return <SecurityTab />;
      
      // Membership subtabs
      case 'membership':
        return <MembershipTab />;
      case 'membership-status':
        return <MembershipStatusTab />;
      case 'membership-myinfo':
        return <MyInformationTab />;
      
      // Documents subtabs
      case 'documents':
        return <DocumentsTab />;
      case 'documents-financial':
        return <FinancialDocumentsTab />;
      case 'documents-contracts':
        return <ContractsTab />;
      case 'documents-forms':
        return <FormsTab />;
      
      // Payments subtabs
      case 'payments':
        return <PaymentsTab />;
      case 'payments-history':
        return <PaymentHistoryTab />;
      case 'payments-methods':
        return <PaymentMethodsTab />;
      case 'payments-invoices':
        return <InvoicesTab />;
      
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
        return <OverviewTab />;
    }
  };

  return (
    <div 
      className="min-h-screen p-0 md:p-4"
      style={{ 
        fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
        background: 'linear-gradient(135deg, #0e1c34 0%, #202b54 50%, #2e396b 100%)' 
      }}
    >
      <div className="relative flex h-screen md:h-[calc(100vh-2rem)] md:rounded-lg overflow-hidden shadow-2xl bg-white">
        {/* Corner accent lines */}
        <div className="hidden md:block">
          {/* Top-left corner */}
          <div className="absolute top-0 left-0 w-20 h-[1px] bg-white/30"></div>
          <div className="absolute top-0 left-0 w-[1px] h-20 bg-white/30"></div>
          
          {/* Top-right corner */}
          <div className="absolute top-0 right-0 w-20 h-[1px] bg-white/30"></div>
          <div className="absolute top-0 right-0 w-[1px] h-20 bg-white/30"></div>
          
          {/* Bottom-left corner */}
          <div className="absolute bottom-0 left-0 w-20 h-[1px] bg-white/30"></div>
          <div className="absolute bottom-0 left-0 w-[1px] h-20 bg-white/30"></div>
          
          {/* Bottom-right corner */}
          <div className="absolute bottom-0 right-0 w-20 h-[1px] bg-white/30"></div>
          <div className="absolute bottom-0 right-0 w-[1px] h-20 bg-white/30"></div>
        </div>
        
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <PortalSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profileImage={profileImage}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <PortalHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />
          
          <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
            {renderActiveTab()}
          </main>
        </div>

      </div>
    </div>
  );
};

export default PortalHome;