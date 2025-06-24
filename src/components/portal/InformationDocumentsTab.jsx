import React, { useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';
import pdfImage from '../../assets/images/pdf-image.png';
import informationImage from '../../assets/images/information-image.JPG';
import emergencyImage from '../../components/portal/emergency-image.jpg';
import financialImage from '../../components/portal/financial-image.jpg';
import educationImage from '../../assets/images/education-image.jpg';

const InformationDocumentsTab = () => {
  const [downloading, setDownloading] = useState({});

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
      description: "Essential Alcor information documents that provide comprehensive guides about membership, preservation options, and services. These foundational resources will help you understand the full scope of what Alcor offers.",
      image: "placeholder-general.jpg",
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
      description: "Critical emergency guidance and protocols for medical professionals and family members. These time-sensitive documents ensure proper procedures are followed when every moment counts.",
      image: "placeholder-emergency.jpg",
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
      description: "Funding and insurance information to help you plan for the financial aspects of cryopreservation. Learn about costs, payment options, and trusted insurance providers who understand cryonics funding.",
      image: "placeholder-financial.jpg",
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
      description: "Research papers, articles, and educational materials that explore the science and philosophy behind cryonics. Deepen your understanding with these carefully selected resources from experts in the field.",
      image: "placeholder-educational.jpg",
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
      categoryTitle: category.title
    }))
  );

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen relative" style={{ maxWidth: '100vw' }}>
      <div>
        {/* Information Documents Section */}
        <div className="space-y-12">
          {informationDocuments.map((category, categoryIndex) => {
            return (
              <div key={categoryIndex} className="bg-white rounded-lg p-4 sm:p-8 animate-fadeInUp" style={{animationDelay: `${categoryIndex * 150}ms`, boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'}}>
                <div className="py-0">
                  {/* Category Header with Image */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-12">
                    {/* Text content - left side */}
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-3xl font-semibold text-gray-800 mb-6">{category.title.toUpperCase()}</h3>
                      <p className="text-gray-500 text-base leading-relaxed max-w-xl">
                        {category.description}
                      </p>
                    </div>
                    
                    {/* Category Image - right side */}
                    <div className="relative w-full lg:w-80 h-48 lg:h-40 rounded-lg overflow-hidden shadow-md">
                      {categoryIndex === 0 ? (
                        <img 
                          src={informationImage} 
                          alt={category.imageLabel}
                          className="w-full h-full object-cover object-top grayscale scale-110"
                        />
                      ) : categoryIndex === 1 ? (
                        <img 
                          src={emergencyImage} 
                          alt={category.imageLabel}
                          className="w-full h-full object-cover object-top grayscale"
                        />
                      ) : categoryIndex === 2 ? (
                        <img 
                          src={financialImage} 
                          alt={category.imageLabel}
                          className="w-full h-full object-cover object-top grayscale"
                        />
                      ) : (
                        <img 
                          src={educationImage} 
                          alt={category.imageLabel}
                          className="w-full h-full object-cover object-top grayscale"
                        />
                      )}
                      <div className="absolute bottom-0 right-0">
                        <div className="px-3 py-1 sm:px-4 sm:py-2" style={{
                          background: 'linear-gradient(to right, #0e0e2f 0%, #1b163a 8%, #2a1b3d 16%, #3f2541 25%, #5b2f4b 33%, #74384d 42%, #914451 50%, #a04c56 58%, #a25357 67%, #b66e5d 75%, #cb8863 83%, #d79564 100%)'
                        }}>
                          <p className="text-white font-semibold text-xs sm:text-sm tracking-wider">
                            {category.imageLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-sm mx-auto md:max-w-none">
                    {category.documents.map((doc, docIndex) => (
                      <div 
                        key={docIndex} 
                        className={`bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-300 group relative overflow-hidden flex flex-col h-32 animate-fadeIn animation-delay-${(categoryIndex * 100) + 100}`}
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
                              <h3 className="font-medium text-[#2a2346] text-lg leading-tight">{doc.title}</h3>
                              <p className="text-xs text-[#6a5b8a] mt-1 line-clamp-2">{doc.description}</p>
                            </div>
                            
                            <button 
                              onClick={() => handleInfoDocDownload(doc.fileName)}
                              disabled={downloading[doc.fileName]}
                              className="self-end mt-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                              {downloading[doc.fileName] ? (
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
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style>{`
          /* Prevent horizontal scroll on mobile */
          html, body {
            overflow-x: hidden;
            max-width: 100%;
          }
          
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

export default InformationDocumentsTab;