// FamilyInfoMobile.js
import React from 'react';
import { FormInput } from './MobileInfoCard';
import formsHeaderImage from '../../../assets/images/forms-image.jpg';
import alcorStar from '../../../assets/images/alcor-star.png';
import styleConfig2 from '../styleConfig2';

const FamilyInfoMobile = ({ 
 familyInfo,
 setFamilyInfo,
 personalInfo,
 editMode,
 toggleEditMode,
 cancelEdit,
 saveFamilyInfo,
 savingSection,
 fieldErrors,
 fieldConfig,
 needsBirthplaceUpdate,
 ProfileImprovementNotice
}) => {
 // Local state for validation errors
 const [localErrors, setLocalErrors] = React.useState({});
 
 // Clear errors when entering/exiting edit mode
 React.useEffect(() => {
   if (editMode.family) {
     setLocalErrors({});
   }
 }, [editMode.family]);

 // Calculate completion percentage
 const calculateCompletion = () => {
   let filledRequired = 0;
   let filledRecommended = 0;
   
   Object.values(fieldConfig.required).forEach(field => {
     const value = familyInfo?.[field.field];
     if (value && value.trim() !== '') {
       filledRequired++;
     }
   });
   
   Object.values(fieldConfig.recommended).forEach(field => {
     if (field.checkValue && typeof field.checkValue === 'function') {
       if (field.checkValue({ familyInfo })) {
         filledRecommended++;
       }
     } else {
       const value = familyInfo?.[field.field];
       if (value && value.trim() !== '') {
         filledRecommended++;
       }
     }
   });
   
   const totalRequired = Object.keys(fieldConfig.required).length;
   const totalRecommended = Object.keys(fieldConfig.recommended).length;
   
   const requiredPercentage = totalRequired > 0 ? (filledRequired / totalRequired) * 100 : 0;
   const recommendedPercentage = totalRecommended > 0 ? (filledRecommended / totalRecommended) * 0 : 0; // No recommended fields for family
   
   return Math.round(requiredPercentage + recommendedPercentage);
 };

 const completionPercentage = calculateCompletion();

 const getPreviewText = () => {
   const hasSpouse = personalInfo?.maritalStatus === 'Married' && familyInfo?.spousesName;
   
   if (!familyInfo?.fathersName && !familyInfo?.mothersMaidenName && !hasSpouse) {
     return 'No family information provided';
   }
   
   const parts = [];
   if (familyInfo?.fathersName) parts.push(`Father: ${familyInfo.fathersName}`);
   if (familyInfo?.mothersMaidenName) parts.push(`Mother: ${familyInfo.mothersMaidenName}`);
   if (hasSpouse) parts.push(`Spouse: ${familyInfo.spousesName}`);
   
   return parts.join(' • ');
 };

 // IMPROVED: More lenient birthplace validation
 const validateBirthplace = (value) => {
   if (!value || !value.trim()) return null;
   
   const trimmedValue = value.trim().toLowerCase();
   
   // Check if it's "unknown"
   if (trimmedValue === 'unknown') return null;
   
   // Check if it has at least 1 comma (e.g., "New York, USA")
   const commaCount = (value.match(/,/g) || []).length;
   if (commaCount >= 1) return null;
   
   // Check if it's reasonably detailed even without commas
   // (e.g., "London United Kingdom" or "Tokyo Japan")
   const parts = value.split(/[\s,]+/).filter(part => part.length > 0);
   if (parts.length >= 2 && value.length >= 10) return null;
   
   // Return helpful error message
   return 'Please include location details (e.g., "City, Country" or enter "Unknown")';
 };

 // Handle save with complete validation
 const handleSave = async () => {
   const errors = {};
   
   // Validate father's name (required)
   if (!familyInfo?.fathersName || !familyInfo.fathersName.trim()) {
     errors.fathersName = "Father's name is required";
   }
   
   // Validate father's birthplace (required)
   if (!familyInfo?.fathersBirthplace || !familyInfo.fathersBirthplace.trim()) {
     errors.fathersBirthplace = "Father's birthplace is required";
   } else {
     const fatherError = validateBirthplace(familyInfo.fathersBirthplace);
     if (fatherError) {
       errors.fathersBirthplace = fatherError;
     }
   }
   
   // Validate mother's name (required)
   if (!familyInfo?.mothersMaidenName || !familyInfo.mothersMaidenName.trim()) {
     errors.mothersMaidenName = "Mother's maiden name is required";
   }
   
   // Validate mother's birthplace (required)
   if (!familyInfo?.mothersBirthplace || !familyInfo.mothersBirthplace.trim()) {
     errors.mothersBirthplace = "Mother's birthplace is required";
   } else {
     const motherError = validateBirthplace(familyInfo.mothersBirthplace);
     if (motherError) {
       errors.mothersBirthplace = motherError;
     }
   }
   
   // Validate spouse's name if married
   if (personalInfo?.maritalStatus === 'Married' && (!familyInfo?.spousesName || !familyInfo.spousesName.trim())) {
     errors.spousesName = "Spouse's name is required";
   }
   
   // If there are validation errors, set them and don't save
   if (Object.keys(errors).length > 0) {
     setLocalErrors(errors);
     return;
   }
   
   // Clear errors and proceed with save
   setLocalErrors({});
   
   // Call saveFamilyInfo and check if it returns a result
   try {
     const result = await saveFamilyInfo();
     
     // If saveFamilyInfo returns a failure indication, show errors
     if (result && !result.success) {
       const errorMessage = result.errors 
         ? Object.values(result.errors).join('. ')
         : result.error || 'Failed to save family information';
       
       setLocalErrors({ general: errorMessage });
     }
   } catch (error) {
     console.error('Error saving family info:', error);
     setLocalErrors({ general: 'Failed to save. Please try again.' });
   }
 };

 return (
   <div className="-mx-2">
     <div className="rounded-2xl overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.15)] border border-gray-200 w-full">
       {/* White Header Section */}
       <div className="bg-white px-6 py-6">
         <div className="flex flex-col gap-5 w-full">
           {/* Top row - Icon and Title */}
           <div className="flex items-center gap-3">
             <div className={styleConfig2.sectionIcons.family}>
               <svg className={styleConfig2.header.icon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={styleConfig2.header.iconStrokeWidth}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
             </div>
             <h3 className="text-xl font-light text-gray-900">Family Information</h3>
           </div>
           
           <div className="border-t border-gray-200"></div>
           
           {/* Content area */}
           <div className="space-y-5">
             {/* Card with subtle shadow and no harsh lines */}
             <div className="relative w-full rounded-lg overflow-hidden shadow-sm bg-white">
               {/* Content section */}
               <div className="px-6 py-6">
                 {/* Header with completion */}
                 <div className="flex items-center justify-between mb-6">
                   <div className="pr-4">
                     <h3 className="text-lg font-semibold text-gray-900 mb-1">Family Details</h3>
                     <p className="text-sm text-gray-600">Information about your<br />immediate family</p>
                   </div>
                   
                   {/* Updated completion indicator with correct dimensions */}
                   <div className="relative">
                     <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                       <circle
                         stroke="#f5f5f5"
                         fill="transparent"
                         strokeWidth={8}
                         r={42}
                         cx={50}
                         cy={50}
                       />
                       <circle
                         stroke="url(#gradient)"
                         fill="transparent"
                         strokeWidth={8}
                         strokeDasharray={`${264} ${264}`}
                         style={{ 
                           strokeDashoffset: 264 - (completionPercentage / 100) * 264,
                           transition: 'stroke-dashoffset 0.5s ease',
                           strokeLinecap: 'round'
                         }}
                         r={42}
                         cx={50}
                         cy={50}
                       />
                       <defs>
                         <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stopColor="#512BD9" />
                           <stop offset="100%" stopColor="#F26430" />
                         </linearGradient>
                       </defs>
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="text-center">
                         <div className="text-base font-bold text-gray-900">{completionPercentage}%</div>
                         <div className="text-[9px] text-gray-500 uppercase tracking-wider">Complete</div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Divider */}
                 <div className="h-px bg-gray-100 mb-5"></div>
                 
                 {/* Progress indicators */}
                 <div className="space-y-3">
                   {/* Required fields */}
                   <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                     <div className="w-8 h-8 rounded-full bg-[#0a1628] flex items-center justify-center flex-shrink-0">
                       <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                     </div>
                     <div className="flex-1">
                       <h4 className="text-sm font-semibold text-gray-900">Required Information</h4>
                       <p className="text-xs text-gray-500 mt-0.5">
                         Father's Name & Birthplace, Mother's Name & Birthplace
                         {personalInfo?.maritalStatus === 'Married' && ', Spouse\'s Name'}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Display Mode - Family Preview */}
             {!editMode.family && (
               <>
                 <div className="bg-blue-50/30 rounded-lg p-4">
                   <p className="text-sm text-gray-600 text-center">{getPreviewText()}</p>
                 </div>
                 
                 {needsBirthplaceUpdate() && (
                   <div className="bg-red-50 rounded-lg p-4">
                     <ProfileImprovementNotice />
                   </div>
                 )}
               </>
             )}
           </div>
         </div>
       </div>

       {/* Edit Form Section */}
       {editMode.family && (
         <div className="bg-white px-6 py-6 border-t border-gray-200">
           {/* Error Message Section - Only show if there are errors after attempting to save */}
           {localErrors && Object.keys(localErrors).length > 0 && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
               <div className="flex items-start">
                 <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <div className="text-sm text-red-800">
                   {localErrors.general ? (
                     <p>{localErrors.general}</p>
                   ) : (
                     <>
                       <p className="font-medium">Please fix the following errors:</p>
                       <ul className="mt-1 list-disc list-inside">
                         {Object.entries(localErrors).filter(([field]) => field !== 'general').map(([field, error]) => (
                           <li key={field}>{error}</li>
                         ))}
                       </ul>
                     </>
                   )}
                 </div>
               </div>
             </div>
           )}
           
           <div className="space-y-6">
             {/* Father Information */}
             <div>
               <h4 className="text-base font-medium text-gray-900 mb-4">Father Information</h4>
               <div className="space-y-4">
                 <FormInput
                   label="Father's Full Name *"
                   value={familyInfo?.fathersName || ''}
                   onChange={(e) => {
                     setFamilyInfo({...familyInfo, fathersName: e.target.value});
                   }}
                   disabled={savingSection === 'family'}
                   error={fieldErrors.fathersName || localErrors.fathersName}
                 />
                 <FormInput
                   label="Father's Birthplace *"
                   placeholder="City, Country (or 'Unknown')"
                   value={familyInfo?.fathersBirthplace || ''}
                   onChange={(e) => {
                     setFamilyInfo({...familyInfo, fathersBirthplace: e.target.value});
                   }}
                   disabled={savingSection === 'family'}
                   error={fieldErrors.fathersBirthplace || localErrors.fathersBirthplace}
                 />
               </div>
             </div>
             
             {/* Mother Information */}
             <div>
               <h4 className="text-base font-medium text-gray-900 mb-4">Mother Information</h4>
               <div className="space-y-4">
                 <FormInput
                   label="Mother's Full Maiden Name *"
                   value={familyInfo?.mothersMaidenName || ''}
                   onChange={(e) => {
                     setFamilyInfo({...familyInfo, mothersMaidenName: e.target.value});
                   }}
                   disabled={savingSection === 'family'}
                   error={fieldErrors.mothersMaidenName || localErrors.mothersMaidenName}
                 />
                 <FormInput
                   label="Mother's Birthplace *"
                   placeholder="City, Country (or 'Unknown')"
                   value={familyInfo?.mothersBirthplace || ''}
                   onChange={(e) => {
                     setFamilyInfo({...familyInfo, mothersBirthplace: e.target.value});
                   }}
                   disabled={savingSection === 'family'}
                   error={fieldErrors.mothersBirthplace || localErrors.mothersBirthplace}
                 />
               </div>
             </div>
             
             {/* Spouse Information - Only show if married */}
             {personalInfo?.maritalStatus === 'Married' && (
               <div>
                 <h4 className="text-base font-medium text-gray-900 mb-4">Spouse Information</h4>
                 <FormInput
                   label={`${personalInfo?.gender === 'Female' ? "Spouse's Name" : "Wife's Maiden Name"} *`}
                   value={familyInfo?.spousesName || ''}
                   onChange={(e) => {
                     setFamilyInfo({...familyInfo, spousesName: e.target.value});
                   }}
                   disabled={savingSection === 'family'}
                   error={fieldErrors.spousesName || localErrors.spousesName}
                 />
               </div>
             )}
             
             <p className="text-xs text-gray-500">
               * Include location details for birthplaces (e.g., "City, Country"). Enter "Unknown" if not known.
             </p>
           </div>
           
           {/* Action buttons */}
           <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 gap-3">
             <button
               onClick={() => {
                 setLocalErrors({});
                 cancelEdit && cancelEdit('family');
               }}
               className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
               disabled={savingSection === 'family'}
             >
               Close
             </button>
             <button
               onClick={handleSave}
               disabled={savingSection === 'family'}
               className="px-4 py-2.5 bg-[#162740] hover:bg-[#0f1e33] text-white rounded-lg transition-all font-medium disabled:opacity-50"
             >
               {savingSection === 'family' ? 'Saving...' : 'Save'}
             </button>
           </div>
         </div>
       )}

       {/* View/Edit button when not in edit mode */}
       {!editMode.family && (
         <div className="bg-white px-6 pb-6">
           <button
             onClick={() => toggleEditMode && toggleEditMode('family')}
             className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
           >
             View/Edit
           </button>
         </div>
       )}
     </div>
   </div>
 );
};

export default FamilyInfoMobile;