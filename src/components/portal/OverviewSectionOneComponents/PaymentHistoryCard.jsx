import React from 'react';

const PaymentHistoryCard = () => {
  return (
    <div 
      className="rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-300 cursor-pointer"
      style={{ 
        background: 'linear-gradient(135deg, #482193 0%, #723de1 100%)'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">Payment History</h3>
          <p className="text-base opacity-90">View transactions</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryCard;