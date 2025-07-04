import React, { useState, useEffect, createContext, useContext } from 'react';
import PortalHome1 from './PortalHome1';
import PortalHome2 from './PortalHome2';

// Global configuration for version toggle
const SHOW_VERSION_TOGGLE = false; // Set to true to show the version toggle button
const DEFAULT_VERSION = 2; // Set to 1 or 2 for the default version

// Create and export the context
export const PortalVersionContext = createContext({
  useWiderVersion: false,
  useMobileStyleOnDesktop: false
});

// Export hook for child components to use
export const usePortalVersion = () => useContext(PortalVersionContext);

const PortalHome = () => {
  // Get saved preference or use default version
  const [version, setVersion] = useState(() => {
    const saved = localStorage.getItem('portalHomeVersion');
    return saved ? parseInt(saved) : DEFAULT_VERSION;
  });

  // Define version settings
  const versionSettings = {
    1: {
      useWiderVersion: false,
      useMobileStyleOnDesktop: false
    },
    2: {
      useWiderVersion: true,
      useMobileStyleOnDesktop: true
    }
  };

  // Save preference when it changes
  useEffect(() => {
    localStorage.setItem('portalHomeVersion', version.toString());
  }, [version]);

  // Toggle button component
  const VersionToggle = () => (
    <button
      onClick={() => setVersion(version === 1 ? 2 : 1)}
      className="fixed bottom-4 left-4 z-[100] bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-2 shadow-lg hover:bg-gray-50 transition-colors group"
      title={`Switch to Portal Home ${version === 1 ? '2' : '1'}`}
    >
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span className="text-sm font-medium">Portal v{version}</span>
      </div>
    </button>
  );

  return (
    <PortalVersionContext.Provider value={versionSettings[version]}>
      {version === 1 ? 
        <PortalHome1 /> : 
        <PortalHome1 />
      }
      {SHOW_VERSION_TOGGLE && <VersionToggle />}
    </PortalVersionContext.Provider>
  );
};

export default PortalHome;