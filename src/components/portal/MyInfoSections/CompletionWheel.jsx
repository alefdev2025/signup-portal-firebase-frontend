import React from 'react';

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
  strokeWidth = 10,
  colors = {
    high: '#032CA6',
    medium: '#F26430', 
    low: '#021859',
    background: '#e5e7eb',
    text: '#011140',
    label: '#021859'
  }
}) => {
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Calculate completion percentage
// Calculate completion percentage
const calculateCompletion = () => {
  let filledRequired = 0;
  let filledRecommended = 0;
  
  // Check required fields
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
  
  // Check recommended fields
  Object.values(fieldConfig.recommended).forEach(field => {
    // Check if field has a custom checkValue function
    if (field.checkValue && typeof field.checkValue === 'function') {
      if (field.checkValue(data)) {
        filledRecommended++;
      }
    } else {
      // Default check
      const value = data[field.source]?.[field.field];
      if (value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '')) {
        filledRecommended++;
      }
    }
  });
  
  const totalRequired = Object.keys(fieldConfig.required).length;
  const totalRecommended = Object.keys(fieldConfig.recommended).length;
  
  // Weight: 70% for required fields, 30% for recommended
  const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 70 : 0;
  const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 30 : 0;
  
  return Math.round(requiredPercentage + recommendedPercentage);
};
  
  const completionPercentage = calculateCompletion();
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;
  
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return colors.high;
    if (percentage >= 50) return colors.medium;
    return colors.low;
  };

  return (
    <div className="relative">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke={colors.background}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getCompletionColor(completionPercentage)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: colors.text }}>
            {completionPercentage}%
          </div>
          <div className="text-sm" style={{ color: colors.label }}>
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
    required: '#512BD9',
    recommended: '#F26430'
  },
  sectionColor,
  ...wheelProps 
}) => {
  const requiredColor = sectionColor || legendColors.required;
  const recommendedColor = sectionColor || legendColors.recommended;

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