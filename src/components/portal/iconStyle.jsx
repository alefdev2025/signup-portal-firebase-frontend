import React from 'react';

// Icon style constants
export const iconStyle = {
  // Gradient definition for icon backgrounds
  backgroundGradient: 'linear-gradient(135deg, #212849 0%, #4d3666 20%, #7d4582 35%, #864d7b 50%, #9f6367 65%, #aa6c61 75%, #b6765b 82%, #c48056 88%, #e19847 94%, #f3bd45 100%)',
  
  /* Alternative gradient color palette:
  #13233e
  #2e2c51
  #483462
  #5d3a71
  #72417f
  #784383
  #884f79
  #9e6169
  #b5755d
  #bf7d58
  #e19847
  #f3bd45
  */
  
  // Rainbow bottom gradient (using new colors with a touch of yellow at the end)
  rainbowBottomGradient: 'linear-gradient(90deg, #13233e 0%, #2e2c51 9%, #483462 18%, #5d3a71 27%, #72417f 36%, #784383 45%, #884f79 54%, #9e6169 63%, #b5755d 72%, #bf7d58 81%, #e19847 90%, #f3bd45 100%)',
  
  // Solid color versions (no orange)
  solidBlack: '#000000',
  solidNavy: '#212849',
  solidDarkPurple: '#4d3666',
  solidPurple: '#7d4582',
  solidPurplePink: '#864d7b',
  solidDustyRose: '#9f6367',
  solidWarmRose: '#aa6c61',
  
  // Icon stroke properties
  strokeWidth: 1.5, // Updated from 0.75 to match Forms tab
  
  // Icon size classes
  iconSize: 'w-6 h-6', // Default icon size
  iconSizeLarge: 'w-7 h-7', // Updated from w-8 h-8 to match Forms tab
  iconSizeSmall: 'w-5 h-5', // Small icon size
  
  // Container styling
  containerClasses: 'p-3.5 rounded-lg transform transition duration-300', // Updated from p-2.5 to p-3.5
  containerClassesSmall: 'p-2 rounded-lg transform transition duration-300',
  
  // Icon color
  iconColor: 'text-white',
};

// Reusable icon wrapper component with color options
export const IconWrapper = ({ children, size = 'default', className = '', color = 'gradient' }) => {
  const sizeClasses = {
    small: iconStyle.containerClassesSmall,
    default: iconStyle.containerClasses,
    large: iconStyle.containerClasses
  };
  
  const backgroundStyle = color === 'gradient' 
    ? { background: iconStyle.backgroundGradient }
    : color === 'rainbow'
    ? { background: iconStyle.rainbowBottomGradient }
    : { backgroundColor: iconStyle[`solid${color.charAt(0).toUpperCase() + color.slice(1)}`] || iconStyle.solidNavy };
  
  return (
    <div 
      className={`${sizeClasses[size]} ${className}`}
      style={backgroundStyle}
    >
      {children}
    </div>
  );
};

// Custom Bell Icon (matching forms style)
export const BellIcon = ({ className = iconStyle.iconSize }) => (
  <svg className={`${className} ${iconStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStyle.strokeWidth} d="M13 15h4l-1.405-1.405A2.032 2.032 0 0116 12.158V9a6.002 6.002 0 00-4-5.659V3a2 2 0 10-4 0v.341C5.67 4.165 4 6.388 4 9v3.159c0 .538-.214 1.055-.595 1.436L2 15h4m6 0v1a3 3 0 11-6 0v-1m6 0H6" />
  </svg>
);

// Custom Shield Icon (matching forms style)
export const ShieldIcon = ({ className = iconStyle.iconSize }) => (
  <svg className={`${className} ${iconStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStyle.strokeWidth} d="M7 10l2 2 4-4m5.618-4.016A11.955 11.955 0 0110 0.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 001 7c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Additional icons that might be needed
export const DocumentIcon = ({ className = iconStyle.iconSize }) => (
  <svg className={`${className} ${iconStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStyle.strokeWidth} d="M7 10h6m-6 4h6m2 5H5a2 2 0 01-2-2V3a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z" />
  </svg>
);

export const ClockIcon = ({ className = iconStyle.iconSize }) => (
  <svg className={`${className} ${iconStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStyle.strokeWidth} d="M10 6v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const MailIcon = ({ className = iconStyle.iconSize }) => (
  <svg className={`${className} ${iconStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStyle.strokeWidth} d="M1 6l7.89 5.26a2 2 0 002.22 0L19 6M3 17h14a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Rainbow bottom component (can be used at the bottom of tabs/pages)
export const RainbowBottom = ({ className = '', height = '4px' }) => (
  <div 
    className={`w-full ${className}`}
    style={{ 
      height,
      background: iconStyle.rainbowBottomGradient 
    }}
  />
);

// Example usage component showing how to use these icons
const IconStyleExample = () => {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Icon Style Examples</h2>
      
      {/* Gradient versions */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Gradient Icons</h3>
        <div className="flex gap-4 items-center">
          <IconWrapper>
            <BellIcon />
          </IconWrapper>
          
          <IconWrapper>
            <ShieldIcon />
          </IconWrapper>
          
          <IconWrapper>
            <DocumentIcon />
          </IconWrapper>
          
          <IconWrapper>
            <ClockIcon />
          </IconWrapper>
          
          <IconWrapper>
            <MailIcon />
          </IconWrapper>
        </div>
      </div>
      
      {/* Rainbow gradient version */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Rainbow Gradient Icons</h3>
        <div className="flex gap-4 items-center">
          <IconWrapper color="rainbow">
            <BellIcon />
          </IconWrapper>
          
          <IconWrapper color="rainbow">
            <ShieldIcon />
          </IconWrapper>
          
          <IconWrapper color="rainbow">
            <DocumentIcon />
          </IconWrapper>
        </div>
      </div>
      
      {/* Solid color versions */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Solid Color Icons</h3>
        
        {/* Black */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Black:</span>
          <IconWrapper color="black">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="black">
            <ShieldIcon />
          </IconWrapper>
        </div>
        
        {/* Navy */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Navy:</span>
          <IconWrapper color="navy">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="navy">
            <ShieldIcon />
          </IconWrapper>
        </div>
        
        {/* Dark Purple */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Dark Purple:</span>
          <IconWrapper color="darkPurple">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="darkPurple">
            <ShieldIcon />
          </IconWrapper>
        </div>
        
        {/* Purple */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Purple:</span>
          <IconWrapper color="purple">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="purple">
            <ShieldIcon />
          </IconWrapper>
        </div>
        
        {/* Purple Pink */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Purple Pink:</span>
          <IconWrapper color="purplePink">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="purplePink">
            <ShieldIcon />
          </IconWrapper>
        </div>
        
        {/* Dusty Rose */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Dusty Rose:</span>
          <IconWrapper color="dustyRose">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="dustyRose">
            <ShieldIcon />
          </IconWrapper>
        </div>
        
        {/* Warm Rose */}
        <div className="flex gap-4 items-center mb-4">
          <span className="text-sm w-24">Warm Rose:</span>
          <IconWrapper color="warmRose">
            <BellIcon />
          </IconWrapper>
          <IconWrapper color="warmRose">
            <ShieldIcon />
          </IconWrapper>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Different Sizes</h3>
        <div className="flex gap-4 items-center">
          <IconWrapper size="small">
            <BellIcon className={iconStyle.iconSizeSmall} />
          </IconWrapper>
          
          <IconWrapper size="default">
            <BellIcon className={iconStyle.iconSize} />
          </IconWrapper>
          
          <IconWrapper size="large">
            <BellIcon className={iconStyle.iconSizeLarge} />
          </IconWrapper>
        </div>
      </div>
      
      {/* Rainbow bottom example */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Rainbow Bottom Bar</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-4">Example content area</p>
          <RainbowBottom />
        </div>
        
        <div className="mt-4 bg-gray-100 p-4 rounded-lg">
          <p className="mb-4">Thicker rainbow bottom</p>
          <RainbowBottom height="8px" />
        </div>
      </div>
    </div>
  );
};

export default IconStyleExample;