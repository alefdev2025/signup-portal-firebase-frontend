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
    getMemberProfile
  } from './salesforce/memberInfo';
  
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
        console.log(`[MemberDataService] Returning cached ${dataType} for contact:`, contactId);
        return this.cache.get(cacheKey);
      }
  
      // Check if we're already fetching this data
      const existingPromise = this.cache.get(`${cacheKey}_promise`);
      if (existingPromise) {
        console.log(`[MemberDataService] Waiting for existing ${dataType} fetch`);
        return existingPromise;
      }
  
      // Fetch the data
      console.log(`[MemberDataService] Fetching ${dataType} for contact:`, contactId);
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
          console.error(`[MemberDataService] Error fetching ${dataType}:`, error);
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
  
    // Preload all member data in the background
    async preloadInBackground(contactId) {
      if (!contactId) {
        console.log('[MemberDataService] No contact ID provided for preload');
        return;
      }
  
      if (this.isPreloading) {
        console.log('[MemberDataService] Already preloading, returning existing promise');
        return this.preloadPromise;
      }
  
      console.log('[MemberDataService] Starting background preload for contact:', contactId);
      this.isPreloading = true;
  
      this.preloadPromise = Promise.allSettled([
        this.getPersonalInfo(contactId),
        this.getContactInfo(contactId),
        this.getAddresses(contactId),
        this.getFamilyInfo(contactId),
        this.getOccupation(contactId),
        this.getCryoArrangements(contactId),
        this.getEmergencyContacts(contactId),
        this.getInsurance(contactId),
        this.getMedicalInfo(contactId),
        this.getLegalInfo(contactId),
        this.getMemberProfile(contactId)
      ]).then(results => {
        const errors = results.filter(r => r.status === 'rejected');
        if (errors.length > 0) {
          console.warn('[MemberDataService] Some preloads failed:', errors);
        }
        console.log('[MemberDataService] Preload completed');
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
        console.log(`[MemberDataService] Cleared cache for contact: ${contactId}`);
      } else {
        // Clear entire cache
        this.cache.clear();
        console.log('[MemberDataService] Cleared entire cache');
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