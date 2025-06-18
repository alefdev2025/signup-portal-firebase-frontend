import React from 'react';

const MiddleRightSmallCard = () => {
  return (
    <div className="bg-blue-600 rounded-2xl p-5 text-white text-center h-32 flex flex-col justify-center">
      <div className="text-4xl mb-2">📊</div>
      <p className="text-sm font-semibold">Urgent to</p>
      <p className="text-sm font-semibold">do</p>
      <p className="text-xs opacity-80 mt-1">Next task</p>
    </div>
  );
};

export default MiddleRightSmallCard;