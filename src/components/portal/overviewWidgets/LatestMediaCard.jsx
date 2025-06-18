import React from 'react';

const LatestMediaCard = ({ latestMediaItems }) => {
  if (!latestMediaItems || latestMediaItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer" style={{ background: 'linear-gradient(135deg, #050a15 0%, #0f1629 25%, #1a1f42 50%, #2d3561 75%, #3f4a8a 100%)' }}>
      <div className="flex flex-col gap-3">
        {/* Header with type and date */}
        <div>
          <h3 className="text-lg font-semibold mb-1">Latest Media</h3>
          <p className="text-sm opacity-90">{latestMediaItems[0].type} • {latestMediaItems[0].date}</p>
        </div>
        
        {/* Image with title below */}
        <div className="flex items-start gap-4">
          <img 
            src={latestMediaItems[0].image} 
            alt={latestMediaItems[0].title}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">{latestMediaItems[0].title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestMediaCard;