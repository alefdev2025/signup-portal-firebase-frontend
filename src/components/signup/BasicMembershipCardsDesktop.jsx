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
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ height: '600px' }}>
          
          {/* What Happens Next Card */}
          <div className={`rounded-[2rem] overflow-hidden shadow-lg transition-all duration-700 ease-in-out delay-150 transform flex flex-col ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* White Section - 45% height */}
            <div className="bg-white px-8 pt-6 pb-4" style={{ fontFamily: SYSTEM_FONT, flex: '0.9' }}>
              <div className="flex items-center mb-5">
                <div className="p-3 rounded-lg shadow-md mr-4 flex-shrink-0" style={{ 
                  background: 'linear-gradient(135deg, #323053 0%, #454575 50%, #575790 100%)',
                  width: '56px', 
                  height: '56px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={content.cards.whatHappensNext.icon} />
                  </svg>
                </div>
                <h4 className="text-xl font-normal text-gray-900">
                  {content.cards.whatHappensNext.title}
                </h4>
              </div>
              
              <p className="text-gray-600 text-base leading-relaxed font-light">
                {content.cards.whatHappensNext.description}
              </p>
            </div>
            
            {/* Dark Section - 55% height */}
            <div className={`${content.cards.whatHappensNext.bgGradient} text-white p-8`} style={{ fontFamily: SYSTEM_FONT, flex: '1.1' }}>
              <h5 className="text-base font-normal text-white mb-6">Future Funding Options:</h5>
              <div className="space-y-5">
                {content.cards.whatHappensNext.futureOptions.map((option, index) => (
                  <div key={index} className="flex items-start">
                    <div className="p-2 rounded-lg mr-3 flex-shrink-0 bg-[#454575] mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={option.icon} />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-200 font-light leading-relaxed">{option.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Funding Notice Card */}
          <div className={`rounded-[2rem] overflow-hidden shadow-lg transition-all duration-700 ease-in-out delay-300 transform flex flex-col ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* White Section - 45% height */}
            <div className="bg-white px-8 pt-6 pb-4" style={{ fontFamily: SYSTEM_FONT, flex: '0.9' }}>
              <div className="flex items-center mb-5">
                <div className="p-3 rounded-lg shadow-md mr-4 flex-shrink-0" style={{ 
                  background: 'linear-gradient(135deg, #11243a 0%, #1c324c 50%, #293253 100%)',
                  width: '56px', 
                  height: '56px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={content.cards.fundingNotice.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-normal text-gray-900">
                  {content.cards.fundingNotice.title}
                </h3>
              </div>
              
              <p className="text-gray-600 text-base leading-relaxed font-light">
                {content.cards.fundingNotice.description}
              </p>
            </div>
            
            {/* Dark Section - 55% height */}
            <div className={`${content.cards.fundingNotice.bgGradient} text-white p-8`} style={{ fontFamily: SYSTEM_FONT, flex: '1.1' }}>
              <h5 className="text-base font-normal text-white mb-6">What's Included:</h5>
              <div className="space-y-5">
                {content.cards.fundingNotice.includedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <img src={alcorStar} alt="Star" className="w-4 h-4 mr-3 mt-0.5 filter brightness-0 invert flex-shrink-0" />
                    <span className="text-gray-200 text-sm font-light leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BasicMembershipCardsDesktop;