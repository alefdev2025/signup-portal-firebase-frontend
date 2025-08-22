import React, { useState, useEffect } from 'react';

/**
 * CompletionWheel Component
 * 
 * A circular progress indicator that shows completion percentage based on filled fields.
 * 
 * @param {Object} props
 * @param {Object} props.data - Data object containing the values to check (e.g., { personalInfo: {...}, contactInfo: {...} })
 * @param {Object} props.fieldConfig - Configuration object defining required and recommended fields
 * @param {Object} props.fieldConfig.required - Required fields with their source and field names
 * @param {Object} props.fieldConfig.recommended - Recommended fields with their source and field names
 * @param {number} [props.radius=75] - Radius of the wheel
 * @param {number} [props.strokeWidth=10] - Width of the progress stroke
 * @param {Object} [props.colors] - Custom color configuration
 * @param {string} [props.colors.high='#032CA6'] - Color for high completion (80%+)
 * @param {string} [props.colors.medium='#F26430'] - Color for medium completion (50-79%)
 * @param {string} [props.colors.low='#021859'] - Color for low completion (<50%)
 * @param {string} [props.colors.background='#e5e7eb'] - Background circle color
 * @param {string} [props.colors.text='#011140'] - Text color for percentage
 * @param {string} [props.colors.label='#021859'] - Text color for "Complete" label
 * 
 * @example
 * const fieldConfig = {
 *   required: {
 *     firstName: { field: 'firstName', source: 'personalInfo', label: 'First Name' },
 *     email: { field: 'email', source: 'contactInfo', label: 'Email' }
 *   },
 *   recommended: {
 *     phone: { field: 'phone', source: 'contactInfo', label: 'Phone' }
 *   }
 * };
 * 
 * <CompletionWheel 
 *   data={{ personalInfo: { firstName: 'John' }, contactInfo: { email: 'john@example.com' } }}
 *   fieldConfig={fieldConfig}
 * />
 */
 const CompletionWheel = ({ 
  data, 
  fieldConfig, 
  radius = 75,
  strokeWidth = 12,
  colors = {
    high: '#032CA6',
    medium: '#F26430', 
    low: '#021859',
    background: '#e5e7eb',
    text: '#011140',
    label: '#021859'
  }
}) => {
  const [screenSize, setScreenSize] = useState('2xl');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      let size;
      
      if (width < 640) {
        size = 'mobile';
      } else if (width < 1024) {
        size = 'sm'; // Small desktop
      } else if (width < 1280) {
        size = 'lg'; // Medium desktop
      } else if (width < 1536) {
        size = 'xl'; // Large desktop
      } else {
        size = '2xl'; // Extra large desktop
      }
      
      setScreenSize(size);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Responsive sizing with progressively thinner strokes
  const getResponsiveValues = () => {
    switch(screenSize) {
      case 'mobile':
        return { radius: 50, strokeWidth: 8 };   // Thinner on mobile
      case 'sm':
        return { radius: 60, strokeWidth: 8 };   // Much thinner on small desktop
      case 'lg':
        return { radius: 65, strokeWidth: 9 };   // Thinner on medium desktop
      case 'xl':
        return { radius: 70, strokeWidth: 10 };  // Moderately thin on large desktop
      case '2xl':
      default:
        return { radius: 75, strokeWidth: 12 };  // Full thickness on XL desktop
    }
  };

  const { radius: actualRadius, strokeWidth: actualStrokeWidth } = getResponsiveValues();
  
  const normalizedRadius = actualRadius - actualStrokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    let filledRequired = 0;
    
    // Check required fields only
    Object.values(fieldConfig.required).forEach(field => {
      // Check if field has a custom checkValue function
      if (field.checkValue && typeof field.checkValue === 'function') {
        if (field.checkValue(data)) {
          filledRequired++;
        }
      } else {
        // Default check
        const value = data[field.source]?.[field.field];
        if (value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '')) {
          filledRequired++;
        }
      }
    });
    
    const totalRequired = Object.keys(fieldConfig.required).length;
    
    // Required fields are now worth 100%
    const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
    return Math.round(requiredPercentage);
  };
  
  const completionPercentage = calculateCompletion();
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  // Generate unique ID for gradient
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Responsive text sizes
  const getTextSize = () => {
    switch(screenSize) {
      case 'mobile':
        return { percentage: 'text-xl', label: 'text-[10px]' };
      case 'sm':
        return { percentage: 'text-xl', label: 'text-[11px]' };
      case 'lg':
        return { percentage: 'text-2xl', label: 'text-xs' };
      case 'xl':
      case '2xl':
      default:
        return { percentage: 'text-2xl', label: 'text-xs' };
    }
  };

  const textSizes = getTextSize();

  return (
    <div className="relative inline-flex">
      <svg
        height={actualRadius * 2}
        width={actualRadius * 2}
        className="transform -rotate-90"
      >
        <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#212849" />   {/* Navy */}
          <stop offset="30%" stopColor="#4d3666" />  {/* Purple-Navy */}
          <stop offset="60%" stopColor="#7d4582" />  {/* Purple */}
          <stop offset="85%" stopColor="#864d7b" />  {/* Purple-Pink */}
          <stop offset="95%" stopColor="#9f6367" />  {/* Hint of Pink */}
          <stop offset="100%" stopColor="#aa6c61" /> {/* Hint of Orange */}
        </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          stroke={colors.background}
          fill="transparent"
          strokeWidth={actualStrokeWidth}
          r={normalizedRadius}
          cx={actualRadius}
          cy={actualRadius}
        />
        
        {/* Progress circle with gradient */}
        <circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={actualStrokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ 
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease',
            strokeLinecap: 'round'
          }}
          r={normalizedRadius}
          cx={actualRadius}
          cy={actualRadius}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div 
            className={`font-semibold ${textSizes.percentage}`} 
            style={{ color: colors.text }}
          >
            {completionPercentage}%
          </div>
          <div 
            className={textSizes.label} 
            style={{ color: colors.label }}
          >
            Complete
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * CompletionWheelWithLegend Component
 * 
 * Extends CompletionWheel with a legend showing required and recommended indicators
 * 
 * @param {Object} props - All props from CompletionWheel plus:
 * @param {string} [props.title='Profile Completion'] - Title text below the wheel
 * @param {Object} [props.legendColors] - Colors for the legend dots
 * @param {string} [props.legendColors.required] - Color for required indicator
 * @param {string} [props.legendColors.recommended] - Color for recommended indicator
 * @param {string} [props.sectionColor] - Override color for legend dots (both will use this color)
 */
 export const CompletionWheelWithLegend = ({ 
  title = 'Profile Completion',
  legendColors = {
    required: '#7d4582',      // Purple from your gradient
    recommended: '#D1D5DB'    // Light gray to match the field dots
  },
  sectionColor,
  ...wheelProps 
}) => {
  // Always use purple for required, ignore sectionColor
  const requiredColor = '#7d4582';  // Force purple
  const recommendedColor = '#D1D5DB'; // Force light gray

  return (
    <div className="flex flex-col items-center">
      <CompletionWheel {...wheelProps} />
      <p className="text-sm font-medium mt-3" style={{ color: '#011140' }}>
        {title}
      </p>
      <div className="flex items-center space-x-4 mt-2">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: requiredColor }}></div>
          <span className="text-xs" style={{ color: '#021859' }}>Required</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: recommendedColor }}></div>
          <span className="text-xs" style={{ color: '#021859' }}>Recommended</span>
        </div>
      </div>
    </div>
  );
};

export default CompletionWheel;