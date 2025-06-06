// File: components/LoadingSpinner.jsx
import React from 'react';
import alcorStar from '../assets/images/alcor-star.png';
import yellowStar from '../assets/images/alcor-yellow-star.png';

/**
 * Modern loading spinner component with multiple variants
 */
const LoadingSpinner = ({ 
  variant = 'pulse', // 'pulse', 'orbit', 'dots', 'dna', 'star'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  color = 'primary', // 'primary', 'white', 'navy'
  message = 'Loading...',
  showMessage = true,
  className = ''
}) => {
  
  // Size mappings
  const sizes = {
    sm: { wrapper: 'h-8 w-8', text: 'text-sm', star: 'h-6 w-6' },
    md: { wrapper: 'h-12 w-12', text: 'text-base', star: 'h-8 w-8' },
    lg: { wrapper: 'h-16 w-16', text: 'text-lg', star: 'h-10 w-10' },
    xl: { wrapper: 'h-20 w-20', text: 'text-xl', star: 'h-12 w-12' }
  };
  
  // Color mappings
  const colors = {
    primary: {
      main: '#775684',
      secondary: '#664573',
      text: 'text-gray-600'
    },
    white: {
      main: '#ffffff',
      secondary: '#f3f4f6',
      text: 'text-white'
    },
    navy: {
      main: '#13263f',
      secondary: '#0a1629',
      text: 'text-gray-600'
    }
  };
  
  const currentSize = sizes[size];
  const currentColor = colors[color];
  
  // Render different spinner variants
  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return (
          <div className="relative">
            <div className={`${currentSize.wrapper} relative`}>
              <div className="absolute inset-0 rounded-full opacity-75 animate-ping" 
                   style={{ backgroundColor: currentColor.main }}></div>
              <div className="relative rounded-full h-full w-full animate-pulse"
                   style={{ backgroundColor: currentColor.main }}></div>
            </div>
          </div>
        );
        
      case 'orbit':
        return (
          <div className={`${currentSize.wrapper} relative`}>
            <div className="absolute inset-0 rounded-full border-2 opacity-25"
                 style={{ borderColor: currentColor.main }}></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                 style={{ borderTopColor: currentColor.main, borderRightColor: currentColor.main }}></div>
            <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin animation-delay-150"
                 style={{ borderBottomColor: currentColor.secondary, borderLeftColor: currentColor.secondary, animationDirection: 'reverse' }}></div>
          </div>
        );
        
      case 'dots':
        return (
          <div className={`${currentSize.wrapper} relative`}>
            <div className="flex items-center justify-center h-full w-full gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ 
                    backgroundColor: currentColor.main,
                    animationDelay: `${i * 0.15}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        );
        
      case 'dna':
        return (
          <div className={`${currentSize.wrapper} relative`}>
            <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke={currentColor.main} strokeWidth="4" opacity="0.25"></circle>
              <path
                fill="none"
                stroke={currentColor.main}
                strokeWidth="4"
                strokeLinecap="round"
                d="M 25 5 A 20 20 0 0 1 45 25"
                className="animate-dash"
              ></path>
              <circle cx="25" cy="25" r="10" fill="none" stroke={currentColor.secondary} strokeWidth="3" opacity="0.5"
                      className="animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></circle>
            </svg>
          </div>
        );
        
      case 'star':
        return (
          <div className={`${currentSize.star} animate-pulse`}>
            <img 
              src={color === 'white' ? alcorStar : yellowStar} 
              alt="Loading" 
              className="w-full h-full animate-spin"
              style={{ animationDuration: '2s' }}
            />
          </div>
        );
        
      default:
        return (
          <div className={`${currentSize.wrapper} relative`}>
            <div className="absolute inset-0 rounded-full border-4 opacity-25"
                 style={{ borderColor: currentColor.main }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                 style={{ borderTopColor: currentColor.main }}></div>
          </div>
        );
    }
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {renderSpinner()}
      {showMessage && message && (
        <p className={`mt-4 ${currentSize.text} ${currentColor.text} font-medium`}>
          {message}
        </p>
      )}
      
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        .animate-dash {
          stroke-dasharray: 62.83;
          stroke-dashoffset: 62.83;
          animation: dash 1.5s ease-in-out infinite;
        }
        
        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  );
};

// Preset variants for common use cases
export const PageLoadingSpinner = ({ message = "Loading page..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner variant="orbit" size="lg" message={message} />
  </div>
);

export const ButtonLoadingSpinner = ({ color = 'white' }) => (
  <LoadingSpinner variant="dots" size="sm" color={color} showMessage={false} />
);

export const CardLoadingSpinner = ({ message = "Loading..." }) => (
  <div className="p-8">
    <LoadingSpinner variant="pulse" size="md" message={message} />
  </div>
);

export const FullScreenLoadingSpinner = ({ message = "Loading..." }) => (
  <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
    <LoadingSpinner variant="star" size="xl" message={message} />
  </div>
);

export default LoadingSpinner;