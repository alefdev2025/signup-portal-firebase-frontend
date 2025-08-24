// src/components/portal/services/salesforce/memberDocuments.js
//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app' || 'http://localhost:8080';
import { API_BASE_URL } from '../../../../config/api';

// Helper function for API calls (same as memberInfo.js)
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[Salesforce Member Documents API] Calling:', url);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    console.log('[Salesforce Member Documents API] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Salesforce Member Documents API] Error response:', errorText);
      
      return {
        success: false,
        error: `API call failed: ${response.statusText}`,
        data: null
      };
    }

    const data = await response.json();
    console.log('[Salesforce Member Documents API] Success - Data received');
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Salesforce Member Documents API] Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Get all documents for a member
export const getMemberDocuments = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/documents`);
};

// Complete getMemberDocument function with enhanced debugging

export const getMemberDocument = async (contactId, documentId, documentType = 'attachment') => {
    try {
      const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents/${documentId}?type=${documentType}`;
      console.log('[Salesforce Member Documents API] Downloading from URL:', url);
      console.log('[Download] Document Type:', documentType);
      console.log('[Download] Document ID pattern:', documentId.substring(0, 3) + '...');
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });
  
      console.log('[Download] Response status:', response.status);
      console.log('[Download] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Download] Error response:', errorText);
        
        // Parse error to show more details
        try {
          const errorData = JSON.parse(errorText);
          console.error('[Download] Error details:', errorData);
          throw new Error(errorData.error || `Failed to download document: ${response.statusText}`);
        } catch (e) {
          throw new Error(`Failed to download document: ${response.statusText}`);
        }
      }
  
      // Check response headers
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const contentDisposition = response.headers.get('content-disposition');
      
      console.log('[Download] Content-Type:', contentType);
      console.log('[Download] Content-Length:', contentLength);
      console.log('[Download] Content-Disposition:', contentDisposition);
      
      // Handle different response types
      if (documentType === 'note' && contentType?.includes('application/json')) {
        // For notes, return as JSON
        const data = await response.json();
        console.log('[Download] Note data received:', data);
        
        // Create a text blob for notes
        const noteContent = data.data || data.body || data.content || '';
        const textBlob = new Blob([noteContent], { type: 'text/plain' });
        
        return {
          success: true,
          data: textBlob,
          filename: data.filename || `${data.title || 'note'}.txt`,
          contentType: 'text/plain'
        };
        
      } else {
        // For binary files (PDFs, images, etc.)
        
        // Clone the response so we can read it multiple times for debugging
        const responseClone = response.clone();
        const responseClone2 = response.clone();
        
        // First, check the actual content
        try {
          // Read as array buffer to check binary content
          const arrayBuffer = await responseClone.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          
          console.log('[Download DEBUG] ===================');
          console.log('[Download DEBUG] ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
          console.log('[Download DEBUG] First 20 bytes (decimal):', Array.from(bytes.slice(0, 20)));
          console.log('[Download DEBUG] First 20 bytes (hex):', 
            Array.from(bytes.slice(0, 20))
              .map(b => b.toString(16).padStart(2, '0'))
              .join(' ')
          );
          
          // Check for common file signatures
          const first4Bytes = Array.from(bytes.slice(0, 4))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
            
          console.log('[Download DEBUG] File signature (first 4 bytes):', first4Bytes);
          
          // Check for PDF
          if (first4Bytes === '25504446') {
            console.log('[Download DEBUG] ✅ Valid PDF signature detected (hex: 25504446 = %PDF)');
          } else if (first4Bytes === '504b0304') {
            console.log('[Download DEBUG] 📦 ZIP/DOCX signature detected');
          } else if (first4Bytes.startsWith('ffd8')) {
            console.log('[Download DEBUG] 🖼️ JPEG signature detected');
          } else if (first4Bytes === '89504e47') {
            console.log('[Download DEBUG] 🖼️ PNG signature detected');
          } else {
            console.log('[Download DEBUG] ❌ Unknown file signature');
            
            // Try to read as text to see if it's an error message
            try {
              const text = await responseClone2.text();
              console.log('[Download DEBUG] Content as text (first 200 chars):', text.substring(0, 200));
              
              // Check if it's JSON
              try {
                const jsonData = JSON.parse(text);
                console.error('[Download DEBUG] ⚠️ Response is JSON, not binary:', jsonData);
              } catch (e) {
                // Not JSON
              }
            } catch (e) {
              console.log('[Download DEBUG] Could not read as text');
            }
          }
          
          console.log('[Download DEBUG] Expected size from header:', contentLength);
          console.log('[Download DEBUG] Actual size received:', arrayBuffer.byteLength);
          
          if (contentLength && parseInt(contentLength) !== arrayBuffer.byteLength) {
            console.warn('[Download DEBUG] ⚠️ Size mismatch!');
          }
          
          console.log('[Download DEBUG] ===================');
          
        } catch (debugError) {
          console.error('[Download DEBUG] Error during debug analysis:', debugError);
        }
        
        // Now create the blob for download
        const blob = await response.blob();
        console.log('[Download] Blob created:');
        console.log('  - Size:', blob.size, 'bytes');
        console.log('  - Type:', blob.type);
        
        // Extract filename
        let filename = `document-${documentId}`;
        
        if (contentDisposition) {
          // Try multiple patterns to extract filename
          const patterns = [
            /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']+)['"]?/i,
            /filename=['"]?([^'"\s]+)['"]?/i
          ];
          
          for (const pattern of patterns) {
            const match = contentDisposition.match(pattern);
            if (match && match[1]) {
              filename = match[1];
              console.log('[Download] Extracted filename:', filename);
              break;
            }
          }
        }
        
        // Validate the blob
        if (blob.size < 100 && parseInt(contentLength) > 1000) {
          console.error('[Download] ⚠️ Blob is suspiciously small!');
          console.error('  - Blob size:', blob.size);
          console.error('  - Expected size:', contentLength);
          
          // Try to read the blob content to see what it contains
          const reader = new FileReader();
          reader.onload = function() {
            console.error('[Download] Small blob content:', reader.result);
          };
          reader.readAsText(blob);
        }
        
        console.log('[Download] Final filename:', filename);
        console.log('[Download] Success! Ready to download.');
        
        return {
          success: true,
          data: blob,
          filename: filename,
          contentType: contentType || 'application/octet-stream'
        };
      }
      
    } catch (error) {
      console.error('[Salesforce Member Documents API] Error downloading document:', error);
      console.error('[Download] Error stack:', error.stack);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  };

