// File: utils/contactFormData.js

// Initial form data structure
export const createInitialFormData = () => ({
  firstName: "",
  lastName: "",
  sex: "",
  dateOfBirth: "",
  birthMonth: "",
  birthDay: "",
  birthYear: "",
  streetAddress: "",
  city: "",
  cnty_hm: "",
  region: "",
  postalCode: "",
  country: "United States",
  sameMailingAddress: "",
  mailingStreetAddress: "",
  mailingCity: "",
  cnty_ml: "",
  mailingRegion: "",
  mailingPostalCode: "",
  mailingCountry: "United States",
  email: "",
  phoneType: "",
  mobilePhone: "",
  workPhone: "",
  homePhone: "",
  memberDisclosure: "",
  applyCryopreservation: ""
});

// Initial errors structure
export const createInitialErrors = () => ({
  firstName: "",
  lastName: "",
  sex: "",
  dateOfBirth: "",
  birthMonth: "",
  birthDay: "",
  birthYear: "",
  streetAddress: "",
  city: "",
  cnty_hm: "",
  region: "",
  postalCode: "",
  country: "",
  sameMailingAddress: "",
  mailingStreetAddress: "",
  mailingCity: "",
  cnty_ml: "",
  mailingRegion: "",
  mailingPostalCode: "",
  mailingCountry: "",
  email: "",
  phoneType: "",
  mobilePhone: "",
  workPhone: "",
  homePhone: "",
  memberDisclosure: "",
  applyCryopreservation: ""
});

// Function to update the combined date field
export const updateCombinedDateOfBirth = (month, day, year, setFormData) => {
  // Only combine if all parts are present
  if (month && day && year) {
    const formattedDate = `${month}/${day}/${year}`;
    setFormData(prev => ({
      ...prev,
      dateOfBirth: formattedDate
    }));
  }
};

// Parse date of birth into separate fields
export const parseDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return { birthMonth: "", birthDay: "", birthYear: "" };
  
  const parts = dateOfBirth.split('/');
  if (parts.length === 3) {
    return {
      birthMonth: parts[0],
      birthDay: parts[1],
      birthYear: parts[2]
    };
  }
  return { birthMonth: "", birthDay: "", birthYear: "" };
};

// Handle same mailing address logic
export const handleSameMailingAddress = (value, formData) => {
  if (value === "Yes") {
    return {
      mailingStreetAddress: formData.streetAddress,
      mailingCity: formData.city,
      cnty_ml: formData.cnty_hm,
      mailingRegion: formData.region,
      mailingPostalCode: formData.postalCode,
      mailingCountry: formData.country
    };
  }
  return {};
};

// Handle address selection data
export const processAddressData = (addressData, isMailingAddress = false) => {
  const prefix = isMailingAddress ? 'mailing' : '';
  const countyField = isMailingAddress ? 'cnty_ml' : 'cnty_hm';
  
  const processedData = {};
  processedData[`${prefix}StreetAddress`] = addressData.streetAddress || addressData.formattedAddress;
  processedData[`${prefix}City`] = addressData.city || "";
  processedData[`${prefix}Region`] = addressData.region || addressData.regionShort || "";
  processedData[`${prefix}PostalCode`] = addressData.postalCode || "";
  processedData[`${prefix}Country`] = addressData.country || "United States";
  processedData[countyField] = ""; // Always set county to empty string
  
  return processedData;
};