import React from 'react';

const BottomLeftCard = () => {
  const activities = [
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      name: 'Account Settings',
      time: '2 hours ago'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
      name: 'View Membership',
      time: '5 hours ago'
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
      name: 'Payment History',
      time: 'Yesterday'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-5">Recent activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#9b88db] to-[#6b5bc6] rounded-xl flex items-center justify-center flex-shrink-0">
              {activity.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{activity.name}</p>
              <p className="text-sm text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomLeftCard;