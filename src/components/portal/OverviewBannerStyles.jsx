// Banner background and gradient styles
export const bannerStyles = {
  container: {
    animation: 'fadeIn 0.8s ease-in-out',
    height: '260px' // Slightly reduced height for better proportion
  },
  
  backgroundImage: {
    backgroundSize: '120%',  // Zoomed in to 120% (was 110%)
    backgroundPosition: '50% 70%',  // Moved left to 50% (was 60%)
    backgroundRepeat: 'no-repeat',
    opacity: 0.8
  },
  
  mainGradient: {
    background: `linear-gradient(to right, 
      #1a2744 0%, 
      #243456 15%, 
      #2e4168 30%, 
      #384e7a 45%, 
      #425686 55%,
      rgba(56, 78, 122, 0.9) 60%,
      rgba(56, 78, 122, 0.7) 65%,
      rgba(56, 78, 122, 0.4) 70%,
      rgba(56, 78, 122, 0.2) 75%,
      rgba(56, 78, 122, 0.05) 80%,
      transparent 85%)`
  },
  
  rightGradientOverlay: {
    background: `linear-gradient(160deg, 
      transparent 0%,
      transparent 40%,
      rgba(75, 56, 101, 0.3) 45%,
      rgba(93, 68, 128, 0.4) 50%,
      rgba(108, 85, 120, 0.5) 55%,
      rgba(123, 86, 112, 0.6) 60%,
      rgba(138, 95, 100, 0.7) 65%,
      rgba(153, 107, 102, 0.8) 70%,
      rgba(174, 121, 104, 0.85) 75%,
      rgba(194, 135, 106, 0.9) 80%,
      rgba(212, 168, 95, 0.95) 85%,
      rgba(221, 181, 113, 1) 87.5%,
      rgba(228, 192, 132, 1) 90%,
      rgba(233, 202, 150, 1) 92.5%,
      rgba(239, 211, 168, 1) 95%,
      rgba(247, 221, 181, 1) 97.5%,
      rgba(255, 212, 163, 1) 100%)`,
    opacity: 0.9
  },
  
  vignetteOverlay: {
    background: `radial-gradient(ellipse at 80% 50%, transparent 30%, rgba(0,0,0,0.3) 100%)`
  }
};

// Keyframe animation as a CSS string
export const fadeInAnimation = `
  @keyframes fadeIn {
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