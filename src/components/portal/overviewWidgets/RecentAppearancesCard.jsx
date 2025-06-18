import React from 'react';

const RecentAppearancesCard = ({ appearances, isVisible }) => {
  if (!appearances || appearances.length === 0) return null;

  return (
    <div className={`rounded-2xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 25%, #155e75 50%, #164e63 75%, #083344 100%)' }}>
      <div className="flex flex-col gap-4">
        {/* Small image at top */}
        <img 
          src={appearances[0].image} 
          alt={appearances[0].title}
          className="w-full h-32 rounded-lg object-cover"
        />
        {/* Content */}
        <div>
          <h3 className="text-xl font-bold mb-2">Recent Appearances</h3>
          <p className="text-sm font-medium mb-1">{appearances[0].title}</p>
          <p className="text-xs opacity-90 mb-3">{appearances[0].type} • {appearances[0].organization}</p>
          {appearances[0].date && (
            <div className="flex items-center gap-2 text-sm mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{appearances[0].date}</span>
            </div>
          )}
          <button className="text-white/90 hover:text-white text-sm font-medium flex items-center gap-1">
            Watch Recording
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentAppearancesCard;