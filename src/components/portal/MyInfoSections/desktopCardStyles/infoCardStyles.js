// infoCardStyles.js - Complete card container styles with slide-up animation
import fieldStyles from './fieldStyles';

const infoCardStyles = {
  // Card container with hover states
  container: {
    base: "group relative bg-gray-50 rounded-lg p-6 transition-all duration-1000 ease-out border border-gray-200 cursor-pointer min-h-[280px]",
    hover: "hover:bg-white hover:shadow-sm",
    active: "bg-white shadow-md transform -translate-y-0.5 border-gray-300",
    // Add animation classes
    animated: "animate-slideUp"
  },
  
  // Animation CSS to be injected
  animationCSS: `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-slideUp {
      animation: slideUp 0.6s ease-out forwards;
      opacity: 0;
    }
    
    /* Staggered delays for multiple cards */
    .animation-delay-100 { animation-delay: 100ms; }
    .animation-delay-200 { animation-delay: 200ms; }
    .animation-delay-300 { animation-delay: 300ms; }
    .animation-delay-400 { animation-delay: 400ms; }
    .animation-delay-500 { animation-delay: 500ms; }
    .animation-delay-600 { animation-delay: 600ms; }
  `,
  
  // Dynamic box shadow for hovered state
  getBoxShadow: (isHovered) => ({
    boxShadow: isHovered ? '4px 6px 12px rgba(0, 0, 0, 0.08), -2px -2px 6px rgba(0, 0, 0, 0.03)' : '',
    transition: 'box-shadow 1s ease-out'
  }),
  
  // Card header with icon
  header: {
    wrapper: "flex items-center gap-3 mb-6",
    iconBox: "p-2.5 rounded-lg transition-all duration-1000 ease-out border-2",
    iconBoxGradient: {
      default: { 
        background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', // Much darker (gray-800 to gray-900)
        borderColor: '#3B82F6',  // Bright blue border (blue-500)
        boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0, 0, 0, 0.3)' // Less inner highlight for darker look
      },
      hover: { 
        background: 'linear-gradient(135deg, #111827 0%, #000000 100%)', // Even darker on hover (gray-900 to black)
        borderColor: '#60A5FA',  // Lighter blue on hover (blue-400)
        boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.08), 0 3px 6px rgba(0, 0, 0, 0.4)' // Enhanced shadow
      }
    },
    icon: "w-6 h-6 transition-all duration-1000 ease-out",
    iconColor: {
      default: "text-white",
      hover: "text-gray-100" // Brighter icon on hover for contrast
    },
    iconStyle: {
      default: {
        filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))' // Stronger shadow for white icon on dark bg
      },
      hover: {
        filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4))' // Even stronger shadow on hover
      }
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
      wrapper: "hidden", // Hide the lightning bolt completely
      icon: "w-5 h-5 text-gray-400"
    },
    bottomRight: {
      wrapper: "absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out",
      text: "text-xs text-gray-500 font-medium"
    }
  },
  
  // Helper function to get full card classes
  getCardClasses: function(isHovered, sectionKey, includeAnimation = false, animationDelay = 0) {
    const baseClasses = `${this.container.base} ${isHovered ? this.container.active : this.container.hover}`;
    
    if (includeAnimation) {
      const delayClass = animationDelay > 0 ? `animation-delay-${animationDelay}` : '';
      return `${baseClasses} ${this.container.animated} ${delayClass}`;
    }
    
    return baseClasses;
  },
  
  // Helper function to inject animation CSS (call this once in your component)
  injectAnimationCSS: function() {
    if (typeof document !== 'undefined' && !document.getElementById('info-card-animations')) {
      const style = document.createElement('style');
      style.id = 'info-card-animations';
      style.innerHTML = this.animationCSS;
      document.head.appendChild(style);
    }
  }
};

export default infoCardStyles;