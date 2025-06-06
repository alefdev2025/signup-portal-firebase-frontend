// File: pages/components/BasicMembershipCardsDesktop.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import { formatCurrency } from "../utils/formatCurrency";

const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const BasicMembershipCardsDesktop = ({ packageInfo, animationComplete, content }) => {
  const displayCost = packageInfo && packageInfo.annualCost 
    ? formatCurrency(packageInfo.annualCost) 
    : content.annualCost;

  return (
    <div className="mb-12 hidden md:block">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* What Happens Next Card - Desktop (Light top, dark bottom) */}
        <div className={`rounded-[2rem] overflow-hidden shadow-lg transition-all duration-700 ease-in-out delay-150 transform h-full flex flex-col ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Light Top Section - Fixed Height */}
          <div className="bg-white p-10 pb-8 flex-shrink-0" style={{ fontFamily: SYSTEM_FONT }}>
            <div className="flex items-center mb-8">
              <div className="p-3 rounded-lg shadow-md mr-3.5 transform transition duration-300" style={{ 
                background: 'linear-gradient(135deg, #323053 0%, #454575 50%, #575790 100%)',
                minWidth: '56px', 
                height: '56px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={content.cards.whatHappensNext.icon} />
                </svg>
              </div>
              <h4 className="text-xl font-normal text-gray-900 flex items-center">
                {content.cards.whatHappensNext.title}
              </h4>
            </div>
            
            <p className="text-gray-600 text-base leading-relaxed font-light">
              {content.cards.whatHappensNext.description}
            </p>
          </div>
          
          {/* Dark Gradient Bottom Section - Flexible Height */}
          <div className={`${content.cards.whatHappensNext.bgGradient} text-white p-10 pt-8 flex-grow flex flex-col`} style={{ fontFamily: SYSTEM_FONT, minHeight: '280px' }}>
            <h5 className="text-lg font-normal text-white mb-6">Future Funding Options:</h5>
            <div className="flex flex-col space-y-6">
              {content.cards.whatHappensNext.futureOptions.map((option, index) => (
                <div key={index} className="flex items-center transform transition duration-300 hover:translate-x-1">
                  <div className="p-2 rounded-lg mr-3 flex-shrink-0 bg-[#454575]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={option.icon} />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-200 font-light">{option.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Funding Notice Card - Desktop (Light top, dark bottom) */}
        <div className={`rounded-[2rem] overflow-hidden shadow-lg transition-all duration-700 ease-in-out delay-300 transform h-full flex flex-col ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Light Top Section - Fixed Height */}
          <div className="bg-white p-10 pb-8 flex-shrink-0" style={{ fontFamily: SYSTEM_FONT }}>
            <div className="flex items-center mb-8">
              <div className="p-3 rounded-lg shadow-md mr-3.5 transform transition duration-300" style={{ 
                background: 'linear-gradient(135deg, #11243a 0%, #1c324c 50%, #293253 100%)',
                minWidth: '56px', 
                height: '56px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={content.cards.fundingNotice.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-normal text-gray-900 flex items-center">
                {content.cards.fundingNotice.title}
              </h3>
            </div>
            
            <p className="text-gray-600 text-base leading-relaxed font-light">
              {content.cards.fundingNotice.description}
            </p>
          </div>
          
          {/* Dark Gradient Bottom Section - Flexible Height */}
          <div className={`${content.cards.fundingNotice.bgGradient} text-white p-10 pt-8 flex-grow flex flex-col`} style={{ fontFamily: SYSTEM_FONT, minHeight: '280px' }}>
            <h5 className="text-lg font-normal text-white mb-6">What's Included:</h5>
            <div className="space-y-5">
              {content.cards.fundingNotice.includedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center transform transition duration-300 hover:translate-x-1">
                  <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 filter brightness-0 invert flex-shrink-0" />
                  <span className="text-gray-200 text-sm font-light">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicMembershipCardsDesktop;