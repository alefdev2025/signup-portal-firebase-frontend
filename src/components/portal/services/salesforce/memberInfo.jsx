// src/components/portal/services/salesforce/memberInfo.js
import { auth } from '../../../../services/firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

// Helper function for API calls - FIXED TO INCLUDE AUTH
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get the current user's auth token
    let authHeader = {};
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        authHeader = { 'Authorization': `Bearer ${token}` };
      } catch (tokenError) {
        console.error('[Salesforce Member API] Failed to get auth token:', tokenError);
        throw new Error('Authentication required');
      }
    } else {
      console.error('[Salesforce Member API] No authenticated user');
      throw new Error('Authentication required');
    }
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,  // <-- AUTH HEADER ADDED HERE
        ...options.headers
      },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API call failed: ${response.statusText}`,
        data: null
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Personal Information
export const getMemberPersonalInfo = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/personal-info`);
};

export const updateMemberPersonalInfo = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/personal-info`, {
    method: 'PUT',
    body: data
  });
};

// Contact Information
export const getMemberContactInfo = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/contact-info`);
};

export const updateMemberContactInfo = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/contact-info`, {
    method: 'PUT',
    body: data
  });
};

// Address Information
export const getMemberAddresses = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/addresses`);
};

export const updateMemberAddresses = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/addresses`, {
    method: 'PUT',
    body: data
  });
};

// Family Information
export const getMemberFamilyInfo = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/family-info`);
};

export const updateMemberFamilyInfo = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/family-info`, {
    method: 'PUT',
    body: data
  });
};

// Occupation Information
export const getMemberOccupation = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/occupation`);
};

export const updateMemberOccupation = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/occupation`, {
    method: 'PUT',
    body: data
  });
};

// Cryopreservation Arrangements
export const getMemberCryoArrangements = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/cryo-arrangements`);
};

export const updateMemberCryoArrangements = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/cryo-arrangements`, {
    method: 'PUT',
    body: data
  });
};

// Emergency Contacts / Next of Kin
export const getMemberEmergencyContacts = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/next-of-kin`);
};

export const createMemberEmergencyContact = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/next-of-kin`, {
    method: 'POST',
    body: data
  });
};

export const updateMemberEmergencyContact = async (contactId, nokId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/next-of-kin/${nokId}`, {
    method: 'PUT',
    body: data
  });
};

export const deleteMemberEmergencyContact = async (contactId, nokId) => {
  return apiCall(`/api/salesforce/member/${contactId}/next-of-kin/${nokId}`, {
    method: 'DELETE'
  });
};

// Insurance Information
export const getMemberInsurance = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/insurance`);
};

export const createMemberInsurance = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/insurance`, {
    method: 'POST',
    body: data
  });
};

export const updateMemberInsurance = async (contactId, insuranceId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/insurance/${insuranceId}`, {
    method: 'PUT',
    body: data
  });
};

export const deleteMemberInsurance = async (contactId, insuranceId) => {
  return apiCall(`/api/salesforce/member/${contactId}/insurance/${insuranceId}`, {
    method: 'DELETE'
  });
};

// Medical Information
export const getMemberMedicalInfo = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/medical-info`);
};

export const updateMemberMedicalInfo = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/medical-info`, {
    method: 'PUT',
    body: data
  });
};

// Legal Information
export const getMemberLegalInfo = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/legal-info`);
};

export const updateMemberLegalInfo = async (contactId, data) => {
  return apiCall(`/api/salesforce/member/${contactId}/legal-info`, {
    method: 'PUT',
    body: data
  });
};

// Aggregate Profile (combines multiple data points)
export const getMemberProfile = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/profile`);
};

// Financial Information (read-only)
export const getMemberFinancialInfo = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/financial-info`);
};

export const getMemberPaymentHistory = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/payment-history`);
};

// Membership Status (read-only)
export const getMembershipStatus = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/membership-status`);
};

export const getMembershipHistory = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/membership-history`);
};

// Agreements (read-only)
export const getMemberAgreements = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/agreements`);
};

export const getMemberAgreement = async (contactId, agreementId) => {
  return apiCall(`/api/salesforce/member/${contactId}/agreements/${agreementId}`);
};

