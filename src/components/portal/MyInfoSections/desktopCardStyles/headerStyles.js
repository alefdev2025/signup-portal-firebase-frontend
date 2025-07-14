// Header styles for section headers
const headerStyles = {
  // Main header container
  container: "relative pb-6 mb-6 border-b border-gray-200",
  contentWrapper: "relative z-10 flex justify-between items-start",
  
  // Left side content
  leftContent: "div",
  
  // Icon and text wrapper (uses styleConfig2)
  iconTextWrapper: (styleConfig2) => styleConfig2.header.wrapper,
  
  // Icon container (uses styleConfig2 sectionIcons)
  getIconContainer: (styleConfig2, sectionType) => styleConfig2.sectionIcons[sectionType] || styleConfig2.sectionIcons.contact,
  
  // Icon (uses styleConfig2)
  getIcon: (styleConfig2) => ({
    className: styleConfig2.header.icon,
    strokeWidth: styleConfig2.header.iconStrokeWidth
  }),
  
  // Text content
  textContainer: (styleConfig2) => styleConfig2.header.textContainer,
  title: (styleConfig2) => styleConfig2.header.title,
  subtitle: "text-gray-600 text-base mt-1 sm:text-gray-400 sm:font-light sm:text-sm"
};

export default headerStyles;