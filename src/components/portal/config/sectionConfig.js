// config/sectionConfig.js
import dewarsImage from '../../../assets/images/dewars2.jpg';
import contactImage from '../../../assets/images/contact-image.jpg';
import personalInfoImage from '../../../assets/images/personal-info.jpg';
import addressesImage from '../../../assets/images/home-address.png';
import familyImage from '../../../assets/images/family-info.jpg';
import occupationImage from '../../../assets/images/occupation.jpg';
import healthImage from '../../../assets/images/health-building.jpg';
import fundingImage from '../../../assets/images/financial.png';
import legalImage from '../../../assets/images/computer-table.jpg';
import contractsImage from '../../../assets/images/contracts.jpg';
import emergencyContactImage from '../../../assets/images/emergency-contact.jpg';

export const sectionImages = {
  contact: contactImage,
  personal: personalInfoImage,
  addresses: addressesImage,
  family: familyImage,
  occupation: occupationImage,
  medical: healthImage,
  cryoArrangements: contractsImage,
  funding: fundingImage,
  legal: legalImage,
  nextOfKin: emergencyContactImage
};

export const sectionLabels = {
  contact: "CONTACT",
  personal: "PERSONAL",
  addresses: "ADDRESSES",
  family: "FAMILY",
  occupation: "OCCUPATION",
  medical: "MEDICAL",
  cryoArrangements: "CRYO",
  funding: "FUNDING",
  legal: "LEGAL",
  nextOfKin: "EMERGENCY"
};