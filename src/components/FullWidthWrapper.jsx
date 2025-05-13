
// File: components/FullWidthWrapper.jsx
import React, { useEffect } from 'react';

/**
 * A wrapper component that provides full-width container
 * by temporarily overriding the root element styles
 */
export default function FullWidthWrapper({ children }) {
  useEffect(() => {
    // Save the original root element styles
    const rootElement = document.getElementById('root');
    const originalMaxWidth = rootElement.style.maxWidth;
    const originalPadding = rootElement.style.padding;
    const originalMargin = rootElement.style.margin;
    
    // Override with full width styles
    rootElement.style.maxWidth = '100%';
    rootElement.style.padding = '0';
    rootElement.style.margin = '0';
    
    // Restore original styles when component unmounts
    return () => {
      rootElement.style.maxWidth = originalMaxWidth;
      rootElement.style.padding = originalPadding;
      rootElement.style.margin = originalMargin;
    };
  }, []);
  
  return (
    <div className="w-full">
      {children}
    </div>
  );
}