// Documents - FIXED VERSION
export const getMemberDocuments = async (contactId) => {
  //console.log('[getMemberDocuments] 1. Starting with contactId:', contactId);
  
  try {
    // GET AUTH TOKEN FIRST
    const currentUser = auth.currentUser;
    if (!currentUser) {
      //console.error('[getMemberDocuments] No authenticated user');
      throw new Error('Authentication required');
    }
    const token = await currentUser.getIdToken();
    //console.log('[getMemberDocuments] Got auth token');
    
    const endpoint = `/api/salesforce/member/${contactId}/documents`;
    const url = `${API_BASE_URL}${endpoint}`;
    
    //console.log('[getMemberDocuments] 2. Calling URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // <-- ADD AUTH HEADER
      },
      credentials: 'include',
    });

    //console.log('[getMemberDocuments] 3. Response received:', response);
    //console.log('[getMemberDocuments] 4. Response status:', response.status);
    //console.log('[getMemberDocuments] 5. Response headers:', response.headers);
    
    if (!response.ok) {
      //console.log('[getMemberDocuments] 6. Response NOT OK');
      const errorText = await response.text();
      //console.error('[getMemberDocuments] 7. Error text:', errorText);
      
      return {
        success: false,
        error: `API call failed: ${response.statusText}`,
        data: null
      };
    }

    //console.log('[getMemberDocuments] 8. Response OK, parsing JSON...');
    const data = await response.json();
    //console.log('[getMemberDocuments] 9. Data parsed:', data);
    
    const result = {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    //console.log('[getMemberDocuments] 10. Returning result:', result);
    return result;
    
  } catch (error) {
    //console.error('[getMemberDocuments] 11. CAUGHT ERROR:', error);
    //console.error('[getMemberDocuments] 12. Error stack:', error.stack);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// FIXED VERSION
export const getMemberDocument = async (contactId, documentId, documentType = 'attachment') => {
  try {
    // GET AUTH TOKEN
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required');
    const token = await currentUser.getIdToken();
    
    const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents/${documentId}?type=${documentType}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`  // <-- ADD AUTH
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }

    // For binary files, handle as blob
    if (documentType !== 'note') {
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/['"]/g, '')
        : `document-${documentId}`;
      
      return {
        success: true,
        data: blob,
        filename: filename,
        contentType: response.headers.get('content-type')
      };
    } else {
      // For notes, return as JSON
      const data = await response.json();
      return data;
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// FIXED VERSION
export const uploadMemberDocument = async (contactId, formData) => {
  try {
    // GET AUTH TOKEN
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required');
    const token = await currentUser.getIdToken();
    
    const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/documents`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`  // <-- ADD AUTH, NO Content-Type for FormData
      },
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
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export const deleteMemberDocument = async (contactId, documentId, documentType = 'attachment') => {
  return apiCall(`/api/salesforce/member/${contactId}/documents/${documentId}?type=${documentType}`, {
    method: 'DELETE'
  });
};

// Video Testimony
export const getMemberVideoTestimony = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/video-testimony`);
};

// FIXED VERSION
export const uploadMemberVideoTestimony = async (contactId, formData) => {
  try {
    // GET AUTH TOKEN
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required');
    const token = await currentUser.getIdToken();
    
    const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/video-testimony`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`  // <-- ADD AUTH
      },
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to upload video testimony: ${response.statusText}`,
        data: null
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

export const deleteMemberVideoTestimony = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/video-testimony`, {
    method: 'DELETE'
  });
};

// FIXED VERSION
export const downloadMemberVideoTestimony = async (contactId) => {
  try {
    // GET AUTH TOKEN
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required');
    const token = await currentUser.getIdToken();
    
    const url = `${API_BASE_URL}/api/salesforce/member/${contactId}/video-testimony/download`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`  // <-- ADD AUTH
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to download video testimony: ${response.statusText}`,
        data: null
      };
    }

    // Get file info from headers
    const contentDisposition = response.headers.get('content-disposition');
    const contentType = response.headers.get('content-type');
    
    let filename = 'video-testimony.mp4';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        filename = fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    const blob = await response.blob();
    
    //console.log('[VideoTestimony] Download successful');
    return {
      success: true,
      data: blob,
      filename: filename,
      contentType: contentType
    };
  } catch (error) {
    //console.error('[VideoTestimony] Download error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// These can use apiCall since it now has auth
export const getMemberCategory = async (contactId) => {
  return apiCall(`/api/salesforce/member/${contactId}/category`);
};

export async function getMemberFundingInfo(contactId) {
  return apiCall(`/api/salesforce/member/${contactId}/funding-info`);
}

export async function updateMemberFundingInfo(contactId, fundingData) {
  return apiCall(`/api/salesforce/member/${contactId}/funding-info`, {
    method: 'PUT',
    body: fundingData
  });
}

export const getMemberNextOfKin = getMemberEmergencyContacts;
export const createMemberNextOfKin = createMemberEmergencyContact;
export const updateMemberNextOfKin = updateMemberEmergencyContact;
export const deleteMemberNextOfKin = deleteMemberEmergencyContact;