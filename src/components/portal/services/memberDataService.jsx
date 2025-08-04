// src/components/portal/services/memberDataService.js
import { 
  getMemberPersonalInfo,
  getMemberContactInfo,
  getMemberAddresses,
  getMemberFamilyInfo,
  getMemberOccupation,
  getMemberCryoArrangements,
  getMemberEmergencyContacts,
  getMemberInsurance,
  getMemberMedicalInfo,
  getMemberLegalInfo,
  getMemberProfile,
  getMemberDocuments,
  getMemberDocument,
  uploadMemberDocument,
  deleteMemberDocument,
  getMemberVideoTestimony,
  uploadMemberVideoTestimony,
  deleteMemberVideoTestimony,
  downloadMemberVideoTestimony,
  getMemberFundingInfo,
} from './salesforce/memberInfo';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

class MemberDataService {
  constructor() {
    this.cache = new Map();
    this.preloadPromise = null;
    this.isPreloading = false;
  }

  getCacheKey(contactId, dataType) {
    return `${contactId}_${dataType}`;
  }

  async fetchAndCache(contactId, dataType, fetchFunction) {
    const cacheKey = this.getCacheKey(contactId, dataType);
    
    // Check if data is already cached
    if (this.cache.has(cacheKey)) {
      //console.log(`[MemberDataService] Returning cached ${dataType} for contact:`, contactId);
      return this.cache.get(cacheKey);
    }

    // Check if we're already fetching this data
    const existingPromise = this.cache.get(`${cacheKey}_promise`);
    if (existingPromise) {
      //console.log(`[MemberDataService] Waiting for existing ${dataType} fetch`);
      return existingPromise;
    }

    // Fetch the data
    //console.log(`[MemberDataService] Fetching ${dataType} for contact:`, contactId);
    const fetchPromise = fetchFunction(contactId)
      .then(result => {
        if (result.success) {
          this.cache.set(cacheKey, result);
          this.cache.delete(`${cacheKey}_promise`);
          return result;
        } else {
          throw new Error(result.error || `Failed to fetch ${dataType}`);
        }
      })
      .catch(error => {
        //console.error(`[MemberDataService] Error fetching ${dataType}:`, error);
        this.cache.delete(`${cacheKey}_promise`);
        throw error;
      });

    // Store the promise to prevent duplicate fetches
    this.cache.set(`${cacheKey}_promise`, fetchPromise);
    return fetchPromise;
  }

  // Individual data fetchers with caching
  async getPersonalInfo(contactId) {
    return this.fetchAndCache(contactId, 'personalInfo', getMemberPersonalInfo);
  }

  async getContactInfo(contactId) {
    return this.fetchAndCache(contactId, 'contactInfo', getMemberContactInfo);
  }

  async getAddresses(contactId) {
    return this.fetchAndCache(contactId, 'addresses', getMemberAddresses);
  }

  async getFamilyInfo(contactId) {
    return this.fetchAndCache(contactId, 'familyInfo', getMemberFamilyInfo);
  }

  async getOccupation(contactId) {
    return this.fetchAndCache(contactId, 'occupation', getMemberOccupation);
  }

  async getCryoArrangements(contactId) {
    return this.fetchAndCache(contactId, 'cryoArrangements', getMemberCryoArrangements);
  }

  async getEmergencyContacts(contactId) {
    return this.fetchAndCache(contactId, 'emergencyContacts', getMemberEmergencyContacts);
  }

  async getInsurance(contactId) {
    return this.fetchAndCache(contactId, 'insurance', getMemberInsurance);
  }

  async getMedicalInfo(contactId) {
    return this.fetchAndCache(contactId, 'medicalInfo', getMemberMedicalInfo);
  }

  async getLegalInfo(contactId) {
    return this.fetchAndCache(contactId, 'legalInfo', getMemberLegalInfo);
  }

  async getMemberProfile(contactId) {
    return this.fetchAndCache(contactId, 'memberProfile', getMemberProfile);
  }

  async getFundingInfo(contactId) {
    return this.fetchAndCache(contactId, 'fundingInfo', getMemberFundingInfo);
  }

  // DOCUMENTS
  async getDocuments(contactId) {
    //console.log("[DOCUMENTS] Getting member document ids");
    return this.fetchAndCache(contactId, 'documents', getMemberDocuments);
  }
  
  // For document operations that modify data, we don't cache
  async uploadDocument(contactId, formData) {
    try {
      const result = await uploadMemberDocument(contactId, formData);
      
      if (result.success) {
        // Clear the documents cache to force refresh
        this.clearCacheEntry(contactId, 'documents');
      }
      
      return result;
    } catch (error) {
      //console.error('[MemberDataService] Error uploading document:', error);
      throw error;
    }
  }
  
  async deleteDocument(contactId, documentId, documentType) {
    try {
      const result = await deleteMemberDocument(contactId, documentId, documentType);
      
      if (result.success) {
        // Clear the documents cache to force refresh
        this.clearCacheEntry(contactId, 'documents');
      }
      
      return result;
    } catch (error) {
      //console.error('[MemberDataService] Error deleting document:', error);
      throw error;
    }
  }
  
