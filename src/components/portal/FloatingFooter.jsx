import React from 'react';
import dewarsImage from '../../assets/images/dewars2.jpg';

const FloatingFooter = () => {
  return (
    <div className="mt-16 mb-4">
      <div 
        className="rounded-xl shadow-2xl overflow-hidden relative"
        style={{ 
          minHeight: '80px'
        }}
      >
        {/* Background Image */}
        <img 
          src={dewarsImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            filter: 'contrast(1.5) brightness(1.2) saturate(1.3)',
            mixBlendMode: 'luminosity'
          }}
        />
        
        {/* Gradient overlay matching announcements */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'linear-gradient(135deg, rgba(33, 40, 73, 0.95) 0%, rgba(77, 54, 102, 0.95) 20%, rgba(125, 69, 130, 0.95) 35%, rgba(134, 77, 123, 0.95) 50%, rgba(159, 99, 103, 0.9) 65%, rgba(170, 108, 97, 0.9) 75%, rgba(182, 118, 91, 0.85) 82%, rgba(196, 128, 86, 0.85) 88%, rgba(225, 152, 71, 0.85) 94%, rgba(243, 189, 69, 0.85) 100%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white text-lg font-medium mb-1 drop-shadow-lg">
                Need Help?
              </h3>
              <p className="text-white/90 text-sm drop-shadow">
                Contact our support team or browse our resources for assistance.
              </p>
            </div>
            <div className="flex gap-4 ml-8">
              <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/30 text-sm font-medium">
                Contact Support
              </button>
              <button className="bg-transparent hover:bg-white/10 text-white px-6 py-2 rounded-lg transition-all duration-200 border border-white/30 text-sm font-medium">
                View Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingFooter;