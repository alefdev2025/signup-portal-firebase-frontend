// src/components/portal/services/salesforce.jsx
//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app' || 'http://localhost:8080';
import { API_BASE_URL } from '../../../../config/api';

/**
 * Search for a Salesforce customer by email
 */
export const searchCustomerByEmail = async (email) => {
  try {
    //console.log('[Salesforce Service] Searching for customer with email:', email);
    //console.log('[Salesforce Service] Using API URL:', API_BASE_URL);
    
    const url = `${API_BASE_URL}/api/salesforce/customers/search?email=${encodeURIComponent(email)}`;
    console.log('[Salesforce Service] Full URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('[Salesforce Service] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Salesforce Service] Error response:', errorText);
      
      // Return a failed response instead of throwing
      return {
        success: false,
        error: `Failed to search customer: ${response.statusText}`,
        data: null
      };
    }

    const data = await response.json();
    console.log('[Salesforce Service] Success - Data received:', data);
    return data;
  } catch (error) {
    console.error('[Salesforce Service] Error searching customer:', error);
    // Return a failed response instead of throwing to prevent breaking the auth flow
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Get Salesforce customer by ID
 */
export const getCustomerById = async (customerId) => {
  try {
    console.log('[Salesforce Service] Getting customer by ID:', customerId);
    
    const url = `${API_BASE_URL}/api/salesforce/customers/${customerId}`;
    console.log('[Salesforce Service] Full URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('[Salesforce Service] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Salesforce Service] Error response:', errorText);
      
      // Return a failed response instead of throwing
      return {
        success: false,
        error: `Failed to get customer: ${response.statusText}`,
        data: null
      };
    }

    const data = await response.json();
    console.log('[Salesforce Service] Success - Data received:', data);
    return data;
  } catch (error) {
    console.error('[Salesforce Service] Error fetching customer:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Extract NetSuite ID from NetSuite URL if needed
 */
export const extractIdFromUrl = (url) => {
  if (!url) return null;
  
  // NetSuite URLs typically have format: .../customer.nl?id=12345&...
  const match = url.match(/[?&]id=(\d+)/);
  return match ? match[1] : null;
};