// File: components/modals/TermsPrivacyModal.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import alcorLogo from "../../assets/images/alcor-white-logo-no-text.png";

/**
 * Modal component for displaying Terms of Use or Privacy Policy content
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when closing the modal
 * @param {string} props.type - Type of content to display ('terms' or 'privacy')
 * @param {string} props.contentUrl - URL to fetch content from (optional)
 * @param {string} props.directContent - HTML content to display directly (optional, takes precedence over contentUrl)
 */
const TermsPrivacyModal = ({ isOpen, onClose, type, contentUrl, directContent }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Title based on type
  const title = type === 'terms' ? 'Terms of Use' : 'Privacy Policy';
  
  // Effect to fetch content when the modal opens
  useEffect(() => {
    if (isOpen) {
      // If direct content is provided, use it immediately
      if (directContent) {
        setContent(directContent);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      if (contentUrl) {
        // Fetch content from URL or file
        fetch(contentUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch: ${response.status}`);
            }
            return response.text();
          })
          .then(data => {
            setContent(data);
            setLoading(false);
          })
          .catch(err => {
            console.error("Error loading content:", err);
            // Use placeholder content as a fallback
            setContent(getPlaceholderContent(type));
            setLoading(false);
          });
      } else {
        // If no contentUrl is provided, use placeholder content
        setContent(getPlaceholderContent(type));
        setLoading(false);
      }
    }
  }, [isOpen, contentUrl, directContent, type]);

  // Create modal styles that override everything
  useEffect(() => {
    if (isOpen) {
      const style = document.createElement('style');
      style.textContent = `
        .terms-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 1000000 !important;
          background-color: rgba(0, 0, 0, 0.15) !important;
          overflow-y: auto !important;
          padding: 16px !important;
        }
        
        .terms-modal-container {
          display: flex !important;
          min-height: calc(100vh - 32px) !important;
          align-items: flex-start !important;
          justify-content: center !important;
          padding-top: 60px !important;
        }
        
        .terms-modal-content {
          position: relative !important;
          width: 65vw !important;
          max-width: 850px !important;
          max-height: 85vh !important;
          background-color: white !important;
          border-radius: 8px !important;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25) !important;
          display: flex !important;
          flex-direction: column !important;
          margin: auto !important;
        }
        
        .terms-modal-header {
          background: linear-gradient(90deg, #6f2d74 0%, #8a4099 100%) !important;
          border-top-left-radius: 8px !important;
          border-top-right-radius: 8px !important;
          padding: 16px 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          flex-shrink: 0 !important;
        }
        
        .terms-modal-logo {
          height: 40px !important;
          margin-right: 16px !important;
        }
        
        .terms-modal-title {
          margin: 0 !important;
          font-size: 24px !important;
          font-weight: bold !important;
          color: white !important;
        }
        
        .terms-modal-close {
          background: none !important;
          border: none !important;
          color: white !important;
          cursor: pointer !important;
          padding: 8px !important;
          border-radius: 50% !important;
          transition: background-color 0.2s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .terms-modal-close:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }
        
        .terms-modal-body {
          flex: 1 !important;
          overflow-y: auto !important;
          padding: 32px 48px !important;
          background-color: white !important;
        }
        
        .terms-modal-body h1 {
          font-size: 28px !important;
          font-weight: bold !important;
          color: #1f2937 !important;
          margin: 0 0 16px 0 !important;
        }
        
        .terms-modal-body h2 {
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #374151 !important;
          margin: 24px 0 12px 0 !important;
        }
        
        .terms-modal-body p {
          font-size: 16px !important;
          line-height: 1.7 !important;
          color: #4b5563 !important;
          margin: 0 0 16px 0 !important;
        }
        
        .terms-modal-body ul {
          margin: 16px 0 !important;
          padding-left: 24px !important;
        }
        
        .terms-modal-body li {
          font-size: 16px !important;
          line-height: 1.7 !important;
          color: #4b5563 !important;
          margin-bottom: 8px !important;
        }
        
        .terms-modal-footer {
          border-top: 1px solid #e5e7eb !important;
          padding: 24px !important;
          display: flex !important;
          justify-content: flex-end !important;
          background-color: #f9fafb !important;
          border-bottom-left-radius: 8px !important;
          border-bottom-right-radius: 8px !important;
          flex-shrink: 0 !important;
        }
        
        .terms-modal-close-btn {
          background-color: #0c2340 !important;
          color: white !important;
          border: none !important;
          padding: 12px 32px !important;
          border-radius: 9999px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s !important;
          font-size: 16px !important;
        }
        
        .terms-modal-close-btn:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px) !important;
        }
        
        .terms-modal-spinner {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          height: 256px !important;
        }
        
        .terms-modal-spinner div {
          width: 48px !important;
          height: 48px !important;
          border: 3px solid #e5e7eb !important;
          border-top: 3px solid #9f5fa6 !important;
          border-radius: 50% !important;
          animation: spin 1s linear infinite !important;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .terms-modal-content {
            width: 90vw !important;
            max-height: 90vh !important;
          }
          
          .terms-modal-container {
            padding-top: 30px !important;
          }
          
          .terms-modal-body {
            padding: 24px !important;
          }
          
          .terms-modal-header {
            padding: 12px 16px !important;
          }
          
          .terms-modal-title {
            font-size: 20px !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.head.removeChild(style);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);
  
  // Function to get placeholder content based on type
  const getPlaceholderContent = (type) => {
    const commonSections = `
      <h2>1. Introduction</h2>
      <p>Welcome to Alcor Cryonics ("we," "our," or "us"). This document outlines the terms and conditions for using our services and website.</p>
      
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.</p>
      
      <h2>2. Definitions</h2>
      <p>In these Terms, "Service" refers to our cryonics services, website, and related offerings. "User" or "you" refers to individuals accessing or using our Service.</p>
    `;
    
    if (type === 'terms') {
      return `
        <h1>Terms of Use</h1>
        <p><em>Last updated: May 1, 2025</em></p>
        
        ${commonSections}
        
        <h2>3. User Accounts</h2>
        <p>When you create an account with us, you guarantee that the information you provide is accurate, complete, and current.</p>
        
        <h2>4. Service Usage</h2>
        <p>You agree not to use our Service for any illegal or unauthorized purpose. You must not transmit worms, viruses, or any code of a destructive nature.</p>
      `;
    } else { // Privacy Policy
      return `
        <h1>Privacy Policy</h1>
        <p><em>Last updated: May 1, 2025</em></p>
        
        ${commonSections}
        
        <h2>3. Information Collection</h2>
        <p>We collect personal information that you voluntarily provide when using our Service, including but not limited to name, email address, and phone number.</p>
        
        <h2>4. Use of Information</h2>
        <p>We use collected information to provide and improve our Service, communicate with you, and comply with legal obligations.</p>
      `;
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  const modalContent = (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal-container">
        <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="terms-modal-header">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={alcorLogo} alt="Alcor Logo" className="terms-modal-logo" />
              <h2 className="terms-modal-title">{title}</h2>
            </div>
            <button onClick={onClose} className="terms-modal-close" aria-label="Close">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="terms-modal-body">
            {loading ? (
              <div className="terms-modal-spinner">
                <div></div>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
          
          {/* Footer */}
          <div className="terms-modal-footer">
            <button onClick={onClose} className="terms-modal-close-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to document.body to escape any container constraints
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default TermsPrivacyModal;