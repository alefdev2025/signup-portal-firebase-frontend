import React, { useState } from 'react';
import { Download, FileText, Shield, DollarSign, Clipboard } from 'lucide-react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';

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
      title: "General Information",
      icon: FileText,
      description: "Essential Alcor information documents",
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
      title: "Emergency Information",
      icon: Shield,
      description: "Critical emergency guidance",
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
      title: "Financial Information",
      icon: DollarSign,
      description: "Funding and insurance information",
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
      icon: Clipboard,
      description: "Research and educational materials",
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

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen">
      <h1 className="text-4xl font-light text-[#2a2346] mb-10">Alcor Information Documents</h1>
      
      <div className="space-y-8">
        {informationDocuments.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          return (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, #4b3865 0%, #5d4480 25%, #6c5578 50%, #7b5670 75%, #8a5f64 100%)` }}
                >
                  <IconComponent className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-[#2a2346]">{category.title}</h2>
                  <p className="text-[#6a5b8a] text-sm mt-1">{category.description}</p>
                </div>
              </div>

              <div className="space-y-5">
                {category.documents.map((doc, docIndex) => (
                  <div 
                    key={docIndex} 
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300 group relative overflow-hidden"
                  >
                    {/* Colored accent band */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-[#3a5a8f] via-[#4a6fa5] to-[#6b8fc4]"></div>
                    
                    <div className="flex items-center justify-between pl-7 pr-8 py-8">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2a2346] text-lg mb-2">{doc.title}</h3>
                        <p className="text-sm text-[#6b7280]">{doc.description}</p>
                      </div>
                      
                      <button
                        onClick={() => handleInfoDocDownload(doc.fileName)}
                        disabled={downloading[doc.fileName]}
                        className="ml-6 text-[#6b5b7e] hover:text-[#4a4266] transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                      >
                        {downloading[doc.fileName] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6b5b7e]"></div>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          );
        })}
      </div>
    </div>
  );
};

export default InformationDocumentsTab;