  // Download doesn't need caching as it returns binary data
  async downloadDocument(contactId, documentId, documentType) {
    return getMemberDocument(contactId, documentId, documentType);
  }

  // VIDEO TESTIMONY
  async getVideoTestimony(contactId) {
    return this.fetchAndCache(contactId, 'videoTestimony', getMemberVideoTestimony);
  }

  async uploadVideoTestimony(contactId, formData) {
    try {
      const result = await uploadMemberVideoTestimony(contactId, formData);
      
      if (result.success) {
        // Clear cache to force refresh
        this.clearCacheEntry(contactId, 'videoTestimony');
      }
      
      return result;
    } catch (error) {
      //console.error('[MemberDataService] Error uploading video testimony:', error);
      throw error;
    }
  }

  async deleteVideoTestimony(contactId) {
    try {
      const result = await deleteMemberVideoTestimony(contactId);
      
      if (result.success) {
        // Clear cache
        this.clearCacheEntry(contactId, 'videoTestimony');
      }
      
      return result;
    } catch (error) {
      //console.error('[MemberDataService] Error deleting video testimony:', error);
      throw error;
    }
  }

  async downloadVideoTestimony(contactId) {
    try {
      //console.log('[VideoTestimony] Downloading video testimony for contact:', contactId);
      
      // Use the full backend URL
      const response = await fetch(`${API_BASE_URL}/api/salesforce/member/${contactId}/video-testimony/download`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'video/mp4, video/*'
        }
      });
  
      // Check if the response is OK before trying to process it
      if (!response.ok) {
        // If the response is not OK, it's likely a JSON error response
        let errorMessage = 'Failed to download video testimony';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If parsing JSON fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
  
      // Get the content type from response headers
      const contentType = response.headers.get('content-type') || 'video/mp4';
      
      // Get the response as blob for binary data
      const blob = await response.blob();
      
      /*console.log('[VideoTestimony] Download successful:', {
        blobSize: blob.size,
        contentType: contentType
      });*/
  
      return {
        success: true,
        data: blob,
        contentType: contentType,
        filename: 'video-testimony.mp4' // You might want to parse this from Content-Disposition header
      };
    } catch (error) {
      console.error('[VideoTestimony] Download error:', error.message);
      throw error;
    }
  }
  
  // Helper to clear a specific cache entry
  clearCacheEntry(contactId, dataType) {
    const cacheKey = this.getCacheKey(contactId, dataType);
    this.cache.delete(cacheKey);
    //console.log(`[MemberDataService] Cleared cache for ${dataType}`);
  }
  
  async preloadInBackground(contactId) {
    if (!contactId) {
      //console.log('[MemberDataService] No contact ID provided for preload');
      return;
    }
  
    if (this.isPreloading) {
      //console.log('[MemberDataService] Already preloading, returning existing promise');
      return this.preloadPromise;
    }
  
    //console.log('[MemberDataService] Starting background preload for contact:', contactId);
    this.isPreloading = true;
  
    this.preloadPromise = Promise.allSettled([
      this.getPersonalInfo(contactId),
      this.getContactInfo(contactId),
      this.getAddresses(contactId),
      this.getFamilyInfo(contactId),
      this.getOccupation(contactId),
      this.getCryoArrangements(contactId),
      this.getEmergencyContacts(contactId),
      this.getFundingInfo(contactId),  // Changed from getInsurance to getFundingInfo
      this.getMedicalInfo(contactId),
      this.getLegalInfo(contactId),
      this.getMemberProfile(contactId),
      this.getDocuments(contactId),
      this.getVideoTestimony(contactId)
    ]).then(results => {
      const errors = results.filter(r => r.status === 'rejected');
      if (errors.length > 0) {
        //console.warn('[MemberDataService] Some preloads failed:', errors);
      }
      //console.log('[MemberDataService] Preload completed');
      this.isPreloading = false;
      return results;
    });
  
    return this.preloadPromise;
  }

  // Clear cache for a specific contact or all data
  clearCache(contactId = null) {
    if (contactId) {
      // Clear all entries for a specific contact
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${contactId}_`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
      //console.log(`[MemberDataService] Cleared cache for contact: ${contactId}`);
    } else {
      // Clear entire cache
      this.cache.clear();
      //console.log('[MemberDataService] Cleared entire cache');
    }
  }

  // Get cache status
  getCacheStatus() {
    const status = {
      size: this.cache.size,
      isPreloading: this.isPreloading,
      entries: {}
    };

    for (const [key, value] of this.cache.entries()) {
      if (!key.includes('_promise')) {
        status.entries[key] = {
          hasData: !!value,
          timestamp: value?.timestamp || null
        };
      }
    }

    return status;
  }
}

// Export singleton instance
export const memberDataService = new MemberDataService();