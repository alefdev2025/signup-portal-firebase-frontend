// FormComponents.jsx - Reusable form components with consistent styling

import React from 'react';
import styleConfig, { combineClasses } from './styleConfig';

// Input Component
export const Input = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  labelClassName = '',
  ...props 
}) => {
  const inputClasses = combineClasses(
    styleConfig.input.default,
    error && styleConfig.input.error,
    className
  );

  return (
    <div className={containerClassName}>
      {label && (
        <label className={combineClasses(styleConfig.form.label, labelClassName)}>
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Textarea Component
export const Textarea = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  labelClassName = '',
  ...props 
}) => {
  const textareaClasses = combineClasses(
    styleConfig.input.textarea,
    error && styleConfig.input.error,
    className
  );

  return (
    <div className={containerClassName}>
      {label && (
        <label className={combineClasses(styleConfig.form.label, labelClassName)}>
          {label}
        </label>
      )}
      <textarea className={textareaClasses} {...props} />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Select Component
export const Select = ({ 
  label, 
  error, 
  multiple = false,
  className = '', 
  containerClassName = '',
  labelClassName = '',
  children,
  ...props 
}) => {
  const selectClasses = combineClasses(
    multiple ? styleConfig.select.multiple : styleConfig.select.default,
    error && styleConfig.input.error,
    className
  );

  return (
    <div className={containerClassName}>
      {label && (
        <label className={combineClasses(styleConfig.form.label, labelClassName)}>
          {label}
        </label>
      )}
      <select className={selectClasses} multiple={multiple} {...props}>
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Checkbox Component
export const Checkbox = ({ 
  label, 
  className = '', 
  containerClassName = '',
  labelClassName = '',
  ...props 
}) => {
  return (
    <div className={containerClassName}>
      <label className={combineClasses(styleConfig.form.labelCheckbox, labelClassName)}>
        <input 
          type="checkbox" 
          className={combineClasses(styleConfig.input.checkbox, className)}
          {...props} 
        />
        {label}
      </label>
    </div>
  );
};

// Button Component
export const Button = ({ 
  variant = 'primary', 
  className = '', 
  children, 
  loading = false,
  ...props 
}) => {
  const buttonClasses = combineClasses(
    styleConfig.button[`${variant}Button`],
    className
  );

  return (
    <button 
      className={buttonClasses} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};

// Section Component
export const Section = ({ 
  title, 
  children, 
  className = '',
  titleClassName = '' 
}) => {
  return (
    <div className={combineClasses(styleConfig.section.wrapper, className)}>
      {title && (
        <h2 className={combineClasses(styleConfig.section.title, titleClassName)}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

// Button Group Component
export const ButtonGroup = ({ 
  align = 'end', 
  className = '', 
  children 
}) => {
  const alignmentClass = {
    start: styleConfig.buttonGroup.wrapperLeft,
    center: styleConfig.buttonGroup.wrapperCenter,
    end: styleConfig.buttonGroup.wrapper
  }[align] || styleConfig.buttonGroup.wrapper;

  return (
    <div className={combineClasses(alignmentClass, className)}>
      {children}
    </div>
  );
};

// Alert Component
export const Alert = ({ 
  type = 'info', 
  className = '', 
  children,
  onClose 
}) => {
  const alertClasses = combineClasses(
    styleConfig.alert.base,
    styleConfig.alert[type],
    className
  );

  return (
    <div className={alertClasses}>
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Loading Component
export const Loading = ({ text = "Loading..." }) => {
  return (
    <div className={styleConfig.loading.wrapper}>
      <div className="text-center">
        <div className={styleConfig.loading.spinner}></div>
        <p className={styleConfig.loading.text}>{text}</p>
      </div>
    </div>
  );
};

// Card Component
export const Card = ({ 
  variant = 'default', 
  className = '', 
  children 
}) => {
  const cardClasses = combineClasses(
    styleConfig.card[variant],
    className
  );

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};