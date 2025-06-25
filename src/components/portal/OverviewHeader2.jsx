import React from 'react';
import GradientButton from './GradientButton';
import dewarsImage from '../../assets/images/dewars2.jpg';

const OverviewHeader = ({ 
  loading, 
  userName, 
  podcastEpisodes, 
  latestMediaItems 
}) => {
  return (
    <div 
      className="relative h-72 rounded-2xl overflow-hidden mb-12 animate-fadeIn"
      style={{ 
        animation: 'fadeIn 0.8s ease-in-out'
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Background image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${dewarsImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Gradient overlay that becomes transparent towards bottom right */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(135deg, #0e0e2f 0%, #1b163a 15%, #2a1b3d 30%, #3f2541 45%, rgba(46, 65, 104, 0.7) 65%, rgba(56, 78, 122, 0.4) 90%, rgba(255, 179, 102, 0.1) 100%)',
        }}
      />
      
      {/* Mesh gradient overlay for complexity */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(56, 78, 122, 0.3) 0%, transparent 50%)',
        }}
      />
      
      {/* Additional accent gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(115deg, transparent 40%, rgba(46, 65, 104, 0.2) 70%, rgba(56, 78, 122, 0.3) 100%)',
        }}
      />
      
      <div className="relative z-10 px-8 py-6 h-full flex items-center">
        <div className="flex items-center gap-12 w-full">
          {/* Welcome message on the left */}
          <div className="flex-1">
            <h1 className="font-light text-white mb-3 drop-shadow-lg tracking-tight" style={{ fontSize: '2.5rem' }}>
              <span className="text-white/90">Welcome</span>
              <span className="text-white font-normal">{loading ? '...' : (userName ? `, ${userName}!` : '!')}</span>
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-4 drop-shadow">
              Access your membership settings, documents, and resources all in one place.
            </p>
            <GradientButton 
              onClick={() => console.log('View membership status')}
              variant="outline"
              size="md"
              className="border-white/30 text-white hover:bg-white/10"
            >
              View Membership Status
            </GradientButton>
          </div>
          
          {/* Latest Media on the right */}
          {podcastEpisodes && podcastEpisodes[0] && latestMediaItems && latestMediaItems[0] && (
            <div className="hidden lg:block bg-white/15 backdrop-blur-sm rounded-lg p-5 max-w-lg border border-white/20">
              <h3 className="text-white text-base font-medium mb-3 drop-shadow">LATEST MEDIA</h3>
              <div className="flex items-start gap-4">
                <img 
                  src={latestMediaItems[0].image} 
                  alt={podcastEpisodes[0].title}
                  className="w-40 h-28 object-cover rounded-md shadow-lg flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-white/25 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                      PODCAST
                    </span>
                    <span className="text-xs text-white/70">
                      {podcastEpisodes[0].timeAgo}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white line-clamp-2 mb-2 drop-shadow">
                    {podcastEpisodes[0].title}
                  </h4>
                  <a 
                    href={podcastEpisodes[0].link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-white/90 hover:text-white transition-colors font-medium inline-block"
                  >
                    LISTEN NOW →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverviewHeader;