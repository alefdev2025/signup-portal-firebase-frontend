// Modern Contact Info Section Styles
export const modernContactStyles = {
  // Container styles
  container: {
    wrapper: "relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50",
    inner: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
  },

  // Hero section with glassmorphism
  hero: {
    wrapper: "relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-[2px] mb-12",
    inner: "relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-12",
    backgroundPattern: "absolute inset-0 opacity-10",
    content: "relative z-10",
    title: "text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4",
    subtitle: "text-lg sm:text-xl text-gray-600 max-w-2xl"
  },

  // Modern card grid
  cardGrid: {
    container: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8",
    card: {
      wrapper: "group relative transform transition-all duration-500 hover:scale-105",
      backgroundGradient: "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl",
      inner: "relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500",
      glow: "absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-75 rounded-2xl blur transition-opacity duration-500"
    }
  },

  // Card gradients by type
  gradients: {
    personal: "from-blue-400 to-cyan-400",
    phone: "from-purple-400 to-pink-400", 
    email: "from-indigo-400 to-purple-400"
  },

  // Card header styles
  cardHeader: {
    wrapper: "flex items-center justify-between mb-6",
    titleGroup: "flex items-center gap-3",
    iconWrapper: "relative",
    iconGradient: "absolute inset-0 bg-gradient-to-br rounded-xl opacity-20 blur-md",
    iconContainer: "relative w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center transform transition-transform group-hover:rotate-12",
    icon: "w-6 h-6 text-white",
    title: "text-xl font-semibold text-gray-800",
    editIndicator: "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
    editIcon: "w-5 h-5 text-gray-400"
  },

  // Field styles
  fields: {
    container: "space-y-4",
    item: {
      wrapper: "relative",
      label: "text-sm font-medium text-gray-500 mb-1",
      value: "text-base font-semibold text-gray-900",
      emptyValue: "text-gray-400 italic",
      divider: "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"
    }
  },

  // Edit mode styles
  editMode: {
    container: "bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-inner",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-6",
    inputWrapper: "relative group",
    input: "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300",
    inputFocused: "shadow-lg",
    label: "absolute -top-2.5 left-3 px-2 bg-white text-sm font-medium text-gray-600 transition-all duration-300",
    error: "border-red-300 focus:ring-red-500"
  },

  // Modern button styles
  buttons: {
    container: "flex items-center justify-end gap-4 mt-8",
    primary: "relative group px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300",
    primaryGlow: "absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300",
    secondary: "px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-300",
    disabled: "opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none"
  },

  // Overlay styles
  overlay: {
    backdrop: "fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300",
    container: "fixed inset-0 z-50 flex items-center justify-center p-4",
    modal: {
      wrapper: "relative w-full max-w-2xl max-h-[90vh] overflow-hidden",
      gradient: "absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-[2px]",
      inner: "relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl",
      content: "relative max-h-[calc(90vh-8rem)] overflow-y-auto"
    },
    header: {
      wrapper: "sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-6 sm:p-8",
      closeButton: "absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-300",
      closeIcon: "w-5 h-5 text-gray-600",
      content: "pr-12",
      iconSection: "flex items-start gap-4",
      iconGradient: "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg",
      icon: "w-8 h-8 text-white",
      title: "text-2xl font-bold text-gray-900 mb-2",
      description: "text-gray-600"
    },
    body: {
      wrapper: "p-6 sm:p-8",
      successMessage: "mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3",
      successIcon: "w-6 h-6 text-green-600",
      successText: "text-green-800 font-medium"
    },
    footer: {
      wrapper: "sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-6 sm:p-8"
    }
  },

  // Animations
  animations: {
    fadeIn: "animate-fadeIn",
    slideUp: "animate-slideUp",
    scaleIn: "animate-scaleIn",
    float: "animate-float"
  },

  // Mobile specific
  mobile: {
    card: "bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6",
    header: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl p-6",
    content: "p-6",
    actionBar: "sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4"
  }
};

// Animation keyframes to inject
export const animationKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.6s ease-out;
  }
  
  .animate-scaleIn {
    animation: scaleIn 0.5s ease-out;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

// Gradient color configurations for cards
export const cardGradients = {
  personal: {
    gradient: "from-blue-500 to-cyan-500",
    lightGradient: "from-blue-400 to-cyan-400",
    iconBg: "from-blue-600 to-cyan-600"
  },
  phone: {
    gradient: "from-purple-500 to-pink-500",
    lightGradient: "from-purple-400 to-pink-400",
    iconBg: "from-purple-600 to-pink-600"
  },
  email: {
    gradient: "from-indigo-500 to-purple-500",
    lightGradient: "from-indigo-400 to-purple-400",
    iconBg: "from-indigo-600 to-purple-600"
  }
};