import React from 'react';
// Import NotificationBell if it exists, otherwise create a placeholder
// import NotificationBell from './NotificationBell';

// Temporary placeholder for NotificationBell if the component doesn't exist
const NotificationBell = ({ activeTab, onViewAllClick }) => (
  <button 
    className="text-gray-700 hover:text-gray-900 p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-all relative"
    onClick={onViewAllClick}
  >
    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  </button>
);

const PortalHeader = ({ 
  setIsMobileMenuOpen, 
  activeTab, 
  setActiveTab,
  className = ""
}) => {
  return (
    <header className={`bg-white px-6 py-3 md:py-4 border-b border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Search bar */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="md:hidden text-gray-500 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden md:block relative">
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
        
        {/* Right side - Action buttons */}
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
          
          {/* Notification Bell */}
          <NotificationBell 
            activeTab={activeTab} 
            onViewAllClick={() => setActiveTab('notifications')}
          />
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;