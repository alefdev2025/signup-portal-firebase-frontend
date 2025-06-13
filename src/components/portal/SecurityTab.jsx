import React, { useState } from 'react';

const SecurityTab = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Security Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Password</h2>
        {!showPasswordForm ? (
          <div>
            <p className="text-[#4a3d6b] mb-4">Your password was last changed 45 days ago</p>
            <button 
              onClick={() => setShowPasswordForm(true)}
              className="bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors"
            >
              Change Password
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Current Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">New Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Confirm New Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
              />
            </div>
            <div className="flex gap-3">
              <button className="bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
                Update Password
              </button>
              <button 
                onClick={() => setShowPasswordForm(false)}
                className="bg-gray-200 text-[#2a2346] px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Two-Factor Authentication</h2>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[#4a3d6b] mb-2">
              Add an extra layer of security to your account by requiring a verification code in addition to your password.
            </p>
            <p className="text-sm text-[#4a3d6b]">
              Status: <span className={twoFactorEnabled ? "text-green-600 font-medium" : "text-gray-600"}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>
          <button 
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`px-6 py-2 rounded-lg transition-colors ${
              twoFactorEnabled 
                ? "bg-red-100 text-red-600 hover:bg-red-200" 
                : "bg-[#0a1629] text-white hover:bg-[#1e2650]"
            }`}
          >
            {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Login Activity</h2>
        <div className="space-y-3">
          <div className="border-b border-gray-100 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#2a2346]">Chrome on Windows</p>
                <p className="text-sm text-[#4a3d6b]">IP: 192.168.1.1 • Location: Seattle, WA</p>
              </div>
              <p className="text-sm text-green-600">Current session</p>
            </div>
          </div>
          <div className="border-b border-gray-100 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#2a2346]">Safari on iPhone</p>
                <p className="text-sm text-[#4a3d6b]">IP: 192.168.1.2 • Location: Seattle, WA</p>
              </div>
              <p className="text-sm text-[#4a3d6b]">2 hours ago</p>
            </div>
          </div>
          <div className="border-b border-gray-100 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-[#2a2346]">Firefox on MacOS</p>
                <p className="text-sm text-[#4a3d6b]">IP: 192.168.1.3 • Location: Portland, OR</p>
              </div>
              <p className="text-sm text-[#4a3d6b]">Yesterday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;