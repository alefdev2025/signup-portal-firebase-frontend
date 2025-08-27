// File: components/signup/IconBox.jsx
import React from 'react';

const IconBox = ({ children, className = "" }) => (
  <div className={`p-2.5 sm:p-3 2xl:p-3.5 rounded-lg transform transition duration-300 bg-gradient-to-br from-[#5a4e73] via-[#483d5e] to-[#362c49] border-2 border-[#A78BFA] shadow-lg hover:shadow-xl ${className}`}>
    {React.cloneElement(children, {
      className: "w-5 h-5 sm:w-6 sm:h-6 2xl:w-7 2xl:h-7 text-white relative z-10",
      strokeWidth: 1.5
    })}
  </div>
);

export default IconBox;