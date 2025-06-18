import React from 'react';
import { announcements } from '../Announcements';

export const UpcomingEventsCard = () => {
    if (!announcements || announcements.length === 0) return null;
  
    const reorderedAnnouncements = [announcements[1], announcements[0]];
    const primaryEvent = reorderedAnnouncements[0];
  
    return (
      <div className="rounded-2xl text-white overflow-hidden hover:shadow-xl transition-all duration-300 row-span-2">
        <img 
          src={primaryEvent.image} 
          alt={primaryEvent.title}
          className="w-full h-40 object-cover"
        />
        <div 
          className="p-6"
          style={{
            background: 'linear-gradient(135deg, #222a3b 0%, #354052 100%)'
          }}
        >
          <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
          <p className="text-base mb-2">{primaryEvent.title}</p>
          {primaryEvent.eventDate && (
            <div className="flex items-center gap-2 text-sm mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{primaryEvent.eventDate}</span>
            </div>
          )}
          <button className="text-white hover:text-gray-200 text-sm font-medium">
            View Details →
          </button>
        </div>
      </div>
    );
  };
  
export default UpcomingEventsCard;