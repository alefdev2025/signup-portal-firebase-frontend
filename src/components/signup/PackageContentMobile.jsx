// File: components/PackageContentMobile.jsx
import React from "react";
import alcorStar from "../../assets/images/alcor-star.png";
import alcorYellowStar from "../../assets/images/alcor-yellow-star.png";

// Font family to match ContactInfoPage
const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Mobile View Component - Used for both original and updated versions on mobile devices
export const PackageContentMobile = ({ 
 option, 
 selectedOption, 
 selectOption, 
 fadeInStyle, 
 getAnimationDelay, 
 calculatePreservationEstimate, 
 getPackagePrice,
 planOption,
 USE_UPDATED_VERSION 
}) => {
 return (
   <div 
     onClick={() => selectOption(option)} 
     className={`cursor-pointer ${USE_UPDATED_VERSION ? 'transform transition duration-300 hover:scale-[1.02]' : ''}`} 
     style={{...fadeInStyle, ...getAnimationDelay(option === "neuro" ? 0 : option === "wholebody" ? 1 : 2)}}
   >
     <div className={`${USE_UPDATED_VERSION ? 'rounded-2xl md:rounded-t-[2rem] md:rounded-b-3xl' : 'rounded-lg md:rounded-[2rem]'} overflow-hidden shadow-md ${selectedOption === option ? (USE_UPDATED_VERSION ? "ring-2 ring-[#775684]" : "ring-2 ring-[#775684]") : (USE_UPDATED_VERSION ? "ring-1 ring-gray-400" : "")} transition-all duration-300 ${USE_UPDATED_VERSION ? '' : 'hover:shadow-lg transform hover:scale-[1.01] flex flex-col'}`}>
       
       {/* ===== SELECTED INDICATOR ===== */}
       <div className="md:hidden bg-white border-b border-gray-200" style={{ height: USE_UPDATED_VERSION ? "auto" : "60px" }}>
         {selectedOption === option && (
           <div className="text-center py-3.5">
             <span className={`${USE_UPDATED_VERSION ? 'text-white px-5 py-1.5 text-base font-black tracking-wider uppercase bg-[#775684] rounded-md animate-fadeInDown' : 'text-[#775684] px-6 py-1.5 text-base font-bold tracking-wide animate-fadeInDown'}`}>
               {USE_UPDATED_VERSION ? 'Selected' : 'SELECTED'}
             </span>
           </div>
         )}
         {selectedOption !== option && <div className={USE_UPDATED_VERSION ? "h-14" : "h-[60px]"}></div>}
       </div>
       
       {/* ===== MOBILE COLORED HEADER SECTION ===== */}
       <div className={`md:hidden ${planOption.titleBgColor} ${USE_UPDATED_VERSION ? 'p-4 pt-2 pl-2 sm:p-5 sm:pt-3 sm:pl-3' : 'text-white p-5 pl-4'}`} style={{ fontFamily: SYSTEM_FONT }}>
         <div className="flex items-center justify-between">
           <div className="flex items-center justify-start w-full">
             <img src={alcorYellowStar} alt="Alcor Star" className={`${USE_UPDATED_VERSION ? 'w-12 h-12 mr-1 -mt-1 ml-0' : 'w-8 h-8 mr-2'} animate-pulse`} style={{animationDuration: '3s'}} />
             <h3 className={`${USE_UPDATED_VERSION ? 'text-xl font-semibold text-white' : 'text-xl font-bold'}`}>{planOption.title}</h3>
           </div>
           {/* Mobile icon container */}
           <div className={`${USE_UPDATED_VERSION ? `${planOption.iconBgColor} p-3 rounded-md ml-3 flex-shrink-0 transform transition duration-300 md:p-8 md:rounded-xl` : `ml-auto ${planOption.iconBgColor} p-3 rounded-full transform transition duration-300`}`}>
             {option === "neuro" && (
               <svg className={`${USE_UPDATED_VERSION ? 'w-8 h-8 md:w-24 md:h-24' : 'w-7 h-7'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
               </svg>
             )}
             {option === "wholebody" && (
               <svg className={`${USE_UPDATED_VERSION ? 'w-8 h-8 md:w-24 md:h-24' : 'w-7 h-7'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
             )}
             {option === "basic" && (
               <svg className={`${USE_UPDATED_VERSION ? 'w-8 h-8 md:w-24 md:h-24' : 'w-7 h-7'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
               </svg>
             )}
           </div>
         </div>
         
         <p className={`text-gray-300 ${USE_UPDATED_VERSION ? 'mt-6' : 'mt-6 text-base mb-8'}`}>
           {planOption.short}
         </p>
         
         {USE_UPDATED_VERSION ? (
           // Updated version pricing (in colored section)
           <>
             <div className="flex justify-between items-center pt-4">
               <span className="text-gray-300 text-lg">Preservation:</span>
               <span className="font-bold text-white text-xl">
                 {option === "basic" ? "Not required" : `${calculatePreservationEstimate(option)?.toLocaleString()}`}
               </span>
             </div>
             
             <div className="flex justify-between items-center mt-2">
               <span className="text-gray-300 text-lg">Membership:</span>
               <span className="font-bold text-white text-xl">
                 {getPackagePrice("standard") ? `$${parseFloat(getPackagePrice("standard")).toLocaleString()}/year` : "—"}
               </span>
             </div>
           </>
         ) : (
           // Original version pricing (in colored section)
           <>
             <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-700">
               <span className="text-gray-400 text-base">Preservation:</span>
               <span className="font-bold text-lg">
                 {option === "basic" ? "Not required" : `${calculatePreservationEstimate(option)?.toLocaleString()}`}
               </span>
             </div>
             
             <div className="flex justify-between items-center mt-3 mb-3">
               <span className="text-gray-400 text-base">Membership:</span>
               <span className="font-bold text-lg">
                 {getPackagePrice("standard") ? `$${parseFloat(getPackagePrice("standard")).toLocaleString()}/year` : "—"}
               </span>
             </div>
           </>
         )}
       </div>
       
       {/* ===== MOBILE WHITE PRICING SECTION (Updated Version Only) ===== */}
       {USE_UPDATED_VERSION && (
         <div className="bg-white p-4 sm:p-6 border-t border-gray-200 md:hidden">
           <div className="flex justify-between items-center pt-4">
             <span className="text-gray-700 text-lg">Preservation:</span>
             <span className="font-bold text-gray-900 text-xl">
               {option === "basic" ? "Not required" : `${calculatePreservationEstimate(option)?.toLocaleString()}`}
             </span>
           </div>
           
           <div className="flex justify-between items-center mt-2">
             <span className="text-gray-700 text-lg">Membership:</span>
             <span className="font-bold text-gray-900 text-xl">
               {getPackagePrice("standard") ? `$${parseFloat(getPackagePrice("standard")).toLocaleString()}/year` : "—"}
             </span>
           </div>
         </div>
       )}
       
       {/* ===== MOBILE: WHAT'S INCLUDED (WHITE BACKGROUND) ===== */}
       <div className={`md:hidden bg-white ${USE_UPDATED_VERSION ? 'p-4 sm:p-5 border-t border-gray-200' : 'p-4'}`} style={{ fontFamily: SYSTEM_FONT }}>
         <h4 className={`text-gray-800 ${USE_UPDATED_VERSION ? 'text-lg font-semibold mb-4' : 'mb-5 text-lg font-semibold'}`}>What's Included:</h4>
         
         <div className={`${USE_UPDATED_VERSION ? 'space-y-3 pl-4 text-gray-700 text-base' : 'space-y-4 pl-4 text-base text-gray-700'}`}>
           {option === "neuro" && (
             <>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Standby Service</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Neuro Cryopreservation</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Long-Term Storage</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Possible Revival</span>
               </div>
             </>
           )}
           {option === "wholebody" && (
             <>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Standby Service</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Full Body Cryopreservation</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Long-Term Storage</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Possible Revival</span>
               </div>
             </>
           )}
           {option === "basic" && (
             <>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Member Events & Resources</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Pet Preservation Options</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Add Cryopreservation Anytime</span>
               </div>
               <div className={`flex ${USE_UPDATED_VERSION ? 'items-center' : 'items-start'} transform transition duration-300 hover:translate-x-1`}>
                 <img src={alcorYellowStar} alt="Star" className={`${USE_UPDATED_VERSION ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2 mt-1.5'}`} />
                 <span>Consultation Services</span>
               </div>
             </>
           )}
           
           <p className={`text-gray-600 ${USE_UPDATED_VERSION ? 'mt-6 pt-3 border-t border-gray-200 text-base' : 'text-base pt-3 mt-2 border-t border-gray-200'}`}>
             {planOption.long}
           </p>
         </div>
       </div>
     </div>
   </div>
 );
};