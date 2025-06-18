import React from 'react';

const PaymentHistoryCard = ({ isVisible }) => {
  return (
    <div className={`bg-indigo-900 rounded-2xl p-6 text-white hover:shadow-xl transition-all duration-700 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-2 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>
      <p className="text-sm opacity-90">View transactions</p>
    </div>
  );
};

export default PaymentHistoryCard;