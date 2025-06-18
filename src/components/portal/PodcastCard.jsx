import React, { useState } from 'react';

const PodcastCard = ({ image, timeAgo, title, description, link, className }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      className={`relative preserve-3d transition-transform duration-700 transform-gpu ${isFlipped ? 'rotate-y-180' : ''} ${className || ''}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        height: '46%'
      }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={handleClick}
    >
      {/* Front of card */}
      <div 
        className="absolute inset-0 w-full h-full backface-hidden"
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 h-full hover:bg-white/15 transition-all duration-200">
          <div className="h-full flex flex-col p-4">
            {/* Image Container - 55% of card */}
            <div className="h-[55%] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden shadow-sm">
              <img 
                src={image} 
                alt="Podcast episode cover" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
              />
            </div>
            
            {/* Text Container - 45% of card */}
            <div className="h-[45%] flex flex-col justify-center pt-2.5">
              <p className="text-[11px] text-gray-300 uppercase tracking-wider mb-1 opacity-80 text-left">
                Podcast • {timeAgo}
              </p>
              <h4 className="text-white text-[14px] font-medium leading-snug line-clamp-3 text-left">
                {title}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Back of card */}
      <div 
        className="absolute inset-0 w-full h-full rotate-y-180 backface-hidden"
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        }}
      >
        <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl border border-white/30 h-full p-4 flex flex-col justify-between">
          <div className="flex-1 overflow-hidden">
            <h5 className="text-white text-[13px] font-semibold mb-3 uppercase tracking-wide opacity-90">Episode Overview</h5>
            <p className="text-white/80 text-[14px] leading-relaxed line-clamp-4">
              {description}
            </p>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
            <span className="text-white/70 text-[11px]">Click to listen</span>
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Add CSS for 3D transforms */}
      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </button>
  );
};

export default PodcastCard;