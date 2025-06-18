import React from 'react';

const MiddleLeftSmallCard = () => {
  return (
    <div className="bg-purple-100 rounded-2xl px-5 pt-5 pb-3 text-gray-800 text-center h-36 w-40 flex flex-col shadow-lg">
      <div className="flex-1 flex justify-center items-center">
        <div className="w-14 h-14 border-2 border-[#a855f7] rounded-lg flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="0.75">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
      </div>
      <p className="text-sm font-semibold">Latest Invoices</p>
    </div>
  );
};

export default MiddleLeftSmallCard;