import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, ButtonGroup } from '../FormComponents';
import { RainbowButton, WhiteButton, PurpleButton } from '../WebsiteButtonStyle';
import styleConfig2, { getSectionCheckboxColor } from '../styleConfig2';
import { MobileInfoCard, DisplayField, FormInput, FormSelect, ActionButtons } from './MobileInfoCard';
import PersonalInfoMobile from './PersonalInfoMobile';
import formsHeaderImage from '../../../assets/images/forms-image.png';
import alcorStar from '../../../assets/images/alcor-star.png';
import { 
 overlayStyles, 
 infoCardStyles, 
 sectionImageStyles, 
 headerStyles, 
 buttonStyles, 
 animationStyles 
} from './desktopCardStyles/index';
import { InfoField, InfoCard } from './SharedInfoComponents';
import { CompletionWheelWithLegend } from './CompletionWheel';
import { isSectionEditable } from '../memberCategoryConfig';

// Custom Select component that uses styleConfig2
const StyledSelect = ({ label, value, onChange, disabled, children, error }) => {
 return (
   <div>
     <label className={styleConfig2.form.label}>{label}</label>
     <select
       value={value}
       onChange={onChange}
       disabled={disabled}
       className={`${styleConfig2.select.default} ${error ? styleConfig2.input.error : ''}`}
     >
       {children}
     </select>
     {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
   </div>
 );
};

// Multi-Select Dropdown Component
const MultiSelectDropdown = ({ label, options, value = [], onChange, disabled = false, error }) => {
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef(null);

 useEffect(() => {
   const handleClickOutside = (event) => {
     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
       setIsOpen(false);
     }
   };

   document.addEventListener('mousedown', handleClickOutside);
   return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const toggleOption = (option) => {
   if (disabled) return;
   
   const newValue = value.includes(option)
     ? value.filter(v => v !== option)
     : [...value, option];
   
   // Remove duplicates
   const uniqueValue = [...new Set(newValue)];
   onChange(uniqueValue);
 };

 const displayValue = value.length > 0 
   ? [...new Set(value)].join(', ') 
   : 'Select...';

 // Sort options to show selected ones first
 const sortedOptions = React.useMemo(() => {
   // Normalize values for comparison
   const normalizedValue = value.map(v => 
     v === "United States" ? "United States of America" : v
   );
   const selected = options.filter(opt => normalizedValue.includes(opt));
   const unselected = options.filter(opt => !normalizedValue.includes(opt));
   return [...selected, ...unselected];
 }, [options, value]);

 return (
   <div className="relative" ref={dropdownRef}>
     <label className={styleConfig2.form.label}>{label}</label>
     <div
       className={`${styleConfig2.select.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${error ? styleConfig2.input.error : ''}`}
       onClick={() => !disabled && setIsOpen(!isOpen)}
     >
       <span className={`${value.length === 0 ? 'text-gray-400' : ''} truncate pr-2`}>{displayValue}</span>
       <svg className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
       </svg>
     </div>
     {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
     
     {isOpen && !disabled && (
       <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
         {sortedOptions.map((option) => (
           <label
             key={option}
             className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
             onClick={(e) => e.stopPropagation()}
           >
             <input
               type="checkbox"
               checked={value.includes(option) || (option === "United States of America" && value.includes("United States"))}
               onChange={() => toggleOption(option)}
               className="mr-2 w-4 h-4 rounded border-gray-300 text-[#734477] focus:ring-2 focus:ring-[#734477]/20 accent-[#734477]"
             />
             <span className="ml-2 text-gray-700 font-medium">{option}</span>
           </label>
         ))}
       </div>
     )}
   </div>
 );
};

// Single-Select Dropdown Component
const SingleSelectDropdown = ({ label, options, value = '', onChange, disabled = false, placeholder = 'Select...', error }) => {
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef(null);

 useEffect(() => {
   const handleClickOutside = (event) => {
     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
       setIsOpen(false);
     }
   };

   document.addEventListener('mousedown', handleClickOutside);
   return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const handleSelect = (option) => {
   if (disabled) return;
   onChange({ target: { value: option } });
   setIsOpen(false);
 };

 const displayValue = value || placeholder;

 return (
   <div className="relative" ref={dropdownRef}>
     <label className={styleConfig2.form.label}>{label}</label>
     <div
       className={`${styleConfig2.select.default} cursor-pointer flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${error ? styleConfig2.input.error : ''}`}
       onClick={() => !disabled && setIsOpen(!isOpen)}
     >
       <span className={`${!value ? 'text-gray-400' : ''} truncate pr-2`}>{displayValue}</span>
       <svg className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
       </svg>
     </div>
     {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
     
     {isOpen && !disabled && (
       <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
         {options.map((option) => (
           <div
             key={option.value}
             className={`px-4 py-2 hover:bg-gray-50 cursor-pointer font-medium ${value === option.value ? 'bg-[#734477]/10 text-[#734477]' : 'text-gray-700'}`}
             onClick={() => handleSelect(option.value)}
           >
             {option.label}
           </div>
         ))}
       </div>
     )}
   </div>
 );
};

// Simplified Overlay Component - Just a visual wrapper, NO state management
const CardOverlay = ({ 
 isOpen, 
 onClose, 
 section, 
 children,  // The actual edit form will be passed as children
 fieldInfo  // Title and description for the header
}) => {
 if (!isOpen) return null;

 return ReactDOM.createPortal(
   <div className={overlayStyles.container}>
     <div className={overlayStyles.backdrop} onClick={onClose}></div>
     
     <div className={overlayStyles.contentWrapper}>
       <div className={`${overlayStyles.contentBox} overflow-hidden`}>
         {/* Header */}
         <div className={overlayStyles.header.wrapper}>
           <button
             onClick={onClose}
             className={overlayStyles.header.closeButton}
           >
             <svg className={overlayStyles.header.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
           <div className={overlayStyles.header.content}>
             <div className={overlayStyles.header.iconSection}>
               <div className={overlayStyles.header.iconBox} style={overlayStyles.header.iconBoxBg}>
                 <svg className={overlayStyles.header.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={overlayStyles.header.iconColor}>
                   {section === 'identity' && (
                     <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                   )}
                   {section === 'demographics' && (
                     <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                   )}
                   {section === 'origin' && (
                     <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   )}
                 </svg>
               </div>
               <div className={overlayStyles.header.textWrapper}>
                 <span className={overlayStyles.header.title} style={{ display: 'block' }}>
                   {fieldInfo?.title || ''}
                 </span>
                 <p className={overlayStyles.header.description}>
                   {fieldInfo?.description || ''}
                 </p>
               </div>
             </div>
           </div>
         </div>

         {/* Body - Just render the children (the edit form) */}
         <div className={overlayStyles.body.wrapper}>
           <div className={overlayStyles.body.content}>
             {children}
           </div>
         </div>
       </div>
     </div>
   </div>,
   document.body
 );
};

const PersonalInfoSection = ({ 
 personalInfo = {}, 
 setPersonalInfo, 
 familyInfo,
 editMode = {}, 
 toggleEditMode, 
 cancelEdit, 
 savePersonalInfo, 
 savingSection,
 memberCategory,
 sectionImage,
 sectionLabel,
 fieldErrors = {}
}) => {
 const safePersonalInfo = personalInfo || {};
 const [hasLoaded, setHasLoaded] = useState(false);
 const [isVisible, setIsVisible] = useState(false);
 const [hoveredSection, setHoveredSection] = useState(null);
 const [isMobile, setIsMobile] = useState(false);
 const [overlayOpen, setOverlayOpen] = useState(false);
 const [overlaySection, setOverlaySection] = useState(null);
 const [cardsVisible, setCardsVisible] = useState(false);
 const sectionRef = useRef(null);
 
 // Track whether we're in overlay edit mode
 const [overlayEditMode, setOverlayEditMode] = useState(false);
 
 // Track if save was successful to show success message
 const [showOverlaySuccess, setShowOverlaySuccess] = useState(false);
 
 // Track if we're currently saving
 const [isOverlaySaving, setIsOverlaySaving] = useState(false);

// Check for both singular and plural forms of the category
const [ssnWasInitiallyEmpty] = useState(() => {
  const ssnValue = personalInfo?.ssn;
  return !ssnValue || ssnValue === '' || ssnValue.trim() === '';
});

// Track if SSN has been saved (this can change after saves)
const [ssnHasBeenSaved, setSsnHasBeenSaved] = useState(() => {
  const ssnValue = personalInfo?.ssn;
  return ssnValue && ssnValue.includes('*');
});

const canEditSSN = (memberCategory === 'CryoApplicant' || memberCategory === 'CryoApplicants') && 
                   ssnWasInitiallyEmpty && 
                   !ssnHasBeenSaved;

useEffect(() => {
  if (safePersonalInfo?.ssn && safePersonalInfo.ssn.includes('*')) {
    setSsnHasBeenSaved(true);
  }
}, [safePersonalInfo?.ssn]);

 // Detect mobile
 useEffect(() => {
   const checkMobile = () => setIsMobile(window.innerWidth < 640);
   checkMobile();
   window.addEventListener('resize', checkMobile);
   return () => window.removeEventListener('resize', checkMobile);
 }, []);

 // Inject animation styles
 useEffect(() => {
   const style = animationStyles.injectStyles();
   
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
         setTimeout(() => {
           setHasLoaded(true);
           setTimeout(() => setCardsVisible(true), 200);
         }, 100);
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

 // Field configuration for completion wheel
 const fieldConfig = {
   required: {
     gender: { field: 'gender', source: 'personalInfo', label: 'Sex' },
     birthName: { field: 'birthName', source: 'personalInfo', label: 'Birth Name' },
     ssn: { field: 'ssn', source: 'personalInfo', label: 'SSN/Government ID' },
     race: { field: 'race', source: 'personalInfo', label: 'Race' },
     maritalStatus: { field: 'maritalStatus', source: 'personalInfo', label: 'Marital Status' },
     placeOfBirth: { field: 'placeOfBirth', source: 'personalInfo', label: 'Place of Birth' },
     citizenship: { field: 'citizenship', source: 'personalInfo', label: 'Citizenship' }
   },
   recommended: {
     ethnicity: { field: 'ethnicity', source: 'personalInfo', label: 'Ethnicity' }
   }
 };

 // Clean citizenship data to remove duplicates and normalize "United States"
 useEffect(() => {
   if (safePersonalInfo.citizenship && Array.isArray(safePersonalInfo.citizenship)) {
     // Normalize "United States" to "United States of America"
     const normalizedCitizenship = safePersonalInfo.citizenship.map(country => 
       country === "United States" ? "United States of America" : country
     );
     const uniqueCitizenship = [...new Set(normalizedCitizenship)];
     if (uniqueCitizenship.length !== safePersonalInfo.citizenship.length || 
         normalizedCitizenship.some((c, i) => c !== safePersonalInfo.citizenship[i])) {
       setPersonalInfo({...safePersonalInfo, citizenship: uniqueCitizenship});
     }
   }
 }, [safePersonalInfo.citizenship]);

 const formatSSN = (ssn) => {
   if (!ssn) return '—';
   if (ssn.includes('*')) return ssn;
   const cleaned = ssn.replace(/\D/g, '');
   if (cleaned.length >= 4) {
     return `***-**-${cleaned.slice(-4)}`;
   }
   return '—';
 };

 const formatMultipleSelections = (selections) => {
   if (!selections || selections.length === 0) return '—';
   return selections.join(', ');
 };

 const raceOptions = [
   "American Indian or Alaska Native",
   "Asian",
   "Black or African American",
   "Hispanic or Latino",
   "Native Hawaiian or Other Pacific Islander",
   "White or Caucasian",
   "Multiracial",
   "Middle Eastern",
   "Prefer Not to Say",
   "Other"
 ];

 const citizenshipOptions = [
  "United States of America",
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Côte d'Ivoire",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia (Czech Republic)",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini (fmr. \"Swaziland\")",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Holy See",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar (formerly Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine State",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

 const ethnicityOptions = [
   { value: "Hispanic or Latino", label: "Hispanic or Latino" },
   { value: "Not Hispanic or Latino", label: "Not Hispanic or Latino" }
 ];

 const maritalStatusOptions = [
   { value: "Single", label: "Single" },
   { value: "Married", label: "Married" },
   { value: "Divorced", label: "Divorced" },
   { value: "Separated", label: "Separated" },
   { value: "Widowed", label: "Widowed" },
   { value: "Widower", label: "Widower" },
   { value: "Domestic Partner", label: "Domestic Partner" },
   { value: "Significant Other", label: "Significant Other" }
 ];

 const getFieldDescriptions = () => {
   switch (overlaySection) {
     case 'identity':
       return {
         title: 'Identity Details',
         description: 'Your personal identification information including birth name, government ID, and sex.',
       };
     case 'demographics':
       return {
         title: 'Demographics',
         description: 'Demographic information that helps us better understand our member community and ensure inclusive services.',
       };
     case 'origin':
       return {
         title: 'Origin & Citizenship',
         description: 'Information about your place of birth and citizenship status, which may be relevant for legal documentation.',
       };
     default:
       return { title: '', description: '' };
   }
 };

 const handleCardClick = (sectionKey) => {
   setOverlaySection(sectionKey);
   setOverlayOpen(true);
   setOverlayEditMode(false); // Start in view mode
   setShowOverlaySuccess(false); // Reset success message
 };

 const handleOverlayEdit = () => {
   // Set the main edit mode to true if not already
   if (!editMode.personal) {
     toggleEditMode('personal');
   }
   setOverlayEditMode(true);
   setShowOverlaySuccess(false);
 };

 // Track overlay-specific field errors
 const [overlayFieldErrors, setOverlayFieldErrors] = useState({});

 // FIX: Modified handleOverlaySave to use async/await properly
 const handleOverlaySave = async () => {
   setIsOverlaySaving(true);
   setShowOverlaySuccess(false);
   setOverlayFieldErrors({}); // Clear previous errors
   
   try {
     // Call the parent's save function and wait for it to complete
     // The parent should return {success: boolean, errors?: object}
     const saveResult = await savePersonalInfo();
     
     // Check the result
     if (saveResult === true || (saveResult && saveResult.success)) {
       // Success! Show success message and close
       setShowOverlaySuccess(true);
       setOverlayEditMode(false);
       setOverlayFieldErrors({});
       
       // Close overlay after showing success
       setTimeout(() => {
         setOverlayOpen(false);
         setShowOverlaySuccess(false);
       }, 1500);
     } else if (saveResult && saveResult.errors) {
       // Validation failed with specific errors
       console.log('Save failed with errors:', saveResult.errors);
       setOverlayFieldErrors(saveResult.errors);
       setOverlayEditMode(true);
     } else {
       // General failure
       console.log('Save failed, keeping overlay open');
       // Wait a bit for parent fieldErrors to update
       setTimeout(() => {
         setOverlayFieldErrors(fieldErrors || {});
       }, 100);
       setOverlayEditMode(true);
     }
   } catch (error) {
     console.error('Error during save:', error);
     // Keep overlay open on error
     setOverlayEditMode(true);
   } finally {
     setIsOverlaySaving(false);
   }
 };

 const handleOverlayCancel = () => {
   // Call the parent's cancel function
   cancelEdit('personal');
   setOverlayEditMode(false);
   setIsOverlaySaving(false);
   setOverlayFieldErrors({}); // Clear errors
 };

 const handleOverlayClose = () => {
   // If we're saving, don't allow close
   if (isOverlaySaving) {
     return;
   }
   
   // If we're in edit mode, cancel first
   if (overlayEditMode) {
     cancelEdit('personal');
     setOverlayEditMode(false);
   }
   setOverlayOpen(false);
   setShowOverlaySuccess(false);
   setOverlayFieldErrors({}); // Clear errors
 };

 // Create the edit form component that will be reused
 const renderEditForm = (isInOverlay = false) => {
   const containerClass = isInOverlay ? "space-y-4" : "grid grid-cols-2 gap-4";
   // Use overlay-specific errors when in overlay, otherwise use parent fieldErrors
   const currentErrors = isInOverlay ? overlayFieldErrors : fieldErrors;
   
   return (
     <div className={containerClass}>
       {isInOverlay && overlaySection === 'identity' && (
         <>
           <div className="grid grid-cols-2 gap-4">
             <Input
               label="Birth Name"
               type="text"
               value={safePersonalInfo?.birthName || ''}
               onChange={(e) => setPersonalInfo({...safePersonalInfo, birthName: e.target.value})}
               disabled={isOverlaySaving || savingSection === 'personal'}
               placeholder="Same as current"
             />
             <StyledSelect
               label="Sex *"
               value={safePersonalInfo?.gender || ''}
               onChange={(e) => setPersonalInfo({...safePersonalInfo, gender: e.target.value})}
               disabled={isOverlaySaving || savingSection === 'personal'}
               error={currentErrors.gender}
             >
               <option value="">Select...</option>
               <option value="Male">Male</option>
               <option value="Female">Female</option>
               <option value="Other">Other</option>
             </StyledSelect>
           </div>
           {canEditSSN ? (
             <Input
               label="SSN/Government ID *"
               type="text"
               value={safePersonalInfo?.ssn || ''}
               onChange={(e) => setPersonalInfo({...safePersonalInfo, ssn: e.target.value})}
               disabled={isOverlaySaving || savingSection === 'personal'}
               error={currentErrors.ssn}
               placeholder="Enter SSN or Government ID"
             />
           ) : (
             <div>
               <label className={styleConfig2.form.label}>SSN/Government ID *</label>
               <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                 {formatSSN(safePersonalInfo?.ssn)}
               </div>
               <p className="mt-1 text-sm text-gray-500">Contact Alcor to update SSN</p>
             </div>
           )}
         </>
       )}

       {isInOverlay && overlaySection === 'demographics' && (
         <>
           <MultiSelectDropdown
             label="Race"
             options={raceOptions}
             value={safePersonalInfo?.race || []}
             onChange={(selected) => setPersonalInfo({...safePersonalInfo, race: selected})}
             disabled={isOverlaySaving || savingSection === 'personal'}
             error={currentErrors.race}
           />
           <SingleSelectDropdown
             label="Ethnicity"
             options={ethnicityOptions}
             value={safePersonalInfo?.ethnicity || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, ethnicity: e.target.value})}
             disabled={isOverlaySaving || savingSection === 'personal'}
             error={currentErrors.ethnicity}
           />
           <SingleSelectDropdown
             label="Marital Status"
             options={maritalStatusOptions}
             value={safePersonalInfo?.maritalStatus || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, maritalStatus: e.target.value})}
             disabled={isOverlaySaving || savingSection === 'personal'}
             error={currentErrors.maritalStatus}
           />
         </>
       )}

       {isInOverlay && overlaySection === 'origin' && (
         <>
           <Input
             label="Place of Birth"
             type="text"
             value={safePersonalInfo?.placeOfBirth || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, placeOfBirth: e.target.value})}
             disabled={isOverlaySaving || savingSection === 'personal'}
             error={currentErrors.placeOfBirth}
           />
           <MultiSelectDropdown
             label="Citizenship"
             options={citizenshipOptions}
             value={safePersonalInfo?.citizenship || []}
             onChange={(selected) => setPersonalInfo({...safePersonalInfo, citizenship: selected})}
             disabled={isOverlaySaving || savingSection === 'personal'}
             error={currentErrors.citizenship}
           />
         </>
       )}

       {!isInOverlay && (
         <>
           <Input
             label="Birth Name"
             type="text"
             value={safePersonalInfo.birthName || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, birthName: e.target.value})}
             disabled={savingSection === 'personal'}
             placeholder="Same as current"
           />
           
           <StyledSelect
             label="Sex *"
             value={safePersonalInfo.gender || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, gender: e.target.value})}
             disabled={savingSection === 'personal'}
             error={currentErrors.gender}
           >
             <option value="">Select...</option>
             <option value="Male">Male</option>
             <option value="Female">Female</option>
             <option value="Other">Other</option>
           </StyledSelect>
           
           {canEditSSN ? (
             <Input
               containerClassName="col-span-2"
               label="SSN/Government ID *"
               type="text"
               value={safePersonalInfo.ssn || ''}
               onChange={(e) => setPersonalInfo({...safePersonalInfo, ssn: e.target.value})}
               disabled={savingSection === 'personal'}
               error={currentErrors.ssn}
               placeholder="Enter SSN or Government ID"
             />
           ) : (
             <div className="col-span-2">
               <label className={styleConfig2.form.label}>SSN/Government ID *</label>
               <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                 {formatSSN(safePersonalInfo.ssn)}
               </div>
               <p className="mt-1 text-sm text-gray-500">Contact Alcor to update SSN</p>
             </div>
           )}
           
           <MultiSelectDropdown
             label="Race"
             options={raceOptions}
             value={safePersonalInfo.race || []}
             onChange={(selected) => setPersonalInfo({...safePersonalInfo, race: selected})}
             disabled={savingSection === 'personal'}
             error={currentErrors.race}
           />
           
           <SingleSelectDropdown
             label="Ethnicity"
             options={ethnicityOptions}
             value={safePersonalInfo.ethnicity || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, ethnicity: e.target.value})}
             disabled={savingSection === 'personal'}
             error={currentErrors.ethnicity}
           />
           
           <MultiSelectDropdown
             label="Citizenship"
             options={citizenshipOptions}
             value={safePersonalInfo.citizenship || []}
             onChange={(selected) => setPersonalInfo({...safePersonalInfo, citizenship: selected})}
             disabled={savingSection === 'personal'}
             error={currentErrors.citizenship}
           />
           
           <Input
             label="Place of Birth"
             type="text"
             value={safePersonalInfo.placeOfBirth || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, placeOfBirth: e.target.value})}
             disabled={savingSection === 'personal'}
             error={currentErrors.placeOfBirth}
           />
           
           <SingleSelectDropdown
             label="Marital Status"
             options={maritalStatusOptions}
             value={safePersonalInfo.maritalStatus || ''}
             onChange={(e) => setPersonalInfo({...safePersonalInfo, maritalStatus: e.target.value})}
             disabled={savingSection === 'personal'}
             error={currentErrors.maritalStatus}
           />
         </>
       )}
     </div>
   );
 };

 // Create the view content for overlay
 const renderOverlayViewContent = () => {
   return (
     <div className="space-y-6">
       {overlaySection === 'identity' && (
         <div className="space-y-6">
           <div className="grid grid-cols-2 gap-8">
             <div>
               <label className={overlayStyles.displayMode.field.label}>Birth Name</label>
               <p 
                 className={overlayStyles.displayMode.field.value}
                 style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.birthName)}
               >
                 {safePersonalInfo?.birthName || 'Same as current'}
               </p>
             </div>
             <div>
               <label className={overlayStyles.displayMode.field.label}>SSN/Government ID</label>
               <p 
                 className={overlayStyles.displayMode.field.value}
                 style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.ssn)}
               >
                 {formatSSN(safePersonalInfo?.ssn)}
               </p>
             </div>
           </div>
           <div>
             <label className={overlayStyles.displayMode.field.label}>Sex</label>
             <p 
               className={overlayStyles.displayMode.field.value}
               style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.gender)}
             >
               {safePersonalInfo?.gender || '—'}
             </p>
           </div>
         </div>
       )}

       {overlaySection === 'demographics' && (
         <div className="space-y-6">
           <div>
             <label className={overlayStyles.displayMode.field.label}>Race</label>
             <p 
               className={overlayStyles.displayMode.field.value}
               style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.race || safePersonalInfo.race.length === 0)}
             >
               {formatMultipleSelections(safePersonalInfo?.race)}
             </p>
           </div>
           <div>
             <label className={overlayStyles.displayMode.field.label}>Ethnicity</label>
             <p 
               className={overlayStyles.displayMode.field.value}
               style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.ethnicity)}
             >
               {safePersonalInfo?.ethnicity || '—'}
             </p>
           </div>
           <div>
             <label className={overlayStyles.displayMode.field.label}>Marital Status</label>
             <p 
               className={overlayStyles.displayMode.field.value}
               style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.maritalStatus)}
             >
               {safePersonalInfo?.maritalStatus || '—'}
             </p>
           </div>
         </div>
       )}

       {overlaySection === 'origin' && (
         <div className="space-y-6">
           <div>
             <label className={overlayStyles.displayMode.field.label}>Place of Birth</label>
             <p 
               className={overlayStyles.displayMode.field.value}
               style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.placeOfBirth)}
             >
               {safePersonalInfo?.placeOfBirth || '—'}
             </p>
           </div>
           <div>
             <label className={overlayStyles.displayMode.field.label}>Citizenship</label>
             <p 
               className={overlayStyles.displayMode.field.value}
               style={overlayStyles.displayMode.field.getFieldStyle(!safePersonalInfo?.citizenship || safePersonalInfo.citizenship.length === 0)}
             >
               {formatMultipleSelections(safePersonalInfo?.citizenship)}
             </p>
           </div>
         </div>
       )}
     </div>
   );
 };

 return (
   <div ref={sectionRef} className={`personal-info-section ${hasLoaded && isVisible ? animationStyles.classes.fadeIn : 'opacity-0'}`}>
     {/* Overlay */}
     <CardOverlay
       isOpen={overlayOpen}
       onClose={handleOverlayClose}
       section={overlaySection}
       fieldInfo={getFieldDescriptions()}
     >
       {/* Success Message */}
       {showOverlaySuccess && (
         <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
           <div className="flex items-center">
             <svg className="w-5 h-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
             </svg>
             <p className="text-sm text-green-800">Information updated successfully!</p>
           </div>
         </div>
       )}

       {/* Error Message for validation errors */}
       {overlayEditMode && (overlayFieldErrors && Object.keys(overlayFieldErrors).length > 0) && (
         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
           <div className="flex items-start">
             <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <div className="text-sm text-red-800">
               <p className="font-medium">Please fix the following errors:</p>
               <ul className="mt-1 list-disc list-inside">
                 {Object.entries(overlayFieldErrors).map(([field, error]) => (
                   <li key={field}>{error}</li>
                 ))}
               </ul>
             </div>
           </div>
         </div>
       )}

       {/* Content based on edit mode */}
       {!overlayEditMode ? (
         <>
           {/* View Mode */}
           {renderOverlayViewContent()}
           
           {/* Footer with Edit button */}
           <div className={overlayStyles.footer.wrapper}>
             <PurpleButton
               text="Edit"
               onClick={handleOverlayEdit}
               className={buttonStyles.overlayButtons.save}
               spinStar={buttonStyles.starConfig.enabled}
             />
           </div>
         </>
       ) : (
         <>
           {/* Edit Mode - Reuse the same form */}
           {renderEditForm(true)}
           
           {/* Footer with Cancel/Save buttons */}
           <div className={overlayStyles.footer.wrapper}>
             <WhiteButton
               text="Cancel"
               onClick={handleOverlayCancel}
               className={buttonStyles.overlayButtons.cancel}
               spinStar={buttonStyles.starConfig.enabled}
               disabled={isOverlaySaving}
             />
             <PurpleButton
               text={isOverlaySaving ? 'Saving...' : 'Save'}
               onClick={handleOverlaySave}
               className={buttonStyles.overlayButtons.save}
               spinStar={buttonStyles.starConfig.enabled}
               disabled={isOverlaySaving}
             />
           </div>
         </>
       )}
     </CardOverlay>
     
     {isMobile ? (
       <PersonalInfoMobile
         personalInfo={safePersonalInfo}
         setPersonalInfo={setPersonalInfo}
         editMode={editMode}
         toggleEditMode={toggleEditMode}
         cancelEdit={cancelEdit}
         savePersonalInfo={savePersonalInfo}
         savingSection={savingSection}
         fieldErrors={fieldErrors}
         fieldConfig={fieldConfig}
         memberCategory={memberCategory}
       />
     ) : (
       <div className={styleConfig2.section.wrapperEnhanced}>
         <div className={styleConfig2.section.innerPadding}>
           <div className={headerStyles.container}>
             <div className="w-full">
               <div className="flex items-start justify-between">
                 <div>
                   <div>
                     <div className="flex items-center space-x-4 mb-3">
                       <div className={headerStyles.getIconContainer(styleConfig2, 'personal')} style={{ backgroundColor: '#512BD9' }}>
                         <svg className={headerStyles.getIcon(styleConfig2).className} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={headerStyles.getIcon(styleConfig2).strokeWidth}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                       </div>
                       <h2 className={`${headerStyles.title(styleConfig2)} font-medium`}>Personal Information</h2>
                     </div>
                     <div className="flex items-start space-x-4">
                       <div className={headerStyles.getIconContainer(styleConfig2, 'personal')} style={{ visibility: 'hidden' }}>
                         <svg className={headerStyles.getIcon(styleConfig2).className}>
                           <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                       </div>
                       <div>
                         <p className="text-gray-600 text-sm leading-5 max-w-lg">
                           Additional personal details for your member file.
                         </p>
                         <p className="text-gray-400 text-sm leading-5 mt-2">
                           Required: Sex, Birth Name, SSN/Government ID, Race, Marital Status, Place of Birth, Citizenship
                         </p>
                         <p className="text-gray-400 text-sm leading-5 mt-1">
                           Recommended: Ethnicity
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <CompletionWheelWithLegend
                   data={{ personalInfo: safePersonalInfo }}
                   fieldConfig={fieldConfig}
                   sectionColor="#512BD9"
                 />
               </div>
             </div>
           </div>

           <div className="bg-white">
             {!editMode.personal ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <InfoCard 
                    title="Identity Details" 
                    icon={
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    }
                   sectionKey="identity"
                   hoveredSection={hoveredSection}
                   onMouseEnter={() => setHoveredSection('identity')}
                   onMouseLeave={() => setHoveredSection(null)}
                   onClick={() => handleCardClick('identity')}
                   cardIndex={0}
                   isVisible={cardsVisible}
                 >
                   <InfoField label="Birth Name" value={personalInfo?.birthName || 'Same as current'} isRequired />
                   <InfoField label="SSN/Government ID" value={formatSSN(personalInfo?.ssn)} isRequired />
                   <InfoField label="Sex" value={personalInfo?.gender || '—'} isRequired />
                 </InfoCard>

                 <InfoCard 
                    title="Demographics" 
                    icon={
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                   sectionKey="demographics"
                   hoveredSection={hoveredSection}
                   onMouseEnter={() => setHoveredSection('demographics')}
                   onMouseLeave={() => setHoveredSection(null)}
                   onClick={() => handleCardClick('demographics')}
                   cardIndex={1}
                   isVisible={cardsVisible}
                 >
                   <InfoField label="Race" value={formatMultipleSelections(personalInfo?.race)} isRequired />
                   <InfoField label="Ethnicity" value={personalInfo?.ethnicity || '—'} isRecommended />
                   <InfoField label="Marital Status" value={personalInfo?.maritalStatus || '—'} isRequired />
                 </InfoCard>

                 <InfoCard 
                    title="Origin & Citizenship" 
                    icon={
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                   sectionKey="origin"
                   hoveredSection={hoveredSection}
                   onMouseEnter={() => setHoveredSection('origin')}
                   onMouseLeave={() => setHoveredSection(null)}
                   onClick={() => handleCardClick('origin')}
                   cardIndex={2}
                   isVisible={cardsVisible}
                 >
                   <InfoField label="Place of Birth" value={personalInfo?.placeOfBirth || '—'} isRequired />
                   <InfoField label="Citizenship" value={formatMultipleSelections(personalInfo?.citizenship)} isRequired />
                   <div className="opacity-0 pointer-events-none">
                     <InfoField label="" value="" />
                   </div>
                 </InfoCard>
               </div>
             ) : (
               <div className="max-w-2xl">
                 {renderEditForm(false)}
               </div>
             )}
             
             <div className={buttonStyles.actionContainer}>
               {editMode?.personal ? (
                 <div className={buttonStyles.buttonGroup}>
                   <WhiteButton
                     text="Cancel"
                     onClick={() => cancelEdit && cancelEdit('personal')}
                     className={buttonStyles.whiteButton.withMargin}
                     spinStar={buttonStyles.starConfig.enabled}
                   />
                   <PurpleButton
                     text={buttonStyles.getSaveButtonText?.(savingSection) || (savingSection === 'personal' ? 'Saving...' : 'Save')}
                     onClick={savePersonalInfo}
                     className={buttonStyles.purpleButton.base}
                     spinStar={buttonStyles.starConfig.enabled}
                     disabled={savingSection === 'personal'}
                   />
                 </div>
               ) : (
                 <WhiteButton
                   text="Edit"
                   onClick={() => toggleEditMode && toggleEditMode('personal')}
                   className={buttonStyles.whiteButton.base}
                   spinStar={buttonStyles.starConfig.enabled}
                 />
               )}
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default PersonalInfoSection;