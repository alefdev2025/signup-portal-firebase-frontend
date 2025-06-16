// contexts/CustomerDataContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCustomerPayments, getPaymentSummary } from '../services/netsuite/payments';
import { getCustomerInvoices, getInvoiceDetails } from '../services/netsuite/invoices';
import { getSalesOrders } from '../services/netsuite/salesOrders';

const CustomerDataContext = createContext();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const CustomerDataProvider = ({ children, customerId }) => {
  const [data, setData] = useState({
    payments: null,
    invoices: null,
    salesOrders: null,
    paymentSummary: null,
    isLoading: {
      payments: false,
      invoices: false,
      salesOrders: false,
      paymentSummary: false
    },
    errors: {
      payments: null,
      invoices: null,
      salesOrders: null,
      paymentSummary: null
    },
    lastFetch: {
      payments: null,
      invoices: null,
      salesOrders: null,
      paymentSummary: null
    }
  });

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

  // Prefetch all data on mount
  useEffect(() => {
    if (customerId) {
      // Start all fetches in parallel
      Promise.all([
        fetchPaymentsWithDetails().catch(err => console.error('Failed to prefetch payments:', err)),
        fetchInvoices().catch(err => console.error('Failed to prefetch invoices:', err)),
        //fetchSalesOrders().catch(err => console.error('Failed to prefetch sales orders:', err)),
        fetchPaymentSummary().catch(err => console.error('Failed to prefetch payment summary:', err))
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
      fetchPaymentSummary(options)
    ]);
  }, [fetchPaymentsWithDetails, fetchInvoices, fetchPaymentSummary]);

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
      }
    }
    
    return {
      data: data[dataType],
      isLoading: data.isLoading[dataType],
      error: data.errors[dataType]
    };
  }, [data, fetchPaymentsWithDetails, fetchInvoices, fetchPaymentSummary]);

  const value = {
    // Direct data access
    payments: data.payments,
    invoices: data.invoices,
    salesOrders: data.salesOrders,
    paymentSummary: data.paymentSummary,
    
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