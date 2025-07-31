// File: components/modals/TermsPrivacyModal.jsx - NAVY VERSION
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import alcorLogo from "../../assets/images/alcor-white-logo-no-text.png";

const TermsPrivacyModal = ({ isOpen, onClose, type }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Title based on type
  const title = type === 'terms' ? 'Terms of Use' : 'Privacy Policy';
  
  // Effect to load content when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(getPlaceholderContent(type));
      setLoading(false);
    }
  }, [isOpen, type]);

  // Handle escape key and prevent body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Store the current scroll position and prevent scrolling
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isOpen) {
        // Restore scroll position
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen, onClose]);
  
  // Function to get placeholder content based on type
  const getPlaceholderContent = (type) => {
    if (type === 'terms') {
      return `
        <h1>Terms of Use</h1>
        <p class="date">Last Updated: July 29, 2025</p>

        <h2>1. Acceptance</h2>
        <p>By creating an account or applying for membership with Alcor Life Extension Foundation, you agree to these Terms of Use.</p>
        
        <h2>2. Account Information</h2>
        <p>You agree to provide accurate, current, and complete information during the application process and to keep this information updated.</p>
        
        <h2>3. Use of Information</h2>
        <p>Information you provide will be used to:</p>
        <ul>
          <li>Process your membership application</li>
          <li>Create and maintain your member file</li>
          <li>Communicate about your membership</li>
          <li>Provide member services</li>
        </ul>
        
        <h2>4. Security</h2>
        <p>You are responsible for maintaining the security of your account credentials and for all activities under your account.</p>
        
        <h2>5. Privacy</h2>
        <p>Your information will be handled according to our Privacy Policy. We do not sell or rent your personal information to third parties.</p>
      `;
    } else { // Privacy Policy
      return `
        <h1>Privacy Policy</h1>
        <p class="date">Last Updated: July 29, 2025</p>

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide when applying for membership, including:</p>
        <ul>
          <li>Name, email, phone, and address</li>
          <li>Account credentials</li>
          <li>Membership application details</li>
          <li>Payment information</li>
        </ul>
        
        <h2>2. How We Use Information</h2>
        <p>Your information is used to:</p>
        <ul>
          <li>Process membership applications</li>
          <li>Maintain member records</li>
          <li>Provide member services</li>
          <li>Send important updates</li>
          <li>Comply with legal requirements</li>
        </ul>
        
        <h2>3. Information Security</h2>
        <p>We use appropriate security measures to protect your personal information, including encryption and secure servers.</p>
        
        <h2>4. Your Rights</h2>
        <p>You have the right to access, update, or request deletion of your personal information. Contact us to exercise these rights.</p>
        
        <h2>5. Contact Us</h2>
        <p>For questions about privacy, contact us at:<br>
        Alcor Life Extension Foundation<br>
        7895 E. Acoma Dr., Suite 110<br>
        Scottsdale, AZ 85260<br>
        Phone: (480) 905-1906</p>
      `;
    }
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  const modalContent = (
    <div 
      className={`modal-backdrop ${isOpen ? 'modal-backdrop-open' : ''}`}
      onClick={onClose}
    >
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          padding: 16px;
          transition: background-color 200ms;
        }
        .modal-backdrop-open {
          background-color: rgba(0, 0, 0, 0.6);
        }
        .modal-content {
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 200ms, transform 200ms;
        }
        .modal-backdrop-open .modal-content {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
      
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: window.innerWidth <= 768 ? 'calc(100vw - 32px)' : '65vw',
          maxWidth: window.innerWidth <= 768 ? 'calc(100vw - 32px)' : '850px',
          height: 'auto',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
          margin: '0 auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          backgroundColor: '#262c4c',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={alcorLogo} alt="Alcor Logo" style={{ height: '48px', marginRight: '0' }} />
            <h2 style={{ margin: 0, fontSize: window.innerWidth <= 768 ? '18px' : '20px', fontWeight: 'bold', color: 'white', paddingTop: '12px' }}>{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            aria-label="Close"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: window.innerWidth <= 768 ? '20px 16px' : '32px 48px',
          backgroundColor: 'white'
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #262c4c',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          ) : (
            <div 
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#4b5563'
              }}
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          )}
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .modal-content h1 {
              font-size: ${window.innerWidth <= 768 ? '20px' : '24px'};
              font-weight: bold;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            .modal-content h2 {
              font-size: ${window.innerWidth <= 768 ? '16px' : '18px'};
              font-weight: 600;
              color: #374151;
              margin: ${window.innerWidth <= 768 ? '16px 0 8px 0' : '24px 0 12px 0'};
            }
            .modal-content p {
              font-size: ${window.innerWidth <= 768 ? '13px' : '14px'};
              line-height: 1.6;
              color: #4b5563;
              margin: 0 0 ${window.innerWidth <= 768 ? '12px' : '16px'} 0;
            }
            .modal-content .date {
              font-style: italic;
              color: #6b7280;
              font-size: ${window.innerWidth <= 768 ? '12px' : '14px'};
              margin-bottom: ${window.innerWidth <= 768 ? '16px' : '24px'};
            }
            .modal-content ul {
              margin: ${window.innerWidth <= 768 ? '12px 0' : '16px 0'};
              padding-left: ${window.innerWidth <= 768 ? '20px' : '24px'};
            }
            .modal-content li {
              font-size: ${window.innerWidth <= 768 ? '13px' : '14px'};
              line-height: 1.6;
              color: #4b5563;
              margin-bottom: ${window.innerWidth <= 768 ? '6px' : '8px'};
            }
            .modal-content strong {
              font-weight: 600;
              color: #374151;
            }
          `}</style>
        </div>
        
        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          padding: '24px',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f9fafb',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px'
        }}>
          <button 
            onClick={onClose} 
            style={{
              backgroundColor: '#262c4c',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '9999px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(38, 44, 76, 0.3)',
              transition: 'all 0.2s ease',
              fontSize: '16px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#1a1f33';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(38, 44, 76, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#262c4c';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px rgba(38, 44, 76, 0.3)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Portal to document.body
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default TermsPrivacyModal;