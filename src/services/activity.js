// services/activity.js
import { auth } from './firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

// Get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.getIdToken();
};

// Activity types for consistency
export const ACTIVITY_TYPES = {
  // Authentication
  LOGGED_IN: 'Logged in',
  
  // View activities
  VIEWED_NOTIFICATIONS: 'Viewed notifications',
  VIEWED_MEMBERSHIP_STATUS: 'Viewed membership status',
  VIEWED_MEMBERSHIP_INFO: 'Viewed membership info',
  VIEWED_SETTINGS: 'Viewed settings',
  VIEWED_MEMBER_FILES: 'Viewed member files',
  VIEWED_VIDEO_TESTIMONY: 'Viewed video testimony',
  VIEWED_FORMS: 'Viewed forms',
  VIEWED_INFORMATION: 'Viewed information',
  VIEWED_PAYMENT_HISTORY: 'Viewed payment history',
  VIEWED_INVOICES: 'Viewed invoices',
  
  // Edit activities
  EDITED_CONTACT_INFORMATION: 'Edited contact information',
  EDITED_PERSONAL_INFORMATION: 'Edited personal information',
  EDITED_ADDRESSES: 'Edited addresses',
  EDITED_FAMILY_INFORMATION: 'Edited family information',
  EDITED_OCCUPATION: 'Edited occupation',
  EDITED_MEDICAL_INFORMATION: 'Edited medical information',
  EDITED_EMERGENCY_CONTACTS: 'Edited emergency contacts',
  
  // File activities
  DOWNLOADED_MEMBER_FILE: 'Downloaded member file',
  UPLOADED_MEMBER_FILE: 'Uploaded member file',
  
  // Form activities
  DOWNLOADED_FORM: 'Downloaded form',
  DOWNLOADED_INFORMATION_FORM: 'Downloaded information form',
  
  // Payment activities
  MADE_PAYMENT: 'Made payment',
  
  // Settings activities
  ENABLED_MEDIA_NOTIFICATIONS: 'Enabled media notifications',
  DISABLED_MEDIA_NOTIFICATIONS: 'Disabled media notifications',
  ENABLED_STAFF_MESSAGES: 'Enabled staff message notifications',
  DISABLED_STAFF_MESSAGES: 'Disabled staff message notifications',
  ENABLED_TWO_FACTOR: 'Enabled two-factor authentication',
  DISABLED_TWO_FACTOR: 'Disabled two-factor authentication',
  RESTORED_DEFAULT_SETTINGS: 'Restored default settings'
};

// Report user activity
export const reportActivity = async (salesforceId, activity, timestamp = null) => {
  console.log('📊 [Activity] Reporting activity...', { salesforceId, activity, timestamp });
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/activity/report`;
    
    console.log('🌐 [Activity] Posting to:', url);
    
    const requestBody = {
      salesforceId,
      activity,
      ...(timestamp && { timestamp })
    };
    
    console.log('📤 [Activity] Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 [Activity] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Activity] Error response:', errorText);
      console.error('❌ [Activity] Full error details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorBody: errorText
      });
      throw new Error(`Failed to report activity: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [Activity] Success! Activity reported:', {
      success: data.success,
      activityId: data.activityId,
      message: data.message
    });
    
    return data;
  } catch (error) {
    console.error('❌ [Activity] Error in reportActivity:', error);
    console.error('❌ [Activity] Error stack:', error.stack);
    throw error;
  }
};

// Get user activities
export const getActivities = async (limit = 20, salesforceId = null) => {
  console.log('📊 [Activity] Fetching activities...', { limit, salesforceId });
  
  try {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams({ limit });
    if (salesforceId) {
      queryParams.append('salesforceId', salesforceId);
    }
    
    const url = `${API_BASE_URL}/api/activity?${queryParams}`;
    
    console.log('🌐 [Activity] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 [Activity] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Activity] Error response:', errorText);
      throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [Activity] Success! Data received:', {
      success: data.success,
      activityCount: data.activities?.length || 0,
      firstActivity: data.activities?.[0]
    });
    
    return data.activities || [];
  } catch (error) {
    console.error('❌ [Activity] Error in getActivities:', error);
    throw error;
  }
};

// Get activities by Salesforce ID
export const getActivitiesBySalesforceId = async (salesforceId, limit = 20) => {
  console.log('📊 [Activity] Fetching activities for Salesforce ID:', salesforceId);
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/activity/salesforce/${salesforceId}?limit=${limit}`;
    
    console.log('🌐 [Activity] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 [Activity] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Activity] Error response:', errorText);
      throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [Activity] Success! Activities for Salesforce ID:', {
      salesforceId,
      activityCount: data.activities?.length || 0
    });
    
    return data.activities || [];
  } catch (error) {
    console.error('❌ [Activity] Error in getActivitiesBySalesforceId:', error);
    throw error;
  }
};

// Get activity summary
export const getActivitySummary = async (days = 30, salesforceId = null) => {
  console.log('📊 [Activity] Fetching activity summary...', { days, salesforceId });
  
  try {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams({ days });
    if (salesforceId) {
      queryParams.append('salesforceId', salesforceId);
    }
    
    const url = `${API_BASE_URL}/api/activity/summary?${queryParams}`;
    
    console.log('🌐 [Activity] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 [Activity] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Activity] Error response:', errorText);
      throw new Error(`Failed to fetch activity summary: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [Activity] Success! Summary received:', {
      success: data.success,
      summary: data.summary
    });
    
    return data.summary;
  } catch (error) {
    console.error('❌ [Activity] Error in getActivitySummary:', error);
    throw error;
  }
};

// Helper function to format activity for display
export const formatActivity = (activity) => {
  const iconMap = {
    // Authentication
    'Logged in': '🔐',
    
    // View activities
    'Viewed notifications': '🔔',
    'Viewed membership status': '🎫',
    'Viewed membership info': '📋',
    'Viewed settings': '⚙️',
    'Viewed member files': '📁',
    'Viewed video testimony': '📹',
    'Viewed forms': '📝',
    'Viewed information': 'ℹ️',
    'Viewed payment history': '💳',
    'Viewed invoices': '🧾',
    
    // Edit activities
    'Edited contact information': '📞',
    'Edited personal information': '👤',
    'Edited addresses': '🏠',
    'Edited family information': '👨‍👩‍👧‍👦',
    'Edited occupation': '💼',
    'Edited medical information': '🏥',
    'Edited emergency contacts': '🚨',
    
    // File activities
    'Downloaded member file': '📥',
    'Uploaded member file': '📤',
    
    // Form activities
    'Downloaded form': '📄',
    'Downloaded information form': '📑',
    
    // Payment activities
    'Made payment': '💰',
    
    // Settings activities
    'Enabled media notifications': '🔔✅',
    'Disabled media notifications': '🔔❌',
    'Enabled staff message notifications': '✉️✅',
    'Disabled staff message notifications': '✉️❌',
    'Enabled two-factor authentication': '🛡️✅',
    'Disabled two-factor authentication': '🛡️❌',
    'Restored default settings': '🔄'
  };

  return {
    ...activity,
    icon: iconMap[activity.activity] || '📌',
    displayText: activity.activity,
    shortText: activity.activity.replace(/^(Logged |Viewed |Edited |Downloaded |Uploaded |Made |Enabled |Disabled |Restored )/, '')
  };
};

// Batch report multiple activities
export const reportBatchActivities = async (activities) => {
  console.log('📊 [Activity] Reporting batch activities...', { count: activities.length });
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (const activity of activities) {
    try {
      const result = await reportActivity(
        activity.salesforceId,
        activity.activity,
        activity.timestamp
      );
      results.successful.push(result);
    } catch (error) {
      console.error('❌ [Activity] Failed to report activity:', activity, error);
      results.failed.push({ activity, error: error.message });
    }
  }
  
  console.log('✅ [Activity] Batch report complete:', {
    successful: results.successful.length,
    failed: results.failed.length
  });
  
  return results;
};