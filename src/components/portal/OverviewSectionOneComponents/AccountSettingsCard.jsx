import React from 'react';

export const AccountSettingsCard = () => {
    return (
      <div className="rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer" 
           style={{ 
             background: 'linear-gradient(135deg, #706293 0%, #857197 25%, #987f9b 50%, #b293a0 75%, #c3a0a4 100%)' 
           }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Account Settings</h3>
            <p className="text-sm text-white/90 mt-1">Manage your profile</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
        </div>
      </div>
    );
  };

export default AccountSettingsCard;