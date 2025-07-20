// animationStyles.js
const animationStyles = {
  // CSS to be injected
  getAnimationCSS: () => `
    .contact-info-section {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    /* Remove the global font-weight override */
    .contact-info-section .font-bold,
    .contact-info-section .font-semibold {
      font-weight: 500 !important;
    }
    .contact-info-section .font-bold {
      font-weight: 700 !important;
    }
    .contact-info-section h1 {
      font-weight: 300 !important;
    }
    .contact-info-section h2,
    .contact-info-section h3,
    .contact-info-section h4 {
      font-weight: 400 !important;
    }
    .contact-info-section .font-medium {
      font-weight: 400 !important;
    }
    
    /* Original animations */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Updated spin animation - slower (1.5s) and single rotation */
    @keyframes spinOnce {
      from { 
        transform: rotate(0deg);
        -webkit-transform: rotate(0deg);
      }
      to { 
        transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
      }
    }
    
    /* Single slow spin for overlay buttons */
    @keyframes spinOnceSlow {
      from { 
        transform: rotate(0deg);
        -webkit-transform: rotate(0deg);
      }
      to { 
        transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
      }
    }
    
    .animate-slideIn {
      animation: slideIn 0.3s ease-out;
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
    .animate-fadeInUp {
      animation: fadeIn 0.3s ease-out, slideIn 0.3s ease-out;
    }
    
    /* Star spin on button hover - Safari optimized */
    .spin-star-button {
      /* Prepare for GPU acceleration */
      will-change: transform;
    }
    
    .spin-star-button img {
      /* Safari optimization */
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      will-change: transform;
      transition: transform 0.5s ease-in-out;
      -webkit-transition: -webkit-transform 0.5s ease-in-out;
      pointer-events: none; /* Prevent the star from interfering with hover */
    }
    
    .spin-star-button:hover img {
      transform: rotate(180deg);
      -webkit-transform: rotate(180deg);
    }
    
    /* Single slow spin for overlay buttons - same speed as regular buttons */
    .spin-star-button-once-slow img {
      transition: transform 0.5s ease-in-out;
      -webkit-transition: -webkit-transform 0.5s ease-in-out;
      pointer-events: none;
    }
    
    .spin-star-button-once-slow:hover img {
      transform: rotate(180deg);
      -webkit-transform: rotate(180deg);
    }
    
    /* Prevent animation restart on Safari */
    .spin-star-button:not(:hover) img,
    .spin-star-button-once-slow:not(:hover) img {
      animation: none;
      -webkit-animation: none;
    }
    
    /* NEW: Card entrance animations */
    .card-animate {
      opacity: 0;
      transform: translateY(30px) scale(0.97);
    }
    
    .card-animate.visible {
      animation: cardSlideIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    /* Staggered delays for cards in grid */
    .card-stagger-1 { animation-delay: 0.1s; }
    .card-stagger-2 { animation-delay: 0.2s; }
    .card-stagger-3 { animation-delay: 0.3s; }
    .card-stagger-4 { animation-delay: 0.4s; }
    .card-stagger-5 { animation-delay: 0.5s; }
    .card-stagger-6 { animation-delay: 0.6s; }
    
    /* Field animations inside cards */
    .field-animate {
      opacity: 0;
      transform: translateX(-15px);
    }
    
    .card-animate.visible .field-animate {
      animation: fieldFadeIn 0.5s ease-out forwards;
    }
    
    /* Staggered delays for fields within each card */
    .card-animate.visible .field-stagger-1 { animation-delay: 0.4s; }
    .card-animate.visible .field-stagger-2 { animation-delay: 0.5s; }
    .card-animate.visible .field-stagger-3 { animation-delay: 0.6s; }
    .card-animate.visible .field-stagger-4 { animation-delay: 0.7s; }
    
    /* Keyframes for cards */
    @keyframes cardSlideIn {
      0% {
        opacity: 0;
        transform: translateY(30px) scale(0.97);
      }
      60% {
        opacity: 1;
        transform: translateY(-2px) scale(1);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* Keyframes for fields */
    @keyframes fieldFadeIn {
      from {
        opacity: 0;
        transform: translateX(-15px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    /* Hover lift effect for cards */
    .card-hover-lift {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                  box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-hover-lift:hover {
      transform: translateY(-6px);
    }
    
    /* Smooth transitions for interactive elements */
    .smooth-transition {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Scroll trigger specific styles */
    .scroll-trigger-section {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .scroll-trigger-section.in-view {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  // Animation class names
  classes: {
    // Original classes
    fadeIn: "animate-fadeIn",
    slideIn: "animate-slideIn",
    fadeInUp: "animate-fadeInUp",
    spinButton: "spin-star-button",
    
    // New card animation classes
    cardAnimate: "card-animate",
    cardVisible: "visible",
    cardHoverLift: "card-hover-lift",
    smoothTransition: "smooth-transition",
    
    // Field animation classes
    fieldAnimate: "field-animate",
    
    // Scroll trigger classes
    scrollTriggerSection: "scroll-trigger-section",
    inView: "in-view",
    
    // Stagger classes
    getCardStagger: (index) => `card-stagger-${index}`,
    getFieldStagger: (index) => `field-stagger-${index}`
  },
  
  // Helper functions
  helpers: {
    // Get card animation classes with stagger
    getCardAnimationClasses: (index, isVisible) => {
      const staggerClass = animationStyles.classes.getCardStagger(Math.min(index + 1, 6));
      return `${animationStyles.classes.cardAnimate} ${staggerClass} ${isVisible ? animationStyles.classes.cardVisible : ''} ${animationStyles.classes.cardHoverLift}`;
    },
    
    // Get field animation classes with stagger
    getFieldAnimationClasses: (index) => {
      const staggerClass = animationStyles.classes.getFieldStagger(Math.min(index + 1, 4));
      return `${animationStyles.classes.fieldAnimate} ${staggerClass}`;
    },
    
    // Create intersection observer for scroll animations
    createScrollObserver: (callback, options = {}) => {
      const defaultOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options
      };
      
      return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry.target);
          }
        });
      }, defaultOptions);
    },
    
    // Setup scroll trigger for a section
    setupScrollTrigger: (sectionRef, onInView) => {
      if (!sectionRef.current) return null;
      
      const observer = animationStyles.helpers.createScrollObserver((target) => {
        target.classList.add(animationStyles.classes.inView);
        onInView && onInView();
        // Optionally disconnect after first trigger
        // observer.disconnect();
      });
      
      observer.observe(sectionRef.current);
      
      return observer;
    }
  },
  
  // Helper to inject styles
  injectStyles: () => {
    const style = document.createElement('style');
    style.innerHTML = animationStyles.getAnimationCSS();
    document.head.appendChild(style);
    return style;
  }
};

export default animationStyles;