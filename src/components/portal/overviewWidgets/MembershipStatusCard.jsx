import React from 'react';
import GradientButton from '../GradientButton';

const MembershipStatusCard = () => {
  return (
    <div 
      className="rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full" 
      style={{ 
        background: 'linear-gradient(155deg, #12233b 0%, #272b4d 10%, #3b345b 20%, #4b3865 30%, #5d4480 40%, #6c5578 50%, #7b5670 60%, #8a5f64 70%, #996b66 80%, #ae7968 85%, #ba8166 87%, #ca9062 89%, #d4a85f 91%, #ddb571 92.5%, #e4c084 94%, #e9ca96 95.5%, #efd3a8 97%, #f7ddb5 98.5%, #ffd4a3 100%)' 
      }}
    >
      <div className="flex items-start justify-between mb-auto">
        <div>
          <h3 className="text-xl font-bold text-white">Membership Status</h3>
          <p className="text-sm text-white/90 mt-1">Active Member</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
        </div>
      </div>
      <GradientButton 
        onClick={() => console.log('View membership')}
        size="sm"
        className="w-full mt-8"
      >
        View Details
      </GradientButton>
    </div>
  );
};

export default MembershipStatusCard;