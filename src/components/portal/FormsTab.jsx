import React, { useState, useEffect } from 'react';
import { Download, FileText, Shield, Clock } from 'lucide-react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';
import alcorStar from '../../assets/images/alcor-star.png';
import formsHeaderImage from '../../assets/images/forms-image.jpg';

const FormsTab = () => {
  const [downloading, setDownloading] = useState({});

  // Add Helvetica font
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

  const handleDownload = async (fileName) => {
    try {
      if (!auth.currentUser) {
        alert('Please log in to download documents');
        return;
      }

      setDownloading(prev => ({ ...prev, [fileName]: true }));

      const fileRef = ref(storage, `documents/forms/${fileName}`);
      const url = await getDownloadURL(fileRef);

      window.open(url, '_blank');

      console.log(`Successfully opened ${fileName} in new tab`);
    } catch (error) {
      console.error('Download error:', error);
      
      if (error.code === 'storage/object-not-found') {
        alert(`File not found: ${fileName}. Please contact support.`);
      } else if (error.code === 'storage/unauthorized') {
        alert('You do not have permission to download this file. Please ensure you are logged in.');
      } else if (error.code === 'storage/canceled') {
        alert('Download was canceled.');
      } else if (error.code === 'storage/unknown') {
        alert('An unknown error occurred. Please try again.');
      } else {
        alert('Failed to open file. Please try again later.');
      }
    } finally {
      setDownloading(prev => ({ ...prev, [fileName]: false }));
    }
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

  return (
    <div className="forms-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
      {/* Mobile: Single Column Layout */}
      <div className="sm:hidden">
        {/* Header */}
        <div className="bg-white shadow-md border border-gray-400 rounded-[1.5rem] overflow-hidden slide-in mx-4" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
          <div className="px-6 py-6 rounded-t-[1.5rem]" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
              <FileText className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Forms & Documents
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          {/* Description */}
          <div className="px-8 py-10 border-b border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed font-normal">
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
                <div className="py-8 px-8">
                  <div className="h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #4a5f7a 0%, #5a4f7a 40%, #7a5f8a 70%, #9e7398 100%)' }}></div>
                </div>
              )}
              <div className={`bg-white shadow-md border border-gray-400 rounded-[1.5rem] overflow-hidden slide-in-delay-${categoryIndex + 1} ${categoryIndex === 0 ? 'mt-6' : ''} mx-4`} style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              {/* Category Header */}
              <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg transform transition duration-300 mr-2" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                    {categoryIndex === 0 && (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {categoryIndex === 1 && (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {categoryIndex === 2 && (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{category.title}</h3>
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
                <div className="py-10">
                  <div className="h-1 mx-8 rounded-full" style={{ background: 'linear-gradient(90deg, #4a5f7a 0%, #5a4f7a 40%, #7a5f8a 70%, #9e7398 100%)' }}></div>
                </div>
              )}
              <div className={`bg-white shadow-sm border border-gray-200 rounded-[1.25rem] slide-in-delay-${categoryIndex + 1}`} style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
              {/* Category Header with Image */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Text content - left side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                        {categoryIndex === 0 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {categoryIndex === 1 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                        {categoryIndex === 2 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed max-w-xl font-normal">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Category Image - right side (if you have images for each category) */}
                  {categoryIndex === 0 && formsHeaderImage && (
                    <div className="relative w-full lg:w-80 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <img 
                        src={formsHeaderImage} 
                        alt="Forms"
                        className="w-full h-full object-cover grayscale"
                      />
                      <div className="absolute bottom-0 right-0">
                        <div className="px-4 py-2" style={{
                          background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                        }}>
                          <p className="text-white font-medium text-sm tracking-wider flex items-center gap-1">
                            Member Forms
                            <img src={alcorStar} alt="" className="w-4 h-4" />
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Forms Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
                  {category.forms.map((form, formIndex) => (
                    <div
                      key={formIndex}
                      className="p-5 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 mb-1">
                            {form.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2 font-normal">{form.description}</p>
                          <p className="text-xs text-gray-500">{form.pages} pages</p>
                        </div>
                        
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
    </div>
  );
};

export default FormsTab;