// Upload a new document
export const uploadMemberDocument = async (contactId, documentData) => {
  try {
    const formData = new FormData();
    formData.append('name', documentData.name);
    formData.append('file', documentData.file);
    if (documentData.description) {
      formData.append('description', documentData.description);
    }

    const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents`;
    
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload document: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Salesforce Member Documents API] Error uploading document:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Delete a document
export const deleteMemberDocument = async (contactId, documentId, documentType = 'attachment') => {
  return apiCall(`/api/salesforce/member/${contactId}/documents/${documentId}?type=${documentType}`, {
    method: 'DELETE'
  });
};

// Create a note
export const createMemberNote = async (contactId, noteData) => {
  return apiCall(`/api/salesforce/member/${contactId}/notes`, {
    method: 'POST',
    body: noteData
  });
};

// Update a note
export const updateMemberNote = async (contactId, noteId, noteData) => {
  return apiCall(`/api/salesforce/member/${contactId}/notes/${noteId}`, {
    method: 'PUT',
    body: noteData
  });
};

// Helper function to download a document and trigger browser download
export const downloadDocument = async (contactId, doc) => {
  try {
    console.log('[Download] Starting download for document:', {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      source: doc.source
    });
    
    // Ensure we have the correct document type
    let documentType = doc.type;
    
    // Map the document type correctly based on the source
    if (doc.source === 'File' || doc.type === 'file') {
      documentType = 'file';
    } else if (doc.source === 'Note' || doc.type === 'note') {
      documentType = 'note';
    } else {
      documentType = 'attachment';
    }
    
    console.log('[Download] Using document type:', documentType);
    
    const result = await getMemberDocument(contactId, doc.id, documentType);
    
    if (result.success && result.data) {
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(result.data);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || doc.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('[Download] Successfully downloaded:', doc.name);
      return { success: true };
    } else {
      throw new Error(result.error || 'Failed to download document');
    }
  } catch (error) {
    console.error('[Download] Error downloading document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get document icon based on type
export const getDocumentIcon = (document) => {
  const iconMap = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'excel': '📊',
    'xls': '📊',
    'xlsx': '📊',
    'text': '📃',
    'txt': '📃',
    'image': '🖼️',
    'png': '🖼️',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'note': '📝',
    'file': '📎'
  };
  
  return iconMap[document.iconType] || iconMap[document.fileType] || '📎';
};