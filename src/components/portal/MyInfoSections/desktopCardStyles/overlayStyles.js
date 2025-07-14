// overlayStyles.js - Overlay styles for modal dialogs
import fieldStyles from './fieldStyles';

const overlayStyles = Object.freeze({
  // Main overlay container
  container: "fixed inset-0 z-[100] overflow-y-auto",
  backdrop: "fixed inset-0 bg-black bg-opacity-50",
  
  // Content wrapper
  contentWrapper: "flex min-h-full items-center justify-center p-4",
  contentBox: "relative bg-white rounded-2xl w-full max-w-3xl animate-fadeInUp shadow-xl",
  
  // Header section - Updated for professional look with yellow theme
  header: Object.freeze({
    wrapper: "px-10 py-6 border-b border-gray-100 relative",
    closeButton: "absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2",
    closeIcon: "w-5 h-5",
    content: "flex items-center gap-3",
    iconSection: "flex items-center gap-3",
    iconBox: "p-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50",
    iconBoxBg: Object.freeze({ 
      background: 'linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%)',
      border: '1px solid rgba(139, 92, 246, 0.1)'
    }),
    icon: "w-5 h-5",
    iconColor: Object.freeze({ color: '#7c3aed' }),
    textWrapper: "flex-1",
    title: "text-xl font-semibold text-gray-900",
    // Description moved - no longer in header
    description: "hidden"
  }),
  
  // Body section
  body: Object.freeze({
    wrapper: "px-10 py-8 bg-white",
    successMessage: Object.freeze({
      container: "mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fadeIn",
      icon: "w-5 h-5 text-green-600 flex-shrink-0",
      text: "text-green-800 font-medium"
    }),
    content: "space-y-6",
    // New description section - appears after fields
    description: Object.freeze({
      container: "mt-8 pt-6 border-t border-gray-100",
      text: "text-sm text-gray-600 leading-relaxed"
    })
  }),
  
  // Footer section
  footer: Object.freeze({
    wrapper: "px-10 py-5 border-t border-gray-100 flex justify-end gap-3",
    buttonGroup: "flex gap-2"
  }),
  
  // Display mode styles - NOW USING CENTRAL CONFIG
  displayMode: Object.freeze({
    grid: Object.freeze({
      twoColumn: "grid grid-cols-2 gap-8",
      single: "space-y-6"
    }),
    field: Object.freeze({
      wrapper: fieldStyles.classes.wrapper,
      label: `block ${fieldStyles.classes.label} mb-2`,
      value: `text-lg ${fieldStyles.classes.value}`,
      // Use the central getFieldStyle helper
      getFieldStyle: (isEmpty = false) => fieldStyles.getStyles.value(isEmpty).style,
      note: "mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
    })
  }),
  
  // Edit mode styles
  editMode: Object.freeze({
    grid: Object.freeze({
      twoColumn: "grid grid-cols-2 gap-4",
      single: "space-y-6"
    }),
    readOnly: Object.freeze({
      wrapper: "div",
      label: "block text-sm font-medium text-gray-700 mb-1.5",
      helperText: " text-sm font-normal text-gray-600 ml-2",
      value: "px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600"
    })
  })
});

export default overlayStyles;