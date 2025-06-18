import React from 'react';

const NewsletterSidebarCard = ({ memberNewsletters, isVisible }) => {
  if (!memberNewsletters || memberNewsletters.length === 0) return null;

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-navy-900 rounded-2xl p-6 text-white relative overflow-hidden hover:shadow-xl transition-all duration-700 flex flex-col h-full ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ background: 'linear-gradient(135deg, #080f1f 0%, #1a1f42 50%, #242e5f 100%)' }}>
      <div className="flex items-start justify-between mb-auto">
        <div>
          <h3 className="text-xl font-bold text-white">Latest Newsletter</h3>
          <p className="text-sm text-white/90 mt-1">{memberNewsletters[0].title}</p>
          <p className="text-xs text-white/70 mt-2">{memberNewsletters[0].formattedDate}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
      </div>
      <button className="bg-white/20 hover:bg-white/30 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-8">
        Read Now
      </button>
    </div>
  );
};

export default NewsletterSidebarCard;