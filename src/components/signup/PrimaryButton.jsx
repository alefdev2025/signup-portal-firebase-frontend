// File: components/signup/PrimaryButton.jsx
import React from 'react';

const PrimaryButton = ({ 
  children, 
  onClick, 
  type = "button",
  disabled = false,
  isLoading = false,
  loadingText = "Processing...",
  className = "",
  showArrow = true 
}) => {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`bg-[#6f2d74] text-white py-4 px-10 rounded-full text-lg shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center disabled:opacity-70 hover:bg-[#7b3382] ${className}`}
      style={{ 
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontWeight: 600 
      }}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {children}
          {showArrow && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </>
      )}
    </button>
  );
};

export default PrimaryButton;