// File: components/ContactFormFields.jsx
import React from 'react';
import { countries } from '../utils/contactCountryConfig';

// Custom styles for input labels - UPDATED WITH SMALLER TEXT
export const LabelWithIcon = ({ label, required = false }) => (
  <div className="mb-1">
    <span className="block text-gray-800 text-base md:text-sm font-medium mb-2">{label} {required && '*'}</span>
  </div>
);

// Standard input field
export const InputField = ({ 
  id, 
  name, 
  type = "text", 
  autoComplete, 
  value, 
  onChange, 
  onInput,
  className = "",
  disabled = false,
  required = false,
  error = "",
  placeholder = "",
  onFocus = null
}) => (
  <div>
    <input 
      type={type}
      id={id}
      name={name}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      onInput={onInput}
      onFocus={onFocus}
      placeholder={placeholder}
      className={`w-full h-16 pl-2 pr-3 py-3 bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-[#775684] text-gray-800 text-lg ${className}`}
      style={error ? {border: '2px solid #dc2626'} : {borderColor: 'rgba(119, 86, 132, 0.3)'}}
      disabled={disabled}
      required={required}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Select dropdown field
export const SelectField = ({ 
  id, 
  name, 
  autoComplete, 
  value, 
  onChange, 
  onInput,
  disabled = false,
  required = false,
  error = "",
  children,
  className = ""
}) => (
  <div>
    <select
      id={id}
      name={name}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      onInput={onInput}
      className={`w-full h-16 pl-2 pr-3 py-3 bg-white border border-[#775684]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#775684] text-gray-700 ${className}`}
      disabled={disabled}
      required={required}
      style={{backgroundColor: "#FFFFFF", color: "#333333"}}
    >
      {children}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Country select field
export const CountrySelect = ({ 
  id, 
  name, 
  autoComplete, 
  value, 
  onChange, 
  onInput,
  disabled = false,
  required = false,
  error = ""
}) => (
  <SelectField
    id={id}
    name={name}
    autoComplete={autoComplete}
    value={value}
    onChange={onChange}
    onInput={onInput}
    disabled={disabled}
    required={required}
    error={error}
  >
    {countries.map(country => (
      <option key={country} value={country}>{country}</option>
    ))}
  </SelectField>
);

// Date of birth component
export const DateOfBirthFields = ({ 
  birthMonth, 
  birthDay, 
  birthYear, 
  onChange, 
  onInput,
  disabled = false,
  errors = {}
}) => (
  <div>
    <LabelWithIcon label="Date of Birth" required={true} />
    <div className="grid grid-cols-3 gap-2 date-container">
      {/* Month dropdown */}
      <div className="date-select">
        <select
          id="birthMonth"
          name="birthMonth"
          autoComplete="bday-month"
          value={birthMonth || ""}
          onChange={onChange}
          onInput={onInput}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.birthMonth ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
          disabled={disabled}
          required
        >
          <option value="" disabled>Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        {errors.birthMonth && <p className="text-red-500 text-sm mt-1">{errors.birthMonth}</p>}
      </div>
      
      {/* Day dropdown */}
      <div className="date-select">
        <select
          id="birthDay"
          name="birthDay"
          autoComplete="bday-day"
          value={birthDay || ""}
          onChange={onChange}
          onInput={onInput}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.birthDay ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
          disabled={disabled}
          required
        >
          <option value="" disabled>Day</option>
          {Array.from({ length: 31 }, (_, i) => {
            const day = (i + 1).toString().padStart(2, '0');
            return <option key={day} value={day}>{day}</option>;
          })}
        </select>
        {errors.birthDay && <p className="text-red-500 text-sm mt-1">{errors.birthDay}</p>}
      </div>
      
      {/* Year dropdown */}
      <div className="date-select">
        <select
          id="birthYear"
          name="birthYear"
          autoComplete="bday-year"
          value={birthYear || ""}
          onChange={onChange}
          onInput={onInput}
          style={{
            height: '4rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
            borderRadius: '0.375rem',
            fontSize: '1.125rem',
            width: '100%',
            border: errors.birthYear ? '2px solid #dc2626' : '1px solid rgba(119, 86, 132, 0.3)'
          }}
          disabled={disabled}
          required
        >
          <option value="" disabled>Year</option>
          {Array.from({ length: 100 }, (_, i) => {
            const year = (new Date().getFullYear() - i);
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
        {errors.birthYear && <p className="text-red-500 text-sm mt-1">{errors.birthYear}</p>}
      </div>
    </div>
  </div>
);