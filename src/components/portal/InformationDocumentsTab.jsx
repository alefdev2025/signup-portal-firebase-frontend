import React, { useState, useEffect } from 'react';
import { FileText, Info, AlertCircle, DollarSign, BookOpen } from 'lucide-react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';
import alcorStar from '../../assets/images/alcor-star.png';
import informationImage from '../../assets/images/information-image.JPG';
import emergencyImage from '../../components/portal/emergency-image.jpg';
import financialImage from '../../components/portal/financial-image.jpg';
import educationImage from '../../assets/images/education-image.jpg';

const InformationDocumentsTab = () => {
  const [downloading, setDownloading] = useState({});

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .info-docs-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .info-docs-tab .font-bold,
      .info-docs-tab .font-semibold {
        font-weight: 500 !important;
      }
      .info-docs-tab .font-bold {
        font-weight: 700 !important;
      }
      .info-docs-tab h1 {
        font-weight: 300 !important;
      }
      .info-docs-tab h2,
      .info-docs-tab h3,
      .info-docs-tab h4 {
        font-weight: 400 !important;
      }
      .info-docs-tab .font-medium {
        font-weight: 400 !important;
      }
      .info-docs-tab .fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      .info-docs-tab .slide-in {
        animation: slideIn 0.6s ease-out;
      }
      .info-docs-tab .slide-in-delay-1 {
        animation: slideIn 0.6s ease-out 0.1s both;
      }
      .info-docs-tab .slide-in-delay-2 {
        animation: slideIn 0.6s ease-out 0.2s both;
      }
      .info-docs-tab .slide-in-delay-3 {
        animation: slideIn 0.6s ease-out 0.3s both;
      }
      .info-docs-tab .slide-in-delay-4 {
        animation: slideIn 0.6s ease-out 0.4s both;
      }
      .info-docs-tab .stagger-in > * {
        opacity: 0;
        animation: slideIn 0.5s ease-out forwards;
      }
      .info-docs-tab .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
      .info-docs-tab .stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
      .info-docs-tab .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
      .info-docs-tab .stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
      .info-docs-tab .stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
      .info-docs-tab .stagger-in > *:nth-child(6) { animation-delay: 0.3s; }
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

  const handleInfoDocDownload = async (fileName) => {
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

  const informationDocuments = [
    {
      title: "General",
      icon: Info,
      description: "Essential Alcor information documents that provide comprehensive guides about membership, preservation options, and services. These foundational resources will help you understand the full scope of what Alcor offers.",
      image: informationImage,
      imageLabel: "General Info",
      documents: [
        {
          title: "Membership Overview",
          description: "Complete guide to becoming an Alcor member.",
          fileName: "Alcor Brochure.pdf",
          pages: 2
        },
        {
          title: "Preservation Options Comparison",
          description: "Detailed comparison of neuropreservation vs whole-body options.",
          fileName: "Neuro or Whole Body Options Summary.pdf",
          pages: 2
        },
        {
          title: "Memory Box Information",
          description: "Guide on Alcor's memory box services.",
          fileName: "Memory Box Article.pdf",
          pages: 3
        }
      ]
    },
    {
      title: "Emergency",
      icon: AlertCircle,
      description: "Critical emergency guidance and protocols for medical professionals and family members. These time-sensitive documents ensure proper procedures are followed when every moment counts.",
      image: emergencyImage,
      imageLabel: "Emergency",
      documents: [
        {
          title: "Hospital Information Sheet",
          description: "Essential one-page summary for medical staff during emergencies.",
          fileName: "General Information.pdf",
          pages: 1
        },
        {
          title: "Emergency Notification Guide",
          description: "Critical guidance on when and how to notify Alcor - 24/7 hotline included.",
          fileName: "When to Notify Alcor About a Member.pdf",
          pages: 2
        }
      ]
    },
    {
      title: "Financial",
      icon: DollarSign,
      description: "Funding and insurance information to help you plan for the financial aspects of cryopreservation. Learn about costs, payment options, and trusted insurance providers who understand cryonics funding.",
      image: financialImage,
      imageLabel: "Financial",
      documents: [
        {
          title: "Life Insurance Agent Directory",
          description: "Trusted agents experienced with cryonics life insurance funding.",
          fileName: "Life Insurance Agent Directory.docx",
          pages: 2
        },
        {
          title: "Costs & Funding Breakdown",
          description: "Detailed membership fees and preservation costs explained.",
          fileName: "Alcor Brochure.pdf",
          pages: 2
        }
      ]
    },
    {
      title: "Educational Resources",
      icon: BookOpen,
      description: "Research papers, articles, and educational materials that explore the science and philosophy behind cryonics. Deepen your understanding with these carefully selected resources from experts in the field.",
      image: educationImage,
      imageLabel: "Educational",
      documents: [
        {
          title: "Why Cryonics Makes Sense",
          description: "Tim Urban's comprehensive article.",
          fileName: "Why Cryonics Makes Sense.pdf",
          pages: 16
        },
        {
          title: "Memory Persistence Research",
          description: "Scientific study on long-term memory retention in cryopreservation.",
          fileName: "Memory Persistence.pdf",
          pages: 6
        }
      ]
    }
  ];

  // Flatten all documents into a single array for the grid
  const allDocuments = informationDocuments.flatMap(category => 
    category.documents.map(doc => ({
      ...doc,
      categoryTitle: category.title,
      categoryIcon: category.icon
    }))
  );

  return (
    <div className="info-docs-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-full md:pl-2">
      {/* Mobile: Single Column Layout */}
      <div className="sm:hidden">
        {/* Header */}
        <div className="bg-white shadow-md border border-gray-400 rounded-2xl overflow-hidden slide-in mx-4">
          <div className="px-6 py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
              <FileText className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Information & Resources
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          {/* Description */}
          <div className="p-8 pb-10 border-b border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed font-normal">
              Comprehensive information and educational resources about Alcor's services, procedures, and the science of cryonics. Download these documents to learn more about your membership options.
            </p>
          </div>
        </div>

        {/* Category Sections */}
        {informationDocuments.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <div key={categoryIndex} className={`bg-white shadow-md border border-gray-400 rounded-2xl overflow-hidden slide-in-delay-${categoryIndex + 1} mt-6 mx-4`}>
              {/* Category Header */}
              <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3.5 rounded-lg transform transition duration-300 mr-2" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                    {categoryIndex === 0 && (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {categoryIndex === 1 && (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {categoryIndex === 2 && (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {categoryIndex === 3 && (
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{category.title.toUpperCase()}</h3>
                </div>
              </div>

              {/* Documents List */}
              <div className="divide-y divide-gray-200 stagger-in">
                {category.documents.map((doc, docIndex) => (
                  <div
                    key={docIndex}
                    className="px-6 py-8 hover:bg-gray-50/50 transition-all"
                  >
                    <h4 className="text-sm font-bold text-gray-900 mb-2">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-gray-700 mb-4 font-normal">{doc.description}</p>
                    
                    <button
                      onClick={() => handleInfoDocDownload(doc.fileName)}
                      disabled={downloading[doc.fileName]}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading[doc.fileName] ? (
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
          );
        })}
      </div>

      {/* Desktop: Separated Category Boxes */}
      <div className="hidden sm:block space-y-6">
        {/* Header Section */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden slide-in">
          <div className="px-6 py-5" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-lg font-medium text-white flex items-center drop-shadow-md">
              <FileText className="w-5 h-5 text-white drop-shadow-sm mr-3" />
              Information & Resources
              <img src={alcorStar} alt="" className="w-6 h-6 ml-0.5" />
            </h2>
          </div>

          {/* Main Description */}
          <div className="p-6 border-b border-gray-100">
            <p className="text-gray-700 text-sm leading-relaxed max-w-3xl font-normal">
              Comprehensive information and educational resources about Alcor's services, procedures, and the science of cryonics. 
              Download these documents to learn more about your membership options and the cryopreservation process.
            </p>
          </div>
        </div>

        {/* Category Sections */}
        {informationDocuments.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <div key={categoryIndex} className={`bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden slide-in-delay-${categoryIndex + 1}`}>
              {/* Category Header with Image */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Text content - left side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                        {categoryIndex === 0 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {categoryIndex === 1 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {categoryIndex === 2 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {categoryIndex === 3 && (
                          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{category.title.toUpperCase()}</h3>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed max-w-xl font-normal">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Category Image - right side */}
                  <div className="relative w-full lg:w-80 h-48 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                    <img 
                      src={category.image} 
                      alt={category.imageLabel}
                      className="w-full h-full object-cover grayscale"
                    />
                    <div className="absolute bottom-0 right-0">
                      <div className="px-4 py-2" style={{
                        background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                      }}>
                        <p className="text-white font-medium text-sm tracking-wider">
                          {category.imageLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
                  {category.documents.map((doc, docIndex) => (
                    <div
                      key={docIndex}
                      className="p-5 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 mb-1">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-gray-700 mb-2 font-normal">{doc.description}</p>
                          <p className="text-xs text-gray-500 font-normal">{doc.pages} pages</p>
                        </div>
                        
                        <button
                          onClick={() => handleInfoDocDownload(doc.fileName)}
                          disabled={downloading[doc.fileName]}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#12243c] hover:bg-gradient-to-r hover:from-[#12243c] hover:to-[#1a2f4a] hover:text-white border border-[#12243c] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {downloading[doc.fileName] ? (
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
          );
        })}
      </div>
    </div>
  );
};

export default InformationDocumentsTab;