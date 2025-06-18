import React from 'react';
import dewarsImage from '../../../assets/images/dewars-high-res1.png';
import navyLogo from '../../../assets/images/navy-a-logo.png';
import alcorStar from '../../../assets/images/alcor-star.png';

const TopRightCard = () => {
  return (
    <div className="relative rounded-2xl h-80 w-80 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${dewarsImage})` }}
      />
      
      {/* Gradient Overlay - custom gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, 
            #12233b 0%, 
            #272b4d 10%, 
            #3b345b 20%, 
            #4b3865 30%, 
            #5d4480 40%, 
            #6c5578 50%, 
            #7b5670 60%, 
            #8a5f64 70%, 
            #996b66 80%, 
            #ae7968 85%, 
            #c2876a 88%, 
            #d4a85f 91%, 
            #ddb571 92.5%, 
            #e4c084 94%, 
            #e9ca96 95.5%, 
            #efd3a8 97%, 
            #f7ddb5 98.5%, 
            #ffd4a3 100%)`,
          opacity: 0.8
        }}
      />
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)`
        }}
      />
      
      {/* Content */}
      <div className="relative p-6 h-full text-white">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-2xl font-bold text-white">Your Plan</h3>
          <img src={alcorStar} alt="Star" className="w-7 h-7 inline-block" />
        </div>
        <p className="text-sm opacity-90">Whole Body Cryopreservation</p>
        <p className="text-lg font-light opacity-70 mt-1">-196°</p>
        <div className="absolute bottom-4 right-4">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-2">
            <img src={navyLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopRightCard;