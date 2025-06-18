import React from 'react';
import bankIcon from '../../../assets/images/bank-purple.png';

const MiddleRightSmallCard = () => {
  return (
    <div className="bg-[#543fd8] rounded-2xl px-5 pt-5 pb-3 text-white text-center h-36 w-36 flex flex-col">
      <div className="flex-1 flex justify-center items-center">
        <div className="w-14 h-14 border-2 border-white rounded-lg flex items-center justify-center">
          <img 
            src={bankIcon} 
            alt="Bank" 
            className="w-8 h-8 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
      </div>
      <p className="text-sm font-semibold">Latest Payments</p>
    </div>
  );
};

export default MiddleRightSmallCard;