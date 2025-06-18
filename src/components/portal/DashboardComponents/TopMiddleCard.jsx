import React from 'react';

const TopMiddleCard = () => {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-lg h-28">
      <div>
        <p className="text-gray-900 font-semibold text-lg">View Documents</p>
        <p className="text-sm text-gray-500">Financial and Contracts</p>
        <p className="text-xs text-orange-600 mt-2 bg-orange-100 px-2 py-0.5 rounded-md inline-block">Upload documents</p>
      </div>
      <div className="w-24 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-5xl">📁</span>
      </div>
    </div>
  );
};

export default TopMiddleCard;