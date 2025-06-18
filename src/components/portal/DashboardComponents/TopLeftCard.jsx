import React from 'react';
import dewarsImage from '../../../assets/images/dewars-high-res1.png';
import alcorStar from '../../../assets/images/alcor-star.png';

const TopLeftCard = () => {
  return (
    <div className="relative rounded-2xl h-80 w-80 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dewarsImage})` }}
      />
      
      {/* Gradient Overlay - custom gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, 
            #12233b 0%, 
            #272b4d 10%, 
            #3b345b 20%, 
            #4b3865 30%, 
            #5d4480 40%, 
            #6c5578 50%, 
            #7b5670 60%, 
            #8a5f64 70%, 
            #996b66 80%, 
            #ae7968 85%, 
            #c2876a 88%, 
            #d4a85f 91%, 
            #ddb571 92.5%, 
            #e4c084 94%, 
            #e9ca96 95.5%, 
            #efd3a8 97%, 
            #f7ddb5 98.5%, 
            #ffd4a3 100%)`,
          opacity: 0.8
        }}
      />
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)`
        }}
      />
      
      {/* Content */}
      <div className="relative p-6 h-full text-white">
        <div className="flex items-center gap-1 mb-6">
          <h3 className="text-2xl font-bold text-white">Transactions</h3>
          <img src={alcorStar} alt="Star" className="w-7 h-7 inline-block" />
        </div>
        
        {/* Recent Payments */}
        <div className="space-y-3">
          {/* First Payment */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-800">Membership Dues</p>
              <p className="text-sm font-bold text-gray-900">$525.00</p>
            </div>
            <p className="text-xs text-gray-600 mb-1">December 15, 2024</p>
            <p className="text-xs text-gray-500">Annual membership renewal</p>
          </div>
          
          {/* Second Payment */}
          <div className="bg-white rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium text-gray-800">Trust Funding</p>
              <p className="text-sm font-bold text-gray-900">$1,200.00</p>
            </div>
            <p className="text-xs text-gray-600 mb-1">November 28, 2024</p>
            <p className="text-xs text-gray-500">Monthly trust contribution</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopLeftCard;