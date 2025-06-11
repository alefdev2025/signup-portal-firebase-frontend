import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import logo assets
import whiteALogoNoText from "../assets/images/alcor-white-logo-no-text.png";
import astronautInGlass from "../assets/images/astronaut-in-glass.png";

export default function WelcomeMember() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Header */}
      <div className="bg-gradient-to-br from-[#0a1629] to-[#1e2650] relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1629]/90 via-transparent to-[#1e2650]/70"></div>
        
        <div className="relative z-10 py-4 px-8">
          <div className="w-full flex justify-center">
            <img src={whiteALogoNoText} alt="Alcor Logo" className="h-12" />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center">
          {/* Astronaut Image */}
          <div className="mb-8">
            <img 
              src={astronautInGlass} 
              alt="Astronaut in Glass" 
              className="w-40 h-40 mx-auto object-contain"
            />
          </div>
          
          {/* Welcome Text */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Alcor!
          </h1>
          
          <p className="text-base text-gray-600 mb-2">
            (Placeholder)
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            Thank you for completing your signup. We'll be in touch soon.
          </p>
          
          {/* Buttons */}
          <div className="space-y-3">
            {/* Portal Button - Primary */}
            <button 
              onClick={() => navigate('/portal-home')}
              className="bg-[#775684] text-white px-6 py-3 rounded-full font-medium text-sm hover:bg-[#664573] transition-all duration-200 w-full sm:w-auto"
            >
              Go to Member Portal
            </button>
            
            {/* Return Home Button - Secondary */}
            <div>
              <button 
                onClick={() => navigate('/')}
                className="bg-[#0a1629] text-white px-6 py-3 rounded-full font-medium text-sm hover:bg-[#1e2650] transition-all duration-200 w-full sm:w-auto"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}