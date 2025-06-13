// Portal Icon Configuration
// Centralized configuration for icon styles and color palettes

// Color palette for gradient icons
export const iconColors = {
    gradient: {
      darkNavy: '#222a45',
      deepPurple: '#373255',
      mutedPurple: '#55436b',
      mediumPurple: '#72577f',
      dustyRose: '#8f6a6b',
      warmTan: '#ae8871',
      lightBronze: '#b99375'
    }
  };
  
  // Icon gradient styles
  export const iconGradients = {
    // Diagonal gradient from dark top-left to light bottom-right
    diagonalWarm: 'linear-gradient(135deg, #222a45 0%, #373255 20%, #55436b 40%, #72577f 50%, #8f6a6b 65%, #ae8871 80%, #b99375 100%)',
    
    // Simplified 3-color version
    diagonalSimple: 'linear-gradient(135deg, #222a45 0%, #72577f 50%, #b99375 100%)',
    
    // Two-tone versions
    purpleToBronze: 'linear-gradient(135deg, #373255 0%, #ae8871 100%)',
    navyToRose: 'linear-gradient(135deg, #222a45 0%, #8f6a6b 100%)'
  };
  
  // Icon size presets
  export const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    '2xl': 'w-12 h-12'
  };
  
  // Icon container styles with gradient backgrounds
  export const iconContainerStyles = {
    squareGradient: (size = 'md') => ({
      className: `${iconSizes[size]} rounded-lg flex items-center justify-center`,
      style: { background: iconGradients.diagonalWarm }
    }),
    
    squareSimpleGradient: (size = 'md') => ({
      className: `${iconSizes[size]} rounded-lg flex items-center justify-center`,
      style: { background: iconGradients.diagonalSimple }
    }),
    
    circleGradient: (size = 'md') => ({
      className: `${iconSizes[size]} rounded-full flex items-center justify-center`,
      style: { background: iconGradients.diagonalWarm }
    }),
    
    roundedGradient: (size = 'md') => ({
      className: `${iconSizes[size]} rounded-xl flex items-center justify-center`,
      style: { background: iconGradients.diagonalWarm }
    })
  };
  
  // Helper function to create icon with gradient background
  export const createGradientIcon = (icon, options = {}) => {
    const {
      size = 'md',
      shape = 'square',
      gradientType = 'diagonalWarm',
      iconColor = 'white',
      className = ''
    } = options;
  
    const containerSize = {
      xs: 'w-8 h-8',
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-14 h-14',
      xl: 'w-16 h-16',
      '2xl': 'w-20 h-20'
    }[size];
  
    const shapeClass = {
      square: 'rounded-lg',
      circle: 'rounded-full',
      rounded: 'rounded-xl'
    }[shape];
  
    return `
      <div 
        class="${containerSize} ${shapeClass} flex items-center justify-center ${className}"
        style="background: ${iconGradients[gradientType]}"
      >
        <svg class="${iconSizes[size]} text-${iconColor}" fill="currentColor" viewBox="0 0 24 24">
          ${icon}
        </svg>
      </div>
    `;
  };
  
  // Example usage components
  export const iconExamples = {
    // Document icon with gradient background
    documentGradient: {
      container: iconContainerStyles.squareGradient('md'),
      icon: <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>
    },
    
    // Payment icon with gradient background
    paymentGradient: {
      container: iconContainerStyles.squareGradient('md'),
      icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    }
  };