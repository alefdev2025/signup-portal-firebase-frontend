// services/paymentDataService.js
import { getCustomerPayments, getPaymentSummary } from './netsuite/payments';
import { getInvoiceDetails } from './netsuite/invoices';

class PaymentDataService {
 constructor() {
   this.cache = {
     payments: null,
     lastFetch: null,
     isLoading: false,
     loadPromise: null,
     subscribers: new Set()
   };
   
   // Cache duration - 30 minutes for payment data
   this.CACHE_DURATION = 30 * 60 * 1000;
   
   // Track if user has made changes
   this.hasUserMadeChanges = false;
 }

 // Subscribe to updates
 subscribe(callback) {
   this.cache.subscribers.add(callback);
   return () => this.cache.subscribers.delete(callback);
 }

 // Notify all subscribers
 notifySubscribers() {
   this.cache.subscribers.forEach(callback => callback({
     payments: this.cache.payments,
     isLoading: this.cache.isLoading,
     lastFetch: this.cache.lastFetch
   }));
 }

 // Check if cache is valid
 isCacheValid() {
   if (!this.cache.payments || !this.cache.lastFetch) return false;
   if (this.hasUserMadeChanges) return false;
   
   const age = Date.now() - this.cache.lastFetch;
   return age < this.CACHE_DURATION;
 }

 // Mark that user made changes (like a payment)
 markUserChange() {
   this.hasUserMadeChanges = true;
   this.cache.payments = null; // Clear cache
 }

 // Get payments with smart caching
 async getPayments(customerId, options = {}) {
   // Add validation at the beginning
   if (!customerId) {
     console.warn('No customer ID provided to getPayments');
     return {
       payments: [],
       isLoading: false,
       fromCache: false,
       error: 'Customer ID is required'
     };
   }
   
   const { forceRefresh = false, silent = false } = options;

   // If we have valid cache and not forcing refresh, return it
   if (this.isCacheValid() && !forceRefresh) {
     return {
       payments: this.cache.payments,
       isLoading: false,
       fromCache: true
     };
   }

   // If already loading, return the existing promise
   if (this.cache.isLoading && this.cache.loadPromise) {
     return this.cache.loadPromise;
   }

   // Start loading
   this.cache.isLoading = true;
   if (!silent) {
     this.notifySubscribers();
   }

   // Create the load promise
   this.cache.loadPromise = this._fetchPayments(customerId)
     .then(payments => {
       this.cache.payments = payments;
       this.cache.lastFetch = Date.now();
       this.cache.isLoading = false;
       this.hasUserMadeChanges = false;
       this.notifySubscribers();
       
       return {
         payments: this.cache.payments,
         isLoading: false,
         fromCache: false
       };
     })
     .catch(error => {
       this.cache.isLoading = false;
       this.notifySubscribers();
       throw error;
     })
     .finally(() => {
       this.cache.loadPromise = null;
     });

   return this.cache.loadPromise;
 }

 // Internal fetch method
 async _fetchPayments(customerId) {
   // Add validation
   if (!customerId) {
     console.warn('No customer ID provided to _fetchPayments');
     return [];
   }
   
   console.log('Fetching payments from NetSuite...');
   const startTime = Date.now();
   
   try {
     // Fetch payments
     const result = await getCustomerPayments(customerId, { limit: 100 });
     
     if (!result.success || !result.payments) {
       throw new Error(result.error || 'Failed to load payments');
     }

     // Process payments in parallel for better performance
     const paymentsWithDetails = await this._enrichPaymentsWithInvoiceDetails(result.payments);
     
     console.log(`Payments fetched in ${Date.now() - startTime}ms`);
     
     return paymentsWithDetails;
   } catch (error) {
     console.error('Error fetching payments:', error);
     throw error;
   }
 }

 // Enrich payments with invoice details
 async _enrichPaymentsWithInvoiceDetails(payments) {
   // Batch process invoice details to improve performance
   const invoiceCache = new Map();
   
   const enrichedPayments = await Promise.all(
     payments.map(async (payment) => {
       const invoiceDetails = await Promise.all(
         (payment.appliedTo || []).map(async (applied) => {
           try {
             if (!applied.transactionId) return applied;
             
             // Check cache first
             if (invoiceCache.has(applied.transactionId)) {
               return invoiceCache.get(applied.transactionId);
             }
             
             // Fetch if not cached
             const details = await getInvoiceDetails(applied.transactionId);
             if (details.invoice) {
               const enriched = {
                 ...applied,
                 description: details.invoice.memo || details.invoice.description || 'Invoice',
                 invoiceDate: details.invoice.date || details.invoice.trandate,
                 items: details.invoice.items || []
               };
               invoiceCache.set(applied.transactionId, enriched);
               return enriched;
             }
           } catch (err) {
             console.warn(`Could not fetch details for invoice ${applied.transactionId}:`, err);
           }
           return applied;
         })
       );
       
       return { ...payment, invoiceDetails };
     })
   );
   
   return enrichedPayments;
 }

 // Preload in background (called from login)
 async preloadInBackground(customerId) {
   // Add validation
   if (!customerId) {
     console.log('No customer ID for payment preload - skipping');
     return;
   }
   
   // Don't show loading state for background preload
   return this.getPayments(customerId, { silent: true }).catch(err => {
     console.warn('Background payment preload failed:', err);
   });
 }

 // Clear cache
 clearCache() {
   this.cache.payments = null;
   this.cache.lastFetch = null;
   this.hasUserMadeChanges = false;
   this.notifySubscribers();
 }
}

// Export singleton instance
export const paymentDataService = new PaymentDataService();