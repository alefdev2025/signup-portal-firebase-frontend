// styleConfig.js - Centralized style configuration for the Member Portal

const styleConfig = {
    // Container styles
    section: {
      wrapper: "bg-white rounded-lg shadow-sm p-8 mb-6",
      wrapperEnhanced: "bg-white rounded-xl shadow-md border border-gray-200 mb-8",
      innerPadding: "p-6 md:p-8",
      title: "text-xl font-semibold text-gray-800 mb-6", // Changed from font-medium to font-semibold, changed color
      grid: {
        twoColumn: "grid grid-cols-2 gap-6",
        fourColumn: "grid grid-cols-2 gap-4",
        fullWidth: "col-span-2"
      }
    },

    // Header with icon styles
    header: {
      wrapper: "mb-8 md:mb-9 flex items-start",
      iconContainer: "bg-[#0e0e2f] p-3 rounded-lg", // Updated to first gradient color
      icon: "h-6 w-6 text-white", // Reduced from h-7 w-7 to h-6 w-6
      textContainer: "ml-4 pt-0.5",
      title: "text-xl font-semibold text-gray-800", // Changed from text-2xl font-light to text-xl font-semibold
      subtitle: "text-sm text-gray-500 font-light mt-0.5" // Added font-light
    },

    // Section-specific icon styles with gradient progression
    sectionIcons: {
      contact: "bg-[#0e0e2f] p-3 rounded-lg",      // Start of gradient
      personal: "bg-[#1b163a] p-3 rounded-lg",     // ~10% through
      addresses: "bg-[#2a1b3d] p-3 rounded-lg",    // ~20% through
      family: "bg-[#3f2541] p-3 rounded-lg",       // ~30% through
      occupation: "bg-[#5b2f4b] p-3 rounded-lg",   // ~40% through
      medical: "bg-[#74384d] p-3 rounded-lg",      // ~50% through
      cryo: "bg-[#914451] p-3 rounded-lg",         // ~60% through
      funding: "bg-[#a04c56] p-3 rounded-lg",      // ~70% through
      legal: "bg-[#b66e5d] p-3 rounded-lg",        // ~80% through
      nextOfKin: "bg-[#cb8863] p-3 rounded-lg"     // ~90% through
    },

    // Display mode styles
    display: {
      // Grid layouts for display mode
      grid: {
        single: "space-y-4",
        twoColumn: "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2",
        threeColumn: "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3",
        fullSpan: "sm:col-span-2",
        tripleSpan: "sm:col-span-2 lg:col-span-3"
      },
      // Definition list styles
      dl: {
        wrapper: "grid grid-cols-1 gap-x-6 gap-y-4",
        wrapperSingle: "space-y-4",
        wrapperTwo: "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2",
        wrapperThree: "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
      },
      // Individual display item styles
      item: {
        wrapper: "", // Can add default wrapper styles if needed
        label: "text-sm text-gray-500 font-light", // Changed from text-base font-medium to text-sm font-light
        value: "mt-1 text-base font-medium text-gray-800", // Changed from text-gray-900 to text-gray-800, added font-medium
        valueWithWrap: "mt-1 text-base font-medium text-gray-800 whitespace-pre-wrap",
        empty: "—"
      },
      // Non-editable field in edit mode
      readOnly: {
        wrapper: "w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
      }
    },
  
    // Form elements
    form: {
      label: "block text-gray-700 text-sm font-normal mb-2", // Changed from text-base/lg font-medium to text-sm font-normal
      labelCheckbox: "flex items-center text-gray-700 text-sm font-normal cursor-pointer",
      fieldSpacing: "space-y-6",
      subSection: "pl-4 border-l-2 border-gray-200"
    },
  
    // Input styles - Already reduced padding
    input: {
      base: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] focus:ring-2 focus:ring-[#0a1629]/10 transition-all duration-200",
      disabled: "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500/20",
      // Combined classes - text size already reduced
      default: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] focus:ring-2 focus:ring-[#0a1629]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:border-gray-400 text-base",
      // Specific input types
      checkbox: "mr-2 w-4 h-4 rounded border-gray-300 text-[#0a1629] focus:ring-2 focus:ring-[#0a1629]/20",
      textarea: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] focus:ring-2 focus:ring-[#0a1629]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 resize-none hover:border-gray-400 text-base"
    },
  
    // Select/Dropdown styles
    select: {
      default: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] focus:ring-2 focus:ring-[#0a1629]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:border-gray-400 bg-white text-base appearance-none",
      multiple: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0a1629] focus:ring-2 focus:ring-[#0a1629]/10 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 hover:border-gray-400 min-h-[120px] bg-white text-base"
    },
  
    // Button styles
    button: {
      // Base styles
      base: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-sm",
      
      // Primary button (Save, Submit)
      primary: {
        default: "bg-[#0a1629] text-white hover:bg-[#1e2650] focus:ring-2 focus:ring-[#0a1629] focus:ring-offset-2 shadow-sm hover:shadow-md",
        disabled: "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      },
      
      // Secondary button (Edit)
      secondary: {
        default: "text-[#0a1629] border border-[#0a1629] hover:bg-[#0a1629] hover:text-white focus:ring-2 focus:ring-[#0a1629]/20",
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
      primaryButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none bg-[#0a1629] text-white hover:bg-[#1e2650] focus:ring-2 focus:ring-[#0a1629] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm",
      secondaryButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-[#0a1629] border border-[#0a1629] hover:bg-[#0a1629] hover:text-white focus:ring-2 focus:ring-[#0a1629]/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
      tertiaryButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-gray-600 border border-gray-300 hover:bg-gray-100 hover:border-gray-400 focus:ring-2 focus:ring-gray-300/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm",
      dangerButton: "px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500/20 text-sm"
    },
  
    // Button group styles
    buttonGroup: {
      wrapper: "flex justify-end mt-6 gap-2",
      wrapperLeft: "flex justify-start mt-6 gap-2",
      wrapperCenter: "flex justify-center mt-6 gap-2"
    },
  
    // Alert/Message styles
    alert: {
      base: "mb-6 p-4 rounded-lg",
      success: "bg-green-100 text-green-700 border border-green-200",
      error: "bg-red-100 text-red-700 border border-red-200",
      info: "bg-blue-100 text-blue-700 border border-blue-200",
      warning: "bg-yellow-100 text-yellow-700 border border-yellow-200"
    },
  
    // Loading states
    loading: {
      wrapper: "flex items-center justify-center h-64",
      spinner: "animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4",
      text: "text-gray-600 font-light" // Added font-light
    },
  
    // Card styles for subsections
    card: {
      default: "mb-6 p-4 border border-gray-200 rounded-lg",
      highlighted: "mb-6 p-4 border border-[#0a1629] rounded-lg bg-gray-50"
    },
  
    // Typography
    text: {
      heading: {
        h1: "text-2xl font-semibold text-gray-800 mb-8", // Changed from text-3xl font-light
        h2: "text-xl font-semibold text-gray-800 mb-6", // Changed from font-medium
        h3: "text-lg font-semibold text-gray-800 mb-4" // Changed from font-medium
      },
      body: {
        default: "text-gray-700",
        small: "text-sm text-gray-600 font-light", // Added font-light
        muted: "text-gray-500 font-light" // Added font-light
      }
    }
  };
  
  // Helper function to combine classes
  export const combineClasses = (...classes) => {
    return classes.filter(Boolean).join(' ');
  };
  
  // Helper function to get button classes based on variant
  export const getButtonClasses = (variant = 'primary', disabled = false) => {
    const base = styleConfig.button.base;
    const variantClasses = styleConfig.button[variant];
    
    if (!variantClasses) {
      console.warn(`Button variant "${variant}" not found, using primary`);
      return combineClasses(base, styleConfig.button.primary.default, disabled && styleConfig.button.primary.disabled);
    }
    
    return combineClasses(
      base,
      variantClasses.default,
      disabled && variantClasses.disabled
    );
  };
  
  // Helper function to get alert classes based on type
  export const getAlertClasses = (type = 'info') => {
    return combineClasses(styleConfig.alert.base, styleConfig.alert[type] || styleConfig.alert.info);
  };

  // Helper function to get display grid classes based on columns
  export const getDisplayGridClasses = (columns = 2) => {
    switch (columns) {
      case 1:
        return styleConfig.display.grid.single;
      case 2:
        return styleConfig.display.grid.twoColumn;
      case 3:
        return styleConfig.display.grid.threeColumn;
      default:
        return styleConfig.display.grid.twoColumn;
    }
  };
  
  // Helper function to get section-specific icon styles
  export const getSectionIconStyles = (sectionType) => {
    const sectionConfig = styleConfig.sectionIcons[sectionType] || {};
    return {
      container: `${sectionConfig.containerColor || styleConfig.header.iconContainer} p-3 rounded-lg`,
      icon: `h-6 w-6 ${sectionConfig.iconColor || 'text-white'}` // Reduced from h-7 w-7
    };
  };
  
  export default styleConfig;