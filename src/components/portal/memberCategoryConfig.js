// Configuration for different member categories
export const memberCategoryConfig = {
  BasicMember: {
    sections: {
      contact: { visible: true, requiredFields: ['firstName', 'lastName', 'personalEmail'] },
      personal: { visible: true, requiredFields: [] },
      addresses: { visible: true, requiredFields: ['homeStreet', 'homeCity', 'homeState', 'homePostalCode'] },
      family: { visible: false, requiredFields: [] },
      occupation: { visible: false, requiredFields: [] },
      medical: { visible: false, requiredFields: [] },
      cryoArrangements: { visible: false, requiredFields: [] },
      funding: { visible: false, requiredFields: [] },
      legal: { visible: false, requiredFields: [] },
      nextOfKin: { visible: false, requiredFields: [] }
    }
  },
  
  CryoApplicant: {
    sections: {
      contact: { visible: true, requiredFields: ['firstName', 'lastName', 'personalEmail', 'mobilePhone'] },
      personal: { visible: true, requiredFields: ['gender', 'dateOfBirth'] },
      addresses: { visible: true, requiredFields: ['homeStreet', 'homeCity', 'homeState', 'homePostalCode'] },
      family: { visible: true, requiredFields: ['fathersBirthplace', 'mothersBirthplace'] },
      occupation: { visible: true, requiredFields: [] },
      medical: { visible: true, requiredFields: [] },
      cryoArrangements: { 
        visible: true, 
        editable: true,  // ADD THIS
        requiredFields: ['method'] 
      },
      funding: { visible: true, requiredFields: [] },
      legal: { visible: true, requiredFields: [] },
      nextOfKin: { visible: true, requiredFields: ['fullName', 'relationship', 'phone'] }
    }
  },
  
  CryoMember: {
    sections: {
      contact: { visible: true, requiredFields: ['firstName', 'lastName', 'personalEmail', 'mobilePhone'] },
      personal: { visible: true, requiredFields: ['gender', 'dateOfBirth', 'ssn'] },
      addresses: { visible: true, requiredFields: ['homeStreet', 'homeCity', 'homeState', 'homePostalCode', 'mailingStreet', 'mailingCity', 'mailingState', 'mailingPostalCode'] },
      family: { visible: true, requiredFields: ['fathersName', 'fathersBirthplace', 'mothersMaidenName', 'mothersBirthplace'] },
      occupation: { visible: true, requiredFields: ['occupation'] },
      medical: { visible: true, requiredFields: ['medicalConditions'] },
      cryoArrangements: { 
        visible: true, 
        editable: false,  // ADD THIS - CryoMembers can see but not edit
        requiredFields: ['method', 'remainsHandling', 'publicDisclosure'] 
      },
      funding: { visible: true, requiredFields: ['fundingType'] },
      legal: { visible: true, requiredFields: ['hasWill'] },
      nextOfKin: { visible: true, requiredFields: ['fullName', 'relationship', 'phone', 'email'] }
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

// ADD THIS NEW HELPER FUNCTION
// Helper function to check if a section is editable
export const isSectionEditable = (category, section) => {
  const config = memberCategoryConfig[category];
  if (!config || !config.sections[section]) return false;
  // If editable is not specified, default to true (for backward compatibility)
  return config.sections[section].editable !== false;
};