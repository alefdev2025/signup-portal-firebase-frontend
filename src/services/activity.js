// services/activity.js
import { auth } from './firebase';

//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
import { API_BASE_URL } from '../config/api';

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

// Format activity helper function (works for both systems)
export const formatActivity = (activity) => {
  // Get timestamp from various possible fields
  let dateValue = activity.timestamp || activity.createdAt || activity.date;
  let timestamp;
  
  try {
    if (!dateValue) {
      // No date provided, use current time
      timestamp = new Date().toISOString();
    } else if (typeof dateValue === 'object' && dateValue.seconds) {
      // Firestore timestamp object with seconds
      timestamp = new Date(dateValue.seconds * 1000).toISOString();
    } else if (dateValue && typeof dateValue.toDate === 'function') {
      // Firestore Timestamp with toDate method
      timestamp = dateValue.toDate().toISOString();
    } else if (typeof dateValue === 'string') {
      // Already a string, validate it
      const testDate = new Date(dateValue);
      if (isNaN(testDate.getTime())) {
        console.warn('Invalid date string:', dateValue);
        timestamp = new Date().toISOString();
      } else {
        timestamp = testDate.toISOString();
      }
    } else if (dateValue instanceof Date) {
      // Already a Date object
      timestamp = dateValue.toISOString();
    } else {
      // Unknown format, try to parse
      const testDate = new Date(dateValue);
      if (isNaN(testDate.getTime())) {
        //console.warn('Unable to parse date:', dateValue);
        timestamp = new Date().toISOString();
      } else {
        timestamp = testDate.toISOString();
      }
    }
  } catch (err) {
    //console.error('Error processing activity date:', err);
    timestamp = new Date().toISOString();
  }
  
  // Map activity type to category for the UI
  const getCategoryFromActivity = (activityText) => {
    if (!activityText) return 'system';
    
    const text = activityText.toLowerCase();
    
    if (text.includes('logged') || text.includes('login')) return 'auth';
    if (text.includes('payment') || text.includes('invoice')) return 'financial';
    if (text.includes('edited') || text.includes('personal') || text.includes('contact') || text.includes('address')) return 'profile';
    if (text.includes('document') || text.includes('file') || text.includes('form')) return 'documents';
    if (text.includes('membership')) return 'membership';
    if (text.includes('medical')) return 'medical';
    if (text.includes('legal')) return 'legal';
    if (text.includes('notification') || text.includes('message')) return 'communication';
    
    return 'system';
  };
  
  // Use relativeTime from backend if available, otherwise calculate it
  let relativeTime = activity.relativeTime;
  
  if (!relativeTime) {
    // Calculate relative time
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      relativeTime = 'Just now';
    } else if (diffMins < 60) {
      relativeTime = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      relativeTime = activityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: activityDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
  
  // Determine if it's from old or new system
  const isNewSystem = activity.type && activity.category && activity.displayText;
  
  // Return formatted activity with guaranteed valid timestamp
  return {
    id: activity.id || `activity-${Date.now()}-${Math.random()}`,
    category: isNewSystem ? activity.category : getCategoryFromActivity(activity.activity),
    displayText: activity.displayText || activity.activity || 'Activity recorded',
    timestamp: timestamp, // Always include valid ISO string timestamp
    createdAt: activity.createdAt, // Preserve original createdAt if it exists
    relativeTime: relativeTime,
    metadata: activity.metadata || {},
    type: activity.type,
    salesforceId: activity.salesforceId || activity.salesforceContactId,
    userId: activity.userId,
    // Flag to identify which system it came from
    source: isNewSystem ? 'contactActivities' : 'userActivities'
  };
};

// ====================
// FILTERING FUNCTIONS
// ====================

/**
 * Filter duplicate invoice activities
 * Keeps only the most recent instance of each invoice activity
 */
export const filterDuplicateInvoiceActivities = (activities) => {
  if (!activities || activities.length === 0) return activities;
  
  const seen = new Set();
  
  return activities.filter(activity => {
    // Check if this is an invoice-related activity
    const isInvoiceActivity = activity.type && (
      activity.type.includes('INVOICE') || 
      activity.type === 'PAYMENT_VIEW' ||
      activity.type === 'PAYMENT_DETAIL_VIEW'
    );
    
    if (isInvoiceActivity) {
      // Create a unique key based on the activity type and relevant ID
      let uniqueKey = activity.type;
      
      // Add specific identifiers to the key
      if (activity.metadata) {
        if (activity.metadata.invoiceNumber) {
          uniqueKey += `-${activity.metadata.invoiceNumber}`;
        } else if (activity.metadata.invoiceId) {
          uniqueKey += `-${activity.metadata.invoiceId}`;
        } else if (activity.metadata.paymentNumber) {
          uniqueKey += `-${activity.metadata.paymentNumber}`;
        } else if (activity.metadata.customerId && activity.type === 'INVOICES_VIEWED') {
          // For bulk invoice views, use customerId
          uniqueKey += `-${activity.metadata.customerId}`;
        }
      }
      
      // Check if we've seen this activity before
      if (seen.has(uniqueKey)) {
        return false; // Skip this duplicate
      }
      seen.add(uniqueKey);
    }
    
    // Non-invoice activities are always included
    return true;
  });
};

// ====================
// USER ACTIVITIES SYSTEM (Original)
// ====================

// Report user activity - POST /api/activity/report
export const reportActivity = async (salesforceId, activity, timestamp = null) => {
  console.log('📊 [UserActivity] Reporting activity...', { salesforceId, activity, timestamp });
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/activity/report`;
    
    const requestBody = {
      salesforceId,
      activity,
      ...(timestamp && { timestamp })
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [UserActivity] Error response:', errorText);
      throw new Error(`Failed to report activity: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [UserActivity] Activity reported:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [UserActivity] Error in reportActivity:', error);
    throw error;
  }
};

// Get recent activities - GET /api/activity
export const getRecentActivities = async (limit = 5, offset = 0, salesforceContactId = null, category = null, startDate = null) => {
  //console.log('📊 [UserActivity] Fetching recent activities...', { limit, offset, category, salesforceContactId });
  
  try {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams({ limit });
    
    // The backend expects 'salesforceId' not 'salesforceContactId'
    if (salesforceContactId) {
      queryParams.append('salesforceId', salesforceContactId);
    }
    
    const url = `${API_BASE_URL}/api/activity?${queryParams}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [UserActivity] Error response:', errorText);
      throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    //console.log('✅ [UserActivity] Activities retrieved:', data);
    
    // The backend returns { success: true, activities: [...] }
    const activities = data.activities || [];
    
    // Format each activity before returning
    return activities.map(formatActivity);
  } catch (error) {
    console.error('❌ [UserActivity] Error fetching activities:', error);
    throw error;
  }
};

// Get activities by Salesforce ID - GET /api/activity/salesforce/:salesforceId
export const getActivitiesBySalesforceId = async (salesforceId, limit = 20) => {
  console.log('📊 [UserActivity] Fetching activities for Salesforce ID:', salesforceId);
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/activity/salesforce/${salesforceId}?limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [UserActivity] Error response:', errorText);
      throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [UserActivity] Activities for Salesforce ID:', data);
    
    // Format each activity before returning
    const activities = data.activities || [];
    return activities.map(formatActivity);
  } catch (error) {
    console.error('❌ [UserActivity] Error in getActivitiesBySalesforceId:', error);
    throw error;
  }
};

// Get activity summary - GET /api/activity/summary
export const getActivitySummary = async (days = 30, salesforceId = null) => {
  console.log('📊 [UserActivity] Fetching activity summary...', { days, salesforceId });
  
  try {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams({ days });
    if (salesforceId) {
      queryParams.append('salesforceId', salesforceId);
    }
    
    const url = `${API_BASE_URL}/api/activity/summary?${queryParams}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [UserActivity] Error response:', errorText);
      throw new Error(`Failed to fetch activity summary: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [UserActivity] Summary received:', data);
    
    return data.summary;
  } catch (error) {
    console.error('❌ [UserActivity] Error in getActivitySummary:', error);
    throw error;
  }
};

// ====================
// CONTACT ACTIVITIES SYSTEM (New)
// ====================

// Track activity using new system - POST /api/track-activity
export const trackActivity = async (activityType, metadata = {}) => {
  console.log('📊 [ContactActivity] Tracking activity...', { activityType, metadata });
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/track-activity`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activityType,
        metadata
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ContactActivity] Error response:', errorText);
      throw new Error(`Failed to track activity: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [ContactActivity] Activity tracked:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [ContactActivity] Error in trackActivity:', error);
    // Don't throw - we don't want tracking failures to break the app
  }
};

// Get contact activities - GET /api/track-activity/recent
export const getContactActivities = async (limit = 5, category = null, salesforceContactId = null) => {
  //console.log('📊 [ContactActivity] Fetching recent activities...', { limit, category, salesforceContactId });
  
  try {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams({ limit });
    
    if (category) {
      queryParams.append('category', category);
    }
    
    if (salesforceContactId) {
      queryParams.append('salesforceContactId', salesforceContactId);
    }
    
    const url = `${API_BASE_URL}/api/track-activity/recent?${queryParams}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ContactActivity] Error response:', errorText);
      throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    //console.log('✅ [ContactActivity] Activities retrieved:', data);
    
    // Format each activity before returning
    const activities = data.data || [];
    return activities.map(formatActivity);
  } catch (error) {
    console.error('❌ [ContactActivity] Error fetching activities:', error);
    throw error;
  }
};

// Get contact activity stats - GET /api/track-activity/stats
export const getContactActivityStats = async (startDate = null, endDate = null, salesforceContactId = null) => {
  console.log('📊 [ContactActivity] Fetching activity stats...', { startDate, endDate, salesforceContactId });
  
  try {
    const token = await getAuthToken();
    const queryParams = new URLSearchParams();
    
    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString());
    }
    if (salesforceContactId) {
      queryParams.append('salesforceContactId', salesforceContactId);
    }
    
    const url = `${API_BASE_URL}/api/track-activity/stats?${queryParams}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ContactActivity] Error response:', errorText);
      throw new Error(`Failed to fetch activity stats: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [ContactActivity] Stats retrieved:', data);
    
    return data.data;
  } catch (error) {
    console.error('❌ [ContactActivity] Error fetching activity stats:', error);
    throw error;
  }
};

// ====================
// COMBINED FUNCTIONS (Use both systems)
// ====================

// Get all activities from both systems
export const getAllActivities = async (limit = 20, salesforceContactId = null) => {
  console.log('📊 [AllActivities] Fetching from both systems...', { limit, salesforceContactId });
  
  try {
    // Fetch from both systems in parallel
    const [userActivities, contactActivities] = await Promise.all([
      getRecentActivities(limit, 0, salesforceContactId).catch(err => {
        console.error('Failed to fetch user activities:', err);
        return [];
      }),
      getContactActivities(limit, null, salesforceContactId).catch(err => {
        console.error('Failed to fetch contact activities:', err);
        return [];
      })
    ]);
    
    // Combine and sort by timestamp
    const allActivities = [...userActivities, ...contactActivities];
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Return only the requested limit
    return allActivities.slice(0, limit);
  } catch (error) {
    console.error('❌ [AllActivities] Error fetching activities:', error);
    throw error;
  }
};

// Get all activities with deduplication
export const getAllActivitiesFiltered = async (limit = 20, salesforceContactId = null) => {
  console.log('📊 [AllActivities] Fetching with deduplication...', { limit, salesforceContactId });
  
  try {
    // Fetch more activities than needed to account for filtering
    const fetchLimit = Math.min(limit * 2, 50);
    
    // Get activities from both systems
    const allActivities = await getAllActivities(fetchLimit, salesforceContactId);
    
    // Apply filtering to remove duplicate invoices
    const filtered = filterDuplicateInvoiceActivities(allActivities);
    
    // Return only the requested limit
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('❌ [AllActivities] Error fetching filtered activities:', error);
    throw error;
  }
};

// Report activity to both systems
export const reportActivityToBothSystems = async (salesforceId, activityText, activityType = null, metadata = {}) => {
  console.log('📊 [BothSystems] Reporting activity...', { salesforceId, activityText, activityType, metadata });
  
  const results = {
    userActivity: null,
    contactActivity: null,
    errors: []
  };
  
  // Report to user activities system
  try {
    results.userActivity = await reportActivity(salesforceId, activityText);
  } catch (error) {
    console.error('Failed to report to user activities:', error);
    results.errors.push({ system: 'userActivities', error: error.message });
  }
  
  // Report to contact activities system if activityType is provided
  if (activityType) {
    try {
      results.contactActivity = await trackActivity(activityType, {
        ...metadata,
        salesforceId
      });
    } catch (error) {
      console.error('Failed to report to contact activities:', error);
      results.errors.push({ system: 'contactActivities', error: error.message });
    }
  }
  
  return results;
};

// Backwards compatibility exports
export const getActivities = getRecentActivities;
export const getActivityStats = getActivitySummary;