// File: pages/components/BasicMembershipCards.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-yellow-star.png";
import { formatCurrency } from "./FundingCardsData";

const BasicMembershipCards = ({ packageInfo, animationComplete, content }) => {
  const displayCost = packageInfo && packageInfo.annualCost 
    ? formatCurrency(packageInfo.annualCost) 
    : content.annualCost;

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-[#323053] mb-6 flex items-center">
        Basic Membership: <span className="text-[#775684] ml-3">{displayCost}/year</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What Happens Next Card */}
        <div className={`rounded-lg overflow-hidden shadow-md h-full transition-all duration-700 ease-in-out delay-150 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className={`${content.cards.whatHappensNext.bgGradient} text-white p-10 h-full`}>
            <div className="flex items-center mb-8">
              <div className={`${content.cards.whatHappensNext.iconBg} p-3 rounded-lg shadow-md mr-4`} style={{ minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={content.cards.whatHappensNext.icon} />
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-white flex items-center">
                {content.cards.whatHappensNext.title}
                <img src={alcorStar} alt="Star" className="ml-2 w-10 h-10 filter brightness-0 invert" />
              </h4>
            </div>
            
            <div className="mt-8 pl-14">
              <p className="text-gray-200 text-xl leading-relaxed mb-8">
                {content.cards.whatHappensNext.description}
              </p>
              
              <div className="mt-8 text-gray-200">
                <h5 className="text-xl font-semibold mb-4">Future Funding Options:</h5>
                <div className="flex flex-col space-y-6">
                  {content.cards.whatHappensNext.futureOptions.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <div className="bg-[#454575] p-3 rounded-lg mr-4 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.icon} />
                        </svg>
                      </div>
                      <span className="text-lg">{option.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Funding Notice Card */}
        <div className={`rounded-lg overflow-hidden shadow-md h-full transition-all duration-700 ease-in-out delay-300 transform ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className={`${content.cards.fundingNotice.bgGradient} text-white p-10 h-full`}>
            <div className="flex items-center mb-8">
              <div className={`${content.cards.fundingNotice.iconBg} p-3 rounded-lg shadow-md mr-4`} style={{ minWidth: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={content.cards.fundingNotice.icon} />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white flex items-center">
                {content.cards.fundingNotice.title}
                <img src={alcorStar} alt="Star" className="ml-2 w-10 h-10 filter brightness-0 invert" />
              </h3>
            </div>
            
            <div className="mt-8 pl-14">
              <p className="text-gray-200 text-xl leading-relaxed mb-8">
                {content.cards.fundingNotice.description}
              </p>
              
              <div className="mt-8">
                <h5 className="text-xl font-semibold text-white mb-5">What's Included:</h5>
                <div className="space-y-4 pl-2">
                  {content.cards.fundingNotice.includedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <img src={alcorStar} alt="Star" className="w-6 h-6 mr-3 filter brightness-0 invert" />
                      <span className="text-gray-200 text-lg">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicMembershipCards;