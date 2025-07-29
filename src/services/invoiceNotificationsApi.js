// src/services/invoiceNotificationsApi.js
import { auth } from './firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('[InvoiceNotificationsAPI] No current user');
      return null;
    }
    const token = await user.getIdToken();
    console.log('[InvoiceNotificationsAPI] Got auth token:', token ? 'Yes' : 'No');
    return token;
  } catch (error) {
    console.error('[InvoiceNotificationsAPI] Error getting auth token:', error);
    return null;
  }
};

// Helper function to make requests
const makeRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[InvoiceNotificationsAPI] Making request to: ${url}`);
  console.log('[InvoiceNotificationsAPI] Method:', options.method || 'GET');
  if (options.body) {
    console.log('[InvoiceNotificationsAPI] Body:', options.body);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    console.log(`[InvoiceNotificationsAPI] Response status: ${response.status}`);
    console.log(`[InvoiceNotificationsAPI] Response statusText: ${response.statusText}`);

    const responseText = await response.text();
    console.log('[InvoiceNotificationsAPI] Response body:', responseText);
    
    let responseData = null;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.log('[InvoiceNotificationsAPI] Response is not JSON');
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData || { success: true };
  } catch (error) {
    console.error('[InvoiceNotificationsAPI] Request error:', error);
    throw error;
  }
};

// Create the invoiceNotificationsApi object with all methods
export const invoiceNotificationsApi = {
  async getSettings() {
    console.log('[InvoiceNotificationsAPI] Getting notification settings...');
    try {
      const data = await makeRequest('/api/invoice-notifications');
      console.log('[InvoiceNotificationsAPI] Settings received:', data);
      return data;
    } catch (error) {
      console.error('[InvoiceNotificationsAPI] Error getting settings:', error);
      return {
        success: false,
        newInvoiceAlerts: false,
        paymentFailureAlerts: false,
        notificationEmail: '',
        error: error.message
      };
    }
  },
  
  async updateSettings(updates) {
    console.log('[InvoiceNotificationsAPI] Updating notification settings:', updates);
    try {
      const data = await makeRequest('/api/invoice-notifications', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      console.log('[InvoiceNotificationsAPI] Settings updated:', data);
      return data;
    } catch (error) {
      console.error('[InvoiceNotificationsAPI] Error updating settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async toggleNotification(type, enabled) {
    console.log('[InvoiceNotificationsAPI] Toggling notification:', type, enabled);
    try {
      const data = await makeRequest('/api/invoice-notifications/toggle', {
        method: 'POST',
        body: JSON.stringify({ type, enabled })
      });
      console.log('[InvoiceNotificationsAPI] Notification toggled:', data);
      return data;
    } catch (error) {
      console.error('[InvoiceNotificationsAPI] Error toggling notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async restoreDefaults() {
    console.log('[InvoiceNotificationsAPI] Restoring default settings...');
    try {
      const data = await makeRequest('/api/invoice-notifications/restore-defaults', {
        method: 'POST'
      });
      console.log('[InvoiceNotificationsAPI] Defaults restored:', data);
      return data;
    } catch (error) {
      console.error('[InvoiceNotificationsAPI] Error restoring defaults:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// IMPORTANT: Default export as well for compatibility
export default invoiceNotificationsApi;