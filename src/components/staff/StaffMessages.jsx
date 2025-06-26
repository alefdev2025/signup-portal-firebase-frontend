import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, User, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { auth } from '../../services/firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

const StaffMessages = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const isSubmittingRef = useRef(false); // Add ref for submission tracking
  
  const [messageForm, setMessageForm] = useState({
    subject: '',
    content: '',
    sendToAll: true,
    userId: ''
  });

  useEffect(() => {
    if (!messageForm.sendToAll) {
      fetchUsers();
    }
  }, [messageForm.sendToAll]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return user.getIdToken();
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/staff/notifications/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Unable to load users list');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Check if already submitting
    if (isSubmittingRef.current || loading) {
      console.log('BLOCKED: Already submitting message');
      return;
    }
    
    if (!messageForm.subject || !messageForm.content) {
      setError('Subject and message content are required');
      return;
    }

    if (!messageForm.sendToAll && !messageForm.userId) {
      setError('Please select a recipient');
      return;
    }

    // Set submission flags
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/staff/notifications/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageForm)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Message sent successfully to ${data.recipientCount} recipient(s)`);
        // Reset form
        setMessageForm({
          subject: '',
          content: '',
          sendToAll: true,
          userId: ''
        });
        setSearchTerm('');
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setLoading(false);
      // Reset submission ref after a delay
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1000);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === messageForm.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Send Message</h1>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Recipient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recipients
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    checked={messageForm.sendToAll}
                    onChange={(e) => setMessageForm({...messageForm, sendToAll: true, userId: ''})}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="font-medium">All Members</span>
                      <p className="text-xs text-gray-500">Send to everyone in the organization</p>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    checked={!messageForm.sendToAll}
                    onChange={(e) => setMessageForm({...messageForm, sendToAll: false})}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <span className="font-medium">Specific Member</span>
                      <p className="text-xs text-gray-500">Send to one person</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* User Selection (when specific member is selected) */}
            {!messageForm.sendToAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member
                </label>
                {loadingUsers ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading members...
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    {selectedUser && (
                      <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                        Selected: <strong>{selectedUser.displayName}</strong> ({selectedUser.email})
                      </div>
                    )}
                    
                    <select
                      value={messageForm.userId}
                      onChange={(e) => setMessageForm({...messageForm, userId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      size="5"
                    >
                      <option value="">Select a member...</option>
                      {filteredUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.displayName} ({user.email})
                        </option>
                      ))}
                    </select>
                    {filteredUsers.length === 0 && searchTerm && (
                      <p className="text-sm text-gray-500 mt-2">No members found matching "{searchTerm}"</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={messageForm.subject}
                onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter message subject"
                required
              />
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="8"
                placeholder="Type your message here..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {messageForm.content.length} characters
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Message will be sent as a notification</p>
                <p>Recipients will receive this message in their notifications panel and may also receive an email alert based on their preferences.</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                
                if (!isSubmittingRef.current && !loading) {
                  handleSubmit(e);
                }
              }}
              disabled={loading}
              className={`w-full text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                loading 
                  ? 'bg-gray-500 cursor-not-allowed pointer-events-none' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffMessages;