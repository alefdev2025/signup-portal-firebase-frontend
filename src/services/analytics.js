// services/analytics.js
import { auth } from './firebase';

//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
import { API_BASE_URL } from '../config/api';

// Get Salesforce ID from context or storage
const getSalesforceId = () => {
  const sources = [
    () => localStorage.getItem('salesforceContactId'),
    () => sessionStorage.getItem('salesforceContactId'),
    () => window.__memberPortalData?.salesforceContactId
  ];

  for (const source of sources) {
    try {
      const id = source();
      if (id && id !== 'null' && id !== 'undefined') {
        return id;
      }
    } catch (e) {
      // Continue to next source
    }
  }
  return null;
};

// Get auth token
const getAuthToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  } catch (error) {
    return null;
  }
};

// Define what actions are actually important to log
const IMPORTANT_ACTIONS = [
  'membership_status_button_clicked',
  'announcement_clicked',
  'newsletter_clicked',
  'document_downloaded',
  'payment_submitted',
  'profile_updated',
  'membership_renewed',
  'support_ticket_created',
  'login_success',
  'logout'
];

// Define critical errors worth logging
const CRITICAL_ERRORS = [
  'payment_failed',
  'document_upload_failed',
  'profile_update_failed',
  'authentication_failed',
  'salesforce_sync_failed'
];

export const analytics = {
  // Log user action
  async logUserAction(action, details = {}) {
    console.log('🟦 [Analytics Service] logUserAction called');
    console.log('🟦 [Analytics Service] action:', action);
    console.log('🟦 [Analytics Service] details:', details);
    
    const salesforceId = getSalesforceId();
    console.log('🟦 [Analytics Service] getSalesforceId() returned:', salesforceId);
    
    if (!salesforceId || !IMPORTANT_ACTIONS.includes(action)) {
      console.log('🟦 [Analytics Service] SKIPPING - No ID or not important action');
      return;
    }
    
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('🟦 [Analytics Service] NO AUTH TOKEN');
        return;
      }
      
      const payload = {
        salesforceId,
        action,
        details,
        timestamp: new Date().toISOString()
      };
      
      console.log('🟦 [Analytics Service] Sending payload:', JSON.stringify(payload, null, 2));
      
      await fetch(`${API_BASE_URL}/api/analytics/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('🟦 [Analytics Service] Request sent successfully');
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },
  
  // Log error
  async logError(errorType, errorMessage, context = {}) {
    const salesforceId = getSalesforceId();
    if (!salesforceId || !CRITICAL_ERRORS.includes(errorType)) return;
    
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      await fetch(`${API_BASE_URL}/api/analytics/error`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salesforceId,
          errorType,
          errorMessage,
          context,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  },

  // Utility methods
  setSalesforceId(id) {
    if (id && id !== 'null' && id !== 'undefined') {
      localStorage.setItem('salesforceContactId', id);
      sessionStorage.setItem('salesforceContactId', id);
    }
  },

  getSalesforceId() {
    return getSalesforceId();
  }
};

export default analytics;