import React, { useState, useEffect } from 'react';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { memberDataService } from './services/memberDataService';
import { downloadDocument, formatFileSize } from './services/salesforce/memberDocuments';
import documentImage from '../../assets/images/document-image.png';
import pdfImage from '../../assets/images/pdf-image.png';
import documentsHeaderImage from '../../assets/images/documents-image.jpg';

const DocumentsTab = ({ contactId }) => {
  // Get preloaded documents from context
  const { documents: preloadedDocuments, documentsLoaded, refreshDocuments } = useMemberPortal();
  
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

  // Add Helvetica font
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .documents-tab * {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 300 !important;
      }
      .documents-tab .font-bold,
      .documents-tab .font-semibold {
        font-weight: 500 !important;
      }
      .documents-tab .font-bold {
        font-weight: 700 !important;
      }
      .documents-tab h1 {
        font-weight: 300 !important;
      }
      .documents-tab h2,
      .documents-tab h3,
      .documents-tab h4 {
        font-weight: 400 !important;
      }
      .documents-tab .font-medium {
        font-weight: 400 !important;
      }
      .documents-tab .font-thin {
        font-weight: 100 !important;
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

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
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

      .animate-fadeInDown {
        animation: fadeInDown 0.6s ease-out forwards;
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

      .animation-delay-500 {
        animation-delay: 500ms;
      }

      .animation-delay-600 {
        animation-delay: 600ms;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Use preloaded documents on mount
  useEffect(() => {
    if (documentsLoaded && preloadedDocuments) {
      console.log('[DocumentsTab] Using preloaded documents:', preloadedDocuments.length);
      setDocuments(preloadedDocuments);
      
      // Group documents by source
      const grouped = preloadedDocuments.reduce((acc, doc) => {
        const source = doc.source || 'Other';
        const groupName = (source === 'Attachment Documents' || source === 'File Documents') 
          ? 'Member Documents' 
          : source;
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(doc);
        return acc;
      }, {});
      
      setGroupedDocs(grouped);
      setLoading(false);
    } else if (documentsLoaded) {
      // Documents loaded but empty
      setLoading(false);
    }
  }, [preloadedDocuments, documentsLoaded]);

  // Only load documents if not preloaded
  useEffect(() => {
    console.log('[DocumentsTab] useEffect triggered, contactId:', contactId, 'documentsLoaded:', documentsLoaded);
    if (!documentsLoaded && contactId) {
      loadDocuments();
    } else if (!contactId) {
      console.warn('[DocumentsTab] No contactId provided');
      setLoading(false);
      setError('No contact ID provided');
    }
  }, [contactId, documentsLoaded]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[DocumentsTab] Loading documents for contactId:', contactId);
      
      // Try to use the refresh function from context first
      if (refreshDocuments) {
        const refreshedDocs = await refreshDocuments();
        if (refreshedDocs && refreshedDocs.length >= 0) {
          return; // Documents will be updated through context
        }
      }
      
      // Fallback to direct loading if refresh didn't work
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
            
            // Use context refresh if available
            if (refreshDocuments) {
              await refreshDocuments();
            } else {
              await loadDocuments();
            }
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
    return (
      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    );
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
      <div className="documents-tab bg-gray-50 -m-8 p-8 min-h-screen flex items-center justify-center">
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
      <div className="documents-tab bg-gray-50 -m-8 p-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-medium">Error loading documents</p>
          <p className="text-sm font-light">{error}</p>
          <button 
            onClick={loadDocuments}
            className="mt-2 text-sm underline hover:no-underline font-light"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="documents-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-11/12 md:pl-4">
      {/* Your Membership Documents Section */}
      <div className="mb-8 mx-4 sm:mx-0">
        {error && documents.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 animate-fadeInUp animation-delay-100 border border-gray-200 text-center" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
            <svg className="w-18 h-18 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-800 text-lg font-medium">No documents found</p>
            <p className="text-gray-500 text-sm mt-2 font-light">Your membership documents will appear here once uploaded by Alcor staff</p>
          </div>
        ) : (
          <>
            {/* Files Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-100 border border-gray-200" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08)' }}>
              <h3 className="text-xl font-semibold text-gray-800 mb-8 flex items-center gap-3 flex-wrap">
                <div className="bg-[#2a1b3d] p-3.5 rounded-lg">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Your Documents
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc, index) => (
                    <button
                      key={doc.id} 
                      onClick={() => handleDownload(doc)}
                      disabled={downloading[doc.id]}
                      className={`bg-gray-50 rounded-lg p-3 outline outline-1 outline-gray-200 shadow-sm flex items-center justify-between gap-3 animate-fadeIn hover:bg-gray-100 hover:outline-gray-300 hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left w-full ${
                        index < 3 ? 'animation-delay-100' : 
                        index < 6 ? 'animation-delay-200' : 
                        index < 9 ? 'animation-delay-300' : 
                        'animation-delay-400'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 text-base truncate">{formatDocumentName(doc.name)}</h3>
                        {downloading[doc.id] && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-purple-600">
                            <div className="w-3 h-3 relative">
                              <div className="absolute inset-0 rounded-full border-2 border-purple-100"></div>
                              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 animate-spin"></div>
                            </div>
                            <span>Downloading...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        {getDocumentIcon(doc)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-800 text-lg font-medium">No documents found matching your search.</p>
                    {(searchQuery || filterType !== 'all') && (
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                        }}
                        className="mt-3 text-base text-purple-600 hover:text-purple-700 transition-colors underline font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upload Documents Section - UNCHANGED */}
      <div id="upload-section" className="mt-12 bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-200 overflow-hidden mx-4 sm:mx-0" style={{ boxShadow: '6px 8px 16px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(0, 0, 0, 0.04)' }}>
        <div className="h-4"></div>
        <style>{`
          .upload-files-title {
            font-size: 1.25rem;
          }
          @media (min-width: 768px) {
            .upload-files-title {
              font-size: 1.5rem;
            }
        `}</style>
        <h2 className="upload-files-title font-medium text-[#2a2346] mb-6 tracking-widest">UPLOAD FILES</h2>
        <p className="text-gray-700 text-base leading-relaxed mb-12 max-w-2xl">
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
    </div>
  );
};

export default DocumentsTab;