// File: components/DotLoader.jsx
import React from 'react';

/**
 * Modern dot collision loading animation with horizontal collision effect cool
 */
const DotLoader = ({ 
  size = 'md', 
  color = 'primary',
  message = '',
  className = '' 
}) => {
  
  // Size mappings
  const sizes = {
    sm: { dot: 'w-2 h-2', container: 'w-32', text: 'text-sm' },
    md: { dot: 'w-3 h-3', container: 'w-40', text: 'text-base' },
    lg: { dot: 'w-4 h-4', container: 'w-48', text: 'text-lg' }
  };
  
  // Color mappings
  const colors = {
    primary: '#775684',
    navy: '#13263f',
    white: '#ffffff',
    gray: '#6b7280'
  };
  
  const currentSize = sizes[size];
  const dotColor = colors[color] || colors.primary;
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${currentSize.container} h-8 flex items-center justify-center`}>
        {/* Left dot - moves right and bounces back */}
        <div
          className={`absolute ${currentSize.dot} rounded-full`}
          style={{
            backgroundColor: dotColor,
            left: '10%',
            animation: 'dotCollideLeft 2s ease-in-out infinite'
          }}
        />
        
        {/* Center dots - scale and pulse on impact */}
        <div
          className={`absolute ${currentSize.dot} rounded-full`}
          style={{
            backgroundColor: dotColor,
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'dotCollideCenter 2s ease-in-out infinite'
          }}
        />
        
        {/* Right dot - moves left and bounces back */}
        <div
          className={`absolute ${currentSize.dot} rounded-full`}
          style={{
            backgroundColor: dotColor,
            right: '10%',
            animation: 'dotCollideRight 2s ease-in-out infinite'
          }}
        />
      </div>
      
      {message && (
        <p className={`mt-3 ${currentSize.text} text-gray-600`}>{message}</p>
      )}
      
      <style jsx>{`
        @keyframes dotCollideLeft {
          0%, 100% {
            transform: translateX(0) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(calc(40% - 6px)) scale(1.2);
            opacity: 1;
          }
          60% {
            transform: translateX(calc(30% - 6px)) scale(0.9);
            opacity: 0.9;
          }
        }
        
        @keyframes dotCollideCenter {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            opacity: 0.6;
          }
          45%, 55% {
            transform: translateX(-50%) scale(1.5);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) scale(1.8);
            opacity: 1;
          }
        }
        
        @keyframes dotCollideRight {
          0%, 100% {
            transform: translateX(0) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(calc(-40% + 6px)) scale(1.2);
            opacity: 1;
          }
          60% {
            transform: translateX(calc(-30% + 6px)) scale(0.9);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};

// Alternative: Continuous horizontal collision with 4 dots
export const HorizontalCollisionLoader = ({ 
  size = 'md', 
  color = 'primary',
  message = '',
  className = '' 
}) => {
  
  const sizes = {
    sm: { dot: 'w-2 h-2', container: 'w-24', text: 'text-sm' },
    md: { dot: 'w-3 h-3', container: 'w-32', text: 'text-base' },
    lg: { dot: 'w-4 h-4', container: 'w-40', text: 'text-lg' }
  };
  
  const colors = {
    primary: '#775684',
    navy: '#13263f',
    white: '#ffffff',
    gray: '#6b7280'
  };
  
  const currentSize = sizes[size];
  const dotColor = colors[color] || colors.primary;
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${currentSize.container} h-8 flex items-center`}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`absolute ${currentSize.dot} rounded-full`}
            style={{
              backgroundColor: dotColor,
              left: `${index * 25}%`,
              animation: `horizontalBounce 1.6s ease-in-out ${index * 0.1}s infinite`
            }}
          />
        ))}
      </div>
      
      {message && (
        <p className={`mt-3 ${currentSize.text} text-gray-600`}>{message}</p>
      )}
      
      <style jsx>{`
        @keyframes horizontalBounce {
          0%, 100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateX(10px) scale(1.2);
            opacity: 0.9;
          }
          50% {
            transform: translateX(-10px) scale(0.8);
            opacity: 0.7;
          }
          75% {
            transform: translateX(5px) scale(1.1);
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
};

// Newton's Cradle style with true physics-like collision
export const NewtonCradleLoader = ({ 
  size = 'md', 
  color = 'primary',
  message = '',
  className = '' 
}) => {
  
  const sizes = {
    sm: { dot: 'w-2 h-2', text: 'text-sm', spacing: 'gap-0.5' },
    md: { dot: 'w-3 h-3', text: 'text-base', spacing: 'gap-1' },
    lg: { dot: 'w-4 h-4', text: 'text-lg', spacing: 'gap-1.5' }
  };
  
  const colors = {
    primary: '#775684',
    navy: '#13263f',
    white: '#ffffff',
    gray: '#6b7280'
  };
  
  const currentSize = sizes[size];
  const dotColor = colors[color] || colors.primary;
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`flex items-center ${currentSize.spacing}`}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`${currentSize.dot} rounded-full`}
            style={{
              backgroundColor: dotColor,
              transformOrigin: 'center',
              animation: 
                index === 0 ? 'cradleLeft 1s ease-in-out infinite' : 
                index === 4 ? 'cradleRight 1s ease-in-out infinite 0.5s' : 
                'cradleCenter 1s ease-in-out infinite'
            }}
          />
        ))}
      </div>
      
      {message && (
        <p className={`mt-3 ${currentSize.text} text-gray-600`}>{message}</p>
      )}
      
      <style jsx>{`
        @keyframes cradleLeft {
          0%, 50% {
            transform: rotate(0deg) translateX(0);
          }
          25% {
            transform: rotate(-30deg) translateX(-10px);
          }
        }
        
        @keyframes cradleRight {
          0%, 50% {
            transform: rotate(0deg) translateX(0);
          }
          25% {
            transform: rotate(30deg) translateX(10px);
          }
        }
        
        @keyframes cradleCenter {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          25%, 75% {
            transform: scale(0.95);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};

// Preset loaders for different use cases
export const InlineLoader = ({ color = 'gray' }) => (
  <DotLoader size="sm" color={color} className="inline-flex" />
);

export const ButtonLoader = ({ color = 'white' }) => (
  <HorizontalCollisionLoader size="sm" color={color} className="inline-flex" />
);

export const PageLoader = ({ message = "Loading...", size = "lg", color = "primary" }) => (
  <DotLoader size={size} color={color} message={message} />
);

export default DotLoader;