import React from 'react';

const AccountSettingsCard = ({ isVisible }) => {
  return (
    <div 
      className={`rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-700 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ 
        background: 'linear-gradient(155deg, #12233b 0%, #272b4d 10%, #3b345b 20%, #4b3865 30%, #5d4480 40%, #6c5578 50%, #7b5670 60%, #8a5f64 70%, #996b66 80%, #ae7968 85%, #ba8166 87%, #ca9062 89%, #d4a85f 91%, #ddb571 92.5%, #e4c084 94%, #e9ca96 95.5%, #efd3a8 97%, #f7ddb5 98.5%, #ffd4a3 100%)' 
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Account Settings</h3>
          <p className="text-sm text-white/90">Manage your profile</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsCard;