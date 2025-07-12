import React from 'react';
import alcorStar from '../../assets/images/alcor-star.png';

// Section Image Component - to be placed inside section cards
export const SectionImage = ({ image, label }) => {
    if (!image) return null;
    
    return (
      <div className="absolute top-4 right-4 z-10">
        <div className="relative w-40 h-32 rounded-lg overflow-hidden shadow-xl border border-gray-200">
          <img 
            src={image} 
            alt={label}
            className="w-full h-full object-cover grayscale"
          />
          {/* Gradient overlay matching your icon style */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 110%, rgba(255, 183, 77, 0.9) 0%, rgba(251, 146, 60, 0.85) 10%, rgba(217, 119, 86, 0.85) 20%, rgba(153, 106, 104, 0.9) 35%, rgba(120, 86, 131, 0.92) 50%, rgba(68, 54, 96, 0.95) 70%, rgba(22, 39, 64, 0.98) 100%)'
          }}></div>
          
          {/* Label */}
          {label && (
            <div className="absolute bottom-0 inset-x-0">
              <div className="px-4 py-2" style={{
                background: 'linear-gradient(to right, rgba(10, 22, 40, 0.95) 0%, rgba(30, 47, 74, 0.95) 25%, rgba(58, 47, 90, 0.95) 60%, rgba(110, 67, 118, 0.95) 100%)'
              }}>
                <p className="text-white font-semibold text-sm tracking-wider flex items-center justify-center gap-1">
                  {label}
                  <img src={alcorStar} alt="" className="w-4 h-4" />
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };