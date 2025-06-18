import React from 'react';

const AnnouncementsSidebarCard = ({ announcements, isVisible }) => {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className={`bg-gradient-to-br from-navy-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ background: 'linear-gradient(135deg, #080f1f 0%, #1a1f42 50%, #242e5f 100%)' }}>
      <div className="flex flex-col gap-4">
        {/* Small image at top */}
        <img 
          src={announcements[0].image} 
          alt={announcements[0].title}
          className="w-full h-32 rounded-lg object-cover"
        />
        {/* Content */}
        <div>
          <h3 className="text-xl font-bold mb-2">Upcoming Events</h3>
          <p className="text-sm opacity-90 mb-3">{announcements[0].title}</p>
          {announcements[0].eventDate && (
            <div className="flex items-center gap-2 text-sm mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{announcements[0].eventDate}</span>
            </div>
          )}
          <button className="text-white/90 hover:text-white text-sm font-medium flex items-center gap-1">
            View Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsSidebarCard;