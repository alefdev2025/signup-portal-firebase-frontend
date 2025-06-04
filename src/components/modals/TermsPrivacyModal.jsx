// File: components/modals/TermsPrivacyModal.jsx - COMPLETE WORKING VERSION
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
        <p class="date">Ultimo renovatum: Mensis Maius 1, 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        
        <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
        
        <h2>2. Definitions and Terms</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
        
        <p>Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.</p>
        
        <h2>3. Service Usage</h2>
        <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.</p>
        
        <p>Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.</p>
      `;
    } else { // Privacy Policy
      return `
        <h1>Privacy Policy</h1>
        <p class="date">Ultimo renovatum: Mensis Maius 1, 2025</p>

        <h2>1. Introduction</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
        
        <h2>2. Information We Collect</h2>
        <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt:</p>
        
        <ul>
          <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li>
          <li>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</li>
          <li>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</li>
        </ul>
        
        <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
        
        <h2>3. How We Collect Information</h2>
        <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
        
        <p>Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.</p>
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
          padding: 20px;
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
          width: window.innerWidth <= 768 ? '95vw' : '65vw',
          maxWidth: '850px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(90deg, #6f2d74 0%, #8a4099 100%)',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={alcorLogo} alt="Alcor Logo" style={{ height: '40px', marginRight: '16px' }} />
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{title}</h2>
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
          padding: '32px 48px',
          backgroundColor: 'white'
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #6f2d74',
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
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin: 0 0 8px 0;
            }
            .modal-content h2 {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin: 24px 0 12px 0;
            }
            .modal-content p {
              font-size: 14px;
              line-height: 1.6;
              color: #4b5563;
              margin: 0 0 16px 0;
            }
            .modal-content .date {
              font-style: italic;
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 24px;
            }
            .modal-content ul {
              margin: 16px 0;
              padding-left: 24px;
            }
            .modal-content li {
              font-size: 14px;
              line-height: 1.6;
              color: #4b5563;
              margin-bottom: 8px;
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
              backgroundColor: '#6f2d74',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '9999px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(111, 45, 116, 0.3)',
              transition: 'all 0.2s ease',
              fontSize: '16px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#5a2460';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(111, 45, 116, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#6f2d74';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px rgba(111, 45, 116, 0.3)';
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