import React from 'react';

const MembershipSection = ({ 
  membership, 
  setMembership, 
  editMode, 
  toggleEditMode, 
  cancelEdit, 
  saveMembership, 
  savingSection 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
      <h2 className="text-xl font-medium text-[#2a2346] mb-6">Membership Options</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#4a3d6b] mb-2">
            <input 
              type="checkbox" 
              checked={membership.lifetimeMember || false} 
              onChange={(e) => setMembership({...membership, lifetimeMember: e.target.checked})}
              disabled={!editMode.membership}
              className="mr-2" 
            />
            Apply for lifetime membership ($1,500 one-time fee instead of annual dues)
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[#4a3d6b] mb-2">ICE Discount Code (if applicable)</label>
          <input 
            type="text" 
            value={membership.iceDiscountCode || ''} 
            onChange={(e) => setMembership({...membership, iceDiscountCode: e.target.value})}
            disabled={!editMode.membership}
            placeholder="Enter code if you have one"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] disabled:bg-gray-100" 
          />
        </div>
      </div>
      <div className="flex justify-end mt-6 gap-2">
        {editMode.membership ? (
          <>
            <button
              onClick={() => cancelEdit('membership')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveMembership}
              disabled={savingSection === 'membership'}
              className="px-4 py-2 bg-[#0a1629] text-white rounded-lg hover:bg-[#1e2650] disabled:opacity-50"
            >
              {savingSection === 'membership' ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <button
            onClick={() => toggleEditMode('membership')}
            className="px-4 py-2 text-[#0a1629] border border-[#0a1629] rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default MembershipSection;