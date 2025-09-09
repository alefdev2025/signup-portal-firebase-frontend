// src/services/settingsApi.js
import { auth } from './firebase';

//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
import { API_BASE_URL } from '../config/api';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('[SettingsAPI] No current user');
      return null;
    }
    const token = await user.getIdToken();
    console.log('[SettingsAPI] Got auth token:', token ? 'Yes' : 'No');
    return token;
  } catch (error) {
    console.error('[SettingsAPI] Error getting auth token:', error);
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
  console.log(`[SettingsAPI] Making request to: ${url}`);
  console.log('[SettingsAPI] Method:', options.method || 'GET');
  if (options.body) {
    console.log('[SettingsAPI] Body:', options.body);
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

    console.log(`[SettingsAPI] Response status: ${response.status}`);
    console.log(`[SettingsAPI] Response statusText: ${response.statusText}`);

    const responseText = await response.text();
    //console.log('[SettingsAPI] Response body:', responseText);
    
    let responseData = null;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.log('[SettingsAPI] Response is not JSON');
    }

    if (!response.ok) {
      const errorMessage = responseData?.error || responseData?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData || { success: true };
  } catch (error) {
    console.error('[SettingsAPI] Request error:', error);
    throw error;
  }
};

// Create the settingsApi object with all methods
export const settingsApi = {
  async getSettings() {
    console.log('[SettingsAPI] Getting settings...');
    try {
      const data = await makeRequest('/api/settings');
      console.log('[SettingsAPI] Settings received:', data);
      return data;
    } catch (error) {
      console.error('[SettingsAPI] Error getting settings:', error);
      return {
        success: false,
        receiveMediaNotifications: false,
        receiveStaffMessages: true,
        twoFactorEnabled: false,
        error: error.message
      };
    }
  },
  
  async updateSettings(updates) {
    console.log('[SettingsAPI] Updating settings:', updates);
    try {
      const data = await makeRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      console.log('[SettingsAPI] Settings updated:', data);
      return data;
    } catch (error) {
      console.error('[SettingsAPI] Error updating settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async setup2FA() {
    console.log('[SettingsAPI] Setting up 2FA...');
    try {
      const data = await makeRequest('/api/settings/2fa/setup', {
        method: 'POST'
      });
      console.log('[SettingsAPI] 2FA setup response:', data);
      return data;
    } catch (error) {
      console.error('[SettingsAPI] Error setting up 2FA:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async enable2FA(code) {
    console.log('[SettingsAPI] Enabling 2FA with code:', code);
    try {
      const data = await makeRequest('/api/settings/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() })
      });
      console.log('[SettingsAPI] 2FA enabled:', data);
      return data;
    } catch (error) {
      console.error('[SettingsAPI] Error enabling 2FA:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async disable2FA(code) {
    console.log('[SettingsAPI] Disabling 2FA with code:', code);
    try {
      const data = await makeRequest('/api/settings/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() })
      });
      console.log('[SettingsAPI] 2FA disabled:', data);
      return data;
    } catch (error) {
      console.error('[SettingsAPI] Error disabling 2FA:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async cancel2FASetup() {
    console.log('[SettingsAPI] Cancelling 2FA setup...');
    try {
      const data = await makeRequest('/api/settings/2fa/cancel', {
        method: 'POST'
      });
      console.log('[SettingsAPI] 2FA setup cancelled:', data);
      return data;
    } catch (error) {
      console.error('[SettingsAPI] Error cancelling 2FA setup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// IMPORTANT: Default export as well for compatibility
export default settingsApi;