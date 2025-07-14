// fontStyleConfig.js
// Last updated: timestamp to force rebuild
const fontStyleConfig = {
    // Font weights for different elements
    fontWeights: {
      // Labels and headers
      sectionTitle: '400',          // Main section headers
      cardTitle: '600',             // Card headers
      fieldLabel: '500',            // Field labels
      
      // Values and content
      fieldValue: '900',            // User data values (bold)
      emptyValue: '500',            // Empty state values (medium)
      displayText: '400',           // General display text
      
      // Buttons and actions
      buttonText: '500',            // Button labels
      linkText: '500',              // Clickable links
      
      // Status and messages
      successMessage: '500',        // Success notifications
      errorMessage: '500',          // Error messages
      
      // Form inputs
      inputText: '400',             // Text in input fields
      placeholderText: '300',       // Placeholder text
    },
    
    // Font sizes
    fontSizes: {
      sectionTitle: 'text-2xl',
      cardTitle: 'text-sm',
      fieldLabel: 'text-xs',
      fieldValue: 'text-sm',
      displayText: 'text-base',
      buttonText: 'text-sm',
    },
    
    // Text colors
    textColors: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500',
      placeholder: 'text-gray-400',
      empty: 'text-gray-400',
      error: 'text-red-600',
      success: 'text-green-800',
    },
    
    // Additional text styles
    textStyles: {
      uppercase: 'uppercase',
      tracking: 'tracking-wider',
      letterSpacing: {
        tight: 'tracking-tight',
        normal: 'tracking-normal',
        wide: 'tracking-wide',
        wider: 'tracking-wider',
        widest: 'tracking-widest',
      }
    },
    
    // Helper functions to get complete styles
    getFieldLabelStyle: () => ({
      className: `${fontStyleConfig.fontSizes.fieldLabel} ${fontStyleConfig.textColors.muted} ${fontStyleConfig.textStyles.uppercase} ${fontStyleConfig.textStyles.tracking}`,
      style: { fontWeight: fontStyleConfig.fontWeights.fieldLabel }
    }),
    
    getFieldValueStyle: (isEmpty = false) => ({
      className: `${fontStyleConfig.fontSizes.fieldValue} ${isEmpty ? fontStyleConfig.textColors.empty : fontStyleConfig.textColors.primary}`,
      style: { fontWeight: isEmpty ? fontStyleConfig.fontWeights.emptyValue : fontStyleConfig.fontWeights.fieldValue }
    }),
    
    getCardTitleStyle: () => ({
      className: `${fontStyleConfig.fontSizes.cardTitle} ${fontStyleConfig.textStyles.uppercase} ${fontStyleConfig.textStyles.tracking} ${fontStyleConfig.textColors.primary}`,
      style: { fontWeight: fontStyleConfig.fontWeights.cardTitle }
    }),
    
    // CSS string for injection (if needed)
    generateCSS: () => `
      .field-value {
        font-weight: ${fontStyleConfig.fontWeights.fieldValue} !important;
      }
      .field-label {
        font-weight: ${fontStyleConfig.fontWeights.fieldLabel} !important;
      }
      .card-title {
        font-weight: ${fontStyleConfig.fontWeights.cardTitle} !important;
      }
      .empty-value {
        font-weight: ${fontStyleConfig.fontWeights.emptyValue} !important;
      }
    `
  };
  
  export default fontStyleConfig;