// File: components/signup/HelpPanel.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const HelpPanel = ({ showHelpInfo, toggleHelpInfo, helpItems = [] }) => {
  // Default help content if none provided
  const defaultHelpItems = [
    {
      title: "Account Creation",
      content: "Creating an account allows you to become a member as well as manage membership and contracts."
    },
    {
      title: "Email Verification",
      content: "We'll send a 6-digit code to your email to verify your identity and secure your account."
    },
    {
      title: "Need assistance?",
      content: (
        <>
          Contact our support team at <a href="mailto:info@alcor.org" className="text-[#775684] hover:underline">info@alcor.org</a> or call 623-552-4338.
        </>
      )
    }
  ];

  // Use provided help items or default if empty
  const itemsToDisplay = helpItems.length > 0 ? helpItems : defaultHelpItems;

  // Create styles that will definitely not be overridden
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .help-panel-button {
        position: fixed !important;
        bottom: 32px !important;
        right: 32px !important;
        z-index: 999999 !important;
        width: 64px !important;
        height: 64px !important;
        background-color: #9f5fa6 !important;
        color: white !important;
        border: none !important;
        border-radius: 50% !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;
        margin: 0 !important;
        padding: 0 !important;
        outline: none !important;
      }
      
      .help-panel-button:hover {
        background-color: #8a4191 !important;
        transform: scale(1.05) !important;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
      }
      
      .help-panel-popup {
        position: fixed !important;
        bottom: 112px !important;
        right: 32px !important;
        z-index: 999998 !important;
        width: 320px !important;
        max-width: calc(100vw - 64px) !important;
        background-color: #ffffff !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
        border: none !important;
        overflow: hidden !important;
        animation: slideInUp 0.3s ease-out !important;
        outline: none !important;
        -webkit-box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
        -moz-box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
      }
      
      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .help-panel-header {
        background-color: #9f5fa6 !important;
        color: white !important;
        padding: 12px 16px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
      }
      
      .help-panel-content {
        padding: 20px !important;
        max-height: 384px !important;
        overflow-y: auto !important;
        background-color: #ffffff !important;
      }
      
      .help-panel-item {
        margin-bottom: 16px !important;
        padding-bottom: 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
      }
      
      .help-panel-item:last-child {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        border-bottom: none !important;
      }
      
      .help-panel-title {
        font-weight: 500 !important;
        color: #1f2937 !important;
        margin: 0 0 8px 0 !important;
        font-size: 14px !important;
      }
      
      .help-panel-text {
        color: #6b7280 !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        margin: 0 !important;
      }
      
      .help-panel-close {
        background: none !important;
        border: none !important;
        color: white !important;
        cursor: pointer !important;
        padding: 4px !important;
        border-radius: 4px !important;
        transition: background-color 0.2s !important;
      }
      
      .help-panel-close:hover {
        background-color: rgba(255, 255, 255, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const helpPanelContent = (
    <>
      {/* Help button */}
      <button 
        onClick={toggleHelpInfo}
        className="help-panel-button"
        aria-label="Help"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Help popup */}
      {showHelpInfo && (
        <div className="help-panel-popup">
          <div className="help-panel-header">
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>Help & Information</h3>
            <button 
              onClick={toggleHelpInfo}
              className="help-panel-close"
              aria-label="Close help"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="help-panel-content">
            {itemsToDisplay.map((item, index) => (
              <div key={index} className="help-panel-item">
                <h4 className="help-panel-title">{item.title}</h4>
                <p className="help-panel-text">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  // Only render if we're in the browser
  if (typeof document === 'undefined') return null;
  
  // Portal to document.body to completely escape any CSS constraints
  return createPortal(helpPanelContent, document.body);
};

export default HelpPanel;