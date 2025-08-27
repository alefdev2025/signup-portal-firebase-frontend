// File: components/signup/SecondaryButton.jsx
import React from 'react';

const SecondaryButton = ({ 
  children, 
  onClick, 
  type = "button",
  disabled = false,
  className = "",
  showArrow = false,
  arrowDirection = "left" // "left" or "right"
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 px-8 border border-gray-300 rounded-full text-gray-700 text-base flex items-center hover:bg-gray-50 transition-all duration-300 shadow-sm disabled:opacity-50 ${className}`}
      style={{ 
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontWeight: 500 
      }}
    >
      {showArrow && arrowDirection === "left" && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      )}
      {children}
      {showArrow && arrowDirection === "right" && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default SecondaryButton;