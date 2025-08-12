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
        
        {/* Modal - responsive sizing */}
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
          style={{
            animation: 'slideUp 0.4s ease-out forwards',
            animationDelay: '0.2s',
            transform: 'translateY(20px)',
            opacity: 0,
            maxHeight: '90vh',
            overflow: 'auto'
          }}
        >
          {/* Header with gradient - reduced padding on mobile */}
          <div 
            className="relative py-4 sm:py-6 text-center"
            style={{
              background: 'linear-gradient(135deg, #1a2744 0%, #3c305b 50%, #6e4376 100%)'
            }}
          >
            <img src={alcorLogo} alt="Alcor" className="h-10 sm:h-12 w-auto mb-2 sm:mb-3 mx-auto" />
            <h2 className="text-xl sm:text-2xl font-light text-white px-4">
              Welcome to the Alcor Member Portal!
            </h2>
          </div>
          
          {/* Content - responsive padding */}
          <div className="px-6 sm:px-12 py-6 sm:py-8 text-center">
            {isApplicant && requiresInfoCompletion ? (
              <>
                <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                  Congratulations on completing your membership signup! As a cryopreservation member applicant, 
                  there are important details we need to complete your cryopreservation contract.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Action Required</h3>
                  <p className="text-gray-700 mb-2 text-xs sm:text-sm">
                    Please complete your member information including:
                  </p>
                  <ul className="space-y-1 sm:space-y-1.5 text-gray-700 text-xs sm:text-sm">
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
                <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                  Your portal provides many things you need to manage your Alcor membership.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg text-center">
                    New Features Available
                  </h3>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 lg:gap-x-12 gap-y-1.5 sm:gap-y-2 text-left">
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2 text-sm sm:text-base">•</span>
                        <span className="text-xs sm:text-sm lg:text-base">Membership status</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2 text-sm sm:text-base">•</span>
                        <span className="text-xs sm:text-sm lg:text-base">Your information</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2 text-sm sm:text-base">•</span>
                        <span className="text-xs sm:text-sm lg:text-base">Your member files</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2 text-sm sm:text-base">•</span>
                        <span className="text-xs sm:text-sm lg:text-base">Video testimony</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2 text-sm sm:text-base">•</span>
                        <span className="text-xs sm:text-sm lg:text-base">Recent Alcor news</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-600 mr-2 text-sm sm:text-base">•</span>
                        <span className="text-xs sm:text-sm lg:text-base">View invoices</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs sm:text-sm text-gray-600 italic mt-6 sm:mt-7 mb-0">
                    And much more!
                  </p>
                </div>
                
                <p className="text-gray-600 text-xs sm:text-sm mt-3 sm:mt-4">
                  The member portal is new! If you discover any issues, please let us know at support@alcor.org
                </p>
              </>
            )}
          </div>
          
          {/* Footer - responsive padding and layout */}
          <div className="bg-gray-50 px-6 sm:px-12 py-4 sm:py-6">
            {isApplicant && requiresInfoCompletion ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleGoToMyInfo}
                  className="flex-1 bg-[#1e293b] text-white py-2.5 px-4 sm:px-6 rounded-full font-normal hover:bg-[#0f172a] transition-all duration-300 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl group text-xs sm:text-sm"
                >
                  <img 
                    src={alcorStar} 
                    alt="" 
                    className="h-4 sm:h-5 w-4 sm:w-5 group-hover:rotate-180 transition-transform duration-500" 
                  />
                  Complete My Information
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 sm:px-6 rounded-full font-normal hover:bg-gray-50 transition-all duration-300 text-xs sm:text-sm"
                >
                  I'll Do This Later
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={handleClose}
                  className="bg-[#1e293b] text-white py-2.5 px-12 sm:px-16 rounded-full font-normal hover:bg-[#0f172a] transition-all duration-300 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl group text-xs sm:text-sm"
                >
                  <img 
                    src={alcorStar} 
                    alt="" 
                    className="h-4 sm:h-5 w-4 sm:w-5 group-hover:rotate-180 transition-transform duration-500" 
                  />
                  Get Started
                </button>
              </div>
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