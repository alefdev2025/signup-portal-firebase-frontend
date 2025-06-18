import React from 'react';
import NotificationBell from './NotificationBell';

const PortalHeader = ({ setIsMobileMenuOpen, activeTab }) => {
  // Check if we're on the overview tab or a sub-page
  const isOverviewTab = activeTab === 'overview';
  const isSubPage = activeTab.includes('-');
  
  // Define button styles based on active tab
  const buttonBaseClass = "px-4 py-1.5 rounded-lg font-medium text-sm transition-all border-2";
  
  let buttonClass;
  if (isOverviewTab) {
    // Overview tab: Navy outline buttons
    buttonClass = `${buttonBaseClass} border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744] hover:text-white`;
  } else if (isSubPage) {
    // Sub-pages: Solid purple buttons with white text (keeping border-2 for consistent sizing)
    buttonClass = `${buttonBaseClass} bg-[#9662a2] text-white hover:bg-[#8551a1] border-[#9662a2]`;
  } else {
    // Main tabs (not overview, not sub-page): Purple outline buttons
    buttonClass = `${buttonBaseClass} border-[#9662a2] text-[#9662a2] hover:bg-[#9662a2] hover:text-white`;
  }

  return (
    <header className="bg-white px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-gray-100/70 text-gray-700 px-4 py-2 rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-[#9662a2] border border-gray-300 placeholder-gray-500 transition-all focus:bg-gray-100"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {/* Emergency Button */}
        <button className="bg-white text-black md:text-[#DC143C] px-3 md:px-5 py-1.5 md:py-2 rounded-full font-semibold text-xs md:text-sm flex items-center gap-1 md:gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-black md:border-[#DC143C] md:hover:bg-[#DC143C] md:hover:text-white">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="hidden sm:inline">Emergency Number</span>
          <span className="sm:hidden">Emergency</span>
        </button>
        
        {/* Settings */}
        <button className="text-gray-700 hover:text-gray-900 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-all">
          <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {/* Notification Bell Component */}
        <NotificationBell activeTab={activeTab} />
      </div>
    </header>
  );
};

export default PortalHeader;