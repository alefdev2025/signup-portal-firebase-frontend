import React from 'react';

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
    <header className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-4">
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
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg w-96 focus:outline-none focus:ring-2 focus:ring-[#9662a2] border border-gray-200 placeholder-gray-500 transition-all"
            />
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Dynamic color buttons based on active tab */}
        <button className={buttonClass}>
          Quick Links
        </button>
        
        <button className={buttonClass}>
          Resources
        </button>
        
        {/* Notifications - also changes color based on tab */}
        <button className="relative text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-all ml-2">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${isOverviewTab ? 'bg-[#9662a2]' : 'bg-[#9662a2]'}`}></span>
        </button>
        
        {/* Settings */}
        <button className="text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-all">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default PortalHeader;