import React from 'react';

const ErrorState = ({ error, onRefresh }) => {
  return (
    <div className="-mx-6 -mt-6 md:mx-0 md:-mt-4 md:w-[95%] md:pl-4 min-h-screen" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <div className="h-8"></div>
      <div className="px-4 md:px-0">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
          <p className="font-bold">Error loading invoices</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={onRefresh}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;