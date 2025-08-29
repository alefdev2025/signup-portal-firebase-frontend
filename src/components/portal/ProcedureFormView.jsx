import React, { useState, useRef, useEffect } from 'react';
import { FileText, HelpCircle, Clock } from 'lucide-react';

// Custom TimeInput Component
const TimeInput = ({ name, value, onChange, onBlur, isInvalid, label, required }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [localTime, setLocalTime] = useState(value || '');
  const pickerRef = useRef(null);
  
  // Parse time string to hours and minutes
  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: '12', minutes: '00', period: 'AM' };
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours) || 12;
    const m = minutes || '00';
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return {
      hours: displayHour.toString().padStart(2, '0'),
      minutes: m,
      period: period
    };
  };
  
  // Convert 12-hour format to 24-hour format for storage
  const to24Hour = (hours, minutes, period) => {
    let h = parseInt(hours);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };
  
  const timeData = parseTime(localTime);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);
  
  const handleTimeSelect = (hours, minutes, period) => {
    const time24 = to24Hour(hours, minutes, period);
    setLocalTime(time24);
    onChange({ target: { name, value: time24 } });
    setShowPicker(false);
  };
  
  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return '';
    const data = parseTime(timeStr);
    return `${data.hours}:${data.minutes} ${data.period}`;
  };
  
  // Generate hour options
  const hours = Array.from({ length: 12 }, (_, i) => 
    (i + 1).toString().padStart(2, '0')
  );
  
  // Generate minute options (every 5 minutes)
  const minutes = Array.from({ length: 12 }, (_, i) => 
    (i * 5).toString().padStart(2, '0')
  );
  
  return (
    <div className="relative" ref={pickerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          name={name}
          value={formatDisplayTime(localTime)}
          onClick={() => setShowPicker(true)}
          onFocus={() => setShowPicker(true)}
          onBlur={onBlur}
          onChange={(e) => {
            // Allow manual typing
            setLocalTime(e.target.value);
            onChange(e);
          }}
          placeholder="Select time"
          className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent cursor-pointer ${
            isInvalid ? 'error-input' : 'border-gray-300'
          }`}
          readOnly
        />
        <Clock 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
          size={20} 
        />
      </div>
      
      {isInvalid && (
        <p className="error-text">This field is required</p>
      )}
      
      {/* Custom Time Picker Dropdown */}
      {showPicker && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="font-semibold text-xs text-gray-600 pb-1">Hour</div>
              <div className="font-semibold text-xs text-gray-600 pb-1">Minute</div>
              <div className="font-semibold text-xs text-gray-600 pb-1">AM/PM</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {/* Hours */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                {hours.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleTimeSelect(h, timeData.minutes, timeData.period)}
                    className={`w-full px-2 py-1 text-sm hover:bg-blue-50 ${
                      timeData.hours === h ? 'bg-blue-100 font-semibold' : ''
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
              
              {/* Minutes */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                {minutes.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeSelect(timeData.hours, m, timeData.period)}
                    className={`w-full px-2 py-1 text-sm hover:bg-blue-50 ${
                      timeData.minutes === m ? 'bg-blue-100 font-semibold' : ''
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              
              {/* AM/PM */}
              <div className="border border-gray-200 rounded">
                <button
                  type="button"
                  onClick={() => handleTimeSelect(timeData.hours, timeData.minutes, 'AM')}
                  className={`w-full px-2 py-2 text-sm hover:bg-blue-50 border-b ${
                    timeData.period === 'AM' ? 'bg-blue-100 font-semibold' : ''
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleTimeSelect(timeData.hours, timeData.minutes, 'PM')}
                  className={`w-full px-2 py-2 text-sm hover:bg-blue-50 ${
                    timeData.period === 'PM' ? 'bg-blue-100 font-semibold' : ''
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
            
            {/* Quick select common times */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Quick select:</div>
              <div className="grid grid-cols-4 gap-1">
                {['06:00', '09:00', '12:00', '15:00'].map(time => {
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        setLocalTime(time);
                        onChange({ target: { name, value: time } });
                        setShowPicker(false);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {formatDisplayTime(time)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProcedureFormView = ({
  wider,
  formData,
  handleInputChange,
  handleBlur,
  isFieldInvalid,
  handleSubmit,
  isSaving,
  saveMessage,
  showTooltip,
  setShowTooltip,
  alcorStar
}) => {
  return (
    <form onSubmit={handleSubmit}>
      {/* Mobile: Single Column Layout */}
      <div className="sm:hidden">
        {/* Single Form Container */}
        <div className="bg-white shadow-sm rounded-b-xl overflow-hidden slide-in mx-4" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-6" style={{ background: 'linear-gradient(90deg, #0a1628 0%, #1e2f4a 25%, #3a2f5a 60%, #6e4376 100%)' }}>
            <h2 className="text-base sm:text-lg 2xl:text-xl font-medium text-white flex items-center drop-shadow-md">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm mr-2 sm:mr-3" />
              Upcoming Procedure
              <img src={alcorStar} alt="" className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            </h2>
          </div>

          {/* Description */}
          <div className="px-6 sm:px-8 py-6 sm:py-8 lg:py-10 border-b border-gray-100">
            <p className="text-gray-700 text-[11px] sm:text-sm 2xl:text-base leading-relaxed font-normal">
              Please provide detailed information about your upcoming medical procedure. This information helps Alcor prepare for any potential standby or stabilization needs.
            </p>
          </div>

          {/* Form Fields */}
          <div className="px-6 py-6 space-y-6">
            {/* Medical Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base 2xl:text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Medical Information</h3>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    In a few sentences, share what's going on?
                  </label>
                  <div className="relative inline-block">
                    <HelpCircle 
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                      strokeWidth={2}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onClick={() => setShowTooltip(!showTooltip)}
                    />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-64">
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">
                              Help
                            </h3>
                            <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                            </svg>
                          </div>
                        </div>
                        <div className="px-4 py-3">
                          <p className="text-xs sm:text-sm text-gray-700">
                            You're on this form to tell us about your upcoming procedure - so in a few sentences, share what's been going on (your symptoms, concerns or questions, and any steps you've already taken). We'll ask for the exact procedure details next.
                          </p>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                          <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  name="whatsGoingOn"
                  value={formData.whatsGoingOn}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows="2"
                  placeholder="Brief description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Medical Condition <span className="text-red-500">*</span></label>
                <textarea
                  name="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('medicalCondition') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('medicalCondition') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility Address <span className="text-red-500">*</span></label>
                <textarea
                  name="facilityAddress"
                  value={formData.facilityAddress}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows="2"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('facilityAddress') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('facilityAddress') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="facilityPhone"
                  value={formData.facilityPhone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('facilityPhone') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('facilityPhone') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facility Fax <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="facilityFax"
                  value={formData.facilityFax}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('facilityFax') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('facilityFax') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Surgery <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="dateOfSurgery"
                  value={formData.dateOfSurgery}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('dateOfSurgery') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('dateOfSurgery') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              {/* Replace time inputs with TimeInput component for mobile */}
              <TimeInput
                name="surgeryStartTime"
                value={formData.surgeryStartTime}
                onChange={handleInputChange}
                onBlur={handleBlur}
                isInvalid={isFieldInvalid('surgeryStartTime')}
                label="Time Surgery to Start"
                required={true}
              />

              <TimeInput
                name="surgeryEndTime"
                value={formData.surgeryEndTime}
                onChange={handleInputChange}
                onBlur={handleBlur}
                isInvalid={isFieldInvalid('surgeryEndTime')}
                label="Time Surgery to End"
                required={true}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Surgery <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="typeOfSurgery"
                  value={formData.typeOfSurgery}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('typeOfSurgery') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('typeOfSurgery') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Using Anesthesia <span className="text-red-500">*</span></label>
                <select
                  name="usingAnesthesia"
                  value={formData.usingAnesthesia}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('usingAnesthesia') ? 'error-input' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {isFieldInvalid('usingAnesthesia') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Physician Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="physicianName"
                  value={formData.physicianName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('physicianName') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('physicianName') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Physician Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="physicianPhone"
                  value={formData.physicianPhone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('physicianPhone') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('physicianPhone') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Is physician aware of cryonics arrangements? <span className="text-red-500">*</span></label>
                <select
                  name="physicianAwareOfCryonics"
                  value={formData.physicianAwareOfCryonics}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('physicianAwareOfCryonics') ? 'error-input' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {isFieldInvalid('physicianAwareOfCryonics') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Can you send us a copy of your current POA for health care (if not already on file)? <span className="text-red-500">*</span></label>
                <select
                  name="poaOnFile"
                  value={formData.poaOnFile}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('poaOnFile') ? 'error-input' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="already_on_file">Already on file</option>
                </select>
                {isFieldInvalid('poaOnFile') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>
            </div>

            {/* Member Information Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm sm:text-base 2xl:text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Member Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="date"
                  value={formData.date}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="memberName"
                  value={formData.memberName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('memberName') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('memberName') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alcor Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="alcorNumber"
                  value={formData.alcorNumber}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="A-####"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('alcorNumber') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('alcorNumber') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  min="1"
                  max="150"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('age') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('age') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows="2"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('address') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('address') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('phone') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('phone') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency/POA Contact <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('emergencyContact') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('emergencyContact') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height/Weight <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="heightWeight"
                  value={formData.heightWeight}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                    isFieldInvalid('heightWeight') ? 'error-input' : 'border-gray-300'
                  }`}
                />
                {isFieldInvalid('heightWeight') && (
                  <p className="error-text">This field is required</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-[#12243c] to-[#1a2f4a] hover:from-[#1a2f4a] hover:to-[#243a5a] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Submit Procedure</span>
                </>
              )}
            </button>
            {saveMessage && (
              <div className={`mt-3 p-3 rounded-lg text-center text-sm font-medium ${
                saveMessage.includes('FAILED') 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'text-green-600'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Single Form Layout */}
      <div className="hidden sm:block">
        <div className="bg-white shadow-sm border border-gray-200 rounded-[1.25rem] slide-in" style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' }}>
          {/* Header */}
          <div className={`${wider ? 'p-10' : 'p-8 2xl:p-10'} border-b border-gray-100`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 2xl:p-3.5 rounded-lg transform transition duration-300" style={{ background: 'linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)' }}>
                <FileText className="w-6 h-6 2xl:w-7 2xl:h-7 text-white" />
              </div>
              <h3 className="text-lg 2xl:text-xl font-semibold text-gray-900">Upcoming Procedure</h3>
            </div>
            <p className={`text-gray-700 text-sm 2xl:text-base leading-relaxed font-normal ${wider ? 'max-w-3xl' : 'max-w-xl'}`}>
              Please provide detailed information about your upcoming medical procedure. This information helps Alcor prepare for any potential standby or stabilization needs.
            </p>
          </div>

          {/* Form Content */}
          <div className={`${wider ? 'p-10' : 'p-8 2xl:p-10'}`}>
            <div className={`space-y-8 ${wider ? 'max-w-6xl' : 'max-w-4xl'}`}>
              {/* Medical Information Section */}
              <div>
                <h4 className="text-lg 2xl:text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Medical Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm 2xl:text-base font-medium text-gray-700">
                        In a few sentences, share what's going on?
                      </label>
                      <div className="relative inline-block">
                        <HelpCircle 
                          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                          strokeWidth={2}
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          onClick={() => setShowTooltip(!showTooltip)}
                        />
                        {showTooltip && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-72">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  Help
                                </h3>
                                <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                                </svg>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-sm text-gray-700">
                                You're on this form to tell us about your upcoming procedure - so in a few sentences, share what's been going on (your symptoms, concerns or questions, and any steps you've already taken). We'll ask for the exact procedure details next.
                              </p>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                              <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      name="whatsGoingOn"
                      value={formData.whatsGoingOn}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="2"
                      placeholder="Brief description (optional)"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm 2xl:text-base font-medium text-gray-700 mb-2">Medical Condition <span className="text-red-500">*</span></label>
                    <textarea
                      name="medicalCondition"
                      value={formData.medicalCondition}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="3"
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('medicalCondition') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('medicalCondition') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facility Address <span className="text-red-500">*</span></label>
                    <textarea
                      name="facilityAddress"
                      value={formData.facilityAddress}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="2"
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('facilityAddress') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('facilityAddress') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facility Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="facilityPhone"
                      value={formData.facilityPhone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('facilityPhone') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('facilityPhone') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facility Fax <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="facilityFax"
                      value={formData.facilityFax}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('facilityFax') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('facilityFax') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Surgery <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="dateOfSurgery"
                      value={formData.dateOfSurgery}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('dateOfSurgery') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('dateOfSurgery') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type of Surgery <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="typeOfSurgery"
                      value={formData.typeOfSurgery}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('typeOfSurgery') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('typeOfSurgery') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  {/* Replace time inputs with TimeInput component for desktop */}
                  <TimeInput
                    name="surgeryStartTime"
                    value={formData.surgeryStartTime}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    isInvalid={isFieldInvalid('surgeryStartTime')}
                    label="Time Surgery to Start"
                    required={true}
                  />

                  <TimeInput
                    name="surgeryEndTime"
                    value={formData.surgeryEndTime}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    isInvalid={isFieldInvalid('surgeryEndTime')}
                    label="Time Surgery to End"
                    required={true}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Using Anesthesia <span className="text-red-500">*</span></label>
                    <select
                      name="usingAnesthesia"
                      value={formData.usingAnesthesia}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('usingAnesthesia') ? 'error-input' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {isFieldInvalid('usingAnesthesia') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Physician Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="physicianName"
                      value={formData.physicianName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('physicianName') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('physicianName') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Physician Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="physicianPhone"
                      value={formData.physicianPhone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('physicianPhone') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('physicianPhone') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Is physician aware of cryonics arrangements? <span className="text-red-500">*</span></label>
                    <select
                      name="physicianAwareOfCryonics"
                      value={formData.physicianAwareOfCryonics}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('physicianAwareOfCryonics') ? 'error-input' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {isFieldInvalid('physicianAwareOfCryonics') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Can you send us a copy of your current POA for health care (if not already on file)? <span className="text-red-500">*</span></label>
                    <select
                      name="poaOnFile"
                      value={formData.poaOnFile}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('poaOnFile') ? 'error-input' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="already_on_file">Already on file</option>
                    </select>
                    {isFieldInvalid('poaOnFile') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Information Section */}
              <div>
                <h4 className="text-lg 2xl:text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Member Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="date"
                      value={formData.date}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="memberName"
                      value={formData.memberName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('memberName') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('memberName') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alcor Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="alcorNumber"
                      value={formData.alcorNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="A-####"
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('alcorNumber') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('alcorNumber') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      min="1"
                      max="150"
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('age') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('age') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      rows="2"
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('address') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('address') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('phone') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('phone') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Emergency/POA Contact <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('emergencyContact') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('emergencyContact') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height/Weight <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="heightWeight"
                      value={formData.heightWeight}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-2.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#12243c] focus:border-transparent ${
                        isFieldInvalid('heightWeight') ? 'error-input' : 'border-gray-300'
                      }`}
                    />
                    {isFieldInvalid('heightWeight') && (
                      <p className="error-text">This field is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-[#12243c] to-[#1a2f4a] hover:from-[#1a2f4a] hover:to-[#243a5a] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    <span>Submit Procedure</span>
                  </>
                )}
              </button>
              {saveMessage && (
                <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                  saveMessage.includes('FAILED') 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'text-green-600'
                }`}>
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ProcedureFormView;