// Configuration for different member categories
export const memberCategoryConfig = {
  BasicMember: {
    sections: {
      contact: { 
        visible: true, 
        editable: true,
        requiredFields: ['firstName', 'lastName', 'personalEmail'] 
      },
      personal: { 
        visible: true, 
        editable: true,
        requiredFields: [] 
      },
      addresses: { 
        visible: true, 
        editable: true,
        requiredFields: ['homeStreet', 'homeCity', 'homeState', 'homePostalCode'] 
      },
      family: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      },
      occupation: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      },
      medical: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      },
      cryoArrangements: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      },
      funding: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      },
      legal: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      },
      nextOfKin: { 
        visible: false, 
        editable: false,
        requiredFields: [] 
      }
    }
  },
  
  CryoApplicant: {
    sections: {
      contact: { 
        visible: true, 
        editable: true,
        requiredFields: ['firstName', 'lastName', 'personalEmail', 'mobilePhone'] 
      },
      personal: { 
        visible: true, 
        editable: true,
        requiredFields: ['gender', 'dateOfBirth'] 
      },
      addresses: { 
        visible: true, 
        editable: true,
        requiredFields: ['homeStreet', 'homeCity', 'homeState', 'homePostalCode'] 
      },
      family: { 
        visible: true, 
        editable: true,
        requiredFields: ['fathersBirthplace', 'mothersBirthplace'] 
      },
      occupation: { 
        visible: true, 
        editable: true,
        requiredFields: [] 
      },
      medical: { 
        visible: true, 
        editable: true,
        requiredFields: [] 
      },
      cryoArrangements: { 
        visible: true, 
        editable: true,
        requiredFields: ['method'] 
      },
      funding: { 
        visible: true, 
        editable: true,
        requiredFields: ['fundingType'] 
      },
      legal: { 
        visible: true, 
        editable: true,
        requiredFields: [] 
      },
      nextOfKin: { 
        visible: true, 
        editable: true,
        requiredFields: ['fullName', 'relationship', 'phone'] 
      }
    }
  },
  
  CryoMember: {
    sections: {
      contact: { 
        visible: true, 
        editable: true,
        requiredFields: ['firstName', 'lastName', 'personalEmail', 'mobilePhone'] 
      },
      personal: { 
        visible: true, 
        editable: true,
        requiredFields: ['gender', 'dateOfBirth', 'ssn'] 
      },
      addresses: { 
        visible: true, 
        editable: true,
        requiredFields: ['homeStreet', 'homeCity', 'homeState', 'homePostalCode', 'mailingStreet', 'mailingCity', 'mailingState', 'mailingPostalCode'] 
      },
      family: { 
        visible: true, 
        editable: true,
        requiredFields: ['fathersName', 'fathersBirthplace', 'mothersMaidenName', 'mothersBirthplace'] 
      },
      occupation: { 
        visible: true, 
        editable: true,
        requiredFields: ['occupation'] 
      },
      medical: { 
        visible: true, 
        editable: true,
        requiredFields: ['medicalConditions'] 
      },
      cryoArrangements: { 
        visible: true, 
        editable: false,  // CryoMembers cannot edit their cryo arrangements
        requiredFields: ['method', 'remainsHandling', 'publicDisclosure'] 
      },
      funding: { 
        visible: true, 
        editable: false,  // CryoMembers cannot edit their funding
        requiredFields: ['fundingType'] 
      },
      legal: { 
        visible: true, 
        editable: true,
        requiredFields: ['hasWill'] 
      },
      nextOfKin: { 
        visible: true, 
        editable: true,
        requiredFields: ['fullName', 'relationship', 'phone', 'email'] 
      }
    }
  }
};

// Helper function to check if a field is required
export const isFieldRequired = (category, section, field) => {
  const config = memberCategoryConfig[category];
  if (!config || !config.sections[section]) return false;
  return config.sections[section].requiredFields.includes(field);
};

// Helper function to check if a section is visible
export const isSectionVisible = (category, section) => {
  const config = memberCategoryConfig[category];
  if (!config || !config.sections[section]) return false;
  return config.sections[section].visible;
};

// Helper function to check if a section is editable
export const isSectionEditable = (category, section) => {
  const config = memberCategoryConfig[category];
  if (!config || !config.sections[section]) return false;
  // Default to true if editable is not specified (backward compatibility)
  return config.sections[section].editable !== false;
};