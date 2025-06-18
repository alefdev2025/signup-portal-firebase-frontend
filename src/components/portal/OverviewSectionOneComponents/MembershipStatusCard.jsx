import React from 'react';

const MembershipStatusCard = () => {
  return (
    <div className="rounded-2xl p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden" 
         style={{ 
           background: 'linear-gradient(135deg, #6e6196 0%, #aa99c7 100%)' 
         }}>
      <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm p-3 rounded-lg">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white">
        Membership Status
      </h3>
      <p className="text-2xl font-semibold mt-2 mb-1 text-white">Active</p>
      <p className="text-base mb-8 text-white/90">
        Lifetime Member
      </p>
      <button 
        className="w-full text-purple-700 bg-white/90 py-2.5 rounded-full text-sm font-medium hover:bg-white transition-all duration-300"
      >
        View Details →
      </button>
    </div>
  );
};

export default MembershipStatusCard;