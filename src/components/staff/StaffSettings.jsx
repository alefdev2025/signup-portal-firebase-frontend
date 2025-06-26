import React, { useState } from 'react';
import { Save, Key, Bell, Shield, Database } from 'lucide-react';

const StaffSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoPublish: false,
    defaultImageQuality: 'high',
    apiKey: '••••••••••••••••',
    webhookUrl: ''
  });

  const handleSave = () => {
    // Save settings logic here
    alert('Settings saved successfully!');
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Settings</h2>

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            Notification Settings
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Email notifications for new content
              </span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Auto-publish scheduled content
              </span>
              <input
                type="checkbox"
                checked={settings.autoPublish}
                onChange={(e) => setSettings({...settings, autoPublish: e.target.checked})}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Media Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Media Settings
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Image Quality
            </label>
            <select
              value={settings.defaultImageQuality}
              onChange={(e) => setSettings({...settings, defaultImageQuality: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="low">Low (faster loading)</option>
              <option value="medium">Medium</option>
              <option value="high">High (best quality)</option>
            </select>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            API Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={settings.apiKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium">
                  Regenerate
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings({...settings, webhookUrl: e.target.value})}
                placeholder="https://your-webhook-url.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Access Control
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Staff Members</p>
                <p className="text-xs text-gray-500">Users with content management access</p>
              </div>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                Manage
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">API Access</p>
                <p className="text-xs text-gray-500">External services with API access</p>
              </div>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSettings;