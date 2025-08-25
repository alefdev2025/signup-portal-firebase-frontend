// File: components/signup/IconBox.jsx
import React from 'react';

const IconBox = ({ children, className = "" }) => (
  <div className={`bg-[#775684] p-2 md:p-2 rounded-lg ${className}`}>
    {React.cloneElement(children, {
      className: "h-9 w-9 md:h-9 md:w-9 text-white",
      strokeWidth: 1.2
    })}
  </div>
);

export default IconBox;