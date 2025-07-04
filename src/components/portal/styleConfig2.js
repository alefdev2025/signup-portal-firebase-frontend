// styleConfig2.js - Centralized style configuration for the Member Portal v2

const styleConfig2 = {
    // Container styles
    section: {
      wrapper: "bg-white rounded-lg shadow-sm p-8 mb-6",
      // Mobile: more rounded corners, purple border, stronger shadow, WIDER with negative margins
      wrapperEnhanced: "bg-white rounded-3xl sm:rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] sm:shadow-md border-2 border-purple-400 sm:border sm:border-gray-200 mb-6 sm:mb-8 -mx-4 sm:mx-0",
      wrapperConsistent: "bg-white shadow-md border border-gray-400 rounded-[1.5rem] overflow-hidden",
      // Box shadow to match FormsTab
      boxShadow: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)' },
      innerPadding: "px-6 py-6 sm:p-6 md:p-8", // MORE GENEROUS mobile padding
      title: "text-xl font-semibold text-gray-800 mb-6",
      grid: {
        twoColumn: "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6", // Increased mobile gap
        fourColumn: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", // Increased gap
        fullWidth: "col-span-1 md:col-span-2"
      }
    },
   
    // Header with icon styles - Smaller on mobile but with more spacing
    header: {
      wrapper: "mb-8 sm:mb-8 md:mb-9 flex items-start", // More space below header on mobile
      iconContainer: "p-2.5 sm:p-3.5 rounded-lg transform transition duration-300", // Slightly bigger mobile padding
      icon: "h-5 w-5 sm:h-7 sm:w-7 text-white stroke-[1.5]", // Smaller mobile icon
      iconStrokeWidth: "1.5",
      textContainer: "ml-5 pt-0.5", // More space between icon and text
      title: "text-lg sm:text-xl font-semibold text-gray-800", // Smaller on mobile
      subtitle: "text-xs sm:text-sm text-gray-600 font-normal mt-1" // Smaller on mobile
    },
   
    // Clean mobile collapsible styles for dark theme
    mobileCollapsible: {
      wrapper: "relative overflow-hidden", 
      header: "relative flex items-center justify-between p-4 cursor-pointer", 
      iconBox: "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", // Smaller, simpler icon
      icon: "h-5 w-5 text-white", 
      contentArea: "flex-1 ml-3", 
      title: "text-base font-medium text-white", // White text
      previewContainer: "mt-1 space-y-0.5", 
      previewRow: "flex items-center gap-2 text-sm", 
      previewLabel: "text-white/60 text-xs", // Semi-transparent white
      previewValue: "text-white/90 text-xs font-normal", // Bright white
      chevron: "w-5 h-5 text-white/60 transition-all duration-200", 
      expandedContent: "px-4 pb-4", 
      subtitle: "text-sm text-white/70 ml-0", // White subtitle
    },

