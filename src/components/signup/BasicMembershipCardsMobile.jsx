// File: pages/components/BasicMembershipCardsMobile.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import { formatCurrency } from "../utils/formatCurrency";

const BasicMembershipCardsMobile = ({ packageInfo, animationComplete, content }) => {
  const displayCost = packageInfo && packageInfo.annualCost 
    ? formatCurrency(packageInfo.annualCost) 
    : content.annualCost;

  return (
    <div className="mb-12 md:hidden">
      <div className="space-y-6">
        {/* What Happens Next Card - Mobile */}
        <div className={`rounded-2xl overflow-hidden shadow-md transition-all duration-700 ease-in-out delay-150 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Light Top Section */}
          <div className="bg-white p-6 pb-6">
            <div className="flex items-center mb-5">
              <div className="p-2.5 rounded-lg shadow-md mr-3 transform transition duration-300" style={{ 
                background: 'linear-gradient(135deg, #323053 0%, #454575 50%, #575790 100%)',
                minWidth: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={content.cards.whatHappensNext.icon} />
                </svg>
              </div>
              <h4 className="text-xl font-medium text-gray-900 flex items-center">
                {content.cards.whatHappensNext.title}
              </h4>
            </div>
            
            <p className="text-gray-600 text-base leading-relaxed">
              {content.cards.whatHappensNext.description}
            </p>
          </div>
          
          {/* Dark Gradient Bottom Section */}
          <div className={`${content.cards.whatHappensNext.bgGradient} text-white p-6 pt-6`}>
            <h5 className="text-lg font-semibold mb-5 text-white">Future Funding Options:</h5>
            <div className="flex flex-col space-y-5">
              {content.cards.whatHappensNext.futureOptions.map((option, index) => (
                <div key={index} className="flex items-start">
                  <div className="bg-[#454575] p-2 rounded-lg mr-3 flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.icon} />
                    </svg>
                  </div>
                  <span className="text-base text-gray-200">{option.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Funding Notice Card - Mobile */}
        <div className={`rounded-2xl overflow-hidden shadow-md transition-all duration-700 ease-in-out delay-300 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Light Top Section */}
          <div className="bg-white p-6 pb-6">
            <div className="flex items-center mb-5">
              <div className="p-2.5 rounded-lg shadow-md mr-3 transform transition duration-300" style={{ 
                background: 'linear-gradient(135deg, #11243a 0%, #1c324c 50%, #293253 100%)',
                minWidth: '48px', 
                height: '48px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={content.cards.fundingNotice.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 flex items-center">
                {content.cards.fundingNotice.title}
              </h3>
            </div>
            
            <p className="text-gray-600 text-base leading-relaxed">
              {content.cards.fundingNotice.description}
            </p>
          </div>
          
          {/* Dark Gradient Bottom Section */}
          <div className={`${content.cards.fundingNotice.bgGradient} text-white p-6 pt-6`}>
            <h5 className="text-lg font-semibold text-white mb-5">What's Included:</h5>
            <div className="space-y-4">
              {content.cards.fundingNotice.includedFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <img src={alcorStar} alt="Star" className="w-5 h-5 mr-2 mt-0.5 filter brightness-0 invert flex-shrink-0" />
                  <span className="text-gray-200 text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicMembershipCardsMobile;