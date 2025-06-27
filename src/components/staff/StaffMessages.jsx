import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, User, Search, CheckCircle, XCircle, AlertCircle, Calendar, Mail, Inbox } from 'lucide-react';
import { auth } from '../../services/firebase';

const API_BASE_URL = 'https://alcor-backend-dev-ik555kxdwq-uc.a.run.app';

const StaffMessages = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('send');
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingSentMessages, setLoadingSentMessages] = useState(false);
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

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentMessages();
    }
  }, [activeTab]);

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

  const fetchSentMessages = async () => {
    try {
      setLoadingSentMessages(true);
      setError(null);
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/staff/notifications/notifications-staff?all=true&type=message`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.notifications) {
        // Filter out duplicates based on title, content, and createdAt timestamp
        const uniqueMessages = data.notifications.reduce((acc, notification) => {
          const key = `${notification.title}-${notification.content}-${new Date(notification.createdAt).getTime()}`;
          if (!acc.some(msg => `${msg.title}-${msg.content}-${new Date(msg.createdAt).getTime()}` === key)) {
            acc.push(notification);
          }
          return acc;
        }, []);
        setSentMessages(uniqueMessages);
      }
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      setError('Unable to load sent messages');
    } finally {
      setLoadingSentMessages(false);
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
        // Refresh sent messages if on sent tab
        if (activeTab === 'sent') {
          fetchSentMessages();
        }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Messages</h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'send'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                activeTab === 'sent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                Sent Messages
              </div>
            </button>
          </div>

          {/* Error Messages - Keep at top for visibility */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {activeTab === 'send' ? (
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

              {/* Success Message - Below send button */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  {success}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              {loadingSentMessages ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  Loading sent messages...
                </div>
              ) : sentMessages.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {sentMessages.map((message) => (
                    <div key={message.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="text-green-600 mt-1">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-gray-900">{message.title}</h3>
                              <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full mt-1">
                                Message
                              </span>
                            </div>
                            {message.read && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Read
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{message.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(message.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {message.recipientCount 
                                ? `Sent to ${message.recipientCount} member${message.recipientCount > 1 ? 's' : ''}`
                                : message.user?.email || 'All members'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages sent yet.</p>
                  <p className="text-sm mt-2">Messages you send will appear here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffMessages;