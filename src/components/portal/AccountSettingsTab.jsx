import React, { useState, useEffect } from 'react';
import { Bell, Mail, Shield } from 'lucide-react';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const SettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState({
    receiveMediaNotifications: false,
    receiveStaffMessages: true,
    twoFactorEnabled: false
  });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSettings({
          receiveMediaNotifications: userData.receiveMediaNotifications || false,
          receiveStaffMessages: userData.receiveStaffMessages !== false, // Default true
          twoFactorEnabled: userData.twoFactorEnabled || false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (settingName) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: !prev[settingName]
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setShowSuccess(false);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to save settings');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        receiveMediaNotifications: settings.receiveMediaNotifications,
        receiveStaffMessages: settings.receiveStaffMessages,
        twoFactorEnabled: settings.twoFactorEnabled,
        settingsUpdatedAt: new Date()
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 bg-gray-100 rounded-xl">
                <div className="h-6 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      {showSuccess && (
        <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-lg">
          Settings saved successfully
        </div>
      )}

      <h2 className="text-2xl font-medium text-gray-900 mb-8">Settings</h2>

      <div className="space-y-4">
        {/* Media Notifications */}
        <div className="p-6 bg-gray-50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Receive email notifications about new Alcor media</h3>
              <p className="text-sm text-gray-500">Default: Off</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('receiveMediaNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              settings.receiveMediaNotifications ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                settings.receiveMediaNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Staff Messages */}
        <div className="p-6 bg-gray-50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Receive email notifications for messages from Alcor staff</h3>
              <p className="text-sm text-gray-500">Default: On</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('receiveStaffMessages')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              settings.receiveStaffMessages ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                settings.receiveStaffMessages ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 2FA */}
        <div className="p-6 bg-gray-50 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('twoFactorEnabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              settings.twoFactorEnabled ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;