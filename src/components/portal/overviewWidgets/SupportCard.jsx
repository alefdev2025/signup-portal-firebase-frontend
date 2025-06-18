import React from 'react';

const SupportCard = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Support Center</h3>
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
          </svg>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">Get help when you need it</p>
      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        Contact Support →
      </button>
    </div>
  );
};

export default SupportCard;