import React from 'react';
import podcastImage from '../../../assets/images/podcast-image.png';

const LatestMediaCard = ({ latestMediaItems }) => {
  if (!latestMediaItems || latestMediaItems.length === 0) return null;

  return (
    <div 
      className="rounded-2xl text-white hover:shadow-xl transition-all duration-300 p-6"
      style={{
        background: 'linear-gradient(135deg, #222a3b 0%, #354052 100%)'
      }}
    >
      <h3 className="text-xl font-semibold mb-1">Latest Media</h3>
      <p className="text-sm opacity-80 mb-4">Podcast • 2 weeks ago</p>
      
      <div className="flex items-center gap-4">
        <div className="bg-white rounded-lg p-1.5 w-16 h-16 flex items-center justify-center flex-shrink-0">
          <img 
            src={podcastImage} 
            alt="Alcor logo"
            className="w-14 h-14 object-contain"
          />
        </div>
        
        <p className="text-base leading-relaxed flex-1">{latestMediaItems[0].title}</p>
      </div>
    </div>
  );
};

export default LatestMediaCard;