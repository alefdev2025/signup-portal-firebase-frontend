import React from 'react';
import alcorStar from '../../assets/images/alcor-star.png';

// Gradient Button Component with multiple variants
const GradientButton = ({ 
  children, 
  onClick, 
  showStar = true,
  className = '',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  variant = 'gradient' // 'gradient' | 'outline' | 'solid'
}) => {
  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-3.5 text-lg'
  };

  const starSizes = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
    xl: 'w-9 h-9'
  };

  // Base classes for all variants
  const baseClasses = `
    relative overflow-hidden rounded-full
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
    transition-all duration-300
    group
    ${className}
  `;

  // Variant-specific styles
  const variantStyles = {
    gradient: {
      style: {
        background: 'linear-gradient(90deg, #9662a2 0%, #b88bb8 20%, #d4a5a5 40%, #e6b89c 60%, #f4c99b 80%, #ffd4a3 100%)',
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 15px rgba(150, 98, 162, 0.3)'
      },
      textClass: 'text-white',
      starClass: 'brightness-100'
    },
    outline: {
      style: {
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 2px 10px rgba(255, 255, 255, 0.1)'
      },
      textClass: 'text-white',
      starClass: 'brightness-100'
    },
    solid: {
      style: {
        background: '#9662a2',
        border: '2px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 15px rgba(150, 98, 162, 0.3)'
      },
      textClass: 'text-white',
      starClass: 'brightness-100'
    }
  };

  const currentVariant = variantStyles[variant] || variantStyles.gradient;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      style={currentVariant.style}
    >
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-4">
        <span className={`${currentVariant.textClass} font-medium tracking-wide drop-shadow-sm`}>
          {children}
        </span>
        
        {showStar && (
          <img 
            src={alcorStar} 
            alt="" 
            className={`${starSizes[size]} ${currentVariant.starClass} object-contain group-hover:rotate-180 transition-transform duration-700`}
          />
        )}
      </span>

      {/* Hover overlay effect for gradient variant */}
      {variant === 'gradient' && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)'
          }}
        />
      )}

      {/* Hover effect for outline variant */}
      {variant === 'outline' && (
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full"
          style={{
            background: 'rgba(255, 255, 255, 0.1)'
          }}
        />
      )}
    </button>
  );
};

// Button style configurations for manual use
export const gradientButtonStyles = {
  gradient: {
    background: 'linear-gradient(90deg, #9662a2 0%, #b88bb8 20%, #d4a5a5 40%, #e6b89c 60%, #f4c99b 80%, #ffd4a3 100%)',
    border: '2px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 15px rgba(150, 98, 162, 0.3)'
  },
  outline: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 2px 10px rgba(255, 255, 255, 0.1)'
  },
  solid: {
    background: '#9662a2',
    border: '2px solid rgba(255, 255, 255, 0.9)',
    boxShadow: '0 4px 15px rgba(150, 98, 162, 0.3)'
  }
};

// Usage examples
export const ButtonExamples = () => {
  return (
    <div className="space-y-4 p-8 bg-gray-800">
      {/* Gradient button (default) */}
      <GradientButton onClick={() => console.log('Clicked!')}>
        Introduction to Cryonics
      </GradientButton>

      {/* Outline button with star */}
      <GradientButton variant="outline" size="md">
        View Membership Status
      </GradientButton>

      {/* Solid purple button */}
      <GradientButton variant="solid" showStar={false}>
        Learn More
      </GradientButton>

      {/* Small outline button */}
      <GradientButton variant="outline" size="sm">
        Quick Action
      </GradientButton>

      {/* Large gradient button */}
      <GradientButton variant="gradient" size="lg">
        Get Started Today
      </GradientButton>
    </div>
  );
};

export default GradientButton;