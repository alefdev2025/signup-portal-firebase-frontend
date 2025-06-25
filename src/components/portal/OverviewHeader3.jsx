import React from 'react';
import GradientButton from './GradientButton';
import alcorStar from '../../assets/images/alcor-star.png';
import dewarsImage from '../../assets/images/dewars2.jpg';

const OverviewHeader = ({ 
  isLoading, 
  memberName, 
  podcastEpisodes, 
  latestMediaItems 
}) => {
  return (
    <div 
      className="relative h-64 rounded-lg overflow-hidden mb-12 animate-fadeIn"
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
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4
        }}
      />
      
      {/* Main gradient - horizontal flow from blue to purple to orange */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, 
            #1a1f3a 0%,           /* Dark navy blue */
            #1f2951 10%,          /* Navy blue */
            #2a3564 20%,          /* Medium navy */
            #364177 30%,          /* Lighter navy */
            rgba(64, 60, 95, 0.9) 35%,      /* Start transparency earlier */
            rgba(68, 52, 94, 0.8) 40%,      /* Blue-purple transition */
            rgba(80, 57, 106, 0.7) 45%,     /* Your purple #50396a */
            rgba(80, 57, 106, 0.6) 50%,     /* Purple with more transparency */
            rgba(80, 57, 106, 0.4) 55%,     /* Fading purple */
            rgba(180, 100, 160, 0.3) 60%,   /* Purple-pink transition */
            rgba(210, 130, 140, 0.25) 65%,  /* Pink-orange transition */
            rgba(230, 150, 120, 0.2) 70%,   /* Light orange */
            rgba(245, 170, 100, 0.15) 75%,  /* Warm orange */
            rgba(255, 190, 80, 0.1) 80%,    /* Golden orange */
            rgba(255, 200, 100, 0.05) 85%,  /* Very light orange */
            transparent 90%)`                /* Transparent earlier */
        }}
      />
      
      {/* Top gradient overlay - creates the fade to transparent in top right */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            rgba(26, 31, 58, 0.8) 0%,       /* Start with some opacity */
            rgba(26, 31, 58, 0.6) 10%,      /* Quick fade */
            rgba(26, 31, 58, 0.4) 20%,      /* More fade */
            rgba(80, 57, 106, 0.3) 30%,     /* Purple tint */
            rgba(80, 57, 106, 0.2) 40%,     
            rgba(230, 150, 120, 0.15) 50%,  /* Orange tint but lighter */
            rgba(255, 190, 80, 0.1) 60%,    /* Golden orange very light */
            rgba(255, 200, 100, 0.05) 70%,  /* Almost transparent */
            transparent 80%,                 /* Fully transparent much earlier */
            transparent 100%)`,
          opacity: 0.6                       /* Reduced overall opacity */
        }}
      />
      
      {/* Additional top-right fade for extra transparency */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 95% 5%, 
            rgba(255, 255, 255, 0.05) 0%,   /* Very subtle white glow at top right */
            transparent 20%,
            transparent 40%,
            rgba(0, 0, 0, 0.1) 100%)`        /* Very subtle vignette on edges */
        }}
      />
      
      <div className="relative z-10 px-8 py-6 h-full flex items-center">
        <div className="flex items-center gap-12 w-full">
          {/* Welcome section */}
          <div className="flex-1">
            <h1 className="font-light text-white mb-3 drop-shadow-lg tracking-tight" style={{ fontSize: '2rem' }}>
              <span className="text-white/90">Welcome</span>
              <span className="text-white font-normal">{isLoading ? '...' : (memberName ? `, ${memberName}!` : '!')}</span>
            </h1>
            <p className="text-base md:text-lg text-white/90 mb-6 drop-shadow">
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
          
          {/* Media highlight */}
          {podcastEpisodes && podcastEpisodes[0] && latestMediaItems && latestMediaItems[0] && (
            <div className="hidden lg:block bg-white/10 backdrop-blur-md rounded-lg p-4 max-w-sm border border-white/20 shadow-lg">
              <div className="flex items-center gap-1 mb-2">
                <h3 className="text-white text-sm font-medium drop-shadow">LATEST MEDIA</h3>
                <img 
                  src={alcorStar} 
                  alt="Alcor Star" 
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-start gap-3">
                <img 
                  src={latestMediaItems[0].image} 
                  alt={podcastEpisodes[0].title}
                  className="w-24 h-16 object-cover rounded-md flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                      PODCAST
                    </span>
                    <span className="text-xs text-white/70">
                      {podcastEpisodes[0].timeAgo}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 mb-1.5 drop-shadow">
                    {podcastEpisodes[0].title}
                  </h4>
                  <a 
                    href={podcastEpisodes[0].link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-white/90 hover:text-white transition-colors font-medium inline-block"
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