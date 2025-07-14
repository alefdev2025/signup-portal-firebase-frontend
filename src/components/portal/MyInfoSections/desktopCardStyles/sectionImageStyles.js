// Section image styles with gradient overlays
const sectionImageStyles = {
    // Container
    wrapper: "flex-shrink-0 ml-8",
    imageBox: "relative w-64 h-24 rounded-lg overflow-hidden shadow-md",
    
    // Image
    image: "w-full h-full object-cover",
    
    // Overlay layers
    overlays: {
      // Dark purple/blue base
      darkBase: {
        className: "absolute inset-0",
        style: {
          background: 'rgba(26, 18, 47, 0.7)'
        }
      },
      
      // Radial yellow glow from bottom
      yellowGlow: {
        className: "absolute inset-0",
        style: {
          background: 'radial-gradient(ellipse 120% 80% at 50% 120%, rgba(255, 215, 0, 0.7) 0%, rgba(255, 184, 0, 0.5) 20%, rgba(255, 140, 0, 0.3) 40%, transparent 70%)'
        }
      },
      
      // Purple/pink glow overlay
      purpleGlow: {
        className: "absolute inset-0",
        style: {
          background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(147, 51, 234, 0.3) 0%, rgba(109, 40, 217, 0.4) 30%, transparent 60%)',
          mixBlendMode: 'screen'
        }
      }
    },
    
    // Star decoration
    star: {
      wrapper: "absolute inset-x-0 bottom-0 h-full flex items-end justify-center pb-1",
      image: "w-24 h-24 opacity-40",
      imageStyle: {
        filter: 'brightness(2) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))',
        transform: 'translateY(50%)'
      }
    },
    
    // Label badge
    label: {
      wrapper: "absolute bottom-0 right-0 z-10",
      container: "px-2.5 py-0.5 bg-gradient-to-r from-[#162740] to-[#6e4376]",
      text: "text-white text-xs font-medium tracking-wider flex items-center gap-1",
      starIcon: "w-3 h-3"
    }
  };
  
  export default sectionImageStyles;