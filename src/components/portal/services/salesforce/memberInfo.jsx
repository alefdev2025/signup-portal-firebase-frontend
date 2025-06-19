// src/components/portal/services/salesforce/memberInfo.js
const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app' || 'http://localhost:8080';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('[Salesforce Member API] Calling:', url);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    console.log('[Salesforce Member API] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Salesforce Member API] Error response:', errorText);
      
      return {
        success: false,
        error: `API call failed: ${response.statusText}`,
        data: null
      };
    }

    const data = await response.json();
    console.log('[Salesforce Member API] Success - Data received');
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Salesforce Member API] Error:', error);
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