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
    const newSettings = {
      ...settings,
      [settingName]: !settings[settingName]
    };
    setSettings(newSettings);
    // Autosave
    saveSettings(newSettings);
  };

  const saveSettings = async (newSettings) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'users', user.uid), {
        receiveMediaNotifications: newSettings.receiveMediaNotifications,
        receiveStaffMessages: newSettings.receiveStaffMessages,
        twoFactorEnabled: newSettings.twoFactorEnabled,
        settingsUpdatedAt: new Date()
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleRestoreDefaults = async () => {
    const defaultSettings = {
      receiveMediaNotifications: false,
      receiveStaffMessages: true,
      twoFactorEnabled: false
    };
    
    setSettings(defaultSettings);
    setSaving(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in to restore defaults');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        receiveMediaNotifications: defaultSettings.receiveMediaNotifications,
        receiveStaffMessages: defaultSettings.receiveStaffMessages,
        twoFactorEnabled: defaultSettings.twoFactorEnabled,
        settingsUpdatedAt: new Date()
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error restoring defaults:', error);
      alert('Failed to restore defaults. Please try again.');
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
        <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M5 13l4 4L19 7"></path>
          </svg>
          Settings saved automatically
        </div>
      )}

      <h2 className="text-2xl font-medium text-gray-900 mb-8">Settings</h2>

      <div className="space-y-4">
        {/* Media Notifications */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Bell className="w-6 h-6 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Receive email notifications about new Alcor media</h3>
                <p className="text-sm text-gray-500 mt-1">Default: Off</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('receiveMediaNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ml-4 flex-shrink-0 ${
                settings.receiveMediaNotifications ? 'bg-[#6f2d74] focus:ring-[#6f2d74]' : 'bg-gray-300 focus:ring-gray-500'
              }`}
            >
              <span
                className={`${
                  settings.receiveMediaNotifications ? 'translate-x-3' : '-translate-x-2.5'
                } inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm`}
              />
            </button>
          </div>
        </div>

        {/* Staff Messages */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Mail className="w-6 h-6 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Receive email notifications for messages from Alcor staff</h3>
                <p className="text-sm text-gray-500 mt-1">Default: On</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('receiveStaffMessages')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ml-4 flex-shrink-0 ${
                settings.receiveStaffMessages ? 'bg-[#6f2d74] focus:ring-[#6f2d74]' : 'bg-gray-300 focus:ring-gray-500'
              }`}
            >
              <span
                className={`${
                  settings.receiveStaffMessages ? 'translate-x-3' : '-translate-x-2.5'
                } inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm`}
              />
            </button>
          </div>
        </div>

        {/* 2FA */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <Shield className="w-6 h-6 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('twoFactorEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ml-4 flex-shrink-0 ${
                settings.twoFactorEnabled ? 'bg-[#6f2d74] focus:ring-[#6f2d74]' : 'bg-gray-300 focus:ring-gray-500'
              }`}
            >
              <span
                className={`${
                  settings.twoFactorEnabled ? 'translate-x-3' : '-translate-x-2.5'
                } inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <p className="text-sm text-gray-500">Settings are saved automatically</p>
        <button
          onClick={handleRestoreDefaults}
          disabled={saving}
          className="px-6 py-3 bg-[#6f2d74] text-white rounded-lg hover:bg-[#5a2460] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Restoring...' : 'Restore Defaults'}
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;