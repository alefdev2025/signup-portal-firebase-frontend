import React, { useState } from 'react';
import { Download, FileText, Shield, Clock } from 'lucide-react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';
import formsHeaderImage from '../../assets/images/forms-image.jpg'; // You may need to add this image
import pdfImage from '../../assets/images/pdf-image.png';

const FormsTab = () => {
  const [downloading, setDownloading] = useState({});

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

  // Flatten all forms into a single array for the grid
  const allForms = formCategories.flatMap(category => 
    category.forms.map(form => ({
      ...form,
      categoryTitle: category.title,
      categoryIcon: category.icon
    }))
  );

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen relative overflow-hidden">
      <div>
        {/* Forms Section */}
        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-xl p-8 animate-fadeInUp">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-12">
              {/* Text content - left side */}
              <div className="flex-1">
                <style>{`
                  .forms-title {
                    font-size: 1.375rem;
                  }
                  @media (min-width: 768px) {
                    .forms-title {
                      font-size: 1.875rem;
                    }
                  }
                `}</style>
                {/* Mobile gradient - shows above title */}
                <div className="mb-3 sm:hidden">
                  <div className="h-4 w-40" style={{
                    background: 'linear-gradient(to right, #0e0e2f 0%, #1b163a 8%, #2a1b3d 16%, #3f2541 25%, #5b2f4b 33%, #74384d 42%, #914451 50%, #a04c56 58%, #a25357 67%, #b66e5d 75%, #cb8863 83%, #d79564 100%)'
                  }}></div>
                </div>
                <h2 className="forms-title font-thin text-[#2a2346] mb-6 tracking-widest">FORMS</h2>
                <p className="text-gray-600 text-base leading-relaxed max-w-xl">
                  Essential forms and documents for your Alcor membership. 
                  Download, complete, and submit these forms to ensure your 
                  cryopreservation arrangements are properly documented.
                </p>
              </div>
              
              {/* Image - right side */}
              <div className="relative w-full lg:w-96 h-56 lg:h-48 rounded-lg overflow-hidden shadow-md">
                <img 
                  src={formsHeaderImage} 
                  alt="Forms" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 right-0">
                  <div className="px-3 py-1 sm:px-4 sm:py-2" style={{
                    background: 'linear-gradient(to right, #0e0e2f 0%, #1b163a 8%, #2a1b3d 16%, #3f2541 25%, #5b2f4b 33%, #74384d 42%, #914451 50%, #a04c56 58%, #a25357 67%, #b66e5d 75%, #cb8863 83%, #d79564 100%)'
                  }}>
                    <p className="text-white font-semibold text-sm sm:text-base tracking-wider">
                      Member Forms
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-10">
              {allForms.map((form, index) => {
                const IconComponent = form.categoryIcon;
                return (
                  <div 
                    key={index} 
                    className={`bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-300 group relative overflow-hidden flex flex-col h-32 animate-fadeIn ${
                      index < 3 ? 'animation-delay-100' : 
                      index < 6 ? 'animation-delay-200' : 
                      index < 9 ? 'animation-delay-300' : 
                      'animation-delay-400'
                    }`}
                  >
                    <div className="p-5 pb-3 pr-3 flex h-full">
                      <div className="flex-shrink-0 mr-4">
                        <img 
                          src={pdfImage} 
                          alt="PDF" 
                          className="w-16 h-20 object-contain"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-medium text-[#2a2346] text-base leading-tight">{form.title}</h3>
                          <p className="text-xs text-[#6a5b8a] mt-1 line-clamp-2">{form.description}</p>
                        </div>
                        
                        <button 
                          onClick={() => handleDownload(form.fileName)}
                          disabled={downloading[form.fileName]}
                          className="self-end mt-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          {downloading[form.fileName] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6b5b7e]"></div>
                              <span className="text-sm">Downloading...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span className="text-sm">Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Categories Info Section */}

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
            opacity: 0;
          }

          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
          }

          .animation-delay-100 {
            animation-delay: 100ms;
          }

          .animation-delay-200 {
            animation-delay: 200ms;
          }

          .animation-delay-300 {
            animation-delay: 300ms;
          }

          .animation-delay-400 {
            animation-delay: 400ms;
          }

          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </div>
  );
};

export default FormsTab;