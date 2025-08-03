import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMemberPortal } from '../../contexts/MemberPortalProvider';
import { memberDataService } from './services/memberDataService';
import { downloadDocument as originalDownloadDocument, formatFileSize } from './services/salesforce/memberDocuments';
import documentImage from '../../assets/images/document-image.png';
import pdfImage from '../../assets/images/pdf-image.png';
import documentsHeaderImage from '../../assets/images/documents-image.jpg';
import alcorYellowStar from '../../assets/images/alcor-yellow-star.png';
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

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
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false);

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

      @keyframes slideInRow {
        from {
          opacity: 0;
          transform: translateY(15px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-slideInRow {
        animation: slideInRow 0.3s ease-out forwards;
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

      .animation-delay-700 {
        animation-delay: 700ms;
      }

      .animation-delay-800 {
        animation-delay: 800ms;
      }

      .animation-delay-900 {
        animation-delay: 900ms;
      }

      .animation-delay-1000 {
        animation-delay: 1000ms;
      }

      .animation-delay-1100 {
        animation-delay: 1100ms;
      }

      .animation-delay-1200 {
        animation-delay: 1200ms;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
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

  const handleDownload = async (doc) => {
    try {
      setDownloading(prev => ({ ...prev, [doc.id]: true }));
      
      // Direct download approach
      const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
      
      // Determine the correct URL format based on document type
      let url;
      if (doc.source === 'Attachment' || doc.id.startsWith('00P')) {
        url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents/${doc.id}?type=attachment`;
      } else {
        url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents/${doc.id}?type=file`;
      }
      
      console.log('[Download] Direct download from:', url);
      
      // Method: Create an anchor tag and simulate a user click
      // This works better across browsers including Safari and incognito
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name || 'download'; // Suggest a filename
      link.rel = 'noopener noreferrer';
      link.target = '_self'; // Use _self instead of _blank for better compatibility
      
      // Style it to be invisible but still clickable
      link.style.position = 'absolute';
      link.style.top = '-9999px';
      link.style.left = '-9999px';
      
      // Append to body
      document.body.appendChild(link);
      
      // Trigger click with a small delay to ensure it's in the DOM
      setTimeout(() => {
        link.click();
        
        // Remove the link after another small delay
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
      }, 10);
      
    } catch (err) {
      console.error('Error downloading document:', err);
    } finally {
      // Clear downloading state after a delay
      setTimeout(() => {
        setDownloading(prev => ({ ...prev, [doc.id]: false }));
      }, 3000);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      event.target.value = '';
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
      return;
    }

    setSelectedFile(file);
    setShowDocumentTypeModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;
  
    try {
      setUploading(true);
      setShowDocumentTypeModal(false);
      
      // Use FormData like the video upload does
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Create filename based on document type
      let titleWithPrefix;
      if (documentType === 'profile_picture') {
        // Add timestamp for profile pictures
        const timestamp = Date.now();
        const fileExtension = selectedFile.name.split('.').pop();
        titleWithPrefix = `profile_picture_${timestamp}.${fileExtension}`;
      } else {
        // For membership documents, use original filename
        titleWithPrefix = selectedFile.name;
      }
      
      // Add the title to FormData
      formData.append('title', titleWithPrefix);
      formData.append('fileType', selectedFile.type || 'application/octet-stream');
      
      console.log('[DocumentsTab] Uploading document:', titleWithPrefix);
      
      // Build the URL
      const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
      const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents`;
      
      // Send the request using FormData (no Content-Type header needed)
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData  // FormData, not JSON!
      });
      
      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        console.log('[DocumentsTab] Upload successful!');
        
        // Clear form
        document.getElementById('file-upload').value = '';
        setSelectedFile(null);
        setDocumentType('');
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
      setError(`Failed to upload: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const getDocumentIcon = (doc) => {
    return (
      <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
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

  // Calculate row index for animation delay
  const getRowDelay = (index) => {
    const row = Math.floor(index / 2); // 2 columns per row
    return Math.min(row * 100, 800); // Max delay of 800ms, reduced from 1200ms
  };

  if (loading) {
    return (
      <div className="documents-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
        <div className="px-4 md:px-0">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 relative mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
              </div>
              <p className="text-gray-500 font-light">Loading documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !documents.length) {
    return (
      <div className="documents-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
        <div className="h-8"></div>
        <div className="px-4 md:px-0">
          <div className="min-h-screen">
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
        </div>
      </div>
    );
  }

  return (
    <div className="documents-tab -mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4">
      {/* Small top padding */}
      <div className="h-8"></div>
      
      {/* Your Membership Documents Section */}
      <div className="px-4 md:px-0">
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
              <h3 className="text-xl font-semibold text-gray-800 mb-12 flex items-center gap-3 flex-wrap">
                <div className="bg-gradient-to-r from-[#0a1628] to-[#6e4376] p-3 rounded-lg shadow-md">
                  <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Your Membership Files
              </h3>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc, index) => (
                    <button
                      key={doc.id} 
                      onClick={() => handleDownload(doc)}
                      disabled={downloading[doc.id]}
                      className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm flex items-center justify-between gap-3 animate-slideInRow hover:border-gray-300 hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left w-full`}
                      style={{ animationDelay: `${getRowDelay(index)}ms` }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getDocumentIcon(doc)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 text-sm truncate">{formatDocumentName(doc.name)}</h3>
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
                      </div>

                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-600 transition-all duration-200 hover:text-[#794384] hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
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

        {/* Upload Documents Section */}
        <div id="upload-section" className="mt-12 bg-white rounded-2xl p-4 sm:p-8 animate-fadeInUp animation-delay-200 overflow-hidden" style={{ boxShadow: '6px 8px 16px rgba(0, 0, 0, 0.1), -2px -2px 8px rgba(0, 0, 0, 0.04)' }}>
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
              onChange={handleFileSelect}
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
        <div className="h-24"></div>
      </div>

      {/* Document Type Modal */}
      {showDocumentTypeModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => {
            setShowDocumentTypeModal(false);
            setSelectedFile(null);
            setDocumentType('');
            document.getElementById('file-upload').value = '';
          }}></div>
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl p-8 sm:p-10 max-w-lg w-full animate-fadeInUp shadow-xl">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Select Document Type</h3>
              <p className="text-base text-gray-600 mb-8">Please select the type of document you're uploading.</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => setDocumentType('member_uploaded_document')}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    documentType === 'member_uploaded_document' 
                      ? 'border-gray-800 bg-gray-50 text-gray-800' 
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-lg">Membership Document</span>
                  <p className="text-sm text-gray-500 mt-2">Any documents related to your membership</p>
                </button>
                
                <button
                  onClick={() => setDocumentType('profile_picture')}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                    documentType === 'profile_picture' 
                      ? 'border-gray-800 bg-gray-50 text-gray-800' 
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-lg">Profile Picture</span>
                  <p className="text-sm text-gray-500 mt-2">Your photo for identification purposes</p>
                </button>
              </div>
              
              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => {
                    setShowDocumentTypeModal(false);
                    setSelectedFile(null);
                    setDocumentType('');
                    document.getElementById('file-upload').value = '';
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!documentType}
                  className={`flex-1 px-6 py-3 rounded-xl transition-all text-base font-medium ${
                    documentType 
                      ? 'bg-gray-800 text-white hover:bg-gray-900' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Help Button - Desktop Only */}
      <div className="hidden lg:block fixed bottom-8 right-8 z-40">
        <button
          className="w-14 h-14 bg-[#9f5fa6] hover:bg-[#8a4191] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
          onClick={() => setShowHelpPopup(!showHelpPopup)}
        >
          <svg 
            className="w-7 h-7 text-white" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.8" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </button>

        {/* Help Popup */}
        {showHelpPopup && (
          <div className="fixed bottom-28 right-8 w-80 bg-white rounded-lg shadow-2xl overflow-hidden z-50 animate-slideIn">
            <div className="bg-[#9f5fa6] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-base" style={{ fontWeight: 500 }}>Help & Information</h3>
              <button
                onClick={() => setShowHelpPopup(false)}
                className="text-white hover:bg-white/20 rounded p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Viewing Documents</h4>
                <p className="text-sm text-gray-600">Click on any document to download it. Documents are organized by type and date.</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Uploading Documents</h4>
                <p className="text-sm text-gray-600">Select a file, choose the document type, and upload. Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB).</p>
              </div>
              
              <div className="pb-4 border-b border-gray-100">
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Document Types</h4>
                <p className="text-sm text-gray-600">Medical, Legal, Financial, or Personal. This helps organize your documents properly.</p>
              </div>
              
              <div>
                <h4 className="text-sm text-gray-900 mb-2" style={{ fontWeight: 600 }}>Need assistance?</h4>
                <p className="text-sm text-gray-600">
                  Contact support at{' '}
                  <a href="mailto:info@alcor.org" className="text-[#9f5fa6] hover:underline">
                    info@alcor.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;