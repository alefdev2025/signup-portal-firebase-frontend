import React from 'react';

/**
 * Elegant pulse loader with purple tones for portal-wide use
 */
const DotLoader = ({ 
  size = 'md', 
  color = 'primary',
  message = '',
  className = '' 
}) => {
  
  // Size mappings - medium-sized dots with more spacing
  const sizes = {
    sm: { dot: 'w-2 h-2', spacing: 'gap-4', text: 'text-sm' },
    md: { dot: 'w-2.5 h-2.5', spacing: 'gap-6', text: 'text-base' },
    lg: { dot: 'w-3 h-3', spacing: 'gap-8', text: 'text-lg' }
  };
  
  // Purple tones from sidebar
  const colors = {
    primary: '#72407f',    // Main purple from sidebar
    darkPurple: '#4c3565', // Darker purple from sidebar  
    deepPurple: '#6e4376', // Deep purple variant
  };
  
  const currentSize = sizes[size];
  const dotColor = colors[color] || colors.primary;
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`flex items-center ${currentSize.spacing}`}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`${currentSize.dot} rounded-full`}
            style={{
              backgroundColor: dotColor,
              animation: `elegantPulse 1.4s ease-in-out ${index * 0.2}s infinite`,
              boxShadow: `0 0 4px ${dotColor}20`
            }}
          />
        ))}
      </div>
      
      {message && (
        <p className={`mt-4 ${currentSize.text} text-gray-500 font-light tracking-wide`}>
          {message}
        </p>
      )}
      
      <style jsx>{`
        @keyframes elegantPulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.3;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Preset loaders for different use cases throughout the portal
export const InlineLoader = ({ color = 'primary' }) => (
  <DotLoader size="sm" color={color} className="inline-flex" />
);

export const ButtonLoader = ({ color = 'primary' }) => (
  <DotLoader size="sm" color={color} className="inline-flex" />
);

// Page loader with proper centering
export const PageLoader = ({ message = "Loading...", size = "md", color = "primary" }) => (
  <div className="min-h-screen flex items-center justify-center">
    <DotLoader size={size} color={color} message={message} />
  </div>
);

// Alternative: Centered loader for specific containers
export const CenteredLoader = ({ message = "Loading...", size = "md", color = "primary", minHeight = "400px" }) => (
  <div className="w-full flex items-center justify-center" style={{ minHeight }}>
    <DotLoader size={size} color={color} message={message} />
  </div>
);

// Demo component
export const LoaderDemo = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-light text-gray-800 mb-8 text-center">
        Portal Loading Animation
      </h2>
      
      <div className="space-y-12">
        {/* Primary purple loader */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-light text-gray-700">Primary Purple</h3>
          <DotLoader size="md" color="primary" />
        </div>
        
        {/* Size variations */}
        <div>
          <h3 className="text-lg font-light text-gray-700 mb-4 text-center">Size Variations</h3>
          <div className="flex items-center justify-center gap-12">
            <DotLoader size="sm" color="primary" message="Small" />
            <DotLoader size="md" color="primary" message="Medium" />
            <DotLoader size="lg" color="primary" message="Large" />
          </div>
        </div>
        
        {/* Use cases */}
        <div>
          <h3 className="text-lg font-light text-gray-700 mb-4 text-center">Common Use Cases</h3>
          <div className="space-y-6 max-w-md mx-auto">
            {/* Button example */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <span className="text-gray-700">Button Loading</span>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-md flex items-center gap-2">
                <ButtonLoader />
                <span>Processing</span>
              </button>
            </div>
            
            {/* Inline example */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-gray-700">
                Fetching data <InlineLoader /> please wait...
              </p>
            </div>
            
            {/* Page loading example */}
            <div className="p-8 bg-white rounded-lg shadow-sm">
              <PageLoader message="Loading your content..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DotLoader;