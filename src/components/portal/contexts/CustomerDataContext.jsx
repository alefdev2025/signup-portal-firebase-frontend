// contexts/CustomerDataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCustomerPayments, getPaymentSummary } from '../services/netsuite/payments';
import { getCustomerInvoices, getInvoiceDetails } from '../services/netsuite/invoices';
import { getSalesOrders } from '../services/netsuite/salesOrders';
import { 
  getCustomerAutopayStatus, 
  updateCustomerAutopayStatus,
  getCustomerBillingSummary,
  getCustomerPaymentMethod,
  verifyAutopayEligibility,
  getCustomerAutopayHistory
} from '../services/netsuite/autopay';

const CustomerDataContext = createContext();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const CustomerDataProvider = ({ children, customerId }) => {
  const [data, setData] = useState({
    payments: null,
    invoices: null,
    salesOrders: null,
    paymentSummary: null,
    autopayStatus: null,
    billingSummary: null,       // NEW
    paymentMethod: null,        // NEW
    autopayEligibility: null,   // NEW
    autopayHistory: null,       // NEW
    isLoading: {
      payments: false,
      invoices: false,
      salesOrders: false,
      paymentSummary: false,
      autopayStatus: false,
      billingSummary: false,    // NEW
      paymentMethod: false,     // NEW
      autopayEligibility: false,// NEW
      autopayHistory: false     // NEW
    },
    errors: {
      payments: null,
      invoices: null,
      salesOrders: null,
      paymentSummary: null,
      autopayStatus: null,
      billingSummary: null,     // NEW
      paymentMethod: null,      // NEW
      autopayEligibility: null, // NEW
      autopayHistory: null      // NEW
    },
    lastFetch: {
      payments: null,
      invoices: null,
      salesOrders: null,
      paymentSummary: null,
      autopayStatus: null,
      billingSummary: null,     // NEW
      paymentMethod: null,      // NEW
      autopayEligibility: null, // NEW
      autopayHistory: null      // NEW
    }
  });

  // In CustomerDataContext.jsx
  useEffect(() => {
    // Check if data was already loaded by backgroundDataLoader
    if (window.backgroundDataLoader && customerId) {
      const loadedData = window.backgroundDataLoader.getLoadedData();
      
      if (loadedData?.invoices) {
        console.log('[CustomerDataContext] Found preloaded invoices:', loadedData.invoices);
        setData(prev => ({
          ...prev,
          invoices: loadedData.invoices,
          lastFetch: { ...prev.lastFetch, invoices: Date.now() }
        }));
      }
      
      if (loadedData?.payments) {
        console.log('[CustomerDataContext] Found preloaded payments:', loadedData.payments);
        setData(prev => ({
          ...prev,
          payments: loadedData.payments,
          lastFetch: { ...prev.lastFetch, payments: Date.now() }
        }));
      }
    }
  }, [customerId]); // Add customerId as dependency

  // Check if data is stale
  const isDataStale = (dataType) => {
    const lastFetch = data.lastFetch[dataType];
    if (!lastFetch) return true;
    return Date.now() - lastFetch > CACHE_DURATION;
  };

  // Generic data fetcher with caching
  const fetchData = useCallback(async (dataType, fetchFunction, options = {}) => {
    // If data exists and isn't stale, return cached version
    if (data[dataType] && !isDataStale(dataType) && !options.forceRefresh) {
      return data[dataType];
    }

    // Set loading state
    setData(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, [dataType]: true },
      errors: { ...prev.errors, [dataType]: null }
    }));

    try {
      const result = await fetchFunction();
      
      setData(prev => ({
        ...prev,
        [dataType]: result,
        lastFetch: { ...prev.lastFetch, [dataType]: Date.now() },
        isLoading: { ...prev.isLoading, [dataType]: false }
      }));

      return result;
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error);
      
      setData(prev => ({
        ...prev,
        errors: { ...prev.errors, [dataType]: error.message },
        isLoading: { ...prev.isLoading, [dataType]: false }
      }));
      
      throw error;
    }
  }, [data]);

  // Fetch payments with invoice details
  const fetchPaymentsWithDetails = useCallback(async (options = {}) => {
    return fetchData('payments', async () => {
      const result = await getCustomerPayments(customerId, { limit: 100 });
      
      if (result.success && result.payments) {
        // Fetch invoice details for each payment
        const paymentsWithDetails = await Promise.all(
          result.payments.map(async (payment) => {
            const invoiceDetails = await Promise.all(
              (payment.appliedTo || []).map(async (applied) => {
                try {
                  if (applied.transactionId) {
                    const details = await getInvoiceDetails(applied.transactionId);
                    if (details.invoice) {
                      return {
                        ...applied,
                        description: details.invoice.memo || details.invoice.description,
                        invoiceDate: details.invoice.date || details.invoice.trandate,
                        items: details.invoice.items || []
                      };
                    }
                  }
                } catch (err) {
                  console.warn(`Could not fetch invoice ${applied.transactionId}:`, err);
                }
                return applied;
              })
            );
            
            return { ...payment, invoiceDetails };
          })
        );
        
        return { ...result, payments: paymentsWithDetails };
      }
      
      return result;
    }, options);
  }, [customerId, fetchData]);

  // Fetch invoices
  const fetchInvoices = useCallback(async (options = {}) => {
    return fetchData('invoices', async () => {
      return await getCustomerInvoices(customerId, { limit: 100 });
    }, options);
  }, [customerId, fetchData]);

  // Fetch sales orders
  /*const fetchSalesOrders = useCallback(async (options = {}) => {
    return fetchData('salesOrders', async () => {
      return await getSalesOrders(customerId, { limit: 100 });
    }, options);
  }, [customerId, fetchData]);*/

  // Fetch payment summary
  const fetchPaymentSummary = useCallback(async (options = {}) => {
    return fetchData('paymentSummary', async () => {
      return await getPaymentSummary(customerId);
    }, options);
  }, [customerId, fetchData]);

  // UPDATED: Fetch autopay status using sales order analysis
  const fetchAutopayStatus = useCallback(async (options = {}) => {
    return fetchData('autopayStatus', async () => {
      // Fetch autopay analysis from sales orders
      const autopayResult = await getCustomerAutopayStatus(customerId);
      
      // Also fetch billing summary and payment method for complete picture
      const [billingSummary, paymentMethod] = await Promise.all([
        getCustomerBillingSummary(customerId).catch(err => {
          console.warn('Failed to fetch billing summary:', err);
          return null;
        }),
        getCustomerPaymentMethod(customerId).catch(err => {
          console.warn('Failed to fetch payment method:', err);
          return null;
        })
      ]);
      
      // Store billing summary and payment method in state as well
      if (billingSummary) {
        setData(prev => ({
          ...prev,
          billingSummary: billingSummary.summary || billingSummary,
          lastFetch: { ...prev.lastFetch, billingSummary: Date.now() }
        }));
      }
      
      if (paymentMethod) {
        setData(prev => ({
          ...prev,
          paymentMethod: paymentMethod,
          lastFetch: { ...prev.lastFetch, paymentMethod: Date.now() }
        }));
      }
      
      return autopayResult;
    }, options);
  }, [customerId, fetchData]);

  // NEW: Fetch billing summary
  const fetchBillingSummary = useCallback(async (options = {}) => {
    return fetchData('billingSummary', async () => {
      const result = await getCustomerBillingSummary(customerId);
      return result.summary || result;
    }, options);
  }, [customerId, fetchData]);

  // NEW: Fetch payment method
  const fetchPaymentMethod = useCallback(async (options = {}) => {
    return fetchData('paymentMethod', async () => {
      return await getCustomerPaymentMethod(customerId);
    }, options);
  }, [customerId, fetchData]);

  // NEW: Fetch autopay eligibility
  const fetchAutopayEligibility = useCallback(async (options = {}) => {
    return fetchData('autopayEligibility', async () => {
      return await verifyAutopayEligibility(customerId);
    }, options);
  }, [customerId, fetchData]);

  // NEW: Fetch autopay history
  const fetchAutopayHistory = useCallback(async (options = {}) => {
    return fetchData('autopayHistory', async () => {
      return await getCustomerAutopayHistory(customerId, options);
    }, options);
  }, [customerId, fetchData]);

  // UPDATED: Update autopay status (now includes new analysis)
  const updateAutopay = useCallback(async (enabled) => {
    // Set loading state
    setData(prev => ({
      ...prev,
      isLoading: { ...prev.isLoading, autopayStatus: true },
      errors: { ...prev.errors, autopayStatus: null }
    }));

    try {
      const result = await updateCustomerAutopayStatus(customerId, enabled);
      
      if (result.success) {
        // Update the cached autopay status with the new analysis
        setData(prev => ({
          ...prev,
          autopayStatus: result.autopayAnalysis || {
            ...prev.autopayStatus,
            autopayEnabled: result.actualAutopayStatus,
            lastChecked: new Date().toISOString()
          },
          lastFetch: { ...prev.lastFetch, autopayStatus: Date.now() },
          isLoading: { ...prev.isLoading, autopayStatus: false }
        }));
        
        // Refresh billing summary as it might have changed
        fetchBillingSummary({ forceRefresh: true });
        
        // Also refresh eligibility
        fetchAutopayEligibility({ forceRefresh: true });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating autopay:', error);
      
      setData(prev => ({
        ...prev,
        errors: { ...prev.errors, autopayStatus: error.message },
        isLoading: { ...prev.isLoading, autopayStatus: false }
      }));
      
      throw error;
    }
  }, [customerId, fetchBillingSummary, fetchAutopayEligibility]);

  // Prefetch all data on mount
  useEffect(() => {
    if (customerId) {
      // Start all fetches in parallel
      Promise.all([
        fetchPaymentsWithDetails().catch(err => console.error('Failed to prefetch payments:', err)),
        fetchInvoices().catch(err => console.error('Failed to prefetch invoices:', err)),
        //fetchSalesOrders().catch(err => console.error('Failed to prefetch sales orders:', err)),
        fetchPaymentSummary().catch(err => console.error('Failed to prefetch payment summary:', err)),
        fetchAutopayStatus().catch(err => console.error('Failed to prefetch autopay status:', err))
        // Note: billing summary and payment method are fetched as part of autopay status
      ]);
    }
  }, [customerId]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    const options = { forceRefresh: true };
    
    await Promise.all([
      fetchPaymentsWithDetails(options),
      fetchInvoices(options),
      //fetchSalesOrders(options),
      fetchPaymentSummary(options),
      fetchAutopayStatus(options),
      fetchBillingSummary(options),
      fetchPaymentMethod(options),
      fetchAutopayEligibility(options)
    ]);
  }, [fetchPaymentsWithDetails, fetchInvoices, fetchPaymentSummary, fetchAutopayStatus, 
      fetchBillingSummary, fetchPaymentMethod, fetchAutopayEligibility]);

  // Get specific data type with automatic refresh if stale
  const getData = useCallback((dataType) => {
    if (isDataStale(dataType) && !data.isLoading[dataType]) {
      // Trigger background refresh
      switch(dataType) {
        case 'payments':
          fetchPaymentsWithDetails();
          break;
        case 'invoices':
          fetchInvoices();
          break;
        case 'salesOrders':
          //fetchSalesOrders();
          break;
        case 'paymentSummary':
          fetchPaymentSummary();
          break;
        case 'autopayStatus':
          fetchAutopayStatus();
          break;
        case 'billingSummary':
          fetchBillingSummary();
          break;
        case 'paymentMethod':
          fetchPaymentMethod();
          break;
        case 'autopayEligibility':
          fetchAutopayEligibility();
          break;
        case 'autopayHistory':
          fetchAutopayHistory();
          break;
      }
    }
    
    return {
      data: data[dataType],
      isLoading: data.isLoading[dataType],
      error: data.errors[dataType]
    };
  }, [data, fetchPaymentsWithDetails, fetchInvoices, fetchPaymentSummary, 
      fetchAutopayStatus, fetchBillingSummary, fetchPaymentMethod, 
      fetchAutopayEligibility, fetchAutopayHistory]);

  const value = {
    // Direct data access
    payments: data.payments,
    invoices: data.invoices,
    salesOrders: data.salesOrders,
    paymentSummary: data.paymentSummary,
    autopayStatus: data.autopayStatus,
    billingSummary: data.billingSummary,         // NEW
    paymentMethod: data.paymentMethod,           // NEW
    autopayEligibility: data.autopayEligibility, // NEW
    autopayHistory: data.autopayHistory,         // NEW
    
    // Loading states
    isLoading: data.isLoading,
    
    // Errors
    errors: data.errors,
    
    // Methods
    getData,
    refreshAllData,
    fetchPaymentsWithDetails,
    fetchInvoices,
    //fetchSalesOrders,
    fetchPaymentSummary,
    fetchAutopayStatus,
    fetchBillingSummary,        // NEW
    fetchPaymentMethod,         // NEW
    fetchAutopayEligibility,    // NEW
    fetchAutopayHistory,        // NEW
    updateAutopay,
    
    // Utility
    isDataStale
  };

  return (
    <CustomerDataContext.Provider value={value}>
      {children}
    </CustomerDataContext.Provider>
  );
};

