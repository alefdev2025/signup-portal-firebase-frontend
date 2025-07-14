// infoCardStyles.js - Complete card container styles (NO field styles - those are in fieldStyles.js)
import fieldStyles from './fieldStyles';

const infoCardStyles = {
  // Card container with hover states
  container: {
    base: "group relative bg-gray-50 rounded-lg p-6 transition-all duration-1000 ease-out border border-gray-200 cursor-pointer min-h-[280px]",
    hover: "hover:bg-white hover:shadow-sm",
    active: "bg-white shadow-md transform -translate-y-0.5 border-gray-300"
  },
  
  // Dynamic box shadow for hovered state
  getBoxShadow: (isHovered) => ({
    boxShadow: isHovered ? '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' : '',
    transition: 'box-shadow 1s ease-out'
  }),
  
  // Card header with icon
  header: {
    wrapper: "flex items-center gap-3 mb-6",
    iconBox: "p-2.5 rounded-lg transition-all duration-1000 ease-out",
    iconBoxGradient: {
      default: { background: 'linear-gradient(135deg, #443660 0%, #6e4376 50%, #785683 100%)' },
      hover: { 
        background: 'linear-gradient(135deg, #443660 0%, #6e4376 50%, #785683 100%)' 
      }
    },
    icon: "w-6 h-6 transition-colors duration-1000 ease-out",
    iconColor: {
      default: "text-white",
      hover: "text-white"
    },
    title: "text-base tracking-wide text-gray-900 font-bold relative",
    titleStyle: { 
      fontWeight: '700', 
      display: 'block',
      position: 'relative',
      paddingBottom: '6px'
    }
  },
  
  // Card content
  content: {
    wrapper: "space-y-4"
  },
  
  // Field styles - USES CENTRAL CONFIG
  field: {
    wrapper: fieldStyles.getStyles.wrapper(),
    label: fieldStyles.classes.label,
    labelStyle: { fontWeight: fieldStyles.weights.label },
    value: fieldStyles.classes.value,
    emptyValue: fieldStyles.classes.emptyValue
  },
  
  // Hover indicators
  hoverIndicators: {
    topRight: {
      wrapper: "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out",
      icon: "w-5 h-5 text-gray-400"
    },
    bottomRight: {
      wrapper: "absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out",
      text: "text-xs text-gray-500 font-medium"
    }
  },
  
  // Helper function to get full card classes
  getCardClasses: (isHovered, sectionKey) => {
    return `${infoCardStyles.container.base} ${isHovered ? infoCardStyles.container.active : infoCardStyles.container.hover}`;
  }
};

export default infoCardStyles;