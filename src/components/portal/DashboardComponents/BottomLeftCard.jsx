import React from 'react';

const BottomLeftCard = () => {
  const transactions = [
    { icon: '☕', bgColor: 'bg-green-100', name: 'Starbucks', time: 'Just now', amount: '+$57.00', amountColor: 'text-green-600' },
    { icon: '📷', bgColor: 'bg-pink-100', name: 'Instagram', time: 'Yesterday', amount: '+$99.00', amountColor: 'text-pink-600' },
    { icon: '💎', bgColor: 'bg-blue-100', name: 'Sketch app', time: '2 days ago', amount: '+$205.00', amountColor: 'text-orange-600' }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-5">Latest updates</h3>
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${transaction.bgColor} rounded-full flex items-center justify-center`}>
                <span className="text-2xl">{transaction.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{transaction.name}</p>
                <p className="text-sm text-gray-500">{transaction.time}</p>
              </div>
            </div>
            <span className={`${transaction.amountColor} font-bold text-lg`}>{transaction.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomLeftCard;