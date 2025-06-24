import React, { useState, useEffect } from 'react';
import { memberDataService } from './services/memberDataService';
import { downloadDocument, formatFileSize } from './services/salesforce/memberDocuments';
import documentImage from '../../assets/images/document-image.png';
import pdfImage from '../../assets/images/pdf-image.png';
import documentsHeaderImage from '../../assets/images/documents-image.jpg';

const DocumentsTab = ({ contactId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [groupedDocs, setGroupedDocs] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  console.log('[DocumentsTab] Component rendered with contactId:', contactId);

  useEffect(() => {
    console.log('[DocumentsTab] useEffect triggered, contactId:', contactId);
    if (contactId) {
      loadDocuments();
    } else {
      console.warn('[DocumentsTab] No contactId provided');
      setLoading(false);
      setError('No contact ID provided');
    }
  }, [contactId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[DocumentsTab] Loading documents for contactId:', contactId);
      const result = await memberDataService.getDocuments(contactId);
      console.log('[DocumentsTab] Raw result:', result);
      
      if (result.success && result.data) {
        // Check if documents are directly in result.data or nested
        const docs = Array.isArray(result.data) ? result.data : 
                     result.data.documents || 
                     result.data.data?.documents || 
                     [];
        console.log('[DocumentsTab] Documents received:', docs);
        console.log('[DocumentsTab] Documents count:', docs.length);
        console.log('[DocumentsTab] First document:', docs[0]);
        
        // Filter out .snote files and video testimony files
        const filteredDocs = docs.filter(doc => {
          const nameLC = doc.name.toLowerCase();
          return !nameLC.endsWith('.snote') && !nameLC.includes('video testimony');
        });
        
        setDocuments(filteredDocs);
        
        // Group documents by source
        const grouped = filteredDocs.reduce((acc, doc) => {
          const source = doc.source || 'Other';
          // Combine Attachment Documents and File Documents into Member Documents
          const groupName = (source === 'Attachment Documents' || source === 'File Documents') 
            ? 'Member Documents' 
            : source;
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(doc);
          return acc;
        }, {});
        console.log('[DocumentsTab] Grouped documents:', grouped);
        setGroupedDocs(grouped);
      } else {
        console.error('[DocumentsTab] Failed to load documents:', result.error);
        setError(result.error || 'Failed to load documents');
      }
    } catch (err) {
      console.error('[DocumentsTab] Error loading documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      setDownloading(prev => ({ ...prev, [document.id]: true }));
      
      const result = await downloadDocument(contactId, document);
      
      if (!result.success) {
        console.error('Download failed:', result.error);
      }
    } catch (err) {
      console.error('Error downloading document:', err);
    } finally {
      setDownloading(prev => ({ ...prev, [document.id]: false }));
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('File size exceeds 10MB limit');
        event.target.value = '';
        setUploading(false);
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];
      
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError('Invalid file type. Accepted formats: PDF, DOC, DOCX, JPG, PNG');
        event.target.value = '';
        setUploading(false);
        return;
      }
      

      
      // Read file as base64 for the backend
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Get base64 string without the data URL prefix
          const base64Data = e.target.result.split(',')[1];
          
          if (!base64Data) {
            setError('Failed to process file data');
            setUploading(false);
            return;
          }
          
          // Call the API directly with the EXACT format the controller expects
          const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
          const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents`;
          
          const requestBody = {
            title: 'member_uploaded_' + file.name,
            fileData: base64Data,
            fileType: file.type || 'application/octet-stream'
          };
          
          console.log('[DocumentsTab] Uploading document:', file.name);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
          });
          
          const responseData = await response.json();
          
          if (response.ok && responseData.success) {
            console.log('[DocumentsTab] Upload successful!');
            
            // Clear form
            event.target.value = '';
            setError(null);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
            
            // Clear cache and reload
            memberDataService.clearCacheEntry(contactId, 'documents');
            await loadDocuments();
          } else {
            setError(`Upload failed: ${responseData.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('[DocumentsTab] Error:', err);
          setError(`Failed to upload: ${err.message}`);
        } finally {
          setUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('[DocumentsTab] Error uploading document:', err);
      setError(`Failed to upload document: ${err.message || 'Unknown error'}`);
      setUploading(false);
      event.target.value = ''; // Clear the file input regardless
    }
  };

  const getDocumentIcon = (doc) => {
    const fileExtension = doc.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'pdf') {
      return <img src={pdfImage} alt="PDF document" className="w-16 h-16 object-contain" />;
    } else {
      return <img src={documentImage} alt="Document" className="w-16 h-16 object-contain" />;
    }
  };

  const formatDocumentName = (name) => {
    // Remove file extension for processing
    const lastDotIndex = name.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > -1 ? name.substring(0, lastDotIndex) : name;
    
    // Replace underscores and dashes with spaces, then capitalize each word
    const formatted = nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Truncate if longer than 43 characters
    if (formatted.length > 43) {
      return formatted.substring(0, 40) + '...';
    }
    
    return formatted;
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter and search documents
  const filteredDocuments = React.useMemo(() => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        formatDocumentName(doc.name).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => {
        const docName = doc.name.toLowerCase();
        const docSource = (doc.source || '').toLowerCase();
        
        switch(filterType) {
          case 'recent':
            // Show documents from last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return new Date(doc.createdDate) >= thirtyDaysAgo;
          case 'membership':
            return docName.includes('membership') || docName.includes('agreement') || 
                   docName.includes('contract') || docName.includes('application');
          case 'medical':
            return docName.includes('medical') || docName.includes('health') || 
                   docName.includes('physician') || docName.includes('prescription');
          case 'legal':
            return docName.includes('legal') || docName.includes('consent') || 
                   docName.includes('authorization') || docName.includes('directive');
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [documents, searchQuery, filterType]);

  if (loading) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 font-light">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error && !documents.length) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen relative">
        {/* Content wrapper */}
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={loadDocuments}
                  className="text-red-600 underline text-sm mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen relative overflow-x-hidden" style={{ maxWidth: '100vw' }}>
      <div className="overflow-x-hidden">
        {/* Your Membership Documents Section */}
        <div className="mb-16">
          {error && documents.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-yellow-800">{error}</p>
              </div>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-xl p-12 text-center animate-fadeIn">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#4a3d6b] text-lg">No documents found</p>
              <p className="text-[#6a5b8a] text-sm mt-2">Your membership documents will appear here once uploaded by Alcor staff</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 animate-fadeInUp overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-12">
                {/* Text content - left side */}
                <div className="flex-1">
                  <style>{`
                    .member-files-title {
                      font-size: 1.375rem;
                    }
                    @media (min-width: 768px) {
                      .member-files-title {
                        font-size: 1.875rem;
                      }
                    }
                  `}</style>
                  {/* Mobile gradient - shows above title */}
                  <div className="mb-4 sm:hidden">
                    <div className="h-2 w-40" style={{
                      background: 'linear-gradient(to right, #0e0e2f 0%, #1b163a 8%, #2a1b3d 16%, #3f2541 25%, #5b2f4b 33%, #74384d 42%, #914451 50%, #a04c56 58%, #a25357 67%, #b66e5d 75%, #cb8863 83%, #d79564 100%)'
                    }}></div>
                  </div>
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                      {/* <div className="bg-[#1b163a] p-3 rounded-lg hidden sm:block">
                        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                      </div> */}
                      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 sm:normal-case uppercase">Member Files</h2>
                    </div>
                    <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
                      Access your secure membership documents anytime. Download agreements, forms, and official correspondence stored safely with 24/7 availability. 
                      Your designated representatives and medical providers can access 
                      these files when needed, ensuring your cryopreservation arrangements are always accessible. You can download, print, or share your documents 
                      directly from this portal at any time.
                    </p>
                  </div>
                </div>
                
                {/* Image - right side */}
                <div className="relative w-full lg:w-96 h-56 lg:h-48 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={documentsHeaderImage} 
                    alt="Document management" 
                    className="w-full h-full object-cover grayscale"
                  />
                  <div className="absolute bottom-0 right-0">
                    <div className="px-3 py-1 sm:px-4 sm:py-2" style={{
                      background: 'linear-gradient(to right, #0e0e2f 0%, #1b163a 8%, #2a1b3d 16%, #3f2541 25%, #5b2f4b 33%, #74384d 42%, #914451 50%, #a04c56 58%, #a25357 67%, #b66e5d 75%, #cb8863 83%, #d79564 100%)'
                    }}>
                      <p className="text-white font-semibold text-sm sm:text-base tracking-wider">
                        Your Documents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gap-y-10">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc, index) => (
                    <div 
                      key={doc.id} 
                      className={`bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-gray-300 group relative overflow-hidden flex flex-col h-28 animate-fadeIn ${
                        index < 3 ? 'animation-delay-100' : 
                        index < 6 ? 'animation-delay-200' : 
                        index < 9 ? 'animation-delay-300' : 
                        'animation-delay-400'
                      }`}
                    >
                      <div className="p-5 pb-3 pr-3 flex h-full">
                        <div className="flex-shrink-0 mr-1">
                          {getDocumentIcon(doc)}
                        </div>
                        
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1">
                            <h3 className="font-medium text-[#2a2346] text-lg leading-tight">{formatDocumentName(doc.name)}</h3>
                          </div>
                          
                          <button 
                            onClick={() => handleDownload(doc)}
                            disabled={downloading[doc.id]}
                            className="self-end mt-2 text-[#6b5b7e] hover:text-[#4a4266] transition-colors flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                          >
                            {downloading[doc.id] ? (
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
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-[#4a3d6b] text-lg">No documents found matching your search.</p>
                    {(searchQuery || filterType !== 'all') && (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                        }}
                        className="mt-3 text-base text-[#6b5b7e] hover:text-[#4a4266] transition-colors underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Documents Section */}
        <div id="upload-section" className="mt-12 bg-white rounded-lg shadow-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-200 overflow-hidden">
          <div className="h-4"></div>
          <style>{`
            .upload-files-title {
              font-size: 1.375rem;
            }
            @media (min-width: 768px) {
              .upload-files-title {
                font-size: 1.5rem;
              }
            }
          `}</style>
          <h2 className="upload-files-title font-thin text-[#2a2346] mb-6 tracking-widest">UPLOAD FILES</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-12 max-w-2xl">
            Upload new documents to your member portal. Files are stored with your membership file for Alcor staff access. Please ensure all documents are clearly labeled and in an 
            acceptable format before uploading.
          </p>
          
          {/* Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-800">Document uploaded successfully!</p>
              </div>
            </div>
          )}
          
          {/* Error Message for Upload Section */}
          {error && error.includes('upload') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#6a5b8a] mb-2">
              Choose File
            </label>
            <input 
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <label 
              htmlFor="file-upload"
              className={`inline-flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 text-[#2a2346] rounded-2xl hover:border-[#6b5b7e] hover:text-[#6b5b7e] transition-all cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6b5b7e]"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Select File to Upload</span>
                </>
              )}
            </label>
          </div>

          <p className="text-sm text-[#6a5b8a] mt-4 mb-8">
            Accepted file types: PDF, DOC, DOCX, JPG, PNG (Max size: 10MB)
          </p>
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
        `}</style>
      </div>
    </div>
  );
};

export default DocumentsTab;