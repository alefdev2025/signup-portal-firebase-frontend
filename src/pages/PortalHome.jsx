import React, { useState } from 'react';

// Import all the component parts
import PortalSidebar from '../components/portal/PortalSidebar';
import PortalHeader from '../components/portal/PortalHeader';
import OverviewTab from '../components/portal/OverviewTab';
import AccountTab from '../components/portal/AccountTab';
import MembershipTab from '../components/portal/MembershipTab';
import DocumentsTab from '../components/portal/DocumentsTab';
import PaymentsTab from '../components/portal/PaymentsTab';
import ResourcesTab from '../components/portal/ResourcesTab';

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
      case 'membership': 
        return <MembershipTab />;
      case 'documents': 
        return <DocumentsTab />;
      case 'payments': 
        return <PaymentsTab />;
      case 'resources': 
        return <ResourcesTab />;
      default: 
        return <OverviewTab />;
    }
  };

  return (
    <div 
      className="min-h-screen p-0 md:p-4"
      style={{ 
        fontFamily: "'Marcellus', 'Marcellus Pro Regular', serif",
        background: 'linear-gradient(135deg, #0a1629 0%, #1e2650 50%, #2a3670 100%)' 
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