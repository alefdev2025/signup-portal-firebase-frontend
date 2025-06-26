// services/staffApi.js
import { auth } from './firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

// Helper to get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.getIdToken();
};

// Helper to handle API responses
const handleResponse = async (response) => {
  if (response.status === 403) {
    // Access denied - redirect to login or show error
    throw new Error('Access denied. Staff privileges required.');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  
  return response.json();
};

// Staff API methods
export const staffApi = {
  // Check if current user is staff
  async checkAccess() {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/staff/check-access`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Get staff dashboard stats
  async getDashboardStats() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },

  // Create announcement
  async createAnnouncement(data) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/notifications/announcement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },

  // Create media item
  async createMedia(data) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/notifications/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },

  // Send message
  async sendMessage(data) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/notifications/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return handleResponse(response);
  },

  // Get all messages
  async getMessages() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/notifications/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },

  // Get users list
  async getUsers() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/notifications/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  },

  // Get notification stats
  async getNotificationStats() {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/staff/notifications/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return handleResponse(response);
  }
};

export default staffApi;