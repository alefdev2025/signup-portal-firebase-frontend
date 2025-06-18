import React from 'react';

const TopRightCard = () => {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-800 rounded-2xl p-6 h-64 text-white relative overflow-hidden">
      <h3 className="text-2xl font-bold mb-2">What's your plan?</h3>
      <p className="text-sm opacity-90">Learn like a chess star</p>
      <div className="absolute bottom-4 left-6 text-5xl font-light opacity-30">36°</div>
      <div className="absolute bottom-4 right-4">
        <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
          <span className="text-5xl">✓</span>
        </div>
      </div>
    </div>
  );
};

export default TopRightCard;