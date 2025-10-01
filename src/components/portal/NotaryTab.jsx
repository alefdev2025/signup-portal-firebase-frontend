import React, { useState, useEffect } from 'react';
import { Calendar, FileCheck } from 'lucide-react';
import alcorStar from '../../assets/images/alcor-star.png';
import notaryHeaderImage from '../../assets/images/forms-image.png';

const NotaryTab = () => {
  // Hardcoded wider setting - set to true to make desktop content 20% wider
  const wider = false;
  
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Preload images in background (non-blocking)
  useEffect(() => {
    const preloadImage = (src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    };
    
    preloadImage(alcorStar);
    preloadImage(notaryHeaderImage);
  }, []);

  // Add Helvetica font and scroll animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .notary-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 400 !important;
      }
      .notary-tab .font-bold,
      .notary-tab .font-semibold {
        font-weight: 500 !important;
      }
      .notary-tab h1 {
        font-weight: 400 !important;
      }
      .notary-tab h2,
      .notary-tab h3,
      .notary-tab h4 {
        font-weight: 500 !important;
      }
      .notary-tab .font-medium {
        font-weight: 500 !important;
      }
      .notary-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .notary-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .notary-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      
      /* Scroll-triggered animations */
      .notary-tab .scroll-fade-in {
        opacity: 0;
        transition: opacity 1s ease-out;
      }
      .notary-tab .scroll-fade-in.visible {
        opacity: 1;
      }
      .notary-tab .scroll-slide-up {
        opacity: 0;
        transform: translateY(15px);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .notary-tab .scroll-slide-up.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Set up intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-fade-in, .scroll-slide-up');
    elements.forEach(el => {
      if (el.id) observer.observe(el);
    });

    return () => {
      elements.forEach(el => {
        if (el.id) observer.unobserve(el);
      });
    };
  }, []);

  const handleScheduleNotary = () => {
    window.open('https://calendly.com/alcor/online-notary-sign-up', '_blank');
  };

  const witnessRequirements = [
    "At least 18 years old",
    "Be of sound mind",
    "Be a neutral third-party (not a family member, beneficiary, agent, or a spouse of the beneficiary or agent)",
    "Have a valid ID",
    "Provide contact information on the document"
  ];

  const containerClasses = wider 
    ? "notary-tab w-full -mx-10"
    : "notary-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4";

  return (
    <div className={containerClasses}>
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Mobile: Single Column Layout */}
      <div className="sm:hidden">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden slide-in mx-4" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          {notaryHeaderImage && (
            <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
              <img 
                src={notaryHeaderImage} 
                alt="Online Notary Services"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          )}
          
          <div className="px-4 sm:px-6 py-4 sm:py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-base sm:text-lg 2xl:text-xl font-medium text-white flex items-center drop-shadow-md">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm mr-2 sm:mr-3" />
              Online Notary Services
              <img src={alcorStar} alt="" className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 lg:py-10">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Authorization to Donate Remains and Consent for Cryopreservation Agreements</h3>
            
            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              The Authorization to Donate Remains and Consent for Cryopreservation Agreements is one of the most important parts of the contract, but often one of the last items to be completed. This document is handed to healthcare staff to show we have the right to take possession of remains after death.
            </p>

            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              If you have already signed this agreement in the past, do not worry! We will continue to use the one we have on file in case of emergency. We will still need an updated agreement signed because it offers better legal protection for you and for Alcor.
            </p>

            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              <span className="font-semibold">For California/International:</span> Your location does not require this document to be notarized, but it is recommended for better legal protection. This document still requires two witnesses.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-gray-900 mb-2">A valid witness must meet the following criteria:</p>
              <ul className="space-y-2">
                {witnessRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-6">Online Notary <span className="text-sm font-semibold text-gray-600">(Only for US members at this time)</span></h3>
            
            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              In-person notary is still the gold standard for these documents, however Alcor offers online notary services for convenience. All notaries provided by Alcor have an additional online notary certification.
            </p>

            <p className="text-xs text-gray-700 leading-relaxed mb-6">
              We offer online notary sessions with other Alcor members where all attendees witness each other's documents. These only take 30-45 minutes. If you would like to schedule an online notary session, please schedule here:
            </p>

            <button
              onClick={handleScheduleNotary}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#12243c] hover:bg-[#1a2f4a] rounded-lg transition-all duration-200 my-6"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Online Notary Session</span>
            </button>

            <p className="text-[10px] text-gray-600">
              More times are frequently added as we get volunteer witnesses as backup. If you already have witnesses that are willing to do an online notary session, please let us know so we can set up a time that works for you.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className={`bg-white shadow-sm border border-gray-200 rounded-[1.25rem] scroll-slide-up ${visibleSections.has('notary-main') ? 'visible' : ''}`} id="notary-main" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          {/* Header */}
          <div className={`${wider ? 'p-10' : 'p-8 2xl:p-10'} border-b border-gray-100`}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 2xl:p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                    <FileCheck className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900">Notary Services</h3>
                </div>
                <p className={`text-gray-700 text-sm 2xl:text-base leading-relaxed font-normal ${wider ? 'max-w-3xl' : 'max-w-2xl'}`}>
                  Schedule online notary services for your cryopreservation agreements. Complete your Authorization to Donate Remains document with our certified notaries and member witnesses.
                </p>
              </div>
              
              {notaryHeaderImage && (
                <div className={`relative w-full ${wider ? 'lg:w-96' : 'lg:w-72 2xl:w-80'} h-40 2xl:h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0 scroll-slide-up ${visibleSections.has('notary-image') ? 'visible' : ''}`} id="notary-image" style={{ transitionDelay: '0.2s' }}>
                  <img 
                    src={notaryHeaderImage} 
                    alt="Notary Services"
                    className="w-full h-full object-cover grayscale"
                  />
                  <div className="absolute bottom-0 right-0">
                    <div className="px-3 2xl:px-4 py-1.5 2xl:py-2" style={{
                      background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                    }}>
                      <p className="text-white font-medium text-xs 2xl:text-sm tracking-wider flex items-center gap-1">
                        Notary Services
                        <img src={alcorStar} alt="" className="w-3 h-3 2xl:w-4 2xl:h-4" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className={`${wider ? 'p-8' : 'p-6 2xl:p-8'} scroll-fade-in ${visibleSections.has('notary-content') ? 'visible' : ''}`} id="notary-content">
            <h4 className="text-base 2xl:text-lg font-bold text-gray-900 mb-4">Authorization to Donate Remains and Consent for Cryopreservation Agreements</h4>
            
            <p className="text-sm 2xl:text-base text-gray-700 leading-relaxed mb-4">
              The Authorization to Donate Remains and Consent for Cryopreservation Agreements is one of the most important parts of the contract, but often one of the last items to be completed. This document is handed to healthcare staff to show we have the right to take possession of remains after death.
            </p>

            <p className="text-sm 2xl:text-base text-gray-700 leading-relaxed mb-4">
              If you have already signed this agreement in the past, do not worry! We will continue to use the one we have on file in case of emergency. We will still need an updated agreement signed because it offers better legal protection for you and for Alcor.
            </p>

            <p className="text-sm 2xl:text-base text-gray-700 leading-relaxed mb-6">
              <span className="font-semibold">For California/International:</span> Your location does not require this document to be notarized, but it is recommended for better legal protection. This document still requires two witnesses.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
              <p className="text-sm 2xl:text-base font-semibold text-gray-900 mb-4">A valid witness must meet the following criteria:</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {witnessRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <h4 className="text-base 2xl:text-lg font-semibold text-gray-900 mb-2">Online Notary <span className="text-base 2xl:text-lg font-semibold text-gray-600">(Only for US members at this time)</span></h4>
            
            <p className="text-sm 2xl:text-base text-gray-700 leading-relaxed mb-4">
              In-person notary is still the gold standard for these documents, however Alcor offers online notary services for convenience. All notaries provided by Alcor have an additional online notary certification.
            </p>

            <p className="text-sm 2xl:text-base text-gray-700 leading-relaxed mb-8">
              We offer online notary sessions with other Alcor members where all attendees witness each other's documents. These only take 30-45 minutes. If you would like to schedule an online notary session, please schedule here:
            </p>

            <button
              onClick={handleScheduleNotary}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#12243c] hover:bg-[#1a2f4a] rounded-lg transition-all duration-200 my-6"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Online Notary Session</span>
            </button>

            <p className="text-sm text-gray-600">
              More times are frequently added as we get volunteer witnesses as backup. If you already have witnesses that are willing to do an online notary session, please let us know so we can set up a time that works for you.
            </p>
          </div>
        </div>
      </div>
      
      {/* Add padding at the end */}
      <div className="h-24 sm:h-32"></div>
    </div>
  );
};

export default NotaryTab;