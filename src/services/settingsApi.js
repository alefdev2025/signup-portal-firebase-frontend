// src/services/settingsApi.js
import { auth } from './firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

// Get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await user.getIdToken();
};

// Settings API service
export const settingsApi = {
  // Get all user settings
  async getSettings() {
    console.log('⚙️ [Settings] Fetching user settings...');
    
    try {
      const token = await getAuthToken();
      const url = `${API_BASE_URL}/api/member/settings`;
      
      console.log('🌐 [Settings] Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 [Settings] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Settings] Error response:', errorText);
        throw new Error(`Failed to fetch settings: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [Settings] Success! Settings received:', data.settings);
      
      return data.settings;
    } catch (error) {
      console.error('❌ [Settings] Error in getSettings:', error);
      console.error('❌ [Settings] Error stack:', error.stack);
      throw error;
    }
  },

  // Update all settings at once
  async updateSettings(settings) {
    console.log('⚙️ [Settings] Updating all settings...', settings);
    
    try {
      const token = await getAuthToken();
      const url = `${API_BASE_URL}/api/member/settings`;
      
      console.log('🌐 [Settings] Updating at:', url);
      console.log('📤 [Settings] Request body:', settings);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      console.log('📥 [Settings] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Settings] Error response:', errorText);
        console.error('❌ [Settings] Full error details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorBody: errorText
        });
        throw new Error(`Failed to update settings: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [Settings] Success! Settings updated:', {
        success: data.success,
        message: data.message,
        settings: data.settings
      });
      
      return data;
    } catch (error) {
      console.error('❌ [Settings] Error in updateSettings:', error);
      console.error('❌ [Settings] Error stack:', error.stack);
      throw error;
    }
  },

  // Update a single setting
  async updateSetting(settingName, value) {
    console.log('⚙️ [Settings] Updating single setting...', { settingName, value });
    
    try {
      const token = await getAuthToken();
      // Using PUT instead of PATCH to avoid CORS issue
      const url = `${API_BASE_URL}/api/member/settings`;
      
      console.log('🌐 [Settings] Updating at:', url);
      console.log('📤 [Settings] Request body:', { [settingName]: value });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [settingName]: value })
      });
      
      console.log('📥 [Settings] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Settings] Error response:', errorText);
        console.error('❌ [Settings] Full error details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorBody: errorText,
          setting: settingName,
          value: value
        });
        throw new Error(`Failed to update setting: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [Settings] Success! Setting updated:', {
        success: data.success,
        message: data.message,
        setting: settingName,
        value: value
      });
      
      return data;
    } catch (error) {
      console.error('❌ [Settings] Error in updateSetting:', error);
      console.error('❌ [Settings] Error stack:', error.stack);
      throw error;
    }
  }
};