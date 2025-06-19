import React from 'react';

const EmergencyContactsSection = ({ 
  emergencyContacts, 
  setEmergencyContacts, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveEmergencyContacts, 
  savingSection,
  handleAddEmergencyContact,
  handleDeleteEmergencyContact 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
      <h2 className="text-xl font-medium text-[#2a2346] mb-6">Emergency Contacts</h2>
      
      {emergencyContacts.map((contact, index) => (
        <div key={contact.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Name</label>
              <input 
                type="text" 
                value={contact.name || ''} 
                onChange={(e) => {
                  const updated = [...emergencyContacts];
                  updated[index] = {...contact, name: e.target.value};
                  setEmergencyContacts(updated);
                }}
                disabled={!editMode.emergency}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Relationship</label>
              <input 
                type="text" 
                value={contact.relationship || ''} 
                onChange={(e) => {
                  const updated = [...emergencyContacts];
                  updated[index] = {...contact, relationship: e.target.value};
                  setEmergencyContacts(updated);
                }}
                disabled={!editMode.emergency}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Phone</label>
              <input 
                type="tel" 
                value={contact.phone || ''} 
                onChange={(e) => {
                  const updated = [...emergencyContacts];
                  updated[index] = {...contact, phone: e.target.value};
                  setEmergencyContacts(updated);
                }}
                disabled={!editMode.emergency}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a3d6b] mb-2">Email</label>
              <input 
                type="email" 
                value={contact.email || ''} 
                onChange={(e) => {
                  const updated = [...emergencyContacts];
                  updated[index] = {...contact, email: e.target.value};
                  setEmergencyContacts(updated);
                }}
                disabled={!editMode.emergency}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
              />
            </div>
          </div>
          {editMode.emergency && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => handleDeleteEmergencyContact(contact.id)}
                className="text-red-600 hover:text-red-700"
              >
                Remove Contact
              </button>
            </div>
          )}
        </div>
      ))}
      
      {editMode.emergency && (
        <button
          onClick={handleAddEmergencyContact}
          className="mb-4 px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
        >
          Add Emergency Contact
        </button>
      )}
      
      <div className="flex justify-end mt-6 gap-2">
        {editMode.emergency ? (
          <>
            <button
              onClick={() => cancelEdit('emergency')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveEmergencyContacts}
              disabled={savingSection === 'emergency'}
              className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
            >
              {savingSection === 'emergency' ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <button
            onClick={() => toggleEditMode('emergency')}
            className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default EmergencyContactsSection;