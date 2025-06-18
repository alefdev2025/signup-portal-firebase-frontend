import React from 'react';

const BottomRightCard = () => {
  return (
    <div className="bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 rounded-2xl p-6 text-white h-full">
      <p className="text-sm opacity-90 mb-1">Saved this Year Recent</p>
      <p className="text-5xl font-bold mb-3">$5,000</p>
      <p className="text-sm opacity-90 mb-6">Friends Earned: +$5,000</p>
      <button className="w-full bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl text-sm font-semibold transition-colors backdrop-blur">
        Manage
      </button>
    </div>
  );
};

export default BottomRightCard;