// Hook to use the customer data
export const useCustomerData = () => {
  const context = useContext(CustomerDataContext);
  if (!context) {
    throw new Error('useCustomerData must be used within CustomerDataProvider');
  }
  return context;
};

// Specific hooks for each data type
export const usePayments = () => {
  const { getData } = useCustomerData();
  return getData('payments');
};

export const useInvoices = () => {
  const { getData } = useCustomerData();
  return getData('invoices');
};

export const useSalesOrders = () => {
  const { getData } = useCustomerData();
  return getData('salesOrders');
};

export const usePaymentSummary = () => {
  const { getData } = useCustomerData();
  return getData('paymentSummary');
};

// ENHANCED: Autopay hook with complete data
export const useAutopay = () => {
  const { 
    getData, 
    updateAutopay, 
    fetchAutopayEligibility,
    fetchAutopayHistory,
    billingSummary,
    paymentMethod,
    autopayEligibility
  } = useCustomerData();
  
  const autopayData = getData('autopayStatus');
  const eligibilityData = getData('autopayEligibility');
  const historyData = getData('autopayHistory');
  
  return {
    ...autopayData,
    updateAutopay,
    verifyEligibility: fetchAutopayEligibility,
    fetchHistory: fetchAutopayHistory,
    billingSummary,
    paymentMethod,
    eligibility: eligibilityData.data,
    history: historyData.data,
    // Convenience getters from sales order analysis
    isOnAutopay: autopayData.data?.autopayEnabled || false,
    confidence: autopayData.data?.confidence || 0,
    autopayStatus: autopayData.data?.autopayStatus || 'UNKNOWN',
    cardDetails: autopayData.data?.cardDetails || null,
    billingSchedule: autopayData.data?.billingSchedule || 'UNKNOWN',
    evidence: autopayData.data?.evidence || [],
    // Eligibility shortcuts
    canEnableAutopay: eligibilityData.data?.eligible || false,
    eligibilityReason: eligibilityData.data?.reason || null,
    requiresStaffIntervention: eligibilityData.data?.requiresStaffIntervention || false
  };
};

// NEW: Billing summary hook
export const useBillingSummary = () => {
  const { getData } = useCustomerData();
  return getData('billingSummary');
};

// NEW: Payment method hook
export const usePaymentMethod = () => {
  const { getData } = useCustomerData();
  return getData('paymentMethod');
};