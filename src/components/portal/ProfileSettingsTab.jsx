import React from 'react';

const ProfileSettingsTab = ({ profileImage, onImageUpload }) => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">Profile Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Profile Information</h2>
        
        <div className="flex items-start gap-8 mb-8">
          <div>
            <label htmlFor="profile-upload" className="cursor-pointer group block">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 group-hover:border-gray-300 transition-all duration-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center group-hover:border-gray-300 group-hover:bg-gray-200 transition-all duration-200">
                  <svg className="w-12 h-12 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </label>
            <input 
              id="profile-upload"
              type="file" 
              accept="image/*" 
              onChange={onImageUpload}
              className="hidden"
            />
            <button 
              onClick={() => document.getElementById('profile-upload').click()}
              className="mt-4 text-sm text-[#0a1629] hover:text-[#1e2650] transition-colors"
            >
              Change Photo
            </button>
          </div>
          
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">First Name</label>
                <input 
                  type="text" 
                  defaultValue="Nikki" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Last Name</label>
                <input 
                  type="text" 
                  defaultValue="Olson" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue="nikki@example.com" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone</label>
                <input 
                  type="tel" 
                  placeholder="(555) 123-4567" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Bio</label>
                <textarea 
                  rows="3"
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
            </div>
            <button className="mt-6 bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Address Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Street Address</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">City</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">State</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">ZIP Code</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
        </div>
        <button className="mt-6 bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
          Update Address
        </button>
      </div>
    </div>
  );
};

export default ProfileSettingsTab;