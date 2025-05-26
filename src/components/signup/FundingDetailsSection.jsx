// File: pages/FundingDetailsSection.jsx
import React from "react";
import whiteRoadIcon from "../../assets/images/white-road.png";

const FundingDetailsSection = ({
  selectedOption,
  fundingOptions,
  insuranceSubOption,
  policyDetails,
  dropdownOpen,
  policyResourcesExpanded,
  animationComplete,
  validationErrors,
  onSelectInsuranceSubOption,
  onToggleDropdown,
  onTogglePolicyResources,
  onPolicyDetailChange,
  marcellusStyle
}) => {
  const option = fundingOptions[selectedOption];
  
  if (!option || !option.detailsSection) return null;

  return (
    <div className={`mt-8 bg-white p-8 rounded-lg transition-all duration-700 ease-in-out delay-600 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="border-b border-gray-200 pb-6 mb-4">
        <h3 className="text-2xl font-bold text-[#323053]">
          {option.detailsSection.title}
        </h3>
      </div>
      
      {option.detailsSection.subtitle && (
        <p className="text-gray-700 text-xl mb-0">
          {option.detailsSection.subtitle}
        </p>
      )}
      
      <div className="py-2">
        {selectedOption === "insurance" && (
          <InsuranceDetailsContent
            option={option}
            insuranceSubOption={insuranceSubOption}
            policyDetails={policyDetails}
            dropdownOpen={dropdownOpen}
            policyResourcesExpanded={policyResourcesExpanded}
            validationErrors={validationErrors}
            onSelectInsuranceSubOption={onSelectInsuranceSubOption}
            onToggleDropdown={onToggleDropdown}
            onTogglePolicyResources={onTogglePolicyResources}
            onPolicyDetailChange={onPolicyDetailChange}
            marcellusStyle={marcellusStyle}
          />
        )}
        
        {selectedOption === "prepay" && (
          <PrepayDetailsContent option={option} />
        )}
        
        {selectedOption === "later" && (
          <LaterDetailsContent option={option} />
        )}
      </div>
    </div>
  );
};

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
  marcellusStyle
}) => {
  return (
    <div>
      <div className="mb-10 relative">
        <div 
          onClick={onToggleDropdown}
          className="p-6 rounded-xl cursor-pointer border-2 border-[#775684] flex justify-between items-center"
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#775684] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d={insuranceSubOption === "new" 
                  ? option.detailsSection.subOptions.new.icon
                  : option.detailsSection.subOptions.existing.icon} 
              />
            </svg>
            <h4 className="text-xl font-semibold text-gray-800">
              {insuranceSubOption === "new" 
                ? option.detailsSection.subOptions.new.title
                : option.detailsSection.subOptions.existing.title}
            </h4>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 text-[#775684] transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {dropdownOpen && (
          <div className="absolute left-0 right-0 mt-2 z-10">
            <div 
              onClick={() => onSelectInsuranceSubOption("new")}
              className={`p-6 rounded-t-xl cursor-pointer transition-all duration-200 bg-white shadow-lg border-t-2 border-l-2 border-r-2 border-[#775684] ${
                insuranceSubOption === "new" ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#775684] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.detailsSection.subOptions.new.icon} />
                </svg>
                <h4 className="text-xl font-semibold text-gray-800">{option.detailsSection.subOptions.new.title}</h4>
              </div>
            </div>
            
            <div 
              onClick={() => onSelectInsuranceSubOption("existing")}
              className={`p-6 rounded-b-xl cursor-pointer transition-all duration-200 bg-white shadow-lg border-b-2 border-l-2 border-r-2 border-[#775684] ${
                insuranceSubOption === "existing" ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#775684] mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.detailsSection.subOptions.existing.icon} />
                </svg>
                <h4 className="text-xl font-semibold text-gray-800">{option.detailsSection.subOptions.existing.title}</h4>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="pl-4">
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

const NewPolicyContent = ({ subOption, policyResourcesExpanded, onTogglePolicyResources }) => {
  return (
    <div className="mt-8">
      <h4 className="text-2xl font-bold text-[#323053] mb-8 flex items-center">
        <div className="bg-[#775684] w-16 h-16 rounded-lg flex items-center justify-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        Insurance Options
      </h4>
      <p className="text-gray-800 text-xl mb-8">
        {subOption.description}
      </p>
      <div className="space-y-10">
        <div>
          <h5 className="font-bold text-black text-2xl mb-6 flex items-center">
            <div className="bg-[#775684] w-16 h-16 rounded-lg flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>{subOption.resources.title}</span>
            <div className="bg-[#d8b453] text-black font-bold py-1 px-3 ml-3 text-sm rounded-full border border-[#775684]">
              {subOption.resources.badge}
            </div>
            <button 
              onClick={onTogglePolicyResources}
              className="focus:outline-none ml-3"
              aria-expanded={policyResourcesExpanded}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-6 w-6 text-[#775684] transition-transform ${policyResourcesExpanded ? 'transform rotate-180' : ''}`}
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
              policyResourcesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <ul className="space-y-4 text-gray-800 text-lg pl-20 mb-4">
              {subOption.resources.items.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExistingPolicyContent = ({ subOption, policyDetails, validationErrors, onPolicyDetailChange, marcellusStyle }) => {
  return (
    <div className="mt-8">
      <h4 className="text-2xl font-bold text-[#775684] mb-8 flex items-center">
        <div className="bg-[#775684] w-16 h-16 rounded-lg flex items-center justify-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        Policy Information
      </h4>
      <p className="text-gray-800 text-xl mb-8">
        {subOption.description}
      </p>
      <div className="space-y-8 mt-8">
        {subOption.form.fields.map((field) => (
          <div key={field.id} className="relative">
            <label htmlFor={field.id} className="block text-gray-800 font-bold text-xl mb-4">
              {field.label}
            </label>
            {field.type === "currency" ? (
              <div className="relative">
                <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-500 text-2xl">$</span>
                <input
                  type="text"
                  id={field.id}
                  name={field.id}
                  value={policyDetails[field.id]}
                  onChange={onPolicyDetailChange}
                  className={`w-full pl-12 px-6 py-4 text-xl border-2 rounded-lg focus:ring-[#775684] focus:border-[#775684] ${
                    validationErrors && validationErrors[field.id] ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                  }`}
                  placeholder={field.placeholder}
                  style={marcellusStyle}
                />
              </div>
            ) : (
              <input
                type={field.type}
                id={field.id}
                name={field.id}
                value={policyDetails[field.id]}
                onChange={onPolicyDetailChange}
                className={`w-full px-6 py-4 text-xl border-2 rounded-lg focus:ring-[#775684] focus:border-[#775684] ${
                  validationErrors && validationErrors[field.id] ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                }`}
                placeholder={field.placeholder}
                style={marcellusStyle}
              />
            )}
            
            {/* Tooltip when validation error exists for this field */}
            {validationErrors && validationErrors[field.id] && (
              <div className="absolute top-0 right-0 z-20 transform translate-x-1 -translate-y-3">
                <div className="bg-white border border-gray-200 text-gray-800 px-3 py-2 rounded shadow-lg text-sm flex items-center space-x-2">
                  <div className="bg-orange-500 text-white rounded w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <span>Please fill out this field.</span>
                </div>
              </div>
            )}
          </div>
        ))}
        
        <div className="flex items-center mt-10">
          <div className="bg-[#775684] w-16 h-16 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-800 text-xl">
            {subOption.form.helpText}
          </p>
        </div>
      </div>
    </div>
  );
};

const PrepayDetailsContent = ({ option }) => {
  return (
    <div className="mt-8">
      <div className="space-y-10 mt-1">
        <div>
          <h5 className="font-bold text-black text-2xl mb-6 flex items-center">
            <div className="bg-[#775684] w-16 h-16 rounded-lg flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            Next Steps
          </h5>
          <ol className="space-y-4 ml-20 list-decimal text-gray-800 text-xl">
            {option.detailsSection.steps.map((step, index) => (
              <li key={index} className="pl-3">{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

const LaterDetailsContent = ({ option }) => {
  return (
    <div className="mt-2">
      <h4 className="text-2xl font-bold text-[#323053] mb-2 flex items-center">
        <div className="bg-[#775684] w-16 h-16 rounded-lg flex items-center justify-center mr-4">
          <img src={whiteRoadIcon} alt="Road plan" className="h-8 w-8" />
        </div>
        The road plan
      </h4>
      {option.detailsSection.description && (
        <p className="text-gray-800 text-xl ml-20">
          {option.detailsSection.description}
        </p>
      )}
    </div>
  );
};

export default FundingDetailsSection;