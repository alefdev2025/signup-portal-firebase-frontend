import React from 'react';

const MyInformationTab = () => {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#2a2346] mb-8">My Information</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Personal Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Legal Name</label>
            <input 
              type="text" 
              defaultValue="Nikki Olson" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Date of Birth</label>
            <input 
              type="date" 
              defaultValue="1985-06-15" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Social Security Number</label>
            <input 
              type="text" 
              placeholder="XXX-XX-XXXX" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Driver's License Number</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Emergency Contacts</h2>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-medium text-[#2a2346] mb-4">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Relationship</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-[#2a2346] mb-4">Secondary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Relationship</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
                />
              </div>
            </div>
          </div>
        </div>
        <button className="mt-6 text-[#0a1629] hover:text-[#1e2650] transition-colors">
          + Add another contact
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-medium text-[#2a2346] mb-6">Medical Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Primary Physician</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Physician Phone</label>
            <input 
              type="tel" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Medical Conditions</label>
            <textarea 
              rows="3"
              placeholder="List any medical conditions or allergies..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Medications</label>
            <textarea 
              rows="3"
              placeholder="List current medications..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629]" 
            />
          </div>
        </div>
        <button className="mt-6 bg-[#0a1629] text-white px-6 py-2 rounded-lg hover:bg-[#1e2650] transition-colors">
          Save All Information
        </button>
      </div>
    </div>
  );
};

export default MyInformationTab;