import React, { useState, useEffect } from 'react';
import { Download, FileText, Shield, Clock, ExternalLink } from 'lucide-react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';
import alcorStar from '../../assets/images/alcor-star.png';
import formsHeaderImage from '../../assets/images/forms-image.jpg';

const FormsTab = () => {
  // Hardcoded wider setting - set to true to make desktop content 20% wider
  const wider = false;
  
  const [downloading, setDownloading] = useState({});
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Preload images in background (non-blocking)
  useEffect(() => {
    const preloadImage = (src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    };
    
    // Preload images but don't block rendering
    preloadImage(alcorStar);
    preloadImage(formsHeaderImage);
  }, []);

  // Add Helvetica font and scroll animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .forms-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .forms-tab .font-bold,
      .forms-tab .font-semibold {
        font-weight: 500 !important;
      }
      .forms-tab .font-bold {
        font-weight: 700 !important;
      }
      .forms-tab h1 {
        font-weight: 300 !important;
      }
      .forms-tab h2,
      .forms-tab h3,
      .forms-tab h4 {
        font-weight: 400 !important;
      }
      .forms-tab .font-medium {
        font-weight: 400 !important;
      }
      .forms-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .forms-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .forms-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .forms-tab .slide-in-delay-2 {
        animation: slideIn 0.6s ease-out 0.2s both;
      }
      .forms-tab .slide-in-delay-3 {
        animation: slideIn 0.6s ease-out 0.3s both;
      }
      .forms-tab .stagger-in > * {
        opacity: 0;
        animation: slideIn 0.5s ease-out forwards;
      }
      .forms-tab .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .forms-tab .stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .forms-tab .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .forms-tab .stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      .forms-tab .stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
      
      /* Scroll-triggered animations */
      .forms-tab .scroll-fade-in {
        opacity: 0;
        transition: opacity 1s ease-out;
      }
      .forms-tab .scroll-fade-in.visible {
        opacity: 1;
      }
      .forms-tab .scroll-slide-up {
        opacity: 0;
        transform: translateY(15px);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .forms-tab .scroll-slide-up.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .forms-tab .scroll-slide-left {
        opacity: 0;
        transform: translateX(15px);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .forms-tab .scroll-slide-left.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .forms-tab .scroll-scale {
        opacity: 0;
        transform: scale(0.98);
        transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .forms-tab .scroll-scale.visible {
        opacity: 1;
        transform: scale(1);
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

    // Observe all elements with scroll animation classes
    const elements = document.querySelectorAll('.scroll-fade-in, .scroll-slide-up, .scroll-slide-left, .scroll-scale');
    elements.forEach(el => {
      if (el.id) observer.observe(el);
    });

    return () => {
      elements.forEach(el => {
        if (el.id) observer.unobserve(el);
      });
    };
  }, []);

  const handleDownload = async (fileName) => {
    try {
      if (!auth.currentUser) {
        alert('Please log in to download documents');
        return;
      }
  
      setDownloading(prev => ({ ...prev, [fileName]: true }));
  
      // For Safari: Open window immediately to preserve user gesture
      const newWindow = window.open('', '_blank');
      
      let fileRef;
      let url;
      let downloadSuccessful = false;
  
      try {
        // Try documents/forms path first
        fileRef = ref(storage, `documents/forms/${fileName}`);
        url = await getDownloadURL(fileRef);
        downloadSuccessful = true;
      } catch (firstError) {
        console.log(`File not found in documents/forms/, trying root level for: ${fileName}`);
        
        try {
          // Try root level
          fileRef = ref(storage, fileName);
          url = await getDownloadURL(fileRef);
          downloadSuccessful = true;
        } catch (secondError) {
          if (newWindow) newWindow.close();
          throw secondError;
        }
      }
  
      if (downloadSuccessful && url) {
        if (newWindow) {
          // For Safari: Navigate the already-opened window
          newWindow.location.href = url;
        } else {
          // Fallback for other browsers or if popup was blocked
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          // Clean up after a short delay
          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);
        }
        
        console.log(`Successfully opened ${fileName}`);
      }
  
    } catch (error) {
      console.error('Download error:', error);
      
      // Your existing error handling...
      if (error.code === 'storage/object-not-found') {
        alert(`File not found: ${fileName}. Please contact support.`);
      } else if (error.code === 'storage/unauthorized') {
        alert('You do not have permission to download this file. Please ensure you are logged in.');
      } else {
        alert('Failed to open file. Please try again later.');
      }
    } finally {
      setDownloading(prev => ({ ...prev, [fileName]: false }));
    }
  };

  const handleOpenLink = (url) => {
    window.open(url, '_blank');
  };

  const formCategories = [
    {
      title: "Medical & Legal",
      icon: Shield,
      description: "Legal documents that ensure your cryopreservation wishes are respected. These forms provide critical medical directives and legal authority for your preservation.",
      forms: [
        {
          title: "Advance Directive & Power of Attorney",
          description: "Cryonics-specific legal documents for end-of-life medical decisions.",
          fileName: "POA - HealthCare Directive.docx",
          pages: 8
        },
        {
          title: "Check-In Service Enrollment",
          description: "Alcor Member Calls Agreement",
          fileName: "AlcorSubscriberAgreement.pdf",
          pages: 12
        }
      ]
    },
    {
      title: "Surveys",
      icon: FileText,
      description: "Health and personal information surveys for cryopreservation preparation. These help Alcor understand your medical history and preservation needs.",
      forms: [
        {
          title: "Alcor Health Survey 2024",
          description: "Health information form for cryopreservation preparation.",
          fileName: "Health Survey.pdf",
          pages: 3
        },
        {
          title: "Member Readiness Survey",
          description: "Help us improve our services by sharing your feedback.",
          link: "https://forms.office.com/Pages/ResponsePage.aspx?id=HMGj6sPh2U6GWDZglGgy2JNBhl79sWRFqRu60bw6hVRUQ1pSSkpPNTNFSzVFWTFITUFLVjhZU0NKMi4u",
          isExternal: true
        }
      ]
    },
    {
      title: "Future Planning",
      icon: Clock,
      description: "Documents for expressing your preferences about revival and future care. Help guide decisions about when and how you might be revived in the future.",
      forms: [
        {
          title: "Revival Preferences Form",
          description: "Document your wishes for revival timing and coordination.",
          fileName: "Statement of Revival Preferences.docx",
          pages: 4
        }
      ]
    }
  ];

  // Container classes that change based on wider setting
  const containerClasses = wider 
    ? "forms-tab w-full -mx-10"
    : "forms-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4";

  return (
    <div className={containerClasses}>
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Mobile: Single Column Layout */}
      <div className="sm:hidden">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden slide-in mx-4" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          {/* Header Image */}
          {formsHeaderImage && (
            <div className="relative h-32 sm:h-40 lg:h-48 overflow-hidden">
              <img 
                src={formsHeaderImage} 
                alt="Forms & Documents"
                className="w-full h-full object-cover grayscale"
              />
            </div>
          )}
          
          <div className="px-4 sm:px-6 py-4 sm:py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-base sm:text-lg 2xl:text-xl font-medium text-white flex items-center drop-shadow-md">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm mr-2 sm:mr-3" />
              Forms & Documents
              <img src={alcorStar} alt="" className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            </h2>
          </div>

          {/* Description */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 lg:py-10 border-b border-gray-100">
            <p className="text-gray-700 text-[11px] sm:text-sm 2xl:text-base leading-relaxed font-normal">
              Essential forms and documents for your Alcor membership. Download, complete, and submit these forms to ensure your cryopreservation arrangements are properly documented.
            </p>
          </div>
        </div>

        {/* Category Sections */}
        {formCategories.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <React.Fragment key={categoryIndex}>
              {categoryIndex > 0 && (
                <div className="py-6 sm:py-8 px-8">
                  <div className="h-px rounded-full bg-gray-200"></div>
                </div>
              )}
              <div className={`bg-white shadow-sm rounded-xl overflow-hidden slide-in-delay-${categoryIndex + 1} ${categoryIndex === 0 ? 'mt-6' : ''} mx-4`} style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              {/* Category Header */}
              <div className="px-4 sm:px-6 py-6 sm:py-8 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 lg:p-3.5 rounded-lg transform transition duration-300 mr-2" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                    {categoryIndex === 0 && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {categoryIndex === 1 && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {categoryIndex === 2 && (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base 2xl:text-lg font-semibold text-gray-900">{category.title}</h3>
                </div>
              </div>

              {/* Forms List */}
              <div className="divide-y divide-gray-200 stagger-in">
                {category.forms.map((form, formIndex) => (
                  <div
                    key={formIndex}
                    className="px-6 py-10 hover:bg-gray-50/50 transition-all"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      {form.title}
                    </h4>
                    <p className="text-xs text-gray-700 mb-4 font-normal">{form.description}</p>
                    
                    {form.isExternal ? (
                      <button
                        onClick={() => handleOpenLink(form.link)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Open Survey</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(form.fileName)}
                        disabled={downloading[form.fileName]}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloading[form.fileName] ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Desktop: Separated Category Boxes */}
      <div className="hidden sm:block">
        {/* Category Sections */}
        {formCategories.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <React.Fragment key={categoryIndex}>
              {categoryIndex > 0 && (
                <div className="py-8">
                  <div className="h-[0.5px] mx-8 rounded-full opacity-60" style={{ 
                    background: 'linear-gradient(90deg, transparent 0%, #4a5f7a 15%, #5a4f7a 40%, #7a5f8a 60%, #9e7398 85%, transparent 100%)' 
                  }}></div>
                </div>
              )} 
              <div className={`bg-white shadow-sm border border-gray-200 rounded-[1.25rem] scroll-slide-up ${visibleSections.has(`form-category-${categoryIndex}`) ? 'visible' : ''}`} id={`form-category-${categoryIndex}`} style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              {/* Category Header with Image */}
              <div className={`${wider ? 'p-10' : 'p-8 2xl:p-10'} border-b border-gray-100`}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Text content - left side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 2xl:p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                        {categoryIndex === 0 && (
                          <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {categoryIndex === 1 && (
                          <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {categoryIndex === 2 && (
                          <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900">{category.title}</h3>
                    </div>
                    <p className={`text-gray-700 text-sm 2xl:text-base leading-relaxed font-normal ${wider ? 'max-w-3xl' : 'max-w-xl'}`}>
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Category Image - right side (if you have images for each category) */}
                  {categoryIndex === 0 && formsHeaderImage && (
                    <div className={`relative w-full ${wider ? 'lg:w-96' : 'lg:w-72 2xl:w-80'} h-40 2xl:h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0 scroll-slide-up ${visibleSections.has(`form-image-${categoryIndex}`) ? 'visible' : ''}`} id={`form-image-${categoryIndex}`} style={{ transitionDelay: '0.2s' }}>
                      <img 
                        src={formsHeaderImage} 
                        alt="Forms"
                        className="w-full h-full object-cover grayscale"
                      />
                      <div className="absolute bottom-0 right-0">
                        <div className="px-3 2xl:px-4 py-1.5 2xl:py-2" style={{
                          background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                        }}>
                          <p className="text-white font-medium text-xs 2xl:text-sm tracking-wider flex items-center gap-1">
                            Member Forms
                            <img src={alcorStar} alt="" className="w-3 h-3 2xl:w-4 2xl:h-4" />
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Forms Grid */}
              <div className={`${wider ? 'p-8' : 'p-6 2xl:p-8'} scroll-fade-in ${visibleSections.has(`form-grid-${categoryIndex}`) ? 'visible' : ''}`} id={`form-grid-${categoryIndex}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
                  {category.forms.map((form, formIndex) => (
                    <div
                      key={formIndex}
                      className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 mb-1">
                            {form.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2 font-normal">{form.description}</p>
                          {form.pages && <p className="text-xs text-gray-500">{form.pages} pages</p>}
                        </div>
                        
                        {form.isExternal ? (
                          <button
                            onClick={() => handleOpenLink(form.link)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Open Survey</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDownload(form.fileName)}
                            disabled={downloading[form.fileName]}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {downloading[form.fileName] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Download</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Add padding at the end */}
      <div className="h-24 sm:h-32"></div>
    </div>
  );
};

export default FormsTab;