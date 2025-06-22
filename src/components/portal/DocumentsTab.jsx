import React, { useState, useEffect } from 'react';
import { memberDataService } from './services/memberDataService';
import { downloadDocument, formatFileSize } from './services/salesforce/memberDocuments';

const DocumentsTab = ({ contactId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});
  const [uploading, setUploading] = useState(false);
  const [groupedDocs, setGroupedDocs] = useState({});

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
        
        // Filter out .snote files
        const filteredDocs = docs.filter(doc => !doc.name.toLowerCase().endsWith('.snote'));
        
        setDocuments(filteredDocs);
        
        // Group documents by source
        const grouped = filteredDocs.reduce((acc, doc) => {
          const source = doc.source || 'Other';
          if (!acc[source]) acc[source] = [];
          acc[source].push(doc);
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      
      const result = await memberDataService.uploadDocument(contactId, formData);
      
      if (result.success) {
        await loadDocuments();
        event.target.value = '';
      } else {
        setError(`Upload failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentIcon = (doc) => {
    const iconMap = {
      'pdf': (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      'doc': (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      'docx': (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      'note': (
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      'default': (
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
        </svg>
      )
    };
    
    return iconMap[doc.iconType] || iconMap[doc.fileType] || iconMap.default;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
          <p className="text-[#6b7280]">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error && !documents.length) {
    return (
      <div className="bg-gray-50 -m-8 p-8 min-h-screen">
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
    );
  }

  return (
    <div className="bg-gray-50 -m-8 p-8 min-h-screen">
      {/* Your Membership Documents Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-light text-[#2a2346] mb-10">Your Membership Documents</h1>

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
          <div className="bg-white rounded-lg shadow-xl p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[#4a3d6b] text-lg">No documents found</p>
            <p className="text-[#6a5b8a] text-sm mt-2">Your membership documents will appear here once uploaded by Alcor staff</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedDocs).map(([source, docs]) => (
              <div key={source} className="bg-white rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-medium text-[#2a2346] mb-6">
                  {source} Documents
                  <span className="ml-2 text-sm font-normal text-[#6a5b8a]">({docs.length})</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {docs.map((doc) => (
                    <div key={doc.id} className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-300 group relative overflow-hidden flex flex-col">
                      <div className="px-6 py-8 flex-1 flex flex-col">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            {React.cloneElement(getDocumentIcon(doc), { className: "w-8 h-8" })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#2a2346] text-base leading-tight truncate">{doc.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-[#6a5b8a] mt-1">
                              <span>{formatFileSize(doc.size)}</span>
                              <span>•</span>
                              <span>{new Date(doc.createdDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleDownload(doc)}
                          disabled={downloading[doc.id]}
                          className="mt-auto text-[#6b5b7e] hover:text-[#4a4266] transition-colors flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 w-full"
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsTab;