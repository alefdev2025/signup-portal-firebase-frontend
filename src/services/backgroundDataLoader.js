// services/backgroundDataLoader.js - Optimized version
import { memberDataService } from '../components/portal/services/memberDataService';
import { paymentDataService } from '../components/portal/services/paymentDataService';
import { getMemberCategory } from '../components/portal/services/salesforce/memberInfo';
import { getDocuments } from '../components/portal/services/salesforce/memberDocuments';
import { getNotifications } from './notifications';
//import { fetchCustomerInvoices } from '../components/portal/services/netsuite';
import { getCustomerInvoices } from '../components/portal/services/netsuite/invoices';
import { getCustomerPayments } from '../components/portal/services/netsuite/payments';



class BackgroundDataLoader {
  constructor() {
    this.loadingPromises = new Map();
    this.loadedData = new Map();
    this.isLoading = false;
  }

  // Start loading all member data in background
  async loadMemberDataInBackground(salesforceContactId, netsuiteCustomerId) {
    if (!salesforceContactId) {
      console.log('[BackgroundLoader] No Salesforce ID, skipping member data load');
      return;
    }

    if (this.isLoading) {
      console.log('[BackgroundLoader] Already loading, skipping duplicate request');
      return;
    }

    this.isLoading = true;
    console.log('[BackgroundLoader] Starting background data load...');

    // Load data in parallel batches for speed
    // Batch 1: Critical user data (load immediately)
    const batch1 = [
      this.loadPersonalInfo(salesforceContactId),
      this.loadContactInfo(salesforceContactId),
      this.loadCategory(salesforceContactId),
      this.loadNotifications()
    ];

    // Batch 2: Important data (load after 500ms)
    const batch2 = () => Promise.all([
      this.loadAddresses(salesforceContactId),
      this.loadMedicalInfo(salesforceContactId),
      this.loadEmergencyContacts(salesforceContactId),
      this.loadInsurance(salesforceContactId),
      this.loadDocuments(salesforceContactId)
    ]);

    // Batch 3: Additional data (load after 1 second)
    const batch3 = () => Promise.all([
      this.loadFamilyInfo(salesforceContactId),
      this.loadOccupation(salesforceContactId),
      this.loadCryoArrangements(salesforceContactId),
      this.loadLegalInfo(salesforceContactId),
      this.loadFundingInfo(salesforceContactId),
      this.isValidNetsuiteId(netsuiteCustomerId) ? this.loadInvoices(netsuiteCustomerId) : Promise.resolve(),
      this.isValidNetsuiteId(netsuiteCustomerId) ? this.loadPayments(netsuiteCustomerId) : Promise.resolve()
    ]);

    // Batch 4: Payment data if available (load after 1.5 seconds)
    const batch4 = () => {
      if (this.isValidNetsuiteId(netsuiteCustomerId)) {
        return this.loadPaymentData(netsuiteCustomerId);
      }
      return Promise.resolve();
    };

    // Execute batches with delays
    try {
      // Start batch 1 immediately
      await Promise.all(batch1);
      console.log('[BackgroundLoader] Batch 1 complete (personal, contact, category, notifications)');

      // Start batch 2 after short delay
      setTimeout(async () => {
        try {
          await batch2();
          console.log('[BackgroundLoader] Batch 2 complete (addresses, medical, emergency, insurance, documents)');
        } catch (error) {
          console.error('[BackgroundLoader] Batch 2 error:', error);
        }
      }, 500);

      // Start batch 3 after 1 second
      setTimeout(async () => {
        try {
          await batch3();
          console.log('[BackgroundLoader] Batch 3 complete (family, occupation, cryo, legal, funding)');
        } catch (error) {
          console.error('[BackgroundLoader] Batch 3 error:', error);
        }
      }, 1000);

      // Start batch 4 after 1.5 seconds
      setTimeout(async () => {
        try {
          await batch4();
          console.log('[BackgroundLoader] Batch 4 complete (payment data)');
        } catch (error) {
          console.error('[BackgroundLoader] Batch 4 error:', error);
        } finally {
          this.isLoading = false;
          console.log('[BackgroundLoader] All batches complete');
        }
      }, 1500);

    } catch (error) {
      console.error('[BackgroundLoader] Batch 1 error:', error);
      this.isLoading = false;
    }
  }

  isValidNetsuiteId(id) {
    return id && id !== 'null' && id !== 'undefined' && id !== '' && id !== null && id !== undefined;
  }

  // Add notifications loader
  async loadNotifications() {
    try {
      console.log('[BackgroundLoader] Loading notifications...');
      const data = await getNotifications();
      this.loadedData.set('notifications', data);
      this.notifyDataLoaded('notifications', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading notifications:', error);
      // Still notify with empty array so UI knows loading is complete
      this.notifyDataLoaded('notifications', []);
    }
  }

  async loadInvoices(netsuiteCustomerId) {
    try {
      console.log('[BackgroundLoader] Loading invoices...');
      const data = await getCustomerInvoices(netsuiteCustomerId, { limit: 100 });
      this.loadedData.set('invoices', data);
      this.notifyDataLoaded('invoices', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading invoices:', error);
      this.notifyDataLoaded('invoices', { success: false, data: [] });
    }
  }
  
  async loadPayments(netsuiteCustomerId) {
    try {
      console.log('[BackgroundLoader] Loading payments...');
      const data = await getCustomerPayments(netsuiteCustomerId, { limit: 100 });
      this.loadedData.set('payments', data);
      this.notifyDataLoaded('payments', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading payments:', error);
      this.notifyDataLoaded('payments', { success: false, data: [] });
    }
  }

  async loadDocuments(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading documents...');
      const data = await memberDataService.getDocuments(salesforceContactId);
      this.loadedData.set('documents', data);
      this.notifyDataLoaded('documents', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading documents:', error);
    }
  }

  // Individual loaders with error handling (keep existing methods)
  async loadPersonalInfo(salesforceContactId) {
    try {
      const data = await memberDataService.getPersonalInfo(salesforceContactId);
      this.loadedData.set('personal', data);
      this.notifyDataLoaded('personal', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading personal info:', error);
    }
  }

  async loadContactInfo(salesforceContactId) {
    try {
      const data = await memberDataService.getContactInfo(salesforceContactId);
      this.loadedData.set('contact', data);
      this.notifyDataLoaded('contact', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading contact info:', error);
    }
  }

  async loadAddresses(salesforceContactId) {
    try {
      const data = await memberDataService.getAddresses(salesforceContactId);
      this.loadedData.set('addresses', data);
      this.notifyDataLoaded('addresses', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading addresses:', error);
    }
  }

  async loadFamilyInfo(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading family info...');
      const data = await memberDataService.getFamilyInfo(salesforceContactId);
      this.loadedData.set('family', data);
      this.notifyDataLoaded('family', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading family info:', error);
    }
  }

  async loadOccupation(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading occupation...');
      const data = await memberDataService.getOccupation(salesforceContactId);
      this.loadedData.set('occupation', data);
      this.notifyDataLoaded('occupation', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading occupation:', error);
    }
  }

  async loadMedicalInfo(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading medical info...');
      const data = await memberDataService.getMedicalInfo(salesforceContactId);
      this.loadedData.set('medical', data);
      this.notifyDataLoaded('medical', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading medical info:', error);
    }
  }

  async loadCryoArrangements(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading cryo arrangements...');
      const data = await memberDataService.getCryoArrangements(salesforceContactId);
      this.loadedData.set('cryo', data);
      this.notifyDataLoaded('cryo', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading cryo arrangements:', error);
    }
  }

  async loadLegalInfo(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading legal info...');
      const data = await memberDataService.getLegalInfo(salesforceContactId);
      this.loadedData.set('legal', data);
      this.notifyDataLoaded('legal', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading legal info:', error);
    }
  }

  async loadEmergencyContacts(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading emergency contacts...');
      const data = await memberDataService.getEmergencyContacts(salesforceContactId);
      this.loadedData.set('emergency', data);
      this.notifyDataLoaded('emergency', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading emergency contacts:', error);
    }
  }

  async loadInsurance(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading insurance...');
      const data = await memberDataService.getInsurance(salesforceContactId);
      this.loadedData.set('insurance', data);
      this.notifyDataLoaded('insurance', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading insurance:', error);
    }
  }

  async loadCategory(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading category...');
      const data = await getMemberCategory(salesforceContactId);
      this.loadedData.set('category', data);
      this.notifyDataLoaded('category', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading category:', error);
    }
  }

  async loadFundingInfo(salesforceContactId) {
    try {
      console.log('[BackgroundLoader] Loading funding info...');
      const data = await memberDataService.getFundingInfo(salesforceContactId);
      this.loadedData.set('funding', data);
      this.notifyDataLoaded('funding', data);
    } catch (error) {
      console.error('[BackgroundLoader] Error loading funding info:', error);
    }
  }

  async loadPaymentData(netsuiteCustomerId) {
    try {
      console.log('[BackgroundLoader] Starting payment data preload...');
      await paymentDataService.preloadInBackground(netsuiteCustomerId);
      console.log('[BackgroundLoader] Payment data preloaded');
    } catch (error) {
      console.error('[BackgroundLoader] Error loading payment data:', error);
    }
  }

  // Get loaded data
  getLoadedData() {
    const data = {};
    this.loadedData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  // Subscribe to data updates
  subscribe(callback) {
    this.callback = callback;
  }

  notifyDataLoaded(type, data) {
    if (this.callback) {
      this.callback(type, data);
    }
  }

  // Clear all data
  clear() {
    this.loadingPromises.clear();
    this.loadedData.clear();
    this.isLoading = false;
  }
}

// Export singleton instance
export const backgroundDataLoader = new BackgroundDataLoader();

// Make it available globally for CustomerDataContext
if (typeof window !== 'undefined') {
  window.backgroundDataLoader = backgroundDataLoader;
}