import React from 'react';

const LoadingState = () => {
  return (
    <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen flex items-center justify-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b5b7e] mx-auto mb-4"></div>
        <p className="text-[#6b7280]">Loading invoices...</p>
      </div>
    </div>
  );
};

export default LoadingState;