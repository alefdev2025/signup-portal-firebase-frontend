import React from 'react';

const MiddleLeftSmallCard = () => {
  return (
    <div className="bg-green-500 rounded-2xl p-5 text-white text-center h-32 flex flex-col justify-center">
      <div className="text-4xl mb-2">▶️</div>
      <p className="text-sm font-semibold">Latest</p>
      <p className="text-sm font-semibold">checks</p>
      <p className="text-xs opacity-80 mt-1">All done fast</p>
    </div>
  );
};

export default MiddleLeftSmallCard;