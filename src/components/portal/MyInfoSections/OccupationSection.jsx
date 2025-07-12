import React, { useState, useEffect, useRef } from 'react';
import { Section, Input, Select, Checkbox, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig from '../styleConfig2';
import { HelpCircle } from 'lucide-react';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';

// Display component for showing info in read-only mode
const InfoDisplay = ({ label, value, className = "" }) => (
 <div className={className}>
   <dt className={styleConfig.display.item.label}>{label}</dt>
   <dd 
     className="text-gray-900" 
     style={{ 
       WebkitTextStroke: '0.6px #1f2937',
       fontWeight: 400,
       letterSpacing: '0.01em',
       fontSize: '15px'
     }}
   >
     {value || styleConfig.display.item.empty}
   </dd>
 </div>
);

const OccupationSection = ({ 
 occupation, 
 setOccupation, 
 editMode, 
 toggleEditMode, 
 cancelEdit, 
 saveOccupation, 
 savingSection,
 memberCategory,
 sectionImage,  // Add this prop
 sectionLabel   // Add this prop
}) => {
 const [showTooltip, setShowTooltip] = useState(false);
 const [occupationError, setOccupationError] = useState('');
 const [militaryErrors, setMilitaryErrors] = useState({});
 const [attemptedSave, setAttemptedSave] = useState(false);
 
 // Add state for mobile detection
 const [isMobile, setIsMobile] = useState(false);
 const [hasLoaded, setHasLoaded] = useState(false);
 const [isVisible, setIsVisible] = useState(false);
 const sectionRef = useRef(null);
 
 // Detect mobile
 useEffect(() => {
   const checkMobile = () => setIsMobile(window.innerWidth < 640);
   checkMobile();
   window.addEventListener('resize', checkMobile);
   return () => window.removeEventListener('resize', checkMobile);
 }, []);

 // Add loading animation styles
 useEffect(() => {
   const style = document.createElement('style');
   style.innerHTML = `
     .occupation-section-fade-in {
       animation: occupationFadeIn 0.8s ease-out forwards;
     }
     .occupation-section-slide-in {
       animation: occupationSlideIn 0.8s ease-out forwards;
     }
     .occupation-section-stagger-in > * {
       opacity: 0;
       animation: occupationSlideIn 0.5s ease-out forwards;
     }
     .occupation-section-stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
     .occupation-section-stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
     .occupation-section-stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
     .occupation-section-stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
     .occupation-section-stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
     .occupation-section-stagger-in > *:nth-child(6) { animation-delay: 0.3s; }
     .occupation-section-stagger-in > *:nth-child(7) { animation-delay: 0.35s; }
     .occupation-section-stagger-in > *:nth-child(8) { animation-delay: 0.4s; }
     @keyframes occupationFadeIn {
       from { opacity: 0; }
       to { opacity: 1; }
     }
     @keyframes occupationSlideIn {
       from {
         opacity: 0;
         transform: translateY(20px);
       }
       to {
         opacity: 1;
         transform: translateY(0);
       }
     }
   `;
   document.head.appendChild(style);
   
   return () => {
     document.head.removeChild(style);
   };
 }, []);

 // Intersection Observer for scroll-triggered animation
 useEffect(() => {
   const observer = new IntersectionObserver(
     ([entry]) => {
       if (entry.isIntersecting && !isVisible) {
         setIsVisible(true);
         setTimeout(() => setHasLoaded(true), 100);
       }
     },
     {
       threshold: 0.1,
       rootMargin: '50px'
     }
   );

   if (sectionRef.current) {
     observer.observe(sectionRef.current);
   }

   return () => {
     if (sectionRef.current) {
       observer.unobserve(sectionRef.current);
     }
   };
 }, [isVisible]);
 
 // Clear attempted save when canceling
 useEffect(() => {
   if (!editMode.occupation) {
     setOccupationError('');
     setMilitaryErrors({});
     setAttemptedSave(false);
   }
 }, [editMode.occupation]);
 
 // Validate on mount if in edit mode and attempted save
 useEffect(() => {
   if (editMode.occupation && attemptedSave) {
     setOccupationError(validateOccupation(occupation.occupation));
     if (occupation.hasMilitaryService) {
       setMilitaryErrors(validateMilitaryFields());
     }
   }
 }, [editMode.occupation, attemptedSave, occupation.occupation, occupation.hasMilitaryService]);
 
 // Format military service years for display
 const formatServiceYears = (from, to) => {
   if (!from && !to) return styleConfig.display.item.empty;
   if (from && to) return `${from} - ${to}`;
   if (from && !to) return `${from} - Present`;
   return styleConfig.display.item.empty;
 };

 // Check if occupation is just "Retired" (case-insensitive)
 const isJustRetired = (occupationValue) => {
   return occupationValue && occupationValue.toLowerCase().trim() === 'retired';
 };

 // Validate occupation field
 const validateOccupation = (value) => {
   if (isJustRetired(value)) {
     return 'Please specify your occupation before retirement (e.g., "Retired Software Engineer")';
   }
   return '';
 };

 // Validate military fields
 const validateMilitaryFields = () => {
   const errors = {};
   
   if (occupation.hasMilitaryService) {
     if (!occupation.militaryBranch || occupation.militaryBranch === '') {
       errors.militaryBranch = 'Please select a military branch';
     }
     if (!occupation.servedFrom) {
       errors.servedFrom = 'Please enter service start year';
     } else if (occupation.servedFrom.length !== 4) {
       errors.servedFrom = 'Please enter a valid 4-digit year';
     }
     if (!occupation.servedTo) {
       errors.servedTo = 'Please enter service end year';
     } else if (occupation.servedTo.length !== 4) {
       errors.servedTo = 'Please enter a valid 4-digit year';
     }
   }
   
   return errors;
 };

 // Handle occupation change
 const handleOccupationChange = (value) => {
   setOccupation({...occupation, occupation: value});
   setOccupationError(validateOccupation(value));
 };
 
 // Modified save handler
 const handleSave = () => {
   setAttemptedSave(true);
   const occError = validateOccupation(occupation.occupation);
   const milErrors = occupation.hasMilitaryService ? validateMilitaryFields() : {};
   
   setOccupationError(occError);
   setMilitaryErrors(milErrors);
   
   if (!occError && Object.keys(milErrors).length === 0) {
     saveOccupation();
   }
 };
 
 // Mobile preview data
 const getMobilePreview = () => {
   const previewParts = [];
   
   if (occupation?.occupation) {
     previewParts.push(occupation.occupation);
   }
   if (occupation?.occupationalIndustry) {
     previewParts.push(occupation.occupationalIndustry);
   }
   if (occupation?.hasMilitaryService && occupation?.militaryBranch) {
     previewParts.push(`${occupation.militaryBranch} Veteran`);
   }
   
   return previewParts.slice(0, 2).join(' • ');
 };

 // Profile improvement notice component (used in both mobile and desktop)
 const ProfileImprovementNotice = () => (
   <div className={isMobile ? "mt-4 mb-4" : "flex items-center gap-4"}>
     <svg className={isMobile ? "w-8 h-8 text-red-600 flex-shrink-0 mb-2" : "w-10 h-10 text-red-600 flex-shrink-0"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
     </svg>
     
     <div className="flex-1">
       <div className="flex items-center gap-2">
         <p className={isMobile ? "text-sm font-semibold text-white/90" : "text-sm font-semibold text-gray-900"}>
           Update Your Occupation
         </p>
         <div className="relative">
           <HelpCircle 
             className={isMobile ? "w-4 h-4 text-white/60 hover:text-white/80 cursor-help" : "w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"} 
             strokeWidth={2}
             onMouseEnter={() => setShowTooltip(true)}
             onMouseLeave={() => setShowTooltip(false)}
             onClick={() => setShowTooltip(!showTooltip)}
           />
           {showTooltip && (
             <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 ${isMobile ? 'w-64' : 'w-72'}`}>
               <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                 <div className="flex items-center gap-2">
                   <h3 className="text-sm font-semibold text-gray-900">
                     Why Does Alcor Need This?
                   </h3>
                   <svg className="w-4 h-4 text-[#734477]" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
                   </svg>
                 </div>
               </div>
               <div className="px-4 py-3">
                 <p className="text-sm text-gray-700">
                   Alcor needs complete occupation information to better obtain a death certificate
                 </p>
               </div>
               <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                 <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-white"></div>
                 <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-gray-200"></div>
               </div>
             </div>
           )}
         </div>
       </div>
       <p className={isMobile ? "text-sm text-white/70 font-light" : "text-sm text-gray-600 font-light"}>
         Please include your occupation before retirement
       </p>
     </div>
   </div>
 );

 return (
   <div ref={sectionRef} className={`${isMobile ? "" : styleConfig.section.wrapperEnhanced} ${hasLoaded && isVisible ? 'occupation-section-fade-in' : 'opacity-0'}`}>
     {isMobile ? (
       <MobileInfoCard
         iconComponent={
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
         }
         title="Occupation"
         backgroundImage={formsHeaderImage}
         overlayText="Career Details"
         subtitle="Your current occupation and military service history."
         isEditMode={editMode.occupation}
       >
         {/* Display Mode */}
         {!editMode.occupation ? (
           <>
             <div className={`space-y-4 ${hasLoaded && isVisible ? 'occupation-section-stagger-in' : ''}`}>
               <DisplayField 
                 label="Job Title" 
                 value={occupation.occupation} 
               />
               <DisplayField 
                 label="Industry" 
                 value={occupation.occupationalIndustry} 
               />
               <DisplayField 
                 label="Military Service" 
                 value={occupation.hasMilitaryService ? 'Yes' : 'No'}
               />
               {occupation.hasMilitaryService && (
                 <>
                   <DisplayField 
                     label="Military Branch" 
                     value={occupation.militaryBranch} 
                   />
                   <DisplayField 
                     label="Service Years" 
                     value={formatServiceYears(occupation.servedFrom, occupation.servedTo)} 
                   />
                 </>
               )}
             </div>
             
             {isJustRetired(occupation.occupation) && <ProfileImprovementNotice />}
             
             <ActionButtons 
               editMode={false}
               onEdit={() => toggleEditMode && toggleEditMode('occupation')}
             />
           </>
         ) : (
           /* Edit Mode */
           <>
             <div className="space-y-4">
               <div>
                 <FormInput
                   label="Job Title"
                   value={occupation.occupation || ''}
                   onChange={(e) => handleOccupationChange(e.target.value)}
                   error={occupationError}
                 />
                 {occupation.occupation && occupation.occupation.toLowerCase().includes('retired') && !isJustRetired(occupation.occupation) && (
                   <p className="text-green-600 text-sm mt-1 font-light">
                     ✓ Good format - includes previous occupation
                   </p>
                 )}
               </div>
               
               <FormInput
                 label="Industry"
                 value={occupation.occupationalIndustry || ''}
                 onChange={(e) => setOccupation({...occupation, occupationalIndustry: e.target.value})}
               />
               
               <label className="flex items-center cursor-pointer">
                 <input
                   type="checkbox"
                   checked={occupation.hasMilitaryService || false}
                   onChange={(e) => setOccupation({...occupation, hasMilitaryService: e.target.checked, militaryBranch: e.target.checked ? occupation.militaryBranch : 'None'})}
                   className="w-4 h-4 rounded mr-3 text-purple-600 focus:ring-purple-500"
                 />
                 <span className="text-sm text-gray-700 font-medium">Have you served in the US Military?</span>
               </label>
               
               {occupation.hasMilitaryService && (
                 <>
                   <FormSelect
                     label="Military Branch *"
                     value={occupation.militaryBranch || ''}
                     onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                     error={militaryErrors.militaryBranch}
                   >
                     <option value="">Select...</option>
                     <option value="Army">Army</option>
                     <option value="Navy">Navy</option>
                     <option value="Air Force">Air Force</option>
                     <option value="Marines">Marines</option>
                     <option value="Coast Guard">Coast Guard</option>
                     <option value="Space Force">Space Force</option>
                   </FormSelect>
                   
                   <div className="grid grid-cols-2 gap-3">
                     <FormInput
                       label="Service Start Year *"
                       type="text"
                       value={occupation.servedFrom || ''}
                       onChange={(e) => {
                         const value = e.target.value;
                         if (value === '' || /^\d{0,4}$/.test(value)) {
                           setOccupation({...occupation, servedFrom: value});
                         }
                       }}
                       placeholder="YYYY"
                       maxLength="4"
                       pattern="\d{4}"
                       error={militaryErrors.servedFrom}
                     />
                     <FormInput
                       label="Service End Year *"
                       type="text"
                       value={occupation.servedTo || ''}
                       onChange={(e) => {
                         const value = e.target.value;
                         if (value === '' || /^\d{0,4}$/.test(value)) {
                           setOccupation({...occupation, servedTo: value});
                         }
                       }}
                       placeholder="YYYY"
                       maxLength="4"
                       pattern="\d{4}"
                       error={militaryErrors.servedTo}
                     />
                   </div>
                 </>
               )}
             </div>
             
             <ActionButtons 
               editMode={true}
               onSave={handleSave}
               onCancel={() => cancelEdit && cancelEdit('occupation')}
               saving={savingSection === 'occupation'}
               disabled={!!occupationError || (occupation.hasMilitaryService && Object.keys(militaryErrors).length > 0)}
             />
           </>
         )}
       </MobileInfoCard>
     ) : (
       /* Desktop view */
       <div className={styleConfig.section.innerPadding}>
         {/* Desktop Header Section */}
         <div className={`relative pb-6 mb-6 border-b border-gray-200 ${hasLoaded && isVisible ? 'occupation-section-slide-in' : ''}`}>
           {/* Header content */}
           <div className="relative z-10 flex justify-between items-start">
             <div>
               <div className={styleConfig.header.wrapper}>
                 <div className={styleConfig.sectionIcons.occupation}>
                   <svg xmlns="http://www.w3.org/2000/svg" className={styleConfig.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                   </svg>
                 </div>
                 <div className={styleConfig.header.textContainer}>
                   <h2 className={styleConfig.header.title}>Occupation</h2>
                   <p className="text-gray-600 text-base mt-1">
                     Your current occupation and military service history.
                   </p>
                 </div>
               </div>
             </div>
             
             {/* Image on right side */}
             {sectionImage && (
               <div className="flex-shrink-0 ml-8">
                 <div className="relative w-64 h-24 rounded-lg overflow-hidden shadow-md">
                   <img 
                     src={sectionImage} 
                     alt="" 
                     className="w-full h-full object-cover grayscale"
                   />
                   {sectionLabel && (
                     <div className="absolute bottom-0 right-0">
                       <div className="px-2.5 py-0.5 bg-gradient-to-r from-[#162740] to-[#6e4376]">
                         <p className="text-white text-xs font-medium tracking-wider flex items-center gap-1">
                           {sectionLabel}
                           <img src={alcorStar} alt="" className="w-3 h-3" />
                         </p>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Desktop Content - Fields Section */}
         <div className="bg-white">
           {/* Desktop Display Mode */}
           {!editMode.occupation ? (
             <div className={`max-w-2xl ${hasLoaded && isVisible ? 'occupation-section-stagger-in' : ''}`}>
               <dl className={styleConfig.display.dl.wrapperTwo}>
                 <InfoDisplay 
                   label="Job Title" 
                   value={occupation.occupation} 
                 />
                 <InfoDisplay 
                   label="Industry" 
                   value={occupation.occupationalIndustry} 
                 />
                 <InfoDisplay 
                   label="Military Service" 
                   value={occupation.hasMilitaryService ? 'Yes' : 'No'}
                   className={styleConfig.display.grid.fullSpan}
                 />
                 {occupation.hasMilitaryService && (
                   <>
                     <InfoDisplay 
                       label="Military Branch" 
                       value={occupation.militaryBranch} 
                     />
                     <InfoDisplay 
                       label="Service Years" 
                       value={formatServiceYears(occupation.servedFrom, occupation.servedTo)} 
                     />
                   </>
                 )}
               </dl>
             </div>
           ) : (
             /* Desktop Edit Mode - Form */
             <div className="max-w-2xl">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Input
                     label="Job Title"
                     type="text"
                     value={occupation.occupation || ''}
                     onChange={(e) => handleOccupationChange(e.target.value)}
                     disabled={!editMode.occupation}
                     error={!!occupationError}
                   />
                   {occupationError && (
                     <p className="text-red-600 text-sm mt-1 font-light">
                       {occupationError}
                     </p>
                   )}
                   {occupation.occupation && occupation.occupation.toLowerCase().includes('retired') && !isJustRetired(occupation.occupation) && (
                     <p className="text-green-600 text-sm mt-1 font-light">
                       ✓ Good format - includes previous occupation
                     </p>
                   )}
                 </div>
                 <Input
                   label="Industry"
                   type="text"
                   value={occupation.occupationalIndustry || ''}
                   onChange={(e) => setOccupation({...occupation, occupationalIndustry: e.target.value})}
                   disabled={!editMode.occupation}
                 />
                 <Checkbox
                   containerClassName="col-span-2"
                   label="Have you served in the US Military?"
                   checked={occupation.hasMilitaryService || false}
                   onChange={(e) => setOccupation({...occupation, hasMilitaryService: e.target.checked, militaryBranch: e.target.checked ? occupation.militaryBranch : 'None'})}
                   disabled={!editMode.occupation}
                 />
                 {occupation.hasMilitaryService && (
                   <>
                     <Select
                       label="Military Branch *"
                       value={occupation.militaryBranch || ''}
                       onChange={(e) => setOccupation({...occupation, militaryBranch: e.target.value})}
                       disabled={!editMode.occupation}
                       error={!!militaryErrors.militaryBranch}
                     >
                       <option value="">Select...</option>
                       <option value="Army">Army</option>
                       <option value="Navy">Navy</option>
                       <option value="Air Force">Air Force</option>
                       <option value="Marines">Marines</option>
                       <option value="Coast Guard">Coast Guard</option>
                       <option value="Space Force">Space Force</option>
                     </Select>
                     {militaryErrors.militaryBranch && (
                       <p className="text-red-600 text-sm mt-1 font-light">
                         {militaryErrors.militaryBranch}
                       </p>
                     )}
                     <div>
                       <Input
                         label="Service Start Year *"
                         type="text"
                         value={occupation.servedFrom || ''}
                         onChange={(e) => {
                           const value = e.target.value;
                           if (value === '' || /^\d{0,4}$/.test(value)) {
                             setOccupation({...occupation, servedFrom: value});
                           }
                         }}
                         disabled={!editMode.occupation}
                         placeholder="YYYY"
                         maxLength="4"
                         pattern="\d{4}"
                         error={!!militaryErrors.servedFrom}
                       />
                       {militaryErrors.servedFrom && (
                         <p className="text-red-600 text-sm mt-1 font-light">
                           {militaryErrors.servedFrom}
                         </p>
                       )}
                     </div>
                     <div>
                       <Input
                         label="Service End Year *"
                         type="text"
                         value={occupation.servedTo || ''}
                         onChange={(e) => {
                           const value = e.target.value;
                           if (value === '' || /^\d{0,4}$/.test(value)) {
                             setOccupation({...occupation, servedTo: value});
                           }
                         }}
                         disabled={!editMode.occupation}
                         placeholder="YYYY"
                         maxLength="4"
                         pattern="\d{4}"
                         error={!!militaryErrors.servedTo}
                       />
                       {militaryErrors.servedTo && (
                         <p className="text-red-600 text-sm mt-1 font-light">
                           {militaryErrors.servedTo}
                         </p>
                       )}
                     </div>
                   </>
                 )}
               </div>
             </div>
           )}
           
           {/* Desktop Button Group and Warning Notice */}
           {!editMode.occupation && isJustRetired(occupation.occupation) ? (
             <div className="flex items-center justify-between mt-16">
               {/* Profile Improvement Notice - Left side */}
               <ProfileImprovementNotice />
               
               {/* Edit button - Right side */}
               <RainbowButton
                 text="Edit"
                 onClick={() => toggleEditMode && toggleEditMode('occupation')}
                 className="scale-75"
                 spinStar={true}
               />
             </div>
           ) : (
             <div className="flex justify-end mt-6 -mr-8">
               {editMode?.occupation ? (
                 <div className="flex">
                   <WhiteButton
                     text="Cancel"
                     onClick={() => cancelEdit && cancelEdit('occupation')}
                     className="scale-75 -mr-8"
                     spinStar={false}
                   />
                   <PurpleButton
                     text={savingSection === 'saved' ? 'Saved' : savingSection === 'occupation' ? 'Saving...' : 'Save'}
                     onClick={handleSave}
                     className="scale-75"
                     spinStar={false}
                     disabled={savingSection === 'occupation' || !!occupationError || (occupation.hasMilitaryService && Object.keys(militaryErrors).length > 0)}
                   />
                 </div>
               ) : (
                 <RainbowButton
                   text="Edit"
                   onClick={() => toggleEditMode && toggleEditMode('occupation')}
                   className="scale-75"
                   spinStar={true}
                 />
               )}
             </div>
           )}
         </div>
       </div>
     )}
   </div>
 );
};

export default OccupationSection;