// Mobile section wrapper - white header with colored content
mobileSection: {
    wrapper: "rounded-xl overflow-hidden shadow-lg", // Base wrapper
    header: "p-5 cursor-pointer bg-white", // White header background
    headerContent: "flex items-center justify-between", // Header layout
    iconWrapper: "flex items-center", // Icon and text container
    iconBox: "p-3.5 rounded-lg mr-3.5", // Icon background with gradient
    iconGradient: "background: linear-gradient(135deg, #162740 0%, #443660 40%, #785683 60%, #996a68 80%, #d4a574 100%)", // Icon gradient style
    icon: "h-7 w-7 text-white", // Icon size and color
    titleWrapper: "div", // Title container
    title: "text-xl font-normal text-gray-900", // Section title - dark text on white
    preview: "text-gray-600 text-sm mt-1", // Preview text when collapsed - gray
    chevron: "w-5 h-5 text-gray-400 transition-transform duration-200", // Collapse/expand icon - gray
    chevronRotated: "rotate-180", // When expanded
    subtitle: "px-5 pb-2 bg-white", // Subtitle wrapper - white background
    subtitleText: "text-gray-600 text-sm", // Subtitle text style - gray
    contentWrapper: "p-5", // Content background - will use section color
    // Display mode styles
    displayGrid: "space-y-4", // Grid for display items
    displayGridTwo: "grid grid-cols-2 gap-4", // Two column grid
    displayLabel: "text-white/60 text-xs uppercase tracking-wider mb-1", // Field labels
    displayValue: "text-white text-sm font-medium", // Field values
    // Edit mode styles
    editWrapper: "space-y-4", // Form wrapper
    editGrid: "grid grid-cols-2 gap-4", // Two column form grid
    editGridFull: "grid grid-cols-1 gap-4", // Single column grid
    editLabel: "block text-sm font-medium mb-1.5", // Form labels
    darkLabelClass: "dark-label", // Class name for CSS
    darkInputClass: "dark-input", // Class name for CSS
    darkSelectClass: "dark-select", // Class name for CSS
    darkCheckboxClass: "dark-checkbox", // Class name for CSS
    // Form input styles (for styled-jsx)
    formInput: "w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-all",
    // Action buttons
    actionWrapper: "flex justify-end mt-6 pt-4 border-t border-white/10",
    actionButtonGroup: "flex gap-3",
    cancelButton: "px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all",
    saveButton: "px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-medium",
    editButton: "px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all",
    // CSS for dark inputs (to be used in styled-jsx)
    darkInputStyles: `
      .dark-input {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: white;
      }
      .dark-input:focus {
        background-color: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
      }
      .dark-input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      .dark-label {
        color: rgba(255, 255, 255, 0.9);
      }
      .dark-select {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: white;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='rgba(255,255,255,0.5)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
      }
      .dark-select option {
        background-color: #443660;
        color: white;
      }
      .dark-checkbox {
        background-color: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
      }
      .dark-checkbox:checked {
        background-color: rgba(255, 255, 255, 0.9);
        border-color: rgba(255, 255, 255, 0.9);
      }
    `
  },
   
    // Section separator - Shows on both mobile and desktop
    separator: {
      wrapper: "h-px sm:h-0.5 my-10 sm:my-16 mx-0 sm:ml-4 sm:mx-0 w-auto sm:w-1/3 rounded-full bg-gray-300 sm:bg-gray-400", // More vertical space
      gradient: { background: 'linear-gradient(90deg, #4a5f7a 0%, #5a4f7a 40%, #7a5f8a 70%, #9e7398 100%)' }
    },
   
    // Section-specific dark backgrounds for mobile, icon styles for desktop
    sectionIcons: {
      // Icon-only styles for desktop
      contact: "bg-[#13283f] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",      // Darkest blue
      personal: "bg-[#1a2f4a] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",     // Slightly lighter blue
      addresses: "bg-[#243655] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",    // Blue transitioning
      family: "bg-[#2e3d60] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",       // Blue-gray
      occupation: "bg-[#404060] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",   // Your gray-purple
      medical: "bg-[#52476b] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",      // Purple-gray
      cryo: "bg-[#644e76] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",         // Mid purple
      funding: "bg-[#705579] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",      // Lighter purple
      legal: "bg-[#795a7b] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300",        // Purple-pink
      nextOfKin: "bg-[#825f7c] p-2.5 sm:p-3.5 rounded-lg transform transition duration-300"     // Your lightest purple
    },
    
    // Full section backgrounds for mobile dark theme
    sectionBackgrounds: {
      contact: "bg-[#13283f]",      // Darkest blue
      personal: "bg-[#1a2f4a]",     // Slightly lighter blue
      addresses: "bg-[#243655]",    // Blue transitioning
      family: "bg-[#2e3d60]",       // Blue-gray
      occupation: "bg-[#404060]",   // Your gray-purple
      medical: "bg-[#52476b]",      // Purple-gray
      cryo: "bg-[#644e76]",         // Mid purple
      funding: "bg-[#705579]",      // Lighter purple
      legal: "bg-[#795a7b]",        // Purple-pink
      nextOfKin: "bg-[#825f7c]"     // Your lightest purple
    },
   
    // Editable configuration for sections and fields
    editableConfig: {
      // Sections that have edit buttons
      sectionsWithEditButton: {
        contact: true,
        personal: true,
        addresses: true,
        family: true,
        occupation: true,
        medical: true,
        cryoArrangements: true,
        funding: true,
        legal: true,
        nextOfKin: true
      },
      
      // Fields that are visible when in edit mode (by section)
      visibleInEditMode: {
        contact: {
          firstName: true,
          lastName: true,
          dateOfBirth: false,  // HIDE completely in edit mode
          personalEmail: true,
          workEmail: true,
          homePhone: true,
          mobilePhone: true,
          workPhone: true,
          preferredPhone: true
        },
        personal: {
          birthName: true,
          ssn: true,
          gender: true,
          race: true,
          ethnicity: true,
          citizenship: true,
          placeOfBirth: true,
          maritalStatus: true
        },
        addresses: {
          homeStreet: true,
          homeCity: true,
          homeState: true,
          homePostalCode: true,
          homeCountry: true,
          mailingStreet: true,
          mailingCity: true,
          mailingState: true,
          mailingPostalCode: true,
          mailingCountry: true,
          sameAsHome: true
        },
        family: {
          fathersName: true,
          fathersBirthplace: true,
          mothersMaidenName: true,
          mothersBirthplace: true,
          spousesName: true
        },
        occupation: {
          occupation: true,
          occupationalIndustry: true,
          hasMilitaryService: true,
          militaryBranch: true,
          servedFrom: true,
          servedTo: true
        },
        medical: {
          bloodType: true,
          primaryPhysician: true,
          physicianPhone: true,
          knownAllergies: true,
          knownConditions: true,
          medications: true,
          medicalNotes: true
        },
        cryoArrangements: {
          method: true,  // Visible but read-only
          cmsWaiver: true,  // Visible but read-only
          remainsHandling: true,
          recipientName: true,
          recipientPhone: true,
          recipientEmail: true,
          publicDisclosure: true
        },
        funding: {
          fundingType: true,
          companyName: true,
          policyNumber: true,
          policyType: true,
          faceAmount: true
        },
        legal: {
          hasWill: true,
          contraryProvisions: true
        },
        nextOfKin: {
          fullName: true,
          relationship: true,
          phone: true,
          email: true,
          address: true
        }
      },
      
      // Fields that are editable when visible in edit mode (by section)
      editableFields: {
        contact: {
          firstName: true,
          lastName: true,
          personalEmail: true,
          workEmail: true,
          homePhone: true,
          mobilePhone: true,
          workPhone: true,
          preferredPhone: true
        },
        personal: {
          birthName: true,
          ssn: true,
          gender: true,
          race: true,
          ethnicity: true,
          citizenship: true,
          placeOfBirth: true,
          maritalStatus: true
        },
        addresses: {
          homeStreet: true,
          homeCity: true,
          homeState: true,
          homePostalCode: true,
          homeCountry: true,
          mailingStreet: true,
          mailingCity: true,
          mailingState: true,
          mailingPostalCode: true,
          mailingCountry: true,
          sameAsHome: true
        },
        family: {
          fathersName: true,
          fathersBirthplace: true,
          mothersMaidenName: true,
          mothersBirthplace: true,
          spousesName: true
        },
        occupation: {
          occupation: true,
          occupationalIndustry: true,
          hasMilitaryService: true,
          militaryBranch: true,
          servedFrom: true,
          servedTo: true
        },
        medical: {
          bloodType: true,
          primaryPhysician: true,
          physicianPhone: true,
          knownAllergies: true,
          knownConditions: true,
          medications: true,
          medicalNotes: true
        },
        cryoArrangements: {
          method: false, // Read-only
          cmsWaiver: false, // Read-only
          remainsHandling: true,
          recipientName: true,
          recipientPhone: true,
          recipientEmail: true,
          publicDisclosure: true
        },
        funding: {
          fundingType: true,
          companyName: true,
          policyNumber: true,
          policyType: true,
          faceAmount: true
        },
        legal: {
          hasWill: true,
          contraryProvisions: true
        },
        nextOfKin: {
          fullName: true,
          relationship: true,
          phone: true,
          email: true,
          address: true
        }
      }
    },
   
    // Display mode styles - updated for dark theme on mobile
    display: {
      // Grid layouts for display mode
      grid: {
        single: "space-y-5", 
        twoColumn: "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:gap-x-6", 
        threeColumn: "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3 md:gap-x-6", 
        fullSpan: "md:col-span-2",
        tripleSpan: "md:col-span-2 lg:col-span-3"
      },
      // Definition list styles
      dl: {
        wrapper: "grid grid-cols-1 gap-x-6 gap-y-5 md:gap-x-6", 
        wrapperSingle: "space-y-5", 
        wrapperTwo: "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:gap-x-6", 
        wrapperThree: "grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-3 md:gap-x-6" 
      },
      // Individual display item styles - white text for mobile
      item: {
        wrapper: "",
        label: "text-xs sm:text-sm text-white/60 sm:text-gray-600 font-normal", // White on mobile
        value: "mt-1.5 text-sm sm:text-base font-medium text-white sm:text-gray-800", // White on mobile
        valueWithWrap: "mt-1.5 text-sm sm:text-base font-medium text-white sm:text-gray-800 whitespace-pre-wrap",
        empty: "—"
      },
      // Non-editable field in edit mode
      readOnly: {
        wrapper: "w-full px-4 py-2 bg-white/10 sm:bg-gray-100 border border-white/20 sm:border-gray-300 rounded-lg text-white sm:text-gray-700"
      }
    },
   
    // Form elements
    form: {
      label: "block text-gray-700 text-xs sm:text-sm font-semibold mb-2.5", // Smaller on mobile
      labelCheckbox: "flex items-center text-gray-700 text-xs sm:text-sm font-normal cursor-pointer",
      fieldSpacing: "space-y-7", // More space between form fields
      subSection: "pl-4 border-l-2 border-gray-200"
    },
   
    // Input styles
    input: {
      base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 transition-all duration-200 text-gray-900 font-normal text-sm sm:text-base",
      disabled: "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      // Combined classes
      default: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:border-gray-400 text-sm sm:text-base text-gray-900 font-normal",
      // Specific input types
      checkbox: "mr-2 w-4 h-4 rounded border-gray-300 text-[#13283f] focus:ring-2 focus:ring-[#13283f]/20",
      textarea: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 resize-none hover:border-gray-400 text-sm sm:text-base text-gray-900 font-normal"
    },
   
    // Select/Dropdown styles
    select: {
      default: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:border-gray-400 bg-white text-sm sm:text-base text-gray-900 font-normal appearance-none",
      multiple: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#13283f] focus:ring-2 focus:ring-[#13283f]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:border-gray-400 min-h-[120px] bg-white text-sm sm:text-base text-gray-900 font-normal"
    },
   
    // Button styles - Updated with new color scheme
    button: {
      // Base styles
      base: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-xs sm:text-sm", // Smaller on mobile
      
      // Primary button (Save, Submit) - Using darkest blue
      primary: {
        default: "bg-[#13283f] text-white hover:bg-[#0f1f31] focus:ring-2 focus:ring-[#13283f] focus:ring-offset-2 shadow-sm hover:shadow-md",
        disabled: "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      },
      
      // Secondary button (Edit) - Using mid purple
      secondary: {
        default: "text-[#404060] border border-[#404060] hover:bg-[#404060] hover:text-white focus:ring-2 focus:ring-[#404060]/20",
        disabled: "disabled:opacity-50 disabled:cursor-not-allowed"
      },
      
      // Tertiary button (Cancel)
      tertiary: {
        default: "text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-gray-300/20",
        disabled: "disabled:opacity-50 disabled:cursor-not-allowed"
      },
      
      // Danger button (Delete, Remove)
      danger: {
        default: "text-red-600 hover:text-red-700 focus:ring-2 focus:ring-red-500/20",
        solid: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
      },
      
      // Combined classes for easy use
      primaryButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none bg-[#13283f] text-white hover:bg-[#0f1f31] focus:ring-2 focus:ring-[#13283f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-xs sm:text-sm",
      secondaryButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-[#404060] border border-[#404060] hover:bg-[#404060] hover:text-white focus:ring-2 focus:ring-[#404060]/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm",
      tertiaryButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-gray-300/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm",
      dangerButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500/20 text-xs sm:text-sm"
    },
   
    // Button group styles
    buttonGroup: {
      wrapper: "flex justify-end mt-8 gap-3", // More space above and between buttons
      wrapperLeft: "flex justify-start mt-8 gap-3",
      wrapperCenter: "flex justify-center mt-8 gap-3"
    },
   
    // Alert/Message styles
    alert: {
      base: "mb-8 p-5 rounded-lg", // More padding and margin
      success: "bg-green-100 text-green-700 border border-green-200",
      error: "bg-red-100 text-red-700 border border-red-200",
      info: "bg-blue-100 text-blue-700 border border-blue-200",
      warning: "bg-yellow-100 text-yellow-700 border border-yellow-200"
    },
   
    // Loading states
    loading: {
      wrapper: "flex items-center justify-center h-64",
      spinner: "animate-spin rounded-full h-12 w-12 border-b-2 border-[#825f7c] mx-auto mb-4",
      text: "text-gray-600 font-light"
    },
   
    // Card styles for subsections
    card: {
      default: "mb-8 p-5 border border-gray-200 rounded-lg", // More padding and margin
      highlighted: "mb-8 p-5 border border-[#13283f] rounded-lg bg-gray-50"
    },
   
    // Typography
    text: {
      heading: {
        h1: "text-xl sm:text-2xl font-semibold text-gray-800 mb-8", // Smaller on mobile
        h2: "text-lg sm:text-xl font-semibold text-gray-800 mb-6", // Smaller on mobile
        h3: "text-base sm:text-lg font-semibold text-gray-800 mb-4" // Smaller on mobile
      },
      body: {
        default: "text-gray-700 text-sm sm:text-base", // Smaller on mobile
        small: "text-xs sm:text-sm text-gray-600 font-light", // Smaller on mobile
        muted: "text-gray-500 font-light text-xs sm:text-sm" // Smaller on mobile
      }
    }
  };
  
  // Helper function to combine classes
  export const combineClasses = (...classes) => {
    return classes.filter(Boolean).join(' ');
  };
  
  // Helper function to get button classes based on variant
  export const getButtonClasses = (variant = 'primary', disabled = false) => {
    const base = styleConfig2.button.base;
    const variantClasses = styleConfig2.button[variant];
    
    if (!variantClasses) {
      console.warn(`Button variant "${variant}" not found, using primary`);
      return combineClasses(base, styleConfig2.button.primary.default, disabled && styleConfig2.button.primary.disabled);
    }
    
    return combineClasses(
      base,
      variantClasses.default,
      disabled && variantClasses.disabled
    );
  };
  
  // Helper function to get alert classes based on type
  export const getAlertClasses = (type = 'info') => {
    return combineClasses(styleConfig2.alert.base, styleConfig2.alert[type] || styleConfig2.alert.info);
  };
  
  // Helper function to get display grid classes based on columns
  export const getDisplayGridClasses = (columns = 2) => {
    switch (columns) {
      case 1:
        return styleConfig2.display.grid.single;
      case 2:
        return styleConfig2.display.grid.twoColumn;
      case 3:
        return styleConfig2.display.grid.threeColumn;
      default:
        return styleConfig2.display.grid.twoColumn;
    }
  };
  
  // Helper function to get section-specific icon styles
  export const getSectionIconStyles = (sectionType) => {
    const iconClass = styleConfig2.sectionIcons[sectionType] || styleConfig2.header.iconContainer;
    return {
      container: iconClass,
      icon: styleConfig2.header.icon
    };
  };
  
  // Helper function to check if a section has an edit button
  export const sectionHasEditButton = (sectionName) => {
    return styleConfig2.editableConfig.sectionsWithEditButton[sectionName] || false;
  };
  
  // Helper function to check if a field should be visible in edit mode
  export const isFieldVisibleInEditMode = (sectionName, fieldName) => {
    const sectionFields = styleConfig2.editableConfig.visibleInEditMode[sectionName];
    if (!sectionFields) return true; // Default to visible if not configured
    return sectionFields[fieldName] !== false;
  };
  
  // Helper function to check if a field is editable
  export const isFieldEditable = (sectionName, fieldName) => {
    // First check if it's visible
    if (!isFieldVisibleInEditMode(sectionName, fieldName)) {
      return false;
    }
    
    // Then check if it's editable
    const sectionFields = styleConfig2.editableConfig.editableFields[sectionName];
    if (!sectionFields) return false;
    return sectionFields[fieldName] !== false;
  };

  // Helper function to get section-specific checkbox color for mobile
export const getSectionCheckboxColor = (sectionType) => {
    const colorMap = {
      contact: '#13283f',
      personal: '#1a2f4a',
      addresses: '#243655',
      family: '#2e3d60',
      occupation: '#404060',
      medical: '#52476b',
      cryo: '#644e76',
      funding: '#705579',
      legal: '#795a7b',
      nextOfKin: '#825f7c'
    };
    return colorMap[sectionType] || '#443660';
  };
  
  export default styleConfig2;