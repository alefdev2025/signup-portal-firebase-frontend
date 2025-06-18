import React from 'react';

const BottomMiddleCard = () => {
  return (
    <div className="bg-white rounded-2xl p-5 text-center shadow-lg h-full flex flex-col justify-center">
      <p className="text-gray-600 text-sm mb-2">Your SAT score</p>
      <div className="text-6xl font-bold text-gray-800 mb-3">89%</div>
      <div className="w-32 h-16 mx-auto">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path d="M 10 40 Q 50 10 90 40" stroke="#FFA500" strokeWidth="8" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
};

export default BottomMiddleCard;