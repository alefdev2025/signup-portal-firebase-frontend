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
  radius = 90,
  strokeWidth = 15,
  colors = {
    high: '#032CA6',
    medium: '#F26430', 
    low: '#021859',
    background: '#e5e7eb',
    text: '#011140',
    label: '#021859'
  }
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      console.log('Mobile check:', mobile, 'Width:', window.innerWidth);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use different values for mobile - more dramatic differences
  const actualRadius = isMobile ? 60 : 90; // Smaller radius but thicker stroke on mobile
  const actualStrokeWidth = isMobile ? 12 : 15; // Thicker relative to size on mobile
  
  console.log('Wheel rendering - Mobile:', isMobile, 'Radius:', actualRadius, 'Stroke:', actualStrokeWidth);
  
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
            className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`} 
            style={{ color: colors.text }}
          >
            {completionPercentage}%
          </div>
          <div 
            className={`${isMobile ? 'text-xs' : 'text-sm'}`} 
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