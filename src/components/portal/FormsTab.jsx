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
      title: "Essential Membership Forms",
      icon: FileText,
      description: "Core forms for Alcor membership",
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
      title: "Medical & Legal Forms",
      icon: Shield,
      description: "Legal forms for healthcare decisions",
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
      title: "Future Planning Forms",
      icon: Clock,
      description: "Forms for revival preferences",
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

  // Flatten all forms into a single array
  const allForms = formCategories.flatMap(category => 
    category.forms.map(form => ({
      ...form,
      categoryTitle: category.title,
      categoryIcon: category.icon
    }))
  );

  return (
    <div className="forms-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-full md:pl-2">
      {/* Mobile: Single Box Container */}
      <div className="sm:hidden">
        <div className="bg-white shadow-sm border border-[#6e4376] rounded-[1.5rem] overflow-hidden slide-in">
          {/* Header */}
          <div className="px-6 py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md mt-2">
              <FileText className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Forms & Documents
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          {/* Description */}
          <div className="p-8 pb-8 border-b border-gray-100">
            <p className="text-gray-600 text-sm leading-relaxed">
              Essential forms and documents for your Alcor membership. Download, complete, and submit these forms to ensure your cryopreservation arrangements are properly documented.
            </p>
          </div>

          {/* Forms List - Inside the same box on mobile */}
          {allForms.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
              </div>
              <p className="text-gray-500 text-lg font-normal">No forms available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 stagger-in">
              {allForms.map((form, index) => {
                const IconComponent = form.categoryIcon;
                return (
                  <div
                    key={index}
                    className="p-8 pb-12 hover:bg-gray-50/50 transition-all"
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-full border-2 border-yellow-400 bg-white flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base text-gray-900 mb-1 font-semibold">
                          {form.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">{form.description}</p>
                        <p className="text-xs text-gray-400 mb-3">{form.categoryTitle}</p>
                        
                        <button
                          onClick={() => handleDownload(form.fileName)}
                          disabled={downloading[form.fileName]}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloading[form.fileName] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: Separated Boxes */}
      <div className="hidden sm:block">
        {/* Header Section */}
        <div className="mb-0 sm:mb-10">
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden slide-in sm:rounded-b-none">
            <div className="px-6 py-5" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
              <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
                <FileText className="w-5 h-5 text-white drop-shadow-sm mr-3" />
                Forms & Documents
                <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
              </h2>
            </div>

            {/* Description */}
            <div className="p-4 md:p-6 md:pl-4 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
                    Essential forms and documents for your Alcor membership. Download, complete, and submit these forms to ensure your cryopreservation arrangements are properly documented. 
                    You can upload completed forms in the Member Files section of your portal.
                  </p>
                </div>
                {/* Image - right side */}
                <div className="relative w-full lg:w-64 h-32 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                  <img 
                    src={formsHeaderImage} 
                    alt="Forms" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0">
                    <div className="px-3 py-1.5" style={{
                      background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                    }}>
                      <p className="text-white font-medium text-xs tracking-wider">
                        Member Forms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-t-0 overflow-hidden slide-in-delay-1 mt-0 rounded-t-none">
          {allForms.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
              </div>
              <p className="text-gray-500 text-lg font-normal">No forms available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 stagger-in">
              {allForms.map((form, index) => {
                const IconComponent = form.categoryIcon;
                return (
                  <div
                    key={index}
                    className="px-6 py-5 md:px-8 md:py-6 hover:bg-gray-50/50 transition-all"
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 md:w-12 md:h-12 rounded-full border-2 border-yellow-400 bg-white flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-7 h-7 md:w-6 md:h-6 text-[#404060] stroke-[#404060]" fill="none" strokeWidth="2" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-base text-gray-900 mb-1 font-semibold">
                              {form.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-1">{form.description}</p>
                            <p className="text-xs text-gray-400">{form.categoryTitle}</p>
                          </div>
                          
                          <button
                            onClick={() => handleDownload(form.fileName)}
                            disabled={downloading[form.fileName]}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading[form.fileName] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormsTab;