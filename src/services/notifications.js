// services/notifications.js
import { auth } from './firebase';

//console.log('📢 [NotificationService] Module loaded');

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
//console.log('🌐 [NotificationService] API_BASE_URL:', API_BASE_URL);

// Get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  /*console.log('🔐 [NotificationService] Getting auth token for user:', {
    uid: user?.uid,
    email: user?.email
  });*/
  
  if (!user) {
    //console.error('❌ [NotificationService] No authenticated user found');
    throw new Error('No authenticated user');
  }
  
  const token = await user.getIdToken();
  //console.log('✅ [NotificationService] Got auth token:', token.substring(0, 20) + '...');
  return token;
};

// Fetch all notifications
export const getNotifications = async () => {
  //console.log('📡 [NotificationService] Fetching notifications...');
  const startTime = Date.now();
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/notifications`;
    
    //console.log('🌐 [NotificationService] Making request to:', url);

        // ADD THIS LOGGING
        const user = auth.currentUser;
        /*console.log('🔑 [NotificationService] Current user details:', {
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName,
          emailVerified: user?.emailVerified,
          metadata: user?.metadata,
          providerData: user?.providerData
        });*/
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    /*console.log('📥 [NotificationService] Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });*/

    if (!response.ok) {
      const errorText = await response.text();
      /*console.error('❌ [NotificationService] Response not OK:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });*/
      throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
    }

    // Clone response to read it twice for debugging
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    
    //console.log('📄 [NotificationService] Raw response text:', responseText);
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      //console.error('❌ [NotificationService] Failed to parse JSON:', jsonError);
      //console.error('📄 [NotificationService] Response that failed to parse:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    const endTime = Date.now();
    
    /*console.log('✅ [NotificationService] Notifications fetched successfully:', {
      timeMs: endTime - startTime,
      success: data.success,
      dataStructure: Object.keys(data),
      dataObject: data,
      hasNotificationsProperty: 'notifications' in data,
      notificationsType: typeof data.notifications,
      notificationsIsArray: Array.isArray(data.notifications),
      count: data.notifications?.length || 0,
      notifications: data.notifications
    });*/

    // Log the entire data structure for debugging
    //console.log('🔍 [NotificationService] Full response data structure:', JSON.stringify(data, null, 2));

    // Check different possible response formats
    if (data.data && Array.isArray(data.data)) {
      //console.log('📊 [NotificationService] Found notifications in data.data property:', data.data);
      return data.data;
    }
    
    if (data.notifications && Array.isArray(data.notifications)) {
      //console.log('📊 [NotificationService] Found notifications in data.notifications property:', data.notifications);
      return data.notifications;
    }
    
    if (Array.isArray(data)) {
      //console.log('📊 [NotificationService] Response is directly an array:', data);
      return data;
    }

    // Log details of first few notifications if they exist
    if (data.notifications && data.notifications.length > 0) {
      //console.log('📋 [NotificationService] First 3 notifications:');
      data.notifications.slice(0, 3).forEach((notif, index) => {
        console.log(`  ${index + 1}.`, {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          read: notif.read,
          createdAt: notif.createdAt,
          userId: notif.userId,
          fullNotification: notif
        });
      });
    } else {
      //console.warn('⚠️ [NotificationService] No notifications found in response');
      //console.warn('⚠️ [NotificationService] Current user:', auth.currentUser?.uid, auth.currentUser?.email);
    }

    return data.notifications || [];
  } catch (error) {
    /*console.error('❌ [NotificationService] Error fetching notifications:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });*/
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  //console.log('📝 [NotificationService] Marking notification as read:', notificationId);
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/notifications/${notificationId}/read`;
    
    //console.log('🌐 [NotificationService] Making POST request to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    /*console.log('📥 [NotificationService] Mark as read response:', {
      status: response.status,
      statusText: response.statusText
    });*/

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('❌ [NotificationService] Failed to mark as read:', errorText);
      throw new Error('Failed to mark notification as read');
    }

    const result = await response.json();
    //console.log('✅ [NotificationService] Notification marked as read:', result);
    return result;
  } catch (error) {
    //console.error('❌ [NotificationService] Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  //console.log('📑 [NotificationService] Marking all notifications as read...');
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/notifications/read-all`;
    
    //console.log('🌐 [NotificationService] Making POST request to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    /*console.log('📥 [NotificationService] Mark all as read response:', {
      status: response.status,
      statusText: response.statusText
    });*/

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('❌ [NotificationService] Failed to mark all as read:', errorText);
      throw new Error('Failed to mark all notifications as read');
    }

    const result = await response.json();
    //console.log('✅ [NotificationService] All notifications marked as read:', result);
    return result;
  } catch (error) {
    //console.error('❌ [NotificationService] Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  //console.log('🗑️ [NotificationService] Deleting notification:', notificationId);
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/notifications/${notificationId}`;
    
    //console.log('🌐 [NotificationService] Making DELETE request to:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    /*console.log('📥 [NotificationService] Delete response:', {
      status: response.status,
      statusText: response.statusText
    });*/

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('❌ [NotificationService] Failed to delete:', errorText);
      throw new Error('Failed to delete notification');
    }

    const result = await response.json();
    //console.log('✅ [NotificationService] Notification deleted:', result);
    return result;
  } catch (error) {
    //console.error('❌ [NotificationService] Error deleting notification:', error);
    throw error;
  }
};

// Format notification time
export const formatNotificationTime = (timestamp) => {
  //console.log('⏰ [NotificationService] Formatting timestamp:', timestamp);
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let formatted;
  if (diffMins < 1) formatted = 'Just now';
  else if (diffMins < 60) formatted = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  else if (diffHours < 24) formatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  else if (diffDays < 7) formatted = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  else formatted = date.toLocaleDateString();
  
  //console.log('⏰ [NotificationService] Formatted time:', formatted);
  return formatted;
};
