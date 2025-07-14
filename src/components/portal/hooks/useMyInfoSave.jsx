// hooks/useMyInfoSave.js
import { useState } from 'react';
import { 
  updateMemberPersonalInfo,
  updateMemberContactInfo,
  updateMemberAddresses,
  updateMemberFamilyInfo,
  updateMemberOccupation,
  updateMemberMedicalInfo,
  updateMemberCryoArrangements,
  updateMemberLegalInfo,
  updateMemberFundingInfo,
  getMemberNextOfKin as getMemberEmergencyContacts,
  createMemberNextOfKin as createMemberEmergencyContact,
  updateMemberNextOfKin as updateMemberEmergencyContact,
  deleteMemberNextOfKin as deleteMemberEmergencyContact
} from '../services/salesforce/memberInfo';

import { 
  cleanDataBeforeSave,
  cleanPersonData,
  formatPersonName,
  formatEmail,
  formatPhone,
  formatCity,
  cleanString,
  formatStreetAddress,
  formatStateProvince,
  formatPostalCode,
  formatCountry,
  cleanComments,
  formatRelationship
} from '../utils/dataFormatting';

import { memberCategoryConfig } from '../memberCategoryConfig';

export const useMyInfoSave = ({
  salesforceContactId,
  memberCategory,
  setSaveMessage,
  setFieldErrors,
  refreshMemberInfo,
  // Data and setters
  personalInfo,
  setPersonalInfo,
  contactInfo,
  setContactInfo,
  addresses,
  setAddresses,
  familyInfo,
  setFamilyInfo,
  occupation,
  setOccupation,
  medicalInfo,
  setMedicalInfo,
  cryoArrangements,
  setCryoArrangements,
  funding,
  setFunding,
  legal,
  setLegal,
  nextOfKinList,
  setNextOfKinList,
  originalData,
  setEditMode,
  memberDataService
}) => {
  const [savingSection, setSavingSection] = useState('');

  // Helper functions
  const mapRemainsHandlingToSF = (value) => {
    switch(value) {
      case 'Return':
        return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains and the delivery of such cremated materials to a named person/entity.";
      case 'Donate':
        return "Alcor Cremation and Disposition of Cryopreservation Member's Non-Cryopreserved Human Remains with disposal or retainage thereof in Alcor's sole discretion, with possible use for research or tissue donation.";
      default:
        return null;
    }
  };

  const mapPublicDisclosureToSF = (value) => {
    switch(value) {
      case 'Freely':
        return "I give Alcor permission to freely release my name and related Alcor membership status at its discretion";
      case 'BeforeDeath':
        return "Alcor is to make reasonable efforts to maintain confidentiality of my information, subject to Alcor's General Terms and Conditions.";
      default:
        return null;
    }
  };

  // Save Personal Info
  const savePersonalInfo = async () => {
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('personal');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.personal?.requiredFields || [];
      const cleanedData = cleanDataBeforeSave(personalInfo, 'personal');
      
      // Validate required fields
      const errors = {};
      requiredFields.forEach(field => {
        switch(field) {
          case 'gender':
            if (!cleanedData.gender) errors.gender = 'Gender is required';
            break;
          case 'dateOfBirth':
            if (!cleanedData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
            break;
          case 'ssn':
            if (!cleanedData.ssn || cleanedData.ssn.includes('XXX')) {
              errors.ssn = memberCategory === 'CryoMember' 
                ? 'SSN is required for Cryopreservation Members' 
                : 'SSN is recommended';
            }
            break;
        }
      });
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = 'Please fill in required fields: ' + Object.values(errors).join(', ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        setPersonalInfo(previousPersonalInfo);
        return;
      }
      
      const result = await updateMemberPersonalInfo(salesforceContactId, cleanedData);
      
      if (!result.success && !result.partialSuccess) {
        setPersonalInfo(previousPersonalInfo);
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save personal information' });
        setSavingSection('');
        return;
      }
      
      if (result.partialSuccess) {
        const errorDetails = result.errors ? result.errors.join('; ') : '';
        setSaveMessage({ 
          type: 'warning', 
          text: `Some information was saved, but there were errors: ${errorDetails}` 
        });
      } else {
        setSaveMessage({ type: 'success', text: 'Personal information saved successfully!' });
      }
      
      setPersonalInfo(cleanedData);
      originalData.personal = cleanedData;
      setEditMode(prev => ({ ...prev, personal: false }));
      
      memberDataService.clearCache(salesforceContactId);
      
      // Fetch fresh data
      try {
        const freshData = await memberDataService.getPersonalInfo(salesforceContactId);
        if (freshData.success && freshData.data) {
          const personalData = freshData.data.data || freshData.data;
          const cleanedPersonal = cleanPersonData(personalData);
          setPersonalInfo(cleanedPersonal);
          originalData.personal = cleanedPersonal;
        }
      } catch (refreshError) {
        console.error('Error refreshing personal data:', refreshError);
      }
      
      if (refreshMemberInfo) {
        setTimeout(() => refreshMemberInfo(), 500);
      }
      
    } catch (error) {
      console.error('Error in savePersonalInfo:', error);
      setPersonalInfo(previousPersonalInfo);
      setSaveMessage({ type: 'error', text: `Failed to save: ${error.message}` });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Contact Info
  const saveContactInfo = async () => {
    const previousContactInfo = { ...contactInfo };
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('contact');
    setSaveMessage({ type: '', text: '' });
    setFieldErrors({});
    
    try {
      if (!salesforceContactId) {
        setSaveMessage({ type: 'error', text: 'Contact ID not found. Please refresh the page.' });
        setSavingSection('');
        return;
      }
      
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.contact?.requiredFields || [];
      
      const cleanedContactData = cleanDataBeforeSave(contactInfo, 'contact');
      const cleanedPersonalData = cleanDataBeforeSave(personalInfo, 'personal');
      
      const contactData = {
        email: cleanedContactData.personalEmail || '',
        personalEmail: cleanedContactData.personalEmail || '',
        workEmail: cleanedContactData.workEmail || '',
        homePhone: cleanedContactData.homePhone || '',
        mobilePhone: cleanedContactData.mobilePhone || '',
        workPhone: cleanedContactData.workPhone || '',
        preferredPhone: cleanedContactData.preferredPhone || ''
      };
      
      const personalData = {
        firstName: cleanedPersonalData.firstName || '',
        middleName: cleanedPersonalData.middleName || '',
        lastName: cleanedPersonalData.lastName || ''
      };
      
      // Check if anything changed
      const contactChanged = JSON.stringify(contactData) !== JSON.stringify({
        email: originalData.contact.personalEmail || '',
        personalEmail: originalData.contact.personalEmail || '',
        workEmail: originalData.contact.workEmail || '',
        homePhone: originalData.contact.homePhone || '',
        mobilePhone: originalData.contact.mobilePhone || '',
        workPhone: originalData.contact.workPhone || '',
        preferredPhone: originalData.contact.preferredPhone || ''
      });
      
      const personalChanged = personalData.firstName !== (originalData.personal.firstName || '') || 
                             personalData.middleName !== (originalData.personal.middleName || '') ||
                             personalData.lastName !== (originalData.personal.lastName || '');
      
      if (!contactChanged && !personalChanged) {
        setSavingSection('saved');
        setEditMode(prev => ({ ...prev, contact: false }));
        setTimeout(() => setSavingSection(''), 2000);
        return;
      }
      
      // Validate
      const errors = {};
      
      requiredFields.forEach(field => {
        switch(field) {
          case 'firstName':
            if (!personalData.firstName) errors.firstName = 'First name is required';
            break;
          case 'lastName':
            if (!personalData.lastName) errors.lastName = 'Last name is required';
            break;
          case 'personalEmail':
            if (!contactData.personalEmail) errors.personalEmail = 'Personal email is required';
            break;
        }
      });
      
      if (contactData.personalEmail && !contactData.personalEmail.includes('@')) {
        errors.personalEmail = 'Please enter a valid email address';
      }
      
      if (contactData.workEmail && !contactData.workEmail.includes('@')) {
        errors.workEmail = 'Please enter a valid work email address';
      }
      
      if (!contactData.preferredPhone) {
        errors.preferredPhone = 'Please select a preferred phone type';
      } else {
        const phoneTypeToField = {
          'Mobile': 'mobilePhone',
          'Home': 'homePhone',
          'Work': 'workPhone'
        };
        
        const requiredPhoneField = phoneTypeToField[contactData.preferredPhone];
        if (requiredPhoneField && !contactData[requiredPhoneField]) {
          errors[requiredPhoneField] = `${contactData.preferredPhone} phone is required when selected as preferred`;
        }
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSavingSection('');
        return;
      }
      
      // Make API calls
      const calls = [];
      if (contactChanged) {
        calls.push(updateMemberContactInfo(salesforceContactId, contactData));
      }
      if (personalChanged) {
        calls.push(updateMemberPersonalInfo(salesforceContactId, personalData));
      }
      
      const results = await Promise.all(calls);
      const allSuccessful = results.every(result => result.success);
      
      if (!allSuccessful) {
        setContactInfo(previousContactInfo);
        setPersonalInfo(previousPersonalInfo);
        
        let hasFieldError = false;
        const fieldErrorsToSet = {};
        
        results.forEach((result) => {
          if (!result.success && result.error) {
            if (result.error.toLowerCase().includes('email') && result.error.toLowerCase().includes('valid')) {
              fieldErrorsToSet.personalEmail = 'Please enter a valid email address';
              hasFieldError = true;
            }
          }
        });
        
        if (hasFieldError) {
          setFieldErrors(fieldErrorsToSet);
          setSavingSection('');
          return;
        }
        
        const errors = results
          .filter(result => !result.success)
          .map(result => result.error || 'Unknown error');
        
        setSaveMessage({ 
          type: 'error', 
          text: `Failed to save: ${errors.join(', ')}`
        });
        setSavingSection('');
        return;
      }
      
      // Success
      setSavingSection('saved');
      setSaveMessage({ type: 'success', text: 'Contact information saved successfully!' });
      
      originalData.contact = cleanedContactData;
      originalData.personal = { ...originalData.personal, ...cleanedPersonalData };
      
      setEditMode(prev => ({ ...prev, contact: false }));
      setFieldErrors({});
      
      memberDataService.clearCache(salesforceContactId);
      
      // Refresh data
      try {
        const [freshContactData, freshPersonalData] = await Promise.all([
          memberDataService.getContactInfo(salesforceContactId),
          memberDataService.getPersonalInfo(salesforceContactId)
        ]);
        
        if (freshContactData.success && freshContactData.data) {
          const contactData = freshContactData.data.data || freshContactData.data;
          const cleanedContact = {
            ...contactData,
            personalEmail: formatEmail(contactData.personalEmail),
            workEmail: formatEmail(contactData.workEmail),
            email: formatEmail(contactData.email),
            homePhone: formatPhone(contactData.homePhone),
            mobilePhone: formatPhone(contactData.mobilePhone),
            workPhone: formatPhone(contactData.workPhone),
            preferredPhone: cleanString(contactData.preferredPhone)
          };
          setContactInfo(cleanedContact);
          originalData.contact = cleanedContact;
        }
        
        if (freshPersonalData.success && freshPersonalData.data) {
          const personalData = freshPersonalData.data.data || freshPersonalData.data;
          const cleanedPersonal = cleanPersonData(personalData);
          setPersonalInfo(cleanedPersonal);
          originalData.personal = cleanedPersonal;
        }
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
      
      if (refreshMemberInfo) {
        setTimeout(() => refreshMemberInfo(), 500);
      }
      
      setTimeout(() => setSavingSection(''), 2000);
      
    } catch (error) {
      console.error('Error saving contact info:', error);
      
      setContactInfo(previousContactInfo);
      setPersonalInfo(previousPersonalInfo);
      
      if (error.message && error.message.toLowerCase().includes('email') && error.message.toLowerCase().includes('valid')) {
        setFieldErrors({ personalEmail: 'Please enter a valid email address' });
        setSavingSection('');
        return;
      }
      
      setSaveMessage({ 
        type: 'error', 
        text: `Failed to save contact information: ${error.message}` 
      });
      setSavingSection('');
    } finally {
      if (savingSection !== 'saved') {
        setSavingSection('');
      }
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Addresses
  const saveAddresses = async () => {
    const previousAddresses = { ...addresses };
    
    setSavingSection('addresses');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.addresses?.requiredFields || [];
      const cleanedAddresses = cleanDataBeforeSave(addresses, 'addresses');
      
      // Validate
      const errors = {};
      
      if (requiredFields.includes('homeStreet') && !cleanedAddresses.homeStreet) {
        errors.homeStreet = 'Home street address is required';
      }
      if (requiredFields.includes('homeCity') && !cleanedAddresses.homeCity) {
        errors.homeCity = 'Home city is required';
      }
      if (requiredFields.includes('homeState') && !cleanedAddresses.homeState) {
        errors.homeState = 'Home state is required';
      }
      if (requiredFields.includes('homePostalCode') && !cleanedAddresses.homePostalCode) {
        errors.homePostalCode = 'Home postal code is required';
      }
      
      if (!cleanedAddresses.sameAsHome && memberCategory === 'CryoMember') {
        if (requiredFields.includes('mailingStreet') && !cleanedAddresses.mailingStreet) {
          errors.mailingStreet = 'Mailing street address is required';
        }
        if (requiredFields.includes('mailingCity') && !cleanedAddresses.mailingCity) {
          errors.mailingCity = 'Mailing city is required';
        }
        if (requiredFields.includes('mailingState') && !cleanedAddresses.mailingState) {
          errors.mailingState = 'Mailing state is required';
        }
        if (requiredFields.includes('mailingPostalCode') && !cleanedAddresses.mailingPostalCode) {
          errors.mailingPostalCode = 'Mailing postal code is required';
        }
      }
      
      if (Object.keys(errors).length > 0) {
        setSaveMessage({ type: 'error', text: 'Please complete all required address fields' });
        setSavingSection('');
        setAddresses(previousAddresses);
        return;
      }
      
      const dataToSend = {
        homeAddress: {
          street: cleanedAddresses.homeStreet,
          city: cleanedAddresses.homeCity,
          state: cleanedAddresses.homeState,
          postalCode: cleanedAddresses.homePostalCode,
          country: cleanedAddresses.homeCountry
        },
        mailingAddress: {
          street: cleanedAddresses.mailingStreet,
          city: cleanedAddresses.mailingCity,
          state: cleanedAddresses.mailingState,
          postalCode: cleanedAddresses.mailingPostalCode,
          country: cleanedAddresses.mailingCountry
        },
        sameAsHome: cleanedAddresses.sameAsHome
      };
      
      const result = await updateMemberAddresses(salesforceContactId, dataToSend);
      
      if (!result.success) {
        setAddresses(previousAddresses);
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save addresses' });
        setSavingSection('');
        return;
      }
      
      setSaveMessage({ type: 'success', text: 'Addresses saved successfully!' });
      setAddresses(cleanedAddresses);
      originalData.addresses = cleanedAddresses;
      setEditMode(prev => ({ ...prev, addresses: false }));
      
      memberDataService.clearCache(salesforceContactId);
      
      // Refresh data
      try {
        const freshData = await memberDataService.getAddresses(salesforceContactId);
        if (freshData.success && freshData.data) {
          const addressData = freshData.data.data || freshData.data;
          const transformedAddresses = {
            homeStreet: addressData.homeAddress?.street || '',
            homeCity: addressData.homeAddress?.city || '',
            homeState: addressData.homeAddress?.state || '',
            homePostalCode: addressData.homeAddress?.postalCode || '',
            homeCountry: addressData.homeAddress?.country || '',
            mailingStreet: addressData.mailingAddress?.street || '',
            mailingCity: addressData.mailingAddress?.city || '',
            mailingState: addressData.mailingAddress?.state || '',
            mailingPostalCode: addressData.mailingAddress?.postalCode || '',
            mailingCountry: addressData.mailingAddress?.country || '',
            sameAsHome: false
          };
          setAddresses(transformedAddresses);
          originalData.addresses = transformedAddresses;
        }
      } catch (refreshError) {
        console.error('Error refreshing address data:', refreshError);
      }
      
      if (refreshMemberInfo) {
        setTimeout(() => refreshMemberInfo(), 500);
      }
      
    } catch (error) {
      console.error('Error saving addresses:', error);
      setAddresses(previousAddresses);
      setSaveMessage({ type: 'error', text: 'Failed to save addresses' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Family Info
  const saveFamilyInfo = async () => {
    const previousFamilyInfo = { ...familyInfo };
    const previousPersonalInfo = { ...personalInfo };
    
    setSavingSection('family');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.family?.requiredFields || [];
      
      const cleanedFamilyInfo = cleanDataBeforeSave(familyInfo, 'family');
      const cleanedPersonalInfo = cleanDataBeforeSave(personalInfo, 'personal');
      
      // Validate
      const errors = {};
      
      requiredFields.forEach(field => {
        switch(field) {
          case 'fathersName':
            if (!cleanedFamilyInfo.fathersName) {
              errors.fathersName = "Father's name is required";
            }
            break;
          case 'fathersBirthplace':
            if (!cleanedFamilyInfo.fathersBirthplace || 
                (!cleanedFamilyInfo.fathersBirthplace.includes(',') && 
                 cleanedFamilyInfo.fathersBirthplace.toLowerCase() !== 'unknown' &&
                 cleanedFamilyInfo.fathersBirthplace.length < 10)) {
              errors.fathersBirthplace = "Father's complete birthplace (city, state, country) is required";
            }
            break;
          case 'mothersMaidenName':
            if (!cleanedFamilyInfo.mothersMaidenName) {
              errors.mothersMaidenName = "Mother's maiden name is required";
            }
            break;
          case 'mothersBirthplace':
            if (!cleanedFamilyInfo.mothersBirthplace || 
                (!cleanedFamilyInfo.mothersBirthplace.includes(',') && 
                 cleanedFamilyInfo.mothersBirthplace.toLowerCase() !== 'unknown' &&
                 cleanedFamilyInfo.mothersBirthplace.length < 10)) {
              errors.mothersBirthplace = "Mother's complete birthplace (city, state, country) is required";
            }
            break;
        }
      });
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        setFamilyInfo(previousFamilyInfo);
        setPersonalInfo(previousPersonalInfo);
        return;
      }
      
      const dataToSend = {
        fatherName: cleanedFamilyInfo.fathersName,
        fatherBirthplace: cleanedFamilyInfo.fathersBirthplace,
        motherMaidenName: cleanedFamilyInfo.mothersMaidenName,
        motherBirthplace: cleanedFamilyInfo.mothersBirthplace,
        spouseName: cleanedPersonalInfo.maritalStatus === 'Married' ? cleanedFamilyInfo.spousesName : null
      };
      
      const result = await updateMemberFamilyInfo(salesforceContactId, dataToSend);
      
      const contactUpdateSuccessful = result?.data?.updateResults?.contact?.success;
      const agreementUpdateSuccessful = result?.data?.updateResults?.agreement?.success;
      
      if (!contactUpdateSuccessful && !agreementUpdateSuccessful && !result?.success) {
        setFamilyInfo(previousFamilyInfo);
        setPersonalInfo(previousPersonalInfo);
        setSaveMessage({ 
          type: 'error', 
          text: result?.error || 'Failed to save family information. Please try again.' 
        });
        setSavingSection('');
        return;
      }
      
      let successMessage = 'Family information saved successfully!';
      let messageType = 'success';
      
      if (result?.partialSuccess && contactUpdateSuccessful && !agreementUpdateSuccessful) {
        successMessage = 'Family information saved successfully!';
        messageType = 'success';
      }
      
      setSaveMessage({ type: messageType, text: successMessage });
      setSavingSection('saved');
      
      setFamilyInfo(cleanedFamilyInfo);
      originalData.family = cleanedFamilyInfo;
      setEditMode(prev => ({ ...prev, family: false }));
      
      memberDataService.clearCache(salesforceContactId);
      
      // Refresh data
      try {
        const freshData = await memberDataService.getFamilyInfo(salesforceContactId);
        if (freshData.success && freshData.data) {
          const familyData = freshData.data.data || freshData.data;
          if (familyData.fatherName !== undefined || 
              familyData.fatherBirthplace !== undefined || 
              familyData.motherMaidenName !== undefined || 
              familyData.motherBirthplace !== undefined) {
            
            const cleanedFamily = {
              fathersName: formatPersonName(familyData.fatherName || cleanedFamilyInfo.fathersName),
              fathersBirthplace: formatCity(familyData.fatherBirthplace || cleanedFamilyInfo.fathersBirthplace),
              mothersMaidenName: formatPersonName(familyData.motherMaidenName || cleanedFamilyInfo.mothersMaidenName),
              mothersBirthplace: formatCity(familyData.motherBirthplace || cleanedFamilyInfo.mothersBirthplace),
              spousesName: formatPersonName(familyData.spouseName || cleanedFamilyInfo.spousesName)
            };
            setFamilyInfo(cleanedFamily);
            originalData.family = cleanedFamily;
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing family data:', refreshError);
      }
      
      if (refreshMemberInfo) {
        setTimeout(() => refreshMemberInfo(), 500);
      }
      
    } catch (error) {
      console.error('Error in saveFamilyInfo:', error);
      setFamilyInfo(previousFamilyInfo);
      setPersonalInfo(previousPersonalInfo);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save family information: ' + error.message 
      });
    } finally {
      if (savingSection === 'saved') {
        setTimeout(() => setSavingSection(''), 2000);
      } else {
        setSavingSection('');
      }
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Occupation
  const saveOccupation = async () => {
    setSavingSection('occupation');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const cleanedOccupation = cleanDataBeforeSave(occupation, 'occupation');
      
      if (cleanedOccupation.occupation && 
          cleanedOccupation.occupation.toLowerCase().trim() === 'retired') {
        setSaveMessage({ 
          type: 'error', 
          text: 'Please specify your occupation before retirement (e.g., "Retired Software Engineer")' 
        });
        setSavingSection('');
        return;
      }
      
      const dataToSend = {
        occupation: cleanedOccupation.occupation,
        industry: cleanedOccupation.occupationalIndustry,
        militaryService: cleanedOccupation.hasMilitaryService ? {
          branch: cleanedOccupation.militaryBranch,
          startYear: cleanedOccupation.servedFrom,
          endYear: cleanedOccupation.servedTo
        } : null
      };
      
      const result = await updateMemberOccupation(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Occupation saved successfully!' });
        setOccupation(cleanedOccupation);
        originalData.occupation = cleanedOccupation;
        setEditMode(prev => ({ ...prev, occupation: false }));
        memberDataService.clearCache(salesforceContactId);
        
        if (refreshMemberInfo) {
          setTimeout(() => refreshMemberInfo(), 500);
        }
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save occupation' });
      }
    } catch (error) {
      console.error('Error saving occupation:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save occupation' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Medical Info
  const saveMedicalInfo = async () => {
    setSavingSection('medical');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const cleanedData = cleanDataBeforeSave(medicalInfo, 'medical');
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.medical?.requiredFields || [];
      
      const errors = {};
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        return;
      }
      
      const result = await updateMemberMedicalInfo(salesforceContactId, cleanedData);
      
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Medical information saved successfully!' });
        setMedicalInfo(cleanedData);
        originalData.medical = cleanedData;
        setEditMode(prev => ({ ...prev, medical: false }));
        memberDataService.clearCache(salesforceContactId);
        
        if (refreshMemberInfo) {
          setTimeout(() => refreshMemberInfo(), 500);
        }
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save medical information' });
      }
    } catch (error) {
      console.error('Error saving medical info:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save medical information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Cryo Arrangements
  const saveCryoArrangements = async () => {
    setSavingSection('cryoArrangements');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const cleanedCryoArrangements = cleanDataBeforeSave(cryoArrangements, 'cryoArrangements');
      
      const dataToSend = {};
      
      if (cleanedCryoArrangements.remainsHandling) {
        dataToSend.nonCryoRemainArrangements = cleanedCryoArrangements.remainsHandling;
      }
      
      if (cleanedCryoArrangements.cryopreservationDisclosure) {
        dataToSend.cryopreservationDisclosure = cleanedCryoArrangements.cryopreservationDisclosure;
      }
      
      if (cleanedCryoArrangements.memberPublicDisclosure) {
        dataToSend.memberPublicDisclosure = cleanedCryoArrangements.memberPublicDisclosure;
      }
      
      if (cleanedCryoArrangements.recipientName !== undefined) {
        dataToSend.recipientName = cleanedCryoArrangements.recipientName;
      }
      if (cleanedCryoArrangements.recipientPhone !== undefined) {
        dataToSend.recipientPhone = cleanedCryoArrangements.recipientPhone;
      }
      if (cleanedCryoArrangements.recipientEmail !== undefined) {
        dataToSend.recipientEmail = cleanedCryoArrangements.recipientEmail;
      }
      
      if (cleanedCryoArrangements.recipientMailingStreet !== undefined) {
        dataToSend.recipientMailingStreet = cleanedCryoArrangements.recipientMailingStreet;
      }
      if (cleanedCryoArrangements.recipientMailingCity !== undefined) {
        dataToSend.recipientMailingCity = cleanedCryoArrangements.recipientMailingCity;
      }
      if (cleanedCryoArrangements.recipientMailingState !== undefined) {
        dataToSend.recipientMailingState = cleanedCryoArrangements.recipientMailingState;
      }
      if (cleanedCryoArrangements.recipientMailingPostalCode !== undefined) {
        dataToSend.recipientMailingPostalCode = cleanedCryoArrangements.recipientMailingPostalCode;
      }
      if (cleanedCryoArrangements.recipientMailingCountry !== undefined) {
        dataToSend.recipientMailingCountry = cleanedCryoArrangements.recipientMailingCountry;
      }
      
      const result = await updateMemberCryoArrangements(salesforceContactId, dataToSend);
      
      if (result.success) {
        setSaveMessage({ 
          type: 'success', 
          text: 'Cryopreservation arrangements saved successfully!' 
        });
        setCryoArrangements(cleanedCryoArrangements);
        originalData.cryoArrangements = cleanedCryoArrangements;
        setEditMode(prev => ({ ...prev, cryoArrangements: false }));
        memberDataService.clearCache(salesforceContactId);
        
        if (refreshMemberInfo) {
          setTimeout(() => refreshMemberInfo(), 500);
        }
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: result.error || 'Failed to save cryopreservation arrangements' 
        });
      }
    } catch (error) {
      console.error('Error saving cryo arrangements:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save cryopreservation arrangements. Please try again or contact support.' 
      });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Funding
  const saveFunding = async () => {
    setSavingSection('funding');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const requiredFields = memberCategoryConfig[memberCategory]?.sections.funding?.requiredFields || [];
      const cleanedFunding = cleanDataBeforeSave(funding, 'funding');
      
      const errors = {};
      
      requiredFields.forEach(field => {
        switch(field) {
          case 'fundingType':
            if (!cleanedFunding.fundingType) {
              errors.fundingType = 'Funding type is required';
            }
            break;
          case 'companyName':
            if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.companyName) {
              errors.companyName = 'Insurance company name is required';
            }
            break;
          case 'policyNumber':
            if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.policyNumber) {
              errors.policyNumber = 'Policy number is required';
            }
            break;
          case 'policyType':
            if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.policyType) {
              errors.policyType = 'Policy type is required';
            }
            break;
          case 'faceAmount':
            if (cleanedFunding.fundingType === 'Life Insurance' && !cleanedFunding.faceAmount) {
              errors.faceAmount = 'Face amount is required';
            }
            break;
        }
      });
      
      if (Object.keys(errors).length > 0) {
        let errorMessage = Object.values(errors).join('. ');
        setSaveMessage({ type: 'error', text: errorMessage });
        setSavingSection('');
        return;
      }
      
      const result = await updateMemberFundingInfo(salesforceContactId, cleanedFunding);
      
      if (result.success || result.partialSuccess) {
        if (result.partialSuccess) {
          setSaveMessage({ 
            type: 'warning', 
            text: 'Some funding information was saved, but there were errors: ' + (result.errors || []).join(', ')
          });
        } else {
          setSaveMessage({ type: 'success', text: 'Funding information saved successfully!' });
        }
        
        const updatedFunding = {
          ...cleanedFunding,
          fundsRecordId: result.data?.fundsRecordId || funding.fundsRecordId,
          insuranceRecordId: result.data?.insuranceRecordId || funding.insuranceRecordId
        };
        
        setFunding(updatedFunding);
        originalData.funding = updatedFunding;
        setEditMode(prev => ({ ...prev, funding: false }));
        memberDataService.clearCache(salesforceContactId);
        
        if (refreshMemberInfo) {
          setTimeout(() => refreshMemberInfo(), 500);
        }
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: result.error || 'Failed to save funding information' 
        });
      }
    } catch (error) {
      console.error('Error saving funding:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save funding information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Legal
  const saveLegal = async () => {
    setSavingSection('legal');
    setSaveMessage({ type: '', text: '' });
    
    try {
      const cleanedLegal = cleanDataBeforeSave(legal, 'legal');
      
      const dataToSend = {
        hasWill: cleanedLegal.hasWill || null,
        willContraryToCryonics: cleanedLegal.willContraryToCryonics || null
      };
      
      const result = await updateMemberLegalInfo(salesforceContactId, dataToSend);
      if (result.success) {
        setSaveMessage({ type: 'success', text: 'Legal information saved successfully!' });
        setLegal(cleanedLegal);
        originalData.legal = cleanedLegal;
        setEditMode(prev => ({ ...prev, legal: false }));
        memberDataService.clearCache(salesforceContactId);
        
        if (refreshMemberInfo) {
          setTimeout(() => refreshMemberInfo(), 500);
        }
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save legal information' });
      }
    } catch (error) {
      console.error('Error saving legal info:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save legal information' });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  // Save Next of Kin
  const saveNextOfKin = async () => {
    const callId = Date.now();
    
    setSavingSection('nextOfKin');
    setSaveMessage({ type: '', text: '' });
    setFieldErrors({});
    
    try {
      if (!memberCategory) {
        setSaveMessage({ type: 'error', text: 'Unable to determine member category. Please refresh the page.' });
        setSavingSection('');
        return;
      }
      
      const requiredFields = memberCategoryConfig[memberCategory]?.sections?.nextOfKin?.requiredFields || [];
      
      const errors = [];
      const fieldErrorsToSet = {};
      
      nextOfKinList.forEach((nok, index) => {
        const nokErrors = [];
        
        requiredFields.forEach(field => {
          switch(field) {
            case 'firstName':
              if (!nok.firstName || nok.firstName.trim() === '') {
                nokErrors.push('First name is required');
                fieldErrorsToSet[`nok_${index}_firstName`] = 'First name is required';
              }
              break;
            case 'lastName':
              if (!nok.lastName || nok.lastName.trim() === '') {
                nokErrors.push('Last name is required');
                fieldErrorsToSet[`nok_${index}_lastName`] = 'Last name is required';
              }
              break;
            case 'relationship':
              if (!nok.relationship || nok.relationship.trim() === '') {
                nokErrors.push('Relationship is required');
                fieldErrorsToSet[`nok_${index}_relationship`] = 'Relationship is required';
              }
              break;
            case 'mobilePhone':
              if (!nok.mobilePhone && !nok.homePhone) {
                nokErrors.push('At least one phone number is required');
                fieldErrorsToSet[`nok_${index}_mobilePhone`] = 'At least one phone number is required';
              }
              break;
            case 'email':
              if (!nok.email || nok.email.trim() === '') {
                nokErrors.push('Email is required');
                fieldErrorsToSet[`nok_${index}_email`] = 'Email is required';
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nok.email)) {
                nokErrors.push('Please enter a valid email address');
                fieldErrorsToSet[`nok_${index}_email`] = 'Please enter a valid email address';
              }
              break;
          }
        });
        
        if (nokErrors.length > 0) {
          errors.push(`Next of Kin ${index + 1}: ${nokErrors.join(', ')}`);
        }
      });
      
      if (errors.length > 0) {
        setFieldErrors(fieldErrorsToSet);
        setSaveMessage({ 
          type: 'error', 
          text: 'Please fill in all required fields' 
        });
        setSavingSection('');
        return;
      }
      
      // Find NOKs to delete
      const currentNokIds = nextOfKinList
        .filter(nok => nok.id && !nok.id.startsWith('temp-'))
        .map(nok => nok.id);
      
      const originalNokIds = (originalData.nextOfKin || [])
        .filter(nok => nok.id && !nok.id.startsWith('temp-'))
        .map(nok => nok.id);
      
      const noksToDelete = originalNokIds.filter(id => !currentNokIds.includes(id));
      
      if (nextOfKinList.length === 0 && noksToDelete.length === 0) {
        setEditMode(prev => ({ ...prev, nextOfKin: false }));
        setSavingSection('');
        setFieldErrors({});
        return;
      }
      
      const promises = [];
      
      // Delete operations
      noksToDelete.forEach(nokId => {
        promises.push(
          deleteMemberEmergencyContact(salesforceContactId, nokId)
            .then(result => result)
            .catch(error => ({ success: false, error: error.message }))
        );
      });
      
      // Create/Update operations
      nextOfKinList.forEach((nok) => {
        const fullName = `${nok.firstName || ''} ${nok.lastName || ''}`.trim();
        const phone = nok.mobilePhone || nok.homePhone || '';
        
        const nokData = {
          firstName: nok.firstName,
          middleName: nok.middleName || '',
          lastName: nok.lastName,
          fullName: fullName,
          relationship: formatRelationship(nok.relationship || ''),
          dateOfBirth: nok.dateOfBirth || null,
          homePhone: formatPhone(nok.homePhone || ''),
          mobilePhone: formatPhone(nok.mobilePhone || ''),
          phone: formatPhone(phone) || '',
          email: nok.email || '',
          address: {
            street1: nok.address?.street1 || '',
            street2: nok.address?.street2 || '',
            city: nok.address?.city || '',
            state: nok.address?.state || '',
            postalCode: nok.address?.postalCode || '',
            country: nok.address?.country || ''
          },
          willingToSignAffidavit: nok.willingToSignAffidavit || '',
          comments: cleanComments(nok.longComments || nok.comments || '')
        };
        
        if (nok.id && !nok.id.startsWith('temp-')) {
          promises.push(updateMemberEmergencyContact(salesforceContactId, nok.id, nokData));
        } else {
          promises.push(createMemberEmergencyContact(salesforceContactId, nokData));
        }
      });
      
      const results = await Promise.all(promises);
      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        setSaveMessage({ type: 'success', text: 'Next of kin saved successfully!' });
        setEditMode(prev => ({ ...prev, nextOfKin: false }));
        setFieldErrors({});
        
        memberDataService.clearCache(salesforceContactId);
        
        originalData.nextOfKin = [...nextOfKinList];
        
        // Refresh data after delay
        setTimeout(async () => {
          try {
            const freshData = await memberDataService.getEmergencyContacts(salesforceContactId);
            
            if (freshData.success && freshData.data) {
              const nextOfKinArray = freshData.data?.data?.nextOfKin || 
                                     freshData.data?.nextOfKin || 
                                     freshData.data || 
                                     [];
              
              if (Array.isArray(nextOfKinArray) && nextOfKinArray.length >= 0) {
                const transformedList = nextOfKinArray.map(nok => ({
                  id: nok.id,
                  firstName: formatPersonName(nok.firstName || ''),
                  middleName: formatPersonName(nok.middleName || ''),
                  lastName: formatPersonName(nok.lastName || ''),
                  fullName: `${formatPersonName(nok.firstName || '')} ${formatPersonName(nok.lastName || '')}`.trim(),
                  relationship: cleanString(nok.relationship || ''),
                  dateOfBirth: nok.dateOfBirth || '',
                  homePhone: formatPhone(nok.homePhone || ''),
                  mobilePhone: formatPhone(nok.mobilePhone || ''),
                  phone: nok.mobilePhone || nok.homePhone || '',
                  email: formatEmail(nok.email || ''),
                  address: {
                    street1: formatStreetAddress(nok.address?.street1 || ''),
                    street2: formatStreetAddress(nok.address?.street2 || ''),
                    city: formatCity(nok.address?.city || ''),
                    state: formatStateProvince(nok.address?.state || ''),
                    postalCode: formatPostalCode(nok.address?.postalCode || ''),
                    country: formatCountry(nok.address?.country || '')
                  },
                  willingToSignAffidavit: cleanString(nok.willingToSignAffidavit || ''),
                  comments: cleanComments(nok.longComments || nok.comments || '')
                }));
                
                setNextOfKinList(transformedList);
                originalData.nextOfKin = transformedList;
              }
            }
          } catch (error) {
            console.log('Error fetching fresh data (non-critical):', error.message);
          }
        }, 1000);
        
        if (refreshMemberInfo) {
          setTimeout(() => refreshMemberInfo(), 2000);
        }
      } else {
        const errorMessages = results
          .map((r, i) => {
            if (!r.success) {
              if (i < noksToDelete.length) {
                return `Failed to delete Next of Kin: ${r.error || 'Unknown error'}`;
              } else {
                const nokIndex = i - noksToDelete.length;
                const nok = nextOfKinList[nokIndex];
                return `${nok.firstName} ${nok.lastName}: ${r.error || 'Unknown error'}`;
              }
            }
            return null;
          })
          .filter(Boolean);
        
        setSaveMessage({ 
          type: 'error', 
          text: 'Failed to save some next of kin: ' + errorMessages.join(', ') 
        });
        setSavingSection('');
      }
      
    } catch (error) {
      console.error('Exception in saveNextOfKin:', error);
      setSaveMessage({ 
        type: 'error', 
        text: 'Failed to save next of kin: ' + error.message 
      });
    } finally {
      setSavingSection('');
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000);
    }
  };

  return {
    savingSection,
    savePersonalInfo,
    saveContactInfo,
    saveAddresses,
    saveFamilyInfo,
    saveOccupation,
    saveMedicalInfo,
    saveCryoArrangements,
    saveFunding,
    saveLegal,
    saveNextOfKin
  };
};