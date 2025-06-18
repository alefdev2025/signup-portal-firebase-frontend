import React from 'react';

const TopMiddleCard = () => {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-lg h-40 w-80">
      <div>
        <p className="text-gray-900 font-semibold text-lg">Documents</p>
        <p className="text-sm text-gray-500">Financial and Contract Documents</p>
        <p className="text-xs text-orange-600 mt-2 bg-orange-100 px-2 py-0.5 rounded-md inline-block">View or Upload Documents</p>
      </div>
      <div className="w-24 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="w-14 h-14 bg-gradient-to-bl from-[#ff9f4a] to-[#ff6b1a] rounded-md flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" className="w-8 h-8">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <path d="M2 10h20"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TopMiddleCard;