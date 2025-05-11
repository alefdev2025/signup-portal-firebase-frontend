// File: components/modals/TermsPrivacyModal.jsx
import React, { useEffect, useState } from "react";
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
  
  // Alcor brand colors
  const alcorBlue = "#0c2340";
  const alcorYellow = "#ffcb05";
  
  return (
    // Fixed overlay covering the entire screen with a backdrop
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Semi-transparent backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"></div>
      
      {/* Modal container */}
      <div className="relative flex min-h-screen items-center justify-center p-4">
        {/* Modal content */}
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          {/* Header with purple gradient and logo */}
          <div 
            className="flex items-center justify-between rounded-t-lg px-6 py-4"
            style={{
              background: 'linear-gradient(90deg, #6f2d74 0%, #8a4099 100%)'
            }}
          >
            <div className="flex items-center">
              <img src={alcorLogo} alt="Alcor Logo" className="h-10 mr-4" />
              <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content area with scrolling */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                {/* Render HTML content */}
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            )}
          </div>
          
          {/* Footer with close button - Using Alcor blue */}
          <div className="border-t border-gray-200 p-6 flex justify-end">
            <button
              onClick={onClose}
              style={{ backgroundColor: alcorBlue }}
              className="px-6 py-2 rounded-full text-white font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPrivacyModal;