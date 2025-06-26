// components/portal/MessagesPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, User } from 'lucide-react';
import { getMessages, getMessage } from '../../services/content';
import { formatNotificationTime } from '../../services/notifications';

const MessagesPage = () => {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (messageId) {
      fetchSingleMessage(messageId);
    } else {
      fetchMessages();
    }
  }, [messageId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleMessage = async (id) => {
    try {
      setLoading(true);
      const data = await getMessage(id);
      setSelectedMessage(data);
    } catch (error) {
      console.error('Error fetching message:', error);
      setError('Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (message) => {
    navigate(`/messages/${message.id}`);
  };

  const handleBack = () => {
    navigate('/messages');
    setSelectedMessage(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  // Single message view
  if (selectedMessage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Messages
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h1>
            <div className="flex items-center gap-6 text-sm text-purple-100">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {selectedMessage.fromStaffName}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="prose max-w-none">
              {selectedMessage.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Messages list view
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleMessageClick(message)}
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
                !message.read ? 'border-l-4 border-purple-600' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className={`text-lg font-medium text-gray-900 ${
                        !message.read ? 'font-semibold' : ''
                      }`}>
                        {message.subject}
                      </h3>
                      {message.type === 'broadcast' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Broadcast
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {message.fromStaffName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatNotificationTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                  {!message.read && (
                    <div className="flex-shrink-0 ml-4">
                      <span className="inline-block w-3 h-3 bg-purple-600 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;