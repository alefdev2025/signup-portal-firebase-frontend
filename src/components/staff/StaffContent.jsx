import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Calendar, Mic, FileText, Megaphone, Clock, MapPin, Link as LinkIcon } from 'lucide-react';
import { db, storage, auth } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ImageUploader from './ImageUploader';
import podcastImage from '../../assets/images/podcast-image2.png';

//const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';
import { API_BASE_URL } from '../../config/api';

const StaffContent = () => {
  const [activeTab, setActiveTab] = useState('announcements');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    console.log('[STAFF CONTENT] Current auth user:', {
      uid: user?.uid,
      email: user?.email,
      emailVerified: user?.emailVerified
    });
    
    if (!user) throw new Error('No authenticated user');
    
    const token = await user.getIdToken();
    console.log('[STAFF CONTENT] Got ID token, length:', token.length);
    
    // Decode token to check claims (for debugging)
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      console.log('[STAFF CONTENT] Token claims:', {
        uid: tokenPayload.user_id,
        email: tokenPayload.email,
        iat: new Date(tokenPayload.iat * 1000).toISOString(),
        exp: new Date(tokenPayload.exp * 1000).toISOString()
      });
    } catch (e) {
      console.error('[STAFF CONTENT] Could not decode token:', e);
    }
    
    return token;
  };

  const fetchItems = async () => {
    console.log('[STAFF CONTENT] Starting fetchItems for tab:', activeTab);
    setLoading(true);
    try {
      const token = await getAuthToken();
      const endpoint = activeTab === 'announcements' ? 'announcements' : 'media';
      const url = `${API_BASE_URL}/api/staff/content/${endpoint}`;
      
      console.log('[STAFF CONTENT] Fetching from URL:', url);
      
      // Use backend API to fetch items
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[STAFF CONTENT] Response status:', response.status);
      console.log('[STAFF CONTENT] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[STAFF CONTENT] Error response body:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('[STAFF CONTENT] Error details:', errorJson);
        } catch (e) {
          // Not JSON
        }
        
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      console.log('[STAFF CONTENT] Fetched items count:', data.items?.length || 0);
      
      // Process items to handle date conversions
      const processedItems = (data.items || []).map(item => ({
        ...item,
        // Convert date strings back to Date objects for consistency
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
        publishDate: item.publishDate ? new Date(item.publishDate) : null,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null
      }));
      
      setItems(processedItems);
      
    } catch (error) {
      console.error('[STAFF CONTENT] Error in fetchItems:', error);
      console.error('[STAFF CONTENT] Falling back to direct Firestore access');
      
      // Fallback to direct Firestore if API fails
      const collectionName = activeTab === 'announcements' ? 'announcements' : 'media';
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('[STAFF CONTENT] Firestore fallback items count:', data.length);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isSubmittingRef.current || submitting) {
      return;
    }
    
    isSubmittingRef.current = true;
    setSubmitting(true);
    
    try {
      const token = await getAuthToken();
      
      if (editingItem) {
        // Update existing item through backend
        const endpoint = activeTab === 'announcements' 
          ? `/api/staff/content/announcements/${editingItem.id}`
          : `/api/staff/content/media/${editingItem.id}`;
        
        const dataToUpdate = {
          title: formData.title || '',
          description: formData.description || '',
          active: formData.active !== false,
          ...(activeTab === 'media' ? {
            type: formData.type || 'newsletter',
            link: formData.link || null,
            publishDate: formData.publishDate || null,
            imageUrl: formData.imageUrl || null
          } : {
            category: formData.category || 'general',
            subtitle: formData.subtitle || '',
            eventDate: formData.eventDate || null,
            eventTime: formData.eventTime || null,
            location: formData.location || null,
            link: formData.link || null,
            imageUrl: formData.imageUrl || null
          })
        };
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToUpdate)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update content');
        }
        
      } else {
        // Create new item
        const endpoint = activeTab === 'announcements' 
          ? '/api/staff/notifications/announcement'
          : '/api/staff/notifications/media';
        
        const notificationData = activeTab === 'announcements' 
          ? {
              title: formData.title || '',
              description: formData.description || '',
              category: formData.category || 'general',
              subtitle: formData.subtitle || '',
              eventDate: formData.eventDate || null,
              eventTime: formData.eventTime || null,
              location: formData.location || null,
              link: formData.link || null,
              imageUrl: formData.imageUrl || null
            }
          : {
              mediaType: formData.type || 'newsletter',
              title: formData.title || '',
              description: formData.description || '',
              link: formData.link || null,
              imageUrl: formData.imageUrl || null,
              publishDate: formData.publishDate || new Date(),
              sendToAll: true
            };
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notificationData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to create content');
        }
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({});
      
      setTimeout(() => {
        fetchItems();
      }, 500);
      
      alert('Content saved successfully!');
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Failed to save item: ' + error.message);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }, 1000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const token = await getAuthToken();
      const endpoint = activeTab === 'announcements' 
        ? `/api/staff/content/announcements/${id}`
        : `/api/staff/content/media/${id}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete content');
      }
      
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl p-8"
      style={{ 
        borderRadius: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Content Management</h2>
          <div className="flex gap-2">
            {/* Debug button */}
            <button
              onClick={async () => {
                try {
                  const token = await getAuthToken();
                  console.log('[DEBUG] Calling debug endpoint...');
                  const response = await fetch(`${API_BASE_URL}/api/debug/check-role`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  const data = await response.json();
                  console.log('[DEBUG] Role check result:', data);
                  if (data.debug) {
                    console.log('[DEBUG] Firestore user data:', data.debug.firestoreUser);
                    console.log('[DEBUG] User has roles field?', data.debug.firestoreUser?.allFields?.includes('roles'));
                    console.log('[DEBUG] User has role field?', data.debug.firestoreUser?.allFields?.includes('role'));
                  }
                  alert('Check console for role debug info');
                } catch (error) {
                  console.error('[DEBUG] Role check error:', error);
                }
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              Debug Role
            </button>
            <button
              onClick={() => {
                setFormData({});
                setEditingItem(null);
                setShowForm(true);
              }}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div 
          className="bg-gray-50 rounded-2xl shadow-sm mb-8 overflow-hidden"
          style={{ 
            borderRadius: '1rem',
            overflow: 'hidden',
            backgroundColor: '#f9fafb'
          }}
        >
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-3 px-8 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ fontFamily: 'Helvetica, Arial, sans-serif', borderRadius: '0' }}
              >
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Announcements
                </div>
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`py-3 px-8 border-b-2 font-medium text-sm ${
                  activeTab === 'media'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{ fontFamily: 'Helvetica, Arial, sans-serif', borderRadius: '0' }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Media (Podcasts & Newsletters)
                </div>
              </button>
            </nav>
          </div>

          {/* Content List */}
          <div className="p-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                No {activeTab} found. Create your first one!
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white border border-gray-200 rounded-2xl hover:shadow-md transition-shadow overflow-hidden"
                    style={{ 
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      backgroundColor: 'white'
                    }}
                  >
                    <div className="p-8">
                      {/* Header Row - Title, Badges, and Actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-base text-gray-900" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '600' }}>{item.title}</h3>
                            
                            {/* Type/Category Badge */}
                            {item.type && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.type === 'podcast' 
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                                {item.type === 'podcast' ? (
                                  <div className="flex items-center gap-1">
                                    <Mic className="w-3 h-3" />
                                    Podcast
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Newsletter
                                  </div>
                                )}
                              </span>
                            )}
                            {item.category && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.category === 'event' 
                                  ? 'bg-green-100 text-green-700'
                                  : item.category === 'conference'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                                {item.category}
                              </span>
                            )}
                          </div>
                          
                          {/* Subtitle if exists */}
                          {item.subtitle && (
                            <p className="text-gray-600 text-sm mt-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{item.subtitle}</p>
                          )}
                        </div>
                        
                        {/* Action Buttons - Professional Style */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content Row - Image and Description */}
                      <div className="flex gap-6 mt-6">
                        {/* Image */}
                        {(item.imageUrl || item.type === 'podcast') && (
                          <div className="flex-shrink-0">
                            <img 
                              src={item.type === 'podcast' ? podcastImage : item.imageUrl} 
                              alt={item.title} 
                              className={`w-28 h-28 object-cover rounded-xl ${item.type === 'podcast' ? 'border border-gray-300' : ''}`}
                            />
                          </div>
                        )}
                        
                        {/* Description and Details */}
                        <div className="flex-1">
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            {item.description}
                          </p>
                          
                          {/* Meta Information */}
                          <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                            {/* Created Date */}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Created: {formatDate(item.createdAt)}</span>
                            </div>
                            
                            {/* Publish Date (for media) */}
                            {item.publishDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Published: {formatDate(item.publishDate)}</span>
                              </div>
                            )}
                            
                            {/* Event Date (for announcements) */}
                            {item.eventDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Event: {item.eventDate}</span>
                              </div>
                            )}
                            
                            {/* Event Time */}
                            {item.eventTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.eventTime}</span>
                              </div>
                            )}
                            
                            {/* Location */}
                            {item.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{item.location}</span>
                              </div>
                            )}
                            
                            {/* Link */}
                            {item.link && (
                              <div className="flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" />
                                <a 
                                  href={item.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:underline"
                                  style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                                >
                                  View Link
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Black header with rounded top corners */}
              <div className="bg-black text-white p-6 text-center font-semibold rounded-t-2xl" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                {editingItem ? 'Edit' : 'Create New'} {activeTab === 'announcements' ? 'Announcement' : 'Media Content'}
              </div>
              
              <div className="max-h-[calc(90vh-4rem)] overflow-y-auto">
                <div className="p-8 pt-10">
                  {activeTab === 'announcements' ? (
                    <AnnouncementForm 
                      formData={formData} 
                      setFormData={setFormData}
                    />
                  ) : (
                    <MediaForm 
                      formData={formData} 
                      setFormData={setFormData}
                    />
                  )}
                </div>

                <div className="p-8 border-t bg-white flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800"
                    style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`px-6 py-3 text-white rounded-xl ${
                      submitting 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-black hover:bg-gray-800'
                    }`}
                    style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
                  >
                    {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Announcement Form Component
const AnnouncementForm = ({ formData, setFormData }) => {
  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Category
        </label>
        <select
          value={formData.category || 'general'}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
          style={{ 
            fontFamily: 'Helvetica, Arial, sans-serif',
            height: '52px',
            lineHeight: 'normal'
          }}
        >
          <option value="general">General</option>
          <option value="event">Event</option>
          <option value="conference">Conference</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Title *
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Subtitle
        </label>
        <input
          type="text"
          value={formData.subtitle || ''}
          onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Description *
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="5"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          required
        />
      </div>

      {(formData.category === 'event' || formData.category === 'conference') && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
                Event Date
              </label>
              <input
                type="text"
                value={formData.eventDate || ''}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                placeholder="e.g., September 15, 2025"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
                Event Time
              </label>
              <input
                type="text"
                value={formData.eventTime || ''}
                onChange={(e) => setFormData({...formData, eventTime: e.target.value})}
                placeholder="e.g., 9:00 AM PST"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Link
        </label>
        <input
          type="url"
          value={formData.link || ''}
          onChange={(e) => setFormData({...formData, link: e.target.value})}
          placeholder="https://..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Image
        </label>
        <ImageUploader 
          currentImageUrl={formData.imageUrl}
          onImageUploaded={(url) => setFormData({...formData, imageUrl: url})}
          folder="announcements"
        />
      </div>
    </div>
  );
};

// Media Form Component
const MediaForm = ({ formData, setFormData }) => {
  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Media Type
        </label>
        <select
          value={formData.type || 'newsletter'}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ 
            fontFamily: 'Helvetica, Arial, sans-serif',
            height: '52px',
            lineHeight: 'normal'
          }}
        >
          <option value="newsletter">Newsletter</option>
          <option value="podcast">Podcast</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Title *
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Description *
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="4"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Link
        </label>
        <input
          type="url"
          value={formData.link || ''}
          onChange={(e) => setFormData({...formData, link: e.target.value})}
          placeholder={formData.type === 'podcast' ? 'Podcast URL' : 'PDF URL'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
          Publish Date
        </label>
        <input
          type="date"
          value={(() => {
            if (!formData.publishDate) return '';
            try {
              // Handle Firestore Timestamp
              if (formData.publishDate?.toDate) {
                return formData.publishDate.toDate().toISOString().split('T')[0];
              }
              // Handle string or Date object
              const date = new Date(formData.publishDate);
              return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
            } catch (error) {
              console.error('Error parsing publish date:', error);
              return '';
            }
          })()}
          onChange={(e) => setFormData({...formData, publishDate: e.target.value ? new Date(e.target.value) : null})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
        />
      </div>

      {formData.type !== 'podcast' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '500' }}>
            Image
          </label>
          <ImageUploader 
            currentImageUrl={formData.imageUrl}
            onImageUploaded={(url) => setFormData({...formData, imageUrl: url})}
            folder={formData.type || 'media'}
          />
        </div>
      )}
    </div>
  );
};

export default StaffContent;