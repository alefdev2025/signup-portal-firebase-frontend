// services/content.js
import { auth } from './firebase';

//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
import { API_BASE_URL } from '../config/api';

// Get auth token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  return user.getIdToken();
};

// Fetch media items (podcasts and newsletters)
export const getMediaItems = async (type = 'all') => {
  //console.log('🎬 [Media] Starting fetch...', { type });
  
  try {
    const token = await getAuthToken();
    const queryParam = type !== 'all' ? `?type=${type}` : '';
    const url = `${API_BASE_URL}/api/content/media${queryParam}`;
    
    //console.log('🌐 [Media] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    //console.log('📥 [Media] Response status:', response.status);
    //console.log('📥 [Media] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('❌ [Media] Error response:', errorText);
      /*console.error('❌ [Media] Full error details:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorBody: errorText
      });*/
      throw new Error(`Failed to fetch media items: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    /*console.log('✅ [Media] Success! Data received:', {
      success: data.success,
      mediaCount: data.media?.length || 0,
      firstItem: data.media?.[0]
    });*/
    
    return data.media || [];
  } catch (error) {
    //console.error('❌ [Media] Error in getMediaItems:', error);
    //console.error('❌ [Media] Error stack:', error.stack);
    throw error;
  }
};

// Fetch announcements
export const getAnnouncements = async (category = 'all') => {
  //console.log('📢 [Announcements] Starting fetch...', { category });
  
  try {
    const token = await getAuthToken();
    const queryParam = category !== 'all' ? `?category=${category}` : '';
    const url = `${API_BASE_URL}/api/content/announcements${queryParam}`;
    
    //console.log('🌐 [Announcements] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    //console.log('📥 [Announcements] Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ [Announcements] Response error:', errorData);
      throw new Error(`Failed to fetch announcements: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    //console.log('✅ [Announcements] Full response data:', data);
    //console.log('✅ [Announcements] Announcements array:', data.announcements);
    //console.log('✅ [Announcements] Number of announcements:', data.announcements ? data.announcements.length : 0);
    
    return data.announcements || [];
  } catch (error) {
    console.error('❌ [Announcements] Error in getAnnouncements:', error);
    throw error;
  }
};

// Fetch messages
export const getMessages = async () => {
  //console.log('💬 [Messages] Starting fetch...');
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/content/messages`;
    
    //console.log('🌐 [Messages] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    //console.log('📥 [Messages] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('❌ [Messages] Error response:', errorText);
      throw new Error(`Failed to fetch messages: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    /*console.log('✅ [Messages] Success! Data received:', {
      success: data.success,
      messageCount: data.messages?.length || 0
    });*/
    
    return data.messages || [];
  } catch (error) {
    //console.error('❌ [Messages] Error in getMessages:', error);
    throw error;
  }
};

// Get a single message
export const getMessage = async (messageId) => {
  //console.log('💬 [Message] Fetching single message:', messageId);
  
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}/api/content/messages/${messageId}`;
    
    //console.log('🌐 [Message] Fetching from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    //console.log('📥 [Message] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      //console.error('❌ [Message] Error response:', errorText);
      throw new Error(`Failed to fetch message: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    //console.log('✅ [Message] Success! Message received:', data.message);
    
    return data.message;
  } catch (error) {
    //console.error('❌ [Message] Error in getMessage:', error);
    throw error;
  }
};