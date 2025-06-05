// File: pages/components/FundingCard.jsx
import React, { useState } from "react";
import alcorStarSelected from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";
import whiteRoadIcon from "../../assets/images/white-road.png";

// Define system font stack
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const FundingCard = ({ 
  option, 
  isSelected, 
  onSelect, 
  packageInfo, 
  animationComplete, 
  animationDelay,
  getDynamicPricing,
  // Props for insurance functionality
  insuranceSubOption,
  policyDetails,
  validationErrors,
  onSelectInsuranceSubOption,
  onPolicyDetailChange,
  marcellusStyle // This prop is no longer used
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localInsuranceSubOption, setLocalInsuranceSubOption] = useState(insuranceSubOption || "existing");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [policyResourcesExpanded, setPolicyResourcesExpanded] = useState(false);
  
  const delayStyle = {
    transitionDelay: `${animationDelay}ms`
  };

  const dynamicCost = getDynamicPricing(option.id, packageInfo);

  const handleRowClick = () => {
    onSelect();
    setIsExpanded(!isExpanded);
  };

  const handleInsuranceSubOptionSelect = (subOption) => {
    setLocalInsuranceSubOption(subOption);
    if (onSelectInsuranceSubOption) {
      onSelectInsuranceSubOption(subOption);
    }
    setDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const togglePolicyResources = (e) => {
    e.stopPropagation();
    setPolicyResourcesExpanded(!policyResourcesExpanded);
  };

  return (
    <div 
      className={`cursor-pointer transform transition-all duration-500 ease-in-out ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} mb-4 lg:mb-2`}
      style={{ ...delayStyle, fontFamily: SYSTEM_FONT }}
    >
      {/* Unified Layout for All Screen Sizes */}
      <div 
        onClick={handleRowClick}
        className={`rounded-3xl overflow-hidden flex flex-col ${isSelected ? "border border-[#775684]" : ""} relative bg-white h-[450px] transition-all duration-300`}>
        
        {/* Header Section - Fixed Height */}
        <div className="bg-gradient-to-br from-gray-50 to-white px-6 py-6 h-32 flex items-center">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0 w-16 h-16 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center mr-4 shadow-sm">
              <img src={option.icon} alt={option.title} className="w-9 h-9 object-contain" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: SYSTEM_FONT }}>{option.title}</h3>
              <div className={`${option.badge.bgColor} ${option.badge.textColor} font-medium py-1.5 px-3 text-xs tracking-wide rounded-full inline-block shadow-sm`} style={{ fontFamily: SYSTEM_FONT }}>
                {option.badge.text}
              </div>
            </div>
          </div>
        </div>
        
        {/* Description Section - Fixed Height */}
        <div className="px-6 pb-4 h-16 flex items-center bg-white">
          <p className="text-gray-600 text-sm leading-relaxed w-full line-clamp-2 font-normal" style={{ fontFamily: SYSTEM_FONT }}>
            {option.description}
          </p>
        </div>
        
        {/* Pricing Section - Fixed Height */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 h-20">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700" style={{ fontFamily: SYSTEM_FONT }}>
                {option.pricing.costLabel || "Typical Cost"}
              </span>
              <span className={`${option.pricing.costColor} font-semibold text-base`} style={{ fontFamily: SYSTEM_FONT }}>
                {dynamicCost}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700" style={{ fontFamily: SYSTEM_FONT }}>
                {option.pricing.complexityLabel || "Complexity"}
              </span>
              <span className={`${option.pricing.costColor} font-semibold text-base`} style={{ fontFamily: SYSTEM_FONT }}>
                {option.pricing.complexity}
              </span>
            </div>
          </div>
        </div>
        
        {/* Benefits Section - Fills remaining space */}
        <div className="px-6 py-4 border-t border-gray-100 flex-1 flex flex-col relative z-10 bg-white">
          <h4 className="font-semibold text-base text-gray-800 mb-0" style={{ fontFamily: SYSTEM_FONT }}>
            Benefits
          </h4>
          <ul className="space-y-3 flex-1 flex flex-col justify-center">
            {option.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center">
                <img src={alcorYellowStar} alt="Benefit" className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="text-gray-700 text-sm font-normal" style={{ fontFamily: SYSTEM_FONT }}>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Insurance Details Content Component
const InsuranceDetailsContent = ({
  option,
  insuranceSubOption,
  policyDetails,
  dropdownOpen,
  policyResourcesExpanded,
  validationErrors,
  onSelectInsuranceSubOption,
  onToggleDropdown,
  onTogglePolicyResources,
  onPolicyDetailChange,
  marcellusStyle // This prop is no longer used
}) => {
  return (
    <div style={{ fontFamily: SYSTEM_FONT }}>
      <h3 className="text-base font-semibold text-[#323053] mb-3" style={{ fontFamily: SYSTEM_FONT }}>
        {option.detailsSection.title}
      </h3>
      
      {option.detailsSection.subtitle && (
        <p className="text-gray-600 text-xs mb-4" style={{ fontFamily: SYSTEM_FONT }}>
          {option.detailsSection.subtitle}
        </p>
      )}
      
      {/* Insurance Sub-option Dropdown */}
      <div className="mb-4 relative">
        <div 
          onClick={onToggleDropdown}
          className="p-3 rounded-lg cursor-pointer border border-[#775684] flex justify-between items-center bg-white"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#775684] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={insuranceSubOption === "new" 
                  ? option.detailsSection.subOptions.new.icon
                  : option.detailsSection.subOptions.existing.icon} 
              />
            </svg>
            <h4 className="text-xs font-medium text-gray-800" style={{ fontFamily: SYSTEM_FONT }}>
              {insuranceSubOption === "new" 
                ? option.detailsSection.subOptions.new.title
                : option.detailsSection.subOptions.existing.title}
            </h4>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-[#775684] transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {dropdownOpen && (
          <div className="absolute left-0 right-0 mt-1 z-20">
            <div 
              onClick={() => onSelectInsuranceSubOption("new")}
              className={`p-3 rounded-t-lg cursor-pointer transition-all duration-200 bg-white shadow-lg border border-[#775684] border-b-0 ${
                insuranceSubOption === "new" ? "bg-purple-50" : ""
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#775684] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.detailsSection.subOptions.new.icon} />
                </svg>
                <h4 className="text-xs font-medium text-gray-800" style={{ fontFamily: SYSTEM_FONT }}>{option.detailsSection.subOptions.new.title}</h4>
              </div>
            </div>
            
            <div 
              onClick={() => onSelectInsuranceSubOption("existing")}
              className={`p-3 rounded-b-lg cursor-pointer transition-all duration-200 bg-white shadow-lg border border-[#775684] ${
                insuranceSubOption === "existing" ? "bg-purple-50" : ""
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#775684] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.detailsSection.subOptions.existing.icon} />
                </svg>
                <h4 className="text-xs font-medium text-gray-800" style={{ fontFamily: SYSTEM_FONT }}>{option.detailsSection.subOptions.existing.title}</h4>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Content based on selected sub-option */}
      <div>
        {insuranceSubOption === "new" ? (
          <NewPolicyContent 
            subOption={option.detailsSection.subOptions.new}
            policyResourcesExpanded={policyResourcesExpanded}
            onTogglePolicyResources={onTogglePolicyResources}
          />
        ) : (
          <ExistingPolicyContent 
            subOption={option.detailsSection.subOptions.existing}
            policyDetails={policyDetails}
            validationErrors={validationErrors}
            onPolicyDetailChange={onPolicyDetailChange}
            marcellusStyle={marcellusStyle}
          />
        )}
      </div>
    </div>
  );
};

// New Policy Content Component
const NewPolicyContent = ({ subOption, policyResourcesExpanded, onTogglePolicyResources }) => {
  return (
    <div className="mt-3" style={{ fontFamily: SYSTEM_FONT }}>
      <h4 className="text-xs font-medium text-[#323053] mb-3 flex items-center" style={{ fontFamily: SYSTEM_FONT }}>
        <div className="bg-[#775684] w-6 h-6 rounded-lg flex items-center justify-center mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        Insurance Options
      </h4>
      <p className="text-gray-600 text-xs mb-3" style={{ fontFamily: SYSTEM_FONT }}>
        {subOption.description}
      </p>
      <div>
        <h5 className="font-medium text-black text-xs mb-2 flex items-center" style={{ fontFamily: SYSTEM_FONT }}>
          <div className="bg-[#775684] w-5 h-5 rounded flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span>{subOption.resources.title}</span>
          <div className="bg-[#d8b453] text-black font-medium py-0.5 px-1.5 ml-2 text-xs rounded-full" style={{ fontFamily: SYSTEM_FONT }}>
            {subOption.resources.badge}
          </div>
          <button 
            onClick={onTogglePolicyResources}
            className="focus:outline-none ml-2"
            aria-expanded={policyResourcesExpanded}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-3 w-3 text-[#775684] transition-transform ${policyResourcesExpanded ? 'transform rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </h5>
        
        <div 
          className={`transition-all duration-300 overflow-hidden ${
            policyResourcesExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="space-y-1 text-gray-600 text-xs pl-8 mb-2" style={{ fontFamily: SYSTEM_FONT }}>
            {subOption.resources.items.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1 font-normal">•</span>
                <span className="font-normal">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Existing Policy Content Component
const ExistingPolicyContent = ({ subOption, policyDetails, validationErrors, onPolicyDetailChange, marcellusStyle }) => {
  return (
    <div className="mt-3" style={{ fontFamily: SYSTEM_FONT }}>
      <h4 className="text-xs font-medium text-[#775684] mb-3 flex items-center" style={{ fontFamily: SYSTEM_FONT }}>
        <div className="bg-[#775684] w-6 h-6 rounded-lg flex items-center justify-center mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        Policy Information
      </h4>
      <p className="text-gray-600 text-xs mb-3" style={{ fontFamily: SYSTEM_FONT }}>
        {subOption.description}
      </p>
      <div className="space-y-3">
        {subOption.form.fields.map((field) => (
          <div key={field.id} className="relative">
            <label htmlFor={field.id} className="block text-gray-700 font-medium text-xs mb-1" style={{ fontFamily: SYSTEM_FONT }}>
              {field.label}
            </label>
            {field.type === "currency" ? (
              <div className="relative">
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs" style={{ fontFamily: SYSTEM_FONT }}>$</span>
                <input
                  type="text"
                  id={field.id}
                  name={field.id}
                  value={policyDetails ? policyDetails[field.id] : ''}
                  onChange={onPolicyDetailChange}
                  className={`w-full pl-6 px-2 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-[#775684] focus:border-[#775684] font-normal ${
                    validationErrors && validationErrors[field.id] ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'
                  }`}
                  placeholder={field.placeholder}
                  style={{ fontFamily: SYSTEM_FONT }}
                />
              </div>
            ) : (
              <input
                type={field.type}
                id={field.id}
                name={field.id}
                value={policyDetails ? policyDetails[field.id] : ''}
                onChange={onPolicyDetailChange}
                className={`w-full px-2 py-1.5 text-xs border rounded-md focus:ring-1 focus:ring-[#775684] focus:border-[#775684] font-normal ${
                  validationErrors && validationErrors[field.id] ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'
                }`}
                placeholder={field.placeholder}
                style={{ fontFamily: SYSTEM_FONT }}
              />
            )}
            
            {/* Tooltip when validation error exists for this field */}
            {validationErrors && validationErrors[field.id] && (
              <div className="absolute top-0 right-0 z-20 transform translate-x-1 -translate-y-2">
                <div className="bg-white border border-gray-200 text-gray-800 px-2 py-1 rounded shadow-lg text-xs flex items-center space-x-1">
                  <div className="bg-orange-500 text-white rounded w-3 h-3 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium" style={{ fontFamily: SYSTEM_FONT }}>!</span>
                  </div>
                  <span style={{ fontFamily: SYSTEM_FONT }} className="font-normal">Please fill out this field.</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex items-start mt-3">
          <div className="bg-[#775684] w-5 h-5 rounded flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed font-normal" style={{ fontFamily: SYSTEM_FONT }}>
            {subOption.form.helpText}
          </p>
        </div>
      </div>
    </div>
  );
};

// Prepay Details Content Component
const PrepayDetailsContent = ({ option }) => {
  return (
    <div style={{ fontFamily: SYSTEM_FONT }}>
      <h3 className="text-base font-semibold text-[#323053] mb-3" style={{ fontFamily: SYSTEM_FONT }}>
        {option.detailsSection.title}
      </h3>
      
      {option.detailsSection.subtitle && (
        <p className="text-gray-600 text-xs mb-4" style={{ fontFamily: SYSTEM_FONT }}>
          {option.detailsSection.subtitle}
        </p>
      )}
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h5 className="font-medium text-black text-xs mb-3 flex items-center" style={{ fontFamily: SYSTEM_FONT }}>
          <div className="bg-[#775684] w-6 h-6 rounded-lg flex items-center justify-center mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          Next Steps
        </h5>
        <ol className="space-y-2 list-decimal list-inside text-gray-700 text-xs font-normal" style={{ fontFamily: SYSTEM_FONT }}>
          {option.detailsSection.steps.map((step, index) => (
            <li key={index} className="pl-2">{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

// Later Details Content Component
const LaterDetailsContent = ({ option }) => {
  return (
    <div style={{ fontFamily: SYSTEM_FONT }}>
      <h3 className="text-base font-semibold text-[#323053] mb-4" style={{ fontFamily: SYSTEM_FONT }}>
        {option.detailsSection.title}
      </h3>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-xs font-medium text-[#323053] mb-3 flex items-center" style={{ fontFamily: SYSTEM_FONT }}>
          <div className="bg-[#775684] w-6 h-6 rounded-lg flex items-center justify-center mr-2">
            <img src={whiteRoadIcon} alt="Road plan" className="h-4 w-4" />
          </div>
          The road plan
        </h4>
        {option.detailsSection.description && (
          <p className="text-gray-600 text-xs font-normal" style={{ fontFamily: SYSTEM_FONT }}>
            {option.detailsSection.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default FundingCard;