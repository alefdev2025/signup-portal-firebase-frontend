import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import alcorStar from '../../../assets/images/alcor-star.png';

// Global toggle for gradient style
const USE_RAINBOW_GRADIENT = false; // Set to false for purple-only gradient

// Global toggle for card style
const USE_EDGE_TO_EDGE = false; // Set to true for edge-to-edge flat cards, false for rounded cards

// Reusable Mobile Info Card Component
export const MobileInfoCard = ({
  icon: Icon,
  iconComponent, // For custom SVG icons
  title,
  subtitle, // Description text
  backgroundImage, // New prop for background image
  overlayText, // New prop for text overlay on image
  backgroundColor, // Gradient or solid color for content area
  children, // Main content
  defaultExpanded = false,
  className = "",
  isEditMode = false // New prop to track edit mode
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Card style based on USE_EDGE_TO_EDGE
  const cardStyle = USE_EDGE_TO_EDGE 
    ? "overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border-t border-b border-gray-200" 
    : "rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200";

  return (
    <div className={`${cardStyle} ${className} w-full`}>
      {/* White Header Section - Fixed height when collapsed */}
      <div 
        className={`bg-white px-6 cursor-pointer transition-all duration-200 ${
          !isExpanded ? 'py-6 min-h-[360px]' : 'py-6'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`flex flex-col gap-4 ${!isExpanded ? 'h-full w-full' : 'w-full'}`}>
          {/* Top row - Icon, Title and Chevron */}
          <div className="flex items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3.5 rounded-lg flex-shrink-0" style={{
                background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)'
              }}>
                {Icon ? (
                  <Icon className="w-7 h-7 text-white" />
                ) : iconComponent ? (
                  <div className="w-7 h-7 text-white">{iconComponent}</div>
                ) : null}
              </div>
              <h3 className="text-xl font-light text-gray-900">{title}</h3>
            </div>
            <ChevronDown 
              className={`w-7 h-7 text-gray-700 transition-transform duration-200 ml-4 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
          
          {/* Bottom row - Image with subtitle overlay */}
          <div className="w-full flex-1 flex flex-col">
            <div className="border-t border-gray-200 mb-4"></div>
            
            {/* Image with overlay if provided */}
            {backgroundImage && !isExpanded && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden shadow-md mb-4">
                <img 
                  src={backgroundImage} 
                  alt=""
                  className="w-full h-full object-cover grayscale"
                />
                
                {overlayText && (
                  <div className="absolute bottom-0 right-0">
                    <div className="px-4 py-2" style={{
                      background: 'linear-gradient(to right, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)'
                    }}>
                      <p className="text-white font-medium text-sm tracking-wider flex items-center gap-1">
                        {overlayText}
                        <img src={alcorStar} alt="" className="w-4 h-4" />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Subtitle text below image or by itself */}
            {subtitle && !isExpanded && (
              <div className="space-y-3 pb-2 pt-2">
                {typeof subtitle === 'string' ? (
                  <p className="text-base text-gray-700 leading-relaxed">
                    {subtitle}
                  </p>
                ) : (
                  subtitle
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          className="px-6 py-8"
          style={isEditMode ? { background: 'white' } : (backgroundColor ? { background: backgroundColor } : {
            background: USE_RAINBOW_GRADIENT 
              ? 'linear-gradient(170deg, #162740 0%, #443660 25%, #74417f 50%, #975d6e 75%, #f1b443 100%)'
              : 'linear-gradient(135deg, #785683 0%, #162740 30%, #443660 100%)'
          })}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Display Field Component for consistent styling
export const DisplayField = ({ label, value, className = "", isEditMode = false }) => (
  <div className={className}>
    <dt className={`${isEditMode ? 'text-gray-600' : 'text-white/60'} text-xs uppercase tracking-wider mb-1`}>{label}</dt>
    <dd className={`${isEditMode ? 'text-gray-900' : 'text-white'} text-sm font-medium`}>{value || "—"}</dd>
  </div>
);

// Form Field Components for edit mode
export const FormInput = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  error,
  ...props 
}) => (
  <div>
    <label className="block text-gray-700 text-sm font-medium mb-1.5">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg bg-gray-50 border ${
        error ? 'border-red-400' : 'border-gray-300'
      } text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-purple-500 transition-all`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  children,
  error,
  ...props 
}) => (
  <div>
    <label className="block text-gray-700 text-sm font-medium mb-1.5">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-lg bg-gray-50 border ${
        error ? 'border-red-400' : 'border-gray-300'
      } text-gray-900 focus:outline-none focus:bg-white focus:border-purple-500 transition-all appearance-none`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(107,114,128,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.7rem center',
        backgroundSize: '1.5em 1.5em',
      }}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Action Button Components
export const ActionButtons = ({ 
  editMode, 
  onEdit, 
  onSave, 
  onCancel, 
  saving = false 
}) => (
  <div className={`flex justify-end mt-6 pt-4 border-t ${editMode ? 'border-gray-200' : 'border-white/10'}`}>
    {editMode ? (
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-all font-medium disabled:opacity-50"
          style={{ backgroundColor: '#162740', '&:hover': { backgroundColor: '#0f1e33' } }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    ) : (
      <button
        onClick={onEdit}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
      >
        Edit
      </button>
    )}
  </div>
);