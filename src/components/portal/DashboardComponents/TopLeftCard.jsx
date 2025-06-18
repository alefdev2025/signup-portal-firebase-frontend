import React from 'react';

const TopLeftCard = () => {
  return (
    <div className="bg-white rounded-2xl p-4 h-64 shadow-lg">
      <div className="bg-gradient-to-br from-cyan-400 to-teal-400 rounded-xl h-40 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-4 left-4 w-12 h-12 bg-yellow-300 rounded-lg"></div>
        <div className="absolute top-4 right-8 w-8 h-8 bg-white/30 rounded-full"></div>
        <div className="absolute top-6 right-4 w-6 h-6 bg-white/20 rounded-full"></div>
        <div className="text-7xl">🏖️</div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-teal-500/50"></div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-gray-900 font-semibold text-lg">Latest updates</p>
        <p className="text-gray-500 text-sm">All in one flow</p>
      </div>
    </div>
  );
};

export default TopLeftCard;