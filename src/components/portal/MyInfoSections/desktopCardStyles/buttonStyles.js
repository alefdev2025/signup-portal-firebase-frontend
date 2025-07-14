// Button styles and configurations
const buttonStyles = {
    // Button group container
    actionContainer: "flex justify-end mt-6 -mr-8",
    buttonGroup: "flex",
    
    // Button specific classes
    whiteButton: {
      base: "scale-75 spin-star-button",
      withMargin: "scale-75 -mr-8 spin-star-button"
    },
    
    purpleButton: {
      base: "scale-75 spin-star-button"
    },
    
    // Overlay button styles
    overlayButtons: {
      cancel: "!w-36 !py-2 [&>div>span]:!text-xs [&_img]:!w-6 [&_img]:!h-6 [&_img]:!-right-2 spin-star-button",
      save: "!w-36 !py-2 [&>div>span]:!text-xs [&_img]:!w-6 [&_img]:!h-6 [&_img]:!-right-2 ml-2 spin-star-button"
    },
    
    // Button text helpers
    getSaveButtonText: (savingSection) => {
      if (savingSection === 'saved') return 'Saved';
      if (savingSection === 'contact') return 'Saving...';
      return 'Save';
    },
    
    // Star spin configuration
    starConfig: {
      enabled: true,
      className: "spin-star-button"
    }
  };
  
  export default buttonStyles;