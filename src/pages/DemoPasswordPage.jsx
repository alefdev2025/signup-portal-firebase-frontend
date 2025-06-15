// components/DemoPasswordPage.jsx - Updated with service integration
import React, { useState } from 'react';
import darkLogo from "../assets/images/alcor-white-logo.png";
import yellowStar from "../assets/images/alcor-yellow-star.png";
import { validateDemoPassword } from '../services/demo';

const DemoPasswordPage = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check what's actually scaling
    console.log('devicePixelRatio:', window.devicePixelRatio);
    console.log('viewport width:', window.innerWidth);
    console.log('document width:', document.documentElement.clientWidth);
    console.log('html computed font-size:', getComputedStyle(document.documentElement).fontSize);
    console.log('html zoom:', getComputedStyle(document.documentElement).zoom);
    console.log('body transform:', getComputedStyle(document.body).transform);

    try {
      console.log('Attempting demo authentication...');
      
      // Use the demo service to validate password
      const result = await validateDemoPassword(password);
      
      if (result.success && result.authenticated) {
        console.log('✅ Demo authentication successful');
        onAuthenticated();
      } else {
        setError('Authentication failed');
        setPassword('');
      }
    } catch (err) {
      console.error('Demo authentication error:', err);
      
      // Handle specific error messages
      if (err.message.includes('Invalid demo password')) {
        setError('Incorrect password. Please try again.');
      } else if (err.message.includes('timed out')) {
        setError('Request timed out. Please check your connection.');
      } else if (err.message.includes('Server error')) {
        setError('Server temporarily unavailable. Please try again.');
      } else {
        setError('Connection error. Please try again.');
      }
      
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C2340] via-[#13273f] to-[#1d3351] flex flex-col">
      {/* Header - minimal branding */}
      <div className="flex justify-between items-center px-6 py-4 md:px-12 md:py-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 md:w-6 md:h-6 bg-[#FFCB05] rounded-full"></div>
          </div>
          <div className="text-white">
            <h1 className="text-lg md:text-xl font-bold">Demo Portal</h1>
            <p className="text-xs md:text-sm opacity-80">Private Access</p>
          </div>
        </div>
        
        {/* Abstract decoration */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#FFCB05]/70 rounded-full"></div>
          <div className="w-3 h-3 bg-[#FFCB05]/90 rounded-full"></div>
          <div className="w-2 h-2 bg-[#FFCB05]/70 rounded-full"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#FFCB05] to-[#d59560] rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0C2340] mb-2">Client Demo</h1>
            <p className="text-gray-600 text-sm md:text-base">This is a private demonstration of the membership portal system</p>
          </div>
          
          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Demo Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#FFCB05] focus:ring-2 focus:ring-[#FFCB05]/20 transition-all duration-200"
                placeholder="Enter demo password"
                disabled={loading}
                autoFocus
                required
              />
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-gradient-to-r from-[#0C2340] to-[#13273f] text-white py-3 px-6 rounded-xl font-semibold text-base hover:from-[#13273f] hover:to-[#1d3351] focus:outline-none focus:ring-4 focus:ring-[#0C2340]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Access Demo</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Authorized Personnel Only</p>
              <div className="flex justify-center items-center space-x-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full opacity-60"></div>
                <span className="text-xs text-gray-400">Private Demonstration</span>
                <div className="w-1 h-1 bg-gray-400 rounded-full opacity-60"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FFCB05]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#d59560]/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default DemoPasswordPage;