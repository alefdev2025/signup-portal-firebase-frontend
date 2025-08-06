import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortalWelcomeStatus, markPortalWelcomeShown } from '../../services/contact';
import alcorLogo from '../../assets/images/alcor-white-logo.png';
import alcorStar from '../../assets/images/alcor-star.png';

const WelcomeOverlay = ({ onClose }) => {
  const [welcomeData, setWelcomeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const status = await getPortalWelcomeStatus();
      
      if (status.success && !status.portalWelcomeShown) {
        setWelcomeData(status);
        // Add a small delay to ensure the Overview tab is rendered first
        setTimeout(() => {
          setShowOverlay(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error checking welcome status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setShowOverlay(false);
    await markPortalWelcomeShown();
    if (onClose) onClose();
  };

  const handleGoToMyInfo = async () => {
    setShowOverlay(false);
    await markPortalWelcomeShown();
    // Use the tab change handler to navigate
    window.location.hash = 'membership-myinfo';
    if (onClose) onClose();
  };

  if (isLoading || !showOverlay) return null;

  const isApplicant = welcomeData?.isApplicant;
  const requiresInfoCompletion = welcomeData?.requiresInfoCompletion;

  return (
    <>
      {/* Full screen overlay with high z-index */}
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ 
          animation: 'fadeIn 0.3s ease-out forwards',
          animationDelay: '0.1s',
          opacity: 0
        }}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal - narrower */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          style={{
            animation: 'slideUp 0.4s ease-out forwards',
            animationDelay: '0.2s',
            transform: 'translateY(20px)',
            opacity: 0,
            maxHeight: '85vh',
            overflow: 'auto'
          }}
        >
          {/* Header with gradient - centered content */}
          <div 
            className="relative py-6 text-center"
            style={{
              background: 'linear-gradient(135deg, #1a2744 0%, #3c305b 50%, #6e4376 100%)'
            }}
          >
            <img src={alcorLogo} alt="Alcor" className="h-12 w-auto mb-3 mx-auto" />
            <h2 className="text-2xl font-light text-white">
              Welcome to the Alcor Member Portal!
            </h2>
          </div>
          
          {/* Content - center aligned */}
          <div className="px-12 py-8 text-center">
            {isApplicant && requiresInfoCompletion ? (
              <>
                <p className="text-gray-700 mb-6 text-base">
                  Congratulations on completing your membership signup! As a cryopreservation member applicant, 
                  there are important details we need to complete your cryopreservation contract.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">Action Required</h3>
                  <p className="text-gray-700 mb-2 text-sm">
                    Please complete your member information including:
                  </p>
                  <ul className="space-y-1.5 text-gray-700 text-sm">
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Medical history and conditions
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Emergency contacts
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      Legal documentation
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700 mb-6 text-base">
                  Your portal provides everything you need to manage your Alcor membership.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg text-center">New Features Available</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 pl-4">
                    <div className="flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-sm">Membership status</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-sm">Your information</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-sm">Your member files</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-sm">Video testimony</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-sm">Most recent Alcor news</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-purple-600 mr-2">•</span>
                      <span className="text-sm">View invoices</span>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 italic mt-3">And much more!</p>
                </div>
                
                <p className="text-gray-600 text-sm mt-4">
                  The member portal is new! If you discover any issues, please let us know at feedback@alcor.org
                </p>
              </>
            )}
          </div>
          
          {/* Footer - increased padding */}
          <div className="bg-gray-50 px-12 py-6 flex gap-4">
            {isApplicant && requiresInfoCompletion ? (
              <>
                <button
                  onClick={handleGoToMyInfo}
                  className="flex-1 bg-[#1e293b] text-white py-2.5 px-6 rounded-full font-normal hover:bg-[#0f172a] transition-all duration-300 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl group text-sm"
                >
                  <img 
                    src={alcorStar} 
                    alt="" 
                    className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" 
                  />
                  Complete My Information
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 px-6 rounded-full font-normal hover:bg-gray-50 transition-all duration-300 text-sm"
                >
                  I'll Do This Later
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="w-full bg-[#1e293b] text-white py-2.5 px-6 rounded-full font-normal hover:bg-[#0f172a] transition-all duration-300 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl group text-sm"
              >
                <img 
                  src={alcorStar} 
                  alt="" 
                  className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" 
                />
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default WelcomeOverlay;