import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Global toggle for gradient style
const USE_RAINBOW_GRADIENT = false; // Set to false for purple-only gradient

// Global toggle for card style
const USE_EDGE_TO_EDGE = false; // Set to true for edge-to-edge flat cards, false for rounded cards

// Reusable Mobile Info Card Component
export const MobileInfoCard = ({
  icon: Icon,
  iconComponent, // For custom SVG icons
  title,
  preview, // Short preview text when collapsed
  subtitle, // Description text
  backgroundColor, // Gradient or solid color for content area
  children, // Main content
  defaultExpanded = false,
  className = "",
  isEditMode = false // New prop to track edit mode
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Card style based on USE_EDGE_TO_EDGE
  const cardStyle = USE_EDGE_TO_EDGE 
    ? "overflow-hidden shadow-lg border-t border-b border-gray-300" 
    : "rounded-3xl overflow-hidden shadow-lg border border-gray-300";

  return (
    <div className={`${cardStyle} ${className}`}>
      {/* White Header Section - Minimal Content */}
      <div 
        className="bg-white px-6 py-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-lg flex-shrink-0" style={{
              background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)'
            }}>
              {Icon ? (
                <Icon className="w-6 h-6 text-white" />
              ) : iconComponent ? (
                <div className="w-6 h-6 text-white">{iconComponent}</div>
              ) : null}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-light text-gray-900">{title}</h3>
              {subtitle && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {subtitle}
                </p>
              )}
              {preview && (
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {preview.split(' • ').map((item, index) => (
                    <div key={index} className="truncate">
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 mt-1 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
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

export const ActionButtons = ({ editMode, onEdit, onSave, onCancel, saving, hideEditButton }) => {
  if (!editMode) {
    // Don't show edit button if hideEditButton is true
    if (hideEditButton) {
      return null;
    }
    
    return (
      <div className="mt-6 flex justify-end">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-gradient-to-r from-[#162740] to-[#785683] text-white rounded-lg shadow-lg font-medium text-sm hover:shadow-xl transition-all duration-200"
        >
          Edit
        </button>
      </div>
    );
  }
  
  return (
    <div className="mt-6 flex justify-between">
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-white/10 text-white/90 rounded-lg font-medium text-sm hover:bg-white/20 transition-colors border border-white/20"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className={`px-4 py-2 bg-gradient-to-r from-[#162740] to-[#785683] text-white rounded-lg font-medium text-sm transition-all duration-200 ${
          saving ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
        }`}
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};