// fieldStyles.js - CENTRAL configuration for ALL field styles across the entire application
// Change these values ONCE and they apply EVERYWHERE

const fieldStyles = {
    // Raw values - change these to control all fields
    weights: {
      label: 500,        // Label weight (medium)
      value: 400,        // Value weight (normal - not bold)
      emptyValue: 400    // Empty value weight
    },
    
    // Classes
    classes: {
      wrapper: "space-y-1",
      label: "text-sm text-gray-400 tracking-wider",  // Changed from text-gray-500 to text-gray-400
      value: "text-base text-gray-800",
      emptyValue: "text-gray-400"
    },
    
    // Helper functions that return complete styles
    getStyles: {
      label: () => ({
        className: fieldStyles.classes.label,
        style: { fontWeight: fieldStyles.weights.label }
      }),
      
      value: (isEmpty = false) => ({
        className: `${fieldStyles.classes.value} ${isEmpty ? fieldStyles.classes.emptyValue : ''}`,
        style: { fontWeight: isEmpty ? fieldStyles.weights.emptyValue : fieldStyles.weights.value }
      }),
      
      wrapper: () => fieldStyles.classes.wrapper
    }
  };
  
  export default fieldStyles;